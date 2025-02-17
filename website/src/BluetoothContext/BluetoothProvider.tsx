import { useCallback, useMemo, useState, useEffect, PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BluetoothContext } from './BluetoothContext';

export const BluetoothProvider = ({ children } : PropsWithChildren) => {
  const [isBluetoothAvailable, setIsBluetoothAvailable] = useState<boolean | null>(null);
  const [pairedDevice, setPairedDevice] = useState<BluetoothRemoteGATTServer | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!('bluetooth' in navigator)) {
      setIsBluetoothAvailable(false);
      return;
    }

    navigator.bluetooth.getAvailability()
      .then(setIsBluetoothAvailable)
      .catch((error: unknown) => {
        console.error(error);
        setIsBluetoothAvailable(false);
      });
  }, []);

  useEffect(() => {
    if (isBluetoothAvailable === false) {
      if (location.pathname !== '/bluetooth-unavailable') {
        navigate('/bluetooth-unavailable')
          ?.catch(console.error);
      }
      return;
    }

    if (pairedDevice === null) {
      if (location.pathname !== '/') {
        navigate('/')
          ?.catch(console.error);
      }
      return;
    }
  }, [isBluetoothAvailable, navigate, pairedDevice, location]);

  const connectToDevice = useCallback(async () => {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        {
          name: 'Arduino',
        },
      ],
      optionalServices: [
        '00000000-0000-0000-0000-000000000000',
      ],
    });
    setPairedDevice(await device.gatt?.connect() ?? null);
  }, []);

  const contextValue = useMemo(() => ({
    isBluetoothAvailable,
    pairedDevice,
    connectToDevice
  }), [isBluetoothAvailable, pairedDevice, connectToDevice]);

  return (
    <BluetoothContext.Provider
      value={contextValue}
    >
      {children}
    </BluetoothContext.Provider>
  );
};