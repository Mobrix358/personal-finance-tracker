/* PWA bootstrap: registers service worker and wires up install banner */
(function () {
  let deferredPrompt = null;
  const installBanner = document.getElementById('installBanner');

  // Show custom install banner when available (Chrome/Edge/Android)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    try {
      if (localStorage.getItem('pwa_install_dismissed') === '1') return;
    } catch {}
    if (installBanner) installBanner.classList.add('show');
  });

  async function installApp() {
    try {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
    } catch (err) {
      console.warn('Install prompt failed:', err);
    } finally {
      if (installBanner) installBanner.classList.remove('show');
      try { localStorage.setItem('pwa_install_dismissed', '1'); } catch {}
    }
  }

  function dismissInstall() {
    if (installBanner) installBanner.classList.remove('show');
    try { localStorage.setItem('pwa_install_dismissed', '1'); } catch {}
  }

  window.installApp = installApp;
  window.dismissInstall = dismissInstall;

  window.addEventListener('appinstalled', () => {
    try { localStorage.setItem('pwa_installed', '1'); } catch {}
    if (installBanner) installBanner.classList.remove('show');
  });

  // Service worker registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = './sw.js'; // relative so it works on GitHub Pages subpaths
      navigator.serviceWorker.register(swUrl, { scope: './' })
        .then(reg => {
          // Optional: listen for updates
          if (reg && reg.update) {
            // Attempt to update in the background
            setTimeout(() => reg.update().catch(()=>{}), 3000);
          }
        })
        .catch((err) => console.warn('SW registration failed:', err));
    });
  }
})();
