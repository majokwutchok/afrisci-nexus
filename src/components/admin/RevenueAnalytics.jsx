import React, { useState, useEffect } from "react";
import { Payment } from "@/entities/Payment";
import { ReadershipStats } from "@/entities/ReadershipStats";
import { Journal } from "@/entities/Journal";
import { Manuscript } from "@/entities/Manuscript";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Globe,
  Smartphone,
  Eye
} from "lucide-react";

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];

const StatsCard = ({ title, value, icon: Icon, change, changeType, color = "emerald" }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
          {change && (
            <p className={`text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'} flex items-center gap-1 mt-1`}>
              <TrendingUp className="w-3 h-3" />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function RevenueAnalytics() {
  const [payments, setPayments] = useState([]);
  const [readershipStats, setReadershipStats] = useState([]);
  const [journals, setJournals] = useState([]);
  const [manuscripts, setManuscripts] = useState([]);
  const [timeRange, setTimeRange] = useState("12months");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [paymentData, readershipData, journalData, manuscriptData] = await Promise.all([
        Payment.list(),
        ReadershipStats.list(),
        Journal.list(),
        Manuscript.list()
      ]);
      
      setPayments(paymentData);
      setReadershipStats(readershipData);
      setJournals(journalData);
      setManuscripts(manuscriptData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
    setIsLoading(false);
  };

  // Calculate revenue metrics
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const monthlyRevenue = payments.filter(p => {
    const paymentDate = new Date(p.payment_date);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return paymentDate >= lastMonth && p.status === 'completed';
  }).reduce((sum, p) => sum + p.amount, 0);

  // Payment method distribution
  const paymentMethodData = payments.reduce((acc, payment) => {
    if (payment.status === 'completed') {
      const method = payment.payment_method;
      acc[method] = (acc[method] || 0) + payment.amount;
    }
    return acc;
  }, {});

  const paymentMethodChartData = Object.entries(paymentMethodData).map(([method, amount]) => ({
    name: method.replace('_', ' ').toUpperCase(),
    value: amount
  }));

  // Country revenue distribution
  const countryRevenueData = payments.reduce((acc, payment) => {
    if (payment.status === 'completed' && payment.country) {
      acc[payment.country] = (acc[payment.country] || 0) + payment.amount;
    }
    return acc;
  }, {});

  const topCountriesData = Object.entries(countryRevenueData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([country, revenue]) => ({ country, revenue }));

  // Monthly revenue trend
  const monthlyTrendData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (11 - i));
    const monthStr = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    const monthPayments = payments.filter(p => {
      const paymentDate = new Date(p.payment_date);
      return paymentDate.getMonth() === month.getMonth() && 
             paymentDate.getFullYear() === month.getFullYear() &&
             p.status === 'completed';
    });
    
    const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const count = monthPayments.length;
    
    return { month: monthStr, revenue, count };
  });

  // Journal performance
  const journalRevenueData = journals.map(journal => {
    const journalPayments = payments.filter(p => p.journal_id === journal.id && p.status === 'completed');
    const revenue = journalPayments.reduce((sum, p) => sum + p.amount, 0);
    const articleCount = manuscripts.filter(m => m.journal_id === journal.id && m.status === 'published').length;
    
    return {
      name: journal.title,
      revenue,
      articles: articleCount,
      avgRevenue: articleCount > 0 ? revenue / articleCount : 0
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Readership analytics
  const totalViews = readershipStats.length;
  const uniqueCountries = [...new Set(readershipStats.map(r => r.country))].length;
  const continentData = readershipStats.reduce((acc, stat) => {
    acc[stat.continent] = (acc[stat.continent] || 0) + 1;
    return acc;
  }, {});

  const continentChartData = Object.entries(continentData).map(([continent, count]) => ({
    name: continent,
    value: count
  }));

  if (isLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Revenue & Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="12months">Last 12 Months</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          change="+12.5%"
          changeType="increase"
          color="emerald"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${monthlyRevenue.toLocaleString()}`}
          icon={TrendingUp}
          change="+8.2%"
          changeType="increase"
          color="blue"
        />
        <StatsCard
          title="Total Readership"
          value={totalViews.toLocaleString()}
          icon={Eye}
          change="+15.3%"
          changeType="increase"
          color="purple"
        />
        <StatsCard
          title="Global Reach"
          value={`${uniqueCountries} Countries`}
          icon={Globe}
          change="+3 new"
          changeType="increase"
          color="amber"
        />
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="readership">Global Readership</TabsTrigger>
          <TabsTrigger value="journals">Journal Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          {/* Monthly Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Revenue Countries */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Country</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topCountriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Payment Methods Distribution */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Mobile Money Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Mobile Money Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(paymentMethodData)
                  .filter(([method]) => ['mpesa', 'mtn_mobile_money', 'airtel_money', 'orange_money'].includes(method))
                  .map(([method, revenue]) => (
                    <div key={method} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium">{method.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800">
                        ${revenue.toLocaleString()}
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="readership" className="space-y-6">
          {/* Global Readership */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Readership by Continent</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={continentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {continentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Reader Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(readershipStats.reduce((acc, stat) => {
                    acc[stat.country] = (acc[stat.country] || 0) + 1;
                    return acc;
                  }, {}))
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between">
                        <span className="font-medium">{country}</span>
                        <Badge variant="outline">{count.toLocaleString()} views</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="journals" className="space-y-6">
          {/* Journal Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Journal Revenue Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {journalRevenueData.slice(0, 10).map((journal, index) => (
                  <div key={journal.name} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900 truncate">{journal.name}</h4>
                      <Badge className="bg-emerald-100 text-emerald-800">
                        ${journal.revenue.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>Articles Published: {journal.articles}</div>
                      <div>Avg Revenue/Article: ${journal.avgRevenue.toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}