import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/AuthContext';
import campusImg from '../assets/landing_screen.png';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identityTag, setIdentityTag] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [persist, setPersist] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identityTag.trim()) {
      setError('Identity Tag cannot be empty. Provide your terminal address.');
      return;
    }
    if (!accessKey.trim()) {
      setError('Password cannot be empty.');
      return;
    }
    setError('');
    setIsLoading(true);
    // Simulate auth delay
    setTimeout(() => {
      setIsLoading(false);
      login(selectedRole);
      if (selectedRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/events');
      }
    }, 800);
  };

  return (
    <div className="relative min-h-screen w-full flex overflow-hidden">
      {/* LEFT PANEL — Dark/Charcoal */}
      <div className="relative w-full lg:w-1/2 bg-[#0a0a0a] flex flex-col justify-between p-10 md:p-16 z-10">
        {/* Glow accent */}
        <div className="absolute top-1/3 -right-32 w-64 h-64 bg-red-900/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Top logo strip */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          <span className="font-mono text-[10px] text-neutral-600 uppercase tracking-[0.3em]">
            EVENTLY v2.4.0
          </span>
        </div>

        {/* Hero copy */}
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-black font-headline text-red-600 uppercase leading-none tracking-tight">
            EVENTLY
          </h1>
          <div className="w-16 h-0.5 bg-white/20" />
          <p className="text-neutral-400 text-base md:text-lg leading-relaxed max-w-xs">
            Total campus domination is just three clicks away. Synchronizing student energy into
            high-performance events.
          </p>

          {/* Feature badges */}
          <div className="flex gap-3 pt-2">
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded px-3 py-2">
              <span className="material-symbols-outlined text-neutral-400 text-[18px]">
                mark_email_read
              </span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Terminal</span>
            </div>
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded px-3 py-2">
              <span className="material-symbols-outlined text-neutral-400 text-[18px]">
                verified_user
              </span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Secure</span>
            </div>
          </div>
        </div>

        {/* Bottom status */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
          <span className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest">
            SYSTEM ONLINE
          </span>
        </div>
      </div>

      {/* RIGHT PANEL — Dark Red with campus image */}
      <div className="hidden lg:flex w-1/2 relative">
        {/* Campus bg image */}
        <img
          src={campusImg}
          alt="Campus"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          style={{ objectPosition: 'right center' }}
        />
        {/* Red overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/90 via-red-900/80 to-red-800/60" />

        {/* Login card */}
        <div className="relative z-10 flex items-center justify-center w-full p-10 animate-slide-up">
          <div className="glass-card w-full max-w-md p-10 rounded-2xl shadow-2xl">
            {/* Card header */}
            <div className="mb-8">
              <h2 className="text-3xl font-black text-white mb-1">LOGIN</h2>
              <div className="w-8 h-0.5 bg-red-500 mt-2" />
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* ID */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
                  ID
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[18px] font-mono">
                    @
                  </span>
                  <input
                    type="email"
                    value={identityTag}
                    onChange={(e) => {
                      setIdentityTag(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="name@terminal.net"
                    className="input-glow w-full bg-black/40 border border-neutral-700 rounded-lg pl-9 pr-4 py-3.5 text-sm text-on-surface placeholder-neutral-600 transition-all duration-200"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
                  PASSWORD
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[18px]">
                    key
                  </span>
                  <input
                    type="password"
                    value={accessKey}
                    onChange={(e) => {
                      setAccessKey(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="••••••••"
                    className="input-glow w-full bg-black/40 border border-neutral-700 rounded-lg pl-9 pr-4 py-3.5 text-sm text-on-surface placeholder-neutral-600 transition-all duration-200"
                  />
                </div>
              </div>

              {/* SELECT ROLE */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
                  SELECT ROLE
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setSelectedRole('USER')}
                    className={`cursor-pointer group flex items-center justify-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                      selectedRole === 'USER'
                        ? 'bg-red-600/20 border-red-500'
                        : 'bg-black/20 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                      selectedRole === 'USER' ? 'border-red-500 bg-red-500' : 'border-neutral-600'
                    }`}>
                      {selectedRole === 'USER' && <div className="w-1 h-1 bg-white rounded-full" />}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${
                      selectedRole === 'USER' ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'
                    }`}>USER</span>
                  </div>
                  <div
                    onClick={() => setSelectedRole('ADMIN')}
                    className={`cursor-pointer group flex items-center justify-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                      selectedRole === 'ADMIN'
                        ? 'bg-red-600/20 border-red-500'
                        : 'bg-black/20 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                      selectedRole === 'ADMIN' ? 'border-red-500 bg-red-500' : 'border-neutral-600'
                    }`}>
                      {selectedRole === 'ADMIN' && <div className="w-1 h-1 bg-white rounded-full" />}
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${
                      selectedRole === 'ADMIN' ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-300'
                    }`}>ADMIN</span>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs animate-fade-in">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* REMEMBER ME */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => setPersist(!persist)}
                  className={`w-5 h-5 border rounded transition-all duration-200 flex items-center justify-center flex-shrink-0
                    ${persist ? 'bg-red-600 border-red-600' : 'border-neutral-600 bg-black/30 group-hover:border-neutral-400'}`}
                >
                  {persist && (
                    <span className="material-symbols-outlined text-white text-[14px]">check</span>
                  )}
                </div>
                <span className="text-xs text-neutral-400 select-none">REMEMBER ME</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-glow w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-95 tracking-[0.2em] text-sm uppercase mt-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                    CONNECTING...
                  </>
                ) : (
                  <>
                    LOGIN AS {selectedRole}
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-neutral-600 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Request credentials */}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500 hover:text-red-400 transition-colors py-2"
              >
                REQUEST CREDENTIALS
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile login (shown on small screens instead of side panel) */}
      <div className="lg:hidden absolute inset-0 flex items-center justify-center p-6 bg-[#0a0a0a] z-20 overflow-y-auto">
        <div className="glass-card w-full max-w-sm p-8 rounded-2xl shadow-2xl animate-slide-up my-auto">
          <h2 className="text-3xl font-black text-white mb-1">LOGIN</h2>
          <div className="w-8 h-0.5 bg-red-500 mt-2 mb-8" />
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
                ID
              </label>
              <input
                type="email"
                value={identityTag}
                onChange={(e) => { setIdentityTag(e.target.value); if (error) setError(''); }}
                placeholder="name@terminal.net"
                className="input-glow w-full bg-black/40 border border-neutral-700 rounded-lg px-4 py-3.5 text-sm text-on-surface placeholder-neutral-600 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
                PASSWORD
              </label>
              <input
                type="password"
                value={accessKey}
                onChange={(e) => { setAccessKey(e.target.value); if (error) setError(''); }}
                placeholder="••••••••"
                className="input-glow w-full bg-black/40 border border-neutral-700 rounded-lg px-4 py-3.5 text-sm text-on-surface placeholder-neutral-600 transition-all duration-200"
              />
            </div>

            {/* Role Selection Mobile */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-[0.25em]">
                SELECT ROLE
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setSelectedRole('USER')}
                  className={`cursor-pointer group flex items-center justify-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    selectedRole === 'USER'
                      ? 'bg-red-600/20 border-red-500'
                      : 'bg-black/20 border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    selectedRole === 'USER' ? 'text-white' : 'text-neutral-500'
                  }`}>USER</span>
                </div>
                <div
                  onClick={() => setSelectedRole('ADMIN')}
                  className={`cursor-pointer group flex items-center justify-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    selectedRole === 'ADMIN'
                      ? 'bg-red-600/20 border-red-500'
                      : 'bg-black/20 border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    selectedRole === 'ADMIN' ? 'text-white' : 'text-neutral-500'
                  }`}>ADMIN</span>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs animate-fade-in">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-glow w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-black py-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 tracking-[0.2em] text-sm uppercase"
            >
              {isLoading ? 'CONNECTING...' : `LOGIN AS ${selectedRole} →`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

