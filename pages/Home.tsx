import React from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../data';

export const Home: React.FC = () => {
  const trendingProducts = PRODUCTS.slice(0, 4);

  return (
    <>
      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden rounded-2xl h-[300px] sm:h-[400px] mb-16 group">
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA_YFvhfIKjgLBwGV6ROA-LL6bBYo9zcEOe5tx3516Bwt5SfTOs5SPtXkHj0w_u3Ax7_J6Vnh-WlYGPZR-kqjdEXav457XV0jeG1TlCCH9hL6c4UY9_KZtRkPYXVjQoPalwgSaqkkfvf9mH9iEpWlwKiVBU91s_sRUeyAa22hSO5f9yiwrQ4wt93q7bmYk7e-O_nvZHqnhT1KGmsD7nGPfWkrqUenFJQW65MlZ-Y3m84QulftsO8LPQnn_F_2RfVSvovTg5i6q3M7_7")' }}>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        <div className="relative h-full flex flex-col justify-center px-4 sm:px-8 lg:px-16">
          <span className="text-primary font-bold tracking-wider text-xs sm:text-sm uppercase mb-2">New Seasonal Flavors</span>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight">Revitalize Your <br /><span className="text-primary">Day, Naturally.</span></h1>
          <p className="text-gray-200 max-w-md text-sm sm:text-base lg:text-lg mb-4 sm:mb-8">100% organic cold-pressed juices and healthy snacks delivered straight to your door. Experience freshness in every sip.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link to="/shop" className="bg-primary hover:bg-primary-hover text-black font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-colors shadow-lg shadow-primary/30 text-center">
              Explore Menu
            </Link>
            <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-colors border border-white/20 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">play_circle</span>
              How It's Made
            </button>
          </div>
        </div>
      </div>


      {/* Trending */}
      <div className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
          <Link to="/shop" className="text-primary font-bold flex items-center gap-1 hover:underline">
            View All Products <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {trendingProducts.map(product => (
            <Link to={`/product/${product.id}`} key={product.id} className="group relative flex flex-col rounded-xl bg-surface-light shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="relative aspect-[3/4] bg-gray-50 flex items-center justify-center p-3">
                {product.isBestSeller && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur text-xs font-bold uppercase tracking-wider rounded-sm text-gray-900">Best Seller</span>
                  </div>
                )}
                <img src={product.image} alt={product.name} className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-3 flex flex-col gap-1">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
                  <div className="flex gap-0.5 text-yellow-400 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`material-symbols-outlined text-[14px] ${i < Math.floor(product.rating) ? 'filled' : ''}`}>star</span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <div className="bg-[#ebf3e7] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-lg">
          <div className="size-12 rounded-xl bg-white flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined">mail</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Stay Fresh, Stay Updated</h2>
          <p className="text-gray-600">Join our community for exclusive offers, health tips, and new flavor alerts sent to your inbox.</p>
        </div>
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-3">
            <input type="email" placeholder="Enter your email" className="w-full rounded-xl border-none p-4 focus:ring-2 focus:ring-primary" />
            <button className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-4 rounded-xl transition-colors">Subscribe</button>
            <p className="text-xs text-gray-500 text-center">We respect your privacy. Unsubscribe at any time.</p>
          </div>
        </div>
      </div>
    </>
  );
};
