#ifndef _PREPROCESSING_H_
#define _PREPROCESSING_H_

#include "SensorData.h"

void zscoreNormalize(const float data[NUM_FEATURES][NUM_SENSOR_DATA_ENTRIES], double lastMean[NUM_FEATURES], double lastVariance[NUM_FEATURES], long* lastSampleCount, float result[NUM_FEATURES][NUM_SENSOR_DATA_ENTRIES]);

#endif