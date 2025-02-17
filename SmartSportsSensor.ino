#include <Arduino_BMI270_BMM150.h>
#include <ArduinoBLE.h>

#include "BLE.h"
#include "SensorData.h"
#include "Stopwatch.h"

State state = UNPAIRED;
Stopwatch<unsigned long> stopwatchMillis(millis);
SensorDataBuffer sensorDataBuffer = {0};
BLEDevice central = BLEDevice();
BLEService service(SERVICE_UUID);
BLETypedCharacteristic<SensorDataCharacteristic> characteristic(CHARACTERISTIC_UUID, BLERead | BLENotify | BLEEncryption);

void setup() {
  /* Initialize Universal Asynchronous Receiver-Transmitter (UART) */
  Serial.begin(9600);
  while (!Serial);
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
  service.addCharacteristic(characteristic);
  BLE.addService(service);
  characteristic.writeValue(sensorDataBuffer.characteristic);

  /* Prevent pairing until PAIR_BUTTON is pressed */
  BLE.setPairable(false);
  while (!BLE.advertise()) {
    Serial.println("Failed to advertise Bluetooth");
  }
}

void loop() {
  if (state < NUM_STATES) {
    stateFunctions[state]();
  }
}

void unpairedState() {
  #ifdef PAIR_BUTTON // TODO: Remove directives once we get the necessary hardware
  if (digitalRead(PAIR_BUTTON) == LOW) {
  #endif
    stopwatchMillis.restart();
    BLE.setPairable(Pairable::ONCE);
    Serial.println("Pairing enabled");

    state = PAIRING;
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

    state = PAIRED;
    return;
  }

  const auto elapsed = stopwatchMillis.elapsed();
  if (elapsed > PAIR_INTERVAL_MS) {
    BLE.setPairable(Pairable::NO);
    Serial.println("Pairing disabled");
    digitalWrite(PAIR_LED, PAIR_LED_OFF);

    state = UNPAIRED;
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

    state = UNPAIRED;
    return;
  }

  /* Store sensor data if available and if we read the data without error */
  SensorData sensorData;
  if (
    IMU.accelerationAvailable() &&
    IMU.gyroscopeAvailable() &&
    IMU.readAcceleration(
      sensorData.acceleration.x,
      sensorData.acceleration.y,
      sensorData.acceleration.z
    ) &&
    IMU.readGyroscope(
      sensorData.gyroscope.x,
      sensorData.gyroscope.y,
      sensorData.gyroscope.z
    )
  ) {
    sensorData.milliseconds = millis();

    /* Copy sensor data to buffer */
    sensorDataBuffer.characteristic.data[sensorDataBuffer.i++] = sensorData;

    /* Write buffer to characteristic if buffer is full */
    if (sensorDataBuffer.i >= sizeof(sensorDataBuffer.characteristic.data) / sizeof(sensorDataBuffer.characteristic.data[0])) {
      if (!characteristic.writeValue(sensorDataBuffer.characteristic)) {
        Serial.println("Failed to write value to characteristic");
      }
      sensorDataBuffer.i = 0;
    }
  }
}