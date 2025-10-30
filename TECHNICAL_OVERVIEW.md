# סקירה טכנית - מערכת ניהול נוכחות

## 📋 תוכן עניינים
1. [סקירה כללית](#סקירה-כללית)
2. [ארכיטקטורה](#ארכיטקטורה)
3. [מסד נתונים](#מסד-נתונים)
4. [אבטחה](#אבטחה)
5. [דרישות מערכת](#דרישות-מערכת)
6. [הפעלה ופריסה](#הפעלה-ופריסה)

---

## 🎯 סקירה כללית

### מטרת המערכת
אפליקציית ווב לניהול נוכחות עובדים עם תכונות:
- דיווח אוטומטי (כניסה/יציאה) עם GPS
- דיווח ידני עם workflow אישורים
- ממשק מנהלים לאישור/דחייה
- תצוגת דיווחים היסטוריים

### טכנולוגיות עיקריות
- **Frontend:** React 19.0.0 + React Router DOM
- **Backend:** Node.js + Express 4.18.2
- **Database:** PostgreSQL (Neon-backed via Replit)
- **Hosting:** Replit Cloud
- **UI/UX:** RTL Hebrew, Responsive Design, Framer Motion

---

## 🏗️ ארכיטקטורה

### Frontend Architecture

```
src/
├── App.js                    # Entry point, routing
├── screens/
│   ├── LoginScreen.js        # כניסה למערכת
│   ├── HomeScreen.js         # דף בית - כניסה/יציאה
│   ├── ManualUpdateScreen.js # דיווח ידני
│   └── ReportScreen.js       # דיווחים + אישורים
├── components/
│   └── Layout/
│       └── Layout.js         # תבנית אחידה + navigation
└── index.js                  # React DOM render
```

### Backend Architecture

```
server/
├── index.js                  # Express server + routes
└── storage.ts                # Database layer (PostgreSQL)
```

### API Endpoints

| Method | Endpoint | תיאור | דורש התחברות |
|--------|----------|-------|--------------|
| POST | `/api/login` | כניסה למערכת | ❌ |
| GET | `/api/users` | רשימת עובדים | ✅ |
| GET | `/api/attendance/:employeeId` | דיווחי נוכחות של עובד | ✅ |
| POST | `/api/attendance/clock-in` | דיווח כניסה | ✅ |
| POST | `/api/attendance/clock-out` | דיווח יציאה | ✅ |
| POST | `/api/attendance/manual` | דיווח ידני | ✅ |
| GET | `/api/attendance/pending` | דיווחים ממתינים (מנהלים) | ✅ (מנהל) |
| POST | `/api/attendance/approve/:id` | אישור דיווח | ✅ (מנהל) |
| POST | `/api/attendance/reject/:id` | דחיית דיווח | ✅ (מנהל) |

### Data Flow

```
┌─────────────┐
│   Browser   │
│  (React)    │
└──────┬──────┘
       │ HTTP/AJAX (axios)
       ▼
┌─────────────┐
│  Express    │
│   Server    │
└──────┬──────┘
       │ SQL Queries
       ▼
┌─────────────┐
│ PostgreSQL  │
│  Database   │
└─────────────┘
```

---

## 🗄️ מסד נתונים

### Schema Overview

#### טבלת `users`
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(9) UNIQUE NOT NULL,  -- ת.ז
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,          -- hashed
    department_id INTEGER,
    is_manager BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### טבלת `departments`
```sql
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### טבלת `attendance_logs`
```sql
CREATE TABLE attendance_logs (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(9) NOT NULL,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    total_hours DECIMAL(5,2),
    is_manual BOOLEAN DEFAULT FALSE,
    reason TEXT,                            -- רק לדיווחים ידניים
    status VARCHAR(20) DEFAULT 'APPROVED',  -- PENDING/APPROVED/REJECTED
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (employee_id) REFERENCES users(employee_id)
);
```

### Indexes (מומלץ להוסיף)
```sql
CREATE INDEX idx_attendance_employee ON attendance_logs(employee_id);
CREATE INDEX idx_attendance_status ON attendance_logs(status);
CREATE INDEX idx_attendance_date ON attendance_logs(clock_in);
```

---

## 🔒 אבטחה

### Authentication
- **אימות ת.ז:** Luhn algorithm validation
- **סיסמאות:** מאוחסנות כ-hash (לא plain text)
- **Session:** SessionStorage בצד לקוח

### Authorization
- **Role-Based Access Control (RBAC)**
  - עובד רגיל: צפייה/דיווח של עצמו בלבד
  - מנהל: גישה לכל הדיווחים + אישורים

### Data Security
- ✅ SQL Injection Protection (parameterized queries)
- ✅ CORS מוגדר
- ✅ HTTPS בייצור (דרך Replit)
- ✅ Secrets במשתני סביבה (לא בקוד)

### Business Rules
- מנהל **לא יכול** לאשר את הדיווחים שלו (server-side validation)
- דיווח ידני **לא יכול** להיות בעתיד
- clock_out חייב להיות **אחרי** clock_in

---

## 💻 דרישות מערכת

### Server Requirements
- **Node.js:** 18.x או גבוה יותר
- **PostgreSQL:** 12.x או גבוה יותר
- **RAM:** מינימום 512MB
- **Storage:** ~100MB לאפליקציה + DB

### Client Requirements (דפדפנים)
- **Desktop:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS Safari 14+, Android Chrome 90+
- **JavaScript:** חובה (לא עובד ללא JS)
- **GPS:** אופציונלי (אבל מומלץ לדיוק)

### Network
- **Bandwidth:** מינימום 1 Mbps
- **Latency:** מומלץ < 200ms לשרת

---

## 🚀 הפעלה ופריסה

### Development Mode (פיתוח)

```bash
# התקנת dependencies
npm install

# הרצת שרת development
node server/index.js

# או דרך Replit workflow
# פשוט לחצו על "Run"
```

**PORT:** 5000  
**Database:** `DATABASE_URL` environment variable

### Production Deployment (Replit)

1. **לחצו על "Deploy" בReplit**
2. **בחרו:** Autoscale Deployment
3. **Configure:**
   - Build: `npm install`
   - Run: `node server/index.js`
4. **Environment Variables:**
   - `DATABASE_URL` (אוטומטי)
   - `PORT` (אוטומטי)

### Database Setup

הטבלאות נוצרות אוטומטית בהפעלה ראשונה:
```javascript
// server/index.js יוצר את הטבלאות אם לא קיימות
await storage.initialize();
```

### משתמש ראשון (Admin)

הוספת מנהל ראשון:
```sql
INSERT INTO users (employee_id, name, password, is_manager)
VALUES ('123456782', 'מנהל ראשי', 'hashed_password_here', TRUE);
```

---

## 📊 ביצועים

### Metrics (צפוי)
- **Response Time:** < 200ms (API average)
- **Page Load:** < 2s (initial load)
- **Concurrent Users:** תומך ב-100+ משתמשים במקביל
- **Database Queries:** אופטימיזציה עם indexes

### Optimization Tips
- Connection pooling (כבר מוגדר ב-`storage.ts`)
- Index על `employee_id` ו-`clock_in`
- Caching של רשימת עובדים (אם צריך)

---

## 🔧 תחזוקה

### Backup
- **Database:** Replit עושה גיבוי אוטומטי
- **Code:** Git repository (מומלץ GitHub)

### Monitoring
- **Logs:** Console logs ב-Replit
- **Errors:** React error boundaries
- **Database:** ניטור דרך Replit DB pane

### Updates
```bash
# עדכון packages
npm update

# בדיקת vulnerabilities
npm audit
npm audit fix
```

---

## 🐛 Debugging

### Common Issues

**בעיה:** "Port 5000 already in use"
```bash
# הרצת workflow מחדש דרך Replit
```

**בעיה:** "Database connection failed"
```bash
# בדיקה:
echo $DATABASE_URL
# אם ריק - צריך ליצור DB דרך Replit
```

**בעיה:** "GPS לא עובד"
```
- ודאו HTTPS (לא HTTP)
- בדקו הרשאות דפדפן
- ב-Chrome: Settings → Privacy → Location
```

---

## 📞 תמיכה טכנית

### לפני פניה:
1. בדקו את הלוגים (Console)
2. נסו להפעיל מחדש (Restart)
3. נקו Cache של הדפדפן

### מידע לתמיכה:
- גרסת דפדפן
- הודעת שגיאה מדויקת
- צילום מסך (אם רלוונטי)
- שלבים לשחזור הבעיה

---

## 📝 Change Log

### Version 1.0 (אוקטובר 2025)
- ✅ מערכת בסיסית מלאה
- ✅ דיווח אוטומטי וידני
- ✅ אישורים ניהוליים
- ✅ עיצוב מודרני RTL
- ✅ Responsive design

### Planned (בקרוב)
- 📅 תצוגת לוח שנה
- 💬 מערכת צ'אט עובד-מנהל
- 📊 דוחות Excel
- 🔔 התראות Push (PWA)

---

© 2025 | Built with ❤️ on Replit
