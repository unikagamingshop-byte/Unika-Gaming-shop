
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { Order, User } from '../types';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<User | null>(dataService.getCurrentUser());
  const [orders, setOrders] = useState<Order[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpPlatform, setTopUpPlatform] = useState('bKash');
  const [transactionId, setTransactionId] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchData = () => {
      const currentUser = dataService.getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);
      
      const allOrders = dataService.getOrders();
      const userOrders = allOrders.filter(o => o.customerEmail === currentUser.email);
      setOrders(userOrders);
    };

    fetchData();
    window.addEventListener('unika_data_updated', fetchData);
    return () => window.removeEventListener('unika_data_updated', fetchData);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('unika_current_user');
    // FIX: Redirect to home page
    navigate('/');
    window.location.reload();
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (user) {
      setIsUpdating(true);
      const updatedUser = { ...user, password: newPassword };
      const res = await dataService.updateUser(updatedUser);
      if (res.success) {
        setUser(updatedUser);
        alert("Password updated successfully!");
        setShowPasswordModal(false);
        setNewPassword('');
      } else {
        alert("Failed to update password. Please check your connection.");
      }
      setIsUpdating(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (!transactionId) {
      alert("Please provide Sender Number or Transaction ID.");
      return;
    }
    if (user) {
      setIsUpdating(true);
      const topupData = {
        id: `tp-${Date.now()}`,
        userId: user.id,
        userEmail: user.email,
        amount: Number(topUpAmount),
        platform: topUpPlatform,
        transactionId,
        status: 'Pending' as const,
        date: new Date().toISOString()
      };
      
      // Await submission to ensure it hits GAS
      const res = await dataService.submitWalletTopup(topupData);
      
      setShowTopUpModal(false);
      setTopUpAmount('');
      setTransactionId('');
      setIsUpdating(false);

      if (res.success) {
        alert("Wallet top-up request submitted successfully! Our staff will verify it soon.");
      } else {
        alert("Request saved locally but server sync failed. It will sync automatically later. Our staff will see it soon.");
      }
      
      navigate('/orders');
    }
  };

  const resizeImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      setIsUpdating(true);
      setSyncStatus('syncing');
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawBase64 = reader.result as string;
          const compressedBase64 = await resizeImage(rawBase64);
          const updatedUser = { ...user, avatar: compressedBase64 };
          setUser(updatedUser);
          const response = await dataService.updateUser(updatedUser);
          if (response && response.success) {
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 3000);
          } else {
            setSyncStatus('error');
          }
        } catch (error) {
          setSyncStatus('error');
        } finally {
          setIsUpdating(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (isUpdating) return;
    fileInputRef.current?.click();
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="h-40 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-20 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="relative group self-start md:self-auto">
              <div className={`relative ${isUpdating ? 'opacity-50' : ''}`}>
                <img 
                  src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=4f46e5&color=fff&size=200`} 
                  alt="Profile Avatar" 
                  className="w-36 h-36 rounded-3xl border-4 border-slate-900 shadow-2xl object-cover bg-slate-800 transition-transform group-hover:scale-[1.02]"
                />
                {isUpdating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button onClick={triggerFileInput} disabled={isUpdating} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center text-white cursor-pointer">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812-1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
            
            <div className="flex-grow space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black text-white tracking-tight">{user.name}</h1>
                {syncStatus === 'success' && <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-1 rounded-lg border border-emerald-500/20 animate-bounce">SAVED TO SHEETS</span>}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-slate-400">
                <span className="flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" /></svg>{user.email}</span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>{user.phone}</span>
              </div>
            </div>

            <button onClick={handleLogout} className="bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-300 px-8 py-3 rounded-2xl text-sm font-bold border border-slate-700 hover:border-red-500/50 transition-all shadow-lg">Sign Out</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 transition-colors hover:border-slate-700">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-white font-bold">Pro Gamer Account</p>
              </div>
            </div>
            <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 transition-colors hover:border-slate-700">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Orders</p>
              <p className="text-white font-black text-2xl">{user.orderCount}</p>
            </div>
            <div className="bg-indigo-600/10 p-6 rounded-2xl border border-indigo-500/20 transition-colors hover:border-indigo-500/40">
              <p className="text-indigo-400/70 text-xs font-bold uppercase tracking-widest mb-1">Lifetime Spent</p>
              <p className="text-indigo-400 font-black text-3xl tracking-tight">৳{user.totalSpent.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-8 bg-slate-800/20 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-xl">
                💳
              </div>
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Wallet Balance</p>
                <p className="text-white font-black text-4xl tracking-tight">৳{(user.walletBalance || 0).toLocaleString()}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowTopUpModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3 active:scale-95"
            >
              Add Balance
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-black text-white">Recent Purchases</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            {orders.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800/30 border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Order Details</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/20 transition-colors group text-sm">
                      <td className="px-6 py-5">
                        <div className="font-bold text-white">{order.gameName}</div>
                        <div className="text-xs text-slate-500">{order.packageName}</div>
                      </td>
                      <td className="px-6 py-5 font-black text-white">৳{order.price}</td>
                      <td className="px-6 py-5 text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : order.status === 'Failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-20 text-center text-slate-500 font-bold">No orders yet</div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-xl">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> Security
            </h3>
            <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all text-left">
              <div><p className="text-sm font-bold text-white">Update Password</p><p className="text-[10px] text-slate-500">Secure your account</p></div>
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 max-w-md w-full shadow-3xl space-y-6">
            <h3 className="text-2xl font-black text-white text-center">Change Password</h3>
            <input type="password" placeholder="New Password (min 6 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            <div className="flex gap-4">
              <button onClick={handleUpdatePassword} disabled={isUpdating} className="flex-grow py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all disabled:opacity-50">{isUpdating ? 'Saving...' : 'Update Password'}</button>
              <button onClick={() => setShowPasswordModal(false)} className="px-6 py-4 bg-slate-800 text-slate-300 rounded-2xl font-black">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showTopUpModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 max-w-md w-full shadow-3xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x"></div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white">Add Wallet Balance</h3>
              <p className="text-slate-500 text-xs">Top up instantly and buy games faster</p>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Send Money To (Personal)</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">Active</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-white font-black text-2xl tracking-tighter">01872537867</p>
                <button 
                  onClick={() => handleCopy('01872537867')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                  {copied ? 'COPIED!' : 'COPY'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Send the amount to this number via your selected platform, then fill the form below.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Select Platform</label>
                <div className="grid grid-cols-3 gap-3">
                  {['bKash', 'Nagad', 'Upay'].map(p => (
                    <button 
                      key={p}
                      onClick={() => setTopUpPlatform(p)}
                      className={`py-3 rounded-xl border font-bold text-xs transition-all ${topUpPlatform === p ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Amount (৳)</label>
                <input 
                  type="number" 
                  placeholder="Enter amount" 
                  value={topUpAmount} 
                  onChange={(e) => setTopUpAmount(e.target.value)} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black text-lg" 
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Sender Number / Transaction ID</label>
                  <input 
                    type="text" 
                    placeholder="Enter Sender Number or Transaction ID" 
                    value={transactionId} 
                    onChange={(e) => setTransactionId(e.target.value)} 
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button onClick={handleTopUp} disabled={isUpdating} className="flex-grow py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                {isUpdating ? 'Submitting...' : 'Submit Request'}
              </button>
              <button onClick={() => setShowTopUpModal(false)} className="px-6 py-4 bg-slate-800 text-slate-300 rounded-2xl font-black hover:bg-slate-700 transition-colors">Cancel</button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-[10px] text-amber-500 font-bold leading-relaxed">
                <span className="inline-block mr-1">⚠️</span>
                Note: It may take up to 30 minutes for our staff to verify your transaction and update your balance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
