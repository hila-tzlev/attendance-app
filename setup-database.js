
const Database = require('./src/lib/database.js');

async function setupDatabase() {
  console.log('🚀 Starting database setup...');
  
  try {
    // חיבור לדטאבייס
    await Database.connect();
    console.log('✅ Connected to database successfully');
    
    // יצירת טבלאות
    await Database.createTables();
    console.log('✅ Tables created successfully');
    
    // הוספת נתונים ראשוניים
    await setupInitialData();
    console.log('✅ Initial data setup completed');
    
    // בדיקת המבנה
    await Database.checkTables();
    await Database.checkTableData();
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
  }
}

async function setupInitialData() {
  try {
    // הוספת מחלקות נוספות
    const departments = [
      'מחלקה כללית',
      'משאבי אנוש', 
      'פיתוח',
      'שירות לקוחות',
      'מכירות'
    ];
    
    for (const deptName of departments) {
      try {
        await Database.createDepartment(deptName);
        console.log(`✅ Department created: ${deptName}`);
      } catch (error) {
        if (error.message.includes('duplicate')) {
          console.log(`⚠️ Department already exists: ${deptName}`);
        } else {
          throw error;
        }
      }
    }
    
    // הוספת המשתמשים הקיימים
    const users = [
      {
        employeeId: '322754672',
        name: 'מנהל ראשי',
        password: '123456',
        isManager: true
      },
      {
        employeeId: '123456782',
        name: 'עובד לדוגמא',
        password: 'password',
        isManager: false
      }
    ];
    
    for (const user of users) {
      try {
        await Database.createUser(
          user.employeeId, 
          user.name, 
          user.password, 
          user.isManager
        );
        console.log(`✅ User created: ${user.name} (${user.employeeId})`);
      } catch (error) {
        if (error.message.includes('duplicate')) {
          console.log(`⚠️ User already exists: ${user.name} (${user.employeeId})`);
        } else {
          throw error;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error setting up initial data:', error.message);
    throw error;
  }
}

// הפעלת הסקריפט
setupDatabase();
