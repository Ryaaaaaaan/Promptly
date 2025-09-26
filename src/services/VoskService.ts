import type { VoskModel, VoskSimpleAPI, VoskRecognizer } from '@/types';

// Simple speech recognition implementation
class SimpleSpeechRecognizer implements VoskRecognizer {
  private recognition: any = null;
  private resultBuffer = '';

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'fr-FR';

      this.recognition.onresult = (event: any) => {
        let result = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          result += event.results[i][0].transcript;
        }
        this.resultBuffer = result;
      };
    }
  }

  setWords(_enable: boolean): void {
    // Not implemented for Web Speech API
  }

  startListening(): void {
    this.recognition?.start();
  }

  stopListening(): void {
    this.recognition?.stop();
  }

  result(): { text: string } {
    const text = this.resultBuffer;
    this.resultBuffer = '';
    return { text };
  }

  acceptWaveform(_data: any): boolean {
    return true;
  }

  partialResult(): { text: string } {
    return { text: this.resultBuffer };
  }

  finalResult(): { text: string } {
    return this.result();
  }
}

class VoskModelImpl implements VoskModel {
  constructor(_modelPath: string | null) {}

  KaldiRecognizer(_sampleRate: number) {
    return new SimpleSpeechRecognizer();
  }
}

export class VoskService implements VoskSimpleAPI {
  async createModel(modelPath: string | null): Promise<VoskModel> {
    console.log('Initialisation de la reconnaissance vocale...',
      modelPath ? `Modèle: ${modelPath}` : 'Mode Web Speech uniquement');

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Système de reconnaissance vocale prêt');
        resolve(new VoskModelImpl(modelPath));
      }, 300);
    });
  }
}

// Instance globale pour compatibilité
export const Vosk = new VoskService();