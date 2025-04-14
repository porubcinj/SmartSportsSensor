import { useRef, useState } from 'react'
import { Box, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useBluetooth } from '../BluetoothContext/useBluetooth';
import { SensorDataRow } from '../models/SensorDataRow';
import { SensorDataPreviewTable } from '../components/SensorDataPreviewTable';
import { useCharacteristic } from '../hooks/useCharacteristic';
import { useCharacteristicNotifications } from '../hooks/useCharacteristicNotifications';
import { formatTime } from '../utils/formatTime';
import { useSensorData } from '../hooks/useSensorData';
import { Stroke, Side, Spin } from '../models/InferenceDataRow';
import { SensorDataGraph } from '../components/DataGraphPreview';
import { EnumSelect } from '../components/EnumSelect';

export const DataCollectionPage = () => {
  const { pairedDevice } = useBluetooth();
  const [resetGraphKey] = useState(0);
  const [selectedStroke, setSelectedStroke] = useState<Stroke | null>(null);
  const [selectedSide, setSelectedSide] = useState<Side | null>(null);
  const [selectedSpin, setSelectedSpin] = useState<Spin | null>(null);

  const enumToOptions = (enumObj: any) => {
    return Object.keys(enumObj)
      .filter((key) => isNaN(Number(key)) && key !== 'Count')
      .map((key) => ({ label: key, value: enumObj[key as keyof typeof enumObj] }));
  };

  const strokeOptions = enumToOptions(Stroke);
  const sideOptions = enumToOptions(Side);
  const spinOptions = enumToOptions(Spin);

  const clearAllSelections = () => {
    setSelectedStroke(null);
    setSelectedSide(null);
    setSelectedSpin(null);
  };

  const handleRestart = () => {
    setIsPaused(true);
    sensorDataRef.current = [];
    setSensorDataPreview([]);
    setElapsedSeconds(0);
    elapsedMillis.current = 0;
    elapsedPaused.current = Date.now();
  };

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
  const sensorDataRef = useSensorData(sensorDataCharacteristic, setSensorDataPreview, setElapsedSeconds, elapsedMillis, elapsedPaused, selectedStroke, selectedSide, selectedSpin);

  /* Stop/start notifications based on pause/resume button */
  useCharacteristicNotifications(sensorDataCharacteristic, isPaused);

  const handleSensorDataDownload = () => {
    const csvHeader = 'ms,ax,ay,az,gx,gy,gz,stroke,side,spin\n';
    const csvContent = sensorDataRef.current
      .map(({ ms, ax, ay, az, gx, gy, gz, stroke, side, spin }) => `${ms},${ax},${ay},${az},${gx},${gy},${gz},${stroke !== null ? Stroke[stroke] : ''},${side !== null ? Side[side] : ''},${spin !== null ? Spin[spin] : ''}`)
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
      <h3>Select shot type:</h3>
      <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
        <EnumSelect
          label="Stroke"
          value={selectedStroke}
          onChange={setSelectedStroke}
          options={strokeOptions}
        />
        <EnumSelect
          label="Side"
          value={selectedSide}
          onChange={setSelectedSide}
          options={sideOptions}
        />
        <EnumSelect
          label="Spin"
          value={selectedSpin}
          onChange={setSelectedSpin}
          options={spinOptions}
        />
      </Box>
      <br /><br />
      <Button
        variant="contained"
        onClick={clearAllSelections}
        style={{
          background: 'red',
          color: 'white',
        }}
      >
        Clear Options
      </Button>
      <br />
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
        onClick={handleSensorDataDownload}
        disabled={!isPaused || sensorDataRef.current.length <= 0}
      >
        Download Sensor Data
      </Button>
      <br /><br />
      <SensorDataPreviewTable sensorDataPreview={sensorDataPreview} />
      <br /><br />
      <SensorDataGraph sensorDataPreview={sensorDataPreview} key={resetGraphKey} />
      <br />
      <Button
        variant='contained'
        onClick={handleRestart}
        style={{
          background: 'red',
          color: 'white',
        }}
      >
        Restart Collection
      </Button>
    </>
  );
};