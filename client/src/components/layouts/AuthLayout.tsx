import React from "react";

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
    <div
      className="min-h-screen flex flex-col justify-center items-center text-white"
      style={{
        background: "radial-gradient(circle at 50% 40%, #ff9100 0%, #ff6d00 60%, #2d1600 100%)"
      }}
    >
      <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(135deg, #222 60%, #111 100%)', boxShadow: '0 4px 32px 0 rgba(0,0,0,0.7), 0 2px 0 0 #fff inset' }}>
        <div className="flex flex-col items-center mb-8">
          <img src="/logoLog.svg" alt="Logo" className="h-[120px] w-[120px] object-contain mb-2" style={{ filter: 'drop-shadow(0 0 8px #fff)' }} />
          <h1 className="text-3xl font-bold text-white mb-1">{title}</h1>
          <p className="text-md text-gray-200 mb-4">{subtitle}</p>
        </div>
        {children}
        <div className="mt-8 flex flex-col items-center">
          {type === "login" ? (
            <>
              <hr className="w-full border-t border-gray-700 my-4" />
              <span className="text-gray-300">New to invoiaiqpro?</span>
              <div className="w-full flex justify-center mt-2">
                <a
                  href="/register"
                  className="text-sm text-orange-400 hover:text-orange-300 underline transition-colors"
                >
                  Create account
                </a>
              </div>
            </>
          ) : (
            <>
              <hr className="w-full border-t border-gray-700 my-4" />
              <span className="text-gray-300">Already have an account?</span>
              <div className="w-full flex justify-center mt-2">
                <a
                  href="/login"
                  className="text-sm text-orange-400 hover:text-orange-300 underline transition-colors"
                >
                  Sign in
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
