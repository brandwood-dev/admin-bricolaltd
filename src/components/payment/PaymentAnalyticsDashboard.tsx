import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Users,
  Globe,
  Smartphone,
  Monitor,
  Shield,
  RefreshCw as RefreshIcon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_BASE_URL = import.meta.env.VITE_BASE_URL
  ? `${import.meta.env.VITE_BASE_URL}/api`
  : 'http://localhost:4000/api';

interface PaymentMetrics {
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
  averageTransactionValue: number;
  revenueByCurrency: Record<string, number>;
  transactionsByStatus: Record<string, number>;
  transactionsByMethod: Record<string, number>;
  dailyGrowth: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

interface TransactionAnalytics {
  hourlyDistribution: Array<{ hour: number; count: number; amount: number }>;
  dailyDistribution: Array<{ date: string; count: number; amount: number }>;
  weeklyDistribution: Array<{ week: string; count: number; amount: number }>;
  monthlyDistribution: Array<{ month: string; count: number; amount: number }>;
  topCustomers: Array<{ userId: string; email: string; totalAmount: number; count: number }>;
  geographicDistribution: Array<{ country: string; count: number; amount: number }>;
  deviceAnalytics: Array<{ device: string; count: number; amount: number }>;
  browserAnalytics: Array<{ browser: string; count: number; amount: number }>;
}

interface RefundMetrics {
  totalRefunds: number;
  refundRate: number;
  totalRefundAmount: number;
  averageRefundAmount: number;
  refundsByReason: Record<string, number>;
  refundsByStatus: Record<string, number>;
  refundTrends: Array<{ date: string; count: number; amount: number }>;
  topRefundReasons: Array<{ reason: string; count: number; amount: number }>;
  refundProcessingTime: Array<{ bookingId: string; processingTime: number }>;
}

interface WithdrawalMetrics {
  totalWithdrawals: number;
  totalWithdrawalAmount: number;
  averageWithdrawalAmount: number;
  withdrawalsByStatus: Record<string, number>;
  withdrawalsByMethod: Record<string, number>;
  withdrawalProcessingTime: Array<{ transactionId: string; processingTime: number }>;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  rejectedWithdrawals: number;
  withdrawalTrends: Array<{ date: string; count: number; amount: number }>;
}

interface ThreeDSMetrics {
  total3DSAttempts: number;
  successRate: number;
  challengeRate: number;
  frictionlessRate: number;
  averageProcessingTime: number;
  attemptsByStatus: Record<string, number>;
  attemptsByCurrency: Record<string, number>;
  attemptsByCardBrand: Record<string, number>;
  challengeCompletionRate: number;
  abandonmentRate: number;
}

interface RealTimeMetrics {
  currentRevenue: number;
  currentTransactions: number;
  activePaymentMethods: string[];
  recentTransactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    method: string;
    createdAt: Date;
    userEmail: string;
  }>;
  systemHealth: {
    stripeStatus: 'operational' | 'degraded' | 'down';
    wiseStatus: 'operational' | 'degraded' | 'down';
    paypalStatus: 'operational' | 'degraded' | 'down';
    lastHealthCheck: Date;
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

interface SystemHealth {
  timestamp: string;
  services: {
    stripe: any;
    wise: any;
    paypal: any;
    database: any;
  };
  metrics: {
    uptime: number;
    memory: any;
    activeConnections: number;
  };
  alerts: any[];
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  orange: '#f97316',
};

const PaymentAnalyticsDashboard: React.FC = () => {
  const [paymentMetrics, setPaymentMetrics] = useState<PaymentMetrics | null>(null);
  const [transactionAnalytics, setTransactionAnalytics] = useState<TransactionAnalytics | null>(null);
  const [refundMetrics, setRefundMetrics] = useState<RefundMetrics | null>(null);
  const [withdrawalMetrics, setWithdrawalMetrics] = useState<WithdrawalMetrics | null>(null);
  const [threeDSMetrics, setThreeDSMetrics] = useState<ThreeDSMetrics | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        paymentMetricsRes,
        transactionAnalyticsRes,
        refundMetricsRes,
        withdrawalMetricsRes,
        threeDSMetricsRes,
        realTimeMetricsRes,
        systemHealthRes,
      ] = await Promise.all([
        fetchPaymentMetrics(),
        fetchTransactionAnalytics(),
        fetchRefundMetrics(),
        fetchWithdrawalMetrics(),
        fetchThreeDSMetrics(),
        fetchRealTimeMetrics(),
        fetchSystemHealth(),
      ]);

      setPaymentMetrics(paymentMetricsRes);
      setTransactionAnalytics(transactionAnalyticsRes);
      setRefundMetrics(refundMetricsRes);
      setWithdrawalMetrics(withdrawalMetricsRes);
      setThreeDSMetrics(threeDSMetricsRes);
      setRealTimeMetrics(realTimeMetricsRes);
      setSystemHealth(systemHealthRes);
      setLastUpdated(new Date());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMetrics = async () => {
    const response = await fetch(`${API_BASE_URL}/payment-analytics/metrics?currency=${selectedCurrency}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch payment metrics');
    const data = await response.json();
    return data.data;
  };

  const fetchTransactionAnalytics = async () => {
    const response = await fetch(`${API_BASE_URL}/payment-analytics/transactions/analytics?groupBy=day`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch transaction analytics');
    const data = await response.json();
    return data.data;
  };

  const fetchRefundMetrics = async () => {
    const response = await fetch(`${API_BASE_URL}/payment-analytics/refunds/metrics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch refund metrics');
    const data = await response.json();
    return data.data;
  };

  const fetchWithdrawalMetrics = async () => {
    const response = await fetch(`${API_BASE_URL}/payment-analytics/withdrawals/metrics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch withdrawal metrics');
    const data = await response.json();
    return data.data;
  };

  const fetchThreeDSMetrics = async () => {
    const response = await fetch(`${API_BASE_URL}/payment-analytics/3ds/metrics?timeRange=${selectedTimeRange}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch 3DS metrics');
    const data = await response.json();
    return data.data;
  };

  const fetchRealTimeMetrics = async () => {
    const response = await fetch(`${API_BASE_URL}/payment-analytics/real-time`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch real-time metrics');
    const data = await response.json();
    return data.data;
  };

  const fetchSystemHealth = async () => {
    const response = await fetch(`${API_BASE_URL}/payment-analytics/health`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch system health');
    const data = await response.json();
    return data.data;
  };

  const exportData = async (format: 'csv' | 'json' | 'xlsx', type: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payment-analytics/export/${format}?type=${type}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-${type}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  useEffect(() => {
    fetchAllData();

    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedTimeRange, selectedCurrency]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchAllData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Payment Analytics Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="currency">Currency:</Label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger id="currency" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="gbp">GBP (£)</SelectItem>
                <SelectItem value="eur">EUR (€)</SelectItem>
                <SelectItem value="usd">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="timeRange">Time Range:</Label>
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger id="timeRange" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            className="flex items-center gap-2"
          >
            <RefreshIcon className="h-4 w-4" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              System Health Status
              <Badge variant="outline" className="ml-auto">
                Last Updated: {lastUpdated.toLocaleTimeString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stripe</p>
                  <p className="text-lg font-bold text-green-600">Operational</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Wise</p>
                  <p className="text-lg font-bold text-yellow-600">Not Configured</p>
                </div>
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">PayPal</p>
                  <p className="text-lg font-bold text-yellow-600">Not Configured</p>
                </div>
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Database</p>
                  <p className="text-lg font-bold text-green-600">Connected</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentMetrics ? `£${paymentMetrics.totalRevenue.toLocaleString()}` : 'Loading...'}
                </p>
                {paymentMetrics && (
                  <div className="flex items-center mt-1">
                    {paymentMetrics.monthlyGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${paymentMetrics.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {paymentMetrics.monthlyGrowth.toFixed(1)}% this month
                    </span>
                  </div>
                )}
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentMetrics ? paymentMetrics.totalTransactions.toLocaleString() : 'Loading...'}
                </p>
                {paymentMetrics && (
                  <div className="flex items-center mt-1">
                    {paymentMetrics.weeklyGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${paymentMetrics.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {paymentMetrics.weeklyGrowth.toFixed(1)}% this week
                    </span>
                  </div>
                )}
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentMetrics ? `${paymentMetrics.successRate.toFixed(1)}%` : 'Loading...'}
                </p>
                {paymentMetrics && (
                  <div className="flex items-center mt-1">
                    {paymentMetrics.successRate >= 95 ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-1" />
                    )}
                    <span className={`text-sm ${paymentMetrics.successRate >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {paymentMetrics.successRate >= 95 ? 'Excellent' : 'Good'}
                    </span>
                  </div>
                )}
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
                <p className="text-2xl font-bold text-gray-900">
                  {paymentMetrics ? `£${paymentMetrics.averageTransactionValue.toFixed(2)}` : 'Loading...'}
                </p>
                {paymentMetrics && (
                  <div className="flex items-center mt-1">
                    {paymentMetrics.dailyGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${paymentMetrics.dailyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {paymentMetrics.dailyGrowth.toFixed(1)}% today
                    </span>
                  </div>
                )}
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="3ds">3D Secure</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Revenue Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Revenue Trends</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportData('csv', 'metrics')}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionAnalytics && (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={transactionAnalytics.dailyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
                      <Area type="monotone" dataKey="amount" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentMetrics && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(paymentMetrics.transactionsByMethod).map(([method, count]) => ({
                          name: method,
                          value: count,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(paymentMetrics.transactionsByMethod).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Geographic and Device Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionAnalytics && transactionAnalytics.geographicDistribution.length > 0 && (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={transactionAnalytics.geographicDistribution.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="country" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
                      <Bar dataKey="amount" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Device Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionAnalytics && transactionAnalytics.deviceAnalytics.length > 0 && (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={transactionAnalytics.deviceAnalytics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {transactionAnalytics.deviceAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Transaction Volume
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData('csv', 'transactions')}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionAnalytics && (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={transactionAnalytics.dailyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill={COLORS.primary} name="Transaction Count" />
                    <Line yAxisId="right" type="monotone" dataKey="amount" stroke={COLORS.success} name="Revenue (£)" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionAnalytics && transactionAnalytics.topCustomers.length > 0 && (
                  <div className="space-y-3">
                    {transactionAnalytics.topCustomers.slice(0, 10).map((customer, index) => (
                      <div key={customer.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.email}</p>
                            <p className="text-sm text-gray-600">{customer.count} transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">£{customer.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Browser Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionAnalytics && transactionAnalytics.browserAnalytics.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={transactionAnalytics.browserAnalytics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {transactionAnalytics.browserAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`£${value}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Refunds</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {refundMetrics ? refundMetrics.totalRefunds.toLocaleString() : 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Rate: {refundMetrics ? `${refundMetrics.refundRate.toFixed(2)}%` : '0%'}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Refund Amount</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {refundMetrics ? `£${refundMetrics.totalRefundAmount.toLocaleString()}` : 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Avg: {refundMetrics ? `£${refundMetrics.averageRefundAmount.toFixed(2)}` : '£0.00'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Refund Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {refundMetrics ? `${refundMetrics.refundRate.toFixed(2)}%` : '0%'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {refundMetrics && refundMetrics.refundRate > 5 ? 'High' : 'Normal'}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Processing</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {refundMetrics && refundMetrics.refundProcessingTime.length > 0
                        ? `${Math.round(refundMetrics.refundProcessingTime.reduce((sum, item) => sum + item.processingTime, 0) / refundMetrics.refundProcessingTime.length / 1000 / 60)} min`
                        : 'N/A'
                      }
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Processing Time
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Refund Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {refundMetrics && refundMetrics.refundTrends.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={refundMetrics.refundTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke={COLORS.error} strokeWidth={2} name="Refund Count" />
                      <Line type="monotone" dataKey="amount" stroke={COLORS.orange} strokeWidth={2} name="Refund Amount" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Refund Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                {refundMetrics && refundMetrics.topRefundReasons.length > 0 && (
                  <div className="space-y-3">
                    {refundMetrics.topRefundReasons.slice(0, 10).map((reason, index) => (
                      <div key={reason.reason} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-red-600">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">{reason.reason}</p>
                            <p className="text-sm text-gray-600">{reason.count} refunds</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">£{reason.amount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {withdrawalMetrics ? withdrawalMetrics.totalWithdrawals.toLocaleString() : 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      £{withdrawalMetrics ? withdrawalMetrics.totalWithdrawalAmount.toLocaleString() : '0'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {withdrawalMetrics ? withdrawalMetrics.pendingWithdrawals.toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-yellow-600 mt-1">Requires Action</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {withdrawalMetrics ? withdrawalMetrics.approvedWithdrawals.toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-green-600 mt-1">Completed</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {withdrawalMetrics ? withdrawalMetrics.rejectedWithdrawals.toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-red-600 mt-1">Failed</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawalMetrics && withdrawalMetrics.withdrawalTrends.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={withdrawalMetrics.withdrawalTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill={COLORS.primary} name="Withdrawal Count" />
                    <Line yAxisId="right" type="monotone" dataKey="amount" stroke={COLORS.success} strokeWidth={2} name="Withdrawal Amount" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="3ds" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">3DS Attempts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {threeDSMetrics ? threeDSMetrics.total3DSAttempts.toLocaleString() : 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Total Authentications</p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {threeDSMetrics ? `${threeDSMetrics.successRate.toFixed(1)}%` : 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {threeDSMetrics && threeDSMetrics.successRate >= 90 ? 'Excellent' : 'Good'}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Challenge Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {threeDSMetrics ? `${threeDSMetrics.challengeRate.toFixed(1)}%` : 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">User Interaction Required</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Frictionless Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {threeDSMetrics ? `${threeDSMetrics.frictionlessRate.toFixed(1)}%` : 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Automatic Success</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>3DS Authentication Flow</CardTitle>
              </CardHeader>
              <CardContent>
                {threeDSMetrics && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Frictionless', value: threeDSMetrics.frictionlessRate },
                          { name: 'Challenge', value: threeDSMetrics.challengeRate },
                          { name: 'Failed', value: 100 - threeDSMetrics.successRate },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill={COLORS.success} />
                        <Cell fill={COLORS.warning} />
                        <Cell fill={COLORS.error} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3DS Performance by Card Brand</CardTitle>
              </CardHeader>
              <CardContent>
                {threeDSMetrics && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(threeDSMetrics.attemptsByCardBrand).map(([brand, count]) => ({
                      brand,
                      count,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="brand" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={COLORS.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Hour Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {realTimeMetrics ? `£${realTimeMetrics.currentRevenue.toLocaleString()}` : 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Last Hour</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Hour Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {realTimeMetrics ? realTimeMetrics.currentTransactions.toLocaleString() : 'Loading...'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Last Hour</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Payment Methods</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {realTimeMetrics ? realTimeMetrics.activePaymentMethods.length : '0'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {realTimeMetrics ? realTimeMetrics.activePaymentMethods.join(', ') : 'None'}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Status</p>
                    <p className="text-2xl font-bold text-green-600">Healthy</p>
                    <p className="text-sm text-gray-600 mt-1">
                      All services operational
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Transactions</span>
                <Badge variant="outline" className="animate-pulse">
                  LIVE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {realTimeMetrics && realTimeMetrics.recentTransactions.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {realTimeMetrics.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.status === 'completed' ? 'bg-green-500' :
                          transaction.status === 'failed' ? 'bg-red-500' :
                          transaction.status === 'pending' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{transaction.userEmail}</p>
                          <p className="text-sm text-gray-600">{transaction.method} • {transaction.currency.toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">£{transaction.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Export Data</span>
            <Download className="h-5 w-5" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => exportData('csv', 'metrics')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Metrics (CSV)
            </Button>
            
            <Button
              variant="outline"
              onClick={() => exportData('json', 'transactions')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Transactions (JSON)
            </Button>
            
            <Button
              variant="outline"
              onClick={() => exportData('csv', 'refunds')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Refunds (CSV)
            </Button>
            
            <Button
              variant="outline"
              onClick={() => exportData('csv', 'withdrawals')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Withdrawals (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentAnalyticsDashboard;