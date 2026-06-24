
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.phone || formData.phone.length < 10) {
      setError('Please enter a valid WhatsApp number');
      return;
    }

    setLoading(true);
    
    try {
      const newUser = await dataService.registerUser(formData.name, formData.email, formData.phone, formData.password);
      
      if (newUser) {
        localStorage.setItem('isLoggedIn', 'true');
        setLoading(false);
        navigate('/profile');
      } else {
        setError('Server synchronization failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to create account. Please check your internet.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-3xl text-white mx-auto mb-6 shadow-xl shadow-indigo-500/20">U</div>
          <h2 className="text-3xl font-black text-white">Create Account</h2>
          <p className="mt-2 text-slate-400">Join Unika Gaming Shop today</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">{error}</div>}
        
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="Enter your name" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">WhatsApp Number</label>
              <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600" placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
              <input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="••••••••" />
            </div>
          </div>

          <div>
            <button type="submit" disabled={loading} className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-xl text-lg font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-indigo-500/20 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {loading ? 'Level Up Account...' : 'Level Up Account'}
            </button>
          </div>
        </form>
        <p className="text-center text-slate-400 text-sm">Already a member? <Link to="/login" className="font-bold text-indigo-400 hover:text-indigo-300">Sign in here</Link></p>
      </div>
    </div>
  );
};

export default SignUp;
