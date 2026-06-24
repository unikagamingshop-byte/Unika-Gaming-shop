
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { Order, User, WalletTopUp } from '../types';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [topups, setTopups] = useState<WalletTopUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = dataService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    const fetchData = () => {
      const allOrders = dataService.getOrders();
      const userOrders = allOrders.filter(o => o.customerEmail === currentUser.email);
      setOrders(userOrders);

      const allTopups = dataService.getWalletTopups();
      const userTopups = allTopups.filter(t => t.userEmail === currentUser.email);
      setTopups(userTopups);

      setIsLoading(false);
    };

    fetchData();
    window.addEventListener('unika_data_updated', fetchData);
    return () => window.removeEventListener('unika_data_updated', fetchData);
  }, [navigate]);

  // Calculate total spent from actual orders
  const totalSpent = orders
    .filter(o => o.status === 'Completed' || o.status === 'Payment Done')
    .reduce((acc, curr) => acc + curr.price, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-20 space-y-10 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">My Orders</h1>
          <p className="text-slate-400">Track your past purchases and top-up history for <span className="text-indigo-400 font-bold">{user?.email}</span></p>
        </div>
        <div className="bg-indigo-600/10 border border-indigo-500/20 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-lg shadow-indigo-500/5">
          <span className="text-slate-300 text-sm font-medium">Total Spent:</span>
          <span className="text-2xl font-black text-indigo-400">৳{totalSpent.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
        {(orders.length > 0 || topups.length > 0) ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-800">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Reference ID</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Item / Type</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Amount</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Date & Time</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  ...orders.map(o => ({ type: 'order' as const, data: o, date: new Date(o.date) })),
                  ...topups.map(t => ({ type: 'topup' as const, data: t, date: new Date(t.date) }))
                ].sort((a, b) => b.date.getTime() - a.date.getTime()).map((item) => {
                  const dateStr = item.date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  const timeStr = item.date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  if (item.type === 'order') {
                    const order = item.data;
                    return (
                      <tr key={order.id} className="hover:bg-indigo-500/5 transition-colors group">
                        <td className="px-6 py-5 font-mono text-sm text-indigo-400 group-hover:text-indigo-300 font-bold">{order.id}</td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{order.gameName}</div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{order.packageName}</div>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-400 font-medium">Player ID: {order.userId}</td>
                        <td className="px-6 py-5 font-black text-white text-lg">৳{order.price}</td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-300 text-sm">{dateStr}</div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{timeStr}</div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                            order.status === 'Completed' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : order.status === 'Payment Done'
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                : order.status === 'Failed'
                                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                  : 'bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  } else {
                    const topup = item.data;
                    return (
                      <tr key={topup.id} className="hover:bg-emerald-500/5 transition-colors group bg-slate-800/10">
                        <td className="px-6 py-5 font-mono text-sm text-emerald-400 group-hover:text-emerald-300 font-bold">{topup.id}</td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">Wallet Add Balance</div>
                          <div className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">Platform: {topup.platform}</div>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-400 font-medium">ID/No: {topup.transactionId}</td>
                        <td className="px-6 py-5 font-black text-white text-lg">৳{topup.amount}</td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-slate-300 text-sm">{dateStr}</div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{timeStr}</div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                            topup.status === 'Completed' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : topup.status === 'Failed'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : 'bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse'
                          }`}>
                            {topup.status}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-slate-600">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">No History Found</h3>
              <p className="text-slate-500 max-w-xs mx-auto">You haven't made any purchases or top-up requests yet. Your history will appear here once you engage with the shop.</p>
            </div>
            <button 
              onClick={() => navigate('/store')}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              GO TO STORE
            </button>
          </div>
        )}
      </div>
      
      {/* Help Banner */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-white font-bold">Have an issue with an order?</h4>
            <p className="text-slate-500 text-sm">Our support team is available 24/7 to assist you.</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/support')}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default Orders;
