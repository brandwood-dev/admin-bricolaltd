import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PaymentAnalyticsDashboard from '@/components/payment/PaymentAnalyticsDashboard';
import ThreeDSMonitoringDashboard from '@/components/payment/ThreeDSMonitoringDashboard';
import ThreeDSTestSuite from '@/components/payment/ThreeDSTestSuite';

const PaymentAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState<Array<{
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: Date;
  }>>([
    {
      type: 'success',
      title: 'Payment System Operational',
      message: 'All payment services are running normally',
      timestamp: new Date(),
    },
    {
      type: 'info',
      title: '3D Secure Active',
      message: 'Enhanced security authentication is enabled',
      timestamp: new Date(),
    }
  ]);

  const handleRefresh = () => {
    setIsLoading(true);
    setLastUpdated(new Date());
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = (type: string) => {
    // Simulate export functionality
    const data = {
      timestamp: new Date().toISOString(),
      timeRange,
      currency: selectedCurrency,
      type,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-analytics-${type}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: LineChartIcon },
    { id: '3ds', label: '3D Secure', icon: Shield },
    { id: 'testing', label: 'Testing', icon: Activity },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">£2,847,392</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">+12.5% this month</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">94.2%</div>
            <div className="flex items-center mt-2">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">Above industry average</span>
            </div>
            <p className="text-xs text-green-600 mt-1">Target: >95%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">3DS Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">23.8%</div>
            <div className="flex items-center mt-2">
              <Shield className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-sm text-purple-600 font-medium">Challenge rate</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">Frictionless: 76.2%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Active Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">4</div>
            <div className="flex items-center mt-2">
              <CreditCard className="h-4 w-4 text-orange-600 mr-1" />
              <span className="text-sm text-orange-600 font-medium">All operational</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">Card, Google Pay, Apple Pay, PayPal</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                System Health Status
              </span>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                All Systems Operational
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm font-medium text-green-800">Stripe</p>
                  <p className="text-lg font-bold text-green-900">Operational</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-medium text-yellow-800">Wise</p>
                  <p className="text-lg font-bold text-yellow-900">Not Configured</p>
                </div>
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="text-sm font-medium text-yellow-800">PayPal</p>
                  <p className="text-lg font-bold text-yellow-900">Not Configured</p>
                </div>
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm font-medium text-green-800">Database</p>
                  <p className="text-lg font-bold text-green-900">Connected</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Performance
              </span>
              <Badge variant="secondary">Last 7 Days</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Transaction Success Rate</span>
                <span className="text-sm font-semibold text-green-600">94.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Average Processing Time</span>
                <span className="text-sm font-semibold text-blue-600">2.8s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Refund Rate</span>
                <span className="text-sm font-semibold text-orange-600">2.1%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Chargeback Rate</span>
                <span className="text-sm font-semibold text-green-600">0.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleExport('metrics')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Metrics Report
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleRefresh()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setActiveTab('testing')}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Run 3DS Tests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            System Alerts
          </h3>
          {systemAlerts.map((alert, index) => (
            <Alert 
              key={index} 
              variant={
                alert.type === 'error' ? 'destructive' :
                alert.type === 'warning' ? 'default' :
                alert.type === 'success' ? 'default' :
                'default'
              }
              className={
                alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                alert.type === 'success' ? 'border-green-200 bg-green-50' :
                alert.type === 'info' ? 'border-blue-200 bg-blue-50' :
                ''
              }
            >
              <AlertCircle className={`h-4 w-4 ${
                alert.type === 'error' ? 'text-red-600' :
                alert.type === 'warning' ? 'text-yellow-600' :
                alert.type === 'success' ? 'text-green-600' :
                'text-blue-600'
              }`} />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <PaymentAnalyticsDashboard />
    </div>
  );

  const render3DS = () => (
    <div className="space-y-6">
      <ThreeDSMonitoringDashboard />
    </div>
  );

  const renderTesting = () => (
    <div className="space-y-6">
      <ThreeDSTestSuite />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Analytics & Monitoring</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive payment system analytics, monitoring, and performance tracking
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="timeRange">Time Range:</Label>
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <SelectTrigger id="timeRange" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          {renderAnalytics()}
        </TabsContent>

        <TabsContent value="3ds" className="mt-6">
          {render3DS()}
        </TabsContent>

        <TabsContent value="testing" className="mt-6">
          {renderTesting()}
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Last updated: {lastUpdated.toLocaleString()}</p>
        <p>Payment Analytics Dashboard • Real-time monitoring and insights</p>
      </div>
    </div>
  );
};

export default PaymentAnalyticsPage;