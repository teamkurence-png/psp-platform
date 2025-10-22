import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import type { Balance } from '../types/index';
import { CryptoAsset } from '../types/index';
import api from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

const CreateWithdrawal: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [formData, setFormData] = useState({
    asset: CryptoAsset.USDT_TRC20,
    network: 'TRC20',
    address: '',
    amount: '',
  });
  const [estimatedFee, setEstimatedFee] = useState<number>(0);

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    // Update network based on asset
    const networkMapping: Record<CryptoAsset, string> = {
      [CryptoAsset.USDT_TRC20]: 'TRC20',
      [CryptoAsset.USDT_ERC20]: 'ERC20',
      [CryptoAsset.BTC]: 'BTC',
      [CryptoAsset.ETH]: 'ETH',
    };
    setFormData(prev => ({ ...prev, network: networkMapping[formData.asset] }));

    // Calculate estimated fee
    const feeRates: Record<CryptoAsset, number> = {
      [CryptoAsset.USDT_TRC20]: 1,
      [CryptoAsset.USDT_ERC20]: 5,
      [CryptoAsset.BTC]: 0.0001 * parseFloat(formData.amount || '0'),
      [CryptoAsset.ETH]: 0.001 * parseFloat(formData.amount || '0'),
    };
    setEstimatedFee(feeRates[formData.asset] || 0);
  }, [formData.asset, formData.amount]);

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

    const totalRequired = amount + estimatedFee;
    if (!balance || totalRequired > balance.available) {
      alert('Insufficient available balance (including fees)');
      return;
    }

    if (!formData.address) {
      alert('Please enter a valid crypto address');
      return;
    }

    // Additional address validation
    const addressPatterns: Record<string, RegExp> = {
      BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
      ETH: /^0x[a-fA-F0-9]{40}$/,
      ERC20: /^0x[a-fA-F0-9]{40}$/,
      TRC20: /^T[a-zA-Z0-9]{33}$/,
    };

    if (!addressPatterns[formData.network]?.test(formData.address)) {
      alert(`Invalid ${formData.network} address format`);
      return;
    }

    if (!confirm(`Are you sure you want to withdraw $${amount.toFixed(2)}? This action cannot be reversed.`)) {
      return;
    }

    try {
      setLoading(true);
      await api.post('/withdrawals', {
        asset: formData.asset,
        network: formData.network,
        address: formData.address,
        amount,
      });
      alert('Withdrawal initiated successfully!');
      navigate('/withdrawals');
    } catch (error: any) {
      console.error('Failed to create withdrawal:', error);
      alert(error.response?.data?.error || 'Failed to create withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const getAssetLabel = (asset: CryptoAsset) => {
    switch (asset) {
      case CryptoAsset.USDT_TRC20:
        return 'USDT (TRC20)';
      case CryptoAsset.USDT_ERC20:
        return 'USDT (ERC20)';
      case CryptoAsset.BTC:
        return 'Bitcoin';
      case CryptoAsset.ETH:
        return 'Ethereum';
      default:
        return asset;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/withdrawals">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Crypto Withdrawal</h1>
          <p className="text-muted-foreground">Withdraw funds to your crypto wallet</p>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal Form */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Details</CardTitle>
          <CardDescription>Enter your withdrawal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="asset">Cryptocurrency *</Label>
              <select
                id="asset"
                value={formData.asset}
                onChange={(e) => setFormData({ ...formData, asset: e.target.value as CryptoAsset })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-2"
                required
              >
                {Object.values(CryptoAsset).map((asset) => (
                  <option key={asset} value={asset}>
                    {getAssetLabel(asset)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="network">Network</Label>
              <Input
                id="network"
                value={formData.network}
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Automatically selected based on cryptocurrency
              </p>
            </div>

            <div>
              <Label htmlFor="address">Wallet Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={`Enter your ${formData.network} wallet address`}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Please double-check your wallet address. Incorrect addresses will result in permanent loss of funds.
              </p>
            </div>

            <div>
              <Label htmlFor="amount">Amount (USD) *</Label>
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

            {/* Fee Summary */}
            <Card className="bg-muted">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Withdrawal Amount:</span>
                    <span className="font-semibold">${parseFloat(formData.amount || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Network Fee:</span>
                    <span className="font-semibold">-${estimatedFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Deducted:</span>
                    <span>${(parseFloat(formData.amount || '0') + estimatedFee).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warning */}
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Important Warning</h3>
                    <ul className="text-sm text-red-700 mt-2 space-y-1">
                      <li>• Cryptocurrency transactions are irreversible</li>
                      <li>• Verify your wallet address carefully</li>
                      <li>• Ensure you're using the correct network ({formData.network})</li>
                      <li>• Funds sent to wrong addresses cannot be recovered</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Submit Withdrawal Request'}
              </Button>
              <Link to="/withdrawals">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateWithdrawal;

