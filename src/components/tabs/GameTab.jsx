import { useEffect, useRef, useState } from 'react';
import { useApp } from '../../store/useAppStore';
import { gameQuestions } from '../../data/appData';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import toast from 'react-hot-toast';
import { getGameQuestionHelp } from '../../services/groqService';
import './GameTab.css';

const accountQuestionBanks = {
  Brokerage: [
    { difficulty:1, question:"Your taxable brokerage account has Apple, Microsoft, VTI, VFIAX, BND, and cash. You need money in 18 months. What should you review first?", answers:["Whether enough is in cash/bonds", "Which stock is most exciting", "Only today's gain/loss", "The company logos"], correct:0, lesson:"A brokerage account is flexible, but money needed soon should not depend only on stocks." },
    { difficulty:2, question:"You want to sell a winning stock in a brokerage account. What real-world issue should you check?", answers:["Capital gains taxes", "Roth contribution limit", "College FAFSA deadline", "HSA receipt rules"], correct:0, lesson:"Taxable accounts can create taxes when you sell investments for a gain." },
    { difficulty:3, question:"Your brokerage is 85% stocks and the market feels scary. What is the calm move?", answers:["Sell everything today", "Review timeline and rebalance gradually", "Buy only one hot stock", "Ignore taxes completely"], correct:1, lesson:"A calm rebalance protects goals without turning fear into permanent losses." }
  ],
  'Roth IRA': [
    { difficulty:1, question:"A Roth IRA is usually best for what kind of goal?", answers:["Long-term tax-free growth", "Paying rent next month", "Daily spending", "Business payroll"], correct:0, lesson:"Roth IRA money can grow tax-free for retirement if rules are followed." },
    { difficulty:2, question:"If retirement is decades away, what allocation often makes sense in a Roth IRA?", answers:["Mostly growth investments", "All cash forever", "Only short-term bonds", "No investments"], correct:0, lesson:"Long timelines can handle more stock exposure because there is more time to recover." },
    { difficulty:3, question:"Why might selling inside a Roth IRA not create an immediate tax bill?", answers:["It is a tax-advantaged account", "Taxes never exist anywhere", "Stocks are always tax-free", "Brokerages ignore IRS rules"], correct:0, lesson:"Rebalancing inside tax-advantaged accounts usually does not trigger immediate capital gains taxes." }
  ],
  HSA: [
    { difficulty:1, question:"What makes an HSA special if used for qualified medical expenses?", answers:["Triple tax advantage", "Guaranteed stock returns", "No contribution rules", "It replaces insurance"], correct:0, lesson:"HSAs can offer pre-tax contributions, tax-free growth, and tax-free medical withdrawals." },
    { difficulty:2, question:"You may need medical cash this year. What should your HSA consider?", answers:["Keep a cash cushion", "Invest every dollar aggressively", "Withdraw retirement funds first", "Ignore medical costs"], correct:0, lesson:"Medical money needed soon should be stable enough to use without selling at a bad time." },
    { difficulty:3, question:"If you can pay medical bills out-of-pocket, what HSA strategy can help long-term?", answers:["Invest some HSA balance", "Close the HSA", "Use it only for coffee", "Avoid receipts"], correct:0, lesson:"Investing unused HSA money can turn it into a powerful long-term health and retirement tool." }
  ],
  'Traditional 401(k)': [
    { difficulty:1, question:"Your employer offers a match. What should you usually try to do first?", answers:["Contribute enough to get the match", "Ignore it", "Only buy company stock", "Withdraw early"], correct:0, lesson:"Employer match is often called free money because it adds to your retirement savings." },
    { difficulty:2, question:"A 401(k) target-date fund becomes more conservative over time. Why?", answers:["Retirement gets closer", "Fees disappear", "Stocks stop moving", "Cash becomes illegal"], correct:0, lesson:"As retirement nears, many portfolios reduce risk to protect money needed sooner." },
    { difficulty:3, question:"What is a common tax feature of Traditional 401(k) contributions?", answers:["They may reduce taxable income today", "They are always after-tax", "They remove all future taxes", "They have no IRS rules"], correct:0, lesson:"Traditional 401(k) contributions can lower taxable income now, but withdrawals are generally taxed later." }
  ],
  '529 Plan': [
    { difficulty:1, question:"A 529 plan is mainly designed for what goal?", answers:["Education costs", "Buying meme stocks", "Emergency car repairs", "Daily groceries"], correct:0, lesson:"529 plans are tax-advantaged accounts for qualified education expenses." },
    { difficulty:2, question:"College starts in two years. What allocation concern matters most?", answers:["Protecting savings from a sudden drop", "Taking maximum risk", "Only picking tech stocks", "Ignoring tuition timing"], correct:0, lesson:"Money needed soon should usually become more conservative." },
    { difficulty:3, question:"Why might an age-based 529 portfolio become safer as college gets closer?", answers:["Less time to recover from losses", "Tuition becomes free", "Bonds always outperform", "Stocks cannot fall"], correct:0, lesson:"A shorter timeline means less time to recover if markets drop before tuition is due." }
  ],
  'Business Basics': gameQuestions
};

const accountOptions = ['Brokerage', 'Roth IRA', 'HSA', 'Traditional 401(k)', '529 Plan'];
const finalChallenge = {
  difficulty: 7,
  question: 'Final CEO challenge: the market drops 20%, tuition is due next year, and inflation is still high. What is the strongest beginner-friendly move?',
  answers: [
    'Protect near-term tuition with cash/bonds, keep long-term money invested, and rebalance gradually',
    'Sell every investment immediately and wait until news feels calm',
    'Put every dollar into the single stock that fell the most',
    'Ignore the tuition deadline because markets always recover quickly'
  ],
  correct: 0,
  lesson: 'A strong plan separates money needed soon from long-term money, then rebalances without panic.'
};

const getStableShuffleOffset = (question, answerCount) => {
  const seed = `${question.question}-${question.lesson}`;
  const total = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return answerCount > 0 ? total % answerCount : 0;
};

const getShuffledQuestion = (question) => {
  const offset = getStableShuffleOffset(question, question.answers.length);
  const answersWithOriginalIndex = question.answers.map((answer, index) => ({ answer, originalIndex: index }));
  const rotatedAnswers = [
    ...answersWithOriginalIndex.slice(offset),
    ...answersWithOriginalIndex.slice(0, offset)
  ];
  return {
    ...question,
    answers: rotatedAnswers.map(item => item.answer),
    correct: rotatedAnswers.findIndex(item => item.originalIndex === question.correct)
  };
};

// 3D Money Tower Component
function MoneyTower({ profit, targetProfit, maxProfit = 10000 }) {
  const meshRef = useRef();
  const height = Math.max(0.5, (targetProfit / maxProfit) * 8);
  
  useFrame(() => {
    if (meshRef.current) {
      const currentHeight = meshRef.current.scale.y;
      const targetHeight = height;
      meshRef.current.scale.y += (targetHeight - currentHeight) * 0.1;
      meshRef.current.position.y = meshRef.current.scale.y / 2;
    }
  });
  
  return (
    <mesh ref={meshRef} position={[0, height / 2, 0]}>
      <boxGeometry args={[2, 1, 2]} />
      <meshStandardMaterial color="#6c5ce7" metalness={0.5} roughness={0.3} />
    </mesh>
  );
}

// CEO Avatar standing on top of tower
function CEOAvatar({ height }) {
  const avatarRef = useRef();
  
  useFrame(() => {
    if (avatarRef.current) {
      const currentY = avatarRef.current.position.y;
      // Position CEO to stand ON TOP of the scaled tower
      const towerTopY = height;
      const targetY = towerTopY + 0.15;
      avatarRef.current.position.y += (targetY - currentY) * 0.1;
    }
  });
  
  return (
    <group ref={avatarRef} position={[0, height + 0.15, 0]}>
      {/* Shoes planted on tower */}
      <mesh position={[-0.11, 0, 0.03]}>
        <boxGeometry args={[0.16, 0.05, 0.24]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0.11, 0, 0.03]}>
        <boxGeometry args={[0.16, 0.05, 0.24]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.09, 0.18, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.32, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0.09, 0.18, 0]}>
        <cylinderGeometry args={[0.045, 0.055, 0.32, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.4, 16]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.86, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#ffd4a3" />
      </mesh>
      {/* Crown emoji as text */}
      <Text
        position={[0, 1.13, 0]}
        fontSize={0.25}
        color="#FFD700"
        outlineWidth={0.01}
        outlineColor="#B8860B"
      >
        👑
      </Text>
    </group>
  );
}

// Floating money icon
function FloatingMoney({ position, amount, onComplete }) {
  const meshRef = useRef();
  const [opacity, setOpacity] = useState(1);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y += 0.05;
      setOpacity(prev => Math.max(0, prev - 0.02));
      if (opacity <= 0 && onComplete) {
        onComplete();
      }
    }
  });
  
  const color = amount > 0 ? '#00d4aa' : '#ff6b9d';
  const symbol = amount > 0 ? '+' : '';
  
  return (
    <group ref={meshRef} position={position}>
      <Text
        fontSize={0.4}
        color={color}
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {symbol}${Math.abs(amount)}
      </Text>
    </group>
  );
}

// Main 3D Scene
function GameScene({ profit, lastChange, maxProfit }) {
  const height = Math.max(0.5, (profit / maxProfit) * 8);
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 5, 5]} />
      <OrbitControls enableZoom={false} enablePan={false} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, 10, -5]} intensity={0.5} color="#6c5ce7" />
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      
      {/* Grid */}
      <gridHelper args={[10, 10, '#2a2a4e', '#1a1a2e']} />
      
      {/* Money Tower */}
      <MoneyTower profit={profit} targetProfit={profit} maxProfit={maxProfit} />
      
      {/* CEO Avatar */}
      <CEOAvatar height={height} />
      
      {/* Money amount floating above tower with better styling */}
      <Text
        position={[0, height + 2.2, 0]}
        fontSize={0.6}
        color="#10b981"
        outlineWidth={0.03}
        outlineColor="#000"
        anchorX="center"
        anchorY="middle"
      >
        ${profit.toLocaleString()}
      </Text>
      {/* Money glow effect */}
      <Text
        position={[0, height + 2.2, -0.01]}
        fontSize={0.65}
        color="#34d399"
        fillOpacity={0.3}
        anchorX="center"
        anchorY="middle"
      >
        ${profit.toLocaleString()}
      </Text>
      
      {/* Floating money changes */}
      {lastChange !== 0 && (
        <FloatingMoney
          position={[0, height + 2, 0]}
          amount={lastChange}
        />
      )}
    </>
  );
}


export default function GameTab() {
  const { state, dispatch } = useApp();
  const game = state.game;
  const [companyName, setCompanyName] = useState(game.company || '');
  const [showNameSetup, setShowNameSetup] = useState(!game.company || game.company === 'Clarity Coffee Co.');
  const [selectedAccountType, setSelectedAccountType] = useState('Brokerage');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [topicProgress, setTopicProgress] = useState({});
  const [topicRequirements, setTopicRequirements] = useState({});
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [finalMode, setFinalMode] = useState(false);
  const [finalWon, setFinalWon] = useState(false);
  const coachMessagesRef = useRef(null);
  
  const selectedQuestions = finalMode ? [finalChallenge] : accountQuestionBanks[selectedAccountType] || gameQuestions;
  const selectedQuestionRequirement = finalMode
    ? 1
    : (topicRequirements[selectedAccountType] || selectedQuestions.length);
  const answeredInTopic = topicProgress[selectedAccountType] || 0;
  const topicMastered = !finalMode && answeredInTopic >= selectedQuestionRequirement;
  const masteredCount = accountOptions.filter((option) => {
    const questionCount = (accountQuestionBanks[option] || gameQuestions).length;
    const requiredCount = topicRequirements[option] || questionCount;
    return (topicProgress[option] || 0) >= requiredCount;
  }).length;
  const allTopicsMastered = masteredCount === accountOptions.length;
  const currentQuestionIndex = finalMode ? 0 : game.currentQuestion % selectedQuestions.length;
  const currentQ = getShuffledQuestion(selectedQuestions[currentQuestionIndex]);
  const milestones = [
    { day: 10, name: 'First Week', bonus: 500 },
    { day: 30, name: 'One Month', bonus: 2000 },
    { day: 60, name: 'Two Months', bonus: 5000 },
    { day: 100, name: 'Quarter', bonus: 10000 }
  ];

  useEffect(() => {
    if (coachMessagesRef.current) {
      coachMessagesRef.current.scrollTo({
        top: coachMessagesRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages, chatLoading]);
  
  const handleStartCompany = () => {
    if (companyName.trim()) {
      dispatch({ 
        type: 'UPDATE_GAME', 
        payload: { company: companyName.trim() } 
      });
      setShowNameSetup(false);
      toast.success(`🎉 ${companyName} is born! Let's build it together.`);
    } else {
      toast.error('Please enter a company name');
    }
  };
  
  const handleAnswer = (answerIndex) => {
    if (answerFeedback) return;

    if (topicMastered) {
      toast('Mastery achieved. Pick another topic to keep learning.');
      return;
    }

    const isCorrect = answerIndex === currentQ.correct;
    const chosenAnswer = currentQ.answers[answerIndex];
    const correctAnswer = currentQ.answers[currentQ.correct];
    const nextAnsweredInTopic = finalMode ? answeredInTopic : answeredInTopic + 1;

    if (!finalMode && isCorrect) {
      setTopicProgress(prev => ({ ...prev, [selectedAccountType]: nextAnsweredInTopic }));
    }
    
    if (!isCorrect) {
      const nextRequiredCount = finalMode ? selectedQuestionRequirement : selectedQuestionRequirement + 1;
      if (!finalMode) {
        setTopicRequirements((prev) => ({
          ...prev,
          [selectedAccountType]: nextRequiredCount
        }));
      }

      const newWrong = game.wrong + 1;
      if (newWrong >= 3) {
        dispatch({ 
          type: 'UPDATE_GAME', 
          payload: { over: true, wrong: newWrong } 
        });
        toast.error('💔 Company bankrupt!');
        return;
      }
      
      const newProfit = Math.max(100, game.profit - 200);
      const profitHistory = [...game.profitHistory, newProfit];
      
      dispatch({
        type: 'UPDATE_GAME',
        payload: {
          profit: newProfit,
          wrong: newWrong,
          streak: 0,
          day: game.day + 1,
          currentQuestion: (game.currentQuestion + 1) % selectedQuestions.length,
          lastChange: -200,
          lastProfit: game.profit,
          profitHistory
        }
      });

      setAnswerFeedback({
        isCorrect: false,
        chosenAnswer,
        correctAnswer,
        lesson: currentQ.lesson,
        nextQuestion: (game.currentQuestion + 1) % selectedQuestions.length,
        topicCompleted: false,
        finalComplete: false
      });
      
      toast.error(`Wrong! -$200. Company profit: $${newProfit}`);
      return;
    }
    
    // Correct answer
    const newStreak = game.streak + 1;
    const baseGain = 150;
    const streakBonus = newStreak >= 3 ? 100 : 0;
    const difficultyBonus = currentQ.difficulty * 50;
    const totalGain = baseGain + streakBonus + difficultyBonus;
    
    const newProfit = game.profit + totalGain;
    const newDay = game.day + 1;
    
    // Check for milestones
    let milestoneBonus = 0;
    for (const m of milestones) {
      if (newDay === m.day && !game.earnedMilestones.has(m.day)) {
        milestoneBonus = m.bonus;
        game.earnedMilestones.add(m.day);
        toast.success(`🎉 ${m.name} Milestone! +$${m.bonus}`);
        break;
      }
    }
    
    const finalProfit = newProfit + milestoneBonus;
    const profitHistory = [...game.profitHistory, finalProfit];
    
    // Level up difficulty
    let newDifficulty = game.difficulty;
    if (newStreak >= 3 && game.difficulty < 7) {
      newDifficulty++;
      toast.success(`📈 Level ${newDifficulty}! Harder questions, bigger rewards.`);
    }
    
    dispatch({
      type: 'UPDATE_GAME',
      payload: {
        profit: finalProfit,
        streak: newStreak,
        difficulty: newDifficulty,
        day: newDay,
        currentQuestion: (game.currentQuestion + 1) % selectedQuestions.length,
        lastChange: totalGain + milestoneBonus,
        lastProfit: game.profit,
        profitHistory
      }
    });

    if (finalMode) {
      setFinalWon(true);
    }

    setAnswerFeedback({
      isCorrect: true,
      chosenAnswer,
      correctAnswer,
      lesson: currentQ.lesson,
      nextQuestion: (game.currentQuestion + 1) % selectedQuestions.length,
      topicCompleted: !finalMode && nextAnsweredInTopic >= selectedQuestionRequirement,
      finalComplete: finalMode
    });
    
    toast.success(`✓ Correct! +$${totalGain + milestoneBonus}`);
  };

  const handleContinueAfterFeedback = () => {
    if (!answerFeedback) return;
    if (!answerFeedback.topicCompleted && !answerFeedback.finalComplete) {
      dispatch({
        type: 'UPDATE_GAME',
        payload: { currentQuestion: answerFeedback.nextQuestion }
      });
    }
    setAnswerFeedback(null);
  };
  
  const handleReset = () => {
    dispatch({ type: 'RESET_GAME' });
    setShowNameSetup(true);
    setCompanyName('');
    setTopicProgress({});
    setTopicRequirements({});
    setAnswerFeedback(null);
    setFinalMode(false);
    setFinalWon(false);
    toast.success('Company reset! Create a new one.');
  };

  const handleAccountTypeChange = (accountType) => {
    setFinalMode(false);
    setAnswerFeedback(null);
    setSelectedAccountType(accountType);
    setChatMessages([]);
    dispatch({
      type: 'UPDATE_GAME',
      payload: { currentQuestion: 0 }
    });
  };

  const handleAskCoach = async (e) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message || chatLoading) return;
    const asksForAnswer = /answer|which one|correct|pick|choose/i.test(message);

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: message }]);
    setChatLoading(true);

    if (asksForAnswer) {
      const newProfit = Math.max(100, game.profit - 50);
      dispatch({
        type: 'UPDATE_GAME',
        payload: {
          profit: newProfit,
          streak: 0,
          lastChange: -50,
          lastProfit: game.profit,
          profitHistory: [...game.profitHistory, newProfit]
        }
      });
      toast('Answer reveal costs $50 and resets your streak.');
    }

    const answer = await getGameQuestionHelp({
      question: currentQ,
      answers: currentQ.answers,
      accountType: selectedAccountType,
      userQuestion: message
    });

    setChatMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    setChatLoading(false);
  };
  
  // Company Name Setup Screen
  if (showNameSetup) {
    return (
      <div className="game-tab">
        <motion.div
          className="company-setup"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="setup-content">
            <h2>🏢 Start Your Company</h2>
            <p>Choose a name for your business and learn investing by running it!</p>
            
            <div className="name-input-section">
              <label htmlFor="companyName">Company Name</label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartCompany()}
                placeholder="e.g., Tech Innovations Inc."
                autoFocus
              />
            </div>
            
            <div className="account-game-selector setup-selector">
              <span>First lesson set</span>
              <div className="account-game-options">
                {accountOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={selectedAccountType === option ? 'active' : ''}
                    onClick={() => handleAccountTypeChange(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button className="primary-button" onClick={handleStartCompany}>
              Launch Company
            </button>
            
            <div className="setup-info">
              <h4>How it works:</h4>
              <ul>
                <li>Answer investing questions to grow your company</li>
                <li>Correct answers earn money and increase your profit tower</li>
                <li>Wrong answers lose money - 3 mistakes and you're bankrupt!</li>
                <li>Reach milestones for bonus cash</li>
                <li>Build streaks to level up and earn more</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Bankruptcy Screen
  if (game.over) {
    return (
      <div className="game-tab">
        <motion.div
          className="bankruptcy-screen"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2>💔 {game.company} is Bankrupt</h2>
          <p>You made {game.wrong} wrong decisions. The company couldn't survive.</p>
          
          <div className="game-stats">
            <div className="stat-box">
              <span>Days Survived</span>
              <strong>{game.day}</strong>
            </div>
            <div className="stat-box">
              <span>Final Profit</span>
              <strong>${game.profit.toLocaleString()}</strong>
            </div>
            <div className="stat-box">
              <span>Best Streak</span>
              <strong>{game.streak}</strong>
            </div>
          </div>
          
          <div className="lessons-learned">
            <h3>Key Lesson</h3>
            <p>{currentQ.lesson}</p>
          </div>
          
          <button className="primary-button" onClick={handleReset}>
            Start New Company
          </button>
        </motion.div>
      </div>
    );
  }
  
  // Main Game Screen with 3D Tower
  return (
    <div className="game-tab">
      <div className="game-header">
        <div>
          <h2 className="game-company-title">
            <span aria-hidden="true">🏢</span>
            <span>{game.company}</span>
          </h2>
          <p>Day {game.day} • Level {game.difficulty} • {finalMode ? 'Final CEO Challenge' : selectedAccountType}</p>
        </div>
        <button className="secondary-button" onClick={handleReset}>
          New Company
        </button>
      </div>

      <div className="account-game-selector">
        <div className="active-topic-summary">
          <span>Question set</span>
          <strong>{finalMode ? 'Final CEO Challenge' : `${selectedAccountType} ${Math.min(answeredInTopic, selectedQuestionRequirement)}/${selectedQuestionRequirement}`}</strong>
        </div>
        <div className="account-game-options">
          {accountOptions.map(option => (
            <button
              key={option}
              type="button"
              className={selectedAccountType === option ? 'active' : ''}
              onClick={() => handleAccountTypeChange(option)}
            >
              {option}
            </button>
          ))}
          <button
            type="button"
            className={`final-challenge-button compact ${allTopicsMastered ? 'unlocked' : ''}`}
            disabled={!allTopicsMastered}
            onClick={() => {
              setFinalMode(true);
              setAnswerFeedback(null);
              setChatMessages([]);
              dispatch({ type: 'UPDATE_GAME', payload: { currentQuestion: 0 } });
            }}
          >
            Final CEO Challenge
          </button>
        </div>
      </div>
      
      <div className="game-layout-3d">
        {/* 3D Money Tower Visualization */}
        <div className="tower-canvas">
          <Canvas>
            <GameScene 
              profit={game.profit} 
              lastChange={game.lastChange || 0}
              maxProfit={10000}
            />
          </Canvas>
          
          <div className="tower-stats">
            <div className="stat-badge">
              <span>Wrong</span>
              <strong className="negative">{game.wrong}/3</strong>
            </div>
            <div className="stat-badge">
              <span>Streak</span>
              <strong className="positive">{game.streak}</strong>
            </div>
            <div className="stat-badge">
              <span>Level</span>
              <strong>{game.difficulty}</strong>
            </div>
          </div>
        </div>
        
        {/* Question Panel */}
        <div className="question-panel-3d">
          <AnimatePresence mode="wait">
            <motion.div
              key={game.currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="question-content"
            >
              <div className="question-main">
                <div className="question-header">
                  <span className="difficulty-badge">Difficulty {currentQ.difficulty}</span>
                  <span className="question-number">{finalMode ? 'Final' : `Q${Math.min(answeredInTopic + 1, selectedQuestionRequirement)}/${selectedQuestionRequirement}`}</span>
                </div>
                
              {finalWon ? (
                <div className="mastery-card final-win">
                  <span>CEO graduation complete</span>
                  <h3>All investing concepts mastered</h3>
                  <p>You handled the final mixed scenario by protecting near-term needs while keeping long-term money invested.</p>
                  <strong>Final company value: ${game.profit.toLocaleString()}</strong>
                </div>
              ) : topicMastered ? (
                <div className="mastery-card">
                  <span>Mastery achieved</span>
                  <h3>{selectedAccountType} complete</h3>
                  <p>You completed {selectedQuestionRequirement} correct answers for this topic. Move to another question set to keep learning.</p>
                  <strong>{masteredCount}/{accountOptions.length} topics mastered</strong>
                </div>
              ) : (
                <>
                  <h3 className="question-text">{currentQ.question}</h3>
              
                  <div className="answers-grid">
                    {currentQ.answers.map((answer, i) => (
                      <motion.button
                        key={i}
                        className="answer-button"
                        onClick={() => handleAnswer(i)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {answer}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}

              {answerFeedback && (
                <div className={`answer-feedback ${answerFeedback.isCorrect ? 'correct' : 'incorrect'}`}>
                  <span>{answerFeedback.isCorrect ? 'Correct decision' : 'Review this decision'}</span>
                  {!answerFeedback.isCorrect && (
                    <p>You chose: <strong>{answerFeedback.chosenAnswer}</strong></p>
                  )}
                  <p>Best answer: <strong>{answerFeedback.correctAnswer}</strong></p>
                  <p>{answerFeedback.lesson}</p>
                  {answerFeedback.topicCompleted && (
                    <p className="feedback-mastery">Mastery achieved for {selectedAccountType}. Pick another topic.</p>
                  )}
                  {!answerFeedback.finalComplete && (
                    <button className="secondary-button" onClick={handleContinueAfterFeedback}>
                      Continue
                    </button>
                  )}
                </div>
              )}
                
                <div className="lesson-preview">
                  <p><strong>💡 Investing Connection:</strong></p>
                  <p>{currentQ.lesson}</p>
                </div>
              </div>

              <div className="game-coach">
                <div className="coach-header">
                  <h4>Ask the investing coach</h4>
                  <span>Groq help for this question</span>
                </div>
                <div className="coach-messages" ref={coachMessagesRef}>
                  {chatMessages.length === 0 && (
                    <p className="coach-empty">Ask what a term means, why an answer might be risky, or how this connects to {selectedAccountType}.</p>
                  )}
                  {chatMessages.map((message, index) => (
                    <div key={index} className={`coach-message ${message.role}`}>
                      {message.content}
                    </div>
                  ))}
                  {chatLoading && <div className="coach-message assistant">Thinking through the tradeoff...</div>}
                </div>
                <form className="coach-input-row" onSubmit={handleAskCoach}>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="What does this question mean?"
                  />
                  <button type="submit" disabled={chatLoading || !chatInput.trim()}>
                    Ask
                  </button>
                </form>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="milestones-compact">
            <h4>Milestones</h4>
            {milestones.map(m => (
              <div 
                key={m.day} 
                className={`milestone-item ${game.earnedMilestones.has(m.day) ? 'earned' : game.day >= m.day ? 'missed' : ''}`}
              >
                <span>{m.name}</span>
                <strong>+${m.bonus}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
