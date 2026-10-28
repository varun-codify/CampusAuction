import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Notification } from '../../../shared/types.js';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshNotifications } = useAuth();

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await refreshNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleItemClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
        await refreshNotifications();
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notifications ({notifications.filter((n) => !n.isRead).length} unread)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time updates on bids, provisional wins, seller approvals, and saved search alerts.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 h-20 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">notifications_none</span>
          <h3 className="text-base font-bold text-slate-800">You are all caught up!</h3>
          <p className="text-xs text-slate-500 mt-1">No pending notifications at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <Link
              key={item.id}
              to={item.link || '#'}
              onClick={() => handleItemClick(item)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                item.isRead
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-indigo-50/70 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  item.type === 'OUTBID'
                    ? 'bg-red-100 text-red-600'
                    : item.type === 'AUCTION_WON' || item.type === 'HANDOVER_READY'
                    ? 'bg-emerald-100 text-emerald-700'
                    : item.type === 'SELLER_DECISION_REQUIRED'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-indigo-100 text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {item.type === 'OUTBID'
                    ? 'pan_tool'
                    : item.type === 'AUCTION_WON'
                    ? 'emoji_events'
                    : item.type === 'HANDOVER_READY'
                    ? 'verified'
                    : item.type === 'SELLER_DECISION_REQUIRED'
                    ? 'fact_check'
                    : 'info'}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm ${item.isRead ? 'font-semibold text-slate-800' : 'font-extrabold text-slate-900'}`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
              </div>

              {!item.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1.5" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
