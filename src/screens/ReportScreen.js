
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';

const AttendanceReportsScreen = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = sessionStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    fetchUserReports();
  }, [userId, navigate]);

  const fetchUserReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/attendance/logs`);
      
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

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return 'מאושר';
      case 'PENDING': return 'ממתין לאישור';
      case 'REJECTED': return 'נדחה';
      default: return status;
    }
  };

  return (
    <Layout>
      <div className="reports-container">
        <div className="reports-header">
          <h1>דוחות נוכחות</h1>
          <Button onClick={() => navigate('/home')}>
            חזרה לעמוד הבית
          </Button>
        </div>

        {loading ? (
          <p>טוען נתונים...</p>
        ) : (
          <div className="reports-list">
            {reports.length === 0 ? (
              <p>אין דוחות נוכחות</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="report-card">
                  <div className="report-info">
                    <span className="report-date">{formatDate(report.clock_in)}</span>
                    <span className="report-times">
                      כניסה: {formatTime(report.clock_in)}
                      {report.clock_out && ` | יציאה: ${formatTime(report.clock_out)}`}
                    </span>
                    <span className="report-hours">
                      {calculateWorkHours(report.clock_in, report.clock_out)}
                    </span>
                    <span className="report-status">
                      סטטוס: {getStatusText(report.status)}
                    </span>
                    {report.is_manual_entry && (
                      <span className="manual-entry">
                        דיווח ידני
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceReportsScreen;
