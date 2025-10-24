import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { formatDateTime, formatCurrency } from '../lib/utils';
import { withdrawalService, type Withdrawal, type UpdateWithdrawalStatusDto } from '../services';
import { getAssetLabel } from '../constants';
import { ArrowLeft, ExternalLink, Save, XCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import ErrorAlert from '../components/ui/ErrorAlert';

const WithdrawalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateWithdrawalStatusDto>({
    status: '',
    failureReason: '',
  });

  useEffect(() => {
    if (id) {
      fetchWithdrawal();
    }
  }, [id]);

  const fetchWithdrawal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await withdrawalService.getById(id!);
      setWithdrawal(response.data.data);
      setFormData({
        status: response.data.data.status,
        failureReason: response.data.data.failureReason || '',
      });
    } catch (error: any) {
      console.error('Failed to fetch withdrawal:', error);
      setError(error.response?.data?.error || 'Failed to fetch withdrawal details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setUpdating(true);
      setError(null);
      await withdrawalService.updateStatus(id, formData);
      // Refresh the withdrawal data
      await fetchWithdrawal();
      alert('Withdrawal status updated successfully');
    } catch (error: any) {
      console.error('Failed to update withdrawal:', error);
      setError(error.response?.data?.error || 'Failed to update withdrawal status');
    } finally {
      setUpdating(false);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'finance';

  if (loading) {
    return <LoadingSpinner message="Loading withdrawal details..." />;
  }

  if (!withdrawal) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/withdrawals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Withdrawals
        </Button>
        <ErrorAlert message="Withdrawal not found" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/withdrawals')} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Withdrawals
          </Button>
          <h1 className="text-3xl font-bold">Withdrawal Details</h1>
          <p className="text-muted-foreground">View and manage withdrawal information</p>
        </div>
        <StatusBadge status={withdrawal.status} />
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Withdrawal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Information</CardTitle>
          <CardDescription>ID: {withdrawal._id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Method</Label>
              <p className="text-sm font-medium capitalize">
                {withdrawal.method === 'crypto' 
                  ? getAssetLabel(withdrawal.asset!) 
                  : 'Bank Transfer'
                }
              </p>
            </div>

            <div>
              <Label>Status</Label>
              <div className="mt-1">
                <StatusBadge status={withdrawal.status} />
              </div>
            </div>

            <div>
              <Label>Amount</Label>
              <p className="text-sm font-medium">{formatCurrency(withdrawal.amount, withdrawal.currency)}</p>
            </div>

            {withdrawal.fee > 0 && (
              <div>
                <Label>Fee</Label>
                <p className="text-sm font-medium text-red-600">{formatCurrency(withdrawal.fee, withdrawal.currency)}</p>
              </div>
            )}

            <div>
              <Label>Net Amount</Label>
              <p className="text-sm font-medium">{formatCurrency(withdrawal.netAmount, withdrawal.currency)}</p>
            </div>

            <div>
              <Label>Created At</Label>
              <p className="text-sm font-medium">{formatDateTime(withdrawal.createdAt)}</p>
            </div>

            {withdrawal.completedAt && (
              <div>
                <Label>Completed At</Label>
                <p className="text-sm font-medium text-green-600">{formatDateTime(withdrawal.completedAt)}</p>
              </div>
            )}
          </div>

          {/* Crypto-specific details */}
          {withdrawal.method === 'crypto' && (
            <div className="mt-6 pt-6 border-t space-y-4">
              <h3 className="font-semibold text-lg">Crypto Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Asset</Label>
                  <p className="text-sm font-medium">{getAssetLabel(withdrawal.asset!)}</p>
                </div>

                {withdrawal.network && (
                  <div>
                    <Label>Network</Label>
                    <p className="text-sm font-medium">{withdrawal.network}</p>
                  </div>
                )}

                <div>
                  <Label>Address</Label>
                  <p className="text-sm font-mono break-all">{withdrawal.address}</p>
                </div>

                {withdrawal.txHash && (
                  <div>
                    <Label>Transaction Hash</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono break-all">{withdrawal.txHash}</p>
                      {withdrawal.explorerUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(withdrawal.explorerUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {withdrawal.confirmations !== undefined && (
                  <div>
                    <Label>Confirmations</Label>
                    <p className="text-sm font-medium">{withdrawal.confirmations}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bank transfer details */}
          {withdrawal.method === 'bank_transfer' && (
            <div className="mt-6 pt-6 border-t space-y-4">
              <h3 className="font-semibold text-lg">Bank Transfer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {withdrawal.beneficiaryName && (
                  <div>
                    <Label>Beneficiary Name</Label>
                    <p className="text-sm font-medium">{withdrawal.beneficiaryName}</p>
                  </div>
                )}

                {withdrawal.iban && (
                  <div>
                    <Label>IBAN</Label>
                    <p className="text-sm font-mono">{withdrawal.iban}</p>
                  </div>
                )}

                {withdrawal.accountNumber && (
                  <div>
                    <Label>Account Number</Label>
                    <p className="text-sm font-mono">{withdrawal.accountNumber}</p>
                  </div>
                )}

                {withdrawal.bankName && (
                  <div>
                    <Label>Bank Name</Label>
                    <p className="text-sm font-medium">{withdrawal.bankName}</p>
                  </div>
                )}

                {withdrawal.swiftCode && (
                  <div>
                    <Label>SWIFT Code</Label>
                    <p className="text-sm font-mono">{withdrawal.swiftCode}</p>
                  </div>
                )}

                {withdrawal.routingNumber && (
                  <div>
                    <Label>Routing Number</Label>
                    <p className="text-sm font-mono">{withdrawal.routingNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {withdrawal.failureReason && (
            <div className="mt-6 pt-6 border-t">
              <Label>Failure Reason</Label>
              <p className="text-sm text-red-600 mt-1">{withdrawal.failureReason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Form - Admin Only */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
            <CardDescription>Manage withdrawal processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="initiated">Initiated</option>
                  <option value="on_chain">On Chain</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="reversed">Reversed</option>
                </select>
              </div>

              {(formData.status === 'failed' || formData.status === 'reversed') && (
                <div>
                  <Label htmlFor="failureReason">Failure Reason</Label>
                  <textarea
                    id="failureReason"
                    value={formData.failureReason}
                    onChange={(e) => setFormData({ ...formData, failureReason: e.target.value })}
                    placeholder="Enter reason for failure or reversal"
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={updating}>
                  {updating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Status
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/withdrawals')}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WithdrawalDetail;

