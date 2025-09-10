import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Package, Calendar, AlertTriangle, TrendingUp, DollarSign, FileText, Filter } from "lucide-react";
import { DateRange } from "react-day-picker";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { dashboardService, DashboardData } from "@/services/dashboardService";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedMetric, setSelectedMetric] = useState<string>('reservations');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
          toast({
            title: "Error",
            description: "Failed to load dashboard data",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange, toast]);

  // Use real data from API instead of mock data
  const stats = dashboardData && dashboardData.stats ? [
    {
      title: "Utilisateurs actifs",
      value: dashboardData.stats.active_users.toLocaleString(),
      change: `+${dashboardData.stats.growth_percentage}%`,
      changeType: "positive" as const,
      icon: Users,
      color: "bg-blue-500"
    },
    {
      title: "Annonces en ligne",
      value: dashboardData.stats.online_listings.toLocaleString(),
      change: "+8%",
      changeType: "positive" as const,
      icon: Package,
      color: "bg-primary"
    },
    {
      title: "Réservations actives",
      value: dashboardData.stats.active_reservations.toLocaleString(),
      change: "+15%",
      changeType: "positive" as const,
      icon: Calendar,
      color: "bg-green-500"
    },
    {
      title: "Litiges en cours",
      value: dashboardData.stats.pending_disputes.toString(),
      change: "-4%",
      changeType: "negative" as const,
      icon: AlertTriangle,
      color: "bg-red-500"
    },
    {
      title: "Revenus du mois",
      value: `€${dashboardData.stats.monthly_revenue.toLocaleString()}`,
      change: "+18%",
      changeType: "positive" as const,
      icon: DollarSign,
      color: "bg-purple-500"
    },
    {
      title: "Croissance",
      value: `${dashboardData.stats.growth_percentage}%`,
      change: "+5%",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "bg-indigo-500"
    }
  ] : [];

  // Use chart data from API
  const monthlyData = dashboardData?.chart_data || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Configuration du graphique
  const chartConfig = {
    reservations: {
      label: "Réservations",
      color: "hsl(var(--chart-1))"
    },
    revenue: {
      label: "Chiffre d'affaires (€)",
      color: "hsl(var(--chart-2))"
    },
    users: {
      label: "Utilisateurs",
      color: "hsl(var(--chart-3))"
    },
    listings: {
      label: "Annonces",
      color: "hsl(var(--chart-4))"
    }
  };

  // Données pour le graphique circulaire des pays - multicolore
  const countryData = [
    { name: "France", value: 45, color: "#8884d8" },
    { name: "Belgique", value: 25, color: "#82ca9d" },
    { name: "Suisse", value: 15, color: "#ffc658" },
    { name: "Canada", value: 10, color: "#ff7300" },
    { name: "Autres", value: 5, color: "#0088fe" }
  ];

  const recentActivities = [
    {
      type: "Nouvel utilisateur",
      description: "Marie Dubois s'est inscrite",
      time: "Il y a 5 minutes",
      status: "success"
    },
    {
      type: "Nouvelle annonce",
      description: "Perceuse électrique publiée par Jean Martin",
      time: "Il y a 15 minutes",
      status: "info"
    },
    {
      type: "Litige créé",
      description: "Problème signalé pour la réservation #1234",
      time: "Il y a 30 minutes",
      status: "warning"
    },
    {
      type: "Réservation confirmée",
      description: "Location d'une scie circulaire validée",
      time: "Il y a 1 heure",
      status: "success"
    }
  ];

  return (
    <div className="space-y-6 p-1">{/* Force rebuild */}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble de votre plateforme</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Filtrer par période"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-hover transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <Badge 
                      variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {stat.change}
                    </Badge>
                    <span className="text-xs text-gray-500 ml-2">vs mois dernier</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Graphique en courbe - Évolution mensuelle */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span>Évolution mensuelle des indicateurs</span>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Indicateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(chartConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  cursor={{ strokeDasharray: "5 5" }}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric}
                  stroke={chartConfig[selectedMetric as keyof typeof chartConfig]?.color}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Graphique circulaire - Répartition par pays */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des utilisateurs par pays</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={countryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {countryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {data.name}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {data.value}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Activités récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' :
                    activity.status === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.type}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary hover:bg-primary-light transition-colors cursor-pointer">
                <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">Gérer utilisateurs</p>
              </div>
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary hover:bg-primary-light transition-colors cursor-pointer">
                <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">Modérer annonces</p>
              </div>
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary hover:bg-primary-light transition-colors cursor-pointer">
                <AlertTriangle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">Traiter litiges</p>
              </div>
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-primary hover:bg-primary-light transition-colors cursor-pointer">
                <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">Créer article</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;