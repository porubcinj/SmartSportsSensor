export interface BluetoothContextType {
  isBluetoothAvailable: boolean | null;
  pairedDevice: BluetoothRemoteGATTServer | null;
  connectToDevice: () => Promise<void>;
};