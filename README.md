# FASTag Vehicle Toll Tracker (LDB Full-Cycle Tracking)

A production-ready full-stack **MERN** (MongoDB, Express, React, Node.js) web application designed for comprehensive, multi-day commercial vehicle tracking.

It solves the single-day retention limit of `https://ldb.co.in/ldb/trucksearchlog` by continuously polling active trucks every 60 seconds, recording every toll plaza crossing with exact timestamps, deduction times, and GPS coordinates into **MongoDB Atlas**, providing an end-to-end trip timeline and interactive Leaflet map.

---

## 📸 Implemented User Interfaces

1. **Interactive Tracking Map & Navigation (Matching Image 2 UI)**:
   - Deep navy sidebar with `Trip`, `Services`, `Fleet`, `Dashboard`, `Wallet`, `Payments`, `Search History`, and `Logout`.
   - Search panel with vehicle registration search, `Active` and `Past` trip tabs, real-time live pulsing status, and "+ Register New Trip".
   - Interactive Leaflet map displaying truck routes, sequenced toll plaza pins, and a pulsing red marker on the latest toll location.
2. **Toll Plaza Crossing Timeline (Matching Image 1 UI)**:
   - Highway centerline with upward directional arrow.
   - Alternating left & right cards with dark blue chevron headers, truck icons, "TOLL PLAZA CROSSED" banner, and exact IST deduction timestamps in red.
   - Top node highlighted with a pulsing red active marker.
3. **Truck Tracking Report PDF Export (Matching Image 3 Format)**:
   - Header with page numbering, "Truck Tracking Report" title, and divider.
   - Truck summary box (`Truck Number : <NUMBER>`, `Container Number : N/A`).
   - "Truck Events Details" data table with `S.No.`, `Event Name`, `Location`, and `Event Time`.

---

## ⚙️ How It Works

1. **Trip Registration**:
   - Register a truck with its **Vehicle Number**, **Start Date** (today or future), and **End Date** (up to 30 days).
   - If Start Date is today, tracking activates immediately.
   - If Start Date is in the future, it is marked as `SCHEDULED` and automatically activates at 00:00:00 on that date.
2. **60-Second Real-Time Poller**:
   - The background scheduler polls `https://ldb.co.in/api/ldbv2/truck/search` for all currently `ACTIVE` trucks.
   - Toll events are deduplicated using FASTag transaction sequence numbers (`seqNo`) and compound indexes in MongoDB.
3. **Trip Completion & Auto-Purge**:
   - At `23:59:50` on the specified End Date, the trip automatically marks as `COMPLETED`.
   - Users can also click **"Stop Tracking"** manually at any time.
   - Once completed, past trips and their toll logs are automatically purged after 30 days via MongoDB's native **TTL index** on `endedAt` (`expireAfterSeconds: 2592000`) and a scheduled daily cleanup.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **MongoDB** (Local instance or MongoDB Atlas cluster)

### 2. Configure Environment (`.env`)
A `.env` file is already created in the project root. Edit it to connect your MongoDB Atlas cluster:

```env
# Server Port (default 5050 to avoid macOS AirPlay port 5000 conflict)
PORT=5050

# MongoDB Connection:
# For Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/ldb_tracker
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ldb_tracker?retryWrites=true&w=majority

# Polling Interval (in seconds, default: 1800 = 30 minutes)
POLL_INTERVAL_SECONDS=1800

# LDB API URL
LDB_API_URL=https://ldb.co.in/api/ldbv2/truck/search
```

### 3. Run the Application
To run both backend API server and frontend development server simultaneously:

```bash
npm run dev
```

Or run them individually:
```bash
# Start backend server only:
npm run server

# Start frontend development server only:
npm run client
```

Open your browser at:
👉 **http://localhost:5173** (Vite Dev Server) or **http://localhost:5050** (Express Production Server)

---

## 📁 Project Structure

```
LDB/
├── .env                  # Environment configuration
├── .env.example          # Environment template
├── package.json          # Root npm scripts & backend dependencies
├── server/
│   ├── index.js          # Express app entry & static SPA serving
│   ├── config/
│   │   └── db.js         # Mongoose connection & error handler
│   ├── models/
│   │   ├── Trip.js       # Trip schema (status, TTL index, latest toll)
│   │   └── TollEvent.js  # Deduplicated toll crossings schema
│   ├── services/
│   │   ├── ldbService.js # LDB API reverse-engineered client
│   │   ├── trackingScheduler.js # 60-second cron & 30-day retention
│   │   └── pdfGenerator.js # PDFKit report generator (Image 3 layout)
│   ├── controllers/
│   │   └── tripController.js # REST API handlers
│   └── routes/
│       └── tripRoutes.js # REST API endpoints
└── client/
    ├── index.html        # App HTML & Leaflet CSS
    ├── package.json      # React, Vite, Leaflet, Tailwind dependencies
    ├── vite.config.js    # Vite dev server with proxy to backend
    ├── tailwind.config.js# Custom color theme
    └── src/
        ├── main.jsx      # React DOM entry
        ├── App.jsx       # Main state orchestration & layout
        ├── api/
        │   └── client.js # Frontend API calls
        ├── utils/
        │   └── pdfExport.js # Client-side instant PDF export
        ├── styles/
        │   └── index.css # Tailwind & chevron banner styling
        └── components/
            ├── Sidebar.jsx           # Dark navigation sidebar (Image 2)
            ├── SearchAndTripPanel.jsx# Search & Active/Past tabs (Image 2)
            ├── LeafletMapView.jsx    # Leaflet map with route & controls (Image 2)
            ├── TollTimelineModal.jsx # Alternating toll cards (Image 1)
            └── NewTripModal.jsx      # Trip registration form
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server and MongoDB connection health check |
| `POST` | `/api/trips` | Register a new tracking trip |
| `GET` | `/api/trips?status=ACTIVE` | List active & scheduled trips |
| `GET` | `/api/trips?status=PAST` | List completed past trips |
| `GET` | `/api/trips/:id` | Get trip details and full toll history |
| `POST` | `/api/trips/:id/poll` | Trigger an instant manual poll with LDB |
| `PATCH` | `/api/trips/:id/end` | Manually stop tracking an active trip |
| `DELETE` | `/api/trips/:id` | Delete trip and its toll records |
| `GET` | `/api/trips/:id/pdf` | Download official tracking PDF report |

