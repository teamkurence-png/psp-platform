import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import FilterBar from '../components/ui/FilterBar';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { useList, useSearch } from '../hooks';
import { customerService, type Customer } from '../services';
import { UserPlus } from 'lucide-react';

const Customers: React.FC = () => {
  const { items: customers, loading, setItems, setLoading } = useList<Customer>();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getAll();
      setItems(response.data.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const { searchTerm, setSearchTerm, filteredItems: filteredCustomers } = useSearch(
    customers,
    (customer, term) => {
      const lowerTerm = term.toLowerCase();
      return (
        customer.name.toLowerCase().includes(lowerTerm) ||
        customer.email.toLowerCase().includes(lowerTerm)
      );
    }
  );

  if (loading) {
    return <LoadingSpinner message="Loading customers..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name or email..."
            showFilterButton={true}
          />
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            {filteredCustomers.length} {filteredCustomers.length === customers.length ? 'total' : 'filtered'} customer{filteredCustomers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <EmptyState
              message={
                customers.length === 0 
                  ? "No customers yet" 
                  : "No customers match your filters"
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <Link
                  key={customer._id}
                  to={`/customers/${customer._id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{customer.name}</h3>
                        {/* Risk flags can be added here if available in the customer type */}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{customer.email}</span>
                        {customer.phone && (
                          <>
                            <span>·</span>
                            <span>{customer.phone}</span>
                          </>
                        )}
                        {customer.country && (
                          <>
                            <span>·</span>
                            <span>{customer.country}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{customer.transactionCount} transactions</span>
                        <span>·</span>
                        <span>Since {formatDateTime(customer.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Volume</p>
                      <p className="text-xl font-bold">{formatCurrency(customer.totalPaid)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;
