
import React from 'react';
import { Link } from 'react-router-dom';
import { LOGO_URL } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
        <div className="md:col-span-2 space-y-6">
          <Link to="/" className="flex items-center">
            <img src={LOGO_URL} className="h-14 w-14 rounded-full object-cover border-2 border-slate-800" alt="Unika Logo" />
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Unika Gaming Shop is the leading provider of premium in-game currencies and gaming services. Fast, secure, and always reliable.
          </p>
          <div className="flex space-x-4">
            <a 
              href="https://www.facebook.com/profile.php?id=61589286403536" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 shadow-lg shadow-black/20"
              title="Follow us on Facebook"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a 
              href="https://x.com/unikagamingshop" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all transform hover:scale-110 shadow-lg shadow-black/20"
              title="Follow us on X"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Quick Links</h4>
          <ul className="space-y-4 text-slate-400 text-sm">
            <li><Link to="/" className="hover:text-indigo-400 transition-colors">Home</Link></li>
            <li><Link to="/store" className="hover:text-indigo-400 transition-colors">Game Store</Link></li>
            <li><Link to="/orders" className="hover:text-indigo-400 transition-colors">My Orders</Link></li>
            <li><Link to="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">Popular</h4>
          <ul className="space-y-4 text-slate-400 text-sm">
            <li><Link to="/store/pubg-mobile" className="hover:text-indigo-400 transition-colors">PUBG UC</Link></li>
            <li><Link to="/store/valorant" className="hover:text-indigo-400 transition-colors">Valorant VP</Link></li>
            <li><Link to="/store/mlbb" className="hover:text-indigo-400 transition-colors">MLBB Diamonds</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-6">System</h4>
          <ul className="space-y-4 text-slate-400 text-sm">
            <li><Link to="/admin-login" className="hover:text-indigo-400 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Staff Portal
            </Link></li>
            <li><Link to="/support" className="hover:text-indigo-400 transition-colors">Help Center</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-900 text-center">
        <p className="text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} Unika Gaming Shop. partner With Orynx Digital
        </p>
      </div>
    </footer>
  );
};

export default Footer;
