import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export const HandoverPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getAuctionById(id);
      setAuction(data.auction);
      if (data.auction.status === 'COMPLETED') {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load handover details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleConfirmPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !pinInput.trim()) return;
    try {
      setSubmitting(true);
      setError(null);

      await api.confirmHandover(id, pinInput.trim());
      setSuccess(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      await fetchDetails();
    } catch (err: any) {
      setError(err.message || 'Invalid handover code.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading campus handover details...</div>;
  }

  if (!auction) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-md mx-auto my-12">
        <h2 className="text-lg font-bold text-slate-900">Handover Record Not Found</h2>
        <Link to="/" className="mt-4 inline-block px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg">
          Back to Home
        </Link>
      </div>
    );
  }

  const isSeller = user?.id === auction.sellerId;
  const isWinner = user?.id === auction.winnerId;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Verified Handover Zone
          </span>
          <span className="text-xs font-mono text-slate-400">#{auction.id.slice(-6).toUpperCase()}</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          Campus Exchange &amp; Handover
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete physical transfer on campus. Confirm verification code to finalize transaction.
        </p>
      </div>

      {/* Main Handover Dossier */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
        {/* Item Summary Bar */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <img
            src={auction.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200'}
            alt={auction.title}
            className="w-16 h-16 rounded-lg object-cover border border-slate-200"
          />
          <div className="flex flex-col">
            <span className="font-bold text-base text-slate-900 line-clamp-1">{auction.title}</span>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="text-slate-500">Agreed Price:</span>
              <span className="font-mono font-extrabold text-primary text-sm">
                ₹{auction.currentPrice.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Designated Location */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-2xl mt-0.5">location_on</span>
          <div>
            <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">Campus Exchange Point</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">{auction.handoverLocation}</span>
            <span className="text-xs text-slate-500 mt-0.5 block">
              Meet at this public campus landmark. Inspect the item in person before exchanging PIN.
            </span>
          </div>
        </div>

        {/* Handover Code Verification Logic */}
        {success || auction.status === 'COMPLETED' ? (
          <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-2xl font-bold">check</span>
            </div>
            <h3 className="font-extrabold text-lg text-emerald-950">Campus Handover Completed!</h3>
            <p className="text-xs text-emerald-800 max-w-sm">
              Both parties verified physical exchange. Trust scores have been incremented (+1) on student profiles.
            </p>
            <Link to="/" className="mt-3 px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm">
              Back to Marketplace
            </Link>
          </div>
        ) : isWinner ? (
          /* Buyer / Winner View: Reveals the 4-digit PIN to show the seller */
          <div className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-2xl text-center flex flex-col items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">Your Handover Verification PIN</span>
            <div className="font-mono text-5xl font-extrabold tracking-widest text-primary bg-white px-8 py-3 rounded-xl border border-indigo-200 shadow-inner">
              {auction.handoverCode || '4821'}
            </div>
            <p className="text-xs text-slate-600 max-w-sm">
              Show this 4-digit PIN to the seller <strong>only after you have inspected and received the item</strong> in person.
            </p>
          </div>
        ) : (
          /* Seller / General View: Enter the 4-digit PIN received from the buyer */
          <form onSubmit={handleConfirmPin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enter Buyer's 4-Digit Handover PIN:
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="4-digit PIN"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono text-2xl text-center font-extrabold tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-[11px] text-slate-400">
                Ask the buyer for their verification PIN upon handing over the physical item.
              </span>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || pinInput.length !== 4}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">verified</span>
              <span>{submitting ? 'Verifying PIN...' : 'Verify PIN & Complete Handover'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
