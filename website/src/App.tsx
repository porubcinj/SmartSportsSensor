import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router';
import { useBluetooth } from './BluetoothContext/useBluetooth';
import { Button } from '@mui/material';
import './App.css';

const App = () => {
  const { pairedDevice, connectToDevice } = useBluetooth();
  const [isScanning, setIsScanning] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!isScanning) {
      return;
    }

    connectToDevice()
      .catch(console.error)
      .finally(() => { setIsScanning(false); });
  }, [isScanning, connectToDevice]);

  return (
    <>
      <h1>Smart Tennis Sensor</h1>
      {!pairedDevice ? (
        <Button
          variant='contained'
          onClick={ () => { setIsScanning(true); } }
          disabled={isScanning}
        >
          {isScanning ? 'Scanning' : 'Scan'}
        </Button>
      ) : (
        <>
          <Button
            variant='contained'
            onClick={() => {
              navigate('/infer')
                ?.catch(console.error);
            }}
          >
            Data Inference
          </Button>
          <br /><br />
          <Button
            variant='contained'
            onClick={() => {
              navigate('/collect')
                ?.catch(console.error);
            }}
          >
            Data Collection
          </Button>
        </>
      )}
    </>
  );
};

export default App;