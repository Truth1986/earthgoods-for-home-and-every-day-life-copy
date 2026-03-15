import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gift, Copy, Check, Users, Link2, Sparkles } from "lucide-react";
import { toast } from "sonner";

function generateCode(name) {
  const base = name ? name.toUpperCase().replace(/\s+/g, '').slice(0, 6) : 'EARTH';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

export default function ReferralWidget({ user }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data: myCode } = useQuery({
    queryKey: ['my-referral-code', user?.email],
    queryFn: async () => {
      const results = await base44.entities.ReferralCode.filter({ referrer_email: user.email });
      return results[0] || null;
    },
    enabled: !!user?.email,
  });

  const createCode = useMutation({
    mutationFn: () => base44.entities.ReferralCode.create({
      code: generateCode(user?.full_name),
      referrer_email: user.email,
      referrer_name: user?.full_name || '',
      uses_count: 0,
      discount_percent: 10,
      is_active: true,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-referral-code', user?.email] }),
  });

  const referralLink = myCode
    ? `${window.location.origin}?ref=${myCode.code}`
    : null;

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-amber-50 border-emerald-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-emerald-600" />
          Refer Friends & Earn
        </CardTitle>
        <CardDescription>
          Share your unique link. Your friends get <strong>10% off</strong> their first order.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* How it works */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: Link2, label: 'Share your link', color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { icon: Users, label: 'Friend shops', color: 'text-amber-600', bg: 'bg-amber-100' },
            { icon: Sparkles, label: 'Both benefit', color: 'text-purple-600', bg: 'bg-purple-100' },
          ].map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="text-xs text-stone-600 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {myCode ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                readOnly
                value={referralLink}
                className="text-sm bg-white rounded-full"
              />
              <Button
                onClick={copyLink}
                className={`rounded-full px-4 flex-shrink-0 ${copied ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex justify-between text-sm bg-white rounded-xl p-3 border border-stone-200">
              <span className="text-stone-600">Your code:</span>
              <span className="font-bold text-emerald-700 tracking-widest">{myCode.code}</span>
            </div>
            <div className="flex justify-between text-sm bg-white rounded-xl p-3 border border-stone-200">
              <span className="text-stone-600">Times used:</span>
              <span className="font-bold text-stone-800">{myCode.uses_count || 0} friends</span>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => createCode.mutate()}
            disabled={createCode.isPending || !user}
            className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-full"
          >
            <Gift className="w-4 h-4 mr-2" />
            {createCode.isPending ? 'Creating...' : 'Generate My Referral Link'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}