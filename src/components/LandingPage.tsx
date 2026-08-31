import React from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Database, 
  Cpu, 
  CheckCircle2, 
  ArrowRight,
  KeyRound
} from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col justify-between selection:bg-amber-200">
      {/* Top Bar */}
      <header className="border-b border-stone-200/80 bg-stone-50/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-amber-100 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 tracking-tight text-lg">Reflection AI</span>
              <span className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-mono">v1.0</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-stone-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              OWASP & Zero-Insecure Defaults Compliant
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Section */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col items-center text-center">
        
        {/* Security badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-300/60 text-amber-900 text-xs font-medium mb-6">
          <Lock className="w-3.5 h-3.5 text-amber-700" />
          <span>Strict User-Bound Data Isolation in Cloud Firestore</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-stone-900 max-w-3xl leading-tight sm:leading-tight">
          Your Private Journal, Deepened by Gemini AI.
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-lg sm:text-xl text-stone-600 max-w-2xl font-light leading-relaxed">
          Write unfiltered thoughts, explore cognitive reframing, and discover insights in an isolated, authenticated sanctuary.
        </p>

        {/* Auth CTA Box */}
        <div className="mt-10 w-full max-w-md bg-stone-50 border border-stone-300/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900 mb-1">
            Access Your Private Dashboard
          </h2>
          <p className="text-xs text-stone-500 mb-6">
            Authenticate securely via Google Federated Sign-In. Zero plaintext passwords stored.
          </p>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs text-left">
              <strong>Authentication Notice:</strong> {errorMessage}
            </div>
          )}

          <button
            id="google-sign-in-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-medium py-3.5 px-5 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.54 0 2.93.56 4.02 1.48l3.01-3.01C17.2 1.8 14.78 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.66 2.84C6.44 6.88 8.99 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.07-1.5-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.56 14.76c-.23-.68-.36-1.41-.36-2.16s.13-1.48.36-2.16L1.9 7.6C1.19 9.02.77 10.63.77 12.37s.42 3.35 1.13 4.77l3.66-2.38z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.73c3.24 0 5.95-1.07 7.93-2.9l-3.7-2.9c-1.07.72-2.45 1.15-4.23 1.15-3.01 0-5.56-1.88-6.44-4.52L1.9 16.9C3.7 20.7 7.5 23.73 12 23.73z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          <div className="mt-4 pt-4 border-t border-stone-200/70 flex items-center justify-center gap-4 text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Firebase Auth
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> AES-256 Cloud Storage
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Gemini 3.6 Flash
            </span>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          
          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 mb-1">
              Multi-Turn AI Reflections
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Converse with Gemini 3.6 Flash using an empathetic, psychological reframing ladder with automated fallback resilience.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 mb-1">
              Owner-Bound Firestore
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Every journal entry is stored in user-isolated collections (<code className="text-[11px] text-stone-800 bg-stone-100 px-1 py-0.5 rounded">/users/{'{uid}'}/interactions</code>). Cross-user access is impossible.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-stone-200 text-stone-900 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 mb-1">
              Actionable Syntheses
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Convert long self-reflections into concise executive summaries, mindset patterns, and tangible daily micro-actions.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
        <p>Built with Google Cloud Run, Cloud Firestore, Firebase Authentication, and Google Gemini API.</p>
      </footer>
    </div>
  );
};
