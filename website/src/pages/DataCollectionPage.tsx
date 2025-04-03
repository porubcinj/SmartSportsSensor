import { useRef, useState } from 'react'
import { Button } from '@mui/material';
import { useBluetooth } from '../BluetoothContext/useBluetooth';
import { SensorDataRow } from '../models/SensorDataRow';
import { SensorDataPreviewTable } from '../components/SensorDataPreviewTable';
import { useCharacteristic } from '../hooks/useCharacteristic';
import { useCharacteristicNotifications } from '../hooks/useCharacteristicNotifications';
import { formatTime } from '../utils/formatTime';
import { useSensorData } from '../hooks/useSensorData';
import { Stroke, Side, Spin } from "../models/InferenceDataRow";
import {SensorDataGraph} from '../components/DataGraphPreview';

const SelectionGroup = ({ 
  enumObj, 
  selectedValue, 
  onSelect, 
  }: { 
    enumObj: any;
    selectedValue: string | null;
    onSelect: (value: string) => void;
  }) => {
    const enumKeys = Object.keys(enumObj).filter(key => isNaN(Number(key)) && key !== 'Count');

  return (
   
    <div>
      {enumKeys.map((key) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          style={{
            backgroundColor: selectedValue === key ? 'grey' : 'white',
            color: selectedValue === key ? 'white' : 'black',
            margin: '5px',
            padding: '10px',
            border: '1px solid black',
            cursor: 'pointer',
          }}
        >
          {key}
        </button>
      ))}
    </div>
  );
};


export const DataCollectionPage = () => {
  const { pairedDevice } = useBluetooth();

  const [resetGraphKey] = useState(0);

  const [selectedStroke, setSelectedStroke] = useState<string | null>(null);
  const [selectedSpin, setSelectedSpin] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<string | null>(null);
  
  const clearAllSelections = () => {
    setSelectedStroke(null);
    setSelectedSpin(null);
    setSelectedSide(null);
  };

  const handleRestart = () => {
    setIsPaused(true); // Stop data collection
    sensorDataRef.current = []; // Clear stored data
    setSensorDataPreview([]); // Clear preview table
    setElapsedSeconds(0); // Reset timer display
    elapsedMillis.current = 0; // Reset millis counter
    elapsedPaused.current = Date.now(); // Reset pause reference

    clearAllSelections()
    
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

  const handleDownload = () => {
    const csvHeader = 'ms,ax,ay,az,gx,gy,gz,stroke,spin,side\n';
    const csvContent = sensorDataRef.current
      .map(({ ms, ax, ay, az, gx, gy, gz, stroke, side, spin }) => `${ms},${ax},${ay},${az},${gx},${gy},${gz},${stroke || ''},${side || ''},${spin || ''}`)
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

      <h3>Select hit type:</h3>

      <SelectionGroup
        enumObj={Stroke}
        selectedValue={selectedStroke}
        onSelect={setSelectedStroke}
      />
      <SelectionGroup
        enumObj={Spin}
        selectedValue={selectedSpin}
        onSelect={setSelectedSpin}
      />
      <SelectionGroup
        enumObj={Side}
        selectedValue={selectedSide}
        onSelect={setSelectedSide}
      />

      <br></br>

      <Button variant="contained" onClick={clearAllSelections} style = {{background: 'red'}}>
        Clear Options
      </Button>

      <br></br> 
      <br></br>
      <br></br>
      <Button
          variant='contained'
          onClick={handleDownload}
          disabled={!isPaused || sensorDataRef.current.length <= 0}
        >
          Download Sensor Data
        </Button>

      <div style={{ 
          display: 'flex', 
          gap: '10px', 
          justifyContent: 'center', 
          alignItems: 'center', 
        }}>

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
      </div>

      <SensorDataPreviewTable sensorDataPreview={sensorDataPreview} />
      <SensorDataGraph sensorDataPreview={sensorDataPreview} key={resetGraphKey} />

      <Button
        variant='contained'
        onClick={handleRestart}
        style={{ margin: '5px', background: 'red', color: 'white'}}
      >
        Restart Collection
      </Button>

    </>
  );
};