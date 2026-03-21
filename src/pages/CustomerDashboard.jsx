import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, User, MapPin, ShoppingBag, ArrowLeft, Gift, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OrderHistory from "@/components/dashboard/OrderHistory";
import OrderTracking from "@/components/dashboard/OrderTracking";
import AddressManager from "@/components/dashboard/AddressManager";
import ProfileEditor from "@/components/dashboard/ProfileEditor";
import ReferralWidget from "@/components/marketing/ReferralWidget";

export default function CustomerDashboard() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-800">EarthGoods</span>
          </Link>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-800 mb-2">
            Welcome back, {user?.full_name || 'Customer'}!
          </h1>
          <p className="text-stone-600">Manage your orders, addresses, and account settings</p>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-white border border-stone-200 p-1 rounded-full flex-wrap gap-1">
            <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="tracking" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Truck className="w-4 h-4 mr-2" />
              Track Orders
            </TabsTrigger>
            <TabsTrigger value="addresses" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <MapPin className="w-4 h-4 mr-2" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="referrals" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Gift className="w-4 h-4 mr-2" />
              Referrals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrderHistory />
          </TabsContent>

          <TabsContent value="tracking">
            <OrderTracking />
          </TabsContent>

          <TabsContent value="addresses">
            <AddressManager />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileEditor user={user} />
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralWidget user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}