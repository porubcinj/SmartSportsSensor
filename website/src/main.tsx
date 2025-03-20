import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router';
import { BluetoothProvider } from './BluetoothContext/BluetoothProvider.tsx';
import { BluetoothUnavailablePage } from './pages/BluetoothUnavailablePage.tsx';
import { DataInferencePage } from './pages/DataInferencePage.tsx';
import { DataCollectionPage } from './pages/DataCollectionPage.tsx';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import App from './App.tsx';

const darkTheme = createTheme({
  colorSchemes: { dark: true },
});

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <HashRouter>
          <BluetoothProvider>
            <Routes>
              <Route path='/' element={<App />} />
              <Route path='infer' element={<DataInferencePage />} />
              <Route path='collect' element={<DataCollectionPage />} />
              <Route path='bluetooth-unavailable' element={<BluetoothUnavailablePage />} />
            </Routes>
          </BluetoothProvider>
        </HashRouter>
      </ThemeProvider>
    </StrictMode>
  );
}