import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../store/useAppStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './PortfolioTab.css';

const SORT_ICONS = {
  asc: '↑',
  desc: '↓',
  none: '↕'
};

const ASSET_COLORS = {
  'Stock': '#6c5ce7',
  'ETF': '#00d4aa',
  'Mutual Fund': '#a78bfa',
  'Bond': '#ffd93d',
  'Cash': '#cbd5e1',
  'Money Market': '#94a3b8'
};

const TYPE_INFO = {
  'Stock': {
    title: 'Stock',
    description: 'A stock is a small ownership share in one company.',
    detail: 'Stocks can grow a lot, but one-company risk is higher than owning a diversified ETF or mutual fund.'
  },
  'ETF': {
    title: 'ETF',
    description: 'An ETF is a basket of investments that trades during the day like a stock.',
    detail: 'Often useful in taxable brokerage accounts because many broad index ETFs are low cost and tax efficient.'
  },
  'Mutual Fund': {
    title: 'Mutual Fund',
    description: 'A mutual fund is a pooled investment managed by a fund company, usually priced once after market close.',
    detail: 'Often useful for automated investing, retirement accounts, and dollar-based purchases.'
  }
};

// Holding information database
const HOLDING_INFO = {
  'AAPL': {
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    assetClass: 'Large Cap Growth Stock',
    riskLevel: 'Moderate to High',
    whyHeld: 'Strong brand, innovative products, and consistent revenue growth make it a core tech holding.',
    expenseRatio: 'N/A (Individual Stock)'
  },
  'COMPANY': {
    description: 'Employer stock match represents shares of your employer received through a workplace benefit or matching program.',
    assetClass: 'Single-Company Stock',
    riskLevel: 'High',
    whyHeld: 'Employer stock can be valuable, but it also concentrates job income and investment risk in the same company.',
    expenseRatio: 'N/A (Individual Stock)'
  },
  'MSFT': {
    description: 'Microsoft Corporation develops and supports software, services, devices, and solutions worldwide.',
    assetClass: 'Large Cap Growth Stock',
    riskLevel: 'Moderate',
    whyHeld: 'Market leader in cloud computing and enterprise software with stable growth.',
    expenseRatio: 'N/A (Individual Stock)'
  },
  'AMZN': {
    description: 'Amazon.com Inc. engages in e-commerce, cloud computing, digital streaming, and artificial intelligence.',
    assetClass: 'Large Cap Growth Stock',
    riskLevel: 'Moderate to High',
    whyHeld: 'Dominant in e-commerce and cloud services (AWS) with strong long-term growth potential.',
    expenseRatio: 'N/A (Individual Stock)'
  },
  'VTI': {
    description: 'Vanguard Total Stock Market ETF tracks the CRSP US Total Market Index, representing the entire U.S. stock market.',
    assetClass: 'Broad Market ETF',
    riskLevel: 'Moderate',
    whyHeld: 'Provides instant diversification across all U.S. stocks with ultra-low fees.',
    expenseRatio: '0.03%'
  },
  'VFIAX': {
    description: 'Vanguard 500 Index Fund tracks the S&P 500, representing the 500 largest U.S. companies.',
    assetClass: 'Large Cap Index Fund',
    riskLevel: 'Moderate',
    whyHeld: 'Classic core holding providing exposure to established U.S. large-cap companies.',
    expenseRatio: '0.04%'
  },
  'FXAIX': {
    description: 'Fidelity 500 Index Fund tracks the S&P 500 index with a very low expense ratio.',
    assetClass: 'Large Cap Index Fund',
    riskLevel: 'Moderate',
    whyHeld: 'Low-cost S&P 500 exposure, perfect for Roth IRA tax-free growth.',
    expenseRatio: '0.015%'
  },
  'VTSAX': {
    description: 'Vanguard Total Stock Market Index Fund provides exposure to the entire U.S. equity market.',
    assetClass: 'Total Market Index Fund',
    riskLevel: 'Moderate',
    whyHeld: 'Ideal for HSA long-term growth with complete market diversification.',
    expenseRatio: '0.04%'
  },
  'BND': {
    description: 'Vanguard Total Bond Market ETF provides broad exposure to U.S. investment-grade bonds.',
    assetClass: 'Bond ETF',
    riskLevel: 'Low-Moderate',
    whyHeld: 'Provides stability and income while reducing portfolio volatility.',
    expenseRatio: '0.03%'
  },
  'CASH': {
    description: 'Cash reserves held in money market or settlement account.',
    assetClass: 'Cash Equivalent',
    riskLevel: 'Very Low',
    whyHeld: 'Provides liquidity for opportunities and reduces overall portfolio risk.',
    expenseRatio: 'N/A'
  },
  'VBTLX': {
    description: 'Vanguard Total Bond Market Index Fund provides broad exposure to the U.S. investment-grade bond market, including Treasuries, government agency, and corporate bonds.',
    assetClass: 'Bond Index Fund',
    riskLevel: 'Low-Moderate',
    whyHeld: 'Adds stability and income to a retirement portfolio while cushioning against stock market volatility.',
    expenseRatio: '0.05%'
  },
  'VTIAX': {
    description: 'Vanguard Total International Stock Index Fund tracks stocks from developed and emerging markets outside the U.S., offering broad global diversification.',
    assetClass: 'International Equity Index Fund',
    riskLevel: 'Moderate to High',
    whyHeld: 'Provides international diversification to reduce dependence on the U.S. market and capture global growth.',
    expenseRatio: '0.11%'
  },
  'FSGGX': {
    description: 'Fidelity Government Money Market Fund invests in short-term U.S. government securities and aims to maintain a stable $1 NAV.',
    assetClass: 'Money Market Fund',
    riskLevel: 'Very Low',
    whyHeld: 'Acts as a cash-equivalent position inside the 401(k), preserving capital and providing liquidity for future rebalancing.',
    expenseRatio: '0.42%'
  }
};

export default function PortfolioTab({ account: accountProp }) {
  const { state, dispatch } = useApp();
  // Always read the live account from the store so balances reflect the latest plan/contribution
  const account = state.portfolioAccounts.find(a => a.id === accountProp?.id) || accountProp;
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'totalValue', direction: 'desc' });
  const [filterType, setFilterType] = useState('All');
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedTypeRow, setExpandedTypeRow] = useState(null);
  const [typePopoverPos, setTypePopoverPos] = useState({ top: 0, left: 0, right: 'auto' });

  const handleHoldingChange = (holding, updates) => {
    dispatch({
      type: 'UPDATE_HOLDING',
      payload: {
        accountId: account.id,
        ticker: holding.ticker,
        updates
      }
    });
  };

  useEffect(() => {
    if (!expandedTypeRow) return;
    const close = () => setExpandedTypeRow(null);
    document.addEventListener('click', close, true);
    return () => document.removeEventListener('click', close, true);
  }, [expandedTypeRow]);

  // Show holdings for the selected investment account so totals match the account header.
  const allHoldings = useMemo(() => {
    if (!account?.holdings) return [];
    return account.holdings.map((holding) => ({
      ...holding,
      accountType: account.type,
      accountName: account.name
    }));
  }, [account]);

  if (!allHoldings || allHoldings.length === 0) {
    return (
      <div className="portfolio-tab">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Holdings Found</h3>
          <p>No holdings found for this account.</p>
          <p className="empty-hint">💡 This view shows holdings from the selected investment account with detailed information about each position.</p>
        </div>
      </div>
    );
  }

  const holdings = allHoldings;
  const uniqueTypes = ['All', ...new Set(holdings.map(h => h.type))];

  // Calculate totals
  const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalGainLoss = holdings.reduce((sum, h) => {
    const gain = h.totalValue - h.costBasis;
    return sum + gain;
  }, 0);
  const totalGainLossPercent = (totalGainLoss / (totalValue - totalGainLoss)) * 100;

  // Get day change (simulated)
  const dayChange = useMemo(() => {
    const seed = holdings.reduce((sum, holding) => sum + holding.ticker.charCodeAt(0), 0);
    return totalValue * (((seed % 17) - 8) / 1000);
  }, [holdings, totalValue]);
  const dayChangePercent = (dayChange / totalValue) * 100;

  // Filter and search
  const filteredHoldings = useMemo(() => {
    let filtered = holdings;

    // Filter by type
    if (filterType !== 'All') {
      filtered = filtered.filter(h => h.type === filterType);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(h =>
        h.ticker.toLowerCase().includes(term) ||
        h.name.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [holdings, filterType, searchTerm]);

  // Sort
  const sortedHoldings = useMemo(() => {
    const sorted = [...filteredHoldings];

    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // String comparison for ticker and name
      if (sortConfig.key === 'ticker' || sortConfig.key === 'name' || sortConfig.key === 'type') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
        if (sortConfig.direction === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      }

      // Numeric comparison
      if (sortConfig.direction === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });

    return sorted;
  }, [filteredHoldings, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'desc' ? 'asc' : 'desc'
        };
      }
      return { key, direction: 'desc' };
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return SORT_ICONS[sortConfig.direction];
    }
    return SORT_ICONS.none;
  };

  // Prepare pie chart data
  const pieData = useMemo(() => {
    const typeGroups = {};
    holdings.forEach(h => {
      if (!typeGroups[h.type]) {
        typeGroups[h.type] = 0;
      }
      typeGroups[h.type] += h.totalValue;
    });

    return Object.keys(typeGroups).map(type => ({
      name: type,
      value: typeGroups[type],
      percent: ((typeGroups[type] / totalValue) * 100).toFixed(1)
    }));
  }, [holdings, totalValue]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="pie-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">{formatCurrency(payload[0].value)}</p>
          <p className="tooltip-percent">{payload[0].payload.percent}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="portfolio-tab">
      {/* Portfolio Summary */}
      <div className="portfolio-summary">
        <div className="summary-card main-card">
          <div className="summary-label">Total Portfolio Value</div>
          <div className="summary-value">{formatCurrency(totalValue)}</div>
          <div className={`summary-change ${dayChange >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(dayChange)} ({formatPercent(dayChangePercent)}) today
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Total Gain/Loss</div>
          <div className={`summary-value ${totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(totalGainLoss)}
          </div>
          <div className={`summary-detail ${totalGainLossPercent >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(totalGainLossPercent)} return
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Holdings</div>
          <div className="summary-value">{holdings.length}</div>
          <div className="summary-detail">{uniqueTypes.length - 1} asset types</div>
        </div>
      </div>

      {/* Holdings Table and Chart */}
      <div className="portfolio-grid">
        {/* Left: Holdings Table */}
        <div className="holdings-section">
          <div className="section-header">
            <h3>Holdings</h3>
            <div className="filter-controls">
              <select 
                className="type-filter"
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
              >
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search ticker or name..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="holdings-table-wrapper">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('ticker')}>
                    Ticker {getSortIcon('ticker')}
                  </th>
                  <th onClick={() => handleSort('name')}>
                    Name {getSortIcon('name')}
                  </th>
                  <th onClick={() => handleSort('type')}>
                    Type {getSortIcon('type')}
                  </th>
                  <th onClick={() => handleSort('shares')} className="text-right">
                    Shares {getSortIcon('shares')}
                  </th>
                  <th onClick={() => handleSort('price')} className="text-right">
                    Price {getSortIcon('price')}
                  </th>
                  <th onClick={() => handleSort('totalValue')} className="text-right">
                    Total Value {getSortIcon('totalValue')}
                  </th>
                  <th onClick={() => handleSort('gainLoss')} className="text-right">
                    Gain/Loss {getSortIcon('gainLoss')}
                  </th>
                  <th onClick={() => handleSort('allocation')} className="text-right">
                    Allocation {getSortIcon('allocation')}
                  </th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {sortedHoldings.map((holding, index) => {
                  const isPositiveGain = holding.gainLoss >= 0;
                  const rowKey = `${holding.ticker}-${holding.accountType}-${index}`;
                  const isExpanded = expandedRow === rowKey;
                  const isTypeExpanded = expandedTypeRow === rowKey;
                  const holdingInfo = HOLDING_INFO[holding.ticker];
                  const typeInfo = TYPE_INFO[holding.type];
                  
                  return (
                    <React.Fragment key={rowKey}>
                      <tr className={isExpanded ? 'expanded' : ''}>
                        <td className="ticker-cell">
                          <span className="ticker-badge">{holding.ticker}</span>
                          <div className="holding-account-badge">{holding.accountType}</div>
                        </td>
                        <td className="name-cell">{holding.name}</td>
                        <td>
                          <div
                            className="type-cell-content"
                            style={{
                              '--type-color': ASSET_COLORS[holding.type],
                              '--type-bg': ASSET_COLORS[holding.type] + '20',
                              '--type-border': ASSET_COLORS[holding.type] + '55'
                            }}
                          >
                            <span className="type-badge">
                              {holding.type}
                            </span>
                            {typeInfo && (
                              <>
                                <button
                                  type="button"
                                  className="type-info-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isTypeExpanded) { setExpandedTypeRow(null); return; }
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const popoverH = 120; // estimated height
                                    const popoverW = 280;
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    const spaceRight = window.innerWidth - rect.left;
                                    const top = spaceBelow >= popoverH + 12
                                      ? rect.bottom + 8
                                      : rect.top - popoverH - 8;
                                    const left = spaceRight >= popoverW
                                      ? rect.left
                                      : Math.max(8, rect.right - popoverW);
                                    setTypePopoverPos({ top, left, right: 'auto' });
                                    setExpandedTypeRow(rowKey);
                                  }}
                                  aria-label={`Toggle ${holding.type} information`}
                                  aria-expanded={isTypeExpanded}
                                >
                                  i
                                </button>
                                {isTypeExpanded && (
                                  <div
                                    className="type-info-popover"
                                    role="note"
                                    style={{
                                      position: 'fixed',
                                      top: typePopoverPos.top,
                                      left: typePopoverPos.left,
                                      right: typePopoverPos.right,
                                      zIndex: 9999
                                    }}
                                  >
                                    <strong>{typeInfo.title}</strong>
                                    <span>{typeInfo.description}</span>
                                    <span>{typeInfo.detail}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="text-right">
                          <input
                            className="holding-edit-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={Number(holding.shares.toFixed ? holding.shares.toFixed(2) : holding.shares)}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => handleHoldingChange(holding, { shares: event.target.value === '' ? 0 : Number(event.target.value) })}
                            aria-label={`Edit shares for ${holding.ticker}`}
                          />
                        </td>
                        <td className="text-right">
                          <input
                            className="holding-edit-input price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={Number(holding.price.toFixed ? holding.price.toFixed(2) : holding.price)}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => handleHoldingChange(holding, { price: event.target.value === '' ? 0 : Number(event.target.value) })}
                            aria-label={`Edit price for ${holding.ticker}`}
                          />
                        </td>
                        <td className="text-right value-cell">{formatCurrency(holding.totalValue)}</td>
                        <td className={`text-right ${isPositiveGain ? 'positive' : 'negative'}`}>
                          {formatPercent(holding.gainLoss)}
                        </td>
                        <td className="text-right">{holding.allocation.toFixed(1)}%</td>
                        <td className="info-cell">
                          <button 
                            className="info-button"
                            onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                            aria-label="Toggle holding information"
                          >
                            {isExpanded ? '✕' : 'ℹ️'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && holdingInfo && (
                        <tr className="expanded-info-row">
                          <td colSpan="9">
                            <div className="holding-details">
                              <div className="detail-section">
                                <h4>About {holding.ticker}</h4>
                                <p>{holdingInfo.description}</p>
                              </div>
                              <div className="detail-grid">
                                <div className="detail-item">
                                  <span className="detail-label">Asset Class</span>
                                  <span className="detail-value">{holdingInfo.assetClass}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Risk Level</span>
                                  <span className="detail-value">{holdingInfo.riskLevel}</span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">Expense Ratio</span>
                                  <span className="detail-value">{holdingInfo.expenseRatio}</span>
                                </div>
                                <div className="detail-item full-width">
                                  <span className="detail-label">Why it's held in {holding.accountType}</span>
                                  <span className="detail-value">{holdingInfo.whyHeld}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {sortedHoldings.length === 0 && (
              <div className="no-results">
                <p>No holdings match your filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Allocation Chart */}
        <div className="allocation-section">
          <h3>Allocation by Type</h3>
          <div className="allocation-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={82}
                  startAngle={90}
                  endAngle={450}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.name] || '#cbd5e1'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="allocation-legend">
            {pieData.map((entry, index) => (
              <div key={index} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: ASSET_COLORS[entry.name] }}></span>
                <span className="legend-name">{entry.name}</span>
                <span className="legend-value">{entry.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
