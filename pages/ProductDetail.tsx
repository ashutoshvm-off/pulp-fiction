import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { fetchProductById } from '../lib/services/productService';
import { Product } from '../types';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fetchedProduct = await fetchProductById(id);
        setProduct(fetchedProduct);
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="material-symbols-outlined text-4xl text-gray-400 animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
        <Link to="/shop" className="text-primary font-medium hover:underline">Back to Shop</Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Link to="/shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
        <span className="material-symbols-outlined">arrow_back</span>
        <span className="font-medium">Back to Shop</span>
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image */}
        <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            className="w-full max-w-md object-contain mix-blend-multiply"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {/* Product Name - Fixed: changed from text-white to text-gray-900 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {/* Rating - Fixed: changed star and review text colors */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`material-symbols-outlined text-lg ${i < Math.floor(product.rating) ? 'filled' : ''}`}
                >
                  star
                </span>
              ))}
            </div>
            {/* Fixed: changed from text-white to text-gray-500 */}
            <span className="text-sm text-gray-500">({product.reviews || 0} Reviews)</span>
          </div>

          {/* Price - Fixed: changed from text-white to text-gray-900 */}
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-lg text-gray-900">₹</span>
            <span className="text-3xl font-bold text-gray-900">{product.price.toFixed(2)}</span>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

          {/* Benefits */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Benefits</h3>
              <div className="flex flex-wrap gap-2">
                {product.benefits.map((benefit, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map((ingredient, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-bold text-gray-900">Quantity:</span>
            <div className="flex items-center border border-gray-200 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <span className="px-4 py-2 font-bold text-gray-900 min-w-[3rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            Add to Cart - ₹{(product.price * quantity).toFixed(2)}
          </button>

          {/* Tags */}
          <div className="flex flex-wrap gap-3 mt-6">
            {product.isBestSeller && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
                <span className="material-symbols-outlined text-sm">local_fire_department</span>
                Best Seller
              </span>
            )}
            {product.isNew && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                <span className="material-symbols-outlined text-sm">new_releases</span>
                New
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
