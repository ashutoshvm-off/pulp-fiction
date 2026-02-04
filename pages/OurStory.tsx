import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../lib/services/productService';

export const OurStory: React.FC = () => {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        // Fetch products from database and show first 3 as recommendations
        const products = await fetchProducts();
        // Filter to show best sellers or first 3
        const recommended = products.filter(p => p.isBestSeller).slice(0, 3);
        setRecommendedProducts(recommended.length > 0 ? recommended : products.slice(0, 3));
      } catch (error) {
        console.error("Failed to get recommendations", error);
        setRecommendedProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4">
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4 sm:mb-6">Our Story</h1>
        <div className="w-24 h-1 bg-primary mx-auto mb-6 sm:mb-8 rounded-full"></div>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
          Pulp Fiction started in a small kitchen with a big dream: to make healthy living accessible, delicious, and sustainable.
          We believe in the power of raw, organic ingredients to heal and energize the body.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center mb-16 sm:mb-20">
        <div className="rounded-2xl overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
          <img src="https://images.unsplash.com/photo-1615478503562-ec2d8dd0e676?q=80&w=1000&auto=format&fit=crop" alt="Fresh ingredients" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Rooted in Nature</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
            Our commitment extends beyond just juice; it's about a lifestyle that respects nature and nurtures the self.
            We partner with local farmers who practice regenerative agriculture, ensuring every bottle is packed with vitality while caring for the earth.
          </p>
          <div className="flex gap-3 sm:gap-4">
            <div className="flex flex-col items-center p-3 sm:p-4 bg-green-50 rounded-xl">
              <span className="material-symbols-outlined text-2xl sm:text-3xl text-primary mb-1 sm:mb-2">eco</span>
              <span className="font-bold text-xs sm:text-sm text-gray-800">100% Organic</span>
            </div>
            <div className="flex flex-col items-center p-3 sm:p-4 bg-green-50 rounded-xl">
              <span className="material-symbols-outlined text-2xl sm:text-3xl text-primary mb-1 sm:mb-2">water_drop</span>
              <span className="font-bold text-xs sm:text-sm text-gray-800">Cold Pressed</span>
            </div>
            <div className="flex flex-col items-center p-3 sm:p-4 bg-green-50 rounded-xl">
              <span className="material-symbols-outlined text-2xl sm:text-3xl text-primary mb-1 sm:mb-2">recycling</span>
              <span className="font-bold text-xs sm:text-sm text-gray-800">Sustainable</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div className="bg-surface-light border border-primary/20 rounded-3xl p-6 sm:p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-9xl text-primary">auto_awesome</span>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">auto_awesome</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Curated For You</h2>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-2xl">
            Based on our mission of holistic wellness, our AI has selected these top-tier products to help you start your journey.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {recommendedProducts.map(product => (
                <Link key={product.id} to={`/product/${product.id}`} className="bg-white rounded-xl p-4 hover:-translate-y-1 transition-transform duration-300 shadow-sm border border-transparent hover:border-primary/30">
                  <div className="aspect-square bg-gray-50 rounded-lg mb-4 p-4 flex items-center justify-center">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-primary font-bold">₹{product.price.toFixed(2)}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Top Pick</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
