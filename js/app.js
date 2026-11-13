/**
 * SalesPulse - Application Entry Point
 * Orchestrates dataStore, analyticsEngine, chartManager, and UIController.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI Controller
  window.uiController.init();

  // Initial render of dashboard
  window.uiController.refreshAll();

  // Create Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Welcome toast
  setTimeout(() => {
    window.uiController.showToast('SalesPulse Analytics ready. All metrics synced with localStorage.', 'success');
  }, 400);
});

