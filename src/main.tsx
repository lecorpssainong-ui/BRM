import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any stale or legacy service worker to ensure reliable PWA launches
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {
    // Silently ignore
  });
}

createRoot(document.getElementById('root')!).render(<App />);

