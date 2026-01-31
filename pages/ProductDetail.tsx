import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PRODUCTS, REVIEWS } from '../data';
import { useCart } from '../context/CartContext';
import { Product } from '../types';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('12oz');

  useEffect(() => {
    const found = PRODUCTS.find(p => p.id === id);
    setProduct(found);
  }, [id]);

  if (!product) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs */}
      <div className="w-full max-w-[1280px] mx-auto py-4">
        <nav className="flex text-sm text-text-muted dark:text-gray-400">
          <ol className="flex items-center space-x-2">
            <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><span className="material-symbols-outlined text-sm">chevron_right</span></li>
            <li><Link to="/shop" className="hover:text-primary transition-colors">Shop</Link></li>
            <li><span className="material-symbols-outlined text-sm">chevron_right</span></li>
            <li className="font-semibold text-text-main dark:text-white">{product.name}</li>
          </ol>
        </nav>
      </div>

      <section className="max-w-[1280px] mx-auto pb-12 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Gallery Side */}
          <div className="flex flex-col gap-4">
            <div className="relative w-full aspect-[4/5] lg:aspect-square bg-[#ebf3e7] dark:bg-[#1f2e1a] rounded-3xl overflow-hidden flex items-center justify-center p-8 group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent opacity-60"></div>
              <img src={product.image} alt={product.name} className="w-full h-full object-contain transform transition-transform duration-700 hover:scale-105 z-10 mix-blend-multiply dark:mix-blend-normal" />
              {product.isBestSeller && (
                <div className="absolute top-6 left-6 z-20">
                  <span className="px-3 py-1.5 bg-white dark:bg-surface-dark text-text-main dark:text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-sm">Best Seller</span>
                </div>
              )}
            </div>
            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
              {[product.image, ...PRODUCTS.slice(0, 2).map(p => p.image)].map((img, i) => (
                <button key={i} className={`aspect-square rounded-xl bg-[#ebf3e7] dark:bg-[#1f2e1a] overflow-hidden border-2 ${i === 0 ? 'border-primary' : 'border-transparent hover:border-primary/50'} p-2 transition-colors`}>
                  <img src={img} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                </button>
              ))}
              <div className="aspect-square rounded-xl bg-[#f9fcf8] dark:bg-surface-dark overflow-hidden border-2 border-transparent flex items-center justify-center text-text-muted cursor-pointer hover:bg-[#ebf3e7] dark:hover:bg-[#2a3f23] transition-colors">
                <span className="material-symbols-outlined">play_circle</span>
              </div>
            </div>
          </div>

          {/* Info Side */}
          <div className="flex flex-col py-2 lg:py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-main dark:text-white tracking-tight mb-2 font-serif">{product.name}</h1>
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex gap-0.5 text-primary text-sm">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`material-symbols-outlined text-[18px] ${i < Math.floor(product.rating) ? 'filled' : ''}`}>star</span>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-text-muted dark:text-gray-400">({product.reviews} Reviews)</span>
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-text-main dark:text-white font-serif">₹{product.price.toFixed(2)}</div>
            </div>

            <p className="text-text-muted dark:text-gray-300 text-lg leading-relaxed mb-8 font-light">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-text-main dark:text-white uppercase tracking-wider mb-3">Bottle Size</h3>
              <div className="flex flex-wrap gap-3">
                {['12 oz', '16 oz (+₹50)', '6-Pack (Save 10%)'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-3 rounded-lg border text-sm font-bold transition-all ${selectedSize === size
                      ? 'border-2 border-primary bg-primary/10 text-primary'
                      : 'border-[#ebf3e7] dark:border-[#2a3f23] text-text-muted hover:border-primary/50 bg-white dark:bg-surface-dark'
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10 border-b border-[#ebf3e7] dark:border-[#2a3f23] pb-10">
              <div className="flex items-center bg-[#f9fcf8] dark:bg-background-dark rounded-xl border border-[#ebf3e7] dark:border-[#2a3f23] w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-4 text-text-muted hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm font-bold">remove</span>
                </button>
                <span className="px-2 font-bold text-text-main dark:text-white min-w-[2rem] text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-4 text-text-muted hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm font-bold">add</span>
                </button>
              </div>
              <button
                onClick={() => addToCart(product, quantity)}
                className="flex-1 bg-text-main dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-text-main font-bold text-lg py-3.5 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                Add to Bag - ₹{(product.price * quantity).toFixed(2)}
              </button>
            </div>

            {/* Highlights */}
            <div className="space-y-4">
              {product.benefits && product.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="p-2 bg-[#ebf3e7] dark:bg-[#2a3f23] rounded-full text-primary">
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main dark:text-white text-sm">{benefit}</h4>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Ingredients */}
      <section className="py-16 bg-[#f9fcf8] dark:bg-background-dark border-t border-[#ebf3e7] dark:border-[#2a3f23]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-text-main dark:text-white mb-8 text-center font-serif">Key Ingredients</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {product.ingredients?.map((ing, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-all border border-[#ebf3e7] dark:border-white/5">
                  <span className="material-symbols-outlined text-4xl text-primary font-light">eco</span>
                </div>
                <h3 className="font-bold text-text-main dark:text-white mb-1">{ing}</h3>
                <p className="text-sm text-text-muted dark:text-gray-400">100% Organic</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 bg-white dark:bg-surface-dark">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold text-text-main dark:text-white mb-8 font-serif">Customer Reviews</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {REVIEWS.map(review => (
              <div key={review.id} className="bg-[#f9fcf8] dark:bg-background-dark p-6 rounded-2xl border border-[#ebf3e7] dark:border-[#2a3f23]">
                <div className="flex items-center gap-3 mb-4">
                  <img src={review.avatar} alt={review.author} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-text-main dark:text-white text-sm">{review.author}</h4>
                    <div className="flex gap-0.5 text-primary text-xs">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[14px] filled">star</span>
                      ))}
                    </div>
                  </div>
                  <span className="ml-auto text-xs text-text-muted">{review.date}</span>
                </div>
                <h5 className="font-bold text-text-main dark:text-white text-sm mb-2">{review.title}</h5>
                <p className="text-sm text-text-muted dark:text-gray-400">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
