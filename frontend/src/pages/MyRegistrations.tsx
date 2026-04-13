import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Registration {
  reg_id: number;
  event_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  registration_date: string;
  amount_paid: string;
  payment_status: string;
}

const MyRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get user ID from localStorage
  const userId = localStorage.getItem('userId') || '1';

  // Fetch user's registrations
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      console.log('Fetching registrations for user:', userId);
      
      const response = await fetch(`/api/registrations/${userId}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) throw new Error('Failed to fetch registrations');
      
      const data = await response.json();
      console.log('Registrations data:', data);
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load your registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Cancel registration
  const handleCancel = async (regId: number, eventName: string) => {
    console.log('Cancelling registration:', regId, eventName);
    
    if (!confirm(`Are you sure you want to cancel registration for "${eventName}"?`)) return;
    
    try {
      const response = await fetch(`/api/admin/registrations/${regId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': 'admin123'
        }
      });
      
      const result = await response.json();
      console.log('Cancel response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel');
      }
      
      toast.success(`Registration for "${eventName}" cancelled successfully!`);
      fetchRegistrations(); // Refresh the list
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error(error.message || 'Failed to cancel registration');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading your registrations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <span className="material-symbols-outlined text-[20px]">event_note</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">My Registrations</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">
            Your Event <span className="text-red-500">Portfolio</span>
          </h1>
          <div className="w-16 h-0.5 bg-red-500 mt-4" />
        </div>

        {/* Stats Card */}
        <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-sm uppercase tracking-widest mb-1">Total Registrations</p>
              <p className="text-3xl font-black text-white">{registrations.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-2xl">confirmation_number</span>
            </div>
          </div>
        </div>

        {/* Registrations List */}
        {registrations.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-neutral-800/50 border border-neutral-700 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-neutral-600 text-4xl">event_busy</span>
            </div>
            <p className="text-neutral-500 text-lg mb-4">No registrations yet</p>
            <button
              onClick={() => navigate('/events')}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-bold transition-all"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => (
              <div
                key={reg.reg_id}
                className="bg-neutral-900/30 border border-white/10 rounded-xl p-6 hover:border-red-500/30 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-red-500 text-[20px]">event</span>
                      <h3 className="text-xl font-bold text-white">{reg.event_name}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div className="flex items-center gap-2 text-neutral-400 text-sm">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        <span>{new Date(reg.event_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400 text-sm">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span>{reg.start_time} - {reg.end_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400 text-sm">
                        <span className="material-symbols-outlined text-[16px]">receipt</span>
                        <span>Paid: ₹{parseFloat(reg.amount_paid).toFixed(0)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400 text-sm">
                        <span className="material-symbols-outlined text-[16px]">event_available</span>
                        <span>Registered: {new Date(reg.registration_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cancel Button */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCancel(reg.reg_id, reg.event_name)}
                      className="px-4 py-2 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all text-sm font-bold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/events')}
            className="text-neutral-500 hover:text-neutral-400 text-sm uppercase tracking-widest transition-colors"
          >
            ← Back to Events
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyRegistrations;