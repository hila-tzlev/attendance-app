# Attendance Management System

## Overview

This is a web-based attendance tracking system for employee time management. The application allows employees to clock in/out, submit manual attendance reports, and enables managers to review and approve attendance records. Built as a React single-page application with an Express backend and PostgreSQL database.

**Primary Purpose:** Enable employees to track their work hours through automated clock-in/out functionality or manual entry, while providing managers with approval workflows for attendance records.

**Key Features:**
- Employee authentication with Israeli ID validation
- Clock in/out with geolocation tracking
- Manual attendance report submission
- Manager approval workflow for manual entries
- Attendance history viewing
- RTL (right-to-left) Hebrew language support

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 19.0.0 (Create React App)
- React Router DOM 6.30.0 for client-side routing
- Framer Motion 12.4.10 for animations
- Axios 1.8.1 for HTTP requests
- React Toastify for notifications

**Component Structure:**
- **Layout System:** Centralized `Layout` component provides consistent header (logo), content area, and footer across all screens
- **Screen Components:** Dedicated screen components for each major view (Login, Home, ManualUpdate, Report)
  - **ReportScreen:** Unified screen with conditional tab display - shows single tab for employees, three tabs for managers (My Reports, Pending Approvals, Employee List)
- **Reusable UI Components:** Button, Input (with password visibility toggle), ConfirmationModal, ToastNotification, ReportCard, Loader
- **Styling Approach:** Component-scoped CSS files with global styles in `global.css`

**State Management:**
- Local component state using React hooks (useState, useEffect)
- SessionStorage for user authentication state (employeeId, userName, isManager, userId)
- LocalStorage for active clock-in tracking

**Design Decisions:**
- RTL layout for Hebrew language support (dir="rtl" on HTML element)
- Light theme enforced with #F0F8FF background color
- Mobile-first responsive design with media queries
- Font Awesome icons for UI elements
- Israeli ID validation implemented client-side

### Backend Architecture

**Technology Stack:**
- Node.js with Express 4.18.2
- PostgreSQL (pg 8.16.3) for data persistence
- CORS enabled for cross-origin requests
- Static file serving for production build

**Recent Changes (October 19, 2025):**
- Fixed package.json scripts to work with Linux environment (removed Windows-specific 'set' command)
- Changed Express from version 5.x to 4.18.2 to resolve path-to-regexp compatibility issues
- Verified database connection and schema setup
- Built production version of React application
- Configured workflow to run server on port 5000

**Latest Improvements (October 21, 2025):**
- **Complete Design Overhaul - Modern Clean Aesthetic:**
  - **Modern Table Design:** Removed all white backgrounds and borders from tables - clean lines only
  - Tables now have transparent background with subtle hover effects
  - Border only under header (2px solid #003087) and thin lines between rows
  - Smooth hover transitions with light background tint
  - Badge styling updated with semi-transparent backgrounds and rounded corners
  - Action buttons with transparent backgrounds and subtle hover effects
  
- **Unified Report Screen:**
  - Eliminated separate Management screen to remove all duplication
  - ReportScreen now serves both employees and managers with conditional tab display
  - Employees see single tab: "הדיווחים שלי" (My Reports)
  - Managers see three tabs: "הדיווחים שלי" (My Reports), "דיווחים ממתינים" (Pending Approvals), "רשימת עובדים" (Employee List)
  - Removed "ניהול" (Management) button from HomeScreen navigation
  - All users navigate to /report-screen for attendance reports
  - Smooth tab transitions with fade-in animations
  - Tables max-width 1600px for better readability on large screens
  
- **Home Screen Modernization:**
  - Added dedicated HomeScreen.css with modern gradient buttons
  - Clock-in/Clock-out buttons with gradient backgrounds and smooth animations
  - Welcome section with semi-transparent white background and soft shadows
  - Modern card-based layout for clock section
  - Navigation buttons with icon support and hover effects
  - Fully responsive with mobile-optimized spacing
  
- **Manual Update Screen Enhancement:**
  - Complete redesign with modern card-based layout
  - Semi-transparent backgrounds with subtle shadows
  - Gradient remove buttons and add report button
  - Improved form field styling with focus states
  - Better spacing and visual hierarchy
  
- **Login Screen Refinement:**
  - Cleaner login button with gradient background
  - Improved error message styling with background tint
  - Enhanced focus states and transitions
  - Better mobile responsiveness

**Previous Improvements (October 19, 2025):**
- **Date/Time Validation:** Added validation to prevent manual reporting of future dates/times - input fields now have `max` attribute set to current date, and runtime validation blocks future entries
- **Mandatory Reason Field:** Manual reports now require a textarea field explaining the reason for manual entry (enforced in validation)
- **GPS Location Tracking:** Implemented geolocation capture for both automatic clock-in/out and manual reports using browser Geolocation API
- **Location Display in Management:** Added GPS coordinates column in management approval table with clickable links to Google Maps
- **Minimalist Table Design:**
  - Centered tables with max-width of 900px for better readability
  - Clean color scheme: light blue headers (#EAF3FF), dark blue text (#003087), subtle borders (#dddddd)
  - Reduced shadows and minimal visual weight for modern aesthetic
  - Simple, clean icons (✓/✕) for approve/reject actions
  - Improved visual hierarchy with proper spacing
- **Icon-Based Actions:**
  - Clean icon buttons (✓/✕) replacing text-heavy buttons
  - Added tooltips for accessibility on desktop (hidden on mobile)
  - Circular button design with smooth hover transitions and scaling effects
  - Full text labels on mobile cards ("✓ אשר" / "✕ דחה") for better usability
- **Mobile-First Responsive Design:**
  - Tables automatically convert to card layout on mobile devices (<768px)
  - Card design with white background, rounded corners, subtle shadows
  - Clear visual separation with labeled rows (label on right, value on left)
  - Status and type badges integrated into card headers
  - Action buttons displayed at bottom of cards with proper spacing
- **Three-Tab System in ReportScreen:**
  - Tab 1: "📊 הדיווחים שלי" (My Reports) - Personal attendance reports (all users)
  - Tab 2: "✅ דיווחים ממתינים" (Pending Reports) - Employee reports awaiting approval (managers only)
  - Tab 3: "👥 רשימת עובדים" (Employee List) - List of all employees with details (managers only)
  - Conditional display: employees see only Tab 1, managers see all three tabs
  - Responsive tab layout with smooth transitions and fade-in animations
  - Green loader component for better loading states
- **Self-Approval Prevention:**
  - Client-side validation: Manager's own pending reports are filtered out from the approval list
  - Server-side validation: API returns 403 error if manager attempts to approve their own reports
  - User-friendly alerts when self-approval is attempted
  - Reports automatically removed from pending list after approval/rejection
- **Navigation Improvements:**
  - Minimalist back arrow (←) positioned at top-right on desktop
  - Auto-repositions to bottom-center on mobile for thumb accessibility
  - Hover tooltip "חזרה" on desktop only
  - Responsive font sizing across devices
- **Form Accessibility:**
  - Login form now properly wrapped in <form> element to eliminate browser warnings
  - Submit event handling with preventDefault for better form control
- **Code Quality:** Removed unused imports, fixed React hooks warnings with useCallback, optimized build output, proper JSX fragment usage

**API Design:**
- RESTful API endpoints under `/api` prefix
- Authentication endpoint: POST `/api/auth/login`
- Attendance endpoints: GET/POST `/api/attendance/logs`, PUT `/api/attendance/status/:id`
- Employee endpoints: GET `/api/employees`
- Health check endpoint: GET `/api/health`

**Database Layer:**
- Custom Database class (`src/lib/database.js`) wrapping pg Pool
- Connection pooling with SSL support for Replit PostgreSQL
- Schema creation and sample data scripts included

**Database Schema:**

**users table:**
- `id` (SERIAL PRIMARY KEY): Auto-incrementing user identifier
- `employee_id` (VARCHAR): Israeli national ID
- `name` (VARCHAR): Employee full name
- `password` (VARCHAR): Hashed password
- `is_manager` (BOOLEAN): Manager role flag
- `department_id` (FOREIGN KEY): Links to departments table
- `created_at` (TIMESTAMP): Record creation timestamp

**departments table:**
- `id` (SERIAL PRIMARY KEY): Department identifier
- `name` (VARCHAR UNIQUE): Department name
- `created_at` (TIMESTAMP): Record creation timestamp

**attendance_logs table:**
- `id` (SERIAL PRIMARY KEY): Attendance record identifier
- `user_id` (FOREIGN KEY): References users table
- `clock_in` (TIMESTAMP): Entry time
- `clock_out` (TIMESTAMP): Exit time (nullable for active sessions)
- `status` (VARCHAR): Record status - "PENDING", "APPROVED", or "REJECTED"
- `is_manual_entry` (BOOLEAN): Distinguishes manual vs automatic entries
- `manual_reason` (TEXT): Justification for manual entries
- `latitude` (DECIMAL): GPS latitude coordinate
- `longitude` (DECIMAL): GPS longitude coordinate
- `created_at` (TIMESTAMP): Record creation timestamp
- `updated_at` (TIMESTAMP): Last modification timestamp
- `updated_by` (FOREIGN KEY): User who last modified the record

**Architectural Patterns:**
- Separation of concerns: Database logic isolated in dedicated module
- Error handling with try-catch blocks and user-friendly error messages
- Environment-based configuration (DATABASE_URL from environment variables)

### Authentication & Authorization

**Authentication Flow:**
- Israeli ID validation (Luhn algorithm implementation)
- Password-based authentication (passwords stored in database)
- Session management via SessionStorage
- Automatic redirect to login if not authenticated

**Authorization:**
- Role-based access control (manager vs regular employee)
- Managers can approve/reject manual attendance entries
- Employees can only view and submit their own records

### Data Flow

1. **Clock In/Out Flow:**
   - User initiates clock-in from HomeScreen
   - Browser requests geolocation permission (if not already granted)
   - Geolocation coordinates (latitude/longitude) captured via navigator.geolocation API
   - Record saved to attendance_logs with status "APPROVED" and GPS coordinates
   - LocalStorage tracks active clock-in state
   - Timer displays elapsed time
   - On clock-out: GPS location captured again and record updated

2. **Manual Entry Flow:**
   - User opens Manual Update screen
   - Browser captures GPS location in background
   - User fills date/time fields (validation prevents future dates)
   - User must provide reason in mandatory textarea field
   - System validates:
     * All date/time fields are filled
     * No future dates/times selected
     * Reason field is not empty
     * Clock-out is after clock-in (minimum 1 minute on same day)
   - Record saved with status "PENDING", is_manual_entry=true, GPS coordinates, and reason text
   - Manager reviews pending records in ManagementScreen
   - Manager sees GPS location as clickable link to Google Maps
   - Manager approves/rejects, updating status and updated_by fields

3. **Report Viewing Flow:**
   - User requests attendance history
   - Backend filters records by user_id
   - Frontend displays records with formatted dates/times in table format
   - Table shows: Date, Clock-in time, Clock-out time, Total hours, Status (badge), Type (manual/automatic badge)

## External Dependencies

### Third-Party Services

**Database:**
- PostgreSQL hosted on Replit
- Connection via DATABASE_URL environment variable
- SSL connection with `rejectUnauthorized: false`

### External Libraries

**Frontend:**
- `react-router-dom`: Client-side routing and navigation
- `framer-motion`: Animation library for UI transitions
- `axios`: HTTP client for API communication
- `react-toastify`: Toast notification system
- `localforage`: Offline storage (installed but may not be actively used)
- Font Awesome CDN: Icon library loaded from CDN

**Backend:**
- `express`: Web server framework
- `cors`: Cross-origin resource sharing middleware
- `pg`: PostgreSQL client for Node.js

### Build Tools

- Create React App (react-scripts 5.0.1) for development and production builds
- Webpack bundling (via CRA)
- Babel transpilation (via CRA)

### Testing Dependencies

- @testing-library/react
- @testing-library/jest-dom
- @testing-library/dom
- @testing-library/user-event

### Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)
- `PORT`: Server port (defaults to 5000)

### Asset Dependencies

- Logo image: `logoTzohar.png` in `src/assets/images/`
- Hebrew font: Alef from Google Fonts (loaded via HTML link tag)
- Font Awesome CSS from CDN