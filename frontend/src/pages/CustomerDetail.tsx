import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { formatCurrency, formatDateTime } from '../lib/utils';
import api from '../lib/api';
import { ArrowLeft, AlertTriangle, Plus, X } from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  riskFlags: string[];
  totalTransactions: number;
  totalVolume: number;
  notes: Array<{
    text: string;
    createdBy: string;
    createdAt: string;
  }>;
  createdAt: string;
}

interface Transaction {
  transactionId: string;
  amount: number;
  currency: string;
  platformStatus: string;
  createdAt: string;
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newRiskFlag, setNewRiskFlag] = useState('');

  useEffect(() => {
    if (id) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/customers/${id}`);
      setCustomer(response.data.customer);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      alert('Please enter a note');
      return;
    }

    try {
      await api.post(`/api/customers/${id}/notes`, { text: newNote });
      setNewNote('');
      await fetchCustomer();
      alert('Note added successfully');
    } catch (error: any) {
      console.error('Failed to add note:', error);
      alert(error.response?.data?.error || 'Failed to add note');
    }
  };

  const handleAddRiskFlag = async () => {
    if (!newRiskFlag.trim()) {
      alert('Please enter a risk flag');
      return;
    }

    if (!customer) return;

    try {
      await api.put(`/api/customers/${id}`, {
        riskFlags: [...customer.riskFlags, newRiskFlag],
      });
      setNewRiskFlag('');
      await fetchCustomer();
      alert('Risk flag added successfully');
    } catch (error: any) {
      console.error('Failed to add risk flag:', error);
      alert(error.response?.data?.error || 'Failed to add risk flag');
    }
  };

  const handleRemoveRiskFlag = async (flag: string) => {
    if (!customer) return;

    try {
      await api.put(`/api/customers/${id}`, {
        riskFlags: customer.riskFlags.filter(f => f !== flag),
      });
      await fetchCustomer();
      alert('Risk flag removed successfully');
    } catch (error: any) {
      console.error('Failed to remove risk flag:', error);
      alert(error.response?.data?.error || 'Failed to remove risk flag');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customer...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer not found</p>
        <Button asChild className="mt-4">
          <Link to="/customers">Back to Customers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/customers">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground">{customer.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
                {customer.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                )}
                {customer.country && (
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="font-medium">{customer.country}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Customer Since</p>
                  <p className="font-medium">{formatDateTime(customer.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="font-medium">{customer.totalTransactions}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <p className="font-medium">{formatCurrency(customer.totalVolume)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Recent transactions for this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn) => (
                    <div key={txn.transactionId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{txn.transactionId}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(txn.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(txn.amount, txn.currency)}</p>
                        <p className="text-xs capitalize">{txn.platformStatus.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Internal notes about this customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <Button onClick={handleAddNote}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {customer.notes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No notes yet</p>
              ) : (
                <div className="space-y-3">
                  {customer.notes.map((note, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{note.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Flags */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <CardTitle>Risk Flags</CardTitle>
              </div>
              <CardDescription>Risk indicators for this customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add risk flag..."
                  value={newRiskFlag}
                  onChange={(e) => setNewRiskFlag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRiskFlag()}
                />
                <Button onClick={handleAddRiskFlag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {customer.riskFlags.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground text-sm">No risk flags</p>
              ) : (
                <div className="space-y-2">
                  {customer.riskFlags.map((flag, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                      <span className="text-sm text-red-900">{flag}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveRiskFlag(flag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;

