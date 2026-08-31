import React from 'react';
import { 
  BookOpen, 
  PlusCircle, 
  History, 
  ShieldCheck, 
  ListChecks, 
  LogOut, 
  Sparkles,
  User as UserIcon
} from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile;
  activeTab: 'editor' | 'history' | 'threat_model' | 'walkthrough';
  setActiveTab: (tab: 'editor' | 'history' | 'threat_model' | 'walkthrough') => void;
  onSignOut: () => void;
  entriesCount: number;
  onNewEntry: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onSignOut,
  entriesCount,
  onNewEntry
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-amber-100 shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 tracking-tight text-lg">Reflection AI</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                Firestore Isolated
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">Private Journaling & Gemini Companion</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            id="nav-new-entry-btn"
            onClick={() => {
              onNewEntry();
              setActiveTab('editor');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'editor'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">New Entry</span>
          </button>

          <button
            id="nav-history-btn"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Archive</span>
            {entriesCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs ${
                activeTab === 'history' ? 'bg-stone-700 text-amber-200' : 'bg-stone-200 text-stone-700'
              }`}>
                {entriesCount}
              </span>
            )}
          </button>

          <button
            id="nav-threat-model-btn"
            onClick={() => setActiveTab('threat_model')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'threat_model'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
            }`}
            title="Agentic Threat Model & Security Controls"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden lg:inline">Security Specs</span>
          </button>

          <button
            id="nav-walkthrough-btn"
            onClick={() => setActiveTab('walkthrough')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'walkthrough'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
            }`}
            title="QA & Functional Walkthrough Tests"
          >
            <ListChecks className="w-4 h-4 text-amber-600" />
            <span className="hidden lg:inline">Test Cases</span>
          </button>
        </nav>

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Avatar'}
                className="w-8 h-8 rounded-full border border-stone-300 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-medium text-xs">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
            <div className="hidden xl:block text-left">
              <p className="text-xs font-medium text-stone-900 leading-tight truncate max-w-[120px]">
                {user.displayName || user.email?.split('@')[0]}
              </p>
              <p className="text-[10px] text-stone-500 truncate max-w-[120px]">{user.email}</p>
            </div>
          </div>

          <button
            id="sign-out-btn"
            onClick={onSignOut}
            className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Sign Out of Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
