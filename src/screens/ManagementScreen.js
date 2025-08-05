import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';

const ManagementScreen = () => {
  const navigate = useNavigate();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const employeeId = sessionStorage.getItem('employeeId');

  useEffect(() => {
    const loadPendingApprovals = async () => {
      try {
        const response = await fetch('/api/attendance/logs?status=PENDING');
        if (response.ok) {
          const logs = await response.json();
          setPendingApprovals(logs);
        }
      } catch (error) {
        console.error('Error loading pending approvals:', error);
      }
    };

    loadPendingApprovals();
  }, []);

  const approveReport = async (id) => {
    try {
      const response = await fetch(`/api/attendance/status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'APPROVED',
          updatedBy: sessionStorage.getItem('userId')
        }),
      });

      if (response.ok) {
        setPendingApprovals(prev => prev.filter(report => report.id !== id));
        alert('דיווח אושר בהצלחה!');
      }
    } catch (error) {
      console.error('Error approving report:', error);
      alert('שגיאה באישור הדיווח');
    }
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
                  <p><strong>עובד:</strong> {report.user_name || report.employee_id}</p>
                  <p><strong>תאריך:</strong> {new Date(report.clock_in).toLocaleDateString('he-IL')}</p>
                  <p><strong>כניסה:</strong> {new Date(report.clock_in).toLocaleTimeString('he-IL')}</p>
                  {report.clock_out && <p><strong>יציאה:</strong> {new Date(report.clock_out).toLocaleTimeString('he-IL')}</p>}
                  <p><strong>סיבה:</strong> {report.manual_reason || 'דיווח ידני'}</p>
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