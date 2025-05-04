import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import Layout from '../components/Layout/Layout';

const HomeScreen = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('employeeId');
  const hasClockedIn = localStorage.getItem('clockedIn') === 'true';
  const isManager = localStorage.getItem('isManager') === 'true';
  const [showModal, setShowModal] = useState(false);
  const [lastClockInTime, setLastClockInTime] = useState(null);
  const [timeLoggedIn, setTimeLoggedIn] = useState(0); // זמן מחובר בשניות
  const [greeting, setGreeting] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // טעינת זמן הכניסה האחרונה
  useEffect(() => {
    const storedTime = localStorage.getItem('lastClockInTime');
    if (storedTime) {
      setLastClockInTime(new Date(storedTime));
      const elapsed = Math.floor((new Date() - new Date(storedTime)) / 1000);
      setTimeLoggedIn(elapsed);
    }
  }, []);

  // טיימר לעדכון זמן מחובר
  useEffect(() => {
    if (lastClockInTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((new Date() - lastClockInTime) / 1000);
        setTimeLoggedIn(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lastClockInTime]);

  // חישוב ברכה לפי שעה
  useEffect(() => {
    if (isLoggedIn) {
      const hour = new Date().getHours();
      let greetingText = '';
      if (hour >= 5 && hour < 12) {
        greetingText = 'בוקר טוב';
      } else if (hour >= 12 && hour < 17) {
        greetingText = 'צהריים טובים';
      } else if (hour >= 17 && hour < 22) {
        greetingText = 'ערב טוב';
      } else {
        greetingText = 'לילה טוב';
      }
      const employeeName = localStorage.getItem('employeeName') || 'עובד';
      setGreeting(`${greetingText}, ${employeeName}`);
    }
  }, [isLoggedIn]);

  const formatTimeLoggedIn = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleButtonClick = () => {
    if (isLoggedIn) {
      localStorage.removeItem('employeeId');
      localStorage.removeItem('employeeName');
      localStorage.removeItem('isManager');
      localStorage.removeItem('clockedIn');
      localStorage.removeItem('lastClockInTime');
      setLastClockInTime(null);
      setTimeLoggedIn(0);
      navigate('/');
    } else {
      navigate('/');
    }
  };

  const handleClockInOut = () => {
    if (isLoggedIn) {
      const newState = !hasClockedIn;
      if (newState) {
        const now = new Date();
        localStorage.setItem('lastClockInTime', now);
        setLastClockInTime(now);
        setTimeLoggedIn(0);
        setToastMessage('כניסה בוצעה בהצלחה');
      } else {
        localStorage.removeItem('lastClockInTime');
        setLastClockInTime(null);
        setTimeLoggedIn(0);
        setToastMessage('יציאה בוצעה בהצלחה');
      }
      localStorage.setItem('clockedIn', newState.toString());
    } else {
      setToastMessage('עליך להתחבר תחילה!');
    }
  };

  const goToAttendanceReports = () => {
    if (isLoggedIn) {
      navigate('/attendance-reports');
    } else {
      setToastMessage('עליך להתחבר תחילה!');
    }
  };

  const goToManualUpdate = () => {
    if (isLoggedIn) {
      setShowModal(true);
    } else {
      setToastMessage('עליך להתחבר תחילה!');
    }
  };

  const handleConfirmManualUpdate = () => {
    setShowModal(false);
    navigate('/manual-update');
  };

  const handleCancelManualUpdate = () => {
    setShowModal(false);
  };

  const goToManagement = () => {
    if (isManager) {
      navigate('/management');
    } else {
      setToastMessage('אין לך הרשאות ניהול!');
    }
  };

  return (
    <Layout>
      <h1 className="title">מסך ראשי</h1>
      {isLoggedIn ? (
        <div>
          <p className="welcome-message">{greeting}</p>
          {lastClockInTime && (
            <p className="login-details">
              כניסה אחרונה: {lastClockInTime.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
              <br />
              זמן מחובר: {formatTimeLoggedIn(timeLoggedIn)}
            </p>
          )}
        </div>
      ) : (
        <p className="welcome-message">אנא התחבר כדי להמשיך.</p>
      )}
      {isLoggedIn && (
        <>
          <Button title={hasClockedIn ? 'יציאה' : 'כניסה'} onClick={handleClockInOut} />
          <Button title="צפייה בדיווחי נוכחות" onClick={goToAttendanceReports} />
          <Button title="עדכון ידני" onClick={goToManualUpdate} />
          {isManager && (
            <Button title="למסך ניהול" onClick={goToManagement} />
          )}
        </>
      )}
      <Button title="התנתקות" onClick={handleButtonClick} />

      <ConfirmationModal
        isOpen={showModal}
        message="זהו עדכון חריג! הפרטים יועברו למנהל לאישור. האם להמשיך?"
        onConfirm={handleConfirmManualUpdate}
        onCancel={handleCancelManualUpdate}
      />
      {toastMessage && (
        <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
};

export default HomeScreen;