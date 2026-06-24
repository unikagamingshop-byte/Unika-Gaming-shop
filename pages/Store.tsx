
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import GameCard from '../components/GameCard';
import { Game } from '../types';

const Store: React.FC = () => {
  const [games, setGames] = useState<Game[]>(dataService.getGames());
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = () => setGames(dataService.getGames());
    fetchData();
    window.addEventListener('unika_data_updated', fetchData);
    return () => window.removeEventListener('unika_data_updated', fetchData);
  }, []);

  const filters = ['All', 'Top Up', 'Gift Card', 'Subscription'];

  const filteredGames = games.filter(game => {
    const matchesFilter = activeFilter === 'All' || game.category === activeFilter;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="space-y-6">
        <h1 className="text-4xl font-extrabold text-white text-center">Gaming Store</h1>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-semibold border ${activeFilter === f ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80">
              <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800 border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {filteredGames.map(game => <GameCard key={game.id} game={game} />)}
      </div>
    </div>
  );
};

export default Store;
