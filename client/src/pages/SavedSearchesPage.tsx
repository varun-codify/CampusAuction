import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SavedSearch } from '../../../shared/types.js';
import { api } from '../services/api';

export const SavedSearchesPage: React.FC = () => {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  // New Search Alert Form
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchSearches = async () => {
    try {
      setLoading(true);
      const list = await api.getSavedSearches();
      setSearches(list);
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const handleCreateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.createSavedSearch(
        name.trim(),
        query.trim() || undefined,
        category !== 'All' ? category : undefined,
        maxPrice ? Number(maxPrice) : undefined
      );
      setName('');
      setQuery('');
      setMaxPrice('');
      await fetchSearches();
    } catch (err) {
      console.error('Failed to create saved search:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSavedSearch(id);
      await fetchSearches();
    } catch (err) {
      console.error('Failed to delete saved search:', err);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
          Saved Searches &amp; Alerts ({searches.length})
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Save custom keyword queries and receive automatic in-app alerts whenever matching campus items are listed.
        </p>
      </div>

      {/* Create Alert Form */}
      <form onSubmit={handleCreateSearch} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
        <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">add_alert</span>
          Create New Campus Alert
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alert Name (e.g. Hero Cycle)"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Keyword (e.g. Shimano)"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Cycles & Commute">Cycles &amp; Commute</option>
            <option value="Electronics & Calculators">Electronics &amp; Calculators</option>
            <option value="Books & Academics">Books &amp; Academics</option>
            <option value="Hostel & Room">Hostel &amp; Room</option>
            <option value="Lab & Instruments">Lab &amp; Instruments</option>
          </select>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max Price (₹)"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="self-end px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          Save Search Alert
        </button>
      </form>

      {/* Active Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="h-32 bg-white rounded-2xl animate-pulse" />
        ) : searches.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs italic bg-white rounded-2xl border border-slate-200">
            No saved alerts yet. Add one above to get notified on newly listed items!
          </div>
        ) : (
          searches.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">notifications_active</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    {s.query && <span>Keyword: "{s.query}"</span>}
                    {s.category && <span>• Category: {s.category}</span>}
                    {s.maxPrice && <span>• Under ₹{s.maxPrice.toLocaleString('en-IN')}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/?q=${encodeURIComponent(s.query || '')}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Run Search
                </Link>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  title="Delete Alert"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
