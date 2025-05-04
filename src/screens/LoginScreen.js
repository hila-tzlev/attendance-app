import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input/Input';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';

const LoginScreen = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // מיפוי ת"ז לשמות (לצורך הדוגמה)
  const employeeNames = {
    '322754672': 'מנהל מערכת',
    '123456782': 'דני כהן',
    '987654321': 'שרה לוי',
  };

  const validateIsraeliID = (id) => {
    id = id.trim().replace(/[\s-]/g, '');
    if (id.length !== 9 || !/^\d+$/.test(id)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = parseInt(id[i], 10);
      let factor = (i % 2 === 0) ? 1 : 2;
      let product = digit * factor;
      sum += product > 9 ? product - 9 : product;
    }
    return sum % 10 === 0;
  };

  const handleLogin = () => {
    if (!employeeId) {
      setError('נא להזין מספר זהות');
    } else if (!validateIsraeliID(employeeId)) {
      setError('מספר זהות אינו תקין. אנא בדוק שוב.');
    } else {
      setError('');
      localStorage.setItem('employeeId', employeeId);
      localStorage.setItem('isManager', employeeId === '322754672' ? 'true' : 'false');
      localStorage.setItem('employeeName', employeeNames[employeeId] || 'עובד');
      navigate('/home');
    }
  };

  return (
    <Layout>
      <h1 className="title">התחברות</h1>
      <Input
        placeholder="מספר זהות"
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        maxLength={9}
      />
      {error && <span className="error">{error}</span>}
      <Button title="התחבר" onClick={handleLogin} />
    </Layout>
  );
};

export default LoginScreen;