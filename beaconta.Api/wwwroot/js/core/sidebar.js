// js/core/sidebar.js
(function () {
    'use strict';
    function build(container, mainKey) {
        container.innerHTML = '';
        const sec = window.MENU?.[mainKey];
        if (!sec || !Array.isArray(sec.groups)) return;

        sec.groups.forEach((g, gi) => {
            const items = (g.items || []).filter(it => Permissions.can(it.id));
            if (!items.length) return;

            const box = document.createElement('div');
            box.className = 'group';
            box.innerHTML = `
        <div class="group-header" data-toggle="${gi}">
          <div class="group-title">${g.title}</div>
          <i class="bi bi-chevron-down"></i>
        </div>
        <div class="group-items"></div>`;
            const wrap = box.querySelector('.group-items');

            items.forEach(it => {
                const row = document.createElement('div');
                row.className = 'side-item';
                row.dataset.open = it.id; row.dataset.url = it.url; row.dataset.title = it.title;
                row.innerHTML = `<i class="bi ${it.icon || 'bi-dot'}"></i>
                         <div><div class="font-weight-bold">${it.title}</div>
                         <small class="text-muted">${it.desc || ''}</small></div>`;
                row.addEventListener('click', () => {
                    Tabs.openTab({ id: it.id, title: it.title, url: it.url });
                    Drawer.close();
                });
                wrap.appendChild(row);
            });

            container.appendChild(box);
        });

        container.querySelectorAll('.group-header').forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('collapsed')));
    }

    function bindSearch(boxId, listRootId) {
        const el = document.getElementById(boxId);
        el?.addEventListener('input', function () {
            const q = this.value.trim().toLowerCase();
            document.querySelectorAll('#' + listRootId + ' .side-item').forEach(n => {
                const t = (n.dataset.title || '').toLowerCase();
                n.style.display = t.includes(q) ? '' : 'none';
            });
        });
    }

    // ربط حقول البحث الجانبية
    bindSearch('sideSearch', 'sidebar');
    bindSearch('sideSearchMobile', 'sidebarMobile');

    window.Sidebar = { build };
})();