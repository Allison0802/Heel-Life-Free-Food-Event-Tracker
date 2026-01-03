import React from 'react';
import { CampusEvent } from '../types';
import { generateGoogleCalendarLink, generateICSFile, formatDisplayDate } from '../utils/calendar';

interface EventCardProps {
  event: CampusEvent;
  selected: boolean;
  onToggle: (id: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, selected, onToggle }) => {
  // Helper to extract hostname for cleaner display
  const getSourceDisplay = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return 'Source Link';
    }
  };

  return (
    <div 
      className={`relative bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group ${
        selected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'border-slate-200'
      }`}
    >
      {/* Selection Checkbox */}
      <div className="absolute top-4 right-4 z-10">
        <label className="relative flex items-center justify-center cursor-pointer p-1">
           <input 
             type="checkbox" 
             className="peer sr-only"
             checked={selected}
             onChange={() => onToggle(event.id)}
           />
           <div className={`w-5 h-5 border-2 rounded transition-colors flex items-center justify-center ${
             selected 
               ? 'bg-blue-600 border-blue-600' 
               : 'border-slate-300 bg-white group-hover:border-blue-400'
           }`}>
             {selected && (
               <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
             )}
           </div>
        </label>
      </div>

      <div>
        <div className="flex items-start justify-between mb-2 pr-8">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Free Food
          </span>
          <a 
            href={event.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-slate-400 hover:text-blue-600 truncate max-w-[120px]"
            title={event.sourceUrl}
          >
            via {getSourceDisplay(event.sourceUrl || '')}
          </a>
        </div>
        
        <div className="mb-1 pr-6">
           <h3 className="text-lg font-bold text-slate-800 leading-tight">
             {event.title}
           </h3>
        </div>
        
        <div className="text-sm text-slate-500 font-medium mb-4 flex items-center gap-2">
           <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDisplayDate(event.startDate)}
        </div>

        <div className="text-sm text-slate-600 mb-3 flex items-start gap-2">
           <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{event.location}</span>
        </div>
        
        <p className="text-sm text-slate-500 mb-6 line-clamp-3">
          {event.description}
        </p>
      </div>

      <div className="flex flex-col gap-2 mt-auto">
        <a 
          href={generateGoogleCalendarLink(event)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
             <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z"/>
          </svg>
          Add to Google Calendar
        </a>
        
        <a 
          href={generateICSFile(event)}
          download={`${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`}
          className="w-full inline-flex justify-center items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download .ICS
        </a>
      </div>
    </div>
  );
};

export default EventCard;