import React from "react";
import { Link } from "wouter";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  type: "login" | "register";
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  type,
}) => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-4xl font-montserrat font-bold tracking-tight">
          <span className="text-accent-600">Invoa</span>
          <span className="text-primary-600">IQ</span>
        </h1>
        <h2 className="mt-6 text-center text-2xl font-montserrat font-bold text-gray-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  {type === "login" ? "New to InvoaIQ?" : "Already have an account?"}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              {type === "login" ? (
                <Link
                  href="/register"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Create a new account
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Sign in to your account
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
