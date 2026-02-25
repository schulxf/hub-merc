import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

/**
 * SnapshotStatus — displays the portfolio snapshot capture status.
 *
 * Shows:
 * - ✅ "Snapshot capturado às HH:MM" when snapshot exists
 * - ⏳ "Capturando snapshot..." when capturing in progress
 * - Nothing when no snapshot or not capturing
 *
 * @param {object}   props
 * @param {boolean}  [props.isCapturing=false] - Whether snapshot is currently being captured
 * @param {number}   [props.lastCapturedAt=null] - Timestamp when last snapshot was captured (ISO string)
 * @returns {React.ReactElement|null}
 */
const SnapshotStatus = React.memo(function SnapshotStatus({ isCapturing = false, lastCapturedAt = null }) {
  // Nothing to show
  if (!isCapturing && !lastCapturedAt) {
    return null;
  }

  // Format timestamp to HH:MM
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm text-emerald-200 flex items-center gap-3">
      {isCapturing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Capturando snapshot do portfólio...</span>
        </>
      ) : lastCapturedAt ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>✓ Snapshot capturado às {formatTime(lastCapturedAt)}</span>
        </>
      ) : null}
    </div>
  );
});

export default SnapshotStatus;
