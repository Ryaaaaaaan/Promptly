import './style.css';
import { VocalPrompter } from '@/components/VocalPrompter';

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
  try {
    const prompter = new VocalPrompter();

    // Exposer globalement pour le debug
    (window as any).prompter = prompter;

    console.log('🎤 Prompteur vocal TypeScript initialisé');
    console.log('Raccourcis disponibles:');
    console.log('- Ctrl + Espace: Démarrer/Arrêter la reconnaissance');
    console.log('- Échap: Arrêter la reconnaissance');
    console.log('- Ctrl + R: Remettre à zéro');

  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);

    // Afficher l'erreur à l'utilisateur
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
      <p><small>${(error as Error).message}</small></p>
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
});

// Export pour utilisation externe si nécessaire
export { VocalPrompter };