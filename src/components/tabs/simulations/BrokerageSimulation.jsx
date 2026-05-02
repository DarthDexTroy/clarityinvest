import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useApp } from '../../../store/useAppStore';
import toast from 'react-hot-toast';
import './SimulationStyles.css';

function BrokerageSimulation() {
  const { state, dispatch } = useApp();
  const [inputs, setInputs] = useState({
    initialInvestment: 25000,
    monthlyContribution: 500,
    expectedReturn: 8,
    timeHorizon: 20,
    taxRate: 22
  });

  const [projectionData, setProjectionData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalContributed: 0,
    totalGrowth: 0,
    finalBalance: 0,
    taxOwed: 0,
    taxDrag: 0
  });

  useEffect(() => {
    calculateProjection();
  }, [inputs]);

  const calculateProjection = () => {
    const { initialInvestment, monthlyContribution, expectedReturn, timeHorizon, taxRate } = inputs;
    const monthlyRate = expectedReturn / 100 / 12;
    const taxDragRate = (taxRate / 100) * (expectedReturn / 100);
    const afterTaxReturn = expectedReturn - (taxDragRate * 100);
    const afterTaxMonthlyRate = afterTaxReturn / 100 / 12;

    let data = [];
    let balanceBeforeTax = initialInvestment;
    let balanceAfterTax = initialInvestment;
    let totalContributed = initialInvestment;

    for (let year = 0; year <= timeHorizon; year++) {
      if (year > 0) {
        // Add monthly contributions
        for (let month = 0; month < 12; month++) {
          balanceBeforeTax = balanceBeforeTax * (1 + monthlyRate) + monthlyContribution;
          balanceAfterTax = balanceAfterTax * (1 + afterTaxMonthlyRate) + monthlyContribution;
          totalContributed += monthlyContribution;
        }
      }

      data.push({
        year,
        beforeTax: Math.round(balanceBeforeTax),
        afterTax: Math.round(balanceAfterTax),
        contributed: Math.round(totalContributed)
      });
    }

    setProjectionData(data);

    const finalYear = data[data.length - 1];
    const growth = finalYear.beforeTax - totalContributed;
    const capitalGainsTax = growth * (taxRate / 100);
    const taxDragTotal = finalYear.beforeTax - finalYear.afterTax;

    setMetrics({
      totalContributed: Math.round(totalContributed),
      totalGrowth: Math.round(growth),
      finalBalance: Math.round(finalYear.beforeTax),
      taxOwed: Math.round(capitalGainsTax),
      taxDrag: Math.round(taxDragTotal)
    });
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value === '' ? '' : Number(value)
    }));
  };

  const handleApplyContribution = () => {
    const brokerageAccount = state.portfolioAccounts.find(acc => acc.type === 'Brokerage');
    if (!brokerageAccount) {
      toast.error('No Brokerage account found to apply contribution.');
      return;
    }
    
    const totalContribution = inputs.initialInvestment + (inputs.monthlyContribution * 12);
    
    if (!totalContribution || totalContribution <= 0) {
      toast.error('Please enter valid contribution amounts.');
      return;
    }
    
    // Add contribution to the account as cash first
    dispatch({
      type: 'ADD_CONTRIBUTION',
      payload: {
        accountId: brokerageAccount.id,
        amount: totalContribution,
        assetClass: 'cash'
      }
    });
    
    toast.success(`🎉 Added $${totalContribution.toLocaleString()} to your Brokerage account!`);
    
    // Create a plan to rebalance
    dispatch({
      type: 'SET_PENDING_PLAN',
      payload: {
        accountId: brokerageAccount.id,
        accountType: 'Brokerage',
        accountName: brokerageAccount.name,
        stocks: 70,
        bonds: 20,
        cash: 10,
        scenarioTitle: `Brokerage Contribution: $${totalContribution.toLocaleString()}`,
        rationale: `Added $${totalContribution.toLocaleString()} to your Brokerage account. This plan rebalances to the recommended allocation (70% stocks, 20% bonds, 10% cash) for long-term growth.`,
        contributionAmount: totalContribution
      }
    });
    
    toast.success('💡 Go to Review & Act tab to invest your contribution!', { duration: 5000 });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">Year {payload[0].payload.year}</p>
          <p className="value-before">Without Tax Drag: {formatCurrency(payload[0].payload.beforeTax)}</p>
          <p className="value-after">With Tax Drag: {formatCurrency(payload[0].payload.afterTax)}</p>
          <p className="value-contributed">Contributed: {formatCurrency(payload[0].payload.contributed)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="simulation-container">
      <div className="simulation-header">
        <h2>Brokerage Account Simulation</h2>
        <p className="simulation-subtitle">
          Project growth and understand tax implications for your taxable brokerage account
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Contributed</div>
          <div className="metric-value">{formatCurrency(metrics.totalContributed)}</div>
          <div className="metric-detail">Initial + monthly contributions</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Growth</div>
          <div className="metric-value positive">{formatCurrency(metrics.totalGrowth)}</div>
          <div className="metric-detail">Investment returns before tax</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Final Balance</div>
          <div className="metric-value">{formatCurrency(metrics.finalBalance)}</div>
          <div className="metric-detail">At year {inputs.timeHorizon}</div>
        </div>

        <div className="metric-card highlight">
          <div className="metric-label">Estimated Capital Gains Tax</div>
          <div className="metric-value negative">{formatCurrency(metrics.taxOwed)}</div>
          <div className="metric-detail">If fully liquidated at {inputs.taxRate}%</div>
        </div>
      </div>

      {/* Action Button */}
      <div className="simulation-action-section">
        <button 
          className="primary-button large"
          onClick={handleApplyContribution}
          disabled={(!inputs.initialInvestment || inputs.initialInvestment <= 0) && (!inputs.monthlyContribution || inputs.monthlyContribution <= 0)}
        >
          💰 Apply First Year Contributions (${((inputs.initialInvestment || 0) + (inputs.monthlyContribution || 0) * 12).toLocaleString()})
        </button>
        <p className="action-hint">
          This will add your initial investment plus 12 months of contributions to your Brokerage account.
          Go to <strong>Review & Act</strong> to invest the funds.
        </p>
      </div>

      <div className="simulation-grid">
        {/* Input Panel */}
        <div className="inputs-panel">
          <h3>Input Parameters</h3>
          
          <div className="input-group">
            <label>Initial Investment</label>
            <div className="input-wrapper">
              <span className="input-prefix">$</span>
              <input
                type="number"
                value={inputs.initialInvestment}
                onChange={(e) => handleInputChange('initialInvestment', e.target.value)}
                step="1000"
                min="0"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Monthly Contribution</label>
            <div className="input-wrapper">
              <span className="input-prefix">$</span>
              <input
                type="number"
                value={inputs.monthlyContribution}
                onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
                step="100"
                min="0"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Expected Annual Return</label>
            <div className="input-wrapper">
              <input
                type="number"
                value={inputs.expectedReturn}
                onChange={(e) => handleInputChange('expectedReturn', e.target.value)}
                step="0.5"
                min="0"
                max="20"
              />
              <span className="input-suffix">%</span>
            </div>
          </div>

          <div className="input-group">
            <label>Time Horizon</label>
            <div className="input-wrapper">
              <input
                type="number"
                value={inputs.timeHorizon}
                onChange={(e) => handleInputChange('timeHorizon', e.target.value)}
                step="1"
                min="1"
                max="50"
              />
              <span className="input-suffix">years</span>
            </div>
          </div>

          <div className="input-group">
            <label>Tax Rate (Capital Gains)</label>
            <div className="input-wrapper">
              <input
                type="number"
                value={inputs.taxRate}
                onChange={(e) => handleInputChange('taxRate', e.target.value)}
                step="1"
                min="0"
                max="40"
              />
              <span className="input-suffix">%</span>
            </div>
          </div>

          <div className="tax-info-card">
            <h4>Tax Rate Guide</h4>
            <ul>
              <li><strong>0%</strong> - Income up to $44,625 (single)</li>
              <li><strong>15%</strong> - Income $44,626 - $492,300</li>
              <li><strong>20%</strong> - Income over $492,300</li>
            </ul>
            <p className="note">Long-term capital gains rates for 2024. Short-term gains taxed as ordinary income (up to 37%).</p>
          </div>
        </div>

        {/* Chart Panel */}
        <div className="chart-panel">
          <h3>Growth Projection</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorBeforeTax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAfterTax" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4e" />
              <XAxis 
                dataKey="year" 
                stroke="#94a3b8"
                label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Balance', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area
                type="monotone"
                dataKey="beforeTax"
                stroke="#6c5ce7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBeforeTax)"
                name="Without Tax Drag"
              />
              <Area
                type="monotone"
                dataKey="afterTax"
                stroke="#00d4aa"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAfterTax)"
                name="With Tax Drag"
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="tax-drag-highlight">
            <div className="highlight-icon">⚠️</div>
            <div>
              <h4>Tax Drag Impact</h4>
              <p>
                Over {inputs.timeHorizon} years, taxes on dividends and realized gains could reduce 
                your final balance by <strong className="negative">{formatCurrency(metrics.taxDrag)}</strong>. 
                This assumes you pay taxes annually on distributions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="tax-strategy-section">
        <h3>Tax-Efficient Strategies</h3>
        <div className="strategy-grid">
          <div className="strategy-card">
            <div className="strategy-icon">📊</div>
            <h4>Buy & Hold</h4>
            <p>Hold investments for over 1 year to qualify for lower long-term capital gains rates (0-20% vs ordinary income rates up to 37%).</p>
          </div>
          <div className="strategy-card">
            <div className="strategy-icon">🎯</div>
            <h4>Tax-Loss Harvesting</h4>
            <p>Sell losing investments to offset gains. Up to $3,000 in losses can offset ordinary income annually.</p>
          </div>
          <div className="strategy-card">
            <div className="strategy-icon">💎</div>
            <h4>Index Funds & ETFs</h4>
            <p>Choose tax-efficient funds with low turnover to minimize annual taxable distributions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrokerageSimulation;
