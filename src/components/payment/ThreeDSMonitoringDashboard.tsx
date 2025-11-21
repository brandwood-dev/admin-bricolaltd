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
  Bar
} from 'recharts';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Activity,
  RefreshCw
} from 'lucide-react';

interface ThreeDSStats {
  totalSessions: number;
  successRate: number;
  challengeRate: number;
  frictionlessRate: number;
  averageProcessingTime: number;
  byStatus: Record<string, number>;
  byCurrency: Record<string, number>;
  byCardBrand: Record<string, number>;
}

interface TimeSeriesData {
  time: string;
  sessions: number;
  successRate: number;
  challengeRate: number;
}

const API_BASE_URL = import.meta.env.VITE_BASE_URL
  ? `${import.meta.env.VITE_BASE_URL}/api`
  : 'http://localhost:4000/api';

const ThreeDSMonitoringDashboard: React.FC = () => {
  const [stats, setStats] = useState<ThreeDSStats | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payment-analytics/3ds/metrics?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch 3DS metrics');
      const data = await response.json();
      setStats(data.data as ThreeDSStats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch 3DS stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getChallengeRateColor = (rate: number) => {
    if (rate <= 20) return 'text-green-600';
    if (rate <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const COLORS = {
    success: '#10b981',
    challenge: '#3b82f6',
    failed: '#ef4444',
    frictionless: '#06b6d4',
    timeout: '#f59e0b',
    cancelled: '#6b7280'
  };

  const pieChartData = stats ? [
    { name: 'Frictionless', value: stats.frictionlessRate, color: COLORS.frictionless },
    { name: 'Challenge', value: stats.challengeRate, color: COLORS.challenge },
    { name: 'Failed', value: 100 - stats.successRate, color: COLORS.failed }
  ] : [];

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading 3DS monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">3D Secure Monitoring</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          
          <Button
            onClick={fetchStats}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className={`text-2xl font-bold ${getSuccessRateColor(stats.successRate)}`}>
                  {stats.successRate.toFixed(1)}%
                </p>
                {stats.successRate >= 95 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mt-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mt-1" />
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
                <p className="text-sm font-medium text-gray-600">Challenge Rate</p>
                <p className={`text-2xl font-bold ${getChallengeRateColor(stats.challengeRate)}`}>
                  {stats.challengeRate.toFixed(1)}%
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats.averageProcessingTime / 1000).toFixed(2)}s
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication Flow Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication Flow Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Authentication Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockTimeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke={COLORS.success} 
                  strokeWidth={2}
                  name="Success Rate (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="challengeRate" 
                  stroke={COLORS.challenge} 
                  strokeWidth={2}
                  name="Challenge Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Detailed Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* By Status */}
            <div>
              <h3 className="text-lg font-semibold mb-4">By Status</h3>
              <div className="space-y-2">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <Badge variant="outline">{count.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* By Currency */}
            <div>
              <h3 className="text-lg font-semibold mb-4">By Currency</h3>
              <div className="space-y-2">
                {Object.entries(stats.byCurrency).map(([currency, count]) => (
                  <div key={currency} className="flex justify-between items-center">
                    <span className="uppercase">{currency}</span>
                    <Badge variant="outline">{count.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* By Card Brand */}
            <div>
              <h3 className="text-lg font-semibold mb-4">By Card Brand</h3>
              <div className="space-y-2">
                {Object.entries(stats.byCardBrand).map(([brand, count]) => (
                  <div key={brand} className="flex justify-between items-center">
                    <span className="capitalize">{brand}</span>
                    <Badge variant="outline">{count.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};

export default ThreeDSMonitoringDashboard;