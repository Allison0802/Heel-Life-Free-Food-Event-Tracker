import React from 'react';
import { ScanStatus } from '../types';

interface ScanningStatusProps {
  status: ScanStatus;
  nextScanInSeconds: number | null;
}

const formatTimeRemaining = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const ScanningStatus: React.FC<ScanningStatusProps> = ({ status, nextScanInSeconds }) => {
  if (status === ScanStatus.SCANNING) {
    return (
      <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-100 animate-pulse">
        <div className="relative w-3 h-3">
           <div className="absolute top-0 left-0 w-full h-full bg-blue-500 rounded-full animate-ping"></div>
           <div className="relative w-full h-full bg-blue-600 rounded-full"></div>
        </div>
        <span className="text-sm font-medium">Scanning network for events...</span>
      </div>
    );
  }

  if (nextScanInSeconds !== null && nextScanInSeconds > 0) {
    return (
      <div className="flex items-center gap-3 bg-slate-100 text-slate-600 px-4 py-3 rounded-lg border border-slate-200">
         <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
         <span className="text-sm">
           Auto-scan enabled. Next check in <span className="font-mono font-bold text-slate-800">{formatTimeRemaining(nextScanInSeconds)}</span>
         </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-slate-50 text-slate-500 px-4 py-3 rounded-lg border border-slate-200">
        <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
        <span className="text-sm">Waiting for command</span>
    </div>
  );
};

export default ScanningStatus;