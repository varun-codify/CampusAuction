import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, unreadCount } = useAuth();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
      isActive
        ? 'bg-primary text-white font-semibold shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const isSeller = user?.role === 'seller';
  const isBuyer = user?.role === 'buyer';

  return (
    <aside className="fixed left-0 top-[68px] bottom-0 w-[260px] bg-white z-40 flex flex-col py-4 border-r border-slate-200 overflow-y-auto">
      {/* Role Indicator Pill */}
      {user && (
        <div className="px-4 pb-3">
          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
            isSeller ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-base ${isSeller ? 'text-amber-700' : 'text-indigo-700'}`}>
                {isSeller ? 'sell' : 'shopping_cart'}
              </span>
              <span className={`text-[11px] font-bold ${isSeller ? 'text-amber-900' : 'text-indigo-900'}`}>
                {isSeller ? 'Campus Seller Mode' : 'Campus Buyer Mode'}
              </span>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              isSeller ? 'bg-amber-200/80 text-amber-900' : 'bg-indigo-200/80 text-indigo-900'
            }`}>
              Active
            </span>
          </div>
        </div>
      )}

      {/* Section 1: Main Navigation */}
      <div className="px-4 pb-2">
        <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
          {isSeller ? 'Marketplace' : 'Buyer Hub'}
        </span>
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

        {!isSeller && (
          <>
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
          </>
        )}

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
        {isSeller ? (
          <>
            <NavLink to="/my-listings" className={navLinkClasses}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl">inventory_2</span>
                <span>My Listings</span>
              </div>
            </NavLink>

            <NavLink to="/create-listing" className={navLinkClasses}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-amber-600">add_circle</span>
                <span>List New Item</span>
              </div>
            </NavLink>

            <NavLink to="/seller-decisions" className={navLinkClasses}>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl">fact_check</span>
                <span>Seller Decisions</span>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">Action</span>
            </NavLink>
          </>
        ) : (
          <div className="px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-1.5 text-slate-500">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <span className="material-symbols-outlined text-sm text-amber-600">lock</span>
              <span>Seller Features</span>
            </div>
            <p className="text-[10px] leading-tight">
              Create listings, manage auctions &amp; approve outcomes.
            </p>
            <NavLink
              to="/login?role=seller"
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 mt-0.5"
            >
              <span>Sign in as Seller</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </NavLink>
          </div>
        )}

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
