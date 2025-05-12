import React, { useState } from "react";
import Sidebar from "../dashboard/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useRoute } from "wouter";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  description,
  actions,
}) => {
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get current route for active menu highlighting
  const [isRootRoute] = useRoute("/");
  const [isDashboardRoute] = useRoute("/dashboard");
  const [isInvoicesRoute] = useRoute("/invoices");
  const [isClientsRoute] = useRoute("/clients");
  const [isItemsRoute] = useRoute("/items");
  const [isReportsRoute] = useRoute("/reports");
  const [isSettingsRoute] = useRoute("/settings");

  const activeRoute = isRootRoute || isDashboardRoute
    ? "dashboard"
    : isInvoicesRoute
    ? "invoices"
    : isClientsRoute
    ? "clients"
    : isItemsRoute
    ? "items"
    : isReportsRoute
    ? "reports"
    : isSettingsRoute
    ? "settings"
    : "";

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar - Desktop Only */}
      <Sidebar 
        activeRoute={activeRoute} 
        user={user} 
        logout={logout} 
        isMobileMenuOpen={isMobileMenuOpen} 
        toggleMobileMenu={toggleMobileMenu} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex justify-between items-center py-4 px-4 md:px-6">
            {/* Mobile Logo and Menu */}
            <div className="flex md:hidden items-center">
              <button 
                className="text-gray-500 hover:text-gray-700 mr-2"
                onClick={toggleMobileMenu}
              >
                <i className="fas fa-bars"></i>
              </button>
              <h1 className="font-montserrat font-bold text-xl text-primary-600">
                <span className="text-accent-600">Invoa</span>IQ
              </h1>
            </div>
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-lg mx-auto">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input 
                  type="text" 
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                  placeholder="Search invoices, clients or items..." 
                />
              </div>
            </div>
            
            {/* Right Navigation Items */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 relative">
                <i className="fas fa-bell"></i>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger"></span>
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <i className="fas fa-question-circle"></i>
              </button>
              <div className="hidden md:block border-l border-gray-300 h-6 mx-2"></div>
              <div className="hidden md:flex items-center">
                <button className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800">
                    {user.name.charAt(0)}
                  </div>
                  <span className="ml-2 mr-1">{user.name.split(' ')[0]}</span>
                  <i className="fas fa-chevron-down text-xs ml-1"></i>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-montserrat font-bold text-gray-900">{title}</h1>
              {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
            </div>
            {actions && (
              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                {actions}
              </div>
            )}
          </div>

          {/* Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
