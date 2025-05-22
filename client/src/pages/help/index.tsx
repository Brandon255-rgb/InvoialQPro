import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, MessageSquare, Book, Search, ChevronRight } from "lucide-react";

const contactSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high"]),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const faqs = [
  {
    question: "How do I create my first invoice?",
    answer: "To create your first invoice, click on the 'New Invoice' button in the dashboard. Fill in the client details, add line items, and customize the invoice as needed. Once you're satisfied, click 'Save & Send' to deliver it to your client.",
  },
  {
    question: "Can I customize my invoice templates?",
    answer: "Yes! You can customize your invoice templates by going to Settings > Templates. You can modify the layout, colors, and add your company logo. We also offer several pre-designed templates to choose from.",
  },
  {
    question: "How do recurring invoices work?",
    answer: "Recurring invoices automatically generate and send invoices at specified intervals. Set up a recurring invoice by selecting 'Create Recurring' when creating a new invoice. Choose the frequency (weekly, monthly, etc.) and the system will handle the rest.",
  },
  {
    question: "What payment methods do you support?",
    answer: "We support various payment methods including credit cards, bank transfers, and popular payment gateways like Stripe and PayPal. You can enable or disable payment methods in your account settings.",
  },
  {
    question: "How do I add team members to my account?",
    answer: "To add team members, go to the Team Management page and click 'Invite Member'. Enter their email address and assign a role. They'll receive an invitation email to join your team.",
  },
  {
    question: "Can I export my data?",
    answer: "Yes, you can export your invoices, clients, and reports in various formats including PDF, CSV, and Excel. Go to the respective section and look for the export option in the actions menu.",
  },
];

const documentation = [
  {
    title: "Getting Started",
    description: "Learn the basics of using InvoiaIQPro",
    link: "/docs/getting-started",
    icon: Book,
  },
  {
    title: "Invoice Management",
    description: "Create, send, and manage your invoices",
    link: "/docs/invoices",
    icon: Book,
  },
  {
    title: "Client Portal",
    description: "Set up and customize your client portal",
    link: "/docs/client-portal",
    icon: Book,
  },
  {
    title: "Team Collaboration",
    description: "Work together with your team members",
    link: "/docs/team",
    icon: Book,
  },
  {
    title: "API Documentation",
    description: "Integrate InvoiaIQPro with your applications",
    link: "/docs/api",
    icon: Book,
  },
  {
    title: "Security & Privacy",
    description: "Learn about our security measures",
    link: "/docs/security",
    icon: Book,
  },
];

export default function Help() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      subject: "",
      message: "",
      priority: "medium",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from("support_tickets")
        .insert({
          subject: data.subject,
          message: data.message,
          priority: data.priority,
          status: "open",
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: "We'll get back to you as soon as possible.",
      });

      form.reset();
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="mt-2 text-sm text-gray-600">
            Find answers to common questions or contact our support team
          </p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search for help..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Support
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              Documentation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find answers to common questions about InvoiaIQPro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-gray-600">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Send us a message and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="What do you need help with?" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe your issue in detail..."
                              className="min-h-[150px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                              <option value="low">Low - General inquiry</option>
                              <option value="medium">Medium - Feature request</option>
                              <option value="high">High - Urgent issue</option>
                            </select>
                          </FormControl>
                          <FormDescription>
                            How urgent is your request?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="docs">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {documentation.map((doc, index) => (
                <Card key={index} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <doc.icon className="h-6 w-6 text-orange-600" />
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                    </div>
                    <CardTitle className="mt-4">{doc.title}</CardTitle>
                    <CardDescription>{doc.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={doc.link}
                      className="text-orange-600 hover:text-orange-700 font-medium inline-flex items-center"
                    >
                      Read more
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 