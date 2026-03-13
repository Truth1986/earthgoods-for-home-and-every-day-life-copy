import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, AlertCircle, Plus, Trash2, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import moment from 'moment';

export default function OwnerProfitView({ totalRevenue }) {
  const queryClient = useQueryClient();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'operations',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paid_to: '',
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.CompanyExpense.list('-date'),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.CompanyExpense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowAddExpense(false);
      setExpenseForm({
        category: 'operations',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paid_to: '',
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyExpense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createExpenseMutation.mutate({
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
    });
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const platformFees = totalRevenue * 0.03; // 3% platform fee
  const netProfit = totalRevenue - totalExpenses - platformFees;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const categoryLabels = {
    payroll: 'Payroll',
    taxes: 'Taxes',
    marketing: 'Marketing & Promotion',
    operations: 'Operations',
    shipping: 'Shipping & Fulfillment',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900 mb-1">Owner-Only Access</p>
            <p className="text-sm text-amber-700">
              This section contains sensitive financial information. Only admin users can view profit calculations and expense records.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profit Summary */}
      <div className="grid sm:grid-cols-4 gap-6">
        <Card className="bg-white border-stone-200">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
            <p className="text-3xl font-bold text-emerald-700">${totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-stone-500 mt-1">Gross Revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-stone-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-red-600 mb-2" />
            <p className="text-3xl font-bold text-red-700">${totalExpenses.toFixed(2)}</p>
            <p className="text-sm text-stone-500 mt-1">Total Expenses</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-stone-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 mx-auto text-amber-600 mb-2" />
            <p className="text-3xl font-bold text-amber-700">${platformFees.toFixed(2)}</p>
            <p className="text-sm text-stone-500 mt-1">Platform Fees (3%)</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-white mb-2" />
            <p className="text-3xl font-bold text-white">${netProfit.toFixed(2)}</p>
            <p className="text-sm text-emerald-100 mt-1">Net Profit ({profitMargin}% margin)</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Breakdown */}
      <Card className="bg-white border-stone-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Expenses Breakdown</CardTitle>
              <CardDescription>Company expenses by category</CardDescription>
            </div>
            <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({...expenseForm, category: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <Input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Paid To</label>
                    <Input
                      value={expenseForm.paid_to}
                      onChange={(e) => setExpenseForm({...expenseForm, paid_to: e.target.value})}
                      placeholder="Vendor or recipient"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Textarea
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setShowAddExpense(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createExpenseMutation.isPending}>
                      {createExpenseMutation.isPending ? 'Adding...' : 'Add Expense'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {Object.entries(expensesByCategory).map(([category, amount]) => (
              <div key={category} className="p-4 bg-stone-50 rounded-lg">
                <p className="text-sm text-stone-600 mb-1">{categoryLabels[category]}</p>
                <p className="text-2xl font-bold text-stone-800">${amount.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {expenses.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-semibold text-stone-700 mb-3">Recent Expenses</h4>
              {expenses.slice(0, 10).map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-stone-200 text-stone-700 border-0">
                        {categoryLabels[expense.category]}
                      </Badge>
                      {expense.paid_to && (
                        <span className="text-xs text-stone-500">→ {expense.paid_to}</span>
                      )}
                    </div>
                    <p className="text-sm text-stone-600">{expense.description || 'No description'}</p>
                    <p className="text-xs text-stone-400">{moment(expense.date).format('MMM DD, YYYY')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-red-700">${expense.amount.toFixed(2)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteExpenseMutation.mutate(expense.id)}
                      className="text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-stone-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-stone-300" />
              <p>No expenses recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}