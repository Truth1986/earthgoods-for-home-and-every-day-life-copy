import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Star, TrendingUp, History, Zap, Crown, AlertCircle } from "lucide-react";
import { toast } from 'sonner';
import moment from 'moment';

const tierConfig = {
  bronze: { icon: '🥉', color: 'bg-amber-100 text-amber-800', label: 'Bronze' },
  silver: { icon: '🥈', color: 'bg-slate-100 text-slate-800', label: 'Silver' },
  gold: { icon: '🥇', color: 'bg-yellow-100 text-yellow-800', label: 'Gold' },
  platinum: { icon: '👑', color: 'bg-purple-100 text-purple-800', label: 'Platinum' }
};

const pointMilestones = [
  { points: 500, tier: 'silver', bonus: '5% off purchases' },
  { points: 2000, tier: 'gold', bonus: '10% off purchases' },
  { points: 5000, tier: 'platinum', bonus: '15% off + free shipping' }
];

export default function LoyaltyRewards({ userEmail }) {
  const [showHistory, setShowHistory] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const { data: loyalty, isLoading, refetch } = useQuery({
    queryKey: ['loyalty-points', userEmail],
    queryFn: async () => {
      const results = await base44.entities.LoyaltyPoints.filter({ customer_email: userEmail });
      return results[0] || null;
    },
    enabled: !!userEmail,
  });

  const handleRedeemPoints = async (pointsToRedeem) => {
    if (!loyalty || loyalty.available_points < pointsToRedeem) {
      toast.error('Not enough points to redeem');
      return;
    }

    setRedeeming(true);
    try {
      const discountAmount = pointsToRedeem / 10; // 10 points = $1
      const newHistory = [...(loyalty.points_history || []), {
        type: 'redeemed',
        points: pointsToRedeem,
        description: `Redeemed ${pointsToRedeem} points for $${discountAmount.toFixed(2)} discount`,
        date: new Date().toISOString()
      }];

      await base44.entities.LoyaltyPoints.update(loyalty.id, {
        available_points: loyalty.available_points - pointsToRedeem,
        redeemed_points: (loyalty.redeemed_points || 0) + pointsToRedeem,
        points_history: newHistory
      });

      toast.success(`Redeemed ${pointsToRedeem} points! Use code REWARDS${pointsToRedeem} at checkout.`);
      refetch();
    } catch (error) {
      toast.error('Failed to redeem points');
      console.error(error);
    } finally {
      setRedeeming(false);
    }
  };

  const progressToNextTier = () => {
    if (!loyalty) return 0;
    const currentTotal = loyalty.total_points || 0;
    
    for (let milestone of pointMilestones) {
      if (currentTotal < milestone.points) {
        return {
          next: milestone.tier,
          needed: milestone.points - currentTotal,
          total: milestone.points
        };
      }
    }
    return null;
  };

  const nextTier = progressToNextTier();
  const config = loyalty ? tierConfig[loyalty.tier] : tierConfig.bronze;

  if (isLoading) {
    return <div className="animate-pulse h-40 bg-stone-200 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Main Points Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-700 mb-1">
                {loyalty?.available_points || 0}
              </div>
              <p className="text-xs text-stone-600">Available Points</p>
            </div>
            <div className="text-center border-l border-r border-stone-200">
              <div className="text-3xl font-bold text-blue-700 mb-1">
                {loyalty?.total_points || 0}
              </div>
              <p className="text-xs text-stone-600">Total Earned</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-1">{config.icon}</div>
              <p className="text-xs font-semibold text-stone-700">{config.label}</p>
            </div>
          </div>

          {/* Tier Progress */}
          {nextTier && (
            <div className="bg-white rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-700">
                  {nextTier.needed} points to {tierConfig[nextTier.next].label}
                </span>
                <span className="text-xs text-stone-500">
                  {Math.round(((nextTier.total - nextTier.needed) / nextTier.total) * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all"
                  style={{ width: `${((nextTier.total - nextTier.needed) / nextTier.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-stone-600 mt-2">
                Unlock {tierConfig[nextTier.next].label} status: {pointMilestones.find(m => m.tier === nextTier.next)?.bonus}
              </p>
            </div>
          )}

          {/* Redeem Options */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-stone-700">Quick Redeem (10 pts = $1):</p>
            <div className="grid grid-cols-2 gap-2">
              {[100, 250].map(pts => (
                <Button
                  key={pts}
                  size="sm"
                  variant="outline"
                  onClick={() => handleRedeemPoints(pts)}
                  disabled={redeeming || (loyalty?.available_points || 0) < pts}
                  className="text-xs rounded-lg h-8"
                >
                  {pts} pts = ${(pts / 10).toFixed(2)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-600" />
            Current Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loyalty?.tier === 'platinum' && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-purple-700">
                <Zap className="w-4 h-4" />
                <span>15% off all purchases</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <Gift className="w-4 h-4" />
                <span>Free shipping on all orders</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <Star className="w-4 h-4" />
                <span>Early access to new products</span>
              </div>
            </div>
          ) : loyalty?.tier === 'gold' ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-yellow-700">
                <Zap className="w-4 h-4" />
                <span>10% off all purchases</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-700">
                <Gift className="w-4 h-4" />
                <span>Free shipping on orders over $50</span>
              </div>
            </div>
          ) : loyalty?.tier === 'silver' ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Zap className="w-4 h-4" />
                <span>5% off all purchases</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Gift className="w-4 h-4" />
                <span>Member exclusive deals</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-stone-600">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Earn points on every purchase</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                <span>Reach Silver tier at 500 points</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Toggle */}
      <Button
        variant="outline"
        className="w-full rounded-lg gap-2"
        onClick={() => setShowHistory(!showHistory)}
      >
        <History className="w-4 h-4" />
        {showHistory ? 'Hide' : 'Show'} Transaction History
      </Button>

      {/* History */}
      {showHistory && loyalty?.points_history && loyalty.points_history.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...loyalty.points_history].reverse().map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium text-stone-800">{tx.description}</p>
                    <p className="text-xs text-stone-500">{moment(tx.date).fromNow()}</p>
                  </div>
                  <div className={`font-semibold ${tx.type === 'earned' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {tx.type === 'earned' ? '+' : '-'}{tx.points}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}