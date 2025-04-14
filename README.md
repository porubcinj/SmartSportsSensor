# CSE 60685 Design Project - Smart Sports Sensor

Web App: <https://porubcinj.github.io/SmartSportsSensor>

## Overview

There are three main parts of this repository: the Arduino sketch, the web app, and the machine learning code. All Arduino code is in the root folder; the Arduino sketch is at [SmartSportsSensor.ino](SmartSportsSensor.ino). The web app code is in the [website](website/) folder. The machine learning code is located in [machine_learning](machine_learning/). For more information on the website or machine learning code, refer to the README files in their respective folders.

## Requirements

### Hardware

1. [Arduino Nano 33 BLE Rev2]

### Software

1. [Arduino IDE 2] ([source](https://github.com/arduino/arduino-ide))

### Arduino Core

1. [ArduinoCore-mbed] ([source](https://github.com/arduino/ArduinoCore-mbed))

### Libraries

1. [Arduino_BMI270_BMM150] ([source](https://github.com/arduino-libraries/Arduino_BMI270_BMM150))
1. [ArduinoBLE] ([source](https://github.com/arduino-libraries/ArduinoBLE))
1. [MicroTFLite] ([source](https://github.com/johnosbb/MicroTFLite))

## Setup

### Arduino

Upload [SmartSportsSensor.ino](SmartSportsSensor.ino) to the Arduino Nano 33 BLE Rev2. Refer to [this guide](https://docs.arduino.cc/software/ide-v2/tutorials/getting-started/ide-v2-uploading-a-sketch/) for help.

Once uploaded, you can disconnect the Arduino from your computer and connect it with a battery. Ensure that the Arduino is:

- Connected to a battery (blue light is on).
- Securely mounted to the racket.

![Mount Sample](assets/ArduinoMountV2.jpg)

If the Arduino is properly powered on, you should see a blue light turn on. A blinking blue light indicates that the Arduino is ready to pair over Bluetooth Low Energy. A solid blue light indicates that it is paired.

## TODO

1. Need directions for training model, live inference, more photos of collection

[Arduino Nano 33 BLE Rev2]: https://docs.arduino.cc/hardware/nano-33-ble-rev2/
[Arduino IDE 2]: https://docs.arduino.cc/software/ide/
[ArduinoCore-mbed]: https://docs.arduino.cc/software/ide-v1/tutorials/getting-started/cores/arduino-mbed_nano/
[Arduino_BMI270_BMM150]: https://docs.arduino.cc/libraries/arduino_bmi270_bmm150/
[ArduinoBLE]: https://docs.arduino.cc/libraries/arduinoble/
[MicroTFLite]: https://docs.arduino.cc/libraries/microtflite/
