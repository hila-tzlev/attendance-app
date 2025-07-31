import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import Layout from '../components/Layout/Layout';

const ManualUpdateScreen = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('employeeId');
  const [reports, setReports] = useState([
    {
      dateIn: new Date().toISOString().split('T')[0],
      timeIn: '',
      dateOut: new Date().toISOString().split('T')[0],
      timeOut: '',
    },
  ]);
  const [toastMessage, setToastMessage] = useState(null);
  const [showBackModal, setShowBackModal] = useState(false);

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

    // אם שדה הכניסה השתנה, עדכן את שעת היציאה לדקה אחת אחרי
    if (field === 'timeIn' && value) {
      const [hours, minutes] = value.split(':').map(Number);
      const inTime = new Date();
      inTime.setHours(hours, minutes);
      inTime.setMinutes(inTime.getMinutes() + 1);
      const newTimeOut = `${inTime.getHours().toString().padStart(2, '0')}:${inTime.getMinutes().toString().padStart(2, '0')}`;
      updatedReports[index].timeOut = newTimeOut;
    }

    // בדיקת תקינות תאריך ושעת יציאה
    if ((field === 'timeOut' || field === 'dateOut') && updatedReports[index].timeIn) {
      const inDateTime = new Date(`${updatedReports[index].dateIn}T${updatedReports[index].timeIn}:00`);
      const outDateTime = new Date(`${updatedReports[index].dateOut}T${updatedReports[index].timeOut || '00:00'}:00`);

      if (outDateTime < inDateTime) {
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
        if (diffMs < 60000) { // פחות מדקה
          setToastMessage('שעת היציאה חייבת להיות לפחות דקה אחרי שעת הכניסה');
          updatedReports[index].timeOut = '';
        }
      }
    }

    setReports(updatedReports);
  };

  const isReportValid = (report) => {
    return report.dateIn && report.timeIn && report.dateOut && report.timeOut;
  };

  const calculateHours = (report) => {
    if (!report.timeIn || !report.timeOut) return '0 שעות';
    const [inHours, inMinutes] = report.timeIn.split(':').map(Number);
    const [outHours, outMinutes] = report.timeOut.split(':').map(Number);
    const inTime = new Date(2000, 0, 1, inHours, inMinutes);
    const outTime = new Date(2000, 0, 1, outHours, outMinutes);
    const diffMs = outTime - inTime;
    if (diffMs < 0) return 'שגיאה: שעת היציאה מוקדמת משעת הכניסה';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours} שעות ו-${minutes} דקות`;
  };

  const isReportTimeValid = (report) => {
    if (!report.timeIn || !report.timeOut || !report.dateIn || !report.dateOut) return true;
    const inDateTime = new Date(`${report.dateIn}T${report.timeIn}:00`);
    const outDateTime = new Date(`${report.dateOut}T${report.timeOut}:00`);
    return outDateTime > inDateTime;
  };

  const isReportFullyValid = (report) => {
    if (!isReportValid(report)) return false;

    const inDateTime = new Date(`${report.dateIn}T${report.timeIn}:00`);
    const outDateTime = new Date(`${report.dateOut}T${report.timeOut}:00`);

    // בדיקת תקינות התאריכים והשעות
    if (outDateTime <= inDateTime) return false;

    // אם התאריכים זהים, בדיקת הפרש של לפחות דקה
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
      // Convert reports to the desired format
      const reportsToSend = reports.map(report => ({
        dateIn: report.dateIn,
        timeIn: report.timeIn,
        dateOut: report.dateOut,
        timeOut: report.timeOut,
      }));
  
      // Make the API call to save the manual reports
      const response = await fetch('http://localhost:5000/api/reports/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: sessionStorage.getItem('userId'),
          clockIn: reports[0].dateIn + 'T' + reports[0].timeIn + ':00',
          clockOut: reports[0].dateOut + 'T' + reports[0].timeOut + ':00',
          reason: 'דיווח ידני',
          latitude: null,
          longitude: null
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Manual reports saved:', data);
  
      setToastMessage('הדיווח נשמר ויועבר לאישור מנהל');
      setTimeout(() => {
        navigate('/home');
      }, 5000);
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

  const confirmBack = () => {
    setShowBackModal(false);
    navigate('/home');
  };

  const cancelBack = () => {
    setShowBackModal(false);
  };

  return (
    <Layout>
      <h1 className="title">עדכון ידני של דיווח שעות</h1>
      <div className="welcome-message" style={{ textAlign: 'center' }}>
        {reports.map((report, index) => (
          <div key={index} className="report-entry">
            <div className="report-row">
              <label>כניסה:</label>
              <input
                type="date"
                value={report.dateIn}
                onChange={(e) => updateReport(index, 'dateIn', e.target.value)}
                required
                className="styled-input"
              />
              <input
                type="time"
                value={report.timeIn}
                onChange={(e) => updateReport(index, 'timeIn', e.target.value)}
                required
                className="styled-input"
              />
            </div>
            <div className="report-row">
              <label>יציאה:</label>
              <input
                type="date"
                value={report.dateOut}
                onChange={(e) => updateReport(index, 'dateOut', e.target.value)}
                required
                className="styled-input"
              />
              <input
                type="time"
                value={report.timeOut}
                onChange={(e) => updateReport(index, 'timeOut', e.target.value)}
                required
                className="styled-input"
              />
            </div>
            <p>סך השעות: {calculateHours(report)}</p>
            {reports.length > 1 && (
              <span
                className="remove-icon"
                onClick={() => removeReport(index)}
                title="הסרת דיווח"
              >
                −
              </span>
            )}
          </div>
        ))}
        <span
          className="add-icon"
          onClick={addReport}
          title="הוספת דיווח"
        >
          +
        </span>
      </div>
      <Button 
        title="שמור עדכון" 
        onClick={handleSave} 
        disabled={!areAllReportsValid()}
        style={{ opacity: areAllReportsValid() ? 1 : 0.5, cursor: areAllReportsValid() ? 'pointer' : 'not-allowed' }}
      />
      <Button title="חזור" onClick={handleBack} />
      {toastMessage && (
        <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
      <ConfirmationModal
        isOpen={showBackModal}
        message="האם אתה בטוח שברצונך לחזור ללא שמירת הדיווח?"
        onConfirm={confirmBack}
        onCancel={cancelBack}
      />
    </Layout>
  );
};

export default ManualUpdateScreen;