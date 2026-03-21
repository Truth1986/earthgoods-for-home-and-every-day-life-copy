import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, BarChart3, TrendingUp, Users, DollarSign, ArrowLeft, RefreshCw, AlertCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const NEWSLETTER_MEDIUMS = ['email', 'newsletter', 'campaign'];
const NEWSLETTER_SOURCES = ['mailchimp', 'newsletter', 'email', 'sendinblue', 'klaviyo', 'campaign'];

function isNewsletter(source, medium) {
  const s = source?.toLowerCase() || '';
  const m = medium?.toLowerCase() || '';
  return NEWSLETTER_MEDIUMS.some(k => m.includes(k)) || NEWSLETTER_SOURCES.some(k => s.includes(k));
}

function ConversionRate({ conversions, sessions }) {
  if (!sessions) return <span className="text-stone-400">—</span>;
  const rate = ((conversions / sessions) * 100).toFixed(2);
  return <span className={parseFloat(rate) > 2 ? 'text-emerald-600 font-bold' : 'text-stone-700'}>{rate}%</span>;
}

const COLORS = ['#059669', '#d97706', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

export default function NewsletterAnalytics() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['ga-conversions'],
    queryFn: () => base44.functions.invoke('getAnalyticsConversions', {}),
    retry: false,
  });

  const rows = data?.data?.rows || [];
  const propertyName = data?.data?.propertyName || '';

  const newsletterRows = rows.filter(r => isNewsletter(r.source, r.medium));
  const otherRows = rows.filter(r => !isNewsletter(r.source, r.medium));

  const totalNewsletter = newsletterRows.reduce((a, r) => ({
    sessions: a.sessions + r.sessions,
    conversions: a.conversions + r.conversions,
    revenue: a.revenue + r.revenue,
  }), { sessions: 0, conversions: 0, revenue: 0 });

  const totalOther = otherRows.reduce((a, r) => ({
    sessions: a.sessions + r.sessions,
    conversions: a.conversions + r.conversions,
    revenue: a.revenue + r.revenue,
  }), { sessions: 0, conversions: 0, revenue: 0 });

  const comparisonData = [
    {
      name: 'Newsletter/Email',
      Sessions: totalNewsletter.sessions,
      Conversions: totalNewsletter.conversions,
      Revenue: parseFloat(totalNewsletter.revenue.toFixed(2)),
    },
    {
      name: 'Other Sources',
      Sessions: totalOther.sessions,
      Conversions: totalOther.conversions,
      Revenue: parseFloat(totalOther.revenue.toFixed(2)),
    },
  ];

  // Pie chart: session share
  const pieData = rows.slice(0, 8).map(r => ({
    name: `${r.source} / ${r.medium}`,
    value: r.sessions,
  }));

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-stone-800">EarthGoods</span>
              <span className="ml-2 text-sm text-stone-500">Newsletter Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="rounded-full">
              <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/AdminDashboard">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-800">Newsletter Campaign Conversion Rates</h1>
          {propertyName && <p className="text-stone-500 text-sm mt-1">GA4 Property: {propertyName} · Last 30 days</p>}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="ml-3 text-stone-600">Loading Google Analytics data...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Could not load analytics data</p>
              <p className="text-sm text-red-600 mt-1">{data?.data?.error || error.message}</p>
              <p className="text-xs text-red-500 mt-2">Make sure your Google account has access to a GA4 property.</p>
            </div>
          </div>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
            <BarChart3 className="w-16 h-16 mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-semibold text-stone-700 mb-2">No data available</h3>
            <p className="text-stone-500 text-sm">No sessions found in the last 30 days, or your GA property has no traffic data yet.</p>
          </div>
        )}

        {!isLoading && rows.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Newsletter Sessions</p>
                      <p className="text-xl font-bold">{totalNewsletter.sessions.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Newsletter Conv. Rate</p>
                      <p className="text-xl font-bold">
                        {totalNewsletter.sessions
                          ? ((totalNewsletter.conversions / totalNewsletter.sessions) * 100).toFixed(2) + '%'
                          : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Other Sources Conv. Rate</p>
                      <p className="text-xl font-bold">
                        {totalOther.sessions
                          ? ((totalOther.conversions / totalOther.sessions) * 100).toFixed(2) + '%'
                          : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-purple-700" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Newsletter Revenue</p>
                      <p className="text-xl font-bold">${totalNewsletter.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Sessions & Conversions: Newsletter vs Other</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Sessions" fill="#059669" radius={[4,4,0,0]} />
                      <Bar dataKey="Conversions" fill="#d97706" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Session Share by Source / Medium</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => v.toLocaleString() + ' sessions'} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">All Traffic Sources — Conversion Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-500 text-left">
                      <th className="pb-3 pr-4 font-medium">Source</th>
                      <th className="pb-3 pr-4 font-medium">Medium</th>
                      <th className="pb-3 pr-4 font-medium text-right">Sessions</th>
                      <th className="pb-3 pr-4 font-medium text-right">Conversions</th>
                      <th className="pb-3 pr-4 font-medium text-right">Conv. Rate</th>
                      <th className="pb-3 font-medium text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={`border-b border-stone-50 ${isNewsletter(r.source, r.medium) ? 'bg-emerald-50/50' : ''}`}>
                        <td className="py-3 pr-4 font-medium text-stone-800">
                          {r.source}
                          {isNewsletter(r.source, r.medium) && (
                            <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-0 text-xs">newsletter</Badge>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-stone-500">{r.medium}</td>
                        <td className="py-3 pr-4 text-right">{r.sessions.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-right">{r.conversions.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-right">
                          <ConversionRate conversions={r.conversions} sessions={r.sessions} />
                        </td>
                        <td className="py-3 text-right">${r.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}