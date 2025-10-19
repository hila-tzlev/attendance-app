
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Loader from '../components/Loader/Loader';
import './ManagementScreen.css';

const ManagementScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('myReports');
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const employeeId = sessionStorage.getItem('employeeId');
  const userId = sessionStorage.getItem('userId');

  useEffect(() => {
    if (activeTab === 'myReports') {
      loadMyReports();
    } else {
      loadPendingApprovals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadMyReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/logs');
      if (response.ok) {
        const allReports = await response.json();
        const userReports = allReports.filter(report => report.user_id === parseInt(userId));
        setMyReports(userReports);
      }
    } catch (error) {
      console.error('Error loading my reports:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatLocation = (latitude, longitude) => {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) return '-';
    return (
      <a 
        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="location-link"
        title="פתח במפות גוגל"
      >
        📍 מיקום
      </a>
    );
  };

  if (!employeeId) {
    navigate('/');
    return null;
  }

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
      <div className="management-container">
        <button className="back-arrow" onClick={() => navigate('/home')} title="חזרה">
          ←
        </button>
        
        <div className="management-header">
          <h1>ניהול</h1>
        </div>

        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'myReports' ? 'active' : ''}`}
            onClick={() => setActiveTab('myReports')}
          >
            📊 הדיווחים שלי
          </button>
          <button 
            className={`tab ${activeTab === 'employeeManagement' ? 'active' : ''}`}
            onClick={() => setActiveTab('employeeManagement')}
          >
            👥 ניהול עובדים
          </button>
        </div>

        <div className={`tab-content ${activeTab === 'myReports' ? 'active' : ''}`}>
        {activeTab === 'myReports' && (
          <>
          {loading ? (
            <Loader size="medium" color="green" />
          ) : myReports.length === 0 ? (
            <p className="no-data">אין דוחות נוכחות</p>
          ) : (
            <>
            <div className="table-wrapper">
              <table className="management-table">
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
                  {myReports.map((report) => (
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
            
            <div className="report-cards-container">
              {myReports.map((report) => (
                <div key={report.id} className="report-card">
                  <div className="report-card-header">
                    <span className="report-card-title">{formatDate(report.clock_in)}</span>
                    {report.is_manual_entry ? (
                      <span className="manual-badge">ידני</span>
                    ) : (
                      <span className="auto-badge">אוטומטי</span>
                    )}
                  </div>
                  <div className="report-card-row">
                    <span className="report-card-label">שעת כניסה:</span>
                    <span className="report-card-value">{formatTime(report.clock_in)}</span>
                  </div>
                  <div className="report-card-row">
                    <span className="report-card-label">שעת יציאה:</span>
                    <span className="report-card-value">{report.clock_out ? formatTime(report.clock_out) : '-'}</span>
                  </div>
                  <div className="report-card-row">
                    <span className="report-card-label">סה"כ שעות:</span>
                    <span className="report-card-value">{calculateWorkHours(report.clock_in, report.clock_out)}</span>
                  </div>
                  <div className="report-card-row">
                    <span className="report-card-label">סטטוס:</span>
                    <span className={`status-badge ${getStatusClass(report.status)}`}>
                      {getStatusText(report.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
          </>
        )}
        </div>
        
        <div className={`tab-content ${activeTab === 'employeeManagement' ? 'active' : ''}`}>
        {activeTab === 'employeeManagement' && (
          <>
          {loading ? (
            <Loader size="medium" color="green" />
          ) : pendingApprovals.length === 0 ? (
            <p className="no-data">אין דיווחים ממתינים לאישור</p>
          ) : (
            <>
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
                  <th>מיקום</th>
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
                    <td>{formatLocation(report.latitude, report.longitude)}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="approve-btn"
                          onClick={() => approveReport(report.id)}
                          title="אשר"
                        >
                          ✓
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => rejectReport(report.id)}
                          title="דחה"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="report-cards-container">
            {pendingApprovals.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-card-header">
                  <span className="report-card-title">{report.user_name || '-'}</span>
                  <span className="manual-badge">ידני</span>
                </div>
                <div className="report-card-row">
                  <span className="report-card-label">ת.ז:</span>
                  <span className="report-card-value">{report.employee_id || '-'}</span>
                </div>
                <div className="report-card-row">
                  <span className="report-card-label">תאריך:</span>
                  <span className="report-card-value">{formatDate(report.clock_in)}</span>
                </div>
                <div className="report-card-row">
                  <span className="report-card-label">כניסה:</span>
                  <span className="report-card-value">{formatTime(report.clock_in)}</span>
                </div>
                <div className="report-card-row">
                  <span className="report-card-label">יציאה:</span>
                  <span className="report-card-value">{report.clock_out ? formatTime(report.clock_out) : '-'}</span>
                </div>
                <div className="report-card-row">
                  <span className="report-card-label">סה"כ שעות:</span>
                  <span className="report-card-value">{calculateWorkHours(report.clock_in, report.clock_out)}</span>
                </div>
                <div className="report-card-row">
                  <span className="report-card-label">סיבה:</span>
                  <span className="report-card-value">{report.manual_reason || 'דיווח ידני'}</span>
                </div>
                <div className="report-card-row">
                  <span className="report-card-label">מיקום:</span>
                  <span className="report-card-value">{formatLocation(report.latitude, report.longitude)}</span>
                </div>
                <div className="report-card-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => approveReport(report.id)}
                    title="אשר"
                  >
                    ✓ אשר
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => rejectReport(report.id)}
                    title="דחה"
                  >
                    ✕ דחה
                  </button>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
          </>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default ManagementScreen;
