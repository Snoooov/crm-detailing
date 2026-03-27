import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import OrdersPage from './pages/orders/OrdersPage.jsx';
import OrderDetailPage from './pages/orders/OrderDetailPage.jsx';
import OrderFormPage from './pages/orders/OrderFormPage.jsx';
import ClientsPage from './pages/clients/ClientsPage.jsx';
import ClientDetailPage from './pages/clients/ClientDetailPage.jsx';
import VehiclesPage from './pages/vehicles/VehiclesPage.jsx';
import VehicleDetailPage from './pages/vehicles/VehicleDetailPage.jsx';
import Layout from './components/Layout.jsx';
import OrderReceptionCard from './pages/orders/OrderReceptionCard.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Ładowanie...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/new" element={<OrderFormPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="vehicles/:id" element={<VehicleDetailPage />} />
            <Route path="orders/:id/reception" element={<OrderReceptionCard />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;