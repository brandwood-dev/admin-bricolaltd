import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  RefreshCw,
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  CreditCard,
  Euro,
  User,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  FileText,
  Send,
  Ban,
  Unlock
} from 'lucide-react';

// Import types from the entities bridge
import { 
  Transaction, 
  TransactionType, 
  TransactionStatus, 
  PaymentMethod 
} from '@/types/unified-bridge';

// Extended interface for admin-specific transaction data
interface TransactionData extends Transaction {
  userName: string;
  userEmail: string;
  toolName?: string;
  fees: number;
  netAmount: number;
  paymentProvider: string;
  referenceId: string;
  disputeReason?: string;
  disputeStatus?: 'open' | 'investigating' | 'resolved' | 'closed';
}

interface TransactionStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  disputedTransactions: number;
  averageTransactionValue: number;
  revenueGrowth: number;
}

import { transactionsService } from "@/services/transactionsService";
import { useToast } from "@/hooks/use-toast";

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({from: undefined, to: undefined});
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const filters = {
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter as TransactionType : undefined,
          start_date: dateRange.from?.toISOString().split('T')[0],
          end_date: dateRange.to?.toISOString().split('T')[0],
          page: currentPage,
          limit: itemsPerPage
        };
        
        const [transactionsResponse, statsResponse] = await Promise.all([
          transactionsService.getTransactions(filters),
          transactionsService.getTransactionStats()
        ]);
        
        if (transactionsResponse.success && statsResponse.success) {
          setTransactions(transactionsResponse.data?.data || []);
          setStats(statsResponse.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to load transactions",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Error",
          description: "Failed to load transactions",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [searchTerm, statusFilter, typeFilter, dateRange, currentPage, itemsPerPage, toast]);

  const handleRefundTransaction = async (transactionId: string, reason: string) => {
    try {
      const response = await transactionsService.processRefund({
        transactionId,
        amount: 0, // Will be calculated by backend
        reason,
        notifyUser: true
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Transaction refunded successfully"
        });
        // Refresh transactions
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refund transaction",
        variant: "destructive"
      });
    }
  };

  const handleExportTransactions = async () => {
    try {
      const filters = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as TransactionStatus : undefined,
        type: typeFilter !== 'all' ? typeFilter as TransactionType : undefined,
        startDate: dateRange.from?.toISOString().split('T')[0],
        endDate: dateRange.to?.toISOString().split('T')[0],
        format: 'csv' as const
      };
      
      const response = await transactionsService.exportTransactions(filters);
      if (response.success) {
        // Handle file download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Transactions exported successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export transactions",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const statusConfig = {
      [TransactionStatus.COMPLETED]: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      [TransactionStatus.PENDING]: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      [TransactionStatus.FAILED]: { color: 'bg-red-100 text-red-800', icon: XCircle },
      [TransactionStatus.CANCELLED]: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      [TransactionStatus.DISPUTED]: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
    };
    
    const config = statusConfig[status] || statusConfig[TransactionStatus.PENDING];
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: TransactionType) => {
    const typeConfig = {
      [TransactionType.PAYMENT]: { color: 'bg-blue-100 text-blue-800', icon: CreditCard },
      [TransactionType.REFUND]: { color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
      [TransactionType.WITHDRAWAL]: { color: 'bg-red-100 text-red-800', icon: TrendingDown },
      [TransactionType.DEPOSIT]: { color: 'bg-green-100 text-green-800', icon: TrendingUp }
    };
    
    const config = typeConfig[type] || typeConfig[TransactionType.PAYMENT];
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = (transaction.sender?.name?.toLowerCase() || transaction.sender?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (transaction.sender?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (transaction.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (transaction.referenceId?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedTransactions.length === 0) return;
    
    try {
      const response = await transactionsService.bulkUpdateTransactions({
        transactionIds: selectedTransactions,
        action: action as any,
        data: {}
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Bulk action ${action} completed successfully`
        });
        setSelectedTransactions([]);
        // Refresh transactions
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to perform bulk action: ${action}`,
        variant: "destructive"
      });
    }
  };

  const handleTransactionAction = async (transactionId: string, action: string) => {
    try {
      let response;
      
      switch (action) {
        case 'approve':
          response = await transactionsService.updateTransactionStatus(transactionId, TransactionStatus.COMPLETED);
          break;
        case 'reject':
          response = await transactionsService.updateTransactionStatus(transactionId, TransactionStatus.CANCELLED);
          break;
        case 'complete':
          response = await transactionsService.updateTransactionStatus(transactionId, TransactionStatus.COMPLETED);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      if (response.success) {
        toast({
          title: "Success",
          description: `Transaction ${action}d successfully`
        });
        // Refresh transactions
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} transaction`,
        variant: "destructive"
      });
    }
  };

  const exportTransactions = () => {
    handleExportTransactions();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Transactions</h1>
          <p className='text-muted-foreground'>
            Manage financial transactions and payment disputes
          </p>
        </div>
        <div className='flex gap-2'>
          <Button onClick={exportTransactions} variant='outline'>
            <Download className='w-4 h-4 mr-2' />
            Export
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className='w-4 h-4 mr-2' />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-6'
      >
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='transactions'>All Transactions</TabsTrigger>
          <TabsTrigger value='disputes'>Disputes</TabsTrigger>
          <TabsTrigger value='reports'>Reports</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          {/* Stats Cards */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Revenue
                </CardTitle>
                <Euro className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  €{stats?.totalRevenue?.toFixed(2) || '0.00'}
                </div>
                <p className='text-xs text-muted-foreground'>
                  <span
                    className={
                      (stats?.revenueGrowth || 0) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {(stats?.revenueGrowth || 0) >= 0 ? '+' : ''}
                    {stats?.revenueGrowth || 0}%
                  </span>{' '}
                  from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Transactions
                </CardTitle>
                <CreditCard className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {stats?.totalTransactions || 0}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {stats?.successfulTransactions || 0} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Average Value
                </CardTitle>
                <DollarSign className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  €{stats?.averageTransactionValue?.toFixed(2) || '0.00'}
                </div>
                <p className='text-xs text-muted-foreground'>Per transaction</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Disputes</CardTitle>
                <AlertTriangle className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {stats?.disputedTransactions || 0}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {stats?.pendingTransactions || 0} pending review
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className='font-medium'>
                        {transaction.id}
                      </TableCell>
                      <TableCell>
                        {transaction.sender?.firstName +
                          ' ' +
                          transaction.sender?.lastName || 'N/A'}
                      </TableCell>
                      <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                      <TableCell>
                        € {transaction.amount}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='transactions' className='space-y-6'>
          {/* Filters */}
          <Card>
            <CardContent className='pt-6'>
              <div className='flex flex-col md:flex-row gap-4'>
                <div className='flex-1'>
                  <div className='relative'>
                    <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder='Search transactions...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='pl-8'
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='Filter by status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Statuses</SelectItem>
                    <SelectItem value='completed'>Completed</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='failed'>Failed</SelectItem>
                    <SelectItem value='disputed'>Disputed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='Filter by type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Types</SelectItem>
                    <SelectItem value={TransactionType.PAYMENT}>
                      Payment
                    </SelectItem>
                    <SelectItem value={TransactionType.REFUND}>
                      Refund
                    </SelectItem>
                    <SelectItem value={TransactionType.WITHDRAWAL}>
                      Withdrawal
                    </SelectItem>
                    <SelectItem value={TransactionType.DEPOSIT}>
                      Deposit
                    </SelectItem>
                  </SelectContent>
                </Select>
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedTransactions.length > 0 && (
            <Card>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    {selectedTransactions.length} transaction(s) selected
                  </span>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleBulkAction('export')}
                    >
                      <Download className='w-4 h-4 mr-2' />
                      Export Selected
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleBulkAction('refund')}
                    >
                      <RefreshCw className='w-4 h-4 mr-2' />
                      Bulk Refund
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transactions Table */}
          <Card>
            <CardContent className='pt-6'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-12'>
                      <Checkbox
                        checked={
                          selectedTransactions.length ===
                            filteredTransactions.length &&
                          filteredTransactions.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedTransactions.includes(
                            transaction.id
                          )}
                          onCheckedChange={() =>
                            handleSelectTransaction(transaction.id)
                          }
                        />
                      </TableCell>
                      <TableCell className='font-medium'>
                        {transaction.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>
                            {transaction.sender?.name ||
                              transaction.sender?.firstName +
                                ' ' +
                                transaction.sender?.lastName ||
                              'N/A'}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {transaction.sender?.email || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>
                            €
                            {(typeof transaction.amount === 'number'
                              ? transaction.amount
                              : 0
                            ).toFixed(2)}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            Net: €
                            {(typeof transaction.netAmount === 'number'
                              ? transaction.netAmount
                              : 0
                            ).toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell>{transaction.paymentMethod}</TableCell>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setSelectedTransaction(transaction)
                              setShowTransactionDetails(true)
                            }}
                          >
                            <Eye className='w-4 h-4' />
                          </Button>
                          {transaction.status === TransactionStatus.PENDING && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() =>
                                handleTransactionAction(
                                  transaction.id,
                                  'approve'
                                )
                              }
                            >
                              <CheckCircle className='w-4 h-4' />
                            </Button>
                          )}
                          {(transaction.status ===
                            TransactionStatus.COMPLETED ||
                            transaction.status ===
                              TransactionStatus.CONFIRMED) && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() =>
                                handleRefundTransaction(
                                  transaction.id,
                                  'Admin refund'
                                )
                              }
                            >
                              <RefreshCw className='w-4 h-4' />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className='flex items-center justify-between space-x-2 py-4'>
                <div className='text-sm text-muted-foreground'>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredTransactions.length
                  )}{' '}
                  of {filteredTransactions.length} transactions
                </div>
                <div className='flex items-center space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className='h-4 w-4' />
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='disputes' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Payment Disputes</CardTitle>
              <CardDescription>
                Manage and resolve payment disputes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8'>
                <AlertTriangle className='w-12 h-12 mx-auto text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>
                  Dispute Management
                </h3>
                <p className='text-muted-foreground mb-4'>
                  Advanced dispute resolution tools will be available here
                </p>
                <Button variant='outline'>View All Disputes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='reports' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Generate and download financial reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8'>
                <FileText className='w-12 h-12 mx-auto text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>
                  Reporting Dashboard
                </h3>
                <p className='text-muted-foreground mb-4'>
                  Comprehensive financial reporting tools will be available here
                </p>
                <Button variant='outline'>Generate Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Details Dialog */}
      <Dialog
        open={showTransactionDetails}
        onOpenChange={setShowTransactionDetails}
      >
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about transaction {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className='space-y-6'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium'>Transaction ID</Label>
                  <p className='text-sm text-muted-foreground'>
                    {selectedTransaction.id}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Reference ID</Label>
                  <p className='text-sm text-muted-foreground'>
                    {selectedTransaction.referenceId}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Type</Label>
                  <div className='mt-1'>
                    {getTypeBadge(selectedTransaction.type)}
                  </div>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Status</Label>
                  <div className='mt-1'>
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Amount</Label>
                  <p className='text-sm text-muted-foreground'>
                    €
                    {(typeof selectedTransaction.amount === 'number'
                      ? selectedTransaction.amount
                      : 0
                    ).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Fees</Label>
                  <p className='text-sm text-muted-foreground'>
                    €
                    {(typeof selectedTransaction.fees === 'number'
                      ? selectedTransaction.fees
                      : 0
                    ).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Net Amount</Label>
                  <p className='text-sm text-muted-foreground'>
                    €
                    {(typeof selectedTransaction.netAmount === 'number'
                      ? selectedTransaction.netAmount
                      : 0
                    ).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Payment Method</Label>
                  <p className='text-sm text-muted-foreground'>
                    {selectedTransaction.paymentMethod}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>User</Label>
                  <p className='text-sm text-muted-foreground'>
                    {selectedTransaction.sender?.name ||
                      selectedTransaction.sender?.firstName +
                        ' ' +
                        selectedTransaction.sender?.lastName ||
                      'N/A'}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Email</Label>
                  <p className='text-sm text-muted-foreground'>
                    {selectedTransaction.sender?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Created</Label>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium'>Updated</Label>
                  <p className='text-sm text-muted-foreground'>
                    {new Date(selectedTransaction.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedTransaction.disputeReason && (
                <div>
                  <Label className='text-sm font-medium'>Dispute Reason</Label>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {selectedTransaction.disputeReason}
                  </p>
                </div>
              )}

              <div>
                <Label className='text-sm font-medium'>Description</Label>
                <p className='text-sm text-muted-foreground mt-1'>
                  {selectedTransaction.description}
                </p>
              </div>

              <div className='flex gap-2 pt-4'>
                {selectedTransaction.status === TransactionStatus.PENDING && (
                  <>
                    <Button
                      onClick={() =>
                        handleTransactionAction(
                          selectedTransaction.id,
                          'approve'
                        )
                      }
                    >
                      <CheckCircle className='w-4 h-4 mr-2' />
                      Approve
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() =>
                        handleTransactionAction(
                          selectedTransaction.id,
                          'reject'
                        )
                      }
                    >
                      <XCircle className='w-4 h-4 mr-2' />
                      Reject
                    </Button>
                  </>
                )}
                {selectedTransaction.status === TransactionStatus.DISPUTED && (
                  <Button
                    onClick={() =>
                      handleTransactionAction(selectedTransaction.id, 'resolve')
                    }
                  >
                    <CheckCircle className='w-4 h-4 mr-2' />
                    Resolve Dispute
                  </Button>
                )}
                <Button
                  variant='outline'
                  onClick={() =>
                    handleTransactionAction(selectedTransaction.id, 'refund')
                  }
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Issue Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
};

export default Transactions;