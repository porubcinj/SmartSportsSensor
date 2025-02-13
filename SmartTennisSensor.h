#ifndef _SMART_TENNIS_SENSOR_H_
#define _SMART_TENNIS_SENSOR_H_

#include "SensorData.h"

#define DEVICE_NAME "Smart Tennis Sensor"
// TODO: #define PAIR_BUTTON once we get the necessary hardware
#define PAIR_INTERVAL_MS 30000
#define PAIR_LED LEDB
#define PAIR_LED_OFF (PAIR_LED_ON == LOW ? HIGH : LOW)
#define PAIR_LED_ON LOW
#define SERVICE_UUID "00000000-0000-0000-0000-000000000000"
#define CHARACTERISTIC_UUID "00000000-0000-0000-0000-000000000000"

enum State {
  UNPAIRED,
  PAIRING,
  PAIRED,
  NUM_STATES,
};

void unpairedState();
void pairingState();
void pairedState();

void (*const stateFunctions[NUM_STATES])() = {
  unpairedState,
  pairingState,
  pairedState,
};

#endif