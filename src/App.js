import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ManualUpdateScreen from './screens/ManualUpdateScreen';
import ReportScreen from './screens/ReportScreen';
import ManagementScreen from './screens/ManagementScreen';
import './App.css';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/management" element={<ManagementScreen />} />
        <Route path="/manual-update" element={<ManualUpdateScreen />} />
        <Route path="/report-screen" element={<ReportScreen />} />
      </Routes>
    </Router>
  );
}

export default App;