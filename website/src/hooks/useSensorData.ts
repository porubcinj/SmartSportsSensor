import { useEffect, useRef } from 'react';
import { SensorDataRow } from '../models/SensorDataRow';

export const useSensorData = (
  sensorDataCharacteristic: BluetoothRemoteGATTCharacteristic | null,
  setSensorDataPreview: React.Dispatch<React.SetStateAction<SensorDataRow[]>>,
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>,
  elapsedMillis: React.RefObject<number>,
  elapsedPaused: React.RefObject<number>,
) => {
  const sensorDataRef = useRef<SensorDataRow[]>([]);

  useEffect(() => {
    if (!sensorDataCharacteristic) {
      return;
    }

    const handleCharacteristicValueChanged = (event: Event) => {
      const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
      if (!value) {
        return;
      }

      /* Update elapsed time */
      const prevMillis = elapsedMillis.current;
      elapsedMillis.current = Date.now() - elapsedPaused.current;
      const secondsDifference = Math.floor(elapsedMillis.current / 1000) - Math.floor(prevMillis / 1000);

      /* Only trigger a render if a second has passed since last update */
      if (secondsDifference > 0) {
        setElapsedSeconds(prev => prev + secondsDifference);
      }

      const dataView = new DataView(value.buffer);
      const newData: SensorDataRow[] = [];
      for (let i = 0; i < dataView.byteLength; i += 28) {
        if (i + 28 > dataView.byteLength) {
          break;
        }

        newData.push({
          ms: dataView.getUint32(i, true),
          ax: dataView.getFloat32(i + 4, true),
          ay: dataView.getFloat32(i + 8, true),
          az: dataView.getFloat32(i + 12, true),
          gx: dataView.getFloat32(i + 16, true),
          gy: dataView.getFloat32(i + 20, true),
          gz: dataView.getFloat32(i + 24, true),
        });
      }

      sensorDataRef.current = sensorDataRef.current.concat(newData);
      setSensorDataPreview(newData);
    };

  sensorDataCharacteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

  return () => { sensorDataCharacteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged); };
  }, [sensorDataCharacteristic]);

  return sensorDataRef;
};