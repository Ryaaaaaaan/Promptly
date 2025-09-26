import './style.css';

// État de l'application
let currentView: 'landing' | 'app' = 'landing';

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
  try {
    initializeApp();
    console.log('🎤 Promptly TypeScript initialisé');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    showError(error as Error);
  }
});

function initializeApp() {
  const appContainer = document.getElementById('app')!;

  if (currentView === 'landing') {
    showLandingPage(appContainer);
  }
}

function showLandingPage(container: HTMLElement) {
  container.innerHTML = `
    <div class="landing-step step">
      <div class="stars-background"></div>
      <div class="floating-particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
      </div>

      <div class="landing-wrapper">
        <div class="landing-content">
          <div class="hero-section">
            <h1 class="hero-title animate__animated animate__fadeInDown">
              <span class="title-main">Promptly</span>
              <span class="title-glow">Promptly</span>
            </h1>
            <h2 class="hero-subtitle animate__animated animate__fadeInUp animate__delay-500ms">
              Maîtrisez l'art de la présentation
            </h2>
            <p class="hero-description animate__animated animate__fadeIn animate__delay-1s">
              <strong>Transformez chaque présentation en performance mémorable.</strong><br>
              La reconnaissance vocale suit votre voix en temps réel et vous guide naturellement,
              phrase après phrase, pour une fluidité parfaite.
            </p>

            <div class="hero-stats animate__animated animate__fadeInUp animate__delay-1500ms">
              <div class="stat">
                <span class="stat-number">98%</span>
                <span class="stat-label">Précision</span>
              </div>
              <div class="stat">
                <span class="stat-number">0s</span>
                <span class="stat-label">Setup</span>
              </div>
            </div>
          </div>


          <div class="cta-section animate__animated animate__bounceIn animate__delay-2s">
            <div class="cta-group">
              <button id="startAppBtn" class="cta-primary">
                <span class="cta-icon">🚀</span>
                <span class="cta-text">Démarrer</span>
              </button>
              <div class="cta-features">
                <span>✓ Gratuit</span>
                <span>✓ Sans compte</span>
                <span>✓ Privé</span>
              </div>
            </div>
            <p class="cta-description">
              Rejoignez les speakers qui ont déjà adopté Promptly pour leurs présentations
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Ajouter l'événement click avec transition
  const startBtn = document.getElementById('startAppBtn');
  startBtn?.addEventListener('click', () => {
    slideToApp(container);
  });
}

function slideToApp(container: HTMLElement) {
  // Animation de transition fade avec parallaxe
  const landingStep = container.querySelector('.landing-step');
  if (landingStep) {
    landingStep.classList.add('fade-out');

    setTimeout(() => {
      showApp(container);
    }, 600);
  }
}

function showApp(container: HTMLElement) {
  currentView = 'app';

  container.innerHTML = `
    <!-- Text Input Step -->
    <div id="textInputStep" class="step text-input-step fade-in">
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
          <h1 class="app-title clickable-title" onclick="backToLanding()">Promptly</h1>
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
  initializeVocalPrompter();
}

async function initializeVocalPrompter() {
  try {
    const { VocalPrompter } = await import('./components/VocalPrompter');
    const prompter = new VocalPrompter();
    (window as any).prompter = prompter;
  } catch (error) {
    console.error('Erreur lors du chargement du VocalPrompter:', error);
  }
}

function showError(error: Error) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ff3b30;
    color: white;
    padding: 2rem;
    border-radius: 12px;
    text-align: center;
    z-index: 10000;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  `;
  errorDiv.innerHTML = `
    <h2>❌ Erreur d'initialisation</h2>
    <p>Impossible de démarrer le prompteur vocal.</p>
    <p><small>${error.message}</small></p>
    <button onclick="location.reload()" style="
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: white;
      color: #ff3b30;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    ">Recharger</button>
  `;

  document.body.appendChild(errorDiv);
}

// Fonction globale pour retourner à la landing
(window as any).backToLanding = function() {
  currentView = 'landing';
  const appContainer = document.getElementById('app')!;

  // Animation de sortie puis retour à la landing
  const currentStep = appContainer.querySelector('.step:not(.hidden)');
  if (currentStep) {
    currentStep.classList.add('fade-out');
    setTimeout(() => {
      showLandingPage(appContainer);
    }, 400);
  } else {
    showLandingPage(appContainer);
  }
};