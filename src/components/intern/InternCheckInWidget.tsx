import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Laptop,
  Building,
  Send,
  AlertCircle,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/client';
import { InternCheckInItem, CheckInStatus, WorkMode } from '../../types';

export const InternCheckInWidget: React.FC = () => {
  const { currentIntern, projects, socket } = useApp();

  const [checkInStatus, setCheckInStatus] = useState<InternCheckInItem | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [mode, setMode] = useState<WorkMode>('Remote');
  const [status, setStatus] = useState<CheckInStatus>('Present');
  const [focusToday, setFocusToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // My assigned projects
  const myProjects = projects.filter((p) =>
    currentIntern ? p.assignedInternIds.includes(currentIntern.id) : false
  );

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res = await api.activity.getMyCheckInStatus();
      if (res.success) {
        setIsCheckedIn(res.checkedIn);
        setCheckInStatus(res.checkIn);
        setIsCheckedOut(res.isCheckedOut);

        if (res.checkIn) {
          setMode(res.checkIn.mode);
          setFocusToday(res.checkIn.focusToday);
          setSelectedProjectId(res.checkIn.projectId || '');
          if (res.checkIn.checkInTime) {
            const start = new Date(res.checkIn.checkInTime).getTime();
            const now = res.checkIn.checkOutTime ? new Date(res.checkIn.checkOutTime).getTime() : Date.now();
            setElapsedMinutes(Math.max(1, Math.round((now - start) / (1000 * 60))));
          }
        }
      }
    } catch (err: any) {
      console.warn('Could not load check-in status:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [currentIntern?.id]);

  // Real-time socket listener
  useEffect(() => {
    if (!socket) return;
    const handleCheckInEvent = (checkIn: any) => {
      if (checkIn && checkIn.internId === currentIntern?.id) {
        setCheckInStatus(checkIn);
        setIsCheckedIn(true);
        setIsCheckedOut(checkIn.status === 'Checked Out');
      }
    };
    socket.on('checkin_event', handleCheckInEvent);
    return () => {
      socket.off('checkin_event', handleCheckInEvent);
    };
  }, [socket, currentIntern?.id]);

  // Elapsed timer tick
  useEffect(() => {
    if (!isCheckedIn || isCheckedOut || !checkInStatus?.checkInTime) return;
    const interval = setInterval(() => {
      const start = new Date(checkInStatus.checkInTime).getTime();
      setElapsedMinutes(Math.max(1, Math.round((Date.now() - start) / (1000 * 60))));
    }, 60000);
    return () => clearInterval(interval);
  }, [isCheckedIn, isCheckedOut, checkInStatus]);

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusToday.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Please outline your focus and planned tasks for today.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);
    try {
      const res = await api.activity.submitCheckIn({
        focusToday: focusToday.trim(),
        mode,
        status: mode === 'Remote' ? 'Working Remotely' : mode === 'Office' ? 'In Office' : 'Present',
        projectId: selectedProjectId || undefined,
        blockers: blockers.trim() || undefined,
      });

      if (res.success) {
        setFeedbackMessage({ type: 'success', text: res.message || 'Checked in successfully! Activity recorded.' });
        setIsCheckedIn(true);
        setIsCheckedOut(false);
        setCheckInStatus(res.checkIn);
        setTimeout(() => setFeedbackMessage(null), 4000);
      } else {
        setFeedbackMessage({ type: 'error', text: res.message || 'Failed to submit check-in.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Check-in submission failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setIsSubmitting(true);
    setFeedbackMessage(null);
    try {
      const res = await api.activity.checkOut();
      if (res.success) {
        setIsCheckedOut(true);
        setCheckInStatus(res.checkIn);
        setFeedbackMessage({ type: 'success', text: res.message || 'Checked out successfully for today!' });
        setTimeout(() => setFeedbackMessage(null), 4000);
      } else {
        setFeedbackMessage({ type: 'error', text: res.message || 'Checkout failed.' });
      }
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Checkout request failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl animate-pulse flex items-center justify-between">
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="h-8 bg-slate-800 rounded w-24" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800 text-indigo-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
              <span>Daily Standup & Check-In</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </h3>
          </div>
        </div>

        {/* Status Pill */}
        {isCheckedIn && !isCheckedOut && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-400">
              Active ({formatHours(elapsedMinutes)})
            </span>
          </div>
        )}

        {isCheckedOut && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Checked Out ({formatHours(checkInStatus?.durationMinutes || 0)})</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Feedback message banner */}
        {feedbackMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/70 border border-rose-800 text-rose-300'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* STATE 1: Already Checked In & Active */}
        {isCheckedIn && !isCheckedOut && checkInStatus && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {checkInStatus.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900 text-slate-300 border border-slate-700">
                    {checkInStatus.mode}
                  </span>
                  {checkInStatus.adminAcknowledged && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-400" />
                      <span>Supervisor Acknowledged</span>
                    </span>
                  )}
                </div>

                <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Checked in at{' '}
                    {new Date(checkInStatus.checkInTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-1">TODAY'S PLANNED FOCUS:</span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  {checkInStatus.focusToday}
                </p>
              </div>

              {checkInStatus.projectTitle && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Target Project: <span className="text-white font-medium">{checkInStatus.projectTitle}</span></span>
                </div>
              )}

              {checkInStatus.blockers && (
                <div className="text-xs text-amber-300/90 bg-amber-950/30 border border-amber-800/60 p-2 rounded-lg">
                  <span className="font-semibold text-amber-400 block text-[10px]">REPORTED BLOCKERS:</span>
                  <span>{checkInStatus.blockers}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">
                Logged working time today: <strong className="text-white">{formatHours(elapsedMinutes)}</strong>
              </span>
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/80 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Checking out...' : 'Check Out for Today'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: Checked Out for Today */}
        {isCheckedOut && checkInStatus && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white">Daily Standup Complete</span>
              </div>
              <span className="text-slate-400 text-[11px]">
                Total: <strong className="text-emerald-400">{formatHours(checkInStatus.durationMinutes || 0)}</strong>
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              You checked out at{' '}
              {checkInStatus.checkOutTime
                ? new Date(checkInStatus.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'earlier'}
              . Activity logged in corporate central audit records.
            </p>
          </div>
        )}

        {/* STATE 3: Not Yet Checked In Today */}
        {!isCheckedIn && !isCheckedOut && (
          <form onSubmit={handleSubmitCheckIn} className="space-y-3.5 text-xs">
            {/* Working Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Where are you working today?</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('Remote')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    mode === 'Remote'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Laptop className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium text-[11px]">Remote</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('Office')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    mode === 'Office'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Building className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium text-[11px]">Office</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('Hybrid')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                    mode === 'Hybrid'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span className="font-medium text-[11px]">Hybrid</span>
                </button>
              </div>
            </div>

            {/* Target Project Selection */}
            {myProjects.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Associated Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select current project (or general focus)...</option>
                  {myProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Focus of the day */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Today's Focus & Planned Sprint Tasks</span>
                <span className="text-[10px] text-slate-500">Required</span>
              </label>
              <textarea
                value={focusToday}
                onChange={(e) => setFocusToday(e.target.value)}
                required
                rows={2}
                placeholder="Briefly state what you intend to work on today (e.g. implementing REST API endpoints, designing login screens, writing unit tests)..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition resize-none"
              />
            </div>

            {/* Any blockers */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Blockers or dependencies (optional)</label>
              <input
                type="text"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="Mention any dependencies or roadblocks requiring supervisor review..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !focusToday.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Recording Check-In...' : 'Submit Daily Check-In'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
