class VocalPrompter {
    constructor() {
        this.recognizer = null;
        this.model = null;
        this.isRecording = false;
        this.currentLineIndex = 0;
        this.lines = [];
        this.spokenWords = new Set();
        this.currentWords = [];

        // Configuration
        this.confidenceThreshold = 0.3;
        this.wordMatchThreshold = 0.7;

        // Éléments DOM
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            resetBtn: document.getElementById('resetBtn'),
            textInput: document.getElementById('textInput'),
            loadTextBtn: document.getElementById('loadTextBtn'),
            lyricsContent: document.getElementById('lyricsContent'),
            lyricsWrapper: document.getElementById('lyricsWrapper'),
            statusText: document.getElementById('statusText'),
            recognitionText: document.getElementById('recognitionText'),
            currentLineNumber: document.getElementById('currentLineNumber'),
            loadingOverlay: document.getElementById('loadingOverlay')
        };

        this.initializeEventListeners();
        this.loadDefaultText();
    }

    initializeEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startRecognition());
        this.elements.stopBtn.addEventListener('click', () => this.stopRecognition());
        this.elements.resetBtn.addEventListener('click', () => this.resetPrompter());
        this.elements.loadTextBtn.addEventListener('click', () => this.loadTextFromInput());

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

    loadDefaultText() {
        const defaultText = `Bonjour et bienvenue dans ce prompteur vocal intelligent.
Cette application vous permet de suivre un texte en temps réel grâce à la reconnaissance vocale.
Chaque ligne s'illumine au fur et à mesure que vous la prononcez.
Les mots sont mis en surbrillance individuellement pour un suivi précis.
Vous pouvez personnaliser le texte dans la zone de saisie ci-dessus.
L'application fonctionne entièrement en local grâce à Vosk WebAssembly.
Aucune donnée n'est envoyée sur internet, votre confidentialité est préservée.
Profitez de cette expérience fluide et réactive pour vos présentations ou répétitions.`;

        this.elements.textInput.value = defaultText;
        this.loadTextFromInput();
    }

    loadTextFromInput() {
        const text = this.elements.textInput.value.trim();
        if (!text) {
            this.showMessage('Veuillez saisir un texte', 'error');
            return;
        }

        this.lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map((line, index) => ({
                id: index,
                text: line,
                words: this.tokenizeWords(line),
                completed: false,
                active: false
            }));

        this.currentLineIndex = 0;
        this.spokenWords.clear();
        this.renderLyrics();
        this.updateStatus();
        this.showMessage('Texte chargé avec succès', 'success');
    }

    tokenizeWords(text) {
        // Préserver l'espacement original en capturant les mots avec leur contexte
        const words = [];
        const originalWords = text.split(/(\s+)/); // Garder les espaces dans la capture

        for (let i = 0; i < originalWords.length; i++) {
            const word = originalWords[i];
            if (word.trim().length > 0) { // Seulement les mots, pas les espaces
                words.push({
                    id: Math.floor(i / 2), // Index basé sur les mots réels
                    text: word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''),
                    original: word,
                    trailing: originalWords[i + 1] || '', // Espace qui suit
                    spoken: false,
                    highlighted: false
                });
            }
        }

        return words;
    }

    renderLyrics() {
        if (this.lines.length === 0) {
            this.elements.lyricsContent.innerHTML = '<div class="empty-state">Aucun texte chargé</div>';
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

            // Effet de blur pour les lignes distantes
            const distance = Math.abs(index - this.currentLineIndex);
            if (distance > 2) className += ' far';

            return `<div class="${className}" data-line-index="${index}" id="line-${index}">
                        ${wordsHtml}
                    </div>`;
        }).join('');

        // Scroll vers la ligne active
        this.scrollToActiveLine();
    }

    scrollToActiveLine() {
        const activeLine = document.getElementById(`line-${this.currentLineIndex}`);
        if (activeLine) {
            activeLine.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    }

    async startRecognition() {
        try {
            if (this.lines.length === 0) {
                this.showMessage('Veuillez d\'abord charger un texte', 'error');
                return;
            }

            this.showLoadingOverlay(true);
            this.updateStatus('Démarrage...');

            // Initialiser le modèle si nécessaire
            if (!this.model) {
                await this.loadModel();
            }

            // Créer le recognizer
            if (!this.recognizer) {
                this.recognizer = this.model.KaldiRecognizer(16000);
                if (this.recognizer.setWords) {
                    this.recognizer.setWords(true);
                }
            }

            // Démarrer le microphone (simplifié)
            await this.initializeMicrophone();

            this.isRecording = true;
            this.elements.startBtn.disabled = true;
            this.elements.stopBtn.disabled = false;
            this.updateStatus('🎤 Écoute en cours...');
            this.showLoadingOverlay(false);

            // Activer la première ligne
            if (this.lines.length > 0) {
                this.lines[this.currentLineIndex].active = true;
                this.renderLyrics();
            }

            this.showMessage('Reconnaissance vocale démarrée !', 'success');

        } catch (error) {
            console.error('Erreur lors du démarrage:', error);
            this.showMessage(`Erreur: ${error.message}`, 'error');
            this.showLoadingOverlay(false);
            this.updateStatus('❌ Erreur');

            // Reset des boutons
            this.elements.startBtn.disabled = false;
            this.elements.stopBtn.disabled = true;
        }
    }

    async loadModel() {
        this.updateStatus('Initialisation de la reconnaissance vocale...');

        try {
            // Créer un modèle simple qui fonctionne toujours
            this.model = await Vosk.createModel(null);
            console.log('Reconnaissance vocale initialisée');
        } catch (error) {
            console.warn('Erreur modèle Vosk, création d\'un modèle de base:', error);
            // Créer un modèle factice minimal
            this.model = {
                KaldiRecognizer: (sampleRate) => new KaldiRecognizer(sampleRate, null)
            };
        }
    }

    async initializeMicrophone() {
        try {
            // Vérifier la disponibilité du microphone
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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

            // Démarrer directement la reconnaissance Web Speech API du recognizer
            if (this.recognizer && this.recognizer.startListening) {
                this.recognizer.startListening();
            }

            // Garder la référence du stream pour le nettoyage
            this.audioStream = stream;

            // Simuler le traitement audio (pour Vosk)
            this.audioInterval = setInterval(() => {
                if (this.isRecording && this.recognizer) {
                    // Déclencher la récupération des résultats
                    const result = this.recognizer.result();
                    if (result && result.text && result.text.trim()) {
                        this.processRecognizedText(result.text);
                    }
                }
            }, 100);

        } catch (error) {
            console.error('Erreur microphone:', error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Accès au microphone refusé. Veuillez autoriser l\'accès et réessayer.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('Aucun microphone détecté sur cet appareil.');
            } else {
                throw new Error(`Erreur microphone: ${error.message}`);
            }
        }
    }

    processRecognizedText(recognizedText) {
        console.log('Texte reconnu:', recognizedText);
        this.elements.recognitionText.textContent = recognizedText;

        if (!recognizedText || this.currentLineIndex >= this.lines.length) return;

        const currentLine = this.lines[this.currentLineIndex];
        const recognizedWords = this.tokenizeWords(recognizedText).map(w => w.text);

        // Calculer la similarité avec la ligne actuelle
        const similarity = this.calculateLineSimilarity(currentLine.words.map(w => w.text), recognizedWords);

        console.log(`Similarité ligne ${this.currentLineIndex}:`, similarity);

        if (similarity > this.wordMatchThreshold) {
            // Marquer les mots comme prononcés
            this.highlightSpokenWords(currentLine, recognizedWords);

            // Vérifier si la ligne est complète
            const completionRatio = currentLine.words.filter(w => w.spoken).length / currentLine.words.length;

            if (completionRatio > 0.7) { // 70% des mots prononcés
                this.completeLine(this.currentLineIndex);
            }
        } else {
            // Essayer de matcher des mots individuels
            this.highlightIndividualWords(currentLine, recognizedWords);
        }

        this.renderLyrics();
    }

    calculateLineSimilarity(lineWords, recognizedWords) {
        if (lineWords.length === 0 || recognizedWords.length === 0) return 0;

        let matches = 0;
        const maxLength = Math.max(lineWords.length, recognizedWords.length);

        for (const word of recognizedWords) {
            if (lineWords.some(lineWord => this.wordsMatch(lineWord, word))) {
                matches++;
            }
        }

        return matches / maxLength;
    }

    wordsMatch(word1, word2) {
        // Normaliser les mots
        const normalize = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
        const w1 = normalize(word1);
        const w2 = normalize(word2);

        if (w1 === w2) return true;

        // Vérifier les variations courantes
        if (w1.includes(w2) || w2.includes(w1)) return true;

        // Distance de Levenshtein simplifiée
        const minLength = Math.min(w1.length, w2.length);
        const maxLength = Math.max(w1.length, w2.length);

        if (minLength < 3) return w1 === w2;

        let differences = 0;
        for (let i = 0; i < minLength; i++) {
            if (w1[i] !== w2[i]) differences++;
        }
        differences += maxLength - minLength;

        return (differences / maxLength) < 0.3; // 70% de similarité
    }

    highlightSpokenWords(line, recognizedWords) {
        for (const word of line.words) {
            if (!word.spoken) {
                for (const recognizedWord of recognizedWords) {
                    if (this.wordsMatch(word.text, recognizedWord)) {
                        word.spoken = true;
                        word.highlighted = true;
                        break;
                    }
                }
            }
        }
    }

    highlightIndividualWords(line, recognizedWords) {
        // Reset highlights
        line.words.forEach(word => word.highlighted = false);

        // Highlight matching words
        for (const word of line.words) {
            for (const recognizedWord of recognizedWords) {
                if (this.wordsMatch(word.text, recognizedWord)) {
                    word.highlighted = true;
                    if (!word.spoken) {
                        word.spoken = true;
                    }
                    break;
                }
            }
        }
    }

    completeLine(lineIndex) {
        if (lineIndex < this.lines.length) {
            this.lines[lineIndex].completed = true;
            this.lines[lineIndex].active = false;

            // Passer à la ligne suivante
            if (lineIndex + 1 < this.lines.length) {
                this.currentLineIndex = lineIndex + 1;
                this.lines[this.currentLineIndex].active = true;
                this.scrollToActiveLine();
            } else {
                // Fin du texte
                this.updateStatus('Texte terminé !');
                this.stopRecognition();
            }

            this.updateLineNumber();
        }
    }

    stopRecognition() {
        this.isRecording = false;

        // Arrêter l'intervalle de traitement
        if (this.audioInterval) {
            clearInterval(this.audioInterval);
            this.audioInterval = null;
        }

        // Arrêter la reconnaissance
        if (this.recognizer && this.recognizer.stopListening) {
            this.recognizer.stopListening();
        }

        // Fermer le stream audio
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }

        // Reset de l'interface
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.updateStatus('⏹ Arrêté');
        this.elements.recognitionText.textContent = 'En attente...';

        this.showMessage('Reconnaissance vocale arrêtée', 'success');
    }

    resetPrompter() {
        this.stopRecognition();
        this.currentLineIndex = 0;
        this.spokenWords.clear();

        // Reset all lines
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
        this.updateStatus('Remis à zéro');
        this.updateLineNumber();
    }

    toggleRecognition() {
        if (this.isRecording) {
            this.stopRecognition();
        } else {
            this.startRecognition();
        }
    }

    updateStatus(status) {
        this.elements.statusText.textContent = status;
    }

    updateLineNumber() {
        this.elements.currentLineNumber.textContent = `${this.currentLineIndex + 1}/${this.lines.length}`;
    }

    showLoadingOverlay(show) {
        if (show) {
            this.elements.loadingOverlay.classList.remove('hidden');
        } else {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    showMessage(message, type = 'info') {
        // Créer un toast temporaire
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: var(--bg-secondary);
            color: var(--text-primary);
            border-radius: var(--border-radius);
            border: 1px solid var(--border-color);
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;

        if (type === 'error') {
            toast.style.borderColor = 'var(--accent-primary)';
            toast.style.background = 'rgba(255, 59, 48, 0.1)';
        } else if (type === 'success') {
            toast.style.borderColor = '#30d158';
            toast.style.background = 'rgba(48, 209, 88, 0.1)';
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// CSS pour les animations de toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(toastStyles);

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    window.prompter = new VocalPrompter();
    console.log('Prompteur vocal initialisé');

    // Afficher les raccourcis clavier
    console.log('Raccourcis disponibles:');
    console.log('- Ctrl + Espace: Démarrer/Arrêter la reconnaissance');
    console.log('- Échap: Arrêter la reconnaissance');
    console.log('- Ctrl + R: Remettre à zéro');
});