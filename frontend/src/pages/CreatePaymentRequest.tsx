import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { ArrowLeft } from 'lucide-react';
import { PaymentMethod, BankRail } from '../types/index';
import api from '../lib/api';

const CreatePaymentRequest: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    description: '',
    invoiceNumber: '',
    dueDate: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCountry: '',
    paymentMethods: [] as PaymentMethod[],
    bankRails: [] as BankRail[],
    require3DS: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
        invoiceNumber: formData.invoiceNumber,
        dueDate: formData.dueDate || undefined,
        customerInfo: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
          billingCountry: formData.customerCountry,
        },
        paymentMethods: formData.paymentMethods,
        bankDetails: formData.paymentMethods.includes(PaymentMethod.BANK_WIRE)
          ? { rails: formData.bankRails }
          : undefined,
        cardSettings: formData.paymentMethods.includes(PaymentMethod.CARD)
          ? { require3DS: formData.require3DS }
          : undefined,
      };

      await api.post('/payment-requests', payload);
      navigate('/payment-requests');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create payment request');
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = (method: PaymentMethod) => {
    setFormData((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter((m) => m !== method)
        : [...prev.paymentMethods, method],
    }));
  };

  const toggleBankRail = (rail: BankRail) => {
    setFormData((prev) => ({
      ...prev,
      bankRails: prev.bankRails.includes(rail)
        ? prev.bankRails.filter((r) => r !== rail)
        : [...prev.bankRails, rail],
    }));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate('/payment-requests')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Payment Requests
        </Button>
        <h1 className="text-3xl font-bold">Create Payment Request</h1>
        <p className="text-muted-foreground">Generate a payment link or bank transfer details for your customer</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Basic information about this payment request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Optional but recommended for tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerCountry">Billing Country</Label>
              <Input
                id="customerCountry"
                value={formData.customerCountry}
                onChange={(e) => setFormData({ ...formData, customerCountry: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods *</CardTitle>
            <CardDescription>Select which payment methods to allow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paymentMethods.includes(PaymentMethod.BANK_WIRE)}
                  onChange={() => togglePaymentMethod(PaymentMethod.BANK_WIRE)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="font-medium">Bank Wire Transfer</span>
              </label>

              {formData.paymentMethods.includes(PaymentMethod.BANK_WIRE) && (
                <div className="ml-7 space-y-2 border-l-2 pl-4">
                  <Label>Select Rails</Label>
                  <div className="space-y-2">
                    {Object.values(BankRail).map((rail) => (
                      <label key={rail} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.bankRails.includes(rail)}
                          onChange={() => toggleBankRail(rail)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm uppercase">{rail}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paymentMethods.includes(PaymentMethod.CARD)}
                  onChange={() => togglePaymentMethod(PaymentMethod.CARD)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="font-medium">Card Payment</span>
              </label>

              {formData.paymentMethods.includes(PaymentMethod.CARD) && (
                <div className="ml-7 space-y-2 border-l-2 pl-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.require3DS}
                      onChange={(e) => setFormData({ ...formData, require3DS: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Require 3D Secure</span>
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/payment-requests')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || formData.paymentMethods.length === 0}>
            {loading ? 'Creating...' : 'Create Payment Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePaymentRequest;

