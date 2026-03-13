import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfileEditor({ user }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
  });
  const [saved, setSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      setSaved(true);
      toast.success('Profile updated successfully!');
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl">
      <Card className="bg-white border-stone-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-600" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Your full name"
                required
                className="text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-stone-50 text-stone-500 text-base"
                />
                <Mail className="absolute right-3 top-3 w-5 h-5 text-stone-400" />
              </div>
              <p className="text-xs text-stone-500 mt-1">Email cannot be changed</p>
            </div>

            <div className="pt-4 border-t border-stone-200">
              <Button
                type="submit"
                disabled={updateMutation.isPending || saved}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-8"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="bg-white border-stone-200 mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-stone-100">
            <span className="text-stone-600">Account Status</span>
            <span className="font-medium text-emerald-700">Active</span>
          </div>
          <div className="flex justify-between py-2 border-b border-stone-100">
            <span className="text-stone-600">Member Since</span>
            <span className="font-medium text-stone-800">
              {user?.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-stone-600">User Role</span>
            <span className="font-medium text-stone-800 capitalize">{user?.role || 'User'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}