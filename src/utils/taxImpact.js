const CAPITAL_GAINS_RATE = 0.15;

const ASSET_CLASS_BY_TYPE = {
  Stock: 'stocks',
  ETF: 'stocks',
  'Mutual Fund': 'stocks',
  Bond: 'bonds',
  Cash: 'cash',
  'Money Market': 'cash'
};

const TAX_ADVANTAGED_NOTES = {
  'Roth IRA': 'Estimated immediate tax: $0. Rebalancing inside a Roth IRA usually does not create taxes, and qualified retirement withdrawals can be tax-free.',
  HSA: 'Estimated immediate tax: $0. Rebalancing inside an HSA usually does not create taxes. Qualified medical withdrawals remain tax-free.',
  'Traditional 401(k)': 'Estimated immediate tax: $0. Rebalancing inside a 401(k) usually does not create taxes today; withdrawals are generally taxed later as income.',
  '529 Plan': 'Estimated immediate tax: $0. Rebalancing inside a 529 plan usually does not create taxes when used for qualified education expenses.'
};

const currency = (value) => `$${Math.round(value).toLocaleString()}`;

function getClassTotals(account) {
  const totals = {
    stocks: { value: 0, gain: 0 },
    bonds: { value: 0, gain: 0 },
    cash: { value: 0, gain: 0 }
  };

  account.holdings?.forEach((holding) => {
    const assetClass = ASSET_CLASS_BY_TYPE[holding.type] || 'stocks';
    const gain = Math.max(0, (holding.totalValue || 0) - (holding.costBasis || holding.totalValue || 0));
    totals[assetClass].value += holding.totalValue || 0;
    totals[assetClass].gain += gain;
  });

  return totals;
}

function estimateAllocationSales(account, targetAllocation) {
  const classTotals = getClassTotals(account);
  const totalValue = account.totalBalance || Object.values(classTotals).reduce((sum, item) => sum + item.value, 0);

  return ['stocks', 'bonds', 'cash'].map((assetClass) => {
    const currentValue = classTotals[assetClass].value;
    const targetValue = totalValue * ((targetAllocation[assetClass] || 0) / 100);
    const sellAmount = Math.max(0, currentValue - targetValue);
    const gainRatio = currentValue > 0 ? classTotals[assetClass].gain / currentValue : 0;
    const realizedGain = sellAmount * gainRatio;

    return {
      assetClass,
      sellAmount,
      realizedGain,
      tax: realizedGain * CAPITAL_GAINS_RATE
    };
  }).filter((item) => item.sellAmount > 0);
}

function estimateTickerSales(account, tickerActions = []) {
  return tickerActions
    .filter((action) => action.action === 'SELL')
    .map((action) => {
      const holding = account.holdings?.find((item) => item.ticker === action.ticker);
      if (!holding) return null;

      const sellAmount = action.estimatedValue ||
        (action.shares === 'ALL' ? holding.totalValue : (Number(action.shares) || 0) * holding.price);
      const gain = Math.max(0, holding.totalValue - holding.costBasis);
      const gainRatio = holding.totalValue > 0 ? gain / holding.totalValue : 0;
      const realizedGain = sellAmount * gainRatio;

      return {
        assetClass: holding.ticker,
        sellAmount,
        realizedGain,
        tax: realizedGain * CAPITAL_GAINS_RATE
      };
    })
    .filter(Boolean);
}

export function estimateTaxImpact(account, targetAllocation, tickerActions = []) {
  if (!account) {
    return {
      estimatedTax: 0,
      realizedGains: 0,
      taxableSales: 0,
      rate: 0,
      note: 'Estimated immediate tax: $0. No account data was available for a tax estimate.',
      details: []
    };
  }

  if (account.type !== 'Brokerage') {
    return {
      estimatedTax: 0,
      realizedGains: 0,
      taxableSales: 0,
      rate: 0,
      note: TAX_ADVANTAGED_NOTES[account.type] || `Estimated immediate tax: $0. Rebalancing inside ${account.type} usually does not create immediate taxes.`,
      details: []
    };
  }

  const allocationSales = estimateAllocationSales(account, targetAllocation);
  const tickerSales = estimateTickerSales(account, tickerActions);
  const sales = tickerSales.length > 0 ? tickerSales : allocationSales;
  const taxableSales = sales.reduce((sum, item) => sum + item.sellAmount, 0);
  const realizedGains = sales.reduce((sum, item) => sum + item.realizedGain, 0);
  const estimatedTax = realizedGains * CAPITAL_GAINS_RATE;

  return {
    estimatedTax,
    realizedGains,
    taxableSales,
    rate: CAPITAL_GAINS_RATE,
    note: taxableSales > 0
      ? `Estimated tax: ${currency(estimatedTax)} using a 15% long-term capital gains assumption on ${currency(realizedGains)} of estimated realized gains.`
      : 'Estimated tax: $0. This plan does not require selling appreciated taxable holdings based on the simulated allocation.',
    details: sales.map((item) => ({
      ...item,
      summary: `${item.assetClass}: sell ${currency(item.sellAmount)}, estimated gain ${currency(item.realizedGain)}, tax ${currency(item.tax)}`
    }))
  };
}

export function formatTaxImpact(taxImpact) {
  if (!taxImpact) return 'Estimated immediate tax: $0.';
  return taxImpact.note;
}
