import type { VoskRecognizer, RecognitionResult } from '@/types';

// Déclarations TypeScript pour Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export class SpeechRecognitionService {
  private recognition: any | null = null;
  private isListening = false;
  private lastResult: RecognitionResult = { text: '' };
  private useSimulation = false;

  constructor() {
    this.setupWebSpeechRecognition();

    // Démarrer la simulation immédiatement si Web Speech n'est pas disponible
    if (this.useSimulation) {
      console.log('Mode simulation activé - la reconnaissance fonctionnera avec des données simulées');
    }
  }

  private setupWebSpeechRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API non supportée, utilisation du mode simulation');
      this.useSimulation = true;
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'fr-FR';
      this.recognition.maxAlternatives = 1;

      console.log('Web Speech API configurée correctement');
    } catch (error) {
      console.warn('Erreur lors de la configuration Web Speech API:', error);
      this.useSimulation = true;
      return;
    }

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      this.lastResult = {
        text: finalTranscript || interimTranscript,
        partial: !finalTranscript,
        confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0.8
      };
    };

    this.recognition.onerror = (event) => {
      console.error('Erreur de reconnaissance:', event.error);
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        setTimeout(() => this.recognition?.start(), 100);
      }
    };
  }

  setWords(enable: boolean): void {
    // Pour compatibilité avec l'interface Vosk
  }

  acceptWaveform(samples: Int16Array): boolean {
    if (this.useSimulation) {
      this.simulateRecognition();
      return true;
    }

    if (!this.isListening) {
      this.startListening();
    }

    return true;
  }

  private simulateRecognition(): void {
    const phrases = [
      'bonjour et bienvenue dans ce',
      'cette application vous permet de',
      'chaque ligne illumine au fur',
      'les mots sont mis en',
      'vous pouvez personnaliser le texte',
      'application fonctionne avec la reconnaissance',
      'profitez de cette expérience fluide'
    ];

    // Plus fréquent pour la simulation
    if (Math.random() > 0.85) {
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      this.lastResult = {
        text: randomPhrase,
        partial: false,
        confidence: 0.9
      };
      console.log('Simulation reconnaissance:', randomPhrase);
    }
  }

  startListening(): void {
    if (this.useSimulation) {
      this.isListening = true;
      console.log('Démarrage du mode simulation');
      return;
    }

    if (this.recognition && !this.isListening) {
      try {
        this.isListening = true;
        this.recognition.start();
        console.log('Reconnaissance Web Speech démarrée');
      } catch (error) {
        console.warn('Impossible de démarrer la reconnaissance, basculement vers la simulation:', error);
        this.useSimulation = true;
        this.isListening = true;
      }
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  result(): RecognitionResult {
    const result = this.lastResult;
    if (!result.partial) {
      this.lastResult = { text: '' };
    }
    return result;
  }

  partialResult(): RecognitionResult {
    return this.lastResult.partial ? this.lastResult : { text: '' };
  }

  finalResult(): RecognitionResult {
    return this.lastResult;
  }

  // Méthode pour forcer le mode simulation
  enableSimulation(): void {
    this.useSimulation = true;
    console.log('Mode simulation forcé - la reconnaissance utilisera des données simulées');
  }
}