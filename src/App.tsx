import { useState } from 'react';
import { Splitter } from './components/Splitter';
import { Compress } from './components/Compress';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'split' | 'compress'>('split');

  return (
    <div className="container">
      <header>
        <h1>PDF Toolkit Pro</h1>
        <p>Extract pages or compress PDF files locally</p>
      </header>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'split' ? 'active' : ''}`}
          onClick={() => setActiveTab('split')}
        >
          Split PDF
        </button>
        <button 
          className={`tab-btn ${activeTab === 'compress' ? 'active' : ''}`}
          onClick={() => setActiveTab('compress')}
        >
          Compress PDF
        </button>
      </div>

      {activeTab === 'split' ? <Splitter /> : <Compress />}
    </div>
  );
}

export default App;
