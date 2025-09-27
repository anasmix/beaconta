// js/core/year.js
(function () {
    'use strict';
    const menu = document.querySelector('#yearDropdown + .dropdown-menu');
    const label = document.getElementById('currentYear');

    function setYear(value, text) {
        label.textContent = text;
        localStorage.setItem('schoolYear', value);
        window.dispatchEvent(new CustomEvent('schoolYearChanged', { detail: value }));
    }

    if (menu && label) {
        menu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', function (e) { e.preventDefault(); setYear(this.dataset.value, this.textContent); });
        });
        const saved = localStorage.getItem('schoolYear');
        if (saved) {
            const selectedItem = menu.querySelector(`.dropdown-item[data-value="${saved}"]`);
            if (selectedItem) { label.textContent = selectedItem.textContent; }
        }
    }
})();