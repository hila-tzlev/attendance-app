import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';

const AttendanceReportsScreen = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('employeeId');

  if (!isLoggedIn) {
    navigate('/');
    return null;
  }

  const handleBack = () => {
    navigate('/home');
  };

  // סימולציה של דיווחי נוכחות (בסיסי)
  const reports = [
    { date: '10/03/2025', timeIn: '09:00', timeOut: '17:00' },
    { date: '11/03/2025', timeIn: '08:30', timeOut: '16:30' },
  ];

  return (
    <Layout>
    <div className="login-container">
      <h1 className="title">דיווחי נוכחות</h1>
      <div className="welcome-message" style={{ textAlign: 'left', width: '80%' }}>
        {reports.map((report, index) => (
          <p key={index}>
            תאריך: {report.date}, כניסה: {report.timeIn}, יציאה: {report.timeOut}
          </p>
        ))}
      </div>
      <Button title="חזור" onClick={handleBack} style={{ marginTop: '20px' }} />
    </div>
    </Layout>
  );
};

export default AttendanceReportsScreen;