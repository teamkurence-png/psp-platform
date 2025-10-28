import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import EmptyState from '../components/ui/EmptyState';
import type { Balance } from '../types/index';
import { CryptoAsset } from '../types/index';
import api from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../lib/utils';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

interface WithdrawalFormData {
  method: 'crypto' | 'bank_transfer';
  amount: string;
  asset: CryptoAsset;
  network: string;
  address: string;
  bankAccount: string;
  iban: string;
  swiftCode: string;
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  beneficiaryName: string;
}

const CreateWithdrawal: React.FC = () => {
  const navigate = useNavigate();
  const { merchantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [formData, setFormData] = useState<WithdrawalFormData>({
    method: 'crypto',
    amount: '',
    
    // Crypto fields
    asset: CryptoAsset.USDT_TRC20,
    network: 'TRC20',
    address: '',
    
    // Bank fields
    bankAccount: '',
    iban: '',
    swiftCode: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    beneficiaryName: '',
  });
  const [estimatedFee, setEstimatedFee] = useState<number>(0);

  useEffect(() => {
    fetchBalance();
  }, [merchantId]);

  useEffect(() => {
    if (formData.method === 'crypto') {
      // Update network based on asset
      const networkMapping: Record<CryptoAsset, string> = {
        [CryptoAsset.USDT_TRC20]: 'TRC20',
        [CryptoAsset.USDT_ERC20]: 'ERC20',
        [CryptoAsset.BTC]: 'BTC',
        [CryptoAsset.ETH]: 'ETH',
      };
      setFormData(prev => ({ ...prev, network: networkMapping[formData.asset] }));

      // Calculate estimated fee for crypto - Fixed 10% commission
      const amount = parseFloat(formData.amount || '0');
      setEstimatedFee(0.10 * amount);
    } else {
      // No fee for bank transfers
      setEstimatedFee(0);
    }
  }, [formData.method, formData.asset, formData.amount]);

  const fetchBalance = async () => {
    if (!merchantId) {
      return;
    }
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

    // Validate based on method
    if (formData.method === 'crypto') {
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
    } else {
      // Bank transfer validation
      if (!formData.iban && !formData.accountNumber && !formData.bankAccount) {
        alert('Please provide at least one bank identifier (IBAN, Account Number, or Bank Account)');
        return;
      }
    }

    if (!confirm(`Are you sure you want to withdraw $${amount.toFixed(2)}? This action cannot be reversed.`)) {
      return;
    }

    try {
      setLoading(true);
      
      const payload: any = {
        method: formData.method,
        amount,
        currency: 'USD',
      };

      if (formData.method === 'crypto') {
        payload.asset = formData.asset;
        payload.network = formData.network;
        payload.address = formData.address;
      } else {
        payload.bankAccount = formData.bankAccount || undefined;
        payload.iban = formData.iban || undefined;
        payload.swiftCode = formData.swiftCode || undefined;
        payload.accountNumber = formData.accountNumber || undefined;
        payload.routingNumber = formData.routingNumber || undefined;
        payload.bankName = formData.bankName || undefined;
        payload.beneficiaryName = formData.beneficiaryName || undefined;
      }

      await api.post('/withdrawals', payload);
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

  // Prevent admins from creating withdrawals
  if (!merchantId) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Link to="/withdrawals">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Withdraw Funds</h1>
            <p className="text-muted-foreground">Withdraw funds to your bank account or crypto wallet</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <EmptyState message="This page is only available for merchant accounts. Withdrawals are merchant-specific operations." />
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Withdraw Funds</h1>
          <p className="text-muted-foreground">Withdraw funds to your bank account or crypto wallet</p>
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
              <Label htmlFor="method">Withdrawal Method *</Label>
              <select
                id="method"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as 'crypto' | 'bank_transfer' })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-2"
                required
              >
                <option value="crypto">Cryptocurrency</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            {formData.method === 'crypto' ? (
              <>
                <div>
                  <Label htmlFor="asset">Cryptocurrency *</Label>
                  <select
                    id="asset"
                    value={formData.asset}
                    onChange={(e) => {
                      const value = e.target.value as CryptoAsset;
                      setFormData({ ...formData, asset: value });
                    }}
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
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
                  <Input
                    id="beneficiaryName"
                    value={formData.beneficiaryName}
                    onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                    placeholder="Enter beneficiary name"
                  />
                </div>

                <div>
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    placeholder="GB82 WEST 1234 5698 7654 32"
                    className="font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      value={formData.routingNumber}
                      onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                      placeholder="021000021"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
                    <Input
                      id="swiftCode"
                      value={formData.swiftCode}
                      onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                      placeholder="ABCDUS33XXX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      placeholder="Bank of America"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  * Please provide at least one bank identifier (IBAN, Account Number, or Bank Account)
                </p>
              </>
            )}

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
            <Card className={formData.method === 'crypto' ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${formData.method === 'crypto' ? 'text-red-600' : 'text-yellow-600'}`} />
                  <div>
                    <h3 className={`font-semibold ${formData.method === 'crypto' ? 'text-red-900' : 'text-yellow-900'}`}>
                      Important Warning
                    </h3>
                    {formData.method === 'crypto' ? (
                      <ul className="text-sm text-red-700 mt-2 space-y-1">
                        <li>• Cryptocurrency transactions are irreversible</li>
                        <li>• Verify your wallet address carefully</li>
                        <li>• Ensure you're using the correct network ({formData.network})</li>
                        <li>• Funds sent to wrong addresses cannot be recovered</li>
                      </ul>
                    ) : (
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        <li>• Bank transfers typically take 1-3 business days</li>
                        <li>• Verify your bank account details carefully</li>
                        <li>• Incorrect details may delay or fail the transfer</li>
                        <li>• Contact support if you need assistance</li>
                      </ul>
                    )}
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

