import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputField, TextareaField, SelectField, SwitchField, FormSection, FormErrorSummary } from "@/components/ui/form-field";
import { useFormValidation } from "@/hooks/useFormValidation";
import { 
  platformSettingsSchema, 
  paymentSettingsSchema, 
  emailSettingsSchema, 
  securitySettingsSchema, 
  notificationSettingsSchema 
} from "@/utils/validation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw, 
  Globe, 
  CreditCard, 
  Mail, 
  Shield, 
  Bell, 
  Database, 
  Palette, 
  Users, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Upload,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import { settingsService, PlatformSettings, PaymentSettings, EmailSettings, SecuritySettings, NotificationSettings } from "@/services/settingsService";

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('platform');
  const [showSecrets, setShowSecrets] = useState(false);
  const { toast } = useToast();
  
  // Form validation hooks
  const {
    errors: platformErrors,
    validateForm: validatePlatform,
    validateField: validatePlatformField,
    clearErrors: clearPlatformErrors
  } = useFormValidation(platformSettingsSchema);
  
  const {
    errors: paymentErrors,
    validateForm: validatePayment,
    validateField: validatePaymentField,
    clearErrors: clearPaymentErrors
  } = useFormValidation(paymentSettingsSchema);
  
  const {
    errors: emailErrors,
    validateForm: validateEmail,
    validateField: validateEmailField,
    clearErrors: clearEmailErrors
  } = useFormValidation(emailSettingsSchema);
  
  const {
    errors: securityErrors,
    validateForm: validateSecurity,
    validateField: validateSecurityField,
    clearErrors: clearSecurityErrors
  } = useFormValidation(securitySettingsSchema);
  
  const {
    errors: notificationErrors,
    validateForm: validateNotification,
    validateField: validateNotificationField,
    clearErrors: clearNotificationErrors
  } = useFormValidation(notificationSettingsSchema);

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    siteName: '',
    siteDescription: '',
    siteUrl: '',
    supportEmail: '',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    defaultLanguage: 'en',
    defaultCurrency: 'EUR',
    timezone: 'Europe/Paris'
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    paypalEnabled: false,
    paypalClientId: '',
    paypalClientSecret: '',
    commissionRate: 10,
    minimumPayout: 50,
    payoutSchedule: 'weekly',
    taxRate: 20
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: '',
    fromName: '',
    welcomeEmailEnabled: true,
    bookingConfirmationEnabled: true,
    paymentNotificationEnabled: true
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    ipWhitelist: [],
    apiRateLimit: 100
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    adminAlerts: true,
    userActivityAlerts: true,
    paymentAlerts: true,
    securityAlerts: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await settingsService.getAllSettings();
        
        if (response.success) {
          setPlatformSettings(response.data.platform);
          setPaymentSettings(response.data.payment);
          setEmailSettings(response.data.email);
          setSecuritySettings(response.data.security);
          setNotificationSettings(response.data.notification);
        } else {
          toast({
            title: "Error",
            description: "Failed to load settings",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSaveSettings = async (category: string, settings: any) => {
    try {
      setSaving(true);
      
      // Validate settings based on category
      let isValid = false;
      switch (category) {
        case 'platform':
          isValid = validatePlatform(settings);
          break;
        case 'payment':
          isValid = validatePayment(settings);
          break;
        case 'email':
          isValid = validateEmail(settings);
          break;
        case 'security':
          isValid = validateSecurity(settings);
          break;
        case 'notification':
          isValid = validateNotification(settings);
          break;
        default:
          isValid = true;
      }
      
      if (!isValid) {
        toast({
          title: "Erreur de validation",
          description: "Veuillez corriger les erreurs dans le formulaire.",
          variant: "destructive"
        });
        return;
      }
      
      const response = await settingsService.updateSettings(category, settings);
      
      if (response.success) {
        toast({
          title: "Succès",
          description: "Paramètres sauvegardés avec succès"
        });
      } else {
        toast({
          title: "Erreur",
          description: "Échec de la sauvegarde des paramètres",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportSettings = () => {
    const allSettings = {
      platform: platformSettings,
      payment: paymentSettings,
      email: emailSettings,
      security: securitySettings,
      notifications: notificationSettings
    };
    
    const dataStr = JSON.stringify(allSettings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bricola-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTestEmailSettings = async () => {
    try {
      const response = await settingsService.testEmailSettings(emailSettings);
      if (response.success) {
        toast({
          title: "Success",
          description: "Test email sent successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive"
      });
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string);
          if (settings.platform) setPlatformSettings(settings.platform);
          if (settings.payment) setPaymentSettings(settings.payment);
          if (settings.email) setEmailSettings(settings.email);
          if (settings.security) setSecuritySettings(settings.security);
          if (settings.notifications) setNotificationSettings(settings.notifications);
          
          toast({
            title: "Settings Imported",
            description: "Settings have been imported successfully"
          });
        } catch (error) {
          toast({
            title: "Import Error",
            description: "Invalid settings file format",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage platform configuration and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportSettings} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <label htmlFor="import-settings">
            <Button variant="outline" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </span>
            </Button>
          </label>
          <input
            id="import-settings"
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="platform">
            <Globe className="w-4 h-4 mr-2" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Platform Settings */}
        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
              <CardDescription>Basic platform settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={platformSettings.siteName}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={platformSettings.siteUrl}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={platformSettings.supportEmail}
                    onChange={(e) => setPlatformSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Default Language</Label>
                  <Select
                    value={platformSettings.defaultLanguage}
                    onValueChange={(value) => setPlatformSettings(prev => ({ ...prev, defaultLanguage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Select
                    value={platformSettings.defaultCurrency}
                    onValueChange={(value) => setPlatformSettings(prev => ({ ...prev, defaultCurrency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={platformSettings.timezone}
                    onValueChange={(value) => setPlatformSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={platformSettings.siteDescription}
                  onChange={(e) => setPlatformSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Platform Features</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">Temporarily disable the platform for maintenance</p>
                    </div>
                    <Switch
                      checked={platformSettings.maintenanceMode}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>User Registration</Label>
                      <p className="text-sm text-muted-foreground">Allow new users to register</p>
                    </div>
                    <Switch
                      checked={platformSettings.registrationEnabled}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({ ...prev, registrationEnabled: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Verification</Label>
                      <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                    </div>
                    <Switch
                      checked={platformSettings.emailVerificationRequired}
                      onCheckedChange={(checked) => setPlatformSettings(prev => ({ ...prev, emailVerificationRequired: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('platform', platformSettings)} disabled={saving}>
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Platform Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Configuration</CardTitle>
              <CardDescription>Configure payment providers and financial settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stripe Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Stripe</h3>
                    <p className="text-sm text-muted-foreground">Credit card and online payment processing</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentSettings.stripeEnabled ? "default" : "secondary"}>
                      {paymentSettings.stripeEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={paymentSettings.stripeEnabled}
                      onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, stripeEnabled: checked }))}
                    />
                  </div>
                </div>
                
                {paymentSettings.stripeEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                    <div className="space-y-2">
                      <Label htmlFor="stripePublishableKey">Publishable Key</Label>
                      <div className="relative">
                        <Input
                          id="stripePublishableKey"
                          type={showSecrets ? "text" : "password"}
                          value={paymentSettings.stripePublishableKey}
                          onChange={(e) => setPaymentSettings(prev => ({ ...prev, stripePublishableKey: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stripeSecretKey">Secret Key</Label>
                      <div className="relative">
                        <Input
                          id="stripeSecretKey"
                          type={showSecrets ? "text" : "password"}
                          value={paymentSettings.stripeSecretKey}
                          onChange={(e) => setPaymentSettings(prev => ({ ...prev, stripeSecretKey: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* PayPal Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">PayPal</h3>
                    <p className="text-sm text-muted-foreground">PayPal payment processing</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentSettings.paypalEnabled ? "default" : "secondary"}>
                      {paymentSettings.paypalEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={paymentSettings.paypalEnabled}
                      onCheckedChange={(checked) => setPaymentSettings(prev => ({ ...prev, paypalEnabled: checked }))}
                    />
                  </div>
                </div>
                
                {paymentSettings.paypalEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                    <div className="space-y-2">
                      <Label htmlFor="paypalClientId">Client ID</Label>
                      <Input
                        id="paypalClientId"
                        type={showSecrets ? "text" : "password"}
                        value={paymentSettings.paypalClientId}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, paypalClientId: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paypalClientSecret">Client Secret</Label>
                      <Input
                        id="paypalClientSecret"
                        type={showSecrets ? "text" : "password"}
                        value={paymentSettings.paypalClientSecret}
                        onChange={(e) => setPaymentSettings(prev => ({ ...prev, paypalClientSecret: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Label>Show API Keys</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSecrets(!showSecrets)}
                >
                  {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>

              <Separator />

              {/* Financial Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Financial Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={paymentSettings.commissionRate}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumPayout">Minimum Payout (€)</Label>
                    <Input
                      id="minimumPayout"
                      type="number"
                      min="0"
                      value={paymentSettings.minimumPayout}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, minimumPayout: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                    <Select
                      value={paymentSettings.payoutSchedule}
                      onValueChange={(value) => setPaymentSettings(prev => ({ ...prev, payoutSchedule: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={paymentSettings.taxRate}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('payment', paymentSettings)} disabled={saving}>
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Payment Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Configure SMTP settings and email templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">SMTP Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={emailSettings.smtpHost}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpUsername">Username</Label>
                    <Input
                      id="smtpUsername"
                      value={emailSettings.smtpUsername}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUsername: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPassword">Password</Label>
                    <Input
                      id="smtpPassword"
                      type={showSecrets ? "text" : "password"}
                      value={emailSettings.smtpPassword}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={emailSettings.fromName}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Use SSL/TLS</Label>
                    <p className="text-sm text-muted-foreground">Enable secure connection</p>
                  </div>
                  <Switch
                    checked={emailSettings.smtpSecure}
                    onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, smtpSecure: checked }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Welcome Email</Label>
                      <p className="text-sm text-muted-foreground">Send welcome email to new users</p>
                    </div>
                    <Switch
                      checked={emailSettings.welcomeEmailEnabled}
                      onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, welcomeEmailEnabled: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Booking Confirmation</Label>
                      <p className="text-sm text-muted-foreground">Send booking confirmation emails</p>
                    </div>
                    <Switch
                      checked={emailSettings.bookingConfirmationEnabled}
                      onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, bookingConfirmationEnabled: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payment Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send payment confirmation emails</p>
                    </div>
                    <Switch
                      checked={emailSettings.paymentNotificationEnabled}
                      onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, paymentNotificationEnabled: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={handleTestEmailSettings} variant="outline" disabled={saving}>
                  <Mail className="w-4 h-4 mr-2" />
                  Test Email
                </Button>
                <Button onClick={() => handleSaveSettings('email', emailSettings)} disabled={saving}>
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
              <CardDescription>Configure security policies and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Authentication</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="1440"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        min="1"
                        max="10"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Password Policy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Minimum Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="6"
                      max="32"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiRateLimit">API Rate Limit (per minute)</Label>
                    <Input
                      id="apiRateLimit"
                      type="number"
                      min="10"
                      max="1000"
                      value={securitySettings.apiRateLimit}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, apiRateLimit: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Special Characters</Label>
                      <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
                    </div>
                    <Switch
                      checked={securitySettings.passwordRequireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, passwordRequireSpecialChars: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Numbers</Label>
                      <p className="text-sm text-muted-foreground">Passwords must contain numbers</p>
                    </div>
                    <Switch
                      checked={securitySettings.passwordRequireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, passwordRequireNumbers: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Uppercase</Label>
                      <p className="text-sm text-muted-foreground">Passwords must contain uppercase letters</p>
                    </div>
                    <Switch
                      checked={securitySettings.passwordRequireUppercase}
                      onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, passwordRequireUppercase: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('security', securitySettings)} disabled={saving}>
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Configuration</CardTitle>
              <CardDescription>Configure notification preferences and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send browser push notifications</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Alert Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Admin Alerts</Label>
                      <p className="text-sm text-muted-foreground">System and administrative alerts</p>
                    </div>
                    <Switch
                      checked={notificationSettings.adminAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, adminAlerts: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>User Activity Alerts</Label>
                      <p className="text-sm text-muted-foreground">Notifications about user activities</p>
                    </div>
                    <Switch
                      checked={notificationSettings.userActivityAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, userActivityAlerts: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payment Alerts</Label>
                      <p className="text-sm text-muted-foreground">Payment and transaction alerts</p>
                    </div>
                    <Switch
                      checked={notificationSettings.paymentAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, paymentAlerts: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">Security and access alerts</p>
                    </div>
                    <Switch
                      checked={notificationSettings.securityAlerts}
                      onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, securityAlerts: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings('notification', notificationSettings)} disabled={saving}>
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;