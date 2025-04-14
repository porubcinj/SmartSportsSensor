# Smart Sports Sensor - Web App

To use the web app, a Bluetooth-compatible web browser is required. Check compatibility [here](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API#browser_compatibility).

On [the main page](https://porubcinj.github.io/SmartSportsSensor), scan for Bluetooth devices and select the Arduino. The web app supports data collection and inference.

## Data Collection

- Click Data Collection.
- Select shot types; you can choose between various kinds of strokes, sides, and spins.

![Shot type](../assets/shot-type.png)

- Begin data collection, ensure its working through the live gyroscope and acceleration graphs.
- You may pause collection, change shot types, or clear options at any point during collection. Keep in mind that live reading collects acceleration (x, y, z axis) gyroscope rotations (x, y, z axis) and also shot type even if nothing is selected.

![Live reading](../assets/live-graph.png)

- When paused, you can download the CSV of the collected data.

## Setup for Local Development

1. Install dependencies with `npm ci`.
1. Run `npm run dev` to run the web app locally at <http://localhost:5173/SmartSportsSensor>.
