'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category?: string;
    in_stock?: boolean;
}

interface ProductDetailProps {
    product: Product;
}

type SugarOption = 'regular' | 'extra_sugar' | 'less_sugar' | 'no_sugar';

const sugarOptions: { value: SugarOption; label: string; description: string }[] = [
    { value: 'regular', label: 'Regular', description: 'Standard sweetness' },
    { value: 'extra_sugar', label: 'Extra Sweet', description: 'Added sugar for extra sweetness' },
    { value: 'less_sugar', label: 'Less Sugar', description: 'Reduced sugar content' },
    { value: 'no_sugar', label: 'No Sugar', description: 'No added sugar' },
];

export default function ProductDetail({ product }: ProductDetailProps) {
    const [selectedSugar, setSelectedSugar] = useState<SugarOption>('regular');
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const { addToCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    const handleAddToCart = async () => {
        setIsAddingToCart(true);
        try {
            await addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                quantity,
                sugar_option: selectedSugar,
            });
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        await handleAddToCart();
        router.push('/checkout');
    };

    return (
        <div className="min-h-screen bg-amber-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-amber-800 hover:text-amber-600 mb-6 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Products
                </button>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Product Image */}
                        <div className="relative bg-gradient-to-br from-amber-100 to-orange-100 p-8 flex items-center justify-center min-h-[400px] md:min-h-[500px]">
                            <div className="relative w-full h-full max-w-md aspect-square">
                                <Image
                                    src={product.image_url || '/placeholder-juice.png'}
                                    alt={product.name}
                                    fill
                                    className="object-contain drop-shadow-2xl"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    priority
                                />
                            </div>
                            {!product.in_stock && (
                                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                                    Out of Stock
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="p-8 flex flex-col">
                            <div className="mb-2">
                                <span className="text-amber-600 text-sm font-medium uppercase tracking-wide">
                                    {product.category || 'Fresh Juice'}
                                </span>
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                {product.name}
                            </h1>
                            
                            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                                {product.description}
                            </p>

                            <div className="text-3xl font-bold text-amber-600 mb-8">
                                ₹{product.price}
                            </div>

                            {/* Sugar Options */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Sugar Preference
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {sugarOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setSelectedSugar(option.value)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                                                selectedSugar === option.value
                                                    ? 'border-amber-500 bg-amber-50 text-amber-900'
                                                    : 'border-gray-200 hover:border-amber-300 text-gray-700'
                                            }`}
                                        >
                                            <div className="font-medium">{option.label}</div>
                                            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Quantity
                                </h3>
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 font-bold text-xl hover:bg-amber-200 transition-colors"
                                    >
                                        -
                                    </button>
                                    <span className="text-2xl font-semibold text-gray-900 w-12 text-center">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 font-bold text-xl hover:bg-amber-200 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!product.in_stock || isAddingToCart}
                                    className="flex-1 py-4 px-6 rounded-xl border-2 border-amber-500 text-amber-700 font-semibold text-lg hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isAddingToCart ? 'Adding...' : 'Add to Bag'}
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    disabled={!product.in_stock || isAddingToCart}
                                    className="flex-1 py-4 px-6 rounded-xl bg-amber-500 text-white font-semibold text-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                                >
                                    Buy Now
                                </button>
                            </div>

                            {/* Product Benefits */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-gray-600">100% Fresh</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-gray-600">Same Day</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs text-gray-600">Made with Love</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
