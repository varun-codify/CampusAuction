import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Auction } from '../../../shared/types.js';
import { api } from '../services/api';

export const MyListingsPage: React.FC = () => {
  const [listings, setListings] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const data = await api.getMyListings();
        setListings(data);
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Listings ({listings.length})
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your active items, review incoming bids, and monitor physical campus handovers.
          </p>
        </div>

        <Link
          to="/create-listing"
          className="self-start sm:self-auto px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>List New Item</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 h-28 animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inventory_2</span>
          <h3 className="text-base font-bold text-slate-800">You have no listings yet</h3>
          <p className="text-xs text-slate-500 mt-1">Turn your unused campus gear into money by listing an auction.</p>
          <Link to="/create-listing" className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg">
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200'}
                  alt={item.title}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-100"
                />

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'PENDING_SELLER_DECISION'
                        ? 'bg-amber-100 text-amber-800'
                        : item.status === 'RESERVED'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">#{item.id.slice(-6).toUpperCase()}</span>
                  </div>

                  <Link to={`/auctions/${item.id}`} className="font-bold text-base text-slate-900 hover:text-primary transition-colors line-clamp-1 mt-1">
                    {item.title}
                  </Link>

                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Current Price:</span>
                      <span className="font-mono font-bold text-primary">₹{item.currentPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Bids:</span>
                      <span className="font-mono font-bold text-slate-700">{item.totalBids}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons based on status */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {item.status === 'PENDING_SELLER_DECISION' && (
                  <Link
                    to="/seller-decisions"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    Action Required
                  </Link>
                )}

                {item.status === 'RESERVED' && (
                  <Link
                    to={`/handover/${item.id}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    Confirm Handover
                  </Link>
                )}

                <Link
                  to={`/auctions/${item.id}`}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  View Listing
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
