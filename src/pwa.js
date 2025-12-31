import { getEl } from './utils.js';
import { registerSW } from 'virtual:pwa-register';

export const PWA = {
    deferredPrompt: null,
    translations: null,
    currentLang: null,
    init(translations, currentLang) {
        this.translations = translations;
        this.currentLang = currentLang;
        if ('serviceWorker' in navigator) {
            registerSW({
                immediate: true,
                onNeedRefresh() {
                    console.log("New content available, will update on next launch.");
                },
                onOfflineReady() { console.log("App ready to work offline"); }
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
                btn.innerHTML = `<span>${this.translations[this.currentLang].iosInstallText}</span>`;
                btn.classList.add('ios-guide');
            }
        }
    },
    isIOS() {
        return (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    },
    isStandalone() { return window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches; },
    async handleInstall() {
        if (this.isIOS()) {
            if (this.translations && this.currentLang) {
                alert(this.translations[this.currentLang].iosInstallAlert);
            }
            return;
        }

        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;
        if (getEl('install-container')) getEl('install-container').classList.add('hidden');
    }
};
