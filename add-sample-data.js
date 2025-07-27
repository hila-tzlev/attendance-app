
const Database = require('./src/lib/database.js');

async function addSampleData() {
  console.log('🔄 Adding sample attendance data...');
  
  try {
    await Database.connect();
    console.log('✅ Connected to database');

    // קבלת המשתמשים הקיימים
    const user1 = await Database.getUserByEmployeeId('322754672');
    const user2 = await Database.getUserByEmployeeId('123456782');
    
    if (!user1 || !user2) {
      console.log('❌ Users not found. Please run setup-database.js first');
      return;
    }

    console.log(`👤 Found users: ${user1.name} (ID: ${user1.id}), ${user2.name} (ID: ${user2.id})`);

    // הוספת רישומי נוכחות לדוגמה
    const sampleAttendance = [
      // רישומים מהיום - עובד רגיל
      {
        userId: user2.id,
        clockIn: new Date().toISOString().replace('T', ' ').slice(0, 19),
        clockOut: null,
        isManual: false
      },
      
      // רישומים מאתמול - שני המשתמשים
      {
        userId: user1.id,
        clockIn: new Date(Date.now() - 24*60*60*1000).toISOString().replace('T', ' ').slice(0, 16) + ':00',
        clockOut: new Date(Date.now() - 24*60*60*1000 + 8*60*60*1000).toISOString().replace('T', ' ').slice(0, 16) + ':00',
        isManual: false
      },
      {
        userId: user2.id,
        clockIn: new Date(Date.now() - 24*60*60*1000).toISOString().replace('T', ' ').slice(0, 16) + ':30',
        clockOut: new Date(Date.now() - 24*60*60*1000 + 8*60*60*1000).toISOString().replace('T', ' ').slice(0, 16) + ':15',
        isManual: false
      },
      
      // דיווח ידני ממתין לאישור
      {
        userId: user2.id,
        clockIn: new Date(Date.now() - 2*24*60*60*1000).toISOString().replace('T', ' ').slice(0, 16) + ':00',
        clockOut: new Date(Date.now() - 2*24*60*60*1000 + 8*60*60*1000).toISOString().replace('T', ' ').slice(0, 16) + ':00',
        isManual: true,
        reason: 'שכחתי לחתום בזמן',
        status: 'PENDING'
      },
      
      // דיווח ידני מאושר
      {
        userId: user2.id,
        clockIn: new Date(Date.now() - 3*24*60*60*1000).toISOString().replace('T', ' ').slice(0, 16) + ':00',
        clockOut: new Date(Date.now() - 3*24*60*60*1000 + 8*60*60*1000).toISOString().replace('T', ' ').slice(0, 16) + ':00',
        isManual: true,
        reason: 'בעיה טכנית במערכת',
        status: 'APPROVED'
      }
    ];

    // הכנסת הנתונים
    for (const record of sampleAttendance) {
      try {
        if (record.isManual) {
          await Database.createManualReport(
            record.userId,
            record.clockIn,
            record.clockOut,
            record.reason,
            31.7683, // latitude דוגמה - ירושלים
            35.2137  // longitude דוגמה - ירושלים
          );
          
          if (record.status === 'APPROVED') {
            // עדכון סטטוס לאחר יצירה
            const logs = await Database.getAttendanceLogs();
            const lastLog = logs[0];
            if (lastLog) {
              await Database.updateAttendanceStatus(lastLog.id, 'APPROVED', user1.id);
            }
          }
          
          console.log(`✅ Manual report added for user ${record.userId} - Status: ${record.status || 'PENDING'}`);
        } else {
          await Database.clockIn(
            record.userId,
            31.7683, // latitude דוגמה
            35.2137, // longitude דוגמה
            false,
            null
          );
          
          if (record.clockOut) {
            // עדכון שעת יציאה ידנית
            const client = await Database.pool.connect();
            try {
              await client.query(
                `UPDATE attendance_logs SET clock_out = $1 
                 WHERE user_id = $2 AND clock_out IS NULL 
                 ORDER BY clock_in DESC LIMIT 1`,
                [record.clockOut, record.userId]
              );
            } finally {
              client.release();
            }
          }
          
          console.log(`✅ Regular attendance added for user ${record.userId}`);
        }
      } catch (error) {
        console.log(`⚠️ Error adding record for user ${record.userId}:`, error.message);
      }
    }

    // הצגת סיכום
    console.log('\n📊 Current database status:');
    await Database.checkTableData();
    
    // הצגת רישומי נוכחות
    const allLogs = await Database.getAttendanceLogs();
    console.log(`\n📋 Total attendance logs: ${allLogs.length}`);
    
    console.log('\n🎉 Sample data added successfully!');
    console.log('\n🔍 You can now test:');
    console.log('   1. Login with: 322754672 / 123456 (Manager)');
    console.log('   2. Login with: 123456782 / password (Employee)');
    console.log('   3. Check attendance logs in management screen');
    console.log('   4. Test manual reports approval');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  }
}

addSampleData();
