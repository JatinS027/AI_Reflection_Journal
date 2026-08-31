import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Calendar, 
  Clock, 
  BrainCircuit, 
  Download, 
  PlusCircle,
  Filter,
  CheckCircle2
} from 'lucide-react';
import type { JournalEntry, JournalCategory, JournalMood } from '../types';

interface HistoryListProps {
  entries: JournalEntry[];
  loading: boolean;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onNewEntry: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  entries,
  loading,
  onSelectEntry,
  onDeleteEntry,
  onNewEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchesCategory;

      const titleMatch = entry.title?.toLowerCase().includes(term);
      const promptMatch = entry.prompt?.toLowerCase().includes(term);
      const responseMatch = entry.response?.toLowerCase().includes(term);
      const summaryMatch = entry.summary?.toLowerCase().includes(term);

      return matchesCategory && (titleMatch || promptMatch || responseMatch || summaryMatch);
    });
  }, [entries, searchTerm, selectedCategory]);

  const handleDelete = async (entryId: string) => {
    setDeletingId(entryId);
    try {
      await onDeleteEntry(entryId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = (entry: JournalEntry) => {
    const transcript = (entry.messages || []).map(
      (m) => `### ${m.role === 'user' ? '👤 Your Reflection' : '✨ Gemini Insight'} (${new Date(m.timestamp).toLocaleString()})\n\n${m.text}\n`
    ).join('\n---\n\n');

    const mdContent = `# ${entry.title}
*Category: ${entry.category} | Mood: ${entry.mood || 'N/A'} | Created: ${new Date(entry.createdAt).toLocaleString()}*

${entry.summary ? `## AI Summary & Takeaways\n${entry.summary}\n\n` : ''}
${entry.keyInsights && entry.keyInsights.length > 0 ? `### Key Insights\n${entry.keyInsights.map((k) => `- ${k}`).join('\n')}\n\n` : ''}
${entry.actionItems && entry.actionItems.length > 0 ? `### Suggested Actions\n${entry.actionItems.map((a) => `- ${a}`).join('\n')}\n\n` : ''}

## Conversation Transcript
${transcript || entry.prompt}
`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reflection'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 font-semibold tracking-tight">
            Reflection Archive
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Your private journal entries persisted securely in Cloud Firestore
          </p>
        </div>

        <button
          id="history-new-entry-btn"
          onClick={onNewEntry}
          className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Write New Entry</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search entries by topic, insights, or text..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-stone-900"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            id="history-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-stone-900 text-stone-700 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="reflection">Reflection</option>
            <option value="gratitude">Gratitude</option>
            <option value="brainstorm">Brainstorm</option>
            <option value="problem_solving">Problem Solving</option>
            <option value="mindfulness">Mindfulness</option>
            <option value="career_growth">Career Growth</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center text-stone-500">
          <div className="w-6 h-6 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Fetching your private Firestore collection...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        /* Empty state */
        <div className="mt-12 text-center py-16 px-4 bg-white border border-dashed border-stone-300 rounded-2xl">
          <History className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-stone-800">
            {searchTerm || selectedCategory !== 'all' ? 'No matching entries found' : 'No reflections yet'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-6">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try resetting the filters or searching for different keywords.'
              : 'Write your first journal entry to start conversing with Gemini and building your private archive.'}
          </p>
          <button
            onClick={onNewEntry}
            className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium px-4 py-2.5 rounded-xl cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Your First Entry</span>
          </button>
        </div>
      ) : (
        /* Entry Cards Grid */
        <div className="mt-6 space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              id={`history-card-${entry.id}`}
              className="bg-white border border-stone-200 hover:border-stone-300 rounded-2xl p-5 sm:p-6 transition-all shadow-2xs hover:shadow-xs group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                      {entry.category}
                    </span>
                    {entry.mood && (
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                        Mood: {entry.mood}
                      </span>
                    )}
                    <span className="text-[11px] text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {entry.messages && entry.messages.length > 2 && (
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {entry.messages.length} messages
                      </span>
                    )}
                  </div>

                  <h2 className="text-base sm:text-lg font-serif font-semibold text-stone-900 group-hover:text-stone-700 transition-colors">
                    {entry.title}
                  </h2>

                  <p className="mt-2 text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">
                    {entry.prompt}
                  </p>

                  {/* Summary badge snippet if available */}
                  {entry.summary && (
                    <div className="mt-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 flex items-start gap-2">
                      <BrainCircuit className="w-3.5 h-3.5 text-amber-800 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-950 line-clamp-2">
                        <strong className="font-medium">AI Summary:</strong> {entry.summary}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 shrink-0">
                  <button
                    id={`open-entry-${entry.id}`}
                    onClick={() => onSelectEntry(entry)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Open & Converse</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      id={`export-entry-${entry.id}`}
                      onClick={() => handleExport(entry)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                      title="Export Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {confirmDeleteId === entry.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-md border border-rose-200">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={deletingId === entry.id}
                          className="text-[11px] text-rose-700 font-semibold px-2 py-0.5 hover:bg-rose-100 rounded cursor-pointer"
                        >
                          {deletingId === entry.id ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[11px] text-stone-500 px-1 hover:text-stone-800 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`delete-entry-${entry.id}`}
                        onClick={() => setConfirmDeleteId(entry.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
