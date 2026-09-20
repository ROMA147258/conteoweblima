import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { LoginView } from './features/auth/LoginView';
import { ResultsView } from './features/results/ResultsView';
import { MapView } from './features/map/MapView';
import { ComparisonView } from './features/comparison/ComparisonView';
import { CoordinatorView } from './features/coordinators/CoordinatorView';
import { AttendanceView } from './features/attendance/AttendanceView';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/" element={<LoginView />} />

        <Route element={<MainLayout />}>
          <Route path="/results" element={<ResultsView />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/comparison" element={<ComparisonView />} />
          <Route path="/coordinators" element={<CoordinatorView />} />
          <Route path="/attendance" element={<AttendanceView />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
