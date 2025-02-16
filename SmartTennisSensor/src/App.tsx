import { useState, useEffect, useRef } from 'react'
import { Button } from '@mui/material';
import './App.css';

function App() {
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [pairedDevice, setPairedDevice] = useState<BluetoothRemoteGATTServer | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const sensorDataRef = useRef<{
    buffer: Uint8Array;
    length: number;
  }>({
    buffer: new Uint8Array(224),
    length: 0,
  });

  useEffect(() => {
    if ('bluetooth' in navigator) {
      navigator.bluetooth.getAvailability()
        .then(setIsBluetoothAvailable)
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (isScanning) {
      navigator.bluetooth.requestDevice({
        filters: [
          {
            name: 'Arduino',
          },
        ],
        optionalServices: [
          '00000000-0000-0000-0000-000000000000',
        ],
      })
        .then(device => {
          device.gatt?.connect()
            .then(setPairedDevice)
            .catch(console.error);
        })
        .catch(console.error)
        .finally(() => {
          setIsScanning(false);
        });
    }
  }, [isScanning]);

  useEffect(() => {
    if (pairedDevice) {
      let characteristicRef: BluetoothRemoteGATTCharacteristic | undefined = undefined;
      const handleCharacteristicValueChanged = (event: Event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (value) {
          const newData = new Uint8Array(value.buffer);
          const currentData = sensorDataRef.current;

          if (currentData.length + newData.length > currentData.buffer.length) {
            const newBuffer = new Uint8Array(currentData.buffer.length * 2);
            newBuffer.set(currentData.buffer);
            currentData.buffer = newBuffer;
          }

          currentData.buffer.set(newData, currentData.length);
          currentData.length += newData.length;
        }
      };

      pairedDevice.getPrimaryService('00000000-0000-0000-0000-000000000000')
        .then(service => {
          service.getCharacteristic('00000000-0000-0000-0000-000000000000')
            .then(characteristic => {
              characteristicRef = characteristic;

              characteristic.startNotifications()
                .then(() => {
                  characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
                })
                .catch(console.error);
            })
            .catch(console.error);
        })
        .catch(console.error);

        return () => {
          if (characteristicRef !== undefined) {
            characteristicRef.removeEventListener(
              'characteristicvaluechanged',
              handleCharacteristicValueChanged
            );
          }
        };
    }
  }, [pairedDevice]);

  useEffect(() => {
    if (pairedDevice) {
      const timerId = setInterval(() => {
        setElapsedTime(prevTime => prevTime + 1);
      }, 1000);
      return () => { clearInterval(timerId); };
    }
  }, [pairedDevice]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const { buffer, length } = sensorDataRef.current;
    const blob = new Blob([buffer.subarray(0, length)], { type: 'application/octet-stream' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sensor_data.bin';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <h1>Smart Tennis Sensor</h1>
      {isBluetoothAvailable ? (
        <>
          {!pairedDevice && (
            <Button
              variant='contained'
              onClick={ () => { setIsScanning(!isScanning); } }
              disabled={isScanning}
            >
              {isScanning ? 'Scanning' : 'Scan'}
            </Button>
          )}
          {sensorDataRef.current.length > 0 && (
            <>
              <p>{formatTime(elapsedTime)}</p>
              <Button
                variant='contained'
                onClick={handleDownload}
              >
                Download Sensor Data
              </Button>
            </>
          )}
        </>
      ) : (
        <p>Bluetooth is unavailable, try Google Chrome.</p>
      )}
    </>
  );
}

export default App;
