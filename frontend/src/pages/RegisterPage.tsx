import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const event = location.state?.event;
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    linkedin: '',
    organization: '',
    experience: '',
    dietary: 'None / Standard',
    goals: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Required';
    if (!form.email.trim()) newErrors.email = 'Required';
    if (!form.experience) newErrors.experience = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (event) {
      const cartItem = {
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location,
        price: event.price,
        category: event.category,
        registrationDetails: { ...form },
      };
      addToCart(cartItem);
    }
    
    toast.success('Registration submitted! Proceed to cart.', {
      style: {
        background: '#1c1b1b',
        color: '#e5e2e1',
        border: '1px solid rgba(220,38,38,0.4)',
        fontFamily: 'Inter, sans-serif',
      },
      iconTheme: { primary: '#dc2626', secondary: '#fff' },
      duration: 3000,
    });
    setTimeout(() => navigate('/cart'), 600);
  };

  const inputClass = (field?: string) =>
    `w-full bg-surface-container-low border ${field && errors[field] ? 'border-red-500' : 'border-neutral-800'} rounded-lg px-4 py-3 text-on-surface placeholder-neutral-600 focus:outline-none input-glow transition-all duration-300 text-sm`;

  const labelClass = 'block text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1 mb-1.5';

  return (
    <div className="min-h-screen bg-surface-container-lowest relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />

      <main className="flex items-center justify-center px-4 pt-8 pb-16 relative z-10">
        <div className="glass-card w-full max-w-3xl p-8 md:p-12 rounded-xl shadow-2xl animate-slide-up">

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Section 01 */}
            <div className="space-y-5">
              <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] border-b border-white/10 pb-2">
                01. Personal Identity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className={labelClass}>Full Name</label>
                  <input
                    className={inputClass('fullName')}
                    placeholder="e.g. Alexander Vance"
                    type="text"
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                  />
                  {errors.fullName && <p className="text-red-500 text-[10px] ml-1">{errors.fullName}</p>}
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Professional Email</label>
                  <input
                    className={inputClass('email')}
                    placeholder="vance@evently.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                  {errors.email && <p className="text-red-500 text-[10px] ml-1">{errors.email}</p>}
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>LinkedIn Profile URL</label>
                  <input
                    className={inputClass()}
                    placeholder="linkedin.com/in/username"
                    type="text"
                    value={form.linkedin}
                    onChange={(e) => update('linkedin', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 02 */}
            <div className="space-y-5">
              <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] border-b border-white/10 pb-2">
                02. Professional Credentials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className={labelClass}>BRANCH</label>
                  <input
                    className={inputClass()}
                    placeholder="Artificial Intelligence"
                    type="text"
                    value={form.organization}
                    onChange={(e) => update('organization', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>YEAR</label>
                  <div className="relative">
                    <select
                      className={`${inputClass('experience')} appearance-none`}
                      value={form.experience}
                      onChange={(e) => update('experience', e.target.value)}
                    >
                      <option value="" disabled>Select years</option>
                      <option>First year</option>
                      <option>Second year</option>
                      <option>Third year</option>
                      <option>Final year</option>

                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none text-[20px]">
                      expand_more
                    </span>
                  </div>
                  {errors.experience && <p className="text-red-500 text-[10px] ml-1">{errors.experience}</p>}
                </div>
                {/* <div className="space-y-1">
                  <label className={labelClass}>Primary Area of Expertise</label>
                  <div className="relative">
                    <select
                      className={`${inputClass('expertise')} appearance-none`}
                      value={form.expertise}
                      onChange={(e) => update('expertise', e.target.value)}
                    >
                      <option value="" disabled>Field of Expertise</option>
                      <option>Software Architecture</option>
                      <option>UI/UX Design</option>
                      <option>Cyber Security</option>
                      <option>Data Science & AI</option>
                      <option>Cloud Infrastructure</option>
                      <option>Blockchain Systems</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none text-[20px]">
                      expand_more
                    </span>
                  </div>
                  {errors.expertise && <p className="text-red-500 text-[10px] ml-1">{errors.expertise}</p>}
                </div> */}
                {/* <div className="space-y-1">
                  <label className={labelClass}>Event Track</label>
                  <div className="relative">
                    <select
                      className={`${inputClass('track')} appearance-none`}
                      value={form.track}
                      onChange={(e) => update('track', e.target.value)}
                    >
                      <option value="" disabled>Select specialization</option>
                      <option>Cybersecurity Architecture</option>
                      <option>AI Neural Networking</option>
                      <option>Quantum Computing Systems</option>
                      <option>FinTech Integrity</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none text-[20px]">
                      expand_more
                    </span>
                  </div>
                  {errors.track && <p className="text-red-500 text-[10px] ml-1">{errors.track}</p>}
                </div> */}
              </div>
            </div>

            {/* Section 03 */}
            <div className="space-y-5">
              <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] border-b border-white/10 pb-2">
                03. Summit Logistics &amp; Goals
              </h2>
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className={labelClass}>Dietary Requirements</label>
                  <div className="relative">
                    <select
                      className={`${inputClass()} appearance-none`}
                      value={form.dietary}
                      onChange={(e) => update('dietary', e.target.value)}
                    >
                      <option>None / Standard</option>
                      <option>Vegetarian</option>
                      <option>Vegan</option>
                      <option>Gluten Free</option>
                      <option>Halal</option>
                      <option>Nut Allergy / Other</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none text-[20px]">
                      expand_more
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>What are you hoping to learn at the event?</label>
                  <textarea
                    className={`${inputClass()} min-h-[120px] resize-none`}
                    placeholder="Share your primary objectives and expected outcomes..."
                    value={form.goals}
                    onChange={(e) => update('goals', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                className="btn-glow w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-5 rounded-lg shadow-xl shadow-red-900/40 flex items-center justify-center gap-3 group transition-all duration-300 hover:scale-[1.01] active:scale-95"
              >
                <span className="uppercase tracking-[0.2em] text-sm">PROCEED TO CART</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[20px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </form>

          {/* Security badges */}
          <div className="mt-8 pt-8 border-t border-neutral-800 flex items-center justify-center gap-8 flex-wrap">
            {[
              { icon: 'verified_user', label: '256-Bit SSL Secure' },
              { icon: 'database', label: 'Encrypted Storage' },
              { icon: 'policy', label: 'GDPR Compliant' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-red-500 text-lg">{icon}</span>
                <span className="text-[10px] uppercase tracking-tighter">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
