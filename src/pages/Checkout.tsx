/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  Package, 
  Truck, 
  CreditCard, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Printer, 
  Wallet, 
  Lock, 
  ShieldCheck, 
  Ticket, 
  ChevronDown, 
  User, 
  UserCheck, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { createOrder } from '../services/dbService';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useSEO } from '../hooks/useSEO';

interface CheckoutFormValues {
  // Shipping Information
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string; // Province
  zipCode: string;

  // Billing Information
  billingSameAsShipping: boolean;
  billingName?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingZipCode?: string;

  // Additional Details
  orderNotes?: string;
  deliveryMethod: 'standard' | 'express' | 'vip';
  paymentMethod: 'cod' | 'jazzcash' | 'easypaisa' | 'bank';

  // Payment inputs
  jazzCashNumber?: string;
  easyPaisaNumber?: string;
  bankTxId?: string;
}

// Pakistani provinces list
const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa (KPK)',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu & Kashmir (AJK)'
];

// Pakistani cities list
const PAKISTAN_CITIES = [
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Abbottabad',
  'Other'
];

export const Checkout: React.FC = () => {
  useSEO({
    title: 'Secure Checkout & Custom Order Intake',
    description: 'Finalize your premium couture purchase. Secure payments via JazzCash, EasyPaisa, Bank Transfer, or Cash on Delivery.'
  });

  const { user, profile, signIn, signUp } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  // Component local states
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  // Auth form states for registered checkout inline experience
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Promo code system state
  const [promoCode, setPromoCode] = useState('');
  const [activePromo, setActivePromo] = useState<{
    code: string;
    type: 'percentage' | 'fixed' | 'freeship';
    value: number;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  // Setup form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<CheckoutFormValues>({
    defaultValues: {
      fullName: profile?.displayName || '',
      email: user?.email || '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: 'Lahore',
      state: 'Punjab',
      zipCode: '',
      billingSameAsShipping: true,
      billingName: '',
      billingAddressLine1: '',
      billingAddressLine2: '',
      billingCity: 'Lahore',
      billingState: 'Punjab',
      billingZipCode: '',
      orderNotes: '',
      deliveryMethod: 'standard',
      paymentMethod: 'cod',
      jazzCashNumber: '',
      easyPaisaNumber: '',
      bankTxId: ''
    }
  });

  // Watch fields for dynamic layout changes and dynamic fee updates
  const billingSameAsShipping = watch('billingSameAsShipping');
  const paymentMethod = watch('paymentMethod');
  const deliveryMethod = watch('deliveryMethod');
  const selectedCity = watch('city');

  // Auto-fill profile coordinates if authenticated
  useEffect(() => {
    if (user) {
      setValue('email', user.email || '');
    }
    if (profile) {
      setValue('fullName', profile.displayName || '');
    }
  }, [user, profile, setValue]);

  // Handle inline login for registered checkout
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      toast.error("Please enter email and password.");
      return;
    }
    setAuthLoading(true);
    try {
      await signIn(authEmail, authPassword);
      toast.success("Welcome back! Details pre-filled.", {
        icon: '🔑',
        style: { borderRadius: '12px', background: '#1A1A1A', color: '#fff' }
      });
      // Pre-fill fields
      setValue('email', authEmail);
      if (profile?.displayName) {
        setValue('fullName', profile.displayName);
      }
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle inline register for registered checkout
  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword || !authName) {
      toast.error("Please fill all sign up fields.");
      return;
    }
    setAuthLoading(true);
    try {
      await signUp(authEmail, authPassword, authName);
      toast.success("Account created successfully!", {
        icon: '✨',
        style: { borderRadius: '12px', background: '#1A1A1A', color: '#fff' }
      });
      setValue('email', authEmail);
      setValue('fullName', authName);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err: any) {
      toast.error(err.message || "Sign up failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Promo code validation
  const handleApplyPromo = () => {
    setPromoError('');
    setPromoSuccess('');
    const code = promoCode.trim().toUpperCase();

    if (!code) {
      setPromoError('Please enter a coupon code.');
      return;
    }

    if (code === 'ATELIER10') {
      setActivePromo({ code, type: 'percentage', value: 10 });
      setPromoSuccess('10% off coupon applied successfully!');
    } else if (code === 'FREESHIP') {
      setActivePromo({ code, type: 'freeship', value: 0 });
      setPromoSuccess('Free delivery applied successfully!');
    } else if (code === 'LUXURY50') {
      if (subtotal < 200) {
        setPromoError('LUXURY50 coupon requires a subtotal of at least $200.');
      } else {
        setActivePromo({ code, type: 'fixed', value: 50 });
        setPromoSuccess('$50.00 discount applied successfully!');
      }
    } else {
      setPromoError('Invalid coupon code. Try ATELIER10, FREESHIP, or LUXURY50.');
    }
  };

  const handleRemovePromo = () => {
    setActivePromo(null);
    setPromoCode('');
    setPromoSuccess('');
    setPromoError('');
  };

  // Delivery values mapping
  const getDeliveryCharge = () => {
    if (activePromo?.type === 'freeship') {
      return 0;
    }
    switch (deliveryMethod) {
      case 'express':
        return 20.00; // PKR 500 equivalent
      case 'vip':
        return 40.00; // PKR 1000 equivalent
      case 'standard':
      default:
        return 10.00; // PKR 250 equivalent
    }
  };

  // Cost calculations
  const deliveryCharge = getDeliveryCharge();
  const tax = subtotal * 0.08; // Estimated 8% sales tax

  let discountAmount = 0;
  if (activePromo) {
    if (activePromo.type === 'percentage') {
      discountAmount = subtotal * (activePromo.value / 100);
    } else if (activePromo.type === 'fixed') {
      discountAmount = activePromo.value;
    }
  }

  const grandTotal = Math.max(0, subtotal + deliveryCharge + tax - discountAmount);

  // Submit Order logic
  const onSubmitOrder = async (data: CheckoutFormValues) => {
    if (cart.length === 0) {
      toast.error("Your shopping bag is empty.");
      return;
    }

    // Custom validations for mobile wallet numbers
    if (data.paymentMethod === 'jazzcash' && (!data.jazzCashNumber || data.jazzCashNumber.length < 11)) {
      toast.error("Please enter a valid 11-digit JazzCash mobile wallet number.");
      return;
    }
    if (data.paymentMethod === 'easypaisa' && (!data.easyPaisaNumber || data.easyPaisaNumber.length < 11)) {
      toast.error("Please enter a valid 11-digit EasyPaisa mobile wallet number.");
      return;
    }
    if (data.paymentMethod === 'bank' && !data.bankTxId) {
      toast.error("Please enter your Bank Transfer Reference/TXN ID.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Prepare items structure
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor.name,
        image: item.product.images[0]
      }));

      // 2. Prepare billing details
      const billingDetails = data.billingSameAsShipping 
        ? {
            fullName: data.fullName,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2 || '',
            city: data.city,
            state: data.state,
            zipCode: data.zipCode
          }
        : {
            fullName: data.billingName || data.fullName,
            addressLine1: data.billingAddressLine1 || data.addressLine1,
            addressLine2: data.billingAddressLine2 || '',
            city: data.billingCity || data.city,
            state: data.billingState || data.state,
            zipCode: data.billingZipCode || data.zipCode
          };

      // 3. Prepare order structure, adding complete customization
      const orderData = {
        userId: user?.uid || `guest-${Date.now()}`,
        email: data.email,
        items: itemsPayload,
        total: grandTotal,
        shippingAddress: {
          fullName: data.fullName,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || '',
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          phone: data.phone
        },
        billingAddress: billingDetails,
        paymentStatus: data.paymentMethod === 'cod' ? 'pending' as const : 'paid' as const,
        orderStatus: 'Pending' as const,
        // Premium customized extras saved into database
        paymentMethod: data.paymentMethod,
        paymentDetails: {
          jazzCashNumber: data.jazzCashNumber || null,
          easyPaisaNumber: data.easyPaisaNumber || null,
          bankTxId: data.bankTxId || null
        },
        deliveryMethod: data.deliveryMethod,
        deliveryFee: deliveryCharge,
        discountApplied: discountAmount,
        promoCode: activePromo?.code || null,
        orderNotes: data.orderNotes || '',
        taxApplied: tax,
        subtotal
      };

      // 4. Write order to Firestore and deduct stock levels
      const confirmedOrder = await createOrder(orderData);
      
      setPlacedOrder({
        ...confirmedOrder,
        // Keep the local expanded fields for the high-fidelity invoice render
        billingAddress: billingDetails,
        paymentMethod: data.paymentMethod,
        paymentDetails: orderData.paymentDetails,
        deliveryMethod: data.deliveryMethod,
        deliveryFee: deliveryCharge,
        discountApplied: discountAmount,
        promoCode: activePromo?.code || null,
        orderNotes: data.orderNotes || '',
        taxApplied: tax,
        subtotal
      });

      clearCart();
      toast.success("Order placed successfully!", {
        icon: '👑',
        style: { borderRadius: '12px', background: '#1A1A1A', color: '#fff' }
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to process order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Format delivery methods cleanly
  const getDeliveryLabel = (method: string) => {
    switch (method) {
      case 'express':
        return 'Express Courier Premium';
      case 'vip':
        return 'VIP Hand-Delivered (Aviation Pack)';
      case 'standard':
      default:
        return 'Standard Economy Delivery';
    }
  };

  // Format payment methods cleanly
  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'jazzcash':
        return 'JazzCash Wallet';
      case 'easypaisa':
        return 'EasyPaisa Wallet';
      case 'bank':
        return 'Direct Bank Wire';
      case 'cod':
      default:
        return 'Cash on Delivery (COD)';
    }
  };

  // If order was successfully completed, show the beautiful premium Invoice Card
  if (placedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 animate-in fade-in duration-500">
        
        {/* Isolated style for neat printouts */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-invoice, #printable-invoice * {
              visibility: visible !important;
            }
            #printable-invoice {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 24px !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }
            .print-btn-group {
              display: none !important;
            }
          }
        `}} />

        <div className="space-y-8">
          
          {/* Status Message */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-black" />
            <div className="w-14 h-14 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-black border border-gray-150">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-widest block">Atelier Securing Transit</span>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Your wardrobe is secured</h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Thank you for purchasing with MK Fashion. We have logged order <strong className="text-gray-900">#{placedOrder.id}</strong> on our secure server, and started preparing your bespoke package.
              </p>
            </div>
          </div>

          {/* Printable Invoice Page Section */}
          <div 
            id="printable-invoice" 
            className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-xl space-y-10 relative overflow-hidden font-sans text-gray-800"
          >
            {/* Branding / Crest */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-8 gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-widest text-black uppercase font-mono">MK FASHION</h1>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mt-0.5">Bespoke Couture Atelier • Lahore</p>
              </div>
              <div className="text-left sm:text-right font-mono text-xs text-gray-500 space-y-0.5">
                <div><span className="font-semibold text-black">INVOICE NO:</span> #{placedOrder.id}</div>
                <div><span className="font-semibold text-black">DATE:</span> {new Date(placedOrder.createdAt).toLocaleDateString()}</div>
                <div><span className="font-semibold text-black">STATUS:</span> <span className="uppercase text-neutral-900 font-bold bg-neutral-100 px-1.5 py-0.5 rounded">{placedOrder.paymentStatus === 'paid' ? 'Paid / Settled' : 'COD / Pending Verification'}</span></div>
              </div>
            </div>

            {/* Billing vs Shipping Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs border-b border-gray-50 pb-8">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-widest block">Shipment Delivery Address</span>
                <div className="space-y-1 text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                  <p className="font-semibold text-gray-900 text-sm">{placedOrder.shippingAddress.fullName}</p>
                  <p className="mt-0.5">{placedOrder.shippingAddress.addressLine1}</p>
                  {placedOrder.shippingAddress.addressLine2 && <p>{placedOrder.shippingAddress.addressLine2}</p>}
                  <p>{placedOrder.shippingAddress.city}, {placedOrder.shippingAddress.state} - {placedOrder.shippingAddress.zipCode}</p>
                  <p className="pt-2 font-mono text-gray-500 flex items-center gap-1.5 mt-1 border-t border-gray-100">
                    <Phone className="w-3 h-3 text-gray-400" /> {placedOrder.shippingAddress.phone}
                  </p>
                  <p className="font-mono text-gray-500 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-gray-400" /> {placedOrder.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-widest block">Billing Correspondent</span>
                <div className="space-y-1 text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                  <p className="font-semibold text-gray-900 text-sm">{placedOrder.billingAddress?.fullName || placedOrder.shippingAddress.fullName}</p>
                  <p className="mt-0.5">{placedOrder.billingAddress?.addressLine1 || placedOrder.shippingAddress.addressLine1}</p>
                  {(placedOrder.billingAddress?.addressLine2 || placedOrder.shippingAddress.addressLine2) && (
                    <p>{placedOrder.billingAddress?.addressLine2 || placedOrder.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {placedOrder.billingAddress?.city || placedOrder.shippingAddress.city}, {placedOrder.billingAddress?.state || placedOrder.shippingAddress.state} - {placedOrder.billingAddress?.zipCode || placedOrder.shippingAddress.zipCode}
                  </p>
                  <p className="pt-2 font-mono text-gray-500 mt-1 border-t border-gray-100">
                    Account Classification: <span className="font-semibold text-gray-800">{placedOrder.userId.startsWith('guest') ? 'Guest Checkout' : 'Registered Customer'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-widest block">Purchased Wardrobe Articles</span>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-gray-100">
                  <thead>
                    <tr className="text-[10px] text-gray-400 font-mono uppercase pb-3">
                      <th className="font-bold py-3">Article Description</th>
                      <th className="font-bold py-3 text-center">Size</th>
                      <th className="font-bold py-3 text-center">Color</th>
                      <th className="font-bold py-3 text-center">Qty</th>
                      <th className="font-bold py-3 text-right">Unit Price</th>
                      <th className="font-bold py-3 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-sans">
                    {placedOrder.items.map((item: any, idx: number) => (
                      <tr key={idx} className="text-gray-700">
                        <td className="py-4 font-semibold text-gray-900 max-w-[220px] truncate">{item.name}</td>
                        <td className="py-4 text-center font-mono">{item.selectedSize}</td>
                        <td className="py-4 text-center">{item.selectedColor}</td>
                        <td className="py-4 text-center font-mono">{item.quantity}</td>
                        <td className="py-4 text-right font-mono">${Number(item.price).toFixed(2)}</td>
                        <td className="py-4 text-right font-mono font-bold text-gray-900">${(Number(item.price) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Notes & Payment Details Footer */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-t border-gray-100 pt-8 text-xs">
              
              {/* Payment Details & Notes Column */}
              <div className="md:col-span-7 space-y-5">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider block">Gateway Specifications</span>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px]">
                    <span className="text-gray-500">Selected Method:</span>
                    <span className="font-semibold text-gray-900 text-right">{getPaymentLabel(placedOrder.paymentMethod)}</span>
                    
                    {placedOrder.paymentMethod === 'jazzcash' && (
                      <>
                        <span className="text-gray-500">JazzCash Account:</span>
                        <span className="font-semibold text-gray-900 font-mono text-right">{placedOrder.paymentDetails?.jazzCashNumber}</span>
                      </>
                    )}
                    {placedOrder.paymentMethod === 'easypaisa' && (
                      <>
                        <span className="text-gray-500">EasyPaisa Account:</span>
                        <span className="font-semibold text-gray-900 font-mono text-right">{placedOrder.paymentDetails?.easyPaisaNumber}</span>
                      </>
                    )}
                    {placedOrder.paymentMethod === 'bank' && (
                      <>
                        <span className="text-gray-500">Transfer Wire TXN:</span>
                        <span className="font-semibold text-gray-900 font-mono text-right truncate max-w-[150px]">{placedOrder.paymentDetails?.bankTxId}</span>
                      </>
                    )}
                    
                    <span className="text-gray-500">Logistics Tier:</span>
                    <span className="font-semibold text-gray-900 text-right">{getDeliveryLabel(placedOrder.deliveryMethod)}</span>
                  </div>
                </div>

                {placedOrder.orderNotes && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-widest block">Atelier Order Notes</span>
                    <p className="text-gray-500 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 italic leading-relaxed">
                      "{placedOrder.orderNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Financial Balance Summary Column */}
              <div className="md:col-span-5 space-y-3 font-mono">
                <div className="flex justify-between text-gray-500">
                  <span>Cart Subtotal</span>
                  <span className="text-gray-900 font-bold">${Number(placedOrder.subtotal || placedOrder.total).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Charge</span>
                  <span className="text-gray-900 font-bold">
                    {placedOrder.deliveryFee === 0 ? 'FREE' : `$${Number(placedOrder.deliveryFee).toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-gray-500">
                  <span>Sales Tax (8%)</span>
                  <span className="text-gray-900 font-bold">${Number(placedOrder.taxApplied || 0).toFixed(2)}</span>
                </div>

                {placedOrder.discountApplied > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">
                    <span>Coupon Discount</span>
                    <span>-${Number(placedOrder.discountApplied).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-black font-bold border-t border-gray-100 pt-3">
                  <span>Grand Charged</span>
                  <span className="text-base">${Number(placedOrder.total).toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Stamp Logo Overlay */}
            <div className="absolute right-8 bottom-28 opacity-[0.03] pointer-events-none select-none font-mono text-center rotate-12 hidden sm:block">
              <p className="text-5xl font-extrabold tracking-widest border-4 border-black p-4 inline-block">APPROVED</p>
              <p className="text-[10px] mt-1 tracking-widest">MK FASHION ATELIER</p>
            </div>

          </div>

          {/* Action buttons */}
          <div className="print-btn-group flex flex-col md:flex-row gap-4">
            <Link
              to={`/track/${placedOrder.id}`}
              className="flex-grow inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-xl text-xs tracking-widest uppercase shadow-md transition-all cursor-pointer gap-2 font-mono"
            >
              <Truck className="w-4 h-4" />
              TRACK YOUR ORDER LIVE
            </Link>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center bg-black hover:bg-neutral-800 text-white font-semibold py-4 px-6 rounded-xl text-xs tracking-widest uppercase shadow-md transition-all cursor-pointer gap-2 font-mono"
            >
              <Printer className="w-4 h-4" />
              PRINT SECURE INVOICE
            </button>
            
            <Link
              to="/shop"
              className="inline-flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-4 px-6 rounded-xl text-xs font-semibold tracking-wider transition-colors text-center font-mono"
            >
              CONTINUE TO CATALOG
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* Header and Back Link */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div className="space-y-1">
          <Link to="/shop" className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1.5 mb-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            BACK TO BAG
          </Link>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight font-sans">
            One Page Checkout
          </h1>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-400 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-600 font-bold">100% SECURE FIREBASE SERVER</span>
        </div>
      </div>

      {cart.length === 0 ? (
        /* Empty Checkout Page State */
        <div className="py-20 text-center space-y-4 bg-gray-50/50 border border-gray-100 rounded-3xl max-w-xl mx-auto">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-800">Your wardrobe cart is empty</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            Please add at least one article of clothing from our premium catalogs to complete an order.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-6 py-3.5 rounded-xl uppercase tracking-widest transition-all"
          >
            DISCOVER COLLECTIONS
          </Link>
        </div>
      ) : (
        /* Actual Checkout Form layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Side: Address, Billing, Delivery, and Payment forms (8 Columns) */}
          <div className="lg:col-span-8 space-y-8">

            {/* STEP 1: Account / Registered Checkout Selector */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-50 pb-2 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold font-mono">1</span>
                ACCOUNT SPECIFICATION
              </h3>

              {user ? (
                /* Authenticated Account Status */
                <div className="bg-neutral-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-gray-400 uppercase">Registered Customer</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{profile?.displayName || 'MK Patron'}</h4>
                      <p className="text-xs text-gray-500 font-mono">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-600 font-bold flex items-center gap-1 font-mono bg-emerald-50 px-2.5 py-1 rounded-xl">
                    <Check className="w-3.5 h-3.5" /> SECURED
                  </div>
                </div>
              ) : (
                /* Non-Authenticated: Guest checkout vs Login toggle tabs */
                <div className="space-y-4">
                  <div className="flex border-b border-gray-100 pb-0.5">
                    <button
                      type="button"
                      onClick={() => setAuthTab('login')}
                      className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                        authTab === 'login'
                          ? 'border-black text-black'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Login / Registered Checkout
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthTab('register')}
                      className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                        authTab === 'register'
                          ? 'border-black text-black'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Guest / Register Account
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {authTab === 'login' ? (
                      <motion.form
                        key="login"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleInlineLogin}
                        className="space-y-4 text-xs"
                      >
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          Already have an account? Sign in now. We will auto-fill your shipping coordinates, order logs, and active status.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-bold text-gray-400 uppercase font-mono">Email Address</label>
                            <input
                              type="email"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="name@email.com"
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-gray-400 uppercase font-mono">Password</label>
                            <input
                              type="password"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full bg-black hover:bg-neutral-800 text-white font-mono font-bold py-3 rounded-xl tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                        >
                          {authLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'SECURE SIGN IN'}
                        </button>
                      </motion.form>
                    ) : (
                      <motion.div
                        key="register"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-amber-900 text-xs flex gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold">Guest Checkout Mode Active</h5>
                            <p className="mt-0.5 leading-relaxed text-[11px] text-amber-800">
                              You are checking out as a Guest. To register an account and save your bespoke orders, fill in the fields below first, or simply fill out the shipping coordinates to checkout instantly.
                            </p>
                          </div>
                        </div>

                        <form onSubmit={handleInlineRegister} className="space-y-4 text-xs border-t border-dashed border-gray-150 pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="font-bold text-gray-400 uppercase font-mono">Full Name</label>
                              <input
                                type="text"
                                value={authName}
                                onChange={(e) => setAuthName(e.target.value)}
                                placeholder="Sophia Loren"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-gray-400 uppercase font-mono">Email Address</label>
                              <input
                                type="email"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                placeholder="sophia@loren.com"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-gray-400 uppercase font-mono">Password</label>
                              <input
                                type="password"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full bg-white border border-black hover:bg-neutral-50 text-black font-mono font-bold py-3 rounded-xl tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                          >
                            {authLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'REGISTER ATELIER ACCOUNT & CONTINUE'}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Primary Order Form with Shipping / Billing / Delivery / Payments */}
            <form onSubmit={handleSubmit(onSubmitOrder)} className="space-y-8">
              
              {/* STEP 2: Shipping Coordinates */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-50 pb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold font-mono">2</span>
                  SHIPPING COORDINATES
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-gray-400 uppercase font-mono">Full Recipient Name</label>
                    <input
                      type="text"
                      {...register("fullName", { required: "Recipient name is required" })}
                      placeholder="Sophia Loren"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    {errors.fullName && <p className="text-[10px] text-red-500">{errors.fullName.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase font-mono">Email Address</label>
                    <input
                      type="email"
                      {...register("email", { 
                        required: "Contact email is required",
                        pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" }
                      })}
                      placeholder="name@email.com"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase font-mono">Phone Number (Required)</label>
                    <input
                      type="tel"
                      {...register("phone", { 
                        required: "Phone number is required for verification",
                        pattern: { value: /^[0-9+() -]{7,20}$/, message: "Please enter a valid contact phone number" }
                      })}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    {errors.phone && <p className="text-[10px] text-red-500">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-gray-400 uppercase font-mono">Street Address Line 1</label>
                    <input
                      type="text"
                      {...register("addressLine1", { required: "Street address is required" })}
                      placeholder="Apartment/House No, Street, Sector, Area"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    {errors.addressLine1 && <p className="text-[10px] text-red-500">{errors.addressLine1.message}</p>}
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-gray-400 uppercase font-mono">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      {...register("addressLine2")}
                      placeholder="Building, Block, Landmark or nearest point"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase font-mono">City</label>
                    <div className="relative">
                      <select
                        {...register("city", { required: "City is required" })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors appearance-none"
                      >
                        {PAKISTAN_CITIES.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {errors.city && <p className="text-[10px] text-red-500">{errors.city.message}</p>}
                  </div>

                  {selectedCity === 'Other' && (
                    <div className="space-y-1 animate-in fade-in duration-200">
                      <label className="font-bold text-gray-400 uppercase font-mono">Specify City Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Type your city name"
                        onChange={(e) => setValue('city', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase font-mono">Province / State</label>
                    <div className="relative">
                      <select
                        {...register("state", { required: "Province/State is required" })}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors appearance-none"
                      >
                        {PAKISTAN_PROVINCES.map((prov) => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {errors.state && <p className="text-[10px] text-red-500">{errors.state.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-400 uppercase font-mono">Postal / Zip Code</label>
                    <input
                      type="text"
                      {...register("zipCode", { required: "Postal / Zip code is required" })}
                      placeholder="e.g. 54000"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    {errors.zipCode && <p className="text-[10px] text-red-500">{errors.zipCode.message}</p>}
                  </div>
                </div>

                {/* STEP 2B: Order Notes */}
                <div className="space-y-1 border-t border-gray-50 pt-4">
                  <label className="font-bold text-gray-400 uppercase font-mono text-xs">Atelier Dispatch Notes (Optional)</label>
                  <textarea
                    {...register("orderNotes")}
                    rows={3}
                    placeholder="E.g. delivery hours, gate instructions, or gift packaging message..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors resize-none"
                  />
                </div>
              </div>

              {/* STEP 3: Billing Coordinates */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold font-mono">3</span>
                    BILLING INFORMATION
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500 font-medium">Same as Shipping</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        {...register("billingSameAsShipping")}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>
                </div>

                {/* Conditional Billing Coordinates Panel */}
                <AnimatePresence initial={false}>
                  {!billingSameAsShipping && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-gray-400 uppercase font-mono">Billing Full Name</label>
                          <input
                            type="text"
                            {...register("billingName")}
                            placeholder="Sophia Loren"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-gray-400 uppercase font-mono">Billing Street Address Line 1</label>
                          <input
                            type="text"
                            {...register("billingAddressLine1")}
                            placeholder="Billing building, block, suite"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                          />
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-gray-400 uppercase font-mono">Billing Address Line 2 (Optional)</label>
                          <input
                            type="text"
                            {...register("billingAddressLine2")}
                            placeholder="Suite / Business floor"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-gray-400 uppercase font-mono">Billing City</label>
                          <div className="relative">
                            <select
                              {...register("billingCity")}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors appearance-none"
                            >
                              {PAKISTAN_CITIES.map((city) => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-gray-400 uppercase font-mono">Billing Province</label>
                          <div className="relative">
                            <select
                              {...register("billingState")}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors appearance-none"
                            >
                              {PAKISTAN_PROVINCES.map((prov) => (
                                <option key={prov} value={prov}>{prov}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-gray-400 uppercase font-mono">Billing Postal / Zip Code</label>
                          <input
                            type="text"
                            {...register("billingZipCode")}
                            placeholder="Postal code corresponding to card"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* STEP 4: Delivery Options & Charges */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-50 pb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold font-mono">4</span>
                  DELIVERY LOGISTICS & CHARGES
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                  {/* Standard option */}
                  <label className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                    deliveryMethod === 'standard' 
                      ? 'border-black bg-neutral-50/50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input 
                      type="radio" 
                      value="standard" 
                      {...register("deliveryMethod")} 
                      className="sr-only" 
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase">
                        <Truck className="w-4 h-4 text-gray-500" /> Standard
                      </div>
                      <span className="font-mono font-bold text-gray-900">
                        {activePromo?.type === 'freeship' ? <span className="text-emerald-600">Free</span> : '$10.00'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      Delivery in 3 to 5 business days. Safe, eco-friendly box packaging.
                    </p>
                  </label>

                  {/* Express option */}
                  <label className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                    deliveryMethod === 'express' 
                      ? 'border-black bg-neutral-50/50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input 
                      type="radio" 
                      value="express" 
                      {...register("deliveryMethod")} 
                      className="sr-only" 
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase">
                        <Package className="w-4 h-4 text-gray-500" /> Express Premium
                      </div>
                      <span className="font-mono font-bold text-gray-900">
                        {activePromo?.type === 'freeship' ? <span className="text-emerald-600">Free</span> : '$20.00'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      Delivery in 1 to 2 business days. Guaranteed prioritized air freight routing.
                    </p>
                  </label>

                  {/* VIP Hand-Delivered option */}
                  <label className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                    deliveryMethod === 'vip' 
                      ? 'border-black bg-neutral-50/50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input 
                      type="radio" 
                      value="vip" 
                      {...register("deliveryMethod")} 
                      className="sr-only" 
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase">
                        <Sparkles className="w-4 h-4 text-yellow-500" /> VIP Courier
                      </div>
                      <span className="font-mono font-bold text-gray-900">
                        {activePromo?.type === 'freeship' ? <span className="text-emerald-600">Free</span> : '$40.00'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal">
                      Next-day delivery, complete with branded garment linen covers & maintenance kit.
                    </p>
                  </label>
                </div>
              </div>

              {/* STEP 5: Payment Gateway Selector */}
              <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-50 pb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold font-mono">5</span>
                  PAYMENT GATEWAYS
                </h3>

                {/* 4 Custom Payment Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-sans">
                  
                  {/* Cash on Delivery */}
                  <label className={`border rounded-2xl p-4 flex flex-col justify-between items-center text-center space-y-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod' 
                      ? 'border-black bg-neutral-50/50' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input 
                      type="radio" 
                      value="cod" 
                      {...register("paymentMethod")} 
                      className="sr-only" 
                    />
                    <DollarSign className="w-6 h-6 text-neutral-800" />
                    <span className="font-bold text-gray-900">Cash on Delivery</span>
                  </label>

                  {/* JazzCash */}
                  <label className={`border rounded-2xl p-4 flex flex-col justify-between items-center text-center space-y-2 cursor-pointer transition-all ${
                    paymentMethod === 'jazzcash' 
                      ? 'border-black bg-neutral-50/50' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input 
                      type="radio" 
                      value="jazzcash" 
                      {...register("paymentMethod")} 
                      className="sr-only" 
                    />
                    <Wallet className="w-6 h-6 text-red-600" />
                    <span className="font-bold text-gray-900">JazzCash</span>
                  </label>

                  {/* EasyPaisa */}
                  <label className={`border rounded-2xl p-4 flex flex-col justify-between items-center text-center space-y-2 cursor-pointer transition-all ${
                    paymentMethod === 'easypaisa' 
                      ? 'border-black bg-neutral-50/50' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input 
                      type="radio" 
                      value="easypaisa" 
                      {...register("paymentMethod")} 
                      className="sr-only" 
                    />
                    <Wallet className="w-6 h-6 text-green-600" />
                    <span className="font-bold text-gray-900">EasyPaisa</span>
                  </label>

                  {/* Bank Transfer */}
                  <label className={`border rounded-2xl p-4 flex flex-col justify-between items-center text-center space-y-2 cursor-pointer transition-all ${
                    paymentMethod === 'bank' 
                      ? 'border-black bg-neutral-50/50' 
                      : 'border-gray-100 hover:border-gray-200'
                  }`}>
                    <input 
                      type="radio" 
                      value="bank" 
                      {...register("paymentMethod")} 
                      className="sr-only" 
                    />
                    <CreditCard className="w-6 h-6 text-neutral-800" />
                    <span className="font-bold text-gray-900">Bank Transfer</span>
                  </label>

                </div>

                {/* Conditional Fields depending on the selected method */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-xs text-gray-600 leading-normal">
                  
                  {paymentMethod === 'cod' && (
                    <div className="space-y-1.5 animate-in fade-in duration-300">
                      <h4 className="font-bold text-gray-900">Cash on Delivery (COD) Selected</h4>
                      <p className="text-[11px] text-gray-500">
                        Please pay with cash to our courier partner upon package handover. A secure phone call or automated verification SMS will be sent to <strong className="text-gray-800">{watch('phone') || '(Required phone number above)'}</strong> to confirm dispatch parameters.
                      </p>
                    </div>
                  )}

                  {paymentMethod === 'jazzcash' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <h4 className="font-bold text-gray-900">JazzCash Mobile Wallet Payment</h4>
                        <p className="text-[11px] text-gray-500">
                          Please enter your registered JazzCash mobile account number below. You will receive an push MPIN confirmation notice on your cell phone screen to authorize this charge of <strong className="text-gray-800">${grandTotal.toFixed(2)}</strong>.
                        </p>
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <label className="font-bold text-gray-400 uppercase font-mono text-[10px]">JazzCash Account Number (11 digits)</label>
                        <input
                          type="text"
                          maxLength={11}
                          {...register("jazzCashNumber", {
                            pattern: { value: /^03[0-9]{9}$/, message: "Must start with 03 and contain 11 total digits" }
                          })}
                          placeholder="e.g. 03001234567"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors font-mono"
                        />
                        {errors.jazzCashNumber && <p className="text-[10px] text-red-500">{errors.jazzCashNumber.message}</p>}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'easypaisa' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <h4 className="font-bold text-gray-900">EasyPaisa Mobile Wallet Payment</h4>
                        <p className="text-[11px] text-gray-500">
                          Please enter your registered EasyPaisa mobile account number below. You will receive a mobile notification on your device or OTP screen to approve this charge of <strong className="text-gray-800">${grandTotal.toFixed(2)}</strong>.
                        </p>
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <label className="font-bold text-gray-400 uppercase font-mono text-[10px]">EasyPaisa Account Number (11 digits)</label>
                        <input
                          type="text"
                          maxLength={11}
                          {...register("easyPaisaNumber", {
                            pattern: { value: /^03[0-9]{9}$/, message: "Must start with 03 and contain 11 total digits" }
                          })}
                          placeholder="e.g. 03451234567"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors font-mono"
                        />
                        {errors.easyPaisaNumber && <p className="text-[10px] text-red-500">{errors.easyPaisaNumber.message}</p>}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'bank' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div className="space-y-2 border-b border-gray-150 pb-3">
                        <h4 className="font-bold text-gray-900">Direct Bank Wire Details</h4>
                        <p className="text-[11px] text-gray-500">
                          Please wire the total order amount of <strong className="text-gray-900 font-mono">${grandTotal.toFixed(2)}</strong> to our bank details below. Send your transfer receipt or write down your Reference ID inside the field below to secure dispatch validation.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] bg-white p-4 rounded-xl border border-gray-150/50">
                        <div>
                          <span className="text-gray-400 font-mono block">BANK NAME</span>
                          <span className="font-semibold text-gray-900">Habib Bank Limited (HBL)</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-mono block">ACCOUNT CORRESPONDENT</span>
                          <span className="font-semibold text-gray-900">MK Fashion Atelier</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-mono block">ACCOUNT NUMBER</span>
                          <span className="font-semibold text-gray-900 font-mono">1234-5678-9012-34</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-mono block">IBAN REGISTER</span>
                          <span className="font-semibold text-gray-900 font-mono">PK72 HABB 0123 4567 8910 1112</span>
                        </div>
                      </div>

                      <div className="space-y-1 max-w-sm">
                        <label className="font-bold text-gray-400 uppercase font-mono text-[10px]">Transfer Wire TXN Reference ID</label>
                        <input
                          type="text"
                          {...register("bankTxId")}
                          placeholder="e.g. HBL-981240-TXN"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-black transition-colors font-mono"
                        />
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Complete order button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black hover:bg-neutral-800 text-white font-sans text-xs font-bold py-4 rounded-xl tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    SECURING TRANSIT INVENTORY...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    PLACE PREMIUM SECURE ORDER (${grandTotal.toFixed(2)})
                  </>
                )}
              </button>

            </form>

          </div>

          {/* Right Side: Elegant Cart Order summary breakdown (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Summary Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase font-mono tracking-wider border-b border-gray-50 pb-2">
                ORDER REVIEW
              </h3>

              {/* Items column */}
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-[280px] pr-2 scrollbar-thin">
                {cart.map((item, index) => (
                  <div key={index} className="py-3 flex gap-3 text-xs">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-12 h-16 object-cover rounded-lg bg-gray-50 flex-shrink-0 border border-gray-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <h4 className="font-semibold text-gray-900 line-clamp-1">{item.product.name}</h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-wider">
                          SZ: {item.selectedSize} | CO: {item.selectedColor.name} | QTY: {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-gray-950 font-mono">${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo code form */}
              <div className="border-t border-gray-50 pt-4 space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono tracking-wider block">PROMO COUPON CODE</span>
                
                {activePromo ? (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-xl px-3 py-2.5 flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-emerald-600" />
                      <span>CODE: <strong className="font-mono text-emerald-950">{activePromo.code}</strong></span>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      type="button"
                      className="text-red-500 hover:text-red-700 text-xs font-bold underline cursor-pointer"
                    >
                      REMOVE
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. ATELIER10"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-black transition-colors font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="bg-black hover:bg-neutral-800 text-white font-mono text-[10px] font-bold px-4 rounded-xl transition-all cursor-pointer"
                    >
                      APPLY
                    </button>
                  </div>
                )}

                {promoError && <p className="text-[10px] text-red-500 font-medium">{promoError}</p>}
                {promoSuccess && <p className="text-[10px] text-emerald-600 font-medium">{promoSuccess}</p>}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[9px] text-gray-400 font-mono">Hints:</span>
                  <button 
                    type="button" 
                    onClick={() => { setPromoCode('ATELIER10'); setPromoError(''); }}
                    className="text-[9px] text-gray-500 hover:text-black font-mono underline bg-gray-50 px-1 py-0.5 rounded"
                  >
                    ATELIER10 (10% Off)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setPromoCode('FREESHIP'); setPromoError(''); }}
                    className="text-[9px] text-gray-500 hover:text-black font-mono underline bg-gray-50 px-1 py-0.5 rounded"
                  >
                    FREESHIP (Free Delivery)
                  </button>
                </div>
              </div>

              {/* Sum matrices */}
              <div className="space-y-2 border-t border-gray-50 pt-4 text-xs font-sans text-gray-500">
                <div className="flex justify-between">
                  <span>Articles Subtotal</span>
                  <span className="font-bold text-gray-900 font-mono">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Bespoke Logistics Fee</span>
                  <span className="font-bold text-gray-900 font-mono">
                    {deliveryCharge === 0 ? <span className="text-emerald-600 font-semibold">Free Delivery</span> : `$${deliveryCharge.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Estimated Sales Tax (8%)</span>
                  <span className="font-bold text-gray-900 font-mono">${tax.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50/50 px-2 py-1.5 rounded-lg border border-dashed border-emerald-100">
                    <span>Active Coupon Discount</span>
                    <span className="font-mono font-bold">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-gray-150 pt-3 text-sm font-bold text-gray-950">
                  <span>Grand Total Sum</span>
                  <span className="font-mono text-base text-black">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Quality indicators */}
            <div className="bg-gray-50 rounded-3xl p-5 space-y-4 text-xs text-gray-500 font-sans border border-gray-100">
              <div className="flex gap-3">
                <Truck className="w-5 h-5 text-neutral-800 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-800">Carbon-Neutral Logistics</h4>
                  <p className="font-light mt-0.5">All packages are dispatched using carbon-offset flight routes and 100% biodegradable custom fiber boxes.</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Package className="w-5 h-5 text-neutral-800 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-800">Care Pack Included</h4>
                  <p className="font-light mt-0.5">Includes tailored cedar hangers, branded canvas linen covers, and fiber maintenance charts to prolong wardrobe life.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
