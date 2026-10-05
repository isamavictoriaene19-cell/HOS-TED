import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Ruler,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  Send,
  Info,
  Truck,
  CreditCard,
  Copy,
  Check,
  Plus,
  Minus,
  RefreshCw,
  Clock,
  Palette,
  ShoppingBag,
  Image as ImageIcon,
  Calendar,
  ShieldCheck,
  X,
  Edit3,
  Upload,
  RotateCcw,
  FileText,
  ChevronDown,
  ChevronRight,
  UserCheck,
  ScanFace,
  Layers,
} from 'lucide-react';
import {
  MeasurementFormData,
  WebsiteSettings,
  ProductItem,
  InquiryRecord,
  AppointmentRecord,
  CustomAttachmentFile,
  CustomStyleEditRecord,
} from '../types';
import {
  FacialRecognitionCapture,
  CustomFilesAttachmentBox,
} from './FacialRecognitionCapture';
import {
  NIGERIAN_STATES,
  ASSETS,
  LAYMAN_SIZE_GUIDE,
  LAYMAN_COLOR_GUIDE,
  findLaymanSizeOption,
  findLaymanColorOption,
} from '../constants/assets';
import {
  sendWhatsAppWithDirectOrderImage,
  copyRealOrderImageToClipboard,
} from '../utils/whatsappImageShare';

interface BespokeTailoringSectionProps {
  onOpenTessyWithGuide: () => void;
  preselectedCategory?: string;
  onOrderSubmitted?: () => void;
  settings?: WebsiteSettings;
  products?: ProductItem[];
  customStyleEdits?: Record<string, CustomStyleEditRecord>;
}

const LOCAL_ORDERS_STORAGE_KEY = 'hosted_customer_order_ids';
const LOCAL_BESPOKE_DRAFT_KEY = 'hosted_permanent_bespoke_draft_v1';

export const BespokeTailoringSection: React.FC<BespokeTailoringSectionProps> = ({
  onOpenTessyWithGuide,
  preselectedCategory = 'Ankara Gown',
  onOrderSubmitted,
  settings,
  products = [],
  customStyleEdits = {},
}) => {
  const savedDraft = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(LOCAL_BESPOKE_DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [formData, setFormData] = useState<MeasurementFormData>(() => ({
    fullName: savedDraft?.formData?.fullName || localStorage.getItem('hosted_recognized_name') || '',
    phone: savedDraft?.formData?.phone || localStorage.getItem('hosted_saved_phone') || '',
    email: savedDraft?.formData?.email || localStorage.getItem('hosted_recognized_email') || '',
    styleCategory: savedDraft?.formData?.styleCategory || preselectedCategory,
    fabricPreference: savedDraft?.formData?.fabricPreference || 'atelier_ankara',
    bust: savedDraft?.formData?.bust || '',
    waist: savedDraft?.formData?.waist || '',
    hips: savedDraft?.formData?.hips || '',
    shoulder: savedDraft?.formData?.shoulder || '',
    dressLength: savedDraft?.formData?.dressLength || '',
    sleeveLength: savedDraft?.formData?.sleeveLength || '',
    armhole: savedDraft?.formData?.armhole || '',
    preferredDate: savedDraft?.formData?.preferredDate || '',
    specialInstructions: savedDraft?.formData?.specialInstructions || '',
    deliveryState: savedDraft?.formData?.deliveryState || 'Lagos',
    deliveryCity: savedDraft?.formData?.deliveryCity || '',
    deliveryAddress: savedDraft?.formData?.deliveryAddress || '',
    deliveryMethod: savedDraft?.formData?.deliveryMethod || 'Doorstep Courier',
  }));

  // Size, Color, and Number of Items before payment takes place
  const [selectedSize, setSelectedSize] = useState<string>(
    savedDraft?.selectedSize || 'Bespoke Custom Fit'
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    savedDraft?.selectedColor || 'Royal Gold & Ankara Multi'
  );
  const [itemQuantity, setItemQuantity] = useState<number>(savedDraft?.itemQuantity || 1);

  useEffect(() => {
    if (preselectedCategory) {
      setFormData((prev) => ({ ...prev, styleCategory: preselectedCategory }));
    }
  }, [preselectedCategory]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBespokeOrder, setCreatedBespokeOrder] = useState<InquiryRecord | null>(null);
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [validationNotice, setValidationNotice] = useState('');
  const [activeMeasurementTooltip, setActiveMeasurementTooltip] = useState<string | null>(null);
  const [whatsappImageNotice, setWhatsappImageNotice] = useState('');
  const [copiedOutfitPhoto, setCopiedOutfitPhoto] = useState(false);
  const [isSendingWhatsAppImage, setIsSendingWhatsAppImage] = useState(false);

  // Studio Tab: Custom Bespoke Tailoring & Measurements vs Book Atelier Appointment
  const [studioTab, setStudioTab] = useState<'tailoring' | 'appointment'>('tailoring');

  // Clickable Menu Outlets State for Custom Bespoke Tailoring & Measurements (Outlets 1..6) and Appointments (Outlets 1..3)
  const [activeTailoringOutlet, setActiveTailoringOutlet] = useState<number | null>(1);
  const [expandAllTailoringOutlets, setExpandAllTailoringOutlets] = useState<boolean>(false);
  const [activeAptOutlet, setActiveAptOutlet] = useState<number | null>(1);
  const [expandAllAptOutlets, setExpandAllAptOutlets] = useState<boolean>(false);

  const isTailoringOutletOpen = (outletId: number) =>
    expandAllTailoringOutlets || activeTailoringOutlet === outletId;

  const toggleTailoringOutlet = (outletId: number) => {
    if (expandAllTailoringOutlets) {
      setExpandAllTailoringOutlets(false);
      setActiveTailoringOutlet(outletId);
      return;
    }
    setActiveTailoringOutlet((prev) => (prev === outletId ? null : outletId));
  };

  const isAptOutletOpen = (outletId: number) =>
    expandAllAptOutlets || activeAptOutlet === outletId;

  const toggleAptOutlet = (outletId: number) => {
    if (expandAllAptOutlets) {
      setExpandAllAptOutlets(false);
      setActiveAptOutlet(outletId);
      return;
    }
    setActiveAptOutlet((prev) => (prev === outletId ? null : outletId));
  };

  // Custom Bespoke Tailoring & Measurement File Attachments + Facial Recognition Photo
  const [customAttachments, setCustomAttachments] = useState<CustomAttachmentFile[]>(
    () => savedDraft?.customAttachments || []
  );
  const [clientFacialPhotoUrl, setClientFacialPhotoUrl] = useState<string>(
    () => savedDraft?.clientFacialPhotoUrl || ''
  );

  // Editable Style Details/Description & Reference Image Styling (when client wants to customize or not use the style provided)
  const [isCustomStyleOverride, setIsCustomStyleOverride] = useState<boolean>(
    () => Boolean(savedDraft?.isCustomStyleOverride)
  );
  const [customStyleName, setCustomStyleName] = useState<string>(
    () => savedDraft?.customStyleName || ''
  );
  const [customStyleDescription, setCustomStyleDescription] = useState<string>(
    () => savedDraft?.customStyleDescription || ''
  );
  const [customReferenceImageUrl, setCustomReferenceImageUrl] = useState<string>(
    () => savedDraft?.customReferenceImageUrl || ''
  );
  const [referenceImageNotes, setReferenceImageNotes] = useState<string>(
    () => savedDraft?.referenceImageNotes || ''
  );
  const [showImageEditorPanel, setShowImageEditorPanel] = useState<boolean>(false);
  const [referenceUrlInput, setReferenceUrlInput] = useState<string>('');
  const [showPermanentStyleConfirm, setShowPermanentStyleConfirm] = useState<boolean>(false);
  const [isSavingPermanentStyle, setIsSavingPermanentStyle] = useState<boolean>(false);
  const [permanentStyleSavedNotice, setPermanentStyleSavedNotice] = useState<string>('');
  const referenceImageFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Client Confirmation Gate before submitting Bespoke Tailoring & Measurements
  const [showTailoringConfirmModal, setShowTailoringConfirmModal] = useState(false);

  // Client Appointment Booking State & Confirmation Gate
  const [aptForm, setAptForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    type: 'Measurement Taking' as AppointmentRecord['type'],
    date: '',
    time: '11:00 AM',
    notes: '',
  });
  const [showAptConfirmModal, setShowAptConfirmModal] = useState(false);
  const [isSubmittingApt, setIsSubmittingApt] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<AppointmentRecord | null>(null);
  const [aptValidationNotice, setAptValidationNotice] = useState('');

  const bankName = settings?.paymentBankName || 'OPay / Moniepoint / Direct Bank Transfer';
  const accountName = settings?.paymentAccountName || 'Theresa Isama (HOS|TED)';
  const accountNumber = settings?.paymentAccountNumber || '9073784461';
  const paymentInstructions =
    settings?.paymentInstructions ||
    'Transfer the total order amount for your selected items, then click "Request Order Status on WhatsApp" below to send your order details and specific outfit image for instant HOS|TED payment confirmation.';
  const whatsappClean = (settings?.whatsappNumber || '09073784461')
    .replace(/[^0-9]/g, '')
    .replace(/^0/, '234');

  const formatNgn = (val: number = 0) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(val);

  // Pick a matching outfit image and base price for the selected bespoke style
  const getMatchedProductForStyle = () => {
    const lower = formData.styleCategory.toLowerCase();
    const matched = products.find(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        lower.includes(p.name.toLowerCase()) ||
        (lower.includes('bubu') && p.category === 'bubu_gowns') ||
        (lower.includes('skirt') && p.category === 'skirt_and_blouse') ||
        (lower.includes('casual') && p.category === 'chic_casual') ||
        (lower.includes('everyday') && p.category === 'everyday_wear') ||
        (lower.includes('ankara') && p.category === 'ankara_gowns')
    );
    const savedCategoryEdit =
      customStyleEdits?.[formData.styleCategory] ||
      (matched?.id ? customStyleEdits?.[matched.id] : undefined);

    return {
      productId: matched?.id || 'bespoke-custom',
      productName:
        savedCategoryEdit?.customStyleName ||
        matched?.name ||
        `Bespoke ${formData.styleCategory}`,
      productDescription:
        savedCategoryEdit?.customStyleDescription ||
        matched?.description ||
        `Custom made-to-measure ${formData.styleCategory} tailored to your exact body measurements and fabric preference.`,
      productFeatures: matched?.features || [
        'Tailored to your exact bust, waist, hip & length measurements',
        'Custom neckline, sleeve & silhouette options available',
      ],
      productImageUrl:
        savedCategoryEdit?.referenceImageUrl || matched?.imageUrl || ASSETS.ankaraGown1,
      unitPriceNgn: matched?.priceNgn || 45000,
      savedReferenceNotes: savedCategoryEdit?.referenceImageNotes || '',
    };
  };

  const matchedStyleInfo = getMatchedProductForStyle();

  // Persist bespoke form state & custom edits in localStorage so switching sections or reloading never loses data
  useEffect(() => {
    try {
      localStorage.setItem(
        LOCAL_BESPOKE_DRAFT_KEY,
        JSON.stringify({
          formData,
          selectedSize,
          selectedColor,
          itemQuantity,
          isCustomStyleOverride,
          customStyleName,
          customStyleDescription,
          customReferenceImageUrl,
          referenceImageNotes,
          customAttachments,
          clientFacialPhotoUrl,
        })
      );
    } catch {
      // ignore storage quota
    }
  }, [
    formData,
    selectedSize,
    selectedColor,
    itemQuantity,
    isCustomStyleOverride,
    customStyleName,
    customStyleDescription,
    customReferenceImageUrl,
    referenceImageNotes,
    customAttachments,
    clientFacialPhotoUrl,
  ]);

  // Load confirmed style edit when user switches styleCategory if they haven't typed a new draft override
  useEffect(() => {
    const savedEdit =
      customStyleEdits?.[formData.styleCategory] ||
      customStyleEdits?.[matchedStyleInfo.productId];
    if (savedEdit) {
      setCustomStyleName(savedEdit.customStyleName || '');
      setCustomStyleDescription(savedEdit.customStyleDescription || '');
      setCustomReferenceImageUrl(savedEdit.referenceImageUrl || '');
      setReferenceImageNotes(savedEdit.referenceImageNotes || '');
      setIsCustomStyleOverride(Boolean(savedEdit.isCustomStyleOverride));
    }
  }, [formData.styleCategory]);

  // Confirm & Permanently Save Edited Bespoke Style & Reference Image across Backend & Frontend
  const handleConfirmPermanentBespokeStyleEdit = async () => {
    setIsSavingPermanentStyle(true);
    try {
      const res = await fetch('/api/styles/confirm-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleKey: formData.styleCategory,
          productId: matchedStyleInfo.productId,
          styleCategory: formData.styleCategory,
          customStyleName: effectiveStyleName,
          customStyleDescription: effectiveStyleDescription,
          referenceImageUrl: effectiveStyleImageUrl,
          referenceImageNotes: referenceImageNotes.trim(),
          isCustomStyleOverride: true,
          updateStorefrontProduct: matchedStyleInfo.productId !== 'bespoke-custom',
          actorName: formData.fullName.trim() || 'Confirmed Client Edit',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.customStyleEdits) {
          try {
            localStorage.setItem(
              'hosted_permanent_style_edits_v1',
              JSON.stringify(data.customStyleEdits)
            );
          } catch {
            // ignore
          }
        }
        setShowPermanentStyleConfirm(false);
        setPermanentStyleSavedNotice(
          'Confirmed & Saved Permanently! Your customized style details and reference image are now saved across the entire webpage and backend.'
        );
        if (onOrderSubmitted) onOrderSubmitted();
      }
    } catch (err) {
      console.error('Failed to permanently save bespoke style edit:', err);
    } finally {
      setIsSavingPermanentStyle(false);
    }
  };
  const effectiveStyleName =
    (customStyleName || '').trim() ||
    (isCustomStyleOverride ? `Custom Bespoke Style (${formData.styleCategory})` : matchedStyleInfo.productName);
  const effectiveStyleDescription =
    (customStyleDescription || '').trim() || matchedStyleInfo.productDescription;
  const effectiveStyleImageUrl =
    (customReferenceImageUrl || '').trim() || matchedStyleInfo.productImageUrl;
  const unitPrice = matchedStyleInfo.unitPriceNgn;
  const totalPrice = unitPrice * Math.max(1, itemQuantity);

  const handleUploadReferenceStyleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.84);
          setCustomReferenceImageUrl(compressed);
          // Also sync into customAttachments so it's saved in their reference files
          setCustomAttachments((prev) => [
            {
              id: `REF-IMG-${Date.now()}`,
              name: `Reference-Style-${file.name}`,
              fileType: 'image/jpeg',
              dataUrl: compressed,
              uploadedAt: new Date().toISOString(),
              category: 'style_reference',
            },
            ...prev,
          ]);
        } else {
          setCustomReferenceImageUrl(rawDataUrl);
        }
      };
      img.onerror = () => setCustomReferenceImageUrl(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getAbsoluteImageUrl = (imgUrl?: string) => {
    if (!imgUrl) return window.location.origin;
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
    if (imgUrl.startsWith('data:')) return `${window.location.origin} (Custom Uploaded Outfit Image)`;
    return `${window.location.origin}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
  };

  const isOrderPaymentConfirmed = (order: InquiryRecord) =>
    order.paymentStatus === 'Paid' ||
    order.status === 'Payment Confirmed' ||
    order.status === 'In Production' ||
    order.status === 'Ready for Fitting' ||
    order.status === 'Completed' ||
    order.status === 'Delivered';

  // Poll status while createdBespokeOrder is displayed and unverified
  const refreshBespokeOrderStatus = async () => {
    if (!createdBespokeOrder) return;
    setIsCheckingStatus(true);
    try {
      const res = await fetch(
        `/api/orders/status?ids=${encodeURIComponent(createdBespokeOrder.id)}`,
        { headers: { Accept: 'application/json' } }
      );
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data.orders) && data.orders.length > 0) {
          setCreatedBespokeOrder(data.orders[0]);
        }
      }
    } catch {
      // Silently ignore transient network or dev-server restart HTML responses
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (!createdBespokeOrder) return;
    const interval = setInterval(() => {
      refreshBespokeOrderStatus();
    }, 8000);
    return () => clearInterval(interval);
  }, [createdBespokeOrder?.id]);

  // Listen for voice-recorded measurements & custom tailoring requests from Tessy AI (Web Speech API)
  useEffect(() => {
    const handleTessyVoiceMeasurements = (event: Event) => {
      const customEvent = event as CustomEvent<{
        bust?: string;
        waist?: string;
        hips?: string;
        shoulder?: string;
        sleeveLength?: string;
        outfitLength?: string;
        styleCategory?: string;
        size?: string;
        color?: string;
        customStyleDescription?: string;
      }>;
      const detail = customEvent.detail;
      if (!detail) return;

      setFormData((prev) => ({
        ...prev,
        ...(detail.bust ? { bust: detail.bust } : {}),
        ...(detail.waist ? { waist: detail.waist } : {}),
        ...(detail.hips ? { hips: detail.hips } : {}),
        ...(detail.shoulder ? { shoulder: detail.shoulder } : {}),
        ...(detail.sleeveLength ? { sleeveLength: detail.sleeveLength } : {}),
        ...(detail.outfitLength ? { dressLength: detail.outfitLength } : {}),
        ...(detail.styleCategory ? { styleCategory: detail.styleCategory } : {}),
        ...(detail.customStyleDescription
          ? {
              customStyleDescription: detail.customStyleDescription,
              specialInstructions: prev.specialInstructions
                ? `${prev.specialInstructions}\nVoice Request: ${detail.customStyleDescription}`
                : detail.customStyleDescription,
            }
          : {}),
      }));

      if (detail.customStyleDescription) {
        setCustomStyleDescription(detail.customStyleDescription);
      }
      if (detail.size) {
        setSelectedSize(detail.size);
      }
      if (detail.color) {
        setSelectedColor(detail.color);
      }

      setStudioTab('tailoring');
      if (detail.bust || detail.waist || detail.hips || detail.outfitLength) {
        setActiveTailoringOutlet(4);
      }
    };

    window.addEventListener('tessy-voice-measurements', handleTessyVoiceMeasurements);
    return () => {
      window.removeEventListener('tessy-voice-measurements', handleTessyVoiceMeasurements);
    };
  }, []);

  // Add More items to pay for more numbers of it
  const handleAddMoreBespoke = async (additionalQty: number = 1) => {
    if (!createdBespokeOrder) return;
    setIsAddingMore(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(createdBespokeOrder.id)}/add-more`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalQuantity: additionalQty }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setCreatedBespokeOrder(data.order);
        }
        if (onOrderSubmitted) onOrderSubmitted();
      }
    } catch (err) {
      console.error('Failed to add more bespoke items:', err);
    } finally {
      setIsAddingMore(false);
    }
  };

  const measurementTips: Record<string, string> = {
    bust: 'Measure around the fullest part of your bust while wearing the undergarment you plan to wear with the outfit.',
    waist: 'Measure around your natural waistline, usually 1-2 inches above your navel at the narrowest point.',
    hips: 'Stand with feet together and measure around the fullest part of your hips and buttocks.',
    shoulder: 'Measure across the back from the tip of one shoulder bone to the other.',
    dressLength: 'Measure from the highest point of your shoulder, over the bust point, straight down to your desired hemline (knee, midi, or floor).',
    sleeveLength: 'Measure from shoulder tip down to desired length (short, 3/4, or wrist).',
  };

  const handleInputChange = (field: keyof MeasurementFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationNotice) setValidationNotice('');
  };

  const buildBespokeWhatsAppMessageText = (order: InquiryRecord) => {
    const confirmed = isOrderPaymentConfirmed(order);
    return (
      `*HOS|TED (HOS|TED Hosting Nations) — ${
        confirmed ? 'CONFIRMED BESPOKE ORDER STATUS' : 'BESPOKE ORDER & PAYMENT STATUS REQUEST'
      }*\n\n` +
      `*Order ID:* ${order.id}\n` +
      `*Current Payment Status:* ${
        confirmed ? 'PAYMENT CONFIRMED ✓' : 'UNVERIFIED — PENDING PAYMENT CONFIRMATION'
      }\n` +
      `*Outfit / Style:* ${order.customStyleName || order.productName || order.category}\n` +
      (order.customStyleDescription
        ? `*Custom Style Details / Description:* ${order.customStyleDescription}\n`
        : '') +
      (order.referenceImageNotes
        ? `*Reference Image Styling Notes:* ${order.referenceImageNotes}\n`
        : '') +
      `*Selected Size:* ${order.size || selectedSize}\n` +
      `*Selected Color:* ${order.color || selectedColor}\n` +
      `*Number of Items (Quantity):* ${order.quantity || 1}\n` +
      `*Unit Price:* ${formatNgn(order.unitPriceNgn || unitPrice)}\n` +
      `*Total Amount Payable:* ${formatNgn(order.totalAmountNgn || totalPrice)}\n\n` +
      `*Client Name:* ${order.name}\n` +
      `*Phone:* ${order.phone}\n` +
      `*Delivery Destination:* ${
        [order.deliveryAddress, order.deliveryCity, order.deliveryState].filter(Boolean).join(', ') || 'Nigeria'
      }\n\n` +
      (confirmed
        ? `Hello HOS|TED! My bespoke order (${order.id}) is now marked Payment Confirmed. Kindly share the tailoring & delivery update.`
        : `Hello HOS|TED! I have placed bespoke order *${order.id}* for *${order.quantity || 1}x ${
            order.productName || order.category
          }* (Size: ${order.size || selectedSize}, Color: ${
            order.color || selectedColor
          }) with the real outfit picture directly attached to this message. Please verify my payment of *${formatNgn(
            order.totalAmountNgn || totalPrice
          )}* and update my order status to *Payment Confirmed*.`)
    );
  };

  const handleSendBespokeWhatsAppWithRealImage = async (order: InquiryRecord) => {
    setIsSendingWhatsAppImage(true);
    setWhatsappImageNotice('');
    try {
      const imgUrl = order.productImageUrl || effectiveStyleImageUrl;
      const prodName = order.customStyleName || order.productName || order.category || effectiveStyleName;
      const result = await sendWhatsAppWithDirectOrderImage({
        whatsappClean,
        messageText: buildBespokeWhatsAppMessageText(order),
        imageUrl: imgUrl,
        orderId: order.id,
        productName: prodName,
      });
      setWhatsappImageNotice(result.statusMessage);
    } finally {
      setIsSendingWhatsAppImage(false);
    }
  };

  const handleCopyBespokeOutfitPhoto = async (order: InquiryRecord) => {
    const imgUrl = order.productImageUrl || effectiveStyleImageUrl;
    const prodName = order.customStyleName || order.productName || order.category || effectiveStyleName;
    const ok = await copyRealOrderImageToClipboard(imgUrl, order.id, prodName);
    if (ok) {
      setCopiedOutfitPhoto(true);
      setWhatsappImageNotice(
        'Real outfit picture copied to your clipboard! Simply press Paste (Ctrl+V or Paste) inside WhatsApp to send the actual picture.'
      );
      setTimeout(() => setCopiedOutfitPhoto(false), 3500);
    } else {
      setWhatsappImageNotice(
        'Click the WhatsApp button above to directly load or save the real outfit photo for your message.'
      );
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard?.writeText(accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      setActiveTailoringOutlet(1);
      setValidationNotice('Please open Outlet 1 (Client Information) and provide your full name and WhatsApp phone number.');
      return;
    }
    setValidationNotice('');
    // Ask client confirmation first before saving & reflecting immediately in Admin Portal
    setShowTailoringConfirmModal(true);
  };

  const handleConfirmAndSubmitTailoring = async () => {
    setShowTailoringConfirmModal(false);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          category: effectiveStyleName,
          productId: isCustomStyleOverride ? 'custom-client-style' : matchedStyleInfo.productId,
          productName: effectiveStyleName,
          productImageUrl: effectiveStyleImageUrl,
          customStyleName: effectiveStyleName,
          customStyleDescription: effectiveStyleDescription,
          referenceImageNotes: referenceImageNotes.trim(),
          isCustomStyleOverride: Boolean(isCustomStyleOverride || customStyleName.trim() || customStyleDescription.trim() || customReferenceImageUrl),
          size: selectedSize,
          color: selectedColor,
          quantity: itemQuantity,
          unitPriceNgn: unitPrice,
          totalAmountNgn: totalPrice,
          notes: [
            formData.specialInstructions,
            customStyleDescription.trim() ? `Style Details: ${customStyleDescription.trim()}` : '',
            referenceImageNotes.trim() ? `Ref Image Styling: ${referenceImageNotes.trim()}` : '',
          ]
            .filter(Boolean)
            .join(' | '),
          customAttachments,
          clientFacialPhotoUrl,
          delivery: {
            state: formData.deliveryState,
            city: formData.deliveryCity,
            address: formData.deliveryAddress,
            method: formData.deliveryMethod,
          },
          measurements: {
            bust: formData.bust,
            waist: formData.waist,
            hips: formData.hips,
            shoulder: formData.shoulder,
            dressLength: formData.dressLength,
            sleeveLength: formData.sleeveLength,
            fabric: formData.fabricPreference,
            neededBy: formData.preferredDate,
            size: selectedSize,
            color: selectedColor,
            quantity: String(itemQuantity),
            deliveryState: formData.deliveryState,
            deliveryCity: formData.deliveryCity,
            deliveryAddress: formData.deliveryAddress,
            deliveryMethod: formData.deliveryMethod,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.record) {
          setCreatedBespokeOrder(data.record);
          try {
            const raw = localStorage.getItem(LOCAL_ORDERS_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            const next = [data.record.id, ...(Array.isArray(parsed) ? parsed : [])].slice(0, 15);
            localStorage.setItem(LOCAL_ORDERS_STORAGE_KEY, JSON.stringify(Array.from(new Set(next))));
          } catch {
            // ignore storage errors
          }
        }
        if (onOrderSubmitted) onOrderSubmitted();
      }
    } catch (err) {
      console.error('Inquiry submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptForm.clientName.trim() || !aptForm.clientPhone.trim()) {
      setActiveAptOutlet(1);
      setAptValidationNotice('Please open Outlet 1 and enter your full name and WhatsApp phone number.');
      return;
    }
    if (!aptForm.date) {
      setActiveAptOutlet(2);
      setAptValidationNotice('Please open Outlet 2 and choose your preferred appointment date.');
      return;
    }
    setAptValidationNotice('');
    setShowAptConfirmModal(true);
  };

  const handleConfirmAndBookAppointment = async () => {
    setShowAptConfirmModal(false);
    setIsSubmittingApt(true);
    try {
      const res = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...aptForm,
          customAttachments,
          clientFacialPhotoUrl,
          confirmedByClient: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.appointment) {
          setCreatedAppointment(data.appointment);
        }
        if (onOrderSubmitted) onOrderSubmitted();
      } else {
        const errData = await res.json().catch(() => ({}));
        setAptValidationNotice(errData.error || 'Could not schedule appointment. Please try again.');
      }
    } catch (err) {
      console.error('Appointment booking error:', err);
      setAptValidationNotice('Network error while booking appointment.');
    } finally {
      setIsSubmittingApt(false);
    }
  };

  return (
    <section id="bespoke" className="py-16 sm:py-24 bg-stone-900/40 relative border-t border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-widest">
            <Scissors className="w-3.5 h-3.5" />
            <span>HOS|TED Made-to-Measure Studio</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Bespoke Custom Tailoring & Nationwide Delivery
          </h2>
          <p className="text-sm sm:text-base text-stone-300">
            Select your size, color, quantity, and measurements before payment takes place—then view HOS|TED payment details and request your live order status on WhatsApp.
          </p>
        </div>

        {/* Studio Mode Switcher: Custom Bespoke Tailoring & Measurements vs Book Appointment */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-stone-950 border border-stone-800 gap-2 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setStudioTab('tailoring')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                studioTab === 'tailoring'
                  ? 'bg-amber-400 text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Custom Bespoke Tailoring & Measurements</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioTab('appointment')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                studioTab === 'appointment'
                  ? 'bg-amber-400 text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Book Atelier Appointment & Fitting</span>
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form & Payment Details or Appointment Booking */}
          <div className="lg:col-span-8 bg-stone-950 rounded-3xl border border-stone-800 p-6 sm:p-10 shadow-2xl">
            {studioTab === 'appointment' ? (
              createdAppointment ? (
                <div className="space-y-6 text-xs">
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider text-[11px]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Client Confirmed • Live in HOS|TED Admin Portal</span>
                      </span>
                      <span className="font-mono text-amber-400 font-bold">{createdAppointment.id}</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white">
                      Your HOS|TED Appointment is Confirmed!
                    </h3>
                    <p className="text-stone-300 leading-relaxed">
                      Thank you, <strong>{createdAppointment.clientName}</strong>. Your <strong>{createdAppointment.type}</strong> session has been confirmed and immediately synchronized with Founder Theresa Isama, the HOS|TED Admin Portal, and Tessy Ai.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                        <span className="text-stone-400 block text-[10px] uppercase">Session Type</span>
                        <strong className="text-white text-sm">{createdAppointment.type}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                        <span className="text-stone-400 block text-[10px] uppercase">Date & Time</span>
                        <strong className="text-amber-400 text-sm">{createdAppointment.date} · {createdAppointment.time}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                        <span className="text-stone-400 block text-[10px] uppercase">Contact</span>
                        <strong className="text-white text-sm">{createdAppointment.clientPhone}</strong>
                      </div>
                    </div>
                    <div className="pt-3 flex flex-wrap gap-3">
                      <a
                        href={`https://api.whatsapp.com/send?phone=${whatsappClean}&text=${encodeURIComponent(
                          `*HOS|TED APPOINTMENT CONFIRMATION (${createdAppointment.id})*\n\nHello HOS|TED! I have confirmed my *${createdAppointment.type}* appointment for *${createdAppointment.date} at ${createdAppointment.time}*.\nName: ${createdAppointment.clientName}\nPhone: ${createdAppointment.clientPhone}\nNotes: ${createdAppointment.notes || 'None'}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Message HOS|TED WhatsApp Line Directly</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setCreatedAppointment(null)}
                        className="px-4 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 font-semibold transition"
                      >
                        Schedule Another Appointment
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReviewAppointment} className="space-y-5">
                  <div className="border-b border-stone-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-amber-400" />
                        <span>Schedule an Atelier Fitting, Measurement or Style Consultation</span>
                      </h3>
                      <p className="text-xs text-stone-400 mt-1">
                        Follow the simple steps below: click any menu outlet to fill out your appointment details, then review and confirm.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandAllAptOutlets(!expandAllAptOutlets)}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-300 text-xs font-semibold shrink-0 self-start"
                    >
                      {expandAllAptOutlets ? 'Single Outlet View' : 'Open All Outlets'}
                    </button>
                  </div>

                  {/* Simple Step-by-Step Instructions Banner for Appointment */}
                  <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        1
                      </span>
                      <div>
                        <strong className="text-white block">Click an Outlet Below</strong>
                        <span className="text-stone-400 text-[11px]">Tap Outlets 1, 2, or 3 to open its form.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        2
                      </span>
                      <div>
                        <strong className="text-white block">Fill Out Session Info</strong>
                        <span className="text-stone-400 text-[11px]">Enter contact, date/time & optional files.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        3
                      </span>
                      <div>
                        <strong className="text-white block">Confirm Booking</strong>
                        <span className="text-stone-400 text-[11px]">Reflects immediately in Admin Portal.</span>
                      </div>
                    </div>
                  </div>

                  {/* Clickable Quick Menu Bar for Appointment Outlets */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        id: 1,
                        label: '1. Client & Session Type',
                        done: Boolean(aptForm.clientName.trim() && aptForm.clientPhone.trim()),
                      },
                      {
                        id: 2,
                        label: '2. Date, Time & Notes',
                        done: Boolean(aptForm.date),
                      },
                      {
                        id: 3,
                        label: '3. Files & Face Photo',
                        done: Boolean(customAttachments.length > 0 || clientFacialPhotoUrl),
                      },
                    ].map((tab) => {
                      const active = isAptOutletOpen(tab.id);
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => toggleAptOutlet(tab.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition ${
                            active
                              ? 'bg-amber-400/15 border-amber-400 text-white font-bold shadow'
                              : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                          }`}
                        >
                          <span className="truncate">{tab.label}</span>
                          {tab.done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-stone-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {aptValidationNotice && (
                    <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium">
                      {aptValidationNotice}
                    </div>
                  )}

                  {/* APPOINTMENT OUTLET 1: Client Contact & Session Type */}
                  <div className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAptOutlet(1)}
                      className="w-full p-4 bg-stone-900 hover:bg-stone-900/80 flex items-center justify-between gap-3 text-left transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                          1
                        </span>
                        <div>
                          <div className="text-sm font-serif font-bold text-white">
                            Outlet 1: Client Contact & Appointment Type
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {aptForm.clientName && aptForm.clientPhone
                              ? `${aptForm.clientName} · ${aptForm.clientPhone} · ${aptForm.type}`
                              : 'Click to enter your Full Name, WhatsApp Phone, Email & Session Type'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {aptForm.clientName && aptForm.clientPhone && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            Filled ✓
                          </span>
                        )}
                        {isAptOutletOpen(1) ? (
                          <ChevronDown className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </button>

                    {isAptOutletOpen(1) && (
                      <div className="p-4 sm:p-5 border-t border-stone-800 space-y-4 bg-stone-950/60">
                        <p className="text-xs text-stone-400">
                          <strong>Simple Instruction:</strong> Provide your full name, active WhatsApp number, and the type of atelier session you wish to book.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-stone-300 mb-1.5">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={aptForm.clientName}
                              onChange={(e) => setAptForm({ ...aptForm, clientName: e.target.value })}
                              placeholder="e.g. Amara Okafor"
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-stone-300 mb-1.5">WhatsApp / Phone Number *</label>
                            <input
                              type="tel"
                              required
                              value={aptForm.clientPhone}
                              onChange={(e) => setAptForm({ ...aptForm, clientPhone: e.target.value })}
                              placeholder="e.g. 08012345678"
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-stone-300 mb-1.5">Email Address (Optional)</label>
                            <input
                              type="email"
                              value={aptForm.clientEmail}
                              onChange={(e) => setAptForm({ ...aptForm, clientEmail: e.target.value })}
                              placeholder="you@example.com"
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-stone-300 mb-1.5">Appointment Type *</label>
                            <select
                              value={aptForm.type}
                              onChange={(e) => setAptForm({ ...aptForm, type: e.target.value as AppointmentRecord['type'] })}
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="Measurement Taking">Body Measurement Session</option>
                              <option value="Consultation">Bespoke Style & Fabric Consultation</option>
                              <option value="First Fitting">First Garment Fitting</option>
                              <option value="Final Pickup">Final Fitting & Garment Pickup</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveAptOutlet(2)}
                            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs"
                          >
                            Next Outlet: Date, Time & Notes →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* APPOINTMENT OUTLET 2: Preferred Date, Time & Notes */}
                  <div className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAptOutlet(2)}
                      className="w-full p-4 bg-stone-900 hover:bg-stone-900/80 flex items-center justify-between gap-3 text-left transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                          2
                        </span>
                        <div>
                          <div className="text-sm font-serif font-bold text-white">
                            Outlet 2: Preferred Date, Time Slot & Occasion Notes
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {aptForm.date
                              ? `${aptForm.date} at ${aptForm.time}`
                              : 'Click to pick your preferred date, time slot & styling notes'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {aptForm.date && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            Date Selected ✓
                          </span>
                        )}
                        {isAptOutletOpen(2) ? (
                          <ChevronDown className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </button>

                    {isAptOutletOpen(2) && (
                      <div className="p-4 sm:p-5 border-t border-stone-800 space-y-4 bg-stone-950/60">
                        <p className="text-xs text-stone-400">
                          <strong>Simple Instruction:</strong> Choose your preferred appointment date and time slot, plus any notes about your event or outfit.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-stone-300 mb-1.5">Preferred Date *</label>
                            <input
                              type="date"
                              required
                              value={aptForm.date}
                              onChange={(e) => setAptForm({ ...aptForm, date: e.target.value })}
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-stone-300 mb-1.5">Preferred Time Slot *</label>
                            <select
                              value={aptForm.time}
                              onChange={(e) => setAptForm({ ...aptForm, time: e.target.value })}
                              className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="10:00 AM">10:00 AM</option>
                              <option value="11:00 AM">11:00 AM</option>
                              <option value="12:30 PM">12:30 PM</option>
                              <option value="02:00 PM">02:00 PM</option>
                              <option value="03:30 PM">03:30 PM</option>
                              <option value="05:00 PM">05:00 PM</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            Outfit / Occasion Notes or Special Requests
                          </label>
                          <textarea
                            rows={3}
                            value={aptForm.notes}
                            onChange={(e) => setAptForm({ ...aptForm, notes: e.target.value })}
                            placeholder="Tell us about the outfit, event date, or whether you want an in-person or virtual video measurement session..."
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveAptOutlet(1)}
                            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold"
                          >
                            ← Previous Outlet
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveAptOutlet(3)}
                            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs"
                          >
                            Next Outlet: Files & Face Photo →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* APPOINTMENT OUTLET 3: Attach Custom Files & Facial Recognition Photo */}
                  <div className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleAptOutlet(3)}
                      className="w-full p-4 bg-stone-900 hover:bg-stone-900/80 flex items-center justify-between gap-3 text-left transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                          3
                        </span>
                        <div>
                          <div className="text-sm font-serif font-bold text-white">
                            Outlet 3: Attach Style Files & Facial Recognition Photo
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {customAttachments.length > 0 || clientFacialPhotoUrl
                              ? `${customAttachments.length} file(s) · ${clientFacialPhotoUrl ? 'Face Photo Enrolled ✓' : 'No face photo yet'}`
                              : 'Click to upload reference files or capture your facial recognition check-in photo'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isAptOutletOpen(3) ? (
                          <ChevronDown className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </button>

                    {isAptOutletOpen(3) && (
                      <div className="p-4 sm:p-5 border-t border-stone-800 space-y-4 bg-stone-950/60">
                        <CustomFilesAttachmentBox
                          attachments={customAttachments}
                          onChangeAttachments={setCustomAttachments}
                          title="Attach Style Inspiration & Measurement Reference Files"
                          description="Attach outfit photos, fabric inspiration, or your measurement sheet for your appointment."
                        />
                        <FacialRecognitionCapture
                          photoUrl={clientFacialPhotoUrl}
                          onChangePhoto={setClientFacialPhotoUrl}
                          label="Client Facial Recognition Photo for Atelier Check-In"
                          subtitle="Add your face photo for instant recognition when you arrive or connect with the HOS|TED Admin Portal."
                        />
                        <div className="flex justify-start pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveAptOutlet(2)}
                            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold"
                          >
                            ← Previous Outlet
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingApt}
                    className="w-full py-4 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{isSubmittingApt ? 'Confirming Appointment...' : 'Review & Confirm Appointment'}</span>
                  </button>
                </form>
              )
            ) : createdBespokeOrder ? (
              <div className="space-y-6">
                {/* Specific Order Image + Status Header */}
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={createdBespokeOrder.productImageUrl || matchedStyleInfo.productImageUrl}
                      alt={createdBespokeOrder.productName || createdBespokeOrder.category}
                      className="w-20 h-24 rounded-xl object-cover border-2 border-amber-400/60 shrink-0 shadow-md"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/30">
                          {createdBespokeOrder.id}
                        </span>
                        {isOrderPaymentConfirmed(createdBespokeOrder) ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Payment Confirmed ✓</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Unverified — Pending Payment Confirmation</span>
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-bold text-white text-base">
                        {createdBespokeOrder.productName || createdBespokeOrder.category}
                      </h4>
                      <div className="text-xs text-stone-300 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Size: <strong className="text-white">{createdBespokeOrder.size || selectedSize}</strong></span>
                        <span>Color: <strong className="text-white">{createdBespokeOrder.color || selectedColor}</strong></span>
                        <span>Items: <strong className="text-amber-400 font-mono">{createdBespokeOrder.quantity || 1}</strong></span>
                      </div>
                      <div className="text-sm font-mono font-bold text-amber-400">
                        Total Payable: {formatNgn(createdBespokeOrder.totalAmountNgn || totalPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Add More Button to Pay for More Numbers of It */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto justify-between border-t sm:border-t-0 border-stone-800 pt-3 sm:pt-0">
                    <button
                      type="button"
                      disabled={isAddingMore}
                      onClick={() => handleAddMoreBespoke(1)}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAddingMore ? 'Updating...' : 'Add More (+1 Item)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={refreshBespokeOrderStatus}
                      className="text-[11px] text-stone-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isCheckingStatus ? 'animate-spin text-amber-400' : ''}`} />
                      <span>Refresh Payment Status</span>
                    </button>
                  </div>
                </div>

                {/* HOS|TED Official Payment Details Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 border-2 border-amber-500/40 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <CreditCard className="w-4 h-4" />
                      <span>HOS|TED Official Payment Details</span>
                    </div>
                    <span className="text-xs font-mono text-stone-300">
                      Order Ref: <strong className="text-amber-300">{createdBespokeOrder.id}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-stone-950/90 border border-stone-800">
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider">Bank / Payment Channel</span>
                      <strong className="text-white text-sm mt-0.5 block">{bankName}</strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-950/90 border border-stone-800">
                      <span className="text-stone-400 block text-[10px] uppercase tracking-wider">Account Name</span>
                      <strong className="text-white text-sm mt-0.5 block">{accountName}</strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-stone-950/90 border border-amber-500/40 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-stone-400 block text-[10px] uppercase tracking-wider">Account Number</span>
                        <strong className="text-amber-400 font-mono text-base mt-0.5 block">{accountNumber}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-[11px] font-semibold flex items-center gap-1"
                      >
                        {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-xs text-stone-400">Amount to Transfer ({createdBespokeOrder.quantity || 1} item{(createdBespokeOrder.quantity || 1) > 1 ? 's' : ''}):</span>
                      <div className="text-xl font-mono font-bold text-amber-400">
                        {formatNgn(createdBespokeOrder.totalAmountNgn || totalPrice)}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isAddingMore}
                      onClick={() => handleAddMoreBespoke(1)}
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add More (+1 Item = +{formatNgn(unitPrice)})</span>
                    </button>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">{paymentInstructions}</p>
                </div>

                {/* Bottom Action: Request Order Status on WhatsApp with Real Outfit Picture Directly Loaded */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSendBespokeWhatsAppWithRealImage(createdBespokeOrder)}
                      disabled={isSendingWhatsAppImage}
                      className="flex-1 py-4 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(16,185,129,0.3)] transition disabled:opacity-60"
                    >
                      <MessageCircle className="w-5 h-5 fill-stone-950" />
                      <span>
                        {isSendingWhatsAppImage
                          ? 'Loading Real Outfit Picture into WhatsApp...'
                          : isOrderPaymentConfirmed(createdBespokeOrder)
                          ? 'Payment Confirmed ✓ — Message HOS|TED on WhatsApp (With Real Photo)'
                          : 'Request Order Status on WhatsApp (Directly Loads Real Outfit Picture)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyBespokeOutfitPhoto(createdBespokeOrder)}
                      className="py-3.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition shrink-0"
                    >
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>{copiedOutfitPhoto ? 'Real Photo Copied ✓' : 'Copy Real Photo'}</span>
                    </button>
                  </div>

                  {whatsappImageNotice && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center">
                      {whatsappImageNotice}
                    </div>
                  )}

                  <p className="text-[11px] text-center text-stone-400">
                    Directly loads the <strong>real outfit picture</strong> (no image URL links) into your WhatsApp message along with your Order ID (<strong>{createdBespokeOrder.id}</strong>) and bespoke tailoring specifications.
                  </p>

                  <div className="flex items-center justify-center pt-2 border-t border-stone-800">
                    <button
                      type="button"
                      onClick={() => setCreatedBespokeOrder(null)}
                      className="text-xs text-stone-400 hover:text-white underline"
                    >
                      ← Place Another Bespoke Order
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Header & Simple Instructions Banner */}
                <div className="border-b border-stone-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-amber-400" />
                      <span>Custom Bespoke Tailoring & Measurements Menu</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      Simple & organized: click any menu outlet below to open its fill-out form, or step through them 1 to 6.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs">
                      Total: {formatNgn(totalPrice)} ({itemQuantity} × {formatNgn(unitPrice)})
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandAllTailoringOutlets(!expandAllTailoringOutlets)}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-300 text-xs font-semibold"
                    >
                      {expandAllTailoringOutlets ? 'Single Outlet View' : 'Open All Outlets'}
                    </button>
                  </div>
                </div>

                {/* Simple 3-Step Instructions Card */}
                <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <div>
                      <strong className="text-white block">Click Any Menu Outlet</strong>
                      <span className="text-stone-400 text-[11px]">Tap any outlet below (1 to 6) to open its fill-out form.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <div>
                      <strong className="text-white block">Customize & Fill Forms</strong>
                      <span className="text-stone-400 text-[11px]">Edit style/reference image, size, color, measurements & files.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <div>
                      <strong className="text-white block">Review & Confirm</strong>
                      <span className="text-stone-400 text-[11px]">Confirm order, view payment details & send real photo to WhatsApp.</span>
                    </div>
                  </div>
                </div>

                {/* Clickable Quick-Jump Outlet Menu Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 1,
                      label: '1. Client Info',
                      done: Boolean(formData.fullName.trim() && formData.phone.trim()),
                    },
                    {
                      id: 2,
                      label: '2. Style & Ref Image',
                      done: Boolean(effectiveStyleName),
                    },
                    {
                      id: 3,
                      label: '3. Size, Color & Qty',
                      done: Boolean(selectedSize && selectedColor && itemQuantity >= 1),
                    },
                    {
                      id: 4,
                      label: '4. Measurements',
                      done: Boolean(formData.bust || formData.waist || formData.hips || formData.dressLength),
                    },
                    {
                      id: 5,
                      label: '5. Delivery & Date',
                      done: Boolean(formData.deliveryState),
                    },
                    {
                      id: 6,
                      label: '6. Files & Face ID',
                      done: Boolean(customAttachments.length > 0 || clientFacialPhotoUrl),
                    },
                  ].map((tab) => {
                    const active = isTailoringOutletOpen(tab.id);
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => toggleTailoringOutlet(tab.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-1.5 transition ${
                          active
                            ? 'bg-amber-400/15 border-amber-400 text-white font-bold shadow'
                            : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <span className="truncate">{tab.label}</span>
                        {tab.done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {validationNotice && (
                  <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium">
                    {validationNotice}
                  </div>
                )}

                {/* ================================================================= */}
                {/* OUTLET 1: CLIENT INFORMATION & CONTACT                            */}
                {/* ================================================================= */}
                <div className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleTailoringOutlet(1)}
                    className="w-full p-4 bg-stone-900 hover:bg-stone-900/80 flex items-center justify-between gap-3 text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div>
                        <div className="text-sm font-serif font-bold text-white flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-amber-400" />
                          <span>Outlet 1: Client Information & Contact</span>
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {formData.fullName && formData.phone
                            ? `${formData.fullName} · ${formData.phone}${formData.email ? ` · ${formData.email}` : ''}`
                            : 'Click to fill out your Full Name, WhatsApp Phone Number & Email'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {formData.fullName && formData.phone ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          Completed ✓
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          Required *
                        </span>
                      )}
                      {isTailoringOutletOpen(1) ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {isTailoringOutletOpen(1) && (
                    <div className="p-4 sm:p-5 border-t border-stone-800 space-y-4 bg-stone-950/60">
                      <p className="text-xs text-stone-400">
                        <strong>Simple Instruction:</strong> Enter your full name and WhatsApp phone number so HOS|TED can link your bespoke measurements and confirm your order.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            placeholder="e.g. Amara Okafor"
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            WhatsApp / Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="e.g. 08012345678"
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            Email Address (Optional)
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTailoringOutlet(2)}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs"
                        >
                          Next Outlet: Style & Reference Image →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ================================================================= */}
                {/* OUTLET 2: OUTFIT STYLE, CUSTOM DESCRIPTION & REFERENCE IMAGE      */}
                {/* ================================================================= */}
                <div className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleTailoringOutlet(2)}
                    className="w-full p-4 bg-stone-900 hover:bg-stone-900/80 flex items-center justify-between gap-3 text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                        2
                      </span>
                      <img
                        src={effectiveStyleImageUrl}
                        alt={effectiveStyleName}
                        className="w-9 h-11 rounded-lg object-cover border border-amber-500/40 shrink-0"
                      />
                      <div>
                        <div className="text-sm font-serif font-bold text-white flex items-center gap-2 flex-wrap">
                          <span>Outlet 2: Outfit Style, Custom Description & Reference Image</span>
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {effectiveStyleName} · {formatNgn(unitPrice)}
                          {customReferenceImageUrl ? ' · Custom Reference Image Applied ✓' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                        {isCustomStyleOverride || customStyleName || customStyleDescription || customReferenceImageUrl
                          ? 'Customized ✓'
                          : 'Provided Style'}
                      </span>
                      {isTailoringOutletOpen(2) ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {isTailoringOutletOpen(2) && (
                    <div className="p-4 sm:p-5 border-t border-stone-800 space-y-4 bg-stone-950/60">
                      <p className="text-xs text-stone-400">
                        <strong>Simple Instruction:</strong> Select a HOS|TED style category and fabric below—or if you don't want to use the style provided, edit the <strong>Custom Style Details / Description</strong> and upload your own <strong>Reference Image Styling</strong> photo.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            Style Category
                          </label>
                          <select
                            value={formData.styleCategory}
                            onChange={(e) => handleInputChange('styleCategory', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="Everyday Wears (Tops & Pants)">Everyday Wears (Tops & Pants)</option>
                            <option value="Materials (Luxury Fabrics & Textiles)">Materials (Luxury Fabrics & Textiles)</option>
                            <option value="Skirt and Blouse (Peplum/Pencil)">Skirt and Blouse (Peplum/Pencil)</option>
                            <option value="Ankara Gowns (Mermaid / Corset / A-Line)">Ankara Gowns (Mermaid / Corset / A-Line)</option>
                            <option value="Bubu Gowns (Royal Silk / Damask Kaftan)">Bubu Gowns (Royal Silk / Damask Kaftan)</option>
                            <option value="Chic Casual Outfits (Co-ords & Kimonos)">Chic Casual Outfits (Co-ords & Kimonos)</option>
                            <option value="Matching Couple Ensemble">Matching Couple Ensemble</option>
                            <option value="Bridal / Aso-Ebi Entourage">Bridal / Aso-Ebi Entourage</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            Fabric Sourcing
                          </label>
                          <select
                            value={formData.fabricPreference}
                            onChange={(e) => handleInputChange('fabricPreference', e.target.value as any)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="atelier_ankara">HOS|TED Premium Ankara Selection</option>
                            <option value="luxury_silk">Luxury Silk Damask / Jacquard / Mikado</option>
                            <option value="provide_own">I will provide my own fabric</option>
                            <option value="custom_blend">Custom Mixed (Ankara + Satin/Organza)</option>
                          </select>
                        </div>
                      </div>

                      {/* Preview & Editable Reference Image Styling + Custom Style Details Section */}
                      <div className="p-4 rounded-2xl bg-stone-900/95 border border-stone-800 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="relative group shrink-0">
                              <img
                                src={effectiveStyleImageUrl}
                                alt={effectiveStyleName}
                                className="w-24 h-28 rounded-xl object-cover border-2 border-amber-500/50 shadow-md"
                              />
                              {customReferenceImageUrl && (
                                <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950 font-bold text-[9px] uppercase shadow">
                                  Custom Ref
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowImageEditorPanel(!showImageEditorPanel)}
                                className="mt-1.5 w-full py-1 px-2 rounded-lg bg-stone-950 hover:bg-stone-800 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit Image</span>
                              </button>
                            </div>

                            <div className="text-xs space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-serif font-bold text-sm sm:text-base">
                                  {effectiveStyleName}
                                </span>
                                {isCustomStyleOverride || customStyleName.trim() || customStyleDescription.trim() ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase">
                                    Customized Style
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 text-[10px] font-semibold">
                                    Provided Style
                                  </span>
                                )}
                              </div>
                              <p className="text-stone-300 leading-relaxed line-clamp-3">
                                {effectiveStyleDescription}
                              </p>
                              {referenceImageNotes && (
                                <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-2.5 py-1">
                                  <strong>Reference Image Styling Note:</strong> {referenceImageNotes}
                                </div>
                              )}
                              <div className="text-amber-400 font-mono font-bold pt-0.5">
                                Unit Price: {formatNgn(unitPrice)} · Selected Quantity: {itemQuantity}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => setShowImageEditorPanel(!showImageEditorPanel)}
                              className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>
                                {showImageEditorPanel
                                  ? 'Hide Image & Style Editor'
                                  : 'Edit Image & Customize Style Details'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const nextMode = !isCustomStyleOverride;
                                setIsCustomStyleOverride(nextMode);
                                if (nextMode) {
                                  setShowImageEditorPanel(true);
                                  if (!customStyleName) {
                                    setCustomStyleName(`My Custom ${formData.styleCategory}`);
                                  }
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition ${
                                isCustomStyleOverride
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                  : 'bg-stone-950 hover:bg-stone-800 border-stone-700 text-stone-300'
                              }`}
                            >
                              <Scissors className="w-3 h-3" />
                              <span>
                                {isCustomStyleOverride
                                  ? 'Using Custom Style ✓'
                                  : "Don't Use Provided Style (Customize Mine)"}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Hidden File Input for Reference Image Styling */}
                        <input
                          ref={referenceImageFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleUploadReferenceStyleImage}
                          className="hidden"
                        />

                        {/* Reference Image Styling & Custom Style Description Editor */}
                        <div className="pt-3 border-t border-stone-800/90 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Left Box: Edit Image Section to Add Reference Image Styling */}
                            <div className="p-3.5 rounded-xl bg-stone-950 border border-amber-500/30 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-serif font-bold text-amber-400 flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  <span>Edit Image Section (Reference Image Styling)</span>
                                </span>
                                {customReferenceImageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setCustomReferenceImageUrl('')}
                                    className="text-[10px] text-stone-400 hover:text-rose-400 flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reset to Default Image</span>
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-400 leading-relaxed">
                                Don't want the default picture above? Upload your own <strong>Reference Image Styling</strong> photo or paste an image link to replace the outfit preview and send it with your order.
                              </p>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => referenceImageFileInputRef.current?.click()}
                                  className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow transition"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload Reference Styling Image</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="url"
                                  value={referenceUrlInput}
                                  onChange={(e) => setReferenceUrlInput(e.target.value)}
                                  placeholder="Or paste a reference style image URL..."
                                  className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (referenceUrlInput.trim()) {
                                      setCustomReferenceImageUrl(referenceUrlInput.trim());
                                      setReferenceUrlInput('');
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-semibold shrink-0"
                                >
                                  Use Image URL
                                </button>
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-stone-300 mb-1">
                                  Reference Image Styling Notes (What to copy or modify from the image)
                                </label>
                                <input
                                  type="text"
                                  value={referenceImageNotes}
                                  onChange={(e) => setReferenceImageNotes(e.target.value)}
                                  placeholder="e.g. Copy the neckline & sleeves from my reference photo, make skirt floor-length"
                                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>

                            {/* Right Box: Edit & Customize Style Name, Details & Description */}
                            <div className="p-3.5 rounded-xl bg-stone-950 border border-amber-500/30 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-serif font-bold text-amber-400 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Edit & Customize Style Details / Description</span>
                                </span>
                                {(customStyleName || customStyleDescription) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomStyleName('');
                                      setCustomStyleDescription('');
                                      setIsCustomStyleOverride(false);
                                    }}
                                    className="text-[10px] text-stone-400 hover:text-rose-400 flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reset to Provided</span>
                                  </button>
                                )}
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-stone-300 mb-1">
                                  Custom Style Title / Name (Edit if not using the style provided)
                                </label>
                                <input
                                  type="text"
                                  value={customStyleName}
                                  onChange={(e) => {
                                    setCustomStyleName(e.target.value);
                                    if (e.target.value.trim()) setIsCustomStyleOverride(true);
                                  }}
                                  placeholder={matchedStyleInfo.productName}
                                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-medium text-stone-300 mb-1">
                                  Custom Style Details & Tailoring Description
                                </label>
                                <textarea
                                  rows={3}
                                  value={customStyleDescription}
                                  onChange={(e) => {
                                    setCustomStyleDescription(e.target.value);
                                    if (e.target.value.trim()) setIsCustomStyleOverride(true);
                                  }}
                                  placeholder={`Describe your exact style cut, neckline, sleeve design, bodice, slit, or modifications (Default: ${matchedStyleInfo.productDescription})`}
                                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                                />
                              </div>

                              {/* Quick-Add Bespoke Tailoring Detail Chips */}
                              <div className="space-y-1">
                                <span className="text-[10px] text-stone-400 block">
                                  Tap to add custom style details:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    'Corset Bodice',
                                    'Sweetheart Neckline',
                                    'Detachable Overskirt',
                                    'Exaggerated Bell Sleeves',
                                    'Modest High Neck',
                                    'Side Slit',
                                    'Floor-Length Train',
                                    'Matching Headwrap (Gele)',
                                  ].map((chip) => (
                                    <button
                                      key={chip}
                                      type="button"
                                      onClick={() => {
                                        setIsCustomStyleOverride(true);
                                        setCustomStyleDescription((prev) =>
                                          prev.trim() ? `${prev.trim()}, ${chip}` : `Include ${chip}`
                                        );
                                      }}
                                      className="px-2 py-0.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[10px] text-amber-300 font-medium transition"
                                    >
                                      + {chip}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Confirm & Permanently Save Edited Style & Reference Image Bar */}
                          <div className="p-3.5 rounded-xl bg-stone-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs text-stone-300">
                              <strong className="text-emerald-400">Confirm Permanent Style & Image Edit:</strong>{' '}
                              Click to confirm your edited style name, description, and reference image so they stay permanently across the webpage from the backend to the frontend.
                            </div>
                            {!showPermanentStyleConfirm ? (
                              <button
                                type="button"
                                onClick={() => setShowPermanentStyleConfirm(true)}
                                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition shadow"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Confirm & Save Edit Permanently</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setShowPermanentStyleConfirm(false)}
                                  className="px-3 py-1.5 rounded-lg bg-stone-900 text-stone-300 text-xs border border-stone-700"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingPermanentStyle}
                                  onClick={handleConfirmPermanentBespokeStyleEdit}
                                  className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1 shadow"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>
                                    {isSavingPermanentStyle
                                      ? 'Saving Permanently...'
                                      : 'Yes, Confirm Permanent Save'}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>

                          {permanentStyleSavedNotice && (
                            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                              <span>{permanentStyleSavedNotice}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTailoringOutlet(1)}
                          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold"
                        >
                          ← Previous Outlet
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTailoringOutlet(3)}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs"
                        >
                          Next Outlet: Size, Color & Quantity →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ================================================================= */}
                {/* OUTLET 3: SIZE, COLOR & NUMBER OF ITEMS (BEFORE PAYMENT)          */}
                {/* ================================================================= */}
                <div className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleTailoringOutlet(3)}
                    className="w-full p-4 bg-stone-900 hover:bg-stone-900/80 flex items-center justify-between gap-3 text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                        3
                      </span>
                      <div>
                        <div className="text-sm font-serif font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-amber-400" />
                          <span>Outlet 3: Size, Color & Number of Items (Before Payment)</span>
                        </div>
                        <div className="text-[11px] text-stone-400">
                          Size: {selectedSize} · Color: {selectedColor} · Quantity: {itemQuantity} ({formatNgn(totalPrice)})
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {itemQuantity} Item{itemQuantity > 1 ? 's' : ''} ✓
                      </span>
                      {isTailoringOutletOpen(3) ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {isTailoringOutletOpen(3) && (
                    <div className="p-4 sm:p-5 border-t border-stone-800 space-y-4 bg-stone-950/60">
                      <p className="text-xs text-stone-400">
                        <strong>Simple Instruction:</strong> Pick your size using our plain-English layman guide, tap a color swatch (or type your own color), and choose the number of items before payment.
                      </p>

                      {/* Layman-Friendly Size, Color & Number of Items (Quantity) */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2.5">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="block text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                              <Ruler className="w-3.5 h-3.5 text-amber-400" />
                              <span>Choose Your Size (Easy Layman Guide — No Tape Measure Required) *</span>
                            </label>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {LAYMAN_SIZE_GUIDE.map((sz) => {
                              const isSelected = selectedSize === sz.value;
                              return (
                                <button
                                  key={sz.value}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSize(sz.value);
                                    if (sz.approxInches.bust) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        bust: prev.bust || sz.approxInches.bust,
                                        waist: prev.waist || sz.approxInches.waist,
                                        hips: prev.hips || sz.approxInches.hips,
                                        shoulder: prev.shoulder || sz.approxInches.shoulder,
                                        dressLength: prev.dressLength || sz.approxInches.dressLength,
                                        sleeveLength: prev.sleeveLength || sz.approxInches.sleeveLength,
                                      }));
                                    }
                                  }}
                                  className={`text-left p-2.5 rounded-xl text-xs border transition ${
                                    isSelected
                                      ? 'bg-amber-400/15 border-amber-400 text-white font-bold'
                                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-amber-300 font-bold">{sz.shortLabel}</span>
                                    <span className="text-[10px] font-mono text-stone-400">{sz.ukSize}</span>
                                  </div>
                                  <div className="text-[11px] text-stone-300 font-normal mt-0.5">
                                    {sz.everydayName}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {findLaymanSizeOption(selectedSize) && (
                            <div className="p-2.5 rounded-xl bg-stone-950 border border-amber-500/30 text-[11px] text-stone-300">
                              <strong className="text-amber-400">Plain-English Fit:</strong>{' '}
                              {findLaymanSizeOption(selectedSize)?.bodyDescription}
                            </div>
                          )}
                        </div>

                        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2.5">
                          <label className="block text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-amber-400" />
                            <span>Choose Color (Tap Visual Swatch or Type Your Own) *</span>
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {LAYMAN_COLOR_GUIDE.map((clr) => {
                              const isSelected = selectedColor === clr.value;
                              return (
                                <button
                                  key={clr.value}
                                  type="button"
                                  onClick={() => setSelectedColor(clr.value)}
                                  className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition ${
                                    isSelected
                                      ? 'bg-amber-400/15 border-amber-400 text-white font-bold'
                                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                                  }`}
                                >
                                  <span
                                    className="w-4 h-4 rounded-full shrink-0 border"
                                    style={{
                                      background: clr.hex,
                                      borderColor: clr.borderHex || 'rgba(255,255,255,0.25)',
                                    }}
                                  />
                                  <div className="truncate">
                                    <div className="text-[11px] leading-tight truncate">{clr.simpleName}</div>
                                    <div className="text-[9px] text-stone-400 truncate">{clr.fashionShade}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {findLaymanColorOption(selectedColor) && (
                            <div className="text-[11px] text-amber-300">
                              Selected Color: <strong>{findLaymanColorOption(selectedColor)?.simpleName}</strong> —{' '}
                              {findLaymanColorOption(selectedColor)?.description}
                            </div>
                          )}
                          <input
                            type="text"
                            required
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            placeholder="Or type your preferred color in your own everyday words..."
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                          <label className="text-xs font-medium text-stone-300">
                            Number of Items (Quantity) *
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                              className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={itemQuantity}
                              onChange={(e) => setItemQuantity(Math.max(1, Number(e.target.value) || 1))}
                              className="w-16 text-center bg-stone-950 border border-stone-800 rounded-xl py-2 text-sm font-mono font-bold text-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => setItemQuantity((q) => q + 1)}
                              className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-amber-400"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTailoringOutlet(2)}
                          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold"
                        >
                          ← Previous Outlet
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTailoringOutlet(4)}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs"
                        >
                          Next Outlet: Body Measurements →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ================================================================= */}
                {/* OUTLET 4: BODY MEASUREMENTS (INCHES) & TAPE GUIDE                 */}
                {/* ================================================================= */}
                <div className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleTailoringOutlet(4)}
                    className="w-full p-4 bg-stone-900 hover:bg-stone-900/80 flex items-center justify-between gap-3 text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                        4
                      </span>
                      <div>
                        <div className="text-sm font-serif font-bold text-white flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-amber-400" />
                          <span>Outlet 4: Body Measurements (Inches) & Tape Guide</span>
                        </div>
                        <div className="text-[11px] text-stone-400">
                          Bust: {formData.bust || 'Std'}" · Waist: {formData.waist || 'Std'}" · Hips: {formData.hips || 'Std'}" · Length: {formData.dressLength || 'Std'}"
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 text-[10px] font-bold">
                        {formData.bust || formData.waist || formData.hips ? 'Measurements Set ✓' : 'Optional / Auto-Fit'}
                      </span>
                      {isTailoringOutletOpen(4) ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {isTailoringOutletOpen(4) && (
                    <div className="p-4 sm:p-5 border-t border-stone-800 space-y-4 bg-stone-950/60">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-xs text-stone-400">
                          <strong>Simple Instruction:</strong> Enter your exact body measurements in inches (or keep the standard inches auto-filled from your size). Tap any <strong>(?)</strong> icon for simple measuring instructions.
                        </p>

                        <button
                          type="button"
                          onClick={onOpenTessyWithGuide}
                          className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-1.5 font-semibold shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Tessy Ai — Measurement Guide</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {/* Bust */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-stone-300">Bust</label>
                            <span
                              onClick={() => setActiveMeasurementTooltip(activeMeasurementTooltip === 'bust' ? null : 'bust')}
                              className="cursor-pointer text-stone-500 hover:text-amber-400"
                            >
                              <HelpCircle className="w-3 h-3" />
                            </span>
                          </div>
                          <input
                            type="number"
                            step="0.5"
                            placeholder='e.g. 36"'
                            value={formData.bust}
                            onChange={(e) => handleInputChange('bust', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Waist */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-stone-300">Waist</label>
                            <span
                              onClick={() => setActiveMeasurementTooltip(activeMeasurementTooltip === 'waist' ? null : 'waist')}
                              className="cursor-pointer text-stone-500 hover:text-amber-400"
                            >
                              <HelpCircle className="w-3 h-3" />
                            </span>
                          </div>
                          <input
                            type="number"
                            step="0.5"
                            placeholder='e.g. 28"'
                            value={formData.waist}
                            onChange={(e) => handleInputChange('waist', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Hips */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-stone-300">Full Hips</label>
                            <span
                              onClick={() => setActiveMeasurementTooltip(activeMeasurementTooltip === 'hips' ? null : 'hips')}
                              className="cursor-pointer text-stone-500 hover:text-amber-400"
                            >
                              <HelpCircle className="w-3 h-3" />
                            </span>
                          </div>
                          <input
                            type="number"
                            step="0.5"
                            placeholder='e.g. 40"'
                            value={formData.hips}
                            onChange={(e) => handleInputChange('hips', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Shoulder */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-stone-300">Shoulder Width</label>
                            <span
                              onClick={() => setActiveMeasurementTooltip(activeMeasurementTooltip === 'shoulder' ? null : 'shoulder')}
                              className="cursor-pointer text-stone-500 hover:text-amber-400"
                            >
                              <HelpCircle className="w-3 h-3" />
                            </span>
                          </div>
                          <input
                            type="number"
                            step="0.5"
                            placeholder='e.g. 15.5"'
                            value={formData.shoulder}
                            onChange={(e) => handleInputChange('shoulder', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Dress Length */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-stone-300">Gown Length</label>
                            <span
                              onClick={() => setActiveMeasurementTooltip(activeMeasurementTooltip === 'dressLength' ? null : 'dressLength')}
                              className="cursor-pointer text-stone-500 hover:text-amber-400"
                            >
                              <HelpCircle className="w-3 h-3" />
                            </span>
                          </div>
                          <input
                            type="number"
                            step="0.5"
                            placeholder='e.g. 58"'
                            value={formData.dressLength}
                            onChange={(e) => handleInputChange('dressLength', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Sleeve Length */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-stone-300">Sleeve Length</label>
                            <span
                              onClick={() => setActiveMeasurementTooltip(activeMeasurementTooltip === 'sleeveLength' ? null : 'sleeveLength')}
                              className="cursor-pointer text-stone-500 hover:text-amber-400"
                            >
                              <HelpCircle className="w-3 h-3" />
                            </span>
                          </div>
                          <input
                            type="number"
                            step="0.5"
                            placeholder='e.g. 24"'
                            value={formData.sleeveLength}
                            onChange={(e) => handleInputChange('sleeveLength', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Active Tooltip popup */}
                      {activeMeasurementTooltip && measurementTips[activeMeasurementTooltip] && (
                        <div className="mt-2 p-3 rounded-xl bg-stone-900 border border-amber-500/40 text-stone-200 text-xs flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p>{measurementTips[activeMeasurementTooltip]}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTailoringOutlet(3)}
                          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold"
                        >
                          ← Previous Outlet
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTailoringOutlet(5)}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs"
                        >
                          Next Outlet: Nationwide Delivery →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ================================================================= */}
                {/* OUTLET 5: NATIONWIDE DELIVERY, TARGET DATE & STYLING NOTES        */}
                {/* ================================================================= */}
                <div className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleTailoringOutlet(5)}
                    className="w-full p-4 bg-stone-900 hover:bg-stone-900/80 flex items-center justify-between gap-3 text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                        5
                      </span>
                      <div>
                        <div className="text-sm font-serif font-bold text-white flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber-400" />
                          <span>Outlet 5: Nationwide Delivery, Target Date & Notes</span>
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {[formData.deliveryCity, formData.deliveryState].filter(Boolean).join(', ')} · {formData.deliveryMethod}
                          {formData.preferredDate ? ` · Due: ${formData.preferredDate}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {formData.deliveryState} ✓
                      </span>
                      {isTailoringOutletOpen(5) ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {isTailoringOutletOpen(5) && (
                    <div className="p-4 sm:p-5 border-t border-stone-800 space-y-4 bg-stone-950/60">
                      <p className="text-xs text-stone-400">
                        <strong>Simple Instruction:</strong> Choose your delivery state, city, address, and preferred delivery method, plus your target event date and any extra styling notes.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            State / Destination
                          </label>
                          <select
                            value={formData.deliveryState}
                            onChange={(e) => handleInputChange('deliveryState', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                          >
                            {NIGERIAN_STATES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            City / Town / LGA
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Lekki, Wuse 2, Port Harcourt"
                            value={formData.deliveryCity}
                            onChange={(e) => handleInputChange('deliveryCity', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            Delivery Street Address / Landmark
                          </label>
                          <input
                            type="text"
                            placeholder="Street number, estate, or nearest landmark"
                            value={formData.deliveryAddress}
                            onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            Preferred Delivery Method
                          </label>
                          <select
                            value={formData.deliveryMethod}
                            onChange={(e) => handleInputChange('deliveryMethod', e.target.value as any)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                          >
                            <option value="Doorstep Courier">Nationwide Doorstep Courier (DHL / GIGL / Dispatch)</option>
                            <option value="Terminal Pickup">Interstate Park / Terminal Pickup</option>
                            <option value="Atelier Pickup">Direct HOS|TED Atelier Pickup</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            Target Delivery / Event Date
                          </label>
                          <input
                            type="date"
                            value={formData.preferredDate}
                            onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-300 mb-1.5">
                            Special Styling Instructions
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Include matching headwrap / gele"
                            value={formData.specialInstructions}
                            onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTailoringOutlet(4)}
                          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold"
                        >
                          ← Previous Outlet
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTailoringOutlet(6)}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs"
                        >
                          Next Outlet: Attach Files & Face Photo →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ================================================================= */}
                {/* OUTLET 6: ATTACH BESPOKE FILES & FACIAL RECOGNITION PHOTO         */}
                {/* ================================================================= */}
                <div className="rounded-2xl border border-stone-800 bg-stone-900/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleTailoringOutlet(6)}
                    className="w-full p-4 bg-stone-900 hover:bg-stone-900/80 flex items-center justify-between gap-3 text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                        6
                      </span>
                      <div>
                        <div className="text-sm font-serif font-bold text-white flex items-center gap-2">
                          <ScanFace className="w-4 h-4 text-amber-400" />
                          <span>Outlet 6: Attach Bespoke Files & Facial Recognition Photo</span>
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {customAttachments.length > 0 || clientFacialPhotoUrl
                            ? `${customAttachments.length} Reference File(s) · ${clientFacialPhotoUrl ? 'Facial Photo Enrolled ✓' : 'No Facial Photo Yet'}`
                            : 'Click to attach style/measurement sheets & capture your facial recognition photo'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(customAttachments.length > 0 || clientFacialPhotoUrl) && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          Attached ✓
                        </span>
                      )}
                      {isTailoringOutletOpen(6) ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {isTailoringOutletOpen(6) && (
                    <div className="p-4 sm:p-5 border-t border-stone-800 space-y-4 bg-stone-950/60">
                      <p className="text-xs text-stone-400">
                        <strong>Simple Instruction:</strong> Upload your custom tailored bespoke files or measurement sheets, and capture or upload your Facial Recognition photo for instant verification in the HOS|TED Admin Portal.
                      </p>

                      <CustomFilesAttachmentBox
                        attachments={customAttachments}
                        onChangeAttachments={setCustomAttachments}
                        title="Attach Custom Tailored Bespoke & Measurement Reference Files"
                        description="Upload your style inspiration photos, sketches, fabric swatches, or measurement sheets/PDFs. All attached files sync immediately to the HOS|TED Admin Portal."
                      />

                      <FacialRecognitionCapture
                        photoUrl={clientFacialPhotoUrl}
                        onChangePhoto={setClientFacialPhotoUrl}
                        label="Client Facial Recognition & Bespoke Fit Photo"
                        subtitle="Capture a live camera selfie or upload a face photo so Founder Theresa Isama and the HOS|TED Admin Portal can verify your identity and match colors to your skin undertone."
                      />

                      <div className="flex justify-start pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTailoringOutlet(5)}
                          className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold"
                        >
                          ← Previous Outlet
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Confirming & Syncing Order...'
                        : `Review & Confirm Custom Tailoring (${formatNgn(totalPrice)})`}
                    </span>
                  </button>
                </div>

              </form>
            )}
          </div>

          {/* Client Confirmation Modal for Custom Bespoke Tailoring & Measurements */}
          {showTailoringConfirmModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-stone-950 border-2 border-amber-400 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
                    <ShieldCheck className="w-5 h-5" />
                    <span>Confirm Custom Bespoke Tailoring & Measurements</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTailoringConfirmModal(false)}
                    className="text-stone-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-stone-300 leading-relaxed">
                  Please confirm your custom tailoring specifications and body measurements below. Once you click <strong>Confirm & Submit</strong>, your order and measurements will immediately reflect in the HOS|TED Admin Portal.
                </p>

                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2.5 text-stone-200">
                  <div className="flex items-center gap-3 pb-2 border-b border-stone-800">
                    <img
                      src={effectiveStyleImageUrl}
                      alt={effectiveStyleName}
                      className="w-14 h-16 rounded-xl object-cover border border-amber-400 shrink-0"
                    />
                    <div className="space-y-0.5">
                      <div className="font-serif font-bold text-white text-sm">{effectiveStyleName}</div>
                      <div className="text-[11px] text-stone-400 line-clamp-2">{effectiveStyleDescription}</div>
                      {customReferenceImageUrl && (
                        <span className="inline-block text-[10px] text-emerald-400 font-semibold">
                          ✓ Custom Reference Styling Image Applied
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Client:</span>
                    <strong>{formData.fullName} ({formData.phone})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Style & Quantity:</span>
                    <strong className="text-amber-300">{itemQuantity}× {effectiveStyleName}</strong>
                  </div>
                  {referenceImageNotes && (
                    <div className="flex justify-between gap-2">
                      <span className="text-stone-400 shrink-0">Ref Image Styling:</span>
                      <strong className="text-emerald-300 text-right">{referenceImageNotes}</strong>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-400">Size & Color:</span>
                    <strong>{selectedSize} · {selectedColor}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Measurements (Bust/Waist/Hips/Length):</span>
                    <strong>
                      {formData.bust || 'Std'}" / {formData.waist || 'Std'}" / {formData.hips || 'Std'}" / {formData.dressLength || 'Std'}"
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Attached Custom Files:</span>
                    <strong className="text-amber-300">{customAttachments.length} file(s) attached</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Facial Recognition Photo:</span>
                    <strong className={clientFacialPhotoUrl ? 'text-emerald-400' : 'text-stone-400'}>
                      {clientFacialPhotoUrl ? 'Enrolled & Attached ✓' : 'Not attached'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Total Amount:</span>
                    <strong className="text-amber-400 font-mono text-sm">{formatNgn(totalPrice)}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTailoringConfirmModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-semibold"
                  >
                    Edit Details
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAndSubmitTailoring}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold flex items-center gap-1.5 shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Submit Immediately</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Client Confirmation Modal for Atelier Appointment */}
          {showAptConfirmModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-stone-950 border-2 border-amber-400 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
                    <Calendar className="w-5 h-5" />
                    <span>Confirm Your HOS|TED Atelier Appointment</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAptConfirmModal(false)}
                    className="text-stone-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-stone-300 leading-relaxed">
                  Please confirm your appointment details below. Upon confirmation, your session is immediately scheduled in the live HOS|TED Admin Portal.
                </p>

                <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2 text-stone-200">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Client Name:</span>
                    <strong>{aptForm.clientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Phone:</span>
                    <strong>{aptForm.clientPhone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Session Type:</span>
                    <strong className="text-amber-300">{aptForm.type}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Date & Time:</span>
                    <strong className="text-amber-400">{aptForm.date} at {aptForm.time}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAptConfirmModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-semibold"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAndBookAppointment}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold flex items-center gap-1.5 shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Appointment Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Right Column: Tailoring Promise & Process */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* The HOS|TED Atelier Promise */}
            <div className="bg-stone-950 rounded-3xl border border-stone-800 p-6 space-y-4 shadow-xl">
              <h4 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <span>The HOS|TED Promise</span>
              </h4>

              <div className="space-y-3 text-xs text-stone-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    1
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Flawless Fit Guarantee</strong>
                    Complimentary minor adjustments if your custom HOS|TED piece needs fine-tuning upon delivery.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    2
                  </div>
                  <div>
                    <strong className="text-white block font-medium">True Grade-A Fabrics</strong>
                    100% genuine African wax prints, premium bridal duchess satins, and luxury silks that don’t fade.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    3
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Nationwide Doorstep Delivery</strong>
                    We ship across all 36 states in Nigeria, FCT Abuja, and international destinations based on your address.
                  </div>
                </div>
              </div>
            </div>

            {/* Need guidance callout */}
            <div className="bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 rounded-3xl border border-amber-500/30 p-6 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Unsure of your measurements?</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                <strong>Tessy Ai</strong> can guide you step-by-step through measuring at home with an ordinary tape rule.
              </p>
              <button
                onClick={onOpenTessyWithGuide}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-amber-300 font-semibold text-xs transition"
              >
                Launch Tessy Ai Measurement Guide
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
