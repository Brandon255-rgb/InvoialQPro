import React from "react";
import { Link } from "wouter";
import { User } from "@shared/schema";

interface SidebarProps {
  activeRoute: string;
  user: User;
  logout: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeRoute,
  user,
  logout,
  isMobileMenuOpen,
  toggleMobileMenu,
}) => {
  const sidebarClass = isMobileMenuOpen
    ? "fixed inset-0 z-50 flex flex-col bg-white border-r border-gray-200 h-screen md:hidden"
    : "hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 h-screen";

  return (
    <aside className={sidebarClass}>
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Link href="/">
            <a className="font-montserrat font-bold text-2xl text-primary-600">
              <span className="text-accent-600">Invoa</span>IQ
            </a>
          </Link>
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={toggleMobileMenu}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
        <div className="space-y-1">
          <Link href="/dashboard">
            <a
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                activeRoute === "dashboard"
                  ? "text-primary-700 bg-primary-50"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i
                className={`fas fa-chart-line w-5 h-5 mr-3 ${
                  activeRoute === "dashboard"
                    ? "text-primary-500"
                    : "text-gray-500"
                }`}
              ></i>
              <span>Dashboard</span>
            </a>
          </Link>
          <Link href="/invoices">
            <a
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                activeRoute === "invoices"
                  ? "text-primary-700 bg-primary-50"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i
                className={`fas fa-file-invoice-dollar w-5 h-5 mr-3 ${
                  activeRoute === "invoices"
                    ? "text-primary-500"
                    : "text-gray-500"
                }`}
              ></i>
              <span>Invoices</span>
            </a>
          </Link>
          <Link href="/clients">
            <a
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                activeRoute === "clients"
                  ? "text-primary-700 bg-primary-50"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i
                className={`fas fa-users w-5 h-5 mr-3 ${
                  activeRoute === "clients"
                    ? "text-primary-500"
                    : "text-gray-500"
                }`}
              ></i>
              <span>Clients</span>
            </a>
          </Link>
          <Link href="/items">
            <a
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                activeRoute === "items"
                  ? "text-primary-700 bg-primary-50"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i
                className={`fas fa-box w-5 h-5 mr-3 ${
                  activeRoute === "items" ? "text-primary-500" : "text-gray-500"
                }`}
              ></i>
              <span>Items</span>
            </a>
          </Link>
          <Link href="/reports">
            <a
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                activeRoute === "reports"
                  ? "text-primary-700 bg-primary-50"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i
                className={`fas fa-chart-pie w-5 h-5 mr-3 ${
                  activeRoute === "reports"
                    ? "text-primary-500"
                    : "text-gray-500"
                }`}
              ></i>
              <span>Reports</span>
            </a>
          </Link>
          <Link href="/settings">
            <a
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                activeRoute === "settings"
                  ? "text-primary-700 bg-primary-50"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i
                className={`fas fa-cog w-5 h-5 mr-3 ${
                  activeRoute === "settings"
                    ? "text-primary-500"
                    : "text-gray-500"
                }`}
              ></i>
              <span>Settings</span>
            </a>
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <div className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Subscription
          </div>
          <div className="bg-accent-50 rounded-lg p-3 mx-2">
            <p className="text-xs text-accent-800 font-medium">
              You're on the <span className="font-bold">Pro Plan</span>
            </p>
            <div className="mt-2 h-1.5 w-full bg-accent-200 rounded-full overflow-hidden">
              <div
                className="bg-accent-600 h-full rounded-full"
                style={{ width: "65%" }}
              ></div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-accent-800">65% used</span>
              <span className="text-xs text-accent-800">35 days left</span>
            </div>
            <a
              href="#"
              className="mt-2 text-xs font-medium text-accent-700 hover:text-accent-900 block text-center"
            >
              Upgrade plan →
            </a>
          </div>
        </div>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800">
            {(user?.name && typeof user.name === 'string' && user.name.length > 0) ? user.name.charAt(0) : '?'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{(user?.name && typeof user.name === 'string' && user.name.length > 0) ? user.name : 'User'}</p>
            <p className="text-xs text-gray-500">{user?.email || ''}</p>
          </div>
          <button
            onClick={logout}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
