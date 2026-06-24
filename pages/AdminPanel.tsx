
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { Game, Order, User, ChatMessage, AdminUser, GamePackage, WalletTopUp, BalanceAdjustment } from '../types';
import { LOGO_URL } from '../constants';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [games, setGames] = useState<Game[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [topups, setTopups] = useState<WalletTopUp[]>([]);
  const [adjustments, setAdjustments] = useState<BalanceAdjustment[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [settings, setSettings] = useState(dataService.getSettings());
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTopup, setSelectedTopup] = useState<WalletTopUp | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Partial<Game>>({ packages: [], category: 'Top Up' });
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', role: 'Staff' as 'Staff' });
  const [isSaving, setIsSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [topupDateFilter, setTopupDateFilter] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adminData = localStorage.getItem('adminUser');
    if (adminData) {
      setCurrentAdmin(JSON.parse(adminData));
    }
  }, []);

  useEffect(() => {
    const fetchLocalData = () => {
      if (isSaving || syncingId) return;
      setGames(dataService.getGames());
      setOrders(dataService.getOrders());
      setUsers(dataService.getUsers());
      setAdmins(dataService.getAdmins());
      setChats(dataService.getChats());
      setTopups(dataService.getWalletTopups());
      setAdjustments(dataService.getAdjustments());
      setSettings(dataService.getSettings());
    };
    
    fetchLocalData();
    window.addEventListener('unika_data_updated', fetchLocalData);
    return () => window.removeEventListener('unika_data_updated', fetchLocalData);
  }, [isSaving, syncingId]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chats, selectedChatUser]);

  useEffect(() => {
    if (activeTab === 'staff' && currentAdmin && currentAdmin.role !== 'SuperAdmin') {
      setActiveTab('dashboard');
    }
  }, [activeTab, currentAdmin]);

  if (!isAdmin) return <Navigate to="/admin-login" />;

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex > -1) {
      const updatedOrder = { ...orders[orderIndex], status };
      const newOrders = [...orders];
      newOrders[orderIndex] = updatedOrder;
      setOrders(newOrders);
      
      setSyncingId(id);
      try {
        const result = await dataService.saveOrder(updatedOrder);
        if (!result.success) {
          alert('Sync Failed: State might revert on next reload.');
        }
      } catch (err) {
        console.error("Sync Error:", err);
      } finally {
        setSyncingId(null);
      }
    }
  };

  const handleSendAdminReply = async () => {
    if (!adminReply.trim() || !selectedChatUser) return;
    
    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      userId: selectedChatUser,
      userName: 'Admin Support',
      role: 'admin',
      text: adminReply,
      timestamp: new Date().toISOString()
    };

    setAdminReply('');
    setMessagesForUser(prev => [...prev, newMsg]);
    await dataService.saveChatMessage(newMsg);
  };

  const [messagesForUser, setMessagesForUser] = useState<ChatMessage[]>([]);
  useEffect(() => {
    if (selectedChatUser) {
      setMessagesForUser(chats.filter(c => c.userId === selectedChatUser));
    }
  }, [selectedChatUser, chats]);

  const groupedChats = chats.reduce((acc, chat) => {
    if (!acc[chat.userId]) {
      acc[chat.userId] = {
        name: chat.userName,
        lastMsg: chat.text,
        time: chat.timestamp,
        messages: []
      };
    }
    acc[chat.userId].messages.push(chat);
    if (new Date(chat.timestamp) > new Date(acc[chat.userId].time)) {
      acc[chat.userId].lastMsg = chat.text;
      acc[chat.userId].time = chat.timestamp;
    }
    return acc;
  }, {} as Record<string, { name: string, lastMsg: string, time: string, messages: ChatMessage[] }>);

  const sortedChatUsers = Object.keys(groupedChats).sort((a, b) => 
    new Date(groupedChats[b].time).getTime() - new Date(groupedChats[a].time).getTime()
  );

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    user.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const toggleFeaturedGame = async (id: string, type: 'slider' | 'featured') => {
    const game = games.find(g => g.id === id);
    if (!game) return;
    
    let updatedGame: Game;
    if (type === 'slider') {
      updatedGame = { ...game, isSlider: !game.isSlider };
    } else {
      updatedGame = { ...game, isFeatured: !game.isFeatured };
    }

    const updatedGames = games.map(g => g.id === id ? updatedGame : g);
    setGames(updatedGames);
    
    try {
      await dataService.saveGame(updatedGame);
    } catch (err) {
      console.error("Failed to update game", err);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (currentAdmin?.role !== 'SuperAdmin') return alert('Only SuperAdmin can manage staff accounts.');
    if (window.confirm('Are you sure you want to delete this staff account?')) {
      await dataService.deleteAdmin(id);
      setAdmins(dataService.getAdmins());
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAdmin?.role !== 'SuperAdmin') return alert('Only SuperAdmin can add new staff.');
    setIsSaving(true);
    try {
      const admin: AdminUser = {
        id: `adm-${Date.now()}`,
        username: newAdmin.username,
        password: newAdmin.password,
        role: newAdmin.role
      };
      await dataService.saveAdmin(admin);
      setAdmins(dataService.getAdmins());
      setIsAdminModalOpen(false);
      setNewAdmin({ username: '', password: '', role: 'Staff' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateTopupStatus = async (topupId: string, transactionId: string, status: WalletTopUp['status']) => {
    const topupsList = [...topups];
    const index = topupsList.findIndex(t => (t.id && t.id === topupId) || (t.transactionId === transactionId));
    
    if (index > -1) {
      if (topupsList[index].status === 'Completed' && status !== 'Completed') {
        if (!window.confirm("This top-up was already completed. Changing status now will NOT automatically deduct balance from the user. Continue?")) return;
      }

      // Update local state immediately for better UI response
      const updatedTopups = [...topups];
      updatedTopups[index] = { ...updatedTopups[index], status };
      setTopups(updatedTopups);

      setSyncingId(topupId || transactionId);
      setIsSaving(true);
      
      try {
        let result;
        if (status === 'Completed') {
          // Special logic for approval (adds balance)
          result = await dataService.approveWalletTopup(topupId || transactionId);
        } else {
          // Standard status update
          result = await dataService.updateWalletTopup(updatedTopups[index]);
        }

        if (result.success) {
          // Re-sync after success to get updated user balance etc
          setTopups(dataService.getWalletTopups());
          setUsers(dataService.getUsers());
          if (selectedTopup) setSelectedTopup(null);
        } else {
          alert('Sync Failed: ' + (result.error || 'Unknown error'));
          // Revert on failure
          setTopups(dataService.getWalletTopups());
        }
      } catch (err) {
        console.error("Sync Error:", err);
        alert('An error occurred during sync.');
        setTopups(dataService.getWalletTopups());
      } finally {
        setSyncingId(null);
        setIsSaving(false);
      }
    }
  };

  const handleApproveTopup = async (id: string | undefined, transactionId?: string) => {
    if (!id && !transactionId) return alert("Error: Topup identification missing.");
    if (!window.confirm("Approve this balance top-up? The amount will be added to the user's wallet.")) return;
    
    await updateTopupStatus(id || '', transactionId || '', 'Completed');
  };

  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');

  const handleManualBalance = async () => {
    if (!selectedUser || !balanceAmount || !balanceReason) return alert("Please fill all fields");
    
    if (currentAdmin?.role !== 'SuperAdmin') {
      return alert("Only SuperAdmins can perform manual balance adjustments.");
    }

    const amount = Number(balanceAmount);
    if (isNaN(amount) || amount <= 0) return alert("Please enter a valid positive amount");

    setIsSaving(true);
    try {
      const currentBalance = selectedUser.walletBalance || 0;
      const newBalance = adjustmentType === 'add' ? currentBalance + amount : currentBalance - amount;
      
      if (newBalance < 0) {
        if (!window.confirm("This will result in a negative balance. Continue?")) {
          setIsSaving(false);
          return;
        }
      }

      const updatedUser = { ...selectedUser, walletBalance: newBalance };
      const res = await dataService.updateUser(updatedUser);
      if (res.success) {
        // Record the adjustment
        const adjustment: BalanceAdjustment = {
          id: `adj-${Date.now()}`,
          adminName: currentAdmin?.username || 'Admin',
          adminEmail: currentAdmin?.username || 'Admin',
          userEmail: selectedUser.email,
          amount: amount,
          type: adjustmentType,
          reason: balanceReason,
          date: new Date().toISOString()
        };
        await dataService.saveAdjustment(adjustment);
        
        setUsers(dataService.getUsers());
        setAdjustments(dataService.getAdjustments());
        setShowAddBalanceModal(false);
        setBalanceAmount('');
        setBalanceReason('');
        alert(`Successfully ${adjustmentType === 'add' ? 'added' : 'deducted'} ৳${amount} ${adjustmentType === 'add' ? 'to' : 'from'} ${selectedUser.email}. Reason: ${balanceReason}`);
      } else {
        alert("Failed to update balance.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectTopup = async (id: string | undefined, transactionId?: string) => {
    if (!id && !transactionId) return alert("Error: Topup identification missing.");
    if (!window.confirm("Reject this top-up?")) return;
    
    await updateTopupStatus(id || '', transactionId || '', 'Failed');
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame.name) return alert("Game name is required");
    setIsSaving(true);
    try {
      // Deep copy and clean up empty packages
      const cleanPackages = (editingGame.packages || [])
        .filter(p => p.label.trim() !== '')
        .map(p => ({
          ...p,
          id: p.id || `pkg-${Math.random().toString(36).substr(2, 9)}`,
          type: p.type || 'Standard'
        }));

      const gameToSave = {
        ...editingGame,
        id: editingGame.id || editingGame.name.toLowerCase().replace(/\s+/g, '-'),
        packages: cleanPackages
      };

      const result = await dataService.saveGame(gameToSave as Game);
      if (result.success) {
        setGames(dataService.getGames());
        setIsGameModalOpen(false);
      } else {
        alert("Failed to save game to server. Changes will persist locally.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving game settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const addPackageRow = () => {
    const pkgs = [...(editingGame.packages || [])];
    pkgs.push({ id: `pkg-${Date.now()}`, label: '', amount: 0, price: 0, type: 'Standard' });
    setEditingGame({ ...editingGame, packages: pkgs });
  };

  const updatePackageRow = (index: number, field: keyof GamePackage, value: any) => {
    const pkgs = [...(editingGame.packages || [])];
    pkgs[index] = { ...pkgs[index], [field]: value };
    setEditingGame({ ...editingGame, packages: pkgs });
  };

  const removePackageRow = (index: number) => {
    const pkgs = [...(editingGame.packages || [])];
    pkgs.splice(index, 1);
    setEditingGame({ ...editingGame, packages: pkgs });
  };

  const Sidebar = () => (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex flex-col items-center gap-2">
          <img src={LOGO_URL} className="h-12 w-12 rounded-full object-cover border-2 border-slate-700 shadow-xl shadow-indigo-500/10" alt="Logo" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff Portal</span>
        </div>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'orders', label: 'Orders', icon: '🛒' },
          { id: 'wallet', label: 'Wallet Requests', icon: '💳' },
          { id: 'adjustments', label: 'Balance Logs', icon: '📝' },
          { id: 'support', label: 'Support Chat', icon: '💬' },
          { id: 'inventory', label: 'Inventory', icon: '🎮' },
          { id: 'customers', label: 'Customers', icon: '👥' },
          ...(currentAdmin?.role === 'SuperAdmin' ? [{ id: 'staff', label: 'Staff Accounts', icon: '🔐' }] : []),
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button onClick={() => { localStorage.removeItem('isAdmin'); navigate('/'); }} className="w-full p-3 text-slate-500 hover:text-red-400 font-bold text-sm transition-colors text-left flex items-center gap-2 group">
          <span className="group-hover:translate-x-1 transition-transform">🚪</span> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex bg-slate-950 min-h-screen">
      <Sidebar />
      <main className="flex-grow p-10 overflow-y-auto flex flex-col">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-3xl font-black text-white tracking-tight">System Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-emerald-500/10 text-emerald-500 p-6 rounded-3xl border border-emerald-500/20 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Revenue</p>
                <p className="text-3xl font-black">৳{orders.filter(o => o.status === 'Completed' || o.status === 'Payment Done').reduce((a, b) => a + b.price, 0).toLocaleString()}</p>
              </div>
              <div className="bg-orange-500/10 text-orange-500 p-6 rounded-3xl border border-orange-500/20 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Orders to Process</p>
                <p className="text-3xl font-black">{orders.filter(o => o.status === 'Pending' || o.status === 'Payment Done').length}</p>
              </div>
              <div className="bg-blue-500/10 text-blue-500 p-6 rounded-3xl border border-blue-500/20 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Wallet Pending</p>
                <p className="text-3xl font-black">{topups.filter(t => t.status === 'Pending').length}</p>
              </div>
              <div className="bg-indigo-500/10 text-indigo-500 p-6 rounded-3xl border border-indigo-500/20 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Customers</p>
                <p className="text-3xl font-black">{users.length}</p>
              </div>
              <div className="bg-purple-500/10 text-purple-500 p-6 rounded-3xl border border-purple-500/20 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Games</p>
                <p className="text-3xl font-black">{games.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                <h3 className="text-xl font-bold text-white">Recent Activity</h3>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={`${order.id}-${order.date}`} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                      <div>
                        <p className="text-white font-bold text-sm">{order.customerName}</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{order.gameName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                        order.status === 'Payment Done' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-orange-500/10 text-orange-500'
                      }`}>{order.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
                <h3 className="text-xl font-bold text-white">Top Spenders</h3>
                <div className="space-y-4">
                  {users.sort((a,b) => b.totalSpent - a.totalSpent).slice(0, 5).map(user => (
                    <div key={user.id || user.email} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <img src={`https://ui-avatars.com/api/?name=${user.name}&background=4f46e5&color=fff`} className="w-8 h-8 rounded-full" alt="" />
                        <div>
                          <p className="text-white font-bold text-sm">{user.name}</p>
                          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{user.orderCount} Orders</p>
                        </div>
                      </div>
                      <p className="text-indigo-400 font-black">৳{user.totalSpent.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="flex-grow flex flex-col space-y-6 h-full animate-fade-in">
            <h1 className="text-3xl font-black text-white">Customer Support</h1>
            <div className="flex-grow flex bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden min-h-[600px] shadow-2xl">
              <div className="w-80 border-r border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-800">
                  <h3 className="text-white font-bold">Conversations</h3>
                </div>
                <div className="flex-grow overflow-y-auto">
                  {sortedChatUsers.map(uId => (
                    <button
                      key={uId}
                      onClick={() => setSelectedChatUser(uId)}
                      className={`w-full p-6 text-left border-b border-slate-800/50 transition-colors flex gap-4 items-center ${selectedChatUser === uId ? 'bg-indigo-600/10' : 'hover:bg-slate-800/50'}`}
                    >
                      <img src={`https://ui-avatars.com/api/?name=${groupedChats[uId].name}&background=4f46e5&color=fff`} className="w-10 h-10 rounded-xl" alt="" />
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-white font-bold text-sm truncate">{groupedChats[uId].name}</p>
                          <span className="text-[10px] text-slate-500">{new Date(groupedChats[uId].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-500 text-xs truncate">{groupedChats[uId].lastMsg}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-grow flex flex-col bg-slate-950/30">
                {selectedChatUser ? (
                  <>
                    <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={`https://ui-avatars.com/api/?name=${groupedChats[selectedChatUser].name}&background=4f46e5&color=fff`} className="w-8 h-8 rounded-lg" alt="" />
                        <div>
                          <p className="text-white font-bold text-sm">{groupedChats[selectedChatUser].name}</p>
                          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Active Now
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div ref={chatScrollRef} className="flex-grow p-8 overflow-y-auto space-y-6">
                      {messagesForUser.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-4 rounded-2xl ${
                            m.role === 'admin' 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                          }`}>
                            <p className="text-sm leading-relaxed">{m.text}</p>
                            <p className="text-[9px] mt-2 opacity-50 font-bold uppercase tracking-widest text-right">
                              {m.role === 'bot' ? 'IA AGENT' : m.userName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-slate-900 border-t border-slate-800">
                      <div className="relative">
                        <textarea
                          placeholder="Type your reply to customer..."
                          value={adminReply}
                          onChange={(e) => setAdminReply(e.target.value)}
                          onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAdminReply(); } }}
                          className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-24"
                        />
                        <button 
                          onClick={handleSendAdminReply}
                          className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-xs transition-all"
                        >
                          SEND REPLY
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 text-4xl">💬</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Support Dashboard</h3>
                      <p className="text-slate-500 text-sm">Select a user to begin live assistance.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-black text-white">Inventory Control</h1>
              <button 
                onClick={() => { setEditingGame({ packages: [], category: 'Top Up' }); setIsGameModalOpen(true); }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-indigo-500/20"
              >
                Add New Game
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {games.map(game => (
                <div key={game.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 group">
                  <div className="relative aspect-square overflow-hidden rounded-2xl">
                    <img src={game.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    <div className="absolute top-2 right-2 bg-slate-950/80 px-3 py-1 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest">{game.category}</div>
                  </div>
                  <h3 className="text-white font-black truncate text-lg">{game.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingGame(game); setIsGameModalOpen(true); }} className="flex-grow py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">Edit</button>
                    <button onClick={() => { if(window.confirm('Delete game?')) dataService.deleteGame(game.id).then(() => setGames(dataService.getGames())) }} className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-xs font-bold transition-colors">🗑️</button>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <button 
                      onClick={() => toggleFeaturedGame(game.id, 'slider')} 
                      className={`flex-grow py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${game.isSlider ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                      {game.isSlider ? '★ Slider' : '☆ Slider'}
                    </button>
                    <button 
                      onClick={() => toggleFeaturedGame(game.id, 'featured')} 
                      className={`flex-grow py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${game.isFeatured ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                      {game.isFeatured ? '★ Home Page' : '☆ Home Page'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-3xl font-black text-white">Wallet Top-up Requests</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter by Date:</label>
                <input 
                  type="date" 
                  value={topupDateFilter}
                  onChange={(e) => setTopupDateFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button 
                  onClick={() => setTopupDateFilter('')}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                >
                  Show All
                </button>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-5">Platform</th>
                      <th className="px-6 py-5">Customer</th>
                      <th className="px-6 py-5">Amount</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {topups
                      .filter(topup => {
                        if (!topupDateFilter) return true;
                        if (!topup.date) return false;
                        try {
                          const topupDate = new Date(topup.date);
                          const localDateStr = `${topupDate.getFullYear()}-${String(topupDate.getMonth() + 1).padStart(2, '0')}-${String(topupDate.getDate()).padStart(2, '0')}`;
                          return localDateStr === topupDateFilter;
                        } catch (e) {
                          return false;
                        }
                      })
                      .map((topup) => (
                      <tr key={topup.id || `${topup.transactionId}-${topup.date}`} className={`hover:bg-slate-800/30 transition-colors ${syncingId === topup.id ? 'opacity-50 animate-pulse' : ''}`}>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-black uppercase border border-indigo-500/20">{topup.platform}</span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-white font-bold text-sm tracking-tight">{topup.userEmail}</p>
                          <p className="text-slate-500 text-[10px] font-mono">{topup.transactionId}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-white font-black">৳{topup.amount}</p>
                        </td>
                        <td className="px-6 py-5">
                          <select 
                            value={topup.status}
                            disabled={syncingId === (topup.id || topup.transactionId)}
                            onChange={(e) => updateTopupStatus(topup.id || '', topup.transactionId, e.target.value as any)}
                            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-none appearance-none cursor-pointer transition-all ${
                              topup.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                              topup.status === 'Failed' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                            <option value="Failed">Failed</option>
                          </select>
                        </td>
                        <td className="px-6 py-5 text-right flex justify-end gap-2">
                          <button onClick={() => setSelectedTopup(topup)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">👁️</button>
                        </td>
                      </tr>
                    ))}
                    {topups.filter(topup => {
                      if (!topupDateFilter) return true;
                      if (!topup.date) return false;
                      try {
                        const topupDate = new Date(topup.date);
                        const localDateStr = `${topupDate.getFullYear()}-${String(topupDate.getMonth() + 1).padStart(2, '0')}-${String(topupDate.getDate()).padStart(2, '0')}`;
                        return localDateStr === topupDateFilter;
                      } catch (e) {
                        return false;
                      }
                    }).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-bold italic">No top-up requests found for this date.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'adjustments' && (
          <div className="space-y-6 animate-fade-in text-white">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-black text-white">Manual Balance History</h1>
              <button 
                onClick={() => window.print()}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700 transition-all flex items-center gap-2"
              >
                🖨️ Print Log
              </button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl printable-area">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-5">Date</th>
                      <th className="px-6 py-5">Managed By</th>
                      <th className="px-6 py-5">Target User</th>
                      <th className="px-6 py-5">Amount</th>
                      <th className="px-6 py-5">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {adjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-5 text-slate-400 text-xs font-medium">
                          {new Date(adj.date).toLocaleString()}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            <p className="text-white font-bold text-sm">{adj.adminName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-indigo-400 font-bold text-sm">{adj.userEmail}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className={`font-black ${adj.type === 'add' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {adj.type === 'add' ? '+' : '-'} ৳{adj.amount}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {adj.reason}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {adjustments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-bold italic">No manual adjustments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * { visibility: hidden; }
                .sidebar, nav, header, button { display: none !important; }
                .printable-area, .printable-area * { visibility: visible; }
                .printable-area { position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white !important; color: black !important; }
                .printable-area table { width: 100%; border: 1px solid #eee; }
                .printable-area th, .printable-area td { padding: 12px; border-bottom: 1px solid #eee; color: black !important; }
                .printable-area tr { background: white !important; }
                .bg-slate-900 { background: white !important; }
                .bg-slate-800\\/50 { background: #f9f9f9 !important; }
                .text-white { color: black !important; }
                .text-indigo-400 { color: #4f46e5 !important; }
                .text-emerald-500 { color: #059669 !important; }
                .text-red-500 { color: #dc2626 !important; }
              }
            ` }} />
          </div>
        )}

        {/* Other Tabs Rendering... */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-3xl font-black text-white">Order History</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filter by Date:</label>
                <input 
                  type="date" 
                  value={orderDateFilter}
                  onChange={(e) => setOrderDateFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button 
                  onClick={() => setOrderDateFilter('')}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                >
                  Show All
                </button>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-5">ID</th>
                      <th className="px-6 py-5">Customer</th>
                      <th className="px-6 py-5">Item</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {orders
                      .filter(order => {
                        if (!orderDateFilter) return true;
                        if (!order.date) return false;
                        try {
                          const orderDate = new Date(order.date);
                          const localDateStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
                          return localDateStr === orderDateFilter;
                        } catch (e) {
                          return false;
                        }
                      })
                      .map((order) => (
                      <tr key={order.id || `${order.customerEmail}-${order.date}`} className={`hover:bg-slate-800/30 transition-colors ${syncingId === order.id ? 'opacity-50 animate-pulse' : ''}`}>
                        <td className="px-6 py-5 text-indigo-400 font-mono text-sm font-bold">{order.id}</td>
                        <td className="px-6 py-5">
                          <p className="text-white font-bold text-sm">{order.customerName}</p>
                          <p className="text-slate-500 text-xs">{order.customerEmail}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-white font-bold text-sm">{order.gameName}</p>
                          <p className="text-slate-500 text-[10px] uppercase font-black">{order.packageName}</p>
                        </td>
                        <td className="px-6 py-5">
                          <select 
                            value={order.status}
                            disabled={syncingId === order.id}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                            className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border-none appearance-none cursor-pointer transition-all ${
                              order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                              order.status === 'Payment Done' ? 'bg-blue-500/10 text-blue-500' :
                              order.status === 'Failed' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Payment Done">Payment Done</option>
                            <option value="Completed">Completed</option>
                            <option value="Failed">Failed</option>
                          </select>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button onClick={() => setSelectedOrder(order)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-xl">👁️</button>
                        </td>
                      </tr>
                    ))}
                    {orders.filter(order => {
                      if (!orderDateFilter) return true;
                      if (!order.date) return false;
                      try {
                        const orderDate = new Date(order.date);
                        const localDateStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
                        return localDateStr === orderDateFilter;
                      } catch (e) {
                        return false;
                      }
                    }).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-bold italic">
                          No orders found for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h1 className="text-3xl font-black text-white">Registered Users</h1>
              <input 
                type="text" 
                placeholder="Search customers..." 
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-80"
              />
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-5">Name</th>
                      <th className="px-6 py-5">Email</th>
                      <th className="px-6 py-5">Activity</th>
                      <th className="px-6 py-5">Investment</th>
                      <th className="px-6 py-5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map((user) => (
                      <tr key={user.id || user.email} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`} className="w-10 h-10 rounded-xl" alt="" />
                            <span className="text-white font-bold">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-400 text-sm">{user.email}</td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-slate-800 rounded-lg text-white font-black text-[10px]">{user.orderCount} Orders</span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-indigo-400 font-black">৳{user.totalSpent.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-5 text-right flex justify-end gap-2">
                          {currentAdmin?.role === 'SuperAdmin' && (
                            <button 
                              onClick={() => { setSelectedUser(user); setShowAddBalanceModal(true); }}
                              className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-xl transition-colors text-xs font-black"
                              title="Add Balance Manually"
                            >
                              + ৳
                            </button>
                          )}
                          <button onClick={() => setSelectedUser(user)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-xl">👤</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-black text-white">Staff Management</h1>
              <button onClick={() => setIsAdminModalOpen(true)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">Add Staff</button>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-800/50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Username</th>
                    <th className="px-6 py-5">Role</th>
                    <th className="px-6 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {admins.map(admin => (
                    <tr key={admin.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-5 text-white font-bold">{admin.username}</td>
                      <td className="px-6 py-5">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${admin.role === 'SuperAdmin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-slate-700 text-slate-300'}`}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {admin.username !== 'admin' && (
                          <button onClick={() => handleDeleteAdmin(admin.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors">🗑️</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* GAME SETTINGS MODAL */}
      {isGameModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] w-full max-w-5xl p-10 space-y-8 overflow-y-auto max-h-[90vh] shadow-2xl relative">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-white tracking-tight">Game Configuration</h2>
              <button onClick={() => setIsGameModalOpen(false)} className="text-slate-500 hover:text-white transition-colors text-2xl">✕</button>
            </div>
            
            <form onSubmit={handleSaveGame} className="space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Game Identity</label>
                   <input type="text" placeholder="e.g. PUBG Mobile" required className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={editingGame.name || ''} onChange={e => setEditingGame({...editingGame, name: e.target.value})} />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Service Category</label>
                   <select className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none" value={editingGame.category} onChange={e => setEditingGame({...editingGame, category: e.target.value as any})}>
                     <option value="Top Up">Top Up Store</option>
                     <option value="Gift Card">Gift Cards</option>
                     <option value="Subscription">Subscriptions</option>
                   </select>
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Thumbnail Asset URL</label>
                   <input type="text" placeholder="https://..." required className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={editingGame.image || ''} onChange={e => setEditingGame({...editingGame, image: e.target.value})} />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Promotion Badge</label>
                   <input type="text" placeholder="e.g. Hot Offer, Instant" className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={editingGame.badge || ''} onChange={e => setEditingGame({...editingGame, badge: e.target.value})} />
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                   <h3 className="text-xl font-black text-white">Item Inventory & Pricing</h3>
                   <button type="button" onClick={addPackageRow} className="px-6 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest border border-indigo-500/20 transition-all">+ Add Package</button>
                 </div>
                 
                 <div className="space-y-4">
                   {(editingGame.packages || []).map((pkg, idx) => (
                     <div key={pkg.id || idx} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-6 bg-slate-950/40 rounded-3xl border border-slate-800 relative group animate-in slide-in-from-right-4 duration-300">
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Label (e.g. 660 UC)</label>
                          <input type="text" placeholder="Package Name" className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-indigo-500" value={pkg.label} onChange={e => updatePackageRow(idx, 'label', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Price (৳)</label>
                          <input type="number" placeholder="৳" className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-indigo-500" value={pkg.price} onChange={e => updatePackageRow(idx, 'price', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Type</label>
                          <select className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 appearance-none" value={pkg.type || 'Standard'} onChange={e => updatePackageRow(idx, 'type', e.target.value)}>
                            <option value="Standard">Standard</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-1">Bonus</label>
                          <input type="text" placeholder="+10% Bonus" className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-indigo-500" value={pkg.bonus || ''} onChange={e => updatePackageRow(idx, 'bonus', e.target.value)} />
                        </div>
                        <div className="flex items-end justify-end">
                          <button type="button" onClick={() => removePackageRow(idx)} className="w-full md:w-auto h-11 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl px-4 transition-colors flex items-center justify-center font-bold">Delete Item</button>
                        </div>
                     </div>
                   ))}
                   {(editingGame.packages || []).length === 0 && (
                     <div className="text-center py-16 bg-slate-950/20 border-2 border-dashed border-slate-800 rounded-[32px] text-slate-600 font-bold italic">No inventory items defined. Start by adding a package.</div>
                   )}
                 </div>
               </div>

               <div className="flex gap-4 pt-6 sticky bottom-0 bg-slate-900 pb-4 border-t border-slate-800 mt-10 pt-10">
                 <button type="submit" disabled={isSaving} className="flex-grow py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black text-xl transition-all shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-4">
                   {isSaving ? (
                     <><svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Synchronizing...</>
                   ) : 'Update Store Inventory'}
                 </button>
                 <button type="button" onClick={() => setIsGameModalOpen(false)} className="px-12 py-5 bg-slate-800 text-slate-300 rounded-[24px] font-black transition-colors">Cancel</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF & ORDER MODALS ... existing functionality preserved */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] w-full max-w-md p-10 space-y-6 shadow-2xl">
            <h2 className="text-2xl font-black text-white">Security Management</h2>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <input type="text" placeholder="Username" required className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} />
              <input type="password" placeholder="Password" required className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Account Role</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newAdmin.role}
                  onChange={e => setNewAdmin({...newAdmin, role: e.target.value as any})}
                >
                  <option value="Staff">Staff (Standard Permissions)</option>
                  <option value="SuperAdmin">SuperAdmin (Full Permissions)</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button type="submit" disabled={isSaving} className="flex-grow py-4 bg-indigo-600 text-white rounded-2xl font-black">Generate Key</button>
                <button type="button" onClick={() => setIsAdminModalOpen(false)} className="px-8 py-4 bg-slate-800 text-slate-300 rounded-2xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] w-full max-w-lg p-10 space-y-8 relative shadow-2xl">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors text-2xl">✕</button>
            <div className="text-center">
              <h2 className="text-2xl font-black text-white tracking-tight">Order Verification</h2>
              <p className="text-indigo-400 font-mono text-sm uppercase tracking-[0.2em]">{selectedOrder.id}</p>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {[
                { label: 'Customer', value: selectedOrder.customerName },
                { label: 'Email', value: selectedOrder.customerEmail },
                { label: 'Product', value: selectedOrder.gameName },
                { label: 'Variant', value: selectedOrder.packageName },
                { label: 'Price (BDT)', value: `৳${selectedOrder.price}` },
                { label: 'Trx ID', value: selectedOrder.trxId },
                { label: 'Player UID', value: selectedOrder.userId },
              ].map(item => (
                <div key={item.label} className="flex justify-between border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  <span className="text-white font-medium text-sm text-right">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
               <button onClick={() => { updateOrderStatus(selectedOrder.id, 'Completed'); setSelectedOrder(null); }} className="flex-grow py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[20px] font-black transition-all">Approve Order</button>
               <button onClick={() => { updateOrderStatus(selectedOrder.id, 'Failed'); setSelectedOrder(null); }} className="flex-grow py-5 bg-red-600/10 text-red-500 rounded-[20px] font-black transition-all">Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Balance Adjustment Modal */}
      {showAddBalanceModal && selectedUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] w-full max-w-md p-10 space-y-8 relative shadow-2xl">
            <button onClick={() => setShowAddBalanceModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors text-2xl">✕</button>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Manual Balance Adjustment</h2>
              <p className="text-slate-400 text-xs">Target: {selectedUser.email}</p>
            </div>

            <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700">
              <button 
                onClick={() => setAdjustmentType('add')}
                className={`flex-grow py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adjustmentType === 'add' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Add Balance
              </button>
              <button 
                onClick={() => setAdjustmentType('subtract')}
                className={`flex-grow py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adjustmentType === 'subtract' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Deduct
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Amount (৳)</label>
                <input 
                  type="number" 
                  placeholder={`Enter amount to ${adjustmentType === 'add' ? 'add' : 'deduct'}`} 
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Reason for Adjustment</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  value={balanceReason}
                  onChange={e => setBalanceReason(e.target.value)}
                >
                  <option value="">Select a reason</option>
                  <option value="Refund Amount">Refund Amount</option>
                  <option value="Cancel Order">Cancel Order</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Loyalty Reward">Loyalty Reward</option>
                  <option value="bKash Payback">bKash Payback</option>
                  <option value="Nagad Payback">Nagad Payback</option>
                  <option value="Upay Payback">Upay Payback</option>
                  <option value="Correction">Correction</option>
                  <option value="Other">Other</option>
                </select>
                {balanceReason === 'Other' && (
                  <input 
                    type="text" 
                    placeholder="Specify other reason" 
                    className="w-full mt-2 bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    onChange={e => setBalanceReason(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button 
                onClick={handleManualBalance}
                disabled={isSaving}
                className={`flex-grow py-5 ${adjustmentType === 'add' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'} text-white rounded-[20px] font-black transition-all shadow-xl disabled:opacity-50`}
              >
                {isSaving ? 'Processing...' : `Confirm ${adjustmentType === 'add' ? 'Addition' : 'Deduction'}`}
              </button>
              <button onClick={() => setShowAddBalanceModal(false)} className="px-8 py-5 bg-slate-800 text-slate-300 rounded-[20px] font-black">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal (SuperAdmin Only deeper details) */}
      {selectedUser && !showAddBalanceModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] w-full max-w-xl p-10 space-y-8 relative shadow-2xl">
            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors text-2xl">✕</button>
            
            <div className="flex flex-col items-center gap-4 border-b border-slate-800 pb-8">
              <img src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=6366f1&color=fff&size=256`} className="w-24 h-24 rounded-3xl object-cover shadow-2xl shadow-indigo-500/20" alt="" />
              <div className="text-center">
                <h2 className="text-2xl font-black text-white tracking-tight">{selectedUser.name}</h2>
                <p className="text-slate-500 font-bold text-sm">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Wallet Balance', value: `৳${selectedUser.walletBalance || 0}`, icon: '💰', color: 'text-emerald-400' },
                { label: 'Total Invested', value: `৳${selectedUser.totalSpent || 0}`, icon: '📈', color: 'text-indigo-400' },
                { label: 'Total Orders', value: selectedUser.orderCount || 0, icon: '📦', color: 'text-orange-400' },
                { label: 'Join Date', value: selectedUser.joinDate ? new Date(selectedUser.joinDate).toLocaleDateString() : 'N/A', icon: '📅', color: 'text-slate-400' },
                { label: 'Phone', value: selectedUser.phone || 'N/A', icon: '📱', color: 'text-blue-400' },
                { label: 'User ID', value: selectedUser.id, icon: '🆔', color: 'text-slate-500' },
              ].map(item => (
                <div key={item.label} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">{item.icon}</span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  </div>
                  <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span> Recent Activity
              </h3>
              <div className="max-h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {orders.filter(o => o.customerEmail === selectedUser.email).length > 0 ? (
                  orders.filter(o => o.customerEmail === selectedUser.email).slice(0, 5).map(o => (
                    <div key={o.id} className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                      <div>
                        <p className="text-white text-xs font-bold">{o.gameName}</p>
                        <p className="text-slate-500 text-[9px] uppercase font-black">{new Date(o.date).toLocaleDateString()}</p>
                      </div>
                      <p className="text-indigo-400 text-xs font-black">৳{o.price}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-600 text-xs italic py-4 text-center">No order history found for this user.</p>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              {currentAdmin?.role === 'SuperAdmin' && (
                <button 
                  onClick={() => setShowAddBalanceModal(true)} 
                  className="flex-grow py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[20px] font-black transition-all shadow-xl shadow-indigo-500/20"
                >
                  Adjust Balance
                </button>
              )}
              <button onClick={() => setSelectedUser(null)} className={`py-5 ${currentAdmin?.role === 'SuperAdmin' ? 'px-8' : 'flex-grow'} bg-slate-800 text-slate-300 rounded-[20px] font-black`}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTopup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] w-full max-w-lg p-10 space-y-8 relative shadow-2xl">
            <button onClick={() => setSelectedTopup(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors text-2xl">✕</button>
            <div className="text-center">
              <h2 className="text-2xl font-black text-white tracking-tight">Wallet Verification</h2>
              <p className="text-indigo-400 font-mono text-sm uppercase tracking-[0.2em]">Ref: {selectedTopup.id}</p>
            </div>
            
            <div className="space-y-4">
              {[
                { label: 'Customer Email', value: selectedTopup.userEmail },
                { label: 'Platform', value: selectedTopup.platform },
                { label: 'Amount (BDT)', value: `৳${selectedTopup.amount}` },
                { label: 'ID / Sender No.', value: selectedTopup.transactionId },
                { label: 'Date', value: new Date(selectedTopup.date).toLocaleString() },
              ].map(item => (
                <div key={item.label} className="flex justify-between border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  <span className="text-white font-medium text-sm text-right">{item.value}</span>
                </div>
              ))}
            </div>

            {selectedTopup.status === 'Pending' ? (
              <div className="flex gap-4">
                <button 
                  onClick={() => handleApproveTopup(selectedTopup.id, selectedTopup.transactionId)} 
                  disabled={isSaving}
                  className="flex-grow py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[20px] font-black transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isSaving && (syncingId === selectedTopup.id || syncingId === selectedTopup.transactionId) ? 'Processing...' : 'Confirm & Add Balance'}
                </button>
                <button 
                  onClick={() => handleRejectTopup(selectedTopup.id, selectedTopup.transactionId)} 
                  disabled={isSaving}
                  className="px-8 py-5 bg-red-600/10 text-red-500 rounded-[20px] font-black transition-all hover:bg-red-500/20 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            ) : (
              <div className={`p-4 rounded-2xl text-center font-black uppercase tracking-widest border ${selectedTopup.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                Request {selectedTopup.status}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
