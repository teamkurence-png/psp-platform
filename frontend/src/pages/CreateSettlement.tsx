import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import type { Balance } from '../types/index';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { ArrowLeft } from 'lucide-react';

const CreateSettlement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    method: 'bank_transfer' as 'bank_transfer' | 'crypto',
    destination: '',
  });

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await api.get('/balances');
      setBalance(response.data.data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!balance || amount > balance.available) {
      alert('Insufficient available balance');
      return;
    }

    if (!formData.destination) {
      alert('Please enter destination details');
      return;
    }

    try {
      setLoading(true);
      await api.post('/settlements', {
        amount,
        currency: balance.currency,
        method: formData.method,
        destination: formData.destination,
      });
      alert('Settlement request created successfully!');
      navigate('/settlements');
    } catch (error: any) {
      console.error('Failed to create settlement:', error);
      alert(error.response?.data?.error || 'Failed to create settlement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/settlements">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Request Settlement</h1>
          <p className="text-muted-foreground">Withdraw funds from your available balance</p>
        </div>
      </div>

      {/* Balance Info */}
      {balance && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-900 font-medium">Available Balance</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {formatCurrency(balance.available, balance.currency)}
                </p>
              </div>
              {balance.pending > 0 && (
                <div className="text-right">
                  <p className="text-sm text-blue-700">Pending</p>
                  <p className="text-lg font-semibold text-blue-800">
                    {formatCurrency(balance.pending, balance.currency)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settlement Form */}
      <Card>
        <CardHeader>
          <CardTitle>Settlement Details</CardTitle>
          <CardDescription>Enter the details for your settlement request</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
              {balance && (
                <p className="text-sm text-muted-foreground mt-1">
                  Maximum: {formatCurrency(balance.available, balance.currency)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="method">Settlement Method *</Label>
              <select
                id="method"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-2"
                required
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>

            <div>
              <Label htmlFor="destination">
                {formData.method === 'bank_transfer' ? 'Bank Account / IBAN' : 'Crypto Address'} *
              </Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder={
                  formData.method === 'bank_transfer' 
                    ? 'Enter your bank account or IBAN' 
                    : 'Enter your crypto wallet address'
                }
                required
              />
              {formData.method === 'crypto' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Please double-check your wallet address. Transactions cannot be reversed.
                </p>
              )}
            </div>

            {formData.method === 'bank_transfer' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  <strong>Note:</strong> Bank transfers typically take 1-3 business days to process.
                  Please ensure your bank account details are correct.
                </p>
              </div>
            )}

            {formData.method === 'crypto' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  <strong>Important:</strong> Crypto settlements are final and cannot be reversed.
                  Please verify your wallet address carefully.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Submit Settlement Request'}
              </Button>
              <Link to="/settlements">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateSettlement;

