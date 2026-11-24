/* ==========================================================================
   Firebase Firestore & Auth Integration with Local Storage Fallback Mode
   ========================================================================== */

// Default Firebase Configuration (Placeholder for User Config)
const defaultFirebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "smart-door-lock-demo.firebaseapp.com",
  projectId: "smart-door-lock-demo",
  storageBucket: "smart-door-lock-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

class StorageService {
  constructor() {
    this.isFirebaseEnabled = false;
    this.db = null;
    this.auth = null;
    this.initLocalStorage();
  }

  initLocalStorage() {
    // Initial Seed Data for local simulation
    if (!localStorage.getItem('smart_door_status')) {
      localStorage.setItem('smart_door_status', JSON.stringify({
        isLocked: true,
        mode: 'standard', // standard, lockdown, autolock, guest
        lastUpdated: new Date().toISOString(),
        updatedBy: 'System Boot'
      }));
    }

    if (!localStorage.getItem('smart_door_users')) {
      const initialUsers = [
        { id: 'usr-1', name: 'Dr. Mohammad Kaif', role: 'Admin', pin: '1234', cardUid: 'A1B2C3D4', status: 'Active', created: '2026-09-01' },
        { id: 'usr-2', name: 'Alex Johnson', role: 'Member', pin: '5678', cardUid: 'E5F6G7H8', status: 'Active', created: '2026-09-15' },
        { id: 'usr-3', name: 'Guest Visitor', role: 'Guest', pin: '9999', cardUid: '00112233', status: 'Active', created: '2026-10-01' }
      ];
      localStorage.setItem('smart_door_users', JSON.stringify(initialUsers));
    }

    if (!localStorage.getItem('smart_door_logs')) {
      const initialLogs = [
        { id: 'log-1', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), user: 'Dr. Mohammad Kaif', method: 'PIN Keypad', status: 'Granted', note: 'Door unlocked via keypad' },
        { id: 'log-2', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), user: 'Unknown', method: 'PIN Keypad', status: 'Denied', note: 'Invalid PIN entry attempt (3321)' },
        { id: 'log-3', timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), user: 'Alex Johnson', method: 'RFID Card', status: 'Granted', note: 'Master Card E5F6G7H8 scanned' },
        { id: 'log-4', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), user: 'Dr. Mohammad Kaif', method: 'Web Remote', status: 'Granted', note: 'Remote unlock from Web Control Panel' },
        { id: 'log-5', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), user: 'System', method: 'Auto-Lock', status: 'Granted', note: 'Door locked automatically after timeout' }
      ];
      localStorage.setItem('smart_door_logs', JSON.stringify(initialLogs));
    }

    if (!localStorage.getItem('smart_door_api_config')) {
      localStorage.setItem('smart_door_api_config', JSON.stringify({
        mode: 'simulated', // 'simulated' or 'esp32_http'
        esp32Ip: '192.168.1.150',
        apiKey: 'SECRET_API_KEY_2026',
        autoLockSeconds: 10
      }));
    }
  }

  // --- Lock Status ---
  getDoorStatus() {
    return JSON.parse(localStorage.getItem('smart_door_status'));
  }

  setDoorStatus(isLocked, updatedBy = 'Web UI', mode = null) {
    const current = this.getDoorStatus();
    const updated = {
      isLocked,
      mode: mode || current.mode,
      lastUpdated: new Date().toISOString(),
      updatedBy
    };
    localStorage.setItem('smart_door_status', JSON.stringify(updated));
    return updated;
  }

  // --- Access Logs ---
  getLogs() {
    return JSON.parse(localStorage.getItem('smart_door_logs')) || [];
  }

  addLog(user, method, status, note = '') {
    const logs = this.getLogs();
    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      user,
      method,
      status,
      note
    };
    logs.unshift(newLog); // prepend latest
    localStorage.setItem('smart_door_logs', JSON.stringify(logs.slice(0, 100))); // keep 100 max
    return newLog;
  }

  // --- Users ---
  getUsers() {
    return JSON.parse(localStorage.getItem('smart_door_users')) || [];
  }

  addUser(name, role, pin, cardUid) {
    const users = this.getUsers();
    const newUser = {
      id: 'usr-' + Date.now(),
      name,
      role,
      pin,
      cardUid: cardUid || 'N/A',
      status: 'Active',
      created: new Date().toISOString().split('T')[0]
    };
    users.push(newUser);
    localStorage.setItem('smart_door_users', JSON.stringify(users));
    return newUser;
  }

  deleteUser(userId) {
    let users = this.getUsers();
    users = users.filter(u => u.id !== userId);
    localStorage.setItem('smart_door_users', JSON.stringify(users));
  }

  verifyPin(pinInput) {
    const users = this.getUsers();
    const match = users.find(u => u.pin === pinInput && u.status === 'Active');
    return match || null;
  }

  verifyCardUid(cardUid) {
    const users = this.getUsers();
    const match = users.find(u => u.cardUid.toLowerCase() === cardUid.toLowerCase() && u.status === 'Active');
    return match || null;
  }

  // --- Configuration ---
  getConfig() {
    return JSON.parse(localStorage.getItem('smart_door_api_config'));
  }

  saveConfig(configData) {
    localStorage.setItem('smart_door_api_config', JSON.stringify(configData));
  }
}

window.storageService = new StorageService();
