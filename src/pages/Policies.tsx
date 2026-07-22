/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileText, 
  Truck, 
  RefreshCw, 
  ArrowLeftRight,
  HelpCircle, 
  Mail, 
  Info, 
  Sparkles,
  MapPin,
  Phone,
  Clock,
  Send,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { addContactMessage } from '../services/dbService';
import { useSEO } from '../hooks/useSEO';

type PolicyTab = 'about' | 'contact' | 'faq' | 'returns' | 'exchanges' | 'shipping' | 'privacy' | 'terms';

export const Policies: React.FC = () => {
  useSEO({
    title: 'Customer Care & Atelier Policies',
    description: 'Learn more about MK Fashion Atelier, contact our private concierge, explore our frequent inquiries, shipping policies, returns and exchanges guidelines.'
  });

  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PolicyTab>('about');
  
  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse path or search params to auto-set active tab
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('about-us')) {
      setActiveTab('about');
    } else if (path.includes('contact-us')) {
      setActiveTab('contact');
    } else if (path.includes('faq')) {
      setActiveTab('faq');
    } else if (path.includes('return-policy')) {
      setActiveTab('returns');
    } else if (path.includes('exchange-policy')) {
      setActiveTab('exchanges');
    } else if (path.includes('shipping-policy')) {
      setActiveTab('shipping');
    } else if (path.includes('privacy-policy')) {
      setActiveTab('privacy');
    } else if (path.includes('terms-conditions')) {
      setActiveTab('terms');
    } else {
      const queryParams = new URLSearchParams(location.search);
      const tabParam = queryParams.get('tab') as PolicyTab;
      if (tabParam && ['about', 'contact', 'faq', 'returns', 'exchanges', 'shipping', 'privacy', 'terms'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [location]);

  const handleTabChange = (tab: PolicyTab) => {
    setActiveTab(tab);
    
    // Map tab to dedicated clean URL
    const tabToPathMap: Record<PolicyTab, string> = {
      about: '/about-us',
      contact: '/contact-us',
      faq: '/faq',
      returns: '/return-policy',
      exchanges: '/exchange-policy',
      shipping: '/shipping-policy',
      privacy: '/privacy-policy',
      terms: '/terms-conditions'
    };
    
    navigate(tabToPathMap[tab]);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addContactMessage({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        subject: contactForm.subject,
        message: contactForm.message.trim()
      });
      
      const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      toast.success(`Inquiry logged! Reference ID: ${ticketId}. Our concierge will contact you within 12 hours.`, {
        icon: '✨',
        duration: 5000,
        style: {
          borderRadius: '12px',
          background: '#1A1A1A',
          color: '#FFFFFF',
        }
      });

      setContactForm({
        name: '',
        email: '',
        subject: 'General Inquiry',
        message: ''
      });
    } catch (err) {
      console.error(err);
      toast.error("Could not log your inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 font-sans">
      
      {/* Page Header */}
      <div className="text-center space-y-3 mb-12 md:mb-16">
        <span className="text-[10px] font-bold tracking-[3px] text-neutral-400 uppercase font-mono">Customer Care Hub</span>
        <h1 className="text-3xl md:text-4xl font-light tracking-wide text-neutral-900 dark:text-white">Policies & Support</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-455 max-w-lg mx-auto leading-relaxed">
          The central backoffice service desk. Explore our heritage, request custom fitting details, or view legal terms.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 pb-4 lg:pb-0 border-b lg:border-b-0 border-neutral-100 dark:border-zinc-800">
            
            <button
              id="btn-policy-about"
              onClick={() => handleTabChange('about')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                activeTab === 'about'
                  ? 'bg-neutral-900 dark:bg-white dark:text-black text-white shadow-sm'
                  : 'text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>About Us</span>
            </button>

            <button
              id="btn-policy-contact"
              onClick={() => handleTabChange('contact')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                activeTab === 'contact'
                  ? 'bg-neutral-900 dark:bg-white dark:text-black text-white shadow-sm'
                  : 'text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Contact Us</span>
            </button>

            <button
              id="btn-policy-faq"
              onClick={() => handleTabChange('faq')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                activeTab === 'faq'
                  ? 'bg-neutral-900 dark:bg-white dark:text-black text-white shadow-sm'
                  : 'text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>FAQ</span>
            </button>

            <button
              id="btn-policy-returns"
              onClick={() => handleTabChange('returns')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                activeTab === 'returns'
                  ? 'bg-neutral-900 dark:bg-white dark:text-black text-white shadow-sm'
                  : 'text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Return Policy</span>
            </button>

            <button
              id="btn-policy-exchanges"
              onClick={() => handleTabChange('exchanges')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                activeTab === 'exchanges'
                  ? 'bg-neutral-900 dark:bg-white dark:text-black text-white shadow-sm'
                  : 'text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Exchange Policy</span>
            </button>

            <button
              id="btn-policy-shipping"
              onClick={() => handleTabChange('shipping')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                activeTab === 'shipping'
                  ? 'bg-neutral-900 dark:bg-white dark:text-black text-white shadow-sm'
                  : 'text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Shipping Policy</span>
            </button>

            <button
              id="btn-policy-privacy"
              onClick={() => handleTabChange('privacy')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-neutral-900 dark:bg-white dark:text-black text-white shadow-sm'
                  : 'text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy Policy</span>
            </button>

            <button
              id="btn-policy-terms"
              onClick={() => handleTabChange('terms')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-neutral-900 dark:bg-white dark:text-black text-white shadow-sm'
                  : 'text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Terms & Conditions</span>
            </button>

          </nav>
        </aside>

        {/* Content Panel */}
        <main className="flex-grow bg-white dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 rounded-3xl p-6 md:p-10 min-h-[450px] animate-in fade-in duration-300">
          
          {/* TAB 1: ABOUT US */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Our Heritage</span>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">About MK Fashion Atelier</h2>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Founded with a uncompromising vision to define luxury through structural perfection and minimal elegance, MK Fashion creates garments of timeless value. Each seasonal capsule is crafted in partnership with sustainable Italian, Swiss, and Japanese fabric houses, guaranteeing materials that feel phenomenal and stand the test of time.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-5 bg-neutral-50 dark:bg-zinc-950/30 rounded-2xl border border-neutral-100 dark:border-zinc-800 space-y-2">
                  <Sparkles className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Craftsmanship First</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Our master tailors spend up to 40 hours drafting, cutting, and finishing a single structured cashmere coat. Absolute alignment of checks, invisible seams, and weighted drapes are the standards we maintain.
                  </p>
                </div>
                <div className="p-5 bg-neutral-50 dark:bg-zinc-950/30 rounded-2xl border border-neutral-100 dark:border-zinc-800 space-y-2">
                  <ShieldCheck className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Conscious Luxury</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    We use exclusively mulesing-free Australian Merino Wool, certified European Flax Linens, and recycled botanical viscose. 100% of our carbon footprint is offset through global forestry preservation programs.
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 italic border-l-2 border-neutral-300 dark:border-zinc-700 pl-4 font-mono">
                "Fashion passes; style remains. We build luxury staples for the discerning collector." — Creative Director, MK Atelier.
              </p>
            </div>
          )}

          {/* TAB 2: CONTACT US */}
          {activeTab === 'contact' && (
            <div className="space-y-8">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Concierge Service Desk</span>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">Get In Touch</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-450">
                  Have a question regarding sizes, bespoke tailoring, or custom shipments? Our elite concierge team is ready to assist.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Contact Coordinates */}
                <div className="md:col-span-1 space-y-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Central Atelier</h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        108 Fashion Boulevard<br />
                        Atelier Square, NY 10012
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Telephone support</h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed font-mono">
                        +1 (800) 555-MKEA<br />
                        Mon-Fri, 9am - 6pm EST
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-neutral-700 dark:text-neutral-300 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Standard Response SLA</h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        Concierge response is guaranteed within 12 business hours from ticket logging.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <form onSubmit={handleContactSubmit} className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-neutral-400 font-mono">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full bg-neutral-50 dark:bg-zinc-950/40 border border-neutral-100 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-gray-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                        placeholder="e.g. Sophia Loren"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-neutral-400 font-mono">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-neutral-50 dark:bg-zinc-955/40 border border-neutral-100 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-gray-955 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                        placeholder="sophia@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-400 font-mono">Subject *</label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-zinc-955/40 border border-neutral-100 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-gray-955 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                    >
                      <option className="dark:bg-zinc-900 text-gray-955 dark:text-white">General Inquiry</option>
                      <option className="dark:bg-zinc-900 text-gray-955 dark:text-white">Custom Tailoring Request</option>
                      <option className="dark:bg-zinc-900 text-gray-955 dark:text-white">Exchanges & Returns Inquiry</option>
                      <option className="dark:bg-zinc-900 text-gray-955 dark:text-white">Bespoke Private Fittings</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-400 font-mono">Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-zinc-955/40 border border-neutral-100 dark:border-zinc-805 rounded-xl px-4 py-2.5 text-xs text-gray-955 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                      placeholder="Write your detailed query..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white dark:text-black dark:hover:bg-neutral-200 hover:bg-black text-white text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-xl transition-all w-full sm:w-auto cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>LOGGING INQUIRY...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>SUBMIT MESSAGE</span>
                      </>
                    )}
                  </button>
                </form>

              </div>
            </div>
          )}
                    {/* TAB 3: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Help & Support Desk</span>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">Frequently Asked Questions</h2>
              </div>
              
              <div className="space-y-5 divide-y divide-neutral-100 dark:divide-zinc-800">
                <div className="pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">What are the active dispatch and shipping times?</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Most catalogue garments are processed and shipped within 24 to 48 hours of order submission. Tracked Express Delivery takes approximately 3 to 7 business days worldwide. Custom fitting commissions require an extra 10–14 working days of tailored construction.
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">How do I verify which size is perfect for me?</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    We maintain an elaborate, detailed size metrics guide. If you are in between sizes, we recommend opting for the larger size or initiating a chat with our tailored fittings inquiry team on WhatsApp.
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Do you offer complimentary alterations or resizing?</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Yes, we offer complimentary fitting alterations for all premium tailoring, suits, and cashmere outerwear purchases. Simply contact our support concierge to log your custom measurements and secure an alteration ticket.
                  </p>
                </div>

                <div className="pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Are shipping rates and customs taxes covered globally?</h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    We provide complimentary express shipping on all orders over $150. Import customs fees are pre-paid by MK Fashion for deliveries to the USA, EU, UK, Canada, and Australia, meaning no surprise charges on delivery.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RETURN POLICY */}
          {activeTab === 'returns' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Returns Backoffice</span>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">Return Policy</h2>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed">
                We design with uncompromising precision, and we want you to be completely satisfied with your purchase. We offer a complimentary, stress-free return process to guarantee absolute satisfaction.
              </p>
              
              <div className="space-y-4">
                <div className="border-b border-neutral-100 dark:border-zinc-800 pb-4">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">1. The 14-Day Grace Window</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    All catalogue purchases are eligible for return. Items must be postmarked and shipped back to our central warehouse within 14 calendar days from the date of confirmed delivery.
                  </p>
                </div>
                
                <div className="border-b border-neutral-100 dark:border-zinc-800 pb-4">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">2. Condition & Integrity Standards</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    To maintain pristine standards of luxury, garments must be unworn, unwashed, unaltered, and undamaged. All atelier security tags, loop seals, and original retail brand boxes must remain entirely intact and attached.
                  </p>
                </div>
                
                <div className="border-b border-neutral-100 dark:border-zinc-800 pb-4">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">3. Custom & Bespoke Commissions</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Bespoke fitting commissions, custom-made tailoring, monogrammed embroidery, and designated final sale accessories are unique works of art and cannot be returned or cancelled.
                  </p>
                </div>

                <div className="pb-4">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">4. Refund Method</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Refunds are processed to your original payment method (Credit Card, Apple Pay, PayPal) within 5 to 7 business days from the moment our atelier inspectors verify the return contents.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-zinc-950/30 rounded-2xl border border-neutral-100 dark:border-zinc-800 text-[11px] text-neutral-500 dark:text-neutral-400">
                To initiate a return label request, please log into your account, navigate to <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">Order History</strong> in your profile, and select "Request Return Label", or contact our concierge directly at <span className="font-mono text-neutral-700 dark:text-neutral-300">support@mkfashion.com</span>.
              </div>
            </div>
          )}

          {/* TAB 4.5: EXCHANGE POLICY */}
          {activeTab === 'exchanges' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Size & Style Adjustments</span>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">Exchange Policy</h2>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed">
                If your MK garment does not fit perfectly, we provide a premium, complimentary exchange program to swap sizes or color options with priority processing.
              </p>
              
              <div className="space-y-4">
                <div className="border-b border-neutral-100 dark:border-zinc-800 pb-4">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">1. Priority Sizing Swap</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    We offer a 14-day window from receipt of your order to request an exchange. Once an exchange is submitted, we reserve the requested item in your new size or color immediately so it does not sell out.
                  </p>
                </div>
                
                <div className="border-b border-neutral-100 dark:border-zinc-800 pb-4">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">2. Complimentary Return Labels</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Exchanges are 100% complimentary. We will email you a prepaid express return label. You pay zero logistics fees.
                  </p>
                </div>
                
                <div className="border-b border-neutral-100 dark:border-zinc-800 pb-4">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">3. Speed Exchange Delivery</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    As soon as the original package is dropped off with the courier and scanned into the tracking system, we dispatch your new exchanged item with complimentary priority shipping.
                  </p>
                </div>

                <div className="pb-4">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">4. International Exchanges</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    For our international private circle, we facilitate streamlined customs declarations for exchanges to ensure no additional duties or local import taxes are levied on replacement packages.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-zinc-950/30 rounded-2xl border border-neutral-100 dark:border-zinc-800 text-[11px] text-neutral-500 dark:text-neutral-400">
                To request an instant style or size swap, please visit our live chat widget or contact us at <span className="font-mono text-neutral-700 dark:text-neutral-300">concierge@mkfashion.com</span> with your Order ID.
              </div>
            </div>
          )}
                  {/* TAB 5: SHIPPING POLICY */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Global Logistics</span>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">Shipping & Delivery Policies</h2>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed">
                MK Fashion dispatches premium luxury parcels globally. Every purchase is tracked, insured, and wrapped securely in custom insulated dust layers.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-500 dark:text-neutral-400 border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      <th className="py-2.5">Shipping Method</th>
                      <th className="py-2.5">Delivery Time</th>
                      <th className="py-2.5">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 dark:divide-zinc-850">
                    <tr>
                      <td className="py-3 font-semibold text-neutral-800 dark:text-neutral-200">Standard Insured Courier</td>
                      <td className="py-3">5 - 9 Business Days</td>
                      <td className="py-3 font-mono">$10.00 (Free above $100)</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold text-neutral-800 dark:text-neutral-200">Tracked Premium Express</td>
                      <td className="py-3">3 - 5 Business Days</td>
                      <td className="py-3 font-mono">$25.00 (Free above $150)</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-semibold text-neutral-800 dark:text-neutral-200">Atelier Next-Day In-Store Pick</td>
                      <td className="py-3">Next Day after 2pm</td>
                      <td className="py-3 font-mono">Complimentary</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Tracking numbers are securely compiled and emailed immediately upon dispatch. You may track your active parcels in real time using our live <strong className="text-neutral-600 dark:text-neutral-300 font-semibold">Order Tracking page</strong>.
              </p>
            </div>
          )}

          {/* TAB 6: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Data Protection</span>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">Privacy & Cookie Agreement</h2>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed">
                We respect your absolute privacy. At MK Fashion, we collect, secure, and process your personal data in strict compliance with the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA).
              </p>
              
              <div className="space-y-4 text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                <p>
                  <strong className="text-neutral-800 dark:text-neutral-200">1. Data We Collect</strong>: We record your basic registration variables (email, billing name, shipping addresses) and transactional identifiers to safely complete transactions.
                </p>
                <p>
                  <strong className="text-neutral-800 dark:text-neutral-200">2. Secure Payment Encryptions</strong>: Your payment coordinates (credit cards, PayPal data) are directly compiled and encrypted by Tier-1 payment providers (e.g., Stripe, Adyen). MK Fashion never stores or accesses your absolute card details.
                </p>
                <p>
                  <strong className="text-neutral-800 dark:text-neutral-200">3. Cookies & Analytics</strong>: We use temporary analytical cookies to review shopping bags, record wishlist metrics, and optimize your boutique browsing speeds.
                </p>
              </div>
            </div>
          )}

          {/* TAB 7: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Store Rules & Contract</span>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">Terms & Conditions of Sale</h2>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-350 leading-relaxed">
                By entering, browsing, or purchasing from our online registry store, you agree to comply with the following contractual bindings:
              </p>

              <div className="space-y-4 text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                <p>
                  <strong className="text-neutral-800 dark:text-neutral-200">Pricing and Corrections</strong>: While we strive for perfection, pricing typos or availability hiccups may occur. MK Fashion reserves the absolute right to void or correct orders if error anomalies present.
                </p>
                <p>
                  <strong className="text-neutral-800 dark:text-neutral-200">Intellectual Property</strong>: All design patterns, tailoring photography, illustrations, lookbook compositions, and text registries belong exclusively to MK Fashion Inc. Reproduction is strictly forbidden.
                </p>
                <p>
                  <strong className="text-neutral-800 dark:text-neutral-200">Product Authenticity</strong>: All of our garments are genuine, designed in-house, and shipped from our verified central workshop.
                </p>
              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
};
