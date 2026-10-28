import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const QuestionsAnswersPage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerQA = async () => {
      try {
        setLoading(true);
        // Fetch listings to see questions on seller's items
        const myListings = await api.getMyListings();
        setListings(myListings);
      } catch (err) {
        console.error('Failed to load Q&A:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSellerQA();
  }, []);

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          Questions &amp; Answers
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Respond to student inquiries about cycle wear, battery health, edition years, or handover points.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">chat</span>
          Inquiries on Your Active Listings
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <p className="text-xs text-slate-400 italic">You have no active listings with pending questions.</p>
        ) : (
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{l.title}</h4>
                  <span className="text-xs text-slate-500">{l.category} • Current: ₹{l.currentPrice.toLocaleString('en-IN')}</span>
                </div>
                <Link
                  to={`/auctions/${l.id}`}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Open Q&amp;A Thread
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
