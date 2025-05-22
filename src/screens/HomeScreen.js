
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import ToastNotification from '../components/ToastNotification/ToastNotification';
import Layout from '../components/Layout/Layout';
import prisma from '../lib/prisma';

const HomeScreen = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [hasClockedIn, setHasClockedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastClockInTime, setLastClockInTime] = useState(null);
  const [timeLoggedIn, setTimeLoggedIn] = useState(0);
  const [greeting, setGreeting] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      const employeeId = sessionStorage.getItem('employeeId');
      if (!employeeId) {
        navigate('/');
        return;
      }

      try {
        const userData = await prisma.user.findUnique({
          where: { employeeId },
          include: {
            attendances: {
              orderBy: { clockIn: 'desc' },
              take: 1
            }
          }
        });

        if (userData) {
          setUser(userData);
          const lastAttendance = userData.attendances[0];
          if (lastAttendance && !lastAttendance.clockOut) {
            setHasClockedIn(true);
            setLastClockInTime(new Date(lastAttendance.clockIn));
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setToastMessage('שגיאה בטעינת נתוני משתמש');
      }
    };

    loadUserData();
  }, [navigate]);

  useEffect(() => {
    if (lastClockInTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((new Date() - lastClockInTime) / 1000);
        setTimeLoggedIn(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lastClockInTime]);

  useEffect(() => {
    if (user) {
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
      setGreeting(`${greetingText}, ${user.name}`);
    }
  }, [user]);

  const handleClockInOut = async () => {
    if (!user) return;

    try {
      if (!hasClockedIn) {
        // Clock In
        const attendance = await prisma.attendance.create({
          data: {
            userId: user.id,
            clockIn: new Date()
          }
        });
        setLastClockInTime(new Date(attendance.clockIn));
        setHasClockedIn(true);
        setToastMessage('כניסה בוצעה בהצלחה');
      } else {
        // Clock Out
        await prisma.attendance.updateMany({
          where: {
            userId: user.id,
            clockOut: null
          },
          data: {
            clockOut: new Date()
          }
        });
        setLastClockInTime(null);
        setHasClockedIn(false);
        setToastMessage('יציאה בוצעה בהצלחה');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setToastMessage('שגיאה בעדכון הנוכחות');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('employeeId');
    navigate('/');
  };

  const formatTimeLoggedIn = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <h1 className="title">מסך ראשי</h1>
      {user ? (
        <div>
          <p className="welcome-message">{greeting}</p>
          {lastClockInTime && (
            <p className="login-details">
              כניסה אחרונה: {lastClockInTime.toLocaleString('he-IL')}
              <br />
              זמן מחובר: {formatTimeLoggedIn(timeLoggedIn)}
            </p>
          )}
          <Button title={hasClockedIn ? 'יציאה' : 'כניסה'} onClick={handleClockInOut} />
          <Button title="צפייה בדיווחי נוכחות" onClick={() => navigate('/report-screen')} />
          <Button title="עדכון ידני" onClick={() => setShowModal(true)} />
          {user.isManager && (
            <Button title="למסך ניהול" onClick={() => navigate('/management')} />
          )}
        </div>
      ) : (
        <p className="welcome-message">אנא התחבר כדי להמשיך.</p>
      )}
      <Button title="התנתקות" onClick={handleLogout} />

      <ConfirmationModal
        isOpen={showModal}
        message="זהו עדכון חריג! הפרטים יועברו למנהל לאישור. האם להמשיך?"
        onConfirm={() => {
          setShowModal(false);
          navigate('/manual-update');
        }}
        onCancel={() => setShowModal(false)}
      />
      {toastMessage && (
        <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
};

export default HomeScreen;
