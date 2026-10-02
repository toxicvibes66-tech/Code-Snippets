/* =========================================================
   SNIPPET STUDIO — DASHBOARD.JS
   Advanced interactive dashboard engine
   ========================================================= */

(() => {
    "use strict";

    /* =========================================================
       CONFIGURATION
       ========================================================= */

    const STORAGE_KEYS = {
        theme: "snippetStudio_theme",
        notifications: "snippetStudio_notifications",
        projects: "snippetStudio_projects",
        settings: "snippetStudio_settings",
        recentSearches: "snippetStudio_recentSearches"
    };

    const DEFAULT_SETTINGS = {
        theme: "dark",
        compactMode: false,
        animations: true,
        autoSave: true
    };

    /* =========================================================
       DOM HELPERS
       ========================================================= */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const createElement = (tag, className = "", html = "") => {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (html) {
            element.innerHTML = html;
        }

        return element;
    };

    /* =========================================================
       STATE
       ========================================================= */

    const state = {
        settings: loadJSON(
            STORAGE_KEYS.settings,
            DEFAULT_SETTINGS
        ),

        notifications: loadJSON(
            STORAGE_KEYS.notifications,
            [
                {
                    id: 1,
                    title: "Welcome to Snippet Studio",
                    message: "Your workspace is ready.",
                    time: "Just now",
                    read: false
                },
                {
                    id: 2,
                    title: "Project published",
                    message: "Your latest template is live.",
                    time: "12 min ago",
                    read: false
                },
                {
                    id: 3,
                    title: "Storage update",
                    message: "You are using 42% of your storage.",
                    time: "1 hour ago",
                    read: true
                }
            ]
        ),

        projects: loadJSON(
            STORAGE_KEYS.projects,
            []
        ),

        recentSearches: loadJSON(
            STORAGE_KEYS.recentSearches,
            []
        ),

        chartRange: "7D",
        sidebarOpen: false,
        notificationsOpen: false,
        activeModal: null
    };

    /* =========================================================
       INITIALIZATION
       ========================================================= */

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        applyTheme();
        initializeSidebar();
        initializeThemeToggle();
        initializeNotifications();
        initializeSearch();
        initializeChartControls();
        initializeModals();
        initializeNavigation();
        initializeCounters();
        initializeClock();
        initializeKeyboardShortcuts();
        initializeStorageMeter();
        initializeAnimations();
        updateNotificationBadge();
        renderNotifications();

        showToast(
            "Dashboard ready",
            "Welcome back to Snippet Studio.",
            "success",
            false
        );
    }

    /* =========================================================
       LOCAL STORAGE
       ========================================================= */

    function loadJSON(key, fallback) {
        try {
            const value = localStorage.getItem(key);

            if (!value) {
                return fallback;
            }

            return JSON.parse(value);
        } catch (error) {
            console.warn(`Could not load ${key}`, error);
            return fallback;
        }
    }

    function saveJSON(key, value) {
        try {
            localStorage.setItem(
                key,
                JSON.stringify(value)
            );
        } catch (error) {
            console.warn(`Could not save ${key}`, error);
        }
    }

    /* =========================================================
       THEME
       ========================================================= */

    function applyTheme() {
        const theme =
            state.settings.theme === "light"
                ? "light"
                : "dark";

        document.documentElement.dataset.theme = theme;
        document.body.classList.toggle(
            "light-theme",
            theme === "light"
        );

        const themeButtons = $$(
            "[data-theme-toggle], #themeToggle"
        );

        themeButtons.forEach(button => {
            button.setAttribute(
                "aria-label",
                theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
            );

            const icon = button.querySelector(
                "i, svg"
            );

            if (icon && icon.tagName === "I") {
                icon.className =
                    theme === "dark"
                        ? "fa-solid fa-sun"
                        : "fa-solid fa-moon";
            }
        });
    }

    function initializeThemeToggle() {
        const buttons = $$(
            "[data-theme-toggle], #themeToggle"
        );

        buttons.forEach(button => {
            button.addEventListener(
                "click",
                toggleTheme
            );
        });
    }

    function toggleTheme() {
        state.settings.theme =
            state.settings.theme === "dark"
                ? "light"
                : "dark";

        saveJSON(
            STORAGE_KEYS.settings,
            state.settings
        );

        applyTheme();

        showToast(
            "Theme changed",
            state.settings.theme === "dark"
                ? "Dark mode enabled."
                : "Light mode enabled.",
            "success"
        );
    }

    /* =========================================================
       SIDEBAR
       ========================================================= */

    function initializeSidebar() {
        const menuButtons = $$(
            "[data-sidebar-toggle], #menuToggle, .mobile-menu-toggle"
        );

        menuButtons.forEach(button => {
            button.addEventListener(
                "click",
                toggleSidebar
            );
        });

        const overlay = $(
            ".sidebar-overlay"
        );

        if (overlay) {
            overlay.addEventListener(
                "click",
                closeSidebar
            );
        }

        $$(".sidebar a").forEach(link => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= 900) {
                    closeSidebar();
                }
            });
        });

        window.addEventListener(
            "resize",
            () => {
                if (window.innerWidth > 900) {
                    closeSidebar();
                }
            }
        );
    }

    function toggleSidebar() {
        state.sidebarOpen =
            !state.sidebarOpen;

        document.body.classList.toggle(
            "sidebar-open",
            state.sidebarOpen
        );

        const sidebar = $(
            ".sidebar"
        );

        if (sidebar) {
            sidebar.classList.toggle(
                "open",
                state.sidebarOpen
            );
        }

        const overlay = $(
            ".sidebar-overlay"
        );

        if (overlay) {
            overlay.classList.toggle(
                "active",
                state.sidebarOpen
            );
        }
    }

    function closeSidebar() {
        state.sidebarOpen = false;

        document.body.classList.remove(
            "sidebar-open"
        );

        const sidebar = $(
            ".sidebar"
        );

        if (sidebar) {
            sidebar.classList.remove("open");
        }

        const overlay = $(
            ".sidebar-overlay"
        );

        if (overlay) {
            overlay.classList.remove("active");
        }
    }

    /* =========================================================
       NAVIGATION
       ========================================================= */

    function initializeNavigation() {
        $$(".nav-item, .sidebar-nav a").forEach(item => {
            item.addEventListener(
                "click",
                function () {
                    $$(".nav-item, .sidebar-nav a")
                        .forEach(nav => {
                            nav.classList.remove(
                                "active"
                            );
                        });

                    this.classList.add("active");
                }
            );
        });
    }

    /* =========================================================
       CLOCK
       ========================================================= */

    function initializeClock() {
        updateClock();

        setInterval(
            updateClock,
            1000
        );
    }

    function updateClock() {
        const clock =
            $("#liveClock") ||
            $(".live-clock");

        if (!clock) {
            return;
        }

        const now = new Date();

        clock.textContent =
            now.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );
    }

    /* =========================================================
       ANIMATED COUNTERS
       ========================================================= */

    function initializeCounters() {
        const counters = $$(
            "[data-count], .stat-value[data-target]"
        );

        counters.forEach(counter => {
            let target =
                counter.dataset.count ||
                counter.dataset.target;

            target = Number(
                String(target).replace(
                    /[^0-9.-]/g,
                    ""
                )
            );

            if (!Number.isFinite(target)) {
                return;
            }

            animateCounter(
                counter,
                target
            );
        });
    }

    function animateCounter(
        element,
        target
    ) {
        const duration = 1200;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed =
                currentTime - startTime;

            const progress =
                Math.min(
                    elapsed / duration,
                    1
                );

            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );

            const value =
                Math.round(
                    target * eased
                );

            element.textContent =
                formatNumber(value);

            if (progress < 1) {
                requestAnimationFrame(
                    update
                );
            }
        }

        requestAnimationFrame(
            update
        );
    }

    function formatNumber(number) {
        return Number(number).toLocaleString();
    }

    /* =========================================================
       SEARCH
       ========================================================= */

    function initializeSearch() {
        const searchInputs = $$(
            "#globalSearch, .global-search input, [data-dashboard-search]"
        );

        searchInputs.forEach(input => {
            input.addEventListener(
                "input",
                event => {
                    performDashboardSearch(
                        event.target.value
                    );
                }
            );

            input.addEventListener(
                "keydown",
                event => {
                    if (
                        event.key === "Enter"
                    ) {
                        const query =
                            event.target.value.trim();

                        if (query) {
                            saveRecentSearch(
                                query
                            );

                            showToast(
                                "Search",
                                `Searching for "${query}"`,
                                "info"
                            );
                        }
                    }
                }
            );
        });
    }

    function performDashboardSearch(query) {
        const normalized =
            query
                .trim()
                .toLowerCase();

        const searchableItems =
            $$(".searchable, .project-card, .recent-item, .template-card");

        if (!normalized) {
            searchableItems.forEach(
                item => {
                    item.style.display = "";
                }
            );

            return;
        }

        searchableItems.forEach(item => {
            const text =
                item.textContent
                    .toLowerCase();

            item.style.display =
                text.includes(normalized)
                    ? ""
                    : "none";
        });
    }

    function saveRecentSearch(query) {
        state.recentSearches =
            state.recentSearches.filter(
                item => item !== query
            );

        state.recentSearches.unshift(
            query
        );

        state.recentSearches =
            state.recentSearches.slice(
                0,
                10
            );

        saveJSON(
            STORAGE_KEYS.recentSearches,
            state.recentSearches
        );
    }

    /* =========================================================
       CHART
       ========================================================= */

    function initializeChartControls() {
        const buttons = $$(
            "[data-chart-range], .chart-range button"
        );

        buttons.forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    buttons.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );

                    button.classList.add(
                        "active"
                    );

                    state.chartRange =
                        button.dataset.chartRange ||
                        button.textContent.trim();

                    updateChart(
                        state.chartRange
                    );
                }
            );
        });
    }

    function updateChart(range) {
        const chart =
            $("#analyticsChart") ||
            $(".analytics-chart");

        if (!chart) {
            return;
        }

        const bars =
            $$(
                ".chart-bar",
                chart
            );

        if (!bars.length) {
            return;
        }

        const data =
            generateChartData(
                range,
                bars.length
            );

        bars.forEach(
            (bar, index) => {
                const height =
                    data[index];

                bar.style.height =
                    `${height}%`;

                bar.classList.add(
                    "chart-updated"
                );

                setTimeout(
                    () =>
                        bar.classList.remove(
                            "chart-updated"
                        ),
                    500
                );
            }
        );
    }

    function generateChartData(
        range,
        count
    ) {
        const multiplier =
            range === "90D"
                ? 1.35
                : range === "30D"
                    ? 1.15
                    : 1;

        return Array.from(
            {
                length: count
            },
            (_, index) => {
                const wave =
                    Math.sin(index * 0.9) *
                    18;

                const growth =
                    index *
                    2.5;

                const random =
                    Math.random() *
                    12;

                return Math.max(
                    12,
                    Math.min(
                        95,
                        (45 +
                            wave +
                            growth +
                            random) *
                            multiplier
                    )
                );
            }
        );
    }

    /* =========================================================
       NOTIFICATIONS
       ========================================================= */

    function initializeNotifications() {
        const buttons = $$(
            "#notificationButton, [data-notifications]"
        );

        buttons.forEach(button => {
            button.addEventListener(
                "click",
                toggleNotifications
            );
        });

        document.addEventListener(
            "click",
            event => {
                const panel =
                    $(".notifications-panel");

                if (
                    !panel ||
                    !state.notificationsOpen
                ) {
                    return;
                }

                const button =
                    event.target.closest(
                        "#notificationButton, [data-notifications]"
                    );

                if (
                    !panel.contains(
                        event.target
                    ) &&
                    !button
                ) {
                    closeNotifications();
                }
            }
        );
    }

    function toggleNotifications() {
        state.notificationsOpen =
            !state.notificationsOpen;

        const panel =
            $(".notifications-panel");

        if (panel) {
            panel.classList.toggle(
                "open",
                state.notificationsOpen
            );
        }

        if (
            state.notificationsOpen
        ) {
            renderNotifications();
        }
    }

    function closeNotifications() {
        state.notificationsOpen = false;

        const panel =
            $(".notifications-panel");

        if (panel) {
            panel.classList.remove(
                "open"
            );
        }
    }

    function renderNotifications() {
        const container =
            $("#notificationsList") ||
            $(".notifications-list");

        if (!container) {
            return;
        }

        if (
            state.notifications.length === 0
        ) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>✓</span>
                    <h3>All caught up</h3>
                    <p>You have no new notifications.</p>
                </div>
            `;

            updateNotificationBadge();
            return;
        }

        container.innerHTML =
            state.notifications
                .map(notification => `
                    <article
                        class="notification-item ${
                            notification.read
                                ? ""
                                : "unread"
                        }"
                        data-notification-id="${notification.id}"
                    >
                        <div class="notification-icon">
                            <i class="fa-solid fa-bell"></i>
                        </div>

                        <div class="notification-content">
                            <strong>
                                ${escapeHTML(
                                    notification.title
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    notification.message
                                )}
                            </p>

                            <small>
                                ${escapeHTML(
                                    notification.time
                                )}
                            </small>
                        </div>

                        ${
                            !notification.read
                                ? `
                                    <button
                                        class="notification-read"
                                        data-read-notification="${notification.id}"
                                        aria-label="Mark notification as read"
                                    >
                                        ✓
                                    </button>
                                `
                                : ""
                        }
                    </article>
                `)
                .join("");

        $$(
            "[data-read-notification]",
            container
        ).forEach(button => {
            button.addEventListener(
                "click",
                event => {
                    event.stopPropagation();

                    markNotificationRead(
                        Number(
                            button.dataset
                                .readNotification
                        )
                    );
                }
            );
        });

        updateNotificationBadge();
    }

    function markNotificationRead(id) {
        const notification =
            state.notifications.find(
                item => item.id === id
            );

        if (!notification) {
            return;
        }

        notification.read = true;

        saveJSON(
            STORAGE_KEYS.notifications,
            state.notifications
        );

        renderNotifications();

        showToast(
            "Notification updated",
            "Marked as read.",
            "success"
        );
    }

    function markAllNotificationsRead() {
        state.notifications.forEach(
            notification => {
                notification.read = true;
            }
        );

        saveJSON(
            STORAGE_KEYS.notifications,
            state.notifications
        );

        renderNotifications();

        showToast(
            "All notifications read",
            "Your notification center is clear.",
            "success"
        );
    }

    function updateNotificationBadge() {
        const unread =
            state.notifications.filter(
                item => !item.read
            ).length;

        $$(
            ".notification-badge, #notificationBadge"
        ).forEach(badge => {
            badge.textContent =
                unread > 99
                    ? "99+"
                    : unread;

            badge.style.display =
                unread > 0
                    ? ""
                    : "none";
        });
    }

    /* =========================================================
       MODALS
       ========================================================= */

    function initializeModals() {
        document.addEventListener(
            "click",
            event => {
                const openButton =
                    event.target.closest(
                        "[data-modal-open]"
                    );

                if (openButton) {
                    openModal(
                        openButton.dataset.modalOpen
                    );
                }

                const closeButton =
                    event.target.closest(
                        "[data-modal-close]"
                    );

                if (closeButton) {
                    closeModal();
                }
            }
        );

        document.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Escape" &&
                    state.activeModal
                ) {
                    closeModal();
                }
            }
        );
    }

    function openModal(type) {
        state.activeModal = type;

        const modal =
            document.querySelector(
                `[data-modal="${type}"]`
            ) ||
            document.getElementById(
                `${type}Modal`
            );

        if (!modal) {
            createDynamicModal(type);
            return;
        }

        modal.classList.add("open");
        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );
    }

    function closeModal() {
        if (!state.activeModal) {
            return;
        }

        const modal =
            document.querySelector(
                `[data-modal="${state.activeModal}"]`
            ) ||
            document.getElementById(
                `${state.activeModal}Modal`
            );

        if (modal) {
            modal.classList.remove(
                "open"
            );

            modal.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        state.activeModal = null;

        document.body.classList.remove(
            "modal-open"
        );
    }

    function createDynamicModal(type) {
        const modal =
            createElement(
                "div",
                "dynamic-modal"
            );

        modal.dataset.modal = type;

        modal.innerHTML = `
            <div class="modal-backdrop"
                 data-modal-close></div>

            <div class="modal-window">

                <button
                    class="modal-close"
                    data-modal-close
                    aria-label="Close"
                >
                    ×
                </button>

                <div class="modal-icon">
                    <i class="fa-solid fa-layer-group"></i>
                </div>

                <h2>
                    ${
                        type === "publish"
                            ? "Publish Project"
                            : "Create New"
                    }
                </h2>

                <p>
                    ${
                        type === "publish"
                            ? "Make your project available to your workspace."
                            : "Create something new for your Snippet Studio workspace."
                    }
                </p>

                <form class="dynamic-modal-form">

                    <label>
                        Name
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter a name..."
                            required
                        >
                    </label>

                    <label>
                        Description
                        <textarea
                            name="description"
                            placeholder="Describe your project..."
                        ></textarea>
                    </label>

                    <div class="modal-actions">
                        <button
                            type="button"
                            class="btn secondary"
                            data-modal-close
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="btn primary"
                        >
                            ${
                                type === "publish"
                                    ? "Publish"
                                    : "Create"
                            }
                        </button>
                    </div>

                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal.classList.add("open");

        document.body.classList.add(
            "modal-open"
        );

        modal
            .querySelector("form")
            .addEventListener(
                "submit",
                event => {
                    event.preventDefault();

                    const form =
                        event.currentTarget;

                    const formData =
                        new FormData(form);

                    const name =
                        formData.get(
                            "name"
                        );

                    const description =
                        formData.get(
                            "description"
                        );

                    if (!name.trim()) {
                        showToast(
                            "Name required",
                            "Please enter a project name.",
                            "error"
                        );

                        return;
                    }

                    if (
                        type === "publish"
                    ) {
                        publishProject(
                            name,
                            description
                        );
                    } else {
                        createProject(
                            name,
                            description
                        );
                    }

                    modal.remove();

                    state.activeModal =
                        null;

                    document.body.classList.remove(
                        "modal-open"
                    );
                }
            );
    }

    /* =========================================================
       QUICK ACTIONS
       ========================================================= */

    function initializeQuickActions() {
        $$(
            "[data-action]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    handleAction(
                        button.dataset.action
                    );
                }
            );
        });
    }

    function handleAction(action) {
        switch (action) {
            case "new-template":
            case "new-project":
                openModal(
                    "new-project"
                );
                break;

            case "invite-team":
                openInviteModal();
                break;

            case "export":
            case "export-pack":
                exportWorkspace();
                break;

            case "mark-read":
                markAllNotificationsRead();
                break;

            case "publish":
                openModal("publish");
                break;

            default:
                showToast(
                    "Action",
                    "This action is not available yet.",
                    "info"
                );
        }
    }

    function openInviteModal() {
        const modal =
            createElement(
                "div",
                "dynamic-modal"
            );

        modal.innerHTML = `
            <div
                class="modal-backdrop"
                data-modal-close
            ></div>

            <div class="modal-window">

                <button
                    class="modal-close"
                    data-modal-close
                >
                    ×
                </button>

                <div class="modal-icon">
                    <i class="fa-solid fa-user-plus"></i>
                </div>

                <h2>Invite Team Member</h2>

                <p>
                    Invite someone to collaborate
                    with your workspace.
                </p>

                <form>

                    <label>
                        Email address

                        <input
                            type="email"
                            name="email"
                            placeholder="name@example.com"
                            required
                        >
                    </label>

                    <label>
                        Role

                        <select name="role">
                            <option>Developer</option>
                            <option>Designer</option>
                            <option>Viewer</option>
                            <option>Admin</option>
                        </select>
                    </label>

                    <div class="modal-actions">

                        <button
                            type="button"
                            class="btn secondary"
                            data-modal-close
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="btn primary"
                        >
                            Send Invitation
                        </button>

                    </div>

                </form>
            </div>
        `;

        document.body.appendChild(modal);

        modal.classList.add(
            "open"
        );

        document.body.classList.add(
            "modal-open"
        );

        modal
            .querySelector("form")
            .addEventListener(
                "submit",
                event => {
                    event.preventDefault();

                    const email =
                        new FormData(
                            event.currentTarget
                        ).get("email");

                    showToast(
                        "Invitation sent",
                        `Invitation prepared for ${email}.`,
                        "success"
                    );

                    modal.remove();

                    document.body.classList.remove(
                        "modal-open"
                    );
                }
            );

        modal
            .querySelectorAll(
                "[data-modal-close]"
            )
            .forEach(element => {
                element.addEventListener(
                    "click",
                    () => {
                        modal.remove();

                        document.body.classList.remove(
                            "modal-open"
                        );
                    }
                );
            });
    }

    /* =========================================================
       PROJECT MANAGEMENT
       ========================================================= */

    function createProject(
        name,
        description
    ) {
        const project = {
            id:
                Date.now(),

            name:
                name.trim(),

            description:
                description.trim(),

            createdAt:
                new Date().toISOString(),

            status:
                "draft"
        };

        state.projects.unshift(
            project
        );

        saveJSON(
            STORAGE_KEYS.projects,
            state.projects
        );

        showToast(
            "Project created",
            `"${project.name}" has been added to your workspace.`,
            "success"
        );

        addProjectToRecentList(
            project
        );
    }

    function publishProject(
        name,
        description
    ) {
        const project = {
            id:
                Date.now(),

            name:
                name.trim(),

            description:
                description.trim(),

            createdAt:
                new Date().toISOString(),

            status:
                "published"
        };

        state.projects.unshift(
            project
        );

        saveJSON(
            STORAGE_KEYS.projects,
            state.projects
        );

        showToast(
            "Project published",
            `"${project.name}" is now published.`,
            "success"
        );

        addProjectToRecentList(
            project
        );
    }

    function addProjectToRecentList(
        project
    ) {
        const container =
            $("#recentProjects") ||
            $(".recent-projects");

        if (!container) {
            return;
        }

        const item =
            createElement(
                "article",
                "recent-item"
            );

        item.innerHTML = `
            <div class="recent-icon">
                <i class="fa-solid fa-code"></i>
            </div>

            <div class="recent-info">
                <strong>
                    ${escapeHTML(
                        project.name
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        project.status
                    )}
                </span>
            </div>

            <time>
                Just now
            </time>
        `;

        container.prepend(item);
    }

    /* =========================================================
       EXPORT
       ========================================================= */

    function exportWorkspace() {
        const exportData = {
            application:
                "Snippet Studio",

            version:
                "1.0.0",

            exportedAt:
                new Date().toISOString(),

            projects:
                state.projects,

            settings:
                state.settings
        };

        const blob =
            new Blob(
                [
                    JSON.stringify(
                        exportData,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        link.download =
            `snippet-studio-export-${Date.now()}.json`;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );

        showToast(
            "Export complete",
            "Your workspace data has been downloaded.",
            "success"
        );
    }

    /* =========================================================
       PUBLISH BUTTON
       ========================================================= */

    function initializePublishButton() {
        $$(
            "#publishButton, [data-publish]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    openModal(
                        "publish"
                    );
                }
            );
        });
    }

    /* =========================================================
       STORAGE METER
       ========================================================= */

    function initializeStorageMeter() {
        const meters =
            $$(".storage-fill, [data-storage-fill]");

        meters.forEach(
            meter => {
                const percentage =
                    Number(
                        meter.dataset.storage ||
                        meter.getAttribute(
                            "data-storage-fill"
                        ) ||
                        42
                    );

                meter.style.width =
                    `${Math.min(
                        Math.max(
                            percentage,
                            0
                        ),
                        100
                    )}%`;
            }
        );
    }

    /* =========================================================
       TOAST SYSTEM
       ========================================================= */

    function showToast(
        title,
        message,
        type = "info",
        autoHide = true
    ) {
        let container =
            $(".toast-container");

        if (!container) {
            container =
                createElement(
                    "div",
                    "toast-container"
                );

            document.body.appendChild(
                container
            );
        }

        const toast =
            createElement(
                "div",
                `toast toast-${type}`
            );

        const icon =
            type === "success"
                ? "fa-check"
                : type === "error"
                    ? "fa-xmark"
                    : type === "warning"
                        ? "fa-triangle-exclamation"
                        : "fa-circle-info";

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fa-solid ${icon}"></i>
            </div>

            <div class="toast-content">
                <strong>
                    ${escapeHTML(title)}
                </strong>

                <span>
                    ${escapeHTML(message)}
                </span>
            </div>

            <button
                class="toast-close"
                aria-label="Close notification"
            >
                ×
            </button>
        `;

        container.appendChild(
            toast
        );

        requestAnimationFrame(
            () => {
                toast.classList.add(
                    "show"
                );
            }
        );

        toast
            .querySelector(
                ".toast-close"
            )
            .addEventListener(
                "click",
                () => removeToast(toast)
            );

        if (autoHide) {
            setTimeout(
                () =>
                    removeToast(
                        toast
                    ),
                4000
            );
        }
    }

    function removeToast(toast) {
        toast.classList.remove(
            "show"
        );

        setTimeout(
            () => toast.remove(),
            300
        );
    }

    /* =========================================================
       KEYBOARD SHORTCUTS
       ========================================================= */

    function initializeKeyboardShortcuts() {
        document.addEventListener(
            "keydown",
            event => {
                const modifier =
                    event.ctrlKey ||
                    event.metaKey;

                if (
                    modifier &&
                    event.key.toLowerCase() ===
                        "k"
                ) {
                    event.preventDefault();

                    focusSearch();
                }

                if (
                    modifier &&
                    event.key.toLowerCase() ===
                        "n"
                ) {
                    event.preventDefault();

                    openModal(
                        "new-project"
                    );
                }

                if (
                    modifier &&
                    event.key.toLowerCase() ===
                        "p"
                ) {
                    event.preventDefault();

                    openModal(
                        "publish"
                    );
                }

                if (
                    event.key === "Escape"
                ) {
                    closeNotifications();
                    closeSidebar();
                }
            }
        );
    }

    function focusSearch() {
        const search =
            $(
                "#globalSearch, .global-search input, [data-dashboard-search]"
            );

        if (!search) {
            return;
        }

        search.focus();

        search.select();

        showToast(
            "Search ready",
            "Start typing to search your workspace.",
            "info"
        );
    }

    /* =========================================================
       ANIMATIONS
       ========================================================= */

    function initializeAnimations() {
        if (
            state.settings.animations ===
            false
        ) {
            document.body.classList.add(
                "reduce-motion"
            );

            return;
        }

        if (
            !("IntersectionObserver" in window)
        ) {
            return;
        }

        const observer =
            new IntersectionObserver(
                entries => {
                    entries.forEach(
                        entry => {
                            if (
                                entry.isIntersecting
                            ) {
                                entry.target.classList.add(
                                    "visible"
                                );

                                observer.unobserve(
                                    entry.target
                                );
                            }
                        }
                    );
                },
                {
                    threshold: 0.1
                }
            );

        $$(".animate-on-scroll").forEach(
            element => {
                observer.observe(
                    element
                );
            }
        );
    }

    /* =========================================================
       UTILITIES
       ========================================================= */

    function escapeHTML(value) {
        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    /* =========================================================
       GLOBAL API
       ========================================================= */

    window.SnippetStudio = {
        state,

        openModal,

        closeModal,

        toggleTheme,

        showToast,

        createProject,

        publishProject,

        exportWorkspace,

        markAllNotificationsRead,

        updateChart,

        focusSearch
    };

})();