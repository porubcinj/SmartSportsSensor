import { useState, useEffect, useRef } from 'react'
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useBluetooth } from '../BluetoothContext/useBluetooth';
import { useCharacteristic } from '../hooks/useCharacteristic';
import { SensorDataPreviewTable } from '../components/SensorDataPreviewTable';
import { useCharacteristicNotifications } from '../hooks/useCharacteristicNotifications';
import { formatTime } from '../utils/formatTime';
import { useSensorData } from '../hooks/useSensorData';
import { SensorDataRow } from '../models/SensorDataRow';
import { useInferenceData } from '../hooks/useInferenceData';

export const DataInferencePage = () => {
  const { pairedDevice } = useBluetooth();
  const [isPaused, setIsPaused] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sensorDataPreview, setSensorDataPreview] = useState<SensorDataRow[]>([]);
  const [prediction, setPrediction] = useState<DataView | null>(null);
  const elapsedMillis = useRef<number>(0);
  const elapsedPaused = useRef<number>(Date.now());

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
  const sensorDataCharacteristic = useCharacteristic(
    pairedDevice,
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
  );
  const inferenceCharacteristic = useCharacteristic(
    pairedDevice,
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
  );

  useSensorData(sensorDataCharacteristic, setSensorDataPreview, setElapsedSeconds, elapsedMillis, elapsedPaused);
  const inferenceDataRef = useInferenceData(inferenceCharacteristic, setPrediction, setElapsedSeconds, elapsedMillis, elapsedPaused);

  /* Set up event listener for notifications */
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

  /* Stop/start notifications based on pause/resume button */
  useCharacteristicNotifications(sensorDataCharacteristic, isPaused);
  useCharacteristicNotifications(inferenceCharacteristic, isPaused);

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
      <Button
        variant='contained'
        onClick={handleDownload}
        disabled={!isPaused || inferenceDataRef.current.length <= 0}
      >
        Download Inference Data
      </Button>
      <br /><br />
      <TableContainer component={Paper}>
        <Table stickyHeader size='small' style={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell>Stroke</TableCell>
              <TableCell>Spin</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {prediction !== null && <>
                <TableCell>{Stroke[prediction.getUint32(0, true)]}</TableCell>
                <TableCell>{Spin[prediction.getUint32(4, true)]}</TableCell>
              </>}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <br /><br />
      <SensorDataPreviewTable sensorDataPreview={sensorDataPreview} />
    </>
  );
};