// js/core/fullscreen.js
(function () {
    'use strict';
    const toggleBtn = document.getElementById('iframeFullscreenToggle');
    const bar = document.getElementById('fullscreenBar');
    const exitBtn = document.getElementById('exitFullscreenBtn');

    function enter() {
        const iframe = Tabs.getActiveIframe(); if (!iframe) return;
        iframe.classList.add('iframe-fullscreen');
        document.querySelector('.appbar')?.classList.add('fullscreen-hidden');
        document.querySelector('.sidebar')?.classList.add('fullscreen-hidden');
        document.querySelector('.ws-tabs')?.classList.add('fullscreen-hidden');
        document.getElementById('drawer')?.classList.add('fullscreen-hidden');
        bar.style.display = 'block';
        const icon = toggleBtn?.querySelector('i'); if (icon) { icon.classList.replace('bi-arrows-fullscreen', 'bi-arrows-angle-contract'); }
    }

    function exit() {
        const iframe = document.querySelector('#frames .iframe-fullscreen'); if (!iframe) return;
        iframe.classList.remove('iframe-fullscreen');
        document.querySelector('.appbar')?.classList.remove('fullscreen-hidden');
        document.querySelector('.sidebar')?.classList.remove('fullscreen-hidden');
        document.querySelector('.ws-tabs')?.classList.remove('fullscreen-hidden');
        document.getElementById('drawer')?.classList.remove('fullscreen-hidden');
        bar.style.display = 'none';
        const icon = toggleBtn?.querySelector('i'); if (icon) { icon.classList.replace('bi-arrows-angle-contract', 'bi-arrows-fullscreen'); }
    }

    function toggle() { document.querySelector('#frames .iframe-fullscreen') ? exit() : enter(); }

    toggleBtn?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggle(); });
    exitBtn?.addEventListener('click', (e) => { e.preventDefault(); exit(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') exit(); });

    window.Fullscreen = { enter, exit, toggle };
})();