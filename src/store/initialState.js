import { investmentAccounts } from '../data/appData';

export const initialState = {
  portfolioAccounts: investmentAccounts,

  // Portfolio holdings (actual dollar amounts)
  holdings: {
    stocks: 32760,
    bonds: 6720,
    cash: 2520
  },
  
  // Target allocation (percentages)
  target: {
    stocks: 45,
    bonds: 40,
    cash: 15
  },
  
  // Current allocation (percentages) - derived
  allocation: {
    stocks: 78,
    bonds: 16,
    cash: 6
  },
  
  // Portfolio health score (35-96)
  health: 72,
  
  // Risk profile
  riskProfile: 'Careful Planner',
  
  // Confidence tracking
  confidence: 50,
  confidenceReason: 'Confidence improves when actions are aligned with your goal, not when you simply click around.',
  confidenceDelta: 'No change yet',
  confidenceEvents: new Set(),
  
  // Scenarios
  selectedScenario: 0,
  
  // Global risk map
  selectedEvent: 0,
  mapZoom: 1,
  mapPanX: 0,
  mapPanY: 0,
  
  // Pending rebalance plan
  pendingPlan: null,
  
  // Plan questionnaire answers by account type
  planAnswers: {},
  
  // Plan recommendations by account type
  planRecommendations: {},
  
  // Game state
  game: {
    company: 'Clarity Coffee Co.',
    day: 1,
    profit: 1000,
    wrong: 0,
    streak: 0,
    difficulty: 1,
    over: false,
    currentQuestion: 0,
    lastProfit: 1000,
    lastChange: 0,
    earnedMilestones: new Set(),
    profitHistory: [1000]
  },
  
  // UI state
  activeAccordion: null,
  showBeforeAfter: false
};
