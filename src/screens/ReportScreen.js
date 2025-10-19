
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import './ReportScreen.css';

const AttendanceReportsScreen = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = sessionStorage.getItem('userId');

  const fetchUserReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/logs');
      
      if (response.ok) {
        const allReports = await response.json();
        const userReports = allReports.filter(report => report.user_id === parseInt(userId));
        setReports(userReports);
      } else {
        console.error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    fetchUserReports();
  }, [userId, navigate, fetchUserReports]);

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

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return 'מאושר';
      case 'PENDING': return 'ממתין';
      case 'REJECTED': return 'נדחה';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'status-approved';
      case 'PENDING': return 'status-pending';
      case 'REJECTED': return 'status-rejected';
      default: return '';
    }
  };

  return (
    <Layout>
      <div className="reports-container">
        <button className="back-arrow" onClick={() => navigate('/home')} title="חזרה">
          ← חזור
        </button>
        
        <div className="reports-header">
          <h1>דוחות נוכחות</h1>
        </div>

        {loading ? (
          <p className="loading-text">טוען נתונים...</p>
        ) : reports.length === 0 ? (
          <p className="no-data">אין דוחות נוכחות</p>
        ) : (
          <div className="table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>שעת כניסה</th>
                  <th>שעת יציאה</th>
                  <th>סה"כ שעות</th>
                  <th>סטטוס</th>
                  <th>סוג</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{formatDate(report.clock_in)}</td>
                    <td>{formatTime(report.clock_in)}</td>
                    <td>{report.clock_out ? formatTime(report.clock_out) : '-'}</td>
                    <td>{calculateWorkHours(report.clock_in, report.clock_out)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(report.status)}`}>
                        {getStatusText(report.status)}
                      </span>
                    </td>
                    <td>
                      {report.is_manual_entry ? (
                        <span className="manual-badge">ידני</span>
                      ) : (
                        <span className="auto-badge">אוטומטי</span>
                      )}
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

export default AttendanceReportsScreen;
