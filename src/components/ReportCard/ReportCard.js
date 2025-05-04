import React from 'react';
import './ReportCard.css';

const ReportCard = ({ report }) => {
  return (
    <div className="report-card">
      <p><strong>מספר זהות:</strong> {report.employee_id}</p>
      <p><strong>כניסה:</strong> {report.entry_time}</p>
      <p><strong>יציאה:</strong> {report.exit_time || 'עדיין לא יצא'}</p>
    </div>
  );
};

export default ReportCard;