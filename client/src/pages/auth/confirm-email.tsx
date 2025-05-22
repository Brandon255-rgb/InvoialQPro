import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";

export default function ConfirmEmail() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCheckEmail, setShowCheckEmail] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const type = params.get('type');
    if (!token) {
      setShowCheckEmail(true);
      return;
    }
    setIsVerifying(true);
    const verifyEmail = async () => {
      try {
        if (type === 'signup') {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });
          if (verifyError) throw verifyError;
          setIsVerified(true);
          toast({
            title: "Email verified successfully!",
            description: "You can now log in to your account.",
          });
        } else if (type === 'recovery') {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });
          if (verifyError) throw verifyError;
          setIsVerified(true);
          toast({
            title: "Email verified successfully!",
            description: "You can now reset your password.",
          });
        } else {
          setError("Invalid verification type");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify email");
        toast({
          title: "Verification failed",
          description: "The verification link may have expired or is invalid.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };
    verifyEmail();
  }, [toast]);

  return (
    <AuthLayout
      title="Confirm your email"
      subtitle="Almost there!"
      type="login"
    >
      <div className="flex flex-col items-center space-y-6">
        {showCheckEmail ? (
          <div className="flex flex-col items-center space-y-4">
            <Mail className="h-12 w-12 text-blue-500" />
            <p className="text-center text-gray-200">
              We've sent a confirmation link to your email address.<br />
              Please check your inbox and click the link to activate your account.
            </p>
            <Link href="/login">
              <Button>Continue to Login</Button>
            </Link>
          </div>
        ) : isVerifying ? (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-center text-gray-200">
              Verifying your email...
            </p>
          </div>
        ) : isVerified ? (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-center text-gray-200">
              Your email has been verified successfully!
            </p>
            <Link href="/login">
              <Button>Continue to Login</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <p className="text-center text-gray-200">
              {error || "Failed to verify your email. The link may have expired."}
            </p>
            <div className="flex flex-col space-y-2">
              <Link href="/login">
                <Button>Back to Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Create New Account</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 