import React from 'react';
import { X, CheckCheck, Bell, ArrowRight, FolderKanban, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationItem } from '../../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'admin' | 'intern';
  onSelectNotification?: (notif: NotificationItem) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  role,
  onSelectNotification,
}) => {
  const { notifications, currentIntern, markNotificationAsRead, markAllNotificationsAsRead } = useApp();

  if (!isOpen) return null;

  const userNotifications = notifications.filter((n) => {
    if (role === 'admin') return n.role === 'admin';
    if (role === 'intern' && currentIntern) return n.recipientId === currentIntern.id;
    return false;
  });

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.isRead) {
      markNotificationAsRead(notif.id);
    }
    if (onSelectNotification) {
      onSelectNotification(notif);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Notifications Center</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-600 text-white tabular-nums">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All Read</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {userNotifications.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <Bell className="w-8 h-8 text-slate-700 mx-auto" />
                <p>No notifications at this time.</p>
              </div>
            ) : (
              userNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer select-none space-y-1.5 ${
                    !notif.isRead
                      ? 'bg-indigo-950/30 border-indigo-600/60 hover:bg-indigo-950/50'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        !notif.isRead ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {notif.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 tabular-nums shrink-0">
                      {new Date(notif.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>

                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 tabular-nums">
                      {new Date(notif.timestamp).toLocaleDateString()}
                    </span>
                    {(notif.projectId || notif.reportId) && (
                      <span className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1">
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
            <span>Nexus Real-Time Alerts</span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
