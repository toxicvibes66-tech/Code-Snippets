(() => {
  const templatesContainer = document.getElementById('templates');
  const publishForm = document.getElementById('serverPublishTemplateForm');
  const reviewForm = document.getElementById('serverReviewForm');
  if (!templatesContainer) return;

  let currentUser = null;
  let templates = [];

  function statusFor(form, message, isError = false) {
    let status = form.querySelector('.form-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'form-status';
      status.setAttribute('aria-live', 'polite');
      form.append(status);
    }
    status.textContent = message;
    status.style.color = isError ? 'var(--danger)' : 'var(--success)';
  }

  function makeButton(label, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function renderTemplates() {
    templatesContainer.replaceChildren();
    templates.forEach((template) => {
      const card = document.createElement('article');
      card.className = 'template-card';
      card.dataset.category = template.category;
      card.dataset.templateId = template.id;

      const heading = document.createElement('div');
      heading.className = 'card-top';
      const category = document.createElement('span');
      category.className = 'tag';
      category.textContent = template.category;
      const title = document.createElement('h2');
      title.textContent = template.title;
      heading.append(category, title);

      const body = document.createElement('div');
      body.className = 'card-body';
      const description = document.createElement('p');
      description.textContent = `Shared by ${template.author} · ${template.description}`;
      const code = document.createElement('pre');
      code.className = 'code';
      code.id = `code-${template.id}`;
      code.textContent = template.code;

      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.append(
        makeButton('Copy', 'btn copy-btn', async () => {
          try {
            await navigator.clipboard.writeText(template.code);
            statusFor(publishForm || document.body, `Copied “${template.title}”.`);
          } catch (error) {
            statusFor(publishForm || document.body, 'Clipboard access is unavailable in this browser.', true);
          }
        }),
        makeButton('Preview', 'btn preview-btn', () => {
          if (typeof window.showPreview === 'function') window.showPreview(code.id);
        })
      );

      if (template.authorId && template.authorId === currentUser.id) {
        actions.append(makeButton('Delete', 'btn preview-btn', async () => {
          if (!window.confirm(`Delete “${template.title}”?`)) return;
          try {
            await window.SnippetAuth.request(`/api/templates/${encodeURIComponent(template.id)}`, { method: 'DELETE' });
            await loadTemplates();
          } catch (error) {
            statusFor(publishForm || document.body, error.message, true);
          }
        }));
      }

      body.append(description, code, actions);
      card.append(heading, body);
      templatesContainer.append(card);
    });
    applyFilters();
  }

  function applyFilters() {
    const query = (document.getElementById('search')?.value || '').trim().toLowerCase();
    const activeCategory = document.querySelector('.category-active.active')?.dataset.filter || 'all';
    let visibleCount = 0;
    templatesContainer.querySelectorAll('.template-card').forEach((card) => {
      const categoryMatches = activeCategory === 'all' || card.dataset.category === activeCategory;
      const textMatches = !query || card.textContent.toLowerCase().includes(query);
      const visible = categoryMatches && textMatches;
      card.style.display = visible ? '' : 'none';
      if (visible) visibleCount += 1;
    });
    const noResults = document.getElementById('noResults');
    if (noResults) noResults.style.display = visibleCount ? 'none' : 'block';
  }

  async function loadTemplates() {
    const result = await window.SnippetAuth.request('/api/templates');
    templates = result.templates;
    renderTemplates();
    const count = document.getElementById('templatesAvailableCount');
    const total = document.getElementById('templateTotal');
    const shared = document.getElementById('sharedTemplates');
    if (count) count.textContent = new Intl.NumberFormat().format(templates.length);
    if (total) total.textContent = `${templates.length}`;
    if (shared) shared.textContent = new Intl.NumberFormat().format(templates.length);
  }

  async function loadReviews() {
    const list = document.getElementById('communityReviews');
    if (!list) return;
    const result = await window.SnippetAuth.request('/api/reviews');
    list.replaceChildren();
    result.reviews.forEach((review) => {
      const item = document.createElement('article');
      item.className = 'comment-item';
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = review.author.slice(0, 1).toUpperCase();
      const content = document.createElement('div');
      const author = document.createElement('h4');
      author.textContent = review.author;
      const message = document.createElement('p');
      message.textContent = review.message;
      content.append(author, message);
      item.append(avatar, content);
      list.append(item);
    });
    const count = document.getElementById('reviewsPostedCount');
    if (count) count.textContent = new Intl.NumberFormat().format(result.reviews.length);
  }

  async function loadCommunity() {
    const [usersResult, followsResult, notificationsResult] = await Promise.all([
      window.SnippetAuth.request('/api/users'),
      window.SnippetAuth.request('/api/follows'),
      window.SnippetAuth.request('/api/notifications')
    ]);
    const followed = new Set(followsResult.follows.map((item) => item.followingId));
    const followersList = document.getElementById('followersList');
    if (followersList) {
      followersList.replaceChildren();
      usersResult.users.forEach((user) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `follow-user ${followed.has(user.id) ? 'active' : ''}`;
        button.dataset.userId = user.id;
        button.textContent = `${followed.has(user.id) ? 'Following' : 'Follow'} ${user.name}`;
        button.addEventListener('click', async () => {
          try {
            await window.SnippetAuth.request(`/api/follows/${encodeURIComponent(user.id)}`, { method: 'POST' });
            await loadCommunity();
          } catch (error) {
            statusFor(publishForm || document.body, error.message, true);
          }
        });
        followersList.append(button);
      });
    }

    const notifications = document.getElementById('notificationList');
    if (notifications) {
      notifications.replaceChildren();
      notificationsResult.notifications.forEach((notification) => {
        const item = document.createElement('div');
        item.className = 'notification-item';
        const dot = document.createElement('span');
        dot.className = 'dot';
        const content = document.createElement('div');
        const author = document.createElement('strong');
        author.textContent = notification.author;
        const message = document.createElement('p');
        message.textContent = notification.message;
        content.append(author, message);
        item.append(dot, content);
        notifications.append(item);
      });
    }

    const online = document.getElementById('liveUsersCount');
    const onlineSidebar = document.getElementById('onlineUsers');
    if (online) online.textContent = new Intl.NumberFormat().format(usersResult.users.length + 1);
    if (onlineSidebar) onlineSidebar.textContent = new Intl.NumberFormat().format(usersResult.users.length + 1);
  }

  document.querySelectorAll('.category-active').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.category-active').forEach((item) => item.classList.toggle('active', item === button));
      applyFilters();
    });
  });
  document.getElementById('search')?.addEventListener('input', applyFilters);

  publishForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = publishForm.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await window.SnippetAuth.request('/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          title: document.getElementById('templateTitle').value.trim(),
          category: document.getElementById('templateCategory').value,
          description: document.getElementById('templateDescription').value.trim(),
          code: document.getElementById('templateCode').value.trim()
        })
      });
      publishForm.reset();
      statusFor(publishForm, 'Template saved to your account and shared with the library.');
      await loadTemplates();
      await loadCommunity();
    } catch (error) {
      statusFor(publishForm, error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  reviewForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = reviewForm.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      await window.SnippetAuth.request('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ message: document.getElementById('reviewMessage').value.trim() })
      });
      reviewForm.reset();
      statusFor(reviewForm, 'Your review has been saved.');
      await loadReviews();
      await loadCommunity();
    } catch (error) {
      statusFor(reviewForm, error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  async function initialize() {
    try {
      currentUser = await window.SnippetAuth.getCurrentUser();
      if (!currentUser) {
        window.location.replace('/login.html');
        return;
      }
      const profileName = document.querySelector('.profile-top h3');
      const profileHandle = document.querySelector('.profile-top p');
      const profileAvatar = document.querySelector('.profile-avatar');
      if (profileName) profileName.textContent = currentUser.name;
      if (profileHandle) profileHandle.textContent = currentUser.email;
      if (profileAvatar) profileAvatar.textContent = currentUser.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
      await Promise.all([loadTemplates(), loadReviews(), loadCommunity()]);
    } catch (error) {
      console.error('Could not load the template workspace.', error);
      statusFor(publishForm || document.body, error.message, true);
    }
  }

  if (window.EventSource) {
    const eventStream = new EventSource('/api/events');
    eventStream.addEventListener('template-published', (event) => {
      const { template } = JSON.parse(event.data);
      templates = [template, ...templates.filter((item) => item.id !== template.id)];
      renderTemplates();
      loadCommunity();
    });
    eventStream.addEventListener('template-updated', (event) => {
      const { template } = JSON.parse(event.data);
      templates = templates.map((item) => item.id === template.id ? template : item);
      renderTemplates();
    });
    eventStream.addEventListener('template-deleted', (event) => {
      const { id } = JSON.parse(event.data);
      templates = templates.filter((item) => item.id !== id);
      renderTemplates();
    });
    eventStream.addEventListener('review-created', () => {
      loadReviews();
      loadCommunity();
    });
    eventStream.addEventListener('follow-updated', loadCommunity);
    window.addEventListener('pagehide', () => eventStream.close(), { once: true });
  }

  initialize();
})();
