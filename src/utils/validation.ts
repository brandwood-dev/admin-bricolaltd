import { z } from 'zod';

// User validation schemas
export const userValidationSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['USER', 'PROVIDER', 'ADMIN'], {
    errorMap: () => ({ message: 'Invalid role selected' })
  }),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], {
    errorMap: () => ({ message: 'Invalid status selected' })
  })
});

// Booking validation schemas
export const bookingValidationSchema = z.object({
  serviceId: z.string().min(1, 'Service is required'),
  providerId: z.string().min(1, 'Provider is required'),
  customerId: z.string().min(1, 'Customer is required'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  duration: z.number().min(1, 'Duration must be at least 1 hour'),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid status selected' })
  }),
  notes: z.string().optional()
});

// Transaction validation schemas
export const transactionValidationSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  type: z.enum(['PAYMENT', 'REFUND', 'COMMISSION', 'WITHDRAWAL'], {
    errorMap: () => ({ message: 'Invalid transaction type' })
  }),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid status selected' })
  }),
  description: z.string().optional()
});

// Dispute validation schemas
export const disputeValidationSchema = z.object({
  bookingId: z.string().min(1, 'Booking is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    errorMap: () => ({ message: 'Invalid priority selected' })
  }),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], {
    errorMap: () => ({ message: 'Invalid status selected' })
  })
});

// Notification validation schemas
export const notificationValidationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  message: z.string().min(1, 'Message is required').max(500, 'Message must be less than 500 characters'),
  type: z.enum(['SYSTEM', 'ACCOUNT', 'BOOKING', 'PAYMENT', 'TOOL'], {
    errorMap: () => ({ message: 'Invalid notification type' })
  }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: 'Invalid priority selected' })
  }),
  actionUrl: z.string().url('Invalid URL').optional().or(z.literal(''))
});

// Settings validation schemas
export const platformSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  siteDescription: z.string().min(1, 'Site description is required'),
  siteUrl: z.string().url('Invalid site URL'),
  supportEmail: z.string().email('Invalid support email'),
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
  emailVerificationRequired: z.boolean(),
  defaultLanguage: z.string().min(1, 'Default language is required'),
  defaultCurrency: z.string().min(1, 'Default currency is required'),
  timezone: z.string().min(1, 'Timezone is required')
});

export const paymentSettingsSchema = z.object({
  stripeEnabled: z.boolean(),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  paypalEnabled: z.boolean(),
  paypalClientId: z.string().optional(),
  paypalClientSecret: z.string().optional(),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100'),
  minimumPayout: z.number().min(0, 'Minimum payout must be positive'),
  payoutSchedule: z.enum(['daily', 'weekly', 'monthly']),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100')
}).refine((data) => {
  if (data.stripeEnabled && (!data.stripePublishableKey || !data.stripeSecretKey)) {
    return false;
  }
  if (data.paypalEnabled && (!data.paypalClientId || !data.paypalClientSecret)) {
    return false;
  }
  return true;
}, {
  message: 'API keys are required when payment provider is enabled'
});

export const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.number().min(1).max(65535, 'Invalid port number'),
  smtpUsername: z.string().min(1, 'SMTP username is required'),
  smtpPassword: z.string().min(1, 'SMTP password is required'),
  smtpSecure: z.boolean(),
  fromEmail: z.string().email('Invalid from email'),
  fromName: z.string().min(1, 'From name is required'),
  welcomeEmailEnabled: z.boolean(),
  bookingConfirmationEnabled: z.boolean(),
  paymentNotificationEnabled: z.boolean()
});

export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  sessionTimeout: z.number().min(5, 'Session timeout must be at least 5 minutes').max(1440, 'Session timeout cannot exceed 24 hours'),
  maxLoginAttempts: z.number().min(1, 'Must allow at least 1 login attempt').max(10, 'Cannot exceed 10 login attempts'),
  passwordMinLength: z.number().min(6, 'Password must be at least 6 characters').max(32, 'Password cannot exceed 32 characters'),
  passwordRequireSpecialChars: z.boolean(),
  passwordRequireNumbers: z.boolean(),
  passwordRequireUppercase: z.boolean(),
  ipWhitelist: z.array(z.string()).optional(),
  apiRateLimit: z.number().min(10, 'API rate limit must be at least 10').max(1000, 'API rate limit cannot exceed 1000')
});

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  adminAlerts: z.boolean(),
  userActivityAlerts: z.boolean(),
  paymentAlerts: z.boolean(),
  securityAlerts: z.boolean()
});

// Validation helper functions
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

export const validateField = <T>(schema: z.ZodSchema<T>, fieldName: string, value: unknown): string | null => {
  try {
    const fieldSchema = schema.shape?.[fieldName as keyof typeof schema.shape];
    if (fieldSchema) {
      fieldSchema.parse(value);
    }
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid value';
    }
    return 'Validation error';
  }
};

// Form validation hook
export const useFormValidation = <T>(schema: z.ZodSchema<T>) => {
  const validate = (data: unknown) => validateForm(schema, data);
  const validateSingleField = (fieldName: string, value: unknown) => validateField(schema, fieldName, value);
  
  return { validate, validateSingleField };
};

// User suspension schema
export const userSuspensionSchema = z.object({
  reason: z.string().min(1, 'La raison de suspension est requise')
});

export type UserFormData = z.infer<typeof userValidationSchema>;
export type BookingFormData = z.infer<typeof bookingValidationSchema>;
export type TransactionFormData = z.infer<typeof transactionValidationSchema>;
export type DisputeFormData = z.infer<typeof disputeValidationSchema>;
export type NotificationFormData = z.infer<typeof notificationValidationSchema>;
export type PlatformSettingsFormData = z.infer<typeof platformSettingsSchema>;
export type PaymentSettingsFormData = z.infer<typeof paymentSettingsSchema>;
export type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;
export type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;
export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;
export type UserSuspensionFormData = z.infer<typeof userSuspensionSchema>;