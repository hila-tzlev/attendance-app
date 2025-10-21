# Attendance Management System

## Overview

This project is a web-based attendance tracking system designed for employee time management. It allows employees to record their work hours through automated clock-in/out functionality with geolocation, or by submitting manual attendance reports. Managers can then review and approve these records through a dedicated workflow. The system supports RTL Hebrew language and features a modern, mobile-first responsive design. The primary business vision is to streamline attendance management, improve accuracy, and provide clear oversight for HR and management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is a React 19.0.0 single-page application using React Router DOM for navigation and Framer Motion for animations. It employs a centralized `Layout` component, dedicated screen components (Login, Home, ManualUpdate, Report), and reusable UI components. Styling uses component-scoped CSS with global styles, adheres to an RTL layout for Hebrew, enforces a light theme, and is built with a mobile-first responsive approach. State management primarily relies on React hooks, SessionStorage for authentication, and LocalStorage for active clock-in tracking. A key UI decision is a unified `ReportScreen` that dynamically displays tabs based on user roles (employee vs. manager) and features a modern, clean table design with subtle hover effects and minimalist action buttons. The HomeScreen and Manual Update screens also feature modern gradient buttons and card-based layouts.

### Backend Architecture

The backend is built with Node.js and Express 4.18.2, using PostgreSQL (pg 8.16.3) for data persistence. It exposes a RESTful API under the `/api` prefix for authentication, attendance logs, and employee management. CORS is enabled, and static files are served for the production build. The system employs a custom database class for PostgreSQL interaction with connection pooling and SSL support.

### Authentication & Authorization

Authentication involves Israeli ID validation (Luhn algorithm) and password-based login. Session management is handled via SessionStorage. Authorization implements role-based access control, differentiating between managers (who can approve/reject manual entries) and regular employees (who can view and submit their own records). Self-approval by managers is prevented both client-side and server-side.

### Data Flow

1.  **Clock In/Out:** Captures geolocation via the browser's Geolocation API, records clock-in/out times, and stores them as "APPROVED" in `attendance_logs`.
2.  **Manual Entry:** Captures GPS location, requires date/time input (with validation preventing future dates and ensuring clock-out > clock-in), and a mandatory reason. Records are saved as "PENDING" for manager approval.
3.  **Report Viewing:** Users retrieve their attendance history, displayed in a responsive table format, with managers also seeing pending approvals and employee lists.

### Database Schema

-   **users:** Stores user credentials, roles (`is_manager`), and employee details.
-   **departments:** Manages department information.
-   **attendance_logs:** Records clock-in/out times, status (`PENDING`, `APPROVED`, `REJECTED`), manual entry flags, reasons, and geolocation data.

## External Dependencies

### Third-Party Services

-   **Database:** PostgreSQL hosted on Replit (connected via `DATABASE_URL` with SSL).

### External Libraries

**Frontend:**
-   `react-router-dom`: Client-side routing.
-   `framer-motion`: UI animations.
-   `axios`: HTTP client.
-   `react-toastify`: Notifications.
-   Font Awesome (via CDN): Icons.

**Backend:**
-   `express`: Web server framework.
-   `cors`: Cross-origin resource sharing.
-   `pg`: PostgreSQL client.

### Build Tools

-   Create React App (`react-scripts`) for development and production builds.

### Environment Configuration

-   `DATABASE_URL`: PostgreSQL connection string.
-   `PORT`: Server listening port.

## Recent Changes & Improvements (October 21, 2025)

### Complete Design Overhaul - Modern Clean Aesthetic
- **Modern Table Design:** Removed all white backgrounds and borders from tables - clean lines only
- Tables now have transparent background with subtle hover effects
- Border only under header (2px solid #003087) and thin lines between rows
- Smooth hover transitions with light background tint
- Badge styling updated with semi-transparent backgrounds and rounded corners
- Action buttons (✓/✕) now borderless, smaller (24x24px), side-by-side (flex-direction: row), minimalist aesthetic
- Fixed horizontal scrolling issue - tables now use overflow-x: visible on desktop
- Back arrow now fixed position at top: 85px (below logo), stays visible during scroll

### Unified Notification System
- **Replaced all browser alert() calls with react-toastify toast notifications**
- Success messages: `toast.success()` - green toast with checkmark
- Error messages: `toast.error()` - red toast with X icon
- Info messages: `toast.info()` - blue toast for neutral notifications
- All notifications now match the modern, clean aesthetic across the application
- Consistent notification experience on all screens (ReportScreen approvals/rejections)

### UI/UX Improvements
- Changed "דיווחים ממתינים" tab name to "אישור דיווחים ידניים" for better clarity
- Employee name (user_name) displayed in pending approvals table
- Home Screen: Modern gradient buttons, semi-transparent cards, responsive layout
- Manual Update Screen: Card-based layout with gradient buttons
- Login Screen: Cleaner design with improved error messaging
- All screens fully responsive with mobile breakpoints at 768px and 480px