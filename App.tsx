import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CampusEvent, ScanStatus, LogEntry } from './types';
import EventCard from './components/EventCard';
import ScanningStatus from './components/ScanningStatus';
import BatchActionBar from './components/BatchActionBar';
import { findFreeFoodEvents } from './services/gemini';

// Constants
const AUTO_REFRESH_TIMER_MS = 1000; // Update timer display every second

// Helper to calculate next Sunday time
const getNextSundayTime = (): number => {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday
  // If today is Sunday (0), schedule for next week (7 days)
  // If today is Monday (1), schedule for Sunday (6 days)
  const daysUntil = day === 0 ? 7 : 7 - day;
  return Date.now() + (daysUntil * 24 * 60 * 60 * 1000);
};

const App: React.FC = () => {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<ScanStatus>(ScanStatus.IDLE);
  const [autoCheck, setAutoCheck] = useState<boolean>(false);
  const [nextScanTime, setNextScanTime] = useState<number | null>(null);
  const [secondsUntilNext, setSecondsUntilNext] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [apiKey, setApiKey] = useState<string>(process.env.API_KEY || '');
  const [showKeyInput, setShowKeyInput] = useState(!process.env.API_KEY);

  // Helper to add logs
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }, ...prev].slice(0, 50)); // Keep last 50 logs
  }, []);

  // Selection Logic
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === events.length && events.length > 0) {
      setSelectedIds(new Set()); // Deselect all if all are selected
    } else {
      setSelectedIds(new Set(events.map(e => e.id))); // Select all
    }
  }, [events, selectedIds]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Get selected event objects
  const selectedEvents = useMemo(() => {
    return events.filter(e => selectedIds.has(e.id));
  }, [events, selectedIds]);


  // The actual scanning logic
  const performScan = useCallback(async () => {
    if (!apiKey) {
      addLog('API Key missing. Cannot scan.', 'error');
      setStatus(ScanStatus.ERROR);
      return;
    }

    setStatus(ScanStatus.SCANNING);
    addLog('Connecting to HeelLife Discovery API...', 'info');

    try {
      const foundEvents = await findFreeFoodEvents(apiKey);
      
      if (foundEvents.length > 0) {
        setEvents(prev => {
           // Basic deduplication based on title + date
           const existingIds = new Set(prev.map(e => `${e.title}-${e.startDate}`));
           const newUnique = foundEvents.filter(e => !existingIds.has(`${e.title}-${e.startDate}`));
           
           if (newUnique.length > 0) {
             addLog(`Success! Found ${newUnique.length} new events from API data.`, 'success');
             return [...newUnique, ...prev];
           } else {
             addLog('Analysis complete. No new unique events found in the API data.', 'info');
             return prev;
           }
        });
      } else {
        addLog('Analysis complete. No matching free food events found for the coming week.', 'info');
      }
      setStatus(ScanStatus.SUCCESS);
    } catch (err: any) {
      addLog(`Scan failed: ${err.message}`, 'error');
      setStatus(ScanStatus.ERROR);
    } finally {
        // Schedule next scan if auto is on (Next Sunday)
        if (autoCheck) {
            setNextScanTime(getNextSundayTime());
        }
    }
  }, [apiKey, addLog, autoCheck]);

  // Handle Manual Scan
  const handleManualScan = () => {
    setNextScanTime(null); // Reset timer
    performScan();
  };

  // Effect: Handle Auto Check Timer
  useEffect(() => {
    if (!autoCheck || !nextScanTime) {
      setSecondsUntilNext(null);
      return;
    }

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((nextScanTime - Date.now()) / 1000));
      setSecondsUntilNext(remaining);

      if (remaining === 0) {
         performScan();
      }
    }, AUTO_REFRESH_TIMER_MS);

    return () => clearInterval(timer);
  }, [autoCheck, nextScanTime, performScan]);

  // Effect: Toggle Auto Check
  useEffect(() => {
     if (autoCheck && status !== ScanStatus.SCANNING) {
        // If turned on and not currently scanning, set timer for next Sunday
        if (!nextScanTime) {
             setNextScanTime(getNextSundayTime());
        }
     } else if (!autoCheck) {
         setNextScanTime(null);
     }
  }, [autoCheck, status, nextScanTime]);


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-sky-400 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
               H
             </div>
             <h1 className="text-xl font-bold text-slate-800 tracking-tight">HeelLife Tracker</h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* API Key Toggle/Input */}
             <div className="relative">
                {showKeyInput ? (
                    <div className="flex items-center gap-2">
                         <input 
                            type="password" 
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter Gemini API Key"
                            className="text-sm border border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none w-48"
                         />
                         <button onClick={() => setShowKeyInput(false)} className="text-xs text-slate-500 hover:text-slate-800">Save</button>
                    </div>
                ) : (
                    <button onClick={() => setShowKeyInput(true)} className="text-xs text-slate-400 hover:text-blue-600 transition-colors">
                        Configure API Key
                    </button>
                )}
             </div>

             <a 
                href="https://heellife.unc.edu/events?perks=FreeFood" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
             >
                Visit Site
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
             </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls & Logs */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Controls Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Scanner Control</h2>
            
            <div className="space-y-4">
               <ScanningStatus status={status} nextScanInSeconds={secondsUntilNext} />

               <div className="flex items-center justify-between pt-2">
                 <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div className="relative">
                      <input type="checkbox" className="sr-only" checked={autoCheck} onChange={(e) => setAutoCheck(e.target.checked)} />
                      <div className={`w-10 h-6 rounded-full transition-colors ${autoCheck ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoCheck ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700">Auto-Check (Every Sunday)</span>
                 </label>
               </div>

               <button
                 onClick={handleManualScan}
                 disabled={status === ScanStatus.SCANNING || !apiKey}
                 className={`w-full py-2.5 px-4 rounded-lg font-semibold text-white transition-all shadow-sm ${
                    status === ScanStatus.SCANNING || !apiKey
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-slate-900 hover:bg-slate-800 active:transform active:scale-95'
                 }`}
               >
                 {status === ScanStatus.SCANNING ? 'Scanning...' : 'Check Now'}
               </button>
            </div>
            
             <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                Note: Accesses the <span className="font-mono">HeelLife Discovery API</span> directly to bypass client-side rendering issues and find events in the <span className="font-semibold text-slate-600">coming week</span>.
             </p>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[400px]">
             <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
               Activity Log
               <span className="text-xs font-normal text-slate-400 ml-auto">{logs.length} entries</span>
             </h2>
             <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {logs.length === 0 && (
                    <div className="text-center text-slate-400 text-sm py-10">No activity yet.</div>
                )}
                {logs.map(log => (
                    <div key={log.id} className="text-sm border-l-2 pl-3 py-0.5" style={{
                        borderColor: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#cbd5e1'
                    }}>
                        <div className="text-xs text-slate-400 mb-0.5">{log.timestamp}</div>
                        <div className={`text-slate-700 ${log.type === 'error' ? 'text-red-600' : ''}`}>
                            {log.message}
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: Events Grid */}
        <div className="lg:col-span-8">
           <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Upcoming Events</h2>
              <div className="flex items-center gap-3">
                {events.length > 0 && (
                  <button 
                    onClick={handleSelectAll}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {selectedIds.size === events.length && selectedIds.size > 0 ? 'Deselect All' : 'Select All'}
                  </button>
                )}
                <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  {events.length} Found
                </div>
              </div>
           </div>

           {events.length === 0 ? (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No events yet</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  Click "Check Now" or enable auto-scan to analyze the HeelLife page for free food events.
                </p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {events.map(event => (
                 <EventCard 
                    key={event.id} 
                    event={event} 
                    selected={selectedIds.has(event.id)}
                    onToggle={handleToggleSelect}
                  />
               ))}
             </div>
           )}
        </div>

      </main>

      <BatchActionBar selectedEvents={selectedEvents} onClear={handleClearSelection} />
    </div>
  );
};

export default App;