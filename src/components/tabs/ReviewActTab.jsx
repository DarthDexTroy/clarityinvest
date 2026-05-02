import { useApp } from '../../store/useAppStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import './ReviewActTab.css';

const getHoldingAssetClass = (holding) => {
  const type = (holding.type || '').toLowerCase();
  const ticker = (holding.ticker || '').toUpperCase();
  if (type.includes('cash') || type.includes('money') || ticker.includes('CASH') || ticker.includes('SPAXX') || ticker.includes('FSGGX')) return 'cash';
  if (type.includes('bond') || ticker.includes('BND') || ticker.includes('VBTLX')) return 'bonds';
  return 'stocks';
};

const getAccountSnapshot = (account) => {
  const holdings = account?.holdings || [];
  const values = holdings.reduce((totals, holding) => {
    totals[getHoldingAssetClass(holding)] += holding.totalValue || 0;
    return totals;
  }, { stocks: 0, bonds: 0, cash: 0 });
  const total = values.stocks + values.bonds + values.cash;
  const allocation = total > 0
    ? {
        stocks: Math.round((values.stocks / total) * 100),
        bonds: Math.round((values.bonds / total) * 100),
        cash: 0
      }
    : { stocks: 0, bonds: 0, cash: 0 };
  allocation.cash = Math.max(0, 100 - allocation.stocks - allocation.bonds);
  return { values, allocation, total };
};

const getDefaultExecutionRecommendations = (plan, selectedAccount) => {
  const accountType = plan.accountType || selectedAccount?.type || 'Brokerage';
  const accountName = plan.accountName || selectedAccount?.name || 'this account';
  const recommendations = [];

  if (plan.stocks >= 65) {
    recommendations.push(
      {
        action: 'BUY',
        ticker: 'VTI',
        type: 'ETF',
        name: 'Vanguard Total Stock Market ETF',
        estimatedValue: Math.max(1000, Math.round((plan.stocks - 55) * 180)),
        reason: `Broad ETF exposure can support the ${plan.stocks}% stock target without relying on one company.`
      },
      {
        action: 'BUY',
        ticker: accountType === 'Traditional 401(k)' || accountType === '529 Plan' ? 'VTSAX' : 'FXAIX',
        type: 'Mutual Fund',
        name: accountType === 'Traditional 401(k)' || accountType === '529 Plan' ? 'Vanguard Total Stock Market Index' : 'Fidelity 500 Index Fund',
        estimatedValue: Math.max(800, Math.round(plan.stocks * 70)),
        reason: `A low-cost mutual fund is a simple core holding for ${accountName}.`
      }
    );
  }

  if (plan.bonds >= 20) {
    recommendations.push({
      action: 'BUY',
      ticker: accountType === 'Traditional 401(k)' || accountType === '529 Plan' ? 'VBTLX' : 'BND',
      type: accountType === 'Traditional 401(k)' || accountType === '529 Plan' ? 'Mutual Fund' : 'ETF',
      name: accountType === 'Traditional 401(k)' || accountType === '529 Plan' ? 'Vanguard Total Bond Market Index' : 'Vanguard Total Bond Market ETF',
      estimatedValue: Math.max(700, Math.round(plan.bonds * 85)),
      reason: `Bond exposure helps stabilize the plan when the target includes ${plan.bonds}% bonds.`
    });
  }

  if (accountType === 'Brokerage' && plan.stocks > 60) {
    recommendations.push({
      action: 'CONSIDER',
      ticker: 'MSFT',
      type: 'Stock',
      name: 'Microsoft Corp.',
      estimatedValue: 0,
      reason: 'A single stock can add growth, but keep individual companies smaller than diversified funds.'
    });
  } else if (accountType === 'Traditional 401(k)') {
    recommendations.push({
      action: 'CONSIDER',
      ticker: 'COMPANY',
      type: 'Stock',
      name: 'Employer Stock Match',
      estimatedValue: 0,
      reason: 'Keep employer stock limited so your paycheck and investments are not too concentrated in one company.'
    });
  }

  if (plan.cash >= 15) {
    recommendations.push({
      action: 'HOLD',
      ticker: 'CASH',
      type: 'Cash',
      name: 'Cash Reserve',
      estimatedValue: Math.round(plan.cash * 100),
      reason: `Cash supports the ${plan.cash}% target for near-term needs and emergency flexibility.`
    });
  }

  return recommendations.slice(0, 5);
};

export default function ReviewActTab({ account }) {
  const { state, dispatch } = useApp();
  const pendingPlan = state.pendingPlan;
  const activeAccountId = pendingPlan?.accountId || account?.id;
  const activeAccount = state.portfolioAccounts.find((item) => item.id === activeAccountId) || account;
  const accountSnapshot = getAccountSnapshot(activeAccount);
  const reviewPlan = pendingPlan ? {
    ...pendingPlan,
    accountId: pendingPlan.accountId || account?.id,
    stocks: Number.isFinite(pendingPlan.stocks) ? pendingPlan.stocks : accountSnapshot.allocation.stocks,
    bonds: Number.isFinite(pendingPlan.bonds) ? pendingPlan.bonds : accountSnapshot.allocation.bonds,
    cash: Number.isFinite(pendingPlan.cash) ? pendingPlan.cash : accountSnapshot.allocation.cash
  } : null;
  const executionRecommendations = reviewPlan
    ? (reviewPlan.tickerActions?.length ? reviewPlan.tickerActions : getDefaultExecutionRecommendations(reviewPlan, activeAccount))
    : [];
  const isRiskMapPlan = reviewPlan?.source === 'risk-map';
  
  const handleExecute = () => {
    if (!reviewPlan) {
      toast.error('No plan to execute. Create a plan first!');
      return;
    }
    
    dispatch({ type: 'APPLY_PLAN', payload: reviewPlan });
    dispatch({
      type: 'ADJUST_CONFIDENCE',
      payload: {
        amount: 8,
        reason: 'Plan executed! Your portfolio is now rebalanced to match your goals.',
        key: 'execute-plan'
      }
    });
    toast.success('🎉 Plan executed! Your portfolio has been rebalanced.');
  };
  
  if (!reviewPlan) {
    return (
      <div className="review-tab">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No plan yet</h2>
          <p>Create a plan in the Portfolio, What-If, or Risk Map tabs first.</p>
        </div>
        {state.lastReceipt && (
          <div className="execution-receipt">
            <div className="receipt-header">
              <span>Last Execution Receipt</span>
              <strong>{state.lastReceipt.accountName}</strong>
            </div>
            <p>{state.lastReceipt.scenarioTitle}</p>
            <div className="receipt-list">
              {state.lastReceipt.rows.map((row, index) => (
                <div className="receipt-row" key={`${row.asset}-${index}`}>
                  <span className={`receipt-action ${row.action.toLowerCase()}`}>{row.action}</span>
                  <strong>{row.asset}</strong>
                  <span>${Math.round(row.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  const total = accountSnapshot.total;
  const newStocks = Math.round((reviewPlan.stocks / 100) * total);
  const newBonds = Math.round((reviewPlan.bonds / 100) * total);
  const newCash = total - newStocks - newBonds;
  
  const moves = [];
  const stockDiff = newStocks - accountSnapshot.values.stocks;
  const bondDiff = newBonds - accountSnapshot.values.bonds;
  const cashDiff = newCash - accountSnapshot.values.cash;
  
  if (stockDiff !== 0) {
    moves.push({
      action: stockDiff > 0 ? 'Buy' : 'Sell',
      asset: 'Stocks',
      amount: Math.abs(stockDiff),
      percent: Math.abs(reviewPlan.stocks - accountSnapshot.allocation.stocks)
    });
  }
  
  if (bondDiff !== 0) {
    moves.push({
      action: bondDiff > 0 ? 'Buy' : 'Sell',
      asset: 'Bonds',
      amount: Math.abs(bondDiff),
      percent: Math.abs(reviewPlan.bonds - accountSnapshot.allocation.bonds)
    });
  }
  
  if (cashDiff !== 0) {
    moves.push({
      action: cashDiff > 0 ? 'Hold' : 'Use',
      asset: 'Cash',
      amount: Math.abs(cashDiff),
      percent: Math.abs(reviewPlan.cash - accountSnapshot.allocation.cash)
    });
  }
  
  return (
    <div className="review-tab">
      <div className="review-content">
        <div className="review-header">
          <h2>Review Your Plan</h2>
          <p>
            {reviewPlan.scenarioTitle
              ? `Plan created for: ${reviewPlan.scenarioTitle}`
              : "Here's what will change when you execute"}
          </p>
        </div>
        
        <div className="comparison-grid">
          <div className="comparison-col">
            <h3>Current Allocation</h3>
            <div className="alloc-list">
              <div className="alloc-row">
                <span>Stocks</span>
                <strong>{accountSnapshot.allocation.stocks}%</strong>
                <span className="dollar">${accountSnapshot.values.stocks.toLocaleString()}</span>
              </div>
              <div className="alloc-row">
                <span>Bonds</span>
                <strong>{accountSnapshot.allocation.bonds}%</strong>
                <span className="dollar">${accountSnapshot.values.bonds.toLocaleString()}</span>
              </div>
              <div className="alloc-row">
                <span>Cash</span>
                <strong>{accountSnapshot.allocation.cash}%</strong>
                <span className="dollar">${accountSnapshot.values.cash.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="arrow-col">→</div>
          
          <div className="comparison-col">
            <h3>New Allocation</h3>
            <div className="alloc-list">
              <div className="alloc-row">
                <span>Stocks</span>
                <strong>{reviewPlan.stocks}%</strong>
                <span className="dollar">${newStocks.toLocaleString()}</span>
              </div>
              <div className="alloc-row">
                <span>Bonds</span>
                <strong>{reviewPlan.bonds}%</strong>
                <span className="dollar">${newBonds.toLocaleString()}</span>
              </div>
              <div className="alloc-row">
                <span>Cash</span>
                <strong>{reviewPlan.cash}%</strong>
                <span className="dollar">${newCash.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="moves-section">
          <h3>Required Moves</h3>
          <div className="moves-list">
            {moves.map((move, i) => (
              <motion.div
                key={i}
                className="move-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="move-header">
                  <span className={`move-action ${move.action.toLowerCase()}`}>
                    {move.action}
                  </span>
                  <strong>{move.asset}</strong>
                </div>
                <div className="move-details">
                  <span className="move-amount">${move.amount.toLocaleString()}</span>
                  <span className="move-percent">({move.percent}% change)</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="transparency-section">
          <h3>Transparency</h3>
          <div className="transparency-card">
            {isRiskMapPlan && (
              <div className="transparency-item conflict-summary">
                <div className="conflict-summary-header">
                  <div>
                    <h4>Conflict Summary</h4>
                    <p className="conflict-eyebrow">{reviewPlan.sourceRegion || 'Global risk map'} • {reviewPlan.sourceRisk || 'Risk event'}</p>
                  </div>
                  {typeof reviewPlan.estimatedPortfolioImpact === 'number' && (
                    <strong className={reviewPlan.estimatedPortfolioImpact < 0 ? 'negative' : 'positive'}>
                      {reviewPlan.estimatedPortfolioImpact > 0 ? '+' : ''}{reviewPlan.estimatedPortfolioImpact.toFixed(1)}%
                    </strong>
                  )}
                </div>

                <div className="conflict-summary-grid">
                  <div>
                    <span>Triggered By</span>
                    <strong>{reviewPlan.conflictSummary || reviewPlan.scenarioTitle}</strong>
                  </div>
                  <div>
                    <span>Protection Focus</span>
                    <strong>{reviewPlan.protectionFocus || 'Defensive mix'}</strong>
                  </div>
                  <div>
                    <span>AI Shift</span>
                    <strong>{reviewPlan.shiftSummary || 'Adjust allocation toward stability.'}</strong>
                  </div>
                </div>

                {reviewPlan.aiRecommendation && (
                  <div className="conflict-ai-note">
                    <span>AI Recommendation</span>
                    <p>{reviewPlan.aiRecommendation}</p>
                  </div>
                )}
              </div>
            )}

            <div className="transparency-item">
              <h4>Why This Plan</h4>
              <p>{reviewPlan.rationale || `These moves align your portfolio with your target allocation, which is based on your risk profile: ${state.riskProfile}.`}</p>
            </div>

            <div className="transparency-item">
              <h4>Costs</h4>
              <p>{reviewPlan.costs || 'Trading fees may apply, though many modern brokers charge $0 for stock and ETF trades.'}</p>
            </div>

            {reviewPlan.taxImpact && (
              <div className="transparency-item tax-summary">
                <div className="tax-summary-header">
                  <h4>Taxes</h4>
                  <strong>${Math.round(reviewPlan.taxImpact.estimatedTax).toLocaleString()}</strong>
                </div>
                <p>{reviewPlan.taxes || 'Selling in taxable accounts may trigger capital gains taxes. Rebalancing in retirement accounts is usually tax-free at the time of trade.'}</p>
                <div className="tax-summary-grid">
                  <div>
                    <span>Taxable sales</span>
                    <strong>${Math.round(reviewPlan.taxImpact.taxableSales).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Estimated realized gains</span>
                    <strong>${Math.round(reviewPlan.taxImpact.realizedGains).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span>Assumed tax rate</span>
                    <strong>{Math.round((reviewPlan.taxImpact.rate || 0) * 100)}%</strong>
                  </div>
                </div>
                {reviewPlan.taxImpact.estimatedTax > 0 && reviewPlan.taxImpact.details?.length > 0 && (
                  <ul className="tax-impact-details">
                    {reviewPlan.taxImpact.details.map((detail) => (
                      <li key={detail.assetClass}>{detail.summary}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!reviewPlan.taxImpact && (
              <div className="transparency-item">
                <h4>Taxes</h4>
                <p>{reviewPlan.taxes || 'Selling in taxable accounts may trigger capital gains taxes. Rebalancing in retirement accounts is usually tax-free at the time of trade.'}</p>
              </div>
            )}

            <div className="transparency-item">
              <h4>Goal Fit</h4>
              <p>{reviewPlan.goalAlignment || 'The plan is designed to keep risk aligned with your long-term goals.'}</p>
            </div>

            <div className="transparency-item">
              <h4>Execution Tip</h4>
              <p>Rebalance gradually over 1-2 weeks to avoid market timing risk. Use limit orders for stocks.</p>
            </div>

            {reviewPlan.confidenceNote && (
              <div className="transparency-item">
                <h4>Plain-English Note</h4>
                <p>{reviewPlan.confidenceNote}</p>
              </div>
            )}
          </div>
        </div>
        
        {executionRecommendations.length > 0 && (
          <div className="ticker-actions-section">
            <h3>What to Buy, Sell, or Hold</h3>
            <p className="section-description">This simulated order list shows example stocks, ETFs, mutual funds, and cash moves that could support the plan.</p>
            
            <div className="ticker-actions-list">
              {executionRecommendations.map((action, i) => (
                <motion.div
                  key={i}
                  className={`ticker-action-card ${action.action.toLowerCase()}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="ticker-action-header">
                    <span className={`action-badge ${action.action.toLowerCase()}`}>
                      {action.action}
                    </span>
                    <div className="ticker-info">
                      <strong className="ticker-symbol">{action.ticker}</strong>
                      <span className="ticker-name">{action.name}</span>
                    </div>
                  </div>
                  
                  <div className="ticker-action-body">
                    {action.shares && (
                      <div className="action-detail">
                        <span className="detail-label">Shares:</span>
                        <span className="detail-value">{action.shares === 'ALL' ? 'All shares' : action.shares}</span>
                      </div>
                    )}
                    {action.amount && (
                      <div className="action-detail">
                        <span className="detail-label">Amount:</span>
                        <span className="detail-value">${action.amount.toLocaleString()}</span>
                      </div>
                    )}
                    {action.estimatedValue > 0 && (
                      <div className="action-detail">
                        <span className="detail-label">Estimated Value:</span>
                        <span className="detail-value">${action.estimatedValue.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="action-reason">
                      <span className="reason-icon">💡</span>
                      <p>{action.reason}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        
        <div className="execute-section">
          <button className="primary-button large" onClick={handleExecute}>
            ✓ Execute Plan
          </button>
          <p className="disclaimer">
            This simulates executing the plan. In real life, you would place these orders through your brokerage.
          </p>
        </div>
      </div>
    </div>
  );
}
