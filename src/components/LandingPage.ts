export class LandingPage {
    private container: HTMLElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'landing-page';
        this.init();
    }

    private init(): void {
        this.render();
        this.attachEventListeners();
    }

    private render(): void {
        this.container.innerHTML = `
            <div class="landing-container">
                <h1 class="logo">Promptly</h1>
                <p class="tagline">Prompteur Vocal Intelligent</p>
                <p class="description">
                    Transformez votre pratique orale avec un prompteur alimenté par la reconnaissance vocale.
                    Collez votre texte, lancez l'entraînement, et laissez Promptly vous guider phrase par phrase
                    pour une présentation parfaite.
                </p>

                <div class="features">
                    <div class="feature">
                        <div class="feature-icon">🎤</div>
                        <h3 class="feature-title">Reconnaissance Vocale</h3>
                        <p class="feature-text">Technologie avancée qui suit votre progression en temps réel</p>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">📝</div>
                        <h3 class="feature-title">Suivi Intelligent</h3>
                        <p class="feature-text">Navigation automatique ligne par ligne selon votre débit</p>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">⚡</div>
                        <h3 class="feature-title">Interface Moderne</h3>
                        <p class="feature-text">Design épuré inspiré d'Apple Music pour une expérience fluide</p>
                    </div>
                </div>

                <button class="cta-button" id="startAppBtn">
                    <span class="cta-icon">🚀</span>
                    Démarrer
                </button>
            </div>
        `;
    }

    private attachEventListeners(): void {
        const startBtn = this.container.querySelector('#startAppBtn') as HTMLButtonElement;
        startBtn?.addEventListener('click', () => {
            this.onStartApp();
        });
    }

    private onStartApp(): void {
        // Déclencher l'événement pour passer à l'application
        const event = new CustomEvent('startApp');
        document.dispatchEvent(event);
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
    }

    public unmount(): void {
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}