import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ClientDashboard from "./pages/client/ClientDashboard";
import RequestService from "./pages/client/RequestService";
import CategoryServices from "./pages/client/CategoryServices";
import AllCategories from "./pages/client/AllCategories";
import TechnicianDashboard from "./pages/technician/TechnicianDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorRequestService from "./pages/vendor/VendorRequestService";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    switch (profile.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "technician":
        return <Navigate to="/technician" replace />;
      case "client":
        return <Navigate to="/client" replace />;
      case "vendor":
        return <Navigate to="/vendor" replace />;
      case "delivery":
        return <Navigate to="/delivery" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

// Public route - redirects to dashboard if logged in
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && profile) {
    switch (profile.role) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "technician":
        return <Navigate to="/technician" replace />;
      case "client":
        return <Navigate to="/client" replace />;
      case "vendor":
        return <Navigate to="/vendor" replace />;
      case "delivery":
        return <Navigate to="/delivery" replace />;
    }
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/client" element={<ProtectedRoute allowedRoles={["client"]}><ClientDashboard /></ProtectedRoute>} />
      <Route path="/client/request" element={<ProtectedRoute allowedRoles={["client"]}><RequestService /></ProtectedRoute>} />
      <Route path="/client/category/:categoryId" element={<ProtectedRoute allowedRoles={["client"]}><CategoryServices /></ProtectedRoute>} />
      <Route path="/client/categories" element={<ProtectedRoute allowedRoles={["client"]}><AllCategories /></ProtectedRoute>} />
      <Route path="/technician" element={<ProtectedRoute allowedRoles={["technician"]}><TechnicianDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/vendor" element={<ProtectedRoute allowedRoles={["vendor"]}><VendorDashboard /></ProtectedRoute>} />
      <Route path="/vendor/request-service" element={<ProtectedRoute allowedRoles={["vendor"]}><VendorRequestService /></ProtectedRoute>} />
      <Route path="/delivery" element={<ProtectedRoute allowedRoles={["delivery"]}><DeliveryDashboard /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
