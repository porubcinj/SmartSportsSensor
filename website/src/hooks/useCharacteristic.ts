import { useEffect, useState } from 'react';

export const useCharacteristic = (
  pairedDevice: BluetoothRemoteGATTServer | null,
  serviceUUID: string,
  characteristicUUID: string,
) => {
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  useEffect(() => {
    if (!pairedDevice) {
        return;
    }

    const fetchCharacteristic = async () => {
      try {
        const service = await pairedDevice.getPrimaryService(serviceUUID);
        const char = await service.getCharacteristic(characteristicUUID);
        setCharacteristic(char);
      } catch (error) {
        console.error('Error fetching characteristic:', error);
      }
    };

    fetchCharacteristic();
  }, [pairedDevice, serviceUUID, characteristicUUID]);

  return characteristic;
};