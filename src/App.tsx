/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile, JournalEntry } from './types';
import { 
  signInWithGoogle, 
  signOutUser, 
  subscribeToAuth, 
  fetchUserEntries, 
  deleteJournalEntry 
} from './firebase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { JournalEditor } from './components/JournalEditor';
import { HistoryList } from './components/HistoryList';
import { ThreatModelModal } from './components/ThreatModelModal';
import { WalkthroughTestCases } from './components/WalkthroughTestCases';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [signInError, setSignInError] = useState<string | null>(null);
  
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'threat_model' | 'walkthrough'>('editor');
  
  // Firestore Data State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(false);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        };
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
        setEntries([]);
        setActiveEntry(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Firestore entries when authenticated
  const loadEntries = async (userId: string) => {
    setLoadingEntries(true);
    try {
      const data = await fetchUserEntries(userId);
      setEntries(data);
    } catch (err) {
      console.error('Error fetching Firestore user entries:', err);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      loadEntries(currentUser.uid);
    }
  }, [currentUser?.uid]);

  // Handle Google Sign-In
  const handleSignIn = async () => {
    setSignInError(null);
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setSignInError(err?.message || 'Failed to sign in with Google. Please verify popup permissions.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Sign-Out
  const handleSignOut = async () => {
    try {
      await signOutUser();
      setActiveTab('editor');
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Start fresh entry
  const handleNewEntry = () => {
    setActiveEntry(null);
    setActiveTab('editor');
  };

  // Select entry from history to open in editor
  const handleSelectEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setActiveTab('editor');
  };

  // Entry saved callback
  const handleEntrySaved = (savedEntry: JournalEntry) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === savedEntry.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedEntry;
        return next;
      }
      return [savedEntry, ...prev];
    });
    setActiveEntry(savedEntry);
  };

  // Delete entry callback
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser?.uid) return;
    await deleteJournalEntry(currentUser.uid, entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    if (activeEntry?.id === entryId) {
      setActiveEntry(null);
    }
  };

  // Loading indicator for initial auth check
  if (authLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-stone-600">Verifying session security...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated: Render Landing Page
  if (!currentUser) {
    return (
      <LandingPage
        onSignIn={handleSignIn}
        isLoading={authLoading}
        errorMessage={signInError}
      />
    );
  }

  // Authenticated: Render Main Application Experience
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col selection:bg-amber-200">
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
        entriesCount={entries.length}
        onNewEntry={handleNewEntry}
      />

      <main className="flex-1">
        {activeTab === 'editor' && (
          <JournalEditor
            user={currentUser}
            currentEntry={activeEntry}
            onEntrySaved={handleEntrySaved}
            onViewHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryList
            entries={entries}
            loading={loadingEntries}
            onSelectEntry={handleSelectEntry}
            onDeleteEntry={handleDeleteEntry}
            onNewEntry={handleNewEntry}
          />
        )}

        {activeTab === 'threat_model' && (
          <ThreatModelModal />
        )}

        {activeTab === 'walkthrough' && (
          <WalkthroughTestCases />
        )}
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500 bg-stone-50/50">
        <p>Protected by Cloud Firestore owner-bound isolation and Google Firebase Authentication.</p>
      </footer>
    </div>
  );
}
