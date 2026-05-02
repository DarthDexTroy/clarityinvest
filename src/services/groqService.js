async function fetchGroqCompletion({ messages, model = 'llama-3.3-70b-versatile', temperature, max_tokens, response_format }) {
  const response = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, temperature, max_tokens, response_format })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Groq request failed');
  }

  const data = await response.json();
  return data.content;
}

export async function getPortfolioRecommendation({ allocation, target, holdings, riskProfile, scenario }) {
  const total = holdings.stocks + holdings.bonds + holdings.cash;
  
  const prompt = `You are a friendly financial advisor helping a beginner investor. 

Current situation:
- Portfolio value: $${total.toLocaleString()}
- Current allocation: ${allocation.stocks}% stocks, ${allocation.bonds}% bonds, ${allocation.cash}% cash
- Target allocation: ${target.stocks}% stocks, ${target.bonds}% bonds, ${target.cash}% cash
- Risk profile: ${riskProfile}
${scenario ? `- Scenario concern: ${scenario.title}` : ''}

Provide a brief, encouraging recommendation (2-3 sentences max) on what they should do next. Use simple language, no jargon. Be specific about whether they should rebalance and why.`;

  try {
    const content = await fetchGroqCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 200
    });

    return content || 'Consider rebalancing to match your target allocation.';
  } catch (error) {
    console.error('Groq API error:', error);
    return 'Consider rebalancing your portfolio to match your target allocation. This helps manage risk based on your goals.';
  }
}

export async function getScenarioInsight({ scenario, allocation, riskProfile }) {
  const prompt = `You are a financial advisor. A ${riskProfile} investor is worried about: "${scenario.title}" - ${scenario.description}

Their current allocation: ${allocation.stocks}% stocks, ${allocation.bonds}% bonds, ${allocation.cash}% cash.

Give ONE specific, actionable tip (1 sentence) to help them feel more confident.`;

  try {
    const content = await fetchGroqCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 100
    });

    return content || scenario.actions[0];
  } catch (error) {
    console.error('Groq API error:', error);
    return scenario.actions[0];
  }
}

export async function getEventRecommendation({ event, allocation, affectedPositions }) {
  const prompt = `A ${event.risk} risk event is occurring: "${event.event}" in ${event.region}.

Current allocation: ${allocation.stocks}% stocks, ${allocation.bonds}% bonds, ${allocation.cash}% cash
Affected holdings: ${affectedPositions.join(', ') || 'None directly'}

Give a calm, specific action (1 sentence) a beginner investor should consider.`;

  try {
    const content = await fetchGroqCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 100
    });

    return content || event.suggestedAction;
  } catch (error) {
    console.error('Groq API error:', error);
    return event.suggestedAction;
  }
}

function getDirectGameFallback({ question, answers, accountType, userQuestion }) {
  const correctAnswer = answers[question.correct];
  const asksForAnswer = /answer|which one|correct|pick|choose/i.test(userQuestion);

  if (asksForAnswer) {
    return `The answer is "${correctAnswer}." ${question.lesson}`;
  }

  return `For this ${accountType} question, focus on "${correctAnswer}." ${question.lesson}`;
}

export async function getGameQuestionHelp({ question, answers, accountType, userQuestion }) {
  const correctAnswer = answers[question.correct];
  const answerChoices = answers.map((answer, index) => `${index + 1}. ${answer}`).join('\n');
  const asksForAnswer = /answer|which one|correct|pick|choose/i.test(userQuestion);
  const responseMode = asksForAnswer
    ? 'The player is asking for the answer. Start with: The answer is "[correct answer]". Then explain why in 1-2 plain sentences.'
    : 'The player is asking for help. Do not repeat generic finance definitions. Explain the exact clue in this question and how to eliminate one tempting wrong choice.';

  const prompt = `You are a concise investing tutor inside a beginner finance game.

Account topic: ${accountType}
Current quiz question: ${question.question}
Answer choices:
${answerChoices}
Correct answer: ${correctAnswer}
Lesson the game is teaching: ${question.lesson}
Player asks: ${userQuestion}

${responseMode}
Keep the answer specific to this question. Use 2-3 short sentences.`;

  try {
    const content = await fetchGroqCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 180
    });

    return content || getDirectGameFallback({ question, answers, accountType, userQuestion });
  } catch (error) {
    console.error('Groq API error:', error);
    return getDirectGameFallback({ question, answers, accountType, userQuestion });
  }
}

function getCustomScenarioFallback({ account, prompt }) {
  const text = prompt.toLowerCase();
  const concern = /soon|next year|tuition|medical|rent|house|cash|emergency|withdraw/.test(text)
    ? 'soon'
    : /growth|retire|long term|long-term|maximize|aggressive|wealth/.test(text)
      ? 'growth'
      : 'loss';

  const current = account?.allocation || { stocks: 60, bonds: 30, cash: 10 };
  const after = concern === 'soon'
    ? { stocks: Math.max(25, current.stocks - 15), bonds: Math.min(45, current.bonds + 10), cash: Math.min(30, current.cash + 5) }
    : concern === 'growth'
      ? { stocks: Math.min(90, current.stocks + 10), bonds: Math.max(5, current.bonds - 5), cash: Math.max(5, current.cash - 5) }
      : { stocks: Math.max(45, current.stocks - 10), bonds: Math.min(40, current.bonds + 8), cash: Math.min(20, current.cash + 2) };
  const planByConcern = {
    soon: {
      after: { stocks: Math.max(20, current.stocks - 20), bonds: Math.min(55, current.bonds + 12), cash: Math.min(35, current.cash + 8) },
      rationale: 'Because this money may be needed soon, this version prioritizes cash and bonds so the account is less dependent on stock prices near the deadline.'
    },
    loss: {
      after: { stocks: Math.max(35, current.stocks - 12), bonds: Math.min(45, current.bonds + 8), cash: Math.min(25, current.cash + 4) },
      rationale: 'Because losses feel stressful, this version lowers stock risk while keeping the account invested enough to recover.'
    },
    growth: {
      after: { stocks: Math.min(80, current.stocks + 8), bonds: Math.max(10, current.bonds - 5), cash: Math.max(8, current.cash - 3) },
      rationale: 'Because long-term growth still matters, this version keeps more in stocks while preserving a safety sleeve for the life event.'
    }
  };
  Object.values(planByConcern).forEach((plan) => {
    const total = plan.after.stocks + plan.after.bonds + plan.after.cash;
    if (total !== 100) plan.after.cash += 100 - total;
  });

  return {
    title: concern === 'soon' ? 'Protect money needed soon' : concern === 'growth' ? 'Keep growth on track' : 'Lower panic risk',
    description: prompt,
    impact: concern === 'soon' ? 'More cash flexibility' : concern === 'growth' ? 'More long-term growth exposure' : 'Lower panic risk',
    concern,
    after,
    planRationale: concern === 'soon'
      ? 'Because this money may be needed soon, the plan shifts more of the account into cash and bonds before the tuition bill or expense arrives.'
      : concern === 'growth'
        ? 'Because long-term growth is the priority, the plan keeps more money invested while preserving a small safety cushion.'
        : 'Because losses feel stressful, the plan lowers risk without moving the whole account to cash.',
    planByConcern,
    implicationByConcern: {
      soon: {
        headline: 'If you may need this money soon',
        emotionalCue: 'The key risk is needing cash right when the market is down.',
        concernLens: 'Because this money may be needed soon, the plan focuses on avoiding forced selling.',
        panicPath: { label: 'Pressure path', headline: 'Wait until the bill arrives', result: 'Waiting can force you to sell investments at a bad time.' },
        calmPath: { label: 'Prepared path', headline: 'Build the cash runway now', result: 'Moving some money into cash and bonds gives you a clearer first place to pull from.' },
        ifIgnored: 'You may have to sell stocks during a downturn to pay the bill.',
        ifActed: 'You can pay from the safer part of the account first and keep long-term money invested.',
        everydayImpact: 'The goal is turning a surprise expense into a planned withdrawal.',
        timeline: [
          { when: 'Today', text: 'Separate near-term spending money from long-term investing money.' },
          { when: 'Before the deadline', text: 'Use cash and bonds first instead of selling stocks under pressure.' },
          { when: 'Afterward', text: 'Keep the long-term part invested for future growth.' }
        ],
        confidence: [
          { label: 'Forced-selling risk', before: 74, after: 32 },
          { label: 'Cash readiness', before: 45, after: 86 },
          { label: 'Plan clarity', before: 52, after: 84 }
        ],
        whyNotSell: 'Selling everything may solve the near-term problem, but it can overprotect money that still has time to grow.'
      },
      loss: {
        headline: 'If losing money is what worries you',
        emotionalCue: 'The risk is making a permanent decision because a temporary loss feels scary.',
        concernLens: 'Because losses feel stressful, the plan lowers risk while keeping the account connected to its goal.',
        panicPath: { label: 'Fear path', headline: 'Let fear choose the trade', result: 'Selling because of fear can lock in losses and make it hard to recover.' },
        calmPath: { label: 'Calm path', headline: 'Lower risk with a plan', result: 'A smaller stock position can reduce stress without abandoning growth.' },
        ifIgnored: 'You may keep an allocation that feels too risky and be more likely to panic later.',
        ifActed: 'You get a calmer mix that is easier to hold through market swings.',
        everydayImpact: 'The goal is reducing the chance that fear controls the trade.',
        timeline: [
          { when: 'Today', text: 'Name the risk before reacting to it.' },
          { when: 'Next downturn', text: 'The calmer mix should feel easier to hold.' },
          { when: 'Longer term', text: 'You still keep some growth potential.' }
        ],
        confidence: [
          { label: 'Panic risk', before: 76, after: 34 },
          { label: 'Emotional control', before: 48, after: 83 },
          { label: 'Goal alignment', before: 56, after: 80 }
        ],
        whyNotSell: 'Selling everything can feel safe today, but it can leave you out of the market when recovery starts.'
      },
      growth: {
        headline: 'If long-term growth matters most',
        emotionalCue: 'The risk is becoming so defensive that the account falls behind the future goal.',
        concernLens: 'Because growth still matters, the plan keeps part of the account invested.',
        panicPath: { label: 'Stall path', headline: 'Hide in cash too long', result: 'Too much cash can make it harder for the account to grow over time.' },
        calmPath: { label: 'Growth path', headline: 'Stay invested with guardrails', result: 'Keeping stocks in the mix gives the account room to recover and compound.' },
        ifIgnored: 'The account may depend mostly on new contributions instead of compounding.',
        ifActed: 'You keep meaningful growth exposure while still preparing for the life event.',
        everydayImpact: 'The goal is balancing the upcoming need with the future you still want.',
        timeline: [
          { when: 'Today', text: 'Protect the money needed soon without moving every dollar to cash.' },
          { when: 'Next year', text: 'Use the safer sleeve for the expense if needed.' },
          { when: 'Longer term', text: 'Let the remaining invested portion keep working.' }
        ],
        confidence: [
          { label: 'Growth participation', before: 52, after: 78 },
          { label: 'Over-caution risk', before: 68, after: 38 },
          { label: 'Long-term alignment', before: 58, after: 84 }
        ],
        whyNotSell: 'Selling everything removes downside, but it also removes the growth engine for money that does not need to be spent soon.'
      }
    },
    insights: [
      concern === 'soon' ? 'Separate near-term spending money from long-term investing money.' : concern === 'growth' ? 'Keep enough stock exposure for compounding to matter.' : 'Reduce risk without abandoning the whole plan.',
      'Use the review page to see the simulated trade impact before executing.',
      'This is educational guidance, not personalized financial advice.'
    ]
  };
}

export async function getCustomWhatIfScenario({ account, prompt }) {
  const fallback = getCustomScenarioFallback({ account, prompt });
  const current = account?.allocation || { stocks: 60, bonds: 30, cash: 10 };

  const systemPrompt = `Create a beginner-friendly custom what-if scenario for an investing prototype.
Return valid JSON only with this exact shape:
{
  "title": "short title",
  "description": "one sentence",
  "impact": "short plain-language impact",
  "concern": "soon|loss|growth",
  "after": { "stocks": number, "bonds": number, "cash": number },
  "planRationale": "one sentence explaining why this allocation fits the user's situation",
  "planByConcern": {
    "soon": { "after": { "stocks": number, "bonds": number, "cash": number }, "rationale": "one sentence" },
    "loss": { "after": { "stocks": number, "bonds": number, "cash": number }, "rationale": "one sentence" },
    "growth": { "after": { "stocks": number, "bonds": number, "cash": number }, "rationale": "one sentence" }
  },
  "implicationByConcern": {
    "soon": {
      "headline": "plain headline",
      "emotionalCue": "one sentence",
      "concernLens": "one sentence",
      "panicPath": { "label": "short label", "headline": "short headline", "result": "one sentence" },
      "calmPath": { "label": "short label", "headline": "short headline", "result": "one sentence" },
      "ifIgnored": "one sentence",
      "ifActed": "one sentence",
      "everydayImpact": "one sentence",
      "timeline": [{ "when": "Today", "text": "one sentence" }, { "when": "Before the event", "text": "one sentence" }, { "when": "Later", "text": "one sentence" }],
      "confidence": [{ "label": "metric", "before": number, "after": number }, { "label": "metric", "before": number, "after": number }, { "label": "metric", "before": number, "after": number }],
      "whyNotSell": "one sentence"
    },
    "loss": {
      "headline": "plain headline",
      "emotionalCue": "one sentence",
      "concernLens": "one sentence",
      "panicPath": { "label": "short label", "headline": "short headline", "result": "one sentence" },
      "calmPath": { "label": "short label", "headline": "short headline", "result": "one sentence" },
      "ifIgnored": "one sentence",
      "ifActed": "one sentence",
      "everydayImpact": "one sentence",
      "timeline": [{ "when": "Today", "text": "one sentence" }, { "when": "Before the event", "text": "one sentence" }, { "when": "Later", "text": "one sentence" }],
      "confidence": [{ "label": "metric", "before": number, "after": number }, { "label": "metric", "before": number, "after": number }, { "label": "metric", "before": number, "after": number }],
      "whyNotSell": "one sentence"
    },
    "growth": {
      "headline": "plain headline",
      "emotionalCue": "one sentence",
      "concernLens": "one sentence",
      "panicPath": { "label": "short label", "headline": "short headline", "result": "one sentence" },
      "calmPath": { "label": "short label", "headline": "short headline", "result": "one sentence" },
      "ifIgnored": "one sentence",
      "ifActed": "one sentence",
      "everydayImpact": "one sentence",
      "timeline": [{ "when": "Today", "text": "one sentence" }, { "when": "Before the event", "text": "one sentence" }, { "when": "Later", "text": "one sentence" }],
      "confidence": [{ "label": "metric", "before": number, "after": number }, { "label": "metric", "before": number, "after": number }, { "label": "metric", "before": number, "after": number }],
      "whyNotSell": "one sentence"
    }
  },
  "insights": ["plain sentence", "plain sentence", "plain sentence"]
}
Rules:
- Use plain language.
- after.stocks + after.bonds + after.cash must equal 100.
- If the user needs money soon, raise bonds/cash.
- If the user wants growth, keep more stocks.
- If the user is scared, reduce risk without going all cash.
- planByConcern.soon, planByConcern.loss, and planByConcern.growth must each add to 100 and should be meaningfully different.`;

  try {
    const content = await fetchGroqCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Account: ${account?.type || 'Investment account'}
Goal: ${account?.goal || 'Grow wealth'}
Current allocation: ${current.stocks}% stocks, ${current.bonds}% bonds, ${current.cash}% cash
User situation: ${prompt}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.35,
      max_tokens: 1400,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(content || '{}');
    const after = parsed.after || fallback.after;
    const total = Number(after.stocks || 0) + Number(after.bonds || 0) + Number(after.cash || 0);
    if (!parsed.title || !parsed.description || total <= 0) return fallback;
    const normalizedAfter = {
      stocks: Math.round((Number(after.stocks || 0) / total) * 100),
      bonds: Math.round((Number(after.bonds || 0) / total) * 100),
      cash: 0
    };
    normalizedAfter.cash = Math.max(0, 100 - normalizedAfter.stocks - normalizedAfter.bonds);
    const normalizeConcernPlans = (planByConcern) => {
      const source = planByConcern || fallback.planByConcern;
      return ['soon', 'loss', 'growth'].reduce((acc, key) => {
        const plan = source?.[key] || fallback.planByConcern[key];
        const planAfter = plan.after || fallback.planByConcern[key].after;
        const planTotal = Number(planAfter.stocks || 0) + Number(planAfter.bonds || 0) + Number(planAfter.cash || 0);
        if (planTotal <= 0) {
          acc[key] = fallback.planByConcern[key];
          return acc;
        }
        const stocks = Math.round((Number(planAfter.stocks || 0) / planTotal) * 100);
        const bonds = Math.round((Number(planAfter.bonds || 0) / planTotal) * 100);
        acc[key] = {
          after: {
            stocks,
            bonds,
            cash: Math.max(0, 100 - stocks - bonds)
          },
          rationale: plan.rationale || fallback.planByConcern[key].rationale
        };
        return acc;
      }, {});
    };

    return {
      ...fallback,
      ...parsed,
      concern: ['soon', 'loss', 'growth'].includes(parsed.concern) ? parsed.concern : fallback.concern,
      after: normalizedAfter,
      planRationale: parsed.planRationale || fallback.planRationale,
      planByConcern: normalizeConcernPlans(parsed.planByConcern),
      implicationByConcern: parsed.implicationByConcern || fallback.implicationByConcern,
      insights: Array.isArray(parsed.insights) && parsed.insights.length ? parsed.insights.slice(0, 3) : fallback.insights
    };
  } catch (error) {
    console.error('Groq custom scenario error:', error);
    return fallback;
  }
}
