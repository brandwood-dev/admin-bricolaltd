/**
 * UNIFIED TYPES BRIDGE FILE
 * 
 * This file serves as the single source of truth for all types, enums, and interfaces
 * used throughout the admin frontend. It consolidates and replaces both entities-bridge.ts
 * and services/types.ts to eliminate conflicts and ensure consistency.
 * 
 * IMPORTANT: Always import types from this file instead of creating duplicate definitions.
 * This file maintains exact alignment with backend entities and API responses.
 */

// ============================================================================
// ENUMS - Exact copies from backend
// ============================================================================

export enum ToolStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ARCHIVED = 'ARCHIVED',
}

export enum ToolCondition {
  NEW = 1,
  LIKE_NEW = 2,
  GOOD = 3,
  FAIR = 4,
  POOR = 5,
}

export enum AvailabilityStatus {
  AVAILABLE = 1,
  UNAVAILABLE = 2,
  MAINTENANCE = 3,
  RESERVED = 4,
}

export enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED', // confirmed
  REJECTED = 'REJECTED',
  ONGOING = 'ONGOING', // approved
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  WITHDRAWAL = 'WITHDRAWAL',
  FEE = 'FEE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
}

export enum DisputeStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export enum ActivityType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  BOOKING_TOOL = 'BOOKING_TOOL',
  // Admin-only activities
  RESTORE_ACCOUNT = 'RESTORE_ACCOUNT',
  DELETE_ACCOUNT_PERMANENTLY = 'DELETE_ACCOUNT_PERMANENTLY',
  BAN_USER = 'BAN_USER',
  UNBAN_USER = 'UNBAN_USER',
}

export enum ModerationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
}

export enum DocumentType {
  IDENTITY = 'IDENTITY',
  CONTRACT = 'CONTRACT',
  PROOF_OF_PAYMENT = 'PROOF_OF_PAYMENT',
  RECEIPT = 'RECEIPT',
  INVOICE = 'INVOICE',
  PAYMENT_SLIP = 'PAYMENT_SLIP',
  PASSPORT = 'PASSPORT',
  ID_CARD = 'ID_CARD',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
}

// ============================================================================
// BASE ENTITY INTERFACES
// ============================================================================

export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// CORE ENTITIES - Backend aligned
// ============================================================================

export interface Country {
  id: string;
  name: string;
  code: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface User extends BaseEntity {
  id: string;
  email: string;
  newEmail?: string;
  isAdmin: boolean;
  firstName: string;
  lastName: string;
  displayName?: string;
  country?: Country;
  countryId?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  verifiedEmail: boolean;
  profilePicture?: string;
  isActive: boolean;
  isVerified?: boolean;
  isSuspended?: boolean;
  mustChangePassword?: boolean;
  verifiedAt?: Date | string;
  lastLoginAt?: Date | string;
  bio?: string;
  ratingAsOwner?: number;
  ratingAsRenter?: number;
  completedRentals?: number;
  cancelledRentals?: number;
  
  // Relationships
  wallet?: Wallet;
  preferences?: UserPreference;
  tools?: Tool[];
  bookingsAsRenter?: Booking[];
  reviewsGiven?: Review[];
  reviewsReceived?: Review[];
  disputesInitiated?: Dispute[];
  disputesReceived?: Dispute[];
  documents?: Document[];
  bookmarks?: Bookmark[];
  notifications?: Notification[];
  sessions?: UserSession[];
  activities?: UserActivity[];
  accountDeletionRequests?: AccountDeletionRequest[];
  transactionsSent?: Transaction[];
  transactionsReceived?: Transaction[];
}

export interface Category extends BaseEntity {
  name: string;
  displayName?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  
  // Relationships
  subcategories?: Subcategory[];
}

export interface Subcategory extends BaseEntity {
  name: string;
  displayName?: string;
  description?: string;
  category?: Category;
  categoryId: string;
  isActive?: boolean;
  
  // Relationships
  tools?: Tool[];
}

export interface Tool extends BaseEntity {
  title: string;
  description: string;
  brand?: string;
  model?: string;
  year?: number;
  condition: ToolCondition;
  pickupAddress: string;
  latitude?: number;
  longitude?: number;
  ownerInstructions?: string;
  basePrice: number;
  depositAmount: number;
  imageUrl?: string;
  toolStatus: ToolStatus;
  availabilityStatus: AvailabilityStatus;
  moderationStatus?: ModerationStatus;
  publishedAt?: Date | string;
  moderatedAt?: Date | string;
  
  // Foreign Keys
  categoryId: string;
  subcategoryId: string;
  ownerId: string;
  
  // Relationships
  category?: Category;
  subcategory?: Subcategory;
  owner?: User;
  bookings?: Booking[];
  bookmarks?: Bookmark[];
  photos?: ToolPhoto[];
}

export interface ToolPhoto extends BaseEntity {
  url: string;
  filename: string;
  isPrimary: boolean;
  
  // Foreign Keys
  toolId: string;
  
  // Relationships
  tool?: Tool;
}

export interface Booking extends BaseEntity {
  startDate: Date | string
  endDate: Date | string
  pickupHour: Date | string
  totalPrice: number
  message?: string
  paymentMethod?: string
  paymentIntentId?: string
  status: BookingStatus

  // Foreign Keys
  toolId: string
  renterId: string
  ownerId: string

  // Relationships
  tool?: Tool
  renter?: User
  owner?: User
}

export interface Transaction extends BaseEntity {
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  externalReference?: string;
  paymentMethod?: PaymentMethod;
  feeAmount?: number;
  processedAt?: Date | string;
  
  // Foreign Keys
  senderId: string;
  recipientId: string;
  walletId: string;
  bookingId?: string;
  disputeId?: string;
  
  // Relationships
  sender?: User;
  recipient?: User;
  wallet?: Wallet;
  booking?: Booking;
  dispute?: Dispute;
}

export interface Wallet extends BaseEntity {
  balance: number;
  pendingBalance?: number;
  reservedBalance?: number;
  currency?: string;
  isActive: boolean;
  lastDepositDate?: Date | string;
  lastWithdrawalDate?: Date | string;
  
  // Foreign Keys
  userId: string;
  
  // Relationships
  user?: User;
  transactions?: Transaction[];
}

export interface Review extends BaseEntity {
  rating: number;
  comment?: string;
  isVisible?: boolean;
  
  // Foreign Keys
  reviewerId: string;
  revieweeId: string;
  toolId?: string;
  bookingId?: string;
  
  // Relationships
  reviewer?: User;
  reviewee?: User;
  tool?: Tool;
  booking?: Booking;
}

export interface Dispute extends BaseEntity {
  title?: string;
  reason?: string;
  description: string;
  status: DisputeStatus | string;
  resolution?: string;
  resolutionId?: number;
  resolutionNotes?: string;
  refundAmount?: number;
  resolvedAt?: Date | string;
  evidence?: string[];
  
  // Foreign Keys
  initiatorId: string;
  respondentId: string;
  bookingId?: string;
  toolId?: string;
  
  // Relationships
  initiator?: User;
  respondent?: User;
  booking?: Booking;
  tool?: Tool;
  transactions?: Transaction[];
}

export interface Document extends BaseEntity {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize: number;
  mimeType?: string;
  documentType?: string;
  type?: DocumentType;
  isVerified: boolean;
  
  // Foreign Keys
  userId: string;
  toolId?: string;
  
  // Relationships
  user?: User;
  tool?: Tool;
}

export interface Bookmark extends BaseEntity {
  // Foreign Keys
  userId: string;
  toolId: string;
  
  // Relationships
  user?: User;
  tool?: Tool;
}

export interface Notification extends BaseEntity {
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: Date | string;
  
  // Foreign Keys
  userId: string;
  
  // Relationships
  user?: User;
}

export interface UserPreference extends BaseEntity {
  language: string;
  currency: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  
  // Foreign Keys
  userId: string;
  
  // Relationships
  user?: User;
}

export interface UserSession extends BaseEntity {
  sessionToken: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  expiresAt: Date | string;
  
  // Foreign Keys
  userId: string;
  
  // Relationships
  user?: User;
}

export interface UserActivity extends BaseEntity {
  type?: ActivityType;
  action?: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Foreign Keys
  userId: string;
  
  // Relationships
  user?: User;
}

export interface AccountDeletionRequest extends BaseEntity {
  reason: string;
  scheduledAt: Date | string;
  processedAt?: Date | string;
  status: string;
  
  // Foreign Keys
  userId: string;
  
  // Relationships
  user?: User;
}

// ============================================================================
// WITHDRAWAL TYPES
// ============================================================================

export interface WithdrawalRequest extends BaseEntity {
  amount: number;
  status: string;
  paymentMethod: PaymentMethod | string;
  accountDetails?: string;
  notes?: string;
  processedAt?: Date | string;
  rejectionReason?: string;
  
  // Foreign Keys
  userId: string;
  
  // Relationships
  user?: User;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  timestamp: string;
  path: string;
}

// ============================================================================
// FILTER AND SEARCH TYPES
// ============================================================================

export interface FilterParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
}

export interface UserFilterParams extends FilterParams {
  isActive?: boolean;
  isAdmin?: boolean;
  verifiedEmail?: boolean;
  country?: string;
}

export interface TransactionFilterParams extends FilterParams {
  type?: TransactionType;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  minAmount?: number;
  maxAmount?: number;
  userId?: string;
}

export interface BookingFilterParams extends FilterParams {
  status?: BookingStatus;
  toolId?: string;
  renterId?: string;
  ownerId?: string;
}

export interface ToolFilterParams extends FilterParams {
  status?: ToolStatus;
  availabilityStatus?: AvailabilityStatus;
  condition?: ToolCondition;
  categoryId?: string;
  subcategoryId?: string;
  ownerId?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface DisputeFilterParams extends FilterParams {
  status?: DisputeStatus;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  userId?: string;
  bookingId?: string;
  toolId?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export interface WithdrawalFilterParams extends FilterParams {
  status?: string;
  paymentMethod?: PaymentMethod;
  minAmount?: number;
  maxAmount?: number;
  userId?: string;
}

// ============================================================================
// STATISTICS INTERFACES
// ============================================================================

export interface BookingStats {
  totalBookings: number;
  pendingBookings: number;
  acceptedBookings: number; // Renamed from confirmedBookings to match backend
  ongoingBookings: number; // Added for ONGOING status
  completedBookings: number;
  cancelledBookings: number;
  rejectedBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  popularTools: Array<{
    toolId: string;
    toolTitle: string;
    bookingCount: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export interface ToolStats {
  totalTools: number;
  publishedTools: number;
  draftTools: number;
  underReviewTools: number;
  rejectedTools: number;
  archivedTools: number;
  averageRating: number;
  totalViews: number;
}

export interface TransactionStats {
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  totalVolume: number;
  averageTransactionValue: number;
  transactionGrowthRate: number;
}

export interface DisputeStats {
  totalDisputes: number;
  openDisputes: number;
  investigatingDisputes: number;
  resolvedDisputes: number;
  closedDisputes: number;
  averageResolutionTime: number;
  disputesByStatus: {
    status: DisputeStatus;
    count: number;
  }[];
  disputesByCategory: {
    category: string;
    count: number;
  }[];
  monthlyDisputes: {
    month: string;
    count: number;
  }[];
}

export interface AdminStats {
  totalUsers: number;
  totalTools: number;
  totalBookings: number;
  totalTransactions: number;
  pendingReviews: number;
  activeDisputes: number;
}

// ============================================================================
// ADMIN-SPECIFIC TYPES
// ============================================================================

export interface ToolModerationAction {
  action: 'approve' | 'reject' | 'delete';
  reason?: string;
  moderatorId: string;
}

export interface UserModerationAction {
  action: 'suspend' | 'activate' | 'verify' | 'delete';
  reason?: string;
  moderatorId: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type EntityId = string;
export type EntityTimestamp = Date | string;

// Partial types for updates
export type ToolUpdate = Partial<Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'category' | 'subcategory'>>;
export type UserUpdate = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'country'>>;
export type BookingUpdate = Partial<Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'tool' | 'renter'>>;

// Create types (without id and timestamps)
export type ToolCreate = Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'category' | 'subcategory' | 'bookings' | 'bookmarks'>;
export type UserCreate = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'country' | 'wallet' | 'preferences' | 'tools' | 'bookingsAsRenter' | 'reviewsGiven' | 'reviewsReceived' | 'disputesInitiated' | 'disputesReceived' | 'documents' | 'bookmarks' | 'notifications' | 'sessions' | 'activities' | 'accountDeletionRequests' | 'transactionsSent' | 'transactionsReceived'>;

// ============================================================================
// LEGACY TYPE ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

// These aliases ensure existing code continues to work
export type TransactionData = Transaction;
export type UserData = User;
export type BookingData = Booking;
export type ToolData = Tool;
export type DisputeData = Dispute;

/**
 * RELATIONSHIP DOCUMENTATION:
 * 
 * USER relationships:
 * - OneToOne: Wallet, UserPreference
 * - OneToMany: Tool (as owner), Booking (as renter), Review (given/received), 
 *             Dispute (initiated/received), Document, Bookmark, Notification,
 *             UserSession, UserActivity, AccountDeletionRequest, Transaction (sent/received)
 * - ManyToOne: Country
 * 
 * TOOL relationships:
 * - ManyToOne: User (owner), Category, Subcategory
 * - OneToMany: Booking, Bookmark
 * 
 * BOOKING relationships:
 * - ManyToOne: Tool, User (renter)
 * - OneToMany: Review, Transaction
 * 
 * TRANSACTION relationships:
 * - ManyToOne: User (sender/recipient), Wallet, Booking, Dispute
 * 
 * CATEGORY relationships:
 * - OneToMany: Subcategory, Tool
 * 
 * SUBCATEGORY relationships:
 * - ManyToOne: Category
 * - OneToMany: Tool
 */