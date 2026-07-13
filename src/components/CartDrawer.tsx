/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    subtotal,
    shipping,
    total,
    totalItems
  } = useCart();
  const navigate = useNavigate();

  const handleCheckoutClick = () => {
    onClose();
    navigate('/checkout');
  };

  const shippingLimit = 150;
  const progressToFreeShipping = Math.min(100, (subtotal / shippingLimit) * 100);
  const remainingForFreeShipping = shippingLimit - subtotal;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50"
            id="cart-backdrop"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-y-0 right-0 w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col justify-between"
            id="cart-drawer-panel"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-black" />
                <span className="text-lg font-semibold text-black font-sans">
                  Shopping Bag ({totalItems})
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-black rounded-full hover:bg-gray-50 transition-colors"
                id="close-cart-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Alert */}
            {totalItems > 0 && (
              <div className="bg-gray-50 px-6 py-3.5 border-b border-gray-100">
                {subtotal >= shippingLimit ? (
                  <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                    🎉 You qualify for Free Premium Shipping!
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-600">
                      Add <span className="font-bold text-black">${remainingForFreeShipping.toFixed(2)}</span> more for <span className="font-semibold text-black">Free Premium Shipping</span>
                    </p>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black transition-all duration-300"
                        style={{ width: `${progressToFreeShipping}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-gray-100">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">Your bag is empty</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                    Looks like you haven't added any luxury pieces to your wardrobe yet.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/shop');
                    }}
                    className="mt-6 bg-black text-white hover:bg-neutral-800 text-xs font-medium px-6 py-3 rounded-xl tracking-wider transition-all"
                  >
                    EXPLORE COLLECTIONS
                  </button>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.hex}-${index}`} className="py-4 flex gap-4">
                    {/* Product Image */}
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-24 object-cover rounded-lg bg-gray-50 flex-shrink-0"
                    />

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-medium text-gray-900 leading-tight line-clamp-1 hover:text-gray-700 cursor-pointer" onClick={() => { onClose(); navigate(`/product/${item.product.id}`); }}>
                            {item.product.name}
                          </h4>
                          <span className="text-sm font-semibold text-gray-900">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Selected Variants */}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>Size: <strong className="text-gray-700">{item.selectedSize}</strong></span>
                          <span className="flex items-center gap-1">
                            Color: 
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-gray-200 inline-block"
                              style={{ backgroundColor: item.selectedColor.hex }}
                            />
                            <strong className="text-gray-700">{item.selectedColor.name}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Delete Controls */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor.hex, item.quantity - 1)}
                            className="p-1 px-2 hover:bg-gray-50 text-gray-500 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-gray-800 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor.hex, item.quantity + 1)}
                            className="p-1 px-2 hover:bg-gray-50 text-gray-500 transition-colors"
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor.hex)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {cart.length > 0 && (
              <div className="px-6 py-6 border-t border-gray-100 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.02)]">
                <div className="space-y-2.5 text-sm mb-6">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping</span>
                    <span className="text-gray-900 font-medium">
                      {shipping === 0 ? <span className="text-green-600 font-semibold">Free</span> : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Estimated Tax</span>
                    <span className="text-gray-900 font-medium">${subtotal * 0.08 === 0 ? '$0.00' : `$${(subtotal * 0.08).toFixed(2)}`}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-base text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckoutClick}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-sans text-sm font-semibold py-4 rounded-xl tracking-wide flex items-center justify-center gap-2 shadow-lg transition-all"
                  id="checkout-cta-btn"
                >
                  PROCEED TO CHECKOUT
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
