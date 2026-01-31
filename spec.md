# ESP8266 Energy Monitoring Dashboard

## Overview
A real-time web dashboard that monitors energy consumption data from an ESP8266 device through REST API polling. The application displays live metrics, graphs, and alerts for electrical monitoring with a modern, animated interface.

## Core Functionality

### Data Polling
- Poll ESP8266 REST API endpoint `/api/data` every 500-1000ms for live data
- Handle JSON response containing: current (amps), voltage, load (boolean), overcurrent (boolean), uptime (ms), temperature
- Implement graceful error handling for API disconnections
- Show loading skeletons during initialization
- Display error UI when ESP8266 is unreachable

### Real-time Visualization

#### Live Current Graph
- Animated line chart displaying last 30-60 seconds of current data
- Auto-scaling Y-axis with smooth transitions
- Gradient line effects with no flickering
- Real-time data updates without chart re-rendering

#### Load Status Indicator
- Large toggle card with animated color transitions (Green = ON, Grey = OFF)
- Pulsing animation when load is active
- Clear visual state representation

#### Overcurrent Alert System
- Red animated alert card/banner when overcurrent is detected
- Screen flash or shake animation for attention
- Toast notifications for critical alerts

#### Temperature Monitoring
- Real-time temperature display with animated thermometer graphic
- Responsive progress visualization
- Color-coded temperature ranges

#### Live Metrics Cards
- Display cards for current (A), voltage (V), temperature (°C)
- Uptime display in HH:MM:SS format
- Last updated timestamp
- Color-coded status: Green (Normal), Yellow (Warning), Red (Overcurrent)

#### Prediction Metrics
- Visual indicators for prediction accuracy (precision/recall)
- Lead time indicators for failure prediction
- False alarm rate display
- Mock state implementation for demonstration purposes

## User Interface

### Design System
- Glassmorphism design with soft cards
- Smooth micro-animations for hover, loading, and state changes
- Dark theme by default with light mode toggle option
- Fully responsive design (mobile, tablet, desktop)

### Performance Requirements
- High-performance real-time updates
- Precise timing for data polling
- Memory leak prevention with proper cleanup
- Smooth animations without performance degradation

## Technical Architecture
- Frontend-only application (no backend data persistence)
- Real-time data visualization with animated transitions
- Modular, reusable component structure
- Efficient state management for live data streams
