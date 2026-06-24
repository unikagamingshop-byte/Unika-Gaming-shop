
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LOGO_URL } from '../constants';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
  }, [location]);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Store', path: '/store' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'My Orders', path: '/orders' },
    { name: 'IA Support', path: '#support', isAction: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSupportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-ai-chat'));
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <img 
                  src={LOGO_URL} 
                  className="relative h-14 w-14 rounded-full object-cover border-2 border-slate-800 group-hover:border-indigo-500 transition-all shadow-xl" 
                  alt="Unika Gaming Shop Logo" 
                />
              </div>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1">
              {navItems.map((item) => (
                item.isAction ? (
                  <button
                    key={item.name}
                    onClick={handleSupportClick}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                    {item.name}
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      isActive(item.path)
                        ? 'text-indigo-400 bg-indigo-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              ))}
              
              <div className="ml-4 h-6 w-px bg-slate-800"></div>

              {isLoggedIn ? (
                <Link
                  to="/profile"
                  className="ml-4 flex items-center gap-2 p-1.5 pr-4 pl-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700 group"
                >
                  <img 
                    src={`https://ui-avatars.com/api/?name=User&background=6366f1&color=fff`} 
                    className="w-8 h-8 rounded-full border border-slate-600 group-hover:border-indigo-500 transition-colors" 
                    alt="User" 
                  />
                  <span className="text-sm font-bold text-white">Profile</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="ml-4 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                >
                  LOGIN SESSION
                </Link>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 animate-in slide-in-from-top-4 duration-300">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navItems.map((item) => (
              item.isAction ? (
                <button
                  key={item.name}
                  onClick={handleSupportClick}
                  className="w-full text-left block px-4 py-3 rounded-xl text-base font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-3"
                >
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                  {item.name}
                </button>
              ) : (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                    isActive(item.path)
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.name}
                </Link>
              )
            ))}
            {!isLoggedIn ? (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center mt-6 px-4 py-4 rounded-xl bg-indigo-600 text-white font-black shadow-xl shadow-indigo-500/20"
              >
                LOGIN SESSION
              </Link>
            ) : (
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center mt-6 px-4 py-4 rounded-xl bg-slate-800 text-white font-black"
              >
                MY PROFILE
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
