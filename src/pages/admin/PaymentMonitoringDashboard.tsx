import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity,
  BarChart3,
  Bell,
  DollarSign,
  CreditCard,
  Shield,
  TrendingUp,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Users,
  Globe,
  Smartphone,
  Monitor,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import PaymentAnalyticsDashboard from '@/components/payment/PaymentAnalyticsDashboard';
import ThreeDSMonitoringDashboard from '@/components/payment/ThreeDSMonitoringDashboard';
import ThreeDSTestSuite from '@/components/payment/ThreeDSTestSuite';
import PaymentAlertingDashboard from '@/components/payment/PaymentAlertingDashboard';

const PaymentMonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [activeAlerts, setActiveAlerts] = useState(0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: '3ds', label: '3D Secure', icon: Shield },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'testing', label: 'Testing', icon: TrendingUp },
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    setLastUpdated(new Date());
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const exportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      systemStatus,
      activeAlerts,
      lastUpdated: lastUpdated.toISOString(),
      tab: activeTab,
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-monitoring-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">System Status</p>
                <p className="text-2xl font-bold text-green-900 capitalize">{systemStatus}</p>
                <p className="text-xs text-green-600 mt-1">All systems operational</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-900">£2,847,392</p>
                <p className="text-xs text-blue-600 mt-1">+12.5% this month</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Success Rate</p>
                <p className="text-2xl font-bold text-purple-900">94.2%</p>
                <p className="text-xs text-purple-600 mt-1">Above industry average</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">Active Alerts</p>
                <p className="text-2xl font-bold text-orange-900">{activeAlerts}</p>
                <p className="text-xs text-orange-600 mt-1">2 critical, 3 warning</p>
              </div>
              <Bell className="h-8 w-8 text-orange-600" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            
            <Button
              variant="outline"
              onClick={exportReport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setActiveTab('alerts')}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              View Alerts
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setActiveTab('testing')}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Run Tests
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="font-medium text-green-900">Stripe</p>
                  <p className="text-sm text-green-600">Payment Processing</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="font-medium text-yellow-900">Wise</p>
                  <p className="text-sm text-yellow-600">International Transfers</p>
                </div>
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div>
                  <p className="font-medium text-yellow-900">PayPal</p>
                  <p className="text-sm text-yellow-600">Alternative Payments</p>
                </div>
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="font-medium text-green-900">Database</p>
                  <p className="text-sm text-green-600">Transaction Storage</p>
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
                <Bell className="h-5 w-5" />
                Recent Alerts
              </span>
              <Badge variant="outline">{activeAlerts} Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">High Refund Rate</p>
                    <p className="text-sm text-red-600">Refund rate: 6.8% (threshold: 5%)</p>
                  </div>
                </div>
                <Badge variant="destructive">Critical</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">Low Success Rate</p>
                    <p className="text-sm text-yellow-600">Success rate: 82.3% (threshold: 85%)</p>
                  </div>
                </div>
                <Badge variant="secondary">Warning</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">3D Secure Activated</p>
                    <p className="text-sm text-blue-600">Enhanced security enabled for high-value transactions</p>
                  </div>
                </div>
                <Badge variant="outline">Info</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Metrics
            </span>
            <Badge variant="outline">Last 7 Days</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">2.8s</div>
              <div className="text-sm text-gray-600">Avg Processing Time</div>
              <div className="text-xs text-green-600 mt-1">Target: &lt;5s</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">23.8%</div>
              <div className="text-sm text-gray-600">3DS Challenge Rate</div>
              <div className="text-xs text-blue-600 mt-1">Industry: 20-30%</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">0.3%</div>
              <div className="text-sm text-gray-600">Chargeback Rate</div>
              <div className="text-xs text-green-600 mt-1">Target: &lt;1%</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">2.1%</div>
              <div className="text-sm text-gray-600">Refund Rate</div>
              <div className="text-xs text-orange-600 mt-1">Target: &lt;5%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Monitoring Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive payment system monitoring, analytics, and alerting
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="autoRefresh">Auto Refresh:</Label>
            <Switch
              id="autoRefresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
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
          <PaymentAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="3ds" className="mt-6">
          <ThreeDSMonitoringDashboard />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <PaymentAlertingDashboard />
        </TabsContent>

        <TabsContent value="testing" className="mt-6">
          <ThreeDSTestSuite />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Last updated: {lastUpdated.toLocaleString()}</p>
        <p>Payment Monitoring Dashboard • Real-time monitoring and analytics</p>
      </div>
    </div>
  );
};

export default PaymentMonitoringDashboard;