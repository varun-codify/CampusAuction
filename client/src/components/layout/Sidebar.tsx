import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { unreadCount } = useAuth();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
      isActive
        ? 'bg-primary text-white font-semibold shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="fixed left-0 top-[68px] bottom-0 w-[260px] bg-white z-40 flex flex-col py-4 border-r border-slate-200 overflow-y-auto">
      {/* Section 1: Main Navigation */}
      <div className="px-4 pb-2">
        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Main Navigation</span>
      </div>
      <nav className="px-2 flex flex-col gap-1">
        <NavLink to="/" end className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">explore</span>
            <span>Discover / Home</span>
          </div>
        </NavLink>

        <NavLink to="/auctions/auc-hero-sprint-26t" className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">gavel</span>
            <span>Browse Auctions</span>
          </div>
          <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full animate-pulse">Live</span>
        </NavLink>

        <NavLink to="/my-bids" className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">pan_tool_alt</span>
            <span>My Bids</span>
          </div>
        </NavLink>

        <NavLink to="/watchlist" className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">bookmark</span>
            <span>My Watchlist</span>
          </div>
        </NavLink>

        <NavLink to="/saved-searches" className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">saved_search</span>
            <span>Saved Searches</span>
          </div>
        </NavLink>

        <NavLink to="/ai-assistant" className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl text-amber-500">auto_awesome</span>
            <span>AI Assistant</span>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Smart</span>
        </NavLink>
      </nav>

      {/* Section 2: Seller Hub */}
      <div className="px-4 pt-6 pb-2">
        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Seller Hub</span>
      </div>
      <nav className="px-2 flex flex-col gap-1">
        <NavLink to="/my-listings" className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">inventory_2</span>
            <span>My Listings</span>
          </div>
        </NavLink>

        <NavLink to="/seller-decisions" className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">fact_check</span>
            <span>Seller Decisions</span>
          </div>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">Action</span>
        </NavLink>

        <NavLink to="/questions-and-answers" className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">chat</span>
            <span>Questions &amp; Answers</span>
          </div>
        </NavLink>
      </nav>

      {/* Section 3: Account & Admin */}
      <div className="px-4 pt-6 pb-2">
        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Account &amp; Admin</span>
      </div>
      <nav className="px-2 flex flex-col gap-1">
        <NavLink to="/notifications" className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">mail</span>
            <span>Notifications</span>
          </div>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/profile" className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">shield_person</span>
            <span>Profile &amp; Trust</span>
          </div>
        </NavLink>

        <NavLink to="/admin" className={navLinkClasses}>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">security</span>
            <span>Admin Moderation</span>
          </div>
        </NavLink>
      </nav>
    </aside>
  );
};
