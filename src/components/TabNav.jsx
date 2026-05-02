import './TabNav.css';

export default function TabNav({ tabs, activeTab, onTabChange }) {
  return (
    <nav className="tab-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-emoji">{tab.emoji}</span>
          <span className="tab-label">{tab.label.replace(tab.emoji, '').trim()}</span>
        </button>
      ))}
    </nav>
  );
}
