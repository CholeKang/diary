import React from 'react';
import { DiaryEntry } from '../types';

interface EntryListProps {
  entries: DiaryEntry[];
  onDelete: (id: string) => void;
}

const EntryList: React.FC<EntryListProps> = ({ entries, onDelete }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-20 opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <p className="text-xl font-light">Your diary is empty.</p>
        <p className="text-sm mt-2">Tap the microphone to start recording.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-5 shadow-lg transition-all hover:bg-slate-800 hover:border-slate-600 group relative overflow-hidden">
          {/* Header: Date and Actions */}
          <div className="flex justify-between items-start mb-3 border-b border-slate-700/50 pb-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                {new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <button 
              onClick={(e) => {
                e.preventDefault(); 
                e.stopPropagation();
                onDelete(entry.id);
              }}
              className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2 -mr-2 -mt-2 rounded-lg transition-colors"
              title="Delete this entry"
              aria-label="Delete entry"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="prose prose-invert prose-p:text-slate-300 max-w-none">
            {entry.isTranscribing ? (
              <div className="flex items-center space-x-2 text-indigo-300 animate-pulse">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Transcribing audio with Gemini...</span>
              </div>
            ) : (
              <p className="whitespace-pre-line leading-relaxed">{entry.text}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EntryList;