
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../services/dataService';
import GameCard from '../components/GameCard';
import { Game } from '../types';

const Home: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [sliderGames, setSliderGames] = useState<Game[]>([]);
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = () => {
      const allGames = dataService.getGames();
      const settings = dataService.getSettings();
      setGames(allGames);
      const filtered = allGames.filter(g => g.isSlider);
      setSliderGames(filtered.length > 0 ? filtered : allGames.slice(0, 5));

      const fGames = allGames.filter(g => g.isFeatured);
      setFeaturedGames(fGames.length > 0 ? fGames : allGames.slice(0, 6));
    };
    fetchData();
    window.addEventListener('unika_data_updated', fetchData);
    return () => window.removeEventListener('unika_data_updated', fetchData);
  }, []);

  useEffect(() => {
    if (sliderGames.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderGames.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliderGames.length]);

  return (
    <div className="space-y-24 pb-24">
      {/* Premium Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-slate-950"></div>
          {/* Animated Glows */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
          
          {/* Background Slider Image */}
          <div className="absolute inset-0 opacity-15 overflow-hidden">
             {sliderGames.map((game, idx) => (
                <img 
                  key={`bg-${game.id}`}
                  src={game.image} 
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${currentSlide === idx ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
                  alt=""
                />
             ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/20"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Official Top-Up Partner
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter">
                UNIKA <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">GAMING</span> <br />
                EXPERIENCE
              </h1>
              
              <p className="text-xl text-slate-400 max-w-xl leading-relaxed font-medium">
                Instant delivery for PUBG UC, Valorant VP, MLBB Diamonds, and more. 
                Experience the fastest and most secure gaming shop in the market.
              </p>

              <div className="flex flex-wrap gap-5 pt-6">
                <Link
                  to="/store"
                  className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-indigo-500/30 flex items-center gap-3 group active:scale-95"
                >
                  START SHOPPING
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  to="/orders"
                  className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black text-lg transition-all backdrop-blur-sm active:scale-95"
                >
                  TRACK ORDER
                </Link>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-8 pt-10 border-t border-white/5">
                <div>
                  <p className="text-2xl font-black text-white">1M+</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Users</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">50+</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Games</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">24/7</p>
                  <p className="text-xs font-bold text-slate-500 uppercase">Support</p>
                </div>
              </div>
            </div>

            {/* Right Side: High-End Slider */}
            <div className="hidden lg:block relative">
              <div className="relative w-full h-[600px] flex items-center justify-center">
                <div className="relative w-80 h-[480px]">
                  {sliderGames.map((game, idx) => {
                    const offset = (idx - currentSlide + sliderGames.length) % sliderGames.length;
                    const isActive = offset === 0;
                    
                    return (
                      <div 
                        key={game.id}
                        className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform ${
                          isActive 
                            ? 'z-30 opacity-100 scale-100 translate-x-0 rotate-0' 
                            : offset === 1 
                              ? 'z-20 opacity-40 scale-90 translate-x-32 rotate-6 blur-[1px]' 
                              : offset === sliderGames.length - 1
                                ? 'z-20 opacity-40 scale-90 -translate-x-32 -rotate-6 blur-[1px]'
                                : 'z-0 opacity-0 scale-75'
                        }`}
                      >
                        <Link to={`/store/${game.id}`} className="block h-full group">
                          <div className="h-full bg-slate-900 rounded-[48px] overflow-hidden border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative">
                            <img 
                              src={game.image} 
                              alt={game.name} 
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-10 space-y-3">
                              <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-600/90 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                                {game.category}
                              </span>
                              <h3 className="text-3xl font-black text-white leading-tight">{game.name}</h3>
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                <p className="text-emerald-400 text-xs font-black uppercase tracking-wider">Instant Delivery</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* Vertical slider dots */}
                <div className="absolute right-0 flex flex-col gap-3">
                  {sliderGames.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-1.5 transition-all duration-500 rounded-full ${currentSlide === idx ? 'h-10 bg-indigo-500' : 'h-1.5 bg-white/20'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 mb-16">
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">FEATURED RELEASES</h2>
            <p className="text-slate-400 font-medium">Most popular items requested by our community</p>
          </div>
          <Link to="/store" className="group px-8 py-3.5 bg-white text-slate-950 rounded-2xl font-black text-sm transition-all hover:bg-indigo-600 hover:text-white flex items-center gap-2">
            EXPLORE FULL STORE
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {featuredGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Professional Features Section */}
      <section className="bg-slate-900/30 py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-white">RAPID DELIVERY</h3>
              <p className="text-slate-400 leading-relaxed">Our proprietary automated infrastructure ensures your credits land in your account within minutes of payment verification.</p>
            </div>
            <div className="space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-white">SECURE TRANSACTIONS</h3>
              <p className="text-slate-400 leading-relaxed">We utilize enterprise-grade encryption for all user data and partner with top tier payment processors like bKash and Nagad.</p>
            </div>
            <div className="space-y-6">
              <div className="w-16 h-16 bg-purple-500/10 rounded-3xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              </div>
              <h3 className="text-2xl font-black text-white">GAMER FIRST SUPPORT</h3>
              <p className="text-slate-400 leading-relaxed">Our support team consists of active gamers who understand your needs. We are available 24/7 via live chat and Telegram.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Newsletter / CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-indigo-600 rounded-[64px] p-12 md:p-24 overflow-hidden group shadow-[0_50px_100px_-20px_rgba(79,70,229,0.3)]">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-110"></div>
          <div className="relative z-10 flex flex-col items-center text-center space-y-10">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter max-w-4xl">READY TO LEVEL UP YOUR ACCOUNT?</h2>
            <p className="text-indigo-100 text-xl font-medium max-w-2xl">Join over a million gamers who trust Unika for their instant top-up needs. Secure, fast, and always official.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/store" className="px-12 py-5 bg-white text-indigo-600 rounded-3xl font-black text-lg transition-transform hover:-translate-y-1 active:scale-95 shadow-xl">
                VISIT STORE
              </Link>
              <Link to="/signup" className="px-12 py-5 bg-indigo-900/30 text-white border border-white/20 rounded-3xl font-black text-lg transition-transform hover:-translate-y-1 backdrop-blur-sm active:scale-95">
                CREATE ACCOUNT
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
