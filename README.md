# TV Channel Monitoring & Recording System

An enterprise-grade, high-performance TV Broadcast Monitoring, Live Recording, Ad Punching, and As-Run Verification System built with React, TypeScript, Express, and HLS streaming.

---

## 🌟 Key Features

- 📺 **Multi-Channel Live Grid**: Monitor multiple broadcast channels simultaneously (SRT, RTMP, HLS `.m3u8`, HTTP streams, YouTube embeds).
- ⚡ **Built-In Stream Proxy**: Automatic backend stream proxy (`/api/proxy-stream`) to handle CORS and mixed-content restrictions for custom IPTV/encoder links (e.g. `http://IP:PORT/play/.../index.m3u8`).
- ⏱️ **Live Ad & Program Punching**: One-click instant logging of ads, programs, and news segments with precise timestamping and duration tracking.
- 💾 **Automatic Persistence**: Built-in JSON database engine (`db_store.json`) that saves all configured channels, libraries, logs, and settings automatically.
- 📊 **Compliance & As-Run Reports**: Generate detailed audit trails, daily execution logs, and export PDF/CSV reports for advertisers and regulatory authorities.
- 🚀 **1-Click Desktop Launcher**: Launch directly on Windows using `Run-TV-Monitoring.bat` without touching the command line.

---

## 🚀 Quick Start (Local Desktop Run)

### Requirements
- [Node.js](https://nodejs.org) (v18 or higher recommended)

### Method 1: Windows 1-Click Batch Script
Simply double-click **`Run-TV-Monitoring.bat`** in the project folder.
It will automatically:
1. Check dependencies and run `npm install` if required.
2. Build the production app.
3. Open your browser at `http://localhost:3000`.

### Method 2: Command Line
```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Or build and start production server
npm run build
npm start
```

---

## 📂 Project Structure

```text
├── Run-TV-Monitoring.bat  # Windows 1-Click Launcher
├── server.ts               # Express Backend & Live Stream Proxy
├── src/
│   ├── App.tsx             # Main Application Shell
│   ├── components/         # Broadcast Player, Admin, Ad Master, Scheduler, etc.
│   ├── server/             # Data Store & Persistence Engine (`db_store.json`)
│   └── types.ts            # TypeScript Definitions
├── package.json
└── README.md
```

---

## 🔒 License & Usage
Private & Internal Broadcast Quality Assurance Software.
