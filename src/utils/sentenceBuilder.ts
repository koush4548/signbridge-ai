export const COMMON_VOCABULARY = [
  'HELLO',
  'THANK YOU',
  'PLEASE',
  'SORRY',
  'HELP',
  'I LOVE YOU',
  'GOOD',
  'MORNING',
  'NIGHT',
  'YES',
  'NO',
  'NAME',
  'MY',
  'WHAT',
  'HOW',
  'WHERE',
  'WHEN',
  'WHY',
  'WELCOME',
  'FRIEND',
  'FAMILY',
  'WATER',
  'FOOD',
  'BATHROOM',
  'PAIN',
  'DOCTOR',
  'HOSPITAL',
  'STOP',
  'MORE',
  'DRINK',
  'EAT',
];

export function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b[j - 1] === a[i - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1, // deletion
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i - 1] + 1 // substitution
        );
      }
    }
  }

  return matrix[bn][an];
}

export function autoCorrectWord(input: string, maxDistance = 2): string {
  const clean = input.toUpperCase().trim();
  if (clean.length < 3) return input;

  let bestMatch = clean;
  let minDistance = Infinity;

  for (const word of COMMON_VOCABULARY) {
    const dist = levenshteinDistance(clean, word);
    if (dist < minDistance && dist <= maxDistance) {
      minDistance = dist;
      bestMatch = word;
    }
  }

  return bestMatch;
}

/**
 * SentenceAssembler:
 * Manages word tokens and in-progress letter-by-letter spelling buffer
 */
export class SentenceAssembler {
  private tokens: string[] = [];
  private currentSpellingBuffer = '';

  /**
   * Add a letter to the current spelling buffer (A-Z)
   */
  addLetter(char: string): { tokens: string[]; spellingBuffer: string } {
    const upper = char.toUpperCase().trim();
    if (/^[A-Z]$/.test(upper)) {
      this.currentSpellingBuffer += upper;
    }
    return { tokens: [...this.tokens], spellingBuffer: this.currentSpellingBuffer };
  }

  /**
   * Commit the current spelling buffer as a completed word in the sentence
   */
  commitSpellingBuffer(): { tokens: string[]; spellingBuffer: string } {
    if (this.currentSpellingBuffer.trim().length > 0) {
      const rawWord = this.currentSpellingBuffer.trim();
      this.tokens.push(rawWord);
      this.currentSpellingBuffer = '';
    }
    return { tokens: [...this.tokens], spellingBuffer: this.currentSpellingBuffer };
  }

  /**
   * Add a whole word token (e.g. from Word Mode: HELLO, THANK_YOU, etc.)
   */
  addWordToken(word: string): { tokens: string[]; spellingBuffer: string } {
    const clean = word.toUpperCase().trim();
    if (!clean || clean === 'UNKNOWN') return { tokens: [...this.tokens], spellingBuffer: this.currentSpellingBuffer };

    // Commit any pending spelling buffer first
    if (this.currentSpellingBuffer.trim().length > 0) {
      this.commitSpellingBuffer();
    }

    const formatted = clean.replace(/_/g, ' ');
    this.tokens.push(formatted);
    return { tokens: [...this.tokens], spellingBuffer: this.currentSpellingBuffer };
  }

  /**
   * Backspace: removes last letter from spelling buffer, or last token if buffer is empty
   */
  backspace(): { tokens: string[]; spellingBuffer: string } {
    if (this.currentSpellingBuffer.length > 0) {
      this.currentSpellingBuffer = this.currentSpellingBuffer.slice(0, -1);
    } else if (this.tokens.length > 0) {
      this.tokens.pop();
    }
    return { tokens: [...this.tokens], spellingBuffer: this.currentSpellingBuffer };
  }

  /**
   * Clear all tokens and spelling buffer
   */
  clear(): void {
    this.tokens = [];
    this.currentSpellingBuffer = '';
  }

  getTokens(): string[] {
    return [...this.tokens];
  }

  getSpellingBuffer(): string {
    return this.currentSpellingBuffer;
  }

  getAssembledSentence(): string {
    const base = this.tokens.join(' ');
    if (this.currentSpellingBuffer.length > 0) {
      return base ? `${base} ${this.currentSpellingBuffer}` : this.currentSpellingBuffer;
    }
    return base;
  }
}
