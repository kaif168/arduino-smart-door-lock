/* ==========================================================================
   Smart Door Lock & Cyber Security Monitoring Dashboard - Main Application Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  window.app = new SmartDoorLockApp();
});

class SmartDoorLockApp {
  constructor() {
    this.currentPinInput = '';
    this.failedAttemptsCount = 0;
    this.lockoutUntil = null;
    this.autoLockTimer = null;

    this.initElements();
    this.bindEvents();
    this.renderInitialState();
  }

  initElements() {
    // Navigation Tabs
    this.tabLinks = document.querySelectorAll('.tab-link');
    this.tabPanes = document.querySelectorAll('.tab-pane');

    // Lock Visualizer Elements
    this.lockContainer = document.getElementById('lockVisualizerContainer');
    this.lockBtn = document.getElementById('lockIconBtn');
    this.lockIcon = document.getElementById('lockIcon');
    this.lockStateText = document.getElementById('lockStateText');
    this.lockStateSubText = document.getElementById('lockStateSubText');
    this.btnUnlockMain = document.getElementById('btnUnlockMain');
    this.btnLockMain = document.getElementById('btnLockMain');

    // Metrics Header
    this.metricDoorStatus = document.getElementById('metricDoorStatus');
    this.metricTodayAccess = document.getElementById('metricTodayAccess');
    this.metricDeniedAttempts = document.getElementById('metricDeniedAttempts');
    this.metricAlarmStatus = document.getElementById('metricAlarmStatus');

    // Keypad Display
    this.keypadDisplayDots = document.getElementById('keypadDisplayDots');
    this.keypadDisplayStatus = document.getElementById('keypadDisplayStatus');
    this.keyBtns = document.querySelectorAll('.key-btn[data-key]');
    this.btnClearKey = document.getElementById('btnClearKey');
    this.btnSubmitKey = document.getElementById('btnSubmitKey');

    // RFID Simulator
    this.btnScanRfid = document.getElementById('btnScanRfid');
    this.rfidUidInput = document.getElementById('rfidUidInput');

    // Emergency Lockdown
    this.btnLockdownHeader = document.getElementById('btnLockdownHeader');

    // Activity Feed & Tables
    this.activityFeedContainer = document.getElementById('activityFeedContainer');
    this.logsTableBody = document.getElementById('logsTableBody');
    this.usersGrid = document.getElementById('usersGrid');

    // Logs Filtering
    this.logsSearchInput = document.getElementById('logsSearchInput');
    this.filterMethodSelect = document.getElementById('filterMethodSelect');
    this.filterStatusSelect = document.getElementById('filterStatusSelect');
    this.btnExportLogs = document.getElementById('btnExportLogs');

    // Modals
    this.addUserModal = document.getElementById('addUserModal');
    this.btnAddUserOpen = document.getElementById('btnAddUserOpen');
    this.btnAddUserSubmit = document.getElementById('btnAddUserSubmit');
    this.btnCloseModalBtns = document.querySelectorAll('.modal-close, .btn-modal-close');
    
    // Passcode Generator
    this.btnGenerateOtp = document.getElementById('btnGenerateOtp');
    this.otpDisplayBox = document.getElementById('otpDisplayBox');

    // Config & Simulator Toggles
    this.hardwareModeSelect = document.getElementById('hardwareModeSelect');
    this.esp32IpInput = document.getElementById('esp32IpInput');
    this.btnSaveConfig = document.getElementById('btnSaveConfig');
  }

  bindEvents() {
    // Tab Navigation
    this.tabLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabTarget = link.getAttribute('data-tab');
        this.switchTab(tabTarget, link);
      });
    });

    // Lock Actions
    if (this.lockBtn) {
      this.lockBtn.addEventListener('click', () => this.toggleDoorState());
    }
    if (this.btnUnlockMain) {
      this.btnUnlockMain.addEventListener('click', () => this.setDoorState(false, 'Remote Web Control'));
    }
    if (this.btnLockMain) {
      this.btnLockMain.addEventListener('click', () => this.setDoorState(true, 'Remote Web Control'));
    }

    // Keypad Input
    this.keyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-key');
        this.handleKeypadPress(val);
      });
    });
    if (this.btnClearKey) {
      this.btnClearKey.addEventListener('click', () => this.clearKeypad());
    }
    if (this.btnSubmitKey) {
      this.btnSubmitKey.addEventListener('click', () => this.submitPin());
    }

    // RFID Simulation
    if (this.btnScanRfid) {
      this.btnScanRfid.addEventListener('click', () => this.handleRfidScan());
    }

    // Emergency Lockdown
    if (this.btnLockdownHeader) {
      this.btnLockdownHeader.addEventListener('click', () => this.triggerLockdown());
    }

    // Mode Selector Buttons
    document.querySelectorAll('.btn-mode').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        this.setSecurityMode(mode);
      });
    });

    // Logs Filtering & Export
    if (this.logsSearchInput) {
      this.logsSearchInput.addEventListener('input', () => this.renderLogsTable());
    }
    if (this.filterMethodSelect) {
      this.filterMethodSelect.addEventListener('change', () => this.renderLogsTable());
    }
    if (this.filterStatusSelect) {
      this.filterStatusSelect.addEventListener('change', () => this.renderLogsTable());
    }
    if (this.btnExportLogs) {
      this.btnExportLogs.addEventListener('click', () => this.exportLogsCSV());
    }

    // User Management Modal
    if (this.btnAddUserOpen) {
      this.btnAddUserOpen.addEventListener('click', () => this.openModal(this.addUserModal));
    }
    if (this.btnAddUserSubmit) {
      this.btnAddUserSubmit.addEventListener('click', (e) => this.handleCreateUser(e));
    }
    this.btnCloseModalBtns.forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Passcode Generator
    if (this.btnGenerateOtp) {
      this.btnGenerateOtp.addEventListener('click', () => this.generateTemporaryOtp());
    }

    // Settings Save
    if (this.btnSaveConfig) {
      this.btnSaveConfig.addEventListener('click', () => this.saveApiSettings());
    }
  }

  // --- TAB SWITCHING ---
  switchTab(tabId, clickedLink) {
    this.tabLinks.forEach(l => l.classList.remove('active'));
    this.tabPanes.forEach(p => p.classList.remove('active'));

    clickedLink.classList.add('active');
    const targetPane = document.getElementById(tabId);
    if (targetPane) {
      targetPane.classList.add('active');
    }

    if (tabId === 'analytics-tab' && window.analyticsManager) {
      setTimeout(() => window.analyticsManager.initCharts(), 100);
    }
    if (tabId === 'logs-tab') {
      this.renderLogsTable();
    }
    if (tabId === 'users-tab') {
      this.renderUsersGrid();
    }
  }

  // --- DOOR LOCK CONTROLLER ---
  toggleDoorState() {
    const current = window.storageService.getDoorStatus();
    this.setDoorState(!current.isLocked, 'Manual Toggle');
  }

  setDoorState(lockTarget, updatedBy = 'System', mode = null) {
    if (window.soundFx) {
      window.soundFx.playServoMotorSound();
    }

    const updated = window.storageService.setDoorStatus(lockTarget, updatedBy, mode);
    this.renderLockVisualizer(updated);
    this.updateMetrics();

    // Log Event
    const statusStr = lockTarget ? 'Granted' : 'Granted';
    const noteStr = lockTarget ? 'Door locked by ' + updatedBy : 'Door unlocked by ' + updatedBy;
    window.storageService.addLog(updatedBy, 'Web Remote', statusStr, noteStr);

    this.renderActivityFeed();

    const toastType = lockTarget ? 'warning' : 'success';
    const toastMsg = lockTarget ? 'Door Bolt Engaged (LOCKED)' : 'Door Bolt Retracted (UNLOCKED)';
    this.showToast(toastMsg, toastType);

    // If Unlocked and Auto-Lock mode active, set auto-relock timer
    if (!lockTarget && updated.mode === 'autolock') {
      const config = window.storageService.getConfig();
      const delay = (config.autoLockSeconds || 10) * 1000;
      this.showToast(`Auto-lock enabled. Relocking in ${config.autoLockSeconds || 10}s...`, 'info');
      
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = setTimeout(() => {
        this.setDoorState(true, 'Auto-Lock Timer');
      }, delay);
    }

    // Sync hardware payload if in live ESP32 mode
    this.syncHardwareEndpoint(lockTarget);
  }

  renderLockVisualizer(statusObj) {
    if (!this.lockContainer) return;

    if (statusObj.isLocked) {
      this.lockContainer.classList.remove('unlocked');
      this.lockContainer.classList.add('locked');
      if (this.lockIcon) this.lockIcon.className = 'fas fa-lock';
      if (this.lockStateText) this.lockStateText.textContent = 'SYSTEM LOCKED';
      if (this.lockStateSubText) this.lockStateSubText.textContent = `Secured - ${statusObj.updatedBy} (${new Date(statusObj.lastUpdated).toLocaleTimeString()})`;
      if (this.metricDoorStatus) {
        this.metricDoorStatus.textContent = 'LOCKED';
        this.metricDoorStatus.style.color = '#ef4444';
      }
    } else {
      this.lockContainer.classList.remove('locked');
      this.lockContainer.classList.add('unlocked');
      if (this.lockIcon) this.lockIcon.className = 'fas fa-lock-open';
      if (this.lockStateText) this.lockStateText.textContent = 'ACCESS UNLOCKED';
      if (this.lockStateSubText) this.lockStateSubText.textContent = `Unlocked by ${statusObj.updatedBy} at ${new Date(statusObj.lastUpdated).toLocaleTimeString()}`;
      if (this.metricDoorStatus) {
        this.metricDoorStatus.textContent = 'UNLOCKED';
        this.metricDoorStatus.style.color = '#10b981';
      }
    }
  }

  setSecurityMode(mode) {
    const status = window.storageService.getDoorStatus();
    window.storageService.setDoorStatus(status.isLocked, 'Security Mode Change', mode);
    this.showToast(`Security Mode set to: ${mode.toUpperCase()}`, 'info');

    if (mode === 'lockdown') {
      this.triggerLockdown();
    }
  }

  triggerLockdown() {
    if (window.soundFx) window.soundFx.playAlarmSiren();
    this.setDoorState(true, 'EMERGENCY LOCKDOWN', 'lockdown');
    this.showToast('🚨 EMERGENCY LOCKDOWN ACTIVATED! All doors sealed.', 'danger');
  }

  // --- KEYPAD LOGIC ---
  handleKeypadPress(val) {
    if (this.lockoutUntil && Date.now() < this.lockoutUntil) {
      const waitSec = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
      this.showToast(`Keypad locked due to failed attempts. Wait ${waitSec}s`, 'danger');
      return;
    }

    if (window.soundFx) window.soundFx.playKeypadBeep();

    if (this.currentPinInput.length < 6) {
      this.currentPinInput += val;
      this.updateKeypadDisplay();
    }
  }

  clearKeypad() {
    if (window.soundFx) window.soundFx.playKeypadBeep();
    this.currentPinInput = '';
    this.updateKeypadDisplay();
  }

  updateKeypadDisplay() {
    if (!this.keypadDisplayDots) return;
    if (this.currentPinInput.length === 0) {
      this.keypadDisplayDots.textContent = '••••';
      this.keypadDisplayStatus.textContent = 'ENTER PIN';
      this.keypadDisplayStatus.style.color = '#6b7280';
    } else {
      this.keypadDisplayDots.textContent = '•'.repeat(this.currentPinInput.length);
      this.keypadDisplayStatus.textContent = `${this.currentPinInput.length} DIGITS`;
      this.keypadDisplayStatus.style.color = '#00f2fe';
    }
  }

  submitPin() {
    if (!this.currentPinInput) return;

    const matchedUser = window.storageService.verifyPin(this.currentPinInput);

    if (matchedUser) {
      // SUCCESS PIN
      this.failedAttemptsCount = 0;
      if (window.soundFx) window.soundFx.playAccessGranted();

      const currentLock = window.storageService.getDoorStatus();
      const targetState = !currentLock.isLocked; // toggle door

      window.storageService.addLog(matchedUser.name, 'PIN Keypad', 'Granted', `PIN verified for user ${matchedUser.name}`);
      this.setDoorState(targetState, matchedUser.name);
      
      this.keypadDisplayStatus.textContent = 'ACCESS GRANTED';
      this.keypadDisplayStatus.style.color = '#10b981';
      this.showToast(`Welcome, ${matchedUser.name}! Access Granted.`, 'success');
      
      setTimeout(() => this.clearKeypad(), 1500);
    } else {
      // DENIED PIN
      this.failedAttemptsCount++;
      if (window.soundFx) window.soundFx.playAccessDenied();

      window.storageService.addLog('Unknown', 'PIN Keypad', 'Denied', `Invalid PIN entry attempt (${this.currentPinInput})`);
      this.updateMetrics();
      this.renderActivityFeed();

      this.keypadDisplayStatus.textContent = 'ACCESS DENIED';
      this.keypadDisplayStatus.style.color = '#ef4444';

      if (this.failedAttemptsCount >= 3) {
        this.lockoutUntil = Date.now() + 30000; // 30 sec lockout
        this.showToast('🚨 3 Failed PIN attempts! Keypad locked for 30s.', 'danger');
        if (window.soundFx) window.soundFx.playAlarmSiren();
      } else {
        this.showToast(`Invalid PIN! Attempt ${this.failedAttemptsCount}/3`, 'danger');
      }

      setTimeout(() => this.clearKeypad(), 1500);
    }
  }

  // --- RFID SCAN SIMULATOR ---
  handleRfidScan() {
    const uid = (this.rfidUidInput && this.rfidUidInput.value.trim()) || 'A1B2C3D4';
    const matchedUser = window.storageService.verifyCardUid(uid);

    if (matchedUser) {
      if (window.soundFx) window.soundFx.playAccessGranted();
      const currentLock = window.storageService.getDoorStatus();
      window.storageService.addLog(matchedUser.name, 'RFID Card', 'Granted', `RFID Tag ${uid} scanned`);
      this.setDoorState(!currentLock.isLocked, matchedUser.name + ' (RFID)');
      this.showToast(`💳 RFID Card Verified (${matchedUser.name})`, 'success');
    } else {
      if (window.soundFx) window.soundFx.playAccessDenied();
      window.storageService.addLog('Unknown Card', 'RFID Card', 'Denied', `Unregistered RFID Tag UID: ${uid}`);
      this.updateMetrics();
      this.renderActivityFeed();
      this.showToast(`❌ Unregistered RFID Card (${uid})`, 'danger');
    }
  }

  // --- RENDER LOGS & USERS ---
  renderInitialState() {
    const currentStatus = window.storageService.getDoorStatus();
    this.renderLockVisualizer(currentStatus);
    this.updateMetrics();
    this.renderActivityFeed();
    this.loadConfigToForm();
  }

  updateMetrics() {
    const logs = window.storageService.getLogs();
    const today = new Date().toISOString().split('T')[0];
    
    const todayLogs = logs.filter(l => l.timestamp.startsWith(today));
    const todayDenied = todayLogs.filter(l => l.status === 'Denied');

    if (this.metricTodayAccess) this.metricTodayAccess.textContent = todayLogs.length;
    if (this.metricDeniedAttempts) {
      this.metricDeniedAttempts.textContent = todayDenied.length;
      if (todayDenied.length > 0 && this.metricAlarmStatus) {
        this.metricAlarmStatus.textContent = 'WARNING';
        this.metricAlarmStatus.style.color = '#f59e0b';
      }
    }
  }

  renderActivityFeed() {
    if (!this.activityFeedContainer) return;
    const logs = window.storageService.getLogs().slice(0, 8);

    this.activityFeedContainer.innerHTML = logs.map(log => {
      const isGranted = log.status === 'Granted';
      const iconClass = isGranted ? 'granted' : 'denied';
      const iconSymbol = isGranted ? 'fa-check' : 'fa-times';
      const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      return `
        <div class="activity-item">
          <div class="activity-icon ${iconClass}">
            <i class="fas ${iconSymbol}"></i>
          </div>
          <div class="activity-details">
            <div class="activity-title">
              <span>${log.user}</span>
              <span class="activity-time">${timeStr}</span>
            </div>
            <div class="activity-sub">${log.method} • ${log.note || log.status}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderLogsTable() {
    if (!this.logsTableBody) return;
    let logs = window.storageService.getLogs();

    const searchTerm = (this.logsSearchInput && this.logsSearchInput.value.toLowerCase()) || '';
    const methodFilter = (this.filterMethodSelect && this.filterMethodSelect.value) || 'ALL';
    const statusFilter = (this.filterStatusSelect && this.filterStatusSelect.value) || 'ALL';

    logs = logs.filter(log => {
      const matchesSearch = log.user.toLowerCase().includes(searchTerm) || log.note.toLowerCase().includes(searchTerm);
      const matchesMethod = methodFilter === 'ALL' || log.method.toLowerCase().includes(methodFilter.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
      return matchesSearch && matchesMethod && matchesStatus;
    });

    this.logsTableBody.innerHTML = logs.map(log => {
      const dateObj = new Date(log.timestamp);
      const badgeClass = log.status === 'Granted' ? 'badge-success' : 'badge-danger';

      return `
        <tr>
          <td>${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}</td>
          <td><strong>${log.user}</strong></td>
          <td><span class="badge badge-info"><i class="fas fa-key"></i> ${log.method}</span></td>
          <td><span class="badge ${badgeClass}">${log.status}</span></td>
          <td>${log.note || '-'}</td>
        </tr>
      `;
    }).join('');
  }

  exportLogsCSV() {
    const logs = window.storageService.getLogs();
    if (!logs || logs.length === 0) {
      this.showToast('No logs to export', 'warning');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,ID,Timestamp,User,Method,Status,Note\n';
    logs.forEach(l => {
      csvContent += `"${l.id}","${l.timestamp}","${l.user}","${l.method}","${l.status}","${l.note}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_door_lock_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Exported Access Logs to CSV', 'success');
  }

  // --- USER MANAGEMENT ---
  renderUsersGrid() {
    if (!this.usersGrid) return;
    const users = window.storageService.getUsers();

    this.usersGrid.innerHTML = users.map(u => {
      const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      return `
        <div class="user-card">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="user-avatar">${initials}</div>
            <div class="user-info">
              <h4>${u.name}</h4>
              <p>${u.role} • Added ${u.created}</p>
              <div class="user-meta">
                <span class="badge badge-info">PIN: ${u.pin}</span>
                <span class="badge badge-success">RFID: ${u.cardUid}</span>
              </div>
            </div>
          </div>
          <button class="btn-secondary" style="color:#ef4444;" onclick="app.deleteUserPrompt('${u.id}', '${u.name}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }).join('');
  }

  handleCreateUser(e) {
    e.preventDefault();
    const nameInput = document.getElementById('newUserName');
    const roleInput = document.getElementById('newUserRole');
    const pinInput = document.getElementById('newUserPin');
    const rfidInput = document.getElementById('newUserRfid');

    if (!nameInput.value || !pinInput.value) {
      this.showToast('Please fill in Name and PIN', 'warning');
      return;
    }

    window.storageService.addUser(nameInput.value, roleInput.value, pinInput.value, rfidInput.value);
    this.closeAllModals();
    this.renderUsersGrid();
    this.showToast(`User ${nameInput.value} created successfully!`, 'success');

    nameInput.value = '';
    pinInput.value = '';
    rfidInput.value = '';
  }

  deleteUserPrompt(userId, userName) {
    if (confirm(`Are you sure you want to delete user ${userName}?`)) {
      window.storageService.deleteUser(userId);
      this.renderUsersGrid();
      this.showToast(`User ${userName} deleted.`, 'info');
    }
  }

  generateTemporaryOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    if (this.otpDisplayBox) {
      this.otpDisplayBox.innerHTML = `
        <div style="text-align:center; padding: 15px; background: rgba(0,242,254,0.1); border: 1px border var(--accent-cyan); border-radius: 8px;">
          <span style="font-size: 0.8rem; color: var(--text-dim);">ONE-TIME TEMPORARY PASSCODE (15 MINS)</span>
          <h2 style="font-size: 2rem; color: var(--accent-cyan); letter-spacing: 0.2em; margin-top: 5px;">${otp}</h2>
        </div>
      `;
    }
    // Add temporary OTP user
    window.storageService.addUser(`Guest (OTP ${otp})`, 'Guest', otp, 'OTP-TEMP');
    this.showToast(`Generated OTP Passcode: ${otp}`, 'success');
  }

  // --- HARDWARE CONFIG & SIMULATOR ---
  loadConfigToForm() {
    const config = window.storageService.getConfig();
    if (this.hardwareModeSelect) this.hardwareModeSelect.value = config.mode || 'simulated';
    if (this.esp32IpInput) this.esp32IpInput.value = config.esp32Ip || '192.168.1.150';
  }

  saveApiSettings() {
    const config = {
      mode: this.hardwareModeSelect.value,
      esp32Ip: this.esp32IpInput.value,
      autoLockSeconds: 10
    };
    window.storageService.saveConfig(config);
    this.showToast('Hardware Integration Settings Saved!', 'success');
  }

  syncHardwareEndpoint(isLocked) {
    const config = window.storageService.getConfig();
    if (config.mode === 'esp32_http') {
      const endpoint = `http://${config.esp32Ip}/api/door`;
      console.log(`📡 Sending HTTP POST to ESP32 at ${endpoint}: lock=${isLocked}`);
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isLocked ? 'lock' : 'unlock' })
      }).catch(err => {
        console.warn('ESP32 HTTP request error (device offline or local CORS):', err);
      });
    }
  }

  // --- MODALS & TOASTS ---
  openModal(modalElem) {
    if (modalElem) modalElem.classList.add('show');
  }

  closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
  }

  showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'danger') icon = 'fa-exclamation-triangle';
    if (type === 'warning') icon = 'fa-exclamation-circle';

    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
  }
}
