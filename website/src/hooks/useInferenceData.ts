import { useEffect, useRef } from 'react';

export const useInferenceData = (
  inferenceCharacteristic: BluetoothRemoteGATTCharacteristic | null,
  setPrediction: React.Dispatch<React.SetStateAction<DataView<ArrayBufferLike> | null>>,
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>,
  elapsedMillis: React.RefObject<number>,
  elapsedPaused: React.RefObject<number>,
) => {
  const inferenceDataRef = useRef<{
    buffer: Uint8Array;
    length: number;
  }>({
    buffer: new Uint8Array(8),
    length: 0,
  });

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

      const newData = new Uint8Array(value.buffer);
      const currentData = inferenceDataRef.current;

      if (currentData.length + newData.length > currentData.buffer.length) {
        const newBuffer = new Uint8Array(currentData.buffer.length * 2);
        newBuffer.set(currentData.buffer);
        currentData.buffer = newBuffer;
      }

      /* Concatenate new sensor data */
      currentData.buffer.set(newData, currentData.length);
      currentData.length += newData.length;

      /* Update real-time prediction */
      setPrediction(value);
    };

    inferenceCharacteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

    return () => { inferenceCharacteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged); };
  }, [inferenceCharacteristic]);

  return inferenceDataRef;
};