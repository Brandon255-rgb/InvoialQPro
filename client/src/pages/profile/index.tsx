import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Mail, Building2, Phone, MapPin, Calendar, VenusAndMars, Globe, Briefcase, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WheelDatePicker } from "@/components/ui/wheel-date-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  dateOfBirth: z.date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
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
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.user_metadata?.name || "",
      email: user?.email || "",
      dateOfBirth: user?.user_metadata?.dateOfBirth
        ? new Date(user.user_metadata.dateOfBirth)
        : new Date(2000, 0, 1),
      gender: user?.user_metadata?.gender || undefined,
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
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true);

      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: data.name,
          dateOfBirth: data.dateOfBirth?.toISOString(),
          gender: data.gender,
          company: data.company,
          jobTitle: data.jobTitle,
          phone: data.phone,
          mobilePhone: data.mobilePhone,
          website: data.website,
          address: data.address,
          bio: data.bio,
          avatar_url: profilePicture,
        },
      });

      if (authError) throw authError;

      // Update user profile in the database
      const { error: dbError } = await supabase
        .from("users")
        .update({
          name: data.name,
          company: data.company,
          phone: data.phone,
          address: JSON.stringify(data.address),
        })
        .eq("id", user?.id);

      if (dbError) throw dbError;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setNotification({ message: "Profile has been updated", type: "success" });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      setNotification({ message: "Failed to update profile. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-dismiss notification after 3 seconds
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleProfilePictureUpdate = async (url: string) => {
    setProfilePicture(url);
    // The actual update will happen when the form is submitted
  };

  return (
    <div className="container mx-auto py-8">
      {/* Centered notification modal */}
      {notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className={`bg-black border-2 rounded-xl px-8 py-6 shadow-lg flex flex-col items-center gap-2 ${notification.type === 'success' ? 'border-orange-500' : 'border-red-500'}`}
            style={{ minWidth: 300 }}
          >
            <div className={`text-lg font-semibold ${notification.type === 'success' ? 'text-orange-500' : 'text-red-500'}`}>{notification.message}</div>
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
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-8">
              <ProfilePictureUpload
                currentImageUrl={profilePicture}
                userId={user?.id || ""}
                onImageUpdate={handleProfilePictureUpdate}
              />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input {...field} className="pl-9" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
                              <Input 
                                {...field} 
                                disabled 
                                className="pl-9 bg-black border-orange-500 text-white placeholder:text-gray-500" 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <SimpleDatePicker
                              value={field.value || new Date(2000, 0, 1)}
                              onChange={field.onChange}
                              minYear={1800}
                              maxYear={new Date().getFullYear()}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
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

                  {/* Company Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Company Information</h3>
                    
                    <FormField
                      control={form.control}
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
                      control={form.control}
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

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input {...field} className="pl-9" placeholder="https://" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input {...field} className="pl-9" placeholder="+1 (555) 123-4567" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobilePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input {...field} className="pl-9" placeholder="+1 (555) 123-4567" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Address</h3>
                  
                  <FormField
                    control={form.control}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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

                <Separator />

                {/* Bio */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">About</h3>
                  
                  <FormField
                    control={form.control}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 