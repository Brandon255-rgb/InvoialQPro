import React, { useState, useEffect } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserCircle, CreditCard, Bell, Lock, Mail, Building2, Phone, MapPin, Calendar, VenusAndMars, Globe, Briefcase, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { toSnakeCase, toCamelCase } from '@/lib/caseUtils';

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  company: z.string().min(1, "Company name is required"),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  invoiceReminders: z.boolean(),
  paymentNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  reminderFrequency: z.enum(["daily", "weekly", "monthly"]),
});

const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.enum(["small", "medium", "large"]),
  currency: z.string(),
  dateFormat: z.string(),
});

const securitySchema = z.object({
  twoFactorAuth: z.boolean(),
  sessionTimeout: z.enum(["15", "30", "60", "120"]),
  loginNotifications: z.boolean(),
});

type NotificationSettings = z.infer<typeof notificationFormSchema>;
type AppearanceSettings = z.infer<typeof appearanceSchema>;
type SecuritySettings = z.infer<typeof securitySchema>;

const SECTIONS = [
  { key: "profile", label: "Profile", icon: UserCircle },
  { key: "security", label: "Security", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "appearance", label: "Appearance", icon: Globe },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "api", label: "API & Integrations", icon: Mail },
  { key: "danger", label: "Danger Zone", icon: X },
];

// Utility to set theme class on <html>
function setThemeClass(theme: 'light' | 'dark') {
  const html = document.documentElement;
  html.classList.remove('theme-light', 'theme-dark');
  html.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
}

// Utility to convert camelCase to snake_case for user_settings
function toSnakeCaseSettings(data: any) {
  return {
    ...data,
    fontsize: data.fontSize ?? data.fontsize,
    dateformat: data.dateFormat ?? data.dateformat,
    twofactorauth: data.twoFactorAuth ?? data.twofactorauth,
    sessiontimeout: data.sessionTimeout ?? data.sessiontimeout,
    loginnotifications: data.loginNotifications ?? data.loginnotifications,
    emailnotifications: data.emailNotifications ?? data.emailnotifications,
    invoicereminders: data.invoiceReminders ?? data.invoicereminders,
    paymentnotifications: data.paymentNotifications ?? data.paymentnotifications,
    marketingemails: data.marketingEmails ?? data.marketingemails,
    reminderfrequency: data.reminderFrequency ?? data.reminderfrequency,
    // Remove camelCase keys
    fontSize: undefined,
    dateFormat: undefined,
    twoFactorAuth: undefined,
    sessionTimeout: undefined,
    loginNotifications: undefined,
    emailNotifications: undefined,
    invoiceReminders: undefined,
    paymentNotifications: undefined,
    marketingEmails: undefined,
    reminderFrequency: undefined,
  };
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  // Forms setup
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.user_metadata?.name || "",
      email: user?.email || "",
      company: user?.user_metadata?.company || "",
      jobTitle: user?.user_metadata?.jobTitle || "",
      phone: user?.user_metadata?.phone || "",
      mobilePhone: user?.user_metadata?.mobilePhone || "",
      website: user?.user_metadata?.website || "",
      address: user?.user_metadata?.address || {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
      bio: user?.user_metadata?.bio || "",
      dateOfBirth: user?.user_metadata?.dateOfBirth
        ? new Date(user.user_metadata.dateOfBirth)
        : undefined,
      gender: user?.user_metadata?.gender || undefined,
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const notificationForm = useForm<NotificationSettings>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      invoiceReminders: true,
      paymentNotifications: true,
      marketingEmails: false,
      reminderFrequency: "weekly",
    },
  });

  const appearanceForm = useForm<AppearanceSettings>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: "system",
      fontSize: "medium",
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
    },
  });

  const securityForm = useForm<SecuritySettings>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      twoFactorAuth: false,
      sessionTimeout: "30",
      loginNotifications: true,
    },
  });

  // Update profile mutation
  const profileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      if (!user?.id) throw new Error("User not found");
      const response = await apiRequest("PUT", `/api/users/${user.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Change password mutation (mocked for now)
  const passwordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordFormSchema>) => {
      if (!user?.id) throw new Error("User not found");
      // This would normally call the backend API to change password
      return new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been successfully changed",
      });
      passwordForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Notification settings mutation
  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      try {
        setIsSubmitting(true);
        const snakeData = toSnakeCase(data);
        const { error } = await supabase
          .from("user_settings")
          .upsert({
            user_id: user?.id,
            ...snakeData,
            updated_at: new Date().toISOString(),
          });
        if (error) throw error;
        toast({
          title: "Settings updated",
          description: "Your notification preferences have been saved.",
        });
      } catch (error) {
        console.error("Error updating settings:", error);
        toast({
          title: "Update failed",
          description: "Failed to update settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Fetch and apply theme on mount
  useEffect(() => {
    async function fetchTheme() {
      if (!user?.id) return;
      try {
        const response = await apiRequest('GET', `/api/users/${user.id}/settings`);
        const data = await response.json();
        const camelData = toCamelCase(data);
        if (camelData?.theme) {
          setThemeClass(camelData.theme);
          appearanceForm.setValue('theme', camelData.theme);
        } else {
          setThemeClass('light');
          appearanceForm.setValue('theme', 'light');
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
        setThemeClass('light');
        appearanceForm.setValue('theme', 'light');
      }
    }
    fetchTheme();
  }, [user?.id]);

  const onNotificationSubmit = async (data: NotificationSettings) => {
    try {
      setIsSubmitting(true);
      const response = await apiRequest('PUT', `/api/users/${user?.id}/settings`, {
        ...data,
        type: 'notifications'
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Update failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    try {
      setIsSubmitting(true);

      // Update user profile through our API
      const response = await apiRequest('PUT', `/api/users/${user?.id}`, {
        name: data.name,
        email: data.email,
        company: data.company,
        jobTitle: data.jobTitle,
        phone: data.phone,
        mobilePhone: data.mobilePhone,
        website: data.website,
        address: data.address,
        bio: data.bio,
        dateOfBirth: data.dateOfBirth?.toISOString(),
        gender: data.gender,
        avatar_url: profilePicture,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      
      // Show warning if Supabase update failed but database update succeeded
      if (result.warning) {
        toast({
          title: "Profile Partially Updated",
          description: result.warning,
          variant: "warning",
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      }

      setNotification({ 
        message: result.warning ? "Profile partially updated" : "Profile has been updated", 
        type: result.warning ? "warning" : "success" 
      });

      // Refresh user data in context if needed
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile. Please try again.";
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setNotification({ message: errorMessage, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfilePictureUpdate = async (url: string) => {
    setProfilePicture(url);
    // The actual update will happen when the form is submitted
  };

  // Auto-dismiss notification after 3 seconds
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handlePasswordSubmit = (data: z.infer<typeof passwordFormSchema>) => {
    passwordMutation.mutate(data);
  };

  // Theme change handler
  const onAppearanceSubmit = async (data: AppearanceSettings) => {
    try {
      setIsSubmitting(true);
      setThemeClass(data.theme as 'light' | 'dark');
      const snakeData = toSnakeCase(data);
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          ...snakeData,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      toast({
        title: "Settings updated",
        description: "Your appearance preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSecuritySubmit = async (data: SecuritySettings) => {
    try {
      setIsSubmitting(true);
      const snakeData = toSnakeCase(data);
      const response = await apiRequest('PUT', `/api/users/${user?.id}/settings`, {
        ...snakeData,
        type: 'security'
      });
      if (!response.ok) {
        throw new Error('Failed to update security settings');
      }
      toast({
        title: "Settings updated",
        description: "Your security preferences have been saved.",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Update failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Danger Zone: Account deletion
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    if (!user?.id) return;
    try {
      setIsSubmitting(true);
      // Delete from Supabase Auth
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;
      toast({
        title: "Account deleted",
        description: "Your account has been deleted.",
      });
      // Optionally redirect or log out
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Please log in to access settings</div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start w-full min-h-[80vh] bg-background">
      {/* Settings card: nav + content */}
      <div className="bg-surface border border-border rounded-xl flex w-full max-w-5xl mt-12 shadow-xl">
        {/* Settings vertical nav */}
        <div className="py-8 px-0 flex flex-col gap-2 w-56">
          {SECTIONS.map((section) => (
            <button
              key={section.key}
              className={`text-left px-6 py-2 rounded-md font-medium transition text-muted hover:bg-border focus:outline-none focus:ring-2 focus:ring-accent flex items-center gap-2 ${
                activeSection === section.key ? 'bg-border text-accent' : ''
              }`}
              onClick={() => setActiveSection(section.key)}
              style={{ background: 'none', border: 'none' }}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 p-8">
          {/* Notification */}
          {notification && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div 
                className={`bg-black border-2 rounded-xl px-8 py-6 shadow-lg flex flex-col items-center gap-2 ${
                  notification.type === 'success' 
                    ? 'border-orange-500' 
                    : notification.type === 'warning' 
                      ? 'border-yellow-500' 
                      : 'border-red-500'
                }`}
                style={{ width: 'min(300px, 90vw)' }}
              >
                <div 
                  className={`text-lg font-semibold ${
                    notification.type === 'success' 
                      ? 'text-orange-500' 
                      : notification.type === 'warning' 
                        ? 'text-yellow-500' 
                        : 'text-red-500'
                  }`}
                >
                  {notification.message}
                </div>
                <button
                  className="absolute top-2 right-2 text-white hover:text-orange-500"
                  onClick={() => setNotification(null)}
                  style={{ position: 'absolute', top: 8, right: 16 }}
                  aria-label="Close notification"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Profile Section */}
          {activeSection === "profile" && (
            <div>
              <h2 className="text-xl font-medium text-white mb-2">Profile Settings</h2>
              <p className="text-muted text-sm mb-6">Update your personal information and preferences</p>
              
              <div className="flex flex-col items-center mb-8">
                <ProfilePictureUpload
                  currentImageUrl={profilePicture}
                  userId={user?.id || ""}
                  onImageUpdate={handleProfilePictureUpdate}
                />
              </div>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} className="pl-9" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                                <Input {...field} disabled className="pl-9 bg-black border-orange-500 text-white placeholder:text-gray-500" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                  className="pl-9"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="pl-9">
                                  <VenusAndMars className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Company Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} className="pl-9" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} className="pl-9" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} className="pl-9" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="mobilePhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Phone</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} className="pl-9" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} className="pl-9" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="address.street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input {...field} className="pl-9" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="address.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="address.postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="address.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">About</h3>
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="min-h-[100px]"
                              placeholder="Tell us about yourself..."
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description for your profile. Maximum 500 characters.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Other sections remain unchanged */}
          {activeSection === "security" && (
            <div>
              <h2 className="text-xl font-medium text-white mb-2">Security</h2>
              <p className="text-muted text-sm mb-6">Change your password and manage security settings.</p>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={securityForm.control}
                      name="twoFactorAuth"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Two-Factor Authentication</FormLabel>
                            <FormDescription>
                              Add an extra layer of security to your account
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="sessionTimeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Timeout</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timeout" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Automatically log out after period of inactivity
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={securityForm.control}
                      name="loginNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Login Notifications</FormLabel>
                            <FormDescription>
                              Get notified when someone logs into your account
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {activeSection === "notifications" && (
            <div>
              <h2 className="text-xl font-medium text-white mb-2">Notifications</h2>
              <p className="text-muted text-sm mb-6">Manage your notification preferences.</p>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Email Notifications</FormLabel>
                            <FormDescription>
                              Receive notifications via email
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="invoiceReminders"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Invoice Reminders</FormLabel>
                            <FormDescription>
                              Get reminded about upcoming and overdue invoices
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="paymentNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Payment Notifications</FormLabel>
                            <FormDescription>
                              Get notified when payments are received
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="marketingEmails"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Marketing Emails</FormLabel>
                            <FormDescription>
                              Receive updates about new features and promotions
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="reminderFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reminder Frequency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How often you want to receive reminders
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {activeSection === "appearance" && (
            <div>
              <h2 className="text-xl font-medium text-white mb-2">Appearance</h2>
              <p className="text-muted text-sm mb-6">Customize the look and feel of your dashboard.</p>
              <Form {...appearanceForm}>
                <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={appearanceForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select theme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">Light (white & orange)</SelectItem>
                              <SelectItem value="dark">Dark (black & orange)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose your preferred color theme
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={appearanceForm.control}
                      name="fontSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Size</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select font size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Adjust the text size throughout the application
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={appearanceForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="USD" />
                          </FormControl>
                          <FormDescription>
                            Set your preferred currency for invoices and payments
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={appearanceForm.control}
                      name="dateFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Format</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="MM/DD/YYYY" />
                          </FormControl>
                          <FormDescription>
                            Choose how dates are displayed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {activeSection === "billing" && (
            <div>
              <h2 className="text-xl font-medium text-white mb-2">Billing</h2>
              <p className="text-muted text-sm mb-6">Manage your subscription and payment methods.</p>
              <div className="text-muted">Coming soon...</div>
            </div>
          )}

          {activeSection === "api" && (
            <div>
              <h2 className="text-xl font-medium text-white mb-2">API & Integrations</h2>
              <p className="text-muted text-sm mb-6">Manage API keys and integrations.</p>
              <div className="text-muted">Coming soon...</div>
            </div>
          )}

          {activeSection === "danger" && (
            <div>
              <h2 className="text-xl font-medium text-danger mb-2">Danger Zone</h2>
              <p className="text-muted text-sm mb-6">Delete your account or export your data.</p>
              <Button
                onClick={handleDeleteAccount}
                className="bg-danger text-white hover:bg-danger/90"
                disabled={isSubmitting}
              >
                Delete Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
