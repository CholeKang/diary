import React, { useState, useEffect } from 'react';
import Recorder from './components/Recorder';
import EntryList from './components/EntryList';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import { DiaryEntry, RecorderState, User } from './types';
import { transcribeAudio, transcribeImage } from './services/geminiService';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  
  // App State
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [recorderState, setRecorderState] = useState<RecorderState>(RecorderState.IDLE);
  const [error, setError] = useState<string | null>(null);
  
  // Data Loading State - Critical to prevent overwriting DB on init
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('voice_diary_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Load User Data (Simulate Database Fetch)
  useEffect(() => {
    if (user && user.username !== 'admin') {
      setIsDataLoaded(false); // Reset load state on user change
      
      const dbKey = `diary_entries_${user.username}`;
      const savedEntries = localStorage.getItem(dbKey);
      
      if (savedEntries) {
        try {
          setEntries(JSON.parse(savedEntries));
        } catch (e) {
          console.error("Failed to parse diary entries", e);
          setEntries([]);
        }
      } else {
        setEntries([]);
      }
      setIsDataLoaded(true); // Mark as loaded
    } else {
      setEntries([]);
      setIsDataLoaded(true);
    }
  }, [user]);

  // Save User Data (Simulate Database Update)
  useEffect(() => {
    // Only save if we have a user, it's not admin, AND we have finished loading the initial data
    if (user && user.username !== 'admin' && isDataLoaded) {
      const dbKey = `diary_entries_${user.username}`;
      localStorage.setItem(dbKey, JSON.stringify(entries));
    }
  }, [entries, user, isDataLoaded]);

  const handleLogin = (username: string) => {
    const newUser: User = { username, lastLogin: Date.now() };
    setUser(newUser);
    localStorage.setItem('voice_diary_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('voice_diary_user');
    setEntries([]);
    setIsDataLoaded(false);
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!user) return;

    const newEntry: DiaryEntry = {
      id: generateId(),
      text: "",
      timestamp: Date.now(),
      isTranscribing: true,
    };

    // Add entry immediately to UI with "Transcribing..." state
    setEntries(prev => [newEntry, ...prev]);

    try {
      // Process with Gemini
      const text = await transcribeAudio(audioBlob);
      
      // Update entry with result
      setEntries(prev => prev.map(entry => 
        entry.id === newEntry.id 
          ? { ...entry, text: text, isTranscribing: false }
          : entry
      ));
      setRecorderState(RecorderState.IDLE);
    } catch (err) {
      console.error("Transcription failed", err);
      setError("Failed to transcribe audio. Please check your API Key and internet connection.");
      
      // Remove the failed entry
      setEntries(prev => prev.filter(e => e.id !== newEntry.id));
      setRecorderState(RecorderState.IDLE);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;

    // Guard: Prevent uploading massive files that shouldn't be processed
    if (file.size > 10 * 1024 * 1024) {
      setError("Image file is too large. Please use an image under 10MB.");
      return;
    }

    setRecorderState(RecorderState.PROCESSING);

    const newEntry: DiaryEntry = {
      id: generateId(),
      text: "", // We don't save the image data to localstorage to avoid quotas, only the OCR result
      timestamp: Date.now(),
      isTranscribing: true,
    };

    setEntries(prev => [newEntry, ...prev]);

    try {
      const text = await transcribeImage(file);
      
      setEntries(prev => prev.map(entry => 
        entry.id === newEntry.id 
          ? { ...entry, text: text || "[No text found in image]", isTranscribing: false }
          : entry
      ));
      setRecorderState(RecorderState.IDLE);
    } catch (err) {
      console.error("Image transcription failed", err);
      setError("Failed to process image. Please try again.");
      setEntries(prev => prev.filter(e => e.id !== newEntry.id));
      setRecorderState(RecorderState.IDLE);
    }
  };

  const handleTextSubmit = (text: string) => {
    if (!user) return;
    if (!text.trim()) return;

    const newEntry: DiaryEntry = {
      id: generateId(),
      text: text,
      timestamp: Date.now(),
      isTranscribing: false,
    };

    setEntries(prev => [newEntry, ...prev]);
  };

  const handleDelete = (id: string) => {
    // Removed confirmation to make deletion immediate and smoother
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  // If not logged in, show Login Screen
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Admin Route
  if (user.username === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Main App View
  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      <header className="flex-none p-6 pt-10 pb-4 bg-slate-950 border-b border-slate-800/50 sticky top-0 z-20 backdrop-blur-md bg-opacity-80">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    Biblios
                </h1>
                <p className="text-slate-500 text-sm mt-1">Archive of <span className="text-indigo-300 font-medium">{user.username}</span></p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Simple visual indicator for API Key status */}
              <div className={`h-2 w-2 rounded-full ${process.env.API_KEY ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} title={process.env.API_KEY ? "System Ready" : "API Key Missing"}></div>
              
              <button 
                onClick={handleLogout}
                className="text-xs font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-full transition-all"
              >
                Log Out
              </button>
            </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-6 scroll-smooth">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-800 text-red-200 p-4 rounded-xl flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-300 hover:text-white">&times;</button>
            </div>
          )}

          <EntryList 
            entries={entries} 
            onDelete={handleDelete} 
          />
        </div>
      </main>
      
      {/* Spacer for the fixed recorder component */}
      <div className="h-32 flex-none"></div>

      <Recorder 
        onRecordingComplete={handleRecordingComplete} 
        onImageSelected={handleImageUpload}
        onTextSubmit={handleTextSubmit}
        state={recorderState}
        setState={setRecorderState}
      />
    </div>
  );
};

export default App;