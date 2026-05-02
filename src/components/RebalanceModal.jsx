import { useApp } from '../store/useAppStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import './RebalanceModal.css';

export default function RebalanceModal({ onClose, source, aiRecommendation, loadingAI, onConfirm }) {
  const { state } = useApp();
  
  if (!state.pendingPlan) return null;
  
  const total = state.holdings.stocks + state.holdings.bonds + state.holdings.cash;
  const newStocks = Math.round((state.pendingPlan.stocks / 100) * total);
  const newBonds = Math.round((state.pendingPlan.bonds / 100) * total);
  const newCash = total - newStocks - newBonds;
  
  const stockDiff = newStocks - state.holdings.stocks;
  const bondDiff = newBonds - state.holdings.bonds;
  const cashDiff = newCash - state.holdings.cash;
  
  const handleConfirm = () => {
    const titles = {
      portfolio: 'Suggested moves saved to Review & Act.',
      scenario: 'Scenario plan saved to Review & Act.',
      event: 'Protection plan saved to Review & Act.'
    };
    
    toast.success(titles[source] || 'Plan saved!');
    onConfirm?.();
    onClose();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>
            {source === 'portfolio' && 'Preview Portfolio Rebalance'}
            {source === 'scenario' && 'Apply Scenario Plan'}
            {source === 'event' && 'Protect From Event'}
          </h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {source === 'event' && state.pendingPlan.scenarioTitle && (
            <div className="event-conflict-block">
              <div className="event-conflict-header">
                <span className="event-conflict-icon">⚠️</span>
                <div className="event-conflict-meta">
                  <span className="event-conflict-name">{state.pendingPlan.scenarioTitle}</span>
                  <div className="event-conflict-badges">
                    {state.pendingPlan.sourceRegion && (
                      <span className="badge-region">{state.pendingPlan.sourceRegion}</span>
                    )}
                    {state.pendingPlan.sourceRisk && (
                      <span className={`badge-risk risk-${state.pendingPlan.sourceRisk.toLowerCase()}`}>
                        {state.pendingPlan.sourceRisk} Risk
                      </span>
                    )}
                    {typeof state.pendingPlan.estimatedPortfolioImpact === 'number' && (
                      <span className="badge-impact">
                        {state.pendingPlan.estimatedPortfolioImpact > 0 ? '+' : ''}{state.pendingPlan.estimatedPortfolioImpact.toFixed(1)}% portfolio impact
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="event-conflict-details">
                {state.pendingPlan.protectionFocus && (
                  <div className="event-detail-item">
                    <span className="event-detail-label">Protection Focus</span>
                    <span className="event-detail-value">{state.pendingPlan.protectionFocus}</span>
                  </div>
                )}
                {state.pendingPlan.shiftSummary && (
                  <div className="event-detail-item">
                    <span className="event-detail-label">AI Shift Plan</span>
                    <span className="event-detail-value">{state.pendingPlan.shiftSummary}</span>
                  </div>
                )}
              </div>
              {state.pendingPlan.aiRecommendation && (
                <div className="event-ai-rec">
                  <span className="event-ai-rec-label">🤖 AI Recommendation</span>
                  <p>{state.pendingPlan.aiRecommendation}</p>
                </div>
              )}
            </div>
          )}

          {source !== 'event' && aiRecommendation && !loadingAI && (
            <div className="ai-rec-box">
              <h4>🤖 AI Recommendation</h4>
              <p>{aiRecommendation}</p>
            </div>
          )}
          
          <div className="moves-section">
            <h4>Required Moves</h4>
            {stockDiff !== 0 && (
              <div className="move-row">
                <span className={stockDiff > 0 ? 'action-buy' : 'action-sell'}>
                  {stockDiff > 0 ? 'Buy' : 'Sell'}
                </span>
                <span className="asset">Stocks</span>
                <strong>${Math.abs(stockDiff).toLocaleString()}</strong>
                <span className="percent">({Math.abs(state.pendingPlan.stocks - state.allocation.stocks)}%)</span>
              </div>
            )}
            
            {bondDiff !== 0 && (
              <div className="move-row">
                <span className={bondDiff > 0 ? 'action-buy' : 'action-sell'}>
                  {bondDiff > 0 ? 'Buy' : 'Sell'}
                </span>
                <span className="asset">Bonds</span>
                <strong>${Math.abs(bondDiff).toLocaleString()}</strong>
                <span className="percent">({Math.abs(state.pendingPlan.bonds - state.allocation.bonds)}%)</span>
              </div>
            )}
            
            {cashDiff !== 0 && (
              <div className="move-row">
                <span className={cashDiff > 0 ? 'action-buy' : 'action-sell'}>
                  {cashDiff > 0 ? 'Add' : 'Reduce'}
                </span>
                <span className="asset">Cash</span>
                <strong>${Math.abs(cashDiff).toLocaleString()}</strong>
                <span className="percent">({Math.abs(state.pendingPlan.cash - state.allocation.cash)}%)</span>
              </div>
            )}
          </div>
          
          <div className="result-allocation">
            <h4>New Allocation</h4>
            <div className="alloc-preview">
              <div className="alloc-bar">
                <div className="fill stocks" style={{ width: `${state.pendingPlan.stocks}%` }}></div>
                <div className="fill bonds" style={{ width: `${state.pendingPlan.bonds}%` }}></div>
                <div className="fill cash" style={{ width: `${state.pendingPlan.cash}%` }}></div>
              </div>
              <div className="alloc-labels">
                <span>Stocks {state.pendingPlan.stocks}%</span>
                <span>Bonds {state.pendingPlan.bonds}%</span>
                <span>Cash {state.pendingPlan.cash}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" onClick={handleConfirm}>
            Save to Review & Act
          </button>
        </div>
      </motion.div>
    </div>
  );
}
