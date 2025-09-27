// js/core/nav.js
(function () {
    'use strict';

    function buildNav(containerId) {
        const root = document.getElementById(containerId);
        root.innerHTML = '';
        let firstKey = null;

        Object.entries(window.MENU || {}).forEach(([key, sec]) => {
            const hasPerm = (sec.groups || []).some(g => (g.items || []).some(it => Permissions.can(it.id)));
            if (!hasPerm) return;
            if (!firstKey) firstKey = key;
            const li = document.createElement('li');
            li.className = 'nav-item';
            const isActive = (state.main === key);
            li.innerHTML = `
        <a class="nav-link ${isActive ? 'active' : ''}" data-main="${key}" href="#">
          <i class="bi ${sec.icon || 'bi-circle'}"></i>
          <span>${sec.title}</span>
        </a>`;
            root.appendChild(li);
        });
        return firstKey;
    }

    function bindNav(containerId, sidebarId) {
        const root = document.getElementById(containerId);
        root.addEventListener('click', (e) => {
            const a = e.target.closest('.nav-link'); if (!a) return; e.preventDefault();
            root.querySelectorAll('.nav-link').forEach(x => x.classList.remove('active'));
            a.classList.add('active');
            state.main = a.dataset.main; App.saveState();
            Sidebar.build(document.getElementById(sidebarId), state.main);
        });
    }

    function refresh() {
        const firstDesktop = buildNav('mainTabs');
        const firstMobile = buildNav('mainTabsMobile');
        const chosen = (window.MENU[state.main]) ? state.main : (firstDesktop || firstMobile);
        if (chosen) {
            Sidebar.build(document.getElementById('sidebar'), chosen);
            Sidebar.build(document.getElementById('sidebarMobile'), chosen);
            state.main = chosen; App.saveState();
            document.querySelectorAll('#mainTabs .nav-link, #mainTabsMobile .nav-link').forEach(a => {
                a.classList.toggle('active', a.dataset.main === chosen);
            });
        }
    }

    // bind once
    bindNav('mainTabs', 'sidebar');
    bindNav('mainTabsMobile', 'sidebarMobile');

    window.Nav = { refresh };
})();