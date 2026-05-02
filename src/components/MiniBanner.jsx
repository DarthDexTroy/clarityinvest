import { motion } from 'framer-motion';
import './MiniBanner.css';

export default function MiniBanner({ account }) {
  if (!account || !account.holdings) {
    return null;
  }

  // Use the account's pre-calculated values from the store
  // This ensures consistency with Dashboard and other views
  const totalValue = account.totalBalance || account.holdings.reduce((sum, holding) => sum + holding.totalValue, 0);
  const stocksPercent = account.allocation?.stocks || 0;
  const bondsPercent = account.allocation?.bonds || 0;
  const cashPercent = account.allocation?.cash || 0;

  // Use the health score calculated by the store's calculateAccountHealth function
  // This is the SINGLE source of truth for health scores
  const health = account.healthScore || 50;
  const healthColor = health >= 80 ? '#00d4aa' : health >= 55 ? '#ffd93d' : '#ff6b9d';
  
  return (
    <motion.div 
      className="mini-banner"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      key={totalValue} // Re-animate when portfolio changes
    >
      <div className="banner-item">
        <span className="label">Portfolio:</span>
        <strong>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</strong>
      </div>
      
      <div className="banner-divider">|</div>
      
      <div className="banner-item">
        <span className="alloc-label">📈 Stocks</span>
        <strong>{stocksPercent}%</strong>
      </div>
      
      <div className="banner-item">
        <span className="alloc-label">🔒 Bonds</span>
        <strong>{bondsPercent}%</strong>
      </div>
      
      <div className="banner-item">
        <span className="alloc-label">💵 Cash</span>
        <strong>{cashPercent}%</strong>
      </div>
      
      <div className="banner-divider">|</div>
      
      <div className="banner-item">
        <span className="label">Health:</span>
        <strong style={{ color: healthColor }}>{health}</strong>
      </div>
    </motion.div>
  );
}
