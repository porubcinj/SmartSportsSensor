#ifndef _SENSOR_DATA_H_
#define _SENSOR_DATA_H_

#include <cstddef>
#include "Vector3D.h"

/* TODO: 244 bytes are transmittable out of the 512 for a BLE characteristic.
 * The number 244 was determined experimentally.
 * 244 / sizeof(SensorData) = 244 / 28 = 8, so we can only send 224 bytes of aligned entries per notification.
 * Ideally, we would be able to determine the number of entries programmatically. */
#define NUM_SENSOR_DATA_ENTRIES 8

/* 4 + 12 + 12 = 28 bytes */
struct SensorData {
  unsigned long milliseconds;
  Vector3D<float> acceleration;
  Vector3D<float> gyroscope;
};

struct SensorDataCharacteristic {
  SensorData data[NUM_SENSOR_DATA_ENTRIES];
};

struct SensorDataBuffer {
  size_t i;
  SensorDataCharacteristic characteristic;
};

#endif