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
            className="text-5xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">Invoa</span>
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
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="bg-purple-50/80 backdrop-blur-sm py-8 px-4 shadow-xl shadow-purple-100/50 sm:rounded-2xl sm:px-10 border border-purple-100/50">
            <div className="mb-6">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="text-2xl font-semibold text-gray-900 text-center"
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
              className="mt-6"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-purple-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-purple-50/80 backdrop-blur-sm px-4 text-gray-500">
                    {type === "login" ? "New to invoiaiqpro?" : "Already have an account?"}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                {type === "login" ? (
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                  >
                    Create account
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
