import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Cpu, 
  KeyRound, 
  Server, 
  CheckCircle, 
  AlertTriangle,
  Code2
} from 'lucide-react';

export const ThreatModelModal: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 font-semibold tracking-tight">
            Agentic Threat Model & Security Controls
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Architectural security review, OWASP mitigation matrix, and owner-bound isolation proofs.
        </p>
      </div>

      {/* 5 Threat Zones Summary Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900 mb-3 flex items-center gap-2">
          <span>The 5 Threat Zones & Countermeasures</span>
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-2xs">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100/80 text-stone-700 font-semibold border-b border-stone-200">
              <tr>
                <th className="p-3.5 sm:p-4">Threat Zone</th>
                <th className="p-3.5 sm:p-4">Identified Risk & Vector</th>
                <th className="p-3.5 sm:p-4">OWASP Reference</th>
                <th className="p-3.5 sm:p-4">Implemented Countermeasure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              <tr>
                <td className="p-3.5 sm:p-4 font-semibold text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  1. Input Surfaces
                </td>
                <td className="p-3.5 sm:p-4 text-stone-600">
                  Untrusted journal text, malicious injection payloads, prototype pollution via malformed JSON.
                </td>
                <td className="p-3.5 sm:p-4 font-mono text-[11px] text-stone-500">
                  OWASP A03 / LLM02
                </td>
                <td className="p-3.5 sm:p-4">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Top-level defensive parsing, type guards, explicit string trimming, and size limit clamping.
                  </span>
                </td>
              </tr>

              <tr>
                <td className="p-3.5 sm:p-4 font-semibold text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  2. Planning & Reasoning
                </td>
                <td className="p-3.5 sm:p-4 text-stone-600">
                  Prompt injection, system instructions override to bypass journaling persona or leak system prompts.
                </td>
                <td className="p-3.5 sm:p-4 font-mono text-[11px] text-stone-500">
                  OWASP LLM01
                </td>
                <td className="p-3.5 sm:p-4">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Strict separation between system instruction and user content turns; prompt treated as plain data.
                  </span>
                </td>
              </tr>

              <tr>
                <td className="p-3.5 sm:p-4 font-semibold text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  3. Tool Execution
                </td>
                <td className="p-3.5 sm:p-4 text-stone-600">
                  API rate limits, upstream outages (503/429), unhandled exceptions crashing the server.
                </td>
                <td className="p-3.5 sm:p-4 font-mono text-[11px] text-stone-500">
                  OWASP LLM04 / A04
                </td>
                <td className="p-3.5 sm:p-4">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Resilient Model Fallback Ladder (Gemini 3.6 Flash → 3.1 Flash-Lite → Flash-Latest → 3.7 Flash).
                  </span>
                </td>
              </tr>

              <tr>
                <td className="p-3.5 sm:p-4 font-semibold text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  4. Memory & State
                </td>
                <td className="p-3.5 sm:p-4 text-stone-600">
                  Cross-user reflection reading, unauthorized document alteration, unauthenticated writes.
                </td>
                <td className="p-3.5 sm:p-4 font-mono text-[11px] text-stone-500">
                  OWASP A01 (Broken Access Control)
                </td>
                <td className="p-3.5 sm:p-4">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Owner-bound Firestore rules (<code className="text-[10px] bg-stone-100 px-1 py-0.5 rounded">request.auth.uid == userId</code>) + recursive undefined stripping.
                  </span>
                </td>
              </tr>

              <tr>
                <td className="p-3.5 sm:p-4 font-semibold text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  5. Inter-System Communication
                </td>
                <td className="p-3.5 sm:p-4 text-stone-600">
                  Gemini API key leakage to client browsers, hardcoded secrets in bundle.
                </td>
                <td className="p-3.5 sm:p-4 font-mono text-[11px] text-stone-500">
                  OWASP A07 / LLM06
                </td>
                <td className="p-3.5 sm:p-4">
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Zero-Hardcoding: Gemini API key kept strictly server-side in Express, lazy-loaded via Secret Manager / env.
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Firestore Security Rules Display */}
      <div className="mt-8 bg-stone-900 text-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-300" />
            <h3 className="text-sm font-semibold text-white">Deployed Firestore Security Rules</h3>
          </div>
          <span className="text-xs bg-emerald-950 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded-full font-mono">
            Zero Insecure Defaults (Tested & Deployed)
          </span>
        </div>

        <pre className="p-4 bg-stone-950 rounded-xl text-xs font-mono text-stone-300 overflow-x-auto border border-stone-800 leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile and subcollections strictly isolated to authenticated owner
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
        </pre>
      </div>

      {/* Authentication & Identity Architecture */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <h3 className="text-sm font-semibold text-stone-900 mb-2 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-700" />
            Passwordless Federated Identity
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            The application exclusively utilizes Google Sign-In via Firebase Auth. No raw passwords or hashes are collected, transported, or stored within the application codebase, completely eliminating credential stuffing and brute-force vectors.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
          <h3 className="text-sm font-semibold text-stone-900 mb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            Strict Undefined-Stripping Hygiene
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            All database mutation payloads pass through a recursive deep sanitizer (`sanitizePayload()`) before reaching the Firestore SDK to prevent undefined field runtime exceptions and payload contamination.
          </p>
        </div>
      </div>
    </div>
  );
};
