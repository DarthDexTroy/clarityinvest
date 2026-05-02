# ClarityInvest 🎯

**Navigating the Unknown: Intuitive Portfolio Management & Dynamic Rebalancing for the Everyday Investor**

ClarityInvest is an AI-powered portfolio management platform designed for beginner investors. Built for the "Empowering the Everyday Investor" hackathon challenge, it combines scenario-based planning, global risk mapping, and intelligent rebalancing recommendations powered by Groq AI.

## 🌟 Features

- **🎯 Goal-Based Planning**: Personalized risk profiling based on investment goals and timeline
- **📊 Portfolio Dashboard**: Real-time allocation tracking with health scoring
- **🔮 What-If Scenarios**: Plan for market drops, inflation, withdrawals, and global events
- **🗺️ Global Risk Map**: Interactive world map showing geopolitical risks and portfolio impact
- **🤖 AI Recommendations**: Powered by Groq's llama-3.3-70b-versatile model
- **🎮 Investment Game**: Learn investing fundamentals through a coffee shop business simulation
- **✅ Review & Execute**: Transparent rebalancing with educational explanations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Groq API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   cd clarityinvest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get your Groq API key**
   - Visit [console.groq.com](https://console.groq.com/keys)
   - Sign up for a free account
   - Create a new API key

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Groq API key:
   ```
   GROQ_API_KEY=your_actual_api_key_here
   ```

   For Vercel, add the same `GROQ_API_KEY` value in Project Settings → Environment Variables, then redeploy.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite 8
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **AI Integration**: Groq SDK (llama-3.3-70b-versatile)
- **State Management**: React Context + useReducer

## 📖 Usage Guide

### 1. Plan Tab
Set your investment goals, risk tolerance, and timeline. The app will suggest a personalized target allocation.

### 2. Portfolio Tab
Input your current holdings to see:
- Portfolio health score
- Allocation vs target comparison
- AI-powered rebalancing suggestions

### 3. What-If Tab
Explore four market scenarios:
- Market drops 20%
- Inflation stays high
- Need to withdraw 20%
- Global instability rises

### 4. Risk Map Tab
View global geopolitical events and their potential portfolio impact with AI-driven protection strategies.

### 5. Review & Act Tab
Review saved rebalancing plans with:
- Before/after allocation comparison
- Step-by-step move breakdown
- Educational tool explanations

### 6. Game Tab
Play the business simulation game to learn investing concepts through practical decision-making.

## 🔧 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Project Structure

```
src/
├── components/
│   ├── tabs/
│   │   ├── PlanTab.jsx         # Goal-based onboarding
│   │   ├── PortfolioTab.jsx    # Portfolio management
│   │   ├── ScenariosTab.jsx    # What-if planning
│   │   ├── MapTab.jsx          # Global risk map
│   │   ├── ReviewActTab.jsx    # Plan review
│   │   └── GameTab.jsx         # Investment game
│   ├── MiniBanner.jsx          # Portfolio summary
│   ├── TabNav.jsx              # Navigation
│   └── RebalanceModal.jsx      # Rebalancing preview
├── data/
│   ├── scenarios.js            # Market scenarios
│   ├── events.js               # Global risk events
│   ├── positions.js            # Portfolio positions
│   ├── accounts.js             # Account types
│   ├── watchlist.js            # Research tools
│   ├── tools.js                # Investment vehicles
│   └── questions.js            # Game questions
├── services/
│   └── groqService.js          # AI integration
└── store/
    ├── initialState.js         # App state structure
    └── useAppStore.jsx         # State management
```

## 🤖 AI Integration

The app uses Groq's API for three types of recommendations:

1. **Portfolio Recommendations**: Analyzes allocation vs target and suggests moves
2. **Scenario Insights**: Provides guidance for hypothetical market scenarios
3. **Event Recommendations**: Suggests protection strategies for geopolitical risks
