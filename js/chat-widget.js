(() => {
  if (window.__wgInit) return;
  window.__wgInit = true;

  const _src = document.currentScript;
  const _cfg = (_src && _src.dataset && _src.dataset.client) ? _src.dataset : (window.WG_CONFIG || {});

  const CLIENT_ID       = _cfg.client        || '';
  const WEBHOOK_URL     = '/api/chat';
  const GREETING        = _cfg.greeting      || 'Hi! How can I help you today?';
  const AGENT_NAME      = _cfg.name          || 'Shannon';
  const SUBTITLE        = _cfg.subtitle      || 'Get a free quote in minutes';
  const COLOR_PRIMARY   = _cfg.colorPrimary  || '#c89038';
  const COLOR_DARK      = _cfg.colorDark     || '#a87428';
  const COLOR_HEADER    = _cfg.colorHeader   || '#0d0a00';
  const AGENT_AVATAR    = _cfg.avatar        || '';
  const PHONE           = _cfg.phone         || '';
  const PHONE_TEL       = PHONE.replace(/\D/g, '');
  const AUTO_OPEN_DELAY = _cfg.autoOpen ? parseInt(_cfg.autoOpen, 10) : null;
  const QUICK_REPLIES   = _cfg.quickReplies
    ? _cfg.quickReplies.split('|').map(s => s.trim()).filter(Boolean)
    : [];
  const SESSION_ID = crypto.randomUUID();

  const fontLink = document.createElement('link');
  fontLink.rel  = 'preload';
  fontLink.as   = 'style';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=optional';
  fontLink.onload = function() { this.onload = null; this.rel = 'stylesheet'; };
  document.head.appendChild(fontLink);

  const style = document.createElement('style');
  style.textContent = `
    :root {
      --wg-navy:       ${COLOR_HEADER};
      --wg-blue:       ${COLOR_PRIMARY};
      --wg-blue-dark:  ${COLOR_DARK};
      --wg-blue-mid:   #a87428;
      --wg-teal:       #c89038;
      --wg-green:      #f0c030;
      --wg-off-white:  #fffdf5;
      --wg-white:      #FFFFFF;
      --wg-text:       #222222;
      --wg-muted:      #8a7848;
      --wg-border:     #e8d8a0;
    }
    #wg-trigger {
      position: fixed;
      bottom: 28px; right: 28px;
      width: 56px; height: 56px;
      border-radius: 50%;
      background: ${COLOR_PRIMARY};
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(200,144,56,0.5);
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      z-index: 9999;
      outline: none;
    }
    #wg-trigger::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid ${COLOR_PRIMARY};
      opacity: 0;
      animation: wgPulseRing 2.8s ease-out infinite;
    }
    #wg-trigger.wg-open::before { animation: none; opacity: 0; }
    @keyframes wgPulseRing {
      0%   { opacity: 0.75; transform: scale(1); }
      70%  { opacity: 0;    transform: scale(1.65); }
      100% { opacity: 0;    transform: scale(1.65); }
    }
    #wg-trigger:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(200,144,56,0.65);
      background: ${COLOR_DARK};
    }
    #wg-trigger:active { transform: translateY(0); }
    #wg-trigger svg {
      width: 24px; height: 24px; fill: white;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    #wg-trigger .wg-icon-chat,
    #wg-trigger .wg-icon-close { position: absolute; }
    #wg-trigger .wg-icon-close { opacity: 0; transform: rotate(-90deg) scale(0.7); }
    #wg-trigger.wg-open .wg-icon-chat { opacity: 0; transform: rotate(90deg) scale(0.7); }
    #wg-trigger.wg-open .wg-icon-close { opacity: 1; transform: rotate(0deg) scale(1); }
    #wg-badge {
      position: absolute; top: -3px; right: -3px;
      width: 18px; height: 18px;
      background: #EF4444; border-radius: 50%;
      border: 2px solid var(--wg-off-white);
      font-family: 'Manrope', sans-serif; font-size: 10px; font-weight: 700; color: white;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transform: scale(0);
      transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
    }
    #wg-badge.wg-show { opacity: 1; transform: scale(1); }
    #wg-panel {
      position: fixed;
      bottom: 96px; right: 28px;
      width: 380px;
      background: var(--wg-white);
      border-radius: 16px;
      box-shadow: 0 16px 56px rgba(0,0,0,0.22);
      display: flex; flex-direction: column; overflow: hidden;
      max-height: calc(100dvh - 120px);
      z-index: 9998;
      opacity: 0; transform: translateY(16px) scale(0.97);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.2,0.64,1);
      transform-origin: bottom right;
    }
    #wg-panel.wg-open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }
    .wg-header {
      background: var(--wg-navy);
      padding: 16px 20px;
      display: flex; align-items: center; gap: 12px;
      flex-shrink: 0; position: relative;
    }
    .wg-header::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, var(--wg-blue) 0%, var(--wg-teal) 100%);
    }
    .wg-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, var(--wg-blue) 0%, var(--wg-blue-mid) 100%);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; position: relative;
      font-size: 20px;
    }
    .wg-avatar-letter {
      font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 16px; color: white;
    }
    .wg-online-dot {
      position: absolute; bottom: 1px; right: 1px;
      width: 10px; height: 10px;
      background: var(--wg-green); border-radius: 50%;
      border: 2px solid var(--wg-navy);
    }
    .wg-header-info { flex: 1; min-width: 0; }
    .wg-header-name {
      font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 15px;
      color: white; letter-spacing: -0.01em; line-height: 1.2;
    }
    .wg-header-sub {
      font-family: 'DM Sans', sans-serif; font-size: 12px;
      color: rgba(255,255,255,0.5); margin-top: 2px;
    }
    .wg-close-btn {
      background: rgba(255,255,255,0.08); border: none; border-radius: 8px;
      width: 32px; height: 32px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s ease; flex-shrink: 0;
    }
    .wg-close-btn:hover { background: rgba(255,255,255,0.16); }
    .wg-close-btn svg { width: 16px; height: 16px; stroke: rgba(255,255,255,0.7); fill: none; }
    .wg-messages {
      flex: 1; overflow-y: auto;
      padding: 20px 16px;
      background: var(--wg-off-white);
      display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth;
      min-height: 200px;
    }
    .wg-messages::-webkit-scrollbar { width: 4px; }
    .wg-messages::-webkit-scrollbar-track { background: transparent; }
    .wg-messages::-webkit-scrollbar-thumb { background: var(--wg-border); border-radius: 4px; }
    .wg-msg-row { display: flex; animation: wgMsgIn 0.25s cubic-bezier(0.34,1.4,0.64,1) both; }
    @keyframes wgMsgIn {
      from { opacity: 0; transform: translateY(8px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .wg-msg-row.wg-agent { justify-content: flex-start; }
    .wg-msg-row.wg-user  { justify-content: flex-end; }
    .wg-bubble {
      max-width: 80%; padding: 11px 14px;
      font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.55;
      word-break: break-word;
    }
    .wg-msg-row.wg-agent .wg-bubble {
      background: var(--wg-white); color: var(--wg-text);
      border: 1px solid var(--wg-border);
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }
    .wg-msg-row.wg-user .wg-bubble {
      background: var(--wg-blue); color: white;
      border-radius: 16px 16px 4px 16px;
      box-shadow: 0 4px 14px rgba(200,144,56,0.35);
    }
    .wg-intro-bubble {
      max-width: 93% !important;
      padding: 0 !important;
      overflow: hidden;
    }
    .wg-intro-top {
      background: var(--wg-navy);
      padding: 12px 14px;
      display: flex; align-items: center; gap: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .wg-intro-avatar-sm {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, var(--wg-blue) 0%, var(--wg-blue-mid) 100%);
      display: flex; align-items: center; justify-content: center;
      font-size: 17px; flex-shrink: 0; position: relative;
    }
    .wg-intro-avatar-sm::after {
      content: '';
      position: absolute; bottom: 0; right: 0;
      width: 9px; height: 9px;
      background: var(--wg-green); border-radius: 50%;
      border: 2px solid var(--wg-navy);
    }
    .wg-intro-name {
      font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: white;
    }
    .wg-intro-online {
      font-family: 'DM Sans', sans-serif; font-size: 11px;
      color: var(--wg-green); margin-top: 1px;
    }
    .wg-intro-body { padding: 13px 14px 14px; background: var(--wg-white); }
    .wg-intro-text {
      font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.55;
      color: var(--wg-text); margin: 0 0 11px 0;
    }
    .wg-intro-trust { display: flex; gap: 6px; flex-wrap: wrap; }
    .wg-intro-pill {
      font-family: 'Manrope', sans-serif; font-size: 11px; font-weight: 600;
      color: var(--wg-muted); background: var(--wg-off-white);
      border: 1px solid var(--wg-border); border-radius: 20px;
      padding: 3px 9px; white-space: nowrap;
    }
    .wg-chips-row {
      display: flex; flex-wrap: wrap; gap: 7px;
      animation: wgMsgIn 0.3s cubic-bezier(0.34,1.4,0.64,1) both;
      animation-delay: 0.1s;
    }
    .wg-chip {
      font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
      color: var(--wg-blue); background: var(--wg-white);
      border: 1.5px solid var(--wg-blue); border-radius: 20px;
      padding: 6px 13px; cursor: pointer; white-space: nowrap;
      transition: background 0.15s ease, color 0.15s ease, transform 0.1s ease;
    }
    .wg-chip:hover { background: var(--wg-blue); color: white; transform: translateY(-1px); }
    .wg-chip:active { transform: translateY(0); }
    .wg-typing {
      background: var(--wg-white); border: 1px solid var(--wg-border);
      border-radius: 16px 16px 16px 4px;
      padding: 13px 16px; display: flex; gap: 5px; align-items: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }
    .wg-dot {
      width: 7px; height: 7px;
      background: var(--wg-muted); border-radius: 50%;
      animation: wgBounce 1.2s ease-in-out infinite;
    }
    .wg-dot:nth-child(2) { animation-delay: 0.15s; }
    .wg-dot:nth-child(3) { animation-delay: 0.30s; }
    @keyframes wgBounce {
      0%,60%,100% { transform: translateY(0); opacity: 0.4; }
      30%          { transform: translateY(-5px); opacity: 1; }
    }
    .wg-call-bar {
      display: flex; align-items: center; justify-content: center; gap: 9px;
      background: var(--wg-navy);
      padding: 11px 16px;
      text-decoration: none;
      flex-shrink: 0;
      border-top: 1px solid rgba(255,255,255,0.07);
      transition: background 0.15s ease;
    }
    .wg-call-bar:hover { background: rgba(0,0,0,0.85); }
    .wg-call-bar svg { width: 15px; height: 15px; fill: var(--wg-green); flex-shrink: 0; }
    .wg-call-bar-label {
      font-family: 'Manrope', sans-serif; font-size: 12px; font-weight: 700;
      color: white; letter-spacing: 0.01em;
    }
    .wg-call-bar-num {
      font-family: 'DM Sans', sans-serif; font-size: 12px;
      color: rgba(255,255,255,0.55); margin-left: 2px;
    }
    .wg-input-area {
      background: var(--wg-white); border-top: 1px solid var(--wg-border);
      padding: 12px 14px; display: flex; align-items: flex-end; gap: 10px; flex-shrink: 0;
    }
    .wg-input {
      flex: 1; font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.5;
      color: var(--wg-text); background: var(--wg-off-white);
      border: 1px solid var(--wg-border); border-radius: 10px;
      padding: 10px 14px; resize: none; outline: none;
      max-height: 100px; min-height: 40px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .wg-input::placeholder { color: var(--wg-muted); }
    .wg-input:focus {
      border-color: var(--wg-blue-mid);
      box-shadow: 0 0 0 3px rgba(200,144,56,0.2);
    }
    .wg-send {
      width: 40px; height: 40px; background: ${COLOR_PRIMARY};
      border: none; border-radius: 10px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
      box-shadow: 0 2px 8px rgba(200,144,56,0.4);
    }
    .wg-send:hover:not(:disabled) {
      transform: translateY(-1px); background: ${COLOR_DARK};
      box-shadow: 0 4px 14px rgba(200,144,56,0.5);
    }
    .wg-send:active:not(:disabled) { transform: translateY(0); }
    .wg-send:disabled { background: var(--wg-border); cursor: not-allowed; box-shadow: none; }
    .wg-send svg { width: 18px; height: 18px; fill: white; }
    .wg-send:disabled svg { fill: var(--wg-muted); }
    @media (max-width: 480px) {
      #wg-panel { bottom: 0; right: 0; left: 0; width: 100%; max-height: 100dvh; border-radius: 0; }
      #wg-trigger { bottom: 20px; right: 20px; }
      #wg-trigger.wg-open { display: none; }
    }
  `;
  document.head.appendChild(style);

  const avatarInner = AGENT_AVATAR
    ? AGENT_AVATAR
    : `<span class="wg-avatar-letter">${AGENT_NAME.charAt(0)}</span>`;

  const callBarHTML = PHONE ? `
    <a class="wg-call-bar" href="tel:${PHONE_TEL}" aria-label="Call ${PHONE}">
      <svg viewBox="0 0 24 24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
      <span class="wg-call-bar-label">Call now</span>
      <span class="wg-call-bar-num">${PHONE}</span>
    </a>` : '';

  document.body.insertAdjacentHTML('beforeend', `
    <button id="wg-trigger" aria-label="Open chat" aria-expanded="false">
      <svg class="wg-icon-chat" viewBox="0 0 24 24"><path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z"/></svg>
      <svg class="wg-icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"/></svg>
      <span id="wg-badge" role="status" aria-live="polite"></span>
    </button>
    <div id="wg-panel" role="dialog" aria-label="Chat with ${AGENT_NAME}" aria-hidden="true" inert>
      <div class="wg-header">
        <div class="wg-avatar">${avatarInner}<span class="wg-online-dot"></span></div>
        <div class="wg-header-info">
          <div class="wg-header-name">${AGENT_NAME}</div>
          <div class="wg-header-sub">${SUBTITLE}</div>
        </div>
        <button class="wg-close-btn" id="wg-close" aria-label="Close chat">
          <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="wg-messages" id="wg-messages" role="log" aria-live="polite"></div>
      ${callBarHTML}
      <div class="wg-input-area">
        <textarea id="wg-input" class="wg-input" placeholder="Type a message…" rows="1" aria-label="Message input"></textarea>
        <button class="wg-send" id="wg-send" aria-label="Send message" disabled>
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  `);

  const trigger  = document.getElementById('wg-trigger');
  const panel    = document.getElementById('wg-panel');
  const closeBtn = document.getElementById('wg-close');
  const messages = document.getElementById('wg-messages');
  const input    = document.getElementById('wg-input');
  const sendBtn  = document.getElementById('wg-send');
  const badge    = document.getElementById('wg-badge');

  let isOpen = false, isLoading = false, hasGreeted = false;
  let unreadCount = 0, typingEl = null;

  function openPanel() {
    isOpen = true;
    panel.classList.add('wg-open');
    panel.setAttribute('aria-hidden', 'false');
    panel.removeAttribute('inert');
    trigger.classList.add('wg-open');
    trigger.setAttribute('aria-expanded', 'true');
    clearBadge();
    if (!hasGreeted) {
      hasGreeted = true;
      setTimeout(() => {
        addIntroCard();
        if (QUICK_REPLIES.length) setTimeout(addChips, 420);
      }, 300);
    }
    setTimeout(() => input.focus(), 350);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('wg-open');
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('inert', '');
    trigger.classList.remove('wg-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) closePanel(); });

  function showBadge(n) { badge.textContent = n > 9 ? '9+' : n; badge.classList.add('wg-show'); }
  function clearBadge() { unreadCount = 0; badge.classList.remove('wg-show'); }
  function scrollBottom() { requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; }); }

  function addIntroCard() {
    const avContent = AGENT_AVATAR || AGENT_NAME.charAt(0);
    const row = document.createElement('div');
    row.className = 'wg-msg-row wg-agent';
    const bubble = document.createElement('div');
    bubble.className = 'wg-bubble wg-intro-bubble';
    const top = document.createElement('div');
    top.className = 'wg-intro-top';
    top.innerHTML = `<div class="wg-intro-avatar-sm">${avContent}</div><div><div class="wg-intro-name">${AGENT_NAME}</div><div class="wg-intro-online">&#9679; Online now</div></div>`;
    const body = document.createElement('div');
    body.className = 'wg-intro-body';
    const textP = document.createElement('p');
    textP.className = 'wg-intro-text';
    textP.textContent = GREETING;
    const trust = document.createElement('div');
    trust.className = 'wg-intro-trust';
    trust.innerHTML = `<span class="wg-intro-pill">Licensed &amp; Insured</span><span class="wg-intro-pill">Same-Day Available</span><span class="wg-intro-pill">Veteran Owned</span>`;
    body.appendChild(textP);
    body.appendChild(trust);
    bubble.appendChild(top);
    bubble.appendChild(body);
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollBottom();
  }

  function addChips() {
    const existing = document.getElementById('wg-chips');
    if (existing) existing.remove();
    const row = document.createElement('div');
    row.className = 'wg-chips-row';
    row.id = 'wg-chips';
    QUICK_REPLIES.forEach(label => {
      const btn = document.createElement('button');
      btn.className = 'wg-chip';
      btn.textContent = label;
      btn.addEventListener('click', () => {
        row.remove();
        input.value = label;
        sendMessage();
      });
      row.appendChild(btn);
    });
    messages.appendChild(row);
    scrollBottom();
  }

  function addMessage(role, text) {
    const row = document.createElement('div');
    row.className = `wg-msg-row ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'wg-bubble';
    text.split('\n').forEach((line, i) => {
      if (i > 0) bubble.appendChild(document.createElement('br'));
      bubble.appendChild(document.createTextNode(line));
    });
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollBottom();
    if (role === 'wg-agent' && !isOpen) { unreadCount++; showBadge(unreadCount); }
  }

  function showTyping() {
    if (typingEl) return;
    const row = document.createElement('div');
    row.className = 'wg-msg-row wg-agent';
    const bubble = document.createElement('div');
    bubble.className = 'wg-typing';
    bubble.innerHTML = '<span class="wg-dot"></span><span class="wg-dot"></span><span class="wg-dot"></span>';
    row.appendChild(bubble);
    messages.appendChild(row);
    typingEl = row;
    scrollBottom();
  }

  function hideTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isLoading) return;
    isLoading = true;
    sendBtn.disabled = true;
    input.value = '';
    input.style.height = 'auto';
    addMessage('wg-user', text);
    showTyping();
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput: text, sessionId: SESSION_ID, clientId: CLIENT_ID }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      hideTyping();
      addMessage('wg-agent', data.reply || data.output || data.message || '');
    } catch (err) {
      hideTyping();
    } finally {
      isLoading = false;
      sendBtn.disabled = !input.value.trim();
    }
  }

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    sendBtn.disabled = !input.value.trim() || isLoading;
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  sendBtn.addEventListener('click', sendMessage);


})();
