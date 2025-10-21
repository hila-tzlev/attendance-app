
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout/Layout';
import Loader from '../components/Loader/Loader';
import './ReportScreen.css';

const AttendanceReportsScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('myReports');
  const [myReports, setMyReports] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = sessionStorage.getItem('userId');
  const isManager = sessionStorage.getItem('isManager') === 'true';

  const fetchMyReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/logs');
      
      if (response.ok) {
        const allReports = await response.json();
        const userReports = allReports.filter(report => report.user_id === parseInt(userId));
        setMyReports(userReports);
      }
    } catch (error) {
      console.error('Error fetching my reports:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchPendingApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/logs?status=PENDING');
      if (response.ok) {
        const logs = await response.json();
        const filteredLogs = logs.filter(log => log.user_id !== parseInt(userId));
        setPendingApprovals(filteredLogs);
      }
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    if (activeTab === 'myReports') {
      fetchMyReports();
    } else if (activeTab === 'pendingApprovals') {
      fetchPendingApprovals();
    } else if (activeTab === 'employees') {
      fetchEmployees();
    }
  }, [userId, navigate, activeTab, fetchMyReports, fetchPendingApprovals, fetchEmployees]);

  const approveReport = async (id) => {
    try {
      const report = pendingApprovals.find(r => r.id === id);
      if (report && report.user_id === parseInt(userId)) {
        toast.error('לא ניתן לאשר דיווחים עצמיים');
        return;
      }

      const response = await fetch(`/api/attendance/status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'APPROVED',
          updatedBy: userId
        }),
      });

      if (response.ok) {
        setPendingApprovals(prev => prev.filter(report => report.id !== id));
        toast.success('דיווח אושר בהצלחה!');
      } else if (response.status === 403) {
        const error = await response.json();
        toast.error(error.error || 'לא ניתן לאשר דיווחים עצמיים');
      } else {
        toast.error('שגיאה באישור הדיווח');
      }
    } catch (error) {
      console.error('Error approving report:', error);
      toast.error('שגיאה באישור הדיווח');
    }
  };

  const rejectReport = async (id) => {
    try {
      const report = pendingApprovals.find(r => r.id === id);
      if (report && report.user_id === parseInt(userId)) {
        toast.error('לא ניתן לדחות דיווחים עצמיים');
        return;
      }

      const response = await fetch(`/api/attendance/status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REJECTED',
          updatedBy: userId
        }),
      });

      if (response.ok) {
        setPendingApprovals(prev => prev.filter(report => report.id !== id));
        toast.info('דיווח נדחה');
      }
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast.error('שגיאה בדחיית הדיווח');
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

  return (
    <Layout>
      <div className="reports-container">
        <button className="back-arrow" onClick={() => navigate('/home')} title="חזרה">
          ←
        </button>
        
        <div className="reports-header">
          <h1>דוחות וניהול נוכחות</h1>
        </div>

        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'myReports' ? 'active' : ''}`}
            onClick={() => setActiveTab('myReports')}
          >
            📊 הדיווחים שלי
          </button>
          {isManager && (
            <>
              <button 
                className={`tab ${activeTab === 'pendingApprovals' ? 'active' : ''}`}
                onClick={() => setActiveTab('pendingApprovals')}
              >
                ✅ אישור דיווחים ידניים
              </button>
              <button 
                className={`tab ${activeTab === 'employees' ? 'active' : ''}`}
                onClick={() => setActiveTab('employees')}
              >
                👥 רשימת עובדים
              </button>
            </>
          )}
        </div>

        {/* Tab 1: My Reports */}
        <div className={`tab-content ${activeTab === 'myReports' ? 'active' : ''}`}>
          {loading ? (
            <Loader size="medium" color="green" />
          ) : myReports.length === 0 ? (
            <p className="no-data">אין דוחות נוכחות</p>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>תאריך</th>
                      <th>כניסה</th>
                      <th>יציאה</th>
                      <th>שעות</th>
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
                      <span className="report-card-label">כניסה:</span>
                      <span className="report-card-value">{formatTime(report.clock_in)}</span>
                    </div>
                    <div className="report-card-row">
                      <span className="report-card-label">יציאה:</span>
                      <span className="report-card-value">{report.clock_out ? formatTime(report.clock_out) : '-'}</span>
                    </div>
                    <div className="report-card-row">
                      <span className="report-card-label">שעות:</span>
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
        </div>

        {/* Tab 2: Pending Approvals (Manager Only) */}
        {isManager && (
          <div className={`tab-content ${activeTab === 'pendingApprovals' ? 'active' : ''}`}>
            {loading ? (
              <Loader size="medium" color="green" />
            ) : pendingApprovals.length === 0 ? (
              <p className="no-data">אין דיווחים ממתינים לאישור</p>
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>עובד</th>
                        <th>ת.ז</th>
                        <th>תאריך</th>
                        <th>כניסה</th>
                        <th>יציאה</th>
                        <th>שעות</th>
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
                        <span className="report-card-label">שעות:</span>
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
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Employees (Manager Only) */}
        {isManager && (
          <div className={`tab-content ${activeTab === 'employees' ? 'active' : ''}`}>
            {loading ? (
              <Loader size="medium" color="green" />
            ) : employees.length === 0 ? (
              <p className="no-data">אין עובדים במערכת</p>
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>שם</th>
                        <th>ת.ז</th>
                        <th>מחלקה</th>
                        <th>תפקיד</th>
                        <th>תאריך הצטרפות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.id}>
                          <td>{employee.name}</td>
                          <td>{employee.employee_id}</td>
                          <td>{employee.department_name || '-'}</td>
                          <td>{employee.is_manager ? 'מנהל' : 'עובד'}</td>
                          <td>{formatDate(employee.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="report-cards-container">
                  {employees.map((employee) => (
                    <div key={employee.id} className="report-card">
                      <div className="report-card-header">
                        <span className="report-card-title">{employee.name}</span>
                        {employee.is_manager ? (
                          <span className="status-badge status-approved">מנהל</span>
                        ) : (
                          <span className="auto-badge">עובד</span>
                        )}
                      </div>
                      <div className="report-card-row">
                        <span className="report-card-label">ת.ז:</span>
                        <span className="report-card-value">{employee.employee_id}</span>
                      </div>
                      <div className="report-card-row">
                        <span className="report-card-label">מחלקה:</span>
                        <span className="report-card-value">{employee.department_name || '-'}</span>
                      </div>
                      <div className="report-card-row">
                        <span className="report-card-label">תאריך הצטרפות:</span>
                        <span className="report-card-value">{formatDate(employee.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceReportsScreen;
