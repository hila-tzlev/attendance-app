
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input/Input';
import Button from '../components/Button/Button';
import Layout from '../components/Layout/Layout';
import prisma from '../lib/prisma';

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
    if (!employeeId || !validateIsraeliID(employeeId)) {
      setError('פרטי ההתחברות שגויים, אנא נסה שוב');
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { employeeId }
      });

      if (!user) {
        // אם המשתמש לא קיים, ניצור אותו
        const newUser = await prisma.user.create({
          data: {
            employeeId,
            name: 'משתמש חדש', // ניתן לעדכן את השם בהמשך
            isManager: employeeId === '322754672'
          }
        });
        user = newUser;
      }

      setError('');
      navigate('/home');
    } catch (error) {
      console.error('Error during login:', error);
      setError('אירעה שגיאה בהתחברות. אנא נסה שוב.');
    }
  };

  return (
    <Layout>
      <div className="login-container">
        <h2 className="title">כניסה למערכת</h2>
        <Input
          type="text"
          placeholder="הכנס מספר זהות"
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
        <Button title="התחבר" onClick={handleLogin} />
      </div>
    </Layout>
  );
};

export default LoginScreen;
