
/**
 * UNIKA GAMING SHOP - DATA SERVICE
 * 
 * IMPORTANT: GOOGLE APPS SCRIPT CODE (Paste this into your Google Sheet Script Editor):
 * 
 * const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
 * const SHOP_NAME = "Unika Gaming Shop";
 * 
 * function doOptions(e) {
 *   return ContentService.createTextOutput("")
 *     .setMimeType(ContentService.MimeType.TEXT)
 *     .setHeaders({
 *       "Access-Control-Allow-Origin": "*",
 *       "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
 *       "Access-Control-Allow-Headers": "Content-Type",
 *       "Access-Control-Max-Age": "86400"
 *     });
 * }
 * 
 * function doGet(e) {
 *   return handleRequest(e, true);
 * }
 * 
 * function doPost(e) {
 *   return handleRequest(e, false);
 * }
 * 
 * function handleRequest(e, isGet) {
 *   // Setup CORS Headers
 *   const headers = {
 *     "Access-Control-Allow-Origin": "*",
 *     "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
 *     "Access-Control-Allow-Headers": "Content-Type"
 *   };
 * 
 *   try {
 *     let request;
 *     if (isGet) {
 *       request = e.parameter.data ? JSON.parse(decodeURIComponent(e.parameter.data)) : { action: 'get_all_data' };
 *     } else {
 *       request = JSON.parse(e.postData.contents);
 *     }
 * 
 *     const { action, payload } = request;
 *     let result;
 *     
 *     switch (action) {
 *       case 'get_all_data': result = {
 *         success: true,
 *         games: getSheetData('Games'),
 *         orders: getSheetData('Orders'),
 *         users: getSheetData('Users'),
 *         chats: getSheetData('Chats'),
 *         settings: getSettings(),
 *         admins: getSheetData('Admins'),
 *         topups: getSheetData('Topups'),
 *         adjustments: getSheetData('Adjustments')
 *       }; break;
 *       case 'update_order': result = updateRowById('Orders', 'id', payload.id, payload); break;
 *       case 'new_order': result = appendRow('Orders', payload); break;
 *       case 'new_user': result = appendRow('Users', payload); break;
 *       case 'update_user': result = updateRowById('Users', 'email', payload.email, payload); break;
 *       case 'update_game': result = upsertRow('Games', 'id', payload.id, payload); break;
 *       case 'delete_game': result = deleteRowById('Games', 'id', payload.id); break;
 *       case 'new_chat_message': result = appendRow('Chats', payload); break;
 *       case 'update_settings': result = saveSettings(payload); break;
 *       case 'new_topup': result = appendRow('Topups', payload); break;
 *       case 'update_topup': result = updateRowById('Topups', 'id', payload.id, payload); break;
 *       case 'save_admin': result = upsertRow('Admins', 'id', payload.id, payload); break;
 *       case 'delete_admin': result = deleteRowById('Admins', 'id', payload.id); break;
 *       case 'new_adjustment': result = appendRow('Adjustments', payload); break;
 *       default: result = { success: false, error: "Invalid Action" }; break;
 *     }
 * 
 *     // Return with CORS headers
 *     let output = ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
 *     return output;
 *   } catch (err) { 
 *     return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
 *   }
 * }
 * 
 * function getSheetData(name) {
 *   const sheet = getOrCreateSheet(name);
 *   const data = sheet.getDataRange().getValues();
 *   if (data.length < 2) return [];
 *   const headers = data[0];
 *   return data.slice(1).map(row => {
 *     let obj = {};
 *     headers.forEach((h, i) => {
 *       let val = row[i];
 *       try { if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) val = JSON.parse(val); } catch(e){}
 *       obj[h] = val;
 *     });
 *     return obj;
 *   });
 * }
 * 
 * function updateRowById(sheetName, idKey, idValue, dataObj) {
 *   const sheet = getOrCreateSheet(sheetName);
 *   const data = sheet.getDataRange().getValues();
 *   const headers = data[0];
 *   const colIdx = headers.indexOf(idKey);
 *   if (colIdx === -1) return jsonResponse({ success: false, error: "ID Key " + idKey + " not found" });
 *   for (let i = 1; i < data.length; i++) {
 *     if (data[i][colIdx].toString().toLowerCase() == idValue.toString().toLowerCase()) {
 *       const newRow = headers.map(h => {
 *         let val = dataObj[h];
 *         if (val === undefined) return data[i][headers.indexOf(h)];
 *         return (typeof val === 'object') ? JSON.stringify(val) : val;
 *       });
 *       sheet.getRange(i + 1, 1, 1, headers.length).setValues([newRow]);
 *       return jsonResponse({ success: true });
 *     }
 *   }
 *   return jsonResponse({ success: false, error: "Row with ID " + idValue + " not found" });
 * }
 * 
 * function upsertRow(sheetName, idKey, idValue, dataObj) {
 *   const res = updateRowById(sheetName, idKey, idValue, dataObj);
 *   if (!JSON.parse(res.getContent()).success) return appendRow(sheetName, dataObj);
 *   return res;
 * }
 * 
 * function appendRow(sheetName, dataObj) {
 *   const sheet = getOrCreateSheet(sheetName);
 *   const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
 *   const row = headers.map(h => {
 *     let val = dataObj[h];
 *     return (typeof val === 'object') ? JSON.stringify(val) : (val !== undefined ? val : "");
 *   });
 *   sheet.appendRow(row);
 *   return jsonResponse({ success: true });
 * }
 * 
 * function updateHeadersIfMissing(sheet, schemaHeaders) {
 *   if (!schemaHeaders || schemaHeaders.length === 0) return;
 *   const lastCol = sheet.getLastColumn();
 *   if (lastCol === 0) {
 *     sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
 *     return;
 *   }
 *   const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
 *   const missingHeaders = schemaHeaders.filter(h => !currentHeaders.includes(h));
 *   if (missingHeaders.length > 0) {
 *     sheet.getRange(1, lastCol + 1, 1, missingHeaders.length).setValues([missingHeaders]);
 *   }
 * }
 * 
 * function getOrCreateSheet(name) {
 *   const ss = SpreadsheetApp.getActiveSpreadsheet();
 *   let sheet = ss.getSheetByName(name);
 *   const schema = {
 *     'Games': ['id', 'name', 'category', 'image', 'badge', 'packages', 'createdAt', 'isSlider', 'isFeatured'],
 *     'Orders': ['id', 'gameId', 'gameName', 'packageName', 'price', 'status', 'date', 'userId', 'customerName', 'customerEmail', 'customerPhone', 'paymentMethod', 'trxId'],
 *     'Users': ['id', 'name', 'email', 'phone', 'joinDate', 'avatar', 'password', 'totalSpent', 'orderCount', 'walletBalance'],
 *     'Chats': ['id', 'userId', 'userName', 'role', 'text', 'timestamp'],
 *     'Admins': ['id', 'username', 'password', 'role'],
 *     'Settings': ['data'],
 *     'Topups': ['id', 'userId', 'userEmail', 'amount', 'platform', 'transactionId', 'status', 'date'],
 *     'Adjustments': ['id', 'adminName', 'adminEmail', 'userEmail', 'amount', 'type', 'reason', 'date']
 *   };
 *   if (!sheet) {
 *     sheet = ss.insertSheet(name);
 *     if (schema[name]) sheet.getRange(1, 1, 1, schema[name].length).setValues([schema[name]]);
 *   } else {
 *     if (schema[name]) updateHeadersIfMissing(sheet, schema[name]);
 *   }
 *   return sheet;
 * }
 * 
 * function getSettings() {
 *   const sheet = getOrCreateSheet('Settings');
 *   const data = sheet.getRange(2, 1).getValue();
 *   try { return data ? JSON.parse(data) : { sliderGameIds: [] }; } catch(e) { return { sliderGameIds: [] }; }
 * }
 * 
 * function saveSettings(settings) {
 *   const sheet = getOrCreateSheet('Settings');
 *   sheet.getRange(2, 1).setValue(JSON.stringify(settings));
 *   return jsonResponse({ success: true });
 * }
 * 
 * function jsonResponse(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
 */

import { Game, Order, User, ChatMessage, AdminSettings, AdminUser, WalletTopUp, BalanceAdjustment } from '../types';
import { GAMES as INITIAL_GAMES } from '../constants';

const getGasUrl = () => {
  const envUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
  if (envUrl && envUrl !== 'undefined' && envUrl.length > 10) {
    return envUrl;
  }
  return "https://script.google.com/macros/s/AKfycbx-G5OrogC9UNliA0abBF6Wa3MNSl9idPbgPjk7vEK-VljHmNQ7Asz2m3I8VAo4_mAg/exec";
};

const GAS_WEB_APP_URL = getGasUrl();

// Diagnostic log for deployment troubleshooting
console.log(`[Unika System] Mode: ${import.meta.env.MODE} | DB Connection: ${GAS_WEB_APP_URL.substring(0, 45)}...`);

const STORAGE_KEYS = {
  GAMES: 'unika_games',
  ORDERS: 'unika_orders',
  USERS: 'unika_users',
  CHATS: 'unika_chats',
  SETTINGS: 'unika_settings',
  ADMINS: 'unika_admins',
  TOPUPS: 'unika_topups',
  ADJUSTMENTS: 'unika_adjustments',
  CURRENT_USER: 'unika_current_user'
};

class DataService {
  private static instance: DataService;

  private constructor() {
    this.init();
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private pollingIntervalId: NodeJS.Timeout | null = null;

  private init() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.GAMES)) localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(INITIAL_GAMES));
      if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
      if (!localStorage.getItem(STORAGE_KEYS.USERS)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
      if (!localStorage.getItem(STORAGE_KEYS.CHATS)) localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify([]));
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ sliderGameIds: INITIAL_GAMES.slice(0, 5).map(g => g.id) }));
      if (!localStorage.getItem(STORAGE_KEYS.ADMINS)) localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify([{ id: 'adm-root', username: 'admin', password: 'unika123', role: 'SuperAdmin' }]));
      if (!localStorage.getItem(STORAGE_KEYS.TOPUPS)) localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify([]));
      if (!localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS)) localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify([]));
    } catch (e) {
      console.error("Local storage initialization failed", e);
    }
  }

  public startPolling(intervalMs: number = 30000) {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
    
    // Poll for new data every intervalMs
    this.pollingIntervalId = setInterval(async () => {
      console.log(`[Unika System] Background DB refresh triggered...`);
      await this.fetchInitialData();
      
      // Dispatch a custom event after polling so React components can re-render
      window.dispatchEvent(new Event('unika_data_updated'));
    }, intervalMs);
  }

  public stopPolling() {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  private async safeFetch(url: string, body: any) {
    if (!url || url === 'undefined' || url.length < 10) {
      console.warn(`GAS Sync skipped: No valid URL configured for action [${body.action}].`);
      return { success: false, error: "Database URL not configured. If on Netlify, check VITE_GOOGLE_APPS_SCRIPT_URL environment variable." };
    }

    // Set an explicit timeout (e.g. 30 seconds) to prevent infinite hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      console.log(`GAS Sync Attempt [${body.action}]:`, body.payload);
      
      let response;
      if (body.action === 'get_all_data') {
        const getUrl = `${url}${url.includes('?') ? '&' : '?'}action=get_all_data`;
        response = await fetch(getUrl, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal
        });
      } else {
        response = await fetch(url, {
          method: 'POST',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(body),
          signal: controller.signal
        });
      }
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const text = await response.text();
      console.log(`GAS Response Received [${body.action}]:`, text);
      
      try { 
        const json = JSON.parse(text);
        return json;
      } catch (e) { 
        console.error("Non-JSON GAS response:", text);
        return { success: false, error: "The server responded with an error or non-JSON layout. Check your Apps Script deployment." }; 
      }
    } catch (e) { 
      clearTimeout(timeoutId);
      console.warn("GAS background sync unreachable or timed out (Normal if offline or using AdBlocker).");
      return { success: false, error: `Connection failed: ${e instanceof Error ? e.message : 'Failed to fetch'}` }; 
    }
  }

  async fetchInitialData(): Promise<boolean> {
    const url = GAS_WEB_APP_URL;
    if (!url || url === 'undefined' || url.length < 10) {
      console.warn("Initial data fetch skipped: GAS_WEB_APP_URL is not set.");
      return false;
    }

    try {
      const data = await this.safeFetch(url, { action: 'get_all_data', payload: {} });
      if (data && data.success) {
        console.log("Database Sync Successful: Synchronizing local storage...");
        
        if (data.games && Array.isArray(data.games) && data.games.length > 0) {
          localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(data.games));
        }
        
        if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        if (data.users && Array.isArray(data.users)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
        if (data.orders && Array.isArray(data.orders)) localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
        if (data.chats && Array.isArray(data.chats)) localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(data.chats));
        if (data.admins && Array.isArray(data.admins)) localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(data.admins));
        
        if (data.topups && Array.isArray(data.topups)) {
          const validatedTopups = data.topups.map((t: WalletTopUp) => ({
            ...t,
            id: t.id || `tp-legacy-${t.transactionId}-${new Date(t.date).getTime()}`
          }));
          localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify(validatedTopups));
        }
        
        if (data.adjustments && Array.isArray(data.adjustments)) {
          localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(data.adjustments));
        }
        
        const current = this.getCurrentUser();
        if (current && data.users) {
          const freshUser = (data.users as User[]).find(u => u.email.toLowerCase().trim() === current.email.toLowerCase().trim());
          if (freshUser) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(freshUser));
          }
        }
        return true;
      } else {
        console.warn("Database Sync Error:", data?.error || "Unknown error");
      }
    } catch (err) {
      console.error("Critical error during initial data fetch:", err);
    }
    return false;
  }

  async syncWithGAS(action: string, payload: any) {
    return await this.safeFetch(GAS_WEB_APP_URL, { action, payload });
  }

  getGames(): Game[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GAMES);
      let gamesList = stored ? JSON.parse(stored) : null;
      if (!gamesList || !Array.isArray(gamesList) || gamesList.length === 0) {
        gamesList = INITIAL_GAMES;
        localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(INITIAL_GAMES));
      }
      return gamesList;
    } catch(e) {
      console.warn("Storage Error [GAMES]:", e);
      return INITIAL_GAMES;
    }
  }

  async saveGame(gameData: Partial<Game>) {
    const games = this.getGames();
    const index = games.findIndex(g => g.id === gameData.id);
    let updatedGame = index > -1 ? { ...games[index], ...gameData } : { id: gameData.id, ...gameData, createdAt: new Date().toISOString() };
    if (index > -1) games[index] = updatedGame as Game; else games.push(updatedGame as Game);
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
    return await this.syncWithGAS('update_game', updatedGame);
  }

  async deleteGame(id: string) {
    const games = this.getGames().filter(g => g.id !== id);
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
    return await this.syncWithGAS('delete_game', { id });
  }

  getOrders(): Order[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      console.warn("Storage Error [ORDERS]:", e);
      return [];
    }
  }

  async saveOrder(order: Order) {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index > -1) {
      orders[index] = order;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      const res = await this.syncWithGAS('update_order', order);
      return res;
    } else {
      orders.unshift(order);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.updateUserSpend(order.customerEmail, order.price);
      return await this.syncWithGAS('new_order', order);
    }
  }

  async deductWalletBalance(userId: string, amount: number): Promise<{ success: boolean; error?: string }> {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return { success: false, error: "User not found" };
    
    if ((users[userIndex].walletBalance || 0) < amount) {
      return { success: false, error: "Insufficient balance" };
    }

    users[userIndex].walletBalance = (users[userIndex].walletBalance || 0) - amount;
    users[userIndex].totalSpent = (users[userIndex].totalSpent || 0) + amount;
    users[userIndex].orderCount = (users[userIndex].orderCount || 0) + 1;
    
    const res = await this.syncWithGAS('update_user', users[userIndex]);
    if (res.success) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(users[userIndex]));
      }
    }
    return res;
  }

  getUsers(): User[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      console.warn("Storage Error [USERS]:", e);
      return [];
    }
  }

  async loginUser(email: string, password?: string) {
    // Fast path: check local storage first
    let localUsers = this.getUsers();
    let user = localUsers.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    
    // Only use local if user is found and password matches (or if no password is required/set)
    if (user && (!password || !user.password || user.password === password)) {
      // Trigger background sync but don't wait for it
      this.fetchInitialData().catch(e => console.warn(e));
      
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');
      return user;
    }

    // Slow path: if local check failed, fetch from database and try again
    try {
      // Add a simple fallback for the fetch so it doesn't hang indefinitely
      const fetchPromise = this.fetchInitialData();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      );
      await Promise.race([fetchPromise, timeoutPromise]);
    } catch (err) {
      console.warn("GAS fetch timed out or failed during login:", err);
    }
    
    const remoteUsers = this.getUsers();
    user = remoteUsers.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());

    if (user && (!password || !user.password || user.password === password)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');
      return user;
    }
    return null;
  }

  async registerUser(name: string, email: string, phone: string, password?: string) {
    const newUser: User = { 
      id: `u-${Date.now()}`, 
      name, 
      email: email.toLowerCase().trim(), 
      phone, 
      password, // Password is included here
      joinDate: new Date().toISOString(), 
      totalSpent: 0, 
      orderCount: 0,
      walletBalance: 0 
    };
    const users = this.getUsers();
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    localStorage.setItem('isLoggedIn', 'true');
    this.syncWithGAS('new_user', newUser).catch(e => console.warn("Failed to sync new user", e));
    return newUser; // Always return newUser so they don't get stuck if GAS fails
  }

  async updateUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id || u.email.toLowerCase().trim() === user.email.toLowerCase().trim());
    if (index > -1) {
      users[index] = { ...users[index], ...user }; 
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } else {
      users.push(user);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

    // Explicitly include all fields in the payload for Google Sheets
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password, // IMPORTANT: Ensure password is sent to GAS
      joinDate: user.joinDate,
      avatar: user.avatar, 
      totalSpent: user.totalSpent,
      orderCount: user.orderCount,
      walletBalance: user.walletBalance
    };
    
    return await this.syncWithGAS('update_user', payload);
  }

  private updateUserSpend(email: string, amount: number) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (index > -1) {
      users[index].totalSpent += amount;
      users[index].orderCount += 1;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.syncWithGAS('update_user', users[index]);
    }
  }

  getAdmins(): AdminUser[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ADMINS);
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  }

  async saveAdmin(admin: AdminUser) {
    const admins = this.getAdmins();
    const index = admins.findIndex(a => a.id === admin.id);
    if (index > -1) admins[index] = admin; else admins.push(admin);
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
    return await this.syncWithGAS('save_admin', admin);
  }

  async deleteAdmin(id: string) {
    const admins = this.getAdmins().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
    return await this.syncWithGAS('delete_admin', { id });
  }

  getSettings(): AdminSettings {
    try {
      const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      let parsedSettings = settings ? JSON.parse(settings) : null;
      if (!parsedSettings || !parsedSettings.sliderGameIds || parsedSettings.sliderGameIds.length === 0) {
        parsedSettings = { 
          sliderGameIds: INITIAL_GAMES.slice(0, 5).map(g => g.id),
          featuredGameIds: INITIAL_GAMES.slice(0, 6).map(g => g.id)
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsedSettings));
      }
      if (!parsedSettings.featuredGameIds) {
        parsedSettings.featuredGameIds = parsedSettings.sliderGameIds.slice(0, 6);
      }
      return parsedSettings;
    } catch(e) {
      return { 
        sliderGameIds: INITIAL_GAMES.slice(0, 5).map(g => g.id),
        featuredGameIds: INITIAL_GAMES.slice(0, 6).map(g => g.id)
      };
    }
  }

  saveSettings(settings: AdminSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.syncWithGAS('update_settings', settings);
  }

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch(e) {
      console.warn("Storage Error [CURRENT_USER]:", e);
      return null;
    }
  }

  getChats(): ChatMessage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHATS);
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  }

  async saveChatMessage(msg: ChatMessage) {
    const chats = this.getChats();
    chats.push(msg);
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    return await this.syncWithGAS('new_chat_message', msg);
  }

  getWalletTopups(): WalletTopUp[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TOPUPS);
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  }

  async submitWalletTopup(topup: WalletTopUp) {
    const topups = this.getWalletTopups();
    const validatedTopup = {
      ...topup,
      id: topup.id || `tp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };
    topups.unshift(validatedTopup);
    localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify(topups));
    return await this.syncWithGAS('new_topup', validatedTopup);
  }

  async updateWalletTopup(topup: WalletTopUp) {
    const topups = this.getWalletTopups();
    const index = topups.findIndex(t => (t.id && t.id === topup.id) || (t.transactionId === topup.transactionId && t.date === topup.date));
    if (index > -1) {
      topups[index] = { ...topups[index], ...topup };
      localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify(topups));
      return await this.syncWithGAS('update_topup', topups[index]);
    }
    return { success: false, error: "Topup not found" };
  }

  async approveWalletTopup(topupId: string) {
    const topups = this.getWalletTopups();
    // Robust find: try by ID first, then by matching properties
    let index = topups.findIndex(t => t.id === topupId);
    
    if (index === -1) {
      // Fallback for legacy items or when transactionId is passed as topupId
      index = topups.findIndex(t => t.status === 'Pending' && (t.id === topupId || t.transactionId === topupId));
    }

    if (index > -1 && topups[index].status === 'Pending') {
      const topup = { ...topups[index] }; // Work on a copy
      
      // Update user balance first
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.email.toLowerCase().trim() === topup.userEmail.toLowerCase().trim());
      
      if (userIndex > -1) {
        const user = { ...users[userIndex] };
        user.walletBalance = (user.walletBalance || 0) + topup.amount;
        
        // Sync user update to GAS first
        console.log("Syncing user balance update to GAS for:", topup.userEmail);
        const userRes = await this.syncWithGAS('update_user', user);
        if (!userRes.success) {
          console.error("User sync failed:", userRes.error);
          return { success: false, error: "Failed to update user balance in database: " + userRes.error };
        }

        // Successfully synced user to GAS, now update locally
        users[userIndex] = user;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.email.toLowerCase().trim() === user.email.toLowerCase().trim()) {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        }
      } else {
        console.error("User profiles:", users.map(u => u.email));
        console.error("Target user email from topup:", topup.userEmail);
        return { success: false, error: "Critical Error: User profile (" + topup.userEmail + ") not found in database. Cannot add balance." };
      }
      
      // Now update topup status
      topup.status = 'Completed';
      
      // Update local storage for topups
      const updatedTopups = [...topups];
      updatedTopups[index] = topup;
      localStorage.setItem(STORAGE_KEYS.TOPUPS, JSON.stringify(updatedTopups));
      
      console.log("Syncing topup status update to GAS...");
      // Wrap topup in a way that GAS updateRowById can find it if id is missing in sheet
      const syncPayload = { ...topup };
      
      const topupRes = await this.syncWithGAS('update_topup', syncPayload);
      if (!topupRes.success) {
        console.warn("Topup status sync failed but user balance was updated:", topupRes.error);
        // We still return true because balance was added, but warn about status
      }
      return { success: true };
    }
    return { success: false, error: "Topup request not found or already processed. Status might be " + (topups[index]?.status || 'Unknown') };
  }

  getAdjustments(): BalanceAdjustment[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  }

  async saveAdjustment(adjustment: BalanceAdjustment) {
    const adjustments = this.getAdjustments();
    adjustments.unshift(adjustment);
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
    return await this.syncWithGAS('new_adjustment', adjustment);
  }
}

export const dataService = DataService.getInstance();
