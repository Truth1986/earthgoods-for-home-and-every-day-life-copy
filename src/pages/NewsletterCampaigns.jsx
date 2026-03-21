import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Mail, Users, Send, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function NewsletterCampaigns() {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [sentCount, setSentCount] = useState(0);

    const { data: subscribers = [] } = useQuery({
        queryKey: ['subscribers-active'],
        queryFn: () => base44.entities.EmailSubscriber.filter({ is_active: true }),
    });

    const handleSend = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !body.trim()) return;
        if (subscribers.length === 0) {
            toast.error('No active subscribers to send to.');
            return;
        }

        setSending(true);
        let count = 0;
        for (const sub of subscribers) {
            await base44.integrations.Core.SendEmail({
                to: sub.email,
                from_name: 'EarthGoods',
                subject: subject.trim(),
                body: `Hi ${sub.name || 'there'},\n\n${body.trim()}\n\n—\nEarthGoods Newsletter\nTo unsubscribe, reply with "unsubscribe".`
            });
            count++;
        }
        setSentCount(count);
        setSent(true);
        setSending(false);
        toast.success(`Newsletter sent to ${count} subscribers!`);
    };

    const templates = [
        {
            label: '🌱 Spring Sale',
            subject: '🌱 Spring is here — shop our seasonal picks!',
            body: `Spring has finally arrived and we're celebrating with some of our favorite seasonal finds!\n\nFrom garden seeds to herbal remedies, we've got everything you need to embrace the season.\n\n👉 Shop now: earthgoods.app/Shop\n\nHappy growing,\nThe EarthGoods Team`
        },
        {
            label: '🎁 New Products',
            subject: '✨ New arrivals just landed at EarthGoods!',
            body: `We've been busy adding incredible new products to our shop and we think you're going to love them.\n\nCheck out our latest additions — from homesteading tools to natural wellness products.\n\n👉 See what's new: earthgoods.app/Shop\n\nWith gratitude,\nThe EarthGoods Team`
        },
        {
            label: '💌 Thank You',
            subject: '💚 Thank you for being part of our community',
            body: `We just wanted to take a moment to say THANK YOU.\n\nEvery purchase you make supports sustainable living and independent homesteaders. You're making a real difference.\n\nAs a token of appreciation, use code THANKYOU10 at checkout for 10% off your next order.\n\n👉 Shop now: earthgoods.app/Shop\n\nWith so much gratitude,\nThe EarthGoods Team`
        },
    ];

    return (
        <div className="min-h-screen bg-stone-50">
            <header className="bg-white border-b border-stone-200">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/AdminDashboard">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center">
                                <Leaf className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-stone-800">Newsletter Campaigns</span>
                        </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-0">
                        <Users className="w-3 h-3 mr-1" />
                        {subscribers.length} active subscribers
                    </Badge>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6">
                {/* Compose */}
                <div className="md:col-span-2">
                    {sent ? (
                        <Card className="border-0 shadow-sm">
                            <CardContent className="py-16 text-center">
                                <CheckCircle className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
                                <h2 className="text-2xl font-bold text-stone-800 mb-2">Campaign Sent!</h2>
                                <p className="text-stone-500 mb-6">Your newsletter was delivered to {sentCount} subscribers.</p>
                                <Button onClick={() => { setSent(false); setSubject(''); setBody(''); }} className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
                                    Send Another
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-emerald-600" />
                                    Compose Newsletter
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSend} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Subject Line *</Label>
                                        <Input
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="e.g. 🌱 Spring Picks Just Dropped!"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Message Body *</Label>
                                        <Textarea
                                            value={body}
                                            onChange={(e) => setBody(e.target.value)}
                                            placeholder="Write your newsletter content here..."
                                            rows={12}
                                            required
                                            className="resize-none font-mono text-sm"
                                        />
                                        <p className="text-xs text-stone-400">Your subscriber's name and unsubscribe footer will be added automatically.</p>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={sending || subscribers.length === 0}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-full h-12"
                                    >
                                        {sending ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending to {subscribers.length} subscribers...</>
                                        ) : (
                                            <><Send className="w-4 h-4 mr-2" />Send to {subscribers.length} Subscribers</>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Templates */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-stone-700">Quick Templates</h3>
                    {templates.map((t, i) => (
                        <Card
                            key={i}
                            className="border border-stone-200 shadow-sm cursor-pointer hover:border-emerald-400 transition-colors"
                            onClick={() => { setSubject(t.subject); setBody(t.body); }}
                        >
                            <CardContent className="p-4">
                                <p className="font-medium text-stone-800 text-sm mb-1">{t.label}</p>
                                <p className="text-xs text-stone-500 line-clamp-2">{t.subject}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}