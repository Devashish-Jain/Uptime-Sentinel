# Uptime Sentinel

This repository contains the Uptime Sentinel project (MERN stack website uptime monitoring tool).

- Full documentation: see `uptime-sentinel/README.md`
- Backend env example: `uptime-sentinel/server/.env.example`

## Quick Start

1) Install dependencies
```bash
cd uptime-sentinel/server && npm install
cd ../client && npm install
```

2) Configure environment variables
- Copy `uptime-sentinel/server/.env.example` to `uptime-sentinel/server/.env`
- Set the following (minimal) variables:
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/uptime-sentinel
CLIENT_URL_DEV=http://localhost:5173
CLIENT_URL_PROD=http://localhost:5173
PING_FREQUENCY_CRON=*/5 * * * *
PING_INTERVAL_MINUTES=5
DOWNTIME_MONITORING_HOURS=12
PAUSE_MONITORING_HOURS=24
```

3) Run
```bash
# Terminal 1
cd uptime-sentinel/server
npm start

# Terminal 2 (worker)
cd uptime-sentinel/server
npm run worker

# Terminal 3
cd uptime-sentinel/client
npm run dev
```

## Security Notes
- Do not commit `.env` files. They are ignored by default.
- If any secrets were previously exposed, rotate them immediately.
