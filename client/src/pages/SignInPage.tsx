import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'signin';
  const roleParam = searchParams.get('role');
  const initialPortalRole = roleParam === 'seller' ? 'seller' : 'buyer';

  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(initialTab);
  const [portalRole, setPortalRole] = useState<'buyer' | 'seller'>(initialPortalRole);

  // Sign In state
  const [signInCredential, setSignInCredential] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Register state
  const [regRole, setRegRole] = useState<'buyer' | 'seller'>(initialPortalRole);
  const [regName, setRegName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCampus, setRegCampus] = useState('IIT Kharagpur');
  const [regHall, setRegHall] = useState('Radhakrishnan Hall');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mismatchedRole, setMismatchedRole] = useState<'buyer' | 'seller' | null>(null);

  useEffect(() => {
    if (searchParams.get('tab') === 'register') {
      setActiveTab('register');
    }
    if (searchParams.get('role') === 'seller') {
      setPortalRole('seller');
      setRegRole('seller');
    } else if (searchParams.get('role') === 'buyer') {
      setPortalRole('buyer');
      setRegRole('buyer');
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInCredential.trim()) {
      setError('Please enter your Student ID or Campus Email.');
      return;
    }
    if (!signInPassword.trim()) {
      setError('Please enter your password or campus PIN.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setMismatchedRole(null);
      const user = await login(signInCredential.trim(), signInPassword.trim(), portalRole);
      setSuccessMsg(`Welcome back, ${user.name}! Redirecting to ${portalRole === 'seller' ? 'Seller Hub' : 'Marketplace'}...`);
      setTimeout(() => {
        if (user.role === 'seller') {
          navigate('/my-listings');
        } else {
          navigate('/');
        }
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      if (err.message && err.message.includes('Campus Seller')) {
        setMismatchedRole('seller');
      } else if (err.message && err.message.includes('Campus Buyer')) {
        setMismatchedRole('buyer');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regStudentId.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const user = await register({
        name: regName.trim(),
        studentId: regStudentId.trim().toUpperCase(),
        email: regEmail.trim().toLowerCase(),
        campus: regCampus.trim(),
        hall: regHall.trim(),
        phone: regPhone.trim() || undefined,
        password: regPassword.trim(),
        role: regRole,
      });
      setSuccessMsg(`Account registered as Campus ${regRole === 'seller' ? 'Seller' : 'Buyer'}! Redirecting...`);
      setTimeout(() => {
        if (user.role === 'seller') {
          navigate('/my-listings');
        } else {
          navigate('/');
        }
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (cred: string, pass: string, role: 'buyer' | 'seller') => {
    setPortalRole(role);
    setSignInCredential(cred);
    setSignInPassword(pass);
    setError(null);
    setMismatchedRole(null);
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-xl flex flex-col gap-6">
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
            <span className="material-symbols-outlined text-3xl font-variation-fill">verified_user</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Campus Authentication
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            IIT / NIT Verified Student Marketplace with dedicated Buyer &amp; Seller account controls.
          </p>
        </div>

        {/* Primary Tab Switcher: Sign In vs Register */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setError(null); setMismatchedRole(null); }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'signin'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); setMismatchedRole(null); }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register Student Account
          </button>
        </div>

        {/* SIGN IN VIEW */}
        {activeTab === 'signin' && (
          <div className="flex flex-col gap-5">
            {/* Separate Role Portal Selector for Sign In */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Select Login Portal:
                </span>
                <span className="text-[11px] font-mono font-bold text-primary">
                  {portalRole === 'buyer' ? '🛒 Buyer Mode' : '🏷️ Seller Mode'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setPortalRole('buyer'); setError(null); setMismatchedRole(null); }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    portalRole === 'buyer'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-700 text-lg">shopping_cart</span>
                    <span className="font-bold text-xs text-slate-900">Campus Buyer</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    Bid on tech, cycles &amp; gear. Track bids &amp; collect items.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => { setPortalRole('seller'); setError(null); setMismatchedRole(null); }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    portalRole === 'seller'
                      ? 'border-amber-600 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-700 text-lg">sell</span>
                    <span className="font-bold text-xs text-slate-900">Campus Seller</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    List items, approve winning bids &amp; verify handover PINs.
                  </span>
                </button>
              </div>
            </div>

            {/* Error / Feedback / Mismatch Guide */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{error}</span>
                </div>
                {mismatchedRole && (
                  <button
                    type="button"
                    onClick={() => {
                      setPortalRole(mismatchedRole);
                      setError(null);
                      setMismatchedRole(null);
                    }}
                    className="self-start text-[11px] font-bold bg-white text-red-700 border border-red-300 px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Switch to {mismatchedRole === 'seller' ? 'Campus Seller' : 'Campus Buyer'} Portal →
                  </button>
                )}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base font-variation-fill">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Student ID or Campus Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-lg">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={signInCredential}
                    onChange={(e) => setSignInCredential(e.target.value)}
                    placeholder={portalRole === 'buyer' ? 'e.g. 2021ME10482 or rohan.mech@campus.edu' : 'e.g. 2020EE10931 or vikram.ee@campus.edu'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password or Campus PIN
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-lg">
                    lock
                  </span>
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter your secure password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 mt-1 flex items-center justify-center gap-2 ${
                  portalRole === 'seller' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary hover:bg-primary-hover'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {portalRole === 'seller' ? 'sell' : 'shopping_cart'}
                </span>
                <span>
                  {loading
                    ? 'Authenticating...'
                    : `Sign In as Campus ${portalRole === 'seller' ? 'Seller' : 'Buyer'}`}
                </span>
              </button>
            </form>

            {/* Quick Demo Pre-fill for Testing */}
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                Instant Verification Test Accounts:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('2021ME10482', 'campus123', 'buyer')}
                  className="p-2 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/60 text-left transition-colors flex flex-col"
                >
                  <span className="font-bold text-indigo-900">Rohan Sharma</span>
                  <span className="text-slate-500 text-[10px]">Buyer • 2021ME10482</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickDemo('2020EE10931', 'campus123', 'seller')}
                  className="p-2 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 text-left transition-colors flex flex-col"
                >
                  <span className="font-bold text-amber-900">Vikram Das</span>
                  <span className="text-slate-500 text-[10px]">Seller • 2020EE10931</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REGISTER VIEW */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Account Role Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Select Your Campus Role: *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegRole('buyer')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    regRole === 'buyer'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-700 text-lg">shopping_cart</span>
                    <span className="font-bold text-xs text-slate-900">Campus Buyer</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Browse, live bid, auto proxy-bid &amp; receive items.
                  </span>
                  <span className="text-[9px] font-bold text-indigo-700 mt-1 uppercase tracking-wider">
                    Restriction: Cannot list auctions
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('seller')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    regRole === 'seller'
                      ? 'border-amber-600 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/20'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-700 text-lg">sell</span>
                    <span className="font-bold text-xs text-slate-900">Campus Seller</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Create auction listings, approve bids &amp; verify PINs.
                  </span>
                  <span className="text-[9px] font-bold text-amber-700 mt-1 uppercase tracking-wider">
                    Restriction: Cannot bid on items
                  </span>
                </button>
              </div>
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base font-variation-fill">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Registration Inputs */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Priya Kumari"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Roll No / Student ID *
                </label>
                <input
                  type="text"
                  required
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value)}
                  placeholder="e.g. 2023AE10018"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Campus Email *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="student@campus.edu"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Campus / University
                </label>
                <select
                  value={regCampus}
                  onChange={(e) => setRegCampus(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="IIT Kharagpur">IIT Kharagpur</option>
                  <option value="IIT Bombay">IIT Bombay</option>
                  <option value="IIT Delhi">IIT Delhi</option>
                  <option value="NIT Trichy">NIT Trichy</option>
                  <option value="BITS Pilani">BITS Pilani</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Hostel / Hall Residence
                </label>
                <input
                  type="text"
                  value={regHall}
                  onChange={(e) => setRegHall(e.target.value)}
                  placeholder="e.g. Mother Teresa Hall"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Phone (for Handover)
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 ${
                regRole === 'seller' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary hover:bg-primary-hover'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {regRole === 'seller' ? 'verified' : 'how_to_reg'}
              </span>
              <span>
                {loading
                  ? 'Creating Campus Account...'
                  : `Register as Campus ${regRole === 'seller' ? 'Seller' : 'Buyer'}`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
