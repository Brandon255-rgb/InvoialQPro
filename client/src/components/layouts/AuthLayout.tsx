import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";

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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="text-center">
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-6xl font-montserrat font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-accent-600 to-accent-500 bg-clip-text text-transparent">Invoa</span>
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">IQ</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-3 text-base text-gray-600 font-medium"
          >
            Professional Invoice Management
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-2xl shadow-gray-100/50 sm:rounded-2xl sm:px-10 border border-gray-100/50">
            <div className="mb-8">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="text-3xl font-montserrat font-bold text-gray-900 text-center"
              >
                {title}
              </motion.h2>
              {subtitle && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                  className="mt-3 text-center text-base text-gray-600"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>

            {children}

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-8"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white/80 backdrop-blur-sm px-4 text-gray-500">
                    {type === "login" ? "New to invoiaiqpro?" : "Already have an account?"}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                {type === "login" ? (
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    Create a new account
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-primary-600 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    Sign in to your account
                  </Link>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-8 pt-6 border-t border-gray-100"
            >
              <div className="flex justify-center space-x-6 text-sm">
                <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Help Center</a>
              </div>
              <p className="mt-4 text-center text-xs text-gray-400">
                © {new Date().getFullYear()} InvoaIQ Pro. All rights reserved.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
