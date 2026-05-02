import './Dashboard.css';

const accountIcons = {
  'Brokerage': '📊',
  'Roth IRA': '🎯',
  'HSA': '⚕️',
  'Traditional 401(k)': '💼',
  '529 Plan': '🎓'
};

const accountDescriptions = {
  'Brokerage': 'A flexible taxable investment account with no contribution limits. You can invest in stocks, ETFs, and mutual funds. Best for goals beyond retirement or after maxing tax-advantaged accounts.',
  'Roth IRA': 'Contribute after-tax dollars and your money grows completely tax-free. Withdrawals in retirement are tax-free too. Best for those who expect to be in a higher tax bracket later.',
  'HSA': 'Triple-tax-advantaged account for healthcare costs. Contributions are pre-tax, growth is tax-free, and withdrawals for medical expenses are tax-free. After 65 it works like a Traditional IRA.',
  'Traditional 401(k)': 'Employer-sponsored retirement plan with pre-tax contributions that lower your taxable income today. You pay taxes when you withdraw in retirement. Often includes employer matching.',
  '529 Plan': 'Tax-advantaged education savings account. Contributions grow tax-free and withdrawals for qualified education expenses are tax-free. Some states offer additional deductions.'
};

function AccountCard({ account, onSelect }) {
  const getHealthColor = (score) => {
    if (score >= 80) return 'health-green';
    if (score >= 60) return 'health-yellow';
    return 'health-red';
  };

  const getHealthLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Attention';
  };

  return (
    <div className="account-card" onClick={() => onSelect(account)}>
      <div className="account-card-header">
        <div className="account-icon">
          {accountIcons[account.type] || '💰'}
        </div>
        <div className={`health-badge ${getHealthColor(account.healthScore)}`}>
          {account.healthScore}
        </div>
      </div>

      <div className="account-info">
        <h3 className="account-name">{account.name}</h3>
        <p className="account-type">{account.type}</p>
        <p className="account-description">{accountDescriptions[account.type]}</p>
      </div>

      <div className="account-balance">
        <span className="balance-label">Total Balance</span>
        <span className="balance-value">
          ${account.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <div className="allocation-summary">
        <div className="allocation-bar">
          <div 
            className="allocation-segment stocks" 
            style={{ width: `${account.allocation.stocks}%` }}
          ></div>
          <div 
            className="allocation-segment bonds" 
            style={{ width: `${account.allocation.bonds}%` }}
          ></div>
          <div 
            className="allocation-segment cash" 
            style={{ width: `${account.allocation.cash}%` }}
          ></div>
        </div>
        <div className="allocation-labels">
          <span>Stocks {account.allocation.stocks}%</span>
          <span>Bonds {account.allocation.bonds}%</span>
          <span>Cash {account.allocation.cash}%</span>
        </div>
      </div>

      <div className="account-footer">
        <div className="health-status">
          <span className={`status-dot ${getHealthColor(account.healthScore)}`}></span>
          {getHealthLabel(account.healthScore)}
        </div>
        <button className="view-plan-button">
          View Plan →
        </button>
      </div>
    </div>
  );
}

function AddAccountCard({ onAdd }) {
  return (
    <div className="account-card add-account-card" onClick={onAdd}>
      <div className="add-account-content">
        <div className="add-icon">+</div>
        <h3>Add Account</h3>
        <p>Connect a new investment account</p>
      </div>
    </div>
  );
}

function GameCard({ onPlay }) {
  return (
    <div className="account-card game-card">
      <div className="game-card-header">
        <div className="game-icon">🎮</div>
      </div>
      <div className="game-card-content">
        <h3>Investment Game</h3>
        <p className="game-description">
          Test your investing instincts! Make strategic decisions and grow your portfolio through market challenges.
        </p>
        <button className="play-now-button" onClick={onPlay}>
          Play Now →
        </button>
      </div>
    </div>
  );
}

export default function Dashboard({ accounts, onSelectAccount, onAddAccount, onPlayGame }) {
  const totalPortfolioValue = accounts.reduce((sum, acc) => sum + acc.totalBalance, 0);
  const weightedAllocation = accounts.reduce(
    (totals, account) => ({
      stocks: totals.stocks + account.totalBalance * (account.allocation.stocks / 100),
      bonds: totals.bonds + account.totalBalance * (account.allocation.bonds / 100),
      cash: totals.cash + account.totalBalance * (account.allocation.cash / 100)
    }),
    { stocks: 0, bonds: 0, cash: 0 }
  );
  const portfolioAllocation = {
    stocks: Math.round((weightedAllocation.stocks / totalPortfolioValue) * 100),
    bonds: Math.round((weightedAllocation.bonds / totalPortfolioValue) * 100),
    cash: 0
  };
  portfolioAllocation.cash = Math.max(0, 100 - portfolioAllocation.stocks - portfolioAllocation.bonds);

  const averageHealth = Math.round(
    accounts.reduce((sum, account) => sum + account.healthScore, 0) / accounts.length
  );
  const highestStockAccount = accounts.reduce((highest, account) => (
    account.allocation.stocks > highest.allocation.stocks ? account : highest
  ), accounts[0]);
  const nextAction = highestStockAccount.allocation.stocks > 80
    ? `Review ${highestStockAccount.name}: it carries the most stock exposure.`
    : 'Your accounts are broadly balanced. Review goals before making changes.';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>My Investment Accounts</h1>
          <p className="dashboard-subtitle">
            Manage all your investment accounts in one place
          </p>
        </div>
        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-label">Total Portfolio Value</span>
            <span className="stat-value">
              ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Accounts</span>
            <span className="stat-value">{accounts.length}</span>
          </div>
        </div>
      </div>

      <section className="portfolio-command-center">
        <div className="portfolio-health-panel">
          <span className="panel-label">Portfolio Health</span>
          <strong>{averageHealth}</strong>
          <p>{averageHealth >= 80 ? 'Strong overall balance' : 'Good foundation with a few areas to review'}</p>
        </div>
        <div className="portfolio-allocation-panel">
          <div className="panel-header">
            <span className="panel-label">Whole Portfolio Mix</span>
            <span className="plain-note">Simple view across every account</span>
          </div>
          <div className="allocation-bar large">
            <div className="allocation-segment stocks" style={{ width: `${portfolioAllocation.stocks}%` }}></div>
            <div className="allocation-segment bonds" style={{ width: `${portfolioAllocation.bonds}%` }}></div>
            <div className="allocation-segment cash" style={{ width: `${portfolioAllocation.cash}%` }}></div>
          </div>
          <div className="allocation-labels strong">
            <span>Stocks {portfolioAllocation.stocks}%</span>
            <span>Bonds {portfolioAllocation.bonds}%</span>
            <span>Cash {portfolioAllocation.cash}%</span>
          </div>
        </div>
        <div className="next-action-panel">
          <span className="panel-label">Recommended Next Step</span>
          <p>{nextAction}</p>
          <button className="view-plan-button" onClick={() => onSelectAccount(highestStockAccount)}>
            Open guided plan →
          </button>
        </div>
      </section>

      <div className="accounts-grid">
        <GameCard onPlay={onPlayGame} />
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onSelect={onSelectAccount}
          />
        ))}
        <AddAccountCard onAdd={onAddAccount} />
      </div>
    </div>
  );
}
