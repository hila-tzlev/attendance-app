
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';

const ManagementScreen = () => {
  const navigate = useNavigate();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const employeeId = sessionStorage.getItem('employeeId');

  useEffect(() => {
    const loadPendingApprovals = () => {
      const manualUpdates = JSON.parse(localStorage.getItem('manualUpdates') || '[]');
      const pending = manualUpdates.filter(update => update.status === 'PENDING');
      setPendingApprovals(pending);
    };

    loadPendingApprovals();
  }, []);

  const approveReport = (id) => {
    const manualUpdates = JSON.parse(localStorage.getItem('manualUpdates') || '[]');
    const updated = manualUpdates.map(update => 
      update.id === id ? { ...update, status: 'APPROVED' } : update
    );
    localStorage.setItem('manualUpdates', JSON.stringify(updated));
    setPendingApprovals(prev => prev.filter(report => report.id !== id));
    alert('דיווח אושר בהצלחה!');
  };

  if (!employeeId) {
    navigate('/');
    return null;
  }

  return (
    <Layout>
      <div className="management-container">
        <div className="management-header">
          <h1>ניהול - אישור דיווחים</h1>
          <Button onClick={() => navigate('/home')}>
            חזרה לעמוד הבית
          </Button>
        </div>

        <div className="pending-approvals">
          <h2>דיווחים ממתינים לאישור</h2>
          {pendingApprovals.length === 0 ? (
            <p>אין דיווחים ממתינים לאישור</p>
          ) : (
            pendingApprovals.map((report) => (
              <div key={report.id} className="approval-card">
                <div className="approval-info">
                  <p><strong>עובד:</strong> {report.employeeId}</p>
                  <p><strong>תאריך:</strong> {new Date(report.date).toLocaleDateString('he-IL')}</p>
                  <p><strong>שעות:</strong> {report.hours}</p>
                </div>
                <div className="approval-actions">
                  <Button onClick={() => approveReport(report.id)}>
                    אשר
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ManagementScreen;
