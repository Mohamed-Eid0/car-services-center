import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Car,
  DollarSign,
  Search,
  Filter,
  Plus,
  Trash2,
} from "lucide-react";
import { workOrdersAPI, clientsAPI, carsAPI, usersAPI } from "../services/api";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useData } from "../contexts/DataContext";

const WorkOrders = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation();
  const { invalidateWorkOrders } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [workOrders, setWorkOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [cars, setCars] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [ctx, setCtx] = useState(null); // { client, car }
  const [phone, setPhone] = useState("");
  const [counter, setCounter] = useState("");
  const [complaint, setComplaint] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const s = location.state;
    if (s?.openNewOrder && s.client && s.car) {
      setCtx({ client: s.client, car: s.car });
      setPhone(s.client.phone || "");
      setCounter(s.car.counter || "");
      setNewOrderOpen(true);
      // clear state so refresh doesn't reopen
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const fetchData = async () => {
    try {
      const [workOrdersData, clientsData, carsData, usersData] =
        await Promise.all([
          workOrdersAPI.getAll(),
          clientsAPI.getAll(),
          carsAPI.getAll(),
          usersAPI.getAll(),
        ]);
      setWorkOrders(workOrdersData);
      setClients(clientsData);
      setCars(carsData);
      setTechnicians(usersData.filter((u) => u.role === "TECHNICIAN"));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!ctx) return;
    try {
      if (phone && phone !== ctx.client.phone) {
        await api.updateClient(ctx.client.id, { phone });
      }
      await api.createWorkOrder({
        client_id: ctx.client.id,
        car_id: ctx.car.id,
        complaint,
        counter,
      });
      setNewOrderOpen(false);
      setCtx(null);
      // optionally refresh your list
    } catch (err) {
      console.error("Failed to create work order:", err);
    }
  };

  // Filter and search work orders
  const filteredOrders = useMemo(() => {
    let filtered = workOrders;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Search by client name, car plate, or complaint
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        const client = clients.find((c) => c.id === order.client_id);
        const car = cars.find((c) => c.id === order.car_id);
        const clientName =
          `${client?.first_name} ${client?.last_name}`.toLowerCase();
        const carPlate = car?.plate?.toLowerCase() || "";
        const complaint = order.complaint.toLowerCase();

        return (
          clientName.includes(term) ||
          carPlate.includes(term) ||
          complaint.includes(term)
        );
      });
    }

    // Sort by creation date (newest first)
    return filtered.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [statusFilter, searchTerm, workOrders, clients, cars]);

  const getStatusIcon = (status) => {
    const s = status.toLowerCase();
    switch (s) {
      case "waiting":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "assigned":
        return <User className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    const s = status.toLowerCase();
    switch (s) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "assigned":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const statusCounts = useMemo(() => {
    const counts = {
      all: workOrders.length,
      waiting: 0,
      pending: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
    };

    workOrders.forEach((order) => {
      const status = order.status.toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });

    return counts;
  }, [workOrders]);

  const handleBilling = (orderId) => {
    // Navigate to billing detail page to VIEW the bill (not create)
    navigate(`/billing/${orderId}`);
  };

  const handleStartWork = async (orderId) => {
    const confirmed = window.confirm(
      t("workOrdersPage.confirmStartWork") ||
        "هل تريد حقاً بدء العمل على هذه السيارة؟"
    );
    if (!confirmed) return;

    try {
      // This will also claim unassigned (waiting) orders for the current tech
      await workOrdersAPI.startWork(orderId);
      toast.success(
        t("workOrdersPage.workStartedSuccessfully") || "تم بدء العمل بنجاح"
      );
      invalidateWorkOrders();
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error starting work:", error);
      toast.error(t("workOrdersPage.errorStartingWork") || "خطأ في بدء العمل");
    }
  };

  const handleRecordWork = (orderId) => {
    navigate(`/record-work/${orderId}`);
  };

  const canDeleteOrders = ["receptionist", "admin", "super_admin"].includes(
    user.role?.toLowerCase()
  );
  const isAssignedToCurrentTech = (order) => {
    const role = user.role?.toLowerCase();
    if (role !== "technician") return false;
    return order.technician_id === user.id;
  };

  const handleDeleteOrder = async (orderId) => {
    if (!canDeleteOrders) return;
    const confirmed = window.confirm(
      t("workOrdersPage.confirmDeleteOrder") ||
        "هل أنت متأكد من حذف أمر العمل هذا؟"
    );
    if (!confirmed) return;
    try {
      await workOrdersAPI.delete(orderId);
      toast.success(t("workOrdersPage.orderDeleted") || "تم حذف أمر العمل");
      invalidateWorkOrders();
      fetchData();
    } catch (err) {
      console.error("Failed to delete work order:", err);
      toast.error(
        t("workOrdersPage.errorDeletingOrder") || "فشل حذف أمر العمل"
      );
    }
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} title={t("workOrdersPage.title")}>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">{t("loading") || "Loading..."}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout} title={t("workOrdersPage.title")}>
      <div className="space-y-6" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Card
              key={status}
              className={`cursor-pointer transition-all hover:shadow-md ${
                statusFilter === status ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setStatusFilter(status)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {status === "all"
                        ? t("workOrdersPage.allOrders")
                        : t(`workOrdersPage.${status.toLowerCase()}`)}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  {status !== "all" && (
                    <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>{t("workOrdersPage.searchAndFilter")}</CardTitle>
            <CardDescription>
              {t("workOrdersPage.searchDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">{t("workOrdersPage.search")}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    type="text"
                    placeholder={t("workOrdersPage.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Label htmlFor="status-filter">
                  {t("workOrdersPage.statusFilter")}
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("workOrdersPage.statusFilter")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("workOrdersPage.allStatuses")}
                    </SelectItem>
                    <SelectItem value="waiting">
                      {t("workOrdersPage.waiting")}
                    </SelectItem>
                    <SelectItem value="pending">
                      {t("workOrdersPage.pending")}
                    </SelectItem>
                    <SelectItem value="assigned">
                      {t("workOrdersPage.assigned")}
                    </SelectItem>
                    <SelectItem value="in_progress">
                      {t("workOrdersPage.in_progress") || "قيد العمل"}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t("workOrdersPage.completed")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("workOrdersPage.workOrdersList")}</CardTitle>
            <CardDescription>
              {t("workOrdersPage.workOrdersFound", {
                count: filteredOrders.length,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("workOrdersPage.orderId")}</TableHead>
                    <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("workOrdersPage.client")}</TableHead>
                    <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("workOrdersPage.vehicle")}</TableHead>
                    <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("workOrdersPage.complaint")}</TableHead>
                    <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("workOrdersPage.deposit")}</TableHead>
                    <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("workOrdersPage.status")}</TableHead>
                    <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("workOrdersPage.date")}</TableHead>
                    <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("workOrdersPage.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-gray-500"
                      >
                        {t("workOrdersPage.noWorkOrdersFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const client = clients.find(
                        (c) => c.id === order.client_id
                      );
                      const car = cars.find((c) => c.id === order.car_id);
                      const technician = order.technician_id
                        ? technicians.find((t) => t.id === order.technician_id)
                        : null;

                      return (
                        <TableRow key={order.id} className="hover:bg-gray-50">
                          <TableCell className={`font-medium ${i18n.language === 'ar' ? 'text-right' : ''}`}>
                            #{order.id.toString().padStart(4, "0")}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {client?.first_name} {client?.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {client?.phone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Car className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="font-medium">{car?.plate}</p>
                                <p className="text-sm text-gray-500">
                                  {car?.brand} {car?.model}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p
                              className="text-sm max-w-xs truncate"
                              title={order.complaint}
                            >
                              {order.complaint}
                            </p>
                            {order.services && order.services.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {order.services.map((service, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={i18n.language === 'ar' ? 'text-right' : ''}>
                            <div className={`flex items-center ${i18n.language === 'ar' ? 'justify-end' : ''} space-x-1 rtl:space-x-reverse`}>
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="font-medium">
                                {order.deposit}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(order.status)}
                                <span>
                                  {t(
                                    `workOrdersPage.${order.status.toLowerCase()}`
                                  )}
                                </span>
                              </div>
                            </Badge>
                            {technician && (
                              <p className="text-xs text-gray-500 mt-1">
                                {t("workOrdersPage.tech")}:{" "}
                                {technician.first_name}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className={i18n.language === 'ar' ? 'text-right' : ''}>
                            <p className="text-sm">
                              {new Date(order.created_at).toLocaleDateString(
                                i18n.language === "ar" ? "ar-EG" : "en-US"
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleTimeString(
                                i18n.language === "ar" ? "ar-EG" : "en-US"
                              )}
                            </p>
                          </TableCell>
                          <TableCell className={i18n.language === 'ar' ? 'text-right' : ''}>
                            {order.status === "completed" ? (
                              // Only ADMIN and SUPER_ADMIN can create bills
                              user.role?.toLowerCase() === "admin" ||
                              user.role?.toLowerCase() === "super_admin" ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleBilling(order.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  {t("workOrdersPage.billing")}
                                </Button>
                              ) : user.role?.toLowerCase() ===
                                "receptionist" ? (
                                // Receptionist can only VIEW bills, not create them
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(`/billing/${order.id}`)
                                  }
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  {t("workOrdersPage.viewBill") ||
                                    "عرض الفاتورة"}
                                </Button>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50"
                                >
                                  {t("workOrdersPage.completed")}
                                </Badge>
                              )
                            ) : user.role?.toLowerCase() === "technician" ? (
                              <div className="flex gap-2">
                                {order.status === "waiting" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleStartWork(order.id)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    {t("workOrdersPage.startWork") ||
                                      "بدء العمل"}
                                  </Button>
                                )}
                                {isAssignedToCurrentTech(order) &&
                                  (order.status === "assigned" ||
                                    order.status === "in_progress") && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleRecordWork(order.id)}
                                      className="bg-orange-600 hover:bg-orange-700"
                                    >
                                      {t("workOrdersPage.recordWork") ||
                                        "تسجيل تقرير العمل"}
                                    </Button>
                                  )}
                              </div>
                            ) : (
                              canDeleteOrders && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Completed Orders - Only show for ADMIN and SUPER_ADMIN */}
        {(user.role?.toLowerCase() === "admin" ||
          user.role?.toLowerCase() === "super_admin") && (
          <Card>
            <CardHeader>
              <CardTitle>{t("workOrdersPage.recentCompletedOrders")}</CardTitle>
              <CardDescription>
                {t("workOrdersPage.ordersReadyForBilling")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workOrders
                  .filter((order) => order.status === "completed")
                  .slice(0, 3)
                  .map((order) => {
                    const client = clients.find(
                      (c) => c.id === order.client_id
                    );
                    const car = cars.find((c) => c.id === order.car_id);

                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {client?.first_name} {client?.last_name} -{" "}
                              {car?.plate}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.complaint}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/billing/${order.id}`)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          {t("workOrdersPage.createBill")}
                        </Button>
                      </div>
                    );
                  })}

                {workOrders.filter((order) => order.status === "completed")
                  .length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    {t("workOrdersPage.noCompletedOrdersReadyForBilling")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {newOrderOpen && ctx && (
        <Card className="mb-6">
          <CardHeader>z
            <CardTitle>{t("recordedClientsPage.addWorkOrder")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-600">
                {t("recordedClientsPage.clientName")}
              </label>
              <div className="mt-1 font-medium">
                {ctx.client.firstName} {ctx.client.lastName}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600">
                {t("recordedClientsPage.phone")}
              </label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600">
                {t("recordedClientsPage.plateNumber")}
              </label>
              <div className="mt-1 font-medium">{ctx.car.plate}</div>
            </div>
            <div>
              <label className="block text-sm text-gray-600">
                {t("recordedClientsPage.mileage")}
              </label>
              <Input
                type="number"
                value={counter}
                onChange={(e) => setCounter(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600">
                {t("workOrdersPage.complaint")}
              </label>
              <textarea
                className="w-full border rounded-md p-2"
                rows={3}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder={t("workOrdersPage.searchPlaceholder")}
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={handleCreate}>
                {t("recordedClientsPage.addWorkOrder")}
              </Button>
              <Button variant="outline" onClick={() => setNewOrderOpen(false)}>
                {t("newClientPage.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
};

export default WorkOrders;
