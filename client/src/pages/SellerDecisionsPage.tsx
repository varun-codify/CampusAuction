import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

export const SellerDecisionsPage: React.FC = () => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const list = await api.getSellerDecisions();
      setDecisions(list);
    } catch (err) {
      console.error('Failed to load seller decisions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, []);

  const handleDecision = async (auctionId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      setProcessingId(auctionId);
      let reason: string | undefined;
      if (decision === 'REJECT') {
        const inputReason = prompt('Please enter a cancellation reason for the winning bidder:');
        if (inputReason === null) {
          setProcessingId(null);
          return;
        }
        reason = inputReason || 'Offer price below seller expectations.';
      }

      await api.submitSellerDecision(auctionId, decision, reason);

      if (decision === 'APPROVE') {
        confetti({ particleCount: 70, spread: 50 });
      }

      await fetchDecisions();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          Seller Decisions ({decisions.length})
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review concluded auctions, evaluate provisional winning prices, and formally approve items for campus handover.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 h-40 animate-pulse" />
          ))}
        </div>
      ) : decisions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">fact_check</span>
          <h3 className="text-base font-bold text-slate-800">No pending seller decisions</h3>
          <p className="text-xs text-slate-500 mt-1">
            When your active auctions conclude with bids, you can review and accept the winning sale price here.
          </p>
          <Link to="/my-listings" className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg">
            View My Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border-2 border-indigo-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <img
                  src={item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300'}
                  alt={item.title}
                  className="w-24 h-24 rounded-xl object-cover border border-slate-200"
                />

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                      Action Required
                    </span>
                    <span className="text-xs text-slate-400 font-mono">#{item.id.slice(-6).toUpperCase()}</span>
                  </div>

                  <h3 className="font-extrabold text-lg text-slate-900 line-clamp-1">{item.title}</h3>

                  {/* Pricing Comparison */}
                  <div className="flex items-center gap-4 mt-1 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Winning Bid</span>
                      <span className="font-mono text-xl font-extrabold text-primary">
                        ₹{item.currentPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Starting Price</span>
                      <span className="font-mono text-sm font-semibold text-slate-600">
                        ₹{item.startingPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="border-l border-slate-200 pl-4">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Bids</span>
                      <span className="font-mono text-sm font-semibold text-slate-600">{item.totalBids}</span>
                    </div>
                  </div>

                  {/* Winner Profile */}
                  <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-3">
                    <span className="font-bold text-slate-700">Provisional Winner:</span>
                    <span className="font-bold text-slate-900">{item.winner?.name || 'Verified Student'}</span>
                    <span className="text-slate-500">({item.winner?.hall || 'Campus Resident'})</span>
                    <span className="text-emerald-700 font-bold">Trust: {item.winner?.trustScore || 98}/100</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 self-end lg:self-center">
                <button
                  disabled={processingId === item.id}
                  onClick={() => handleDecision(item.id, 'REJECT')}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all disabled:opacity-50"
                >
                  Reject Price
                </button>

                <button
                  disabled={processingId === item.id}
                  onClick={() => handleDecision(item.id, 'APPROVE')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  <span>{processingId === item.id ? 'Approving...' : 'Approve & Reserve for Handover'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
