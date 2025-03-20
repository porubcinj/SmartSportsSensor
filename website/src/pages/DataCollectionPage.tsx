import { useRef, useState } from 'react'
import { Button } from '@mui/material';
import { useBluetooth } from '../BluetoothContext/useBluetooth';
import { SensorDataRow } from '../models/SensorDataRow';
import { SensorDataPreviewTable } from '../components/SensorDataPreviewTable';
import { useCharacteristic } from '../hooks/useCharacteristic';
import { useCharacteristicNotifications } from '../hooks/useCharacteristicNotifications';
import { formatTime } from '../utils/formatTime';
import { useSensorData } from '../hooks/useSensorData';

export const DataCollectionPage = () => {
  const { pairedDevice } = useBluetooth();
  const [isPaused, setIsPaused] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sensorDataPreview, setSensorDataPreview] = useState<SensorDataRow[]>([]);
  const elapsedMillis = useRef<number>(0);
  const elapsedPaused = useRef<number>(Date.now());

  /* Get and set characteristic */
  const sensorDataCharacteristic = useCharacteristic(
    pairedDevice,
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
  );

  /* Set up event listener for notifications */
  const sensorDataRef = useSensorData(sensorDataCharacteristic, setSensorDataPreview, setElapsedSeconds, elapsedMillis, elapsedPaused);

  /* Stop/start notifications based on pause/resume button */
  useCharacteristicNotifications(sensorDataCharacteristic, isPaused);

  const handleDownload = () => {
    const csvHeader = 'ms,ax,ay,az,gx,gy,gz\n';
    const csvContent = sensorDataRef.current
      .map(({ ms, ax, ay, az, gx, gy, gz }) => `${ms},${ax},${ay},${az},${gx},${gy},${gz}`)
      .join('\n');
    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sensor_data.csv';
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
        {isPaused ? (sensorDataRef.current.length > 0 ? 'Resume': 'Begin') : 'Pause'}
      </Button>
      <br /><br />
      <Button
        variant='contained'
        onClick={handleDownload}
        disabled={!isPaused || sensorDataRef.current.length <= 0}
      >
        Download Sensor Data
      </Button>
      <br /><br />
      <SensorDataPreviewTable sensorDataPreview={sensorDataPreview} />
    </>
  );
};