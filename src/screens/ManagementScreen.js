import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';

const ManagementScreen = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('employeeId');
  const isManager = localStorage.getItem('isManager') === 'true';

  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 1, employeeId: '123456782', date: '10/03/2025', time: '09:00-17:00' },
  ]);

  const handleLogout = () => {
    localStorage.removeItem('employeeId');
    localStorage.removeItem('isManager');
    navigate('/');
  };

  const approveReport = (id) => {
    setPendingApprovals(pendingApprovals.filter((report) => report.id !== id));
    alert('דיווח אושר בהצלחה!');
  };

  if (!isLoggedIn || !isManager) {
    navigate('/');
    return null;
  }

  return (
    <Layout>
      <h1 className="title">מסך ניהול</h1>
      <p className="welcome-message">ברוכים הבאים למסך הניהול.</p>
      <div className="welcome-message" style={{ textAlign: 'left', width: '80%' }}>
        <h3>דיווחים חריגים לאישור:</h3>
        {pendingApprovals.length > 0 ? (
          pendingApprovals.map((report) => (
            <div key={report.id} style={{ marginBottom: '10px' }}>
              <p>
                עובד: {report.employeeId}, תאריך: {report.date}, שעות: {report.time}
              </p>
              <Button
                title="אשר"
                onClick={() => approveReport(report.id)}
                style={{ marginTop: '5px' }}
              />
            </div>
          ))
        ) : (
          <p>אין דיווחים חריגים ממתינים לאישור.</p>
        )}
      </div>
      <Button title="צפייה בדוחות עובדים" onClick={() => alert('בעתיד נוסיף API')} style={{ marginTop: '20px' }} />
      <Button title="אופציות ניהול נוספות" onClick={() => alert('בעתיד נרחיב')} style={{ marginTop: '10px' }} />
      <Button title="יציאה" onClick={handleLogout} style={{ marginTop: '20px' }} />
    </Layout>
  );
};

export default ManagementScreen;