import { useEffect } from 'react';

export const useCharacteristicNotifications = (
  characteristic: BluetoothRemoteGATTCharacteristic | null,
  isPaused: boolean
) => {
  useEffect(() => {
    if (!characteristic) {
        return;
    }

    if (isPaused) {
      characteristic.stopNotifications().catch(console.error);
    } else {
      characteristic.startNotifications().catch(console.error);
    }
  }, [characteristic, isPaused]);
};