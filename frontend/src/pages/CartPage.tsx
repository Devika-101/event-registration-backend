import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useEvents } from '../context/EventContext';

const TERMINAL_FEE = 12.5;

const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, clearCart, cartTotal } = useCart();
  const { refreshEvents } = useEvents();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const grandTotal = cartTotal + (cartItems.length > 0 ? TERMINAL_FEE : 0);

  const handlePayment = async () => {
    if (cartItems.length === 0) return;
    
    setPaying(true);
    
    try {
      // Get user ID from localStorage
      const userId = localStorage.getItem('userId') || '1';
      
      // First, check current registration count
      const regCheckRes = await fetch(`/api/registrations/${userId}`);
      const existingRegistrations = await regCheckRes.json();
      const currentRegCount = existingRegistrations.length;
      const cartItemCount = cartItems.length;
      
      // Check if adding these cart items would exceed limit
      if (currentRegCount + cartItemCount > 3) {
        const remainingSlots = 3 - currentRegCount;
        throw new Error(`⚠️ You have already registered for ${currentRegCount} event${currentRegCount !== 1 ? 's' : ''}. Maximum limit is 3 events. You can only register for ${remainingSlots} more event${remainingSlots !== 1 ? 's' : ''}.`);
      }
      
      // Add each item to cart in backend
      for (const item of cartItems) {
        const addToCartRes = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: parseInt(userId), 
            eventId: item.id 
          })
        });
        
        if (!addToCartRes.ok) {
          const error = await addToCartRes.json();
          throw new Error(error.error || 'Failed to add to cart');
        }
      }
      
      // Checkout (process payment and update seats)
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: parseInt(userId), 
          paymentMethod: 'credit_card' 
        })
      });
      
      const result = await checkoutRes.json();
      
      if (!checkoutRes.ok) {
        // Check for max registration error from backend
        if (result.error && (result.error.includes('Maximum 3') || result.error.includes('max 3'))) {
          throw new Error(`⚠️ Registration Limit Reached! You can only register for up to 3 events.`);
        }
        throw new Error(result.error || 'Checkout failed');
      }
      
      // Success!
      setPaid(true);
      clearCart();
      await refreshEvents();
      toast.success('Payment synchronized! Seats confirmed.', {
        style: {
          background: '#1c1b1b',
          color: '#e5e2e1',
          border: '1px solid rgba(220,38,38,0.4)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
        },
        iconTheme: { primary: '#dc2626', secondary: '#fff' },
        duration: 4000,
      });
      
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Custom styling for error toast
      toast.error(error.message || 'Payment failed. Please try again.', {
        style: {
          background: '#1c1b1b',
          color: '#ff8888',
          border: '1px solid #ff4444',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          fontWeight: 'bold',
        },
        icon: '🚫',
        duration: 6000,
      });
    } finally {
      setPaying(false);
    }
  };

  // Success state (rest remains the same)
  if (paid) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center px-6">
        <div className="glass-panel max-w-md w-full p-12 rounded-2xl text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-teal-900/30 border border-teal-500/40 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-teal-400 text-4xl">verified</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
            Access Granted
          </h2>
          <p className="text-neutral-500 text-sm mb-2 leading-relaxed">
            Your registration has been synchronized. Check your terminal for event confirmation packets.
          </p>
          <div className="my-6 font-mono text-[10px] text-teal-400/60 uppercase tracking-widest flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            TRANSACTION COMPLETE
          </div>
          <button
            onClick={() => navigate('/events')}
            className="btn-glow w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 rounded-lg transition-all duration-300 uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95"
          >
            RETURN TO REGISTRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center px-6 py-16 relative">
      {/* Background ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-red-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-red-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg animate-slide-up">
        <div className="glass-panel rounded-2xl shadow-2xl p-8 flex flex-col gap-8">

          {/* Header */}
          <div className="flex justify-between items-center border-b border-red-900/30 pb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                Shopping Cart
              </h1>
              <p className="text-[10px] text-neutral-600 uppercase tracking-widest mt-1">
                Checkout Terminal / Sync Station
              </p>
            </div>
            <div className="w-12 h-12 rounded-full border border-primary-container flex items-center justify-center text-primary-container bg-red-900/10">
              <span className="material-symbols-outlined text-3xl text-red-500">fingerprint</span>
            </div>
          </div>

          {/* Item list */}
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl border border-neutral-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-neutral-600 text-3xl">
                  remove_shopping_cart
                </span>
              </div>
              <p className="text-neutral-500 text-sm uppercase tracking-widest">Cart is empty</p>
              <button
                onClick={() => navigate('/events')}
                className="text-red-500 text-xs uppercase tracking-widest hover:underline mt-1"
              >
                ← Browse Events
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-all animate-fade-in"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-mono tracking-widest text-red-400 font-bold uppercase">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-neutral-500 text-xs">
                          <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                          <span>{item.date}</span>
                          <span className="opacity-30">|</span>
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          <span>{item.location}</span>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-white whitespace-nowrap ml-4">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-xs text-neutral-600 uppercase tracking-tighter">
                        Qty: {item.quantity} × ₹{item.price}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs text-red-500 font-bold hover:text-red-400 hover:underline uppercase tracking-wider transition-colors"
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-black/40 p-6 rounded-xl space-y-3 border border-red-900/20">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400 uppercase tracking-widest font-bold text-[11px]">Subtotal</span>
                  <span className="text-white">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400 uppercase tracking-widest font-bold text-[11px]">Terminal Fees</span>
                  <span className="text-white">₹{TERMINAL_FEE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-3">
                  <span className="text-base font-black tracking-tighter text-white">Grand Total</span>
                  <span className="text-2xl font-black text-white">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment button */}
              <button
                onClick={handlePayment}
                disabled={paying}
                className="btn-glow w-full bg-gradient-to-r from-red-600 to-[#ff9990] hover:from-red-500 hover:to-[#ffb4ab] text-on-primary-fixed font-black py-4 rounded-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-red-900/40 uppercase tracking-widest text-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {paying ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                    SYNCHRONIZING...
                  </>
                ) : (
                  <>
                    COMPLETE PAYMENT
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Footer note */}
              <div className="text-center space-y-2">
                <p className="text-[10px] leading-relaxed text-neutral-500 uppercase tracking-tighter">
                  All event registrations are final. Check deployment details carefully before
                  synchronization.
                </p>
                <a
                  href="#"
                  className="inline-block text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest border-b border-red-500/30"
                >
                  Payment Terms
                </a>
              </div>
            </>
          )}
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/events')}
          className="mt-4 w-full text-[10px] font-bold uppercase tracking-widest text-neutral-600 hover:text-neutral-400 transition-colors py-2 text-center"
        >
          ← Back to Event Registry
        </button>
      </div>

      {/* Fixed footer status bar */}
      <footer className="fixed bottom-0 w-full z-30 px-6 py-3 flex justify-between items-center bg-black/60 backdrop-blur-sm border-t border-white/5">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
              TERMINAL ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
              SSL SECURED
            </span>
          </div>
        </div>
        <div className="hidden md:block">
          <span className="font-mono text-[10px] tracking-widest text-neutral-600 uppercase">
            EVENTLY CHECKOUT v2.4.0
          </span>
        </div>
      </footer>
    </div>
  );
};

export default CartPage;