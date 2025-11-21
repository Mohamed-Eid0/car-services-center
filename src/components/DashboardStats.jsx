import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  Wrench,
  CheckCircle,
  Car,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";

// (expenses/debts are read from the test API)

const DashboardStats = () => {
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    totalCars: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalDebtsRemaining: 0,
    netProfit: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [workOrders, billings, cars] = await Promise.all([
        api.getWorkOrders(),
        api.getBillings(),
        api.getCars(),
      ]);

      // Count work orders by status
      const pending = (workOrders || []).filter((wo) => wo.status === "pending").length;
      const inProgress = (workOrders || []).filter((wo) => wo.status === "in_progress").length;
      const completed = (workOrders || []).filter((wo) => wo.status === "completed").length;

      // Calculate revenue (paid billings). Include deposits as part of revenue.
      const totalRevenue = (billings || [])
        .filter((b) => b.paid)
        .reduce((sum, b) => sum + (Number(b.total || 0) + Number(b.deposit || 0)), 0);

      // Read expenses and debts from test API
      const [rawExpenses, rawDebts] = await Promise.all([api.getExpenses(), api.getDebts()])
      const totalExpenses = (rawExpenses || []).reduce((s, e) => s + Number(e.total || 0), 0)

      const getDebtRemaining = (d) => {
        const paid = (d.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
        return Math.max(0, Number(d.value || 0) - paid)
      }
      const totalDebtsRemaining = (rawDebts || []).reduce((s, d) => s + getDebtRemaining(d), 0)

      // Net profit: إجمالي الإيرادات - إجمالي المصاريف - إجمالي المديونية
      const netProfit = totalRevenue - totalExpenses - totalDebtsRemaining

      setStats({
        pending,
        inProgress,
        completed,
        totalCars: (cars || []).length,
        totalRevenue,
        totalExpenses,
        totalDebtsRemaining,
        netProfit
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const statCards = [
    {
      title: "سيارات في الانتظار",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "سيارات قيد الصيانة",
      value: stats.inProgress,
      icon: Wrench,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "سيارات مكتملة",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "إجمالي السيارات",
      value: stats.totalCars,
      icon: Car,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "إجمالي المصاريف",
      value: `$${(stats.totalExpenses || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "إجمالي المديونية",
      value: `$${(stats.totalDebtsRemaining || 0).toFixed(2)}`,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "صافي الربح",
      value: `$${(stats.netProfit || 0).toFixed(2)}`,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;