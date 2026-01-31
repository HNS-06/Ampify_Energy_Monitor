# AMPIFY Predictive Maintenance System

## Quick Start

### 1. Start Backend (USB Server)
```bash
cd usb-server
npm start
```
Server runs on `http://localhost:4000`

### 2. Start ML Service
```bash
cd ml-service
py app.py
```
ML service runs on `http://localhost:5000`

### 3. Start Frontend
```bash
cd build-template/src/frontend
npm start
```
Dashboard opens at `http://localhost:3000`

## Features

✅ **Real-time Sensor Monitoring** - Voltage, current, temperature tracking
✅ **ML-Powered Anomaly Detection** - Isolation Forest algorithm
✅ **Health Score Calculation** - 0-100 equipment health rating
✅ **Failure Prediction** - 2-48 hour advance warnings
✅ **Live Alerts** - Real-time notifications for critical events
✅ **Interactive Dashboard** - Beautiful React UI with charts

## System Architecture

```
USB Sensors → Node.js (:4000) → Python ML (:5000) → React Dashboard (:3000)
```

## API Endpoints

### Node.js Server (:4000)
- `GET /api/data` - Sensor data + ML predictions

### ML Service (:5000)
- `POST /analyze` - Analyze sensor data
- `GET /alerts` - Get alert history
- `GET /stats` - System statistics
- `GET /health` - Service health check

## ML Models

- **Anomaly Detection**: Isolation Forest (scikit-learn)
- **Trend Analysis**: Linear regression
- **Health Scoring**: Multi-factor weighted algorithm
- **Failure Prediction**: Linear extrapolation based on health trend

## Configuration

Edit `usb-server/server.js` to adjust:
- Sensor thresholds (voltage, current, temperature)
- Mock data simulation ranges
- Polling intervals

Edit `ml-service/app.py` to adjust:
- Anomaly contamination rate (default: 10%)
- Health score weights
- Failure prediction sensitivity