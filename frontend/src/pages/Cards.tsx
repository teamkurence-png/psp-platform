import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardService } from '../services';
import type { Card } from '../types';
import { UserRole } from '../types';
import { Card as CardUI } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { CreditCard, Plus, Edit2, Trash2, X } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useAuth } from '../lib/auth';

interface CardModalProps {
  card?: Card | null;
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
}

const CardModal: React.FC<CardModalProps> = ({ card, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: card?.name || '',
    pspLink: card?.pspLink || '',
    commissionPercent: card?.commissionPercent ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert string value to number before saving
    const dataToSave = {
      ...formData,
      commissionPercent: parseFloat(formData.commissionPercent as any) || 0,
    };
    onSave(dataToSave);
  };

  const handleChange = (field: string, value: string) => {
    // Keep as string for numeric fields to allow clearing
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {card ? 'Edit Card' : 'Add New Card'}
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Card Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Stripe Payment Link"
                required
              />
            </div>

            <div>
              <Label htmlFor="pspLink">PSP Link (URL) *</Label>
              <Input
                id="pspLink"
                type="url"
                value={formData.pspLink}
                onChange={(e) => handleChange('pspLink', e.target.value)}
                placeholder="https://example.com/payment"
                required
              />
            </div>

            <div>
              <Label htmlFor="commissionPercent">Commission Percentage (%)</Label>
              <Input
                id="commissionPercent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.commissionPercent}
                onChange={(e) => handleChange('commissionPercent', e.target.value)}
                placeholder="e.g., 2.5"
              />
              <p className="text-xs text-gray-500 mt-1">Commission percentage to apply to transactions (0-100%)</p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : (card ? 'Update Card' : 'Create Card')}
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

const Cards: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isAdminOrOps = user?.role === UserRole.ADMIN || user?.role === UserRole.OPS || user?.role === UserRole.FINANCE;
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Access control - only admin/ops/finance can access this page
  if (!isAdminOrOps) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PSP Cards</h1>
        </div>
        <CardUI className="p-8">
          <div className="text-center">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">
              You don't have permission to access PSP card management. 
              This feature is only available to admin, operations, and finance team members.
            </p>
          </div>
        </CardUI>
      </div>
    );
  }

  // Fetch cards
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['cards'],
    queryFn: () => cardService.getAll(),
  });

  const cards = response?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => cardService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setShowModal(false);
      setSelectedCard(null);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      cardService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setShowModal(false);
      setSelectedCard(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => cardService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  const handleSave = (data: any) => {
    if (selectedCard) {
      updateMutation.mutate({ id: selectedCard._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (card: Card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  const handleDelete = (card: Card) => {
    if (confirm(`Are you sure you want to delete ${card.name}?`)) {
      deleteMutation.mutate(card._id);
    }
  };

  const handleAddNew = () => {
    setSelectedCard(null);
    setShowModal(true);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load cards" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PSP Cards</h1>
          <p className="text-gray-600">Manage payment service provider cards for payment requests</p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardUI>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cards</p>
              <p className="text-2xl font-bold">{cards.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardUI>

        <CardUI>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Cards</p>
              <p className="text-2xl font-bold">
                {cards.filter((c: Card) => c.isActive).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardUI>

        <CardUI>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Cards</p>
              <p className="text-2xl font-bold">
                {cards.filter((c: Card) => !c.isActive).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardUI>
      </div>

      {/* Cards List */}
      <CardUI>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Card Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  PSP Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Commission
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
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-gray-500">No cards configured yet</p>
                    {isAdmin && (
                      <Button onClick={handleAddNew} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add your first card
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                cards.map((card: Card) => (
                  <tr key={card._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{card.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={card.pspLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                      >
                        {card.pspLink}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium">{card.commissionPercent}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {card.isActive ? (
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
                      {formatDate(card.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isAdmin ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(card)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(card)}
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
      </CardUI>

      {/* Modal */}
      {showModal && (
        <CardModal
          card={selectedCard}
          onClose={() => {
            setShowModal(false);
            setSelectedCard(null);
          }}
          onSave={handleSave}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
};

export default Cards;

