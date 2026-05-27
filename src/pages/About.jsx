import { Button } from "@/components/ui/button";
import { Leaf, Heart, Users, Shield, ArrowRight, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-800">EarthGoods</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to={createPageUrl('Shop')} className="text-stone-600 hover:text-emerald-700 transition-colors font-medium">
              Shop All
            </Link>
            <Link to={createPageUrl('About')} className="text-emerald-700 font-medium">
              Our Mission
            </Link>
          </nav>
          <Link to={createPageUrl('Shop')}>
            <Button variant="outline" className="rounded-full border-stone-200">
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-stone-800 mb-6">
            For the Simple Living Folks
          </h1>
          <p className="text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto">
            A marketplace built for homesteaders, hippies, nature lovers, and anyone 
            seeking affordable essentials for a more self-sufficient life.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">Community Driven</h3>
                  <p className="text-stone-600">
                    We believe in people helping people. Every purchase supports folks 
                    who share your values of simple, sustainable living.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">Low Fees, Fair Prices</h3>
                  <p className="text-stone-600">
                    With just a 3% platform fee, more money stays where it belongs — 
                    supporting the community and keeping prices affordable.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-rose-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">For the Eccentric & Free</h3>
                  <p className="text-stone-600">
                    Whether you're living off-grid, tending animals, or just trying to 
                    live a little lighter on the earth — this place is for you.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600" 
                alt="Countryside"
                className="rounded-3xl shadow-xl w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What We Sell */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-stone-800 mb-6">What You'll Find Here</h2>
          <p className="text-lg text-stone-600 mb-12 max-w-2xl mx-auto">
            Everyday essentials that aren't always easy to find. Practical goods for 
            people who do things themselves.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Homesteading Supplies",
              "Gardening Tools", 
              "Animal Care",
              "Handmade Goods",
              "Survival Gear",
              "Eco-Friendly Products",
              "Home Improvement",
              "Wellness Items"
            ].map(tag => (
              <span key={tag} className="px-4 py-2 bg-white rounded-full text-stone-700 shadow-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-700 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start Shopping
          </h2>
          <p className="text-emerald-100 text-lg mb-8">
            Find what you need for a simpler, more self-sufficient life.
          </p>
          <Link to={createPageUrl('Shop')}>
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-stone-100 rounded-full px-8 h-14 text-lg">
              Browse Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-800 text-stone-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">EarthGoods</span>
          </div>
          <p className="text-sm">Made with love for simple living folks everywhere.</p>
        </div>
      </footer>
    </div>
  );
}