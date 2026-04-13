import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className={`min-h-screen flex flex-col ${isLanding ? '' : 'bg-surface-container-lowest'}`}>
      <Navbar />
      <main className={`flex-grow ${!isLanding ? 'pt-16' : ''}`}>{children}</main>
      {!isLanding && <Footer />}
    </div>
  );
};

export default Layout;
