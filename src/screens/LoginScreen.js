import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input/Input';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';
import './LoginScreen.css';

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

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // שמירת נתוני המשתמש ב-sessionStorage
        sessionStorage.setItem('userId', data.user.id);
        sessionStorage.setItem('employeeId', data.user.employeeId);
        sessionStorage.setItem('userName', data.user.name);
        sessionStorage.setItem('isManager', data.user.isManager);

        setError('');
        navigate('/home');
      } else {
        setError(data.error || 'שגיאה בהתחברות');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('שגיאה בחיבור לשרת');
    }
  };

  return (
    <Layout>
      <div className="login-container">
        <h1>התחברות</h1>
        <Input
          type="text"
          placeholder="מספר זהות"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />
        <Input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="error">{error}</div>}
        <Button onClick={handleLogin}>התחבר</Button>
      </div>
    </Layout>
  );
};

export default LoginScreen;