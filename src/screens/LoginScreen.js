
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input/Input';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';

const LoginScreen = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const handleLogin = async () => {
    if (!employeeId && !password) {
      setError('נא להזין את פרטי ההתחברות');
      return;
    }
    
    if (!employeeId || !password || !validateIsraeliID(employeeId)) {
      setError('אחד מפרטי ההתחברות שגויים, אנא נסה שוב');
      return;
    }

    // שמירת נתוני המשתמש ב-sessionStorage
    sessionStorage.setItem('employeeId', employeeId);
    sessionStorage.setItem('userName', 'משתמש');
    sessionStorage.setItem('isManager', employeeId === '322754672');
    
    setError('');
    navigate('/home');
  };

  return (
    <Layout>
      <div className="login-container">
        <h1>התחברות למערכת</h1>
        
        <div className="login-form">
          <Input
            label="מספר עובד (ת.ז.)"
            type="text"
            placeholder="הכנס מספר עובד"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
          
          <Input
            label="סיסמה"
            type="password"
            placeholder="הכנס סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <Button onClick={handleLogin}>התחבר</Button>
        </div>
      </div>
    </Layout>
  );
};

export default LoginScreen;
