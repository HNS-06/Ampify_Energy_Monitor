# AMPIFY Telegram Bot Integration

## 🤖 Bot Information
- **Bot Username**: @Amipifymonitor_bot
- **Bot URL**: https://t.me/Amipifymonitor_bot

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd telegram-bot
npm install
```

### 2. Start the Bot
```bash
npm start
```

### 3. Subscribe to Alerts
1. Open Telegram
2. Search for `@Amipifymonitor_bot`
3. Send `/start` to subscribe

## 📱 Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Subscribe to real-time alerts |
| `/status` | Get current system status |
| `/health` | Equipment health score |
| `/alerts` | View recent alerts history |
| `/stats` | System statistics |
| `/points` | Your gamification points |
| `/leaderboard` | Top users leaderboard |
| `/stop` | Unsubscribe from alerts |

## 🎮 Gamification Features

### Points System
- **+10 points**: Check status for the first time
- **+25 points**: Daily status checks (7-day streak)
- **+50 points**: Quick response to alerts (<5 min)
- **+75 points**: Handle 10 alerts successfully
- **+100 points**: Prevent equipment failures

### Achievements
- 🔍 **First Check** - Checked status for the first time (10 pts)
- ⚡ **Quick Responder** - Responded to alert within 5 minutes (50 pts)
- 🛡️ **Failure Preventer** - Prevented equipment failure (100 pts)
- 📅 **Daily Checker** - Checked status daily for 7 days (25 pts)
- 🎯 **Alert Master** - Handled 10 alerts successfully (75 pts)

## 🔔 Alert Types

### Critical Alerts (🔴)
- Overcurrent detected (>2.5A)
- Critical health score (<50%)
- Imminent failure (<12 hours)

### Warning Alerts (🟡)
- Anomaly detected
- Health degradation (<80%)
- Voltage issues

### Info Alerts (ℹ️)
- Elevated current (>2.3A)
- Temperature monitoring
- Maintenance reminders

## 🏗️ Architecture

```
Backend Server (Port 4000)
    ↓
ML Service (Port 5000)
    ↓ (alerts)
Telegram Bot (Port 5001)
    ↓
Telegram API
    ↓
Subscribers
```

## 🔧 Configuration

Edit `.env` file in `telegram-bot/` directory:
```env
TELEGRAM_BOT_TOKEN=8221386243:AAEkqDb6DDL0T1TBW5tVPwOBeaSLuAG0X4Q
BACKEND_API_URL=http://localhost:4000
```

## 📊 Features

### Real-Time Monitoring
- Instant alerts when anomalies detected
- Current, voltage, temperature updates
- Equipment health notifications

### Gamification
- Points for active monitoring
- Leaderboard competition
- Achievement badges
- Engagement rewards

### User Management
- Subscribe/unsubscribe anytime
- Personal stats tracking
- Alert history

## 🔐 Security Notes

⚠️ **Important**: Keep your bot token secure!
- Never commit `.env` file to git
- Don't share the token publicly
- Regenerate token if compromised

## 🐛 Troubleshooting

### Bot not responding?
1. Check if bot service is running: `npm start` in `telegram-bot/`
2. Verify backend is running on port 4000
3. Check ML service is running on port 5000

### Not receiving alerts?
1. Make sure you've sent `/start` to subscribe
2. Check if alerts are being generated (check `/alerts`)
3. Verify backend integration is working

### Commands not working?
1. Restart the bot service
2. Check console for errors
3. Verify Telegram API connection

## 📝 Example Usage

```
User: /start
Bot: 🎉 Welcome to AMPIFY Monitoring!
     ✅ You're now subscribed to real-time alerts.

User: /status
Bot: 🟢 AMPIFY System Status
     ⚡ Current: 2.25A
     🔋 Voltage: 5.01V
     🌡️ Temperature: 26.2°C
     💚 Health: 98.5%
     ✅ Operating normally

[Alert occurs]
Bot: 🔴 ALERT
     ⚡ Overcurrent detected: 2.65A (threshold: 2.5A)

User: /points
Bot: 🎮 Your Gamification Stats
     ⭐ Points: 85
     🏆 Achievements: 2
     🎯 Alerts Handled: 3
```

## 🎯 Integration with Web App

The Telegram bot is fully integrated with the AMPIFY web application:

1. **Automatic Alerts**: Backend forwards ML alerts to bot
2. **Real-time Sync**: Bot fetches live data from backend API
3. **Gamification**: Points and achievements tracked per user
4. **Multi-channel**: Monitor via web dashboard OR Telegram

## 🚀 Deployment

For production deployment:
1. Use PM2 or similar process manager
2. Set up environment variables securely
3. Configure webhook instead of polling (optional)
4. Add database for persistent storage (optional)

---

**Ready to use!** Start the bot and send `/start` on Telegram to begin monitoring! 🎉
