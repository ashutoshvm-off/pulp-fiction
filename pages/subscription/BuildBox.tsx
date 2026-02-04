import React, { useState, useEffect } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../../lib/services/productService';
import { Product } from '../../types';

export const BuildBox: React.FC = () => {
  const { boxItems, addToBox, removeFromBox, itemsCount, BOX_CAPACITY } = useSubscription();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const progress = (itemsCount / BOX_CAPACITY) * 100;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const dbProducts = await fetchProducts();
        setProducts(dbProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative items-start">
      {/* Product Grid */}
      <div className="flex-1 w-full lg:w-2/3 xl:w-3/4">
        {/* Sticky Filters */}
        <div className="sticky top-[73px] z-30 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm py-4 mb-6 border-b border-sage-100 dark:border-sage-800 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 min-w-max px-1">
             {['All Items', 'Green Juices', 'Root Blends', 'Immunity Shots', 'Healthy Snacks'].map((filter, i) => (
                <button key={i} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${i === 0 ? 'bg-sage-900 text-white dark:bg-white dark:text-sage-900' : 'bg-white border border-sage-200 text-sage-700 hover:border-primary hover:text-primary dark:bg-sage-800 dark:border-sage-700 dark:text-sage-200'}`}>
                  {filter}
                </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <span className="material-symbols-outlined text-4xl text-gray-400 animate-spin">progress_activity</span>
              <p className="text-gray-500 mt-2">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">inventory_2</span>
              <p className="text-gray-500">No products available</p>
            </div>
          ) : (
            products.filter(p => p.category !== 'bundle').map(product => {
            const inBox = boxItems.find(i => i.id === product.id);
            const qty = inBox?.quantity || 0;
            return (
              <div key={product.id} className="group bg-white dark:bg-sage-900 rounded-2xl overflow-hidden border border-sage-100 dark:border-sage-800 hover:shadow-xl transition-all duration-300 flex flex-col">
                 <div className="relative h-56 bg-sage-50 dark:bg-sage-800 overflow-hidden">
                    <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {product.isBestSeller && <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold uppercase">Best Seller</div>}
                 </div>
                 <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="text-lg font-bold text-sage-900 dark:text-white">{product.name}</h3>
                       <span className="text-sage-500 dark:text-sage-400 font-medium">₹{product.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-sage-500 dark:text-sage-400 mb-4 line-clamp-2">{product.description}</p>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-sage-100 dark:border-sage-800">
                       <span className="text-primary text-sm font-medium">Details</span>
                       <div className="flex items-center gap-3">
                         {qty > 0 && (
                            <button onClick={() => removeFromBox(product.id)} className="size-8 rounded-full border border-sage-200 dark:border-sage-600 flex items-center justify-center text-sage-500 hover:border-primary hover:text-primary">
                              <span className="material-symbols-outlined text-lg">remove</span>
                            </button>
                         )}
                         <span className="font-bold w-4 text-center dark:text-white">{qty}</span>
                         <button 
                            onClick={() => addToBox(product)}
                            disabled={itemsCount >= BOX_CAPACITY}
                            className={`size-8 rounded-full flex items-center justify-center shadow-md transition-colors ${itemsCount >= BOX_CAPACITY ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary text-white hover:bg-green-500'}`}
                         >
                           <span className="material-symbols-outlined text-lg">add</span>
                         </button>
                       </div>
                    </div>
                 </div>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-1/3 xl:w-1/4 sticky top-28 self-start">
         <div className="bg-white dark:bg-sage-900 rounded-2xl border border-sage-100 dark:border-sage-800 shadow-xl overflow-hidden flex flex-col">
            <div className="bg-sage-50 dark:bg-sage-800 p-6 pb-8 border-b border-sage-100 dark:border-sage-700">
               <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold dark:text-white">Your Box</h2>
                  <span className="text-xs font-semibold bg-white dark:bg-sage-700 dark:text-sage-200 px-2 py-1 rounded border border-sage-200 dark:border-sage-600">{BOX_CAPACITY} Items</span>
               </div>
               <div className="relative pt-2">
                  <div className="flex justify-between text-sm mb-2">
                     <span className="text-sage-600 dark:text-sage-300 font-medium">{itemsCount} of {BOX_CAPACITY} items added</span>
                     <span className="text-primary font-bold">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-3 bg-sage-200 dark:bg-sage-700 rounded-full overflow-hidden">
                     <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-xs text-sage-500 dark:text-sage-400 mt-2">{itemsCount < BOX_CAPACITY ? `Add ${BOX_CAPACITY - itemsCount} more items to complete your box.` : 'Box complete!'}</p>
               </div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
               {boxItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-sage-800/50 group">
                     <div className="size-12 rounded-lg bg-sage-100 dark:bg-sage-800 shrink-0 overflow-hidden">
                        <img src={item.image} className="w-full h-full object-cover"/>
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                           <h4 className="text-sm font-bold truncate dark:text-white">{item.name}</h4>
                           <span className="text-xs font-medium text-sage-500 dark:text-sage-400">₹{item.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                           <span className="text-xs text-sage-500 dark:text-sage-400">Qty: {item.quantity}</span>
                           <button onClick={() => removeFromBox(item.id)} className="text-xs text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                        </div>
                     </div>
                  </div>
               ))}
               {boxItems.length === 0 && (
                  <div className="border border-dashed border-sage-200 dark:border-sage-700 rounded-lg p-3 flex items-center justify-center gap-2 text-sage-400">
                     <span className="material-symbols-outlined text-sm">add_circle</span>
                     <span className="text-xs font-medium">Add items from the left</span>
                  </div>
               )}
            </div>
            
            <div className="p-6 border-t border-sage-100 dark:border-sage-700 bg-sage-50/50 dark:bg-sage-900">
               <Link to="/subscription/schedule" className={`w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-green-500 transition-all flex items-center justify-center gap-2 group ${itemsCount < BOX_CAPACITY ? 'opacity-50 pointer-events-none' : ''}`}>
                  Continue to Schedule
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
};
