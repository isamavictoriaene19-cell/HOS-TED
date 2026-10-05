import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  X,
  CheckCircle2,
  Clock,
  Scissors,
  RefreshCw,
  AlertCircle,
  Search,
  MessageCircle,
  Calendar,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Ruler,
  CreditCard,
  Package,
  BarChart3,
  CheckSquare,
  Bell,
  Megaphone,
  Globe,
  Sparkles,
  ShieldCheck,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Plus,
  AlertTriangle,
  Wrench,
  Trash2,
  Edit3,
  Upload,
  ArrowLeft,
  ScanFace,
  Paperclip,
  Download,
} from 'lucide-react';
import {
  HostedDatabaseState,
  InquiryRecord,
  ChatMessage,
  ProductItem,
  CustomAttachmentFile,
} from '../types';
import {
  FacialRecognitionCapture,
  CustomFilesAttachmentBox,
} from './FacialRecognitionCapture';
import {
  ASSETS,
  LAYMAN_SIZE_GUIDE,
  LAYMAN_COLOR_GUIDE,
  findLaymanSizeOption,
  findLaymanColorOption,
} from '../constants/assets';
import { HostedLogo } from './HostedLogo';
import {
  speakWithTessyIdomaVoice,
  stopTessyVoice,
  startTessyMicrophoneCapture,
} from '../utils/tessyVoice';
import { renderFormattedTessyReply } from '../utils/formatTessyText';
import {
  compressImageFileToDataUrl,
  getSavedFounderImage,
  saveFounderImagePermanently,
  recordAdminProductUpsert,
  recordAdminProductDeletion,
  syncConfirmedProductsList,
  reconcilePermanentStorefrontState,
} from '../utils/permanentSync';

interface StaffAtelierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStorefrontUpdated?: () => void;
}

type AdminTab =
  | 'overview'
  | 'orders'
  | 'customers'
  | 'products'
  | 'bespoke'
  | 'appointments'
  | 'payments'
  | 'inventory'
  | 'analytics'
  | 'tasks'
  | 'marketing'
  | 'website'
  | 'tessy'
  | 'improvements'
  | 'security';

export const StaffAtelierModal: React.FC<StaffAtelierModalProps> = ({
  isOpen,
  onClose,
  onStorefrontUpdated,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('isamatheresa12@gmail.com');
  const [adminEmail, setAdminEmail] = useState('isamatheresa12@gmail.com');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [expandedChatCustomerId, setExpandedChatCustomerId] = useState<string | null>(null);
  const [editCustomerForm, setEditCustomerForm] = useState({
    customerId: '',
    name: '',
    email: '',
    phone: '',
    preferredStyle: '',
    preferredSize: '',
    favoriteColors: '',
    deliveryState: 'Lagos',
    deliveryCity: '',
    deliveryAddress: '',
    notes: '',
  });
  const [activeRole, setActiveRole] = useState<'Owner / Creative Director' | 'Platform Creator (Founder Access)' | 'Head Tailor' | 'Client Concierge'>('Owner / Creative Director');
  const [errorMsg, setErrorMsg] = useState('');
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Real Live Database & Computed Metrics from Server
  const [db, setDb] = useState<HostedDatabaseState | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Confirmation Gate Modal for Important / Non-Destructive Actions
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    title: string;
    summary: string;
    actionType: string;
    payload: Record<string, any>;
  } | null>(null);

  // New Order Form State
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    name: '',
    phone: '',
    email: '',
    category: 'Peacock Sovereign Ankara Mermaid Gown',
    totalAmountNgn: '0',
    amountPaidNgn: '0',
    dueDate: '',
    notes: '',
  });

  // New Payment Form State
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState({
    orderId: '',
    amountNgn: '0',
    method: 'Bank Transfer',
    status: 'Verified',
  });

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Theresa Isama');

  // New Appointment Form State
  const [showNewAptForm, setShowNewAptForm] = useState(false);
  const [newAptForm, setNewAptForm] = useState({
    clientName: '',
    clientPhone: '',
    orderId: '',
    type: 'First Fitting',
    date: '',
    time: '02:00 PM',
    notes: '',
  });

  // New Product Form State
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    category: 'ankara_gowns',
    categoryLabel: 'Ankara Gowns',
    priceNgn: '0',
    fabric: '100% Grade-A Cotton Ankara',
    leadTime: '',
    stockCount: '0',
    imageUrl: ASSETS.ankaraGown,
    description: '',
  });

  // Editing Existing Product State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductForm, setEditProductForm] = useState<{
    id: string;
    name: string;
    category: string;
    categoryLabel: string;
    priceNgn: string;
    fabric: string;
    leadTime: string;
    stockCount: string;
    imageUrl: string;
    description: string;
    featuresText: string;
    isPopular: boolean;
  }>({
    id: '',
    name: '',
    category: 'ankara_gowns',
    categoryLabel: 'Ankara Gowns',
    priceNgn: '0',
    fabric: '',
    leadTime: '',
    stockCount: '0',
    imageUrl: '',
    description: '',
    featuresText: '',
    isPopular: false,
  });

  // Website & About the Founder Settings Form State
  const [websiteForm, setWebsiteForm] = useState({
    slogan: 'HOS|TED Hosting Nations',
    announcementText: '',
    heroTitle: 'Crafted for Comfort, Style & Confidence.',
    heroSubtitle: '',
    standardLeadTime: '',
    nationwideDeliveryText: 'Nationwide Delivery Across All 36 States, FCT Abuja & International',
    acceptingCustomOrders: true,
    themeColor: 'obsidian' as 'obsidian' | 'midnight' | 'espresso' | 'cream' | 'emerald' | 'burgundy' | 'custom',
    customThemeBg: '#0E0A08',
    customThemeText: '#F5F5F4',
    customAccentHex: '#F59E0B',
    customBannerMessage: '',
    showAnnouncementBar: true,
    showFlierSection: true,
    showBespokeSection: true,
    showStorySection: true,
    showFounderSection: true,
    founderName: 'Theresa Isama',
    founderRole: 'Founder & Creative Director, HOS|TED',
    founderImageUrl: getSavedFounderImage() || ASSETS.tessyAvatar,
    founderQuote:
      'Every garment we craft at HOS|TED is designed to host nations—uniting African heritage with effortless modern confidence.',
    founderBioParagraph1:
      'Theresa Isama is the visionary Founder and Creative Director behind HOS|TED (HOS|TED Hosting Nations). With a deep passion for contemporary African fashion and precision tailoring, she established HOS|TED to deliver comfort, style, and confidence for every occasion.',
    founderBioParagraph2:
      'From regal silk Bubu gowns and sculpted Ankara evening pieces to chic everyday wear delivered nationwide, Theresa Isama leads every collection with uncompromising attention to fit, fabric quality, and timeless elegance.',
    paymentBankName: 'OPay / Moniepoint / Direct Bank Transfer',
    paymentAccountName: 'Theresa Isama (HOS|TED)',
    paymentAccountNumber: '9073784461',
    paymentInstructions:
      'Transfer the total order amount for your selected items, then click "Request Order Status on WhatsApp" below to send your order details and specific outfit image for instant HOS|TED payment confirmation.',
  });

  // Admin Credentials Form State
  const [credentialsForm, setCredentialsForm] = useState({
    newEmail: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Grant Portal Access to Specific Email Form State
  const [newPortalEmail, setNewPortalEmail] = useState('');
  const [newPortalRoleLabel, setNewPortalRoleLabel] = useState('Authorized Portal Admin');
  const [adminLoginFacialPhoto, setAdminLoginFacialPhoto] = useState('');
  const [editingAdminEmailFacial, setEditingAdminEmailFacial] = useState<string | null>(null);
  const [adminEmailFacialTemp, setAdminEmailFacialTemp] = useState('');

  // Measurement Editor State
  const [editingMeasurementOrder, setEditingMeasurementOrder] = useState<string | null>(null);
  const [measurementDraft, setMeasurementDraft] = useState<Record<string, string>>({});

  // Inline Order Editor State
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editOrderForm, setEditOrderForm] = useState({
    orderId: '',
    name: '',
    phone: '',
    email: '',
    category: '',
    productName: '',
    productImageUrl: '',
    customStyleName: '',
    customStyleDescription: '',
    referenceImageNotes: '',
    size: '',
    color: '',
    quantity: 1,
    totalAmountNgn: 0,
    amountPaidNgn: 0,
    deliveryState: '',
    deliveryCity: '',
    deliveryAddress: '',
    dueDate: '',
    notes: '',
  });

  const handleImageFileUpload = async (file: File, onLoaded: (dataUrl: string) => void) => {
    const compressedUrl = await compressImageFileToDataUrl(file, 760, 0.76);
    if (compressedUrl) {
      onLoaded(compressedUrl);
    }
  };

  // Immediately lock and persist any Founder portrait chosen by the Admin so it never reverts
  const applyFounderImageChoice = async (chosenUrl: string, showSavedNotice: boolean = true) => {
    const clean = String(chosenUrl || '').trim();
    if (!clean) return;
    saveFounderImagePermanently(clean);
    setWebsiteForm((prev) => ({ ...prev, founderImageUrl: clean }));
    setDb((prev) =>
      prev
        ? {
            ...prev,
            websiteSettings: {
              ...prev.websiteSettings,
              founderImageUrl: clean,
            },
          }
        : prev
    );
    try {
      await fetch('/api/public/restore-permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ founderImageUrl: clean }),
      });
      if (onStorefrontUpdated) {
        onStorefrontUpdated();
      }
      if (showSavedNotice) {
        showBanner('success', 'Founder portrait picture updated & locked permanently across the webpage.');
      }
    } catch {
      // ignore transient network error; localStorage lock is already active
    }
  };

  const startEditingProduct = (p: ProductItem) => {
    setEditingProductId(p.id);
    setEditProductForm({
      id: p.id,
      name: p.name || '',
      category: p.category || 'ankara',
      categoryLabel: p.categoryLabel || 'Custom Tailored Ankara',
      priceNgn: String(p.priceNgn ?? 0),
      fabric: p.fabric || '',
      leadTime: p.leadTime || '',
      stockCount: String(p.stockCount ?? 0),
      imageUrl: p.imageUrl || '',
      description: p.description || '',
      featuresText: Array.isArray(p.features) ? p.features.join(', ') : '',
      isPopular: Boolean(p.isPopular),
    });
  };

  // Tessy Ai (Admin Text & Soothing Nigerian Female Voice) State
  const [tessyMessages, setTessyMessages] = useState<ChatMessage[]>([
    {
      id: 'admin-welcome',
      role: 'assistant',
      content: `Welcome to **HOS|TED** Executive Operations (*HOS|TED Hosting Nations*), founded by **Theresa Isama**! I am **Tessy Ai** (speaking in a soothing Nigerian female voice), connected live to your real orders, payments, inventory, tasks, products, founder section, and website controls.\n\nYou can type or use your **microphone** to ask me to:\n• Summarize current orders, pending payments, and low stock\n• Upgrade or restyle the live HOS|TED webpage design, colors, or About the Founder section\n• Update product prices, images, or admin credentials`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [tessyInput, setTessyInput] = useState('');
  const [tessyLoading, setTessyLoading] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isTranscribingAdminVoice, setIsTranscribingAdminVoice] = useState(false);
  const [adminVoiceSeconds, setAdminVoiceSeconds] = useState(0);
  const recognitionRef = useRef<any>(null);
  const tessyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isListeningVoice) {
      setAdminVoiceSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setAdminVoiceSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isListeningVoice]);

  useEffect(() => {
    tessyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tessyMessages, tessyLoading]);

  // Real-Time Live Sync in Admin Dashboard (SSE + Auto-Poll) so new user sign-ups, profile edits, orders & chats appear immediately
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !pin) return;

    const silentFetchLatest = async () => {
      try {
        const res = await fetch('/api/staff/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin, email: loginEmail }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.db) {
            const reconciled = await reconcilePermanentStorefrontState(
              data.db.products || [],
              data.db.websiteSettings
            );
            data.db.products = reconciled.products;
            if (reconciled.websiteSettings) {
              data.db.websiteSettings = reconciled.websiteSettings;
            }
          }
          setDb(data.db);
          setMetrics(data.metrics);
        }
      } catch {
        // ignore transient network errors
      }
    };

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/events');
      eventSource.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          if (parsed.type === 'STATE_UPDATED') {
            silentFetchLatest();
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // fallback to interval
    }

    const interval = setInterval(silentFetchLatest, 4000);
    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [isOpen, isAuthenticated, pin, loginEmail]);

  if (!isOpen) return null;

  const formatNgn = (val: number = 0) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);

  const showBanner = (type: 'success' | 'error', text: string) => {
    setStatusBanner({ type, text });
    setTimeout(() => setStatusBanner(null), 5000);
  };

  const syncWebsiteFormFromDb = (dbData: HostedDatabaseState) => {
    if (!dbData?.websiteSettings) return;
    const ws = dbData.websiteSettings;
    setWebsiteForm({
      slogan: ws.slogan || 'HOS|TED Hosting Nations',
      announcementText: ws.announcementText || '',
      heroTitle: ws.heroTitle || 'Crafted for Comfort, Style & Confidence.',
      heroSubtitle: ws.heroSubtitle || '',
      standardLeadTime: ws.standardLeadTime || '',
      nationwideDeliveryText:
        ws.nationwideDeliveryText || 'Nationwide Delivery Across All 36 States, FCT Abuja & International',
      acceptingCustomOrders: ws.acceptingCustomOrders ?? true,
      themeColor: ws.themeColor || 'obsidian',
      customThemeBg: ws.customThemeBg || '#0E0A08',
      customThemeText: ws.customThemeText || '#F5F5F4',
      customAccentHex: ws.customAccentHex || '#F59E0B',
      customBannerMessage: ws.customBannerMessage || '',
      showAnnouncementBar: ws.showAnnouncementBar !== false,
      showFlierSection: ws.showFlierSection !== false,
      showBespokeSection: ws.showBespokeSection !== false,
      showStorySection: ws.showStorySection !== false,
      showFounderSection: ws.showFounderSection !== false,
      founderName: ws.founderName || 'Theresa Isama',
      founderRole: ws.founderRole || 'Founder & Creative Director, HOS|TED',
      founderImageUrl: getSavedFounderImage() || ws.founderImageUrl || ASSETS.tessyAvatar,
      founderQuote: ws.founderQuote || '',
      founderBioParagraph1: ws.founderBioParagraph1 || '',
      founderBioParagraph2: ws.founderBioParagraph2 || '',
      paymentBankName: ws.paymentBankName || 'OPay / Moniepoint / Direct Bank Transfer',
      paymentAccountName: ws.paymentAccountName || 'Theresa Isama (HOS|TED)',
      paymentAccountNumber: ws.paymentAccountNumber || '9073784461',
      paymentInstructions:
        ws.paymentInstructions ||
        'Transfer the total order amount for your selected items, then click "Request Order Status on WhatsApp" below to send your order details and specific outfit image for instant HOS|TED payment confirmation.',
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/staff/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim(), email: loginEmail.trim() }),
      });

      if (!res.ok) {
        throw new Error('Invalid HOS|TED Admin credentials.');
      }

      const data = await res.json();
      if (data.db) {
        const reconciled = await reconcilePermanentStorefrontState(
          data.db.products || [],
          data.db.websiteSettings
        );
        data.db.products = reconciled.products;
        if (reconciled.websiteSettings) {
          data.db.websiteSettings = reconciled.websiteSettings;
        }
      }
      setDb(data.db);
      setMetrics(data.metrics);
      if (data.adminEmail) {
        setAdminEmail(data.adminEmail);
        setCredentialsForm((prev) => ({ ...prev, newEmail: data.adminEmail }));
      }
      if (loginEmail.trim().toLowerCase() === 'isamavictoriaene19@gmail.com') {
        setActiveRole('Platform Creator (Founder Access)');
      } else {
        setActiveRole('Owner / Creative Director');
      }
      syncWebsiteFormFromDb(data.db);
      setIsAuthenticated(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/staff/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, email: loginEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.db) {
          const reconciled = await reconcilePermanentStorefrontState(
            data.db.products || [],
            data.db.websiteSettings
          );
          data.db.products = reconciled.products;
          if (reconciled.websiteSettings) {
            data.db.websiteSettings = reconciled.websiteSettings;
          }
        }
        setDb(data.db);
        setMetrics(data.metrics);
        syncWebsiteFormFromDb(data.db);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Ask confirmation first before implementing any edit, creation, or deletion immediately throughout the frontend & backend
  const requestConfirmedAction = (
    title: string,
    summary: string,
    actionType: string,
    payload: Record<string, any>
  ) => {
    setPendingConfirmation({
      title,
      summary,
      actionType,
      payload,
    });
  };

  // Execute verified action on backend immediately after confirmation and broadcast across frontend & backend
  const executeConfirmedAction = async () => {
    if (!pendingConfirmation) return;
    setIsLoading(true);
    const { actionType, payload } = pendingConfirmation;
    try {
      const res = await fetch('/api/staff/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          email: loginEmail,
          actionType,
          payload,
          actorRole: activeRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Action could not be verified by HOS|TED server.');
      }

      // Permanently record Admin product additions, updates, deletions, and Founder image choices
      if (actionType === 'DELETE_PRODUCT' && payload?.id) {
        recordAdminProductDeletion(String(payload.id));
      } else if (
        (actionType === 'ADD_PRODUCT' || actionType === 'UPDATE_PRODUCT') &&
        Array.isArray(data.db?.products)
      ) {
        const targetProd = payload?.id
          ? data.db.products.find((p: ProductItem) => p.id === payload.id)
          : data.db.products[0];
        if (targetProd) {
          recordAdminProductUpsert(targetProd);
        }
        syncConfirmedProductsList(data.db.products, db?.products);
        if (actionType === 'ADD_PRODUCT') {
          setNewProductForm({
            name: '',
            category: 'ankara_gowns',
            categoryLabel: 'Ankara Gowns',
            priceNgn: '0',
            fabric: '100% Grade-A Cotton Ankara',
            leadTime: '5–7 Working Days',
            stockCount: '5',
            imageUrl: ASSETS.ankaraGown,
            description: '',
          });
        }
      } else if (actionType === 'UPDATE_WEBSITE_SETTINGS') {
        if (payload?.founderImageUrl) {
          saveFounderImagePermanently(String(payload.founderImageUrl));
        } else if (data.db?.websiteSettings?.founderImageUrl) {
          saveFounderImagePermanently(String(data.db.websiteSettings.founderImageUrl));
        }
      }

      if (data.db) {
        const reconciled = await reconcilePermanentStorefrontState(
          data.db.products || [],
          data.db.websiteSettings
        );
        data.db.products = reconciled.products;
        if (reconciled.websiteSettings) {
          data.db.websiteSettings = reconciled.websiteSettings;
        }
      }

      setDb(data.db);
      setMetrics(data.metrics);
      syncWebsiteFormFromDb(data.db);
      try {
        if (Array.isArray(data.db?.products)) {
          localStorage.setItem('hosted_permanent_products_v1', JSON.stringify(data.db.products));
        }
        if (data.db?.websiteSettings) {
          localStorage.setItem('hosted_permanent_website_settings_v1', JSON.stringify(data.db.websiteSettings));
        }
        if (data.db?.customStyleEdits) {
          localStorage.setItem('hosted_permanent_style_edits_v1', JSON.stringify(data.db.customStyleEdits));
        }
      } catch {
        // ignore storage quota
      }
      if (data.adminEmail) setAdminEmail(data.adminEmail);
      if (data.newPasswordIfUpdated) {
        setPin(data.newPasswordIfUpdated);
      }
      setPendingConfirmation(null);
      showBanner('success', `Confirmed & Saved Permanently Across Frontend & Backend: ${data.message}`);

      if (onStorefrontUpdated) {
        onStorefrontUpdated();
      }
    } catch (err: any) {
      showBanner('error', err.message || 'Failed to execute action.');
    } finally {
      setIsLoading(false);
    }
  };

  // WhatsApp Helpers strictly branded as HOS|TED
  const getOrderWhatsAppUrl = (inq: InquiryRecord) => {
    const cleanPhone = inq.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('234')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `234${cleanPhone.slice(1)}`
      : cleanPhone;

    const message = encodeURIComponent(
      `Hello ${inq.name}! This is HOS|TED (HOS|TED Hosting Nations) regarding your custom order (${inq.id} - ${inq.category}, Current Status: ${inq.status}). How may we finalize your fitting schedule?`
    );
    return `https://wa.me/${phoneWithCountry}?text=${message}`;
  };

  const getPaymentReviewWhatsAppUrl = (
    clientName: string,
    clientPhone: string,
    orderId: string,
    amountNgn: number,
    status: string,
    reference: string
  ) => {
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('234')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `234${cleanPhone.slice(1)}`
      : cleanPhone;

    const message = encodeURIComponent(
      `Hello ${clientName}! This is HOS|TED (HOS|TED Hosting Nations) Payment Review Desk regarding Order ${orderId} (Ref: ${reference}, Amount: ${formatNgn(amountNgn)}). Payment Status: ${status}. Thank you for choosing HOS|TED!`
    );
    return `https://wa.me/${phoneWithCountry}?text=${message}`;
  };

  // Tessy Ai Nigerian Idoma Female Voice Input & Output
  const speakAdminReply = (text: string) => {
    if (!voiceOutputEnabled) return;
    speakWithTessyIdomaVoice(text);
  };

  const toggleAdminVoiceInput = async () => {
    if (isListeningVoice && recognitionRef.current) {
      recognitionRef.current.stopAndFinish?.();
      recognitionRef.current = null;
      return;
    }

    const session = await startTessyMicrophoneCapture({
      onListeningChange: (listening) => setIsListeningVoice(listening),
      onTranscribingChange: (transcribing) => setIsTranscribingAdminVoice(transcribing),
      onInterimTranscript: (liveText) => setTessyInput(liveText),
      onFinalTranscript: (finalText) => {
        setTessyInput(finalText);
        handleSendTessyAdmin(finalText);
      },
      onError: (errMsg) => showBanner('error', errMsg),
    });

    recognitionRef.current = session;
  };

  const cancelAdminVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.cancel?.();
      recognitionRef.current = null;
    }
    setIsListeningVoice(false);
    setIsTranscribingAdminVoice(false);
  };

  const handleSendTessyAdmin = async (overrideText?: string) => {
    const query = (overrideText ?? tessyInput).trim();
    if (!query || tessyLoading) return;

    const userMsg: ChatMessage = {
      id: `adm-usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...tessyMessages, userMsg];
    setTessyMessages(nextHistory);
    setTessyInput('');
    setTessyLoading(true);

    try {
      const res = await fetch('/api/gemini/admin-tessy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tessy Ai error');

      const aiMsg: ChatMessage = {
        id: `adm-ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        proposedAction: data.proposedAction,
      };

      setTessyMessages((prev) => [...prev, aiMsg]);
      if (voiceOutputEnabled) {
        speakAdminReply(aiMsg.content);
      }
    } catch (err: any) {
      setTessyMessages((prev) => [
        ...prev,
        {
          id: `adm-err-${Date.now()}`,
          role: 'assistant',
          content: `I could not complete that request right now: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setTessyLoading(false);
    }
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-3.5 h-3.5" />, badge: metrics?.totalOrders },
    { id: 'tessy', label: 'Tessy Ai', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'products', label: 'Products Catalog', icon: <Scissors className="w-3.5 h-3.5" />, badge: db?.products?.length },
    { id: 'website', label: 'Website & Founder', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-3.5 h-3.5" />, badge: metrics?.pendingPaymentsCount },
    { id: 'bespoke', label: 'Bespoke Sizing', icon: <Ruler className="w-3.5 h-3.5" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="w-3.5 h-3.5" />, badge: metrics?.totalCustomers },
    { id: 'appointments', label: 'Appointments', icon: <Calendar className="w-3.5 h-3.5" />, badge: metrics?.upcomingAppointments },
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-3.5 h-3.5" />, badge: metrics?.lowStockCount },
    { id: 'tasks', label: 'Tasks & Alerts', icon: <CheckSquare className="w-3.5 h-3.5" />, badge: metrics?.openTasksCount },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'marketing', label: 'Marketing', icon: <Megaphone className="w-3.5 h-3.5" /> },
    { id: 'improvements', label: 'AI Audit', icon: <Wrench className="w-3.5 h-3.5" />, badge: (db?.improvements || []).filter(i => i.status === 'Proposed').length },
    { id: 'security', label: 'Security', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ];

  const filteredOrders = (db?.orders || []).filter((inq) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (inq.name || '').toLowerCase().includes(q) ||
      (inq.phone || '').includes(searchQuery) ||
      (inq.category || '').toLowerCase().includes(q) ||
      (inq.id || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExitDashboard = () => {
    stopTessyVoice();
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl h-full sm:h-[94vh] bg-stone-950 text-stone-100 border border-stone-800 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Top Admin Header Bar — Compact & Balanced */}
        <div className="px-3.5 sm:px-5 py-2.5 border-b border-stone-800 bg-stone-900 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-white text-xs sm:text-sm truncate">
                  HOS|TED Business Management Dashboard
                </h3>
                <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  Admin Live
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isAuthenticated && (
              <>
                <select
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value as any)}
                  className="hidden xl:block bg-stone-950 border border-stone-700 rounded-lg px-2 py-1 text-[11px] font-semibold text-stone-200"
                  title="Active Staff Role"
                >
                  <option value="Owner / Creative Director">Theresa Isama (Founder)</option>
                  <option value="Platform Creator (Founder Access)">Platform Creator</option>
                  <option value="Head Tailor">Head Tailor</option>
                  <option value="Client Concierge">Client Concierge</option>
                </select>

                <button
                  onClick={() => setActiveTab('tessy')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition shadow-sm"
                >
                  <img src={ASSETS.tessyAvatar} alt="Tessy Ai" className="w-4 h-4 rounded-full object-cover" />
                  <span className="hidden sm:inline">Tessy Ai</span>
                </button>

                <button
                  onClick={refreshDashboard}
                  className="p-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-300 transition"
                  title="Sync Real-Time Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    stopTessyVoice();
                    setIsAuthenticated(false);
                    setPin('');
                  }}
                  className="p-1.5 rounded-xl bg-stone-950 hover:bg-rose-950/60 text-stone-300 hover:text-rose-300 border border-stone-700 transition"
                  title="Lock Admin Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Clean Exit Icon Button */}
            <button
              onClick={handleExitDashboard}
              className="p-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 transition"
              title="Exit Admin Dashboard"
              aria-label="Exit Admin Dashboard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Feedback Banner */}
        {statusBanner && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
              statusBanner.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusBanner.text}</span>
            </div>
            <button onClick={() => setStatusBanner(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Authentication Screen (Zero Visible Passwords) */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto bg-stone-950">
            <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-serif font-bold uppercase tracking-widest text-amber-400">
                  HOS|TED Hosting Nations
                </div>
                <h4 className="text-2xl font-serif font-bold text-white">
                  HOS|TED Admin Portal
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Enter your private HOS|TED administrator credentials to manage products, orders, website settings, About the Founder, and Tessy Ai.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
                    Admin Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Admin email address"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                      Admin Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      {showPin ? 'Hide Password' : 'Show Password'}
                    </button>
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter private admin password"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                  {errorMsg && (
                    <div className="mt-2 text-xs text-rose-400 font-semibold flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !pin}
                  className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider transition disabled:opacity-50 shadow-md"
                >
                  {isLoading ? 'Verifying Credentials...' : 'Unlock HOS|TED Dashboard'}
                </button>

                {/* Admin Facial Recognition Biometric Scan on Login Screen */}
                <div className="pt-2">
                  <FacialRecognitionCapture
                    photoUrl={adminLoginFacialPhoto}
                    onChangePhoto={setAdminLoginFacialPhoto}
                    compact
                    label="Admin Facial Recognition Biometric Scan"
                    subtitle="Scan live camera or upload admin face ID photo alongside your credentials."
                  />
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Main Layout: Responsive Sidebar + Workspace */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Navigation Sidebar (Compact & Clean) */}
            <aside className="lg:w-48 bg-stone-900 border-b lg:border-b-0 lg:border-r border-stone-800 flex lg:flex-col justify-between overflow-x-auto lg:overflow-y-auto p-2 gap-1 shrink-0 no-scrollbar">
              <div className="flex lg:flex-col gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                      activeTab === item.id
                        ? 'bg-amber-400 text-stone-950 shadow-sm font-bold'
                        : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          activeTab === item.id
                            ? 'bg-stone-950 text-amber-400'
                            : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sidebar Exit Icon Button */}
              <div className="hidden lg:block pt-3 mt-3 border-t border-stone-800">
                <button
                  onClick={handleExitDashboard}
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 text-[11px] font-semibold transition"
                  title="Exit Admin Dashboard"
                >
                  <LogOut className="w-3.5 h-3.5 text-amber-400" />
                  <span>Exit Admin</span>
                </button>
              </div>
            </aside>

            {/* Main Content Workspace */}
            <main className="flex-1 overflow-y-auto p-3 sm:p-5 bg-stone-950">
              <div className="max-w-5xl mx-auto space-y-4">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && db && metrics && (
                <div className="space-y-4">
                  
                  {/* Tessy Ai Executive Bar — Compact */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-stone-900 via-amber-950/30 to-stone-900 border border-amber-500/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={ASSETS.tessyAvatar}
                        alt="Tessy Ai"
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-serif font-bold text-white text-sm">
                            Tessy Ai — Executive Operations & Voice Assistant
                          </h4>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Live Voice Ready
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-300 mt-0.5">
                          Summarize orders, verify payments, edit products & website, or record voice commands.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setActiveTab('tessy');
                          handleSendTessyAdmin('Summarize all current HOS|TED orders, pending payments, and low stock items.');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Summarize</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('tessy');
                          setTimeout(() => toggleAdminVoiceInput(), 120);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-amber-300 border border-amber-500/40 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <Mic className="w-3.5 h-3.5 text-amber-400" />
                        <span>Record Voice</span>
                      </button>
                    </div>
                  </div>

                  {/* 6 Required Real-Data Overview KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    <button
                      onClick={() => {
                        setStatusFilter('ALL');
                        setActiveTab('orders');
                      }}
                      className="text-left p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 transition space-y-1"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Orders</div>
                      <div className="text-2xl font-serif font-bold text-white">{metrics.totalOrders}</div>
                      <div className="text-[11px] text-amber-400 font-medium">View all →</div>
                    </button>

                    <button
                      onClick={() => {
                        setStatusFilter('New Inquiry');
                        setActiveTab('orders');
                      }}
                      className="text-left p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 transition space-y-1"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">New Inquiries</div>
                      <div className="text-2xl font-serif font-bold text-amber-400">{metrics.newInquiries}</div>
                      <div className="text-[11px] text-stone-400">Awaiting review</div>
                    </button>

                    <button
                      onClick={() => {
                        setStatusFilter('In Production');
                        setActiveTab('orders');
                      }}
                      className="text-left p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 transition space-y-1"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">In Production</div>
                      <div className="text-2xl font-serif font-bold text-sky-400">{metrics.inProduction}</div>
                      <div className="text-[11px] text-stone-400">Active tailoring</div>
                    </button>

                    <button
                      onClick={() => {
                        setStatusFilter('Ready for Fitting');
                        setActiveTab('orders');
                      }}
                      className="text-left p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 transition space-y-1"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Ready for Fitting</div>
                      <div className="text-2xl font-serif font-bold text-emerald-400">{metrics.readyForFitting}</div>
                      <div className="text-[11px] text-stone-400">{metrics.consultationBooked} booked</div>
                    </button>

                    <button
                      onClick={() => setActiveTab('payments')}
                      className="text-left p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 transition space-y-1"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Pending Payments</div>
                      <div className="text-2xl font-serif font-bold text-amber-400">{metrics.pendingPaymentsCount}</div>
                      <div className="text-[11px] text-stone-300 font-mono">{formatNgn(metrics.pendingReviewAmountNgn)}</div>
                    </button>

                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="text-left p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-800 transition space-y-1"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Low Stock</div>
                      <div className="text-2xl font-serif font-bold text-rose-400">{metrics.lowStockCount}</div>
                      <div className="text-[11px] text-rose-400 font-medium">Needs restock</div>
                    </button>
                  </div>

                  {/* Quick Founder Image Editor & Registered Users Card */}
                  <div className="p-4 rounded-2xl bg-stone-900 border border-amber-500/30 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs">
                    <div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                      <img
                        src={websiteForm.founderImageUrl || getSavedFounderImage() || ASSETS.tessyAvatar}
                        alt="Founder Theresa Isama"
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400 shrink-0"
                      />
                      <div className="flex-1 w-full space-y-2">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                            About the Founder • Choose Any Picture (Permanent Lock)
                          </div>
                          <h5 className="font-serif font-bold text-white text-sm">
                            Theresa Isama — Founder Portrait Picture
                          </h5>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 cursor-pointer inline-flex items-center gap-1.5 font-bold shadow">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Choose Picture from Device</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageFileUpload(file, (dataUrl) => {
                                    applyFounderImageChoice(dataUrl, true);
                                  });
                                }
                              }}
                            />
                          </label>
                          <input
                            type="text"
                            value={websiteForm.founderImageUrl}
                            onChange={(e) =>
                              setWebsiteForm((prev) => ({ ...prev, founderImageUrl: e.target.value }))
                            }
                            placeholder="Or paste any image URL..."
                            className="flex-1 min-w-[160px] bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-white"
                          />
                          <button
                            type="button"
                            onClick={() => applyFounderImageChoice(websiteForm.founderImageUrl, true)}
                            className="px-3.5 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-bold"
                          >
                            Lock Picture
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-4 p-4 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                          Signed-Up Users & Profiles
                        </span>
                        <div className="text-xl font-serif font-bold text-white mt-0.5">
                          {db.customers.length} Registered
                        </div>
                        <span className="text-[11px] text-emerald-400">
                          Real-time sign-up & Tessy Ai memory
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveTab('customers')}
                        className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold shrink-0"
                      >
                        Manage Users →
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions Bar */}
                  <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Quick Actions — Run HOS|TED From One Place
                      </h4>
                      <button
                        onClick={handleExitDashboard}
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Exit Admin Dashboard</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => {
                          setActiveTab('orders');
                          setShowNewOrderForm(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Bespoke Order</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('payments');
                          setShowNewPaymentForm(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-800 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        <span>Record / Review Payment</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('appointments');
                          setShowNewAptForm(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-800 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Schedule Fitting</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab('products');
                          setShowNewProductForm(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-800 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <Scissors className="w-3.5 h-3.5 text-amber-400" />
                        <span>Add / Edit Catalog Pieces</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('website')}
                        className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-800 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <Globe className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit Website & Founder Bio</span>
                      </button>
                    </div>
                  </div>

                  {/* Two-column live snapshot: Recent Orders & Low Stock / Tasks */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Recent Orders */}
                    <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-white text-base">Live Orders Pipeline</h4>
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="text-xs font-semibold text-amber-400 hover:underline"
                        >
                          Manage All ({db.orders.length}) →
                        </button>
                      </div>
                      {db.orders.length === 0 ? (
                        <div className="p-6 rounded-xl bg-stone-950 border border-stone-800 text-center text-xs text-stone-400">
                          0 orders collected yet. New inquiries submitted on the storefront or created here will appear in real time.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {db.orders.slice(0, 4).map((o) => (
                            <div key={o.id} className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-2 text-xs">
                              <div>
                                <div className="font-bold text-white">
                                  {o.name} <span className="font-mono text-amber-400">({o.id})</span>
                                </div>
                                <div className="text-stone-400">
                                  {o.category} {o.deliveryState ? `· ${o.deliveryState}` : ''}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
                                  {o.status}
                                </span>
                                <div className="text-stone-300 font-mono mt-1">
                                  {formatNgn(o.totalAmountNgn || 0)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Low Stock & Priority Tasks */}
                    <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-white text-base">Low Stock & Priority Tasks</h4>
                        <button
                          onClick={() => setActiveTab('tasks')}
                          className="text-xs font-semibold text-amber-400 hover:underline"
                        >
                          View Tasks →
                        </button>
                      </div>

                      {metrics.lowStockItems.length === 0 && db.tasks.filter(t => t.status !== 'Done').length === 0 ? (
                        <div className="p-6 rounded-xl bg-stone-950 border border-stone-800 text-center text-xs text-stone-400">
                          0 low-stock alerts or pending tasks right now.
                        </div>
                      ) : (
                        <>
                          {metrics.lowStockItems.length > 0 && (
                            <div className="space-y-2">
                              {metrics.lowStockItems.map((item: any) => (
                                <div key={item.id} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                    <div>
                                      <span className="font-bold text-white">{item.name}</span>
                                      <span className="text-stone-400 ml-1">({item.quantity} {item.unit} left)</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setActiveTab('inventory')}
                                    className="text-rose-400 font-bold hover:underline"
                                  >
                                    Restock
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2">
                            {db.tasks.filter(t => t.status !== 'Done').slice(0, 3).map((t) => (
                              <div key={t.id} className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between gap-2 text-xs">
                                <div>
                                  <div className="font-semibold text-white">{t.title}</div>
                                  <div className="text-stone-400">Assigned: {t.assignee} · Due: {t.dueDate}</div>
                                </div>
                                <button
                                  onClick={() =>
                                    requestConfirmedAction(
                                      'Complete Atelier Task',
                                      `Mark task "${t.title}" (${t.id}) as Done?`,
                                      'COMPLETE_TASK',
                                      { taskId: t.id, status: 'Done' }
                                    )
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold text-[11px]"
                                >
                                  Complete
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: ORDERS & INQUIRIES */}
              {activeTab === 'orders' && db && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xl font-serif font-bold text-white">HOS|TED Orders & Inquiries</h4>
                      <p className="text-xs text-stone-400">
                        Manage live customer inquiries, nationwide delivery details, production stages, fittings, and WhatsApp confirmations.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNewOrderForm(!showNewOrderForm)}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 self-start"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{showNewOrderForm ? 'Close Form' : 'Create New Order'}</span>
                    </button>
                  </div>

                  {showNewOrderForm && (
                    <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
                      <h5 className="font-serif font-bold text-white text-sm">Record New HOS|TED Order</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <input
                          type="text"
                          placeholder="Client Full Name *"
                          value={newOrderForm.name}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, name: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                        <input
                          type="text"
                          placeholder="WhatsApp Phone *"
                          value={newOrderForm.phone}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, phone: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                        <input
                          type="text"
                          placeholder="Outfit / Style Category"
                          value={newOrderForm.category}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, category: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                        <input
                          type="number"
                          placeholder="Total Price (₦)"
                          value={newOrderForm.totalAmountNgn}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, totalAmountNgn: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                        <input
                          type="number"
                          placeholder="Deposit Paid (₦)"
                          value={newOrderForm.amountPaidNgn}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, amountPaidNgn: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                        <input
                          type="date"
                          value={newOrderForm.dueDate}
                          onChange={(e) => setNewOrderForm({ ...newOrderForm, dueDate: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            if (!newOrderForm.name || !newOrderForm.phone) {
                              showBanner('error', 'Client name and phone are required.');
                              return;
                            }
                            requestConfirmedAction(
                              'Create New HOS|TED Order',
                              `Create order for ${newOrderForm.name} (${newOrderForm.category}) at ₦${Number(newOrderForm.totalAmountNgn || 0).toLocaleString()}?`,
                              'CREATE_ORDER',
                              newOrderForm
                            );
                            setShowNewOrderForm(false);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs"
                        >
                          Review & Create Order
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Search & Filter Controls */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search client, ID, phone, style..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-stone-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 no-scrollbar">
                      {['ALL', 'New Inquiry', 'Pending Payment', 'Payment Confirmed', 'Processing', 'Tailoring', 'In Production', 'Ready for Fitting', 'Shipped', 'Completed', 'Delivered'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                            statusFilter === st
                              ? 'bg-amber-400 text-stone-950 font-bold'
                              : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orders List */}
                  {filteredOrders.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
                      0 orders match the current view.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map((inq) => (
                        <div key={inq.id} className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              {inq.productImageUrl && (
                                <img
                                  src={inq.productImageUrl}
                                  alt={inq.productName || inq.category}
                                  className="w-14 h-16 rounded-xl object-cover border border-amber-500/40 shrink-0"
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs text-amber-400 font-bold bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30">
                                    {inq.id}
                                  </span>
                                  <h5 className="font-serif font-bold text-white text-base">{inq.name}</h5>
                                  <span className="text-xs text-stone-400">· {inq.phone}</span>
                                </div>
                                <div className="text-xs text-stone-300 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                  <span><strong>Outfit:</strong> {inq.productName || inq.category}</span>
                                  {inq.size && <span><strong>Size:</strong> {inq.size}</span>}
                                  {inq.color && <span><strong>Color:</strong> {inq.color}</span>}
                                  <span><strong>Items (Qty):</strong> <span className="text-amber-400 font-mono font-bold">{inq.quantity || 1}</span></span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {inq.paymentStatus !== 'Paid' && inq.paymentStatus !== 'Payment Confirmed' && inq.status !== 'Payment Confirmed' && (
                                <button
                                  onClick={() =>
                                    requestConfirmedAction(
                                      'Confirm Order Payment',
                                      `Mark Order ${inq.id} (${inq.name} — ${inq.quantity || 1}x ${inq.productName || inq.category}) as Payment Confirmed (${formatNgn(inq.totalAmountNgn || 0)})?`,
                                      'UPDATE_ORDER_STATUS',
                                      { orderId: inq.id, newStatus: 'Payment Confirmed' }
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs"
                                >
                                  Confirm Payment ✓
                                </button>
                              )}

                              <select
                                value={inq.status}
                                onChange={(e) =>
                                  requestConfirmedAction(
                                    'Update Order Status',
                                    `Change Order ${inq.id} (${inq.name}) status from "${inq.status}" to "${e.target.value}"?`,
                                    'UPDATE_ORDER_STATUS',
                                    { orderId: inq.id, newStatus: e.target.value }
                                  )
                                }
                                className="bg-stone-950 border border-stone-800 text-white text-xs rounded-lg px-2.5 py-1.5 font-semibold"
                              >
                                <option value="New Inquiry">New Inquiry</option>
                                <option value="Pending Payment">Pending Payment</option>
                                <option value="Payment Confirmed">Payment Confirmed ✓</option>
                                <option value="Processing">Processing</option>
                                <option value="Consultation Booked">Consultation Booked</option>
                                <option value="Tailoring">Tailoring</option>
                                <option value="In Production">In Production</option>
                                <option value="Ready for Fitting">Ready for Fitting</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Completed">Completed</option>
                                <option value="Delivered">Delivered</option>
                              </select>

                                <a
                                  href={getOrderWhatsAppUrl(inq)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp Client</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingOrderId === inq.id) {
                                      setEditingOrderId(null);
                                    } else {
                                      setEditingOrderId(inq.id);
                                      setEditOrderForm({
                                        orderId: inq.id,
                                        name: inq.name || '',
                                        phone: inq.phone || '',
                                        email: inq.email || '',
                                        category: inq.productName || inq.category || '',
                                        productName: inq.productName || inq.category || '',
                                        productImageUrl: inq.productImageUrl || '',
                                        customStyleName: inq.customStyleName || inq.productName || inq.category || '',
                                        customStyleDescription: inq.customStyleDescription || '',
                                        referenceImageNotes: inq.referenceImageNotes || '',
                                        size: inq.size || '',
                                        color: inq.color || '',
                                        quantity: inq.quantity || 1,
                                        totalAmountNgn: inq.totalAmountNgn || 0,
                                        amountPaidNgn: inq.amountPaidNgn || 0,
                                        deliveryState: inq.deliveryState || 'Lagos',
                                        deliveryCity: inq.deliveryCity || '',
                                        deliveryAddress: inq.deliveryAddress || '',
                                        dueDate: inq.dueDate || '',
                                        notes: inq.notes || '',
                                      });
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>{editingOrderId === inq.id ? 'Cancel' : 'Edit'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    requestConfirmedAction(
                                      'Delete Order Record',
                                      `Delete Order ${inq.id} (${inq.name}) from the HOS|TED pipeline?`,
                                      'DELETE_ORDER',
                                      { orderId: inq.id }
                                    )
                                  }
                                  className="p-1.5 rounded-lg bg-stone-950 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-800"
                                  title="Delete Order"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {editingOrderId === inq.id && (
                              <div className="p-4 rounded-xl bg-stone-950 border border-amber-500/40 space-y-3 text-xs">
                                <div className="font-serif font-bold text-amber-400">
                                  Edit Order Details ({inq.id})
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                                  <input
                                    type="text"
                                    placeholder="Client Name"
                                    value={editOrderForm.name}
                                    onChange={(e) => setEditOrderForm({ ...editOrderForm, name: e.target.value })}
                                    className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                  />
                                  <input
                                    type="text"
                                    placeholder="WhatsApp Phone"
                                    value={editOrderForm.phone}
                                    onChange={(e) => setEditOrderForm({ ...editOrderForm, phone: e.target.value })}
                                    className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Outfit / Style"
                                    value={editOrderForm.category}
                                    onChange={(e) => setEditOrderForm({ ...editOrderForm, category: e.target.value })}
                                    className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Total Price (₦)"
                                    value={editOrderForm.totalAmountNgn}
                                    onChange={(e) => setEditOrderForm({ ...editOrderForm, totalAmountNgn: Number(e.target.value) })}
                                    className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Paid Amount (₦)"
                                    value={editOrderForm.amountPaidNgn}
                                    onChange={(e) => setEditOrderForm({ ...editOrderForm, amountPaidNgn: Number(e.target.value) })}
                                    className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Size"
                                    value={editOrderForm.size}
                                    onChange={(e) => setEditOrderForm({ ...editOrderForm, size: e.target.value })}
                                    className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Color"
                                    value={editOrderForm.color}
                                    onChange={(e) => setEditOrderForm({ ...editOrderForm, color: e.target.value })}
                                    className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Delivery State"
                                    value={editOrderForm.deliveryState}
                                    onChange={(e) => setEditOrderForm({ ...editOrderForm, deliveryState: e.target.value })}
                                    className="bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                  <div className="space-y-1.5">
                                    <label className="text-[11px] text-amber-300 font-semibold block">
                                      Custom Bespoke Style Description / Details
                                    </label>
                                    <textarea
                                      rows={2}
                                      placeholder="Custom bespoke tailoring details / style description..."
                                      value={editOrderForm.customStyleDescription}
                                      onChange={(e) =>
                                        setEditOrderForm({ ...editOrderForm, customStyleDescription: e.target.value })
                                      }
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[11px] text-amber-300 font-semibold block">
                                      Reference Image Styling & Notes
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Reference image styling notes..."
                                      value={editOrderForm.referenceImageNotes}
                                      onChange={(e) =>
                                        setEditOrderForm({ ...editOrderForm, referenceImageNotes: e.target.value })
                                      }
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-white"
                                    />
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        placeholder="Reference Image URL..."
                                        value={editOrderForm.productImageUrl}
                                        onChange={(e) =>
                                          setEditOrderForm({ ...editOrderForm, productImageUrl: e.target.value })
                                        }
                                        className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-white"
                                      />
                                      <label className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold cursor-pointer shrink-0 flex items-center gap-1">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Upload Image</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) {
                                              handleImageFileUpload(f, (dataUrl) =>
                                                setEditOrderForm((prev) => ({ ...prev, productImageUrl: dataUrl }))
                                              );
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      requestConfirmedAction(
                                        'Save Order Updates',
                                        `Save updated details for Order ${inq.id}?`,
                                        'UPDATE_ORDER_DETAILS',
                                        editOrderForm
                                      );
                                      setEditingOrderId(null);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold"
                                  >
                                    Save Order Changes
                                  </button>
                                </div>
                              </div>
                            )}

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-stone-300 pt-1">
                            <div><strong>Style:</strong> {inq.category}</div>
                            <div><strong>Total:</strong> {formatNgn(inq.totalAmountNgn || 0)}</div>
                            <div>
                              <strong>Payment Status:</strong>{' '}
                              <span className={inq.paymentStatus === 'Paid' || inq.status === 'Payment Confirmed' ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                                {inq.paymentStatus === 'Paid' || inq.status === 'Payment Confirmed' ? 'Payment Confirmed ✓' : 'Unverified / Pending'}
                              </span>{' '}
                              ({formatNgn(inq.amountPaidNgn || 0)} paid)
                            </div>
                            <div><strong>Due Date:</strong> {inq.dueDate || 'Standard'}</div>
                          </div>

                          {(inq.deliveryState || inq.deliveryCity || inq.deliveryAddress) && (
                            <div className="text-xs text-amber-300 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                              <strong>Nationwide Delivery Details:</strong>{' '}
                              {[inq.deliveryAddress, inq.deliveryCity, inq.deliveryState].filter(Boolean).join(', ')}
                            </div>
                          )}

                          {(inq.customStyleDescription || inq.referenceImageNotes || inq.isCustomStyleOverride) && (
                            <div className="p-3 rounded-xl bg-stone-950 border border-amber-500/30 space-y-1.5 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  Custom Bespoke Style & Reference Image Styling
                                </span>
                                {inq.customStyleName && (
                                  <strong className="text-white">{inq.customStyleName}</strong>
                                )}
                              </div>
                              {inq.customStyleDescription && (
                                <div className="text-stone-200">
                                  <strong className="text-amber-300">Customized Style Description:</strong>{' '}
                                  {inq.customStyleDescription}
                                </div>
                              )}
                              {inq.referenceImageNotes && (
                                <div className="text-emerald-300">
                                  <strong>Reference Image Styling Notes:</strong> {inq.referenceImageNotes}
                                </div>
                              )}
                            </div>
                          )}

                          {inq.notes && (
                            <div className="text-xs text-stone-300 italic bg-stone-950 p-2.5 rounded-xl border border-stone-800">
                              "{inq.notes}"
                            </div>
                          )}

                          {/* Client Facial Recognition Photo & Attached Custom Tailoring/Measurement Files on Order */}
                          {(inq.clientFacialPhotoUrl || (inq.customAttachments && inq.customAttachments.length > 0)) && (
                            <div className="p-3.5 rounded-xl bg-stone-950 border border-amber-500/30 space-y-2.5 text-xs">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="font-serif font-bold text-amber-400 flex items-center gap-1.5">
                                  <ScanFace className="w-4 h-4" />
                                  <span>Client Facial Recognition & Attached Bespoke Files</span>
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3">
                                {inq.clientFacialPhotoUrl && (
                                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-900 border border-emerald-500/40">
                                    <img
                                      src={inq.clientFacialPhotoUrl}
                                      alt={`${inq.name} Face ID`}
                                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-400"
                                    />
                                    <div>
                                      <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                                        Client Face ID ✓
                                      </span>
                                      <span className="text-stone-300 text-[11px]">{inq.name}</span>
                                    </div>
                                  </div>
                                )}

                                {(inq.customAttachments || []).map((att) => (
                                  <div
                                    key={att.id}
                                    className="flex items-center gap-2 p-2 rounded-xl bg-stone-900 border border-stone-800"
                                  >
                                    {att.dataUrl.startsWith('data:image/') ? (
                                      <img
                                        src={att.dataUrl}
                                        alt={att.name}
                                        className="w-11 h-11 rounded-lg object-cover border border-amber-500/40"
                                      />
                                    ) : (
                                      <Paperclip className="w-5 h-5 text-amber-400" />
                                    )}
                                    <div className="max-w-[160px]">
                                      <div className="text-white font-semibold truncate text-[11px]">
                                        {att.name}
                                      </div>
                                      <a
                                        href={att.dataUrl}
                                        download={att.name}
                                        className="text-[10px] text-amber-400 hover:underline inline-flex items-center gap-1"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>Download File</span>
                                      </a>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TESSY AI (ADMIN TEXT & NIGERIAN IDOMA VOICE CONSOLE) */}
              {activeTab === 'tessy' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                  <div className="lg:col-span-8 flex flex-col bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden h-[620px]">
                    {/* Header */}
                    <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={ASSETS.tessyAvatar}
                          alt="Tessy Ai"
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-serif font-bold text-white text-base">Tessy Ai</h4>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Soothing Nigerian Female Voice
                            </span>
                          </div>
                          <p className="text-xs text-stone-400">
                            Connected to real HOS|TED data, website design controls, and admin security
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (voiceOutputEnabled) {
                            stopTessyVoice();
                          }
                          setVoiceOutputEnabled(!voiceOutputEnabled);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                          voiceOutputEnabled
                            ? 'bg-amber-400 text-stone-950 border-amber-500'
                            : 'bg-stone-900 text-stone-400 border-stone-800'
                        }`}
                      >
                        {voiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <span>{voiceOutputEnabled ? 'Nigerian Voice On' : 'Voice Muted'}</span>
                      </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-950">
                      {tessyMessages.map((m) => (
                        <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {m.role !== 'user' && (
                            <img
                              src={ASSETS.tessyAvatar}
                              alt="Tessy Ai"
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-400 shrink-0 mt-1"
                            />
                          )}
                          <div
                            className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-3 ${
                              m.role === 'user'
                                ? 'bg-amber-400 text-stone-950 font-medium rounded-tr-none'
                                : 'bg-stone-900 border border-stone-800 text-stone-100 rounded-tl-none'
                            }`}
                          >
                            <div>
                              {m.role === 'user' ? (
                                <div className="whitespace-pre-line">{m.content}</div>
                              ) : (
                                renderFormattedTessyReply(m.content)
                              )}
                            </div>

                            {m.proposedAction && (
                              <div className="p-3.5 rounded-xl bg-stone-950 border-2 border-amber-500/50 space-y-2.5">
                                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
                                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                                  <span>Ready for Immediate Execution</span>
                                </div>
                                <p className="text-xs text-stone-200 font-medium">
                                  {m.proposedAction.summary}
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() =>
                                      requestConfirmedAction(
                                        `Apply Tessy Ai Action (${m.proposedAction!.type})`,
                                        m.proposedAction!.summary,
                                        m.proposedAction!.type,
                                        m.proposedAction!.payload
                                      )
                                    }
                                    className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs"
                                  >
                                    Apply Change Immediately
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-2 text-[10px] text-stone-400 pt-1">
                              <span>{m.timestamp}</span>
                              {m.role !== 'user' && (
                                <button
                                  type="button"
                                  onClick={() => speakWithTessyIdomaVoice(m.content)}
                                  className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
                                  title="Listen in Tessy Ai's Soothing Nigerian Female Voice"
                                >
                                  <Volume2 className="w-3 h-3" />
                                  <span>Speak (Nigerian Voice)</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {tessyLoading && (
                        <div className="flex items-center gap-2 text-xs text-stone-400 p-3">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span>Tessy Ai is analyzing real HOS|TED operational records...</span>
                        </div>
                      )}
                      <div ref={tessyEndRef} />
                    </div>

                    {/* Input & Live Voice Recording Controls */}
                    <div className="p-3.5 border-t border-stone-800 bg-stone-900 space-y-2.5">
                      {(isListeningVoice || isTranscribingAdminVoice) && (
                        <div className="p-3 rounded-2xl bg-stone-950 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                            <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                              {isTranscribingAdminVoice
                                ? 'Transcribing Admin Voice for Tessy Ai...'
                                : `Live Admin Voice Recording (${Math.floor(adminVoiceSeconds / 60)}:${String(adminVoiceSeconds % 60).padStart(2, '0')}) — Speak Now`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={cancelAdminVoiceInput}
                              className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-[11px] font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={toggleAdminVoiceInput}
                              className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[11px] flex items-center gap-1 shadow"
                            >
                              <Send className="w-3 h-3" />
                              <span>Stop & Send Voice</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleAdminVoiceInput}
                          disabled={tessyLoading || isTranscribingAdminVoice}
                          className={`px-3 py-3 rounded-xl border transition shrink-0 flex items-center gap-1.5 text-xs font-bold ${
                            isListeningVoice
                              ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                              : 'bg-stone-950 hover:bg-stone-800 text-amber-300 border-amber-500/40'
                          }`}
                          title={isListeningVoice ? 'Stop & Send Voice Recording' : 'Record Live Voice Command to Tessy Ai'}
                        >
                          {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          <span className="hidden sm:inline">
                            {isListeningVoice ? 'Stop & Send' : 'Record Voice'}
                          </span>
                        </button>

                        <input
                          type="text"
                          value={tessyInput}
                          onChange={(e) => setTessyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (isListeningVoice && recognitionRef.current) {
                                recognitionRef.current.stopAndFinish?.();
                                recognitionRef.current = null;
                              } else {
                                handleSendTessyAdmin();
                              }
                            }
                          }}
                          placeholder={
                            isListeningVoice
                              ? 'LIVE RECORDING ACTIVE — Speak your command now, then click Stop & Send...'
                              : 'Type or click Record Voice to summarize orders, edit products, or update website...'
                          }
                          className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-3 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                        />

                        <button
                          onClick={() => {
                            if (isListeningVoice && recognitionRef.current) {
                              recognitionRef.current.stopAndFinish?.();
                              recognitionRef.current = null;
                            } else {
                              handleSendTessyAdmin();
                            }
                          }}
                          disabled={(!tessyInput.trim() && !isListeningVoice) || tessyLoading}
                          className="p-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold disabled:opacity-40 transition shrink-0"
                          title={isListeningVoice ? 'Stop Recording & Send to Tessy Ai' : 'Send command'}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: One-Click Executive & Website Design Prompts */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
                      <h5 className="font-serif font-bold text-white text-sm">
                        Tessy Ai Authorized Operations & Design Prompts
                      </h5>
                      <p className="text-xs text-stone-400">
                        Click any prompt below to query real HOS|TED data or instruct Tessy Ai to upgrade the website with confirmation:
                      </p>
                      <div className="space-y-2">
                        {[
                          'Summarize all current HOS|TED orders, payments, and inventory levels.',
                          'Update the website hero title and announcement banner for a new seasonal showcase.',
                          'Update the About the Founder biography section for Theresa Isama.',
                          'Switch the website theme mode or accent styling.',
                          'Check pending payments and tell me who owes a balance.',
                          'Which inventory items are low in stock right now?',
                          'How can we improve our HOS|TED conversion and operations today?',
                        ].map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendTessyAdmin(q)}
                            className="w-full text-left p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xs text-stone-200 font-medium transition"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PAYMENTS & REVIEW (With HOS|TED WhatsApp Payment Review) */}
              {activeTab === 'payments' && db && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xl font-serif font-bold text-white">
                        HOS|TED Payments & Review Desk
                      </h4>
                      <p className="text-xs text-stone-400">
                        Verify transfers, track deposits, and send HOS|TED payment review messages via WhatsApp.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNewPaymentForm(!showNewPaymentForm)}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 self-start"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Record Payment</span>
                    </button>
                  </div>

                  {showNewPaymentForm && (
                    <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
                      <h5 className="font-serif font-bold text-white text-sm">Record Client Payment</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <select
                          value={newPaymentForm.orderId}
                          onChange={(e) => setNewPaymentForm({ ...newPaymentForm, orderId: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        >
                          <option value="">Select Order</option>
                          {db.orders.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.id} — {o.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Amount (₦)"
                          value={newPaymentForm.amountNgn}
                          onChange={(e) => setNewPaymentForm({ ...newPaymentForm, amountNgn: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                        <select
                          value={newPaymentForm.method}
                          onChange={(e) => setNewPaymentForm({ ...newPaymentForm, method: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="POS">POS</option>
                          <option value="Online">Online</option>
                          <option value="Cash">Cash</option>
                        </select>
                        <button
                          onClick={() => {
                            requestConfirmedAction(
                              'Record New HOS|TED Payment',
                              `Record payment of ₦${Number(newPaymentForm.amountNgn || 0).toLocaleString()} for Order ${newPaymentForm.orderId || 'N/A'}?`,
                              'RECORD_PAYMENT_VERIFICATION',
                              newPaymentForm
                            );
                            setShowNewPaymentForm(false);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold"
                        >
                          Confirm & Save
                        </button>
                      </div>
                    </div>
                  )}

                  {db.payments.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
                      0 payment records collected yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {db.payments.map((pay) => (
                        <div key={pay.id} className="p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            {pay.productImageUrl && (
                              <img
                                src={pay.productImageUrl}
                                alt={pay.productName || 'Order item'}
                                className="w-14 h-16 rounded-xl object-cover border border-amber-500/40 shrink-0"
                              />
                            )}
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                                  {pay.id}
                                </span>
                                <span className="font-bold text-white text-sm">{pay.clientName}</span>
                                <span className="text-stone-400">· Order {pay.orderId}</span>
                              </div>
                              <div className="text-stone-300">
                                Amount: <strong className="font-mono text-amber-400">{formatNgn(pay.amountNgn)}</strong> · Method: {pay.method} · Ref: <span className="font-mono">{pay.reference}</span>
                              </div>
                              {(pay.productName || pay.size || pay.color || pay.quantity) && (
                                <div className="text-stone-300 flex flex-wrap gap-x-3 gap-y-0.5">
                                  {pay.productName && <span><strong>Outfit:</strong> {pay.productName}</span>}
                                  {pay.size && <span><strong>Size:</strong> {pay.size}</span>}
                                  {pay.color && <span><strong>Color:</strong> {pay.color}</span>}
                                  {pay.quantity && <span><strong>Qty:</strong> {pay.quantity}</span>}
                                </div>
                              )}
                              {pay.notes && <div className="text-stone-400 italic">{pay.notes}</div>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                                pay.status === 'Verified'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {pay.status}
                            </span>

                            {pay.status !== 'Verified' && (
                              <button
                                onClick={() =>
                                  requestConfirmedAction(
                                    'Verify HOS|TED Payment',
                                    `Verify payment ${pay.id} (${formatNgn(pay.amountNgn)}) from ${pay.clientName}?`,
                                    'RECORD_PAYMENT_VERIFICATION',
                                    { paymentId: pay.id, status: 'Verified' }
                                  )
                                }
                                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs"
                              >
                                Verify Payment
                              </button>
                            )}

                            <a
                              href={getPaymentReviewWhatsAppUrl(
                                pay.clientName,
                                pay.clientPhone,
                                pay.orderId,
                                pay.amountNgn,
                                pay.status,
                                pay.reference
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>HOS|TED WhatsApp Payment Review</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: BESPOKE & SIZING */}
              {activeTab === 'bespoke' && db && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-serif font-bold text-white">Bespoke Measurements Registry</h4>
                    <p className="text-xs text-stone-400">
                      View and update client body measurements (inches) synchronized with HOS|TED orders.
                    </p>
                  </div>

                  {db.orders.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
                      0 measurement profiles recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {db.orders.map((o) => {
                        const isEditing = editingMeasurementOrder === o.id;
                        const m = isEditing ? measurementDraft : o.measurements || {};
                        return (
                          <div key={o.id} className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-mono text-xs font-bold text-amber-400 mr-2">{o.id}</span>
                                <span className="font-serif font-bold text-white text-base">{o.name}</span>
                                <span className="text-xs text-stone-400 ml-2">({o.category})</span>
                              </div>
                              {!isEditing ? (
                                <button
                                  onClick={() => {
                                    setEditingMeasurementOrder(o.id);
                                    setMeasurementDraft({ ...(o.measurements || {}) });
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 text-xs font-semibold"
                                >
                                  Edit Measurements
                                </button>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      requestConfirmedAction(
                                        'Save Client Measurements',
                                        `Update bespoke body measurements for ${o.name} (${o.id})?`,
                                        'UPDATE_MEASUREMENTS',
                                        { orderId: o.id, measurements: measurementDraft }
                                      );
                                      setEditingMeasurementOrder(null);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs"
                                  >
                                    Save Changes
                                  </button>
                                  <button
                                    onClick={() => setEditingMeasurementOrder(null)}
                                    className="px-3 py-1.5 rounded-xl bg-stone-950 text-stone-400 text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
                              {['bust', 'waist', 'hips', 'shoulder', 'dressLength', 'sleeveLength'].map((field) => (
                                <div key={field} className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                                  <span className="block text-[10px] uppercase text-stone-400 font-bold">{field}</span>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={measurementDraft[field] || ''}
                                      onChange={(e) =>
                                        setMeasurementDraft({ ...measurementDraft, [field]: e.target.value })
                                      }
                                      className="w-full mt-1 bg-stone-900 px-2 py-1 rounded font-mono text-white border border-stone-700"
                                    />
                                  ) : (
                                    <span className="font-mono font-bold text-white text-sm">
                                      {m[field] ? `${m[field]}"` : '-'}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: CUSTOMERS & REGISTERED SIGN-UP USERS (VIEW, SAVE & MANAGE + TESSY AI CHAT MEMORY) */}
              {activeTab === 'customers' && db && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xl font-serif font-bold text-white">
                        HOS|TED Registered Users, Onboarding Profiles & Tessy Ai Memory
                      </h4>
                      <p className="text-xs text-stone-400">
                        View, edit, save, and manage every user’s sign-up details, style onboarding preferences, nationwide delivery address, and remembered Tessy Ai chats in real time.
                      </p>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-stone-900 border border-amber-500/30 text-xs text-amber-300 font-semibold">
                      Total Profiles Saved: <strong>{db.customers.length}</strong>
                    </div>
                  </div>

                  {db.customers.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
                      0 users registered yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {db.customers.map((c) => {
                        const isFounderProfile =
                          Boolean(c.isFounder) ||
                          (c.email || '').trim().toLowerCase() === 'isamatheresa12@gmail.com';
                        const isEditing = editingCustomerId === c.id;
                        const isChatOpen = expandedChatCustomerId === c.id;
                        const savedChats = Array.isArray(c.chatHistory) ? c.chatHistory : [];

                        return (
                          <div
                            key={c.id}
                            className={`p-5 rounded-2xl border space-y-4 text-xs ${
                              isFounderProfile
                                ? 'bg-gradient-to-r from-stone-900 via-amber-950/30 to-stone-900 border-amber-400/50'
                                : 'bg-stone-900 border-stone-800'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3.5">
                                {c.facialPhotoUrl ? (
                                  <img
                                    src={c.facialPhotoUrl}
                                    alt={`${c.name} Facial ID`}
                                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-400 shrink-0"
                                  />
                                ) : isFounderProfile ? (
                                  <img
                                    src={websiteForm.founderImageUrl || ASSETS.tessyAvatar}
                                    alt={c.name}
                                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400 shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-500/40 text-amber-300 font-serif font-bold text-base flex items-center justify-center shrink-0">
                                    {(c.name || 'HT').slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-stone-950 text-amber-400 border border-stone-800">
                                      {c.id}
                                    </span>
                                    <h5 className="font-serif font-bold text-white text-base">
                                      {c.name}
                                    </h5>
                                    {c.facialPhotoUrl && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                                        <ScanFace className="w-3 h-3" />
                                        <span>Facial ID Active ✓</span>
                                      </span>
                                    )}
                                    {isFounderProfile ? (
                                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px] uppercase tracking-wider">
                                        👑 Founder & Owner of HOS|TED
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] uppercase tracking-wider">
                                        {c.roleLabel || 'Onboarded User'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-stone-300 font-mono mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                                    <span>Email: <strong>{c.email || 'Not provided'}</strong></span>
                                    <span>· WhatsApp: <strong>{c.phone || 'N/A'}</strong></span>
                                  </div>
                                  <div className="text-[11px] text-stone-400 mt-0.5">
                                    Joined: {c.joinedAt ? new Date(c.joinedAt).toLocaleDateString() : 'N/A'}
                                    {c.lastLoginAt && ` · Last Active: ${new Date(c.lastLoginAt).toLocaleString()}`}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedChatCustomerId(isChatOpen ? null : c.id)
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>
                                    Tessy Ai Chats ({savedChats.length})
                                  </span>
                                </button>

                                {!isEditing ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCustomerId(c.id);
                                      setEditCustomerForm({
                                        customerId: c.id,
                                        name: c.name || '',
                                        email: c.email || '',
                                        phone: c.phone || '',
                                        preferredStyle: c.preferredStyle || '',
                                        preferredSize: c.preferredSize || '',
                                        favoriteColors: c.favoriteColors || '',
                                        deliveryState: c.delivery?.state || 'Lagos',
                                        deliveryCity: c.delivery?.city || '',
                                        deliveryAddress: c.delivery?.address || '',
                                        notes: c.notes || '',
                                      });
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-200 font-semibold flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit User</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setEditingCustomerId(null)}
                                    className="px-3 py-1.5 rounded-xl bg-stone-950 text-stone-400"
                                  >
                                    Cancel
                                  </button>
                                )}

                                {c.phone && (
                                  <a
                                    href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '').replace(/^0/, '234')}?text=${encodeURIComponent(`Hello ${c.name}! Warm greetings from HOS|TED (HOS|TED Hosting Nations).`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold flex items-center gap-1"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}

                                {!isFounderProfile && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      requestConfirmedAction(
                                        'Delete User Profile',
                                        `Remove user profile "${c.name}" (${c.email || c.phone}) from HOS|TED directory?`,
                                        'DELETE_CUSTOMER_PROFILE',
                                        { customerId: c.id }
                                      )
                                    }
                                    className="p-1.5 rounded-xl bg-stone-950 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-800"
                                    title="Delete User Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Sign-Up & Onboarding Exact Real-Time Data Summary Grid (With Layman Size & Color Guide) */}
                            {!isEditing ? (
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                                <div>
                                  <span className="text-[10px] uppercase text-stone-400 block">Preferred Style</span>
                                  <strong className="text-stone-200">{c.preferredStyle || 'Not specified'}</strong>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase text-stone-400 block">Size (Layman Fit)</span>
                                  <strong className="text-amber-400 block">{c.preferredSize || 'Custom Fit'}</strong>
                                  {findLaymanSizeOption(c.preferredSize) && (
                                    <span className="text-[10px] text-stone-400 block">
                                      {findLaymanSizeOption(c.preferredSize)?.everydayName}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase text-stone-400 block">Favorite Colors</span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {findLaymanColorOption(c.favoriteColors) && (
                                      <span
                                        className="w-3.5 h-3.5 rounded-full shrink-0 border"
                                        style={{
                                          background: findLaymanColorOption(c.favoriteColors)?.hex,
                                          borderColor:
                                            findLaymanColorOption(c.favoriteColors)?.borderHex ||
                                            'rgba(255,255,255,0.3)',
                                        }}
                                      />
                                    )}
                                    <strong className="text-stone-200">
                                      {c.favoriteColors || 'Not specified'}
                                    </strong>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase text-stone-400 block">Exact Delivery Location</span>
                                  <strong className="text-stone-200">
                                    {[c.delivery?.address, c.delivery?.city, c.delivery?.state].filter(Boolean).join(', ') || 'Nigeria'}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase text-stone-400 block">Real-Time Orders & Spend</span>
                                  <strong className="text-emerald-400">
                                    {c.totalOrders} Order(s) · {formatNgn(c.totalSpentNgn)}
                                  </strong>
                                </div>
                              </div>
                            ) : (
                              /* Edit User Profile Form in Admin Dashboard (With Layman Size & Visual Colors) */
                              <div className="p-4 rounded-xl bg-stone-950 border border-amber-500/40 space-y-3">
                                <div className="font-serif font-bold text-amber-400 text-sm">
                                  Edit & Save User Profile Immediately ({c.name})
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] uppercase text-stone-400 mb-1">Full Name</label>
                                    <input
                                      type="text"
                                      value={editCustomerForm.name}
                                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase text-stone-400 mb-1">Email</label>
                                    <input
                                      type="email"
                                      value={editCustomerForm.email}
                                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase text-stone-400 mb-1">WhatsApp Phone</label>
                                    <input
                                      type="text"
                                      value={editCustomerForm.phone}
                                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase text-stone-400 mb-1">Preferred Style</label>
                                    <input
                                      type="text"
                                      value={editCustomerForm.preferredStyle}
                                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, preferredStyle: e.target.value })}
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase text-stone-400 mb-1">Preferred Size (Layman Guide)</label>
                                    <select
                                      value={editCustomerForm.preferredSize}
                                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, preferredSize: e.target.value })}
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                    >
                                      <option value={editCustomerForm.preferredSize}>{editCustomerForm.preferredSize || 'Select Size'}</option>
                                      {LAYMAN_SIZE_GUIDE.map((sz) => (
                                        <option key={sz.value} value={sz.value}>
                                          {sz.shortLabel} — {sz.everydayName} ({sz.ukSize})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase text-stone-400 mb-1">Favorite Colors (Layman Guide)</label>
                                    <select
                                      value={editCustomerForm.favoriteColors}
                                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, favoriteColors: e.target.value })}
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                    >
                                      <option value={editCustomerForm.favoriteColors}>{editCustomerForm.favoriteColors || 'Select Color'}</option>
                                      {LAYMAN_COLOR_GUIDE.map((clr) => (
                                        <option key={clr.value} value={clr.value}>
                                          {clr.simpleName} ({clr.fashionShade})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase text-stone-400 mb-1">Delivery State</label>
                                    <input
                                      type="text"
                                      value={editCustomerForm.deliveryState}
                                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, deliveryState: e.target.value })}
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase text-stone-400 mb-1">Delivery City</label>
                                    <input
                                      type="text"
                                      value={editCustomerForm.deliveryCity}
                                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, deliveryCity: e.target.value })}
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] uppercase text-stone-400 mb-1">Street Address</label>
                                    <input
                                      type="text"
                                      value={editCustomerForm.deliveryAddress}
                                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, deliveryAddress: e.target.value })}
                                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase text-stone-400 mb-1">Admin Reference Notes</label>
                                  <input
                                    type="text"
                                    value={editCustomerForm.notes}
                                    onChange={(e) => setEditCustomerForm({ ...editCustomerForm, notes: e.target.value })}
                                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-2 text-white"
                                  />
                                </div>

                                {/* Admin Facial Recognition & Custom Attachments Editor for this User */}
                                <div className="pt-2 space-y-3">
                                  <FacialRecognitionCapture
                                    photoUrl={(editCustomerForm as any).facialPhotoUrl ?? c.facialPhotoUrl ?? ''}
                                    onChangePhoto={(dataUrl) =>
                                      setEditCustomerForm({ ...editCustomerForm, facialPhotoUrl: dataUrl } as any)
                                    }
                                    label={`Facial Recognition Photo for ${c.name}`}
                                    subtitle="Capture via camera or upload a photo to enroll or update this user's Facial Recognition ID in the Admin Portal."
                                  />
                                  <CustomFilesAttachmentBox
                                    attachments={(editCustomerForm as any).customAttachments ?? c.customAttachments ?? []}
                                    onChangeAttachments={(files) =>
                                      setEditCustomerForm({ ...editCustomerForm, customAttachments: files } as any)
                                    }
                                    title={`Attached Custom Tailoring & Measurement Files for ${c.name}`}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      requestConfirmedAction(
                                        'Save User Profile Changes',
                                        `Save updated details for ${editCustomerForm.name} (${editCustomerForm.email || editCustomerForm.phone})?`,
                                        'UPDATE_CUSTOMER_PROFILE',
                                        editCustomerForm
                                      );
                                      setEditingCustomerId(null);
                                    }}
                                    className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold"
                                  >
                                    Save & Apply Immediately
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Expandable Tessy Ai Chat History Viewer for Each User */}
                            {isChatOpen && (
                              <div className="p-4 rounded-xl bg-stone-950 border border-amber-500/30 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-serif font-bold text-amber-400 text-xs flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Tessy Ai Saved Chat History with {c.name}</span>
                                  </span>
                                  <span className="text-[10px] text-stone-400">
                                    {savedChats.length} message(s) stored in real time
                                  </span>
                                </div>
                                {savedChats.length === 0 ? (
                                  <div className="text-stone-400 italic py-2">
                                    No saved Tessy Ai messages for this user yet.
                                  </div>
                                ) : (
                                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                    {savedChats.map((msg, idx) => (
                                      <div
                                        key={msg.id || idx}
                                        className={`p-2.5 rounded-xl border ${
                                          msg.role === 'user'
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-100 ml-6'
                                            : 'bg-stone-900 border-stone-800 text-stone-200 mr-6'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                                          <strong className={msg.role === 'user' ? 'text-amber-400' : 'text-emerald-400'}>
                                            {msg.role === 'user' ? c.name : 'Tessy Ai'}
                                          </strong>
                                          <span>{msg.timestamp}</span>
                                        </div>
                                        <div>
                                          {msg.role === 'user' ? (
                                            <div className="whitespace-pre-line">{msg.content}</div>
                                          ) : (
                                            renderFormattedTessyReply(msg.content)
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {c.notes && !isEditing && (
                              <div className="text-stone-400 italic">"{c.notes}"</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: PRODUCTS CATALOG (FULL EDIT, IMAGE CHANGE, DELETE, ADD) */}
              {activeTab === 'products' && db && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="text-xl font-serif font-bold text-white">Live HOS|TED Catalog Management</h4>
                      <p className="text-xs text-stone-400">
                        Add, edit every detail (including images, prices, descriptions, fabrics), or delete products on the live HOS|TED storefront.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowNewProductForm(!showNewProductForm)}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{showNewProductForm ? 'Close Form' : 'Add New Product'}</span>
                    </button>
                  </div>

                  {showNewProductForm && (
                    <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4 text-xs">
                      <h5 className="font-serif font-bold text-white text-sm">Add New Design to HOS|TED Storefront</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Design Name *"
                          value={newProductForm.name}
                          onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                        <input
                          type="number"
                          placeholder="Price in NGN (₦) (Leave 0 if bespoke)"
                          value={newProductForm.priceNgn}
                          onChange={(e) => setNewProductForm({ ...newProductForm, priceNgn: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                        <select
                          value={newProductForm.category}
                          onChange={(e) => {
                            const cat = e.target.value;
                            const labelMap: Record<string, string> = {
                              'materials': 'Materials',
                              'everyday': 'Everyday Wears',
                              'skirt_blouse': 'Skirt & Blouse',
                              'ankara_gowns': 'Ankara Gowns',
                              'bubu_gowns': 'Bubu Gowns',
                              'chic_casual': 'Chic Casual Outfits',
                              'bespoke': 'Bespoke Tailoring',
                            };
                            setNewProductForm({
                              ...newProductForm,
                              category: cat,
                              categoryLabel: labelMap[cat] || 'Materials',
                            });
                          }}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        >
                          <option value="materials">Materials (Fabrics & Textiles)</option>
                          <option value="everyday">Everyday Wears</option>
                          <option value="skirt_blouse">Skirt & Blouse</option>
                          <option value="ankara_gowns">Ankara Gowns</option>
                          <option value="bubu_gowns">Bubu Gowns</option>
                          <option value="chic_casual">Chic Casual Outfits</option>
                          <option value="bespoke">Bespoke Tailoring</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Fabric Description"
                          value={newProductForm.fabric}
                          onChange={(e) => setNewProductForm({ ...newProductForm, fabric: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                        <input
                          type="text"
                          placeholder="Lead Time (e.g. 5–7 Working Days)"
                          value={newProductForm.leadTime}
                          onChange={(e) => setNewProductForm({ ...newProductForm, leadTime: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                        <input
                          type="text"
                          placeholder="Image URL (or upload file below)"
                          value={newProductForm.imageUrl}
                          onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="px-3 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 cursor-pointer inline-flex items-center gap-1.5 font-semibold">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Upload Product Image from Device</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageFileUpload(file, (dataUrl) =>
                                  setNewProductForm((prev) => ({ ...prev, imageUrl: dataUrl }))
                                );
                              }
                            }}
                          />
                        </label>
                        {newProductForm.imageUrl && (
                          <img src={newProductForm.imageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-amber-400" />
                        )}
                      </div>

                      <textarea
                        placeholder="Design description..."
                        value={newProductForm.description}
                        onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                      />
                      <button
                        onClick={() => {
                          if (!newProductForm.name) return;
                          requestConfirmedAction(
                            'Add Product to Live HOS|TED Storefront',
                            `Publish "${newProductForm.name}" at ${formatNgn(Number(newProductForm.priceNgn || 0))}?`,
                            'ADD_PRODUCT',
                            newProductForm
                          );
                          setShowNewProductForm(false);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold"
                      >
                        Confirm & Publish
                      </button>
                    </div>
                  )}

                  {/* Full Product Cards with Edit All Fields & Delete */}
                  <div className="grid grid-cols-1 gap-4">
                    {db.products.map((p) => {
                      const isEditing = editingProductId === p.id;
                      return (
                        <div key={p.id} className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
                          {!isEditing ? (
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                              <div className="flex gap-4 items-center">
                                <img src={p.imageUrl} alt={p.name} className="w-20 h-24 rounded-xl object-cover shrink-0 border border-stone-800" />
                                <div className="text-xs space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-serif font-bold text-white text-base">{p.name}</span>
                                    <span className="px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800 text-[10px]">
                                      {p.categoryLabel}
                                    </span>
                                  </div>
                                  <div className="text-amber-400 font-bold font-mono text-sm">
                                    {p.priceNgn > 0 ? formatNgn(p.priceNgn) : '₦0 (Price on Request / Set in Admin)'}
                                  </div>
                                  <div className="text-stone-400 line-clamp-2 max-w-xl">{p.description}</div>
                                  <div className="text-stone-500">
                                    Fabric: {p.fabric} · Lead Time: {p.leadTime} · Stock: {p.stockCount ?? 0}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap shrink-0">
                                <button
                                  onClick={() => startEditingProduct(p)}
                                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit Product & Image</span>
                                </button>
                                <button
                                  onClick={() =>
                                    requestConfirmedAction(
                                      'Delete Product from Storefront',
                                      `Are you sure you want to permanently delete "${p.name}" (${p.id}) from the HOS|TED catalog?`,
                                      'DELETE_PRODUCT',
                                      { id: p.id }
                                    )
                                  }
                                  className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Full Product Editor Form */
                            <div className="space-y-4 text-xs">
                              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                                <h5 className="font-serif font-bold text-amber-400 text-sm">
                                  Editing Product: {p.name} ({p.id})
                                </h5>
                                <button
                                  onClick={() => setEditingProductId(null)}
                                  className="text-stone-400 hover:text-white text-xs"
                                >
                                  Cancel
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-stone-400 mb-1 font-semibold">Product Name</label>
                                  <input
                                    type="text"
                                    value={editProductForm.name || ''}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                                  />
                                </div>

                                <div>
                                  <label className="block text-stone-400 mb-1 font-semibold">Price in NGN (₦)</label>
                                  <input
                                    type="number"
                                    value={editProductForm.priceNgn ?? '0'}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, priceNgn: e.target.value })}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                                  />
                                </div>

                                <div>
                                  <label className="block text-stone-400 mb-1 font-semibold">Category</label>
                                  <select
                                    value={editProductForm.category || 'materials'}
                                    onChange={(e) => {
                                      const cat = e.target.value as any;
                                      const labelMap: Record<string, string> = {
                                        'materials': 'Materials',
                                        'everyday': 'Everyday Wears',
                                        'skirt_blouse': 'Skirt & Blouse',
                                        'ankara_gowns': 'Ankara Gowns',
                                        'bubu_gowns': 'Bubu Gowns',
                                        'chic_casual': 'Chic Casual Outfits',
                                        'bespoke': 'Bespoke Tailoring',
                                      };
                                      setEditProductForm({
                                        ...editProductForm,
                                        category: cat,
                                        categoryLabel: labelMap[cat] || editProductForm.categoryLabel,
                                      });
                                    }}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                                  >
                                    <option value="materials">Materials (Fabrics & Textiles)</option>
                                    <option value="everyday">Everyday Wears</option>
                                    <option value="skirt_blouse">Skirt & Blouse</option>
                                    <option value="ankara_gowns">Ankara Gowns</option>
                                    <option value="bubu_gowns">Bubu Gowns</option>
                                    <option value="chic_casual">Chic Casual Outfits</option>
                                    <option value="bespoke">Bespoke Tailoring</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-stone-400 mb-1 font-semibold">Fabric Details</label>
                                  <input
                                    type="text"
                                    value={editProductForm.fabric || ''}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, fabric: e.target.value })}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                                  />
                                </div>

                                <div>
                                  <label className="block text-stone-400 mb-1 font-semibold">Lead Time</label>
                                  <input
                                    type="text"
                                    value={editProductForm.leadTime || ''}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, leadTime: e.target.value })}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                                  />
                                </div>

                                <div>
                                  <label className="block text-stone-400 mb-1 font-semibold">Stock Count</label>
                                  <input
                                    type="number"
                                    value={editProductForm.stockCount ?? '0'}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, stockCount: e.target.value })}
                                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-stone-400 mb-1 font-semibold">Product Image URL or Upload New Image</label>
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                  <input
                                    type="text"
                                    value={editProductForm.imageUrl || ''}
                                    onChange={(e) => setEditProductForm({ ...editProductForm, imageUrl: e.target.value })}
                                    placeholder="Paste image URL or upload below..."
                                    className="flex-1 w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                                  />
                                  <label className="px-3.5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-amber-500/40 text-amber-300 cursor-pointer inline-flex items-center gap-1.5 font-semibold shrink-0">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload Image</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleImageFileUpload(file, (dataUrl) =>
                                            setEditProductForm((prev) => ({ ...prev, imageUrl: dataUrl }))
                                          );
                                        }
                                      }}
                                    />
                                  </label>
                                  {editProductForm.imageUrl && (
                                    <img
                                      src={editProductForm.imageUrl}
                                      alt="Preview"
                                      className="w-14 h-16 rounded-lg object-cover border border-amber-400 shrink-0"
                                    />
                                  )}
                                </div>
                              </div>

                              <div>
                                <label className="block text-stone-400 mb-1 font-semibold">Description</label>
                                <textarea
                                  rows={2}
                                  value={editProductForm.description || ''}
                                  onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                  onClick={() => setEditingProductId(null)}
                                  className="px-4 py-2 rounded-xl bg-stone-950 text-stone-400 hover:text-white"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => {
                                    requestConfirmedAction(
                                      'Save Product Changes',
                                      `Save all updated details and image for "${editProductForm.name}" on the live HOS|TED storefront?`,
                                      'UPDATE_PRODUCT',
                                      {
                                        id: p.id,
                                        ...editProductForm,
                                      }
                                    );
                                    setEditingProductId(null);
                                  }}
                                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold"
                                >
                                  Save All Product Changes
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 8: APPOINTMENTS & FITTINGS */}
              {activeTab === 'appointments' && db && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-serif font-bold text-white">Appointments & Fittings Schedule</h4>
                      <p className="text-xs text-stone-400">Manage client consultations, measurements, and fitting sessions.</p>
                    </div>
                    <button
                      onClick={() => setShowNewAptForm(!showNewAptForm)}
                      className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Schedule Fitting</span>
                    </button>
                  </div>

                  {showNewAptForm && (
                    <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <input
                        type="text"
                        placeholder="Client Name *"
                        value={newAptForm.clientName}
                        onChange={(e) => setNewAptForm({ ...newAptForm, clientName: e.target.value })}
                        className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                      />
                      <input
                        type="text"
                        placeholder="Client Phone *"
                        value={newAptForm.clientPhone}
                        onChange={(e) => setNewAptForm({ ...newAptForm, clientPhone: e.target.value })}
                        className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                      />
                      <input
                        type="date"
                        value={newAptForm.date}
                        onChange={(e) => setNewAptForm({ ...newAptForm, date: e.target.value })}
                        className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                      />
                      <button
                        onClick={() => {
                          if (!newAptForm.clientName) return;
                          requestConfirmedAction(
                            'Schedule HOS|TED Fitting Appointment',
                            `Book ${newAptForm.type} for ${newAptForm.clientName} on ${newAptForm.date || 'upcoming date'}?`,
                            'CREATE_APPOINTMENT',
                            newAptForm
                          );
                          setShowNewAptForm(false);
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold"
                      >
                        Confirm Booking
                      </button>
                    </div>
                  )}

                  {db.appointments.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
                      0 appointments scheduled yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {db.appointments.map((apt) => (
                        <div key={apt.id} className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {apt.id}
                              </span>
                              <span className="font-bold text-white text-sm">{apt.clientName} — {apt.type}</span>
                              {apt.clientPhone && (
                                <span className="text-stone-400">· {apt.clientPhone}</span>
                              )}
                            </div>
                            <div className="text-stone-300 mt-1">
                              <strong>Date & Time:</strong> {apt.date} at {apt.time} · <strong>Order Ref:</strong> {apt.orderId || 'N/A'}
                            </div>
                            {apt.notes && <div className="text-stone-400 italic mt-1">"{apt.notes}"</div>}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {apt.clientPhone && (
                              <a
                                href={`https://wa.me/${apt.clientPhone.replace(/[^0-9]/g, '').replace(/^0/, '234')}?text=${encodeURIComponent(`Hello ${apt.clientName}! This is HOS|TED (HOS|TED Hosting Nations) confirming your ${apt.type} appointment scheduled for ${apt.date} at ${apt.time}.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <select
                              value={apt.status}
                              onChange={(e) =>
                                requestConfirmedAction(
                                  'Update Appointment Status',
                                  `Mark appointment ${apt.id} (${apt.clientName} — ${apt.type}) as ${e.target.value}?`,
                                  'UPDATE_APPOINTMENT_STATUS',
                                  { appointmentId: apt.id, status: e.target.value }
                                )
                              }
                              className="bg-stone-950 border border-stone-800 text-white rounded-lg px-2.5 py-1.5 font-semibold"
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="Completed">Completed</option>
                              <option value="Rescheduled">Rescheduled</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                requestConfirmedAction(
                                  'Delete Appointment Record',
                                  `Are you sure you want to delete appointment ${apt.id} for ${apt.clientName} (${apt.type} on ${apt.date})?`,
                                  'DELETE_APPOINTMENT',
                                  { appointmentId: apt.id }
                                )
                              }
                              className="p-1.5 rounded-lg bg-stone-950 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-800"
                              title="Delete Appointment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 9: INVENTORY & STOCK */}
              {activeTab === 'inventory' && db && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-serif font-bold text-white">HOS|TED Fabric Vault & Inventory</h4>
                    <p className="text-xs text-stone-400">
                      Real-time fabric yardage, trims, corset boning, and branded packaging levels.
                    </p>
                  </div>

                  {db.inventory.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
                      0 inventory items recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {db.inventory.map((item) => {
                        const isLow = item.quantity <= item.reorderThreshold;
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                              isLow ? 'bg-rose-500/10 border-rose-500/40' : 'bg-stone-900 border-stone-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{item.name}</span>
                                <span className="font-mono text-stone-400">({item.sku})</span>
                                {isLow && (
                                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] uppercase">
                                    Low Stock
                                  </span>
                                )}
                              </div>
                              <div className="text-stone-400 mt-0.5">
                                Category: {item.category} · Reorder Threshold: {item.reorderThreshold} {item.unit}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-white">
                                {item.quantity} {item.unit}
                              </span>
                              <button
                                onClick={() =>
                                  requestConfirmedAction(
                                    'Restock Inventory Item',
                                    `Add +10 ${item.unit} to "${item.name}" (New total: ${item.quantity + 10} ${item.unit})?`,
                                    'UPDATE_INVENTORY',
                                    { itemId: item.id, quantity: item.quantity + 10 }
                                  )
                                }
                                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold"
                              >
                                +10 Restock
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 10: TASKS & NOTIFICATIONS */}
              {activeTab === 'tasks' && db && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Tasks */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-serif font-bold text-white">Atelier Tasks</h4>
                    <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 text-xs">
                      <input
                        type="text"
                        placeholder="New task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value as any)}
                          className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white"
                        >
                          <option value="High">High Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="Low">Low Priority</option>
                        </select>
                        <button
                          onClick={() => {
                            if (!newTaskTitle.trim()) return;
                            requestConfirmedAction(
                              'Create Atelier Task',
                              `Create ${newTaskPriority} priority task: "${newTaskTitle}"?`,
                              'CREATE_TASK',
                              { title: newTaskTitle, priority: newTaskPriority, assignee: newTaskAssignee }
                            );
                            setNewTaskTitle('');
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold"
                        >
                          Add Task
                        </button>
                      </div>
                    </div>

                    {db.tasks.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
                        0 tasks created yet.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {db.tasks.map((t) => (
                          <div key={t.id} className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-2 text-xs">
                            <div>
                              <div className={`font-bold text-sm ${t.status === 'Done' ? 'line-through text-stone-500' : 'text-white'}`}>
                                {t.title}
                              </div>
                              <div className="text-stone-400">{t.priority} Priority · {t.assignee} · Due {t.dueDate}</div>
                            </div>
                            {t.status !== 'Done' && (
                              <button
                                onClick={() =>
                                  requestConfirmedAction(
                                    'Complete Task',
                                    `Mark task "${t.title}" as Done?`,
                                    'COMPLETE_TASK',
                                    { taskId: t.id, status: 'Done' }
                                  )
                                }
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold"
                              >
                                Mark Done
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notifications */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-serif font-bold text-white">Real-Time Alerts</h4>
                      {db.notifications.length > 0 && (
                        <button
                          onClick={() =>
                            requestConfirmedAction(
                              'Mark Notifications Read',
                              'Mark all current alerts as read?',
                              'MARK_NOTIFICATIONS_READ',
                              {}
                            )
                          }
                          className="text-xs text-amber-400 font-semibold hover:underline"
                        >
                          Mark All Read
                        </button>
                      )}
                    </div>
                    {db.notifications.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
                        0 notifications right now.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {db.notifications.map((n) => (
                          <div key={n.id} className={`p-4 rounded-2xl border text-xs ${n.read ? 'bg-stone-950 border-stone-800' : 'bg-stone-900 border-amber-500/40'}`}>
                            <div className="font-bold text-white">{n.title}</div>
                            <div className="text-stone-300 mt-0.5">{n.message}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 11: LIVE ANALYTICS (100% Real Computed Data) */}
              {activeTab === 'analytics' && db && metrics && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-serif font-bold text-white">HOS|TED Live Financial & Operational Analytics</h4>
                    <p className="text-xs text-stone-400">
                      100% computed from real orders, verified payments, and inventory records—zero fictional figures.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800">
                      <div className="text-xs text-stone-400 uppercase font-bold">Verified Revenue Received</div>
                      <div className="text-2xl font-serif font-bold text-emerald-400 mt-1">
                        {formatNgn(metrics.verifiedRevenueNgn)}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1">From verified payments</div>
                    </div>

                    <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800">
                      <div className="text-xs text-stone-400 uppercase font-bold">Payments Pending Review</div>
                      <div className="text-2xl font-serif font-bold text-amber-400 mt-1">
                        {formatNgn(metrics.pendingReviewAmountNgn)}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1">{metrics.pendingPaymentsCount} payment(s) awaiting confirmation</div>
                    </div>

                    <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800">
                      <div className="text-xs text-stone-400 uppercase font-bold">Outstanding Order Balances</div>
                      <div className="text-2xl font-serif font-bold text-white mt-1">
                        {formatNgn(metrics.outstandingBalanceNgn)}
                      </div>
                      <div className="text-[11px] text-stone-400 mt-1">Due upon fitting / delivery</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 12: MARKETING */}
              {activeTab === 'marketing' && db && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-serif font-bold text-white">HOS|TED — Hosting Nations Marketing Hub</h4>
                    <p className="text-xs text-stone-400">
                      Launch WhatsApp broadcasts and VIP client outreach with consistent HOS|TED branding.
                    </p>
                  </div>
                  {db.campaigns.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
                      0 campaigns created yet. Instruct Tessy Ai to draft a new HOS|TED WhatsApp broadcast!
                    </div>
                  ) : (
                    db.campaigns.map((c) => (
                      <div key={c.id} className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 text-xs">
                        <div className="font-serif font-bold text-white text-base">{c.name}</div>
                        <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-200">
                          {c.messageTemplate}
                        </div>
                        <a
                          href={`https://wa.me/2349073784461?text=${encodeURIComponent(c.messageTemplate)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Share HOS|TED Broadcast on WhatsApp</span>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 13: WEBSITE & ABOUT THE FOUNDER MANAGEMENT CONTROLS */}
              {activeTab === 'website' && db && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-serif font-bold text-white">
                      HOS|TED Website Design & "About the Founder" Controls
                    </h4>
                    <p className="text-xs text-stone-400">
                      Edit the entire customer-facing HOS|TED website—including theme colors, hero text, nationwide delivery banner, and the exclusive "About the Founder" section for Theresa Isama.
                    </p>
                  </div>

                  {/* Storefront Design & Copy Controls */}
                  <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4 text-xs">
                    <h5 className="font-serif font-bold text-amber-400 text-base border-b border-stone-800 pb-2">
                      1. Storefront Hero, Slogan & Theme Settings
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-stone-300 mb-1">Brand Slogan</label>
                        <input
                          type="text"
                          value={websiteForm.slogan}
                          onChange={(e) => setWebsiteForm({ ...websiteForm, slogan: e.target.value })}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-300 mb-1">Storefront Theme Mode</label>
                        <select
                          value={websiteForm.themeColor}
                          onChange={(e) => setWebsiteForm({ ...websiteForm, themeColor: e.target.value as any })}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        >
                          <option value="obsidian">Signature Dark Obsidian & Gold (Default)</option>
                          <option value="midnight">Midnight Royal Indigo & Gold</option>
                          <option value="espresso">Rich Espresso & Gold</option>
                          <option value="emerald">Royal Emerald Velvet & Gold</option>
                          <option value="burgundy">Imperial Burgundy & Gold</option>
                          <option value="cream">Warm Cream & Espresso</option>
                          <option value="custom">Custom Theme Colors (Pick Any Colors)</option>
                        </select>
                      </div>
                    </div>

                    {websiteForm.themeColor === 'custom' && (
                      <div className="p-4 rounded-xl bg-stone-950 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-amber-300 mb-1">
                            Custom Background Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={websiteForm.customThemeBg || '#0E0A08'}
                              onChange={(e) =>
                                setWebsiteForm({ ...websiteForm, customThemeBg: e.target.value })
                              }
                              className="w-10 h-9 rounded-lg border border-stone-700 bg-stone-900 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={websiteForm.customThemeBg || '#0E0A08'}
                              onChange={(e) =>
                                setWebsiteForm({ ...websiteForm, customThemeBg: e.target.value })
                              }
                              placeholder="#0E0A08"
                              className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-2 text-white font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-amber-300 mb-1">
                            Custom Text Color
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={websiteForm.customThemeText || '#F5F5F4'}
                              onChange={(e) =>
                                setWebsiteForm({ ...websiteForm, customThemeText: e.target.value })
                              }
                              className="w-10 h-9 rounded-lg border border-stone-700 bg-stone-900 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={websiteForm.customThemeText || '#F5F5F4'}
                              onChange={(e) =>
                                setWebsiteForm({ ...websiteForm, customThemeText: e.target.value })
                              }
                              placeholder="#F5F5F4"
                              className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-2 text-white font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-amber-300 mb-1">
                            Quick Custom Presets
                          </label>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {[
                              { label: 'Deep Plum', bg: '#1A0B24', text: '#F5F5F4' },
                              { label: 'Navy Luxe', bg: '#071324', text: '#F8FAFC' },
                              { label: 'Forest Gold', bg: '#071C15', text: '#ECFDF5' },
                              { label: 'Soft Champagne', bg: '#F7F2E7', text: '#1C1917' },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() =>
                                  setWebsiteForm({
                                    ...websiteForm,
                                    customThemeBg: preset.bg,
                                    customThemeText: preset.text,
                                  })
                                }
                                className="px-2 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[10px] font-semibold text-stone-200"
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-stone-300 mb-1">Top Announcement Banner Text</label>
                      <input
                        type="text"
                        value={websiteForm.announcementText}
                        onChange={(e) => setWebsiteForm({ ...websiteForm, announcementText: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-stone-300 mb-1">Hero Main Headline</label>
                        <input
                          type="text"
                          value={websiteForm.heroTitle}
                          onChange={(e) => setWebsiteForm({ ...websiteForm, heroTitle: e.target.value })}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-300 mb-1">Standard Turnaround Lead Time</label>
                        <input
                          type="text"
                          value={websiteForm.standardLeadTime}
                          onChange={(e) => setWebsiteForm({ ...websiteForm, standardLeadTime: e.target.value })}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-300 mb-1">Hero Subtitle Description</label>
                      <textarea
                        rows={2}
                        value={websiteForm.heroSubtitle}
                        onChange={(e) => setWebsiteForm({ ...websiteForm, heroSubtitle: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-300 mb-1">Nationwide Delivery Policy Note</label>
                      <input
                        type="text"
                        value={websiteForm.nationwideDeliveryText}
                        onChange={(e) => setWebsiteForm({ ...websiteForm, nationwideDeliveryText: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                      />
                    </div>
                  </div>

                  {/* About the Founder Section (Only Editable from Admin Dashboard) */}
                  <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4 text-xs">
                    <h5 className="font-serif font-bold text-amber-400 text-base border-b border-stone-800 pb-2">
                      2. "About the Founder" Section (Storefront Exclusive Editor)
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-stone-300 mb-1">Founder Full Name</label>
                        <input
                          type="text"
                          value={websiteForm.founderName}
                          onChange={(e) => setWebsiteForm({ ...websiteForm, founderName: e.target.value })}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-300 mb-1">Founder Role / Title</label>
                        <input
                          type="text"
                          value={websiteForm.founderRole}
                          onChange={(e) => setWebsiteForm({ ...websiteForm, founderRole: e.target.value })}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-300 mb-1.5">
                        Founder Portrait Picture — Choose Any Picture of Your Choice (Locked Permanently)
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <img
                          src={websiteForm.founderImageUrl || getSavedFounderImage() || ASSETS.tessyAvatar}
                          alt="Founder Preview"
                          className="w-16 h-20 rounded-xl object-cover border-2 border-amber-400 shrink-0 shadow"
                        />
                        <div className="flex-1 w-full space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 cursor-pointer inline-flex items-center gap-1.5 font-bold shrink-0 shadow">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Any Picture from Device</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageFileUpload(file, (dataUrl) => {
                                      applyFounderImageChoice(dataUrl, true);
                                    });
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => applyFounderImageChoice(websiteForm.founderImageUrl, true)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold shrink-0"
                            >
                              Save & Lock Selected Picture
                            </button>
                            <button
                              type="button"
                              onClick={() => applyFounderImageChoice(ASSETS.tessyAvatar, true)}
                              className="px-3 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 font-semibold shrink-0"
                            >
                              Use Default Portrait
                            </button>
                          </div>
                          <input
                            type="text"
                            value={websiteForm.founderImageUrl}
                            onChange={(e) => setWebsiteForm({ ...websiteForm, founderImageUrl: e.target.value })}
                            placeholder="Or paste any image URL here and click Save & Lock Selected Picture..."
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-white"
                          />
                          {/* Quick Preset Gallery Choice */}
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">
                              Or Pick From Atelier Portraits:
                            </span>
                            {[
                              { label: 'Founder Portrait 1', url: ASSETS.tessyAvatar },
                              { label: 'Royal Gold Portrait', url: ASSETS.bubuGold },
                              { label: 'Ankara Couture', url: ASSETS.ankaraGown },
                              { label: 'Executive Peplum', url: ASSETS.skirtBlouse },
                              { label: 'Atelier Director', url: ASSETS.atelierStudio },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => applyFounderImageChoice(preset.url, true)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-semibold transition ${
                                  websiteForm.founderImageUrl === preset.url
                                    ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                                    : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                                }`}
                              >
                                <img src={preset.url} alt={preset.label} className="w-5 h-5 rounded object-cover" />
                                <span>{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-300 mb-1">Founder Signature Quote</label>
                      <input
                        type="text"
                        value={websiteForm.founderQuote}
                        onChange={(e) => setWebsiteForm({ ...websiteForm, founderQuote: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-300 mb-1">Founder Biography — Paragraph 1</label>
                      <textarea
                        rows={3}
                        value={websiteForm.founderBioParagraph1}
                        onChange={(e) => setWebsiteForm({ ...websiteForm, founderBioParagraph1: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-300 mb-1">Founder Biography — Paragraph 2</label>
                      <textarea
                        rows={3}
                        value={websiteForm.founderBioParagraph2}
                        onChange={(e) => setWebsiteForm({ ...websiteForm, founderBioParagraph2: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                      />
                    </div>

                    <div className="pt-4 border-t border-stone-800 space-y-4">
                      <h5 className="font-serif font-bold text-amber-400 text-base">
                        3. Order Checkout Payment Details (Displayed When Order Button Is Clicked)
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-bold text-stone-300 mb-1">Bank / Payment Channel</label>
                          <input
                            type="text"
                            value={websiteForm.paymentBankName}
                            onChange={(e) => setWebsiteForm({ ...websiteForm, paymentBankName: e.target.value })}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-stone-300 mb-1">Account Name</label>
                          <input
                            type="text"
                            value={websiteForm.paymentAccountName}
                            onChange={(e) => setWebsiteForm({ ...websiteForm, paymentAccountName: e.target.value })}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-stone-300 mb-1">Account Number</label>
                          <input
                            type="text"
                            value={websiteForm.paymentAccountNumber}
                            onChange={(e) => setWebsiteForm({ ...websiteForm, paymentAccountNumber: e.target.value })}
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-stone-300 mb-1">Payment Instructions Note</label>
                        <textarea
                          rows={2}
                          value={websiteForm.paymentInstructions}
                          onChange={(e) => setWebsiteForm({ ...websiteForm, paymentInstructions: e.target.value })}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        requestConfirmedAction(
                          'Publish Website & Founder Section Updates',
                          'Publish updated storefront design, hero text, nationwide delivery note, and About the Founder section to the live HOS|TED website?',
                          'UPDATE_WEBSITE_SETTINGS',
                          websiteForm
                        )
                      }
                      className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold uppercase tracking-wider"
                    >
                      Confirm & Publish All Website Changes
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 14: AI SYSTEM IMPROVEMENT WORKFLOW (Phase 7) */}
              {activeTab === 'improvements' && db && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-serif font-bold text-white">
                      AI-Assisted HOS|TED System Improvement Workflow
                    </h4>
                    <p className="text-xs text-stone-400">
                      Actionable recommendations generated by Tessy Ai based on your live store data. Review and confirm before applying.
                    </p>
                  </div>

                  {db.improvements.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
                      0 pending system improvements right now. Instruct Tessy Ai to propose a website or operational improvement!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {db.improvements.map((imp) => (
                        <div key={imp.id} className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px]">
                                {imp.category}
                              </span>
                              <h5 className="font-serif font-bold text-white text-base">{imp.title}</h5>
                            </div>
                            <span className="font-bold text-emerald-400">{imp.status}</span>
                          </div>
                          <p className="text-stone-300"><strong>Rationale:</strong> {imp.rationale}</p>
                          <p className="text-stone-200"><strong>Proposed Action:</strong> {imp.suggestedChange}</p>

                          {imp.status === 'Proposed' && (
                            <button
                              onClick={() =>
                                requestConfirmedAction(
                                  'Apply AI System Improvement',
                                  `Apply improvement "${imp.title}": ${imp.suggestedChange}?`,
                                  'APPLY_IMPROVEMENT',
                                  { improvementId: imp.id }
                                )
                              }
                              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold"
                            >
                              Review & Apply Improvement
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 15: SECURITY, ADMIN CREDENTIALS & AUDIT LOGS (Phase 8) */}
              {activeTab === 'security' && db && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="text-xl font-serif font-bold text-white">
                        HOS|TED Admin Security, Credentials & Audit Logs
                      </h4>
                      <p className="text-xs text-stone-400">
                        Change your private Admin Email & Password anytime here (or with Tessy Ai), and review verified audit logs.
                      </p>
                    </div>
                    <button
                      onClick={handleExitDashboard}
                      className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Exit Admin Dashboard</span>
                    </button>
                  </div>

                  {/* Change Admin Email & Password Form */}
                  <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4 text-xs">
                    <h5 className="font-serif font-bold text-amber-400 text-base">
                      Change Admin Dashboard Email & Password
                    </h5>
                    <p className="text-stone-400">
                      Your admin password is kept strictly confidential and is never displayed publicly. You can update your login email and password below:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-stone-300 mb-1">Admin Email Address</label>
                        <input
                          type="email"
                          value={credentialsForm.newEmail}
                          onChange={(e) => setCredentialsForm({ ...credentialsForm, newEmail: e.target.value })}
                          placeholder="Enter new admin email"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-300 mb-1">New Admin Password</label>
                        <input
                          type="password"
                          value={credentialsForm.newPassword}
                          onChange={(e) => setCredentialsForm({ ...credentialsForm, newPassword: e.target.value })}
                          placeholder="Enter new password"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-300 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={credentialsForm.confirmPassword}
                          onChange={(e) => setCredentialsForm({ ...credentialsForm, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!credentialsForm.newEmail.trim() && !credentialsForm.newPassword.trim()) {
                          showBanner('error', 'Please enter a new email or a new password to update.');
                          return;
                        }
                        if (
                          credentialsForm.newPassword &&
                          credentialsForm.newPassword !== credentialsForm.confirmPassword
                        ) {
                          showBanner('error', 'New password and confirmation password do not match.');
                          return;
                        }
                        requestConfirmedAction(
                          'Update Admin Login Credentials',
                          `Update your private HOS|TED Admin credentials${credentialsForm.newEmail ? ` (Email: ${credentialsForm.newEmail})` : ''}${credentialsForm.newPassword ? ' and set your new password' : ''}?`,
                          'UPDATE_ADMIN_CREDENTIALS',
                          {
                            newEmail: credentialsForm.newEmail,
                            newPassword: credentialsForm.newPassword,
                          }
                        );
                        setCredentialsForm((prev) => ({
                          ...prev,
                          newPassword: '',
                          confirmPassword: '',
                        }));
                      }}
                      className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold uppercase tracking-wider"
                    >
                      Confirm & Update Admin Credentials
                    </button>
                  </div>

                  {/* Grant & Manage Admin Portal Access for Specific Email Addresses */}
                  <div className="p-6 rounded-2xl bg-stone-900 border border-amber-500/40 space-y-4 text-xs">
                    <div>
                      <h5 className="font-serif font-bold text-amber-400 text-base">
                        Grant & Manage Admin Portal Access by Email Address
                      </h5>
                      <p className="text-stone-400 mt-0.5">
                        Authorize specific email addresses to unlock and access the HOS|TED Admin Portal alongside the Founder & Owner (<strong>isamatheresa12@gmail.com</strong>) and Platform Creator (<strong>isamavictoriaene19@gmail.com</strong>).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block font-bold text-stone-300 mb-1">
                          Email Address to Grant Portal Access *
                        </label>
                        <input
                          type="email"
                          value={newPortalEmail}
                          onChange={(e) => setNewPortalEmail(e.target.value)}
                          placeholder="e.g. staff@hosted.com"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-300 mb-1">
                          Portal Role / Access Level
                        </label>
                        <select
                          value={newPortalRoleLabel}
                          onChange={(e) => setNewPortalRoleLabel(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                        >
                          <option value="Authorized Portal Admin">Authorized Portal Admin (Full Access)</option>
                          <option value="Executive Manager">Executive Manager</option>
                          <option value="Head Tailor">Head Tailor</option>
                          <option value="Client Concierge">Client Concierge</option>
                        </select>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            const clean = newPortalEmail.trim().toLowerCase();
                            if (!clean || !clean.includes('@')) {
                              showBanner('error', 'Please enter a valid email address to grant portal access.');
                              return;
                            }
                            requestConfirmedAction(
                              'Grant Admin Portal Access',
                              `Grant HOS|TED Admin Portal access to "${clean}" with role "${newPortalRoleLabel}"?`,
                              'GRANT_ADMIN_PORTAL_ACCESS',
                              {
                                email: clean,
                                roleLabel: newPortalRoleLabel,
                              }
                            );
                            setNewPortalEmail('');
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Grant Portal Access</span>
                        </button>
                      </div>
                    </div>

                    {/* List of Authorized Admin Portal Emails */}
                    <div className="space-y-2 pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        Currently Authorized Portal Email Addresses ({(db.authorizedAdminEmails || []).length})
                      </div>
                      <div className="space-y-2">
                        {(db.authorizedAdminEmails || []).map((entry) => {
                          const isProtectedCore =
                            entry.isProtected ||
                            entry.email.toLowerCase() === 'isamatheresa12@gmail.com' ||
                            entry.email.toLowerCase() === 'isamavictoriaene19@gmail.com';
                          return (
                            <div
                              key={entry.email}
                              className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  {entry.facialPhotoUrl ? (
                                    <img
                                      src={entry.facialPhotoUrl}
                                      alt={entry.email}
                                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-400 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-amber-400 shrink-0">
                                      <ScanFace className="w-6 h-6" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono font-bold text-white text-sm">
                                        {entry.email}
                                      </span>
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                          entry.email.toLowerCase() === 'isamatheresa12@gmail.com'
                                            ? 'bg-amber-400 text-stone-950'
                                            : entry.email.toLowerCase() === 'isamavictoriaene19@gmail.com'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                            : 'bg-stone-800 text-amber-300 border border-amber-500/30'
                                        }`}
                                      >
                                        {entry.roleLabel}
                                      </span>
                                      {entry.facialPhotoUrl && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                          Facial ID Enrolled ✓
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-stone-500 mt-0.5">
                                      Added by {entry.addedBy || 'Admin'} ·{' '}
                                      {entry.addedAt ? new Date(entry.addedAt).toLocaleDateString() : 'Active'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (editingAdminEmailFacial === entry.email) {
                                        setEditingAdminEmailFacial(null);
                                      } else {
                                        setEditingAdminEmailFacial(entry.email);
                                        setAdminEmailFacialTemp(entry.facialPhotoUrl || '');
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5"
                                  >
                                    <ScanFace className="w-3.5 h-3.5" />
                                    <span>{entry.facialPhotoUrl ? 'Update Face ID' : 'Enroll Face ID'}</span>
                                  </button>

                                  {isProtectedCore ? (
                                    <span className="px-3 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 text-[11px] font-semibold">
                                      Permanent Core Access 🔒
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        requestConfirmedAction(
                                          'Revoke Admin Portal Access',
                                          `Are you sure you want to revoke HOS|TED Admin Portal access for "${entry.email}"?`,
                                          'REVOKE_ADMIN_PORTAL_ACCESS',
                                          { email: entry.email }
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-bold text-xs flex items-center gap-1 transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Revoke Access</span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {editingAdminEmailFacial === entry.email && (
                                <div className="pt-2 border-t border-stone-800 space-y-2">
                                  <FacialRecognitionCapture
                                    photoUrl={adminEmailFacialTemp}
                                    onChangePhoto={setAdminEmailFacialTemp}
                                    compact
                                    label={`Admin Portal Facial Recognition for ${entry.email}`}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingAdminEmailFacial(null)}
                                      className="px-3 py-1.5 rounded-lg bg-stone-900 text-stone-400 text-xs"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        requestConfirmedAction(
                                          'Save Admin Facial Recognition Photo',
                                          `Save updated Facial Recognition photo for authorized admin "${entry.email}"?`,
                                          'UPDATE_FACIAL_RECOGNITION',
                                          {
                                            targetType: 'admin_email',
                                            email: entry.email,
                                            facialPhotoUrl: adminEmailFacialTemp,
                                          }
                                        );
                                        setEditingAdminEmailFacial(null);
                                      }}
                                      className="px-4 py-1.5 rounded-lg bg-amber-400 text-stone-950 font-bold text-xs"
                                    >
                                      Confirm & Save Admin Face ID
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Audit Logs */}
                  <div className="space-y-2.5">
                    <h5 className="font-serif font-bold text-white text-sm">Verified Action Audit Trail</h5>
                    {db.auditLogs.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 text-center text-xs text-stone-400">
                        0 audit log entries recorded yet.
                      </div>
                    ) : (
                      db.auditLogs.map((log) => (
                        <div key={log.id} className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-amber-400 mr-2">[{log.action}]</span>
                            <span className="font-semibold text-white">{log.details}</span>
                            <div className="text-[11px] text-stone-400 mt-0.5">
                              Actor: {log.actor} ({log.role}) · Target: {log.target}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-emerald-400 font-bold block">✓ Verified</span>
                            <span className="text-[10px] text-stone-500">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              </div>
            </main>
          </div>
        )}

        {/* Non-Destructive Action Confirmation Modal Gate */}
        {pendingConfirmation && (
          <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-stone-900 border-2 border-amber-500 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2.5 text-amber-400">
                <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
                <h4 className="font-serif font-bold text-lg text-white">
                  {pendingConfirmation.title}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                {pendingConfirmation.summary}
              </p>
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-400">
                Confirmation Gate: Once you click <strong>Confirm &amp; Implement Immediately</strong> below, this change will be applied right away across both the live <strong>HOS|TED</strong> frontend webpage and backend database.
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setPendingConfirmation(null)}
                  className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedAction}
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider shadow"
                >
                  {isLoading ? 'Applying Live...' : 'Confirm & Implement Immediately'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
