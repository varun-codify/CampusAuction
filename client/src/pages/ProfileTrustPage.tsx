import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../../../shared/types.js';

export const ProfileTrustPage: React.FC = () => {
  const { user, testAccounts, switchUser } = useAuth();

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          Profile &amp; Trust Dossier
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Campus verification standing, student peer reputation, and transaction completion history.
        </p>
      </div>

      {/* Main Profile Card matching Stitch Screen 12 */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
              alt={user?.name || 'User'}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                <span className="material-symbols-outlined text-primary text-lg font-variation-fill">verified</span>
              </div>
              <span className="text-xs text-slate-500 font-mono mt-0.5">{user?.studentId} • {user?.email}</span>
              <span className="text-xs text-slate-600 font-semibold mt-1">
                {user?.hall} • {user?.campus}
              </span>

              {/* Department & Batch Year */}
              {user?.department && (
                <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold mt-1">
                  <span className="material-symbols-outlined text-base font-variation-fill">subject</span>
                  <span>{user?.department} {user?.batchYear ? `• Class of ${user.batchYear}` : ''}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-2xl text-center self-start sm:self-auto">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">Peer Trust Score</span>
            <div className="flex items-baseline justify-center gap-1 mt-0.5">
              <span className="font-mono text-3xl font-extrabold text-emerald-600">{user?.trustScore || 98}</span>
              <span className="text-xs text-emerald-700 font-bold">/100</span>
            </div>
          </div>
        </div>

        {/* Trust Badges Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
              <span className="material-symbols-outlined text-base font-variation-fill">verified_user</span>
              {user?.isVerified ? (<span>Verified Student</span>) : (<span>Identity Verified</span>)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Active campus email &amp; enrollment record matched.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
              <span className="material-symbols-outlined text-base font-variation-fill">handshake</span>
              <span>100% Handover Rate</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              All approved items transferred with PIN confirmation.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold">
              <span className="material-symbols-outlined text-base font-variation-fill">gavel</span>
              <span>Zero Retractions</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Fully compliant with campus fair-play auction guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Test Account Switching Panel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">supervised_user_circle</span>
            Hackathon Demo Account Switcher
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly switch perspectives between students and admin proctor to test full auction workflows:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {testAccounts.map((acc: User) => (
            <button
              key={acc.id}
              onClick={() => switchUser(acc.id)}
              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                acc.id === user?.id
                  ? 'bg-primary/5 border-primary ring-2 ring-primary/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div>
                <span className="font-bold text-xs text-slate-900 block">{acc.name}</span>
                <span className="text-[10px] text-slate-500 font-mono block">{acc.studentId} • {acc.hall}</span>
                <span className="text-[10px] font-bold text-emerald-700 capitalize">Role: {acc.role}</span>
              </div>
              {acc.id === user?.id && (
                <span className="material-symbols-outlined text-primary text-xl font-bold">check_circle</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
