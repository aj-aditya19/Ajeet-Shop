import { Route, Routes, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import { AdminRoute, ProtectedRoute } from './components/RouteGuards';
import Landing from './pages/Landing';
import ShopHome from './pages/shop/ShopHome';
import Contact from './pages/shop/Contact';
import { Login, Register } from './pages/shop/AuthPages';
import RequestService from './pages/shop/RequestService';
import RequestSuccess from './pages/shop/RequestSuccess';
import Dashboard from './pages/shop/Dashboard';
import MyRequestDetail from './pages/shop/MyRequestDetail';
import CateringPublic from './pages/catering/CateringPublic';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRequests from './pages/admin/AdminRequests';
import AdminRequestDetail from './pages/admin/AdminRequestDetail';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminCustomerDetail from './pages/admin/AdminCustomerDetail';
import AdminServices from './pages/admin/AdminServices';
import CateringDashboard from './pages/admin/CateringDashboard';
import CateringEquipment from './pages/admin/CateringEquipment';
import CateringRentals from './pages/admin/CateringRentals';
import CateringClients from './pages/admin/CateringClients';
import CateringReports from './pages/admin/CateringReports';
import PhotoStudio from './pages/admin/PhotoStudio';

const NotFound = () => (
  <div className="py-24 text-center"><h1 className="text-3xl font-bold">Page not found</h1><a className="btn-primary mt-6" href="/">Go home</a></div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/shop" element={<PublicLayout variant="shop" />}>
        <Route index element={<ShopHome />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="request" element={<ProtectedRoute><RequestService /></ProtectedRoute>} />
        <Route path="request/success" element={<ProtectedRoute><RequestSuccess /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="requests/:id" element={<ProtectedRoute><MyRequestDetail /></ProtectedRoute>} />
      </Route>

      <Route path="/catering" element={<PublicLayout variant="catering" />}>
        <Route index element={<CateringPublic />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="shop/requests" element={<AdminRequests />} />
        <Route path="shop/requests/:id" element={<AdminRequestDetail />} />
        <Route path="shop/customers" element={<AdminCustomers />} />
        <Route path="shop/customers/:id" element={<AdminCustomerDetail />} />
        <Route path="shop/services" element={<AdminServices />} />
        <Route path="shop/photo-studio" element={<PhotoStudio />} />
        <Route path="catering" element={<CateringDashboard />} />
        <Route path="catering/rentals" element={<CateringRentals />} />
        <Route path="catering/equipment" element={<CateringEquipment />} />
        <Route path="catering/clients" element={<CateringClients />} />
        <Route path="catering/reports" element={<CateringReports />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
