import { createContext, useContext, useReducer, useEffect } from 'react';
import { initialState } from './initialState';

const getHoldingAssetClass = (holding) => {
  const type = (holding.type || '').toLowerCase();
  const ticker = (holding.ticker || '').toUpperCase();
  if (type.includes('cash') || type.includes('money') || ticker.includes('CASH') || ticker.includes('SPAXX') || ticker.includes('FSGGX')) return 'cash';
  if (type.includes('bond') || ticker.includes('BND') || ticker.includes('VBTLX')) return 'bonds';
  return 'stocks';
};

const calculateAccountHealth = (allocation, accountType) => {
  const targets = {
    Brokerage: { stocks: 70, bonds: 20, cash: 10 },
    'Roth IRA': { stocks: 80, bonds: 15, cash: 5 },
    HSA: { stocks: 55, bonds: 20, cash: 25 },
    'Traditional 401(k)': { stocks: 75, bonds: 20, cash: 5 },
    '529 Plan': { stocks: 60, bonds: 35, cash: 5 }
  };
  const target = targets[accountType] || { stocks: 65, bonds: 25, cash: 10 };
  const gap = Math.abs(allocation.stocks - target.stocks) + Math.abs(allocation.bonds - target.bonds) + Math.abs(allocation.cash - target.cash);
  const concentrationPenalty = allocation.stocks > 90 || allocation.cash > 60 ? 8 : 0;
  return Math.max(35, Math.min(96, Math.round(100 - gap * 0.45 - concentrationPenalty)));
};

const normalizeAccount = (account) => {
  const totalBalance = Math.round(account.holdings?.reduce((sum, holding) => sum + (holding.totalValue || 0), 0) || account.totalBalance || 0);
  const classTotals = { stocks: 0, bonds: 0, cash: 0 };
  account.holdings?.forEach((holding) => {
    classTotals[getHoldingAssetClass(holding)] += holding.totalValue || 0;
  });
  const allocation = totalBalance > 0 ? {
    stocks: Math.round((classTotals.stocks / totalBalance) * 100),
    bonds: Math.round((classTotals.bonds / totalBalance) * 100),
    cash: 0
  } : { stocks: 0, bonds: 0, cash: 0 };
  allocation.cash = Math.max(0, 100 - allocation.stocks - allocation.bonds);
  return {
    ...account,
    totalBalance,
    allocation,
    healthScore: calculateAccountHealth(allocation, account.type)
  };
};

const aggregateAccounts = (accounts) => accounts.reduce((totals, account) => {
  account.holdings?.forEach((holding) => {
    totals[getHoldingAssetClass(holding)] += holding.totalValue || 0;
  });
  return totals;
}, { stocks: 0, bonds: 0, cash: 0 });

const rebalanceAccountToPlan = (account, plan) => {
  const totalBalance = account.totalBalance || account.holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
  const targetValues = {
    stocks: Math.round(totalBalance * ((plan.stocks || 0) / 100)),
    bonds: Math.round(totalBalance * ((plan.bonds || 0) / 100)),
    cash: 0
  };
  targetValues.cash = Math.max(0, totalBalance - targetValues.stocks - targetValues.bonds);

  const currentValues = { stocks: 0, bonds: 0, cash: 0 };
  account.holdings.forEach((holding) => {
    currentValues[getHoldingAssetClass(holding)] += holding.totalValue || 0;
  });

  const updatedHoldings = account.holdings.map((holding) => {
    const assetClass = getHoldingAssetClass(holding);
    const currentClassValue = currentValues[assetClass];
    const targetClassValue = targetValues[assetClass];
    const nextValue = currentClassValue > 0
      ? Math.round((holding.totalValue / currentClassValue) * targetClassValue)
      : holding.totalValue;
    const nextShares = holding.price ? Number((nextValue / holding.price).toFixed(2)) : holding.shares;
    const costRatio = holding.totalValue > 0 ? (holding.costBasis || holding.totalValue) / holding.totalValue : 1;
    return {
      ...holding,
      shares: nextShares,
      totalValue: nextValue,
      costBasis: Math.round(nextValue * costRatio),
      allocation: totalBalance > 0 ? Number(((nextValue / totalBalance) * 100).toFixed(1)) : 0
    };
  });

  const receipt = [
    { asset: 'Stocks', before: currentValues.stocks, after: targetValues.stocks },
    { asset: 'Bonds', before: currentValues.bonds, after: targetValues.bonds },
    { asset: 'Cash', before: currentValues.cash, after: targetValues.cash }
  ]
    .filter((item) => Math.abs(item.after - item.before) > 1)
    .map((item) => ({
      action: item.asset === 'Cash' ? (item.after > item.before ? 'Hold' : 'Use') : item.after > item.before ? 'Buy' : 'Sell',
      asset: item.asset,
      amount: Math.abs(item.after - item.before)
    }));

  if (plan.tickerActions?.length) {
    plan.tickerActions.forEach((action) => {
      receipt.push({
        action: action.action,
        asset: action.ticker,
        amount: action.estimatedValue || action.amount || 0,
        note: action.reason
      });
    });
  }

  return {
    account: normalizeAccount({ ...account, holdings: updatedHoldings, totalBalance }),
    receipt
  };
};

function syncDerived(state) {
  const total = state.holdings.stocks + state.holdings.bonds + state.holdings.cash;
  if (total === 0) {
    return { ...state, allocation: { stocks: 0, bonds: 0, cash: 0 }, health: 35 };
  }
  
  const allocation = {
    stocks: Math.round((state.holdings.stocks / total) * 100),
    bonds: Math.round((state.holdings.bonds / total) * 100),
    cash: 0
  };
  allocation.cash = Math.max(0, 100 - allocation.stocks - allocation.bonds);
  
  // Calculate health score
  const stockGap = Math.abs(allocation.stocks - state.target.stocks);
  const bondGap = Math.abs(allocation.bonds - state.target.bonds);
  const cashGap = Math.abs(allocation.cash - state.target.cash);
  const penalty = (stockGap > 20 || bondGap > 20 || cashGap > 20) ? 8 : 0;
  const health = Math.max(35, Math.min(96, Math.round(100 - stockGap * 0.55 - bondGap * 0.25 - cashGap * 0.2 - penalty)));
  
  return { ...state, allocation, health };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SYNC_PORTFOLIO_ACCOUNTS':
      {
        const portfolioAccounts = state.portfolioAccounts.map(normalizeAccount);
        return syncDerived({ ...state, portfolioAccounts, holdings: aggregateAccounts(portfolioAccounts) });
      }

    case 'SET_HOLDINGS': {
      const newState = { ...state, holdings: action.payload };
      return syncDerived(newState);
    }
    
    case 'SET_TARGET': {
      const newState = { ...state, target: action.payload };
      return syncDerived(newState);
    }
    
    case 'SET_RISK_PROFILE':
      return { ...state, riskProfile: action.payload };
    
    case 'ADJUST_CONFIDENCE': {
      const { amount, reason, key } = action.payload;
      const events = new Set(state.confidenceEvents);
      if (key && events.has(key)) return state;
      if (key) events.add(key);
      
      const newConfidence = Math.max(0, Math.min(100, state.confidence + amount));
      const delta = amount > 0 ? `+${amount}` : amount < 0 ? `${amount}` : 'No change';
      
      return {
        ...state,
        confidence: newConfidence,
        confidenceReason: reason,
        confidenceDelta: delta,
        confidenceEvents: events
      };
    }
    
    case 'SET_SELECTED_SCENARIO':
      return { ...state, selectedScenario: action.payload };
    
    case 'SET_SELECTED_EVENT':
      return { ...state, selectedEvent: action.payload };
    
    case 'SET_PENDING_PLAN':
      return { ...state, pendingPlan: action.payload };
    
    case 'SET_PLAN_ANSWERS':
      return { 
        ...state, 
        planAnswers: {
          ...state.planAnswers,
          [action.payload.accountType]: action.payload.answers
        }
      };
    
    case 'SET_PLAN_RECOMMENDATIONS':
      return {
        ...state,
        planRecommendations: {
          ...state.planRecommendations,
          [action.payload.accountType]: action.payload.recommendations
        }
      };
    
    case 'APPLY_PLAN': {
      const plan = action.payload;
      let portfolioAccounts = state.portfolioAccounts;
      let lastReceipt = null;
      if (plan.accountId) {
        portfolioAccounts = state.portfolioAccounts.map((account) => {
          if (account.id !== plan.accountId) return account;
          const result = rebalanceAccountToPlan(account, plan);
          lastReceipt = {
            accountId: account.id,
            accountName: account.name,
            scenarioTitle: plan.scenarioTitle || 'Executed plan',
            executedAt: new Date().toISOString(),
            rows: result.receipt
          };
          return result.account;
        });
      }
      const newHoldings = aggregateAccounts(portfolioAccounts);
      const newState = { ...state, holdings: newHoldings, portfolioAccounts, pendingPlan: null, lastReceipt };
      return syncDerived(newState);
    }
    
    case 'SET_MAP_ZOOM':
      return { ...state, mapZoom: action.payload };
    
    case 'SET_MAP_PAN':
      return { ...state, mapPanX: action.payload.x, mapPanY: action.payload.y };
    
    case 'UPDATE_GAME':
      return { ...state, game: { ...state.game, ...action.payload } };
    
    case 'RESET_GAME':
      return { ...state, game: { ...initialState.game } };
    
    case 'TOGGLE_ACCORDION':
      return { 
        ...state, 
        activeAccordion: state.activeAccordion === action.payload ? null : action.payload 
      };
    
    case 'SET_SHOW_BEFORE_AFTER':
      return { ...state, showBeforeAfter: action.payload };
    
    case 'ADD_CONTRIBUTION': {
      const { accountId, amount, assetClass } = action.payload;
      const portfolioAccounts = state.portfolioAccounts.map((account) => {
        if (account.id !== accountId) return account;
        
        // Add contribution to the appropriate holding
        const updatedHoldings = account.holdings.map((holding) => {
          const holdingAssetClass = getHoldingAssetClass(holding);
          if (holdingAssetClass === assetClass || (assetClass === 'all' && holdingAssetClass !== 'cash')) {
            // Add to existing holding proportionally, or add to cash if specified
            const shareIncrease = holding.price > 0 ? amount / holding.price : 0;
            return {
              ...holding,
              shares: holding.shares + shareIncrease,
              totalValue: holding.totalValue + amount,
              costBasis: holding.costBasis + amount
            };
          }
          return holding;
        });
        
        // If contributing to cash or no matching holding found, add to cash holding
        if (assetClass === 'cash') {
          const cashHolding = updatedHoldings.find(h => getHoldingAssetClass(h) === 'cash');
          if (cashHolding) {
            const index = updatedHoldings.indexOf(cashHolding);
            updatedHoldings[index] = {
              ...cashHolding,
              shares: cashHolding.shares + amount,
              totalValue: cashHolding.totalValue + amount,
              costBasis: cashHolding.costBasis + amount
            };
          } else {
            // Create new cash holding if it doesn't exist
            updatedHoldings.push({
              ticker: 'CASH',
              name: 'Cash Reserve',
              type: 'Cash',
              shares: amount,
              price: 1.00,
              totalValue: amount,
              costBasis: amount,
              gainLoss: 0,
              allocation: 0
            });
          }
        }
        
        return normalizeAccount({ ...account, holdings: updatedHoldings });
      });
      
      const newHoldings = aggregateAccounts(portfolioAccounts);
      return syncDerived({ ...state, portfolioAccounts, holdings: newHoldings });
    }
    
    default:
      return state;
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, syncDerived(initialState));
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
