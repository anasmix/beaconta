// js/core/tabs.js
(function () {
    'use strict';
    const tabsBar = document.getElementById('tabsBar');
    const frames = document.getElementById('frames');

    function renderTabs() {
        tabsBar.innerHTML = '';
        const empty = document.querySelector('.ws-content .empty');
        if (state.tabs.length === 0) empty.style.display = 'flex'; else empty.style.display = 'none';

        state.tabs.forEach(t => {
            const chip = document.createElement('div');
            chip.className = `chip ${t.active ? 'active' : ''} ${t.dirty ? 'dirty' : ''} animate__animated animate__fadeIn`;
            chip.dataset.tab = t.id;
            chip.innerHTML = `
        <span class="dot"></span>
        <i class="bi bi-window-stack"></i>
        <span>${t.title}</span>
        <button class="close" title="إغلاق"><i class="bi bi-x-lg"></i></button>`;
            chip.addEventListener('click', (e) => {
                if (e.target.closest('.close')) { tryClose(t.id); return; }
                activate(t.id);
            });
            tabsBar.appendChild(chip);
        });

        // إظهار/إخفاء الإطارات
        [...frames.querySelectorAll('iframe')].forEach(f => {
            const id = f.dataset.tab;
            f.style.display = state.tabs.find(x => x.id === id)?.active ? 'block' : 'none';
        });
    }

    function ensureFrame(tab) {
        let f = frames.querySelector(`iframe[data-tab="${tab.id}"]`);
        if (!f) {
            const ld = document.createElement('div');
            ld.className = 'loader'; ld.dataset.loader = tab.id; ld.innerHTML = '<div class="spinner"></div>';
            frames.appendChild(ld);

            f = document.createElement('iframe');
            f.className = 'frame'; f.dataset.tab = tab.id;
            let fallbackUrl = !tab.url || tab.url === '#'
                ? `pages/${tab.id}.html`
                : tab.url;

            // ✅ إذا url يبدأ بـ "/" معناها يشير للـ root -> نحوله على pages/
            if (fallbackUrl.startsWith('/')) {
                fallbackUrl = `pages${fallbackUrl}.html`;
            }


            const url = fallbackUrl.includes('?') ? `${fallbackUrl}&tabId=${encodeURIComponent(tab.id)}` : `${fallbackUrl}?tabId=${encodeURIComponent(tab.id)}`;
            f.src = url;
           // f.setAttribute('sandbox', 'allow-forms allow-same-origin allow-scripts');
            f.addEventListener('load', () => frames.querySelector(`[data-loader="${tab.id}"]`)?.remove());
            frames.appendChild(f);
        }
    }

    function openTab({ id, title, url }) {
        const ex = state.tabs.find(t => t.id === id);
        state.tabs.forEach(t => t.active = false);
        if (ex) { ex.active = true; ensureFrame(ex); }
        else { const t = { id, title, url, active: true, dirty: false }; state.tabs.push(t); ensureFrame(t); }
        App.saveState(); renderTabs();
    }

    function activate(id) { state.tabs.forEach(t => t.active = (t.id === id)); App.saveState(); renderTabs(); }
    function setDirty(id, dirty = true) { const t = state.tabs.find(x => x.id === id); if (!t) return; t.dirty = !!dirty; App.saveState(); renderTabs(); }
    function tryClose(id) { const t = state.tabs.find(x => x.id === id); if (!t) return; if (t.dirty && !confirm('هناك تغييرات غير محفوظة — إغلاق التبويب؟')) return; close(id); }
    function close(id) { const idx = state.tabs.findIndex(t => t.id === id); if (idx < 0) return; const wasActive = state.tabs[idx].active; frames.querySelector(`[data-loader="${id}"]`)?.remove(); frames.querySelector(`iframe[data-tab="${id}"]`)?.remove(); state.tabs.splice(idx, 1); if (wasActive && state.tabs.length) state.tabs[state.tabs.length - 1].active = true; App.saveState(); renderTabs(); }
    function reloadActive() { const a = state.tabs.find(t => t.active); if (!a) return; const frame = frames.querySelector(`iframe[data-tab="${a.id}"]`); if (!frame) return; const ld = document.createElement('div'); ld.className = 'loader'; ld.dataset.loader = a.id; ld.innerHTML = '<div class="spinner"></div>'; frames.appendChild(ld); frame.contentWindow.location.reload(); frame.addEventListener('load', () => frames.querySelector(`[data-loader="${a.id}"]`)?.remove(), { once: true }); }
    function getActiveIframe() { const active = state.tabs.find(t => t.active); if (active) { return frames.querySelector(`iframe[data-tab="${active.id}"]`); } const iframes = Array.from(frames.querySelectorAll('iframe')); const visible = iframes.find(f => getComputedStyle(f).display !== 'none'); return visible || iframes[iframes.length - 1] || null; }

    // رسائل من صفحات داخل الإطارات
    window.addEventListener('message', (e) => {
        const d = e.data || {};
        if (d.type === 'openTab' && d.id && d.title && d.url) { openTab({ id: d.id, title: d.title, url: d.url }); App.toastInfo('فتح: ' + d.title); }
        if (d.type === 'dirty' && d.tabId) { setDirty(d.tabId, !!d.value); }
    });

    // كشف API
    window.Tabs = { renderTabs, openTab, activate, close, tryClose, setDirty, ensureFrame, reloadActive, getActiveIframe };
})();