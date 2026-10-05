import React, { useState, useEffect, useCallback } from 'react';
import {
  ProductItem,
  CategoryType,
  WebsiteSettings,
  InquiryRecord,
  CustomStyleEditRecord,
} from '../types';
import { PRODUCTS_CATALOG } from '../data/products';
import {
  Sparkles,
  MessageCircle,
  Eye,
  Check,
  Scissors,
  Tag,
  ShoppingBag,
  Plus,
  Minus,
  Copy,
  CheckCircle2,
  Clock,
  RefreshCw,
  CreditCard,
  X,
  Truck,
  Palette,
  Ruler,
  Layers,
  Image as ImageIcon,
  Edit3,
  Upload,
  RotateCcw,
  FileText,
} from 'lucide-react';
import {
  LAYMAN_SIZE_GUIDE,
  LAYMAN_COLOR_GUIDE,
  findLaymanSizeOption,
  findLaymanColorOption,
} from '../constants/assets';
import {
  sendWhatsAppWithDirectOrderImage,
  copyRealOrderImageToClipboard,
} from '../utils/whatsappImageShare';

interface CollectionsShowcaseProps {
  onAskTessyAboutProduct: (productName: string) => void;
  onOpenBespokeWithCategory: (category: string) => void;
  products?: ProductItem[];
  settings?: WebsiteSettings;
  onOrderCreated?: () => void;
  onOrderSubmitted?: () => void;
  customStyleEdits?: Record<string, CustomStyleEditRecord>;
}

const NIGERIAN_STATES = [
  'Lagos', 'FCT - Abuja', 'Rivers', 'Delta', 'Oyo', 'Kano', 'Kaduna', 'Enugu', 'Anambra',
  'Edo', 'Ogun', 'Ondo', 'Osun', 'Kwara', 'Benue', 'Plateau', 'Cross River', 'Akwa Ibom',
  'Imo', 'Abia', 'Ebonyi', 'Kogi', 'Nasarawa', 'Niger', 'Bauchi', 'Gombe', 'Adamawa',
  'Taraba', 'Borno', 'Yobe', 'Jigawa', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara', 'Ekiti',
  'Bayelsa', 'International Shipping'
];

const SIZE_OPTIONS = [
  'S (UK 8)',
  'M (UK 10)',
  'L (UK 12)',
  'XL (UK 14)',
  'XXL (UK 16)',
  '3XL (UK 18+)',
  'Custom Bespoke Fit'
];

const COLOR_PRESETS = [
  'Original As Shown',
  'Royal Gold & Amber',
  'Emerald Green',
  'Ruby Wine Red',
  'Cobalt Royal Blue',
  'Obsidian Black & Gold',
  'Ivory Cream'
];

const LOCAL_STORAGE_ORDERS_KEY = 'hosted_customer_orders_v1';

export const CollectionsShowcase: React.FC<CollectionsShowcaseProps> = ({
  onAskTessyAboutProduct,
  onOpenBespokeWithCategory,
  products,
  settings,
  onOrderCreated,
  onOrderSubmitted,
  customStyleEdits = {},
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Order & Payment Checkout Modal State
  const [orderingProduct, setOrderingProduct] = useState<ProductItem | null>(null);
  const [orderSize, setOrderSize] = useState<string>('M (UK 10)');
  const [orderColor, setOrderColor] = useState<string>('Original As Shown');
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>(() => localStorage.getItem('hosted_recognized_name') || '');
  const [customerPhone, setCustomerPhone] = useState<string>(() => localStorage.getItem('hosted_saved_phone') || '');
  const [deliveryState, setDeliveryState] = useState<string>('Lagos');
  const [deliveryCity, setDeliveryCity] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string>('');

  // Custom Style Details & Reference Image Styling inside Collections Order Modal
  const [orderCustomStyleName, setOrderCustomStyleName] = useState<string>('');
  const [orderCustomStyleDesc, setOrderCustomStyleDesc] = useState<string>('');
  const [orderRefImageUrl, setOrderRefImageUrl] = useState<string>('');
  const [orderRefImageNotes, setOrderRefImageNotes] = useState<string>('');
  const [orderRefUrlInput, setOrderRefUrlInput] = useState<string>('');
  const [showOrderStyleEditor, setShowOrderStyleEditor] = useState<boolean>(false);
  const [showOrderStyleConfirmPrompt, setShowOrderStyleConfirmPrompt] = useState<boolean>(false);
  const [isSavingPermanentStyle, setIsSavingPermanentStyle] = useState<boolean>(false);
  const [permanentStyleSavedBanner, setPermanentStyleSavedBanner] = useState<string>('');
  const orderRefFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Active Order in Modal (once created or opened from tracker)
  const [activePlacedOrder, setActivePlacedOrder] = useState<
    (InquiryRecord & { isPaymentConfirmed?: boolean }) | null
  >(null);
  const [addMoreQty, setAddMoreQty] = useState<number>(1);
  const [isAddingMore, setIsAddingMore] = useState<boolean>(false);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string>('');
  const [whatsappImageNotice, setWhatsappImageNotice] = useState<string>('');
  const [copiedOrderPhotoId, setCopiedOrderPhotoId] = useState<string | null>(null);
  const [isSendingWhatsAppImage, setIsSendingWhatsAppImage] = useState<boolean>(false);

  // Customer's tracked orders (persisted in localStorage & synced live with backend)
  const [trackedOrderIds, setTrackedOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [trackedOrders, setTrackedOrders] = useState<
    Array<InquiryRecord & { isPaymentConfirmed?: boolean }>
  >([]);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState<boolean>(false);
  const [showTrackedOrdersPanel, setShowTrackedOrdersPanel] = useState<boolean>(false);

  const rawCatalog = products !== undefined ? products : PRODUCTS_CATALOG;
  const catalog = rawCatalog.map((item) => {
    const savedEdit = customStyleEdits?.[item.id];
    if (!savedEdit) return item;
    return {
      ...item,
      name: savedEdit.customStyleName || item.name,
      description: savedEdit.customStyleDescription || item.description,
      imageUrl: savedEdit.referenceImageUrl || item.imageUrl,
    };
  });

  const categories: { key: CategoryType; label: string }[] = [
    { key: 'all', label: 'All Designs' },
    { key: 'materials', label: 'Materials' },
    { key: 'everyday', label: 'Everyday Wears' },
    { key: 'skirt_blouse', label: 'Skirt & Blouse' },
    { key: 'ankara_gowns', label: 'Ankara Gowns' },
    { key: 'bubu_gowns', label: 'Bubu Gowns' },
    { key: 'chic_casual', label: 'Chic Casual' },
    { key: 'bespoke', label: 'Bespoke Sets' },
  ];

  const materialsProducts = catalog.filter((p) => p.category === 'materials');

  const filteredProducts =
    activeCategory === 'all' ? catalog : catalog.filter((p) => p.category === activeCategory);

  const formatNgn = (val: number = 0) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Resolve full absolute image URL so WhatsApp includes the specific order image link
  const getAbsoluteImageUrl = (imgUrl?: string) => {
    if (!imgUrl) return '';
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
    if (imgUrl.startsWith('data:')) return `${window.location.origin}/#collections`;
    try {
      return new URL(imgUrl, window.location.origin).href;
    } catch {
      return imgUrl;
    }
  };

  // Poll live status of customer's placed orders
  const fetchTrackedOrdersStatus = useCallback(
    async (idsToFetch: string[] = trackedOrderIds) => {
      if (!idsToFetch || idsToFetch.length === 0) {
        setTrackedOrders([]);
        return;
      }
      setIsRefreshingStatus(true);
      try {
        const res = await fetch(
          `/api/orders/status?ids=${encodeURIComponent(idsToFetch.join(','))}`,
          { headers: { Accept: 'application/json' } }
        );
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data.orders)) {
            setTrackedOrders(data.orders);
            setActivePlacedOrder((prev) => {
              if (!prev) return null;
              const updated = data.orders.find((o: any) => o.id === prev.id);
              return updated || prev;
            });
          }
        }
      } catch {
        // Silently ignore transient network or dev-server restart HTML responses
      } finally {
        setIsRefreshingStatus(false);
      }
    },
    [trackedOrderIds]
  );

  useEffect(() => {
    if (trackedOrderIds.length > 0) {
      fetchTrackedOrdersStatus(trackedOrderIds);
      const interval = setInterval(() => {
        fetchTrackedOrdersStatus(trackedOrderIds);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [trackedOrderIds, fetchTrackedOrdersStatus]);

  // Open Order Modal for a specific product (Step 1: Size, Color, Quantity before payment)
  const handleStartOrder = (product: ProductItem) => {
    const savedEdit = customStyleEdits?.[product.id];
    setSelectedProduct(null);
    setOrderingProduct(product);
    setActivePlacedOrder(null);
    setOrderSize('M (UK 10)');
    setOrderColor('Original As Shown');
    setOrderQuantity(1);
    setOrderCustomStyleName(savedEdit?.customStyleName || '');
    setOrderCustomStyleDesc(savedEdit?.customStyleDescription || '');
    setOrderRefImageUrl(savedEdit?.referenceImageUrl || '');
    setOrderRefImageNotes(savedEdit?.referenceImageNotes || '');
    setOrderRefUrlInput('');
    setShowOrderStyleEditor(false);
    setShowOrderStyleConfirmPrompt(false);
    setPermanentStyleSavedBanner('');
    setOrderError('');
    setStatusNotice('');
  };

  // Confirm & Permanently Save Style/Image Edit across Backend & Frontend
  const handleConfirmPermanentOrderStyleEdit = async () => {
    if (!orderingProduct) return;
    setIsSavingPermanentStyle(true);
    try {
      const effectiveName = orderCustomStyleName.trim() || orderingProduct.name;
      const effectiveDesc = orderCustomStyleDesc.trim() || orderingProduct.description;
      const effectiveImg = orderRefImageUrl.trim() || orderingProduct.imageUrl;

      const res = await fetch('/api/styles/confirm-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleKey: orderingProduct.id,
          productId: orderingProduct.id,
          styleCategory: orderingProduct.categoryLabel,
          customStyleName: effectiveName,
          customStyleDescription: effectiveDesc,
          referenceImageUrl: effectiveImg,
          referenceImageNotes: orderRefImageNotes.trim(),
          isCustomStyleOverride: true,
          updateStorefrontProduct: true,
          actorName: customerName.trim() || 'Confirmed Client Edit',
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
        setOrderingProduct((prev) =>
          prev
            ? {
                ...prev,
                name: effectiveName,
                description: effectiveDesc,
                imageUrl: effectiveImg,
              }
            : prev
        );
        setShowOrderStyleConfirmPrompt(false);
        setPermanentStyleSavedBanner(
          'Confirmed & Saved Permanently! Your edited style details and reference image are now saved across the entire webpage and backend.'
        );
        if (onOrderSubmitted) onOrderSubmitted();
        if (onOrderCreated) onOrderCreated();
      }
    } catch (err) {
      console.error('Failed to permanently save style edit:', err);
    } finally {
      setIsSavingPermanentStyle(false);
    }
  };

  const handleUploadOrderRefImage = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setOrderRefImageUrl(canvas.toDataURL('image/jpeg', 0.84));
        } else {
          setOrderRefImageUrl(rawDataUrl);
        }
      };
      img.onerror = () => setOrderRefImageUrl(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Submit Order & Display Payment Details
  const handleCreateOrderAndShowPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderingProduct) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      setOrderError('Please enter your Full Name and WhatsApp Phone Number.');
      return;
    }
    if (!orderSize.trim() || !orderColor.trim() || orderQuantity < 1) {
      setOrderError('Please specify your Size, Color, and Number of Items before payment.');
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError('');

    const unitPrice = Number(orderingProduct.priceNgn) || 0;
    const totalAmount = unitPrice * orderQuantity;
    const effectiveOrderStyleName = orderCustomStyleName.trim() || orderingProduct.name;
    const effectiveOrderDesc = orderCustomStyleDesc.trim() || orderingProduct.description;
    const effectiveOrderImg = orderRefImageUrl.trim() || orderingProduct.imageUrl;

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName.trim(),
          phone: customerPhone.trim(),
          category: `${effectiveOrderStyleName} (${orderingProduct.categoryLabel})`,
          productId: orderingProduct.id,
          productName: effectiveOrderStyleName,
          productImageUrl: effectiveOrderImg,
          customStyleName: effectiveOrderStyleName,
          customStyleDescription: effectiveOrderDesc,
          referenceImageNotes: orderRefImageNotes.trim(),
          isCustomStyleOverride: Boolean(
            orderCustomStyleName.trim() || orderCustomStyleDesc.trim() || orderRefImageUrl.trim()
          ),
          size: orderSize,
          color: orderColor,
          quantity: orderQuantity,
          unitPriceNgn: unitPrice,
          estimatedPriceNgn: totalAmount,
          notes: [
            `Product: ${effectiveOrderStyleName} | Size: ${orderSize} | Color: ${orderColor} | Quantity: ${orderQuantity}`,
            orderCustomStyleDesc.trim() ? `Custom Style Details: ${orderCustomStyleDesc.trim()}` : '',
            orderRefImageNotes.trim() ? `Ref Image Styling: ${orderRefImageNotes.trim()}` : '',
            orderNotes ? `Notes: ${orderNotes}` : '',
          ]
            .filter(Boolean)
            .join(' | '),
          delivery: {
            state: deliveryState,
            city: deliveryCity,
            address: deliveryAddress,
            method: 'Doorstep Courier',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Could not create order. Please check your details and try again.');
      }

      const data = await response.json();
      const createdOrder = {
        ...data.inquiry,
        isPaymentConfirmed: false,
      };

      setActivePlacedOrder(createdOrder);
      setAddMoreQty(1);

      const updatedIds = [
        createdOrder.id,
        ...trackedOrderIds.filter((id) => id !== createdOrder.id),
      ].slice(0, 15);
      setTrackedOrderIds(updatedIds);
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updatedIds));
      fetchTrackedOrdersStatus(updatedIds);

      if (customerName.trim()) localStorage.setItem('hosted_recognized_name', customerName.trim());
      if (customerPhone.trim()) localStorage.setItem('hosted_saved_phone', customerPhone.trim());
      if (onOrderSubmitted) {
        onOrderSubmitted();
      }
      if (onOrderCreated) {
        onOrderCreated();
      }
    } catch (err: any) {
      setOrderError(err.message || 'An error occurred while creating your order.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // "Add More" handler to pay for more numbers of the item on an existing order
  const handleAddMoreItems = async (orderId: string, additionalQty: number = 1) => {
    if (additionalQty < 1) return;
    setIsAddingMore(true);
    setStatusNotice('');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/add-more`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          additionalQuantity: additionalQty,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to add more items to order.');
      }
      const data = await res.json();
      if (data.order) {
        setActivePlacedOrder(data.order);
        setStatusNotice(
          `Added +${additionalQty} more item(s)! New total quantity: ${data.order.quantity} items (${formatNgn(
            data.order.totalAmountNgn
          )}). Please complete payment for the updated quantity.`
        );
        fetchTrackedOrdersStatus(trackedOrderIds);
        if (onOrderCreated) onOrderCreated();
      }
    } catch (err: any) {
      setOrderError(err.message || 'Could not update item quantity.');
    } finally {
      setIsAddingMore(false);
    }
  };

  // Build clean WhatsApp text message (zero image links — the real outfit picture is loaded directly into the WhatsApp message)
  const buildOrderStatusWhatsAppMessageText = (
    order: InquiryRecord & { isPaymentConfirmed?: boolean }
  ) => {
    const totalStr =
      (order.totalAmountNgn || 0) > 0
        ? formatNgn(order.totalAmountNgn)
        : 'Custom Bespoke Quote';
    const locationStr = [order.deliveryAddress, order.deliveryCity, order.deliveryState]
      .filter(Boolean)
      .join(', ');

    return [
      `Hello HOS|TED (HOS|TED Hosting Nations)!`,
      `I am requesting my Order & Payment Confirmation Status for my unverified order (with the real outfit picture attached directly to this message):`,
      ``,
      `• *Order ID:* ${order.id}`,
      `• *Current Status:* ${
        order.isPaymentConfirmed ? 'Payment Confirmed ✓' : 'Unverified — Awaiting Payment Confirmation'
      }`,
      `• *Item Ordered:* ${order.customStyleName || order.productName || order.category}`,
      order.customStyleDescription ? `• *Custom Style Details:* ${order.customStyleDescription}` : '',
      order.referenceImageNotes ? `• *Reference Image Styling:* ${order.referenceImageNotes}` : '',
      `• *Size:* ${order.size || 'Standard'}`,
      `• *Color:* ${order.color || 'As Shown'}`,
      `• *Number of Items (Quantity):* ${order.quantity || 1}`,
      `• *Total Amount:* ${totalStr}`,
      `• *Client Name:* ${order.name} (${order.phone})`,
      locationStr ? `• *Nationwide Delivery:* ${locationStr}` : '',
      ``,
      `Please confirm my payment status for Order *${order.id}*. Thank you!`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const whatsappClean = (settings?.whatsappNumber || '09073784461')
    .replace(/[^0-9]/g, '')
    .replace(/^0/, '234');

  const handleSendWhatsAppWithRealImage = async (
    order: InquiryRecord & { isPaymentConfirmed?: boolean }
  ) => {
    setIsSendingWhatsAppImage(true);
    setWhatsappImageNotice('');
    try {
      const imgUrl = order.productImageUrl || orderingProduct?.imageUrl;
      const prodName = order.productName || order.category || orderingProduct?.name || 'HOS|TED Outfit';
      const result = await sendWhatsAppWithDirectOrderImage({
        whatsappClean,
        messageText: buildOrderStatusWhatsAppMessageText(order),
        imageUrl: imgUrl,
        orderId: order.id,
        productName: prodName,
      });
      setWhatsappImageNotice(result.statusMessage);
    } finally {
      setIsSendingWhatsAppImage(false);
    }
  };

  const handleCopyRealOutfitPhoto = async (
    order: InquiryRecord & { isPaymentConfirmed?: boolean }
  ) => {
    const imgUrl = order.productImageUrl || orderingProduct?.imageUrl;
    const prodName = order.productName || order.category || orderingProduct?.name || 'HOS|TED Outfit';
    const ok = await copyRealOrderImageToClipboard(imgUrl, order.id, prodName);
    if (ok) {
      setCopiedOrderPhotoId(order.id);
      setWhatsappImageNotice(
        'Real outfit picture copied to your clipboard! Simply Paste (Ctrl+V or Paste) directly inside your WhatsApp chat.'
      );
      setTimeout(() => setCopiedOrderPhotoId(null), 3500);
    } else {
      setWhatsappImageNotice(
        'Click "Request Order Status on WhatsApp" to directly load or save the real outfit photo for your WhatsApp message.'
      );
    }
  };

  const bankName = settings?.paymentBankName || 'OPay / Moniepoint / Direct Bank Transfer';
  const accountName = settings?.paymentAccountName || 'Theresa Isama (HOS|TED)';
  const accountNumber = settings?.paymentAccountNumber || '9073784461';
  const paymentInstructions =
    settings?.paymentInstructions ||
    'Transfer your order total using your Order ID as reference, then click "Request Order Status on WhatsApp" below to send your order details and specific product image for confirmation.';

  const copyAccountNumber = () => {
    navigator.clipboard?.writeText(accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  return (
    <section id="collections" className="py-16 sm:py-24 bg-stone-900/60 border-y border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-widest">
            <Tag className="w-3.5 h-3.5" />
            <span>HOS|TED Signature Pieces</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            The HOS|TED Collections
          </h2>
          <p className="text-sm sm:text-base text-stone-300">
            Select any design below to choose your size, color, and number of items, view official HOS|TED payment details, and track your live payment confirmation status.
          </p>
        </div>

        {/* Customer's Active Orders & Live Payment Status Tracker (Cleanly Collapsible) */}
        {trackedOrders.length > 0 && (
          <div className="mt-8 p-4 sm:p-5 rounded-3xl bg-stone-950 border border-amber-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif font-bold text-white text-sm sm:text-base">
                      Your HOS|TED Orders & Live Payment Status
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                      {trackedOrders.length} Active Order{trackedOrders.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400">
                    Track your live payment confirmation status, view bank details, or add more items.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchTrackedOrdersStatus(trackedOrderIds)}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setShowTrackedOrdersPanel(!showTrackedOrdersPanel)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition"
                >
                  {showTrackedOrdersPanel ? 'Hide Orders' : `View Orders (${trackedOrders.length})`}
                </button>
              </div>
            </div>

            {showTrackedOrdersPanel && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-800">
              {trackedOrders.map((ord) => {
                const isConfirmed = Boolean(ord.isPaymentConfirmed);
                return (
                  <div
                    key={ord.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 ${
                      isConfirmed
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-stone-900/90 border-amber-500/30'
                    }`}
                  >
                    <div className="flex gap-3.5 items-start">
                      {ord.productImageUrl && (
                        <img
                          src={ord.productImageUrl}
                          alt={ord.productName || ord.category}
                          className="w-20 h-24 rounded-xl object-cover border border-stone-700 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                            {ord.id}
                          </span>
                          {isConfirmed ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Payment Confirmed</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 animate-pulse" />
                              <span>Unverified · Pending Confirmation</span>
                            </span>
                          )}
                        </div>

                        <div className="font-serif font-bold text-white text-sm truncate">
                          {ord.productName || ord.category}
                        </div>

                        <div className="text-stone-300 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>Size: <strong className="text-white">{ord.size || 'Standard'}</strong></span>
                          <span>Color: <strong className="text-white">{ord.color || 'As Shown'}</strong></span>
                          <span>Qty: <strong className="text-amber-400">{ord.quantity || 1} item(s)</strong></span>
                        </div>

                        <div className="text-amber-400 font-mono font-bold text-sm pt-0.5">
                          Total: {formatNgn(ord.totalAmountNgn || 0)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800">
                      {/* View Payment Details & Order Modal */}
                      <button
                        onClick={() => {
                          const matchedProd =
                            catalog.find((p) => p.id === ord.productId) ||
                            catalog.find((p) => p.name === ord.productName) ||
                            catalog[0];
                          if (matchedProd) setOrderingProduct(matchedProd);
                          setActivePlacedOrder(ord);
                          setStatusNotice('');
                        }}
                        className="px-3 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        <span>Payment Details</span>
                      </button>

                      {/* Add More Button to pay for more numbers of it */}
                      <button
                        onClick={() => {
                          const matchedProd =
                            catalog.find((p) => p.id === ord.productId) ||
                            catalog.find((p) => p.name === ord.productName) ||
                            catalog[0];
                          if (matchedProd) setOrderingProduct(matchedProd);
                          setActivePlacedOrder(ord);
                          handleAddMoreItems(ord.id, 1);
                        }}
                        disabled={isAddingMore}
                        className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add More (+1)</span>
                      </button>

                      {/* Request Order Status on WhatsApp (Active until Payment Confirmed — Sends Real Image, No Links) */}
                      {!isConfirmed ? (
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppWithRealImage(ord)}
                          disabled={isSendingWhatsAppImage}
                          className="flex-1 min-w-[180px] py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition disabled:opacity-60"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-stone-950" />
                          <span>Send Real Photo & Status Request on WhatsApp</span>
                        </button>
                      ) : (
                        <div className="flex-1 text-right text-[11px] text-emerald-400 font-semibold">
                          ✓ Payment Verified by HOS|TED Atelier
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* Filter Categories Pills */}
        <div className="mt-8 sm:mt-12 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat.key
                  ? 'bg-amber-400 text-stone-950 font-semibold shadow-md shadow-amber-400/20'
                  : 'bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="mt-10 py-14 text-center rounded-3xl bg-stone-950 border border-stone-800 text-stone-400 text-sm">
            No products currently listed in this category.
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-stone-950 rounded-3xl overflow-hidden border border-stone-800/90 hover:border-amber-500/50 transition-all duration-300 flex flex-col shadow-xl"
              >
                {/* Image Frame */}
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-900">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* Badges */}
                  <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5">
                    <span className="px-3 py-1 rounded-full bg-stone-950/80 backdrop-blur-md border border-stone-700 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                      {product.categoryLabel}
                    </span>
                    {product.isPopular && (
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-stone-950 text-[10px] font-bold uppercase tracking-wider shadow">
                        Most Loved
                      </span>
                    )}
                  </div>

                  {/* Quick View Button */}
                  <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="px-4 py-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-900 text-white text-xs font-semibold flex items-center gap-2 border border-stone-700 backdrop-blur-sm transition transform translate-y-2 group-hover:translate-y-0"
                    >
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>View HOS|TED Specs</span>
                    </button>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif font-bold text-lg text-white group-hover:text-amber-300 transition">
                        {product.name}
                      </h3>
                    </div>

                    <p className="mt-2 text-xs text-stone-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs text-stone-300">
                      <span className="text-stone-500 font-medium">Fabric:</span>
                      <span className="truncate">{product.fabric}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-800/80 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-stone-400">Tailoring Price</span>
                        <div className="text-lg font-serif font-bold text-amber-400">
                          {formatNgn(product.priceNgn)}
                        </div>
                      </div>
                      <span className="text-[11px] text-amber-300/90 bg-stone-900 px-2.5 py-1 rounded-md border border-stone-800">
                        Nationwide Delivery
                      </span>
                    </div>

                    {/* Dual Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onAskTessyAboutProduct(product.name)}
                        className="w-full py-2.5 px-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tessy Ai</span>
                      </button>

                      <button
                        onClick={() => handleStartOrder(product)}
                        className="w-full py-2.5 px-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-md"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Order Now</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Dedicated Materials Section inside Shop & Collections */}
        {materialsProducts.length > 0 && activeCategory === 'all' && (
          <div id="materials" className="mt-16 pt-12 border-t border-stone-800/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-widest">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Shop &amp; Collections • Materials</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  Materials — Authentic Fabrics &amp; Couture Bundles
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 max-w-2xl">
                  Order Grade-A 100% Cotton Ankara Wax bundles, Imperial Silk Damask &amp; Jacquard, or Bridal Duchess Satin &amp; Lace materials directly—for nationwide delivery or paired with HOS|TED bespoke tailoring.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCategory('materials')}
                className="px-4 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider shrink-0 transition"
              >
                View Only Materials ({materialsProducts.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {materialsProducts.map((mat) => (
                <div
                  key={`mat-sec-${mat.id}`}
                  className="bg-stone-950 rounded-3xl overflow-hidden border border-amber-500/30 hover:border-amber-400 transition-all duration-300 flex flex-col shadow-xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-stone-900">
                    <img
                      src={mat.imageUrl}
                      alt={mat.name}
                      className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-[10px] font-bold uppercase tracking-wider shadow">
                        Materials
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-serif font-bold text-base text-white">{mat.name}</h4>
                      <p className="mt-1.5 text-xs text-stone-400 line-clamp-2">{mat.description}</p>
                      <div className="mt-2.5 text-[11px] text-amber-300 font-medium">
                        Material Spec: {mat.fabric}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                      <div className="text-base font-serif font-bold text-amber-400">
                        {formatNgn(mat.priceNgn)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onAskTessyAboutProduct(mat.name)}
                          className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Tessy Ai</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartOrder(mat)}
                          className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Order Material</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Tailoring Banner */}
        <div className="mt-14 rounded-3xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-950 border border-amber-500/30 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              HOS|TED Hosting Nations • Custom Design
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Bespoke Made-to-Measure Tailoring
            </h3>
            <p className="text-sm text-stone-300 max-w-xl">
              Bring your own Ankara or choose from the HOS|TED premium fabric vault. We take your exact measurements and deliver nationwide across Nigeria and internationally.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => onOpenBespokeWithCategory('Bespoke Custom Gown')}
              className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
            >
              <Scissors className="w-4 h-4" />
              <span>Submit Measurements</span>
            </button>
          </div>
        </div>

      </div>

      {/* Product Quick-View Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="aspect-[3/4] sm:aspect-auto bg-stone-900">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    {selectedProduct.categoryLabel} · HOS|TED
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mt-1">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-lg font-serif font-bold text-amber-400 mt-2">
                    {formatNgn(selectedProduct.priceNgn)}
                  </p>

                  <p className="text-xs text-stone-300 mt-4 leading-relaxed">
                    {selectedProduct.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    <span className="text-xs font-semibold text-stone-200">Signature Highlights:</span>
                    <ul className="space-y-1.5 text-xs text-stone-400">
                      {(selectedProduct.features || []).map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800 space-y-2">
                  <button
                    onClick={() => handleStartOrder(selectedProduct)}
                    className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Order & View Payment Details</span>
                  </button>

                  <button
                    onClick={() => {
                      const name = selectedProduct.name;
                      setSelectedProduct(null);
                      onAskTessyAboutProduct(name);
                    }}
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-semibold border border-stone-800 flex items-center justify-center gap-2 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tessy Ai — Style Advice</span>
                  </button>

                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="w-full py-2.5 rounded-xl bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <X className="w-4 h-4" />
                    <span>Close Preview</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOS|TED ORDER, SIZE/COLOR/QUANTITY & PAYMENT CONFIRMATION MODAL */}
      {orderingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="relative w-full max-w-3xl bg-stone-950 border-2 border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl my-auto max-h-[94vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-serif font-bold text-white text-base sm:text-lg">
                    {activePlacedOrder
                      ? `HOS|TED Order ${activePlacedOrder.id} — Payment & Status`
                      : `Order HOS|TED Piece — Select Size, Color & Quantity`}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    HOS|TED Hosting Nations · Nationwide Delivery · Official Payment Desk
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOrderingProduct(null);
                  setActivePlacedOrder(null);
                }}
                className="p-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 transition shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
              
              {/* STEP 1: SELECT SIZE, COLOR, QUANTITY & DELIVERY BEFORE PAYMENT */}
              {!activePlacedOrder ? (
                <form onSubmit={handleCreateOrderAndShowPayment} className="space-y-6">
                  
                  {/* Selected Product Summary with Editable Reference Image Styling & Custom Style Details */}
                  <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="relative shrink-0">
                        <img
                          src={orderRefImageUrl || orderingProduct.imageUrl}
                          alt={orderCustomStyleName || orderingProduct.name}
                          className="w-24 h-28 rounded-xl object-cover border-2 border-amber-500/40"
                        />
                        {orderRefImageUrl && (
                          <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-stone-950 font-bold text-[9px] uppercase shadow">
                            Custom Ref
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowOrderStyleEditor(!showOrderStyleEditor)}
                          className="mt-1.5 w-full py-1 px-2 rounded-lg bg-stone-950 hover:bg-stone-800 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Image</span>
                        </button>
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-1">
                        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                            {orderingProduct.categoryLabel}
                          </span>
                          {(orderCustomStyleName || orderCustomStyleDesc || orderRefImageUrl) && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase">
                              Customized by You
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-serif font-bold text-white">
                          {orderCustomStyleName || orderingProduct.name}
                        </h4>
                        <p className="text-xs text-stone-300 line-clamp-2">
                          {orderCustomStyleDesc || orderingProduct.description}
                        </p>
                        {orderRefImageNotes && (
                          <p className="text-[11px] text-emerald-300">
                            <strong>Ref Image Styling:</strong> {orderRefImageNotes}
                          </p>
                        )}
                        <div className="pt-1 flex items-center justify-center sm:justify-start gap-4 flex-wrap">
                          <div>
                            <span className="text-[11px] text-stone-400 block">Unit Price</span>
                            <span className="text-base font-serif font-bold text-amber-400">
                              {formatNgn(orderingProduct.priceNgn)}
                            </span>
                          </div>
                          <div className="h-7 w-px bg-stone-800" />
                          <div>
                            <span className="text-[11px] text-stone-400 block">
                              Total ({orderQuantity} {orderQuantity === 1 ? 'Item' : 'Items'})
                            </span>
                            <span className="text-lg font-serif font-bold text-emerald-400">
                              {formatNgn((orderingProduct.priceNgn || 0) * orderQuantity)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowOrderStyleEditor(!showOrderStyleEditor)}
                            className="ml-auto px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>
                              {showOrderStyleEditor
                                ? 'Close Style & Image Editor'
                                : 'Customize Style Details / Reference Image'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <input
                      ref={orderRefFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadOrderRefImage}
                      className="hidden"
                    />

                    {showOrderStyleEditor && (
                      <div className="pt-3 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-stone-950 border border-amber-500/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-amber-400 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Edit Image (Add Reference Image Styling)</span>
                            </span>
                            {orderRefImageUrl && (
                              <button
                                type="button"
                                onClick={() => setOrderRefImageUrl('')}
                                className="text-[10px] text-stone-400 hover:text-rose-400 flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset</span>
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => orderRefFileInputRef.current?.click()}
                            className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Reference Styling Photo</span>
                          </button>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="url"
                              value={orderRefUrlInput}
                              onChange={(e) => setOrderRefUrlInput(e.target.value)}
                              placeholder="Or paste reference image URL..."
                              className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (orderRefUrlInput.trim()) {
                                  setOrderRefImageUrl(orderRefUrlInput.trim());
                                  setOrderRefUrlInput('');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-stone-800 text-amber-300 font-semibold"
                            >
                              Apply
                            </button>
                          </div>
                          <input
                            type="text"
                            value={orderRefImageNotes}
                            onChange={(e) => setOrderRefImageNotes(e.target.value)}
                            placeholder="Reference image styling notes (e.g. neckline/sleeve changes)..."
                            className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>

                        <div className="p-3 rounded-xl bg-stone-950 border border-amber-500/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-serif font-bold text-amber-400 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Edit Style Name & Description</span>
                            </span>
                            {(orderCustomStyleName || orderCustomStyleDesc) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOrderCustomStyleName('');
                                  setOrderCustomStyleDesc('');
                                }}
                                className="text-[10px] text-stone-400 hover:text-rose-400 flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset</span>
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={orderCustomStyleName}
                            onChange={(e) => setOrderCustomStyleName(e.target.value)}
                            placeholder={`Custom Style Name (Default: ${orderingProduct.name})`}
                            className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-white"
                          />
                          <textarea
                            rows={3}
                            value={orderCustomStyleDesc}
                            onChange={(e) => setOrderCustomStyleDesc(e.target.value)}
                            placeholder={`Customize style details/description if you don't want the exact style provided (Default: ${orderingProduct.description})`}
                            className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>

                        {/* Confirm & Permanently Save Style & Image Edits Bar */}
                        <div className="sm:col-span-2 p-3 rounded-xl bg-stone-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="text-[11px] text-stone-300">
                            <strong className="text-emerald-400">Make Edits Permanent:</strong> Confirm your edited style name, description, and reference image so they stay permanently across the webpage and backend.
                          </div>
                          {!showOrderStyleConfirmPrompt ? (
                            <button
                              type="button"
                              onClick={() => setShowOrderStyleConfirmPrompt(true)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm & Save Edit Permanently</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setShowOrderStyleConfirmPrompt(false)}
                                className="px-2.5 py-1.5 rounded-lg bg-stone-900 text-stone-300 text-xs border border-stone-700"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSavingPermanentStyle}
                                onClick={handleConfirmPermanentOrderStyleEdit}
                                className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isSavingPermanentStyle ? 'Saving...' : 'Yes, Confirm Permanent Save'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {permanentStyleSavedBanner && (
                          <div className="sm:col-span-2 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                            <span>{permanentStyleSavedBanner}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {orderError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                      {orderError}
                    </div>
                  )}

                  {/* 1. Size, Color & Number of Items (Required Before Payment) */}
                  <div className="p-5 rounded-2xl bg-stone-900/90 border border-amber-500/30 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      <span>Step 1: Choose Size, Color & Number of Items</span>
                    </h5>

                    {/* Layman-Friendly Size Selection */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-amber-400" />
                        <span>Select Size (Easy Everyday Fit Guide) *</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {LAYMAN_SIZE_GUIDE.map((sz) => {
                          const isSelected = orderSize === sz.value || orderSize === sz.shortLabel;
                          return (
                            <button
                              type="button"
                              key={sz.value}
                              onClick={() => setOrderSize(sz.value)}
                              className={`text-left p-2.5 rounded-xl text-xs border transition ${
                                isSelected
                                  ? 'bg-amber-400/15 text-white border-amber-400 font-bold shadow'
                                  : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-600'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
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
                      {findLaymanSizeOption(orderSize) && (
                        <div className="p-2.5 rounded-xl bg-stone-950 border border-amber-500/30 text-[11px] text-stone-300">
                          <strong className="text-amber-400">Easy Size Meaning:</strong>{' '}
                          {findLaymanSizeOption(orderSize)?.bodyDescription}
                        </div>
                      )}
                    </div>

                    {/* Layman-Friendly Visual Color Swatches */}
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-amber-400" />
                        <span>Select Color (Tap Visual Swatch or Type Your Own) *</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {LAYMAN_COLOR_GUIDE.map((clr) => {
                          const isSelected = orderColor === clr.value || orderColor === clr.simpleName;
                          return (
                            <button
                              type="button"
                              key={clr.value}
                              onClick={() => setOrderColor(clr.value)}
                              className={`flex items-center gap-2 p-2 rounded-xl text-xs border text-left transition ${
                                isSelected
                                  ? 'bg-amber-400/15 text-white border-amber-400 font-bold'
                                  : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-600'
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
                      {findLaymanColorOption(orderColor) && (
                        <div className="text-[11px] text-amber-300">
                          Selected Color: <strong>{findLaymanColorOption(orderColor)?.simpleName}</strong> —{' '}
                          {findLaymanColorOption(orderColor)?.description}
                        </div>
                      )}
                      <input
                        type="text"
                        value={orderColor}
                        onChange={(e) => setOrderColor(e.target.value)}
                        placeholder="Or type your preferred color in simple everyday words..."
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Number of Items (Quantity) + Add More Button */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-800">
                      <div>
                        <label className="block text-xs font-semibold text-stone-200">
                          Number of Items (Quantity) *
                        </label>
                        <p className="text-[11px] text-stone-400">
                          Use the controls or click "Add More" to order multiple pieces.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setOrderQuantity((q) => Math.max(1, q - 1))}
                          className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 text-white transition"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={orderQuantity}
                          onChange={(e) =>
                            setOrderQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                          }
                          className="w-16 text-center bg-stone-950 border border-amber-500/40 rounded-xl py-2 text-sm font-mono font-bold text-amber-400"
                        />
                        <button
                          type="button"
                          onClick={() => setOrderQuantity((q) => q + 1)}
                          className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1 transition shadow"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add More</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Customer Contact & Nationwide Delivery Details */}
                  <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <span>Step 2: Your Contact & Nationwide Delivery Details</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-stone-300 font-semibold mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Adaeze Nwosu"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-300 font-semibold mb-1">
                          WhatsApp Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. 0803 000 0000"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-stone-300 font-semibold mb-1">
                          Delivery State (Nationwide) *
                        </label>
                        <select
                          value={deliveryState}
                          onChange={(e) => setDeliveryState(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                        >
                          {NIGERIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-stone-300 font-semibold mb-1">City / Town</label>
                        <input
                          type="text"
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          placeholder="e.g. Lekki, Wuse, Makurdi"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block text-stone-300 font-semibold mb-1">
                        Delivery Street Address
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="House number, street name, and landmark for courier delivery"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="text-xs">
                      <label className="block text-stone-300 font-semibold mb-1">
                        Additional Styling or Measurement Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Any custom length, sleeve preference, or event date..."
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Submit to View Payment Details */}
                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-400/20 transition disabled:opacity-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isSubmittingOrder
                        ? 'Preparing Your Order & Payment Details...'
                        : `Proceed to Payment Details (${formatNgn(
                            (orderingProduct.priceNgn || 0) * orderQuantity
                          )})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderingProduct(null);
                      setActivePlacedOrder(null);
                    }}
                    className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <span>Cancel</span>
                  </button>
                </form>
              ) : (
                /* STEP 2: PAYMENT DETAILS + SPECIFIC ORDER IMAGE + ADD MORE + REQUEST ORDER STATUS ON WHATSAPP */
                <div className="space-y-6">
                  
                  {/* Live Order Status Banner (Unverified vs Payment Confirmed) */}
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      activePlacedOrder.isPaymentConfirmed
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                        : 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {activePlacedOrder.isPaymentConfirmed ? (
                        <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="w-7 h-7 text-amber-400 animate-pulse shrink-0" />
                      )}
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-widest">
                          Order ID: {activePlacedOrder.id}
                        </div>
                        <h4 className="font-serif font-bold text-lg text-white">
                          {activePlacedOrder.isPaymentConfirmed
                            ? 'Status: Payment Confirmed ✓'
                            : 'Status: Unverified Order — Pending Payment Confirmation'}
                        </h4>
                        <p className="text-xs text-stone-300 mt-0.5">
                          {activePlacedOrder.isPaymentConfirmed
                            ? 'Your payment has been confirmed by HOS|TED! Your order is now in production.'
                            : 'Complete your transfer below and click "Request Order Status on WhatsApp" to send your order details and specific order image until your status displays Payment Confirmed.'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchTrackedOrdersStatus(trackedOrderIds)}
                      className="px-3.5 py-2 rounded-xl bg-stone-950 hover:bg-stone-900 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center shrink-0"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 text-amber-400 ${
                          isRefreshingStatus ? 'animate-spin' : ''
                        }`}
                      />
                      <span>Check Status</span>
                    </button>
                  </div>

                  {statusNotice && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                      {statusNotice}
                    </div>
                  )}

                  {/* Specific Order Summary Card with Specific Order Image & "Add More" Button */}
                  <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <img
                        src={activePlacedOrder.productImageUrl || orderingProduct.imageUrl}
                        alt={activePlacedOrder.productName || orderingProduct.name}
                        className="w-28 h-32 rounded-2xl object-cover border-2 border-amber-400 shrink-0 shadow-lg"
                      />
                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                          Specific Order Image Attached · {activePlacedOrder.id}
                        </div>
                        <h4 className="font-serif font-bold text-white text-xl">
                          {activePlacedOrder.productName || orderingProduct.name}
                        </h4>

                        <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                            <span className="text-[10px] uppercase text-stone-400 block">Size</span>
                            <span className="font-bold text-white">
                              {activePlacedOrder.size || orderSize}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800">
                            <span className="text-[10px] uppercase text-stone-400 block">Color</span>
                            <span className="font-bold text-white">
                              {activePlacedOrder.color || orderColor}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-stone-950 border border-amber-500/30">
                            <span className="text-[10px] uppercase text-amber-400 block">
                              Number of Items
                            </span>
                            <span className="font-mono font-bold text-amber-400 text-sm">
                              {activePlacedOrder.quantity || orderQuantity} Item(s)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* "Add More" Bar to Pay for More Numbers of This Item */}
                    <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-center sm:text-left">
                        <span className="font-bold text-white block">
                          Want to order more pieces of "{activePlacedOrder.productName || orderingProduct.name}"?
                        </span>
                        <span className="text-stone-400">
                          Click <strong>Add More</strong> to increase your quantity and pay for additional numbers of this item.
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl px-2 py-1">
                          <button
                            type="button"
                            onClick={() => setAddMoreQty((q) => Math.max(1, q - 1))}
                            className="p-1 text-stone-400 hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 font-mono font-bold text-xs text-amber-400">
                            +{addMoreQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAddMoreQty((q) => q + 1)}
                            className="p-1 text-stone-400 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isAddingMore}
                          onClick={() => handleAddMoreItems(activePlacedOrder.id, addMoreQty)}
                          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow transition disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            {isAddingMore ? 'Updating...' : `Add More (+${addMoreQty}) to Pay`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Official HOS|TED Payment Details Box */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-stone-900 via-stone-950 to-amber-950/20 border-2 border-amber-500/40 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-amber-400" />
                        <h5 className="font-serif font-bold text-white text-base">
                          HOS|TED Official Payment Details
                        </h5>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
                        Amount Due: {formatNgn(activePlacedOrder.totalAmountNgn || 0)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                        <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                          Bank / Transfer Channel
                        </span>
                        <span className="font-bold text-white text-sm mt-1 block">{bankName}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800">
                        <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                          Account Name
                        </span>
                        <span className="font-bold text-white text-sm mt-1 block">
                          {accountName}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-stone-950 border border-amber-500/40 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-amber-400 block">
                            Account Number
                          </span>
                          <span className="font-mono font-bold text-amber-300 text-base mt-0.5 block">
                            {accountNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={copyAccountNumber}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedAccount ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed">{paymentInstructions}</p>
                  </div>

                  {/* Request Order Status on WhatsApp Button (Directly Loads Real Outfit Picture into WhatsApp — No Image Links) */}
                  {!activePlacedOrder.isPaymentConfirmed ? (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppWithRealImage(activePlacedOrder)}
                          disabled={isSendingWhatsAppImage}
                          className="flex-1 py-4 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 transition disabled:opacity-60"
                        >
                          <MessageCircle className="w-5 h-5 fill-stone-950" />
                          <span>
                            {isSendingWhatsAppImage
                              ? 'Loading Real Outfit Picture into WhatsApp...'
                              : 'Request Order Status on WhatsApp (Loads Real Outfit Picture Directly)'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyRealOutfitPhoto(activePlacedOrder)}
                          className="py-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition shrink-0"
                          title="Copy the real outfit image to paste directly into WhatsApp"
                        >
                          <ImageIcon className="w-4 h-4 text-amber-400" />
                          <span>
                            {copiedOrderPhotoId === activePlacedOrder.id
                              ? 'Real Photo Copied ✓'
                              : 'Copy Real Photo'}
                          </span>
                        </button>
                      </div>

                      {whatsappImageNotice && (
                        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center">
                          {whatsappImageNotice}
                        </div>
                      )}

                      <p className="text-[11px] text-center text-stone-400">
                        Directly loads the <strong>real outfit picture</strong> (no image links!) along with Order ID (<strong>{activePlacedOrder.id}</strong>), Size (<strong>{activePlacedOrder.size}</strong>), Color (<strong>{activePlacedOrder.color}</strong>), and Quantity (<strong>{activePlacedOrder.quantity}</strong>) into your WhatsApp message to HOS|TED. On desktop, the real image is also copied to your clipboard so you can simply press <strong>Paste (Ctrl+V)</strong> in WhatsApp.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-2">
                      <div className="text-emerald-300 font-bold text-sm flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Payment Confirmed for Order {activePlacedOrder.id}!</span>
                      </div>
                      <p className="text-xs text-stone-300">
                        Need more of this item? Use the <strong>Add More</strong> button above anytime to order additional quantities.
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-stone-800">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderingProduct(null);
                        setActivePlacedOrder(null);
                      }}
                      className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
                    >
                      <span>Done / Close</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </section>
  );
};
