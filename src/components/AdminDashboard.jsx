import { useState, useEffect, useCallback } from "react";
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
// table components removed — Admin 'Completed Work Orders' card removed
import {
  Package,
  CheckCircle,
  Clock,
  Users,
  Car,
  Wrench,
  Droplets,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../services/api";

const AdminDashboard = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [_workOrders, setWorkOrders] = useState([]);
  const [_billing, setBilling] = useState([]);
  const [_techReports, setTechReports] = useState([]);
  const [stock, setStock] = useState([]);
  const [_users, setUsers] = useState([]);
  const [_clients, setClients] = useState([]);
  const [_cars, setCars] = useState([]);
  const [kpis, setKpis] = useState({
    carsWashedToday: 1,
    carsOilChangedToday: 0,
    carsMaintainedToday: 0,
    carsCurrentlyInCenter: 0,
    carsPending: 0,
    carsCompleted: 0,
    totalClients: 0,
    totalVehicles: 0,
    totalWorkOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  

  // computeKpis moved to top-level so it can be reused and will receive billing & tech reports
  const computeKpis = (orders = [], clientsArr = [], carsArr = [], billings = [], techReports = []) => {
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

    // quick lookups
    const woById = (orders || []).reduce((acc, w) => {
      if (w && w.id != null) acc[String(w.id)] = w;
      return acc;
    }, {});

    // If techReports available, use them to count maintained/washed/oil events (they are more explicit)
    if (Array.isArray(techReports) && techReports.length > 0) {
      techReports.forEach((r) => {
        const rDate = r.created_at || r.createdAt || r.date || r.reported_at || null;
        if (!rDate || !isToday(rDate)) return;
        // tech report may contain fields: wash_type, oil_change, used_parts
        if (r.wash_type || (r.services && r.services.some((s) => /wash|غسيل|غس/i.test(String(s))))) carsWashedToday += 1;
        if (r.oil_change || (r.services && r.services.some((s) => /oil|زيت|تغيير زيت|oil change/i.test(String(s))))) carsOilChangedToday += 1;
        if ((r.used_parts && Array.isArray(r.used_parts) && r.used_parts.length > 0) || (r.services && r.services.some((s) => !/wash|oil|غسيل|زيت|تغيير زيت/i.test(String(s))))) carsMaintainedToday += 1;
      });
    }

    // If billings available use them as authoritative for completed + wash/oil/maintenance today
    if (Array.isArray(billings) && billings.length > 0) {
      billings.forEach((b) => {
        const billDate = b.created_at || b.createdAt || null;
        const isBillToday = billDate ? isToday(billDate) : false;
        if (!isBillToday) return;
        carsCompletedToday += 1;
        const related = b.work_order_id ? woById[String(b.work_order_id)] : null;
        if (b.wash_cost && Number(b.wash_cost) > 0) carsWashedToday += 1;
        if ((b.oil_change_cost && Number(b.oil_change_cost) > 0) || (related && (related.oil_confirmed || related.oil_change))) carsOilChangedToday += 1;
        if ((b.parts_cost && Number(b.parts_cost) > 0) || (b.services_cost && Number(b.services_cost) > 0)) carsMaintainedToday += 1;
      });
      // when billing present, compute pending/in-center from workOrders
      orders.forEach((o) => {
        const status = toLower(o.status);
        if (status && status !== "completed") carsCurrentlyInCenter += 1;
        if (pendingStatuses.has(status)) carsPending += 1;
      });

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
    }

    // Fallback: scan work orders when no billing or tech reports are available
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

      if (!completed && status) carsCurrentlyInCenter += 1;
      if (pendingStatuses.has(status)) carsPending += 1;
    });

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

  const fetchData = useCallback(async () => {
    try {
      const [
        workOrdersData,
        billingData,
        stockData,
        usersData,
        clientsData,
        carsData,
        techReportsData,
      ] = await Promise.all([
        api.getWorkOrders(),
        api.getBilling(),
        api.getStock(),
        api.getUsers(),
        api.getClients(),
        api.getCars(),
        api.getTechReports && api.getTechReports(),
      ]);

      setWorkOrders(workOrdersData);
      setBilling(billingData);
      setStock(stockData);
      setUsers(usersData);
      setClients(clientsData);
      setCars(carsData);
      setTechReports(techReportsData || []);

      // compute KPIs using billing and tech reports when available
      setKpis(computeKpis(workOrdersData || [], clientsData || [], carsData || [], billingData || [], techReportsData || []));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);
  // call fetchData on mount; fetchData is wrapped in useCallback so it's safe to include in deps
  useEffect(() => {
    fetchData();
  }, [fetchData]);

    // Listen for localStorage changes (from other tabs or parts of the app)
    // and update stock immediately so the Low Stock card stays in sync.
    useEffect(() => {
    // include stock and core data keys so KPIs refresh when work orders/billing/clients/cars change
    const keys = [
      "car_service_stock_items",
      "car_service_stock",
      "car_service_stock_v1",
      "stock",
      "app_stock",
      "car_service_work_orders",
      "car_service_billing",
      "car_service_clients",
      "car_service_cars",
      "car_service_tech_reports",
    ];

    const onStorage = (e) => {
      try {
        if (e.key === null || keys.includes(e.key)) {
          // If the changed key is a stock list, try to parse and set stock quickly
          const raw = e.newValue ?? (e.key ? localStorage.getItem(e.key) : null);
          if (raw && ["car_service_stock_items", "car_service_stock", "stock", "app_stock", "car_service_stock_v1"].includes(e.key)) {
            try {
              const parsed = JSON.parse(raw);
              const arr = Array.isArray(parsed)
                ? parsed
                : parsed && Array.isArray(parsed.data)
                ? parsed.data
                : null;
              if (arr) {
                setStock(arr);
                return;
              }
            } catch (err) {
              void err;
            }
          }

          // For any other relevant key (work orders, billing, clients, cars, tech reports) fallback to refetching all data
          fetchData();
        }
      } catch (err) {
        void err;
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Low stock items: quantity <= minimum_stock (or < 10 as default)
  // Prefer reading stock from localStorage if available (key heuristics), otherwise use fetched `stock`
  const localStock = (() => {
    try {
      // include the test API key 'car_service_stock_items' and several heuristics
      const keys = ["car_service_stock_items", "car_service_stock", "car_service_stock_v1", "stock", "app_stock"];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            // sometimes backend stores object with data field
            if (parsed && Array.isArray(parsed.data)) return parsed.data;
          } catch (e) {
            void e;
            // not JSON, skip
          }
        }
      }
    } catch (e) {
      void e;
      // localStorage may be unavailable in some environments
    }
    return stock || [];
  })();

  // Out of stock items: quantity = 0
  const outOfStockItems = Array.isArray(localStock) ? localStock.filter((item) => Number(item.quantity) === 0) : [];

  // Low stock items: quantity <= minimum_stock (or < 10 as default) and > 0
  const lowStockItems = Array.isArray(localStock)
    ? localStock.filter((item) => {
        const q = Number(item.quantity || 0);
        const threshold = Number(item.minimum_stock || 10);
        return q > 0 && threshold > 0 && q <= threshold;
      })
    : [];

  // Quick stats removed — Low Stock card remains below

  // KPI Cards Data
  const kpiCards = [
    {
      title: "إجمالي العملاء",
      value: kpis.totalClients,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      path: "/recorded-clients",
    },
    {
      title: "إجمالي المركبات",
      value: kpis.totalVehicles,
      icon: Car,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
      path: "/recorded-clients",
    },
    {
      title: "إجمالي أوامر العمل",
      value: kpis.totalWorkOrders,
      icon: Wrench,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      path: "/work-orders",
    },
    {
      title: t("superAdminDashboard.carsWashedToday"),
      value: kpis.carsWashedToday,
      icon: Car,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: t("superAdminDashboard.oilChangesToday"),
      value: kpis.carsOilChangedToday,
      icon: Droplets,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: t("superAdminDashboard.carsMaintainedToday"),
      value: kpis.carsMaintainedToday,
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: t("superAdminDashboard.carsInCenter"),
      value: kpis.carsCurrentlyInCenter,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: t("superAdminDashboard.pendingOrders"),
      value: kpis.carsPending,
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: t("superAdminDashboard.completedToday"),
      value: kpis.carsCompleted,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  return (
    <Layout user={user} onLogout={onLogout} title={t("adminDashboard.title")}>
      <div className="space-y-6" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            {t("adminDashboard.welcomeBack", {
              first_name: user.first_name || user.username,
            })}
            !
          </h2>
          <p className="text-blue-100">
            {t("adminDashboard.manageDescription")}
          </p>
        </div>

        {/* KPI Cards - Today's Performance Indicators */}
        <Card>
          <CardHeader>
            <CardTitle>مؤشرات الأداء الرئيسية اليوم</CardTitle>
            <CardDescription>
              مقاييس في الوقت الفعلي لعمليات اليوم
            </CardDescription>
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
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {kpi.value}
                      </p>
                      <p className="text-xs text-gray-600 leading-tight">
                        {kpi.title}
                      </p>
                    </div>
                  </CardWrapper>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats removed */}

        {/* Completed Work Orders Ready for Billing — removed */}

{/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>تنبيه المخزون المنخفض</span>
            </CardTitle>
            <CardDescription>
              العناصر التي تحتاج إلى إعادة تخزين
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : outOfStockItems.length === 0 && lowStockItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">لا توجد عناصر منخفضة المخزون</p>
                <p className="text-sm text-gray-500 mt-1">
                  جميع العناصر فوق الحد الأدنى
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Out of Stock Section (light red) */}
                {outOfStockItems.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-red-200">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <h3 className="font-semibold text-red-600">نفذ من المخزون ({outOfStockItems.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {outOfStockItems.map((item) => {
                        const threshold = item.minimum_stock || 10;
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded border bg-red-50 border-red-200">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-900">{item.item}</p>
                                <Badge className="text-xs bg-red-500 text-white">نفذ من المخزون</Badge>
                              </div>
                              <p className="text-sm text-gray-600">الرقم التسلسلي: {item.serial}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                                  <div className="h-2 rounded-full bg-red-500" style={{ width: "0%" }}></div>
                                </div>
                                <span className="text-xs text-gray-500">0 / {threshold}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-red-500 text-white">0 متبقي</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Low Stock Section (dark yellow) */}
                {lowStockItems.length > 0 && (
                  <div>
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-yellow-200">
                      <Package className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-semibold text-yellow-700">مخزون منخفض ({lowStockItems.length})</h3>
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
                                {isCritical && <Badge className="text-xs bg-yellow-600 text-white">حرج</Badge>}
                              </div>
                              <p className="text-sm text-gray-600">الرقم التسلسلي: {item.serial}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                                  <div className={`h-2 rounded-full ${isCritical ? "bg-yellow-600" : "bg-yellow-500"}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                                </div>
                                <span className="text-xs text-gray-500">{item.quantity} / {threshold}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={isCritical ? "bg-yellow-600 text-white" : "bg-yellow-500 text-white"}>{item.quantity} متبقي</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* View All Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/store")}
                >
                  عرض جميع العناصر في المخزن
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
