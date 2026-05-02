import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './SimulationStyles.css';

function Traditional401kSimulation() {
  const [inputs, setInputs] = useState({
    currentBalance: 15000,
    monthlyContribution: 500,
    employerMatch: 50,
    yearsToRetirement: 30,
    expectedGrowth: 7
  });

  const [projectionData, setProjectionData] = useState([]);
  const [metrics, setMetrics] = useState({
    youPutIn: 0,
    companyAdds: 0,
    growthAmount: 0,
    totalAtRetirement: 0
  });

  useEffect(() => {
    calculateProjection();
  }, [inputs]);

  const calculateProjection = () => {
    const { currentBalance, monthlyContribution, employerMatch, yearsToRetirement, expectedGrowth } = inputs;
    const monthlyRate = expectedGrowth / 100 / 12;
    const matchRate = employerMatch / 100;
    const monthlyMatchAmount = monthlyContribution * matchRate;

    let data = [];
    let balance = currentBalance;
    let totalYouContributed = 0;
    let totalCompanyContributed = 0;

    for (let year = 0; year <= yearsToRetirement; year++) {
      if (year > 0) {
        for (let month = 0; month < 12; month++) {
          balance = balance * (1 + monthlyRate);
          balance += monthlyContribution + monthlyMatchAmount;
          totalYouContributed += monthlyContribution;
          totalCompanyContributed += monthlyMatchAmount;
        }
      }

      data.push({
        year,
        total: Math.round(balance),
        contributed: Math.round(totalYouContributed + currentBalance)
      });
    }

    setProjectionData(data);

    const finalBalance = data[data.length - 1].total;
    const totalContributed = totalYouContributed + currentBalance;
    const growth = finalBalance - totalContributed - totalCompanyContributed;

    setMetrics({
      youPutIn: Math.round(totalContributed),
      companyAdds: Math.round(totalCompanyContributed),
      growthAmount: Math.round(growth),
      totalAtRetirement: Math.round(finalBalance)
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

  const monthlyMatchAmount = inputs.monthlyContribution * (inputs.employerMatch / 100);
  const annualTotal = (inputs.monthlyContribution + monthlyMatchAmount) * 12;

  // Calculate retirement readiness score
  const retirementGoal = 1000000; // Simple $1M benchmark
  const readinessPercent = Math.min(Math.round((metrics.totalAtRetirement / retirementGoal) * 100), 100);
  const getReadinessColor = () => {
    if (readinessPercent >= 80) return '#00d4aa';
    if (readinessPercent >= 50) return '#ffd93d';
    return '#ff6b9d';
  };
  const getReadinessLabel = () => {
    if (readinessPercent >= 80) return 'On Track!';
    if (readinessPercent >= 50) return 'Making Progress';
    return 'Need More';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">Year {payload[0].payload.year}</p>
          <p className="value-roth">Retirement Savings: {formatCurrency(payload[0].payload.total)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="simulation-container">
      <div className="simulation-header">
        <h2>Retirement Savings Planner</h2>
        <p className="simulation-subtitle">
          See how your workplace retirement account can grow over time
        </p>
      </div>

      {/* Retirement Readiness Gauge */}
      <div className="readiness-gauge-container">
        <div className="readiness-label">Retirement Readiness</div>
        <div className="readiness-gauge">
          <div 
            className="readiness-fill" 
            style={{ 
              width: `${readinessPercent}%`,
              backgroundColor: getReadinessColor()
            }}
          >
            <span className="readiness-percent">{readinessPercent}%</span>
          </div>
        </div>
        <div className="readiness-status" style={{ color: getReadinessColor() }}>
          {getReadinessLabel()} - Goal: {formatCurrency(retirementGoal)}
        </div>
      </div>

      {/* Simplified Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">💵</div>
          <div className="metric-content">
            <div className="metric-label">You Put In</div>
            <div className="metric-value">{formatCurrency(metrics.youPutIn)}</div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">🎁</div>
          <div className="metric-content">
            <div className="metric-label">Company Adds</div>
            <div className="metric-value">{formatCurrency(metrics.companyAdds)}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-label">Growth</div>
            <div className="metric-value positive">{formatCurrency(metrics.growthAmount)}</div>
          </div>
        </div>

        <div className="metric-card highlight">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <div className="metric-label">At Retirement</div>
            <div className="metric-value">{formatCurrency(metrics.totalAtRetirement)}</div>
          </div>
        </div>
      </div>

      <div className="simulation-grid">
        <div className="inputs-panel">
          <h3>Your Numbers</h3>

          <div className="input-group">
            <label>
              <span className="input-label">Current Balance</span>
              <span className="input-value">{formatCurrency(inputs.currentBalance)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="500000"
              step="5000"
              value={inputs.currentBalance}
              onChange={(e) => handleInputChange('currentBalance', e.target.value)}
            />
            <div className="input-note">
              What you have saved so far
            </div>
          </div>

          <div className="input-group">
            <label>
              <span className="input-label">Monthly Contribution</span>
              <span className="input-value">{formatCurrency(inputs.monthlyContribution)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={inputs.monthlyContribution}
              onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
            />
            <div className="input-note">
              How much you add each month
            </div>
          </div>

          <div className="input-group">
            <label>
              <span className="input-label">Company Match</span>
              <span className="input-value">{inputs.employerMatch}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={inputs.employerMatch}
              onChange={(e) => handleInputChange('employerMatch', e.target.value)}
            />
            <div className="input-note highlight-note">
              💰 Your company adds {formatCurrency(monthlyMatchAmount)}/month (free money!)
            </div>
          </div>

          <div className="input-group">
            <label>
              <span className="input-label">Years Until Retirement</span>
              <span className="input-value">{inputs.yearsToRetirement} years</span>
            </label>
            <input
              type="range"
              min="5"
              max="40"
              step="1"
              value={inputs.yearsToRetirement}
              onChange={(e) => handleInputChange('yearsToRetirement', e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>
              <span className="input-label">Expected Growth Rate</span>
              <span className="input-value">{inputs.expectedGrowth}%/year</span>
            </label>
            <input
              type="range"
              min="3"
              max="10"
              step="0.5"
              value={inputs.expectedGrowth}
              onChange={(e) => handleInputChange('expectedGrowth', e.target.value)}
            />
            <div className="input-note">
              Average stock market returns around 7-10%
            </div>
          </div>

          <div className="total-annual-box">
            <div className="annual-label">Total Going In Each Year</div>
            <div className="annual-value">{formatCurrency(annualTotal)}</div>
            <div className="annual-breakdown">
              You: {formatCurrency(inputs.monthlyContribution * 12)} + 
              Company: {formatCurrency(monthlyMatchAmount * 12)}
            </div>
          </div>
        </div>

        <div className="chart-panel">
          <h3>How It Grows Over Time</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="year" 
                stroke="#94a3b8"
                label={{ value: 'Years from Now', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#a78bfa"
                fillOpacity={1}
                fill="url(#colorTotal)"
                strokeWidth={3}
                name="Total Savings"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            💡 The company match is like getting an instant {inputs.employerMatch}% return on your money!
          </div>
        </div>
      </div>
    </div>
  );
}

export default Traditional401kSimulation;
