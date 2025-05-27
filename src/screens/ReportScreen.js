
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';

const AttendanceReportsScreen = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const employeeId = sessionStorage.getItem('employeeId');

  useEffect(() => {
    if (!employeeId) {
      navigate('/');
      return;
    }

    const fetchReports = () => {
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      const userReports = attendanceRecords.filter(record => record.employeeId === employeeId);
      setReports(userReports);
    };

    fetchReports();
  }, [employeeId, navigate]);

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

  return (
    <Layout>
      <div className="reports-container">
        <div className="reports-header">
          <h1>דוחות נוכחות</h1>
          <Button onClick={() => navigate('/home')}>
            חזרה לעמוד הבית
          </Button>
        </div>

        <div className="reports-list">
          {reports.length === 0 ? (
            <p>אין דוחות נוכחות</p>
          ) : (
            reports.map((report, index) => (
              <div key={index} className="report-card">
                <div className="report-info">
                  <span className="report-date">{formatDate(report.clockIn)}</span>
                  <span className="report-times">
                    כניסה: {formatTime(report.clockIn)}
                    {report.clockOut && ` | יציאה: ${formatTime(report.clockOut)}`}
                  </span>
                  <span className="report-hours">
                    {calculateWorkHours(report.clockIn, report.clockOut)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceReportsScreen;
