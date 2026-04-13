import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { useCart } from '../context/CartContext';
import { useEvents } from '../context/EventContext';

const CATEGORIES = ['All Events', 'Technical', 'Creative', 'Sports', 'Workshop'];

const EventsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All Events');
  const { cartCount } = useCart();
  const { allEvents, loading } = useEvents(); // Add loading
  const navigate = useNavigate();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading events...</div>
      </div>
    );
  }

  // Show message if no events
  if (!allEvents || allEvents.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-red-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-700 text-3xl">event_busy</span>
          </div>
          <p className="text-neutral-500 text-sm uppercase tracking-widest">
            No events available
          </p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="mt-4 text-red-500 text-xs uppercase tracking-widest hover:underline"
          >
            Add Events in Admin Dashboard →
          </button>
        </div>
      </div>
    );
  }

  const filtered = activeFilter === 'All Events'
    ? allEvents
    : allEvents.filter((e) => e.category === activeFilter);

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      {/* Page ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-red-900/8 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/3 -right-40 w-96 h-96 bg-red-600/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative px-6 md:px-10 pt-8 pb-20 max-w-screen-xl mx-auto">
        {/* Page header */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-[0.3em]">
              Event Architecture / Node Index
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
                Event <span className="text-red-600">Registry</span>
              </h1>
              <p className="text-neutral-500 text-sm mt-2 tracking-wide">
                {filtered.length} protocols available · Select and synchronize
              </p>
            </div>

            {/* Cart shortcut */}
            {cartCount > 0 && (
              <button
                onClick={() => navigate('/cart')}
                className="flex items-center gap-3 bg-red-600/10 border border-red-600/30 rounded-xl px-5 py-3 hover:bg-red-600/20 transition-all animate-fade-in group"
              >
                <span className="material-symbols-outlined text-red-400 text-[22px] group-hover:scale-110 transition-transform">
                  shopping_cart
                </span>
                <div className="text-left">
                  <div className="text-xs font-black text-red-400 uppercase tracking-wider">
                    {cartCount} item{cartCount > 1 ? 's' : ''} in cart
                  </div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest">
                    Proceed to checkout →
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all duration-200
                ${activeFilter === cat
                  ? 'bg-primary-container text-white border border-red-500/40 shadow-[0_0_12px_rgba(220,38,38,0.3)]'
                  : 'bg-surface-container text-on-surface-variant border border-transparent hover:bg-surface-container-high hover:text-white'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Event Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event, i) => (
            <div
              key={event.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>

        {/* Empty state for filtered results */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
            <div className="w-16 h-16 border-2 border-red-900/40 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-red-700 text-3xl">event_busy</span>
            </div>
            <p className="text-neutral-500 text-sm uppercase tracking-widest">
              No protocols found in this sector
            </p>
            <button
              onClick={() => setActiveFilter('All Events')}
              className="mt-4 text-red-500 text-xs uppercase tracking-widest hover:underline"
            >
              Reset filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;