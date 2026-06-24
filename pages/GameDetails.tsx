
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { GamePackage, Game, Order, User } from '../types';

const VALORANT_COUNTRIES = [
  'Bangladesh', 'India', 'Pakistan', 'Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Others'
];

const GameDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | undefined>(dataService.getGames().find(g => g.id === id));
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'upay' | 'wallet' | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  
  const [playerUid, setPlayerUid] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerEmail, setPlayerEmail] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [transactionInfo, setTransactionInfo] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      setGame(dataService.getGames().find(g => g.id === id));
      
      const user = dataService.getCurrentUser();
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);
      
      if (user && loggedIn) {
        setCurrentUser(user);
        // Only set these if they haven't been modified by the user (or simply let them initially)
      }
    };
    
    // Initial user details setup (avoid overriding inputs on every sync)
    const user = dataService.getCurrentUser();
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    if (user && loggedIn) {
      setCurrentUser(user);
      setPlayerEmail(user.email);
      setPlayerPhone(user.phone);
      setPlayerName(user.name);
    }

    const updateGameData = () => {
       setGame(dataService.getGames().find(g => g.id === id));
    };

    window.addEventListener('unika_data_updated', updateGameData);
    return () => window.removeEventListener('unika_data_updated', updateGameData);
  }, [id]);

  if (!game) return <Navigate to="/store" />;

  // Dynamic Theme & Field Logic based on Category
  const isTopUp = game.category === 'Top Up';
  const isSubscription = game.category === 'Subscription';
  const isGiftCard = game.category === 'Gift Card';

  // Specific accent colors based on user request (Netflix-like for Sub, iCloud-like for Gift Card)
  const themeClass = isSubscription ? 'red' : isGiftCard ? 'cyan' : 'indigo';
  const accentColor = isSubscription ? 'from-red-600 to-rose-600' : isGiftCard ? 'from-cyan-500 to-blue-500' : 'from-indigo-600 to-purple-600';
  const accentBorder = isSubscription ? 'border-red-500/50' : isGiftCard ? 'border-cyan-500/50' : 'border-indigo-500/50';
  const accentText = isSubscription ? 'text-red-400' : isGiftCard ? 'text-cyan-400' : 'text-indigo-400';
  const accentBg = isSubscription ? 'bg-red-600' : isGiftCard ? 'bg-cyan-600' : 'bg-indigo-600';
  const accentHover = isSubscription ? 'hover:bg-red-700' : isGiftCard ? 'hover:bg-cyan-700' : 'hover:bg-indigo-700';

  // Logic for fields: Purely Category Driven
  const showNameField = false;
  const showEmailField = isSubscription || isGiftCard; 
  const showPhoneField = isSubscription || isGiftCard;
  const showUidField = isTopUp;
  // Zone field is specific to some Top Up games, we keep it for MLBB/Valorant or generic IDs
  const showZoneField = isTopUp && (game.id.includes('mlbb') || game.id.includes('valorant'));

  const standardPkgs = game.packages.filter(p => !p.type || p.type === 'Standard');
  const offerPkgs = game.packages.filter(p => p.type === 'Weekly' || p.type === 'Monthly');

  const handleCopy = () => {
    navigator.clipboard.writeText('01872537867');
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleProceedToPayment = () => {
    if (!isLoggedIn) {
      alert("You need to login or create an account to place an order.");
      navigate('/login');
      return;
    }

    if (!selectedPackage) return alert("Please select a package first.");
    
    // Validation
    if (showUidField && !playerUid) return alert("Player ID is required for Top Up.");
    if (showEmailField && !playerEmail) return alert("Email address is required for delivery.");

    setShowPayment(true);
    setTimeout(() => {
      const el = document.getElementById('payment-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleConfirmOrder = async () => {
    if (!paymentMethod) return alert("Please select a payment method.");
    if (paymentMethod !== 'wallet' && !transactionInfo) return alert("Please enter Transaction ID.");

    if (paymentMethod === 'wallet') {
      if (!isLoggedIn || !currentUser) return alert("Please login to use wallet balance.");
      if ((currentUser.walletBalance || 0) < (selectedPackage?.price || 0)) {
        return alert(`Insufficient wallet balance. You have ৳${currentUser.walletBalance || 0}, but this package costs ৳${selectedPackage?.price || 0}.`);
      }
    }

    setLoading(true);

    if (paymentMethod === 'wallet') {
      try {
        const deductRes = await dataService.deductWalletBalance(currentUser!.id, selectedPackage!.price);
        if (!deductRes.success) {
          setLoading(false);
          return alert("Payment failed: " + (deductRes.error || "Insufficient balance"));
        }
      } catch (err) {
        setLoading(false);
        return alert("Failed to process wallet payment.");
      }
    } else {
      // Manual payment delay simulate
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const newOrder: Order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      gameId: game.id,
      gameName: game.name,
      packageName: selectedPackage?.label || 'Custom Package',
      price: selectedPackage?.price || 0,
      status: paymentMethod === 'wallet' ? 'Payment Done' : 'Pending',
      date: new Date().toISOString(),
      userId: playerUid || zoneId || playerEmail || 'GUEST',
      customerName: playerName || (currentUser?.name) || 'Guest',
      customerEmail: playerEmail || (currentUser?.email) || 'guest@example.com',
      customerPhone: playerPhone || (currentUser?.phone) || '',
      paymentMethod: paymentMethod!,
      trxId: paymentMethod === 'wallet' ? `WALLET-${Date.now()}` : transactionInfo
    };

    try {
      await dataService.saveOrder(newOrder);
      setLoading(false);
      alert(`Order Successful! Order ID: ${newOrder.id}. We are processing your request.`);
      setTimeout(() => {
        navigate('/orders');
      }, 100);
    } catch (error) {
      console.error("Order process error:", error);
      setLoading(false);
      alert("Something went wrong. Please check your internet connection.");
    }
  };

  const renderPackageButton = (pkg: GamePackage) => (
    <button
      key={pkg.id || Math.random()}
      onClick={() => {
        setSelectedPackage(pkg);
        setShowPayment(false); 
      }}
      className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
        selectedPackage?.id === pkg.id 
          ? `bg-slate-800/80 ring-2 ring-opacity-50 ${isSubscription ? 'border-red-600 ring-red-500/20' : isGiftCard ? 'border-cyan-500 ring-cyan-500/20' : 'border-indigo-600 ring-indigo-500/20'}` 
          : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="block text-lg font-black text-white leading-tight">{pkg.label}</span>
        {pkg.type && pkg.type !== 'Standard' && (
          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${isSubscription ? 'bg-red-500/10 text-red-500 border-red-500/20' : isGiftCard ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
            {pkg.type}
          </span>
        )}
      </div>
      <span className={`font-bold ${accentText}`}>৳{pkg.price}</span>
      {pkg.bonus && <span className="block text-[10px] text-emerald-500 font-bold mt-1 uppercase tracking-widest">{pkg.bonus}</span>}
      
      {selectedPackage?.id === pkg.id && (
        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full animate-ping ${accentBg}`}></div>
      )}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Background Themed Glow */}
      <div className={`fixed inset-0 pointer-events-none opacity-10 blur-[150px] transition-all duration-1000 ${isSubscription ? 'bg-red-600' : isGiftCard ? 'bg-cyan-500' : 'bg-indigo-600'}`}></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative z-10">
        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className={`relative aspect-[3/4] rounded-[40px] overflow-hidden border-2 ${accentBorder} shadow-2xl transition-all`}>
            <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 ${accentBg}`}>
                {game.category}
              </span>
              <h1 className="text-4xl font-black tracking-tighter leading-none">{game.name}</h1>
              <p className="text-slate-400 text-sm mt-2 font-medium">Fast delivery guaranteed.</p>
            </div>
          </div>
          
          {isLoggedIn && currentUser && (
            <div className={`p-6 rounded-3xl border ${accentBorder} bg-slate-900/50 backdrop-blur-md flex items-center gap-4`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${accentBg}`}>
                {currentUser.name[0]}
              </div>
              <div>
                <p className="text-white font-bold">{currentUser.name}</p>
                <p className="text-slate-500 text-xs">{currentUser.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Weekly/Monthly Offers Section */}
          {offerPkgs.length > 0 && (
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-[40px] space-y-6 shadow-2xl relative overflow-hidden">
               <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${accentBg}`}></div>
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <span className={`w-1.5 h-6 rounded-full ${accentBg}`}></span>
                SPECIAL OFFERS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {offerPkgs.map(renderPackageButton)}
              </div>
            </div>
          )}

          {/* Standard Top Up Packages */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-[40px] space-y-6 shadow-2xl">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <span className={`w-1.5 h-6 rounded-full ${accentBg}`}></span>
              SELECT PACKAGE
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {standardPkgs.map(renderPackageButton)}
            </div>
            {standardPkgs.length === 0 && offerPkgs.length === 0 && (
              <div className="text-center py-10 text-slate-500 font-bold italic border-2 border-dashed border-slate-800 rounded-3xl">
                No packages available at the moment.
              </div>
            )}
          </div>

          {/* Details & Info */}
          <div className={`bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-[40px] space-y-8 shadow-2xl transition-all duration-500 ${selectedPackage ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none scale-[0.98]'}`}>
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <span className={`w-1.5 h-6 rounded-full ${accentBg}`}></span>
              DELIVERY DETAILS
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showNameField && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input type="text" placeholder="Your Name" value={playerName} onChange={e => setPlayerName(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              )}
              {showEmailField && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Delivery Email</label>
                  <input type="email" placeholder="email@example.com" value={playerEmail} onChange={e => setPlayerEmail(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              )}
              {showPhoneField && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp Number</label>
                  <input type="tel" placeholder="01XXXXXXXXX" value={playerPhone} onChange={e => setPlayerPhone(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              )}
              {showUidField && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Player ID / UID</label>
                  <input type="text" placeholder="Enter Game UID" value={playerUid} onChange={e => setPlayerUid(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              )}
              {showZoneField && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Server / Zone ID</label>
                  <input type="text" placeholder="Zone ID" value={zoneId} onChange={e => setZoneId(e.target.value)} className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
              )}
            </div>

            {!isLoggedIn ? (
              <button 
                onClick={() => navigate('/login')} 
                className="w-full py-5 text-white bg-slate-700 hover:bg-slate-600 rounded-3xl font-black text-xl shadow-2xl transition-all active:scale-95"
              >
                LOGIN TO ORDER
              </button>
            ) : !showPayment && (
              <button 
                onClick={handleProceedToPayment} 
                className={`w-full py-5 text-white rounded-3xl font-black text-xl shadow-2xl transition-all active:scale-95 ${accentBg} ${accentHover} shadow-indigo-500/20`}
              >
                PROCEED TO PAYMENT
              </button>
            )}
          </div>

          {/* Payment Section */}
          {showPayment && (
            <div id="payment-section" className="bg-slate-950 border-2 border-indigo-500/30 p-10 rounded-[40px] space-y-10 animate-fade-in shadow-3xl relative">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">FINALIZE YOUR ORDER</h2>
                <p className="text-slate-500 text-sm">Send Money to the merchant number below.</p>
              </div>

              <div className="bg-slate-900 p-8 rounded-3xl flex flex-col sm:flex-row justify-between items-center border border-slate-800 gap-6 group">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Merchant bKash/Nagad</p>
                  <span className="text-4xl font-black text-white group-hover:text-indigo-400 transition-colors tracking-tighter">01872537867</span>
                </div>
                <button 
                  onClick={handleCopy} 
                  className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-xl ${copySuccess ? 'bg-emerald-500 text-white' : 'bg-white text-slate-950 hover:bg-indigo-600 hover:text-white'}`}
                >
                  {copySuccess ? '✓ COPIED' : 'COPY NUMBER'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                  { id: 'bkash', label: 'bKash', color: 'bg-[#D12053]', icon: '৳' },
                  { id: 'nagad', label: 'Nagad', color: 'bg-[#F15A22]', icon: '৳' },
                  { id: 'upay', label: 'Upay', color: 'bg-[#FFCC00]', icon: '৳' },
                  { id: 'wallet', label: 'Wallet', color: 'bg-[#6366f1]', icon: '🏦' }
                ].map(m => (
                  <button 
                    key={m.id} 
                    onClick={() => {
                      if (m.id === 'wallet') {
                        if (!isLoggedIn) return alert("Please Login to use wallet.");
                        if ((currentUser?.walletBalance || 0) <= 0) return alert("Your wallet balance is 0. Please top up first.");
                        if ((currentUser?.walletBalance || 0) < (selectedPackage?.price || 0)) return alert("Insufficient wallet balance for this package.");
                      }
                      setPaymentMethod(m.id as any);
                    }} 
                    className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 ${paymentMethod === m.id ? 'bg-white/5 border-indigo-600' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'} ${m.id === 'wallet' && (currentUser?.walletBalance || 0) < (selectedPackage?.price || 0) ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-full ${m.color} flex items-center justify-center font-black text-white text-lg shadow-lg`}>
                      {m.id === 'wallet' ? m.icon : m.label[0]}
                    </div>
                    <div className="text-center">
                      <span className="text-white font-black text-xs uppercase tracking-widest block">{m.label}</span>
                      {m.id === 'wallet' && isLoggedIn && (
                        <span className="text-[8px] text-indigo-400 font-bold">Bal: ৳{currentUser?.walletBalance || 0}</span>
                      )}
                    </div>
                    {paymentMethod === m.id && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs shadow-xl">✓</div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                {paymentMethod !== 'wallet' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Transaction ID / Sender Number</label>
                    <input 
                      type="text" 
                      placeholder="Enter TR6X... or Last 4 Digits" 
                      value={transactionInfo} 
                      onChange={e => setTransactionInfo(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-5 text-white font-mono text-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700" 
                    />
                  </div>
                )}
                
                {paymentMethod === 'wallet' && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-3xl space-y-2 text-center">
                    <p className="text-indigo-400 text-xs font-black uppercase tracking-widest">Paying with Wallet Balance</p>
                    <p className="text-white text-3xl font-black">৳{selectedPackage?.price}</p>
                    <p className="text-slate-500 text-[10px]">Remaining Balance: ৳{(currentUser?.walletBalance || 0) - (selectedPackage?.price || 0)}</p>
                  </div>
                )}

                <button 
                  onClick={handleConfirmOrder} 
                  disabled={loading || (paymentMethod !== 'wallet' && !transactionInfo) || !paymentMethod} 
                  className={`w-full py-6 rounded-3xl font-black text-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${accentBg} ${accentHover} disabled:opacity-50`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      PROCESSING...
                    </>
                  ) : 'CONFIRM ORDER'}
                </button>
                <p className="text-[10px] text-slate-500 text-center font-black uppercase tracking-widest opacity-60">
                  Manual verification takes 1-30 minutes. Order ID will be generated upon confirmation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetails;
