import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import dashboardImg from '../assets/dashboard_screen.png';
import { fetchAdminEvents, addEventAPI, updateEventAPI, deleteEventAPI, type Event } from '../api';
import { useEvents } from '../context/EventContext'; 

const AdminDashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const { refreshEvents } = useEvents();

  // Form State with proper defaults
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '17:00',
    venue: '',
    total_seats: 100,
    ticket_price: 0
  });

  // Fetch events from backend
  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Handle Add/Update Event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.event_name.trim()) {
      toast.error('Event name is required.');
      return;
    }
    if (!formData.event_date) {
      toast.error('Event date is required.');
      return;
    }
    if (!formData.start_time) {
      toast.error('Start time is required.');
      return;
    }
    if (!formData.end_time) {
      toast.error('End time is required.');
      return;
    }
    if (!formData.venue.trim()) {
      toast.error('Venue is required.');
      return;
    }
    if (formData.total_seats <= 0) {
      toast.error('Total seats must be greater than 0.');
      return;
    }
    if (formData.ticket_price < 0) {
      toast.error('Ticket price cannot be negative.');
      return;
    }

    try {
      if (editingEvent) {
        await updateEventAPI(editingEvent.event_id, {
          event_name: formData.event_name,
          event_date: formData.event_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          venue: formData.venue,
          total_seats: formData.total_seats,
          ticket_price: formData.ticket_price
        });
        toast.success('Event updated successfully!');
      } else {
        await addEventAPI({
          event_name: formData.event_name,
          event_date: formData.event_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          venue: formData.venue,
          total_seats: formData.total_seats,
          ticket_price: formData.ticket_price
        });
        toast.success('Event deployed successfully!');
      }

      setIsModalOpen(false);
      setEditingEvent(null);
      await loadEvents();
      await refreshEvents();
      
      setFormData({
        event_name: '',
        event_date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '17:00',
        venue: '',
        total_seats: 100,
        ticket_price: 0
      });
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      event_name: event.event_name || '',
      event_date: event.event_date ? event.event_date.split('T')[0] : new Date().toISOString().split('T')[0],
      start_time: event.start_time || '10:00',
      end_time: event.end_time || '17:00',
      venue: event.venue || '',
      total_seats: event.total_seats || 100,
      ticket_price: event.ticket_price ? parseFloat(event.ticket_price) : 0
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (eventId: number, eventName: string) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"?`)) return;
    
    try {
      await deleteEventAPI(eventId);
      toast.success('Event deleted successfully!');
      await loadEvents();
      await refreshEvents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormData({
      event_name: '',
      event_date: new Date().toISOString().split('T')[0],
      start_time: '10:00',
      end_time: '17:00',
      venue: '',
      total_seats: 100,
      ticket_price: 0
    });
  };

  const getCapacityColor = (fillPercent: string) => {
    const percent = parseFloat(fillPercent);
    if (percent >= 90) return 'text-red-500';
    if (percent >= 70) return 'text-yellow-500';
    return 'text-teal-500';
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full bg-[#0a0a0a] overflow-hidden">
      <img
        src={dashboardImg}
        alt="Dashboard Reference"
        className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
      />

      <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-500">
              <span className="material-symbols-outlined text-[18px]">security</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Administrator Terminal</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">System Control</h1>
          </div>

          {/* Simple Button - No Dialog */}
          <button
            onClick={() => {
              console.log('Button clicked - opening modal');
              setEditingEvent(null);
              setFormData({
                event_name: '',
                event_date: new Date().toISOString().split('T')[0],
                start_time: '10:00',
                end_time: '17:00',
                venue: '',
                total_seats: 100,
                ticket_price: 0
              });
              setIsModalOpen(true);
            }}
            className="btn-glow bg-red-600 hover:bg-red-500 text-white font-black px-6 py-3 rounded-lg flex items-center gap-3 transition-all text-xs uppercase tracking-widest"
          >
            <span className="material-symbols-outlined">add</span>
            Initialize New Event
          </button>
        </div>

        {/* Admin Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
            <div className="flex justify-between items-start text-neutral-500">
              <span className="text-[10px] font-bold uppercase tracking-widest">Total Events</span>
              <span className="material-symbols-outlined text-[18px]">hub</span>
            </div>
            <div className="text-3xl font-black text-white">{events.length}</div>
          </div>
          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
            <div className="flex justify-between items-start text-neutral-500">
              <span className="text-[10px] font-bold uppercase tracking-widest">Total Seats</span>
              <span className="material-symbols-outlined text-[18px]">event_seat</span>
            </div>
            <div className="text-3xl font-black text-white">
              {events.reduce((sum, e) => sum + e.total_seats, 0)}
            </div>
          </div>
          <div className="glass-card p-6 rounded-xl border border-white/5 space-y-4">
            <div className="flex justify-between items-start text-neutral-500">
              <span className="text-[10px] font-bold uppercase tracking-widest">Booked Seats</span>
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </div>
            <div className="text-3xl font-black text-white">
              {events.reduce((sum, e) => sum + e.booked_seats, 0)}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="border-b border-white/5 px-8 py-4 flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Deployment Queue</span>
            <span className="text-[10px] font-bold text-red-500 uppercase">Live</span>
          </div>

          <div className="p-8 space-y-6">
            {loading ? (
              <div className="text-center text-neutral-500 py-10">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center text-neutral-500 py-10">No events found. Click "Initialize New Event" to create one.</div>
            ) : (
              events.map((event) => (
                <div key={event.event_id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-transparent hover:border-red-600/30 transition-all cursor-pointer group animate-fade-in">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-red-500">
                      <span className="material-symbols-outlined">event</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-black text-white uppercase tracking-wider">{event.event_name}</div>
                      <div className="text-[10px] text-neutral-500 uppercase font-bold">
                        {event.venue || 'TBD'} • {new Date(event.event_date).toLocaleDateString()} • {event.start_time} - {event.end_time}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="hidden md:block text-right">
                      <div className={`text-xs font-black ${getCapacityColor(event.fill_percentage)}`}>
                        {event.fill_percentage}%
                      </div>
                      <div className="text-[9px] text-neutral-500 uppercase">
                        {event.booked_seats}/{event.total_seats} seats
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(event)} className="material-symbols-outlined text-neutral-600 hover:text-red-500 transition-colors cursor-pointer">
                        edit
                      </button>
                      <button onClick={() => handleDelete(event.event_id, event.event_name)} className="material-symbols-outlined text-neutral-600 hover:text-red-500 transition-colors cursor-pointer">
                        delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Simple Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900/90 backdrop-blur-md border border-red-600/30 p-8 rounded-2xl shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-pink-400 to-red-600" />
            
            <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">
                {editingEvent ? 'edit' : 'add'}
              </span>
              {editingEvent ? 'Edit' : 'Initialize New'} <span className="text-pink-400">Event</span>
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Event Name</label>
                <input
                  type="text"
                  value={formData.event_name || ''}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  placeholder="ENTER PROTOCOL NAME"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Date</label>
                  <input
                    type="date"
                    value={formData.event_date || ''}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Venue</label>
                  <input
                    type="text"
                    value={formData.venue || ''}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="VENUE"
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time || ''}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time || ''}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Total Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_seats ?? 100}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setFormData({ ...formData, total_seats: isNaN(value) ? 0 : value });
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ticket_price ?? 0}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setFormData({ ...formData, ticket_price: isNaN(value) ? 0 : value });
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 rounded-lg border border-white/5 bg-white/5 text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                  {editingEvent ? 'Update' : 'Deploy'} Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent" />
      <div className="fixed right-10 top-20 w-px h-64 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
    </div>
  );
};

export default AdminDashboard;