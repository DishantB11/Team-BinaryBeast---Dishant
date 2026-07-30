import React, { useState, useEffect } from 'react';
import { Sparkles, Search } from 'lucide-react';

const quotes = [
  "Stay consistent, you've got this!",
  "Small steps lead to big results.",
  "Discipline over motivation.",
  "Your future self will thank you.",
  "Focus on progress, not perfection.",
  "Deep work yields high returns.",
  "Consistency is the secret to mastery."
];

export const Topbar: React.FC = () => {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  return (
    <header className="fixed top-0 left-[260px] right-0 h-[60px] bg-[#1e1e1e] border-b border-[#3d3d3d] flex items-center justify-between px-6 z-10">
      {/* Sparkle quote */}
      <div className="flex items-center gap-2 w-1/3 min-w-0">
        <Sparkles className="w-4 h-4 text-[#fbbf24] shrink-0" />
        <span className="text-[#a0a0a0] text-sm italic truncate">
          "{quote}"
        </span>
      </div>

      {/* Notion Search Bar Centered */}
      <div className="flex justify-center w-1/3">
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-[#6b6b6b]" />
          </span>
          <input
            type="text"
            placeholder="Search planner..."
            className="w-full bg-[#2d2d2d] border border-[#3d3d3d] rounded-md py-1.5 pl-9 pr-4 text-sm text-white placeholder-[#6b6b6b] focus:outline-none focus:border-[#fbbf24] transition-colors text-center"
            disabled
          />
        </div>
      </div>

      {/* Right spacer for balance */}
      <div className="w-1/3" />
    </header>
  );
};
