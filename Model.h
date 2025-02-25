#ifndef _MODEL_H_
#define _MODEL_H_

enum class Stroke : unsigned int {
  Other,
  Backhand,
  Overhead,
  Forehand,
  Count,
};

enum class Spin : unsigned int {
  Other,
  Slice,
  Flat,
  Topspin,
  Count,
};

struct InferenceCharacteristic {
  Stroke stroke;
  Spin spin;
};

#endif