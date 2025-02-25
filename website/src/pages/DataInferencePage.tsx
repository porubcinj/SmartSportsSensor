import { useState, useEffect, useRef } from 'react'
import { Button } from '@mui/material';
import { useBluetooth } from '../BluetoothContext/useBluetooth';

export const DataInferencePage = () => {
  const { pairedDevice } = useBluetooth();
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [prediction, setPrediction] = useState<DataView | null>(null);
  const elapsedMillis = useRef<number>(0);
  const elapsedPaused = useRef<number>(Date.now());
  const inferenceDataRef = useRef<{
    buffer: Uint8Array;
    length: number;
  }>({
    buffer: new Uint8Array(8),
    length: 0,
  });

  enum Stroke {
    Other = 0,
    Backhand,
    Overhead,
    Forehand,
  };
  
  enum Spin {
    Other = 0,
    Slice,
    Flat,
    Topspin,
  };

  /* Get and set characteristic */
  useEffect(() => {
    if (!pairedDevice) {
      return;
    }

    pairedDevice.getPrimaryService('00000000-0000-0000-0000-000000000000')
      .then(service => {
        service.getCharacteristic('00000000-0000-0000-0000-000000000001')
          .then(characteristic => {
            setCharacteristic(characteristic);
          })
          .catch(console.error);
      })
      .catch(console.error);
  }, [pairedDevice]);

  /* Set up event listener for notifications */
  useEffect(() => {
    if (!characteristic) {
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

    characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

    return () => { characteristic.removeEventListener('characteristicvaluechanged', handleCharacteristicValueChanged); };
  }, [characteristic]);

  /* Stop/start notifications based on pause/resume button */
  useEffect(() => {
    if (!characteristic) {
      return;
    }

    if (isPaused) {
      characteristic.stopNotifications()
        .catch(console.error);
    } else {
      characteristic.startNotifications()
        .catch(console.error);
    }
  }, [characteristic, isPaused]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const { buffer, length } = inferenceDataRef.current;
    const blob = new Blob([buffer.subarray(0, length)], { type: 'application/octet-stream' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inference_data.bin';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <h1>Smart Sports Sensor</h1>
      <h2>{formatTime(elapsedSeconds)}</h2>
      <Button
        variant='contained'
        onClick={() => {
          if (isPaused) {
            elapsedPaused.current = Date.now() - elapsedMillis.current;
          }
          setIsPaused(prev => !prev);
        }}
      >
        {isPaused ? (inferenceDataRef.current.length > 0 ? 'Resume': 'Begin') : 'Pause'}
      </Button>
      <br /><br />
      <h3>Prediction</h3>
      {prediction !== null && (
        <table
          border={1}
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <colgroup>
            <col className='Stroke' width='50%' />
            <col className='Spin' width='50%' />
          </colgroup>
          <thead>
            <tr>
              <th scope='Stroke'>
                Stroke
              </th>
              <th scope='Spin'>
                Spin
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{Stroke[prediction.getUint32(0, true)]}</td>
              <td>{Spin[prediction.getUint32(4, true)]}</td>
            </tr>
          </tbody>
        </table>
      )}
      <br /><br />
      <Button
        variant='contained'
        onClick={handleDownload}
        disabled={!isPaused || inferenceDataRef.current.length <= 0}
      >
        Download Inference Data
      </Button>
    </>
  );
};