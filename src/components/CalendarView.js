import React, { useState, useEffect } from 'react';
import './CalendarView.css';

const CalendarView = ({ attendanceData, employeeName }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    generateCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, attendanceData]);

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    const days = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevLastDate - i),
        isCurrentMonth: false
      });
    }

    for (let i = 1; i <= lastDateOfMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    setCalendarDays(days);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthName = (date) => {
    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    return months[date.getMonth()];
  };

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getAttendanceForDate = (date) => {
    if (!attendanceData || attendanceData.length === 0) return null;
    
    const dateKey = formatDateKey(date);
    return attendanceData.find(record => {
      const recordDate = new Date(record.clock_in);
      const recordKey = formatDateKey(recordDate);
      return recordKey === dateKey;
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateWorkHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '-';
    
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diff = end - start;
    
    if (diff <= 0) return '-';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${String(minutes).padStart(2, '0')}`;
  };

  const getStatusClass = (status) => {
    if (!status) return '';
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'status-approved';
      case 'PENDING':
        return 'status-pending';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return '';
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const weekDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="nav-btn" onClick={goToPreviousMonth} title="חודש קודם">
            ◀
          </button>
          <button className="today-btn" onClick={goToToday}>
            היום
          </button>
          <button className="nav-btn" onClick={goToNextMonth} title="חודש הבא">
            ▶
          </button>
        </div>
        <div className="calendar-title">
          <h2>{getMonthName(currentDate)} {currentDate.getFullYear()}</h2>
          {employeeName && <p className="employee-name-display">{employeeName}</p>}
        </div>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {weekDays.map((day, index) => (
            <div key={index} className="weekday-header">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {calendarDays.map((day, index) => {
            const attendance = getAttendanceForDate(day.date);
            const hasAttendance = attendance !== null;

            return (
              <div
                key={index}
                className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${
                  isToday(day.date) ? 'today' : ''
                } ${hasAttendance ? 'has-attendance' : ''}`}
              >
                <div className="day-number">{day.date.getDate()}</div>
                
                {hasAttendance && day.isCurrentMonth && (
                  <div className={`attendance-info ${getStatusClass(attendance.status)}`}>
                    <div className="attendance-time">
                      <span className="time-label">כניסה:</span>
                      <span className="time-value">{formatTime(attendance.clock_in)}</span>
                    </div>
                    <div className="attendance-time">
                      <span className="time-label">יציאה:</span>
                      <span className="time-value">{formatTime(attendance.clock_out)}</span>
                    </div>
                    <div className="attendance-hours">
                      {calculateWorkHours(attendance.clock_in, attendance.clock_out)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color status-approved"></span>
          <span>אושר</span>
        </div>
        <div className="legend-item">
          <span className="legend-color status-pending"></span>
          <span>ממתין</span>
        </div>
        <div className="legend-item">
          <span className="legend-color status-rejected"></span>
          <span>נדחה</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
