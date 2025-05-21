import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/layouts/AuthLayout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff, Building2, User, Mail, Lock, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  company: z.string().min(1, "Company name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      company: "",
      phone: "",
      address: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    try {
      // First register the user
      await register(data.email, data.password, data.name);
      
      // Then update their profile with additional information
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: data.company,
          phone: data.phone,
          address: data.address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      setLocation("/dashboard");
      
      toast({
        title: "Registration successful",
        description: "Welcome to invoiaiqpro!",
      });
    } catch (error) {
      console.error("Registration error:", error);
      
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "This email may already be in use",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <AuthLayout 
      title="Create your account" 
      subtitle="Start managing your invoices and finances today"
      type="register"
    >
      <Form {...form}>
        <motion.form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div className="space-y-6" variants={itemVariants}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        autoComplete="name"
                        required
                        className="h-11 bg-gray-50/50 border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all duration-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="johndoe@example.com"
                        type="email"
                        autoComplete="email"
                        required
                        className="h-11 bg-gray-50/50 border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all duration-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          className="h-11 bg-gray-50/50 border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all duration-200 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormDescription className="text-sm text-gray-500">
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </FormDescription>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />
            </motion.div>

            <motion.div className="space-y-6" variants={itemVariants}>
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme Inc."
                        autoComplete="organization"
                        required
                        className="h-11 bg-gray-50/50 border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all duration-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(123) 456-7890"
                        type="tel"
                        autoComplete="tel"
                        className="h-11 bg-gray-50/50 border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all duration-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123 Business St"
                        autoComplete="street-address"
                        className="h-11 bg-gray-50/50 border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all duration-200"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-sm" />
                  </FormItem>
                )}
              />
            </motion.div>
          </div>

          <motion.div variants={itemVariants}>
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="bg-gray-50/50 rounded-xl p-4 text-center text-sm border border-gray-100"
          >
            <p className="text-gray-600">
              By creating an account, you agree to our{" "}
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                Privacy Policy
              </a>
            </p>
          </motion.div>
        </motion.form>
      </Form>
    </AuthLayout>
  );
};

export default Register;
