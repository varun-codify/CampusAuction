import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Auction } from '../../../shared/types.js';
import { api, socket } from '../services/api';

const CATEGORIES = [
  'All',
  'Cycles & Commute',
  'Electronics & Calculators',
  'Books & Academics',
  'Hostel & Room',
  'Lab & Instruments',
];

interface LiveAlert {
  id: string;
  title: string;
  price: number;
  seller: string;
  hall: string;
  category: string;
}

export const MarketplacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const searchParamQuery = searchParams.get('q') || '';

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('closing_soon');
  const [searchQuery, setSearchQuery] = useState(searchParamQuery);
  const [liveAlert, setLiveAlert] = useState<LiveAlert | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const list = await api.getAuctions({
        q: searchQuery || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        sort: selectedSort,
      });
      setAuctions(list);
    } catch (err) {
      console.error('Failed to load marketplace auctions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchQuery(searchParamQuery);
  }, [searchParamQuery]);

  useEffect(() => {
    fetchAuctions();
  }, [selectedCategory, selectedSort, searchQuery]);

  // Real-Time Socket.IO Subscriptions: Reflect newly listed items and live bids instantly!
  useEffect(() => {
    const handleAuctionCreated = (newAuction: Auction) => {
      console.log('⚡ [Marketplace] New auction received in real time:', newAuction.title);

      // Prepend to auctions state immediately so buyers see it without refreshing
      setAuctions((prev) => {
        if (prev.some((a) => a.id === newAuction.id)) return prev;
        return [newAuction, ...prev];
      });

      setNewlyAddedId(newAuction.id);

      // Display floating real-time announcement toast
      setLiveAlert({
        id: newAuction.id,
        title: newAuction.title,
        price: newAuction.startingPrice,
        seller: newAuction.seller?.name || 'A Campus Seller',
        hall: newAuction.seller?.hall || 'Campus',
        category: newAuction.category,
      });

      // Clear alert after 9 seconds
      setTimeout(() => {
        setLiveAlert((curr) => (curr?.id === newAuction.id ? null : curr));
      }, 9000);
    };

    const handleAuctionBid = (data: { auctionId: string; newPrice: number; totalBids: number }) => {
      setAuctions((prev) =>
        prev.map((a) =>
          a.id === data.auctionId
            ? { ...a, currentPrice: data.newPrice, totalBids: data.totalBids }
            : a
        )
      );
    };

    const handleAuctionClosed = (data: { auctionId: string; status: string }) => {
      setAuctions((prev) =>
        prev.map((a) => (a.id === data.auctionId ? { ...a, status: data.status as any } : a))
      );
    };

    socket.on('auction:created', handleAuctionCreated);
    socket.on('auction:bid', handleAuctionBid);
    socket.on('auction:closed', handleAuctionClosed);

    return () => {
      socket.off('auction:created', handleAuctionCreated);
      socket.off('auction:bid', handleAuctionBid);
      socket.off('auction:closed', handleAuctionClosed);
    };
  }, []);

  const handleToggleWatchlist = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.toggleWatchlist(id);
      fetchAuctions();
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
    }
  };

  const formatRemainingTime = (closesAtStr: string) => {
    const diff = new Date(closesAtStr).getTime() - Date.now();
    if (diff <= 0) return 'Closed';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    return `${mins}m ${Math.floor((diff % 60000) / 1000)}s remaining`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Real-time Listing Notification Toast / Banner */}
      {liveAlert && (
        <div className="fixed top-20 right-6 z-50 max-w-md w-full bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/40 backdrop-blur-lg flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-xl">bolt</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Just Listed by {liveAlert.seller} ({liveAlert.hall})</span>
              </div>
              <h4 className="font-bold text-sm text-white line-clamp-1">{liveAlert.title}</h4>
              <p className="text-xs text-slate-300">
                Starting at <span className="font-mono font-bold text-emerald-400">₹{liveAlert.price}</span> • {liveAlert.category}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/auctions/${liveAlert.id}`}
              className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-all whitespace-nowrap shadow-sm"
              onClick={() => setLiveAlert(null)}
            >
              Bid Now
            </Link>
            <button
              onClick={() => setLiveAlert(null)}
              className="text-slate-400 hover:text-white p-1 rounded-md"
              title="Dismiss"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Section matching Stitch Screen 2 */}
      <section className="relative w-full rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-indigo-100/50 p-6 lg:p-10 overflow-hidden border border-indigo-100 shadow-sm">
        <div className="relative z-10 max-w-3xl flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200/80 self-start">
            <span className="material-symbols-outlined text-emerald-600 text-base font-variation-fill">verified_user</span>
            <span className="text-xs font-bold text-slate-800 tracking-wider uppercase">IIT / NIT Peer-to-Peer Verified Registry</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-emerald-700 font-semibold">Live Real-Time Sync Active</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Find your next campus essential.
          </h1>
          <p className="text-slate-600 text-base max-w-2xl">
            Great finds. Transparent bidding. A second life for verified student cycles, engineering calculators, textbooks, and hostel fixtures.
          </p>

          {/* Quick Search inside Hero */}
          <div className="w-full max-w-xl flex items-center bg-white rounded-xl shadow-sm border border-slate-200 px-3 py-2 mt-2">
            <span className="material-symbols-outlined text-slate-400 text-xl mr-2">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cycles, calculators, study chairs, books..."
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600 px-1">
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end md:self-auto text-xs text-slate-500 font-medium">
          <span>Sort By:</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs font-semibold focus:outline-none"
          >
            <option value="closing_soon">Closing Soon</option>
            <option value="bids_desc">Most Bids</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Live Auction Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 h-80 animate-pulse" />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-2">search_off</span>
          <h3 className="text-lg font-bold text-slate-800">No active listings found</h3>
          <p className="text-sm text-slate-500 mt-1">Try clearing your search query or selecting a different category.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((item) => {
            const isJustAdded = item.id === newlyAddedId;

            return (
              <Link
                key={item.id}
                to={`/auctions/${item.id}`}
                className={`group bg-white rounded-xl border overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col relative ${
                  isJustAdded ? 'border-primary ring-2 ring-primary/30' : 'border-slate-200'
                }`}
              >
                {/* Image Preview Container */}
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  <img
                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Category Pill */}
                  <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
                    {item.category}
                  </span>

                  {/* Just Added Live Tag */}
                  {isJustAdded && (
                    <span className="absolute top-2.5 left-20 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      NEW
                    </span>
                  )}

                  {/* Bookmark Toggle */}
                  <button
                    onClick={(e) => handleToggleWatchlist(e, item.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-slate-700 hover:text-primary flex items-center justify-center shadow-sm"
                    title="Watchlist"
                  >
                    <span className="material-symbols-outlined text-lg">bookmark</span>
                  </button>

                  {/* Time Remaining Pill */}
                  <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md text-slate-800 text-xs font-mono font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{formatRemainingTime(item.closesAt)}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1">
                      <span className="material-symbols-outlined text-sm text-primary font-variation-fill">verified</span>
                      <span>{item.seller?.hall || 'Campus Resident'}</span>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">{item.condition}</span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Card Footer Price & Bids */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Bid</span>
                      <span className="font-mono text-xl font-bold text-primary">
                        ₹{item.currentPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                      <span className="material-symbols-outlined text-sm">gavel</span>
                      <span>{item.totalBids} {item.totalBids === 1 ? 'bid' : 'bids'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
