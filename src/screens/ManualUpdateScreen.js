
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import Layout from '../components/Layout/Layout';
import './ManualUpdateScreen.css';

const ManualUpdateScreen = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!sessionStorage.getItem('employeeId');
  const [reports, setReports] = useState([
    {
      dateIn: new Date().toISOString().split('T')[0],
      timeIn: '',
      dateOut: new Date().toISOString().split('T')[0],
      timeOut: '',
      reason: '',
    },
  ]);
  const [toastMessage, setToastMessage] = useState(null);
  const [showBackModal, setShowBackModal] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Error getting location:', error);
        }
      );
    }
  }, []);

  if (!isLoggedIn) {
    navigate('/');
    return null;
  }

  const addReport = () => {
    const lastReport = reports[reports.length - 1];
    if (!isReportValid(lastReport)) {
      setToastMessage('יש למלא את כל השדות בדיווח הנוכחי לפני הוספת דיווח חדש');
      return;
    }
    setReports([
      ...reports,
      {
        dateIn: new Date().toISOString().split('T')[0],
        timeIn: '',
        dateOut: new Date().toISOString().split('T')[0],
        timeOut: '',
        reason: '',
      },
    ]);
  };

  const removeReport = (index) => {
    if (reports.length === 1) return;
    setReports(reports.filter((_, i) => i !== index));
  };

  const updateReport = (index, field, value) => {
    const updatedReports = [...reports];
    updatedReports[index][field] = value;

    if (field === 'dateIn' || field === 'timeIn') {
      const now = new Date();
      const selectedDateTime = new Date(`${updatedReports[index].dateIn}T${updatedReports[index].timeIn || '00:00'}:00`);
      
      if (selectedDateTime > now) {
        setToastMessage('לא ניתן לדווח על תאריך או שעה עתידיים');
        if (field === 'dateIn') {
          updatedReports[index].dateIn = new Date().toISOString().split('T')[0];
        } else {
          updatedReports[index].timeIn = '';
        }
        setReports(updatedReports);
        return;
      }
    }

    if (field === 'timeIn' && value) {
      const [hours, minutes] = value.split(':').map(Number);
      const inTime = new Date();
      inTime.setHours(hours, minutes);
      inTime.setMinutes(inTime.getMinutes() + 1);
      const newTimeOut = `${inTime.getHours().toString().padStart(2, '0')}:${inTime.getMinutes().toString().padStart(2, '0')}`;
      updatedReports[index].timeOut = newTimeOut;
    }

    if ((field === 'timeOut' || field === 'dateOut') && updatedReports[index].timeIn) {
      const inDateTime = new Date(`${updatedReports[index].dateIn}T${updatedReports[index].timeIn}:00`);
      const outDateTime = new Date(`${updatedReports[index].dateOut}T${updatedReports[index].timeOut || '00:00'}:00`);
      const now = new Date();

      if (outDateTime > now) {
        setToastMessage('לא ניתן לדווח על תאריך או שעה עתידיים');
        if (field === 'dateOut') {
          updatedReports[index].dateOut = updatedReports[index].dateIn;
        } else {
          updatedReports[index].timeOut = '';
        }
      } else if (outDateTime < inDateTime) {
        setToastMessage('תאריך ושעת היציאה חייבים להיות אחרי תאריך ושעת הכניסה');
        if (field === 'dateOut') {
          updatedReports[index].dateOut = updatedReports[index].dateIn;
        } else {
          updatedReports[index].timeOut = '';
        }
      } else if (field === 'timeOut' && updatedReports[index].dateIn === updatedReports[index].dateOut) {
        const inTime = new Date(`2000-01-01T${updatedReports[index].timeIn}:00`);
        const outTime = new Date(`2000-01-01T${value}:00`);
        const diffMs = outTime - inTime;
        if (diffMs < 60000) {
          setToastMessage('שעת היציאה חייבת להיות לפחות דקה אחרי שעת הכניסה');
          updatedReports[index].timeOut = '';
        }
      }
    }

    setReports(updatedReports);
  };

  const isReportValid = (report) => {
    return report.dateIn && report.timeIn && report.dateOut && report.timeOut && report.reason && report.reason.trim().length > 0;
  };

  const calculateHours = (report) => {
    if (!report.timeIn || !report.timeOut) return '0 שעות';
    const inDateTime = new Date(`${report.dateIn}T${report.timeIn}:00`);
    const outDateTime = new Date(`${report.dateOut}T${report.timeOut}:00`);
    const diffMs = outDateTime - inDateTime;
    if (diffMs < 0) return 'שגיאה';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} שעות ו-${minutes} דקות`;
  };

  const isReportFullyValid = (report) => {
    if (!isReportValid(report)) return false;
    const inDateTime = new Date(`${report.dateIn}T${report.timeIn}:00`);
    const outDateTime = new Date(`${report.dateOut}T${report.timeOut}:00`);
    const now = new Date();
    
    if (inDateTime > now || outDateTime > now) return false;
    if (outDateTime <= inDateTime) return false;
    if (report.dateIn === report.dateOut) {
      const inTime = new Date(`2000-01-01T${report.timeIn}:00`);
      const outTime = new Date(`2000-01-01T${report.timeOut}:00`);
      if (outTime - inTime < 60000) return false;
    }
    return true;
  };

  const areAllReportsValid = () => {
    return reports.every(report => isReportFullyValid(report));
  };

  const handleSave = async () => {
    if (!areAllReportsValid()) {
      setToastMessage('לא ניתן לשמור דיווחים עם נתונים שגויים או חסרים');
      return;
    }
  
    try {
      const response = await fetch('/api/reports/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: sessionStorage.getItem('userId'),
          clockIn: reports[0].dateIn + 'T' + reports[0].timeIn + ':00',
          clockOut: reports[0].dateOut + 'T' + reports[0].timeOut + ':00',
          reason: reports[0].reason,
          latitude: location.latitude,
          longitude: location.longitude
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      setToastMessage('הדיווח נשמר ויועבר לאישור מנהל');
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (error) {
      console.error('Error saving manual reports:', error);
      setToastMessage('שגיאה בשמירת הדיווח. אנא נסה שוב.');
    }
  };

  const handleBack = () => {
    const hasData = reports.some(
      (report) =>
        report.dateIn !== new Date().toISOString().split('T')[0] ||
        report.timeIn ||
        report.dateOut !== new Date().toISOString().split('T')[0] ||
        report.timeOut
    );
    if (hasData) {
      setShowBackModal(true);
    } else {
      navigate('/home');
    }
  };

  return (
    <Layout>
      <div className="manual-update-container">
        <button className="back-arrow" onClick={handleBack} title="חזרה">
          ← חזור
        </button>
        
        <h1 className="title">עדכון ידני של דיווח שעות</h1>
        
        <div className="reports-list">
          {reports.map((report, index) => (
            <div key={index} className="report-entry">
              <div className="report-header">
                <h3>דיווח {index + 1}</h3>
                {reports.length > 1 && (
                  <button
                    className="remove-btn"
                    onClick={() => removeReport(index)}
                    title="הסרת דיווח"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className="report-fields">
                <div className="field-group">
                  <label>תאריך כניסה:</label>
                  <input
                    type="date"
                    value={report.dateIn}
                    onChange={(e) => updateReport(index, 'dateIn', e.target.value)}
                    className="date-input"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="field-group">
                  <label>שעת כניסה:</label>
                  <input
                    type="time"
                    value={report.timeIn}
                    onChange={(e) => updateReport(index, 'timeIn', e.target.value)}
                    className="time-input"
                  />
                </div>
                
                <div className="field-group">
                  <label>תאריך יציאה:</label>
                  <input
                    type="date"
                    value={report.dateOut}
                    onChange={(e) => updateReport(index, 'dateOut', e.target.value)}
                    className="date-input"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="field-group">
                  <label>שעת יציאה:</label>
                  <input
                    type="time"
                    value={report.timeOut}
                    onChange={(e) => updateReport(index, 'timeOut', e.target.value)}
                    className="time-input"
                  />
                </div>
                
                <div className="field-group field-full-width">
                  <label>סיבת הדיווח (חובה):</label>
                  <textarea
                    value={report.reason}
                    onChange={(e) => updateReport(index, 'reason', e.target.value)}
                    className="reason-input"
                    placeholder="נא למלא את הסיבה לדיווח ידני..."
                    rows="3"
                    required
                  />
                </div>
              </div>
              
              <div className="report-summary">
                סך השעות: {calculateHours(report)}
              </div>
            </div>
          ))}
        </div>
        
        <button className="add-report-btn" onClick={addReport}>
          + הוסף דיווח נוסף
        </button>
        
        <div className="action-buttons">
          <Button 
            title="שמור עדכון" 
            onClick={handleSave} 
            disabled={!areAllReportsValid()}
          />
        </div>
      </div>
      
      {toastMessage && (
        <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
      
      <ConfirmationModal
        isOpen={showBackModal}
        message="האם אתה בטוח שברצונך לחזור ללא שמירת הדיווח?"
        onConfirm={() => {
          setShowBackModal(false);
          navigate('/home');
        }}
        onCancel={() => setShowBackModal(false)}
      />
    </Layout>
  );
};

export default ManualUpdateScreen;
