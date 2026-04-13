import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MyRegistrations from './pages/MyRegistrations';

import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import EventsPage from './pages/EventsPage';
import CartPage from './pages/CartPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';

const PrivateRoute: React.FC<{ element: React.ReactElement; roleRequired?: 'ADMIN' | 'USER' }> = ({
  element,
  roleRequired,
}) => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" />;
  if (roleRequired && role !== roleRequired) return <Navigate to="/" />;
  return element;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <EventProvider>
        <CartProvider>
          <Router>
            <Layout>
              {/* Default Toaster Config */}
              <Toaster position="top-center" reverseOrder={false} />
              <Routes>
                <Route path="/my-registrations" element={<MyRegistrations />} />
                <Route path="/" element={<LandingPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/admin/dashboard"
                  element={<PrivateRoute element={<AdminDashboard />} roleRequired="ADMIN" />}
                />
                <Route
                  path="/user/dashboard"
                  element={<Navigate to="/events" replace />}
                />
              </Routes>
            </Layout>
          </Router>
        </CartProvider>
      </EventProvider>
    </AuthProvider>
  );
};

export default App;

