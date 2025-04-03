import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router';
import { useBluetooth } from './BluetoothContext/useBluetooth';
import { Button } from '@mui/material';

import './App.css';

const App = () => {
  const { pairedDevice, connectToDevice } = useBluetooth();
  const [isScanning, setIsScanning] = useState(false);

  const navigate = useNavigate();

  //fakeBluetoothConnection();

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
      <h1>Smart Sports Sensor</h1>
      <br></br>
      {!pairedDevice ? (
        <div className='main-button'> 
          <Button
            variant='contained'
            onClick={ () => { setIsScanning(true); } }
            disabled={isScanning}
          >
            {isScanning ? 'Scanning' : 'Scan'}
          </Button>
        </div>
      ) : (
        <>
          <div className='data-buttons'>
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
          </div>

          <div>
            <div className="bottom-right-info">
              <h6>Device Info</h6>
              {pairedDevice && (
                <>
                  <p>Name: {pairedDevice.device.name}</p>
                  <p>Id: "{pairedDevice.device.id}"</p>
                </>
              )}
            </div>
          </div>
          
        </>
      )}
    </>
  );
};

export default App;