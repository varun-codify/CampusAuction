import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PRESET_IMAGES = [
  { label: 'Hero Sprint Cycle', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Casio Scientific Calculator', url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Hardcover Engineering Textbook', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Hostel Study Chair', url: 'https://images.unsplash.com/photo-1580481077195-731da03fed74?auto=format&fit=crop&q=80&w=1200' },
  { label: 'Induction Cooktop', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200' },
];

export const CreateAuctionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cycles & Commute');
  const [condition, setCondition] = useState('Good');
  const [startingPrice, setStartingPrice] = useState(1000);
  const [minIncrement, setMinIncrement] = useState(50);
  const [reservePrice, setReservePrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(1440); // 24h
  const [handoverLocation, setHandoverLocation] = useState('Main Campus Library Steps');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be signed in with a verified campus ID to list an item.');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        title,
        description,
        category,
        condition,
        startingPrice: Number(startingPrice),
        minIncrement: Number(minIncrement),
        reservePrice: reservePrice ? Number(reservePrice) : undefined,
        durationMinutes: Number(durationMinutes),
        handoverLocation,
        images: [imageUrl],
      };

      const res = await api.createAuction(payload);
      navigate(`/auctions/${res.auction.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Auction Listing
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          List your item for transparent peer-to-peer campus bidding with guaranteed local physical handover.
        </p>
      </div>

      {user?.role === 'buyer' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-950 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">sell</span>
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900">Campus Seller Account Required</p>
              <p className="text-xs text-slate-600 mt-0.5">
                You are currently signed in as a <span className="font-bold text-indigo-700">Campus Buyer</span>. To maintain marketplace integrity, auction listings can only be published by registered Seller accounts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/login?role=seller"
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Sign In as Seller
            </Link>
            <Link
              to="/"
              className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all"
            >
              Marketplace
            </Link>
          </div>
        </div>
      )}

      {!user && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-600 text-2xl">lock</span>
            <div>
              <p className="font-bold text-xs">Campus Seller Authentication Required</p>
              <p className="text-xs text-amber-700">Please sign in with a verified Seller account to list items.</p>
            </div>
          </div>
          <Link
            to="/login?role=seller"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
          >
            Seller Sign In
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-200 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Item Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Listing Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hero Sprint 26T Mountain Bicycle with Disc Brakes"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none"
            >
              <option value="Cycles & Commute">Cycles &amp; Commute</option>
              <option value="Electronics & Calculators">Electronics &amp; Calculators</option>
              <option value="Books & Academics">Books &amp; Academics</option>
              <option value="Hostel & Room">Hostel &amp; Room</option>
              <option value="Lab & Instruments">Lab &amp; Instruments</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Condition *
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none"
            >
              <option value="Like New">Like New (Mint / rarely used)</option>
              <option value="Good">Good (Working with minor cosmetic wear)</option>
              <option value="Fair">Fair (Fully functional, visible age)</option>
              <option value="Needs Repair">Needs Repair (Sold for parts / fixer)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Item Description &amp; Provenance *
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe accessories included, date of purchase, semester usage, and any maintenance history..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Pricing & Increments */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Starting Bid (₹) *
            </label>
            <input
              type="number"
              required
              min={50}
              step={50}
              value={startingPrice}
              onChange={(e) => setStartingPrice(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-base font-bold text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Min Increment (₹)
            </label>
            <input
              type="number"
              required
              min={10}
              step={10}
              value={minIncrement}
              onChange={(e) => setMinIncrement(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-base font-bold text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Reserve Price (₹, Opt)
            </label>
            <input
              type="number"
              value={reservePrice}
              onChange={(e) => setReservePrice(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-base font-bold text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Auction Duration & Campus Handover Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Auction Duration *
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:outline-none"
            >
              <option value={10}>10 Minutes (Live Hackathon Demo)</option>
              <option value={60}>1 Hour</option>
              <option value={240}>4 Hours</option>
              <option value={720}>12 Hours</option>
              <option value={1440}>24 Hours (Standard)</option>
              <option value={2880}>48 Hours</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Campus Handover Location *
            </label>
            <input
              type="text"
              required
              value={handoverLocation}
              onChange={(e) => setHandoverLocation(e.target.value)}
              placeholder="e.g. Central Library Steps, Hall Gate"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Photo URL / Quick Presets */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Item Photo URL
          </label>
          <input
            type="url"
            required
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono focus:bg-white focus:outline-none"
          />

          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[11px] text-slate-400 font-bold uppercase mr-1">Sample Photos:</span>
            {PRESET_IMAGES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setImageUrl(p.url)}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {imageUrl && (
            <div className="mt-2 w-32 h-20 rounded-xl overflow-hidden border border-slate-200">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">publish</span>
            <span>{loading ? 'Publishing...' : 'Publish Campus Auction'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
