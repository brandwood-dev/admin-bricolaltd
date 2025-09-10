import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Package, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from "recharts";
import { analyticsService, AnalyticsData } from "@/services/analyticsService";
import { useToast } from "@/hooks/use-toast";

const Analytics = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        const dateRangeParams = dateRange ? {
          start_date: dateRange.from?.toISOString().split('T')[0] || '',
          end_date: dateRange.to?.toISOString().split('T')[0] || ''
        } : undefined;
        
        const response = await analyticsService.getAnalyticsData({
          ...dateRangeParams,
          period: selectedPeriod
        });
        
        if (response.success) {
          setAnalyticsData(response.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to load analytics data",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange, selectedPeriod, toast]);

  // Replace mock data with real data from API
  const kpiData = analyticsData ? [
    {
      title: "Revenus totaux",
      value: `€${analyticsData.kpis.total_revenue.toLocaleString()}`,
      change: `+${analyticsData.kpis.revenue_growth}%`,
      changeType: analyticsData.kpis.revenue_growth >= 0 ? "positive" as const : "negative" as const,
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      title: "Utilisateurs actifs",
      value: analyticsData.kpis.active_users.toLocaleString(),
      change: `+${analyticsData.kpis.user_growth}%`,
      changeType: analyticsData.kpis.user_growth >= 0 ? "positive" as const : "negative" as const,
      icon: Users,
      color: "bg-blue-500"
    },
    {
      title: "Réservations",
      value: analyticsData.kpis.total_bookings.toLocaleString(),
      change: `+${analyticsData.kpis.booking_growth}%`,
      changeType: analyticsData.kpis.booking_growth >= 0 ? "positive" as const : "negative" as const,
      icon: Calendar,
      color: "bg-purple-500"
    },
    {
      title: "Outils actifs",
      value: analyticsData.kpis.active_tools.toString(),
      change: `${analyticsData.kpis.tool_growth >= 0 ? '+' : ''}${analyticsData.kpis.tool_growth}%`,
      changeType: analyticsData.kpis.tool_growth >= 0 ? "positive" as const : "negative" as const,
      icon: Package,
      color: "bg-orange-500"
    }
  ] : [];

  const revenueData = analyticsData?.charts.revenue || [];
  const categoryData = analyticsData?.charts.categories || [];
  const userGrowthData = analyticsData?.charts.user_growth || [];
  const topToolsData = analyticsData?.charts.top_tools || [];

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const dateRangeParams = dateRange ? {
        start_date: dateRange.from?.toISOString().split('T')[0] || '',
        end_date: dateRange.to?.toISOString().split('T')[0] || ''
      } : undefined;
      
      const response = await analyticsService.getAnalyticsData({
        ...dateRangeParams,
        period: selectedPeriod
      });
      
      if (response.success) {
        setAnalyticsData(response.data);
        toast({
          title: "Données actualisées",
          description: "Les analytics ont été mises à jour avec succès."
        });
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Impossible d'actualiser les données.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast({
        title: "Export en cours",
        description: "Le rapport sera téléchargé dans quelques instants."
      });
      
      const dateRangeParams = dateRange ? {
        startDate: dateRange.from?.toISOString().split('T')[0] || '',
        endDate: dateRange.to?.toISOString().split('T')[0] || ''
      } : undefined;
      
      const response = await analyticsService.exportAnalyticsReport(
        'revenue', // Default to revenue report
        'csv',
        dateRangeParams
      );
      
      if (response.success && response.data) {
        // Create download link
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export réussi",
          description: "Le rapport a été téléchargé avec succès."
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le rapport.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytiques</h1>
          <p className="text-gray-600 mt-1">Tableau de bord des performances et statistiques</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeleton for KPI cards
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                      <div className="flex items-center mt-2">
                        {kpi.changeType === 'positive' ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {kpi.change}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">vs période précédente</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-full ${kpi.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
            </Card>
          );
        }))}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="tools">Outils</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Revenue Analytics */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Évolution des revenus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenus",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenus par catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    category: {
                      label: "Catégorie",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 des outils les plus rentables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topToolsData.map((tool, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{tool.title}</p>
                        <p className="text-sm text-gray-600">{tool.bookings} réservations</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">€{tool.revenue}</p>
                      <p className="text-sm text-gray-600">revenus</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Analytics */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Croissance des utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    newUsers: {
                      label: "Nouveaux utilisateurs",
                      color: "hsl(var(--chart-1))",
                    },
                    totalUsers: {
                      label: "Total utilisateurs",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="newUsers" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalUsers" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">1,813</p>
                      <p className="text-sm text-gray-600">Utilisateurs totaux</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">178</p>
                      <p className="text-sm text-gray-600">Nouveaux ce mois</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">89%</p>
                      <p className="text-sm text-gray-600">Taux d'activation</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">4.2</p>
                      <p className="text-sm text-gray-600">Note moyenne</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tools Analytics */}
        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Répartition des outils par catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    tools: {
                      label: "Outils",
                    },
                  }}
                  className="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques des outils</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Outils actifs</span>
                    <Badge variant="secondary">567</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">En attente de validation</span>
                    <Badge variant="outline">23</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Signalés</span>
                    <Badge variant="destructive">5</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-gray-600">Taux d'occupation moyen</span>
                    <Badge variant="default">73%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Analytics */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance système
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Temps de réponse API</span>
                      <span>245ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Disponibilité</span>
                      <span>99.9%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '99%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Charge serveur</span>
                      <span>34%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '34%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métriques business</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-lg font-bold text-green-600">€1,234</p>
                    <p className="text-sm text-gray-600">Revenus moyens/jour</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <p className="text-lg font-bold text-blue-600">4.2</p>
                    <p className="text-sm text-gray-600">Note satisfaction</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <p className="text-lg font-bold text-purple-600">12min</p>
                    <p className="text-sm text-gray-600">Temps résolution support</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes système</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Pic de trafic détecté</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Sauvegarde réussie</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Mise à jour disponible</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;