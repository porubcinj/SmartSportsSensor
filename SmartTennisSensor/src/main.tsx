import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { BluetoothProvider } from './BluetoothContext/BluetoothProvider.tsx';
import { BluetoothUnavailablePage } from './pages/BluetoothUnavailablePage.tsx';
import { DataInferencePage } from './pages/DataInferencePage.tsx';
import { DataCollectionPage } from './pages/DataCollectionPage.tsx';
import App from './App.tsx';
import './index.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <BluetoothProvider>
          <Routes>
            <Route path='/' element={<App />} />
            <Route path='infer' element={<DataInferencePage />} />
            <Route path='collect' element={<DataCollectionPage />} />
            <Route path='bluetooth-unavailable' element={<BluetoothUnavailablePage />} />
          </Routes>
        </BluetoothProvider>
      </BrowserRouter>
    </StrictMode>
  );
}