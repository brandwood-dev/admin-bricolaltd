import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Settings, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TestTube,
  History,
  TrendingUp,
  TrendingDown,
  BellRing,
  BellOff
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const API_BASE_URL = import.meta.env.VITE_BASE_URL
  ? `${import.meta.env.VITE_BASE_URL}/api`
  : 'http://localhost:4000/api';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  threshold: number;
  comparison: '>' | '<' | '==' | '>=' | '<=';
  timeWindow: number;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
  cooldown: number;
}

interface AlertHistoryItem {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'warning' | 'info';
  triggeredAt: string;
  resolvedAt?: string;
  currentValue: number;
  threshold: number;
  status: 'active' | 'resolved';
}

interface SystemHealth {
  timestamp: string;
  overallStatus: 'healthy' | 'warning' | 'critical' | 'error';
  metrics: Record<string, number>;
  activeAlerts: number;
  alertRules: {
    total: number;
    enabled: number;
    critical: number;
    warning: number;
    info: number;
  };
}

const PaymentAlertingDashboard: React.FC = () => {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [rulesResponse, historyResponse, healthResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/payment-alerts/rules`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }),
        fetch(`${API_BASE_URL}/payment-alerts/history?limit=50`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }),
        fetch(`${API_BASE_URL}/payment-alerts/health`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        }),
      ]);

      if (!rulesResponse.ok) throw new Error('Failed to fetch alert rules');
      if (!historyResponse.ok) throw new Error('Failed to fetch alert history');
      if (!healthResponse.ok) throw new Error('Failed to fetch system health');

      const rulesData = await rulesResponse.json();
      const historyData = await historyResponse.json();
      const healthData = await healthResponse.json();

      setAlertRules(rulesData.data);
      setAlertHistory(historyData.data);
      setSystemHealth(healthData.data);
      setLastUpdated(new Date());

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAlertRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-alerts/rules/${ruleId}/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) throw new Error('Failed to toggle alert rule');

      // Update local state
      setAlertRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled } : rule
      ));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle alert rule');
    }
  };

  const testAlertRule = async (ruleId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-alerts/rules/${ruleId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to test alert rule');

      // Refresh data after test
      await fetchAllData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test alert rule');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Bell className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getComparisonSymbol = (comparison: string) => {
    switch (comparison) {
      case '>': return '>';
      case '<': return '<';
      case '==': return '=';
      case '>=': return '≥';
      case '<=': return '≤';
      default: return '=';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    } else {
      return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const filteredAlertHistory = alertHistory.filter(alert => {
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'all' && alert.status !== selectedStatus) return false;
    return true;
  });

  const activeAlertsCount = alertHistory.filter(alert => alert.status === 'active').length;

  useEffect(() => {
    fetchAllData();

    if (autoRefresh) {
      const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading alerting dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
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
          <Bell className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Payment Alerting System</h1>
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
            onClick={fetchAllData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health Status
              </span>
              <Badge 
                className={getOverallStatusColor(systemHealth.overallStatus)}
              >
                {systemHealth.overallStatus.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{systemHealth.alertRules.total}</div>
                <div className="text-sm text-gray-600">Total Rules</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{systemHealth.alertRules.enabled}</div>
                <div className="text-sm text-gray-600">Enabled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{activeAlertsCount}</div>
                <div className="text-sm text-gray-600">Active Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{alertHistory.length}</div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Rules Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Alert Rules Configuration
            </span>
            <Badge variant="outline">{alertRules.filter(r => r.enabled).length}/{alertRules.length} Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alertRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-4">
                  {getSeverityIcon(rule.severity)}
                  <div>
                    <h4 className="font-medium text-gray-900">{rule.name}</h4>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{rule.metric}</span>
                      <span>{getComparisonSymbol(rule.comparison)} {rule.threshold}</span>
                      <span>•</span>
                      <span>Window: {formatDuration(rule.timeWindow)}</span>
                      <span>•</span>
                      <span>Cooldown: {formatDuration(rule.cooldown)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testAlertRule(rule.id)}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Test
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`rule-${rule.id}`} className="text-sm">
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id={`rule-${rule.id}`}
                      checked={rule.enabled}
                      onCheckedChange={(checked) => toggleAlertRule(rule.id, checked)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Alert History
            </span>
            <div className="flex items-center gap-2">
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredAlertHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No alerts match your filters</p>
              </div>
            ) : (
              filteredAlertHistory.map((alert) => (
                <div key={alert.id} className={`flex items-center justify-between p-4 rounded-lg border ${
                  alert.status === 'active' 
                    ? getSeverityColor(alert.severity)
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {alert.status === 'active' ? getSeverityIcon(alert.severity) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{alert.ruleName}</h4>
                      <p className="text-sm text-gray-600">
                        Value: {alert.currentValue.toFixed(2)} {getComparisonSymbol('>')} {alert.threshold.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(alert.triggeredAt)}</span>
                        {alert.resolvedAt && (
                          <>
                            <span>•</span>
                            <span>Resolved {formatTimeAgo(alert.resolvedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge className={
                      alert.status === 'active' 
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : 'bg-green-100 text-green-800 border-green-200'
                    }>
                      {alert.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>Last updated: {lastUpdated.toLocaleString()}</p>
        <p>Payment Alerting System • Real-time monitoring and notifications</p>
      </div>
    </div>
  );
};

export default PaymentAlertingDashboard;