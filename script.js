const body = document.body;

if (window.SnippetAuth) {
  window.SnippetAuth.ensureRouteAccess();
  window.SnippetAuth.applyAuthNavigation();
}

function showDashboardToast(message) {
  const toast = document.getElementById('dashboardToast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(showDashboardToast.timeoutId);
  showDashboardToast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

function updateMetricValue(elementId, callback) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const current = element.textContent.trim();
  const next = callback(current);
  element.textContent = next;
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  body.classList.toggle('dark', isDark);
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.textContent = isDark ? '☀️' : '🌙';
  }
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  applyTheme(savedTheme);
} else {
  applyTheme('light');
}

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = body.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  });
}

const menuButton = document.querySelector('.nav-toggle');
const menu = document.getElementById('menu');

if (menuButton && menu) {
  menuButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const isVisible = menu.classList.toggle('show');
    menuButton.setAttribute('aria-expanded', String(isVisible));
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
      menu.classList.remove('show');
      menuButton.setAttribute('aria-expanded', 'false');
    }
  });
}

const sidebarToggle = document.getElementById('sidebarToggle');
const templateSidebar = document.getElementById('sidebar');
const templateLayout = document.getElementById('templateLayout');

if (sidebarToggle && templateSidebar && templateLayout) {
  sidebarToggle.addEventListener('click', () => {
    const isCollapsed = templateSidebar.classList.toggle('collapsed');
    templateLayout.classList.toggle('sidebar-collapsed', isCollapsed);
    sidebarToggle.textContent = isCollapsed ? 'Expand' : 'Collapse';
  });
}

const searchInput = document.getElementById('search');
const items = document.querySelectorAll('.item');
const templateCards = document.querySelectorAll('.template-card, .templates-card');
const galleryFilters = document.querySelectorAll('.gallery-filter');

function applyGalleryFilter(category = 'all') {
  const activeFilter = category || 'all';
  const cards = document.querySelectorAll('.template-card');

  cards.forEach((card) => {
    const matches = activeFilter === 'all' || card.dataset.category === activeFilter;
    card.style.display = matches ? '' : 'none';
  });

  galleryFilters.forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === activeFilter);
  });
}

if (galleryFilters.length) {
  galleryFilters.forEach((button) => {
    button.addEventListener('click', () => {
      applyGalleryFilter(button.dataset.filter || 'all');
    });
  });
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    const activeCategory = document.querySelector('.gallery-filter.active')?.dataset.filter || 'all';
    let visibleCards = 0;

    templateCards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      const matchesText = !query || text.includes(query);
      const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
      const shouldShow = matchesText && matchesCategory;
      card.style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCards += 1;
    });

    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      const shouldShow = (!query || text.includes(query)) && (activeCategory === 'all' || item.dataset.category === activeCategory);
      item.style.display = shouldShow ? 'flex' : 'none';
    });

    const noResults = document.getElementById('noResults');
    if (noResults) {
      noResults.style.display = visibleCards === 0 ? 'block' : 'none';
    }
  });
}

const passwordInput = document.getElementById('password');
const passwordToggle = document.querySelector('.show-password');

if (passwordToggle && passwordInput) {
  passwordToggle.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    passwordToggle.textContent = isHidden ? 'Hide' : 'Show';
  });
}

function filterCategory(category, button) {
  const cards = document.querySelectorAll('.template-card, .templates-card');
  const navButtons = document.querySelectorAll('.category-active');

  cards.forEach((card) => {
    const matches = category === 'all' || card.dataset.category?.toLowerCase() === category.toLowerCase();
    card.style.display = matches ? '' : 'none';
  });

  navButtons.forEach((item) => item.classList.remove('active'));
  if (button) {
    button.classList.add('active');
  }
}

function copyCode(id) {
  const codeElement = document.getElementById(id);
  if (!codeElement) return;

  const text = codeElement.textContent.trim();
  const copyButton = document.querySelector(`[data-copy="${id}"]`);

  const doCopy = () => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      if (copyButton) {
        const original = copyButton.textContent;
        copyButton.textContent = 'Copied';
        setTimeout(() => { copyButton.textContent = original; }, 1200);
      }
    }).catch(doCopy);
  } else {
    doCopy();
  }
}

function closePreview() {
  const modal = document.getElementById('previewModal');
  const preview = document.getElementById('previewContent');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
  if (preview) preview.replaceChildren();
}

function ensurePreviewModal() {
  let modal = document.getElementById('previewModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'previewModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');

  const panel = document.createElement('div');
  panel.className = 'modal-box';
  const header = document.createElement('div');
  header.className = 'modal-header';
  const title = document.createElement('h2');
  title.textContent = 'Template preview';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'close';
  closeButton.setAttribute('aria-label', 'Close preview');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', closePreview);
  header.append(title, closeButton);

  const content = document.createElement('div');
  content.id = 'previewContent';
  panel.append(header, content);
  modal.append(panel);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closePreview();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('show')) closePreview();
  });
  document.body.append(modal);
  return modal;
}

function showPreview(codeId) {
  const modal = ensurePreviewModal();
  const preview = document.getElementById('previewContent');
  const codeElement = document.getElementById(codeId);

  if (!modal || !preview || !codeElement) return;

  const code = codeElement.textContent;
  const page = window.location.pathname.toLowerCase();
  const isCssPage = page.endsWith('/css.html');
  const isJavaScriptPage = page.endsWith('/javascript.html');
  const isSourcePage = page.endsWith('/php.html') || page.endsWith('/python.html');
  const looksLikeCss = /^\s*(?:@media|@keyframes|:root|[.#*][\w-]+|[a-z][\w-]*\s*\{)/i.test(code);
  const looksLikeJavaScript = /^\s*(?:const|let|var|function|document\.|window\.|class\s)/.test(code);
  const looksLikeServerCode = /^\s*(?:<\?php|import\s+\w+|from\s+\w+\s+import|def\s+\w+\s*\()/i.test(code);
  const mode = isSourcePage || looksLikeServerCode ? 'source' : isCssPage || looksLikeCss ? 'css' : isJavaScriptPage || looksLikeJavaScript ? 'javascript' : 'html';
  const title = codeElement.closest('.template-card, .templates-card')?.querySelector('h2, h3')?.textContent || 'Template preview';
  const frame = document.createElement('iframe');
  const canRunScripts = mode === 'javascript' || (mode === 'html' && /<script\b|\son[a-z]+\s*=/i.test(code));
  const securityPolicy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'">`;
  const baseStyles = `*{box-sizing:border-box}body{margin:0;padding:28px;background:#f3f6f8;color:#17212b;font:15px/1.6 system-ui,sans-serif}body.dark{background:#17212b;color:#f2f5f7}body.dark .preview-demo{background:#202f3a;color:#f2f5f7;border-color:#435460}body.dark .preview-demo p{color:#c3cdd4}main{max-width:760px;margin:0 auto}.preview-demo{padding:24px;background:#fff;border:1px solid #d8e0e6;border-radius:14px}.preview-demo h1,.preview-demo h2{margin:0 0 12px}.preview-demo p{color:#52616c}.preview-demo button,.preview-demo a{display:inline-block;padding:10px 14px;border:0;border-radius:8px;background:#147d72;color:#fff;text-decoration:none}.preview-menu{display:none;padding:10px}.preview-menu.show{display:block}.preview-message{display:block;margin-top:16px;color:#9b3e26}`;
  const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let documentContent;

  if (mode === 'source') {
    const language = page.endsWith('/php.html') || /^\s*<\?php/i.test(code) ? 'PHP' : 'Python';
    documentContent = `<main><p><strong>${language} source preview</strong></p><p>This runtime displays server-language templates as code; it does not execute PHP or Python.</p><pre class="preview-source">${escapeHtml(code)}</pre></main>`;
  } else if (mode === 'css') {
    const safeCss = code.replace(/<\/style/gi, '<\\/style');
    documentContent = `<style>${safeCss}</style><main><article class="preview-demo container glass-panel"><span>Workspace preview</span><h1>Design with intention</h1><p>This sample surface shows the selected CSS pattern in context.</p><button class="primary-btn">Create template</button></article></main>`;
  } else if (mode === 'javascript') {
    const safeScript = code.replace(/<\/script/gi, '<\\/script');
    documentContent = `<main><header><button class="nav-toggle" type="button">Menu</button><nav id="menu" class="preview-menu"><a href="#preview">Overview</a></nav></header><article class="preview-demo"><h1>Interaction preview</h1><p>Try the controls to see this JavaScript pattern in action.</p><form><label for="preview-email">Email</label><input id="preview-email" type="email"><button type="submit">Submit</button></form><button id="themeToggle" type="button">Toggle theme</button><output id="preview-output" class="preview-message"></output></article></main><script>try{Object.defineProperty(window,'localStorage',{value:{getItem:()=> 'dark',setItem:()=>{}},configurable:true});const previewOutput=document.getElementById('preview-output');console.log=(...values)=>{previewOutput.textContent=values.join(' ')};console.error=(...values)=>{previewOutput.textContent=values.join(' ')};${safeScript}}catch(error){document.getElementById('preview-output').textContent=error.message}</script>`;
  } else {
    documentContent = `<main>${code}</main>`;
  }

  frame.className = 'template-preview-frame';
  frame.title = `${title} preview`;
  frame.setAttribute('sandbox', canRunScripts ? 'allow-scripts' : '');
  frame.referrerPolicy = 'no-referrer';
  frame.srcdoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${securityPolicy}<style>${baseStyles}${mode === 'source' ? '.preview-source{padding:18px;background:#14212b;color:#e3f2f1;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere}' : ''}</style></head><body>${documentContent}</body></html>`;
  preview.replaceChildren(frame);
  const heading = modal.querySelector('.modal-header h2');
  if (heading) heading.textContent = `${title} preview`;
  modal.style.display = 'grid';
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

const loginForm = document.getElementById('loginForm');
const formStatus = document.querySelector('.form-status');
const loginButton = document.getElementById('loginButton');

if (loginForm) {
  const nameField = document.getElementById('nameField');
  const nameInput = document.getElementById('name');
  const authHeading = document.getElementById('authHeading');
  const authDescription = document.getElementById('authDescription');
  const authModeToggle = document.getElementById('authModeToggle');
  const params = new URLSearchParams(window.location.search);

  const setAuthMode = (mode) => {
    const isRegister = mode === 'register';
    loginForm.dataset.authMode = isRegister ? 'register' : 'login';
    if (nameField) nameField.style.display = isRegister ? 'grid' : 'none';
    if (nameInput) nameInput.required = isRegister;
    if (authHeading) authHeading.textContent = isRegister ? 'Create your workspace' : 'Welcome back';
    if (authDescription) authDescription.textContent = isRegister ? 'Create an account to continue' : 'Log in to continue';
    if (loginButton) loginButton.textContent = isRegister ? 'Create account' : 'Login';
    if (authModeToggle) authModeToggle.textContent = isRegister ? 'I already have an account' : 'Create an account';
    if (passwordInput) passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
    if (formStatus) formStatus.textContent = '';
  };

  setAuthMode(params.get('mode') === 'register' ? 'register' : 'login');
  authModeToggle?.addEventListener('click', () => {
    setAuthMode(loginForm.dataset.authMode === 'register' ? 'login' : 'register');
  });

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const isRegister = loginForm.dataset.authMode === 'register';

    if (!email || !password || !email.value || !password.value || (isRegister && !nameInput?.value.trim())) {
      if (formStatus) formStatus.textContent = 'Complete all required fields to continue.';
      return;
    }

    if (loginButton) {
      loginButton.disabled = true;
      loginButton.textContent = isRegister ? 'Creating account...' : 'Signing in...';
    }

    const action = isRegister ? window.SnippetAuth?.register : window.SnippetAuth?.login;
    const details = {
      email: email.value.trim(),
      password: password.value,
      remember: Boolean(document.getElementById('remember')?.checked)
    };
    if (isRegister) details.name = nameInput.value.trim();

    Promise.resolve(action ? action(details) : Promise.reject(new Error('Start Snippet Studio with npm start to use account features.')))
      .then(() => {
        if (formStatus) formStatus.textContent = 'Signed in. Opening your workspace...';
        const requestedNext = params.get('next');
        const validDestinations = new Set(['/dashboard.html', '/html.html', '/css.html', '/javascript.html', '/php.html', '/python.html']);
        let destination = '/dashboard.html';
        if (requestedNext) {
          try {
            const parsed = new URL(requestedNext, window.location.origin);
            if (parsed.origin === window.location.origin && validDestinations.has(parsed.pathname)) destination = `${parsed.pathname}${parsed.search}${parsed.hash}`;
          } catch (error) {
            destination = '/dashboard.html';
          }
        }
        window.location.assign(destination);
      })
      .catch((error) => {
        if (formStatus) formStatus.textContent = error.message;
        if (loginButton) {
          loginButton.disabled = false;
          loginButton.textContent = isRegister ? 'Create account' : 'Login';
        }
      });
  });
}

const filterButtons = document.querySelectorAll('.category-active');
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterCategory(button.dataset.filter || 'all', button);
  });
});

const copyButtons = document.querySelectorAll('.copy-btn');
copyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const id = button.dataset.copy;
    if (id) copyCode(id);
  });
});

const previewButtons = document.querySelectorAll('.preview-btn');
previewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const codeId = button.dataset.code;
    if (codeId) showPreview(codeId);
  });
});

const revealCards = document.querySelectorAll('.reveal-card');
if (revealCards.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealCards.forEach((card) => revealObserver.observe(card));
}

const liveClock = document.getElementById('liveClock');
if (liveClock) {
  const updateClock = () => {
    const now = new Date();
    liveClock.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  updateClock();
  setInterval(updateClock, 1000);
}

const publishDashboardButton = document.querySelector('.dashboard-btn');
if (publishDashboardButton) {
  publishDashboardButton.addEventListener('click', () => {
    const list = document.getElementById('recentUploadsList');
    if (list) {
      const item = document.createElement('li');
      item.innerHTML = '<span>Launch sprint</span><strong>Just now</strong>';
      list.prepend(item);
    }

    updateMetricValue('activeProjectsValue', (value) => {
      const count = Number.parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
      return `${count + 1}`;
    });

    const downloadsValue = document.getElementById('downloadsValue');
    if (downloadsValue) {
      const current = Number.parseFloat(String(downloadsValue.textContent).replace(/[^0-9.]/g, '')) || 0;
      downloadsValue.textContent = `${(current + 0.4).toFixed(1)}k`;
    }

    showDashboardToast('New release published.');
  });
}

const dashboardActions = document.querySelectorAll('[data-action]');
dashboardActions.forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    const list = document.getElementById('recentUploadsList');

    if (action === 'new-template' && list) {
      const item = document.createElement('li');
      item.innerHTML = '<span>New concept</span><strong>Now</strong>';
      list.prepend(item);
      showDashboardToast('Template draft created.');
    }

    if (action === 'invite-team') {
      showDashboardToast('Team invite sent.');
    }

    if (action === 'export-pack') {
      updateMetricValue('downloadsValue', (value) => {
        const count = Number.parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
        return `${(count + 0.8).toFixed(1)}k`;
      });
      showDashboardToast('Export pack queued.');
    }
  });
});

const previewTrigger = document.querySelector('.preview-trigger');
const previewModal = document.getElementById('previewModal');
const previewFrame = document.getElementById('previewFrame');
const closePreviewBtn = document.getElementById('closePreviewBtn');

function openLivePreview() {
  if (!previewModal || !previewFrame) return;

  const previewMarkup = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1.0" />
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #0b1120, #111827 50%, #1d4ed8);
          color: white;
          min-height: 100vh;
          display: grid;
          place-items: center;
        }
        .preview-shell {
          width: min(520px, 88vw);
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 25px 60px rgba(2, 6, 23, 0.4);
        }
        .eyebrow {
          display: inline-flex;
          background: rgba(96, 165, 250, 0.16);
          border-radius: 999px;
          padding: 8px 12px;
          color: #bfdbfe;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        h1 {
          margin: 0 0 12px;
          font-size: clamp(2rem, 5vw, 3rem);
          line-height: 1.05;
        }
        p {
          margin: 0 0 20px;
          color: #dbeafe;
          line-height: 1.7;
        }
        .cta-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn {
          border: none;
          border-radius: 12px;
          padding: 12px 18px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn.primary {
          background: linear-gradient(135deg, #7dd3fc, #a78bfa);
          color: #071827;
        }
        .btn.secondary {
          background: rgba(255,255,255,0.08);
          color: white;
          border: 1px solid rgba(255,255,255,0.12);
        }
      </style>
    </head>
    <body>
      <div class="preview-shell">
        <div class="eyebrow">Live demo</div>
        <h1>Launch smarter.</h1>
        <p>Turn code into polished product experiences with premium templates and a workflow built for modern teams.</p>
        <div class="cta-row">
          <button class="btn primary">Start now</button>
          <button class="btn secondary">View docs</button>
        </div>
      </div>
    </body>
    </html>
  `;

  previewFrame.srcdoc = previewMarkup;
  previewModal.classList.add('show');
  previewModal.setAttribute('aria-hidden', 'false');
}

if (previewTrigger) {
  previewTrigger.addEventListener('click', openLivePreview);
}

if (closePreviewBtn) {
  closePreviewBtn.addEventListener('click', () => {
    previewModal.classList.remove('show');
    previewModal.setAttribute('aria-hidden', 'true');
  });
}

if (previewModal) {
  previewModal.addEventListener('click', (event) => {
    if (event.target === previewModal) {
      previewModal.classList.remove('show');
      previewModal.setAttribute('aria-hidden', 'true');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && previewModal.classList.contains('show')) {
      previewModal.classList.remove('show');
      previewModal.setAttribute('aria-hidden', 'true');
    }
  });
}

if (closePreviewBtn) {
  closePreviewBtn.addEventListener('click', closePreview);
}

const APP_STATE_KEY = 'snippetStudioCommunityState';
const CURRENT_USER = 'Ava Victor';
const reviewsPostedCount = document.getElementById('reviewsPostedCount');

const defaultState = {
  profiles: [
    { name: 'Ava Victor', handle: '@avacodes', followers: 12400, following: ['Nia Brooks', 'Theo Miles'], avatar: 'AV' },
    { name: 'Nia Brooks', handle: '@niabr', followers: 9600, following: ['Ava Victor'], avatar: 'NB' },
    { name: 'Theo Miles', handle: '@theom', followers: 8300, following: ['Ava Victor'], avatar: 'TM' },
    { name: 'Mila Hart', handle: '@mila', followers: 7100, following: [], avatar: 'MH' }
  ],
  templates: [
    { id: 'starter-1', title: 'Hero Section', author: 'Nia Brooks', category: 'layout', description: 'Premium launch hero with stacked CTA blocks.', code: '<section class="hero"><h1>Launch smarter.</h1></section>' },
    { id: 'starter-2', title: 'Pricing Card', author: 'Theo Miles', category: 'layout', description: 'Simple, polished pricing block for software products.', code: '<div class="pricing"><h2>Pro</h2></div>' }
  ],
  notifications: [
    { id: 'n1', author: 'Nia Brooks', message: 'published a new pricing section template.' },
    { id: 'n2', author: 'Jules', message: 'left a new review on your hero layout.' }
  ],
  followedBy: {
    'Nia Brooks': [CURRENT_USER],
    'Theo Miles': [CURRENT_USER]
  }
};

function loadAppState() {
  try {
    const saved = JSON.parse(localStorage.getItem(APP_STATE_KEY) || 'null');
    if (!saved) {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify(defaultState));
      return structuredClone(defaultState);
    }
    return saved;
  } catch (error) {
    return structuredClone(defaultState);
  }
}

const appState = structuredClone(defaultState);

async function syncAppStateFromServer() {
  if (window.location.protocol === 'file:') return;

  try {
    const response = await fetch('/api/state');
    if (!response.ok) throw new Error('Unable to load server state');

    const data = await response.json();
    if (data && Array.isArray(data.templates)) {
      Object.keys(appState).forEach((key) => delete appState[key]);
      Object.assign(appState, data);
      saveAppState();
    }
  } catch (error) {
    console.warn('Using local community state fallback.', error);
  }
}

async function persistAppState() {
  saveAppState();

  if (window.location.protocol === 'file:') return;

  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appState)
    });
  } catch (error) {
    console.warn('Server sync unavailable; local save preserved.', error);
  }
}

function saveAppState() {
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(appState));
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function updateLiveCounters() {
  if (window.location.pathname.endsWith('/html.html')) return;

  const liveUsersCount = document.getElementById('liveUsersCount');
  const templatesAvailableCount = document.getElementById('templatesAvailableCount');
  const reviewsPostedCount = document.getElementById('reviewsPostedCount');
  const onlineUsers = document.getElementById('onlineUsers');
  const sharedTemplates = document.getElementById('sharedTemplates');
  const templateTotal = document.getElementById('templateTotal');

  const users = 1482 + Math.floor(Math.random() * 82);
  const templates = appState.templates.length + 300 + Math.floor(Math.random() * 16);
  const reviews = 1208 + Math.floor(Math.random() * 43);

  if (liveUsersCount) liveUsersCount.textContent = formatNumber(users);
  if (templatesAvailableCount) templatesAvailableCount.textContent = formatNumber(templates);
  if (reviewsPostedCount) reviewsPostedCount.textContent = formatNumber(reviews);
  if (onlineUsers) onlineUsers.textContent = formatNumber(users);
  if (sharedTemplates) sharedTemplates.textContent = formatNumber(templates);
  if (templateTotal) templateTotal.textContent = `${templates}+`;
}

function renderNotifications() {
  const list = document.getElementById('notificationList');
  if (!list) return;

  list.innerHTML = (appState.notifications || []).slice(0, 4).map((item) => `
    <div class="notification-item ${item.unread !== false ? 'unread' : ''}">
      <span class="dot"></span>
      <div>
        <strong>${item.author}</strong>
        <p>${item.message}</p>
      </div>
    </div>
  `).join('');
}

function renderFollowers() {
  const list = document.getElementById('followersList');
  if (!list) return;

  list.innerHTML = (appState.profiles || []).slice(0, 4).map((profile) => {
    const isFollowing = (appState.followedBy?.[profile.name] || []).includes(CURRENT_USER);
    return `
      <button type="button" class="follow-user ${isFollowing ? 'active' : ''}" data-user="${profile.name}">
        ${profile.name}
      </button>
    `;
  }).join('');

  list.querySelectorAll('.follow-user').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.user;
      if (!target) return;
      const followers = appState.followedBy[target] || [];
      const already = followers.includes(CURRENT_USER);

      if (already) {
        appState.followedBy[target] = followers.filter((person) => person !== CURRENT_USER);
      } else {
        appState.followedBy[target] = [...followers, CURRENT_USER];
        appState.notifications.unshift({
          id: `notify-${Date.now()}`,
          author: 'System',
          message: `You started following ${target}. You'll get alerts for their new snippets.`
        });
      }

      persistAppState();
      renderFollowers();
      renderNotifications();
    });
  });
}

function renderGlobalTemplates() {
  const templatesContainer = document.getElementById('templates');
  if (!templatesContainer || templatesContainer.dataset.community !== 'true') return;

  const freshEntries = [...(appState.templates || [])].reverse();
  const currentCards = [...templatesContainer.querySelectorAll('.template-card, .templates-card')];

  currentCards.forEach((card) => {
    const tag = card.dataset.category || 'layout';
    if (card.dataset.global !== 'true') {
      card.dataset.global = 'false';
    }
  });

  freshEntries.forEach((template) => {
    const existing = Array.from(templatesContainer.querySelectorAll('.template-card, .templates-card')).find((card) => card.dataset.templateId === template.id);
    if (existing) return;

    const templateCard = document.createElement('article');
    templateCard.className = 'template-card';
    templateCard.dataset.category = template.category;
    templateCard.dataset.templateId = template.id;
    templateCard.dataset.global = 'true';

    const safeTitle = template.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeCode = template.code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    templateCard.innerHTML = `
      <div class="card-top">
        <span class="tag">${String(template.category).toUpperCase()}</span>
        <h2>${safeTitle}</h2>
      </div>
      <div class="card-body">
        <p>Shared by ${template.author} — ${template.description}</p>
        <pre class="code" id="${template.id}">${safeCode}</pre>
        <div class="actions">
          <button type="button" class="btn copy-btn" data-copy="${template.id}">Copy</button>
          <button type="button" class="btn preview-btn" data-code="${template.id}">Preview</button>
        </div>
      </div>
    `;

    templatesContainer.prepend(templateCard);
    templateCard.querySelector('.copy-btn')?.addEventListener('click', () => copyCode(template.id));
    templateCard.querySelector('.preview-btn')?.addEventListener('click', () => showPreview(template.id));
  });
}

function broadcastState() {
  persistAppState();
  window.dispatchEvent(new StorageEvent('storage', { key: APP_STATE_KEY, newValue: JSON.stringify(appState) }));
}

function registerSharedStateSync() {
  window.addEventListener('storage', (event) => {
    if (event.key !== APP_STATE_KEY || !event.newValue) return;
    try {
      const incoming = JSON.parse(event.newValue);
      Object.assign(appState, incoming);
      renderNotifications();
      renderFollowers();
      renderGlobalTemplates();
      updateLiveCounters();
    } catch (error) {
      console.error('Could not sync community state', error);
    }
  });
}

setInterval(updateLiveCounters, 2200);

const publishTemplateForm = document.getElementById('publishTemplateForm');
if (publishTemplateForm) {
  publishTemplateForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = document.getElementById('templateTitle').value.trim();
    const category = document.getElementById('templateCategory').value;
    const description = document.getElementById('templateDescription').value.trim();
    const code = document.getElementById('templateCode').value.trim();

    if (!title || !description || !code) {
      return;
    }

    const template = {
      id: `community-${Date.now()}`,
      title,
      author: CURRENT_USER,
      category,
      description,
      code
    };

    appState.templates.unshift(template);
    const followers = appState.followedBy?.[CURRENT_USER] || [];

    if (followers.length > 0) {
      followers.forEach((name) => {
        appState.notifications.unshift({
          id: `follow-${Date.now()}-${name}`,
          author: CURRENT_USER,
          message: `published “${title}” and it is now live for everyone in the community.`
        });
      });
    }

    const templateCard = document.createElement('article');
    templateCard.className = 'template-card';
    templateCard.dataset.category = category;
    templateCard.dataset.templateId = template.id;

    const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    templateCard.innerHTML = `
      <div class="card-top">
        <span class="tag">${category.toUpperCase()}</span>
        <h2>${safeTitle}</h2>
      </div>
      <div class="card-body">
        <p>Shared by ${CURRENT_USER} — ${description}</p>
        <pre class="code" id="${template.id}">${safeCode}</pre>
        <div class="actions">
          <button type="button" class="btn copy-btn" data-copy="${template.id}">Copy</button>
          <button type="button" class="btn preview-btn" data-code="${template.id}">Preview</button>
        </div>
      </div>
    `;

    const templatesContainer = document.getElementById('templates');
    if (templatesContainer) {
      templatesContainer.prepend(templateCard);
      templateCard.querySelector('.copy-btn')?.addEventListener('click', () => copyCode(template.id));
      templateCard.querySelector('.preview-btn')?.addEventListener('click', () => showPreview(template.id));
    }

    const noResults = document.getElementById('noResults');
    if (noResults) noResults.style.display = 'none';

    publishTemplateForm.reset();
    broadcastState();
    renderNotifications();
    renderFollowers();
    updateLiveCounters();
  });
}

async function bootstrapCommunityExperience() {
  await syncAppStateFromServer();
  renderNotifications();
  renderFollowers();
  renderGlobalTemplates();
  updateLiveCounters();
  registerSharedStateSync();
}

const reviewForm = document.getElementById('reviewForm');
const communityReviews = document.getElementById('communityReviews');

if (reviewForm && communityReviews) {
  reviewForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const author = document.getElementById('reviewAuthor').value.trim();
    const message = document.getElementById('reviewMessage').value.trim();

    if (!author || !message) return;

    const item = document.createElement('article');
    item.className = 'comment-item';
    const initials = author.charAt(0).toUpperCase();
    item.innerHTML = `
      <div class="avatar">${initials}</div>
      <div>
        <h4>${author}</h4>
        <p>${message}</p>
      </div>
    `;

    communityReviews.prepend(item);
    reviewForm.reset();

    const currentReviewTotal = Number((reviewsPostedCount?.textContent || '1208').replace(/,/g, '')) || 1208;
    if (reviewsPostedCount) {
      reviewsPostedCount.textContent = formatNumber(currentReviewTotal + 1);
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closePreview();
  }
});

void bootstrapCommunityExperience;
