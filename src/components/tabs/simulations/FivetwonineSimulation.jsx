import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './SimulationStyles.css';

function FivetwonineSimulation() {
  const [inputs, setInputs] = useState({
    currentBalance: 5000,
    monthlyContribution: 250,
    yearsToCollege: 10,
    expectedGrowth: 6
  });

  const [projectionData, setProjectionData] = useState([]);
  const [metrics, setMetrics] = useState({
    youPutIn: 0,
    growthAmount: 0,
    totalSaved: 0,
    collegeCost: 0
  });

  const ANNUAL_COLLEGE_COST_TODAY = 30000; // Average per year
  const COLLEGE_YEARS = 4;
  const COLLEGE_INFLATION = 5; // College costs rise faster

  useEffect(() => {
    calculateProjection();
  }, [inputs]);

  const calculateProjection = () => {
    const { currentBalance, monthlyContribution, yearsToCollege, expectedGrowth } = inputs;
    const monthlyRate = expectedGrowth / 100 / 12;

    let data = [];
    let balance = currentBalance;
    let totalContributed = currentBalance;

    for (let year = 0; year <= yearsToCollege; year++) {
      if (year > 0) {
        for (let month = 0; month < 12; month++) {
          balance = balance * (1 + monthlyRate);
          balance += monthlyContribution;
          totalContributed += monthlyContribution;
        }
      }

      // Calculate future college cost
      const futureCostPerYear = ANNUAL_COLLEGE_COST_TODAY * Math.pow(1 + COLLEGE_INFLATION / 100, year);
      const totalCollegeCost = futureCostPerYear * COLLEGE_YEARS;

      data.push({
        year,
        savings: Math.round(balance),
        collegeCost: Math.round(totalCollegeCost),
        contributed: Math.round(totalContributed)
      });
    }

    setProjectionData(data);

    const finalBalance = data[data.length - 1].savings;
    const finalCollegeCost = data[data.length - 1].collegeCost;
    const growth = finalBalance - totalContributed;

    setMetrics({
      youPutIn: Math.round(totalContributed),
      growthAmount: Math.round(growth),
      totalSaved: Math.round(finalBalance),
      collegeCost: Math.round(finalCollegeCost)
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

  // Calculate college readiness
  const coveragePercent = metrics.collegeCost > 0 
    ? Math.min(Math.round((metrics.totalSaved / metrics.collegeCost) * 100), 100) 
    : 0;
  
  const getReadinessColor = () => {
    if (coveragePercent >= 80) return '#00d4aa';
    if (coveragePercent >= 50) return '#ffd93d';
    return '#ff6b9d';
  };

  const getReadinessLabel = () => {
    if (coveragePercent >= 100) return 'Fully Funded!';
    if (coveragePercent >= 80) return 'Almost There!';
    if (coveragePercent >= 50) return 'Good Progress';
    return 'Keep Saving';
  };

  const childAge = 18 - inputs.yearsToCollege;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">Year {payload[0].payload.year}</p>
          <p className="value-roth">Your Savings: {formatCurrency(payload[0].payload.savings)}</p>
          <p className="value-diff">College Cost: {formatCurrency(payload[0].payload.collegeCost)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="simulation-container">
      <div className="simulation-header">
        <h2>College Savings Planner</h2>
        <p className="simulation-subtitle">
          See how your education savings can grow to help pay for college
        </p>
      </div>

      {/* College Readiness Gauge */}
      <div className="readiness-gauge-container">
        <div className="readiness-label">College Savings Progress</div>
        <div className="readiness-gauge">
          <div 
            className="readiness-fill" 
            style={{ 
              width: `${coveragePercent}%`,
              backgroundColor: getReadinessColor()
            }}
          >
            <span className="readiness-percent">{coveragePercent}%</span>
          </div>
        </div>
        <div className="readiness-status" style={{ color: getReadinessColor() }}>
          {getReadinessLabel()} - 4-Year Cost: {formatCurrency(metrics.collegeCost)}
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

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-label">Growth (Tax-Free)</div>
            <div className="metric-value positive">{formatCurrency(metrics.growthAmount)}</div>
          </div>
        </div>

        <div className="metric-card highlight">
          <div className="metric-icon">🎓</div>
          <div className="metric-content">
            <div className="metric-label">Total Saved</div>
            <div className="metric-value">{formatCurrency(metrics.totalSaved)}</div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">🏫</div>
          <div className="metric-content">
            <div className="metric-label">College Cost</div>
            <div className="metric-value">{formatCurrency(metrics.collegeCost)}</div>
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
              max="100000"
              step="1000"
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
              max="1000"
              step="25"
              value={inputs.monthlyContribution}
              onChange={(e) => handleInputChange('monthlyContribution', e.target.value)}
            />
            <div className="input-note">
              Each year: {formatCurrency(inputs.monthlyContribution * 12)}
            </div>
          </div>

          <div className="input-group">
            <label>
              <span className="input-label">Years Until College</span>
              <span className="input-value">{inputs.yearsToCollege} years</span>
            </label>
            <input
              type="range"
              min="1"
              max="18"
              step="1"
              value={inputs.yearsToCollege}
              onChange={(e) => handleInputChange('yearsToCollege', e.target.value)}
            />
            <div className="input-note">
              Your child is about {childAge} years old
            </div>
          </div>

          <div className="input-group">
            <label>
              <span className="input-label">Expected Growth Rate</span>
              <span className="input-value">{inputs.expectedGrowth}%/year</span>
            </label>
            <input
              type="range"
              min="3"
              max="9"
              step="0.5"
              value={inputs.expectedGrowth}
              onChange={(e) => handleInputChange('expectedGrowth', e.target.value)}
            />
            <div className="input-note">
              Plans automatically become safer as college gets closer
            </div>
          </div>

          <div className="coverage-indicator">
            <div className="coverage-label">Will This Cover College?</div>
            <div className="coverage-bar">
              <div 
                className="coverage-fill" 
                style={{ 
                  width: `${Math.min(coveragePercent, 100)}%`,
                  backgroundColor: getReadinessColor()
                }}
              ></div>
            </div>
            <div className="coverage-value">
              {coveragePercent >= 100 
                ? '✓ Fully Funded!' 
                : `${coveragePercent}% of estimated 4-year cost`}
            </div>
          </div>
        </div>

        <div className="chart-panel">
          <h3>Savings vs. College Cost</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="color529" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6b9d" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#ff6b9d" stopOpacity={0.1}/>
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
                dataKey="savings"
                stroke="#00d4aa"
                fillOpacity={1}
                fill="url(#color529)"
                strokeWidth={3}
                name="Your College Savings"
              />
              <Area
                type="monotone"
                dataKey="collegeCost"
                stroke="#ff6b9d"
                fillOpacity={1}
                fill="url(#colorCost)"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Estimated 4-Year Cost"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-insight">
            💡 All growth is tax-free when used for education! No taxes on earnings ever.
          </div>
        </div>
      </div>

      <div className="tax-strategy-section">
        <h3>📚 What Makes This Special?</h3>
        <div className="strategy-grid">
          <div className="strategy-card">
            <div className="strategy-icon">💚</div>
            <h4>Tax-Free Growth</h4>
            <p>
              Your money grows without any taxes. When you use it for college, you pay zero taxes on the growth. 
              That means more money for tuition!
            </p>
          </div>
          <div className="strategy-card">
            <div className="strategy-icon">🎓</div>
            <h4>What It Covers</h4>
            <p>
              Tuition, textbooks, room and board, computers, and supplies. You can also use it for K-12 tuition 
              (up to $10,000 per year).
            </p>
          </div>
          <div className="strategy-card">
            <div className="strategy-icon">👨‍👩‍👧</div>
            <h4>Flexible Beneficiary</h4>
            <p>
              Change the beneficiary to siblings, cousins, or other family members anytime. 
              Extra money? Roll up to $35,000 to a Roth IRA for your child.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FivetwonineSimulation;
