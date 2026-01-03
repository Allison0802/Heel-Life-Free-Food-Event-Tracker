import React from 'react';
import { CampusEvent } from '../types';
import { generateBatchICSFile } from '../utils/calendar';

interface BatchActionBarProps {
  selectedEvents: CampusEvent[];
  onClear: () => void;
}

const BatchActionBar: React.FC<BatchActionBarProps> = ({ selectedEvents, onClear }) => {
  if (selectedEvents.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-[fadeInUp_0.3s_ease-out] w-[90%] max-w-lg border border-slate-700">
      <div className="flex items-center gap-3">
         <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
            {selectedEvents.length}
         </div>
         <span className="font-medium whitespace-nowrap">Selected</span>
      </div>

      <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>

      <div className="flex items-center gap-3 flex-1 justify-end">
        <button onClick={onClear} className="text-sm text-slate-400 hover:text-white transition-colors px-2">
          Cancel
        </button>
        <a 
          href={generateBatchICSFile(selectedEvents)}
          download={`heellife_events_batch_${new Date().toISOString().split('T')[0]}.ics`}
          className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download Batch .ICS
        </a>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};

export default BatchActionBar;