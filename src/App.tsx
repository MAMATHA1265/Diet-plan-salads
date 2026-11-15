import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AppointmentsPage from './pages/AppointmentsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import HomePage from './pages/HomePage';
import LoginRegisterPage from './pages/LoginRegisterPage';
import ManageMembersPage from './pages/ManageMembersPage';
import ManageMenuPage from './pages/ManageMenuPage';
import ManageOrdersPage from './pages/ManageOrdersPage';
import MemberDashboardPage from './pages/MemberDashboardPage';
import MenuPage from './pages/MenuPage';
import MyOrdersPage from './pages/MyOrdersPage';
import MySubscriptionPage from './pages/MySubscriptionPage';
import PlansPage from './pages/PlansPage';
import SaladBuilderPage from './pages/SaladBuilderPage';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[#FAFBF8] text-[#1A241E]">
            <Navbar />
            <div className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/builder" element={<SaladBuilderPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<LoginRegisterPage initialMode="login" />} />
                <Route path="/register" element={<LoginRegisterPage initialMode="register" />} />

                {/* Member Protected Routes */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['member', 'admin']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['member']}>
                      <MemberDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute allowedRoles={['member']}>
                      <MyOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subscription"
                  element={
                    <ProtectedRoute allowedRoles={['member']}>
                      <MySubscriptionPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/members"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageMembersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/menu"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageMenuPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
