#include <Arduino_BMI270_BMM150.h>
#include <ArduinoBLE.h>
#include <MicroTFLite.h>

#include "Ble.h"
#include "Model.h"
#include "SensorData.h"
#include "Stopwatch.h"
#include "ModelData.h"

/* BLE and State Globals */
State state = State::Unpaired;
Stopwatch<unsigned long> stopwatchMillis(millis);
SensorDataBuffer sensorData = {0};
InferenceCharacteristic inference = {Stroke::Count, Side::Count, Spin::Count};
BLEDevice central = BLEDevice();
BLEService service(SERVICE_UUID);
BLETypedCharacteristic<SensorDataCharacteristic> sensorDataCharacteristic(SENSOR_DATA_CHARACTERISTIC_UUID, BLERead | BLENotify | BLEEncryption);
BLETypedCharacteristic<InferenceCharacteristic> inferenceCharacteristic(INFERENCE_CHARACTERISTIC_UUID, BLERead | BLENotify | BLEEncryption);

/* Inference Globals */
constexpr int tensorArenaSize = 26 * 1024;
alignas(16) byte tensorArena[tensorArenaSize];
int samplesRead = 0;

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
  BLE.debug(Serial);

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

      /* Copy data to model for inference
       * TODO: normalize inputs */
      for (int i = 0; i < NUM_SENSOR_DATA_ENTRIES; ++i) {
        const SensorData& d = sensorData.characteristic.data[i];
        const int sampleOffset = samplesRead * NUM_FEATURES;
        ModelSetInput(d.acceleration.x, sampleOffset);
        ModelSetInput(d.acceleration.y, sampleOffset + 1);
        ModelSetInput(d.acceleration.z, sampleOffset + 2);
        ModelSetInput(d.gyroscope.x, sampleOffset + 3);
        ModelSetInput(d.gyroscope.y, sampleOffset + 4);
        ModelSetInput(d.gyroscope.z, sampleOffset + 5);
        ++samplesRead;
      }

      /* Run inference if input tensor is full */
      if (samplesRead >= NUM_SAMPLES) {
        samplesRead = 0;
        if(!ModelRunInference()){
          Serial.println("Failed to run model inference");
          return;
        }

        /* Get stroke */
        float maxOutput = 0;
        unsigned int maxIndex = 0, startIndex, endIndex = static_cast<int>(Stroke::Count);
        for (startIndex = 0; startIndex < endIndex; ++startIndex) {
          const float output = ModelGetOutput(startIndex);
          Serial.println(output);
          if (output > maxOutput) {
            maxOutput = output;
            maxIndex = startIndex;
          }
        }
        inference.stroke = static_cast<Stroke>(maxIndex);

        /* Get side */
        maxOutput = 0;
        unsigned int prevEndIndex = endIndex;
        endIndex += static_cast<int>(Side::Count);
        maxIndex = 0;
        for (; startIndex < endIndex; ++startIndex) {
          const float output = ModelGetOutput(startIndex);
          Serial.println(output);
          if (output > maxOutput) {
            maxOutput = output;
            maxIndex = startIndex;
          }
        }
        inference.side = static_cast<Side>(maxIndex - prevEndIndex);

        /* Get spin */
        maxOutput = 0;
        prevEndIndex = endIndex;
        endIndex += static_cast<int>(Spin::Count);
        for (; startIndex < endIndex; ++startIndex) {
          const float output = ModelGetOutput(startIndex);
          Serial.println(output);
          if (output > maxOutput) {
            maxOutput = output;
            maxIndex = startIndex;
          }
        }
        inference.spin = static_cast<Spin>(maxIndex - prevEndIndex);

        if (!inferenceCharacteristic.writeValue(inference)) {
          Serial.println("Failed to write value to inference characteristic");
        }
      }
    }
  }
}