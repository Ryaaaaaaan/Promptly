import { LandingPage } from './LandingPage';
import { VocalPrompter } from './VocalPrompter';

export class Router {
    private currentPage: 'landing' | 'app' = 'landing';
    private landingPage: LandingPage | null = null;
    private vocalPrompter: VocalPrompter | null = null;
    private appContainer: HTMLElement;

    constructor() {
        this.appContainer = document.getElementById('app')!;
        this.init();
    }

    private init(): void {
        this.setupEventListeners();
        this.showLandingPage();
    }

    private setupEventListeners(): void {
        // Écouter l'événement de démarrage de l'app
        document.addEventListener('startApp', () => {
            this.showApp();
        });

        // Gérer le retour depuis l'app (si nécessaire)
        document.addEventListener('backToLanding', () => {
            this.showLandingPage();
        });
    }

    private showLandingPage(): void {
        if (this.currentPage === 'landing') return;

        // Nettoyer l'app si elle existe
        if (this.vocalPrompter) {
            this.vocalPrompter = null;
        }

        // Nettoyer le container
        this.appContainer.innerHTML = '';

        // Créer et afficher la landing page
        this.landingPage = new LandingPage();
        this.landingPage.mount(this.appContainer);

        this.currentPage = 'landing';
    }

    private showApp(): void {
        if (this.currentPage === 'app') return;

        // Nettoyer la landing page
        if (this.landingPage) {
            this.landingPage.unmount();
            this.landingPage = null;
        }

        // Restaurer le contenu original de l'app
        this.appContainer.innerHTML = `
            <!-- Text Input Step -->
            <div id="textInputStep" class="step text-input-step">
                <div class="step-container">
                    <div class="step-header">
                        <h1 class="step-title">Promptly</h1>
                        <p class="step-subtitle">Collez votre texte et commencez à pratiquer</p>
                    </div>

                    <div class="text-input-card">
                        <textarea
                            id="textInput"
                            class="text-input-modern"
                            placeholder="Collez votre texte ici...\\nChaque ligne sera une phrase à suivre."
                            rows="12"
                        ></textarea>

                        <div class="input-actions">
                            <button id="continueBtn" class="btn-continue">
                                <span>Continuer</span>
                                <span class="btn-arrow">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Prompter Step -->
            <div id="prompterStep" class="step prompter-step hidden">
                <!-- Header avec contrôles -->
                <header class="header">
                    <div class="header-content">
                        <h1 class="app-title">Promptly</h1>
                        <div class="controls">
                            <button id="editTextBtn" class="control-btn secondary">
                                <span class="btn-icon">📝</span>
                                Éditer
                            </button>
                            <button id="startBtn" class="control-btn primary">
                                <span class="btn-icon">🎤</span>
                                Démarrer
                            </button>
                            <button id="stopBtn" class="control-btn secondary" disabled>
                                <span class="btn-icon">⏹</span>
                                Arrêter
                            </button>
                            <button id="resetBtn" class="control-btn secondary">
                                <span class="btn-icon">🔄</span>
                                Reset
                            </button>
                        </div>
                    </div>
                </header>

                <!-- Zone principale d'affichage des paroles -->
                <main class="lyrics-container">
                    <div class="lyrics-wrapper" id="lyricsWrapper">
                        <div class="lyrics-content" id="lyricsContent">
                            <div class="empty-state">
                                📝 Chargez un texte pour commencer
                            </div>
                        </div>
                    </div>
                </main>

                <!-- Zone de status et debug -->
                <div class="status-section">
                    <div class="status-item">
                        <span class="status-label">Status:</span>
                        <span id="statusText" class="status-value">Prêt</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Reconnaissance:</span>
                        <span id="recognitionText" class="status-value">En attente...</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Ligne actuelle:</span>
                        <span id="currentLineNumber" class="status-value">0/0</span>
                    </div>
                </div>
            </div>

            <!-- Overlay de chargement -->
            <div id="loadingOverlay" class="loading-overlay hidden">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">Initialisation de la reconnaissance vocale...</p>
                </div>
            </div>
        `;

        // Initialiser le VocalPrompter
        this.vocalPrompter = new VocalPrompter();

        this.currentPage = 'app';
    }

    public getCurrentPage(): 'landing' | 'app' {
        return this.currentPage;
    }
}