import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import Layout from '../components/Layout/Layout';

const HomeScreen = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hasClockedIn, setHasClockedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastClockInTime, setLastClockInTime] = useState(null);
  const [timeLoggedIn, setTimeLoggedIn] = useState(0);
  const [greeting, setGreeting] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    const loadUserData = () => {
      const employeeId = sessionStorage.getItem('employeeId');
      if (!employeeId) {
        navigate('/');
        return;
      }

      const userName = sessionStorage.getItem('userName') || 'משתמש';
      const isManager = sessionStorage.getItem('isManager') === 'true';

      setUser({
        employeeId,
        name: userName,
        isManager
      });

      // בדיקה אם יש כניסה פעילה
      const clockInData = localStorage.getItem(`clockIn_${employeeId}`);
      if (clockInData) {
        const clockInTime = new Date(clockInData);
        setHasClockedIn(true);
        setLastClockInTime(clockInTime);
      }
    };

    loadUserData();
    updateGreeting();

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
  }, [navigate]);

  useEffect(() => {
    let interval;
    if (hasClockedIn && lastClockInTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - lastClockInTime) / 1000);
        setTimeLoggedIn(diff);
      }, 1000);
    } else {
      setTimeLoggedIn(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [hasClockedIn, lastClockInTime]);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('בוקר טוב');
    } else if (hour < 18) {
      setGreeting('צהריים טובים');
    } else {
      setGreeting('ערב טוב');
    }
  };

  const handleClockInOut = () => {
    if (!user) return;

    if (!hasClockedIn) {
      // כניסה
      const clockInTime = new Date();

      fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: sessionStorage.getItem('userId'),
          latitude: location.latitude,
          longitude: location.longitude,
          isManualEntry: false,
          manualReason: null
        }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
          localStorage.setItem(`clockIn_${user.employeeId}`, clockInTime.toISOString());
          setLastClockInTime(clockInTime);
          setHasClockedIn(true);
          setToastMessage('כניסה בוצעה בהצלחה');
      })
      .catch(error => {
        console.error('There was an error clocking in:', error);
        setToastMessage('שגיאה בעת ביצוע הכניסה');
      });


      // שמירת רשומת נוכחות
      const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
      attendanceRecords.push({
        employeeId: user.employeeId,
        clockIn: clockInTime.toISOString(),
        clockOut: null,
        date: clockInTime.toDateString()
      });
      localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
    } else {
      setShowModal(true);
    }
  };

  const confirmClockOut = () => {
    // יציאה
    const clockOutTime = new Date();

    fetch('/api/attendance/clock-out', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: sessionStorage.getItem('userId'),
        latitude: location.latitude,
        longitude: location.longitude
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
        localStorage.removeItem(`clockIn_${user.employeeId}`);
        setLastClockInTime(null);
        setHasClockedIn(false);
        setShowModal(false);
        setToastMessage('יציאה בוצעה בהצלחה');
    })
    .catch(error => {
      console.error('There was an error clocking out:', error);
      setToastMessage('שגיאה בעת ביצוע היציאה');
    });

    // עדכון רשומת הנוכחות
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]');
    const lastRecord = attendanceRecords.find(record => 
      record.employeeId === user.employeeId && !record.clockOut
    );
    if (lastRecord) {
      lastRecord.clockOut = clockOutTime.toISOString();
      localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('employeeId');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('isManager');
    navigate('/');
  };

  const formatTimeLoggedIn = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return <div>טוען...</div>;
  }

  return (
    <Layout>
      <div className="home-container">
        <div className="welcome-section">
          <h1>{greeting}, {user.name}!</h1>
          <p>מספר עובד: {user.employeeId}</p>
        </div>

        <div className="clock-section">
          <div className="current-time">
            <p>השעה הנוכחית: {new Date().toLocaleTimeString('he-IL')}</p>
          </div>

          {hasClockedIn && (
            <div className="time-logged">
              <p>זמן מחובר: {formatTimeLoggedIn(timeLoggedIn)}</p>
              <p>נכנסת בשעה: {lastClockInTime?.toLocaleTimeString('he-IL')}</p>
            </div>
          )}

          <Button 
            onClick={handleClockInOut}
            className={hasClockedIn ? 'clock-out-btn' : 'clock-in-btn'}
          >
            {hasClockedIn ? 'יציאה' : 'כניסה'}
          </Button>
        </div>

        <div className="navigation-section">
          <Button onClick={() => navigate(user.isManager ? '/management' : '/report-screen')}>
            דוחות נוכחות
          </Button>

          <Button onClick={() => navigate('/manual-update')}>
            דיווח ידני
          </Button>

          {user.isManager && (
            <Button onClick={() => navigate('/management')}>
              ניהול
            </Button>
          )}

          <Button onClick={handleLogout} className="logout-btn">
            התנתק
          </Button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        title="אישור יציאה"
        message="האם אתה בטוח שברצונך לצאת?"
        confirmText="יציאה"
        cancelText="ביטול"
        onConfirm={confirmClockOut}
        onCancel={() => setShowModal(false)}
      />

      {toastMessage && (
        <ToastNotification
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </Layout>
  );
};

export default HomeScreen;