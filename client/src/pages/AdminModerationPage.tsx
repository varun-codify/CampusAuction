import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Auction } from '../../../shared/types.js';

export const AdminModerationPage: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const list = await api.getAuctions();
        setAuctions(list);
      } catch (err) {
        console.error('Failed to load auctions for moderation:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary text-xl">security</span>
          <span className="text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full">
            Campus Proctor Desk
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          Admin Moderation &amp; Auditing
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Audit live student bidding transactions, enforce campus fair-play compliance, and inspect active listings.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            All Campus Listings ({auctions.length})
          </span>
          <span className="text-xs text-slate-400 font-mono">Authoritative SQL Audit Logs Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4">Current Price</th>
                <th className="py-3 px-4">Total Bids</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Closes At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading audit records...</td>
                </tr>
              ) : auctions.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{item.title}</td>
                  <td className="py-3 px-4">{item.category}</td>
                  <td className="py-3 px-4 font-medium">{item.seller?.name || item.sellerId}</td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">₹{item.currentPrice.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 font-mono">{item.totalBids}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'PENDING_SELLER_DECISION'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{new Date(item.closesAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
