import { getEl } from './utils.js';

export const PWA = {
    deferredPrompt: null,
    init(translations, currentLang) {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js?v=3.32')
                    .then(() => console.log('SW registered!'))
                    .catch(err => console.log('SW failed', err));
            });

            // Reload page when new SW takes control
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    window.location.reload();
                    refreshing = true;
                }
            });
        }
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            if (getEl('install-container') && !this.isIOS()) {
                getEl('install-container').classList.remove('hidden');
            }
        });
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            if (getEl('install-container')) getEl('install-container').classList.add('hidden');
        });

        const btn = getEl('install-btn');
        if (btn) {
            btn.addEventListener('click', () => this.handleInstall());
            if (this.isIOS() && !this.isStandalone()) {
                getEl('install-container').classList.remove('hidden');
                btn.innerHTML = `<span>${translations[currentLang].iosInstallText}</span>`;
                btn.classList.add('ios-guide');
            }
        }
    },
    isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; },
    isStandalone() { return window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches; },
    async handleInstall() {
        if (this.isIOS()) {
            alert(window.App.translations[window.App.currentLang].iosInstallAlert);
            return;
        }

        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;
        if (getEl('install-container')) getEl('install-container').classList.add('hidden');
    }
};
