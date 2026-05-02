import { useEffect, useMemo, useState, useRef } from 'react';
import * as THREE from 'three';
import { useApp } from '../../store/useAppStore';
import { events, positions } from '../../data/appData';
import { motion } from 'framer-motion';
import RebalanceModal from '../RebalanceModal';
import { getEventRecommendation } from '../../services/groqService';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Text } from '@react-three/drei';
import { estimateTaxImpact, formatTaxImpact } from '../../utils/taxImpact';
import toast from 'react-hot-toast';
import './MapTab.css';

const LAND_SHAPES = [
  {
    name: 'North America',
    points: [[-168, 72], [-150, 70], [-138, 60], [-125, 55], [-123, 48], [-117, 34], [-108, 31], [-103, 23], [-95, 18], [-88, 17], [-82, 24], [-76, 28], [-71, 41], [-61, 45], [-53, 50], [-58, 57], [-74, 63], [-94, 68], [-118, 70], [-142, 73]]
  },
  {
    name: 'Central America',
    points: [[-100, 23], [-88, 18], [-82, 13], [-78, 9], [-84, 8], [-91, 14], [-101, 17]]
  },
  {
    name: 'South America',
    points: [[-81, 12], [-70, 11], [-60, 5], [-51, -5], [-45, -16], [-48, -25], [-54, -35], [-62, -45], [-70, -55], [-75, -45], [-72, -31], [-78, -18], [-82, -4]]
  },
  {
    name: 'Europe',
    points: [[-11, 36], [-8, 44], [-5, 50], [2, 54], [10, 57], [18, 59], [29, 59], [35, 53], [31, 45], [24, 40], [15, 37], [5, 36]]
  },
  {
    name: 'Scandinavia',
    points: [[5, 58], [16, 71], [29, 70], [32, 61], [23, 56], [12, 56]]
  },
  {
    name: 'Africa',
    points: [[-17, 35], [-4, 36], [14, 33], [29, 31], [35, 24], [43, 12], [50, 2], [43, -12], [35, -25], [27, -34], [16, -35], [8, -26], [2, -17], [-6, -4], [-12, 10], [-18, 21]]
  },
  {
    name: 'Asia',
    points: [[31, 55], [45, 62], [62, 69], [86, 72], [109, 68], [130, 60], [149, 51], [156, 43], [139, 35], [125, 23], [114, 18], [104, 10], [99, 1], [88, 6], [78, 18], [69, 24], [60, 29], [48, 30], [39, 38], [31, 45]]
  },
  {
    name: 'India',
    points: [[68, 25], [78, 29], [88, 23], [92, 18], [86, 9], [77, 6], [70, 17]]
  },
  {
    name: 'Southeast Asia',
    points: [[95, 20], [108, 19], [119, 12], [124, 2], [115, -6], [103, -5], [97, 6]]
  },
  {
    name: 'Japan',
    points: [[130, 45], [142, 42], [145, 35], [138, 31], [131, 35]]
  },
  {
    name: 'Indonesia',
    points: [[96, 5], [110, 4], [124, 1], [138, -4], [141, -9], [126, -9], [112, -5], [99, -2]]
  },
  {
    name: 'Australia',
    points: [[112, -12], [128, -12], [146, -18], [154, -28], [150, -38], [137, -43], [122, -36], [113, -25]]
  },
  {
    name: 'Greenland',
    points: [[-52, 59], [-33, 62], [-22, 72], [-38, 82], [-58, 78], [-63, 68]]
  },
  {
    name: 'New Zealand',
    points: [[166, -34], [179, -39], [176, -46], [166, -44]]
  },
  {
    name: 'Madagascar',
    points: [[47, -13], [51, -19], [49, -26], [44, -24], [43, -17]]
  }
];

const COUNTRY_BOUNDARY_LINES = [
  [[-125, 49], [-67, 49]],
  [[-102, 31], [-97, 26], [-90, 23]],
  [[-60, 5], [-64, -12], [-58, -24], [-53, -33]],
  [[-5, 36], [8, 48], [22, 50], [30, 45]],
  [[20, 31], [32, 22], [37, 5], [31, -25]],
  [[60, 50], [82, 45], [101, 35], [116, 32]],
  [[68, 25], [82, 29], [95, 27]],
  [[112, -12], [135, -24], [146, -36]]
];

const COUNTRY_LABELS = [
  { name: 'USA', lat: 39, lon: -98 },
  { name: 'Brazil', lat: -10, lon: -55 },
  { name: 'Germany', lat: 51, lon: 10 },
  { name: 'Egypt', lat: 27, lon: 30 },
  { name: 'China', lat: 35, lon: 105 },
  { name: 'India', lat: 22, lon: 79 },
  { name: 'Japan', lat: 37, lon: 138 },
  { name: 'Australia', lat: -25, lon: 134 }
];

function createWorldMonitorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const project = (lon, lat) => [
    ((lon + 180) / 360) * canvas.width,
    ((90 - lat) / 180) * canvas.height
  ];

  const ocean = ctx.createRadialGradient(canvas.width * 0.42, canvas.height * 0.35, 60, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.72);
  ocean.addColorStop(0, '#164b78');
  ocean.addColorStop(0.48, '#0b315b');
  ocean.addColorStop(1, '#04172d');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 220; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 1 + Math.random() * 2.5;
    ctx.fillStyle = `rgba(110, 190, 230, ${0.04 + Math.random() * 0.05})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(90, 180, 255, 0.16)';
  ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 15) {
    const [x] = project(lon, 0);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    const [, y] = project(0, lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  LAND_SHAPES.forEach((shape) => {
    ctx.beginPath();
    shape.points.forEach(([lon, lat], index) => {
      const [x, y] = project(lon, lat);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    const landGradient = ctx.createLinearGradient(0, canvas.height * 0.2, 0, canvas.height * 0.78);
    landGradient.addColorStop(0, '#82c56e');
    landGradient.addColorStop(0.45, '#2f9f65');
    landGradient.addColorStop(1, '#b18a56');
    ctx.fillStyle = landGradient;
    ctx.shadowColor = 'rgba(0, 212, 170, 0.35)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(210, 245, 230, 0.78)';
    ctx.lineWidth = 3;
    ctx.stroke();
  });

  ctx.strokeStyle = 'rgba(230, 255, 244, 0.22)';
  ctx.lineWidth = 2;
  COUNTRY_BOUNDARY_LINES.forEach((line) => {
    ctx.beginPath();
    line.forEach(([lon, lat], index) => {
      const [x, y] = project(lon, lat);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  const drawIceCap = (top) => {
    const y = top ? 0 : canvas.height;
    const gradient = ctx.createLinearGradient(0, top ? 0 : canvas.height - 150, 0, top ? 150 : canvas.height);
    gradient.addColorStop(0, 'rgba(236, 253, 255, 0.86)');
    gradient.addColorStop(1, 'rgba(236, 253, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, y, canvas.width * 0.55, 145, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  drawIceCap(true);
  drawIceCap(false);

  for (let i = 0; i < 34; i += 1) {
    const y = 90 + i * 26 + Math.sin(i) * 20;
    const x = (i * 137) % canvas.width;
    const cloud = ctx.createRadialGradient(x, y, 4, x, y, 85);
    cloud.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    cloud.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = cloud;
    ctx.beginPath();
    ctx.ellipse(x, y, 120, 32, -0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = 'bold 24px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  COUNTRY_LABELS.forEach((country) => {
    const [x, y] = project(country.lon, country.lat);
    ctx.fillStyle = '#dffdf4';
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(225, 255, 246, 0.9)';
    ctx.fillText(country.name, x, y - 14);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

// 3D Globe Component with rotating Earth
function Globe({ events, selectedEvent, onEventClick }) {
  const globeRef = useRef();
  const earthTexture = useMemo(() => createWorldMonitorTexture(), []);
  
  // Auto-rotate the globe slowly
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });
  
  // Convert lat/lon to 3D sphere coordinates
  const latLonToVector3 = (lat, lon, radius = 2.5) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    return [
      -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    ];
  };
  
  return (
    <group ref={globeRef}>
      {/* Earth sphere */}
      <Sphere args={[2.5, 64, 64]}>
        <meshStandardMaterial
          map={earthTexture}
          color="#ffffff"
          metalness={0.12}
          roughness={0.78}
          emissive="#061a32"
          emissiveIntensity={0.12}
        />
      </Sphere>
      
      {/* Atmosphere glow */}
      <Sphere args={[2.55, 64, 64]}>
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.1}
        />
      </Sphere>
      
      {/* Event markers */}
      {events.map((evt, i) => {
        const position = latLonToVector3(evt.lat, evt.lon);
        const labelPosition = latLonToVector3(evt.lat + 5, evt.lon, 2.82);
        const color = 
          evt.color === 'red' ? '#ef4444' :
          evt.color === 'orange' ? '#f97316' :
          evt.color === 'yellow' ? '#fbbf24' :
          '#10b981';
        
        return (
          <group key={evt.id}>
            <mesh
              position={position}
              onClick={() => onEventClick(i)}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default';
              }}
            >
              <sphereGeometry args={[selectedEvent === i ? 0.11 : 0.08, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={selectedEvent === i ? 1.8 : 0.65}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {selectedEvent === i && (
              <Text
                position={labelPosition}
                fontSize={0.16}
                color="#e8fff9"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.012}
                outlineColor="#02111f"
              >
                {evt.region}
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
}

const clampAllocation = (allocation) => {
  const stocks = Math.max(20, Math.min(85, allocation.stocks));
  const bonds = Math.max(5, Math.min(60, allocation.bonds));
  const cash = Math.max(0, 100 - stocks - bonds);
  return { stocks, bonds, cash };
};

const getRiskEventStrategy = (event, target) => {
  const descriptor = `${event.event} ${event.region} ${event.stats.assetClass} ${event.suggestedAction}`.toLowerCase();

  if (descriptor.includes('rate') || descriptor.includes('federal reserve') || descriptor.includes('bond')) {
    return {
      category: 'rate-shock',
      targetAllocation: clampAllocation({
        stocks: target.stocks - 8,
        bonds: target.bonds + 6,
        cash: target.cash + 2
      }),
      protectionFocus: 'Short-term bonds and defensive dividend stocks',
      shiftSummary: 'Trim a little stock risk, upgrade the bond sleeve, and keep a modest extra cash buffer.',
      goalAlignment: 'Designed to handle rate volatility by reducing duration risk and leaning on steadier income-producing holdings.',
      tickerActions: [
        {
          action: 'BUY',
          ticker: 'VGSH',
          type: 'ETF',
          name: 'Vanguard Short-Term Treasury ETF',
          estimatedValue: 1200,
          reason: 'Short-term Treasuries are typically less sensitive to rate uncertainty than broad bond funds.'
        },
        {
          action: 'CONSIDER',
          ticker: 'VIG',
          type: 'ETF',
          name: 'Vanguard Dividend Appreciation ETF',
          estimatedValue: 900,
          reason: 'Dividend-focused defensive stocks can hold up better than high-growth names when rates stay higher for longer.'
        },
        {
          action: 'REDUCE',
          ticker: 'VOO',
          type: 'ETF',
          name: 'S&P 500 ETF Exposure',
          estimatedValue: 700,
          reason: 'Scale back broad growth exposure slightly while rate pressure is unresolved.'
        }
      ]
    };
  }

  if (descriptor.includes('slowdown') || descriptor.includes('regulatory') || descriptor.includes('emerging market')) {
    return {
      category: 'growth-slowdown',
      targetAllocation: clampAllocation({
        stocks: target.stocks - 14,
        bonds: target.bonds + 9,
        cash: target.cash + 5
      }),
      protectionFocus: 'Broad developed-market funds with a larger stability buffer',
      shiftSummary: 'Cut riskier growth exposure more aggressively and move that capital toward bonds and cash.',
      goalAlignment: 'Designed to protect capital during slowdown risk while keeping enough equity exposure for long-term recovery.',
      tickerActions: [
        {
          action: 'BUY',
          ticker: 'BND',
          type: 'ETF',
          name: 'Vanguard Total Bond Market ETF',
          estimatedValue: 1400,
          reason: 'A broader bond sleeve can soften the impact of equity weakness during a slowdown.'
        },
        {
          action: 'REDUCE',
          ticker: 'VXUS',
          type: 'ETF',
          name: 'Total International Stock ETF',
          estimatedValue: 1100,
          reason: 'Trim emerging-market-sensitive exposure until regulatory and growth conditions stabilize.'
        },
        {
          action: 'HOLD',
          ticker: 'CASH',
          type: 'Cash',
          name: 'Cash Reserve',
          estimatedValue: 500,
          reason: 'A larger cash sleeve gives you flexibility if volatility creates a better entry point later.'
        }
      ]
    };
  }

  if (descriptor.includes('stable growth') || descriptor.includes('opportunity') || descriptor.includes('positive outlook')) {
    return {
      category: 'opportunity',
      targetAllocation: clampAllocation({
        stocks: target.stocks + 5,
        bonds: target.bonds - 3,
        cash: target.cash - 2
      }),
      protectionFocus: 'Disciplined global diversification rather than a defensive posture',
      shiftSummary: 'Lean slightly into diversified equities because the event is supportive rather than threatening.',
      goalAlignment: 'Designed to capture upside while staying diversified and avoiding concentrated bets.',
      tickerActions: [
        {
          action: 'BUY',
          ticker: 'VT',
          type: 'ETF',
          name: 'Vanguard Total World Stock ETF',
          estimatedValue: 1000,
          reason: 'Broad global exposure is a cleaner way to express a positive macro view than chasing one region.'
        },
        {
          action: 'CONSIDER',
          ticker: 'IXC',
          type: 'ETF',
          name: 'iShares Global Energy ETF',
          estimatedValue: 500,
          reason: 'If you want to lean into resource strength, keep it as a small satellite position only.'
        }
      ]
    };
  }

  return {
    category: 'geopolitical-conflict',
    targetAllocation: clampAllocation({
      stocks: target.stocks - 10,
      bonds: target.bonds + 7,
      cash: target.cash + 3
    }),
    protectionFocus: 'Defensive stocks, core bonds, and extra liquidity',
    shiftSummary: 'De-risk the portfolio a bit, add stability, and keep more dry powder until the conflict clears.',
    goalAlignment: 'Designed to reduce downside during global conflict risk without abandoning long-term growth entirely.',
    tickerActions: [
      {
        action: 'BUY',
        ticker: 'VDC',
        type: 'ETF',
        name: 'Vanguard Consumer Staples ETF',
        estimatedValue: 900,
        reason: 'Consumer staples are often more resilient than cyclical sectors during global instability.'
      },
      {
        action: 'BUY',
        ticker: 'BND',
        type: 'ETF',
        name: 'Vanguard Total Bond Market ETF',
        estimatedValue: 1200,
        reason: 'Core bonds can help absorb some of the drawdown pressure from a conflict-driven selloff.'
      },
      {
        action: 'HOLD',
        ticker: 'CASH',
        type: 'Cash',
        name: 'Cash Reserve',
        estimatedValue: 600,
        reason: 'Cash gives you room to respond if volatility deepens or new risks appear.'
      }
    ]
  };
};

export default function MapTab({ account: accountProp, onNavigateToReview }) {
  const { state, dispatch } = useApp();
  const account = state.portfolioAccounts.find((item) => item.id === accountProp?.id) || accountProp;
  const [showModal, setShowModal] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  
  const event = events[state.selectedEvent];
  const affectedPositions = positions.filter(p => event.affected.includes(p.symbol));

  useEffect(() => {
    let cancelled = false;

    const loadRecommendation = async () => {
      setLoadingAI(true);
      try {
          const recommendation = await getEventRecommendation({
            event,
          allocation: account?.allocation || state.allocation,
          affectedPositions: event.affected
        });

        if (!cancelled) {
          setAiRecommendation(recommendation);
        }
      } catch (error) {
        if (!cancelled) {
          setAiRecommendation('');
        }
      } finally {
        if (!cancelled) {
          setLoadingAI(false);
        }
      }
    };

    loadRecommendation();

    return () => {
      cancelled = true;
    };
  }, [event, account?.allocation, state.allocation]);
  
  const handleEventClick = async (id) => {
    dispatch({ type: 'SET_SELECTED_EVENT', payload: id });
  };
  
  const createDefensivePlan = () => {
    const currentAllocation = account?.allocation || state.target;
    const eventStrategy = getRiskEventStrategy(event, currentAllocation);
    const targetAllocation = eventStrategy.targetAllocation;
    const taxImpact = estimateTaxImpact(account, targetAllocation);
    const accountTotal = account?.totalBalance || 0;
    const liveTickerActions = eventStrategy.tickerActions.map((action, index) => ({
      ...action,
      estimatedValue: Math.max(
        action.action === 'CONSIDER' ? 0 : 250,
        Math.round(accountTotal * ([0.025, 0.018, 0.012][index] || 0.01))
      )
    }));
    const defensivePlan = {
      ...targetAllocation,
      source: 'risk-map',
      accountId: account.id,
      scenarioTitle: event.event,
      rationale: aiRecommendation || event.suggestedAction || `This plan adds stability because ${event.event.toLowerCase()} may increase short-term market swings.`,
      costs: 'Estimated trading cost: usually $0 at many modern brokerages. Spreads and fund fees may still apply.',
      taxes: formatTaxImpact(taxImpact),
      taxImpact,
      goalAlignment: eventStrategy.goalAlignment,
      confidenceNote: 'This is a simulated protection plan based on the selected global risk event.',
      aiRecommendation: aiRecommendation || event.suggestedAction,
      conflictSummary: `${event.region}: ${event.event}`,
      conflictCategory: eventStrategy.category,
      protectionFocus: eventStrategy.protectionFocus,
      shiftSummary: eventStrategy.shiftSummary,
      sourceRegion: event.region,
      sourceRisk: event.risk,
      estimatedPortfolioImpact: event.portfolioImpact,
      tickerActions: liveTickerActions
    };
    return defensivePlan;
  };

  const handleProtect = () => {
    const defensivePlan = createDefensivePlan();
    dispatch({ type: 'SET_PENDING_PLAN', payload: defensivePlan });
    dispatch({
      type: 'ADJUST_CONFIDENCE',
      payload: {
        amount: 5,
        reason: `Protection plan created for: ${event.event}`,
        key: `event-${state.selectedEvent}`
      }
    });
    setShowModal(true);
  };

  const handleReviewAndAct = () => {
    const defensivePlan = createDefensivePlan();
    dispatch({ type: 'SET_PENDING_PLAN', payload: defensivePlan });
    dispatch({
      type: 'ADJUST_CONFIDENCE',
      payload: {
        amount: 5,
        reason: `Protection plan created for: ${event.event}`,
        key: `event-${state.selectedEvent}`
      }
    });
    toast.success('AI recommendation saved. Opening Review & Act.');
    onNavigateToReview?.();
  };
  
  return (
    <div className="map-tab">
      <div className="map-header">
        <div>
          <h2>Global Risk Map</h2>
          <p>Real-time monitoring of global market events</p>
        </div>
        <button className="primary-button" onClick={handleProtect}>
          Protect my portfolio
        </button>
      </div>
      
      <div className="map-layout">
        <div className="map-canvas">
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 5, 5]} intensity={1} />
            <pointLight position={[-5, -5, 5]} intensity={0.5} color="#6366f1" />
            <Globe 
              events={events} 
              selectedEvent={state.selectedEvent}
              onEventClick={handleEventClick}
            />
            <OrbitControls 
              enableZoom={true}
              enablePan={false}
              minDistance={5}
              maxDistance={12}
              autoRotate={false}
            />
          </Canvas>
          
          <div className="map-legend">
            <div className="legend-item">
              <span className="risk-dot red"></span>
              <span>High Risk</span>
            </div>
            <div className="legend-item">
              <span className="risk-dot orange"></span>
              <span>Medium-High</span>
            </div>
            <div className="legend-item">
              <span className="risk-dot yellow"></span>
              <span>Medium</span>
            </div>
            <div className="legend-item">
              <span className="risk-dot green"></span>
              <span>Low Risk</span>
            </div>
          </div>
        </div>
        
        <motion.div
          key={state.selectedEvent}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="event-detail"
        >
          <div className="event-header">
            <div>
              <span className="event-continent">{event.region}</span>
              <h3>{event.event}</h3>
              <span className={`risk-badge ${event.risk.toLowerCase()}`}>
                {event.risk} Risk
              </span>
            </div>
          </div>
          
          <div className="event-stats">
            <div className="stat-item">
              <span className="stat-label">Market Impact</span>
              <p>{event.stats.marketImpact}</p>
            </div>
            <div className="stat-item">
              <span className="stat-label">Timeframe</span>
              <p>{event.stats.timeframe}</p>
            </div>
            <div className="stat-item">
              <span className="stat-label">Most Affected</span>
              <p>{event.stats.assetClass}</p>
            </div>
          </div>
          
          <div className="portfolio-impact-card">
            <h4>Your Portfolio Impact</h4>
            <div className="impact-value">
              <strong className={event.portfolioImpact < 0 ? 'negative' : 'positive'}>
                {event.portfolioImpact > 0 ? '+' : ''}{event.portfolioImpact.toFixed(1)}%
              </strong>
              <span>Estimated exposure</span>
            </div>
          </div>
          
          {affectedPositions.length > 0 && (
            <div className="affected-holdings">
              <h4>Your Affected Holdings</h4>
              <ul>
                {affectedPositions.map(pos => (
                  <li key={pos.symbol}>
                    <strong>{pos.symbol}</strong>
                    <span>{pos.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="ai-recommendation-card">
            <h4>🤖 AI Recommendation</h4>
            {loadingAI ? (
              <p className="loading">Analyzing event...</p>
            ) : (
              <>
                <p>{aiRecommendation || event.suggestedAction}</p>
                <div className="ai-recommendation-actions">
                  <button className="primary-button" onClick={handleReviewAndAct}>
                    Review & Act on AI Recommendation
                  </button>
                  <span>
                    Save this conflict response and jump straight into Review & Act for this account.
                  </span>
                </div>
              </>
            )}
          </div>
          
          <div className="sources-card">
            <h4>Sources</h4>
            <ul>
              {event.sources.map((source, i) => (
                <li key={i}>
                  <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
      
      {showModal && (
        <RebalanceModal 
          onClose={() => setShowModal(false)} 
          source="event"
          aiRecommendation={aiRecommendation || event.suggestedAction}
          loadingAI={loadingAI}
          onConfirm={onNavigateToReview}
        />
      )}
    </div>
  );
}
