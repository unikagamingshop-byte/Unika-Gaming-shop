
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const [imgError, setImgError] = useState(false);
  
  // High quality gaming placeholder if user provided "log" (logo) is broken
  const fallbackImage = `https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800`;

  // Category based styling
  const isSubscription = game.category === 'Subscription';
  const isGiftCard = game.category === 'Gift Card';
  
  const accentColor = isSubscription ? 'indigo-600' : isGiftCard ? 'cyan-500' : 'indigo-600';
  const accentText = isSubscription ? 'text-red-600' : isGiftCard ? 'text-cyan-600' : 'text-indigo-600';

  return (
    <Link 
      to={`/store/${game.id}`}
      className="group relative flex flex-col bg-slate-900 rounded-[28px] overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all duration-500 shadow-xl hover:shadow-indigo-500/10 transform hover:-translate-y-2"
    >
      {/* Category Accent Stripe */}
      <div className={`h-1 w-full absolute top-0 left-0 z-20 transition-all duration-500 ${isSubscription ? 'bg-red-600' : isGiftCard ? 'bg-cyan-500' : 'bg-indigo-600 opacity-0 group-hover:opacity-100'}`}></div>

      {/* Image Area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-800">
        <img 
          src={imgError ? fallbackImage : (game.image || fallbackImage)} 
          alt={game.name} 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Floating Badge */}
        {game.badge && (
          <div className="absolute top-4 right-4">
            <span className={`bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2 uppercase tracking-[0.1em]`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSubscription ? 'bg-red-500' : isGiftCard ? 'bg-cyan-500' : 'bg-indigo-500'}`}></span>
              {game.badge}
            </span>
          </div>
        )}
        
        {/* Hover Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>
      
      {/* White Footer Area */}
      <div className="bg-white p-5 text-center flex flex-col items-center justify-center min-h-[80px]">
        <h3 className="text-slate-950 font-black text-sm sm:text-lg leading-tight truncate w-full group-hover:text-indigo-600 transition-colors">
          {game.name}
        </h3>
        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 opacity-80 ${accentText}`}>
          {game.category} Store
        </p>
      </div>
      
      {/* Interactive Overlay Ring */}
      <div className={`absolute inset-0 border-2 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none scale-95 group-hover:scale-100 duration-500 ${isSubscription ? 'border-red-600' : isGiftCard ? 'border-cyan-500' : 'border-indigo-600'}`}></div>
    </Link>
  );
};

export default GameCard;
