
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { LOGO_URL } from '../constants';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [creds, setCreds] = useState({ id: '', pass: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check local admins first for fast login
    let admins = dataService.getAdmins();
    let matchedAdmin = admins.find(a => 
      a.username === creds.id && a.password === creds.pass
    );

    if (matchedAdmin) {
      // Trigger background sync but don't wait for it
      dataService.fetchInitialData().catch(e => console.warn(e));
      
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminUser', JSON.stringify(matchedAdmin));
      navigate('/admin/dashboard');
    } else {
      // If not in local data, attempt to fetch from server
      try {
        const fetchPromise = dataService.fetchInitialData();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 3000)
        );
        await Promise.race([fetchPromise, timeoutPromise]);
      } catch (err) {
        console.warn("GAS fetch timed out or failed during admin login:", err);
      }
      
      admins = dataService.getAdmins();
      matchedAdmin = admins.find(a => 
        a.username === creds.id && a.password === creds.pass
      );
      
      if (matchedAdmin) {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminUser', JSON.stringify(matchedAdmin));
        navigate('/admin/dashboard');
      } else {
        setError('Invalid ID or Password');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl space-y-8">
        <div className="text-center">
          <img src={LOGO_URL} className="h-20 w-20 mx-auto mb-6 rounded-full object-cover border-4 border-slate-800 shadow-xl" alt="Unika Logo" />
          <h1 className="text-2xl font-black text-white">Admin Access</h1>
          <p className="text-slate-500 text-sm">Sign in to manage Unika Shop</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-center text-sm animate-shake">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Username</label>
              <input
                type="text"
                required
                placeholder="Enter username"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                onChange={(e) => setCreds({...creds, id: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                onChange={(e) => setCreds({...creds, pass: e.target.value})}
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-black text-lg shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : 'Login to Staff Portal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
