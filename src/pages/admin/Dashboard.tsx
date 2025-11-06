import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Package, Calendar, AlertTriangle, TrendingUp, TrendingDown, DollarSign, FileText, Filter, BarChart3, PieChart, RefreshCw, Download } from "lucide-react";
import { DateRange } from "react-day-picker";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts";
import { dashboardService, DashboardData } from "@/services/dashboardService";
import { analyticsService, AnalyticsData } from "@/services/analyticsService";
import { toolsService, ToolStats } from "@/services/toolsService";
import { disputesService } from "@/services/disputesService";
import { newsService } from "@/services/newsService";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  // Existing Dashboard state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  // New unified analytics state
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30d');
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [toolStats, setToolStats] = useState<ToolStats | null>(null);
  const [totalArticles, setTotalArticles] = useState<number>(0);
  const [totalDisputes, setTotalDisputes] = useState<number>(0);
  const { toast } = useToast();

  // Fetch classic dashboard data (kept for compatibility)
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dateRangeParams = dateRange ? {
          start_date: dateRange.from?.toISOString().split('T')[0] || '',
          end_date: dateRange.to?.toISOString().split('T')[0] || ''
        } : undefined;
        const response = await dashboardService.getDashboardData(dateRangeParams);
        if (response.success) {
          setDashboardData(response.data);
        } else {
          toast({ title: "Erreur", description: "Impossible de charger les données du dashboard", variant: "destructive" });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({ title: "Erreur", description: "Impossible de charger les données du dashboard", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [dateRange, toast]);

  // Fetch analytics + counts for unified KPIs and charts
  useEffect(() => {
    const fetchUnifiedData = async () => {
      try {
        setAnalyticsLoading(true);
        const dateRangeParams = dateRange ? {
          start_date: dateRange.from?.toISOString().split('T')[0] || '',
          end_date: dateRange.to?.toISOString().split('T')[0] || ''
        } : {};
        const analyticsResp = await analyticsService.getAnalyticsData({ ...dateRangeParams, period: selectedPeriod });
        if (analyticsResp.success) {
          setAnalyticsData(analyticsResp.data);
        }
        const toolsResp = await toolsService.getToolStats();
        setToolStats(toolsResp.data);
        const disputesResp = await disputesService.getDisputeStats(dateRange ? {
          startDate: dateRange.from?.toISOString().split('T')[0] || '',
          endDate: dateRange.to?.toISOString().split('T')[0] || ''
        } : undefined);
        setTotalDisputes(disputesResp.data?.totalDisputes || 0);
        const newsResp = await newsService.getNews({ isPublic: true, page: 1, limit: 1 });
        setTotalArticles(newsResp.data.total || newsResp.data.meta?.total || 0);
      } catch (error) {
        console.error('Error fetching unified analytics:', error);
        toast({ title: "Erreur", description: "Impossible de charger les analytiques", variant: "destructive" });
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchUnifiedData();
  }, [dateRange, selectedPeriod, toast]);

  const handleRefresh = async () => {
    setAnalyticsLoading(true);
    try {
      const dateRangeParams = dateRange ? {
        start_date: dateRange.from?.toISOString().split('T')[0] || '',
        end_date: dateRange.to?.toISOString().split('T')[0] || ''
      } : {};
      const response = await analyticsService.getAnalyticsData({ ...dateRangeParams, period: selectedPeriod });
      if (response.success) {
        setAnalyticsData(response.data);
        toast({ title: "Données actualisées", description: "Les analytics ont été mises à jour avec succès." });
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast({ title: "Erreur", description: "Impossible d'actualiser les données.", variant: "destructive" });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast({ title: "Export en cours", description: "Le rapport sera téléchargé dans quelques instants." });
      const response = await analyticsService.exportAnalyticsReport('revenue', 'csv', dateRange ? {
        startDate: dateRange.from?.toISOString().split('T')[0] || '',
        endDate: dateRange.to?.toISOString().split('T')[0] || ''
      } : undefined);
      if (response.success && response.data) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast({ title: "Export réussi", description: "Le rapport a été téléchargé avec succès." });
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast({ title: "Erreur d'export", description: "Impossible d'exporter le rapport.", variant: "destructive" });
    }
  };

  // Unified KPI cards
  const kpiCards = analyticsData ? [
    {
      title: "Revenus totaux",
      value: `€${analyticsData.kpis.total_revenue.toLocaleString()}`,
      change: `+${analyticsData.kpis.revenue_growth}%`,
      changeType: analyticsData.kpis.revenue_growth >= 0 ? "positive" as const : "negative" as const,
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      title: "Total utilisateurs",
      value: (analyticsData.kpis.active_users || 0).toLocaleString(),
      change: `+${analyticsData.kpis.user_growth}%`,
      changeType: analyticsData.kpis.user_growth >= 0 ? "positive" as const : "negative" as const,
      icon: Users,
      color: "bg-blue-500"
    },
    {
      title: "Total annonces",
      value: (toolStats?.total || analyticsData.kpis.active_tools || 0).toLocaleString(),
      change: `${(analyticsData.kpis.tool_growth >= 0 ? '+' : '')}${analyticsData.kpis.tool_growth}%`,
      changeType: analyticsData.kpis.tool_growth >= 0 ? "positive" as const : "negative" as const,
      icon: Package,
      color: "bg-orange-500"
    },
    {
      title: "Total réservations",
      value: (analyticsData.kpis.total_bookings || 0).toLocaleString(),
      change: `+${analyticsData.kpis.booking_growth}%`,
      changeType: analyticsData.kpis.booking_growth >= 0 ? "positive" as const : "negative" as const,
      icon: Calendar,
      color: "bg-purple-500"
    },
    {
      title: "Total litiges",
      value: (totalDisputes || 0).toString(),
      change: "",
      changeType: "positive" as const,
      icon: AlertTriangle,
      color: "bg-red-500"
    },
    {
      title: "Total articles publiés",
      value: (totalArticles || 0).toString(),
      change: "",
      changeType: "positive" as const,
      icon: FileText,
      color: "bg-indigo-500"
    }
  ] : [];

  // Charts data from analytics
  const revenueData = analyticsData?.charts.revenue || [];
  const categoryData = analyticsData?.charts.categories || [];
  const userGrowthData = analyticsData?.charts.user_growth || [];
  const topToolsData = analyticsData?.charts.top_tools || [];
  // Colors for category charts
  const CATEGORY_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c', '#d0ed57', '#d88884'];

  return (
    <div className="space-y-6">
      {/* Header with unified filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble des performances et statistiques</p>
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
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={analyticsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {(analyticsLoading && kpiCards.length === 0) ? (
          Array.from({ length: 6 }).map((_, index) => (
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
          kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                      <div className="flex items-center mt-2">
                        {kpi.change && (
                          kpi.changeType === 'positive' ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                          )
                        )}
                        {kpi.change && (
                          <span className={`text-sm font-medium ${
                            kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {kpi.change}
                          </span>
                        )}
                        {kpi.change && (
                          <span className="text-sm text-gray-500 ml-1">vs période précédente</span>
                        )}
                      </div>
                    </div>
                    <div className={`p-3 rounded-full ${kpi.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Analytics Tabs (Revenue, Users, Tools, Performance) */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenus</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="tools">Outils</TabsTrigger>
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
                <ChartContainer config={{ revenue: { label: "Revenus", color: "hsl(var(--chart-1))" } }} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
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
                <ChartContainer config={{ category: { label: "Catégorie" } }} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie 
                        data={categoryData} 
                        cx="50%" 
                        cy="50%" 
                        labelLine={false} 
                        label={({ payload }) => `${payload.category} ${Math.round(payload.percentage)}%`} 
                        outerRadius={80} 
                        dataKey="count"
                      >
                        {categoryData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
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
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">{index + 1}</div>
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
                <ChartContainer config={{ newUsers: { label: "Nouveaux utilisateurs", color: "hsl(var(--chart-1))" }, totalUsers: { label: "Total utilisateurs", color: "hsl(var(--chart-2))" } }} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="newUsers" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="totalUsers" stroke="#82ca9d" strokeWidth={2} />
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
                      <p className="text-2xl font-bold text-blue-600">{(analyticsData?.kpis.active_users || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Utilisateurs totaux</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{userGrowthData.reduce((sum, u) => sum + (u.newUsers || 0), 0)}</p>
                      <p className="text-sm text-gray-600">Nouveaux ce période</p>
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
                <ChartContainer config={{ tools: { label: "Outils" } }} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outils les plus performants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topToolsData.map((tool, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">{index + 1}</div>
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
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default Dashboard;