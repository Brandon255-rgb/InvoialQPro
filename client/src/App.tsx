import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Invoices from "@/pages/invoices";
import CreateInvoice from "@/pages/invoices/create";
import InvoiceDetail from "@/pages/invoices/[id]";
import Clients from "@/pages/clients";
import CreateClient from "@/pages/clients/create";
import ClientDetail from "@/pages/clients/[id]";
import Items from "@/pages/items";
import CreateItem from "@/pages/items/create";
import ItemDetail from "@/pages/items/[id]";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* App Routes */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Invoice Routes */}
      <Route path="/invoices" component={Invoices} />
      <Route path="/invoices/create" component={CreateInvoice} />
      <Route path="/invoices/:id" component={InvoiceDetail} />
      
      {/* Client Routes */}
      <Route path="/clients" component={Clients} />
      <Route path="/clients/create" component={CreateClient} />
      <Route path="/clients/:id" component={ClientDetail} />
      
      {/* Item Routes */}
      <Route path="/items" component={Items} />
      <Route path="/items/create" component={CreateItem} />
      <Route path="/items/:id" component={ItemDetail} />
      
      {/* Other Routes */}
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Add Font Awesome from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js';
    script.async = true;
    document.body.appendChild(script);
    
    // Add Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    return () => {
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);
  
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
