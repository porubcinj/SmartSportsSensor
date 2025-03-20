#include <Arduino_BMI270_BMM150.h>
#include <ArduinoBLE.h>

#include "Ble.h"
#include "Model.h"
#include "SensorData.h"
#include "Stopwatch.h"

State state = State::Unpaired;
Stopwatch<unsigned long> stopwatchMillis(millis);
SensorDataBuffer sensorData = {0};
InferenceCharacteristic inference = {Stroke::Other, Spin::Other};
BLEDevice central = BLEDevice();
BLEService service(SERVICE_UUID);
BLETypedCharacteristic<SensorDataCharacteristic> sensorDataCharacteristic(SENSOR_DATA_CHARACTERISTIC_UUID, BLERead | BLENotify | BLEEncryption);
BLETypedCharacteristic<InferenceCharacteristic> inferenceCharacteristic(INFERENCE_CHARACTERISTIC_UUID, BLERead | BLENotify | BLEEncryption);

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
    if (sensorData.i >= sizeof(sensorData.characteristic.data) / sizeof(sensorData.characteristic.data[0])) {
      if (!sensorDataCharacteristic.writeValue(sensorData.characteristic)) {
        Serial.println("Failed to write value to sensor data characteristic");
      }
      sensorData.i = 0;
    }

    /* TODO: Pass data to model and update prediction. Below is just an example */
    if (micros() % 2000000 < 20000) {
      inference.stroke = static_cast<Stroke>(random(static_cast<unsigned int>(Stroke::Count)));
      inference.spin = static_cast<Spin>(random(static_cast<unsigned int>(Spin::Count)));
      if (!inferenceCharacteristic.writeValue(inference)) {
        Serial.println("Failed to write value to inference characteristic");
      }
    }
  }
}