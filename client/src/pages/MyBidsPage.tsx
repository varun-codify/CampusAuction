import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export const MyBidsPage: React.FC = () => {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'leading' | 'outbid' | 'won'>('all');

  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        const data = await api.getMyBids();
        setBids(data);
      } catch (err) {
        console.error('Failed to load my bids:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, []);

  const filteredBids = bids.filter((b) => {
    if (activeTab === 'leading') return b.isLeading && b.auctionStatus === 'ACTIVE';
    if (activeTab === 'outbid') return !b.isLeading && b.auctionStatus === 'ACTIVE';
    if (activeTab === 'won') return b.isWon || b.isProvisional;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Bids ({bids.length})
        </h1>
        <p className="text-sm text-slate-500">
          Track active bids, leading items, outbid alerts, and provisional winning outcomes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: `All Bids (${bids.length})` },
          { id: 'leading', label: `Leading (${bids.filter((b) => b.isLeading && b.auctionStatus === 'ACTIVE').length})` },
          { id: 'outbid', label: `Outbid (${bids.filter((b) => !b.isLeading && b.auctionStatus === 'ACTIVE').length})` },
          { id: 'won', label: `Won / Provisional (${bids.filter((b) => b.isWon || b.isProvisional).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bids List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 h-28 animate-pulse" />
          ))}
        </div>
      ) : filteredBids.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">pan_tool</span>
          <h3 className="text-base font-bold text-slate-800">No bids found in this category</h3>
          <p className="text-xs text-slate-500 mt-1">Browse the marketplace and place your bid to compete.</p>
          <Link to="/" className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg">
            Discover Auctions
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBids.map((item) => (
            <div
              key={item.auctionId}
              className="bg-white rounded-2xl p-4 lg:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.auctionImages?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=300'}
                  alt={item.auctionTitle}
                  className="w-20 h-20 rounded-xl object-cover border border-slate-100"
                />

                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                    <span>{item.auctionCategory}</span>
                    <span>•</span>
                    <span className="text-emerald-700">{item.auctionCondition}</span>
                  </div>

                  <Link
                    to={`/auctions/${item.auctionId}`}
                    className="font-bold text-base text-slate-900 hover:text-primary transition-colors line-clamp-1"
                  >
                    {item.auctionTitle}
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Your High Bid:</span>
                      <span className="font-mono font-bold text-slate-900">₹{Number(item.myHighBid).toLocaleString('en-IN')}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Leading Price:</span>
                      <span className="font-mono font-bold text-primary">₹{Number(item.auctionCurrentPrice).toLocaleString('en-IN')}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Status:</span>
                      {item.isLeading && item.auctionStatus === 'ACTIVE' ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          You Lead
                        </span>
                      ) : !item.isLeading && item.auctionStatus === 'ACTIVE' ? (
                        <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          Outbid
                        </span>
                      ) : item.isProvisional ? (
                        <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          Provisional Winner
                        </span>
                      ) : item.isWon ? (
                        <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          Won &amp; Completed
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          {item.auctionStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {item.auctionStatus === 'RESERVED' && item.winnerId === item.myHighBid && (
                  <Link
                    to={`/handover/${item.auctionId}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                  >
                    Handover PIN
                  </Link>
                )}

                <Link
                  to={`/auctions/${item.auctionId}`}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                    !item.isLeading && item.auctionStatus === 'ACTIVE'
                      ? 'bg-primary hover:bg-primary-hover text-white animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {!item.isLeading && item.auctionStatus === 'ACTIVE' ? 'Re-Bid Now' : 'View Auction'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
