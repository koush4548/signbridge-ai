import React, { useEffect, useState } from 'react';
import { Settings, Sliders, Volume2, Shield, User, RefreshCw, Check } from 'lucide-react';
import { useTranslator } from '../context/TranslatorContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { playTTS, getAvailableVoices } from '../utils/ttsPlayer';

export const SettingsPage: React.FC = () => {
  const { currentTheme } = useTheme();
  const { webcamSettings, updateWebcamSettings } = useTranslator();
  const { user, updateUser } = useAuth();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [profileName, setProfileName] = useState<string>(user?.name || 'Koushik');
  const [profileEmail, setProfileEmail] = useState<string>(user?.email || 'koushigans7@gmail.com');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setVoices(getAvailableVoices());
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoices(getAvailableVoices());
      };
    }
  }, []);

  const handleTestAudio = (lang: string) => {
    if (lang.startsWith('ta')) {
      playTTS('வணக்கம்! சைன்பிரிட்ஜ் செயலிக்கு நல்வரவு.', {
        language: 'ta-IN',
        rate: webcamSettings.ttsRate,
        pitch: webcamSettings.ttsPitch,
      });
    } else {
      playTTS('Hello! Welcome to SignBridge AI.', {
        language: 'en-US',
        rate: webcamSettings.ttsRate,
        pitch: webcamSettings.ttsPitch,
      });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateUser(profileName, profileEmail);
    if (ok) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div
        className="p-6 rounded-2xl border flex items-center justify-between shadow-lg"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
              System Configuration & Preferences
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
            Settings & Control Panel
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Customize video telemetry, neural speech synthesis, and user profile.
          </p>
        </div>
      </div>

      {/* 1. Vision Sensor Configuration */}
      <div
        className="p-6 rounded-2xl border space-y-5 shadow-xl"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: currentTheme.borderColor }}>
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
            Webcam & Vision Tracking Parameters
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label
            className="flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:border-cyan-500/40 transition-colors"
            style={{ backgroundColor: currentTheme.bgSurface, borderColor: currentTheme.borderColor }}
          >
            <span className="text-xs font-mono text-white">Mirror Webcam Stream</span>
            <input
              type="checkbox"
              checked={webcamSettings.mirrorWebcam}
              onChange={(e) => updateWebcamSettings({ mirrorWebcam: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </label>

          <label
            className="flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:border-cyan-500/40 transition-colors"
            style={{ backgroundColor: currentTheme.bgSurface, borderColor: currentTheme.borderColor }}
          >
            <span className="text-xs font-mono text-white">Show Landmark Skeletal Mesh</span>
            <input
              type="checkbox"
              checked={webcamSettings.showLandmarksOverlay}
              onChange={(e) => updateWebcamSettings({ showLandmarksOverlay: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </label>

          <label
            className="flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:border-cyan-500/40 transition-colors"
            style={{ backgroundColor: currentTheme.bgSurface, borderColor: currentTheme.borderColor }}
          >
            <span className="text-xs font-mono text-white">Show Detection Badge</span>
            <input
              type="checkbox"
              checked={webcamSettings.showBoundingBox}
              onChange={(e) => updateWebcamSettings({ showBoundingBox: e.target.checked })}
              className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 2. Audio Speech Synthesis (TTS) & Language */}
      <div
        className="p-6 rounded-2xl border space-y-5 shadow-xl"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: currentTheme.borderColor }}>
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Audio Speech Synthesis (TTS) & Regional Accents
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTestAudio('en')}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-mono font-bold text-cyan-300 hover:bg-slate-700 transition-colors shadow-sm"
            >
              Test English
            </button>
            <button
              type="button"
              onClick={() => handleTestAudio('ta')}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-mono font-bold text-emerald-300 hover:bg-slate-700 transition-colors shadow-sm"
            >
              தமிழ் Test
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 block font-semibold">Language Target</label>
            <select
              value={webcamSettings.ttsLanguage}
              onChange={(e) => updateWebcamSettings({ ttsLanguage: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none"
            >
              <option value="en-US">English (United States)</option>
              <option value="en-GB">English (United Kingdom)</option>
              <option value="en-IN">English (India)</option>
              <option value="ta-IN">தமிழ் - Tamil (India)</option>
              <option value="es-ES">Español (Spanish)</option>
              <option value="fr-FR">Français (French)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 block font-semibold">Speech Synthesizer Voice</label>
            <select
              value={webcamSettings.ttsVoice}
              onChange={(e) => updateWebcamSettings({ ttsVoice: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none"
            >
              <option value="">Default System Voice (Auto)</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Speech Rate</span>
              <span className="text-cyan-400 font-bold">{webcamSettings.ttsRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={webcamSettings.ttsRate}
              onChange={(e) => updateWebcamSettings({ ttsRate: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Speech Pitch</span>
              <span className="text-cyan-400 font-bold">{webcamSettings.ttsPitch}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={webcamSettings.ttsPitch}
              onChange={(e) => updateWebcamSettings({ ttsPitch: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Researcher Account Profile */}
      <div
        className="p-6 rounded-2xl border space-y-5 shadow-xl"
        style={{ backgroundColor: currentTheme.bgCard, borderColor: currentTheme.borderColor }}
      >
        <div className="flex items-center gap-3 border-b pb-3" style={{ borderColor: currentTheme.borderColor }}>
          <User className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
            Practitioner / Researcher Account
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 block font-semibold">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 block font-semibold">Email Address</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition-colors shadow-md flex items-center gap-2"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : null}
              <span>{savedSuccess ? 'Profile Saved!' : 'Save Profile Changes'}</span>
            </button>
            <span className="text-[11px] font-mono text-slate-500">Persistent Disk JSON Storage</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
