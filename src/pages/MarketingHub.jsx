import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Mail, Users, Share2, TrendingUp, 
  Download, Gift, Calendar, Megaphone
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from 'moment';

export default function MarketingHub() {
  const { data: subscribers = [], isLoading: subsLoading } = useQuery({
    queryKey: ['email-subscribers'],
    queryFn: () => base44.entities.EmailSubscriber.list('-created_date', 500),
  });

  const { data: referralCodes = [] } = useQuery({
    queryKey: ['all-referral-codes'],
    queryFn: () => base44.entities.ReferralCode.list('-uses_count'),
  });

  const activeSubscribers = subscribers.filter(s => s.is_active);
  const totalReferrals = referralCodes.reduce((sum, r) => sum + (r.uses_count || 0), 0);

  const sourceBreakdown = subscribers.reduce((acc, s) => {
    acc[s.source || 'unknown'] = (acc[s.source || 'unknown'] || 0) + 1;
    return acc;
  }, {});

  const sourceLabels = {
    homepage_popup: 'Homepage Popup',
    checkout: 'Checkout',
    blog: 'Blog',
    footer: 'Footer',
    referral: 'Referral',
    unknown: 'Unknown',
  };

  const exportCSV = () => {
    const headers = ['Email', 'Name', 'Source', 'Date', 'Active'];
    const rows = subscribers.map(s => [
      s.email, s.name || '', s.source || '', 
      moment(s.created_date).format('YYYY-MM-DD'),
      s.is_active ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earthgoods-subscribers-${moment().format('YYYY-MM-DD')}.csv`;
    a.click();
  };

  const socialTemplates = [
    {
      platform: 'Facebook',
      category: 'Product Launch',
      text: `🌿 New arrivals at EarthGoods! Quality tools and essentials for homesteaders and sustainable living enthusiasts. Simple living shouldn't mean compromising on quality. Shop now 👇\n\n#homesteading #sustainableliving #simpleLiving #earthgoods`,
    },
    {
      platform: 'Instagram',
      category: 'Community',
      text: `Living simply is a choice worth making 🌱\n\nWe curate the best tools, supplies, and essentials for folks who love the land and live with intention.\n\nShop the link in bio ✨\n\n#homestead #offgrid #sustainableliving #backtobasics #simplicity #farmlife`,
    },
    {
      platform: 'Reddit',
      category: 'r/homesteading',
      text: `Hey everyone! I've been building a marketplace specifically for homesteading and sustainable living goods with a super low 3% fee (vs the 10-15% on other platforms). Would love feedback from this community — what products do you wish you could find more easily?`,
    },
    {
      platform: 'Pinterest',
      category: 'Pin Description',
      text: `Simple living essentials for homesteaders, nature lovers, and eco-conscious families. Find quality tools for gardening, animal care, DIY projects, and sustainable living at affordable prices.`,
    },
    {
      platform: 'Facebook Group',
      category: 'Community Post',
      text: `Fellow homesteaders! 🏡 Looking for a marketplace that actually gets us? EarthGoods is built specifically for our community — low fees, quality products, and only 3% platform fee so sellers can keep more of what they earn. Check it out and let me know what you think!`,
    },
  ];

  const [copiedIdx, setCopiedIdx] = useState(null);
  const copyTemplate = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-amber-50/30">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-stone-800">Marketing Hub</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-stone-200">
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
              <p className="text-3xl font-bold text-stone-800">{activeSubscribers.length}</p>
              <p className="text-sm text-stone-500 mt-1">Email Subscribers</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-stone-200">
            <CardContent className="p-6 text-center">
              <Gift className="w-8 h-8 mx-auto text-amber-600 mb-2" />
              <p className="text-3xl font-bold text-stone-800">{referralCodes.length}</p>
              <p className="text-sm text-stone-500 mt-1">Referral Codes</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-stone-200">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto text-purple-600 mb-2" />
              <p className="text-3xl font-bold text-stone-800">{totalReferrals}</p>
              <p className="text-sm text-stone-500 mt-1">Referral Uses</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-stone-200">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto text-rose-600 mb-2" />
              <p className="text-3xl font-bold text-stone-800">
                {subscribers.length > 0 ? Math.round((activeSubscribers.length / subscribers.length) * 100) : 0}%
              </p>
              <p className="text-sm text-stone-500 mt-1">Active Rate</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="subscribers" className="space-y-6">
          <TabsList className="bg-white border border-stone-200 p-1 rounded-full">
            <TabsTrigger value="subscribers" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Mail className="w-4 h-4 mr-2" /> Subscribers
            </TabsTrigger>
            <TabsTrigger value="referrals" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Gift className="w-4 h-4 mr-2" /> Referrals
            </TabsTrigger>
            <TabsTrigger value="social" className="rounded-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Share2 className="w-4 h-4 mr-2" /> Social Templates
            </TabsTrigger>
          </TabsList>

          {/* Subscribers */}
          <TabsContent value="subscribers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-stone-800">Email List</h3>
                <p className="text-sm text-stone-500">{activeSubscribers.length} active subscribers</p>
              </div>
              <Button onClick={exportCSV} variant="outline" className="rounded-full">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Source breakdown */}
            <div className="grid sm:grid-cols-3 gap-4">
              {Object.entries(sourceBreakdown).map(([source, count]) => (
                <Card key={source} className="bg-white border-stone-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="text-sm text-stone-600">{sourceLabels[source] || source}</span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">{count}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Subscriber list */}
            <Card className="bg-white border-stone-200">
              <CardContent className="p-0">
                {subsLoading ? (
                  <div className="p-8 text-center text-stone-400">Loading...</div>
                ) : subscribers.length === 0 ? (
                  <div className="p-12 text-center text-stone-400">
                    <Mail className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                    <p>No subscribers yet. The popup and footer form will start collecting emails automatically.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {subscribers.slice(0, 50).map(sub => (
                      <div key={sub.id} className="px-6 py-3 flex items-center justify-between hover:bg-stone-50">
                        <div>
                          <p className="font-medium text-stone-800">{sub.email}</p>
                          {sub.name && <p className="text-sm text-stone-500">{sub.name}</p>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-400">
                          <Badge variant="outline">{sourceLabels[sub.source] || sub.source || 'unknown'}</Badge>
                          <span>{moment(sub.created_date).format('MMM DD, YYYY')}</span>
                        </div>
                      </div>
                    ))}
                    {subscribers.length > 50 && (
                      <div className="px-6 py-3 text-center text-sm text-stone-500">
                        Showing 50 of {subscribers.length} — export CSV to see all
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals */}
          <TabsContent value="referrals" className="space-y-6">
            <Card className="bg-white border-stone-200">
              <CardHeader>
                <CardTitle className="text-lg">Active Referral Codes</CardTitle>
                <CardDescription>Customers who have generated referral links</CardDescription>
              </CardHeader>
              <CardContent>
                {referralCodes.length === 0 ? (
                  <div className="py-12 text-center text-stone-400">
                    <Gift className="w-12 h-12 mx-auto mb-3 text-stone-300" />
                    <p>No referral codes yet. Users generate these from their Customer Dashboard.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referralCodes.map(code => (
                      <div key={code.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                        <div>
                          <p className="font-bold text-emerald-700 tracking-widest">{code.code}</p>
                          <p className="text-sm text-stone-600">{code.referrer_name || code.referrer_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-stone-800">{code.uses_count || 0} uses</p>
                          <p className="text-xs text-stone-500">{code.discount_percent}% discount</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Templates */}
          <TabsContent value="social" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-stone-800 mb-1">Ready-to-Post Templates</h3>
              <p className="text-sm text-stone-500 mb-6">Copy these and paste directly into your social media posts. Customize as needed!</p>
            </div>
            {socialTemplates.map((t, idx) => (
              <Card key={idx} className="bg-white border-stone-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-stone-100 text-stone-700 border-0">{t.platform}</Badge>
                      <span className="text-xs text-stone-500">{t.category}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => copyTemplate(t.text, idx)}
                    >
                      {copiedIdx === idx ? '✓ Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed bg-stone-50 rounded-xl p-4">
                    {t.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}