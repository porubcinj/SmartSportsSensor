import { useState, useRef } from 'react'
import { Button } from '@mui/material';
import { useBluetooth } from '../BluetoothContext/useBluetooth';
import { useCharacteristic } from '../hooks/useCharacteristic';
import { SensorDataPreviewTable } from '../components/SensorDataPreviewTable';
import { useCharacteristicNotifications } from '../hooks/useCharacteristicNotifications';
import { formatTime } from '../utils/formatTime';
import { useSensorData } from '../hooks/useSensorData';
import { SensorDataRow } from '../models/SensorDataRow';
import { useInferenceData } from '../hooks/useInferenceData';
import { InferenceDataRow } from '../models/InferenceDataRow';
import { InferenceDataPreviewTable } from '../components/InferenceDataPreviewTable';
import {SensorDataGraph} from '../components/DataGraphPreview';


export const DataInferencePage = () => {
  const { pairedDevice } = useBluetooth();
  const [isPaused, setIsPaused] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sensorDataPreview, setSensorDataPreview] = useState<SensorDataRow[]>([]);
  const [inferenceDataPreview, setInferenceDataPreview] = useState<InferenceDataRow[]>([]);
  const elapsedMillis = useRef<number>(0);
  const elapsedPaused = useRef<number>(Date.now());

  const [selectedStroke, setSelectedStroke] = useState<string | null>(null);
  const [selectedSpin, setSelectedSpin] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<string | null>(null);

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

  useSensorData(sensorDataCharacteristic, setSensorDataPreview, setElapsedSeconds, elapsedMillis, elapsedPaused, selectedStroke, selectedSide, selectedSpin);
  const inferenceDataRef = useInferenceData(inferenceCharacteristic, setInferenceDataPreview, setElapsedSeconds, elapsedMillis, elapsedPaused);

  /* Stop/start notifications based on pause/resume button */
  useCharacteristicNotifications(sensorDataCharacteristic, isPaused);
  useCharacteristicNotifications(inferenceCharacteristic, isPaused);

  const handleDownload = () => {
    const csvHeader = 'stroke,side,spin\n';
    const csvContent = inferenceDataRef.current
      .map(({ stroke,side,spin }) => `${stroke},${side},${spin}`)
      .join('\n');
    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inference_data.csv';
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
      <InferenceDataPreviewTable inferenceDataPreview={inferenceDataPreview} />
      <br /><br />
      <SensorDataPreviewTable sensorDataPreview={sensorDataPreview} />
      <SensorDataGraph sensorDataPreview={sensorDataPreview} />

    </>
  );
};