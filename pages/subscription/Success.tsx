import React from 'react';
import { Link } from 'react-router-dom';

export const Success: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
       <div className="inline-flex items-center justify-center size-20 mb-6 rounded-full bg-primary/20 text-green-700">
         <span className="material-symbols-outlined !text-5xl">check_circle</span>
       </div>
       <h1 className="text-4xl md:text-5xl font-extrabold text-text-main dark:text-white mb-4">Your Wellness Journey Begins</h1>
       <p className="text-lg text-text-muted max-w-md mb-8">Thank you for subscribing! We've sent a confirmation email to you.</p>
       <div className="flex gap-4">
          <Link to="/" className="px-8 py-4 bg-primary text-black font-bold rounded-full shadow-lg">Go to Dashboard</Link>
          <Link to="/shop" className="px-8 py-4 bg-white border border-[#d6e7d0] text-text-main font-bold rounded-full">Browse Recipes</Link>
       </div>
    </div>
  );
};
