
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';
import prisma from '../lib/prisma';

const ManagementScreen = () => {
  const navigate = useNavigate();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const employeeId = sessionStorage.getItem('employeeId');

  useEffect(() => {
    const loadPendingApprovals = async () => {
      try {
        const manualUpdates = await prisma.manualUpdate.findMany({
          where: { status: 'PENDING' },
          include: { user: true }
        });
        setPendingApprovals(manualUpdates);
      } catch (error) {
        console.error('Error loading pending approvals:', error);
      }
    };

    loadPendingApprovals();
  }, []);

  const approveReport = async (id) => {
    try {
      await prisma.manualUpdate.update({
        where: { id },
        data: { status: 'APPROVED' }
      });
      setPendingApprovals(prev => prev.filter(report => report.id !== id));
      alert('דיווח אושר בהצלחה!');
    } catch (error) {
      console.error('Error approving report:', error);
      alert('אירעה שגיאה באישור הדיווח');
    }
  };

  if (!employeeId) {
    navigate('/');
    return null;
  }

  return (
    <Layout>
      <h1 className="title">מסך ניהול</h1>
      <p className="welcome-message">ברוכים הבאים למסך הניהול</p>
      <div className="welcome-message" style={{ textAlign: 'left', width: '80%' }}>
        <h3>דיווחים חריגים לאישור:</h3>
        {pendingApprovals.length > 0 ? (
          pendingApprovals.map((report) => (
            <div key={report.id} style={{ marginBottom: '10px' }}>
              <p>
                עובד: {report.user.name} ({report.user.employeeId})
                <br />
                תאריך: {new Date(report.date).toLocaleDateString('he-IL')}
                <br />
                שעות: {report.hours}
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
      <Button title="חזור" onClick={() => navigate('/home')} style={{ marginTop: '20px' }} />
    </Layout>
  );
};

export default ManagementScreen;
