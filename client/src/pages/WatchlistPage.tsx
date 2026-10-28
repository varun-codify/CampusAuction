import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const list = await api.getMyWatchlist();
      setWatchlist(list);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleRemove = async (auctionId: string) => {
    try {
      await api.toggleWatchlist(auctionId);
      await fetchWatchlist();
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Watchlist ({watchlist.length})
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Items bookmarked for real-time tracking, price updates, and ending notifications.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 h-64 animate-pulse" />
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">bookmark_border</span>
          <h3 className="text-base font-bold text-slate-800">Your watchlist is currently empty</h3>
          <p className="text-xs text-slate-500 mt-1">Click the bookmark icon on any marketplace item to monitor it here.</p>
          <Link to="/" className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg">
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  <img
                    src={item.auction?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400'}
                    alt={item.auction?.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button
                    onClick={() => handleRemove(item.auction?.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-red-500 hover:bg-white flex items-center justify-center shadow-sm"
                    title="Remove from Watchlist"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                  <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
                    {item.auction?.category}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-base text-slate-900 line-clamp-1">{item.auction?.title}</h3>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Price</span>
                      <span className="font-mono text-lg font-bold text-primary">
                        ₹{item.auction?.currentPrice?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Bids</span>
                      <span className="font-mono font-bold text-slate-700">{item.auction?.totalBids || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0">
                <Link
                  to={`/auctions/${item.auction?.id}`}
                  className="w-full py-2 bg-slate-100 hover:bg-primary hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <span>View &amp; Place Bid</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
