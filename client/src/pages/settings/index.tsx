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
import { UserCircle, CreditCard, Bell, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
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
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security" },
  { key: "notifications", label: "Notifications" },
  { key: "appearance", label: "Appearance" },
  { key: "billing", label: "Billing" },
  { key: "api", label: "API & Integrations" },
  { key: "danger", label: "Danger Zone" },
];

// Utility to set theme class on <html>
function setThemeClass(theme: 'light' | 'dark') {
  const html = document.documentElement;
  html.classList.remove('theme-light', 'theme-dark');
  html.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  
  // Forms setup
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.user_metadata?.name || "",
      email: user?.email || "",
      company: user?.user_metadata?.company || "",
      phone: user?.user_metadata?.phone || "",
      address: user?.user_metadata?.address || "",
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

  // Notification settings mutation (mocked for now)
  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationSettings) => {
      try {
        setIsSubmitting(true);
        const { error } = await supabase
          .from("user_settings")
          .upsert({
            user_id: user?.id,
            ...data,
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
      const { data, error } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('user_id', user.id)
        .single();
      if (!error && data?.theme) {
        setThemeClass(data.theme);
        appearanceForm.setValue('theme', data.theme);
      } else {
        setThemeClass('light');
        appearanceForm.setValue('theme', 'light');
      }
    }
    fetchTheme();
    // eslint-disable-next-line
  }, [user?.id]);

  const onNotificationSubmit = (data: NotificationSettings) => {
    notificationMutation.mutate(data);
  };

  const handleProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    profileMutation.mutate(data);
  };

  const handlePasswordSubmit = (data: z.infer<typeof passwordFormSchema>) => {
    passwordMutation.mutate(data);
  };

  // Theme change handler
  const onAppearanceSubmit = async (data: AppearanceSettings) => {
    try {
      setIsSubmitting(true);
      setThemeClass(data.theme as 'light' | 'dark');
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          theme: data.theme,
          fontSize: data.fontSize,
          currency: data.currency,
          dateFormat: data.dateFormat,
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
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user?.id,
          ...data,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

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
        {/* Settings vertical nav as a menu, not a sidebar */}
        <div className="py-8 px-0 flex flex-col gap-2 w-56">
          {SECTIONS.map((section) => (
            <button
              key={section.key}
              className={`text-left px-6 py-2 rounded-md font-medium transition text-muted hover:bg-border focus:outline-none focus:ring-2 focus:ring-accent ${activeSection === section.key ? 'bg-border text-accent' : ''}`}
              onClick={() => setActiveSection(section.key)}
              style={{ background: 'none', border: 'none' }}
            >
              {section.label}
            </button>
          ))}
        </div>
        {/* Content area: section content only */}
        <div className="flex-1 p-8">
          {/* Settings section content */}
          <div className="flex-1 p-8">
            {activeSection === "profile" && (
              <div>
                <h2 className="text-xl font-medium text-white mb-2">Profile</h2>
                <p className="text-muted text-sm mb-6">Update your personal information.</p>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
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
                              <Input {...field} disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" className="bg-accent text-white rounded-lg px-4 py-2 text-sm hover:bg-accent/90 transition">
                        Save
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
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
    </div>
  );
};

export default Settings;
