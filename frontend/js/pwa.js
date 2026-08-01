let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installAppBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBanner) {
    installBanner.style.display = 'block'; // Banner show kar do
  }
});

if (installBtn) {
  installBtn.addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('App Installed Successfully');
        }
        deferredPrompt = null;
        if (installBanner) installBanner.style.display = 'none';
      });
    }
  });
}

// Service Worker Register
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW registration failed: ', err));
  });
}