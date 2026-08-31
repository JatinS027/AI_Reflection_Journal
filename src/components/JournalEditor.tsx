import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Sparkles, 
  Send, 
  Save, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Lightbulb, 
  BrainCircuit, 
  Compass, 
  Clock, 
  Smile, 
  CheckCircle,
  FileText
} from 'lucide-react';
import type { 
  JournalEntry, 
  JournalCategory, 
  JournalMood, 
  ChatMessage, 
  UserProfile 
} from '../types';
import { saveJournalEntry } from '../firebase';

interface JournalEditorProps {
  user: UserProfile;
  currentEntry: JournalEntry | null;
  onEntrySaved: (entry: JournalEntry) => void;
  onViewHistory: () => void;
}

const CATEGORIES: { id: JournalCategory; label: string; desc: string }[] = [
  { id: 'reflection', label: 'Reflection', desc: 'Daily thoughts & perspective' },
  { id: 'gratitude', label: 'Gratitude', desc: 'Appreciations & joyful moments' },
  { id: 'brainstorm', label: 'Brainstorm', desc: 'Creative ideas & exploration' },
  { id: 'problem_solving', label: 'Problem Solving', desc: 'Working through obstacles' },
  { id: 'mindfulness', label: 'Mindfulness', desc: 'Grounding & self-awareness' },
  { id: 'career_growth', label: 'Growth', desc: 'Goals & milestones' },
];

const MOODS: { id: JournalMood; label: string; icon: string }[] = [
  { id: 'calm', label: 'Calm', icon: '🌿' },
  { id: 'inspired', label: 'Inspired', icon: '✨' },
  { id: 'anxious', label: 'Anxious', icon: '🌧️' },
  { id: 'grateful', label: 'Grateful', icon: '🙏' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: '🌪️' },
  { id: 'motivated', label: 'Motivated', icon: '🔥' },
  { id: 'reflective', label: 'Reflective', icon: '🪞' },
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  user,
  currentEntry,
  onEntrySaved,
  onViewHistory,
}) => {
  // Entry Form State
  const [entryId, setEntryId] = useState<string>(() => currentEntry?.id || `entry_${Date.now()}`);
  const [title, setTitle] = useState<string>(() => currentEntry?.title || '');
  const [category, setCategory] = useState<JournalCategory>(() => currentEntry?.category || 'reflection');
  const [mood, setMood] = useState<JournalMood>(() => currentEntry?.mood || 'reflective');
  const [initialPrompt, setInitialPrompt] = useState<string>(() => currentEntry?.prompt || '');
  
  // Conversation & AI state
  const [messages, setMessages] = useState<ChatMessage[]>(() => currentEntry?.messages || []);
  const [followUpInput, setFollowUpInput] = useState<string>('');
  const [summary, setSummary] = useState<string | undefined>(() => currentEntry?.summary);
  const [keyInsights, setKeyInsights] = useState<string[] | undefined>(() => currentEntry?.keyInsights);
  const [actionItems, setActionItems] = useState<string[] | undefined>(() => currentEntry?.actionItems);

  // Status & Dynamic Prompts
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dynamicPrompts, setDynamicPrompts] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState<boolean>(false);

  // Sync state when currentEntry changes
  useEffect(() => {
    if (currentEntry) {
      setEntryId(currentEntry.id);
      setTitle(currentEntry.title);
      setCategory(currentEntry.category);
      setMood(currentEntry.mood || 'reflective');
      setInitialPrompt(currentEntry.prompt);
      setMessages(currentEntry.messages || []);
      setSummary(currentEntry.summary);
      setKeyInsights(currentEntry.keyInsights);
      setActionItems(currentEntry.actionItems);
    }
  }, [currentEntry]);

  // Load inspirational prompts on category/mood change
  const fetchPrompts = async () => {
    setLoadingPrompts(true);
    try {
      const res = await fetch('/api/gemini/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, mood }),
      });
      const data = await res.json();
      if (data.prompts && Array.isArray(data.prompts)) {
        setDynamicPrompts(data.prompts);
      }
    } catch (err) {
      console.warn('Failed to fetch prompt inspirations:', err);
    } finally {
      setLoadingPrompts(false);
    }
  };

  useEffect(() => {
    if (!initialPrompt && messages.length === 0) {
      fetchPrompts();
    }
  }, [category, mood]);

  // Save to Firestore with strict undefined stripping and user feedback
  const persistEntry = async (entryToSave: JournalEntry) => {
    setSaveStatus('saving');
    setErrorMessage(null);
    try {
      await saveJournalEntry(user.uid, entryToSave);
      setSaveStatus('saved');
      onEntrySaved(entryToSave);
      setTimeout(() => {
        setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
      }, 3500);
    } catch (err: any) {
      console.error('Firestore save failed:', err);
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save entry to Firestore.');
    }
  };

  // Submit initial reflection
  const handleInitialSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!initialPrompt.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const activeTitle = title.trim() || `${category.charAt(0).toUpperCase() + category.slice(1)}: ${initialPrompt.slice(0, 35)}...`;

    try {
      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: initialPrompt.trim(),
          category,
          mood,
          history: [],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive reflection from Gemini.');
      }

      const userMsg: ChatMessage = {
        id: `msg_user_${Date.now()}`,
        role: 'user',
        text: initialPrompt.trim(),
        timestamp: new Date().toISOString(),
      };

      const aiMsg: ChatMessage = {
        id: `msg_model_${Date.now() + 1}`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      const newMessages = [userMsg, aiMsg];
      setMessages(newMessages);

      const entry: JournalEntry = {
        id: entryId,
        userId: user.uid,
        title: activeTitle,
        category,
        mood,
        prompt: initialPrompt.trim(),
        response: data.text,
        messages: newMessages,
        createdAt: currentEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!title) setTitle(activeTitle);
      await persistEntry(entry);
    } catch (err: any) {
      console.error('Error reflecting:', err);
      setErrorMessage(err?.message || 'Failed to send prompt to Gemini.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send follow-up multi-turn message
  const handleSendFollowUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!followUpInput.trim() || isSubmitting) return;

    const currentText = followUpInput.trim();
    setFollowUpInput('');
    setIsSubmitting(true);
    setErrorMessage(null);

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      text: currentText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const historyPayload = updatedMessages.slice(0, -1).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentText,
          category,
          mood,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive reply from Gemini.');
      }

      const aiMsg: ChatMessage = {
        id: `msg_model_${Date.now() + 1}`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);

      const entry: JournalEntry = {
        id: entryId,
        userId: user.uid,
        title: title.trim() || `Reflection: ${initialPrompt.slice(0, 30)}`,
        category,
        mood,
        prompt: initialPrompt,
        response: finalMessages[1]?.text || data.text,
        summary,
        keyInsights,
        actionItems,
        messages: finalMessages,
        createdAt: currentEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await persistEntry(entry);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setErrorMessage(err?.message || 'Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Synthesize Summary & Key Takeaways
  const handleGenerateSummary = async () => {
    if (messages.length === 0 && !initialPrompt) return;
    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: initialPrompt,
          response: messages[1]?.text || '',
          messages,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || 'Failed to generate summary.');
      }

      const parsed = data.data;
      setSummary(parsed.summary);
      setKeyInsights(parsed.keyInsights || []);
      setActionItems(parsed.actionItems || []);

      const entry: JournalEntry = {
        id: entryId,
        userId: user.uid,
        title: title.trim() || `Reflection: ${initialPrompt.slice(0, 30)}`,
        category,
        mood,
        prompt: initialPrompt,
        response: messages[1]?.text || '',
        summary: parsed.summary,
        keyInsights: parsed.keyInsights || [],
        actionItems: parsed.actionItems || [],
        messages,
        createdAt: currentEntry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await persistEntry(entry);
    } catch (err: any) {
      console.error('Summary error:', err);
      setErrorMessage(err?.message || 'Failed to summarize entry.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Header & Save Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 font-semibold tracking-tight">
            {messages.length > 0 ? 'Reflection Workspace' : 'New Journal Entry'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Isolated under <code className="text-xs bg-stone-100 text-stone-700 px-1 py-0.5 rounded font-mono">/users/{user.uid.slice(0, 6)}.../interactions</code>
          </p>
        </div>

        {/* Action Status Controls */}
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving to Firestore...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <Check className="w-3.5 h-3.5" /> Saved in Firestore
            </span>
          )}
          {saveStatus === 'error' && (
            <button
              onClick={() => {
                const entry: JournalEntry = {
                  id: entryId,
                  userId: user.uid,
                  title: title || 'Journal Entry',
                  category,
                  mood,
                  prompt: initialPrompt,
                  response: messages[1]?.text || '',
                  summary,
                  keyInsights,
                  actionItems,
                  messages,
                  createdAt: currentEntry?.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                persistEntry(entry);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" /> Retry Save
            </button>
          )}

          {messages.length > 0 && (
            <button
              id="summarize-btn"
              onClick={handleGenerateSummary}
              disabled={isSummarizing}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-stone-900 hover:bg-stone-800 text-white px-3.5 py-1.5 rounded-lg transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Synthesize AI takeaways and action steps"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-amber-300" />
              <span>{isSummarizing ? 'Synthesizing...' : 'Summarize & Insights'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Interaction Alert</p>
            <p className="mt-0.5 text-rose-700">{errorMessage}</p>
          </div>
          <button 
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Configuration Metadata Bar */}
      <div className="mt-6 space-y-4 bg-stone-50 p-5 rounded-2xl border border-stone-200 shadow-2xs">
        
        {/* Title input */}
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">Entry Title (Optional)</label>
          <input
            id="entry-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Reflections on personal boundaries and work focus..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
          />
        </div>

        {/* Category & Mood selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">Reflection Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  id={`cat-btn-${cat.id}`}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mood Selector */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5">Current Emotional State</label>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  id={`mood-btn-${m.id}`}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                    mood === m.id
                      ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-2xs'
                      : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Dynamic Gemini Prompt Recommendations */}
      {messages.length === 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-950">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Gemini Prompt Starters for {category} ({mood})</span>
            </div>
            <button
              id="refresh-prompts-btn"
              onClick={fetchPrompts}
              disabled={loadingPrompts}
              className="text-xs text-amber-800 hover:text-amber-950 flex items-center gap-1 font-medium cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loadingPrompts ? 'animate-spin' : ''}`} />
              <span>New Ideas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {dynamicPrompts.map((p, idx) => (
              <button
                key={idx}
                id={`prompt-suggestion-${idx}`}
                onClick={() => setInitialPrompt(p)}
                className="text-left text-xs bg-white/90 hover:bg-white text-stone-800 p-2.5 rounded-xl border border-amber-200/60 shadow-2xs hover:border-amber-400 transition-all cursor-pointer"
              >
                "{p}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Initial Entry Area (If no conversation started yet) */}
      {messages.length === 0 ? (
        <form onSubmit={handleInitialSubmit} className="mt-6 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-300/80 p-4 shadow-2xs focus-within:border-stone-900 transition-colors">
            <label className="block text-xs font-semibold text-stone-800 mb-2">
              Write Your Thoughts & Reflections
            </label>
            <textarea
              id="journal-input-textarea"
              rows={8}
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              placeholder="What is currently on your mind? Describe what happened, how you are feeling, what challenge you are facing, or what ideas you want to explore..."
              className="w-full text-stone-800 placeholder-stone-400 text-sm focus:outline-none resize-y leading-relaxed font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-stone-400 font-mono">
              {initialPrompt.length} characters
            </span>

            <button
              id="submit-reflection-btn"
              type="submit"
              disabled={isSubmitting || !initialPrompt.trim()}
              className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-6 py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                  <span>Reflecting with Gemini 3.6 Flash...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Reflect & Converse with Gemini</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Multi-Turn Active Dialogue Section */
        <div className="mt-8 space-y-6">
          
          {/* Synthesized Summary Banner (If generated) */}
          {summary && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/90 shadow-2xs">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="w-4 h-4 text-amber-800" />
                <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Synthesized AI Summary & Takeaways
                </h3>
              </div>
              
              <p className="text-sm text-amber-950 font-serif leading-relaxed mb-4">
                {summary}
              </p>

              {keyInsights && keyInsights.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-semibold text-amber-900 block mb-1.5">Key Insights & Mindset Patterns:</span>
                  <div className="flex flex-wrap gap-2">
                    {keyInsights.map((insight, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white/80 border border-amber-300 text-xs text-stone-800 shadow-2xs"
                      >
                        • {insight}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {actionItems && actionItems.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-amber-900 block mb-1.5">Suggested Action Items:</span>
                  <ul className="space-y-1">
                    {actionItems.map((item, idx) => (
                      <li key={idx} className="text-xs text-amber-950 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Conversation Transcript */}
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                id={`chat-message-${index}`}
                className={`p-5 rounded-2xl transition-all ${
                  msg.role === 'user'
                    ? 'bg-white border border-stone-200 ml-4 sm:ml-12 shadow-2xs'
                    : 'bg-stone-50 border border-stone-200/90 mr-4 sm:mr-12'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {msg.role === 'user' ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-medium">
                          You
                        </div>
                        <span className="text-xs font-semibold text-stone-900">Your Reflection</span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-xs font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                        </div>
                        <span className="text-xs font-semibold text-stone-900">Gemini Insight</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-sm text-stone-800 leading-relaxed font-sans prose prose-stone max-w-none">
                  {msg.role === 'model' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Follow-up message composer */}
          <form onSubmit={handleSendFollowUp} className="sticky bottom-4 pt-2">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-stone-300 p-2 sm:p-3 shadow-lg flex items-center gap-2">
              <input
                id="followup-input"
                type="text"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                placeholder="Continue conversation, ask for advice, or explore a thought deeper..."
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 text-sm bg-transparent border-none focus:outline-none text-stone-900 placeholder-stone-400"
              />
              <button
                id="send-followup-btn"
                type="submit"
                disabled={isSubmitting || !followUpInput.trim()}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer shrink-0"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                ) : (
                  <>
                    <span>Reply</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      )}

    </div>
  );
};
