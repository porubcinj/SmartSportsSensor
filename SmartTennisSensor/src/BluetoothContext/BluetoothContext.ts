import { createContext } from 'react';
import { BluetoothContextType } from './BluetoothContextType';

export const BluetoothContext = createContext<BluetoothContextType | null>(null);