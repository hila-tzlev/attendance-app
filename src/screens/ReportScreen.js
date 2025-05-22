
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';
import prisma from '../lib/prisma';

const AttendanceReportsScreen = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const employeeId = sessionStorage.getItem('employeeId');

  useEffect(() => {
    if (!employeeId) {
      navigate('/');
      return;
    }

    const fetchReports = async () => {
      try {
        const user = await prisma.user.findUnique({
          where: { employeeId },
          include: {
            attendances: {
              orderBy: { clockIn: 'desc' }
            }
          }
        });
        setReports(user?.attendances || []);
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchReports();
  }, [employeeId, navigate]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('he-IL');
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Layout>
      <div className="login-container">
        <h1 className="title">דיווחי נוכחות</h1>
        <div className="welcome-message" style={{ textAlign: 'left', width: '80%' }}>
          {reports.length > 0 ? (
            reports.map((report, index) => (
              <p key={index}>
                תאריך: {formatDate(report.clockIn)}, 
                כניסה: {formatTime(report.clockIn)}, 
                יציאה: {report.clockOut ? formatTime(report.clockOut) : 'טרם דווח'}
              </p>
            ))
          ) : (
            <p>אין דיווחי נוכחות להצגה</p>
          )}
        </div>
        <Button title="חזור" onClick={() => navigate('/home')} style={{ marginTop: '20px' }} />
      </div>
    </Layout>
  );
};

export default AttendanceReportsScreen;
