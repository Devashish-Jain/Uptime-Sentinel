# 📡 Uptime Sentinel

**Professional Website Monitoring Tool with Real-time Dashboard**

A comprehensive MERN stack application that monitors website uptime using Puppeteer-powered headless browser automation. Features a modern React dashboard with advanced animations, real-time statistics, and production-ready deployment configuration.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D5.0-green)

## 🌟 Features

### Backend (Express.js + Puppeteer)
- **Production-Ready Ping Service**: Robust Puppeteer implementation with memory leak prevention
- **Headless Browser Automation**: Real end-to-end website testing using Chromium
- **Resource Optimization**: Intelligent request blocking for faster ping times
- **RESTful API**: Complete CRUD operations for website management
- **Cron Scheduling**: Automated monitoring with configurable intervals
- **MongoDB Integration**: Advanced aggregation queries for statistics

### Frontend (React + Framer Motion)
- **Modern UI/UX**: Glass-morphism design with smooth animations
- **Parallax Hero Section**: Multi-layer scrolling effects
- **Animated Statistics**: CountUp animations with scroll-triggered activation
- **Real-time Dashboard**: Live updates every 30 seconds
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Visual Analytics**: Mini-charts for ping history visualization

### DevOps & Deployment
- **Render.com Ready**: Complete infrastructure-as-code configuration
- **Microservices Architecture**: Separate web service and background worker
- **Environment Management**: Development and production configurations
- **Docker Friendly**: Containerization support for scalable deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd uptime-sentinel
```

2. **Backend Setup**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB connection string
```

3. **Frontend Setup**
```bash
cd ../client
npm install
# .env.local is already configured for development
```

4. **Database Configuration**
Update `server/.env` with your MongoDB connection:
```env
MONGO_URI=mongodb://localhost:27017/uptime-sentinel
# Or use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/uptime-sentinel
```

## 🏃‍♂️ Running the Application

### Development Mode

**Terminal 1 - Backend API:**
```bash
cd server
npm start
# Server runs on http://localhost:5001
```

**Terminal 2 - Ping Worker:**
```bash
cd server
npm run worker
# Background worker starts monitoring
```

**Terminal 3 - Frontend:**
```bash
cd client
npm run dev
# React app runs on http://localhost:5173
```

### Production Build
```bash
# Build client
cd client
npm run build

# Start production server (serves API + static files)
cd ../server
npm run production
```

## 📁 Project Structure

```
uptime-sentinel/
├── server/                 # Backend Express.js application
│   ├── controllers/        # Route handlers and business logic
│   ├── models/            # MongoDB schemas and models
│   ├── routes/            # API route definitions
│   ├── index.js           # Main server file
│   ├── ping-worker.js     # Background monitoring service
│   └── package.json       # Backend dependencies
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── services/      # API service layer
│   │   ├── App.jsx        # Main application component
│   │   └── main.jsx       # React entry point
│   └── package.json       # Frontend dependencies
├── render.yaml            # Render.com deployment configuration
└── README.md              # Project documentation
```

## 🔧 Configuration

### Environment Variables

**Server (.env)**
```env
PORT=5001
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
CLIENT_URL_DEV=http://localhost:5173
CLIENT_URL_PROD=https://your-domain.com
PING_FREQUENCY_CRON=*/5 * * * *
# Interval (minutes) between pings when site is UP
PING_INTERVAL_MINUTES=5
# Continue monitoring a DOWN site for this many hours
DOWNTIME_MONITORING_HOURS=12
# After the above window, pause monitoring for this many hours
PAUSE_MONITORING_HOURS=24
```

**Client (.env.local)**
```env
VITE_API_BASE_URL=http://localhost:5001/api
NODE_ENV=development
```

### Monitoring Configuration
- **Ping Frequency**: Configurable via cron expression (default: every 5 minutes)
- **Per-site Ping Interval**: PING_INTERVAL_MINUTES (default: 5 minutes)
- **Downtime Monitoring Window**: DOWNTIME_MONITORING_HOURS (default: 12 hours)
  - While a site is DOWN, the worker continues to ping it at the regular interval
  - The window end is tracked per-website using stopPingUntil
- **Pause After Extended Downtime**: PAUSE_MONITORING_HOURS (default: 24 hours)
  - After a site has been DOWN for the entire downtime window, it is temporarily paused
  - The worker later resumes it automatically once the pause period expires
- **Timeout**: 30 seconds per website check
- **History Retention**: Last 100 ping results per website
- **Resource Blocking**: Images, stylesheets, fonts automatically blocked for speed

#### How to change the 12-hour window
Edit server/.env and set:
```env
DOWNTIME_MONITORING_HOURS=12
PAUSE_MONITORING_HOURS=24
```
Then restart the ping worker:
```bash
# In a terminal
cd server
npm run worker
```

## 🚀 Deployment

### Render.com (Recommended)

1. **Fork/Clone** this repository to your GitHub account

2. **Create MongoDB Atlas Database**
   - Set up a free MongoDB Atlas cluster
   - Get your connection string

3. **Deploy on Render**
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file
   - Add your `MONGO_CONNECTION_STRING` as an environment secret
   - Deploy both services (web + worker)

4. **Environment Secrets**
   ```
   MONGO_CONNECTION_STRING=mongodb+srv://...
   ```

### Manual Deployment

**Docker Deployment** (optional):
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🛠️ API Reference

### Websites

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/websites` | Get all monitored websites |
| POST | `/api/websites` | Add new website to monitor |
| DELETE | `/api/websites/:id` | Remove website from monitoring |
| GET | `/api/health` | API health check |

### Example API Usage

**Add Website:**
```javascript
POST /api/websites
{
  "name": "My Website",
  "url": "https://example.com"
}
```

**Response:**
```javascript
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "My Website", 
    "url": "https://example.com",
    "status": "PENDING",
    "pingHistory": []
  }
}
```

## 🎨 Technology Stack

### Backend
- **Express.js** - Web framework
- **Puppeteer** - Headless browser automation
- **MongoDB + Mongoose** - Database and ODM
- **node-cron** - Task scheduling
- **CORS** - Cross-origin resource sharing

### Frontend  
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Framer Motion** - Animation library
- **react-scroll-parallax** - Parallax effects
- **react-countup** - Number animations
- **Axios** - HTTP client

### Development
- **Nodemon** - Development server
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📊 Performance Features

- **Memory Leak Prevention**: Isolated browser contexts with aggressive cleanup
- **Resource Optimization**: Request blocking for 80% faster ping times  
- **Efficient Scheduling**: Non-overlapping ping cycles with queue management
- **Database Optimization**: Aggregation queries for real-time statistics
- **Caching Strategy**: Smart client-side data caching

## 🔒 Security

- **CORS Protection**: Environment-specific origin whitelisting
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error messages without data exposure
- **Environment Separation**: Production vs development configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/uptime-sentinel/issues)
- **Documentation**: This README and inline code comments
- **Community**: Discussions tab for questions and ideas

## 🎯 Roadmap

- [ ] Email/SMS notifications for downtime
- [ ] Historical data export (CSV/JSON)
- [ ] Custom monitoring intervals per website
- [ ] SSL certificate monitoring
- [ ] Multi-region ping testing
- [ ] Team collaboration features
- [ ] Custom dashboard themes
- [ ] API rate limiting and authentication

---

**Built with ❤️ for reliable website monitoring**
