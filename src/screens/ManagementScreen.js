
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';
import './ManagementScreen.css';

const ManagementScreen = () => {
  const navigate = useNavigate();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const employeeId = sessionStorage.getItem('employeeId');

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/logs?status=PENDING');
      if (response.ok) {
        const logs = await response.json();
        setPendingApprovals(logs);
      }
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const rejectReport = async (id) => {
    try {
      const response = await fetch(`/api/attendance/status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED',
          updatedBy: sessionStorage.getItem('userId')
        }),
      });

      if (response.ok) {
        setPendingApprovals(prev => prev.filter(report => report.id !== id));
        alert('דיווח נדחה');
      }
    } catch (error) {
      console.error('Error rejecting report:', error);
      alert('שגיאה בדחיית הדיווח');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateWorkHours = (clockIn, clockOut) => {
    if (!clockOut) return 'פתוח';
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diff = (end - start) / (1000 * 60 * 60);
    return `${diff.toFixed(2)} שעות`;
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
          <Button onClick={() => navigate('/home')}>חזרה</Button>
        </div>

        {loading ? (
          <p className="loading-text">טוען נתונים...</p>
        ) : pendingApprovals.length === 0 ? (
          <p className="no-data">אין דיווחים ממתינים לאישור</p>
        ) : (
          <div className="table-wrapper">
            <table className="management-table">
              <thead>
                <tr>
                  <th>עובד</th>
                  <th>ת.ז</th>
                  <th>תאריך</th>
                  <th>כניסה</th>
                  <th>יציאה</th>
                  <th>סה"כ שעות</th>
                  <th>סיבה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map((report) => (
                  <tr key={report.id}>
                    <td>{report.user_name || '-'}</td>
                    <td>{report.employee_id || '-'}</td>
                    <td>{formatDate(report.clock_in)}</td>
                    <td>{formatTime(report.clock_in)}</td>
                    <td>{report.clock_out ? formatTime(report.clock_out) : '-'}</td>
                    <td>{calculateWorkHours(report.clock_in, report.clock_out)}</td>
                    <td>{report.manual_reason || 'דיווח ידני'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="approve-btn"
                          onClick={() => approveReport(report.id)}
                        >
                          ✓ אשר
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => rejectReport(report.id)}
                        >
                          ✕ דחה
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManagementScreen;
