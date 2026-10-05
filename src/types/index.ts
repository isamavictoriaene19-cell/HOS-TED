export type CategoryType = 
  | 'all'
  | 'everyday'
  | 'skirt_blouse'
  | 'ankara_gowns'
  | 'bubu_gowns'
  | 'chic_casual'
  | 'bespoke'
  | 'materials';

export interface ProductItem {
  id: string;
  name: string;
  category: CategoryType;
  categoryLabel: string;
  description: string;
  priceNgn: number;
  priceUsd: number;
  imageUrl: string;
  features: string[];
  fabric: string;
  isPopular?: boolean;
  isNew?: boolean;
  leadTime: string;
  stockCount?: number;
  active?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedActions?: string[];
  proposedAction?: ProposedAdminAction;
}

export type AssistantMode = 'stylist' | 'concierge';

export interface DeliveryDetails {
  state: string;
  city: string;
  address: string;
  method: 'Doorstep Courier' | 'Terminal Pickup' | 'Atelier Pickup';
}

export interface MeasurementFormData {
  fullName: string;
  phone: string;
  email: string;
  styleCategory: string;
  customStyleName?: string;
  customStyleDescription?: string;
  referenceImageNotes?: string;
  isCustomStyleOverride?: boolean;
  fabricPreference: 'provide_own' | 'atelier_ankara' | 'luxury_silk' | 'custom_blend';
  bust: string;
  waist: string;
  hips: string;
  shoulder: string;
  dressLength: string;
  sleeveLength: string;
  armhole: string;
  preferredDate: string;
  specialInstructions: string;
  deliveryState: string;
  deliveryCity: string;
  deliveryAddress: string;
  deliveryMethod: 'Doorstep Courier' | 'Terminal Pickup' | 'Atelier Pickup';
}

export type OrderStatus =
  | 'New Inquiry'
  | 'Pending Payment'
  | 'Processing'
  | 'Payment Confirmed'
  | 'Consultation Booked'
  | 'Tailoring'
  | 'In Production'
  | 'Ready for Fitting'
  | 'Shipped'
  | 'Completed'
  | 'Delivered';

export interface CustomAttachmentFile {
  id: string;
  name: string;
  fileType: string;
  dataUrl: string;
  uploadedAt: string;
  category?: 'style_reference' | 'measurement_sheet' | 'facial_recognition';
}

export interface InquiryRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category: string;
  productId?: string;
  productName?: string;
  productImageUrl?: string;
  customStyleName?: string;
  customStyleDescription?: string;
  referenceImageNotes?: string;
  isCustomStyleOverride?: boolean;
  size?: string;
  color?: string;
  quantity?: number;
  unitPriceNgn?: number;
  notes: string;
  measurements?: Record<string, string>;
  customAttachments?: CustomAttachmentFile[];
  clientFacialPhotoUrl?: string;
  delivery?: DeliveryDetails;
  deliveryState?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  createdAt: string;
  status: OrderStatus | string;
  totalAmountNgn?: number;
  amountPaidNgn?: number;
  paymentStatus?: 'Pending Review' | 'Partial Deposit' | 'Paid in Full' | 'Payment Confirmed' | 'Paid' | 'Unpaid';
  dueDate?: string;
  assignedTailor?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  passwordHash?: string;
  isFounder?: boolean;
  roleLabel?: string;
  facialPhotoUrl?: string;
  facialVerified?: boolean;
  facialEnrolledAt?: string;
  customAttachments?: CustomAttachmentFile[];
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  acceptedTermsAt?: string;
  accountStatus?: 'Active' | 'Locked' | 'Flagged';
  failedLoginAttempts?: number;
  lastSecurityIp?: string;
  preferredStyle?: string;
  preferredSize?: string;
  favoriteColors?: string;
  onboardingCompleted?: boolean;
  joinedAt: string;
  lastLoginAt?: string;
  totalOrders: number;
  totalSpentNgn: number;
  measurements: Record<string, string>;
  delivery?: DeliveryDetails;
  notes: string;
  chatHistory?: ChatMessage[];
}

export interface EmailDispatchRecord {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  purpose: 'REGISTRATION_OTP' | 'LOGIN_OTP' | 'SECURITY_ALERT' | 'ORDER_CONFIRMATION';
  otpCodeMasked?: string;
  otpCodePlainForAdmin?: string;
  status: 'Sent (Live SMTP)' | 'Sent (Verified Relay)' | 'Verified Used' | 'Expired';
  previewUrl?: string;
  createdAt: string;
  expiresAt?: string;
  verifiedAt?: string;
}

export interface SecurityEventRecord {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  eventType:
    | 'OTP_ISSUED'
    | 'OTP_VERIFIED'
    | 'OTP_FAILED'
    | 'BRUTE_FORCE_BLOCKED'
    | 'WAF_PAYLOAD_SANITIZED'
    | 'ACCOUNT_LOCKED'
    | 'ACCOUNT_UNLOCKED'
    | 'ADMIN_AUTH_SUCCESS'
    | 'ADMIN_AUTH_FAILED';
  actorEmailOrIp: string;
  details: string;
  blocked: boolean;
  resolved?: boolean;
  timestamp: string;
}

export interface AppointmentRecord {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  orderId?: string;
  type: 'Initial Consultation' | 'Measurement Session' | 'First Fitting' | 'Final Pickup' | 'Measurement Taking' | 'Consultation';
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Rescheduled' | 'Cancelled';
  notes: string;
  customAttachments?: CustomAttachmentFile[];
  clientFacialPhotoUrl?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  clientName: string;
  clientPhone: string;
  amountNgn: number;
  method: 'Bank Transfer' | 'POS' | 'Online' | 'Cash';
  status: 'Pending Review' | 'Verified' | 'Partial';
  reference: string;
  createdAt: string;
  notes?: string;
  productImageUrl?: string;
  productName?: string;
  size?: string;
  color?: string;
  quantity?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: 'Ankara Fabric' | 'Silk & Damask' | 'Lace & Trim' | 'Notions & Zippers' | 'Packaging';
  quantity: number;
  unit: 'Yards' | 'Rolls' | 'Pieces' | 'Packs';
  reorderThreshold: number;
  costPerUnitNgn: number;
  updatedAt: string;
}

export interface AdminTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Todo' | 'In Progress' | 'Done';
  dueDate: string;
  relatedOrderId?: string;
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'inventory' | 'appointment' | 'system';
  read: boolean;
  createdAt: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  channel: 'WhatsApp Broadcast' | 'Instagram' | 'TikTok' | 'VIP Client List';
  messageTemplate: string;
  status: 'Draft' | 'Active' | 'Completed';
  createdAt: string;
}

export interface WebsiteSettings {
  brandName: string;
  founderName: string;
  founderRole: string;
  founderImageUrl: string;
  founderQuote: string;
  founderBioParagraph1: string;
  founderBioParagraph2: string;
  slogan: string;
  announcementText: string;
  heroTitle: string;
  heroHighlightText: string;
  heroSubtitle: string;
  whatsappNumber: string;
  whatsappFormatted: string;
  tiktokHandle: string;
  instagramHandle: string;
  acceptingCustomOrders: boolean;
  standardLeadTime: string;
  nationwideDeliveryText: string;
  themeColor: 'obsidian' | 'midnight' | 'espresso' | 'cream' | 'emerald' | 'burgundy' | 'custom';
  accentColor: 'amber' | 'gold' | 'emerald' | 'rose' | 'custom';
  customThemeBg?: string;
  customThemeText?: string;
  customAccentHex?: string;
  showAnnouncementBar: boolean;
  showFlierSection: boolean;
  showBespokeSection: boolean;
  showStorySection: boolean;
  showFounderSection: boolean;
  customBannerMessage?: string;
  paymentBankName?: string;
  paymentAccountName?: string;
  paymentAccountNumber?: string;
  paymentInstructions?: string;
  termsOfServiceText?: string;
  privacyPolicyText?: string;
  returnRefundPolicyText?: string;
  requireEmailOtpOnSignup?: boolean;
}

export interface SystemImprovementProposal {
  id: string;
  title: string;
  category: 'Conversion' | 'Catalog' | 'Operations' | 'Customer Experience';
  rationale: string;
  suggestedChange: string;
  status: 'Proposed' | 'Applied' | 'Dismissed';
  actionPayload?: ProposedAdminAction;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  details: string;
  verified: boolean;
  timestamp: string;
}

export interface AuthorizedAdminEmailEntry {
  email: string;
  roleLabel: string;
  addedBy: string;
  addedAt: string;
  isProtected?: boolean;
  facialPhotoUrl?: string;
  facialEnrolledAt?: string;
}

export interface ProposedAdminAction {
  type:
    | 'UPDATE_ORDER_STATUS'
    | 'CREATE_ORDER'
    | 'RECORD_PAYMENT_VERIFICATION'
    | 'CREATE_TASK'
    | 'COMPLETE_TASK'
    | 'UPDATE_INVENTORY'
    | 'UPDATE_WEBSITE_SETTINGS'
    | 'ADD_PRODUCT'
    | 'UPDATE_PRODUCT'
    | 'DELETE_PRODUCT'
    | 'UPDATE_ADMIN_CREDENTIALS'
    | 'GRANT_ADMIN_PORTAL_ACCESS'
    | 'REVOKE_ADMIN_PORTAL_ACCESS'
    | 'UPDATE_CUSTOMER_PROFILE'
    | 'DELETE_CUSTOMER_PROFILE'
    | 'VERIFY_OR_UNLOCK_CUSTOMER'
    | 'DELETE_APPOINTMENT'
    | 'UPDATE_FACIAL_RECOGNITION';
  summary: string;
  payload: Record<string, any>;
}

export interface CustomStyleEditRecord {
  styleKey: string;
  productId?: string;
  styleCategory?: string;
  customStyleName: string;
  customStyleDescription: string;
  referenceImageUrl?: string;
  referenceImageNotes?: string;
  isCustomStyleOverride?: boolean;
  updatedBy?: string;
  confirmedAt: string;
}

export interface HostedDatabaseState {
  orders: InquiryRecord[];
  customers: CustomerRecord[];
  products: ProductItem[];
  appointments: AppointmentRecord[];
  payments: PaymentRecord[];
  inventory: InventoryItem[];
  tasks: AdminTask[];
  notifications: AdminNotification[];
  campaigns: MarketingCampaign[];
  websiteSettings: WebsiteSettings;
  improvements: SystemImprovementProposal[];
  auditLogs: AuditLogEntry[];
  emailLogs?: EmailDispatchRecord[];
  securityEvents?: SecurityEventRecord[];
  authorizedAdminEmails?: AuthorizedAdminEmailEntry[];
  customStyleEdits?: Record<string, CustomStyleEditRecord>;
}
