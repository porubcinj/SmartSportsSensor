#ifndef _STOPWATCH_H_
#define _STOPWATCH_H_

template<typename T>
class Stopwatch {
public:
  Stopwatch(T (*timeFunction)()) : getTime(timeFunction), startTime(getTime()) {}

  void restart() {
    startTime = getTime();
  }

  T elapsed(){
    return getTime() - startTime;
  }

private:
  T (*getTime)();
  T startTime;
};

#endif