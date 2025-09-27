// js/core/drawer.js
(function () {
    'use strict';
    const drawer = document.getElementById('drawer');
    const btnMenu = document.getElementById('btnMenu');
    const btnClose = document.getElementById('btnCloseDrawer');

    function open() { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); }
    function close() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }

    btnMenu?.addEventListener('click', open);
    btnClose?.addEventListener('click', close);
    drawer?.addEventListener('click', (e) => { if (e.target === drawer) close(); });

    window.Drawer = { open, close };
})();