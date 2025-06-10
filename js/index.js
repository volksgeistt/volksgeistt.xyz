class Volksgeist {
  constructor() {
    this.config = {
      USER_ID: '1181256087081603116',
      API_URL: 'https://api.lanyard.rest/v1/users/',
      WEBSOCKET_URL: 'wss://api.lanyard.rest/socket',
      HEARTBEAT_INTERVAL: 30000,
      RECONNECT_DELAY: 3000,
      MAX_RETRIES: 5
    };

    this.state = {
      websocket: null,
      heartbeatInterval: null,
      isConnected: false,
      retryCount: 0,
      currentData: null,
      spotifyInterval: null
    };

    this.elements = {
      avatar: null,
      statusCircle: null,
      username: null,
      handle: null,
      activityStatus: null,
      platformIcons: null,
      profileContainer: null,
      loadingScreen: null,
      avatarFrame: null,
      avatarImages: null,
      avatarCount: null
    };

    this.statusIcons = {
      online: {
        desktop: "https://images-ext-1.discordapp.net/external/5nuotpuDZz0ODf85QHQMtB4FVCL5vSSbKfhhSpPxYRg/%3Fquality%3Dlossless/https/cdn.discordapp.com/emojis/1380457111971954782.png",
        mobile: "https://images-ext-1.discordapp.net/external/esg0NA2fiaYn5U6sEpv7dFZCAd9Av7V2r418pNms7oI/%3Fquality%3Dlossless/https/cdn.discordapp.com/emojis/1380457124118925322.png",
        web: "https://images-ext-1.discordapp.net/external/DEoJPUraylaRHjCrlQz-yEPhJMea8YY_9JntkguayfE/%3Fquality%3Dlossless/https/cdn.discordapp.com/emojis/1380457134919258144.png"
      },
      idle: {
        desktop: "https://images-ext-1.discordapp.net/external/c57ZEUPbbrlhdHBxMTw1gkyqxHb4qLgnX1CNQfoq83c/%3Fquality%3Dlossless/https/cdn.discordapp.com/emojis/1380457016149016626.png",
        mobile: "https://images-ext-1.discordapp.net/external/_qvrmrJFebZ2d03hpe4BOALnQEjX01ywIsJlEfN-Zw0/%3Fquality%3Dlossless/https/cdn.discordapp.com/emojis/1380457038689337404.png",
        web: "https://images-ext-1.discordapp.net/external/dIFoP7Omo70BTlh57VYcSTChXFPrDoJs8GVEZW8zBDs/%3Fquality%3Dlossless/https/cdn.discordapp.com/emojis/1380457050408091718.png"
      },
      dnd: {
        desktop: "https://images-ext-1.discordapp.net/external/f2sJKA445VoBG_7Gf1PipxQ59bkP5Pa6ULNmR3GV-vE/%3Fquality%3Dlossless/https/cdn.discordapp.com/emojis/1380457067596484628.png",
        mobile: "https://images-ext-1.discordapp.net/external/0sBmDQVSler3uu_Iaoz_Bsxbm7gR-pSir4x_L8qbLoU/%3Fquality%3Dlossless/https/cdn.discordapp.com/emojis/1380457086873374720.png",
        web: "https://images-ext-1.discordapp.net/external/DtbIe_ElMFVXe85vDypgEnaEqls2ZRAdDO8hMPIa8FM/%3Fquality%3Dlossless/https/cdn.discordapp.com/emojis/1380457101297717370.png"
      }
    };

    this.statusColors = {
      online: "#43b581",
      dnd: "#f04747",
      idle: "#faa61a",
      offline: "#747f8d"
    };

    this.init();
  }

  async init() {
    try {
      this.cacheElements();
      await this.initializeApp();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('Failed to initialize application');
    }
  }

  cacheElements() {
    const ids = [
      'avatar', 'statusCircle', 'username', 'handle', 
      'activityStatus', 'platformIcons', 'profileContainer',
      'loadingScreen', 'avatarFrame', 'avatarImages', 'avatarCount'
    ];

    ids.forEach(id => {
      this.elements[id] = document.getElementById(id);
      if (!this.elements[id]) {
        console.warn(`Element with id '${id}' not found`);
      }
    });
  }

  async initializeApp() {
    this.connectWebSocket();

    setTimeout(() => {
      if (!this.state.isConnected) {
        console.log('WebSocket connection timeout, using REST API');
        this.fetchUserData();
      }
    }, 3000);

    setTimeout(() => {
      this.hideLoadingScreen();
    }, 1500);
  }

  connectWebSocket() {
    if (this.state.websocket || this.state.isConnected) {
      return;
    }

    try {
      console.log('Connecting to WebSocket...');
      this.state.websocket = new WebSocket(this.config.WEBSOCKET_URL);

      this.state.websocket.onopen = () => this.handleWebSocketOpen();
      this.state.websocket.onmessage = (event) => this.handleWebSocketMessage(event);
      this.state.websocket.onclose = (event) => this.handleWebSocketClose(event);
      this.state.websocket.onerror = (error) => this.handleWebSocketError(error);

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.fallbackToREST();
    }
  }

  handleWebSocketOpen() {
    console.log('WebSocket connected');
    this.state.isConnected = true;
    this.state.retryCount = 0;
    this.subscribeToUser();
    this.startHeartbeat();
  }

  handleWebSocketMessage(event) {
    try {
      const data = JSON.parse(event.data);

      switch (data.op) {
        case 0:
          if (data.t === 'INIT_STATE' || data.t === 'PRESENCE_UPDATE') {
            this.updateUserInterface(data.d);
          }
          break;
        case 1:
          if (data.d?.heartbeat_interval) {
            this.config.HEARTBEAT_INTERVAL = data.d.heartbeat_interval;
          }
          break;
        case 3:
          console.log('Heartbeat acknowledged');
          break;
        default:
          console.log('Unknown WebSocket message:', data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  handleWebSocketClose(event) {
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    this.cleanup();
    
    if (this.state.retryCount < this.config.MAX_RETRIES) {
      this.scheduleReconnect();
    } else {
      console.log('Max retries reached, falling back to REST API');
      this.fallbackToREST();
    }
  }

  handleWebSocketError(error) {
    console.error('WebSocket error:', error);
    this.cleanup();
  }

  subscribeToUser() {
    if (this.state.websocket?.readyState === WebSocket.OPEN) {
      const message = {
        op: 2,
        d: { subscribe_to_id: this.config.USER_ID }
      };
      this.state.websocket.send(JSON.stringify(message));
      console.log('Subscribed to user updates');
    }
  }

  startHeartbeat() {
    if (this.state.heartbeatInterval) {
      clearInterval(this.state.heartbeatInterval);
    }

    this.state.heartbeatInterval = setInterval(() => {
      if (this.state.websocket?.readyState === WebSocket.OPEN) {
        this.state.websocket.send(JSON.stringify({ op: 3 }));
      }
    }, this.config.HEARTBEAT_INTERVAL);
  }

  scheduleReconnect() {
    const delay = Math.min(
      this.config.RECONNECT_DELAY * Math.pow(2, this.state.retryCount),
      30000
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.state.retryCount + 1})`);
    
    setTimeout(() => {
      this.state.retryCount++;
      this.connectWebSocket();
    }, delay);
  }

  cleanup() {
    this.state.isConnected = false;
    
    if (this.state.heartbeatInterval) {
      clearInterval(this.state.heartbeatInterval);
      this.state.heartbeatInterval = null;
    }

    if (this.state.spotifyInterval) {
      clearInterval(this.state.spotifyInterval);
      this.state.spotifyInterval = null;
    }

    if (this.state.websocket) {
      this.state.websocket.close();
      this.state.websocket = null;
    }
  }

  async fetchUserData() {
    const url = `${this.config.API_URL}${this.config.USER_ID}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        this.updateUserInterface(data.data);
        this.state.retryCount = 0;
      } else {
        throw new Error('Invalid API response');
      }

    } catch (error) {
      console.error('REST API fetch failed:', error);
      this.handleFetchError();
    }
  }

  handleFetchError() {
    if (this.state.retryCount < this.config.MAX_RETRIES) {
      const delay = Math.min(2000 * Math.pow(2, this.state.retryCount), 30000);
      
      setTimeout(() => {
        this.state.retryCount++;
        this.fetchUserData();
      }, delay);
    } else {
      this.showError('Unable to load Discord status');
    }
  }

  fallbackToREST() {
    this.fetchUserData();
    setInterval(() => this.fetchUserData(), 5000);
  }

  updateUserInterface(data) {
    if (!data) return;

    try {
      this.state.currentData = data;
      
      const {
        discord_user,
        discord_status = 'offline',
        activities = [],
        active_on_discord_desktop = false,
        active_on_discord_mobile = false,
        active_on_discord_web = false
      } = data;

      if (!discord_user) {
        throw new Error('No user data available');
      }

      this.updateAvatar(discord_user);
      this.updateUserInfo(discord_user);
      this.updateStatus(discord_status);
      this.updatePlatforms(discord_status, {
        desktop: active_on_discord_desktop,
        mobile: active_on_discord_mobile,
        web: active_on_discord_web
      });
      this.updateActivity(activities);

    } catch (error) {
      console.error('Error updating UI:', error);
      this.showActivityError();
    }
  }

  updateAvatar(user) {
    if (!this.elements.avatar || !user) return;

    let avatarUrl;
    
    if (user.avatar) {
      const format = user.avatar.startsWith('a_') ? 'gif' : 'png';
      avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${format}?size=256`;
    } else {
      const defaultIndex = user.discriminator 
        ? parseInt(user.discriminator) % 5 
        : parseInt(user.id) % 5;
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    }

    this.elements.avatar.src = avatarUrl;
    this.elements.avatar.onerror = () => {
      this.elements.avatar.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
    };
  }

updateUserInfo(user) {
  if (!user) return;

  if (this.elements.username) {
    const textNode = this.elements.username.childNodes[0];
    if (textNode) {
      textNode.textContent = user.username || 'Unknown User';
    }
  }
}
  updateStatus(status) {
    if (!this.elements.statusCircle || !this.elements.profileContainer) return;

    const color = this.statusColors[status] || this.statusColors.offline;
    
    this.elements.statusCircle.style.backgroundColor = color;
    this.elements.profileContainer.style.borderColor = color;
    
    this.updateStatusAnimation(color);
  }

  updateStatusAnimation(color) {
    const existingStyle = document.getElementById('statusPulse');
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = 'statusPulse';
    style.textContent = `
      @keyframes statusPulse {
        0% { box-shadow: 0 0 0 0 ${color}99; }
        70% { box-shadow: 0 0 0 15px ${color}00; }
        100% { box-shadow: 0 0 0 0 ${color}00; }
      }
      .status-circle { animation: statusPulse 2s infinite; }
    `;
    
    document.head.appendChild(style);
  }

  updatePlatforms(status, platforms) {
    if (!this.elements.platformIcons) return;

    this.elements.platformIcons.innerHTML = '';

    Object.entries(platforms).forEach(([platform, isActive]) => {
      if (isActive && this.statusIcons[status]?.[platform]) {
        const img = document.createElement('img');
        img.src = this.statusIcons[status][platform];
        img.alt = `${platform} status`;
        img.title = `Active on ${platform}`;
        this.elements.platformIcons.appendChild(img);
      }
    });
  }

  updateActivity(activities) {
    if (!this.elements.activityStatus) return;

    if (!activities || activities.length === 0) {
      this.elements.activityStatus.innerHTML = '<span>no activity</span>';
      this.clearSpotifyInterval();
      return;
    }

    const activity = activities[0];
    const imageUrl = this.getActivityImage(activity);
    const isSpotify = this.isSpotifyActivity(activity);
    
    let activityHTML = `
      <img src="${imageUrl}" alt="Activity thumbnail" />
      <div style="display: flex; flex-direction: column; align-items: center;">
        <span>${activity.name || 'Unknown Activity'}${activity.state ? ` – ${activity.state}` : ''}</span>
    `;

    if (isSpotify) {
      activityHTML += this.createSpotifyProgress(activity);
      this.startSpotifyProgressUpdate(activity);
    } else {
      this.clearSpotifyInterval();
    }

    activityHTML += '</div>';
    this.elements.activityStatus.innerHTML = activityHTML;
  }

  getActivityImage(activity) {
    const assets = activity.assets || {};
    
    if (!assets.large_image) {
      return 'https://cdn.discordapp.com/attachments/1181595250599415849/1380877705930735767/pi-11.jpg?ex=68457a14&is=68442894&hm=fbc13024e223bdbf1ce2e2b3accd15ebf53acbfb9bc4cc53f23458a258af844e&';
    }

    const image = assets.large_image;
    
    if (image.startsWith('spotify:')) {
      return `https://i.scdn.co/image/${image.split(':')[1]}`;
    }
    
    if (image.startsWith('mp:')) {
      return `https://media.discordapp.net/mediakit/${image.split(':')[1]}.png`;
    }
    
    if (activity.application_id === '323229674914815488') {
      return 'https://tr.rbxcdn.com/6ac3a8db7b5bb02e326e1e87a5179c49/768/432/Image/Png';
    }
    
    if (/^\d+$/.test(image)) {
      const format = image.startsWith('a_') ? 'gif' : 'png';
      return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${image}.${format}`;
    }
    
    return image;
  }

  isSpotifyActivity(activity) {
    return activity.name?.toLowerCase().includes('spotify') || 
           activity.application_id === 'spotify';
  }

  createSpotifyProgress(activity) {
    const timestamps = activity.timestamps;
    if (!timestamps?.start || !timestamps?.end) return '';

    const now = Date.now();
    const duration = timestamps.end - timestamps.start;
    const elapsed = Math.max(0, now - timestamps.start);
    const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));

    return `
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%;"></div>
        </div>
        <div style="min-width: 60px; color: #ccc; font-size: 0.85rem;">
          ${this.formatTime(elapsed)} / ${this.formatTime(duration)}
        </div>
      </div>
    `;
  }

  startSpotifyProgressUpdate(activity) {
    this.clearSpotifyInterval();
    
    this.state.spotifyInterval = setInterval(() => {
      if (!this.isSpotifyActivity(activity)) {
        this.clearSpotifyInterval();
        return;
      }

      const progressContainer = document.querySelector('.progress-container');
      if (!progressContainer) return;

      const timestamps = activity.timestamps;
      if (!timestamps?.start || !timestamps?.end) return;

      const now = Date.now();
      const duration = timestamps.end - timestamps.start;
      const elapsed = Math.max(0, now - timestamps.start);
      const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));

      const progressFill = progressContainer.querySelector('.progress-fill');
      const timeDisplay = progressContainer.querySelector('div:last-child');

      if (progressFill) {
        progressFill.style.width = `${progress}%`;
      }

      if (timeDisplay) {
        timeDisplay.textContent = `${this.formatTime(elapsed)} / ${this.formatTime(duration)}`;
      }

      if (elapsed >= duration) {
        this.clearSpotifyInterval();
      }
    }, 1000);
  }

  clearSpotifyInterval() {
    if (this.state.spotifyInterval) {
      clearInterval(this.state.spotifyInterval);
      this.state.spotifyInterval = null;
    }
  }

  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  hideLoadingScreen() {
    if (this.elements.loadingScreen) {
      this.elements.loadingScreen.style.display = 'none';
    }
    document.body.classList.add('fade-in');
  }

  showError(message) {
    if (this.elements.activityStatus) {
      this.elements.activityStatus.innerHTML = 
        `<span style="color: #f85149;">${message}</span>`;
    }
    this.hideLoadingScreen();
  }

  showActivityError() {
    if (this.elements.activityStatus) {
      this.elements.activityStatus.innerHTML = 
        '<span style="color: #f85149;">Error loading activity</span>';
    }
  }

  destroy() {
    this.cleanup();
  }

  refresh() {
    if (this.state.isConnected) {
      this.subscribeToUser();
    } else {
      this.fetchUserData();
    }
  }
}

function toggleAvatarFrame() {
  const frame = document.getElementById('avatarFrame');
  if (!frame) return;

  const isVisible = frame.style.display === 'block';
  frame.style.display = isVisible ? 'none' : 'block';
  
  if (!isVisible && !window.avatarsLoaded) {
    loadAvatarHistory();
  }
}

async function loadAvatarHistory() {
  const avatarImages = document.getElementById('avatarImages');
  const avatarCount = document.getElementById('avatarCount');
  
  if (!avatarImages || !avatarCount) return;

  try {
    avatarCount.textContent = 'Loading avatars...';
    
    const mockAvatars = [
      './images/av1.png',
      './images/av2.png',
      './images/av3.png'
    ];

    avatarImages.innerHTML = '';
    
    mockAvatars.forEach((url, index) => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = `Avatar ${index + 1}`;
      img.onclick = () => changeAvatar(url);
      img.onerror = () => {
        img.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
      };
      avatarImages.appendChild(img);
    });

    avatarCount.textContent = `${mockAvatars.length} avatars found`;
    window.avatarsLoaded = true;

  } catch (error) {
    console.error('Failed to load avatar history:', error);
    avatarCount.textContent = 'Failed to load avatars';
  }
}

function changeAvatar(url) {
  const avatar = document.getElementById('avatar');
  if (avatar) {
    avatar.src = url;
  }
}

document.addEventListener('click', (event) => {
  const frame = document.getElementById('avatarFrame');
  const button = document.querySelector('.avatar-button');
  
  if (frame && button && 
      !frame.contains(event.target) && 
      !button.contains(event.target)) {
    frame.style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  window.discordStatus = new Volksgeist();
});

document.addEventListener('visibilitychange', () => {
  if (window.discordStatus) {
    if (document.visibilityState === 'visible') {
      window.discordStatus.refresh();
    }
  }
});

window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});


