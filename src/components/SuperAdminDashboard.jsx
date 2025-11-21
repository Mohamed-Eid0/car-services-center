import { useNavigate } from "react-router-dom";
import Layout from "./Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Droplets,
  Wrench,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users,
  Package,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import api, { reportsAPI } from "../services/api";

const SuperAdminDashboard = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpisState, setKpisState] = useState({});
  const [reportsState, setReportsState] = useState({
    dailyWorkOrders: [],
    monthlyProfit: [],
    popularOils: [],
    washTypes: [],
  });
  const [_workOrdersList, setWorkOrdersList] = useState([]);
  const [_clientsList, setClientsList] = useState([]);
  const [_carsList, setCarsList] = useState([]);
  const [_techReportsList, setTechReportsList] = useState([]);


  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for relevant localStorage changes (work orders, billing, clients, cars, tech reports)
  useEffect(() => {
    const keys = [
      "car_service_work_orders",
      "car_service_billing",
      "car_service_clients",
      "car_service_cars",
      "car_service_tech_reports",
      "car_service_stock_items",
    ];

    const onStorage = (e) => {
      try {
        if (e.key === null || keys.includes(e.key)) {
          // Some changes can be read directly from newValue, but easiest is to refetch
          fetchAll();
        }
      } catch (err) {
        void err;
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computeKpis = (orders = [], clientsArr = [], carsArr = [], billings = []) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const isToday = (date) => {
      if (!date) return false;
      const d = new Date(date);
      return d >= start && d < end;
    };

    const toLower = (s) => (s ? String(s).toLowerCase() : "");

    let carsWashedToday = 0;
    let carsOilChangedToday = 0;
    let carsMaintainedToday = 0;
    let carsCurrentlyInCenter = 0;
    let carsPending = 0;
    let carsCompletedToday = 0;

    const pendingStatuses = new Set(["waiting", "pending", "new", "open"]);
    const inCenterStatuses = new Set(["in_progress", "in service", "maintenance", "ongoing"]);

    orders.forEach((o) => {
      const status = toLower(o.status);
      const completed = status === "completed";
      const completedToday = completed && (isToday(o.completed_at) || isToday(o.updated_at) || isToday(o.finished_at) || isToday(o.completedAt) || isToday(o.updatedAt));

      const services = Array.isArray(o.services) ? o.services.map((s) => toLower(s)) : [];
      const washPresent = Boolean(o.wash_type || services.some((s) => /wash|غسيل|غس/i.test(s)) || (o.tech_report && o.tech_report.wash_type));
      const oilPresent = Boolean(services.some((s) => /oil|زيت|oil change|تغيير زيت/i.test(s)) || (o.tech_report && (o.tech_report.oil_change || /oil/i.test(String(o.tech_report.wash_type || "")))));

      if (completedToday) {
        carsCompletedToday += 1;
        if (washPresent) carsWashedToday += 1;
        if (oilPresent) carsOilChangedToday += 1;
        const nonWashServices = services.filter((s) => !/wash|oil|زيت|غسيل|تغيير زيت/i.test(s));
        const usedParts = o.tech_report && Array.isArray(o.tech_report.used_parts) ? o.tech_report.used_parts : [];
        if (nonWashServices.length > 0 || usedParts.length > 0) carsMaintainedToday += 1;
      }

      if (inCenterStatuses.has(status) || (!completed && !pendingStatuses.has(status) && status)) {
        carsCurrentlyInCenter += 1;
      }

      if (pendingStatuses.has(status)) carsPending += 1;
    });
    // If billings available use them as primary source for today's completed and related counts
    const woById = (orders || []).reduce((acc, w) => {
      if (w && w.id != null) acc[String(w.id)] = w;
      return acc;
    }, {});

  if (Array.isArray(billings) && billings.length > 0) {
  billings.forEach((b) => {
        const billDate = b.created_at || b.createdAt || null;
        const isBillToday = billDate ? (function(d){ const D=new Date(d); D.setHours(0,0,0,0); return D>=start && D<end; })(billDate) : false;
        if (!isBillToday) return;
        carsCompletedToday += 1;
  const related = b.work_order_id ? woById[String(b.work_order_id)] : null;
        if (b.wash_cost && Number(b.wash_cost) > 0) carsWashedToday += 1;
        if ((b.oil_change_cost && Number(b.oil_change_cost) > 0) || (related && (related.oil_confirmed || related.oil_change || (related.tech_report && related.tech_report.oil_change)))) carsOilChangedToday += 1;
        if ((b.parts_cost && Number(b.parts_cost) > 0) || (b.services_cost && Number(b.services_cost) > 0) || (related && related.tech_report && Array.isArray(related.tech_report.used_parts) && related.tech_report.used_parts.length > 0)) carsMaintainedToday += 1;
      });
    } else {
      orders.forEach((o) => {
        const status = toLower(o.status);
        const completed = status === "completed";
        const completedToday = completed && (isToday(o.completed_at) || isToday(o.updated_at) || isToday(o.finished_at) || isToday(o.completedAt) || isToday(o.updatedAt));

        const services = Array.isArray(o.services) ? o.services.map((s) => toLower(s)) : [];
        const washPresent = Boolean(o.wash_type || services.some((s) => /wash|غسيل|غس/i.test(s)) || (o.tech_report && o.tech_report.wash_type));
        const oilPresent = Boolean(services.some((s) => /oil|زيت|oil change|تغيير زيت/i.test(s)) || (o.tech_report && (o.tech_report.oil_change || /oil/i.test(String(o.tech_report.wash_type || "")))));

        if (completedToday) {
          carsCompletedToday += 1;
          if (washPresent) carsWashedToday += 1;
          if (oilPresent) carsOilChangedToday += 1;
          const nonWashServices = services.filter((s) => !/wash|oil|زيت|غسيل|تغيير زيت/i.test(s));
          const usedParts = o.tech_report && Array.isArray(o.tech_report.used_parts) ? o.tech_report.used_parts : [];
          if (nonWashServices.length > 0 || usedParts.length > 0) carsMaintainedToday += 1;
        }

        // Cars in center = any non-completed work order (including waiting/pending/in_progress)
        if (!completed && status) {
          carsCurrentlyInCenter += 1;
        }

        if (pendingStatuses.has(status)) carsPending += 1;
      });
    }

    return {
      carsWashedToday,
      carsOilChangedToday,
      carsMaintainedToday,
      carsCurrentlyInCenter,
      carsPending,
      carsCompleted: carsCompletedToday,
      totalClients: (clientsArr && clientsArr.length) || 0,
      totalVehicles: (carsArr && carsArr.length) || 0,
      totalWorkOrders: (orders && orders.length) || 0,
    };
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dailyWorkOrders, monthlyProfit, popularOils, stockData, workOrdersData, clientsData, carsData, billingData, techReportsData] = await Promise.all([
        reportsAPI.getDailyWorkOrders(),
        reportsAPI.getMonthlyProfit(),
        reportsAPI.getPopularOils(),
        api.getStock(),
        api.getWorkOrders(),
        api.getClients(),
        api.getCars(),
        api.getBilling(),
        api.getTechReports && api.getTechReports(),
      ]);

      // compute wash types from work orders if API doesn't provide them
      const washCounts = {};
      if (Array.isArray(workOrdersData)) {
        workOrdersData.forEach((wo) => {
          const type = wo.wash_type || (wo.tech_report && wo.tech_report.wash_type) || null;
          if (type) {
            const key = String(type);
            washCounts[key] = (washCounts[key] || 0) + 1;
          } else if (Array.isArray(wo.services)) {
            wo.services.forEach((s) => {
              if (/wash|غسيل|غسل/i.test(String(s))) {
                const key = String(s);
                washCounts[key] = (washCounts[key] || 0) + 1;
              }
            });
          }
        });
      }

      const washArray = Object.entries(washCounts).map(([type, count]) => ({ type, count }));

      setReportsState({ dailyWorkOrders: dailyWorkOrders || [], monthlyProfit: monthlyProfit || [], popularOils: popularOils || [], washTypes: washArray });
      setStock(Array.isArray(stockData) ? stockData : (stockData && stockData.data) || []);
      setWorkOrdersList(workOrdersData || []);
      setClientsList(clientsData || []);
      setCarsList(carsData || []);
    setTechReportsList(techReportsData || []);

    const computed = computeKpis(workOrdersData || [], clientsData || [], carsData || [], billingData || [], techReportsData || []);
    setKpisState(computed);
    } catch (e) {
      console.error("Error fetching super admin data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Prefer reading stock from localStorage if available (key heuristics), otherwise use fetched `stock`
  const localStock = (() => {
    try {
      const keys = ["car_service_stock", "car_service_stock_v1", "stock", "app_stock", "car_service_stock_items"];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            if (parsed && Array.isArray(parsed.data)) return parsed.data;
          } catch (e) {
            void e;
          }
        }
      }
    } catch (e) {
      void e;
    }
    return stock || [];
  })();

  // Out of stock and low stock
  const outOfStockItems = Array.isArray(localStock) ? localStock.filter((item) => Number(item.quantity) === 0) : [];
  const lowStockItems = Array.isArray(localStock)
    ? localStock.filter((item) => {
        const q = Number(item.quantity || 0);
        const threshold = Number(item.minimum_stock || 10);
        return q > 0 && threshold > 0 && q <= threshold;
      })
    : [];

  // Quick stats (reuse some KPI values and totals)
  const totalRevenue = reportsState.monthlyProfit && reportsState.monthlyProfit.length ? reportsState.monthlyProfit.reduce((s, p) => s + (p.profit || 0), 0) : 0;

  const _stats = [

    {
      title: t("superAdminDashboard.totalRevenue") || "Total Revenue",
      value: `$${(totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-blue-600",
    },


  ];

  const kpiCards = [
    {
      title: "إجمالي العملاء",
      value: kpisState.totalClients || 0,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      path: "/recorded-clients",
    },
    {
      title: "إجمالي المركبات",
      value: kpisState.totalVehicles || 0,
      icon: Car,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
      path: "/recorded-clients",
    },
    {
      title: "إجمالي أوامر العمل",
      value: kpisState.totalWorkOrders || 0,
      icon: Wrench,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      path: "/work-orders",
    },
    {
      title: t("superAdminDashboard.carsWashedToday") || "Cars Washed Today",
      value: kpisState.carsWashedToday || 0,
      icon: Car,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: t("superAdminDashboard.oilChangesToday") || "Oil Changes Today",
      value: kpisState.carsOilChangedToday || 0,
      icon: Droplets,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: t("superAdminDashboard.carsMaintainedToday") || "Cars Maintained Today",
      value: kpisState.carsMaintainedToday || 0,
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: t("superAdminDashboard.carsInCenter") || "Cars In Center",
      value: kpisState.carsCurrentlyInCenter || 0,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: t("superAdminDashboard.pendingOrders") || "Pending Orders",
      value: kpisState.carsPending || 0,
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: t("superAdminDashboard.completedToday") || "Completed Today",
      value: kpisState.carsCompleted || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  return (
    <Layout user={user} onLogout={onLogout} title={t("superAdminDashboard.title")}>
      <div className="space-y-6" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {t("superAdminDashboard.welcomeBack", { first_name: user.first_name || user.username })}!
          </h2>
          <p className="text-purple-100">{t("superAdminDashboard.overviewDescription")}</p>
        </div>

        {/* KPI Cards */}
        <Card>
          <CardHeader>
            <CardTitle>{t("superAdminDashboard.todayKpis")}</CardTitle>
            <CardDescription>{t("superAdminDashboard.realtimeMetrics")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {kpiCards.map((kpi, index) => {
                const Icon = kpi.icon;
                const CardWrapper = kpi.path ? "button" : "div";
                const clickProps = kpi.path
                  ? {
                      onClick: () => navigate(kpi.path),
                      className:
                        "flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:shadow-md transition-all hover:scale-105 cursor-pointer w-full",
                    }
                  : {
                      className:
                        "flex flex-col items-center justify-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow",
                    };

                return (
                  <CardWrapper key={index} {...clickProps}>
                    <div className={`p-3 rounded-full ${kpi.bgColor} mb-3`}>
                      <Icon className={`h-6 w-6 ${kpi.color}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</p>
                      <p className="text-xs text-gray-600 leading-tight">{kpi.title}</p>
                    </div>
                  </CardWrapper>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert (single card): Out-of-stock above Low-stock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>{t("adminDashboard.lowStockAlert") || "Low Stock Alert"}</span>
            </CardTitle>
            <CardDescription>{t("adminDashboard.lowStockAlert") || "Items that need restocking"}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">{t("adminDashboard.noPendingBills") || "No low stock items"}</p>
                <p className="text-sm text-gray-500 mt-1">{t("adminDashboard.manageInventory") || "All items above threshold"}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Out of Stock */}
                {outOfStockItems.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-red-200">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <h3 className="font-semibold text-red-600">{t("adminDashboard.lowStockAlert") || "Out of Stock"} ({outOfStockItems.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {outOfStockItems.map((item) => {
                        const threshold = item.minimum_stock || 10;
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded border bg-red-50 border-red-200">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900">{item.item}</p>
                                <Badge className="text-xs bg-red-500 text-white">{t("adminDashboard.lowStockAlert") || "Out"}</Badge>
                              </div>
                              <p className="text-sm text-gray-600">{t("storePage.serial") || "Serial"}: {item.serial}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]"><div className="h-2 rounded-full bg-red-500" style={{ width: "0%" }}></div></div>
                                <span className="text-xs text-gray-500">0 / {threshold}</span>
                              </div>
                            </div>
                            <div className="text-right"><Badge className="bg-red-500 text-white">0 {t("storePage.remaining") || "left"}</Badge></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Low Stock */}
                {lowStockItems.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-yellow-200">
                      <Package className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-semibold text-yellow-700">{t("adminDashboard.lowStockAlert") || "Low Stock"} ({lowStockItems.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {lowStockItems.map((item) => {
                        const threshold = item.minimum_stock || 10;
                        const q = Number(item.quantity || 0);
                        const percentage = threshold > 0 ? (q / threshold) * 100 : 0;
                        const isCritical = q <= threshold / 2;

                        return (
                          <div key={item.id} className={`flex items-center justify-between p-3 rounded border ${isCritical ? "bg-yellow-50 border-yellow-200" : "bg-yellow-50 border-yellow-200"}`}>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900">{item.item}</p>
                                {isCritical && <Badge className="text-xs bg-yellow-600 text-white">{t("storePage.critical") || "Critical"}</Badge>}
                              </div>
                              <p className="text-sm text-gray-600">{t("storePage.serial") || "Serial"}: {item.serial}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]"><div className={`h-2 rounded-full ${isCritical ? "bg-yellow-600" : "bg-yellow-500"}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div></div>
                                <span className="text-xs text-gray-500">{item.quantity} / {threshold}</span>
                              </div>
                            </div>
                            <div className="text-right"><Badge className={isCritical ? "bg-yellow-600 text-white" : "bg-yellow-500 text-white"}>{item.quantity} {t("storePage.remaining") || "left"}</Badge></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full" onClick={() => navigate("/store")}>عرض جميع العناصر في المخزن</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("superAdminDashboard.quickActions")}</CardTitle>
            <CardDescription>{t("superAdminDashboard.administrativeTools")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button className="h-16 flex-col space-y-2" onClick={() => navigate("/user-management") }>
                <Users className="h-6 w-6" />
                <span>{t("superAdminDashboard.userManagement")}</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-2" onClick={() => navigate("/store") }>
                <Package className="h-6 w-6" />
                <span>{t("superAdminDashboard.inventory")}</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-2" onClick={() => navigate("/reports") }>
                <TrendingUp className="h-6 w-6" />
                <span>{t("superAdminDashboard.reports")}</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-2" onClick={() => navigate("/billing") }>
                <DollarSign className="h-6 w-6" />
                <span>{t("superAdminDashboard.financial")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SuperAdminDashboard;


