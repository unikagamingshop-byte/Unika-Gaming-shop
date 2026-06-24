
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LiveChat from './components/LiveChat';
import Home from './pages/Home';
import Store from './pages/Store';
import GameDetails from './pages/GameDetails';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Orders from './pages/Orders';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Support from './pages/Support';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import { dataService } from './services/dataService';
import { LOGO_URL } from './constants';

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Initializing Gaming Systems...');

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      setLoadingStatus('Initializing Gaming Systems...');
      // Ensure splash shows for at least 1.5 seconds for aesthetic purposes
      const minWait = new Promise(resolve => setTimeout(resolve, 1500));
      
      setLoadingStatus('Connecting to Database...');
      // Fetch initial data, but timeout after 30 seconds so it doesn't hang forever if GAS is down/slow
      const fetchPromise = (async () => {
        setLoadingStatus('Syncing Data with Server...');
        const result = await dataService.fetchInitialData();
        return result;
      })();
      
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 30000));
      
      try {
        await Promise.all([
          minWait,
          Promise.race([fetchPromise, timeoutPromise])
        ]);
      } catch (err) {
        console.warn("Initial data fetch failed or timed out:", err);
      }
      
      setLoadingStatus('Finalizing Synchronization...');
      // Small delay for clean transition
      await new Promise(resolve => setTimeout(resolve, 800));

      if (mounted) {
        setIsReady(true);
        // Start background polling to keep data in sync with Google Sheets (acting as a server)
        dataService.startPolling(15000);
      }
    };

    initApp();
    
    return () => {
      mounted = false;
      dataService.stopPolling();
    };
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-12">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-2xl animate-pulse"></div>
          <img 
            src={LOGO_URL} 
            className="w-32 h-32 rounded-full object-cover animate-pulse border-4 border-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.5)]" 
            alt="Unika Gaming Shop Logo" 
          />
          <div className="absolute -inset-6 rounded-full border-2 border-indigo-500/10 animate-ping"></div>
        </div>
        <div className="text-center space-y-4">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"></div>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse h-4">
            {loadingStatus}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Routes>
          {/* Admin Routes (No Navbar/Footer) */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          
          {/* Standard Routes */}
          <Route path="*" element={
            <>
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/store/:id" element={<GameDetails />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </main>
              <Footer />
              <LiveChat />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
