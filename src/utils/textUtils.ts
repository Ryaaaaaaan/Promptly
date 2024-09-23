import type { Word } from '@/types';

export function tokenizeWords(text: string): Word[] {
  const words: Word[] = [];
  const originalWords = text.split(/(\s+)/);

  for (let i = 0; i < originalWords.length; i++) {
    const word = originalWords[i];
    if (word.trim().length > 0) {
      words.push({
        id: Math.floor(i / 2),
        text: word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''),
        original: word,
        trailing: originalWords[i + 1] || '',
        spoken: false,
        highlighted: false
      });
    }
  }

  return words;
}

export function calculateLineSimilarity(lineWords: string[], recognizedWords: string[]): number {
  if (lineWords.length === 0 || recognizedWords.length === 0) return 0;

  let matches = 0;
  const maxLength = Math.max(lineWords.length, recognizedWords.length);

  for (const word of recognizedWords) {
    if (lineWords.some(lineWord => wordsMatch(lineWord, word))) {
      matches++;
    }
  }

  return matches / maxLength;
}

export function wordsMatch(word1: string, word2: string): boolean {
  const normalize = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const w1 = normalize(word1);
  const w2 = normalize(word2);

  if (w1 === w2) return true;
  if (w1.includes(w2) || w2.includes(w1)) return true;

  const minLength = Math.min(w1.length, w2.length);
  const maxLength = Math.max(w1.length, w2.length);

  if (minLength < 3) return w1 === w2;

  let differences = 0;
  for (let i = 0; i < minLength; i++) {
    if (w1[i] !== w2[i]) differences++;
  }
  differences += maxLength - minLength;

  return (differences / maxLength) < 0.3;
}