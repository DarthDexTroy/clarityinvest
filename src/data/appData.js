// All app data in one file for simplicity

// Multiple investment accounts with holdings
export const investmentAccounts = [
  {
    id: 'brokerage-1',
    name: 'Individual Brokerage',
    type: 'Brokerage',
    totalBalance: 58420,
    allocation: { stocks: 85, bonds: 10, cash: 5 },
    healthScore: 78,
    goal: 'Flexible investing',
    riskTolerance: 'moderate',
    timeHorizon: '10+ years',
    holdings: [
      { ticker: 'AAPL', name: 'Apple Inc.', type: 'Stock', shares: 50, price: 189.50, totalValue: 9475, costBasis: 8500, gainLoss: 11.5, allocation: 16.2 },
      { ticker: 'MSFT', name: 'Microsoft Corp.', type: 'Stock', shares: 30, price: 378.90, totalValue: 11367, costBasis: 10800, gainLoss: 5.3, allocation: 19.5 },
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'ETF', shares: 100, price: 245.30, totalValue: 24530, costBasis: 22000, gainLoss: 11.5, allocation: 42.0 },
      { ticker: 'VFIAX', name: 'Vanguard 500 Index Fund', type: 'Mutual Fund', shares: 50, price: 418.50, totalValue: 5000, costBasis: 4800, gainLoss: 4.2, allocation: 8.6 },
      { ticker: 'AMZN', name: 'Amazon.com Inc.', type: 'Stock', shares: 10, price: 178.40, totalValue: 1784, costBasis: 1650, gainLoss: 8.1, allocation: 3.1 },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', type: 'ETF', shares: 75, price: 73.20, totalValue: 5490, costBasis: 5625, gainLoss: -2.4, allocation: 9.4 },
      { ticker: 'CASH', name: 'Cash Reserve', type: 'Cash', shares: 774, price: 1.00, totalValue: 774, costBasis: 774, gainLoss: 0, allocation: 1.3 }
    ]
  },
  {
    id: 'roth-ira-1',
    name: 'Roth IRA',
    type: 'Roth IRA',
    totalBalance: 49680,
    allocation: { stocks: 70, bonds: 25, cash: 5 },
    healthScore: 85,
    goal: 'Long-term tax-free growth',
    riskTolerance: 'moderate-aggressive',
    timeHorizon: '25+ years',
    holdings: [
      { ticker: 'FXAIX', name: 'Fidelity 500 Index Fund', type: 'Mutual Fund', shares: 120, price: 195.80, totalValue: 23496, costBasis: 20000, gainLoss: 17.5, allocation: 55.0 },
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'ETF', shares: 80, price: 245.30, totalValue: 19624, costBasis: 18000, gainLoss: 9.0, allocation: 46.0 },
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', type: 'ETF', shares: 60, price: 73.20, totalValue: 4392, costBasis: 4500, gainLoss: -2.4, allocation: 10.3 },
      { ticker: 'CASH', name: 'Cash Reserve', type: 'Cash', shares: 2168, price: 1.00, totalValue: 2168, costBasis: 2168, gainLoss: 0, allocation: 5.1 }
    ]
  },
  {
    id: 'hsa-1',
    name: 'Health Savings Account',
    type: 'HSA',
    totalBalance: 8720,
    allocation: { stocks: 52, bonds: 0, cash: 48 },
    healthScore: 72,
    goal: 'Medical expenses + tax-advantaged growth',
    riskTolerance: 'conservative',
    timeHorizon: '5-10 years',
    holdings: [
      { ticker: 'VTSAX', name: 'Vanguard Total Stock Market Index', type: 'Mutual Fund', shares: 40, price: 112.50, totalValue: 4500, costBasis: 4000, gainLoss: 12.5, allocation: 51.6 },
      { ticker: 'CASH', name: 'Medical Cash Reserve', type: 'Cash', shares: 4220, price: 1.00, totalValue: 4220, costBasis: 4220, gainLoss: 0, allocation: 48.4 }
    ]
  },
  {
    id: '401k-1',
    name: 'Traditional 401(k)',
    type: 'Traditional 401(k)',
    totalBalance: 89450,
    allocation: { stocks: 75, bonds: 20, cash: 5 },
    healthScore: 82,
    goal: 'Retirement savings',
    riskTolerance: 'moderate',
    timeHorizon: '20+ years',
    holdings: [
      { ticker: 'FXAIX', name: 'Fidelity 500 Index Fund', type: 'Mutual Fund', shares: 280, price: 195.80, totalValue: 54824, costBasis: 48000, gainLoss: 14.2, allocation: 61.3 },
      { ticker: 'VBTLX', name: 'Vanguard Total Bond Market Index', type: 'Mutual Fund', shares: 850, price: 10.50, totalValue: 8925, costBasis: 9000, gainLoss: -0.8, allocation: 10.0 },
      { ticker: 'VTIAX', name: 'Vanguard Total International Stock Index', type: 'Mutual Fund', shares: 450, price: 28.60, totalValue: 12870, costBasis: 11000, gainLoss: 17.0, allocation: 14.4 },
      { ticker: 'FSGGX', name: 'Fidelity Government Money Market', type: 'Money Market', shares: 8356, price: 1.00, totalValue: 8356, costBasis: 8356, gainLoss: 0, allocation: 9.3 },
      { ticker: 'COMPANY', name: 'Employer Stock Match', type: 'Stock', shares: 75, price: 67.00, totalValue: 4475, costBasis: 3750, gainLoss: 19.3, allocation: 5.0 }
    ]
  },
  {
    id: '529-1',
    name: '529 College Savings Plan',
    type: '529 Plan',
    totalBalance: 34200,
    allocation: { stocks: 65, bonds: 30, cash: 5 },
    healthScore: 76,
    goal: 'Education funding',
    riskTolerance: 'moderate',
    timeHorizon: '10-15 years',
    holdings: [
      { ticker: 'VTSAX', name: 'Vanguard Total Stock Market Index', type: 'Mutual Fund', shares: 150, price: 112.50, totalValue: 16875, costBasis: 15000, gainLoss: 12.5, allocation: 49.3 },
      { ticker: 'VTIAX', name: 'Vanguard Total International Stock Index', type: 'Mutual Fund', shares: 180, price: 28.60, totalValue: 5148, costBasis: 4800, gainLoss: 7.3, allocation: 15.1 },
      { ticker: 'VBTLX', name: 'Vanguard Total Bond Market Index', type: 'Mutual Fund', shares: 980, price: 10.50, totalValue: 10290, costBasis: 10500, gainLoss: -2.0, allocation: 30.1 },
      { ticker: 'CASH', name: 'Cash Reserve', type: 'Cash', shares: 1887, price: 1.00, totalValue: 1887, costBasis: 1887, gainLoss: 0, allocation: 5.5 }
    ]
  }
];

// Legacy data structure for backwards compatibility
export const accounts = [
  { name:"Individual Brokerage", type:"Taxable",       value:19020, change:214,  purpose:"Flexible investing",                         explainer:"A regular investing account. Flexible, but selling investments may create taxes." },
  { name:"Roth IRA",             type:"Retirement",    value:12180, change:-36,  purpose:"Long-term growth",                           explainer:"A retirement account funded with after-tax money. Qualified withdrawals can be tax-free." },
  { name:"Traditional 401(k)",   type:"Employer plan", value:18400, change:88,   purpose:"Retirement savings",                         explainer:"A workplace retirement account. Contributions may lower taxable income today." },
  { name:"HSA",                  type:"Health investing", value:4200, change:11, purpose:"Medical expenses and tax-advantaged growth", explainer:"A health savings account. It can cover medical costs and may also be invested." },
  { name:"Emergency Savings",    type:"Cash",          value:2520,  change:0,    purpose:"Near-term cushion",                          explainer:"Money kept stable and easy to access for surprise expenses." }
];

export const positions = [
  { symbol:"VOO",   name:"Vanguard S&P 500 ETF",             type:"ETF",          account:"Individual Brokerage", shares:31.2,  value:15600, today:0.7,  asset:"stocks", guidance:"Core holding",              explainer:"An ETF is a basket of investments that trades like a stock. This one tracks large U.S. companies." },
  { symbol:"AAPL",  name:"Apple Inc.",                       type:"Stock",        account:"Individual Brokerage", shares:18,    value:3420,  today:-0.4, asset:"stocks", guidance:"Concentrated stock",         explainer:"A stock is ownership in one company. It can grow, but one-company risk is higher than a broad fund." },
  { symbol:"VXUS",  name:"Total International Stock ETF",    type:"ETF",          account:"Roth IRA",             shares:84,    value:5460,  today:0.2,  asset:"stocks", guidance:"Global diversification",     explainer:"This spreads money across non-U.S. companies, which can reduce dependence on the U.S. market." },
  { symbol:"BND",   name:"Total Bond Market ETF",            type:"ETF",          account:"Roth IRA",             shares:92,    value:6720,  today:0.1,  asset:"bonds",  guidance:"Stability",                  explainer:"Bonds are loans to governments or companies. They usually move less than stocks." },
  { symbol:"FXAIX", name:"Fidelity 500 Index Fund",          type:"Mutual fund",  account:"Traditional 401(k)",   shares:76.4,  value:11800, today:0.6,  asset:"stocks", guidance:"Mutual fund core equity",    explainer:"A mutual fund pools investor money. This one tracks the S&P 500 and is common in retirement plans." },
  { symbol:"VBTLX", name:"Vanguard Total Bond Market Index", type:"Mutual fund",  account:"Traditional 401(k)",   shares:410,   value:6600,  today:0.1,  asset:"bonds",  guidance:"Mutual fund bond sleeve",    explainer:"A bond mutual fund adds stability by spreading money across many bonds." },
  { symbol:"FZROX", name:"Fidelity ZERO Total Market Index", type:"Mutual fund",  account:"HSA",                  shares:155,   value:3100,  today:0.5,  asset:"stocks", guidance:"HSA growth option",          explainer:"This is a broad U.S. stock mutual fund. In an HSA, it may be useful for money not needed soon." },
  { symbol:"HSA Cash", name:"Medical cash reserve",          type:"Cash",         account:"HSA",                  shares:1100,  value:1100,  today:0,    asset:"cash",   guidance:"Near-term medical cushion",  explainer:"Cash in an HSA can cover medical bills without selling investments at a bad time." },
  { symbol:"SPAXX", name:"Money Market",                     type:"Money market", account:"Emergency Savings",    shares:2520,  value:2520,  today:0,    asset:"cash",   guidance:"Cash buffer",                explainer:"A money market fund aims to stay stable while earning some yield. It is not meant for big growth." }
];

export const scenarios = [
  {
    id: 0,
    title: "Market drops 20%",
    impact: -8400,
    description: "A sudden market correction causes widespread selling across equity markets.",
    actions: [
      "Consider holding cash for near-term needs",
      "Avoid panic selling; focus on long-term goals",
      "If timeline > 5 years, keep stock exposure steady",
      "If timeline < 2 years, shift towards bonds and cash"
    ],
    avoid: "Do not sell all stocks. Historically, markets recover over time.",
    plan: { stocks: 35, bonds: 45, cash: 20 }
  },
  {
    id: 1,
    title: "Inflation stays high",
    impact: -3200,
    description: "Sustained inflation erodes purchasing power and bond values.",
    actions: [
      "Consider Treasury Inflation-Protected Securities (TIPS)",
      "Hold diversified stock funds for inflation hedge",
      "Review high-yield savings for cash cushion",
      "Avoid over-concentration in long-term bonds"
    ],
    avoid: "Do not hold all cash. Inflation reduces its purchasing power over time.",
    plan: { stocks: 50, bonds: 30, cash: 20 }
  },
  {
    id: 2,
    title: "Need to withdraw 20%",
    impact: -8400,
    description: "An unexpected expense requires a significant portfolio withdrawal.",
    actions: [
      "Withdraw from cash and money market first",
      "Sell bonds before stocks if possible",
      "Consider tax implications in taxable accounts",
      "Avoid selling stocks during a downturn if possible"
    ],
    avoid: "Do not liquidate retirement accounts early. Penalties can be steep.",
    plan: { stocks: 40, bonds: 35, cash: 25 }
  },
  {
    id: 3,
    title: "Global instability rises",
    impact: -5600,
    description: "Geopolitical tensions create market volatility and uncertainty.",
    actions: [
      "Diversify across regions and asset classes",
      "Hold defensive stocks (utilities, consumer staples)",
      "Increase bond allocation for stability",
      "Keep 3-6 months emergency cash"
    ],
    avoid: "Do not try to time the market. Stay diversified and patient.",
    plan: { stocks: 45, bonds: 40, cash: 15 }
  }
];

export const events = [
  {
    id: 0,
    continent: "North America",
    region: "United States",
    event: "Federal Reserve rate uncertainty",
    risk: "Medium",
    color: "yellow",
    lat: 40,
    lon: -100,
    stats: {
      marketImpact: "Moderate volatility expected",
      timeframe: "Next 6-12 months",
      assetClass: "Bonds and growth stocks most affected"
    },
    affected: ["BND", "VBTLX", "FXAIX", "VOO"],
    portfolioImpact: -2.8,
    suggestedAction: "Consider adding short-term bonds or defensive stocks.",
    sources: [
      { title: "Reuters: Fed official says rate-cut bias no longer appropriate", url: "https://www.investing.com/news/economy-news/feds-hammack-says-no-longer-appropriate-to-signal-rate-cut-bias-4652964" },
      { title: "Reuters: Markets' 2026 watch list includes Fed succession and political risk", url: "https://www.investing.com/news/economy-news/markets-2026-watch-list-fed-succession-political-risk-and-ai-of-course-4431268" }
    ]
  },
  {
    id: 1,
    continent: "Europe",
    region: "Eurozone",
    event: "Energy supply concerns persist",
    risk: "High",
    color: "orange",
    lat: 50,
    lon: 10,
    stats: {
      marketImpact: "Significant economic headwinds",
      timeframe: "Ongoing through winter",
      assetClass: "European equities and bonds"
    },
    affected: ["VXUS"],
    portfolioImpact: -4.2,
    suggestedAction: "Reduce European equity exposure. Consider U.S. or diversified global funds.",
    sources: [
      { title: "OECD: Energy prices are spiking again", url: "https://www.oecd.org/en/publications/energy-prices-are-spiking-again_a68e5c37-en/full-report.html" },
      { title: "Reuters: EU chief warns Europe is reliant on volatile energy imports", url: "https://www.investing.com/news/commodities-news/reducing-nuclear-energy-a-strategic-mistake-eu-chief-says-4552159" }
    ]
  },
  {
    id: 2,
    continent: "Asia",
    region: "China",
    event: "Economic slowdown and regulatory changes",
    risk: "High",
    color: "red",
    lat: 35,
    lon: 105,
    stats: {
      marketImpact: "Major slowdown in growth",
      timeframe: "Next 12-18 months",
      assetClass: "Emerging market stocks"
    },
    affected: ["VXUS"],
    portfolioImpact: -5.5,
    suggestedAction: "Reduce emerging market exposure. Focus on developed markets.",
    sources: [
      { title: "Reuters: China's growth set to slow to 4.5% in 2026", url: "https://www.investing.com/news/economy-news/chinas-growth-set-to-slow-to-45-in-2026-raising-pressure-on-policymakers-reuters-poll-4448773" },
      { title: "Reuters: China economy outlook jolted by energy costs", url: "https://www.investing.com/news/economy-news/chinas-economy-poised-for-q1-rebound-but-iran-war-jolts-2026-outlook-4616911" }
    ]
  },
  {
    id: 3,
    continent: "South America",
    region: "Brazil/Argentina",
    event: "Currency devaluation and political instability",
    risk: "High",
    color: "orange",
    lat: -15,
    lon: -60,
    stats: {
      marketImpact: "Severe currency and bond stress",
      timeframe: "Current and ongoing",
      assetClass: "Emerging market bonds and stocks"
    },
    affected: ["VXUS"],
    portfolioImpact: -3.1,
    suggestedAction: "Avoid direct exposure. Stick to broad diversified funds.",
    sources: [
      { title: "Reuters: Brazil economy faces external risks and election uncertainty", url: "https://br.investing.com/news/economic-indicators/economia-do-brasil-deve-desacelerar-em-2026-em-meio-a-riscos-externos-e-eleicoes-preveem-economistas-1855131" },
      { title: "Reuters: Argentina reaches IMF staff deal", url: "https://www.investing.com/news/economy-news/imf-reaches-agreement-with-argentina-to-unlock-1-billion-in-fresh-funds-4616054" }
    ]
  },
  {
    id: 4,
    continent: "Africa",
    region: "North Africa",
    event: "Food security and supply chain issues",
    risk: "Medium",
    color: "yellow",
    lat: 25,
    lon: 20,
    stats: {
      marketImpact: "Moderate regional instability",
      timeframe: "Next 6-12 months",
      assetClass: "Commodities and emerging markets"
    },
    affected: [],
    portfolioImpact: -1.5,
    suggestedAction: "Minimal direct impact. Monitor commodity prices.",
    sources: [
      { title: "FAO: Hormuz disruption creates food security risks", url: "https://www.fao.org/newsroom/detail/fao-chief-economist-warns-of-severe-global-food-security-risks-from-disruption-to-strait-of-hormuz-trade-corridor/en" },
      { title: "World Bank: Energy shock may worsen food insecurity", url: "https://www.worldbank.org/en/news/press-release/2026/04/28/commodity-markets-outlook-april-2026-press-release" }
    ]
  },
  {
    id: 5,
    continent: "Australia",
    region: "Pacific",
    event: "Stable growth with resource sector strength",
    risk: "Low",
    color: "blue",
    lat: -25,
    lon: 135,
    stats: {
      marketImpact: "Positive outlook for commodities",
      timeframe: "Next 12 months",
      assetClass: "Resources and materials"
    },
    affected: [],
    portfolioImpact: +1.8,
    suggestedAction: "Opportunity for diversified exposure through global funds.",
    sources: [
      { title: "Reuters: Australian lithium demand supported by energy security", url: "https://www.investing.com/news/stock-market-news/australian-lithium-miner-pls-says-energy-security-concerns-driving-demand-growth-4637292" },
      { title: "World Bank: Metals demand tied to data centers, EVs and renewables", url: "https://www.worldbank.org/en/news/press-release/2026/04/28/commodity-markets-outlook-april-2026-press-release" }
    ]
  }
];

export const tools = [
  { name:"HSA",              use:"Triple-tax-advantaged medical investing", fit:"Keep a cash cushion for near-term care, invest the rest if expenses are low.", plain:"Best thought of as a medical account first and an investment account second." },
  { name:"Roth IRA",         use:"Tax-free retirement growth",              fit:"Good home for diversified stock funds if timeline is long.",                  plain:"Useful when you can leave the money alone for many years." },
  { name:"Traditional 401(k)", use:"Employer retirement plan",              fit:"Use low-cost mutual funds and check employer match first.",                   plain:"Often the first place to invest if your employer matches contributions." },
  { name:"529 Plan",         use:"Education savings",                       fit:"Useful if a future school goal is more important than near-term liquidity.",  plain:"Designed for education costs, not general spending." },
  { name:"Mutual Funds",     use:"Dollar-based investing",                  fit:"Good for automated investing and retirement accounts.",                       plain:"A fund company manages a basket of investments. Trades usually happen after market close." },
  { name:"ETFs",             use:"Flexible intraday funds",                 fit:"Good for taxable brokerage and broad diversification.",                       plain:"A fund that trades during the day like a stock." }
];

export const watchlist = [
  { symbol:"BND",   name:"Total Bond Market ETF",        price:73.04,  change:0.1,  note:"Could help lower portfolio swings." },
  { symbol:"VT",    name:"Total World Stock ETF",        price:121.88, change:0.4,  note:"Broad global stock exposure in one fund." },
  { symbol:"SGOV",  name:"0-3 Month Treasury ETF",       price:100.42, change:0.02, note:"Useful for short-term cash-like stability." },
  { symbol:"FXAIX", name:"Fidelity 500 Index Fund",      price:197.2,  change:0.6,  note:"Low-cost S&P 500 mutual fund." },
  { symbol:"VTSAX", name:"Vanguard Total Stock Market Index", price:132.4, change:0.5, note:"Broad U.S. mutual fund exposure." }
];

export const gameQuestions = [
  // Difficulty 1 - Basic concepts
  { difficulty:1, question:"Your coffee shop has $1,000. A supplier offers bulk beans at a discount but wants payment upfront. What's the main risk?", answers:["Tying up cash you might need", "Beans going stale", "Supplier going out of business", "Paying too much"], correct:0, lesson:"Liquidity matters. Having cash available is like having an emergency fund in your personal portfolio." },
  { difficulty:1, question:"Sales are steady at $500/day. Do you open on Sundays (costs $200, revenue unknown) or save the money?", answers:["Open Sunday - more revenue", "Save money - avoid risk", "Open half-day Sunday", "Hire part-time help"], correct:1, lesson:"Don't take unnecessary risks. In investing, avoid chasing uncertain returns when you're comfortable." },
  { difficulty:1, question:"You can buy a new espresso machine for $2,000 or keep using the old one. What should you consider first?", answers:["Will it bring in more customers?", "Does it look cool?", "Is it the newest model?", "What competitors have"], correct:0, lesson:"Invest with purpose. Every investment should have a clear expected benefit - in business and personal finance." },
  { difficulty:1, question:"A food critic is coming next week. Do you spend $300 on premium ingredients or stick to your usual quality?", answers:["Spend $300 - it's worth it", "Stick to usual - stay consistent", "Spend $150 - middle ground", "Close that day"], correct:0, lesson:"Strategic opportunities matter. Sometimes a calculated investment can have outsize returns." },
  { difficulty:1, question:"Your pastry chef wants a raise from $15/hr to $18/hr. She's great but you're on a tight budget. What do you do?", answers:["Give the raise - keep talent", "Decline - protect profit", "Offer $16.50 compromise", "Replace her"], correct:2, lesson:"Balance is key. In investing, you balance risk and return. Here, you balance cost and value." },
  
  // Difficulty 2 - Risk and diversification
  { difficulty:2, question:"A corporate client offers a $5,000 monthly contract but wants exclusive morning hours. Your morning rush is $4,000/month. Do you take it?", answers:["Yes - guaranteed money", "No - keep flexibility", "Negotiate a trial period", "Raise prices for others"], correct:2, lesson:"Don't put all eggs in one basket. Diversification protects you if one income source fails." },
  { difficulty:2, question:"You have $3,000 saved. Do you expand seating, upgrade equipment, or keep it as cash reserve?", answers:["Expand seating", "Upgrade equipment", "Keep as cash reserve", "Do half seating, half reserve"], correct:3, lesson:"Balanced allocation. In investing, you split between growth (stocks), stability (bonds), and safety (cash)." },
  { difficulty:2, question:"A competitor opens nearby. Do you lower prices, improve quality, or advertise more?", answers:["Lower prices", "Improve quality", "Advertise more", "Do nothing"], correct:1, lesson:"Quality over quick fixes. In investing, focus on fundamentals, not panic moves." },
  { difficulty:2, question:"Winter is slow. Do you cut staff, reduce hours, or push through at a loss?", answers:["Cut staff", "Reduce hours", "Push through", "All of the above partially"], correct:3, lesson:"Adapt to conditions. Rebalance your portfolio when market conditions change your risk profile." },
  { difficulty:2, question:"You can get a $10,000 loan at 6% interest. Your profit margin is 8%. Should you take it?", answers:["Yes - profit margin covers it", "No - debt is risky", "Take half", "Negotiate lower rate"], correct:3, lesson:"Minimize costs. In investing, fees and expenses eat into returns. Every percentage point matters." },
  
  // Difficulty 3 - Advanced strategy
  { difficulty:3, question:"You have 3 locations. One is breaking even, one is profitable, one is losing money. What do you do?", answers:["Close the losing one", "Double down on profitable", "Invest in breaking even", "Rebalance resources across all"], correct:3, lesson:"Rebalancing works. Shift resources from overperformers to underperformers to optimize the whole portfolio." },
  { difficulty:3, question:"A private investor offers $50,000 for 25% ownership. You're profitable but growth is slow. Do you take it?", answers:["Yes - fuel growth", "No - keep control", "Negotiate better terms", "Take less money for less equity"], correct:2, lesson:"Understand the cost of capital. Giving up equity is like paying fees - know what you're getting for it." },
  { difficulty:3, question:"Economic recession hits. Do you cut costs, maintain service, or invest in marketing?", answers:["Cut costs", "Maintain service", "Invest in marketing", "Cut some, invest some"], correct:3, lesson:"Downturns are complex. In investing, don't panic sell, but do rebalance toward safety if your timeline is short." },
  { difficulty:3, question:"You're at max capacity. Do you raise prices, expand locations, or stay as-is?", answers:["Raise prices", "Expand locations", "Stay as-is", "Raise prices first, then expand"], correct:3, lesson:"Scale carefully. In investing, don't chase growth blindly. Increase exposure to winners, but manage risk." },
  { difficulty:3, question:"Your lease is up. Rent doubles or you move to a cheaper area with less foot traffic. What do you do?", answers:["Pay double", "Move to cheaper area", "Negotiate with landlord", "Close and start over"], correct:2, lesson:"Negotiate and adapt. In investing, don't accept high fees. Shop around and optimize your costs." },
  
  // Difficulty 4 - Expert concepts
  { difficulty:4, question:"You can franchise your brand or grow organically. Franchise offers fast growth but less control. What do you do?", answers:["Franchise - scale fast", "Grow organically - keep control", "Hybrid model", "Stay single location"], correct:2, lesson:"Diversify strategies. In investing, blend passive index funds (franchising) with active picks (organic growth)." },
  { difficulty:4, question:"Food costs spike 30%. Do you raise prices immediately, shrink portions, or absorb the cost short-term?", answers:["Raise prices", "Shrink portions", "Absorb cost", "Combination approach"], correct:3, lesson:"Inflation hedging. When costs rise, adjust your portfolio—maybe more stocks, fewer bonds. Be strategic, not reactive." },
  { difficulty:4, question:"A large chain wants to buy you out for 5x annual profit. You love the business. Do you sell?", answers:["Sell - great return", "Keep - it's your passion", "Negotiate higher", "Sell partial stake"], correct:3, lesson:"Know when to take profit. Rebalancing means selling winners sometimes. Emotion shouldn't override smart strategy." },
  { difficulty:4, question:"You have loyal customers but growth has stalled. Do you rebrand, expand menu, or open new markets?", answers:["Rebrand", "Expand menu", "Open new markets", "Test all on small scale"], correct:3, lesson:"Experiment before scaling. In investing, dollar-cost average into new positions rather than going all-in." },
  { difficulty:4, question:"Regulations require $15,000 in upgrades. You have $20,000 saved. Do you spend it all, finance some, or delay compliance?", answers:["Spend it all", "Finance some", "Delay compliance", "Finance all, keep savings"], correct:3, lesson:"Preserve liquidity. Keep your emergency fund intact. Finance when rates are low and keep cash for surprises." },
  
  // Difficulty 5 - Master level
  { difficulty:5, question:"Your brand is strong but profit margins are thin. Do you cut costs, raise prices, or diversify revenue streams?", answers:["Cut costs", "Raise prices", "Diversify revenue", "Optimize all three"], correct:3, lesson:"Holistic optimization. Great investors optimize returns, minimize costs, and diversify—all at once." },
  { difficulty:5, question:"A recession looms. Do you stockpile cash, lock in supplier contracts, or invest in customer loyalty programs?", answers:["Stockpile cash", "Lock in contracts", "Invest in loyalty", "Balance all three"], correct:3, lesson:"Recession planning. Increase cash (safety), secure costs (bonds), and invest in quality (blue-chip stocks)." },
  { difficulty:5, question:"You're profitable but a new tech disrupts the industry. Do you adopt it, ignore it, or pivot your model?", answers:["Adopt it", "Ignore it", "Pivot model", "Adopt and pivot"], correct:3, lesson:"Adapt to disruption. In investing, sectors change. Rebalance away from declining industries toward growth." },
  { difficulty:5, question:"You can open in a tourist area (seasonal, high-risk) or suburbs (steady, lower margin). Which do you choose?", answers:["Tourist area", "Suburbs", "Both", "Test tourist, fallback suburbs"], correct:3, lesson:"Risk-adjusted returns. High-risk investments need testing. Diversify across risk levels for stability." },
  { difficulty:5, question:"You've maxed out growth locally. Do you franchise nationally, go international, or sell the business?", answers:["Franchise nationally", "Go international", "Sell business", "Franchise nationally, test international"], correct:3, lesson:"Global diversification. Expand internationally to reduce dependence on one market. But test before going all-in." },
  
  // Difficulty 6-7 - Legendary
  { difficulty:6, question:"A pandemic hits. Revenue drops 80%. Do you close temporarily, pivot to delivery, or downsize permanently?", answers:["Close temporarily", "Pivot to delivery", "Downsize permanently", "Pivot and downsize"], correct:3, lesson:"Crisis adaptation. In investing, major shocks require rebalancing. Cut losses, pivot to safety, but stay invested." },
  { difficulty:6, question:"You have $100k saved. Invest in real estate, expand to 10 locations, or keep liquid for opportunities?", answers:["Real estate", "Expand to 10 locations", "Keep liquid", "Diversify across all"], correct:3, lesson:"Ultimate diversification. Spread across asset classes: real estate, equities (expansion), and cash (opportunities)." },
  { difficulty:7, question:"A food trend (like oat milk) explodes. Do you go all-in, test cautiously, or ignore it?", answers:["Go all-in", "Test cautiously", "Ignore it", "Test, then scale"], correct:3, lesson:"Trend investing. Don't FOMO into hype. Test small, scale if proven. Avoid overconcentration." }
];
