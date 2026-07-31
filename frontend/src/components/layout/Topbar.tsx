import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';

const quotes = [
  "Focus is the key to achieving your potential, one task at a time.",
  "Stay consistent, you've got this!",
  "Small steps lead to big results.",
  "Discipline over motivation.",
  "Your future self will thank you.",
  "Deep work yields high returns.",
  "Consistency is the secret to mastery.",
];

export const Topbar: React.FC = () => {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  return (
    <header className="fixed top-0 left-[260px] right-0 h-[60px] bg-[#131412] border-b border-[#2a2a2a] flex items-center justify-between px-8 z-10">

      {/* Left — Clear Workspace + Motivational quote */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={() => useStore.getState().clearAll()}
          className="px-3 py-1 bg-[#2a2a2a] hover:bg-red-900/40 hover:text-red-400 text-xs text-[#a0a0a0] rounded-sm transition-all border border-[#333333] shrink-0"
          title="Reset cached tasks and calendar"
        >
          Clear Workspace
        </button>

        <div className="hidden lg:block flex-1 min-w-0">
          <p className="text-sm italic text-[#a0a0a0] border-l-2 border-[#8ea091] pl-3 font-body truncate max-w-md">
            "{quote}"
          </p>
        </div>
      </div>

      {/* Right — Search + Icons */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-52">
          <span className="material-symbols-outlined icon-sm absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]">
            search
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-[#2a2a2a] border border-[#333333] focus:border-[#8ea091] text-[#e4e2e0] text-sm rounded-sm py-1.5 pl-9 pr-4 outline-none transition-colors font-body placeholder-[#6b6b6b]"
            disabled
          />
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[#2a2a2a]" />

        <button
          className="text-[#c3c8c1] hover:text-[#8ea091] transition-colors duration-200"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined icon-lg">notifications</span>
        </button>
        <button
          className="text-[#c3c8c1] hover:text-[#8ea091] transition-colors duration-200"
          aria-label="Account"
        >
          <span className="material-symbols-outlined icon-lg">account_circle</span>
        </button>
      </div>
    </header>
  );
};
