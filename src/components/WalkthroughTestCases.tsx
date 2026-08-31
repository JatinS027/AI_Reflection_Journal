import React, { useState } from 'react';
import { 
  ListChecks, 
  CheckCircle, 
  Circle, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink,
  Shield,
  Sparkles,
  Database,
  LogIn
} from 'lucide-react';

interface TestCase {
  id: string;
  category: 'Authentication' | 'Journaling' | 'AI Multi-Turn' | 'AI Synthesis' | 'Archive & Search' | 'Security & Isolation';
  title: string;
  objective: string;
  steps: string[];
  expectedResult: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'TC-AUTH-01',
    category: 'Authentication',
    title: 'Google Federated Sign-In Flow',
    objective: 'Verify that an unauthenticated user can log in via Google popup and redirect to their private dashboard.',
    steps: [
      '1. Open the application landing page.',
      '2. Verify that no private journal entries or editor fields are exposed.',
      '3. Click "Continue with Google".',
      '4. Complete the Google authentication dialog.',
      '5. Observe automatic redirection to the private dashboard with user avatar and email in the top navigation bar.'
    ],
    expectedResult: 'User auth state updates; user profile loads, and private Firestore collections are initialized.'
  },
  {
    id: 'TC-AUTH-02',
    category: 'Authentication',
    title: 'User Sign-Out & Session Clearance',
    objective: 'Verify that clicking Sign Out completely invalidates the session and returns to landing page.',
    steps: [
      '1. From the authenticated dashboard, click the Sign Out icon in the top right.',
      '2. Verify that the user state is immediately reset to null.',
      '3. Verify that the Landing Page is rendered and all past entry memory in UI is purged.'
    ],
    expectedResult: 'User is returned to the unauthenticated landing view.'
  },
  {
    id: 'TC-JOURNAL-01',
    category: 'Journaling',
    title: 'New Reflection Creation with Dynamic Gemini Prompt Inspiration',
    objective: 'Verify category & mood selection, dynamic prompt suggestion loading, and initial reflection composition.',
    steps: [
      '1. Navigate to "New Entry".',
      '2. Select Category: "Gratitude" and Emotional State: "Calm".',
      '3. Click "New Ideas" to refresh AI-generated prompt inspirations.',
      '4. Click one of the suggested prompt cards to populate the textarea.',
      '5. Add additional thoughts in the reflection editor and click "Reflect & Converse with Gemini".'
    ],
    expectedResult: 'Gemini 3.6 Flash analyzes the reflection, returns an empathetic reply, and automatically saves to Firestore with "Saved in Firestore" status.'
  },
  {
    id: 'TC-AI-01',
    category: 'AI Multi-Turn',
    title: 'Multi-Turn Conversational Reflection Dialogue',
    objective: 'Verify that the user can ask follow-up questions and Gemini maintains conversational context.',
    steps: [
      '1. In an active reflection workspace, scroll to the bottom follow-up input bar.',
      '2. Type a follow-up inquiry (e.g., "How can I maintain this feeling when facing tomorrow\'s deadline?").',
      '3. Click "Reply".',
      '4. Observe the user message and subsequent Gemini insight added to the conversation transcript.',
      '5. Verify that the updated multi-turn messages array is persisted to Firestore.'
    ],
    expectedResult: 'Multi-turn transcript renders cleanly in markdown and updates seamlessly in Firestore.'
  },
  {
    id: 'TC-AI-02',
    category: 'AI Synthesis',
    title: 'Executive Summary & Key Takeaways Generation',
    objective: 'Verify that clicking "Summarize & Insights" synthesizes core themes, key takeaways, and action items.',
    steps: [
      '1. With at least 1 reflection turn completed, click the "Summarize & Insights" button in the top action bar.',
      '2. Observe loading state ("Synthesizing...").',
      '3. Inspect the rendered summary card containing the synthesized paragraph, key insights chips, and suggested action items.',
      '4. Verify the summary fields are saved to the Firestore document.'
    ],
    expectedResult: 'Structured AI synthesis is created and stored on the interaction document.'
  },
  {
    id: 'TC-ARCHIVE-01',
    category: 'Archive & Search',
    title: 'Historical Archive Filtering, Search, & Markdown Export',
    objective: 'Verify that past entries are retrieved from Firestore, can be searched/filtered, and exported as markdown.',
    steps: [
      '1. Click "Archive" in the top navigation.',
      '2. Verify that all previously authored entries for the current user are listed with timestamps and category tags.',
      '3. Type a keyword in the search bar and verify matching entries filter in real time.',
      '4. Change the category filter dropdown and observe filtered list.',
      '5. Click the Download icon on an entry card to export a complete Markdown transcript file.',
      '6. Click "Open & Converse" to resume the multi-turn session in the editor.'
    ],
    expectedResult: 'Entries are accurately filtered, exported, and reopened for continued editing.'
  },
  {
    id: 'TC-ARCHIVE-02',
    category: 'Archive & Search',
    title: 'Entry Deletion with Safety Confirmation',
    objective: 'Verify that deleting an entry requires confirmation and removes the document from Firestore.',
    steps: [
      '1. In the Archive view, click the Trash icon on an entry card.',
      '2. Observe the "Confirm" / "✕" safety prompt.',
      '3. Click "Confirm".',
      '4. Verify that the document is removed from Firestore and disappears from the UI list.'
    ],
    expectedResult: 'Document is permanently deleted from `/users/{uid}/interactions/{entryId}`.'
  },
  {
    id: 'TC-SEC-01',
    category: 'Security & Isolation',
    title: 'Cross-User Data Isolation Verification',
    objective: 'Verify that Firestore security rules enforce `request.auth.uid == userId` and prevent unauthorized access.',
    steps: [
      '1. Inspect deployed `firestore.rules`.',
      '2. Verify that reads and writes outside `/users/{userId}` are strictly denied.',
      '3. Verify that all Gemini API calls occur server-side through `/api/gemini/*` with zero client-side key exposure.'
    ],
    expectedResult: 'Zero insecure defaults, strict owner-bound permissions, and zero key leakage.'
  }
];

export const WalkthroughTestCases: React.FC = () => {
  const [completedTests, setCompletedTests] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(TEST_CASES[0].id);

  const toggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedTests((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(completedTests).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / TEST_CASES.length) * 100);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-amber-700" />
            <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 font-semibold tracking-tight">
              Functional Stability & QA Walkthrough
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Complete test cases covering every visible process and interaction for automated test generation and validation.
          </p>
        </div>

        {/* Progress pill */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-semibold text-stone-900">{completedCount} of {TEST_CASES.length} Verified</p>
            <p className="text-[10px] text-stone-500">{progressPercent}% test completion</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-xs text-stone-800">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Test Cases Accordion List */}
      <div className="mt-8 space-y-3">
        {TEST_CASES.map((tc) => {
          const isDone = !!completedTests[tc.id];
          const isExpanded = expandedId === tc.id;

          return (
            <div
              key={tc.id}
              id={`test-case-${tc.id}`}
              className={`rounded-2xl border transition-all ${
                isDone
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-white border-stone-200 hover:border-stone-300'
              } shadow-2xs`}
            >
              {/* Header bar */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => toggleComplete(tc.id, e)}
                    className="text-stone-400 hover:text-emerald-600 transition-colors cursor-pointer"
                    title={isDone ? 'Mark as pending' : 'Mark as verified'}
                  >
                    {isDone ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-300" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {tc.id}
                      </span>
                      <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {tc.category}
                      </span>
                    </div>
                    <h3 className={`text-sm sm:text-base font-semibold mt-1 ${isDone ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                      {tc.title}
                    </h3>
                  </div>
                </div>

                <div className="text-stone-400">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-stone-100 space-y-4 text-xs sm:text-sm">
                  <div>
                    <strong className="text-stone-900 block mb-1">Objective:</strong>
                    <p className="text-stone-600 leading-relaxed">{tc.objective}</p>
                  </div>

                  <div>
                    <strong className="text-stone-900 block mb-1">Step-by-Step Procedure:</strong>
                    <ol className="space-y-1 text-stone-700 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 font-mono text-xs">
                      {tc.steps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900">
                    <strong className="block mb-0.5 font-semibold text-emerald-950">Expected Outcome:</strong>
                    <p>{tc.expectedResult}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
