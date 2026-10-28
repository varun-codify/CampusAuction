import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Auction, Bid } from '../../../shared/types.js';
import { api, socket } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export const AuctionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [qa, setQa] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Bidding inputs & modal
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  // Q&A input
  const [newQuestion, setNewQuestion] = useState('');
  const [answeringQaId, setAnsweringQaId] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState('');

  // Anti-snipe and countdown timer state
  const [antiSnipeBannerVisible, setAntiSnipeBannerVisible] = useState(false);
  const [antiSnipeBannerText, setAntiSnipeBannerText] = useState('Fair-Play Anti-Snipe Triggered: A bid was placed in the final 30 seconds. Clock extended by exactly +60 seconds for verified contenders.');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const fetchAuction = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getAuctionById(id);
      const auctionData = data.auction as any;
      setAuction(auctionData);
      setBids(auctionData.bids || []);
      setQa(auctionData.qa || []);

      const nextMin = Number(data.auction.totalBids) === 0
        ? Number(data.auction.startingPrice)
        : Number(data.auction.currentPrice) + Number(data.auction.minIncrement || 50);
      setBidAmount(nextMin);

      if (data.auction.antiSnipeTriggered) {
        setAntiSnipeBannerVisible(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load auction.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuction();

    if (id) {
      socket.emit('join:auction', id);

      socket.on('auction:bid', (event) => {
        setAuction((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            currentPrice: event.newPrice,
            totalBids: event.totalBids,
            antiSnipeTriggered: event.antiSnipeTriggered,
            closesAt: event.closesAt,
          };
        });

        // Add to bids list
        setBids((prev) => [event.bid, ...prev]);

        // Next minimum bid suggestion
        setBidAmount(event.newPrice + 50);

        if (event.extended) {
          setAntiSnipeBannerVisible(true);
        }
      });

      socket.on('auction:extended', (event) => {
        setAntiSnipeBannerVisible(true);
        setAntiSnipeBannerText(event.reason || 'Clock extended +60 seconds!');
        setAuction((prev: any) => prev ? { ...prev, closesAt: event.newClosesAt, extensionsCount: event.extensionsCount, antiSnipeTriggered: true } : prev);
      });

      socket.on('auction:closed', (event) => {
        setAuction((prev: any) => prev ? { ...prev, status: event.status } : prev);
      });
    }

    return () => {
      if (id) {
        socket.emit('leave:auction', id);
        socket.off('auction:bid');
        socket.off('auction:extended');
        socket.off('auction:closed');
      }
    };
  }, [id]);

  // Real-time Countdown Timer effect
  useEffect(() => {
    if (!auction?.closesAt) return;

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(auction.closesAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction?.closesAt]);

  const handlePlaceBid = async () => {
    if (!id) return;
    try {
      setSubmittingBid(true);
      setBidError(null);

      const parsedMax = maxBudget.trim() ? Number(maxBudget) : undefined;
      const res = await api.placeBid(id, bidAmount, parsedMax);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setConfirmModalOpen(false);
      setMaxBudget('');

      if (res.extended) {
        setAntiSnipeBannerVisible(true);
      }
    } catch (err: any) {
      setBidError(err.message || 'Failed to place bid.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newQuestion.trim()) return;
    try {
      const res = await api.askQuestion(id, newQuestion);
      setQa((prev) => [res.qa, ...prev]);
      setNewQuestion('');
    } catch (err: any) {
      alert(err.message || 'Failed to ask question');
    }
  };

  const handleAnswerQuestion = async (qaId: string) => {
    if (!id || !newAnswer.trim()) return;
    try {
      const res = await api.answerQuestion(id, qaId, newAnswer);
      setQa((prev) => prev.map((q) => (q.id === qaId ? { ...q, answer: res.qa.answer, answeredAt: res.qa.answeredAt } : q)));
      setAnsweringQaId(null);
      setNewAnswer('');
    } catch (err: any) {
      alert(err.message || 'Failed to post answer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading live campus auction...</p>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-md mx-auto my-12">
        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
        <h2 className="text-lg font-bold text-slate-900">Auction Listing Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">{error || 'This listing does not exist.'}</p>
        <Link to="/" className="inline-block mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isSeller = user?.id === auction.sellerId;
  const isClosed = auction.status !== 'ACTIVE' || secondsRemaining <= 0;
  const isLeading = bids.length > 0 && bids[0].bidderId === user?.id;

  const minRequiredBid = Number(auction.totalBids) === 0
    ? Number(auction.startingPrice)
    : Number(auction.currentPrice) + Number(auction.minIncrement || 50);

  const images = auction.images && auction.images.length > 0
    ? auction.images
    : ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=1200'];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Fairness Banner matching Stitch Screen 1 */}
      <div className="w-full bg-indigo-50/80 border border-indigo-100 px-4 py-3 rounded-xl flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl font-variation-fill">gavel</span>
          <p className="text-xs lg:text-sm text-indigo-950">
            <span className="font-bold text-primary">Campus Fair-Play Guarantee:</span> Every valid bid is recorded on the public campus audit ledger. Clock extends automatically if bids are placed in the final 30 seconds.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider whitespace-nowrap">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Real-Time Sync Active</span>
        </div>
      </div>

      {/* 2. Dynamic Anti-Sniping Alert Banner matching Stitch Screen 1 */}
      {antiSnipeBannerVisible && (
        <div className="w-full bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-md transition-all flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-emerald-200">update</span>
            <div>
              <span className="font-bold text-sm block sm:inline mr-2">Fair-Play Anti-Snipe Triggered:</span>
              <span className="text-xs text-emerald-100">{antiSnipeBannerText}</span>
            </div>
          </div>
          <button onClick={() => setAntiSnipeBannerVisible(false)} className="text-emerald-200 hover:text-white">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Breadcrumbs & Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-primary flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-base">home</span> Home
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span>{auction.category}</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="font-bold text-slate-800 line-clamp-1">{auction.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
            ITEM #{auction.id.slice(-8).toUpperCase()}
          </span>
          <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs font-variation-fill">verified</span>
            {auction.seller?.hall || 'Campus Resident'}
          </span>
        </div>
      </div>

      {/* Main 12-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Gallery, Details, Condition Dossier (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Header & Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                {auction.category}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="material-symbols-outlined text-xs font-variation-fill">check_circle</span>
                Condition: {auction.condition}
              </span>
              {auction.extensionsCount > 0 && (
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                  +{auction.extensionsCount} Anti-Snipe Extension{auction.extensionsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {auction.title}
            </h1>
            <p className="text-sm text-slate-600 mt-1">{auction.description}</p>
          </div>

          {/* Photo Gallery Showcase matching Stitch Screen 1 */}
          <div className="flex flex-col gap-3">
            <div className="relative w-full aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-200 group">
              <img
                src={images[activePhotoIndex]}
                alt={auction.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md text-slate-900 text-xs font-bold shadow-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-primary">center_focus_strong</span>
                <span>{images.length} Verified Photos</span>
              </div>
              <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-mono px-2 py-0.5 rounded shadow-sm">
                Original Campus Inspection Photo
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 transition-all p-0.5 ${
                      activePhotoIndex === idx ? 'border-primary ring-2 ring-primary/30' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Campus Inspection Audit Bento matching Stitch Screen 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl font-variation-fill">fact_check</span>
                <h3 className="font-bold text-base text-slate-900">Campus Inspection Audit</h3>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Verified Item
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Seller Identity</span>
                <span className="font-bold text-slate-800 mt-1">{auction.seller?.name || 'Verified Student'}</span>
                <span className="text-slate-500 text-[11px]">{auction.seller?.hall} • Score: {auction.seller?.trustScore}/100</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Handover Zone</span>
                <span className="font-bold text-slate-800 mt-1 line-clamp-1">{auction.handoverLocation}</span>
                <span className="text-emerald-700 text-[11px] font-semibold">PIN Verified Transfer</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Starting Valuation</span>
                <span className="font-mono font-bold text-slate-800 mt-1">₹{auction.startingPrice.toLocaleString('en-IN')}</span>
                <span className="text-slate-500 text-[11px]">Min Inc: +₹{auction.minIncrement || 50}</span>
              </div>
            </div>
          </div>

          {/* Q&A Section matching Stitch Screen 10 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">chat</span>
                <h3 className="font-bold text-base text-slate-900">Questions &amp; Answers ({qa.length})</h3>
              </div>
            </div>

            {/* Ask Question Form */}
            <form onSubmit={handleAskQuestion} className="flex gap-2">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Ask seller about condition, bill, or pickup..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={!newQuestion.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Ask
              </button>
            </form>

            {/* Q&A List */}
            <div className="space-y-3 mt-2">
              {qa.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No questions asked yet. Be the first to ask the seller!</p>
              ) : (
                qa.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold text-slate-800">Q: {item.question}</span>
                      <span className="text-[10px]">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>

                    {item.answer ? (
                      <div className="bg-emerald-50 text-emerald-950 p-2.5 rounded-lg border border-emerald-100 mt-1">
                        <span className="font-bold text-emerald-800 block text-[11px]">Seller Answer:</span>
                        <p className="mt-0.5">{item.answer}</p>
                      </div>
                    ) : isSeller ? (
                      answeringQaId === item.id ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={newAnswer}
                            onChange={(e) => setNewAnswer(e.target.value)}
                            placeholder="Type your official answer..."
                            className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                          />
                          <button
                            onClick={() => handleAnswerQuestion(item.id)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            Reply
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAnsweringQaId(item.id)}
                          className="text-primary text-xs font-bold hover:underline self-start mt-1"
                        >
                          + Answer this question
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Awaiting seller response...</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Countdown, Bidding Control, Ledger (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-[84px]">
          {/* Live Action Bento Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col gap-5">
            {/* Countdown Display */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              secondsRemaining <= 30 && secondsRemaining > 0
                ? 'bg-red-50 border-red-200 animate-pulse text-red-900'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Time Remaining</span>
                <span className="font-mono text-2xl font-extrabold mt-0.5">
                  {secondsRemaining <= 0
                    ? 'AUCTION CLOSED'
                    : `${Math.floor(secondsRemaining / 3600)}h ${Math.floor((secondsRemaining % 3600) / 60)}m ${secondsRemaining % 60}s`}
                </span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  auction.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {auction.status}
                </span>
                {secondsRemaining <= 30 && secondsRemaining > 0 && (
                  <span className="text-[10px] font-bold text-red-600 mt-1">Anti-Snipe Active (&lt;30s)</span>
                )}
              </div>
            </div>

            {/* Current Price Banner */}
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Current Leading Bid</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono text-4xl font-extrabold text-primary">
                    ₹{auction.currentPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">({auction.totalBids} bids)</span>
                </div>
              </div>

              {isLeading && (
                <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm font-variation-fill">stars</span>
                  You Lead
                </span>
              )}
            </div>

            {/* Bidding Controls Form */}
            {!isClosed && !isSeller ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Your Bid Amount (₹):</span>
                  <span className="text-primary font-bold">Min required: ₹{minRequiredBid.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    min={minRequiredBid}
                    step={auction.minIncrement || 50}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Quick Increment Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 250].map((inc) => (
                    <button
                      key={inc}
                      onClick={() => setBidAmount(minRequiredBid + inc - (auction.totalBids === 0 ? 0 : 50))}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 transition-colors"
                    >
                      +₹{inc}
                    </button>
                  ))}
                </div>

                {/* Optional Auto-bid / Proxy bidding input */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                    <span>Set Auto-Bid Max Budget (Optional):</span>
                    <span className="text-emerald-700 font-semibold text-[10px]">Proxy Engine</span>
                  </label>
                  <input
                    type="number"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder={`e.g. ₹${minRequiredBid + 300}`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">System will automatically counter rival bids up to this limit.</span>
                </div>

                {/* Primary Place Bid Button */}
                {user ? (
                  <button
                    onClick={() => setConfirmModalOpen(true)}
                    className="w-full mt-2 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">gavel</span>
                    <span>Place Bid (₹{bidAmount.toLocaleString('en-IN')})</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="w-full mt-2 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <span className="material-symbols-outlined text-lg">lock</span>
                    <span>Sign In to Place Bid (₹{bidAmount.toLocaleString('en-IN')})</span>
                  </Link>
                )}
              </div>
            ) : isSeller ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
                <span className="font-bold block mb-1">Your Listing:</span>
                Sellers cannot bid on their own listings. Monitor incoming bids in real-time below.
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-700 text-center font-medium">
                {auction.status === 'RESERVED' ? (
                  <div>
                    <span className="font-bold text-emerald-800 block text-sm">🎉 Auction Reserved for Campus Handover!</span>
                    <Link to={`/handover/${auction.id}`} className="mt-2 inline-block px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold">
                      View Handover &amp; PIN
                    </Link>
                  </div>
                ) : (
                  <span>This auction has concluded. Winner determination in progress.</span>
                )}
              </div>
            )}
          </div>

          {/* Transparent Live Bids Audit Ledger matching Stitch Screen 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">history</span>
                <h3 className="font-bold text-base text-slate-900">Live Audit Ledger</h3>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                {bids.length} Records
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {bids.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No bids recorded yet. Be the opening bidder!</p>
              ) : (
                bids.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      idx === 0
                        ? 'bg-indigo-50/60 border-indigo-200'
                        : 'bg-slate-50/60 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                        {b.bidderName ? b.bidderName.charAt(0) : 'S'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-900">
                          {b.bidderId === user?.id ? `${b.bidderName || 'You'} (You)` : b.bidderName || 'Verified Student'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {b.createdAt ? new Date(b.createdAt).toLocaleTimeString() : 'Just now'}
                          {b.isAutomatic && ' • Auto Proxy'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-mono text-sm font-bold text-primary">
                        ₹{Number(b.amount).toLocaleString('en-IN')}
                      </span>
                      {idx === 0 && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded uppercase">
                          Leading
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Place Bid Confirmation Modal matching Stitch Screen 14 */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">gavel</span>
                Confirm Campus Bid
              </h3>
              <button onClick={() => setConfirmModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col items-center text-center">
              <span className="text-xs uppercase font-bold text-indigo-900 tracking-wider">Bid Amount</span>
              <span className="font-mono text-3xl font-extrabold text-primary mt-1">
                ₹{bidAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 mt-1 font-medium">{auction.title}</span>
            </div>

            <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p>• <strong>Campus Fair-Play Commitment:</strong> Your bid is binding once submitted.</p>
              <p>• <strong>Handover Guarantee:</strong> If provisional winner, physical handover occurs on campus with a 4-digit code.</p>
              <p>• <strong>Anti-Sniping:</strong> If under 30 seconds remain, the countdown extends by +60 seconds.</p>
            </div>

            {bidError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 font-semibold">
                {bidError}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceBid}
                disabled={submittingBid}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submittingBid ? 'Submitting...' : 'Confirm & Place Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
