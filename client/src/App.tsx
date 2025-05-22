import { Route, Switch } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/login';
import Register from './pages/auth/register';
import NotFound from './pages/not-found';
import ProtectedRoute from './components/ProtectedRoute';
import Reports from './pages/reports';
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
import Profile from './pages/profile';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route>
            <ProtectedRoute>
              <Layout>
                <Switch>
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/" component={Dashboard} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/reports" component={Reports} />
                  <Route path="/settings" component={Settings} />
                  <Route path="/clients" component={Clients} />
                  <Route path="/clients/create" component={ClientCreate} />
                  <Route path="/clients/:id" component={ClientEdit} />
                  <Route path="/invoices" component={Invoices} />
                  <Route path="/invoices/create" component={InvoiceCreate} />
                  <Route path="/invoices/:id" component={InvoiceEdit} />
                  <Route path="/items" component={Items} />
                  <Route path="/items/create" component={ItemCreate} />
                  <Route path="/items/:id" component={ItemEdit} />
                  <Route component={NotFound} />
                </Switch>
              </Layout>
            </ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </AuthProvider>
    </ThemeProvider>
  );
}
