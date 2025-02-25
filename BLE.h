#ifndef _BLE_H_
#define _BLE_H_

#include "SensorData.h"

#define DEVICE_NAME "Arduino"
#define LOCAL_NAME "Smart Sports Sensor"
// TODO: #define PAIR_BUTTON once we get the necessary hardware
#define PAIR_INTERVAL_MS 30000
#define PAIR_LED LEDB
#define PAIR_LED_OFF (PAIR_LED_ON == LOW ? HIGH : LOW)
#define PAIR_LED_ON LOW
#define SERVICE_UUID "00000000-0000-0000-0000-000000000000"
#define SENSOR_DATA_CHARACTERISTIC_UUID "00000000-0000-0000-0000-000000000000"
#define INFERENCE_CHARACTERISTIC_UUID "00000000-0000-0000-0000-000000000001"

enum class State : unsigned int {
  Unpaired,
  Pairing,
  Paired,
  Count,
};

void unpairedState();
void pairingState();
void pairedState();

void (*const stateFunctions[static_cast<unsigned int>(State::Count)])() = {
  unpairedState,
  pairingState,
  pairedState,
};

#endif