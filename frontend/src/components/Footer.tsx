import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-neutral-800/60 bg-neutral-950/80 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center px-8 py-5 gap-4">
        <div className="text-sm font-black text-red-600 tracking-widest">EVENTLY COMMAND CENTER</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-600 text-center">
          © 2024 EVENTLY COMMAND CENTER. ALL SYSTEMS OPERATIONAL.
        </div>
        <div className="flex gap-6">
          {['Privacy Policy', 'Terms of Service', 'System Status'].map((link) => (
            <a
              key={link}
              href="#"
              className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-red-400 transition-colors opacity-80 hover:opacity-100"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
