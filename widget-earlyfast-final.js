(function(){

  // ============================================================
  // EARLYFAST — Widget SAV Universel v3.1
  // 
  // INSTALLATION sur n'importe quel site :
  // <script src="https://cdn.jsdelivr.net/gh/early-widget/earlyfast-widget@main/widget-earlyfast-final.js" data-client="ID_CLIENT"></script>
  //
  // Remplacer ID_CLIENT par l'identifiant dans Supabase config_clients
  // ============================================================

  // ============================================================
  // 1. RÉCUPÉRATION DU CLIENT ID
  // ============================================================
  var scriptTag = document.currentScript || document.querySelector('script[data-client]');
  var CLIENT_ID = (scriptTag && scriptTag.getAttribute('data-client')) || 'earlyfast';

  // ============================================================
  // 2. CONFIG PAR DÉFAUT (si Supabase inaccessible)
  // ============================================================
  var EF_CONFIG = {
    botName:          'Early',
    botEmoji:         '🤖',
    avatarUrl:        'https://cdn.jsdelivr.net/gh/early-widget/earlyfast-widget@main/avatar.png',
    logoUrl:          'https://cdn.jsdelivr.net/gh/early-widget/earlyfast-widget@main/logo.png',
    couleurPrimaire:  '#6B7280',
    nomBoutique:      'EarlyFast',
    messageAccueil:   "Bonjour 👋 je suis Early, l'agent qui règle vos demandes en moins d'une minute. Par où commence-t-on ?",
    webhookUrl:       'https://n8n-swkg.srv1635183.hstgr.cloud/webhook/sav-ecom',
    widgetKey:        'ef_w1dg3t_k3y_2026_change_moi',
    trackingWebhook:  'https://n8n-swkg.srv1635183.hstgr.cloud/webhook/tracking-visiteur',
    cooldownMs:       2500,
    maxMsgPerSession: 40,
    maxMessageLength: 500,
    fetchTimeoutMs:   15000,
    client_id:        CLIENT_ID
  };

  var QUICK_REPLIES = [
    { label: "Où est ma commande ? 📦",        rubrique: "suivi_commande",
      intro: "Donnez-moi votre email ou numéro de commande, je trouve ça en quelques secondes." },
    { label: "Retour / remboursement 🔁",      rubrique: "retour",
      intro: "Dites-moi en plus sur le produit concerné, je vous guide selon notre politique de retour." },
    { label: "Je ne suis pas satisfait(e) 😡", rubrique: "insatisfaction",
      intro: "Je suis désolé pour cette expérience, expliquez-moi ce qui s'est passé, je vais arranger ça rapidement." },
    { label: "Je commande régulièrement ⭐",    rubrique: "client_vip", vip: true,
      intro: "Ravi de vous revoir en tant que client fidèle, vous bénéficiez d'un traitement prioritaire ⭐. Que puis-je faire pour vous ?" },
    { label: "Question sur un produit 🛒",      rubrique: "pre_vente",
      intro: "Précisez le nom ou la référence du produit, je regarde la disponibilité et les caractéristiques." }
  ];

  // ============================================================
  // 3. CSS
  // ============================================================
  var css = `
  #ef-chat-wrapper * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; }

  #ef-chat-btn {
    position: fixed; bottom: 24px; right: 24px;
    width: 60px; height: 60px; border-radius: 50%;
    background: var(--ef-btn-color, #6B7280);
    border: none; cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    display: flex; align-items: center; justify-content: center;
    z-index: 9998; transition: transform 0.2s ease, box-shadow 0.2s ease;
    overflow: hidden; padding: 0;
  }
  #ef-chat-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,0.32); }
  #ef-chat-btn svg { width: 28px; height: 28px; fill: #fff; }
  #ef-chat-btn img.ef-icon-chat { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; display: block; }
  #ef-chat-btn .ef-icon-close { display: none; }

  #ef-notif-badge {
    position: absolute; top: -2px; right: -2px;
    background: #FF3B30; color: #fff;
    font-size: 11px; font-weight: 700;
    width: 20px; height: 20px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #fff; animation: ef-pulse 2s infinite;
  }
  @keyframes ef-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }

  #ef-chat-popup {
    position: fixed; bottom: 96px; right: 24px;
    width: 360px; max-height: 540px; border-radius: 16px;
    background: #fff; box-shadow: 0 8px 40px rgba(0,0,0,0.18);
    z-index: 9999; display: flex; flex-direction: column; overflow: hidden;
    opacity: 0; transform: translateY(16px) scale(0.97); pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  #ef-chat-popup.ef-open { opacity:1; transform:translateY(0) scale(1); pointer-events:all; }

  #ef-chat-header {
    background: var(--ef-header-color, #6B7280);
    padding: 14px 16px; display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  }
  #ef-bot-avatar { width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; overflow:hidden; }
  #ef-bot-avatar img { width:38px; height:38px; border-radius:50%; object-fit:cover; }
  .ef-header-info { flex:1; }
  .ef-header-info .ef-bot-name { color:#fff; font-weight:700; font-size:15px; }
  .ef-header-info .ef-bot-status { color:rgba(255,255,255,0.8); font-size:12px; display:flex; align-items:center; gap:4px; }
  .ef-status-dot { width:7px; height:7px; border-radius:50%; background:#4ADE80; display:inline-block; }
  #ef-close-btn { background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.8); font-size:20px; line-height:1; padding:4px; }
  #ef-close-btn:hover { color:#fff; }

  #ef-messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; background:#F7F8FA; scroll-behavior:smooth; }
  #ef-messages::-webkit-scrollbar { width:4px; }
  #ef-messages::-webkit-scrollbar-thumb { background:#ddd; border-radius:4px; }

  .ef-msg { display:flex; gap:8px; align-items:flex-end; max-width:92%; }
  .ef-msg.ef-bot { align-self:flex-start; }
  .ef-msg.ef-user { align-self:flex-end; flex-direction:row-reverse; }
  .ef-msg-avatar { width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; overflow:hidden; }
  .ef-msg-avatar img { width:28px; height:28px; border-radius:50%; object-fit:cover; }
  .ef-bubble { padding:10px 14px; border-radius:16px; font-size:14px; line-height:1.5; word-break:break-word; }
  .ef-msg.ef-bot .ef-bubble { background:#E0E0E0; color:#1a1a1a; border-bottom-left-radius:4px; }
  .ef-msg.ef-user .ef-bubble { background:var(--ef-header-color, #6B7280); color:#fff; border-bottom-right-radius:4px; }

  #ef-typing { display:none; align-self:flex-start; }
  #ef-typing.ef-show { display:flex; }
  .ef-typing-dots { background:#fff; border-radius:16px; border-bottom-left-radius:4px; padding:12px 16px; display:flex; gap:5px; align-items:center; box-shadow:0 1px 4px rgba(0,0,0,0.07); }
  .ef-dot { width:7px; height:7px; border-radius:50%; background:#bbb; animation:ef-bounce 1.2s infinite; }
  .ef-dot:nth-child(2){animation-delay:0.2s} .ef-dot:nth-child(3){animation-delay:0.4s}
  @keyframes ef-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }

  #ef-input-zone { padding:12px 14px; border-top:1px solid #EBEBEB; display:flex; gap:8px; align-items:center; background:#fff; flex-shrink:0; }
  #ef-input { flex:1; border:1.5px solid #E0E0E0; border-radius:24px; padding:9px 16px; font-size:14px; outline:none; color:#1a1a1a; transition:border-color 0.2s; resize:none; max-height:80px; }
  #ef-input:focus { border-color:var(--ef-header-color, #6B7280); }
  #ef-send-btn { width:38px; height:38px; border-radius:50%; background:var(--ef-header-color, #6B7280); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:opacity 0.2s; }
  #ef-send-btn:disabled { opacity:0.5; cursor:not-allowed; }
  #ef-send-btn svg { width:18px; height:18px; fill:#fff; }

  #ef-rate-warning { font-size:12px; color:#c0392b; text-align:center; padding:6px 14px; display:none; }

  .ef-quick-replies { display:flex; flex-direction:column; gap:8px; margin-top:6px; margin-bottom:4px; }
  .ef-quick-reply-btn {
    background: var(--ef-header-color, #6B7280); color:#fff; border:none; border-radius:20px;
    padding:12px 16px; font-size:13px; cursor:pointer; text-align:center;
    display:flex; align-items:center; justify-content:center; transition:opacity 0.2s ease;
  }
  .ef-quick-reply-btn:hover { opacity:0.88; }
  `;

  // ============================================================
  // 4. HTML
  // ============================================================
  var html = `
  <button id="ef-chat-btn" aria-label="Ouvrir le chat">
    <img class="ef-icon-chat" id="ef-logo-img" src="https://cdn.jsdelivr.net/gh/early-widget/earlyfast-widget@main/logo.png" alt="Chat" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
    <svg class="ef-icon-open" viewBox="0 0 24 24" style="display:none"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    <svg class="ef-icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    <span id="ef-notif-badge" style="display:none">1</span>
  </button>
  <div id="ef-chat-popup">
    <div id="ef-chat-header">
      <div id="ef-bot-avatar"></div>
      <div class="ef-header-info">
        <div class="ef-bot-name" id="ef-bot-name-label">Chargement...</div>
        <div class="ef-bot-status"><span class="ef-status-dot"></span> En ligne</div>
      </div>
      <button id="ef-close-btn" aria-label="Retour au menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l-7-7 7-7"/></svg>
      </button>
    </div>
    <div id="ef-messages"></div>
    <div id="ef-typing"><div class="ef-typing-dots"><div class="ef-dot"></div><div class="ef-dot"></div><div class="ef-dot"></div></div></div>
    <div id="ef-rate-warning">Merci de patienter quelques secondes avant le prochain message.</div>
    <div id="ef-input-zone">
      <textarea id="ef-input" rows="1" maxlength="500" placeholder="Écrivez votre message..."></textarea>
      <button id="ef-send-btn" aria-label="Envoyer"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
    </div>
  </div>`;

  // ============================================================
  // 5. CHARGEMENT CONFIG DEPUIS SUPABASE
  // ============================================================
  var SUPABASE_URL = 'https://qbfnhzwrdxutifhrqrrd.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZm5oendyZHh1dGlmaHJxcnJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTM0MTIsImV4cCI6MjA2MDQ2OTQxMn0.A7sPTLy7H3QGlUqHMwGY2LiGNvHMW0nCo5t5A8E3UhQ';

  async function loadConfig() {
    try {
      var res = await fetch(
        SUPABASE_URL + '/rest/v1/config_clients?client_id=eq.' + CLIENT_ID + '&select=*&limit=1',
        { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
      );
      if (!res.ok) throw new Error('Supabase error');
      var data = await res.json();
      if (data && data.length > 0) {
        var cfg = data[0];
        EF_CONFIG.botName         = cfg.bot_name         || EF_CONFIG.botName;
        EF_CONFIG.couleurPrimaire = cfg.couleur_primaire  || EF_CONFIG.couleurPrimaire;
        EF_CONFIG.nomBoutique     = cfg.nom_boutique      || EF_CONFIG.nomBoutique;
        EF_CONFIG.messageAccueil  = cfg.message_accueil   || EF_CONFIG.messageAccueil;
        EF_CONFIG.webhookUrl      = cfg.webhook_url       || EF_CONFIG.webhookUrl;
        EF_CONFIG.widgetKey       = cfg.widget_key        || EF_CONFIG.widgetKey;
        // Surcharge les URLs seulement si Supabase fournit une valeur non vide
        if (cfg.avatar_url && cfg.avatar_url.trim() !== '') EF_CONFIG.avatarUrl = cfg.avatar_url;
        if (cfg.logo_url   && cfg.logo_url.trim()   !== '') EF_CONFIG.logoUrl   = cfg.logo_url;
      }
    } catch(e) {
      console.warn('[EarlyFast] Config par défaut utilisée');
    }
    init();
  }

  // ============================================================
  // 6. INITIALISATION
  // ============================================================
  function init() {
    if (document.getElementById('ef-chat-wrapper')) return;

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var wrapper = document.createElement('div');
    wrapper.id = 'ef-chat-wrapper';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    document.documentElement.style.setProperty('--ef-header-color', EF_CONFIG.couleurPrimaire);
    document.documentElement.style.setProperty('--ef-btn-color', EF_CONFIG.couleurPrimaire);

    // Logo bouton
    var logoImg = document.getElementById('ef-logo-img');
    if (logoImg) {
      logoImg.src = EF_CONFIG.logoUrl;
      logoImg.onerror = function() {
        this.style.display = 'none';
        var svgOpen = document.querySelector('#ef-chat-btn .ef-icon-open');
        if (svgOpen) svgOpen.style.display = 'block';
      };
    }

    // Nom du bot
    document.getElementById('ef-bot-name-label').textContent = EF_CONFIG.botName;

    // Avatar header
    var avatar = document.getElementById('ef-bot-avatar');
    if (EF_CONFIG.avatarUrl) {
      var img = document.createElement('img');
      img.src = EF_CONFIG.avatarUrl;
      img.alt = 'bot';
      img.onerror = function() {
        avatar.innerHTML = '';
        avatar.textContent = EF_CONFIG.botEmoji || '🤖';
      };
      avatar.appendChild(img);
    } else {
      avatar.textContent = EF_CONFIG.botEmoji || '🤖';
    }

    startWidget();
  }

  // ============================================================
  // 7. LOGIQUE DU WIDGET
  // ============================================================
  function startWidget() {
    var sessionId = localStorage.getItem('ef_session_id');
    if (!sessionId) {
      sessionId = 'ef_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('ef_session_id', sessionId);
    }

    var btn       = document.getElementById('ef-chat-btn');
    var popup     = document.getElementById('ef-chat-popup');
    var closeBtn  = document.getElementById('ef-close-btn');
    var messages  = document.getElementById('ef-messages');
    var input     = document.getElementById('ef-input');
    var sendBtn   = document.getElementById('ef-send-btn');
    var typing    = document.getElementById('ef-typing');
    var badge     = document.getElementById('ef-notif-badge');
    var iconChat  = btn.querySelector('.ef-icon-chat');
    var iconClose = btn.querySelector('.ef-icon-close');
    var rateWarn  = document.getElementById('ef-rate-warning');

    var isOpen          = false;
    var isWaiting       = false;
    var hasOpened       = false;
    var lastSendAt      = 0;
    var msgCount        = parseInt(sessionStorage.getItem('ef_msg_count') || '0', 10);
    var currentRubrique = 'general';
    var currentVip      = false;

    var visitorData = {
      session_id: sessionId,
      page:       window.location.href,
      referrer:   document.referrer || 'direct',
      langue:     navigator.language || 'fr',
      timestamp:  new Date().toISOString(),
      boutique:   EF_CONFIG.nomBoutique,
      client_id:  CLIENT_ID
    };

    if (EF_CONFIG.trackingWebhook) {
      fetch(EF_CONFIG.trackingWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'page_view', data: visitorData }),
        keepalive: true
      }).catch(function(){});
    }

    function openChat() {
      isOpen = true;
      popup.classList.add('ef-open');
      if (iconChat) iconChat.style.display = 'none';
      if (iconClose) iconClose.style.display = 'block';
      badge.style.display = 'none';
      if (!hasOpened) {
        addBotMsg(EF_CONFIG.messageAccueil);
        addQuickReplies();
        hasOpened = true;
        track('chat_opened');
      }
      setTimeout(function(){ input.focus(); }, 300);
    }

    function closeChat() {
      isOpen = false;
      popup.classList.remove('ef-open');
      if (iconChat) iconChat.style.display = 'block';
      if (iconClose) iconClose.style.display = 'none';
    }

    function resetToMenu() {
      messages.innerHTML = '';
      currentRubrique = 'general';
      currentVip = false;
      addBotMsg(EF_CONFIG.messageAccueil);
      addQuickReplies();
    }

    btn.addEventListener('click', function(){ isOpen ? closeChat() : openChat(); });
    closeBtn.addEventListener('click', resetToMenu);

    function getAvatarHtml(size) {
      size = size || 28;
      if (EF_CONFIG.avatarUrl) {
        return '<img src="' + EF_CONFIG.avatarUrl + '" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;object-fit:cover" onerror="this.parentNode.innerHTML=\'' + (EF_CONFIG.botEmoji || '🤖') + '\'">';
      }
      return escHtml(EF_CONFIG.botEmoji || '🤖');
    }

    function addBotMsg(text) {
      var div = document.createElement('div');
      div.className = 'ef-msg ef-bot';
      div.innerHTML = '<div class="ef-msg-avatar">' + getAvatarHtml(28) + '</div><div class="ef-bubble">' + escHtml(text) + '</div>';
      messages.appendChild(div);
      scrollBottom();
    }

    function addUserMsg(text) {
      var div = document.createElement('div');
      div.className = 'ef-msg ef-user';
      div.innerHTML = '<div class="ef-bubble">' + escHtml(text) + '</div>';
      messages.appendChild(div);
      scrollBottom();
    }

    function addQuickReplies() {
      var wrap = document.createElement('div');
      wrap.className = 'ef-quick-replies';
      QUICK_REPLIES.forEach(function(qr) {
        var b = document.createElement('button');
        b.className = 'ef-quick-reply-btn';
        b.textContent = qr.label;
        b.addEventListener('click', function() {
          wrap.remove();
          messages.innerHTML = '';
          currentRubrique = qr.rubrique;
          currentVip = qr.vip || false;
          addBotMsg(qr.intro);
          setTimeout(function(){ input.focus(); }, 200);
        });
        wrap.appendChild(b);
      });
      messages.appendChild(wrap);
      scrollBottom();
    }

    function removeQuickReplies() {
      var wrap = messages.querySelector('.ef-quick-replies');
      if (wrap) wrap.remove();
    }

    async function sendMessage() {
      var text = input.value.trim();
      if (!text || isWaiting) return;
      if (text.length > EF_CONFIG.maxMessageLength) text = text.slice(0, EF_CONFIG.maxMessageLength);

      var now = Date.now();
      if (now - lastSendAt < EF_CONFIG.cooldownMs) {
        rateWarn.style.display = 'block';
        setTimeout(function(){ rateWarn.style.display = 'none'; }, 2000);
        return;
      }
      if (msgCount >= EF_CONFIG.maxMsgPerSession) {
        addBotMsg("Vous avez atteint la limite de messages pour cette session. Rechargez la page pour continuer.");
        return;
      }

      lastSendAt = now;
      msgCount++;
      sessionStorage.setItem('ef_msg_count', String(msgCount));

      addUserMsg(text);
      input.value = '';
      autoResizeInput();
      setWaiting(true);
      track('message_sent', { message: text });

      var controller = new AbortController();
      var timeoutId = setTimeout(function(){ controller.abort(); }, EF_CONFIG.fetchTimeoutMs);

      try {
        var res = await fetch(EF_CONFIG.webhookUrl, {
          method:  'POST',
          signal:  controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'X-Widget-Key': EF_CONFIG.widgetKey
          },
          body: JSON.stringify({
            message:      text,
            session_id:   sessionId,
            rubrique:     currentRubrique,
            client_id:    CLIENT_ID,
            ca_mensuel:   currentVip ? 150000 : 0,
            nb_commandes: currentVip ? 60 : 0,
            email:        localStorage.getItem('ef_email') || 'client@widget.fr',
            nom:          'Client'
          })
        });

        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var reply = (await res.text()).trim();

        // Réinitialise la rubrique après réponse reçue
        currentRubrique = 'general';
        currentVip = false;

        addBotMsg(reply || "Je reviens vers vous dans un instant.");
        track('bot_replied', { reply: reply });

      } catch(err) {
        clearTimeout(timeoutId);
        addBotMsg("Oups, une erreur s'est produite. Réessayez dans quelques secondes.");
      }

      setWaiting(false);
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    input.addEventListener('input', function(){ removeQuickReplies(); autoResizeInput(); });

    function setWaiting(val) {
      isWaiting = val;
      sendBtn.disabled = val;
      typing.classList.toggle('ef-show', val);
      if (val) scrollBottom();
    }

    function scrollBottom() {
      setTimeout(function(){ messages.scrollTop = messages.scrollHeight; }, 50);
    }

    function autoResizeInput() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 80) + 'px';
    }

    function escHtml(str) {
      return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/\n/g,'<br>');
    }

    function track(event, extra) {
      extra = extra || {};
      if (!EF_CONFIG.trackingWebhook) return;
      fetch(EF_CONFIG.trackingWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: event, data: Object.assign({}, visitorData, extra, { event: event }) }),
        keepalive: true
      }).catch(function(){});
    }

    setTimeout(function(){ if (!hasOpened) badge.style.display = 'flex'; }, 3000);
  }

  // ============================================================
  // 8. DÉMARRAGE
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadConfig);
  } else {
    loadConfig();
  }

})();
