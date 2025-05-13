import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/not-found';
import ProtectedRoute from './components/ProtectedRoute';
import Reports from './pages/Reports';
import Settings from './pages/settings';
import Clients from './pages/clients';
import ClientCreate from './pages/clients/create';
import ClientEdit from './pages/clients/[id]';
import Invoices from './pages/invoices';
import InvoiceCreate from './pages/invoices/create';
import InvoiceEdit from './pages/invoices/[id]';
import Items from './pages/items';
import ItemCreate from './pages/items/create';
import ItemEdit from './pages/items/[id]';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="clients">
              <Route index element={<Clients />} />
              <Route path="create" element={<ClientCreate />} />
              <Route path=":id" element={<ClientEdit />} />
            </Route>
            <Route path="invoices">
              <Route index element={<Invoices />} />
              <Route path="create" element={<InvoiceCreate />} />
              <Route path=":id" element={<InvoiceEdit />} />
            </Route>
            <Route path="items">
              <Route index element={<Items />} />
              <Route path="create" element={<ItemCreate />} />
              <Route path=":id" element={<ItemEdit />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
