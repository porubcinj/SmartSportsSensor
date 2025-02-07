#ifndef _SENSOR_DATA_H_
#define _SENSOR_DATA_H_

#include <stddef.h>
#include "Vector3D.h"

#define MAX_CHARACTERISTIC_SIZE 512

/* 4 + 12 + 12 = 28 bytes */
struct SensorData {
  unsigned long milliseconds;
  Vector3D<float> acceleration;
  Vector3D<float> gyroscope;
};

struct SensorDataCharacteristic {
  unsigned char data[MAX_CHARACTERISTIC_SIZE];
};

struct SensorDataBuffer {
  size_t i;
  SensorDataCharacteristic characteristic;
};

#endif