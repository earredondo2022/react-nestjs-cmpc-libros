import React, { useEffect, useState } from 'react';
import './index.css';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple routing based on path
  const renderPage = () => {
    switch (currentPath) {
      case '/dashboard':
        return <DashboardPage />;
      case '/':
      default:
        return <LoginPage />;
    }
  };

  return renderPage();
}

export default App;