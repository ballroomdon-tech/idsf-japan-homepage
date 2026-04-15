/* ===================================
   IDSF Japan — Rules page tab switcher
   (extracted from inline script + onclick for CSP compliance)
   =================================== */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.tab-btn[data-tab-target]');
    if (!tabButtons.length) return;

    tabButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const targetId = btn.getAttribute('data-tab-target');
        if (!targetId) return;

        // Toggle button active state (within the same tab-bar)
        const tabBar = btn.closest('.tab-bar');
        if (tabBar) {
          tabBar.querySelectorAll('.tab-btn').forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
        }
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // Toggle panel
        document.querySelectorAll('.tab-panel').forEach(function (panel) {
          panel.classList.remove('active');
        });
        const target = document.getElementById('tab-' + targetId);
        if (target) target.classList.add('active');
      });
    });
  });
})();
