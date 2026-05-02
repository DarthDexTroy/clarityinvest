import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useApp } from '../../../store/useAppStore';
import toast from 'react-hot-toast';
import './SimulationStyles.css';

function HSASimulation() {
  const { state, dispatch } = useApp();
  const [inputs, setInputs] = useState({
    annualContribution: 4150,
    annualMedicalExpenses: 1500,
    investmentGrowth: 7,
    timeHorizon: 25,
    currentAge: 35
  });

  const CONTRIBUTION_LIMIT_INDIVIDUAL = 4150;
  const CONTRIBUTION_LIMIT_FAMILY = 8300;
  const AGE_55_PLUS_CATCHUP = 1000;

  const [projectionData, setProjectionData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalContributed: 0,
    totalGrowth: 0,
    finalBalance: 0,
    taxSaved: 0,
    medicalExpensesPaid: 0
  });

  useEffect(() => {
    calculateProjection();
  }, [inputs]);

  const calculateProjection = () => {
    const { annualContribution, annualMedicalExpenses, investmentGrowth, timeHorizon, currentAge } = inputs;
    const annualRate = investmentGrowth / 100;
    
    // Assume 25% tax rate for tax savings calculation
    const taxRate = 0.25;
    const payrollTaxRate = 0.0765; // FICA taxes
    const totalTaxRate = taxRate + payrollTaxRate;

    let data = [];
    
    // Scenario 1: Spend as you go (pay medical expenses from HSA cash)
    let spendBalance = 0;
    let spendTotalContributed = 0;
    let spendTotalMedicalPaid = 0;
    
    // Scenario 2: Invest and reimburse later (pay out of pocket, let HSA grow)
    let investBalance = 0;
    let investTotalContributed = 0;
    let investTotalMedicalPaidOOP = 0;

    for (let year = 0; year <= timeHorizon; year++) {
      const age = currentAge + year;
      
      if (year > 0) {
        // Scenario 1: Spend as you go
        spendBalance += annualContribution;
        spendTotalContributed += annualContribution;
        spendBalance = Math.max(0, spendBalance - annualMedicalExpenses);
        spendTotalMedicalPaid += Math.min(spendBalance + annualContribution, annualMedicalExpenses);
        spendBalance *= (1 + annualRate);
        
        // Scenario 2: Invest everything, pay medical expenses out of pocket
        investBalance += annualContribution;
        investTotalContributed += annualContribution;
        investBalance *= (1 + annualRate);
        investTotalMedicalPaidOOP += annualMedicalExpenses;
      }

      data.push({
        year,
        age,
        spendAsYouGo: Math.round(spendBalance),
        investAndReimburse: Math.round(investBalance),
        medicalPaidOOP: Math.round(investTotalMedicalPaidOOP)
      });
    }

    setProjectionData(data);

    const finalYear = data[data.length - 1];
    const taxSavings = investTotalContributed * totalTaxRate;

    setMetrics({
      totalContributed: Math.round(investTotalContributed),
      totalGrowth: Math.round(finalYear.investAndReimburse - investTotalContributed),
      finalBalance: Math.round(finalYear.investAndReimburse),
      taxSaved: Math.round(taxSavings),
      medicalExpensesPaid: Math.round(investTotalMedicalPaidOOP)
    });
  };

  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value === '' ? '' : Number(value)
    }));
  };

  const handleApplyContribution = () => {
    const hsaAccount = state.portfolioAccounts.find(acc => acc.type === 'HSA');
    if (!hsaAccount) {
      toast.error('No HSA account found to apply contribution.');
      return;
    }
    
    if (!inputs.annualContribution || inputs.annualContribution <= 0) {
      toast.error('Please enter a valid contribution amount.');
      return;
    }
    
    // Add contribution to the account (split between stocks and cash based on strategy)
    const contributionAmount = inputs.annualContribution;
    
    // For HSA, we'll add to cash first (user can rebalance later using Review & Act)
    dispatch({
      type: 'ADD_CONTRIBUTION',
      payload: {
        accountId: hsaAccount.id,
        amount: contributionAmount,
        assetClass: 'cash'
      }
    });
    
    toast.success(`🎉 Added $${contributionAmount.toLocaleString()} to your HSA!`);
    
    // Create a plan to rebalance based on HSA targets
    dispatch({
      type: 'SET_PENDING_PLAN',
      payload: {
        accountId: hsaAccount.id,
        accountType: 'HSA',
        accountName: hsaAccount.name,
        stocks: 55,
        bonds: 20,
        cash: 25,
        scenarioTitle: `HSA Contribution: $${contributionAmount.toLocaleString()}`,
        rationale: `Added $${contributionAmount.toLocaleString()} to your HSA. This plan rebalances to the recommended HSA target allocation (55% stocks, 20% bonds, 25% cash) for balanced growth and medical expense coverage.`,
        contributionAmount
      }
    });
    
    toast.success('💡 Go to Review & Act tab to rebalance your new contribution!', { duration: 5000 });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const isOverIndividualLimit = inputs.annualContribution > CONTRIBUTION_LIMIT_INDIVIDUAL && inputs.annualContribution <= CONTRIBUTION_LIMIT_FAMILY;
  const isOverFamilyLimit = inputs.annualContribution > CONTRIBUTION_LIMIT_FAMILY;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="label">Age {data.age} (Year {data.year})</p>
          <p className="value-spend">Spend As You Go: {formatCurrency(data.spendAsYouGo)}</p>
          <p className="value-invest">Invest & Reimburse: {formatCurrency(data.investAndReimburse)}</p>
          <p className="value-oop">Medical Paid OOP: {formatCurrency(data.medicalPaidOOP)}</p>
        </div>
      );
    }
    return null;
  };

  const retirementAge = 65;
  const yearsToRetirement = Math.max(0, retirementAge - inputs.currentAge);
  const balanceAt65Index = projectionData.findIndex(d => d.age === retirementAge);
  const balanceAt65 = balanceAt65Index >= 0 ? projectionData[balanceAt65Index].investAndReimburse : metrics.finalBalance;

  return (
    <div className="simulation-container">
      <div className="simulation-header">
        <h2>HSA Simulation</h2>
        <p className="simulation-subtitle">
          Explore the triple-tax advantage: contribute pre-tax, grow tax-free, withdraw tax-free for medical expenses
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Contributed</div>
          <div className="metric-value">{formatCurrency(metrics.totalContributed)}</div>
          <div className="metric-detail">Pre-tax contributions over {inputs.timeHorizon} years</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Total Growth</div>
          <div className="metric-value positive">{formatCurrency(metrics.totalGrowth)}</div>
          <div className="metric-detail">Tax-free investment gains</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Final Balance (Invested)</div>
          <div className="metric-value">{formatCurrency(metrics.finalBalance)}</div>
          <div className="metric-detail">At age {inputs.currentAge + inputs.timeHorizon}</div>
        </div>

        <div className="metric-card highlight">
          <div className="metric-label">Estimated Tax Saved</div>
          <div className="metric-value positive">{formatCurrency(metrics.taxSaved)}</div>
          <div className="metric-detail">Income + payroll tax savings (~32.65%)</div>
        </div>
      </div>

      {/* Action Button */}
      <div className="simulation-action-section">
        <button 
          className="primary-button large"
          onClick={handleApplyContribution}
          disabled={!inputs.annualContribution || inputs.annualContribution <= 0}
        >
          💰 Apply ${inputs.annualContribution?.toLocaleString() || 0} Contribution to My HSA
        </button>
        <p className="action-hint">
          This will add the contribution to your HSA and create a rebalancing plan. 
          Go to <strong>Review & Act</strong> to execute the plan.
        </p>
      </div>

      <div className="simulation-grid">
        {/* Input Panel */}
        <div className="inputs-panel">
          <h3>Input Parameters</h3>
          
          <div className="input-group">
            <label>Current Age</label>
            <div className="input-wrapper">
              <input
                type="number"
                value={inputs.currentAge}
                onChange={(e) => handleInputChange('currentAge', e.target.value)}
                step="1"
                min="18"
                max="80"
              />
              <span className="input-suffix">years</span>
            </div>
          </div>

          <div className="input-group">
            <label>Annual HSA Contribution</label>
            <div className="input-wrapper">
              <span className="input-prefix">$</span>
              <input
                type="number"
                value={inputs.annualContribution}
                onChange={(e) => handleInputChange('annualContribution', e.target.value)}
                step="100"
                min="0"
                className={isOverFamilyLimit ? 'input-warning' : ''}
              />
            </div>
            {isOverIndividualLimit && !isOverFamilyLimit && (
              <div className="info-message">
                ℹ️ Family coverage limit: ${CONTRIBUTION_LIMIT_FAMILY.toLocaleString()}/year
              </div>
            )}
            {isOverFamilyLimit && (
              <div className="warning-message">
                ⚠️ Exceeds 2024 family limit of ${CONTRIBUTION_LIMIT_FAMILY.toLocaleString()}
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Expected Annual Medical Expenses</label>
            <div className="input-wrapper">
              <span className="input-prefix">$</span>
              <input
                type="number"
                value={inputs.annualMedicalExpenses}
                onChange={(e) => handleInputChange('annualMedicalExpenses', e.target.value)}
                step="100"
                min="0"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Investment Growth Rate</label>
            <div className="input-wrapper">
              <input
                type="number"
                value={inputs.investmentGrowth}
                onChange={(e) => handleInputChange('investmentGrowth', e.target.value)}
                step="0.5"
                min="0"
                max="15"
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

          <div className="limit-info-card">
            <h4>2024 Contribution Limits</h4>
            <ul>
              <li><strong>Individual:</strong> $4,150/year</li>
              <li><strong>Family:</strong> $8,300/year</li>
              <li><strong>55+ Catch-up:</strong> +$1,000/year</li>
            </ul>
            <p className="note">
              Must have a High Deductible Health Plan (HDHP) to contribute.
            </p>
          </div>

          <div className="triple-tax-card">
            <h4>Triple-Tax Advantage</h4>
            <ul>
              <li>🔹 <strong>Contribute:</strong> Pre-tax (reduces taxable income)</li>
              <li>🔹 <strong>Grow:</strong> Tax-free (no tax on investment gains)</li>
              <li>🔹 <strong>Withdraw:</strong> Tax-free (for qualified medical expenses)</li>
            </ul>
            <p className="highlight-text">
              After age 65, can withdraw for non-medical expenses and pay ordinary income tax (like a Traditional IRA).
            </p>
          </div>
        </div>

        {/* Chart Panel */}
        <div className="chart-panel">
          <h3>Growth Strategy Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffd93d" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ffd93d" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4e" />
              <XAxis 
                dataKey="age" 
                stroke="#94a3b8"
                label={{ value: 'Age', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                label={{ value: 'HSA Balance', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area
                type="monotone"
                dataKey="spendAsYouGo"
                stroke="#ffd93d"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSpend)"
                name="Spend As You Go"
              />
              <Area
                type="monotone"
                dataKey="investAndReimburse"
                stroke="#00d4aa"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorInvest)"
                name="Invest & Reimburse Later"
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="strategy-highlight">
            <div className="highlight-icon">💡</div>
            <div>
              <h4>Optimal Strategy</h4>
              <p>
                <strong>Invest and reimburse later:</strong> Pay medical expenses out of pocket 
                (if possible) and let your HSA grow. Keep receipts indefinitely - you can 
                reimburse yourself tax-free years later!
              </p>
              <p className="metric-callout">
                Estimated balance at age 65: <strong className="positive">{formatCurrency(balanceAt65)}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hsa-strategies-section">
        <h3>HSA Strategies & Tips</h3>
        <div className="strategy-grid">
          <div className="strategy-card">
            <div className="strategy-icon">🧾</div>
            <h4>Keep All Receipts</h4>
            <p>
              Save receipts for qualified medical expenses indefinitely. You can reimburse yourself 
              years later, tax-free, allowing your HSA to grow in the meantime.
            </p>
          </div>
          <div className="strategy-card">
            <div className="strategy-icon">📈</div>
            <h4>Invest for Growth</h4>
            <p>
              If you can afford to pay medical expenses out of pocket, invest your HSA contributions 
              aggressively. The tax-free growth compounds over decades.
            </p>
          </div>
          <div className="strategy-card">
            <div className="strategy-icon">🏥</div>
            <h4>Qualified Expenses</h4>
            <p>
              Medical, dental, vision care, prescriptions, and many other health expenses qualify. 
              After 65, also available for Medicare premiums.
            </p>
          </div>
        </div>

        <div className="after-65-card">
          <h4>After Age 65: Retirement Flexibility</h4>
          <p>
            <strong>Medical withdrawals:</strong> Still tax-free for qualified medical expenses (including Medicare premiums).
          </p>
          <p>
            <strong>Non-medical withdrawals:</strong> Pay ordinary income tax (no penalty), just like a Traditional IRA. 
            This makes your HSA a powerful "stealth IRA" for retirement.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HSASimulation;
