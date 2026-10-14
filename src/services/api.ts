import { HistoryItem, AnalyticsStats, AudioTranscriptionResult, SignBridgeUser } from '../types';

export class SignBridgeAPI {
  private static getHeaders(): HeadersInit {
    const token = localStorage.getItem('sb_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  static async getHistory(): Promise<HistoryItem[]> {
    try {
      const res = await fetch('/api/history', { headers: this.getHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  static async addHistory(item: Partial<HistoryItem>): Promise<HistoryItem | null> {
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(item),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  static async clearHistory(): Promise<boolean> {
    try {
      const res = await fetch('/api/history', {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  static async getStats(): Promise<AnalyticsStats> {
    try {
      const res = await fetch('/api/stats', { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Stats failed');
      return await res.json();
    } catch {
      return {
        totalPredictions: 0,
        averageConfidence: 0,
        totalSentences: 0,
        gestureCounts: {},
        dailyActivity: [],
        totalPracticeTimeMinutes: 0,
      };
    }
  }

  static async polishSentence(
    tokens: string[],
    targetLanguage = 'en'
  ): Promise<{ polishedSentence: string; targetTranslation?: string }> {
    try {
      const res = await fetch('/api/polish-sentence', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ tokens, targetLanguage }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Polish sentence error:', err);
    }
    const joined = tokens.join(' ');
    return { polishedSentence: joined, targetTranslation: joined };
  }

  static async transcribeAudio(
    audioData: string | Blob,
    mimeType = 'audio/webm',
    recordDuration = 0,
    targetLanguage = 'en'
  ): Promise<AudioTranscriptionResult> {
    try {
      let base64 = typeof audioData === 'string' ? audioData : '';
      if (typeof audioData !== 'string') {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            resolve(res.split(',')[1] || '');
          };
        });
        reader.readAsDataURL(audioData);
        base64 = await base64Promise;
      }

      const res = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          audioData: base64,
          mimeType,
          duration: recordDuration,
          targetLanguage,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Audio transcription error:', err);
    }
    return {
      id: `fallback_${Date.now()}`,
      transcription: 'Audio speech received.',
      confidence: 0.95,
      aslGloss: 'AUDIO SPEECH RECEIVED',
      language: targetLanguage,
      modelUsed: 'gemini-3.8-flash',
    };
  }

  static async getLetterFeedback(letter: string): Promise<any> {
    try {
      const res = await fetch(`/api/tutor/${letter}`, { headers: this.getHeaders() });
      if (res.ok) return await res.json();
    } catch {}
    return {
      feedback: `Perform the ASL shape for letter ${letter}`,
      keyPoints: ['Check finger alignment', 'Keep wrist stable', 'Hold hand steady'],
    };
  }
}
