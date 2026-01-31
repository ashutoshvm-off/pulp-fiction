import React from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { Link } from 'react-router-dom';

export const Schedule: React.FC = () => {
  const { frequency, setFrequency, itemsCount, boxTotal } = useSubscription();

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        <div className="lg:col-span-8 flex flex-col gap-8">
           <div className="bg-white dark:bg-neutral-800 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-[#ebf3e8] dark:border-neutral-700">
              <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">Frequency</h3>
              <div className="flex flex-col sm:flex-row gap-4 bg-background-light dark:bg-neutral-900 p-2 rounded-[1.5rem]">
                 {['weekly', 'biweekly', 'monthly'].map((freq) => (
                    <label key={freq} className="group relative flex-1 cursor-pointer">
                       <input 
                         type="radio" 
                         name="frequency" 
                         className="peer sr-only" 
                         checked={frequency === freq}
                         onChange={() => setFrequency(freq as any)}
                       />
                       <div className="flex items-center justify-center h-12 rounded-full transition-all duration-300 text-text-muted font-medium z-10 relative peer-checked:text-text-main dark:peer-checked:text-white peer-checked:font-bold capitalize">
                          {freq}
                       </div>
                       <div className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-full shadow-sm scale-95 opacity-0 peer-checked:scale-100 peer-checked:opacity-100 transition-all duration-300"></div>
                    </label>
                 ))}
              </div>
           </div>
           
           {/* Visual Calendar Mock */}
           <div className="bg-white dark:bg-neutral-800 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-[#ebf3e8] dark:border-neutral-700">
              <h3 className="text-lg font-bold text-text-main dark:text-white mb-6">Select Start Date</h3>
              <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
                 {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} className="text-xs font-bold text-text-muted">{d}</div>)}
                 {[...Array(31)].map((_, i) => (
                    <button key={i} className={`aspect-square rounded-full text-sm font-medium flex items-center justify-center ${i === 7 ? 'bg-primary text-text-main font-bold shadow-md' : 'text-text-main dark:text-white hover:bg-background-light dark:hover:bg-neutral-700'}`}>
                       {i+1}
                    </button>
                 ))}
              </div>
           </div>
        </div>
        
        <div className="lg:col-span-4">
           <div className="sticky top-28 bg-white dark:bg-neutral-800 rounded-[2rem] p-6 shadow-md border border-[#ebf3e8] dark:border-neutral-700">
              <h3 className="text-xl font-bold text-text-main dark:text-white mb-6">Order Summary</h3>
              <div className="space-y-4 mb-8">
                 <div className="flex justify-between">
                    <span className="text-text-muted font-medium">Frequency</span>
                    <span className="text-text-main dark:text-white font-bold capitalize">{frequency}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-text-muted font-medium">Box Items</span>
                    <span className="text-text-main dark:text-white font-bold">{itemsCount} Items</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-text-muted font-medium">Total per shipment</span>
                    <span className="text-xl font-black text-text-main dark:text-white">₹{boxTotal.toFixed(2)}</span>
                 </div>
              </div>
              <Link to="/subscription/success" className="w-full bg-primary hover:bg-[#6ed63e] text-text-main font-bold py-4 rounded-full flex items-center justify-center gap-2 transition-all">
                 Confirm Schedule <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
};
