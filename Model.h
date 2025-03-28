#ifndef _MODEL_H_
#define _MODEL_H_

/* Must be a multiple of NUM_SENSOR_DATA_ENTRIES */
#define NUM_SAMPLES 48

enum class Stroke : unsigned int {
  Serve,
  Groundstroke,
  Volley,
  Overhead,
  Count,
};

enum class Side : unsigned int {
  Forehand,
  Backhand,
  Count,
};

enum class Spin : unsigned int {
  Flat,
  Slice,
  Topspin,
  Count,
};

struct InferenceCharacteristic {
  Stroke stroke;
  Side side;
  Spin spin;
};


#endif