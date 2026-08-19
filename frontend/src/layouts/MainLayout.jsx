import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { FilterPanel } from '../components/FilterPanel';
import { useAuth } from '../context/AuthContext';

export const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        isMinimized={isMinimized}
        toggleMinimize={() => setIsMinimized(!isMinimized)}
      />

      <main className={`main-content ${isMinimized ? 'sidebar-minimized' : ''}`}>
        <TopBar />
        <FilterPanel />
        <Outlet />
      </main>
    </div>
  );
};
