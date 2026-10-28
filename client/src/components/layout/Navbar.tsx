import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, unreadCount, testAccounts, switchUser, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?q=${encodeURIComponent(search.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[68px] bg-white z-50 shadow-[0_1px_8px_rgba(0,0,0,0.04)] px-4 lg:px-6 flex items-center justify-between gap-4 border-b border-slate-200">
      {/* Brand / Logo */}
      <Link to="/" className="flex items-center gap-3 min-w-[240px]">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
          <span className="material-symbols-outlined text-2xl">gavel</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base text-slate-900 leading-tight">Campus Auction</span>
          <span className="text-[11px] font-bold text-primary tracking-wider uppercase">IIT / NIT Peer Hub</span>
        </div>
      </Link>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl hidden md:flex items-center">
        <div className="w-full flex items-center bg-surface-low rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-slate-200/60">
          <span className="material-symbols-outlined text-slate-400 text-xl mr-2">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search verified campus listings... (cycles, calculators, textbooks, hostel gear)"
            className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); navigate('/'); }}
              className="text-slate-400 hover:text-slate-600 text-xs px-1"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3 justify-end">
        {/* Campus Verified Badge */}
        <div className="hidden xl:flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full text-indigo-900 text-xs font-semibold">
          <span className="material-symbols-outlined text-primary text-base font-variation-fill">verified</span>
          <span>{user?.campus || 'Campus Hub'}</span>
        </div>

        {/* Notifications Icon with Badge */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white font-mono text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* List an Item Action Button */}
        <Link
          to="/create-listing"
          className="hidden sm:flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>List an Item</span>
        </Link>

        {/* User Identity / Profile or Guest Controls */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <img
                src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-300"
              />
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{user.studentId}</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Signed In As</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.hall} • Trust Score: <span className="font-bold text-emerald-600">{user.trustScore}/100</span></p>
                </div>

                <div className="py-1">
                  <Link
                    to="/my-listings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400">inventory_2</span>
                    <span>My Listings</span>
                  </Link>
                  <Link
                    to="/my-bids"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400">gavel</span>
                    <span>My Bids</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <span className="material-symbols-outlined text-base text-slate-400">account_circle</span>
                    <span>Profile &amp; Trust</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      setDropdownOpen(false);
                      await logout();
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium flex items-center justify-between"
                  >
                    <span>Sign Out</span>
                    <span className="material-symbols-outlined text-sm">logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-700 hover:text-primary px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login?tab=register"
              className="text-xs font-bold text-white bg-primary hover:bg-primary-hover px-3.5 py-2 rounded-lg shadow-sm transition-all"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
