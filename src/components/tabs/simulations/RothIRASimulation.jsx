import { useState, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart } from 'recharts';
import './SimulationStyles.css';

function RothIRASimulation() {
  const [inputs, setInputs] = useState({
    initialInvestment: 10000,
    annualContribution: 6500,
    expectedReturn: 9,
    timeHorizon: 30,
    taxRate: 24
  });

  const CONTRIBUTION_LIMIT = 7000;
  const AGE_50_PLUS_LIMIT = 8000;

  const [projectionData, setProjectionData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalContributed: 0,
    totalGrowth: 0,
    finalBalance: 0,
    taxSaved: 0
  });

  useEffect(() => {
    calculateProjection();
  }, [inputs]);

  const calculateProjection = () => {
    const { initialInvestment, annualContribution, expectedReturn, timeHorizon, taxRate } = inputs;
    const annualRate = expectedReturn / 100;

    let data = [];
    let rothBalance = initialInvestment;
    let taxableBalance = initialInvestment;
    let totalContributed = initialInvestment;

    for (let year = 0; year <= timeHorizon; year++) {
      if (year > 0) {
        // Roth IRA grows tax-free
        rothBalance = rothBalance * (1 + annualRate) + annualContribution;
        
        // Taxable account pays tax on gains annually
        const taxableGrowth = taxableBalance * annualRate;
        const taxOnGrowth = taxableGrowth * (taxRate / 100);
        taxableBalance = taxableBalance + taxableGrowth - taxOnGrowth + annualContribution;
        
        totalContributed += annualContribution;
      }

      data.push({
        year,
        roth: Math.round(rothBalance),
        taxable: Math.round(taxableBalance),
        contributed: Math.round(totalContributed)
      });
    }

    setProjectionData(data);

    const finalYear = data[data.length - 1];
    const rothGrowth = finalYear.roth - totalContributed;
    const taxableGrowth = finalYear.taxable - totalContributed;
    const taxSavings = finalYear.roth - finalYear.taxable;

    setMetrics({
      totalContributed: Math.round(totalContributed),
      totalGrowth: Math.round(rothGrowth),
      finalBalance: Math.round(finalYear.roth),
      taxSaved: Math.round(taxSavings)
    });
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value === '' ? '' : Number(value)
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const isOverLimit = inputs.annualContribution > CONTRIBUTION_LIMIT;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">Year {payload[0].payload.year}</p>
          <p className="value-roth">Roth IRA (Tax-Free): {formatCurrency(payload[0].payload.roth)}</p>
          <p className="value-taxable">Taxable Account: {formatCurrency(payload[0].payload.taxable)}</p>
          <p className="value-diff">Tax Advantage: {formatCurrency(payload[0].payload.roth - payload[0].payload.taxable)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="simulation-container">
      <div className="simulation-header">
        <h2>Roth IRA Simulation</h2>
        <p className="simulation-subtitle">
          Visualize the power of tax-free growth and compare to a taxable account
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Contributed</div>
          <div className="metric-value">{formatCurrency(metrics.totalContributed)}</div>
          <div className="metric-detail">Your after-tax contributions</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Growth (Tax-Free)</div>
          <div className="metric-value positive">{formatCurrency(metrics.totalGrowth)}</div>
          <div className="metric-detail">Never taxed on withdrawal</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Final Balance</div>
          <div className="metric-value">{formatCurrency(metrics.finalBalance)}</div>
          <div className="metric-detail">At year {inputs.timeHorizon}</div>
        </div>

        <div className="metric-card highlight">
          <div className="metric-label">Total Tax Savings</div>
          <div className="metric-value positive">{formatCurrency(metrics.taxSaved)}</div>
          <div className="metric-detail">vs. taxable account</div>
        </div>
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
            <label>Annual Contribution</label>
            <div className="input-wrapper">
              <span className="input-prefix">$</span>
              <input
                type="number"
                value={inputs.annualContribution}
                onChange={(e) => handleInputChange('annualContribution', e.target.value)}
                step="500"
                min="0"
                className={isOverLimit ? 'input-warning' : ''}
              />
            </div>
            {isOverLimit && (
              <div className="warning-message">
                ⚠️ Exceeds 2024 contribution limit of ${CONTRIBUTION_LIMIT.toLocaleString()}
                {" "}($8,000 if age 50+)
              </div>
            )}
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
            <label>Tax Rate (for comparison)</label>
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

          <div className="limit-info-card">
            <h4>2024 Contribution Limits</h4>
            <ul>
              <li><strong>Under 50:</strong> $7,000/year</li>
              <li><strong>50 or older:</strong> $8,000/year (catch-up)</li>
            </ul>
            <p className="note">
              You must have earned income to contribute. Income limits apply: 
              phase-out starts at $146,000 (single) or $230,000 (married).
            </p>
          </div>

          <div className="roth-benefits-card">
            <h4>Roth IRA Benefits</h4>
            <ul>
              <li>✅ Tax-free growth forever</li>
              <li>✅ Tax-free qualified withdrawals</li>
              <li>✅ No required distributions (RMDs)</li>
              <li>✅ Can withdraw contributions anytime</li>
            </ul>
          </div>
        </div>

        {/* Chart Panel */}
        <div className="chart-panel">
          <h3>Tax-Free Growth Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorRoth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTaxable" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b9d" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ff6b9d" stopOpacity={0}/>
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
                dataKey="roth"
                stroke="#6c5ce7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRoth)"
                name="Roth IRA (Tax-Free)"
              />
              <Area
                type="monotone"
                dataKey="taxable"
                stroke="#ff6b9d"
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorTaxable)"
                name="Taxable Account"
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="tax-advantage-highlight">
            <div className="highlight-icon">🎯</div>
            <div>
              <h4>Roth Tax Advantage</h4>
              <p>
                Over {inputs.timeHorizon} years, the Roth IRA's tax-free growth could give you 
                <strong className="positive"> {formatCurrency(metrics.taxSaved)}</strong> more than 
                a taxable account. Every dollar of growth is yours to keep!
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="withdrawal-rules-section">
        <h3>Withdrawal Rules</h3>
        <div className="rules-grid">
          <div className="rule-card">
            <div className="rule-icon">💰</div>
            <h4>Contributions</h4>
            <p>
              <strong>Anytime, tax-free:</strong> You can withdraw your contributions (not earnings) 
              at any time, for any reason, with no tax or penalty.
            </p>
          </div>
          <div className="rule-card">
            <div className="rule-icon">🎂</div>
            <h4>Qualified Withdrawals</h4>
            <p>
              <strong>After age 59½ + 5 years:</strong> All withdrawals (contributions + earnings) 
              are 100% tax-free if account is at least 5 years old.
            </p>
          </div>
          <div className="rule-card">
            <div className="rule-icon">🏠</div>
            <h4>Exceptions</h4>
            <p>
              <strong>First-time home, education, etc.:</strong> Some exceptions allow early 
              withdrawal of earnings. Up to $10,000 penalty-free for first home.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RothIRASimulation;
