import type { VoskModel, VoskSimpleAPI } from '@/types';
import { SpeechRecognitionService } from './SpeechRecognitionService';

class VoskModelImpl implements VoskModel {
  constructor(private modelPath: string | null) {}

  KaldiRecognizer(sampleRate: number) {
    return new SpeechRecognitionService();
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