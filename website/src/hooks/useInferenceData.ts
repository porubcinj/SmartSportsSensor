import { useEffect, useRef } from 'react';
import { Classification, InferenceDataRow, classificationToDetails } from '../models/InferenceDataRow';

export const useInferenceData = (
  inferenceCharacteristic: BluetoothRemoteGATTCharacteristic | null,
  setInferenceDataPreview: React.Dispatch<React.SetStateAction<InferenceDataRow[]>>,
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>,
  elapsedMillis: React.RefObject<number>,
  elapsedPaused: React.RefObject<number>,
) => {
  const inferenceDataRef = useRef<InferenceDataRow[]>([]);

  useEffect(() => {
    if (!inferenceCharacteristic) {
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
      const newData: InferenceDataRow[] = [];
      for (let i = 0; i < dataView.byteLength; i += 8) {
        if (i + 8 > dataView.byteLength) {
          break;
        }

        const ms = dataView.getUint32(i, true);
        const classification = dataView.getUint32(i + 4, true) as Classification;
        const { stroke, side, spin } = classificationToDetails(classification);

        newData.push({
          ms,
          stroke,
          side,
          spin,
        });
      }

      /* Concatenate new sensor data */
      inferenceDataRef.current = inferenceDataRef.current.concat(newData);

      /* Update real-time prediction */
      setInferenceDataPreview(newData);
    };

    inferenceCharacteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

    return () => { inferenceCharacteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged); };
  }, [inferenceCharacteristic]);

  return inferenceDataRef;
};