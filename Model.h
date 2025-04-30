#ifndef _MODEL_H_
#define _MODEL_H_

#include "SensorData.h"

#define NUM_INFERENCE_ENTRIES 8
#define NUM_SHOT_STEPS (NUM_INFERENCE_ENTRIES * NUM_SENSOR_DATA_ENTRIES)
#define NUM_SHOT_STEPS_BEFORE_PEAK 36
#define NUM_SHOT_STEPS_AFTER_PEAK (NUM_SHOT_STEPS - NUM_SHOT_STEPS_BEFORE_PEAK - 1)
#define NUM_ENTRIES_AFTER_PEAK (NUM_SHOT_STEPS_AFTER_PEAK / NUM_SENSOR_DATA_ENTRIES)
#define SQUARED_ACCELERATION_THRESHOLD 20

enum class Classification : unsigned int {
  FlatForehandServe,
  SliceForehandServe,
  TopspinForehandServe,
  FlatForehandGroundstroke,
  SliceForehandGroundstroke,
  TopspinForehandGroundstroke,
  FlatBackhandGroundstroke,
  SliceBackhandGroundstroke,
  TopspinBackhandGroundstroke,
  SliceForehandVolley,
  SliceBackhandVolley,
  FlatForehandOverhead,
  SliceForehandOverhead,
  Count,
};

struct InferenceCharacteristic {
  unsigned long milliseconds;
  Classification classification;
};

struct InferenceDataBuffer {
  int i;
  float normalizedSensorData[NUM_INFERENCE_ENTRIES][NUM_FEATURES][NUM_SENSOR_DATA_ENTRIES];
};

#endif