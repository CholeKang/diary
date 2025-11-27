import React, { useEffect, useState, useCallback } from 'react';
import { DiaryEntry } from '../types';

interface UserData {
  username: string;
  entries: DiaryEntry[];
  storageKey: string;
  totalSize: number;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const userDataList: UserData[] = [];
    
    // Scan local storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('diary_entries_')) {
        const username = key.replace('diary_entries_', '');
        try {
          const rawData = localStorage.getItem(key) || '[]';
          const entries = JSON.parse(rawData) as DiaryEntry[];
          
          userDataList.push({
            username,
            entries,
            storageKey: key,
            totalSize: rawData.length // Rough byte size
          });
        } catch (e) {
          console.error("Failed to parse data for", username);
        }
      }
    }
    setUsers(userDataList);
  }, []);

  // Listen for storage changes from other tabs or components
  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => {
        loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadData]);

  const handleDeleteUser = (username: string, key: string) => {
    if (window.confirm(`Are you sure you want to delete all data and the account for user "${username}"? This cannot be undone.`)) {
      // 1. Remove Diary Entries
      localStorage.removeItem(key);

      // 2. Remove Account Credentials (Password)
      try {
        const accountsStr = localStorage.getItem('voice_diary_accounts');
        if (accountsStr) {
          const accounts = JSON.parse(accountsStr);
          if (accounts[username]) {
            delete accounts[username];
            localStorage.setItem('voice_diary_accounts', JSON.stringify(accounts));
          }
        }
      } catch (e) {
        console.error("Error deleting account credentials", e);
      }
      
      // Immediately remove from local state to ensure UI reflects change regardless of async ops
      setUsers(prev => prev.filter(u => u.username !== username));
    }
  };

  const handleDeleteSingleEntry = (username: string, entryId: string, storageKey: string) => {
    try {
      // Get current data
      const rawData = localStorage.getItem(storageKey);
      if (rawData) {
        const entries = JSON.parse(rawData) as DiaryEntry[];
        // Filter out the specific entry
        const updatedEntries = entries.filter(e => e.id !== entryId);
        
        // Save back to local storage
        localStorage.setItem(storageKey, JSON.stringify(updatedEntries));
        
        // Update local state immediately
        setUsers(prevUsers => prevUsers.map(user => {
          if (user.username === username) {
            return {
              ...user,
              entries: updatedEntries,
              totalSize: JSON.stringify(updatedEntries).length
            };
          }
          return user;
        }));
      }
    } catch (e) {
      console.error("Error deleting individual entry", e);
    }
  };

  const handleClearDatabase = () => {
    if (window.confirm("DANGER: This will wipe ALL diary entries for ALL users. Account passwords will be kept. Are you sure?")) {
      // Only remove diary entries
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
         const key = localStorage.key(i);
         if (key && key.startsWith('diary_entries_')) {
            keysToRemove.push(key);
         }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      setUsers([]);
    }
  };

  const handleExportDatabase = () => {
    const exportData = {
        exportedAt: new Date().toISOString(),
        system: "Voice Diary LocalStorage",
        recordCount: users.reduce((acc, u) => acc + u.entries.length, 0),
        users: users.map(u => ({
            username: u.username,
            entryCount: u.entries.length,
            entries: u.entries
        }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voice_diary_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (username: string) => {
    setExpandedUser(expandedUser === username ? null : username);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-mono">
      {/* Admin Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-red-400 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ADMINISTRATION
          </h1>
          <p className="text-xs text-slate-500 mt-1">Local Storage Database Inspector</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={handleExportDatabase}
                className="px-4 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 rounded text-xs transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                EXPORT DB
            </button>
            <button 
                onClick={handleClearDatabase}
                className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded text-xs transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                PURGE DB
            </button>
            <button 
                onClick={onLogout}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
            >
                LOGOUT
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 mb-8">
             <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <div className="text-slate-500 text-xs uppercase">Total Users</div>
                <div className="text-2xl font-bold text-white mt-1">{users.length}</div>
             </div>
             <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <div className="text-slate-500 text-xs uppercase">Total Entries</div>
                <div className="text-2xl font-bold text-indigo-400 mt-1">
                    {users.reduce((acc, user) => acc + user.entries.length, 0)}
                </div>
             </div>
             <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
                <div className="text-slate-500 text-xs uppercase">Storage Usage</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                    {(users.reduce((acc, user) => acc + user.totalSize, 0) / 1024).toFixed(2)} KB
                </div>
             </div>
          </div>

          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">User Records</h2>

          {users.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-slate-600">
                No user data found in Local Storage.
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.username} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                    onClick={() => toggleExpand(user.username)}
                  >
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${expandedUser === user.username ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-200">{user.username}</h3>
                            <p className="text-xs text-slate-500">
                                {user.entries.length} entries &bull; {(user.totalSize / 1024).toFixed(2)} KB
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user.username, user.storageKey);
                            }}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/10 rounded transition-colors"
                            title="Delete User and Credentials"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 text-slate-600 transform transition-transform ${expandedUser === user.username ? 'rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedUser === user.username && (
                    <div className="border-t border-slate-800 bg-slate-950/50 p-4">
                        {user.entries.length === 0 ? (
                            <p className="text-slate-600 text-sm italic">No entries recorded.</p>
                        ) : (
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="text-slate-500 border-b border-slate-800">
                                        <th className="pb-2 pl-2">ID</th>
                                        <th className="pb-2">Date</th>
                                        <th className="pb-2">Content</th>
                                        <th className="pb-2 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-400">
                                    {user.entries.map(entry => (
                                        <tr key={entry.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-900/50">
                                            <td className="py-3 pl-2 font-mono text-slate-600 w-24">{entry.id}</td>
                                            <td className="py-3 whitespace-nowrap pr-4 w-40">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </td>
                                            <td className="py-3 pr-2">
                                                <div className="max-h-20 overflow-y-auto pr-2">
                                                    {entry.text}
                                                </div>
                                            </td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteSingleEntry(user.username, entry.id, user.storageKey)}
                                                    className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-md transition-all"
                                                    title="Delete Entry"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;