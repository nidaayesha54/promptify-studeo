import React, { useState } from 'react';
import StoryGenerator from './components/StoryGenerator';
import Chatbot from './components/Chatbot';

type Tab = 'story' | 'chat';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('story');

  const header = (
    <div className="text-center mb-8">
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
        AI Story Weaver
      </h1>
      <p className="text-slate-400 mt-2">
        Your creative partner for storytelling and conversation.
      </p>
    </div>
  );

  const tabs = (
    <div className="flex justify-center mb-8 border-b border-slate-700">
      <TabButton
        label="Story Generator"
        isActive={activeTab === 'story'}
        onClick={() => setActiveTab('story')}
      />
      <TabButton
        label="Chatbot"
        isActive={activeTab === 'chat'}
        onClick={() => setActiveTab('chat')}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {header}
        {tabs}
        <main>
          {activeTab === 'story' && <StoryGenerator />}
          {activeTab === 'chat' && <Chatbot />}
        </main>
      </div>
    </div>
  );
};

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  const activeClasses = 'border-purple-500 text-purple-400';
  const inactiveClasses = 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600';

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-lg font-medium border-b-2 transition-colors duration-200 focus:outline-none ${isActive ? activeClasses : inactiveClasses}`}
    >
      {label}
    </button>
  );
};

export default App;
