import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useEvents, type EventData } from '../context/EventContext';

interface EventCardProps {
  event: EventData;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const { isInCart } = useCart();
  const { role } = useAuth();
  const { updateEvent } = useEvents();
  const cardRef = useRef<HTMLDivElement>(null);
  const inCart = isInCart(event.id);

  const navigate = useNavigate();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: event.name,
    category: event.category,
    time: event.date,
    venue: event.location,
    description: event.description || '',
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateEvent(event.id, {
      name: formData.name,
      category: formData.category,
      date: formData.time,
      location: formData.venue,
      description: formData.description,
    });
    toast.success('Event updated successfully');
    setIsEditModalOpen(false);
  };

  const handleRegister = () => {
    if (inCart || role === 'ADMIN') return;
    navigate('/register', { state: { event } });
  };

  // Get image based on event name/category (since backend doesn't provide image)
  const getEventImage = () => {
    const name = event.name.toLowerCase();
    if (name.includes('tech') || name.includes('conference') || name.includes('ai')) {
      return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop';
    }
    if (name.includes('workshop')) {
      return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop';
    }
    if (name.includes('dinner') || name.includes('networking')) {
      return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop';
    }
    if (name.includes('sports')) {
      return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=400&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop';
  };

  return (
    <div
      ref={cardRef}
      className="group bg-surface-container rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-transparent hover:border-red-900/30"
    >
      {/* Image */}
      <div className="h-48 relative overflow-hidden">
        <img
          src={event.imageAlt ? `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop` : getEventImage()}
          alt={event.imageAlt || event.name}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent opacity-70" />
        {/* Tag */}
        <div className="absolute bottom-4 left-4">
          <span className="bg-black/60 backdrop-blur-md text-tertiary px-2 py-1 text-[9px] font-bold uppercase tracking-widest border border-white/10">
            {event.tag || event.category}
          </span>
        </div>
        {/* Price badge - Changed to ₹ */}
        <div className="absolute top-3 right-3 bg-red-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-wider">
          ₹{event.price}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-base font-black font-headline mb-2 group-hover:text-primary transition-colors uppercase tracking-tight leading-tight">
          {event.name}
        </h3>
        <div className="flex items-center gap-4 text-outline text-[10px] font-bold uppercase tracking-widest mb-5">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            {event.date}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            {event.location}
          </div>
        </div>

        {/* Action button based on role */}
        {role === 'ADMIN' ? (
          <Dialog.Root open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <Dialog.Trigger asChild>
              <button
                className="w-full py-3 text-[10px] font-black tracking-widest uppercase rounded bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-red-600/30 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                EDIT PROTOCOL
              </button>
            </Dialog.Trigger>
            
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fade-in" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-neutral-900/90 backdrop-blur-md border border-red-600/30 p-8 rounded-2xl shadow-2xl z-50 focus:outline-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-pink-400 to-red-600" />
                <Dialog.Title className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">edit</span>
                  Update <span className="text-pink-400">Event</span>
                </Dialog.Title>
                <form onSubmit={handleUpdate} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Event Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as EventData['category'] })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-red-500/50"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Creative">Creative</option>
                      <option value="Sports">Sports</option>
                      <option value="Workshop">Workshop</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Venue</label>
                    <input
                      type="text"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-red-500/50 resize-none"
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <Dialog.Close asChild>
                      <button type="button" className="flex-1 py-3 rounded-lg border border-white/5 bg-white/5 text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:bg-white/10 transition-all">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button type="submit" className="flex-[2] py-3 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                       SAVE CHANGES
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        ) : (
          <button
            onClick={handleRegister}
            disabled={inCart}
            className={`relative w-full py-3 text-[10px] font-black tracking-widest uppercase rounded transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden
              ${inCart
                ? 'bg-red-900/30 text-red-400 border border-red-900/50 cursor-default'
                : 'bg-surface-container-highest text-on-surface hover:bg-primary-container/90 hover:text-white hover:shadow-[0_0_16px_rgba(220,38,38,0.4)]'
              }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {inCart ? 'check_circle' : 'how_to_reg'}
            </span>
            {inCart ? 'REGISTERED' : 'REGISTER'}
          </button>
        )}
      </div>
    </div>
  );
};

export default EventCard;