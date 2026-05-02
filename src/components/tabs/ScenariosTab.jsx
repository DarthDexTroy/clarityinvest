import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useApp } from '../../store/useAppStore';
import { estimateTaxImpact, formatTaxImpact } from '../../utils/taxImpact';
import { getCustomWhatIfScenario } from '../../services/groqService';
import './ScenariosTab.css';

const getScenarioPlan = (account, scenario) => {
  const current = account.allocation || { stocks: 60, bonds: 30, cash: 10 };
  const scenarioId = scenario.id;
  let allocation = { ...current };
  let rationale = 'This plan keeps your investments aligned with the scenario while avoiding emotional all-or-nothing moves.';
  let costs = 'Estimated trading cost: usually $0 at major brokerages. Fund fees still apply based on the funds you hold.';
  let taxes = account.type === 'Brokerage'
    ? 'Tax note: selling profitable holdings in a taxable brokerage account may create capital gains taxes.'
    : `Tax note: rebalancing inside a ${account.type} usually does not create a taxable event.`;

  if (scenario.aiGenerated && scenario.after?.stocks !== undefined && scenario.after?.bonds !== undefined && scenario.after?.cash !== undefined) {
    allocation = {
      stocks: Number(scenario.after.stocks),
      bonds: Number(scenario.after.bonds),
      cash: Number(scenario.after.cash)
    };
    rationale = scenario.planRationale || 'This AI-generated plan is based on the life situation you typed and the selected investment account.';
  } else if (scenarioId.includes('market-drop') || scenarioId.includes('rebalance')) {
    allocation = account.type === 'Brokerage'
      ? { stocks: 70, bonds: 20, cash: 10 }
      : { stocks: Math.max(55, current.stocks - 5), bonds: Math.min(35, current.bonds + 5), cash: current.cash };
    rationale = 'A market drop calls for a calmer mix, not panic selling. This keeps long-term growth while adding more stabilizers.';
  } else if (scenarioId.includes('inflation') || scenarioId.includes('tuition-inflation')) {
    allocation = { stocks: Math.min(75, current.stocks + 5), bonds: Math.max(15, current.bonds - 5), cash: current.cash };
    rationale = 'Inflation can weaken idle cash and some bonds. This keeps growth assets in the mix while preserving enough cash for near-term needs.';
  } else if (scenarioId.includes('withdraw') || scenarioId.includes('retire-earlier') || scenarioId.includes('soon')) {
    allocation = { stocks: Math.max(35, current.stocks - 15), bonds: Math.min(45, current.bonds + 10), cash: Math.min(25, current.cash + 5) };
    rationale = 'When money may be needed soon, the plan protects more of it with bonds and cash so fewer stocks need to be sold during a bad market.';
  } else if (scenarioId.includes('fee') || scenarioId.includes('switch-funds')) {
    allocation = current;
    rationale = 'The allocation can stay the same, but expensive funds should be replaced with lower-cost broad funds to keep more growth in your account.';
    costs = 'Estimated trading cost: usually $0. Fee impact: reducing fund fees can save meaningful money over long time periods.';
  } else if (scenarioId.includes('max') || scenarioId.includes('increase') || scenarioId.includes('contribution')) {
    allocation = current;
    rationale = 'The highest-impact action is adding money consistently. The current mix can stay in place while new contributions fill the target areas.';
    taxes = account.type === 'Brokerage'
      ? 'Tax note: new contributions do not create taxes. Taxes matter later if you sell investments for a gain.'
      : `Tax note: contributions and account rules depend on ${account.type} eligibility and annual limits.`;
  } else if (scenarioId.includes('aggressive') || scenarioId.includes('invest-all')) {
    allocation = { stocks: Math.min(90, current.stocks + 15), bonds: Math.max(5, current.bonds - 10), cash: Math.max(5, current.cash - 5) };
    rationale = 'A longer timeline can support more stock exposure, but the plan still keeps a small stability cushion.';
  }

  const total = allocation.stocks + allocation.bonds + allocation.cash;
  if (total !== 100) {
    allocation.cash += 100 - total;
  }

  const taxImpact = estimateTaxImpact(account, allocation);

  return {
    ...allocation,
    source: 'scenario',
    aiGenerated: Boolean(scenario.aiGenerated),
    accountId: account.id,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    accountType: account.type,
    accountName: account.name,
    rationale,
    costs,
    taxes: formatTaxImpact(taxImpact),
    taxImpact,
    goalAlignment: `Designed for ${account.goal || 'your stated goal'} with a ${account.timeHorizon || 'multi-year'} timeline.`,
    confidenceNote: 'This is a simulated plan for education, not a trade order.',
    planByConcern: scenario.planByConcern
  };
};

const concernOptions = [
  { id: 'soon', label: 'I need money soon' },
  { id: 'loss', label: 'I am scared of losing money' },
  { id: 'growth', label: 'I want long-term growth' }
];

const adjustPlanForConcern = (plan, concern) => {
  if (plan.aiGenerated && plan.planByConcern?.[concern]) {
    const concernPlan = plan.planByConcern[concern];
    return {
      ...plan,
      ...concernPlan.after,
      rationale: concernPlan.rationale || plan.rationale
    };
  }

  if (concern === 'soon') {
    const stocks = Math.max(25, plan.stocks - 10);
    const cash = Math.min(30, plan.cash + 10);
    const bonds = Math.max(0, 100 - stocks - cash);
    return {
      ...plan,
      stocks,
      bonds,
      cash,
      rationale: `${plan.rationale} Because your concern is near-term money, this version adds a larger cash cushion.`
    };
  }
  if (concern === 'growth') {
    const stocks = Math.min(90, plan.stocks + 8);
    const cash = Math.max(5, plan.cash - 3);
    const bonds = Math.max(0, 100 - stocks - cash);
    return {
      ...plan,
      stocks,
      bonds,
      cash,
      rationale: `${plan.rationale} Because your concern is long-term growth, this version keeps more invested in stocks.`
    };
  }
  return {
    ...plan,
    rationale: `${plan.rationale} Because your concern is loss, this version avoids all-or-nothing moves and keeps stabilizers in place.`
  };
};

const inferConcernFromText = (text) => {
  const normalized = text.toLowerCase();
  if (/soon|next year|withdraw|tuition|medical|rent|house|cash|emergency/.test(normalized)) return 'soon';
  if (/grow|growth|retire|retirement|long term|long-term|maximize|aggressive/.test(normalized)) return 'growth';
  return 'loss';
};

const createCustomScenario = (account, text) => {
  const concern = inferConcernFromText(text);
  const balance = account?.totalBalance || 0;
  const title = text.length > 58 ? `${text.slice(0, 58)}...` : text;
  return {
    id: `custom-${concern}-${Date.now()}`,
    title: `My situation: ${title}`,
    description: text,
    before: { value: balance, currentStocks: account.allocation?.stocks || 0, currentBonds: account.allocation?.bonds || 0, currentCash: account.allocation?.cash || 0 },
    after: concern === 'soon'
      ? { stocks: Math.max(25, (account.allocation?.stocks || 60) - 15), bonds: Math.min(45, (account.allocation?.bonds || 25) + 10), cash: Math.min(30, (account.allocation?.cash || 10) + 5) }
      : concern === 'growth'
        ? { stocks: Math.min(90, (account.allocation?.stocks || 60) + 10), bonds: Math.max(5, (account.allocation?.bonds || 25) - 5), cash: Math.max(5, (account.allocation?.cash || 10) - 5) }
        : { stocks: Math.max(45, (account.allocation?.stocks || 60) - 10), bonds: Math.min(40, (account.allocation?.bonds || 25) + 8), cash: Math.min(20, (account.allocation?.cash || 10) + 2) },
    impact: concern === 'soon' ? 'More cash flexibility' : concern === 'growth' ? 'More long-term growth exposure' : 'Lower panic risk',
    insights: [
      'This custom what-if is based on the life situation you typed.',
      concern === 'soon' ? 'The plan protects money that may be needed soon.' : concern === 'growth' ? 'The plan keeps more money working for long-term growth.' : 'The plan reduces emotional decision risk during volatility.',
      'Use Review & Act to see the exact simulated trade impact before executing.'
    ]
  };
};

const getRealWorldImplication = (account, scenario, scenarioPlan, concern) => {
  const balance = account.totalBalance || 0;
  const scenarioId = scenario.id;
  const dropAmount = Math.round(balance * 0.2);
  const monthlyBills = 3200;
  const billsCovered = Math.max(1, Math.round(dropAmount / monthlyBills));
  const stablePercent = scenarioPlan.cash + scenarioPlan.bonds;
  const defaultTimeline = [
    { when: 'Today', text: `You review your ${account.name} before making any trades.` },
    { when: 'Next 3 months', text: 'You use the plan to avoid emotional buying or selling.' },
    { when: 'Longer term', text: 'Your allocation better matches the reason you invested this money.' }
  ];
  const concernLens = {
    soon: 'Because you said this money may be needed soon, the plan puts extra focus on avoiding forced selling.',
    loss: 'Because the loss feels scary, the plan focuses on reducing panic decisions without abandoning your long-term goal.',
    growth: 'Because growth still matters, the plan avoids moving everything to cash and keeps money invested.'
  }[concern];

  const applyConcernContext = (implication) => {
    if (scenario.aiGenerated && scenario.implicationByConcern?.[concern]) {
      return {
        ...implication,
        ...scenario.implicationByConcern[concern],
        concernLens: scenario.implicationByConcern[concern].concernLens || concernLens
      };
    }

    if (concern === 'soon') {
      return {
        ...implication,
        headline: 'If you may need this money soon',
        emotionalCue: 'The stressful moment is not just a market drop; it is needing cash while the account is down.',
        everydayImpact: `This is like setting aside the money for a real bill before trouble starts: less exciting today, but it can prevent a forced sale from ${account.name} later.`,
        panicPath: {
          label: 'Pressure path',
          headline: 'Wait until the bill is due',
          result: 'If you wait until you urgently need cash, you may have to sell investments at whatever price the market gives you.'
        },
        calmPath: {
          label: 'Prepared path',
          headline: 'Build a cash runway first',
          result: `Use the recommended ${scenarioPlan.stocks}/${scenarioPlan.bonds}/${scenarioPlan.cash} mix so bills can come from cash or bonds before stocks.`
        },
        ifIgnored: `If your life event arrives while markets are down, you could be forced to sell from the stock side of ${account.name}.`,
        ifActed: `This plan moves the stabilizing part of the account to ${stablePercent}%, giving you a clearer first place to pull from.`,
        timeline: [
          { when: 'Today', text: 'Decide which dollars are for near-term life needs and which dollars can stay invested.' },
          { when: 'Before the expense', text: 'Use cash and bonds as the first source instead of selling stocks under pressure.' },
          { when: 'Afterward', text: 'Keep the long-term portion invested so the account can still recover and grow.' }
        ],
        confidence: [
          { label: 'Forced-selling risk', before: 76, after: Math.max(28, 72 - stablePercent) },
          { label: 'Cash runway clarity', before: 42, after: Math.min(92, 58 + stablePercent) },
          { label: 'Life-event readiness', before: 50, after: 84 }
        ],
        whyNotSell: 'Selling everything may create cash quickly, but it can also over-protect money you do not actually need soon. A runway separates urgent money from long-term money.'
      };
    }

    if (concern === 'growth') {
      return {
        ...implication,
        headline: 'If long-term growth matters most',
        emotionalCue: 'The risk is getting so defensive that your future goal quietly falls behind.',
        everydayImpact: `This is the investing version of staying on the planned route instead of pulling over because the road looks rough for a few miles.`,
        panicPath: {
          label: 'Stall path',
          headline: 'Hide in cash too long',
          result: 'Avoiding every short-term drop can make the account miss the growth needed for a bigger future goal.'
        },
        calmPath: {
          label: 'Growth path',
          headline: 'Stay invested with guardrails',
          result: `Use the recommended ${scenarioPlan.stocks}/${scenarioPlan.bonds}/${scenarioPlan.cash} mix to keep growth exposure while still holding stabilizers.`
        },
        ifIgnored: `If you stay too conservative for this goal, ${account.name} may depend mostly on contributions instead of compounding.`,
        ifActed: `This plan keeps ${scenarioPlan.stocks}% in stocks, so the account still has meaningful upside if markets recover or keep rising.`,
        timeline: [
          { when: 'Today', text: 'Keep enough stability to avoid panic, but do not move every dollar away from growth.' },
          { when: 'Next year', text: 'New contributions and rebalancing can keep buying into the long-term plan.' },
          { when: 'Longer term', text: 'Staying invested gives compounding more time to work toward the goal.' }
        ],
        confidence: [
          { label: 'Growth participation', before: 52, after: Math.min(92, scenarioPlan.stocks + 8) },
          { label: 'Over-caution risk', before: 68, after: 36 },
          { label: 'Long-term alignment', before: 58, after: 86 }
        ],
        whyNotSell: 'Selling everything removes downside, but it also removes the engine of long-term growth. The better move is usually guardrails, not exiting the market.'
      };
    }

    return {
      ...implication,
      headline: 'If losing money is what worries you',
      emotionalCue: 'The scary part is seeing losses and feeling pushed to make a permanent decision too quickly.',
      everydayImpact: `This is the investing version of slowing down before a risky turn: you reduce danger without abandoning the destination.`,
      panicPath: {
        label: 'Fear path',
        headline: 'Let fear choose the trade',
        result: 'Reacting to the scary headline can lock in losses or push you into a portfolio that no longer fits your goal.'
      },
      calmPath: {
        label: 'Calm path',
        headline: 'Reduce risk without quitting',
        result: `Use the recommended ${scenarioPlan.stocks}/${scenarioPlan.bonds}/${scenarioPlan.cash} mix to lower stress while staying connected to the plan.`
      },
      ifIgnored: `If you ignore the fear, you may keep an allocation that feels too risky and makes panic selling more likely later.`,
      ifActed: `This plan gives the account ${stablePercent}% in stabilizers, so market swings should feel less extreme without abandoning growth.`,
      timeline: [
        { when: 'Today', text: 'Name the risk instead of reacting to the emotion.' },
        { when: 'Next downturn', text: 'A calmer mix can make it easier to hold the plan when prices fall.' },
        { when: 'Longer term', text: 'You stay invested enough to recover while carrying less emotional pressure.' }
      ],
      confidence: [
        { label: 'Panic risk', before: 74, after: 34 },
        { label: 'Emotional control', before: 48, after: 84 },
        { label: 'Goal alignment', before: 55, after: 82 }
      ],
      whyNotSell: 'Selling everything can feel safe in the moment, but it can turn a temporary fear into a permanent decision. A calmer allocation is usually more useful than an all-cash escape.'
    };
  };

  const withDefaults = (implication) => applyConcernContext({
    timeline: defaultTimeline,
    panicPath: {
      label: 'Panic path',
      headline: 'React fast, regret later',
      result: 'Sell after bad news, lock in losses, and risk missing a recovery.'
    },
    calmPath: {
      label: 'Calm path',
      headline: 'Protect first, stay invested',
      result: `Use the recommended ${scenarioPlan.stocks}/${scenarioPlan.bonds}/${scenarioPlan.cash} mix to match the scenario without going all-or-nothing.`
    },
    confidence: [
      { label: 'Panic risk', before: 70, after: 35 },
      { label: 'Goal alignment', before: 55, after: 82 },
      { label: 'Cash cushion clarity', before: 45, after: Math.min(90, 55 + stablePercent) }
    ],
    whyNotSell: 'Selling everything can feel safe because the account stops moving with the market. The problem is that it can turn a temporary drop into a permanent loss and leave you on the sidelines if recovery starts.',
    concernLens,
    ...implication
  });

  if (scenarioId.includes('market-drop')) {
    return withDefaults({
      headline: 'If this market drop really happened',
      emotionalCue: 'You may open your app and see a balance that is suddenly thousands of dollars lower.',
      ifIgnored: `If you panic-sell after a 20% drop, you could turn a temporary paper loss into a permanent loss of about $${dropAmount.toLocaleString()} on this account.`,
      ifActed: `If you follow this plan, you keep enough stability in bonds and cash to avoid selling everything at the worst possible time.`,
      everydayImpact: `That $${dropAmount.toLocaleString()} swing is roughly ${billsCovered} months of assumed $${monthlyBills.toLocaleString()} bills, so the plan is about protecting real life, not just a chart.`,
      timeline: [
        { when: 'Today', text: `Your ${account.name} could show about $${dropAmount.toLocaleString()} less during the drop.` },
        { when: 'Next 3 months', text: 'Panic selling may make the loss permanent; a calmer mix gives you time to breathe.' },
        { when: 'Next 2-3 years', text: 'If markets recover, staying partly invested lets the account participate instead of watching from cash.' }
      ],
      panicPath: {
        label: 'Panic path',
        headline: `Lock in about $${dropAmount.toLocaleString()}`,
        result: 'Selling after the drop may feel safe for a day, but it makes recovery much harder.'
      }
    });
  }

  if (scenarioId.includes('inflation') || scenarioId.includes('tuition-inflation')) {
    return withDefaults({
      headline: 'If prices keep rising in real life',
      emotionalCue: 'Your groceries, rent, tuition, and medical costs may feel more expensive even if your account balance looks unchanged.',
      ifIgnored: 'If too much money sits idle, it can quietly lose buying power. The number may stay the same, but it may pay for less later.',
      ifActed: `This plan keeps ${scenarioPlan.stocks}% in growth assets while preserving cash for near-term needs.`,
      everydayImpact: 'The goal is to keep your future lifestyle from shrinking because everyday costs rose faster than your money grew.',
      timeline: [
        { when: 'Today', text: 'Your cash still looks stable, which can make inflation easy to ignore.' },
        { when: 'Next year', text: 'Bills can rise faster than the cash earns, lowering real buying power.' },
        { when: 'Longer term', text: 'Keeping growth assets in the mix helps your money fight rising prices.' }
      ],
      panicPath: {
        label: 'Passive path',
        headline: 'Lose buying power quietly',
        result: 'Doing nothing may feel calm, but inflation can reduce what your money can actually buy.'
      }
    });
  }

  if (scenarioId.includes('withdraw') || scenarioId.includes('retire-earlier') || scenarioId.includes('soon')) {
    return withDefaults({
      headline: 'If you actually need money soon',
      emotionalCue: 'The danger is needing cash at the same time the market is down.',
      ifIgnored: 'If you keep too much in stocks right before a withdrawal, you may be forced to sell shares when prices are low.',
      ifActed: `This plan raises cash and bonds to ${scenarioPlan.cash + scenarioPlan.bonds}% combined, giving you a more stable pool to draw from first.`,
      everydayImpact: 'That can mean paying the bill, tuition, or early-retirement expense without wrecking the long-term part of the portfolio.'
    });
  }

  if (scenarioId.includes('fee') || scenarioId.includes('switch-funds')) {
    return withDefaults({
      headline: 'If fund fees keep dragging on returns',
      emotionalCue: 'Fees do not feel painful today because they come out quietly, but they compound against you every year.',
      ifIgnored: 'A high-fee fund can keep taking a slice of growth even when you do everything else right.',
      ifActed: 'Switching to lower-cost broad funds can leave more of the market return in your account instead of leaking out through fees.',
      everydayImpact: 'Over decades, that can be the difference between a slightly smaller retirement account and more breathing room later.'
    });
  }

  if (scenarioId.includes('max') || scenarioId.includes('increase') || scenarioId.includes('contribution')) {
    return withDefaults({
      headline: 'If you actually increase contributions',
      emotionalCue: 'Your monthly budget may feel a little tighter at first.',
      ifIgnored: 'If contributions stay low, the account depends mostly on market returns and has less fuel to grow.',
      ifActed: 'Automating the increase turns the decision into a habit, so wealth building happens without needing constant willpower.',
      everydayImpact: 'This is the investing version of taking the safer route before a crash: boring in the moment, meaningful later.'
    });
  }

  if (scenarioId.includes('aggressive') || scenarioId.includes('invest-all')) {
    return withDefaults({
      headline: 'If you choose a more aggressive path',
      emotionalCue: 'The account may grow faster, but the drops will feel sharper when markets fall.',
      ifIgnored: 'If you avoid investing for too long, the money may miss years of potential growth.',
      ifActed: `This plan still keeps ${scenarioPlan.cash + scenarioPlan.bonds}% in stabilizers, so the account is not all-or-nothing.`,
      everydayImpact: 'The real-world tradeoff is accepting scarier short-term swings for a better chance at long-term growth.'
    });
  }

  return withDefaults({
    headline: 'If you make this change in real life',
    emotionalCue: 'This decision changes how your account may feel during stressful markets.',
    ifIgnored: 'If you do nothing, your current risk level stays the same, even if your life situation has changed.',
    ifActed: 'If you follow the plan, your investments better match the scenario you selected.',
    everydayImpact: 'The goal is fewer surprise decisions when money stress is already high.'
  });
};

// Generate dynamic scenarios based on account data
const generateScenarios = (account) => {
  const currentBalance = account?.totalBalance || 0;
  const accountType = account?.type || '';
  
  const scenarios = {
  'Brokerage': [
    {
      id: 'increase-contributions',
      title: 'Increase Monthly Contributions',
      description: 'What if you increased your monthly investment by $500?',
      before: { value: currentBalance, monthly: 500, years: 20, finalBalance: Math.round(currentBalance * 1.5 + 500 * 12 * 20 * 1.08) },
      after: { value: currentBalance, monthly: 1000, years: 20, finalBalance: Math.round(currentBalance * 1.5 + 1000 * 12 * 20 * 1.08) },
      impact: Math.round(500 * 12 * 20 * 1.08),
      insights: [
        `Doubling your monthly contribution could grow your current $${currentBalance.toLocaleString()} significantly`,
        'The power of compound interest: an extra $500/month becomes substantial wealth over 20 years',
        'Consider automating contributions to make saving effortless'
      ]
    },
    {
      id: 'market-drop',
      title: 'Market Drops 20%',
      description: 'How would a severe market correction affect your portfolio?',
      before: { value: currentBalance, drop: 0, newValue: currentBalance },
      after: { value: currentBalance, drop: 20, newValue: Math.round(currentBalance * 0.8) },
      impact: -Math.round(currentBalance * 0.2),
      insights: [
        `A 20% drop would reduce your portfolio by $${Math.round(currentBalance * 0.2).toLocaleString()}`,
        'Historical recoveries: S&P 500 has recovered from every major crash',
        'This is why having bonds and cash provides stability during downturns',
        'Consider dollar-cost averaging to buy during dips'
      ]
    },
    {
      id: 'switch-funds',
      title: 'Switch to Lower-Fee Funds',
      description: 'What if you reduced your expense ratios from 0.50% to 0.10%?',
      before: { value: currentBalance, expenseRatio: 0.50, years: 30, finalBalance: Math.round(currentBalance * Math.pow(1.07, 30)) },
      after: { value: currentBalance, expenseRatio: 0.10, years: 30, finalBalance: Math.round(currentBalance * Math.pow(1.074, 30)) },
      impact: Math.round(currentBalance * (Math.pow(1.074, 30) - Math.pow(1.07, 30))),
      insights: [
        `Reducing fees by 0.40% could save you $${Math.round(currentBalance * (Math.pow(1.074, 30) - Math.pow(1.07, 30))).toLocaleString()} over 30 years`,
        'Fees compound against you - they reduce both your balance and potential returns',
        'Consider switching to low-cost index funds like VTI, VTSAX, or FXAIX'
      ]
    },
    {
      id: 'rebalance',
      title: 'Rebalance to Target Allocation',
      description: 'What if you rebalanced your portfolio to 70% stocks / 20% bonds / 10% cash?',
      before: { stocks: account.allocation?.stocks || 60, bonds: account.allocation?.bonds || 30, cash: account.allocation?.cash || 10, expectedReturn: 7.5 },
      after: { stocks: 70, bonds: 20, cash: 10, expectedReturn: 8.2 },
      impact: '+0.7% annual return',
      insights: [
        'Increasing stock allocation could boost expected returns by 0.7% annually',
        'Higher returns come with higher volatility - make sure you can handle fluctuations',
        'Rebalancing regularly (annually or semi-annually) maintains your target risk level'
      ]
    }
  ],
  'Roth IRA': [
    {
      id: 'max-contributions',
      title: 'Max Out Annual Contributions',
      description: 'What if you contributed the full $7,000 every year for 30 years?',
      before: { annual: 3500, years: 30, currentBalance: currentBalance, projectedBalance: Math.round(currentBalance * Math.pow(1.08, 30) + 3500 * ((Math.pow(1.08, 30) - 1) / 0.08)) },
      after: { annual: 7000, years: 30, currentBalance: currentBalance, projectedBalance: Math.round(currentBalance * Math.pow(1.08, 30) + 7000 * ((Math.pow(1.08, 30) - 1) / 0.08)) },
      impact: Math.round(3500 * ((Math.pow(1.08, 30) - 1) / 0.08)),
      insights: [
        `Starting with your current $${currentBalance.toLocaleString()}, maxing out contributions could significantly boost your retirement`,
        'All growth is completely tax-free - no taxes on withdrawal in retirement',
        'Even increasing by $100/month makes a significant difference over decades'
      ]
    },
    {
      id: 'retire-earlier',
      title: 'Retire 5 Years Earlier',
      description: 'What if you retired at 60 instead of 65?',
      before: { currentBalance: currentBalance, retirementAge: 65, yearsContributing: 30, finalBalance: Math.round(currentBalance * Math.pow(1.08, 30)) },
      after: { currentBalance: currentBalance, retirementAge: 60, yearsContributing: 25, finalBalance: Math.round(currentBalance * Math.pow(1.08, 25)) },
      impact: -Math.round(currentBalance * (Math.pow(1.08, 30) - Math.pow(1.08, 25))),
      insights: [
        `With your current $${currentBalance.toLocaleString()} balance, retiring 5 years earlier means less time for growth`,
        'You will also need your savings to last 5 more years',
        'Consider increasing contributions now if early retirement is your goal'
      ]
    },
    {
      id: 'conversion',
      title: 'Convert Traditional IRA to Roth',
      description: 'What if you converted a $50k Traditional IRA to your existing Roth?',
      before: { traditionalBalance: 50000, taxRate: 22, taxOwed: 0, rothBalance: currentBalance },
      after: { traditionalBalance: 0, taxRate: 22, taxOwed: 11000, rothBalance: currentBalance + 50000 },
      impact: 'Pay $11k tax now for tax-free growth forever',
      insights: [
        'You will owe $11,000 in taxes on the conversion (at 22% rate)',
        `This would increase your Roth IRA balance from $${currentBalance.toLocaleString()} to $${(currentBalance + 50000).toLocaleString()}`,
        'Best strategy: convert in years when your income is lower',
        'Consider spreading conversions over multiple years to stay in lower brackets'
      ]
    },
    {
      id: 'aggressive-allocation',
      title: 'Switch to 100% Stocks',
      description: 'What if you invested 100% in stocks instead of your current allocation?',
      before: { stocks: account.allocation?.stocks || 80, bonds: account.allocation?.bonds || 20, expectedReturn: 8.5, volatility: 'Moderate', projectedBalance: Math.round(currentBalance * Math.pow(1.085, 30)) },
      after: { stocks: 100, bonds: 0, expectedReturn: 10.0, volatility: 'High', projectedBalance: Math.round(currentBalance * Math.pow(1.10, 30)) },
      impact: '+1.5% annual return',
      insights: [
        `With your current $${currentBalance.toLocaleString()}, going 100% stocks could significantly increase long-term returns`,
        'Since Roth IRA gains are never taxed, this is ideal for aggressive growth',
        'Higher returns mean higher volatility - expect larger swings',
        'As a retirement account, you have time to ride out market dips'
      ]
    }
  ],
  'HSA': [
    {
      id: 'invest-all-cash',
      title: 'Invest All Cash Balance',
      description: 'What if you moved your cash balance into investments?',
      before: { cash: Math.round(currentBalance * (account.allocation?.cash || 50) / 100), invested: Math.round(currentBalance * (100 - (account.allocation?.cash || 50)) / 100), totalReturn: 0, years: 25 },
      after: { cash: 0, invested: currentBalance, totalReturn: 8, finalBalance: Math.round(currentBalance * Math.pow(1.08, 25)) },
      impact: `+$${Math.round(currentBalance * (Math.pow(1.08, 25) - 1)).toLocaleString()} over 25 years`,
      insights: [
        `Investing your full $${currentBalance.toLocaleString()} balance could significantly boost your HSA by retirement`,
        'Keep 3-6 months of medical expenses in cash, invest the rest',
        'HSA investments grow tax-free - take advantage of this benefit'
      ]
    },
    {
      id: 'pay-out-of-pocket',
      title: 'Pay Medical Expenses Out-of-Pocket',
      description: 'What if you paid medical expenses from checking instead of HSA?',
      before: { balance: currentBalance, medicalWithdrawals: 2000, years: 30, finalBalance: Math.round((currentBalance - 2000) * Math.pow(1.08, 30)) },
      after: { balance: currentBalance, medicalWithdrawals: 0, years: 30, finalBalance: Math.round(currentBalance * Math.pow(1.08, 30)) },
      impact: `+$${Math.round(2000 * Math.pow(1.08, 30)).toLocaleString()}`,
      insights: [
        `Leaving your full $${currentBalance.toLocaleString()} to grow could add substantial value by retirement`,
        'Save all medical receipts - you can reimburse yourself years later',
        'This strategy turns your HSA into a "super IRA" with triple tax advantages'
      ]
    },
    {
      id: 'family-max',
      title: 'Contribute Family Maximum',
      description: 'What if you maxed out family contributions ($8,300/year)?',
      before: { annual: 4150, years: 20, currentBalance: currentBalance, finalBalance: Math.round(currentBalance * Math.pow(1.08, 20) + 4150 * ((Math.pow(1.08, 20) - 1) / 0.08)) },
      after: { annual: 8300, years: 20, currentBalance: currentBalance, finalBalance: Math.round(currentBalance * Math.pow(1.08, 20) + 8300 * ((Math.pow(1.08, 20) - 1) / 0.08)) },
      impact: `+$${Math.round(4150 * ((Math.pow(1.08, 20) - 1) / 0.08)).toLocaleString()}`,
      insights: [
        'Family max contributions could substantially increase your HSA balance',
        'All contributions reduce your taxable income now',
        'At age 65, you can use HSA funds for anything (like a Traditional IRA)'
      ]
    },
    {
      id: 'retirement-use',
      title: 'Use HSA for Retirement',
      description: 'What if you saved your HSA entirely for retirement (age 65+)?',
      before: { currentBalance: currentBalance, useFor: 'medical', balance65: Math.round(currentBalance * Math.pow(1.08, 30)), medicareUsage: 0 },
      after: { currentBalance: currentBalance, useFor: 'retirement', balance65: Math.round(currentBalance * Math.pow(1.08, 30)), medicareUsage: 15000 },
      impact: 'Tax-free fund for Medicare premiums, long-term care, any expense',
      insights: [
        `Your current $${currentBalance.toLocaleString()} could grow to over $${Math.round(currentBalance * Math.pow(1.08, 30) / 1000)}k by age 65`,
        'After 65, HSA can pay for Medicare premiums tax-free',
        'Can also withdraw for non-medical expenses (taxed as ordinary income, no penalty)',
        'This makes HSA the best retirement account - better than 401k or IRA'
      ]
    }
  ],
  'Traditional 401(k)': [
    {
      id: 'match-increase',
      title: 'Employer Match Increases',
      description: 'What if your employer increased their match from 3% to 5%?',
      before: { currentBalance: currentBalance, salary: 80000, yourContrib: 6, matchRate: 3, matchDollars: 2400, annual: 7200 },
      after: { currentBalance: currentBalance, salary: 80000, yourContrib: 6, matchRate: 5, matchDollars: 4000, annual: 8800 },
      impact: '+$1,600/year in free money',
      insights: [
        `With your current $${currentBalance.toLocaleString()}, an extra 2% match means $1,600/year in free money`,
        'Over 30 years at 8% return, that is an extra $182,000',
        'Always contribute at least enough to get the full match'
      ]
    },
    {
      id: 'increase-contribution',
      title: 'Increase Contribution by 2%',
      description: 'What if you increased your contribution from 6% to 8%?',
      before: { currentBalance: currentBalance, salary: 80000, contribution: 6, annual: 4800, projectedBalance: Math.round(currentBalance * Math.pow(1.08, 30) + 4800 * ((Math.pow(1.08, 30) - 1) / 0.08)) },
      after: { currentBalance: currentBalance, salary: 80000, contribution: 8, annual: 6400, projectedBalance: Math.round(currentBalance * Math.pow(1.08, 30) + 6400 * ((Math.pow(1.08, 30) - 1) / 0.08)) },
      impact: `+$${Math.round(1600 * ((Math.pow(1.08, 30) - 1) / 0.08)).toLocaleString()}`,
      insights: [
        'Just 2% more ($133/month) could add substantial value to your retirement',
        'Your take-home pay only drops by about $106/month after tax savings',
        'Try increasing by 1% each year until you hit 15%'
      ]
    },
    {
      id: 'retire-later',
      title: 'Work 3 More Years',
      description: 'What if you retired at 68 instead of 65?',
      before: { currentBalance: currentBalance, retireAge: 65, projectedBalance: Math.round(currentBalance * Math.pow(1.08, 30)), socialSecurity: 2500 },
      after: { currentBalance: currentBalance, retireAge: 68, projectedBalance: Math.round(currentBalance * Math.pow(1.08, 33)), socialSecurity: 3100 },
      impact: '+$145k + higher Social Security',
      insights: [
        'Working 3 extra years adds significant value and increases Social Security by $600/month',
        'Your portfolio also has 3 fewer years of withdrawals',
        'Delayed retirement credits boost Social Security by 8%/year after full retirement age'
      ]
    },
    {
      id: 'roth-401k',
      title: 'Switch to Roth 401(k)',
      description: 'What if you contributed to Roth 401(k) instead of Traditional?',
      before: { currentBalance: currentBalance, contribution: 6400, taxSavingsNow: 1408, projectedBalance: Math.round(currentBalance * Math.pow(1.08, 30)), taxOwed: Math.round(currentBalance * Math.pow(1.08, 30) * 0.22) },
      after: { currentBalance: currentBalance, contribution: 6400, taxSavingsNow: 0, projectedBalance: Math.round(currentBalance * Math.pow(1.08, 30)), taxOwed: 0 },
      impact: 'Pay taxes now, $0 taxes in retirement',
      insights: [
        'You will lose $1,408/year in current tax savings',
        `But you will save significant retirement taxes on your $${currentBalance.toLocaleString()} balance`,
        'Best if you expect to be in a higher tax bracket in retirement',
        'Many experts recommend splitting: half Traditional, half Roth'
      ]
    }
  ],
  '529 Plan': [
    {
      id: 'tuition-inflation',
      title: 'Tuition Inflation Continues',
      description: 'What if college costs rise 6%/year instead of 4%?',
      before: { currentBalance: currentBalance, currentCost: 30000, years: 10, inflation: 4, futureCost: 44407 },
      after: { currentBalance: currentBalance, currentCost: 30000, years: 10, inflation: 6, futureCost: 53725 },
      impact: '+$9,318 needed',
      insights: [
        `With your current $${currentBalance.toLocaleString()}, higher inflation means you will need $9,318 more for college`,
        'Contribute an extra $50/month to account for higher inflation',
        'Private schools have historically increased faster than public schools'
      ]
    },
    {
      id: 'delayed-contributions',
      title: 'Start Contributing More Now',
      description: 'What if you increased monthly contributions by $200?',
      before: { currentBalance: currentBalance, monthly: 300, years: 10, finalBalance: Math.round(currentBalance * Math.pow(1.06, 10) + 300 * 12 * ((Math.pow(1.06, 10) - 1) / 0.06)) },
      after: { currentBalance: currentBalance, monthly: 500, years: 10, finalBalance: Math.round(currentBalance * Math.pow(1.06, 10) + 500 * 12 * ((Math.pow(1.06, 10) - 1) / 0.06)) },
      impact: `+$${Math.round(200 * 12 * ((Math.pow(1.06, 10) - 1) / 0.06)).toLocaleString()}`,
      insights: [
        'Starting with more monthly contributions significantly boosts your college savings',
        'The first years are the most valuable for compounding',
        'Starting now is always better than waiting - even small amounts help'
      ]
    },
    {
      id: 'scholarship',
      title: 'Child Receives Full Scholarship',
      description: 'What if your child gets a full-ride scholarship?',
      before: { balance: currentBalance, used: currentBalance, taxes: 0, penalties: 0 },
      after: { balance: currentBalance, used: 0, taxes: Math.round(currentBalance * 0.1), penalties: 0, options: 'Multiple' },
      impact: 'No penalty! Transfer to sibling or withdraw',
      insights: [
        'Scholarship exception: withdraw without 10% penalty (still owe tax on earnings)',
        'Option 1: Transfer to another family member (sibling, cousin, parent)',
        'Option 2: Save for grad school',
        `Option 3: Withdraw and pay income tax on earnings only (contributions tax-free)`
      ]
    },
    {
      id: 'grad-school',
      title: 'Save for Graduate School',
      description: 'What if you kept contributing for graduate school after undergrad?',
      before: { currentBalance: currentBalance, undergradCost: 100000, gradSchool: 0, totalSavings: currentBalance },
      after: { currentBalance: currentBalance, undergradCost: 100000, gradSchool: 60000, totalSavings: Math.round(currentBalance * 1.6) },
      impact: '+$60k for grad school',
      insights: [
        '529 plans can be used for graduate school, medical school, law school',
        'Keep contributing if grad school is likely',
        'If not needed, can transfer to another beneficiary or use for your own education'
      ]
    }
  ]
};

  return scenarios[accountType] || [];
};

export default function ScenariosTab({ account }) {
  const { dispatch } = useApp();
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [selectedConcern, setSelectedConcern] = useState('loss');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customScenariosByAccount, setCustomScenariosByAccount] = useState({});
  const [customLoading, setCustomLoading] = useState(false);

  if (!account) {
    return (
      <div className="scenarios-tab">
        <div className="empty-state">
          <h3>No Account Selected</h3>
          <p>Please select an account to view what-if scenarios.</p>
        </div>
      </div>
    );
  }

  const customScenarios = customScenariosByAccount[account.id] || [];
  const scenarios = [...customScenarios, ...generateScenarios(account)];

  if (scenarios.length === 0) {
    return (
      <div className="scenarios-tab">
        <div className="empty-state">
          <h3>Scenarios Coming Soon</h3>
          <p>What-if scenarios for {account.type} accounts will be available soon.</p>
        </div>
      </div>
    );
  }

  const scenario = scenarios[selectedScenario];
  const baseScenarioPlan = adjustPlanForConcern(getScenarioPlan(account, scenario), selectedConcern);
  const scenarioTaxImpact = estimateTaxImpact(account, baseScenarioPlan);
  const scenarioPlan = {
    ...baseScenarioPlan,
    taxes: formatTaxImpact(scenarioTaxImpact),
    taxImpact: scenarioTaxImpact
  };
  const displayedAfter = scenario.aiGenerated && scenarioPlan
    ? { stocks: scenarioPlan.stocks, bonds: scenarioPlan.bonds, cash: scenarioPlan.cash }
    : scenario.after;
  const realWorldImplication = getRealWorldImplication(account, scenario, scenarioPlan, selectedConcern);

  const handleCreatePlan = () => {
    dispatch({ type: 'SET_PENDING_PLAN', payload: scenarioPlan });
    dispatch({
      type: 'ADJUST_CONFIDENCE',
      payload: {
        amount: 6,
        reason: `Scenario plan created for: ${scenario.title}`,
        key: `scenario-${account.id}-${scenario.id}`
      }
    });
    toast.success('Scenario rebalance plan saved to Review & Act.');
  };

  const handleCustomScenario = async (event) => {
    event.preventDefault();
    const prompt = customPrompt.trim();
    if (!prompt || customLoading) return;
    setCustomLoading(true);
    const aiScenario = await getCustomWhatIfScenario({ account, prompt });
    const nextScenario = createCustomScenario(account, prompt);
    const mergedScenario = {
      ...nextScenario,
      title: aiScenario.title ? `My situation: ${aiScenario.title}` : nextScenario.title,
      description: aiScenario.description || nextScenario.description,
      impact: aiScenario.impact || nextScenario.impact,
      after: aiScenario.after || nextScenario.after,
      planRationale: aiScenario.planRationale || nextScenario.planRationale,
      planByConcern: aiScenario.planByConcern || nextScenario.planByConcern,
      implicationByConcern: aiScenario.implicationByConcern || nextScenario.implicationByConcern,
      insights: aiScenario.insights || nextScenario.insights,
      aiGenerated: true
    };
    setCustomScenariosByAccount(prev => ({
      ...prev,
      [account.id]: [mergedScenario, ...(prev[account.id] || [])].slice(0, 3)
    }));
    setSelectedConcern(aiScenario.concern || inferConcernFromText(prompt));
    setSelectedScenario(0);
    setCustomPrompt('');
    setCustomLoading(false);
    toast.success('AI what-if created from your situation.');
  };

  const handleDeleteCustomScenario = (scenarioId) => {
    setCustomScenariosByAccount(prev => {
      const remaining = (prev[account.id] || []).filter(item => item.id !== scenarioId);
      return {
        ...prev,
        [account.id]: remaining
      };
    });
    setSelectedScenario(0);
    toast.success('Custom what-if removed.');
  };

  return (
    <div className="scenarios-tab">
      <div className="section-heading">
        <p className="eyebrow">What-If Analysis</p>
        <h2>{account.type} Scenarios</h2>
        <p className="section-subtitle">
          Explore different scenarios to make informed decisions about your {account.type}.
        </p>
      </div>

      <div className="scenario-buttons">
        {scenarios.map((s, index) => (
          <div
            key={s.id}
            className={`scenario-button-wrap ${selectedScenario === index ? 'active' : ''} ${s.aiGenerated ? 'custom' : ''}`}
          >
            <button
              className={`scenario-button ${selectedScenario === index ? 'active' : ''}`}
              onClick={() => setSelectedScenario(index)}
            >
              {s.title}
            </button>
            {s.aiGenerated && (
              <button
                type="button"
                className="delete-scenario-button"
                aria-label={`Delete ${s.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteCustomScenario(s.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="custom-scenario-panel">
        <div className="custom-scenario-copy">
          <span className="custom-scenario-badge">AI custom scenario</span>
          <h3>Create Your Own What-If</h3>
          <p>
            Type a real life situation and the app will turn it into a beginner-friendly scenario,
            recommended allocation, plain-English impact, and next step for this account.
          </p>
        </div>
        <form className="custom-scenario-form" onSubmit={handleCustomScenario}>
          <input
            value={customPrompt}
            onChange={(event) => setCustomPrompt(event.target.value)}
            placeholder="Example: What if I need tuition money next year?"
            aria-label="Create your own what-if scenario"
          />
          <button type="submit" className="secondary-button" disabled={customLoading}>
            {customLoading ? 'Thinking...' : 'Show This Concern'}
          </button>
        </form>
      </div>

      <motion.div
        key={selectedScenario}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="scenario-content"
      >
        <div className="scenario-header">
          <h3>{scenario.title}</h3>
          <p className="scenario-description">{scenario.description}</p>
        </div>

        <div className="comparison-section">
          <div className="comparison-card before">
            <h4>Before</h4>
            <div className="comparison-data">
              {Object.entries(scenario.before).map(([key, value]) => (
                <div key={key} className="data-row">
                  <span className="data-label">{formatLabel(key)}</span>
                  <span className="data-value">{formatValue(key, value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="comparison-arrow">→</div>

          <div className="comparison-card after">
            <h4>After</h4>
            <div className="comparison-data">
              {Object.entries(displayedAfter).map(([key, value]) => (
                <div key={key} className="data-row">
                  <span className="data-label">{formatLabel(key)}</span>
                  <span className="data-value">{formatValue(key, value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="impact-highlight">
          <div className="impact-icon">
            {typeof scenario.impact === 'number' && scenario.impact > 0 ? '📈' : scenario.impact < 0 ? '📉' : '💡'}
          </div>
          <div className="impact-content">
            <h4>Impact</h4>
            <p className={`impact-value ${typeof scenario.impact === 'number' ? (scenario.impact > 0 ? 'positive' : 'negative') : ''}`}>
              {typeof scenario.impact === 'number' ? `${scenario.impact > 0 ? '+' : ''}$${Math.abs(scenario.impact).toLocaleString()}` : scenario.impact}
            </p>
          </div>
        </div>

        <div className="real-world-implication">
          <div className="concern-selector">
            <span>Show this through my concern:</span>
            <div className="concern-buttons" role="group" aria-label="Real-world concern">
              {concernOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  className={selectedConcern === option.id ? 'active' : ''}
                  onClick={() => setSelectedConcern(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="implication-header">
            <span className="implication-icon">!</span>
            <div>
              <h4>{realWorldImplication.headline}</h4>
              <p>{realWorldImplication.emotionalCue}</p>
            </div>
          </div>

          {realWorldImplication.concernLens && (
            <p className="concern-lens">{realWorldImplication.concernLens}</p>
          )}

          <div className="decision-paths">
            <div className="decision-path panic">
              <span>{realWorldImplication.panicPath.label}</span>
              <strong>{realWorldImplication.panicPath.headline}</strong>
              <p>{realWorldImplication.panicPath.result}</p>
            </div>
            <div className="decision-path calm">
              <span>{realWorldImplication.calmPath.label}</span>
              <strong>{realWorldImplication.calmPath.headline}</strong>
              <p>{realWorldImplication.calmPath.result}</p>
            </div>
          </div>

          <div className="implication-grid">
            <div className="implication-card warning">
              <span>If you ignore it</span>
              <p>{realWorldImplication.ifIgnored}</p>
            </div>
            <div className="implication-card action">
              <span>If you act calmly</span>
              <p>{realWorldImplication.ifActed}</p>
            </div>
          </div>
          <p className="everyday-impact">{realWorldImplication.everydayImpact}</p>

          <div className="implication-timeline">
            <h5>What happens next</h5>
            <div className="timeline-steps">
              {realWorldImplication.timeline.map(step => (
                <div className="timeline-step" key={step.when}>
                  <span>{step.when}</span>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="confidence-shift">
            <h5>What the calm plan improves</h5>
            {realWorldImplication.confidence.map(metric => (
              <div className="confidence-row" key={metric.label}>
                <div className="confidence-label">
                  <span>{metric.label}</span>
                  <strong>{metric.before} → {metric.after}</strong>
                </div>
                <div className="confidence-track">
                  <div className="confidence-before" style={{ width: `${metric.before}%` }}></div>
                  <div className="confidence-after" style={{ width: `${metric.after}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="why-not-sell">
            <h5>Why not just sell everything?</h5>
            <p>{realWorldImplication.whyNotSell}</p>
          </div>
        </div>

        <div className="insights-section">
          <h4>Key Insights</h4>
          <ul className="insights-list">
            {scenario.insights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>

        <div className="scenario-plan-section">
          <div className="scenario-plan-header">
            <div>
              <h4>Recommended Rebalance</h4>
              <p>{scenarioPlan.rationale}</p>
            </div>
            <button className="primary-button" onClick={handleCreatePlan}>
              Create Review Plan
            </button>
          </div>
          <div className="scenario-allocation-preview">
            <div>
              <span>Stocks</span>
              <strong>{scenarioPlan.stocks}%</strong>
            </div>
            <div>
              <span>Bonds</span>
              <strong>{scenarioPlan.bonds}%</strong>
            </div>
            <div>
              <span>Cash</span>
              <strong>{scenarioPlan.cash}%</strong>
            </div>
          </div>
          <div className="scenario-trust-notes">
            <p><strong>Costs:</strong> {scenarioPlan.costs}</p>
            <p><strong>Taxes:</strong> {scenarioPlan.taxes}</p>
            <p><strong>Estimated tax bill:</strong> ${Math.round(scenarioPlan.taxImpact.estimatedTax).toLocaleString()}</p>
          </div>
        </div>

        {/* Additional Context Section */}
        <div className="additional-context-section">
          <div className="context-grid">
            <div className="context-card">
              <div className="context-icon">⏰</div>
              <h5>Timeline Considerations</h5>
              <p>
                {account.type === 'Brokerage' && 'Market recoveries typically take 2-3 years. Keep 1-2 years of expenses in bonds/cash.'}
                {account.type === 'Roth IRA' && 'You have decades for tax-free growth. Time in the market beats timing the market.'}
                {account.type === 'HSA' && 'Triple tax advantage makes this the best long-term savings vehicle if you can afford to pay medical costs out-of-pocket.'}
                {account.type === 'Traditional 401(k)' && 'Every year of delay in contributing costs you both the contribution and decades of compound growth.'}
                {account.type === '529 Plan' && `With ${account.timeHorizon || '10+ years'} until college, you have time to weather market volatility.`}
              </p>
            </div>

            <div className="context-card">
              <div className="context-icon">💰</div>
              <h5>Cost Analysis</h5>
              <p>
                {account.type === 'Brokerage' && 'Consider tax-loss harvesting to offset gains. Long-term capital gains (>1 year) are taxed at 0%, 15%, or 20% based on income.'}
                {account.type === 'Roth IRA' && 'No taxes on qualified withdrawals after 59½ and 5-year holding period. Early withdrawal penalties can apply.'}
                {account.type === 'HSA' && 'Withdrawals for qualified medical expenses are always tax-free. After 65, non-medical withdrawals taxed as income (no penalty).'}
                {account.type === 'Traditional 401(k)' && 'Withdrawals taxed as ordinary income. 10% penalty before 59½ (with some exceptions). RMDs start at 73.'}
                {account.type === '529 Plan' && 'Non-qualified withdrawals subject to income tax + 10% penalty on earnings. Can transfer to family members penalty-free.'}
              </p>
            </div>

            <div className="context-card">
              <div className="context-icon">🎯</div>
              <h5>Risk Factors</h5>
              <p>
                {account.type === 'Brokerage' && 'Full market exposure in taxable account. Consider tax-efficient funds (ETFs over mutual funds, index over active).'}
                {account.type === 'Roth IRA' && 'Contribution limits may restrict large catch-ups. But conversions from Traditional IRA are unlimited.'}
                {account.type === 'HSA' && 'Must have qualifying HDHP to contribute. Losing HDHP coverage mid-year can trigger partial ineligibility.'}
                {account.type === 'Traditional 401(k)' && 'Company match may have vesting schedule. Job changes before vesting means lost employer contributions.'}
                {account.type === '529 Plan' && 'Investment risk increases with shorter time horizons. Consider age-based portfolios that auto-adjust.'}
              </p>
            </div>

            <div className="context-card">
              <div className="context-icon">📚</div>
              <h5>Expert Recommendations</h5>
              <p>
                {account.type === 'Brokerage' && 'Max out tax-advantaged accounts first. Use this for: large purchases in 3-10 years, extra retirement savings, or high-income overflow.'}
                {account.type === 'Roth IRA' && 'Best for young professionals (lower tax bracket now). Backdoor Roth option for high earners. Consider conversions in low-income years.'}
                {account.type === 'HSA' && 'The "stealth IRA" - save receipts indefinitely, invest the balance, reimburse yourself in retirement tax-free.'}
                {account.type === 'Traditional 401(k)' && 'Contribute at least enough for full match (free money). Increase by 1% annually. Target 15-20% total savings rate.'}
                {account.type === '529 Plan' && 'Front-load if possible (5-year gift tax averaging). New: can roll up to $35k to beneficiary\'s Roth IRA if unused.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="action-items-section">
          <h4>🎬 Next Steps</h4>
          <div className="action-items-list">
            {account.type === 'Brokerage' && (
              <>
                <div className="action-item">
                  <span className="action-number">1</span>
                  <div className="action-content">
                    <strong>Review your asset allocation</strong>
                    <p>Ensure stocks/bonds/cash match your risk tolerance and timeline</p>
                  </div>
                </div>
                <div className="action-item">
                  <span className="action-number">2</span>
                  <div className="action-content">
                    <strong>Check expense ratios</strong>
                    <p>Move to low-cost index funds (target &lt;0.20% expense ratio)</p>
                  </div>
                </div>
                <div className="action-item">
                  <span className="action-number">3</span>
                  <div className="action-content">
                    <strong>Consider tax-loss harvesting</strong>
                    <p>Offset gains by selling losing positions before year-end</p>
                  </div>
                </div>
              </>
            )}
            {account.type === 'Roth IRA' && (
              <>
                <div className="action-item">
                  <span className="action-number">1</span>
                  <div className="action-content">
                    <strong>Max out annual contributions</strong>
                    <p>$7,000 for 2024 ($8,000 if age 50+). Contribute by tax deadline for prior year.</p>
                  </div>
                </div>
                <div className="action-item">
                  <span className="action-number">2</span>
                  <div className="action-content">
                    <strong>Invest aggressively</strong>
                    <p>With tax-free growth, maximize stock exposure (80-100% for long timelines)</p>
                  </div>
                </div>
                <div className="action-item">
                  <span className="action-number">3</span>
                  <div className="action-content">
                    <strong>Consider Roth conversions</strong>
                    <p>Convert Traditional IRA funds during low-income years</p>
                  </div>
                </div>
              </>
            )}
            {account.type === 'HSA' && (
              <>
                <div className="action-item">
                  <span className="action-number">1</span>
                  <div className="action-content">
                    <strong>Maximize contributions</strong>
                    <p>$4,150 individual / $8,300 family for 2024 (+$1,000 catch-up if 55+)</p>
                  </div>
                </div>
                <div className="action-item">
                  <span className="action-number">2</span>
                  <div className="action-content">
                    <strong>Pay medical costs out-of-pocket</strong>
                    <p>Let HSA grow invested. Save receipts to reimburse yourself later tax-free.</p>
                  </div>
                </div>
                <div className="action-item">
                  <span className="action-number">3</span>
                  <div className="action-content">
                    <strong>Invest the balance</strong>
                    <p>Keep 1-2 years of deductible in cash, invest the rest for long-term growth</p>
                  </div>
                </div>
              </>
            )}
            {account.type === 'Traditional 401(k)' && (
              <>
                <div className="action-item">
                  <span className="action-number">1</span>
                  <div className="action-content">
                    <strong>Get full employer match</strong>
                    <p>This is free money - contribute at least enough to maximize the match</p>
                  </div>
                </div>
                <div className="action-item">
                  <span className="action-number">2</span>
                  <div className="action-content">
                    <strong>Increase contribution annually</strong>
                    <p>Set up automatic 1% increases each year. Target 15-20% total savings.</p>
                  </div>
                </div>
                <div className="action-item">
                  <span className="action-number">3</span>
                  <div className="action-content">
                    <strong>Review fund options</strong>
                    <p>Choose low-cost index funds. Avoid expensive actively-managed funds.</p>
                  </div>
                </div>
              </>
            )}
            {account.type === '529 Plan' && (
              <>
                <div className="action-item">
                  <span className="action-number">1</span>
                  <div className="action-content">
                    <strong>Use age-based portfolios</strong>
                    <p>Automatically adjusts from stocks to bonds as college approaches</p>
                  </div>
                </div>
                <div className="action-item">
                  <span className="action-number">2</span>
                  <div className="action-content">
                    <strong>Maximize state tax benefits</strong>
                    <p>Many states offer deductions for contributions to in-state 529 plans</p>
                  </div>
                </div>
                <div className="action-item">
                  <span className="action-number">3</span>
                  <div className="action-content">
                    <strong>Consider front-loading</strong>
                    <p>Can contribute 5 years' worth ($85k) at once using gift tax averaging</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Helper functions
function formatLabel(key) {
  const labels = {
    value: 'Current Value',
    currentBalance: 'Current Balance',
    currentStocks: 'Current Stocks',
    currentBonds: 'Current Bonds',
    currentCash: 'Current Cash',
    projectedBalance: 'Projected Balance',
    monthly: 'Monthly Investment',
    years: 'Years',
    finalBalance: 'Final Balance',
    drop: 'Market Drop',
    newValue: 'New Value',
    expenseRatio: 'Expense Ratio',
    stocks: 'Stocks',
    bonds: 'Bonds',
    cash: 'Cash',
    expectedReturn: 'Expected Return',
    annual: 'Annual Contribution',
    currentAge: 'Current Age',
    retirementAge: 'Retirement Age',
    yearsContributing: 'Years Contributing',
    traditionalBalance: 'Traditional IRA',
    taxRate: 'Tax Rate',
    taxOwed: 'Tax Owed',
    rothBalance: 'Roth IRA Balance',
    volatility: 'Volatility',
    invested: 'Invested',
    totalReturn: 'Return Rate',
    medicalWithdrawals: 'Annual Medical Withdrawals',
    balance: 'HSA Balance',
    salary: 'Salary',
    yourContrib: 'Your Contribution',
    matchRate: 'Match Rate',
    matchDollars: 'Match Amount',
    contribution: 'Contribution %',
    socialSecurity: 'Social Security',
    retireAge: 'Retirement Age',
    taxSavingsNow: 'Current Tax Savings',
    currentCost: 'Current Annual Cost',
    inflation: 'Inflation Rate',
    futureCost: 'Future Cost',
    startAge: 'Start Age',
    used: 'Amount Used',
    taxes: 'Taxes Owed',
    penalties: 'Penalties',
    options: 'Options Available',
    undergradCost: 'Undergrad Cost',
    gradSchool: 'Grad School',
    totalSavings: 'Total Savings Goal',
    balance65: 'Balance at 65',
    useFor: 'Use For',
    medicareUsage: 'Annual Medicare/Medical',
    primaryUse: 'Primary Use'
  };
  return labels[key] || key;
}

function formatValue(key, value) {
  if (typeof value === 'number') {
    if (key.includes('Rate') || key.includes('Percent') || key.includes('Ratio') || key === 'drop' || key === 'taxRate' || key === 'inflation' || key === 'yourContrib' || key === 'matchRate' || key === 'contribution' || key === 'stocks' || key === 'bonds' || key === 'currentStocks' || key === 'currentBonds' || key === 'currentCash' || (key === 'cash' && value <= 100)) {
      return `${value}%`;
    }
    if (key.includes('Balance') || key.includes('Value') || key.includes('Cost') || key.includes('Dollars') || key.includes('Savings') || key.includes('Owed') || key.includes('monthly') || key.includes('annual') || key.includes('salary') || key.includes('Security') || key.includes('used') || key.includes('School') || key === 'value' || key === 'invested' || key === 'cash' || key === 'taxes') {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  }
  return value;
}
