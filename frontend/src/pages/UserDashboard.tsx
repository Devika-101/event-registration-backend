import React from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardImg from '../assets/dashboard_fab_screen.png';

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full bg-[#0a0a0a] overflow-hidden">
      {/* Background Reference Image (Low opacity) */}
      <img
        src={dashboardImg}
        alt="Dashboard Reference"
        className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
      />

      {/* Main Content */}
      <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-teal-500">
              <span className="material-symbols-outlined text-[18px]">account_circle</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Student Interface Terminal</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Personal Hub</h1>
          </div>

          <div className="flex gap-4">
            <button className="bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white px-5 py-2.5 rounded border border-white/5 transition-all text-[10px] font-bold uppercase tracking-widest">
              View Portfolio
            </button>
            <button 
              className="btn-glow bg-red-600 hover:bg-red-500 text-white font-black px-5 py-2.5 rounded transition-all text-[10px] font-bold uppercase tracking-widest" 
              onClick={() => navigate('/events')}
            >
              Browse Gallery
            </button>
          </div>
        </div>

        {/* User Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 space-y-6">
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Subscribed Events</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2].map(item => (
                <div key={item} className="glass-card rounded-2xl border border-white/5 overflow-hidden hover:border-red-600/30 transition-all group">
                  <div className="h-40 bg-neutral-900 relative">
                    <img
                      src={`https://picsum.photos/seed/${item + 50}/600/400`}
                      alt="Event"
                      className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-70 transition-all"
                    />
                    <div className="absolute top-4 right-4 bg-teal-500 text-black text-[9px] font-black px-2 py-1 rounded">REGISTERED</div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-sm font-black text-white uppercase mb-1">Cyber-Organic Workshop {item}</div>
                      <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest leading-relaxed">
                        The Fusion of biology and machinery at Scale.
                      </p>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">Starts in 3D : 12H</span>
                      <span className="material-symbols-outlined text-neutral-600 hover:text-white cursor-pointer">arrow_forward</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Sync Status</h2>
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-neutral-500">
                  <span>REGISTRATIONS</span>
                  <span>2/5</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-2/5 h-full bg-red-600" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-neutral-500">
                  <span>UPCOMING SYNC</span>
                  <span>18:00 HRS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">Connection Stable</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button className="w-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white py-3 rounded text-[9px] font-black uppercase tracking-widest transition-all">
                  Synchronize Terminal
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* No FAB Section — The Create button is intentionally absent here */}
      </div>

      {/* Horizontal Designers (Cyber-Academic UI elements) */}
      <div className="fixed top-32 left-0 w-px h-64 bg-gradient-to-b from-transparent via-red-600/10 to-transparent" />
      <div className="fixed bottom-0 right-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
};

export default UserDashboard;
