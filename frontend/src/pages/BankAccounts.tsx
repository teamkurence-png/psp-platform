import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankAccountService } from '../services';
import type { BankAccount } from '../types';
import { UserRole } from '../types';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { Building2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useAuth } from '../lib/auth';
import { COUNTRIES } from '../constants/countries';

interface BankAccountModalProps {
  bankAccount?: BankAccount | null;
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
}

const BankAccountModal: React.FC<BankAccountModalProps> = ({ bankAccount, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    bankName: bankAccount?.bankName || '',
    accountNumber: bankAccount?.accountNumber || '',
    routingNumber: bankAccount?.routingNumber || '',
    swiftCode: bankAccount?.swiftCode || '',
    iban: bankAccount?.iban || '',
    bankAddress: bankAccount?.bankAddress || '',
    beneficiaryName: bankAccount?.beneficiaryName || '',
    geo: bankAccount?.geo || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {bankAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="e.g., Chase Bank"
                required
              />
            </div>

            <div>
              <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
              <Input
                id="beneficiaryName"
                value={formData.beneficiaryName}
                onChange={(e) => handleChange('beneficiaryName', e.target.value)}
                placeholder="Account holder name"
              />
            </div>

            <div>
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                placeholder="Account number"
                required
              />
            </div>

            <div>
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => handleChange('iban', e.target.value)}
                placeholder="International Bank Account Number"
              />
            </div>

            <div>
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input
                id="routingNumber"
                value={formData.routingNumber}
                onChange={(e) => handleChange('routingNumber', e.target.value)}
                placeholder="Routing number"
              />
            </div>

            <div>
              <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
              <Input
                id="swiftCode"
                value={formData.swiftCode}
                onChange={(e) => handleChange('swiftCode', e.target.value)}
                placeholder="SWIFT or BIC code"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="bankAddress">Bank Address</Label>
              <Input
                id="bankAddress"
                value={formData.bankAddress}
                onChange={(e) => handleChange('bankAddress', e.target.value)}
                placeholder="Full bank address"
              />
            </div>

            <div>
              <Label htmlFor="geo">Country/Region (GEO)</Label>
              <select
                id="geo"
                value={formData.geo}
                onChange={(e) => handleChange('geo', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : (bankAccount ? 'Update Bank Account' : 'Create Bank Account')}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="px-6">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BankAccounts: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isAdminOrOps = [UserRole.ADMIN, UserRole.OPS, UserRole.FINANCE].includes(user?.role as UserRole);
  const queryClient = useQueryClient();
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Access control - only admin/ops/finance can access this page
  if (!isAdminOrOps) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
        </div>
        <Card className="p-8">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">
              You don't have permission to access bank account management. 
              This feature is only available to admin, operations, and finance team members.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Fetch bank accounts
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: () => bankAccountService.getAll(),
  });

  const bankAccounts = response?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => bankAccountService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      setShowModal(false);
      setSelectedBank(null);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      bankAccountService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      setShowModal(false);
      setSelectedBank(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => bankAccountService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
    },
  });

  const handleSave = (data: any) => {
    if (selectedBank) {
      updateMutation.mutate({ id: selectedBank._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (bank: BankAccount) => {
    setSelectedBank(bank);
    setShowModal(true);
  };

  const handleDelete = (bank: BankAccount) => {
    if (confirm(`Are you sure you want to delete ${bank.bankName}?`)) {
      deleteMutation.mutate(bank._id);
    }
  };

  const handleAddNew = () => {
    setSelectedBank(null);
    setShowModal(true);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load bank accounts" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-gray-600">Manage bank accounts for payment requests</p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Banks</p>
              <p className="text-2xl font-bold">{bankAccounts.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Banks</p>
              <p className="text-2xl font-bold">
                {bankAccounts.filter((b: BankAccount) => b.isActive).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Banks</p>
              <p className="text-2xl font-bold">
                {bankAccounts.filter((b: BankAccount) => !b.isActive).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Bank Accounts List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Bank Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Account Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SWIFT/IBAN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bankAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-gray-500">No bank accounts configured yet</p>
                    {isAdmin && (
                      <Button onClick={handleAddNew} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add your first bank account
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                bankAccounts.map((bank: BankAccount) => (
                  <tr key={bank._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{bank.bankName}</div>
                      {bank.beneficiaryName && (
                        <div className="text-sm text-gray-500">{bank.beneficiaryName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm">{bank.accountNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm space-y-1">
                        {bank.swiftCode && <div>SWIFT: {bank.swiftCode}</div>}
                        {bank.iban && <div className="font-mono text-xs">{bank.iban}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {bank.geo ? COUNTRIES.find(c => c.code === bank.geo)?.name || bank.geo : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {bank.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(bank.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isAdmin ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(bank)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(bank)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-400">View Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <BankAccountModal
          bankAccount={selectedBank}
          onClose={() => {
            setShowModal(false);
            setSelectedBank(null);
          }}
          onSave={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
};

export default BankAccounts;

