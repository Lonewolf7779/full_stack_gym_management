import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/landing/LandingPage';
import { checkServerHealth } from './services/api';

export default function App() {
  const [serverStatus, setServerStatus] = useState({
    online: false,
    checking: true,
    data: null,
  });

  useEffect(() => {
    let isMounted = true;

    const pingBackend = async () => {
      const res = await checkServerHealth();
      if (isMounted) {
        setServerStatus({
          online: res.online,
          checking: false,
          data: res.data || null,
        });
      }
    };

    pingBackend();

    // Check periodically every 30 seconds
    const interval = setInterval(pingBackend, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Router>
      <div className="app-layout">
        <Navbar serverStatus={serverStatus} />
        <Routes>
          <Route path="/" element={<LandingPage serverStatus={serverStatus} />} />
          {/* Future routes for Auth, Admin, Trainer, Member dashboards will be mounted here in upcoming phases */}
          <Route path="*" element={<LandingPage serverStatus={serverStatus} />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}
