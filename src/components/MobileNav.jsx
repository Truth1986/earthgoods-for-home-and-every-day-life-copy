import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, Leaf, ShoppingCart, Heart, BookOpen, ChefHat, Info, Package } from 'lucide-react';

export default function MobileNav({ cartCount = 0, onCartOpen }) {
    const [open, setOpen] = useState(false);

    const links = [
        { to: createPageUrl('Shop'), label: 'Shop All', icon: ShoppingCart },
        { to: createPageUrl('Wishlist'), label: 'Wishlist', icon: Heart },
        { to: createPageUrl('Blog'), label: 'Blog', icon: BookOpen },
        { to: createPageUrl('Recipes'), label: 'Recipes', icon: ChefHat },
        { to: createPageUrl('About'), label: 'Our Mission', icon: Info },
        { to: '/TrackOrder', label: 'Track Order', icon: Package },
    ];

    return (
        <div className="md:hidden">
            <div className="flex items-center gap-2">
                <button
                    onClick={onCartOpen}
                    className="relative p-2 rounded-full border border-stone-200 bg-white"
                >
                    <ShoppingCart className="w-5 h-5 text-stone-700" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center">
                            {cartCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setOpen(true)}
                    className="p-2 rounded-full border border-stone-200 bg-white"
                >
                    <Menu className="w-5 h-5 text-stone-700" />
                </button>
            </div>

            {open && (
                <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
                    <div
                        className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-stone-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
                                    <Leaf className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-stone-800">EarthGoods</span>
                            </div>
                            <button onClick={() => setOpen(false)} className="p-2 hover:bg-stone-100 rounded-full">
                                <X className="w-5 h-5 text-stone-600" />
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-1">
                            {links.map(({ to, label, icon: Icon }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-medium"
                                >
                                    <Icon className="w-5 h-5" />
                                    {label}
                                </Link>
                            ))}
                        </nav>
                        <div className="p-4 border-t border-stone-100">
                            <p className="text-xs text-stone-400 text-center">Made with 💚 for simple living</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}