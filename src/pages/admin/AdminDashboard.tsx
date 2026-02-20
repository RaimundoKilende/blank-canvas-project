import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, Briefcase, DollarSign, TrendingUp, CheckCircle, XCircle,
  Clock, Star, ChevronRight, Settings, Plus, Search, Filter, MoreVertical, Loader2,
  Zap, Droplets, Wind, Sparkles, Monitor, Wrench, Trash2, Edit, Eye, ChevronLeft,
  Calendar, Bell, AlertTriangle, UserCog, Wallet, Store, Truck, HelpCircle, Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/StatCard";
import { Header } from "@/components/layout/Header";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useTechnicians, Technician } from "@/hooks/useTechnicians";
import { useAllVendors, Vendor } from "@/hooks/useVendorProfile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useVendorCategories } from "@/hooks/useProducts";
import { useServices } from "@/hooks/useServices";
import { useSpecialties } from "@/hooks/useSpecialties";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { useFinancials } from "@/hooks/useFinancials";
import { useProfiles } from "@/hooks/useProfiles";
import { TechnicianProfileDialog } from "@/components/admin/TechnicianProfileDialog";
import { ServiceDetailsDialog } from "@/components/admin/ServiceDetailsDialog";
import { ProfileEditDialog } from "@/components/admin/ProfileEditDialog";
import { FinancialCharts } from "@/components/admin/FinancialCharts";
import { TechnicianEditDialog } from "@/components/admin/TechnicianEditDialog";
import { NotificationBroadcastDialog } from "@/components/admin/NotificationBroadcastDialog";
import { TechnicianReviewsSection } from "@/components/admin/TechnicianReviewsSection";
import { SuggestTechnicianDialog } from "@/components/admin/SuggestTechnicianDialog";
import { UnrespondedRequestsList } from "@/components/admin/UnrespondedRequestsList";
import { WalletDepositDialog } from "@/components/admin/WalletDepositDialog";
import { PendingPaymentsList } from "@/components/admin/PendingPaymentsList";
import { SupportTicketsList } from "@/components/admin/SupportTicketsList";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Icon mapping
const iconMap: Record<string, any> = {
  "zap": Zap,
  "droplets": Droplets,
  "wind": Wind,
  "sparkles": Sparkles,
  "monitor": Monitor,
  "wrench": Wrench,
};

const iconOptions = [
  { value: "zap", label: "Elétrica", icon: Zap },
  { value: "droplets", label: "Água", icon: Droplets },
  { value: "wind", label: "Ar", icon: Wind },
  { value: "sparkles", label: "Limpeza", icon: Sparkles },
  { value: "monitor", label: "Tech", icon: Monitor },
  { value: "wrench", label: "Geral", icon: Wrench },
];

const CATEGORIES_PER_PAGE = 3;
const SERVICES_PER_PAGE = 8;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const { profile } = useAuth();
  
  // Pagination states
  const [categoryPage, setCategoryPage] = useState(1);
  const [pendingServicesPage, setPendingServicesPage] = useState(1);

  const { 
    technicians, 
    pendingTechnicians, 
    approveTechnician, 
    rejectTechnician,
    loadingPending 
  } = useTechnicians();
  
  const { 
    categories, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    isLoading: loadingCategories 
  } = useServiceCategories();

  const { services, createService, updateService, deleteService, isLoading: loadingServices } = useServices();
  const { specialties, createSpecialty, updateSpecialty, deleteSpecialty, isLoading: loadingSpecialties } = useSpecialties();
  const { requests, isLoading: loadingRequests } = useServiceRequests();
  const { summary, transactions, createTransaction, isLoading: loadingFinancials } = useFinancials();
  const { clients, profiles, updateProfile, deleteProfile } = useProfiles();
  const { categories: vendorCategories, createCategory: createVendorCategory, updateCategory: updateVendorCategory, deleteCategory: deleteVendorCategory } = useVendorCategories();
  const queryClient = useQueryClient();
  const { getSettingNumber, updateSetting } = usePlatformSettings();
  const [cancellationFeeInput, setCancellationFeeInput] = useState<string>("");
  const [lowBalanceInput, setLowBalanceInput] = useState<string>("");

  // Fetch all vendors (including pending)
  const { data: allVendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ["admin-all-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Vendor[];
    },
  });

  // Fetch all delivery persons
  const { data: allDeliveryPersons = [], isLoading: loadingDelivery } = useQuery({
    queryKey: ["admin-all-delivery-persons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delivery_persons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Fetch profiles for vendors/delivery
  const vendorProfiles = useMemo(() => {
    return allVendors.map(v => ({ ...v, profile: profiles.find(p => p.user_id === v.user_id) }));
  }, [allVendors, profiles]);

  const deliveryProfiles = useMemo(() => {
    return allDeliveryPersons.map(d => ({ ...d, profile: profiles.find(p => p.user_id === d.user_id) }));
  }, [allDeliveryPersons, profiles]);

  const pendingVendors = vendorProfiles.filter(v => !v.verified);
  const pendingDelivery = deliveryProfiles.filter(d => !d.verified);

  const approveVendor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendors").update({ verified: true, active: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-all-vendors"] }); },
  });

  const rejectVendorMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendors").update({ verified: false, active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-all-vendors"] }); },
  });

  const approveDelivery = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_persons").update({ verified: true, active: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-all-delivery-persons"] }); },
  });

  const rejectDeliveryMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_persons").update({ verified: false, active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-all-delivery-persons"] }); },
  });

  const [vendorSearch, setVendorSearch] = useState("");
  const [deliverySearch, setDeliverySearch] = useState("");

  const filteredVendors = useMemo(() => {
    if (!vendorSearch) return vendorProfiles;
    const q = vendorSearch.toLowerCase();
    return vendorProfiles.filter(v => v.store_name?.toLowerCase().includes(q) || v.profile?.name?.toLowerCase().includes(q) || v.profile?.email?.toLowerCase().includes(q));
  }, [vendorProfiles, vendorSearch]);

  const filteredDeliveryPersons = useMemo(() => {
    if (!deliverySearch) return deliveryProfiles;
    const q = deliverySearch.toLowerCase();
    return deliveryProfiles.filter(d => d.profile?.name?.toLowerCase().includes(q) || d.profile?.email?.toLowerCase().includes(q));
  }, [deliveryProfiles, deliverySearch]);

  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", active: true });

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "", description: "", icon: "wrench", base_price: 0, commission_percentage: 10, category_id: "", active: true,
    price_type: "fixed" as "fixed" | "quote", suggested_price_min: 0, suggested_price_max: 0,
  });

  const [specialtyDialogOpen, setSpecialtyDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<any>(null);
  const [specialtyForm, setSpecialtyForm] = useState({
    name: "", description: "", category_id: "", active: true
  });

  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: "expense" as "income" | "expense" | "commission",
    category: "operational",
    description: "",
    amount: 0,
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [technicianDialogOpen, setTechnicianDialogOpen] = useState(false);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [serviceDetailsDialogOpen, setServiceDetailsDialogOpen] = useState(false);

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // New states for enhanced features
  const [technicianEditDialogOpen, setTechnicianEditDialogOpen] = useState(false);
  const [editingTechnicianData, setEditingTechnicianData] = useState<Technician | null>(null);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [suggestTechDialogOpen, setSuggestTechDialogOpen] = useState(false);
  const [suggestingForService, setSuggestingForService] = useState<any>(null);
  const [walletDepositDialogOpen, setWalletDepositDialogOpen] = useState(false);
  const [walletDepositTechnician, setWalletDepositTechnician] = useState<Technician | null>(null);
  
  // Search states for each section
  const [technicianSearch, setTechnicianSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [vendorCatSearch, setVendorCatSearch] = useState("");
  const [vendorCatDialogOpen, setVendorCatDialogOpen] = useState(false);
  const [editingVendorCat, setEditingVendorCat] = useState<any>(null);
  const [vendorCatForm, setVendorCatForm] = useState({ name: "", description: "" });

  // Filtered technicians
  const filteredTechnicians = useMemo(() => {
    if (!technicianSearch) return technicians;
    const q = technicianSearch.toLowerCase();
    return technicians.filter(t => 
      t.profile?.name?.toLowerCase().includes(q) ||
      t.profile?.email?.toLowerCase().includes(q) ||
      t.specialties?.some(s => s.toLowerCase().includes(q))
    );
  }, [technicians, technicianSearch]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(c => 
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  }, [clients, clientSearch]);

  // Filtered services
  const filteredServices = useMemo(() => {
    if (!serviceSearch) return services;
    const q = serviceSearch.toLowerCase();
    return services.filter(s => 
      s.name?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  }, [services, serviceSearch]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    const q = categorySearch.toLowerCase();
    return categories.filter(c => c.name?.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  // Filtered specialties
  const filteredSpecialties = useMemo(() => {
    if (!specialtySearch) return specialties;
    const q = specialtySearch.toLowerCase();
    return specialties.filter(s => 
      s.name?.toLowerCase().includes(q) ||
      s.category?.name?.toLowerCase().includes(q)
    );
  }, [specialties, specialtySearch]);

  // Unresponded requests (pending for too long) - Admin alert feature
  const unrespondedRequests = useMemo(() => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return requests.filter(r => 
      r.status === "pending" && 
      new Date(r.created_at) < thirtyMinutesAgo
    );
  }, [requests]);

  // Paginated categories
  const paginatedCategories = useMemo(() => {
    const start = (categoryPage - 1) * CATEGORIES_PER_PAGE;
    return filteredCategories.slice(start, start + CATEGORIES_PER_PAGE);
  }, [filteredCategories, categoryPage]);
  const totalCategoryPages = Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE);

  // Filtered and paginated requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          r.description?.toLowerCase().includes(query) ||
          r.address?.toLowerCase().includes(query) ||
          r.category?.name?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      
      // Category filter
      if (filterCategory !== "all" && r.category_id !== filterCategory) return false;
      
      // Date filters
      if (dateFrom) {
        const requestDate = new Date(r.created_at);
        if (requestDate < dateFrom) return false;
      }
      if (dateTo) {
        const requestDate = new Date(r.created_at);
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59);
        if (requestDate > endDate) return false;
      }
      
      return true;
    });
  }, [requests, searchQuery, filterStatus, filterCategory, dateFrom, dateTo]);

  const pendingFilteredRequests = filteredRequests.filter((r) => r.status === "pending");
  const paginatedPendingRequests = useMemo(() => {
    const start = (pendingServicesPage - 1) * SERVICES_PER_PAGE;
    return pendingFilteredRequests.slice(start, start + SERVICES_PER_PAGE);
  }, [pendingFilteredRequests, pendingServicesPage]);
  const totalPendingPages = Math.ceil(pendingFilteredRequests.length / SERVICES_PER_PAGE);

  // Calculate stats
  const activeTechnicians = technicians.length;
  const todayServices = requests.filter(
    (r) => new Date(r.created_at).toDateString() === new Date().toDateString()
  ).length;
  const completedServices = requests.filter((r) => r.status === "completed");
  const monthlyRevenue = completedServices
    .filter((r) => new Date(r.completed_at || "").getMonth() === new Date().getMonth())
    .reduce((sum, r) => sum + (r.total_price || 0), 0);
  const avgRating = technicians.length > 0
    ? technicians.reduce((sum, t) => sum + (t.rating || 0), 0) / technicians.length
    : 0;

  const stats = [
    { icon: Users, label: "Técnicos Ativos", value: `${activeTechnicians}` },
    { icon: Briefcase, label: "Serviços Hoje", value: `${todayServices}` },
    { icon: DollarSign, label: "Receita do Mês", value: `${monthlyRevenue.toLocaleString()} Kz` },
    { icon: Star, label: "Satisfação", value: `${avgRating.toFixed(1)}/5` },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success border-success/20">Concluído</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Em Andamento</Badge>;
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelado</Badge>;
      case "accepted":
        return <Badge className="bg-warning/10 text-warning border-warning/20">Aceito</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return null;
    }
  };

  const handleApprove = async (technicianId: string) => {
    await approveTechnician.mutateAsync(technicianId);
  };

  const handleReject = async (technicianId: string) => {
    await rejectTechnician.mutateAsync(technicianId);
  };

  // Category handlers
  const openCategoryDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, active: category.active });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", active: true });
    }
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, ...categoryForm });
    } else {
      await createCategory.mutateAsync({ ...categoryForm, description: null, icon: "wrench", base_price: 0 });
    }
    setCategoryDialogOpen(false);
  };

  // Service handlers
  const openServiceDialog = (service?: any) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        description: service.description || "",
        icon: service.icon,
        base_price: service.base_price,
        commission_percentage: service.commission_percentage ?? 10,
        category_id: service.category_id,
        active: service.active,
        price_type: service.price_type || "fixed",
        suggested_price_min: service.suggested_price_min || 0,
        suggested_price_max: service.suggested_price_max || 0,
      });
    } else {
      setEditingService(null);
      setServiceForm({ name: "", description: "", icon: "wrench", base_price: 0, commission_percentage: 10, category_id: "", active: true, price_type: "fixed", suggested_price_min: 0, suggested_price_max: 0 });
    }
    setServiceDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (editingService) {
      await updateService.mutateAsync({ id: editingService.id, ...serviceForm });
    } else {
      await createService.mutateAsync(serviceForm);
    }
    setServiceDialogOpen(false);
  };

  // Specialty handlers
  const openSpecialtyDialog = (specialty?: any) => {
    if (specialty) {
      setEditingSpecialty(specialty);
      setSpecialtyForm({
        name: specialty.name,
        description: specialty.description || "",
        category_id: specialty.category_id || "",
        active: specialty.active,
      });
    } else {
      setEditingSpecialty(null);
      setSpecialtyForm({ name: "", description: "", category_id: "", active: true });
    }
    setSpecialtyDialogOpen(true);
  };

  const handleSaveSpecialty = async () => {
    if (editingSpecialty) {
      await updateSpecialty.mutateAsync({ id: editingSpecialty.id, ...specialtyForm });
    } else {
      await createSpecialty.mutateAsync(specialtyForm);
    }
    setSpecialtyDialogOpen(false);
  };

  // Vendor category handlers
  const openVendorCatDialog = (cat?: any) => {
    if (cat) {
      setEditingVendorCat(cat);
      setVendorCatForm({ name: cat.name, description: cat.description || "" });
    } else {
      setEditingVendorCat(null);
      setVendorCatForm({ name: "", description: "" });
    }
    setVendorCatDialogOpen(true);
  };

  const handleSaveVendorCat = async () => {
    if (editingVendorCat) {
      await updateVendorCategory.mutateAsync({ id: editingVendorCat.id, ...vendorCatForm });
    } else {
      await createVendorCategory.mutateAsync({ vendor_id: null as any, name: vendorCatForm.name, description: vendorCatForm.description || null } as any);
    }
    setVendorCatDialogOpen(false);
  };

  const filteredVendorCats = vendorCatSearch
    ? vendorCategories.filter((c: any) => c.name?.toLowerCase().includes(vendorCatSearch.toLowerCase()))
    : vendorCategories;

  // Transaction handlers
  const handleSaveTransaction = async () => {
    await createTransaction.mutateAsync({
      ...transactionForm,
      service_request_id: null,
      technician_id: null,
    });
    setTransactionDialogOpen(false);
    setTransactionForm({
      type: "expense",
      category: "operational",
      description: "",
      amount: 0,
      date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterCategory("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Filter requests for table
  const recentServices = filteredRequests
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-10 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Painel Administrativo
              </h1>
              <p className="text-muted-foreground">
                Olá, {profile?.name || "Admin"}! Gerencie toda a plataforma.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setNotificationDialogOpen(true)}>
                <Bell className="w-4 h-4 mr-2" />
                Notificar Técnicos
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>

          {/* Unresponded Requests Alert */}
          <UnrespondedRequestsList
            requests={unrespondedRequests}
            onViewDetails={(request) => {
              setSelectedService(request);
              setServiceDetailsDialogOpen(true);
            }}
            onSuggestTechnician={(request) => {
              setSuggestingForService(request);
              setSuggestTechDialogOpen(true);
            }}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-card flex-wrap h-auto">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="technicians">Técnicos</TabsTrigger>
              <TabsTrigger value="vendors">Vendedores</TabsTrigger>
              <TabsTrigger value="delivery">Entregadores</TabsTrigger>
              <TabsTrigger value="clients">Clientes</TabsTrigger>
              <TabsTrigger value="services">Serviços</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="specialties">Especialidades</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="payments">Pagamentos</TabsTrigger>
              <TabsTrigger value="vendor-categories">Cat. Loja</TabsTrigger>
              <TabsTrigger value="support">Suporte</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Pending Approvals */}
                <div className="lg:col-span-2">
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <h2 className="font-display text-lg font-semibold text-foreground">
                            Aprovações Pendentes
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {pendingTechnicians.length} técnicos aguardando aprovação
                          </p>
                        </div>
                      </div>
                    </div>

                    {loadingPending ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      </div>
                    ) : pendingTechnicians.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma aprovação pendente
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {pendingTechnicians.slice(0, 5).map((tech) => (
                          <div
                            key={tech.id}
                            className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                          >
                            <div className="flex items-center gap-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {tech.profile?.name?.split(" ").map((n) => n[0]).join("") || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">
                                  {tech.profile?.name || "Técnico"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {tech.specialties?.join(", ") || "Sem especialidade"} • {tech.profile?.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTechnician(tech);
                                  setTechnicianDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Perfil
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleReject(tech.id)}
                                disabled={rejectTechnician.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1 text-destructive" />
                                Recusar
                              </Button>
                              <Button 
                                size="sm" 
                                className="gradient-primary text-primary-foreground"
                                onClick={() => handleApprove(tech.id)}
                                disabled={approveTechnician.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories Overview with Pagination */}
                <div>
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-display text-lg font-semibold text-foreground">
                        Categorias
                      </h2>
                      <Button variant="ghost" size="sm" onClick={() => openCategoryDialog()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {loadingCategories ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      </div>
                    ) : categories.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma categoria criada
                      </p>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {paginatedCategories.map((category) => {
                            const categoryServices = requests.filter((r) => r.category_id === category.id);
                            const categoryRevenue = categoryServices
                              .filter((r) => r.status === "completed")
                              .reduce((sum, r) => sum + (r.total_price || 0), 0);

                            return (
                              <div
                                key={category.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                                onClick={() => openCategoryDialog(category)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Wrench className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{category.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {categoryServices.length} serviços
                                    </p>
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-primary">
                                  {categoryRevenue.toLocaleString()} Kz
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Pagination */}
                        {totalCategoryPages > 1 && (
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
                              disabled={categoryPage === 1}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              {categoryPage} de {totalCategoryPages}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCategoryPage((p) => Math.min(totalCategoryPages, p + 1))}
                              disabled={categoryPage === totalCategoryPages}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Services with Filters */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Serviços ({filteredRequests.length})
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos Status</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="accepted">Aceito</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas Categorias</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[130px]">
                          <Calendar className="w-4 h-4 mr-2" />
                          {dateFrom ? format(dateFrom, "dd/MM", { locale: ptBR }) : "De"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[130px]">
                          <Calendar className="w-4 h-4 mr-2" />
                          {dateTo ? format(dateTo, "dd/MM", { locale: ptBR }) : "Até"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    {(searchQuery || filterStatus !== "all" || filterCategory !== "all" || dateFrom || dateTo) && (
                      <Button variant="ghost" onClick={clearFilters}>
                        Limpar
                      </Button>
                    )}
                  </div>
                </div>

                {loadingRequests ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : recentServices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum serviço encontrado
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Serviço</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Endereço</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Valor</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                          <th className="text-right py-3 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentServices.map((service) => (
                          <tr key={service.id} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-4 px-4">
                              <span className="font-medium text-foreground">
                                {service.category?.name || "Serviço"}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-muted-foreground max-w-[200px] truncate">
                              {service.address}
                            </td>
                            <td className="py-4 px-4 font-medium text-foreground">
                              {service.total_price.toLocaleString()} Kz
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(service.status)}
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground">
                              {format(new Date(service.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedService(service);
                                  setServiceDetailsDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Detalhes
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pending Services with Pagination */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Serviços Pendentes ({pendingFilteredRequests.length})
                  </h2>
                </div>

                {paginatedPendingRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum serviço pendente
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {paginatedPendingRequests.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                        >
                          <div>
                            <p className="font-medium text-foreground">{service.category?.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {service.address}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">
                              {service.total_price.toLocaleString()} Kz
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedService(service);
                                setServiceDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalPendingPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingServicesPage((p) => Math.max(1, p - 1))}
                          disabled={pendingServicesPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {pendingServicesPage} de {totalPendingPages}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingServicesPage((p) => Math.min(totalPendingPages, p + 1))}
                          disabled={pendingServicesPage === totalPendingPages}
                        >
                          Próxima
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Technicians Tab */}
            <TabsContent value="technicians">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Técnicos Ativos ({filteredTechnicians.length})
                  </h2>
                  <div className="flex gap-3">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar técnico..."
                        className="pl-9"
                        value={technicianSearch}
                        onChange={(e) => setTechnicianSearch(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" onClick={() => setNotificationDialogOpen(true)}>
                      <Bell className="w-4 h-4 mr-2" />
                      Notificar Todos
                    </Button>
                  </div>
                </div>
                {filteredTechnicians.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {technicianSearch ? "Nenhum técnico encontrado" : "Nenhum técnico ativo"}
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTechnicians.map((tech) => (
                      <div 
                        key={tech.id} 
                        className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {tech.profile?.name?.split(" ").map((n) => n[0]).join("") || "T"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{tech.profile?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{tech.profile?.email}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="shrink-0"
                              onClick={() => {
                                setSelectedTechnician(tech);
                                setTechnicianDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="shrink-0"
                              onClick={() => {
                                setEditingTechnicianData(tech);
                                setTechnicianEditDialogOpen(true);
                              }}
                            >
                              <UserCog className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {tech.specialties?.slice(0, 2).map((specialty, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {tech.specialties && tech.specialties.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{tech.specialties.length - 2}
                            </Badge>
                          )}
                        </div>
                        {/* Wallet Balance */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 mb-2">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Carteira:</span>
                            <span className={`text-sm font-semibold ${
                              (tech.wallet_balance || 0) <= 0 ? "text-destructive" : "text-success"
                            }`}>
                              {(tech.wallet_balance || 0).toLocaleString("pt-AO")} Kz
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setWalletDepositTechnician(tech);
                              setWalletDepositDialogOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Carregar
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-primary fill-primary" />
                            <span>{tech.rating?.toFixed(1) || "0.0"}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {tech.completed_jobs} serviços
                          </span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {tech.credits || 0} créditos
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Clients Tab */}
            <TabsContent value="clients">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Clientes ({filteredClients.length})
                  </h2>
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente..."
                      className="pl-9"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                    />
                  </div>
                </div>
                {filteredClients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {clientSearch ? "Nenhum cliente encontrado" : "Nenhum cliente registrado"}
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map((client) => {
                      const clientRequests = requests.filter((r) => r.client_id === client.user_id);
                      return (
                        <div 
                          key={client.id} 
                          className="p-4 rounded-xl bg-secondary/50 cursor-pointer hover:bg-secondary/70 transition-colors"
                          onClick={() => {
                            setSelectedProfile(client);
                            setProfileDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-warning/10 text-warning">
                                {client.name?.split(" ").map((n) => n[0]).join("") || "C"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{client.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{clientRequests.length} solicitações</span>
                            <span>•</span>
                            <span>{client.phone || "Sem telefone"}</span>
                            {client.client_type && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {client.client_type}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Serviços Cadastrados ({filteredServices.length})
                  </h2>
                  <div className="flex gap-3">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar serviço..."
                        className="pl-9"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => openServiceDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Serviço
                    </Button>
                  </div>
                </div>
                
                {loadingServices ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : filteredServices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {serviceSearch ? "Nenhum serviço encontrado" : "Nenhum serviço cadastrado. Primeiro crie uma categoria, depois adicione serviços."}
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredServices.map((service) => {
                      const IconComponent = iconMap[service.icon.toLowerCase()] || Wrench;
                      return (
                        <div key={service.id} className="p-4 rounded-xl bg-secondary/50">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                                <IconComponent className="w-5 h-5 text-primary-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{service.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {service.category?.name || "Sem categoria"}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openServiceDialog(service)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteService.mutate(service.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm font-medium text-primary">
                              {service.base_price.toLocaleString()} Kz
                            </p>
                            <Badge className={
                              (service as any).price_type === "quote"
                                ? "bg-warning/10 text-warning border-0 text-[10px]"
                                : "bg-success/10 text-success border-0 text-[10px]"
                            }>
                              {(service as any).price_type === "quote" ? "Orçamento" : "Fixo"}
                            </Badge>
                          </div>
                          {(service as any).price_type === "quote" && (service as any).suggested_price_min != null && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Faixa: {((service as any).suggested_price_min || 0).toLocaleString()} - {((service as any).suggested_price_max || 0).toLocaleString()} Kz
                            </p>
                          )}
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Categorias de Serviço ({filteredCategories.length})
                  </h2>
                  <div className="flex gap-3">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar categoria..."
                        className="pl-9"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => openCategoryDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </div>
                </div>
                
                {loadingCategories ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {categorySearch ? "Nenhuma categoria encontrada" : "Nenhuma categoria criada"}
                  </p>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedCategories.map((category) => (
                        <div key={category.id} className="p-4 rounded-xl bg-secondary/50">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground text-lg">{category.name}</p>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openCategoryDialog(category)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteCategory.mutate(category.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalCategoryPages > 1 && (
                      <div className="flex items-center justify-center gap-4 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
                          disabled={categoryPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {categoryPage} de {totalCategoryPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCategoryPage((p) => Math.min(totalCategoryPages, p + 1))}
                          disabled={categoryPage === totalCategoryPages}
                        >
                          Próxima
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            {/* Specialties Tab */}
            <TabsContent value="specialties">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Especialidades ({filteredSpecialties.length})
                  </h2>
                  <div className="flex gap-3">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar especialidade..."
                        className="pl-9"
                        value={specialtySearch}
                        onChange={(e) => setSpecialtySearch(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => openSpecialtyDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Especialidade
                    </Button>
                  </div>
                </div>
                
                {loadingSpecialties ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : filteredSpecialties.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {specialtySearch ? "Nenhuma especialidade encontrada" : "Nenhuma especialidade criada. Primeiro cadastre serviços, depois adicione especialidades."}
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSpecialties.map((specialty) => (
                      <div key={specialty.id} className="p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-foreground">{specialty.name}</p>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openSpecialtyDialog(specialty)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteSpecialty.mutate(specialty.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Categoria: {specialty.category?.name || "N/A"}
                        </p>
                        {specialty.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {specialty.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Módulo Financeiro
                  </h2>
                  <Button onClick={() => setTransactionDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Transação
                  </Button>
                </div>

                <FinancialCharts summary={summary} />

                {/* Transactions List */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                    Últimas Transações
                  </h3>
                  {transactions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma transação registrada
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 10).map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                          <div>
                            <p className="font-medium text-foreground">{t.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR })} • {t.category}
                            </p>
                          </div>
                          <span className={`font-bold ${
                            t.type === "income" ? "text-success" : 
                            t.type === "expense" ? "text-destructive" : "text-warning"
                          }`}>
                            {t.type === "income" ? "+" : "-"}{t.amount.toLocaleString()} Kz
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Payments Tab - Multicaixa References */}
            <TabsContent value="payments">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Pagamentos por Referência
                  </h2>
                </div>
                <PendingPaymentsList />
              </div>
            </TabsContent>

            {/* Vendors Tab */}
            <TabsContent value="vendors">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Vendedores ({filteredVendors.length})
                  </h2>
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar vendedor..." className="pl-9" value={vendorSearch} onChange={(e) => setVendorSearch(e.target.value)} />
                  </div>
                </div>
                {loadingVendors ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                ) : filteredVendors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum vendedor encontrado</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVendors.map((v) => (
                      <div key={v.id} className="p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {v.store_name?.[0] || v.profile?.name?.[0] || "V"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{v.store_name || v.profile?.name || "Vendedor"}</p>
                            <p className="text-xs text-muted-foreground truncate">{v.profile?.email}</p>
                          </div>
                          <Badge variant={v.verified ? "default" : "secondary"}>
                            {v.verified ? "Verificado" : "Pendente"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 mb-2">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Carteira:</span>
                            <span className={`text-sm font-semibold ${(v.wallet_balance || 0) <= 0 ? "text-destructive" : "text-success"}`}>
                              {(v.wallet_balance || 0).toLocaleString("pt-AO")} Kz
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Store className="w-4 h-4" />
                          <span>{v.vendor_type} • {v.completed_orders || 0} pedidos</span>
                        </div>
                        {!v.verified && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => rejectVendorMut.mutate(v.id)} disabled={rejectVendorMut.isPending}>
                              <XCircle className="w-4 h-4 mr-1 text-destructive" /> Recusar
                            </Button>
                            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => approveVendor.mutate(v.id)} disabled={approveVendor.isPending}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Entregadores ({filteredDeliveryPersons.length})
                  </h2>
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar entregador..." className="pl-9" value={deliverySearch} onChange={(e) => setDeliverySearch(e.target.value)} />
                  </div>
                </div>
                {loadingDelivery ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
                ) : filteredDeliveryPersons.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum entregador encontrado</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDeliveryPersons.map((d) => (
                      <div key={d.id} className="p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {d.profile?.name?.split(" ").map((n: string) => n[0]).join("") || "E"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{d.profile?.name || "Entregador"}</p>
                            <p className="text-xs text-muted-foreground truncate">{d.profile?.email}</p>
                          </div>
                          <Badge variant={d.verified ? "default" : "secondary"}>
                            {d.verified ? "Verificado" : "Pendente"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 mb-2">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Carteira:</span>
                            <span className={`text-sm font-semibold ${(d.wallet_balance || 0) <= 0 ? "text-destructive" : "text-success"}`}>
                              {(d.wallet_balance || 0).toLocaleString("pt-AO")} Kz
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Truck className="w-4 h-4" />
                          <span>{d.vehicle_type || "N/A"} • {d.completed_deliveries || 0} entregas</span>
                        </div>
                        {!d.verified && (
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => rejectDeliveryMut.mutate(d.id)} disabled={rejectDeliveryMut.isPending}>
                              <XCircle className="w-4 h-4 mr-1 text-destructive" /> Recusar
                            </Button>
                            <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => approveDelivery.mutate(d.id)} disabled={approveDelivery.isPending}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Vendor Categories Tab */}
            <TabsContent value="vendor-categories">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Categorias de Loja ({filteredVendorCats.length})
                  </h2>
                  <div className="flex gap-3">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar categoria..."
                        className="pl-9"
                        value={vendorCatSearch}
                        onChange={(e) => setVendorCatSearch(e.target.value)}
                      />
                    </div>
                    <Button onClick={() => openVendorCatDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </div>
                </div>
                
                {filteredVendorCats.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {vendorCatSearch ? "Nenhuma categoria encontrada" : "Nenhuma categoria de loja criada"}
                  </p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVendorCats.map((cat: any) => (
                      <div key={cat.id} className="p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground text-lg">{cat.name}</p>
                            {cat.description && <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openVendorCatDialog(cat)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteVendorCategory.mutate(cat.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground">Apoio ao Cliente</h2>
                    <p className="text-sm text-muted-foreground">Disputas e tickets de suporte reportados por clientes e técnicos</p>
                  </div>
                </div>
                <SupportTicketsList />
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sliders className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-foreground">Configurações da Plataforma</h2>
                    <p className="text-sm text-muted-foreground">Defina taxas e parâmetros globais</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Cancellation Fee */}
                  <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-warning" />
                      <h3 className="font-medium text-foreground">Taxa de Cancelamento</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Taxa cobrada ao cliente quando cancela o serviço após o técnico já ter chegado ao local.
                      Se o técnico não chegar, o cliente não paga.
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder={String(getSettingNumber("cancellation_fee", 2000))}
                        value={cancellationFeeInput}
                        onChange={(e) => setCancellationFeeInput(e.target.value)}
                        className="w-40"
                      />
                      <span className="text-sm text-muted-foreground">Kz</span>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (cancellationFeeInput) {
                            updateSetting.mutate({
                              key: "cancellation_fee",
                              value: cancellationFeeInput,
                              description: "Taxa de cancelamento (Kz) quando o técnico já chegou ao local",
                            });
                            setCancellationFeeInput("");
                          }
                        }}
                        disabled={!cancellationFeeInput || updateSetting.isPending}
                      >
                        {updateSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Valor atual: <strong>{getSettingNumber("cancellation_fee", 2000).toLocaleString()} Kz</strong>
                    </p>
                  </div>

                  {/* Low Balance Threshold */}
                  <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-warning" />
                      <h3 className="font-medium text-foreground">Limite de Saldo Baixo</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Quando o saldo do profissional (técnico, vendedor ou entregador) ficar abaixo deste valor, 
                      um alerta será exibido. Se chegar a zero, o profissional fica invisível para os clientes.
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        placeholder={String(getSettingNumber("low_balance_threshold", 500))}
                        value={lowBalanceInput}
                        onChange={(e) => setLowBalanceInput(e.target.value)}
                        className="w-40"
                      />
                      <span className="text-sm text-muted-foreground">Kz</span>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (lowBalanceInput) {
                            updateSetting.mutate({
                              key: "low_balance_threshold",
                              value: lowBalanceInput,
                              description: "Limite de saldo baixo para alertar profissionais (Kz)",
                            });
                            setLowBalanceInput("");
                          }
                        }}
                        disabled={!lowBalanceInput || updateSetting.isPending}
                      >
                        {updateSetting.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Valor atual: <strong>{getSettingNumber("low_balance_threshold", 500).toLocaleString()} Kz</strong>
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Category Dialog (simplified - just name) */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              Categorias identificam tipos de serviços. Adicione apenas o nome.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Categoria</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Ex: Elétrica, Hidráulica, Limpeza..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCategory}
              disabled={!categoryForm.name || createCategory.isPending || updateCategory.isPending}
            >
              {(createCategory.isPending || updateCategory.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes do serviço: categoria, descrição, ícone e preço base.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={serviceForm.category_id}
                onValueChange={(value) => setServiceForm({ ...serviceForm, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome do Serviço</Label>
              <Input
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="Ex: Instalação de tomadas"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                placeholder="Descreva o serviço..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex gap-2 flex-wrap">
                {iconOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setServiceForm({ ...serviceForm, icon: option.value })}
                    className={`p-2 rounded-lg transition-colors ${
                      serviceForm.icon === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    <option.icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Tipo de Preço</Label>
              <Select
                value={serviceForm.price_type}
                onValueChange={(value) => setServiceForm({ ...serviceForm, price_type: value as "fixed" | "quote" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixo (definido pela plataforma)</SelectItem>
                  <SelectItem value="quote">Orçamento (técnico define o preço)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {serviceForm.price_type === "fixed" 
                  ? "O preço é fixo e definido pelo administrador." 
                  : "O técnico envia um orçamento ao cliente, que pode aceitar ou recusar."}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{serviceForm.price_type === "fixed" ? "Preço Base (Kz)" : "Preço Base de Referência (Kz)"}</Label>
              <Input
                type="number"
                value={serviceForm.base_price}
                onChange={(e) => setServiceForm({ ...serviceForm, base_price: Number(e.target.value) })}
                placeholder="15000"
              />
            </div>

            {serviceForm.price_type === "quote" && (
              <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 space-y-3">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Faixa de Preço Sugerida
                </p>
                <p className="text-xs text-muted-foreground">
                  Define a faixa de preço recomendada para este serviço. O técnico receberá um alerta se o orçamento estiver fora desta faixa.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Mínimo (Kz)</Label>
                    <Input
                      type="number"
                      value={serviceForm.suggested_price_min}
                      onChange={(e) => setServiceForm({ ...serviceForm, suggested_price_min: Number(e.target.value) })}
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Máximo (Kz)</Label>
                    <Input
                      type="number"
                      value={serviceForm.suggested_price_max}
                      onChange={(e) => setServiceForm({ ...serviceForm, suggested_price_max: Number(e.target.value) })}
                      placeholder="25000"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Comissão da Plataforma (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={serviceForm.commission_percentage}
                onChange={(e) => setServiceForm({ ...serviceForm, commission_percentage: Number(e.target.value) })}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">Percentagem deduzida do valor total do serviço</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveService}
              disabled={!serviceForm.name || !serviceForm.category_id || createService.isPending || updateService.isPending}
            >
              {(createService.isPending || updateService.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Specialty Dialog */}
      <Dialog open={specialtyDialogOpen} onOpenChange={setSpecialtyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSpecialty ? "Editar Especialidade" : "Nova Especialidade"}
            </DialogTitle>
            <DialogDescription>
              Especialidades são vinculadas a categorias.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria Relacionada</Label>
              <Select
                value={specialtyForm.category_id}
                onValueChange={(value) => setSpecialtyForm({ ...specialtyForm, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome da Especialidade</Label>
              <Input
                value={specialtyForm.name}
                onChange={(e) => setSpecialtyForm({ ...specialtyForm, name: e.target.value })}
                placeholder="Ex: Instalação residencial"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={specialtyForm.description}
                onChange={(e) => setSpecialtyForm({ ...specialtyForm, description: e.target.value })}
                placeholder="Descreva a especialidade..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpecialtyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveSpecialty}
              disabled={!specialtyForm.name || !specialtyForm.category_id || createSpecialty.isPending || updateSpecialty.isPending}
            >
              {(createSpecialty.isPending || updateSpecialty.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogDescription>
              Registre entradas ou saídas financeiras.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={transactionForm.type}
                onValueChange={(value: "income" | "expense" | "commission") => 
                  setTransactionForm({ ...transactionForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada</SelectItem>
                  <SelectItem value="expense">Saída</SelectItem>
                  <SelectItem value="commission">Comissão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={transactionForm.category}
                onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                placeholder="Ex: Operacional, Marketing..."
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={transactionForm.description}
                onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                placeholder="Descreva a transação..."
              />
            </div>

            <div className="space-y-2">
              <Label>Valor (Kz)</Label>
              <Input
                type="number"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: Number(e.target.value) })}
                placeholder="10000"
              />
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={transactionForm.date}
                onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveTransaction}
              disabled={!transactionForm.description || !transactionForm.amount || createTransaction.isPending}
            >
              {createTransaction.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Technician Profile Dialog */}
      <TechnicianProfileDialog
        technician={selectedTechnician}
        open={technicianDialogOpen}
        onOpenChange={setTechnicianDialogOpen}
        onApprove={handleApprove}
        onReject={handleReject}
        isPending={approveTechnician.isPending || rejectTechnician.isPending}
        showActions={!selectedTechnician?.verified}
      />

      {/* Service Details Dialog */}
      <ServiceDetailsDialog
        service={selectedService}
        open={serviceDetailsDialogOpen}
        onOpenChange={setServiceDetailsDialogOpen}
      />

      {/* Profile Edit Dialog */}
      <ProfileEditDialog
        profile={selectedProfile}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />

      {/* Technician Edit Dialog */}
      <TechnicianEditDialog
        technician={editingTechnicianData}
        open={technicianEditDialogOpen}
        onOpenChange={setTechnicianEditDialogOpen}
      />

      {/* Notification Broadcast Dialog */}
      <NotificationBroadcastDialog
        open={notificationDialogOpen}
        onOpenChange={setNotificationDialogOpen}
      />

      {/* Suggest Technician Dialog */}
      <SuggestTechnicianDialog
        open={suggestTechDialogOpen}
        onOpenChange={setSuggestTechDialogOpen}
        serviceRequest={suggestingForService}
        technicians={technicians}
        onSuccess={() => {
          setSuggestingForService(null);
        }}
      />

      {/* Wallet Deposit Dialog */}
      <WalletDepositDialog
        technician={walletDepositTechnician}
        open={walletDepositDialogOpen}
        onOpenChange={setWalletDepositDialogOpen}
      />

      {/* Vendor Category Dialog */}
      <Dialog open={vendorCatDialogOpen} onOpenChange={setVendorCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVendorCat ? "Editar" : "Nova"} Categoria de Loja</DialogTitle>
            <DialogDescription>Categorias globais que todos os vendedores podem usar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={vendorCatForm.name}
                onChange={(e) => setVendorCatForm({ ...vendorCatForm, name: e.target.value })}
                placeholder="Ex: Eletrônicos, Vestuário..."
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={vendorCatForm.description}
                onChange={(e) => setVendorCatForm({ ...vendorCatForm, description: e.target.value })}
                placeholder="Breve descrição da categoria..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVendorCatDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveVendorCat} disabled={!vendorCatForm.name}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
