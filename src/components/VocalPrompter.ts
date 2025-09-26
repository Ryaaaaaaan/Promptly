import type { PrompterConfig, PrompterElements, Line, VoskModel, VoskRecognizer } from '@/types';
import { Vosk } from '@/services/VoskService';
import { tokenizeWords, calculateLineSimilarity, wordsMatch } from '@/utils/textUtils';
import { getElement, showMessage } from '@/utils/domUtils';

export class VocalPrompter {
  private model: VoskModel | null = null;
  private recognizer: VoskRecognizer | null = null;
  private isRecording = false;
  private currentLineIndex = 0;
  private lines: Line[] = [];
  private audioStream: MediaStream | null = null;
  private audioInterval: number | null = null;

  private config: PrompterConfig = {
    confidenceThreshold: 0.35,
    wordMatchThreshold: 0.4,
    completionThreshold: 0.75, // Reduced to 75% for better user experience
    scrollBehavior: 'smooth'
  };

  private elements: PrompterElements;
  private currentStep: 'input' | 'prompter' = 'input';

  constructor() {
    this.elements = this.initializeElements();
    this.setupEventListeners();
    this.setupStepManagement();
    this.setupScrollParallax();
    this.loadDefaultText();
  }

  private initializeElements(): PrompterElements {
    return {
      startBtn: getElement<HTMLButtonElement>('startBtn'),
      stopBtn: getElement<HTMLButtonElement>('stopBtn'),
      resetBtn: getElement<HTMLButtonElement>('resetBtn'),
      textInput: getElement<HTMLTextAreaElement>('textInput'),
      loadTextBtn: getElement<HTMLButtonElement>('continueBtn'),
      lyricsContent: getElement<HTMLDivElement>('lyricsContent'),
      lyricsWrapper: getElement<HTMLDivElement>('lyricsWrapper'),
      statusText: getElement<HTMLSpanElement>('statusText'),
      recognitionText: getElement<HTMLSpanElement>('recognitionText'),
      currentLineNumber: getElement<HTMLSpanElement>('currentLineNumber'),
      loadingOverlay: getElement<HTMLDivElement>('loadingOverlay')
    };
  }

  private setupEventListeners(): void {
    this.elements.startBtn.addEventListener('click', () => this.startRecognition());
    this.elements.stopBtn.addEventListener('click', () => this.stopRecognition());
    this.elements.resetBtn.addEventListener('click', () => this.resetPrompter());
    this.elements.loadTextBtn.addEventListener('click', () => this.continueToPrompter());

    // Add edit button listener
    const editBtn = document.getElementById('editTextBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => this.backToInput());
    }

    // Gestion du header disparaissant
    this.setupHeaderScroll();

    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' && e.ctrlKey) {
        e.preventDefault();
        this.toggleRecognition();
      } else if (e.key === 'Escape') {
        this.stopRecognition();
      } else if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        this.resetPrompter();
      }
    });
  }

  private setupHeaderScroll(): void {
    let isHeaderVisible = true;
    let lastScrollY = 0;
    let ticking = false;

    const header = document.querySelector('.header') as HTMLElement;
    if (!header) return;

    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      const shouldHideHeader = isScrollingDown && currentScrollY > 100;

      if (shouldHideHeader && isHeaderVisible) {
        header.classList.add('hidden');
        isHeaderVisible = false;
      } else if (!shouldHideHeader && !isHeaderVisible) {
        header.classList.remove('hidden');
        isHeaderVisible = true;
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateHeader);
        ticking = true;
      }
    });

    // Header management is now simpler with better spacing
    // No need for complex hide/show logic
  }

  private loadDefaultText(): void {
    const defaultText = `Bonjour et bienvenue dans ce prompteur vocal.
Cette application suit votre voix en temps réel.
Chaque ligne s'illumine quand vous la prononcez.
Les mots se colorent individuellement pour un suivi précis.
Vous pouvez modifier ce texte comme vous le souhaitez.
Le prompteur fonctionne avec votre microphone.
Profitez de cette expérience fluide pour vos présentations.`;

    this.elements.textInput.value = defaultText;
  }

  private loadTextFromInput(): void {
    const text = this.elements.textInput.value.trim();
    if (!text) {
      showMessage('Veuillez saisir un texte', 'error');
      return;
    }

    this.lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, index) => ({
        id: index,
        text: line,
        words: tokenizeWords(line),
        completed: false,
        active: false
      }));

    this.currentLineIndex = 0;

    // Marquer la première ligne comme active
    if (this.lines.length > 0) {
      this.lines[0].active = true;
    }

    this.renderLyrics();
    this.updateStatus('Prêt');
    this.updateLineNumber();
    showMessage('Texte chargé avec succès', 'success');
  }

  private renderLyrics(): void {
    if (this.lines.length === 0) {
      this.elements.lyricsContent.innerHTML = '<div class="empty-state">📝 Aucun texte chargé</div>';
      this.elements.lyricsContent.classList.add('empty');
      return;
    }

    this.elements.lyricsContent.classList.remove('empty');

    this.elements.lyricsContent.innerHTML = this.lines.map((line, index) => {
      const wordsHtml = line.words.map(word =>
        `<span class="word ${word.spoken ? 'spoken' : ''} ${word.highlighted ? 'highlighted' : ''}"
               data-word="${word.text}">${word.original}</span>${word.trailing || ''}`
      ).join('');

      let className = 'lyric-line';
      if (index < this.currentLineIndex) className += ' completed';
      else if (index === this.currentLineIndex) className += ' active';
      else className += ' inactive';

      return `<div class="${className}"
                   data-line-index="${index}"
                   id="line-${index}">
                  ${wordsHtml}
              </div>`;
    }).join('');

    // Enable automatic scrolling with parallax effect
    this.scrollToActiveLineWithParallax();
  }


  private scrollToActiveLineWithParallax(): void {
    const activeLine = document.querySelector('.lyric-line.active') as HTMLElement;
    if (activeLine) {
      console.log('Scrolling to active line:', activeLine.textContent);

      const container = this.elements.lyricsWrapper;
      const containerRect = container.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();

      const scrollTop = container.scrollTop + lineRect.top - containerRect.top - (containerRect.height / 2) + (lineRect.height / 2);

      // Use native smooth scrolling for best performance
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });

      // Apply simple parallax effect after scroll
      setTimeout(() => this.applyParallaxEffect(), 100);
    }
  }

  private applyParallaxEffect(): void {
    // Simplified, performance-optimized parallax
    const container = this.elements.lyricsWrapper;
    const allLines = container.querySelectorAll('.lyric-line') as NodeListOf<HTMLElement>;

    allLines.forEach((line) => {
      // Skip active line to avoid interference
      if (line.classList.contains('active')) {
        line.style.opacity = '1';
        line.style.transform = '';
        return;
      }

      // Simple opacity-based fade for inactive lines
      if (line.classList.contains('completed')) {
        line.style.opacity = '0.4';
      } else {
        line.style.opacity = '0.6';
      }
    });
  }

  private updateWordHighlights(): void {
    // Direct DOM update without throttling for maximum responsiveness
    const activeLine = document.querySelector('.lyric-line.active');
    if (activeLine) {
      const words = activeLine.querySelectorAll('.word');
      const currentLine = this.lines[this.currentLineIndex];

      words.forEach((wordEl, index) => {
        const word = currentLine.words[index];
        if (word) {
          wordEl.className = `word ${word.spoken ? 'spoken' : ''} ${word.highlighted ? 'highlighted' : ''}`;
        }
      });
    }

    // Apply simple parallax effect
    this.applyParallaxEffect();
  }

  private async startRecognition(): Promise<void> {
    try {
      if (this.currentStep !== 'prompter') {
        showMessage('Veuillez d\'abord charger un texte', 'error');
        return;
      }

      if (this.lines.length === 0) {
        showMessage('Veuillez d\'abord charger un texte', 'error');
        return;
      }

      this.showLoadingOverlay(true);
      this.updateStatus('Démarrage...');

      if (!this.model) {
        await this.loadModel();
      }

      if (!this.recognizer) {
        this.recognizer = this.model!.KaldiRecognizer(16000);
        if (this.recognizer.setWords) {
          this.recognizer.setWords(true);
        }
      }

      await this.initializeMicrophone();

      this.isRecording = true;
      this.elements.startBtn.disabled = true;
      this.elements.stopBtn.disabled = false;
      this.updateStatus('🎤 Écoute en cours...');
      this.showLoadingOverlay(false);

      if (this.lines.length > 0) {
        this.lines[this.currentLineIndex].active = true;
        this.renderLyrics();
      }

      showMessage('Reconnaissance vocale démarrée !', 'success');

    } catch (error) {
      console.error('Erreur lors du démarrage:', error);
      showMessage(`Erreur: ${(error as Error).message}`, 'error');
      this.showLoadingOverlay(false);
      this.updateStatus('❌ Erreur');

      this.elements.startBtn.disabled = false;
      this.elements.stopBtn.disabled = true;
    }
  }

  private async loadModel(): Promise<void> {
    this.updateStatus('Initialisation de la reconnaissance vocale...');

    try {
      this.model = await Vosk.createModel(null);
      console.log('Reconnaissance vocale initialisée');
    } catch (error) {
      console.warn('Erreur modèle Vosk:', error);
      throw new Error('Impossible d\'initialiser la reconnaissance vocale');
    }
  }

  private async initializeMicrophone(): Promise<void> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone non supporté par ce navigateur');
      }

      console.log('Demande d\'accès au microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Microphone accessible, démarrage de la reconnaissance...');

      this.audioStream = stream;

      // Démarrer la reconnaissance vocale
      if (this.recognizer?.startListening) {
        this.recognizer.startListening();
        console.log('Reconnaissance vocale démarrée');
      }

      // Optimized frequency for better responsiveness while avoiding flickering
      this.audioInterval = window.setInterval(() => {
        if (this.isRecording && this.recognizer) {
          const result = this.recognizer.result();
          if (result?.text?.trim()) {
            console.log('Résultat reçu:', result.text);
            this.processRecognizedText(result.text);
          }
        }
      }, 100); // Back to faster frequency for real-time feel

    } catch (error) {
      console.error('Erreur microphone:', error);
      const err = error as Error;
      if (err.name === 'NotAllowedError') {
        throw new Error('Accès au microphone refusé. Veuillez autoriser l\'accès et réessayer.');
      } else if (err.name === 'NotFoundError') {
        throw new Error('Aucun microphone détecté sur cet appareil.');
      } else {
        throw new Error(`Erreur microphone: ${err.message}`);
      }
    }
  }

  private processRecognizedText(recognizedText: string): void {
    console.log('Texte reconnu:', recognizedText);
    this.elements.recognitionText.textContent = recognizedText;

    if (!recognizedText || this.currentLineIndex >= this.lines.length) return;

    const currentLine = this.lines[this.currentLineIndex];
    const recognizedWords = tokenizeWords(recognizedText).map(w => w.text);

    const similarity = calculateLineSimilarity(
      currentLine.words.map(w => w.text),
      recognizedWords
    );

    console.log(`Similarité ligne ${this.currentLineIndex}:`, similarity);

    let needsRerender = false;

    // Only highlight and mark words sequentially
    needsRerender = this.highlightMatchingWordsSequentially(currentLine, recognizedWords);

    if (similarity > this.config.wordMatchThreshold) {
      const spokenWordsCount = currentLine.words.filter(w => w.spoken).length;
      const totalWordsCount = currentLine.words.length;
      const completionRatio = spokenWordsCount / totalWordsCount;

      console.log(`Completion ratio: ${completionRatio} (${spokenWordsCount}/${totalWordsCount})`);

      // Complete line when enough words are spoken (using configured threshold)
      if (completionRatio >= this.config.completionThreshold) {
        console.log(`Line completed - ${completionRatio * 100}% of words spoken (threshold: ${this.config.completionThreshold * 100}%)`);
        this.completeLine(this.currentLineIndex);
        return; // completeLine handles its own rendering
      }
    }

    // Only re-render if words were actually highlighted and limit frequency
    if (needsRerender) {
      this.updateWordHighlights();
    }
  }

  private highlightMatchingWordsSequentially(line: Line, recognizedWords: string[]): boolean {
    console.log('Highlighting words sequentially in line:', line.text);
    console.log('Recognized words:', recognizedWords);

    let hasChanges = false;

    // Reset all highlighted states first
    line.words.forEach(word => {
      if (word.highlighted) {
        word.highlighted = false;
        hasChanges = true;
      }
    });

    // STRICT sequential approach - only the next word in order
    const nextWordIndex = line.words.findIndex(word => !word.spoken);

    if (nextWordIndex !== -1) {
      const nextWord = line.words[nextWordIndex];

      // Check if any recognized word matches the EXACT next word
      for (const recognizedWord of recognizedWords) {
        if (wordsMatch(nextWord.text, recognizedWord)) {
          console.log(`Sequential match: "${nextWord.text}" (position ${nextWordIndex}) matched with "${recognizedWord}"`);
          nextWord.highlighted = true;
          nextWord.spoken = true;
          hasChanges = true;
          break; // Only match the first correct word
        }
      }
    }

    return hasChanges;
  }

  private completeLine(lineIndex: number): void {
    if (lineIndex < this.lines.length) {
      // Mark current line as completed
      this.lines[lineIndex].completed = true;
      this.lines[lineIndex].active = false;

      // Clear highlights from completed line to avoid flickering
      this.lines[lineIndex].words.forEach(word => {
        word.highlighted = false;
      });

      if (lineIndex + 1 < this.lines.length) {
        this.currentLineIndex = lineIndex + 1;
        this.lines[this.currentLineIndex].active = true;

        // Render once and scroll smoothly with parallax
        this.renderLyrics();
        setTimeout(() => {
          this.scrollToActiveLineWithParallax();
        }, 50); // Small delay to ensure DOM is updated
      } else {
        this.renderLyrics();
        this.updateStatus('🎉 Texte terminé !');
        this.stopRecognition();
      }

      this.updateLineNumber();
    }
  }

  private stopRecognition(): void {
    this.isRecording = false;

    if (this.audioInterval) {
      clearInterval(this.audioInterval);
      this.audioInterval = null;
    }

    if (this.recognizer?.stopListening) {
      this.recognizer.stopListening();
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    this.elements.startBtn.disabled = false;
    this.elements.stopBtn.disabled = true;
    this.updateStatus('⏹ Arrêté');
    this.elements.recognitionText.textContent = 'En attente...';

    showMessage('Reconnaissance vocale arrêtée', 'success');
  }

  private resetPrompter(): void {
    this.stopRecognition();
    this.currentLineIndex = 0;

    this.lines.forEach(line => {
      line.completed = false;
      line.active = false;
      line.words.forEach(word => {
        word.spoken = false;
        word.highlighted = false;
      });
    });

    if (this.lines.length > 0) {
      this.lines[0].active = true;
    }

    this.renderLyrics();
    this.updateStatus('🔄 Remis à zéro');
    this.updateLineNumber();
    showMessage('Prompteur remis à zéro', 'info');
  }

  private toggleRecognition(): void {
    if (this.isRecording) {
      this.stopRecognition();
    } else {
      this.startRecognition();
    }
  }

  private updateStatus(status: string): void {
    this.elements.statusText.textContent = status;
  }

  private updateLineNumber(): void {
    this.elements.currentLineNumber.textContent = `${this.currentLineIndex + 1}/${this.lines.length}`;
  }

  private showLoadingOverlay(show: boolean): void {
    if (show) {
      this.elements.loadingOverlay.classList.remove('hidden');
    } else {
      this.elements.loadingOverlay.classList.add('hidden');
    }
  }

  // Méthodes de debug exposées
  public enableSimulation(): void {
    if (this.recognizer && (this.recognizer as any).enableSimulation) {
      (this.recognizer as any).enableSimulation();
      console.log('Mode simulation forcé');
    }
  }

  public getConfig(): PrompterConfig {
    return this.config;
  }

  public setConfig(newConfig: Partial<PrompterConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Configuration mise à jour:', this.config);
  }


  // Méthode de test pour l'illumination
  public testWordHighlighting(): void {
    if (this.lines.length === 0) {
      console.log('Aucun texte chargé pour le test');
      return;
    }

    const testWords = ['bonjour', 'et', 'bienvenue', 'dans', 'ce'];

    console.log('Test d\'illumination avec:', testWords);
    this.processRecognizedText(testWords.join(' '));
  }

  // Méthode de test pour simuler la progression ligne par ligne
  public simulateLineCompletion(): void {
    if (this.lines.length === 0) {
      console.log('Aucun texte chargé pour la simulation');
      return;
    }

    if (this.currentLineIndex >= this.lines.length) {
      console.log('Toutes les lignes sont déjà complétées');
      return;
    }

    const currentLine = this.lines[this.currentLineIndex];
    console.log(`Simulation de la ligne ${this.currentLineIndex + 1}: "${currentLine.text}"`);

    // Marquer tous les mots comme prononcés
    currentLine.words.forEach(word => {
      word.spoken = true;
      word.highlighted = false;
    });

    // Compléter la ligne
    this.completeLine(this.currentLineIndex);
  }

  private setupStepManagement(): void {
    // Show input step initially
    this.showStep('input');
  }

  private showStep(step: 'input' | 'prompter'): void {
    const textInputStep = document.getElementById('textInputStep');
    const prompterStep = document.getElementById('prompterStep');

    if (!textInputStep || !prompterStep) return;

    this.currentStep = step;

    if (step === 'input') {
      textInputStep.classList.remove('hidden');
      prompterStep.classList.add('hidden');
      // Focus on textarea
      setTimeout(() => this.elements.textInput.focus(), 100);
    } else {
      textInputStep.classList.add('hidden');
      prompterStep.classList.remove('hidden');
    }
  }

  private continueToPrompter(): void {
    const text = this.elements.textInput.value.trim();
    if (!text) {
      showMessage('Veuillez saisir un texte avant de continuer', 'error');
      return;
    }

    // Load text and show prompter step
    this.loadTextFromInput();
    this.showStep('prompter');
    showMessage('Texte chargé ! Vous pouvez maintenant démarrer le prompteur', 'success');
  }

  private backToInput(): void {
    // Stop recognition if running
    if (this.isRecording) {
      this.stopRecognition();
    }
    this.showStep('input');
    showMessage('Édition du texte', 'info');
  }

  // Public method to access current step
  public getCurrentStep(): 'input' | 'prompter' {
    return this.currentStep;
  }

  private setupScrollParallax(): void {
    // Simplified scroll listener - no throttling for best responsiveness
    const handleScroll = () => {
      if (this.currentStep === 'prompter') {
        this.applyParallaxEffect();
      }
    };

    // Listen for scroll events on the lyrics wrapper
    if (this.elements.lyricsWrapper) {
      this.elements.lyricsWrapper.addEventListener('scroll', handleScroll, { passive: true });
    }
  }
}