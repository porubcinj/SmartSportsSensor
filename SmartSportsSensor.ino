#include <Arduino_BMI270_BMM150.h>
#include <ArduinoBLE.h>
#include <MicroTFLite.h>

#include "Ble.h"
#include "Model.h"
#include "ModelData.h"
#include "Scaler.h"
#include "SensorData.h"
#include "Stopwatch.h"
#include "Quantization.h"

/* BLE and State Globals */
State state = State::Unpaired;
Stopwatch<unsigned long> stopwatchMillis(millis);
SensorDataBuffer sensorData = {0};
InferenceCharacteristic inference = {0, Classification::Count};
BLEDevice central = BLEDevice();
BLEService service(SERVICE_UUID);
BLETypedCharacteristic<SensorDataCharacteristic> sensorDataCharacteristic(SENSOR_DATA_CHARACTERISTIC_UUID, BLERead | BLENotify | BLEEncryption);
BLETypedCharacteristic<InferenceCharacteristic> inferenceCharacteristic(INFERENCE_CHARACTERISTIC_UUID, BLERead | BLENotify | BLEEncryption);

/* Inference Globals */
constexpr int tensorArenaSize = 26 * 1024;
alignas(32) byte tensorArena[tensorArenaSize];
bool shotDetected = false;
int numEntriesAfterPeak = 0;

InferenceDataBuffer inferenceDataBuffer = {0};

void setup() {
  /* Initialize Universal Asynchronous Receiver-Transmitter (UART) */
  Serial.begin(9600);
  //while (!Serial);
  Serial.println("Serial connected");

  /* Set pin modes */
  pinMode(PAIR_LED, OUTPUT);
  #ifdef PAIR_BUTTON // TODO: Remove directives once we get the necessary hardware
  pinMode(PAIR_BUTTON, INPUT_PULLUP);
  #endif

  /* Initialize Inertial Measurement Unit (IMU) */
  while (!IMU.begin(BOSCH_ACCELEROMETER_ONLY)) {
    Serial.println("Failed to initialize Inertial Measurement Unit");
  }
  IMU.debug(Serial);

  /* Initialize Bluetooth Low Energy (BLE) */
  while (!BLE.begin()) {
    Serial.println("Failed to initialize Bluetooth Low Energy");
  }
  //BLE.debug(Serial);

  /* Set BLE information */
  BLE.setDeviceName(DEVICE_NAME);
  BLE.setLocalName(LOCAL_NAME);
  service.addCharacteristic(sensorDataCharacteristic);
  service.addCharacteristic(inferenceCharacteristic);
  BLE.addService(service);
  sensorDataCharacteristic.writeValue(sensorData.characteristic);
  inferenceCharacteristic.writeValue(inference);

  /* Prevent pairing until PAIR_BUTTON is pressed */
  BLE.setPairable(false);
  while (!BLE.advertise()) {
    Serial.println("Failed to advertise Bluetooth");
  }

  /* Initialize the model */
  while (!ModelInit(model, tensorArena, tensorArenaSize)) {
    Serial.println("Model initialization failed!");
  }
  Serial.println("Model initialization done");
  ModelPrintMetadata();
  ModelPrintTensorInfo();
}

void loop() {
  const unsigned int nextState = static_cast<unsigned int>(state);
  stateFunctions[nextState]();
}

void unpairedState() {
  #ifdef PAIR_BUTTON // TODO: Remove directives once we get the necessary hardware
  if (digitalRead(PAIR_BUTTON) == LOW) {
  #endif
    stopwatchMillis.restart();
    BLE.setPairable(Pairable::ONCE);
    Serial.println("Pairing enabled");

    state = State::Pairing;
  #ifdef PAIR_BUTTON
  }
  #endif
}

void pairingState() {
  /* Poll BLE connection */
  central = BLE.central();
  if (central.connected()) {
    Serial.print("Paired with central: ");
    Serial.println(central.address());
    digitalWrite(PAIR_LED, PAIR_LED_ON);

    state = State::Paired;
    return;
  }

  const auto elapsed = stopwatchMillis.elapsed();
  if (elapsed > PAIR_INTERVAL_MS) {
    BLE.setPairable(Pairable::NO);
    Serial.println("Pairing disabled");
    digitalWrite(PAIR_LED, PAIR_LED_OFF);

    state = State::Unpaired;
    return;
  }

  /* Blink PAIR_LED while pairing enabled */
  digitalWrite(PAIR_LED, elapsed % 1500 < 500 ? PAIR_LED_ON : PAIR_LED_OFF);
}

void pairedState() {
  /* Verify BLE connection */
  if (!central.connected()) {
    Serial.println("Disconnected from central");
    BLE.setPairable(Pairable::NO);
    Serial.println("Pairing disabled");
    digitalWrite(PAIR_LED, PAIR_LED_OFF);

    state = State::Unpaired;
    return;
  }

  /* Store sensor data if available and if we read the data without error */
  SensorData newSensorData;
  if (
    IMU.accelerationAvailable() &&
    IMU.gyroscopeAvailable() &&
    IMU.readAcceleration(
      newSensorData.acceleration.x,
      newSensorData.acceleration.y,
      newSensorData.acceleration.z
    ) &&
    IMU.readGyroscope(
      newSensorData.gyroscope.x,
      newSensorData.gyroscope.y,
      newSensorData.gyroscope.z
    )
  ) {
    newSensorData.milliseconds = millis();

    /* Copy new sensor data to buffer */
    sensorData.characteristic.data[sensorData.i++] = newSensorData;

    /* Write buffer to characteristic if buffer is full */
    if (sensorData.i >= NUM_SENSOR_DATA_ENTRIES) {
      sensorData.i = 0;
      if (!sensorDataCharacteristic.writeValue(sensorData.characteristic)) {
        Serial.println("Failed to write value to sensor data characteristic");
      }

      /* Z-score normalize characteristic data */
      for (int i = 0; i < NUM_SENSOR_DATA_ENTRIES; ++i) {
        const SensorData& d = sensorData.characteristic.data[i];
        inferenceDataBuffer.normalizedSensorData[inferenceDataBuffer.i][0][i] = (d.acceleration.x - mean_[0]) / scale_[0];
        inferenceDataBuffer.normalizedSensorData[inferenceDataBuffer.i][1][i] = (d.acceleration.y - mean_[1]) / scale_[1];
        inferenceDataBuffer.normalizedSensorData[inferenceDataBuffer.i][2][i] = (d.acceleration.z - mean_[2]) / scale_[2];
        inferenceDataBuffer.normalizedSensorData[inferenceDataBuffer.i][3][i] = (d.gyroscope.x - mean_[3]) / scale_[3];
        inferenceDataBuffer.normalizedSensorData[inferenceDataBuffer.i][4][i] = (d.gyroscope.y - mean_[4]) / scale_[4];
        inferenceDataBuffer.normalizedSensorData[inferenceDataBuffer.i][5][i] = (d.gyroscope.z - mean_[5]) / scale_[5];
      }
      ++inferenceDataBuffer.i;

      if (inferenceDataBuffer.i >= NUM_INFERENCE_ENTRIES) {
        inferenceDataBuffer.i = 0;
      }

      /* Check for spike */
      if (shotDetected) {
        ++numEntriesAfterPeak;
      } else {
        for (int i = 0; i < NUM_SENSOR_DATA_ENTRIES; ++i) {
          const SensorData& d = sensorData.characteristic.data[i];
          const float accelerationSquared = sq(d.acceleration.x) + sq(d.acceleration.y) + sq(d.acceleration.z);
          if (accelerationSquared >= SQUARED_ACCELERATION_THRESHOLD) {
            shotDetected = true;
            inference.milliseconds = d.milliseconds;
            break;
          }
        }
      }

      /* Copy data to model for inference */
      if (numEntriesAfterPeak >= NUM_ENTRIES_AFTER_PEAK) {
        numEntriesAfterPeak = 0;
        shotDetected = false;

        /* Copy each inference entry (number of sensor data characteristics per inference) */
        int samplesRead = 0;
        for (int i = 0; i < NUM_INFERENCE_ENTRIES; ++i) {
          const int j = (i + inferenceDataBuffer.i) % NUM_INFERENCE_ENTRIES;
          const auto& d = inferenceDataBuffer.normalizedSensorData[j];

          /* For each sensor data entry, copy each sensor data sample (number of entries per characteristic) */
          for (int k = 0; k < NUM_SENSOR_DATA_ENTRIES; ++k) {
            const int sampleOffset = samplesRead * NUM_FEATURES;

            /* For each sample, copy each feature */
            for (int l = 0; l < NUM_FEATURES; ++l) {
              ModelSetInput(d[l][k], sampleOffset + l, true);
            }
            ++samplesRead;
          }
        }

        /* Run inference */
        if(!ModelRunInference()){
          Serial.println("Failed to run model inference");
          return;
        }

        /* Get shot classification */
        float maxOutput = 0;
        int maxIndex = 0;
        for (int i = 0; i < static_cast<int>(Classification::Count); ++i) {
          const float output = ModelGetOutput(i, true);
          Serial.println(output);
          if (output > maxOutput) {
            maxOutput = output;
            maxIndex = i;
          }
        }
        inference.classification = static_cast<Classification>(maxIndex);
        Serial.println(static_cast<int>(inference.classification));

        if (!inferenceCharacteristic.writeValue(inference)) {
          Serial.println("Failed to write value to inference characteristic");
        }
      }
    }
  }
}
