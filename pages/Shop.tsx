import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRODUCTS } from '../data';
import { useCart } from '../context/CartContext';

export const Shop: React.FC = () => {
  const { addToCart } = useCart();
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>('any');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('bestselling');

  const categories = ['juice', 'smoothie', 'shot', 'snack', 'bundle'];

  const toggleCategory = (cat: string) => {
    setActiveCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const filteredProducts = PRODUCTS.filter(product => {
    // Category filter
    if (activeCategories.length > 0 && !activeCategories.includes(product.category)) return false;

    // Price filter
    if (priceRange === 'under-150' && product.price >= 150) return false;
    if (priceRange === '150-300' && (product.price < 150 || product.price > 300)) return false;
    if (priceRange === '300-500' && (product.price < 300 || product.price > 500)) return false;
    if (priceRange === 'over-500' && product.price <= 500) return false;

    // Rating filter
    if (product.rating < minRating) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === 'low') return a.price - b.price;
    if (sortBy === 'high') return b.price - a.price;
    if (sortBy === 'new') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
    return (b.reviews || 0) - (a.reviews || 0);
  });

  return (
    <div>
      {/* Hero Banner Small */}
      <div className="relative w-full overflow-hidden rounded-2xl h-[150px] sm:h-[200px] mb-8 group">
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA_YFvhfIKjgLBwGV6ROA-LL6bBYo9zcEOe5tx3516Bwt5SfTOs5SPtXkHj0w_u3Ax7_J6Vnh-WlYGPZR-kqjdEXav457XV0jeG1TlCCH9hL6c4UY9_KZtRkPYXVjQoPalwgSaqkkfvf9mH9iEpWlwKiVBU91s_sRUeyAa22hSO5f9yiwrQ4wt93q7bmYk7e-O_nvZHqnhT1KGmsD7nGPfWkrqUenFJQW65MlZ-Y3m84QulftsO8LPQnn_F_2RfVSvovTg5i6q3M7_7")' }}>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        <div className="relative h-full flex flex-col justify-center px-4 sm:px-8 lg:px-16">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Shop All Products</h1>
          <p className="text-gray-200 text-xs sm:text-sm lg:text-base">Cold-pressed juices, immunity shots, and healthy snacks.</p>
        </div>
      </div>


      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filters - Amazon Style Horizontal Pills */}
        <div className="lg:hidden">
          {/* Filter Count Badge */}
          <div className="mb-4">
            <button className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary rounded-full text-sm font-bold text-gray-900">
              <span className="material-symbols-outlined text-primary text-xl">tune</span>
              {(activeCategories.length > 0 || priceRange !== 'any' || minRating > 0) && (
                <span className="bg-primary text-black rounded-full size-5 flex items-center justify-center text-xs">
                  {activeCategories.length + (priceRange !== 'any' ? 1 : 0) + (minRating > 0 ? 1 : 0)}
                </span>
              )}
              Filters
            </button>
          </div>

          {/* Categories Pills */}
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border-2 transition-all ${activeCategories.includes(cat)
                    ? 'bg-primary border-primary text-black'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-primary'
                    }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Price Pills */}
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[
                { label: 'Up to ₹150', value: 'under-150' },
                { label: '₹150-₹300', value: '150-300' },
                { label: '₹300-₹500', value: '300-500' },
                { label: 'Over ₹500', value: 'over-500' },
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setPriceRange(range.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border-2 transition-all ${priceRange === range.value
                    ? 'bg-primary border-primary text-black'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-primary'
                    }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Pills */}
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border-2 transition-all flex items-center gap-1 ${minRating === rating
                    ? 'bg-primary border-primary text-black'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-primary'
                    }`}
                >
                  <div className="flex">
                    {[...Array(rating)].map((_, i) => (
                      <span key={i} className={`material-symbols-outlined text-[16px] filled ${minRating === rating ? 'text-black' : 'text-yellow-400'}`}>star</span>
                    ))}
                  </div>
                  &amp; Up
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {(activeCategories.length > 0 || priceRange !== 'any' || minRating > 0) && (
            <button
              onClick={() => {
                setActiveCategories([]);
                setPriceRange('any');
                setMinRating(0);
              }}
              className="text-sm text-primary font-bold hover:underline mb-4"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Sidebar Filters - Amazon Style */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-8 pr-4 border-r border-gray-100">

          {/* Categories */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Department</h3>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li key={cat}>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={activeCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="peer h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                    <span className={`text-sm capitalize group-hover:text-primary transition-colors ${activeCategories.includes(cat) ? 'font-bold text-primary' : 'text-gray-700'}`}>
                      {cat}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Price */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Price</h3>
            <ul className="space-y-2">
              {[
                { label: 'Under ₹150', value: 'under-150' },
                { label: '₹150 - ₹300', value: '150-300' },
                { label: '₹300 - ₹500', value: '300-500' },
                { label: 'Over ₹500', value: 'over-500' },
                { label: 'Any Price', value: 'any' }
              ].map((range) => (
                <li key={range.value}>
                  <button
                    onClick={() => setPriceRange(range.value)}
                    className={`text-sm hover:text-primary transition-colors text-left w-full ${priceRange === range.value ? 'font-bold text-primary' : 'text-gray-700'}`}>
                    {range.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Review */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Avg. Customer Review</h3>
            <ul className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <li key={rating}>
                  <button
                    onClick={() => setMinRating(rating)}
                    className={`flex items-center gap-2 group w-full text-left ${minRating === rating ? 'bg-gray-50 -mx-2 px-2 py-1 rounded-md' : ''}`}
                  >
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`material-symbols-outlined text-[18px] ${i < rating ? 'filled' : ''} ${i >= rating ? 'text-gray-300' : ''}`}>star</span>
                      ))}
                    </div>
                    <span className={`text-sm ${minRating === rating ? 'font-bold text-gray-900' : 'text-gray-600 group-hover:text-primary'}`}>&amp; Up</span>
                  </button>
                </li>
              ))}
              <li>
                <button onClick={() => setMinRating(0)} className="text-sm text-gray-500 hover:text-primary mt-1">Clear Filter</button>
              </li>
            </ul>
          </div>

        </aside>

        {/* Product Grid Area */}
        <div className="flex-1">
          {/* Sorting & Count Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <p className="text-gray-900 font-bold text-sm">{filteredProducts.length} results</p>
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-sm text-gray-600">Sort by:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer p-0"
              >
                <option value="bestselling">Best Selling</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="new">Newest Arrivals</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="group relative flex flex-col rounded-xl bg-surface-light border border-gray-100 hover:border-[#d7e7cf] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="relative aspect-[3/4] bg-gray-50 flex items-center justify-center p-6">
                  <Link to={`/product/${product.id}`} className="absolute inset-0 z-0"></Link>
                  {product.isBestSeller && (
                    <div className="absolute top-0 left-0 z-10 bg-[#e67a00] text-white px-3 py-1 rounded-br-lg text-xs font-bold uppercase tracking-wide">
                      Best Seller
                    </div>
                  )}
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105 pointer-events-none" />
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                  <Link to={`/product/${product.id}`} className="font-bold text-lg text-gray-900 hover:text-primary transition-colors line-clamp-2">
                    {product.name}
                  </Link>

                  <div className="flex items-center gap-1 mb-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`material-symbols-outlined text-[14px] ${i < Math.floor(product.rating) ? 'filled' : ''}`}>star</span>
                      ))}
                    </div>
                    <span className="text-xs text-blue-600 hover:underline cursor-pointer">{product.reviews}</span>
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs align-top">₹</span>
                      <span className="text-xl font-bold text-gray-900">{product.price.toFixed(2)}</span>
                    </div>

                    {product.category === 'bundle' && (
                      <span className="text-xs text-gray-500">Free delivery</span>
                    )}
                  </div>

                  <button
                    onClick={(e) => { e.preventDefault(); addToCart(product); }}
                    className="w-full mt-3 bg-[#f7ca00] hover:bg-[#daad00] text-black font-medium py-2 rounded-full text-sm transition-colors shadow-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">Try adjusting your filters.</p>
              <button onClick={() => { setActiveCategories([]); setPriceRange('any'); setMinRating(0); }} className="mt-4 text-primary font-bold hover:underline">Clear all filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
