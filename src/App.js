import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ManagementScreen from './screens/ManagementScreen';
import ManualUpdateScreen from './screens/ManualUpdateScreen';
import ReportScreen from './screens/ReportScreen';

function App() {
  return (
    <Router>
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