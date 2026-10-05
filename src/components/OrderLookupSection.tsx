import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Scissors,
  Truck,
  Sparkles,
  RefreshCw,
  MessageCircle,
  CreditCard,
  Plus,
  Copy,
  Check,
  MapPin,
  AlertCircle,
  ShieldCheck,
  History,
  Ruler,
  User,
  ArrowRight,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import { InquiryRecord, WebsiteSettings, AuditLogEntry } from '../types';
import { ASSETS } from '../constants/assets';
import { OrderDeliveryMapTracker } from './OrderDeliveryMapTracker';
import { ActiveFrontendUser } from './UserAuthOnboardingModal';
import {
  sendWhatsAppWithDirectOrderImage,
  copyRealOrderImageToClipboard,
} from '../utils/whatsappImageShare';

interface OrderLookupSectionProps {
  settings?: WebsiteSettings;
  onOrderUpdated?: () => void;
  activeUser?: ActiveFrontendUser | null;
  onOpenUserAuth?: () => void;
  onRequestCustomTailoring?: (category: string) => void;
}

interface LookupOrderRecord extends InquiryRecord {
  isPaymentConfirmed?: boolean;
  timeline?: AuditLogEntry[];
}

const LOCAL_ORDERS_STORAGE_KEY = 'hosted_customer_order_ids';

const FULFILLMENT_STAGES = [
  {
    key: 'placed',
    label: 'Pending Payment',
    sublabel: 'Order logged, awaiting verification',
    icon: Clock,
  },
  {
    key: 'processing',
    label: 'Processing',
    sublabel: 'Payment Confirmed & fabric queued',
    icon: ShieldCheck,
  },
  {
    key: 'tailoring',
    label: 'Tailoring',
    sublabel: 'Bespoke cutting & stitching in atelier',
    icon: Scissors,
  },
  {
    key: 'fitting',
    label: 'Ready for Fitting',
    sublabel: 'Final pressing & quality inspection',
    icon: Sparkles,
  },
  {
    key: 'shipped',
    label: 'Shipped',
    sublabel: 'Dispatched for nationwide delivery',
    icon: Truck,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    sublabel: 'Completed & received by client',
    icon: CheckCircle2,
  },
];

export const OrderLookupSection: React.FC<OrderLookupSectionProps> = ({
  settings,
  onOrderUpdated,
  activeUser = null,
  onOpenUserAuth,
  onRequestCustomTailoring,
}) => {
  const [activeTab, setActiveTab] = useState<'lookup' | 'past_orders'>('lookup');
  const [searchInput, setSearchInput] = useState('');
  const [recentOrderIds, setRecentOrderIds] = useState<string[]>([]);
  const [matchedOrders, setMatchedOrders] = useState<LookupOrderRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [addingMoreId, setAddingMoreId] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [whatsappImageNoticeByOrderId, setWhatsappImageNoticeByOrderId] = useState<Record<string, string>>({});
  const [copiedPhotoOrderId, setCopiedPhotoOrderId] = useState<string | null>(null);
  const [sendingWhatsAppOrderId, setSendingWhatsAppOrderId] = useState<string | null>(null);

  // Historical / Past Orders State for Authenticated User
  const [pastOrders, setPastOrders] = useState<LookupOrderRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'bespoke' | 'completed'>('all');
  const [copiedSpecsOrderId, setCopiedSpecsOrderId] = useState<string | null>(null);

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

  // Load saved Order IDs from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_ORDERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentOrderIds(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Fetch Historical Orders for Authenticated User (or local recent IDs)
  const fetchUserOrderHistory = useCallback(async () => {
    if (!activeUser && recentOrderIds.length === 0) {
      setPastOrders([]);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (activeUser?.id) params.set('userId', activeUser.id);
      if (activeUser?.email) params.set('email', activeUser.email);
      if (activeUser?.phone) params.set('phone', activeUser.phone);
      if (recentOrderIds.length > 0) params.set('recentIds', recentOrderIds.join(','));

      const res = await fetch(`/api/orders/user-history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          setPastOrders(data.orders);
        }
      }
    } catch (err) {
      console.error('Could not load user order history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [activeUser, recentOrderIds]);

  useEffect(() => {
    fetchUserOrderHistory();
  }, [fetchUserOrderHistory]);

  const performLookup = useCallback(async (queryToRun: string, silent: boolean = false) => {
    const clean = queryToRun.trim();
    if (!clean) {
      setErrorMsg('Please enter your HOS|TED Order ID (e.g., HT-1234) or phone number.');
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setErrorMsg('');
    }

    try {
      const res = await fetch(`/api/orders/lookup?q=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not look up order status.');
      }

      setMatchedOrders(Array.isArray(data.orders) ? data.orders : []);
      setHasSearched(true);
      setLastSearchedQuery(clean);
    } catch (err: any) {
      if (!silent) {
        setErrorMsg(err.message || 'Unable to fetch order status right now.');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  // Poll live backend status every 8 seconds when an order is displayed
  useEffect(() => {
    if (!lastSearchedQuery || matchedOrders.length === 0) return;
    const interval = setInterval(() => {
      performLookup(lastSearchedQuery, true);
    }, 8000);
    return () => clearInterval(interval);
  }, [lastSearchedQuery, matchedOrders.length, performLookup]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(searchInput);
  };

  // Map backend order status to stage index (0 to 5)
  const getStageIndex = (order: LookupOrderRecord): number => {
    const st = (order.status || '').toLowerCase();
    const isPaid =
      order.isPaymentConfirmed ||
      order.paymentStatus === 'Payment Confirmed' ||
      order.paymentStatus === 'Paid in Full' ||
      order.paymentStatus === 'Paid';

    if (st.includes('deliver') || st.includes('complet')) return 5;
    if (st.includes('ship') || st.includes('dispatch') || st.includes('transit')) return 4;
    if (st.includes('fitt') || st.includes('ready')) return 3;
    if (st.includes('tailor') || st.includes('production') || st.includes('stitch')) return 2;
    if (st.includes('process') || st.includes('confirm') || st.includes('consult') || isPaid) return 1;
    return 0;
  };

  const getAbsoluteImageUrl = (imgUrl?: string) => {
    if (!imgUrl) return window.location.origin;
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
    if (imgUrl.startsWith('data:')) return `${window.location.origin} (Custom Uploaded Outfit Image)`;
    return `${window.location.origin}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
  };

  const buildWhatsAppOrderLookupMessageText = (order: LookupOrderRecord) => {
    const isConfirmed =
      order.isPaymentConfirmed ||
      order.paymentStatus === 'Payment Confirmed' ||
      order.status === 'Payment Confirmed';
    const qty = Math.max(1, Number(order.quantity) || 1);
    const total = Number(order.totalAmountNgn) || 0;

    return (
      `*HOS|TED (HOS|TED Hosting Nations) — LIVE ORDER STATUS INQUIRY*\n\n` +
      `*Order ID:* ${order.id}\n` +
      `*Current Order Status:* ${order.status}\n` +
      `*Payment Status:* ${
        isConfirmed ? 'PAYMENT CONFIRMED ✓' : 'UNVERIFIED — PENDING PAYMENT CONFIRMATION'
      }\n` +
      `*Outfit / Product:* ${order.productName || order.category}\n` +
      `*Selected Size:* ${order.size || 'Standard / Custom'}\n` +
      `*Selected Color:* ${order.color || 'Signature Palette'}\n` +
      `*Number of Items (Quantity):* ${qty}\n` +
      `*Total Amount:* ${formatNgn(total)}\n\n` +
      `*Client Name:* ${order.name}\n` +
      `*Phone:* ${order.phone}\n` +
      `*Delivery Destination:* ${
        [order.deliveryAddress, order.deliveryCity, order.deliveryState].filter(Boolean).join(', ') ||
        'Nationwide Delivery'
      }\n\n` +
      (isConfirmed
        ? `Hello HOS|TED! I checked my Order ID *${order.id}* on the Order Lookup page (Status: *${order.status}*). Kindly share the latest update on my outfit!`
        : `Hello HOS|TED! I am requesting payment verification and order status for my unverified order *${order.id}* (*${qty}x ${
            order.productName || order.category
          }*, Size: ${order.size || 'Standard'}, Color: ${
            order.color || 'Signature'
          }) with the real outfit picture directly attached to this message. Please confirm my payment of *${formatNgn(
            total
          )}* and update my status to *Payment Confirmed*.`)
    );
  };

  const handleSendLookupWhatsAppWithRealImage = async (order: LookupOrderRecord) => {
    setSendingWhatsAppOrderId(order.id);
    try {
      const imgUrl = order.productImageUrl || ASSETS.ankaraGown1;
      const prodName = order.productName || order.category || 'HOS|TED Outfit';
      const result = await sendWhatsAppWithDirectOrderImage({
        whatsappClean,
        messageText: buildWhatsAppOrderLookupMessageText(order),
        imageUrl: imgUrl,
        orderId: order.id,
        productName: prodName,
      });
      setWhatsappImageNoticeByOrderId((prev) => ({
        ...prev,
        [order.id]: result.statusMessage,
      }));
    } finally {
      setSendingWhatsAppOrderId(null);
    }
  };

  const handleCopyLookupOutfitPhoto = async (order: LookupOrderRecord) => {
    const imgUrl = order.productImageUrl || ASSETS.ankaraGown1;
    const prodName = order.productName || order.category || 'HOS|TED Outfit';
    const ok = await copyRealOrderImageToClipboard(imgUrl, order.id, prodName);
    if (ok) {
      setCopiedPhotoOrderId(order.id);
      setWhatsappImageNoticeByOrderId((prev) => ({
        ...prev,
        [order.id]:
          'Real outfit picture copied to your clipboard! Simply press Paste (Ctrl+V or Paste) inside WhatsApp to send the actual picture.',
      }));
      setTimeout(() => setCopiedPhotoOrderId(null), 3500);
    } else {
      setWhatsappImageNoticeByOrderId((prev) => ({
        ...prev,
        [order.id]:
          'Click the WhatsApp button to directly load or save the real outfit photo for your message.',
      }));
    }
  };

  const handleAddMoreItems = async (orderId: string) => {
    setAddingMoreId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/add-more`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalQuantity: 1 }),
      });
      if (res.ok) {
        await performLookup(lastSearchedQuery || orderId, true);
        await fetchUserOrderHistory();
        if (onOrderUpdated) onOrderUpdated();
      }
    } catch (err) {
      console.error('Error adding more items from lookup:', err);
    } finally {
      setAddingMoreId(null);
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard?.writeText(accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  const handleCopyTailoringSpecs = (order: LookupOrderRecord) => {
    const m = order.measurements || {};
    const mParts = [
      m.bust ? `Bust: ${m.bust}"` : '',
      m.waist ? `Waist: ${m.waist}"` : '',
      m.hips ? `Hips: ${m.hips}"` : '',
      m.shoulder ? `Shoulder: ${m.shoulder}"` : '',
      m.dressLength ? `Length: ${m.dressLength}"` : '',
      m.sleeveLength ? `Sleeve: ${m.sleeveLength}"` : '',
      m.fabricPreference ? `Fabric: ${m.fabricPreference}` : '',
    ].filter(Boolean);

    const specSummary = [
      `HOS|TED Order Reference: ${order.id}`,
      `Outfit / Category: ${order.productName || order.category}`,
      `Size: ${order.size || 'Custom'}`,
      `Color: ${order.color || 'Signature'}`,
      mParts.length > 0 ? `Measurements: ${mParts.join(' | ')}` : '',
      order.notes ? `Notes: ${order.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard?.writeText(specSummary);
    setCopiedSpecsOrderId(order.id);
    setTimeout(() => setCopiedSpecsOrderId(null), 2500);
  };

  const isBespokeOrder = (order: LookupOrderRecord) => {
    const m = order.measurements || {};
    const hasCustomMeasurements = Boolean(
      m.bust || m.waist || m.hips || m.shoulder || m.dressLength || m.fabricPreference
    );
    const catLower = `${order.category || ''} ${order.productName || ''} ${order.size || ''}`.toLowerCase();
    return (
      hasCustomMeasurements ||
      catLower.includes('bespoke') ||
      catLower.includes('custom') ||
      catLower.includes('tailor')
    );
  };

  const filteredPastOrders = pastOrders.filter((order) => {
    if (historyFilter === 'bespoke') return isBespokeOrder(order);
    if (historyFilter === 'completed') {
      const st = (order.status || '').toLowerCase();
      return st.includes('complet') || st.includes('deliver') || st.includes('ship');
    }
    return true;
  });

  return (
    <section
      id="order-lookup"
      className="py-16 sm:py-24 bg-stone-950 relative border-t border-stone-800/80"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/70 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-widest">
            <Package className="w-3.5 h-3.5" />
            <span>HOS|TED Order Tracker & Tailoring Archive</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Order Lookup & Past Orders
          </h2>
          <p className="text-sm sm:text-base text-stone-300">
            Track live order progress by <strong className="text-amber-400">Order ID</strong> or switch to{' '}
            <strong className="text-amber-400">Past Orders</strong> to reference your historical custom tailoring requests, sizes, and measurements.
          </p>
        </div>

        {/* Mode Switcher Tabs: Live Order Lookup vs Past Orders */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-stone-900 border border-stone-800 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('lookup')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                activeTab === 'lookup'
                  ? 'bg-amber-400 text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Track Order Status</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('past_orders');
                fetchUserOrderHistory();
              }}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                activeTab === 'past_orders'
                  ? 'bg-amber-400 text-stone-950 shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Past Orders</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                  activeTab === 'past_orders'
                    ? 'bg-stone-950 text-amber-400'
                    : 'bg-stone-800 text-amber-300'
                }`}
              >
                {pastOrders.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: LIVE ORDER LOOKUP BY ID OR PHONE */}
        {activeTab === 'lookup' ? (
          <>
            {/* Lookup Input Card */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-amber-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Enter your Order ID (e.g. HT-4821) or WhatsApp Phone Number..."
                    className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-2xl pl-12 pr-4 py-4 text-sm sm:text-base text-white placeholder-stone-500 font-mono focus:outline-none transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50 shrink-0"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Looking Up...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Track Order Status</span>
                    </>
                  )}
                </button>
              </form>

              {/* Recent Orders on This Device Quick Pills */}
              {recentOrderIds.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-xs text-stone-400 font-medium">
                    Your recent orders on this device:
                  </span>
                  {recentOrderIds.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setSearchInput(id);
                        performLookup(id);
                      }}
                      className={`px-3 py-1 rounded-lg font-mono text-xs font-bold border transition ${
                        lastSearchedQuery.toUpperCase() === id.toUpperCase()
                          ? 'bg-amber-400 text-stone-950 border-amber-400'
                          : 'bg-stone-950 text-amber-300 border-amber-500/30 hover:border-amber-400'
                      }`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Lookup Results */}
            {hasSearched && (
              <div className="space-y-8">
                {matchedOrders.length === 0 ? (
                  <div className="p-8 sm:p-10 rounded-3xl bg-stone-900/80 border border-stone-800 text-center space-y-3">
                    <Package className="w-10 h-10 text-stone-500 mx-auto" />
                    <h3 className="text-lg font-serif font-bold text-white">
                      No Order Found for "{lastSearchedQuery}"
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto">
                      Please double-check your HOS|TED Order ID (for example{' '}
                      <span className="font-mono text-stone-200">HT-1234</span>) or enter the
                      WhatsApp phone number you used when placing your order.
                    </p>
                  </div>
                ) : (
                  matchedOrders.map((order) => {
                    const currentStageIdx = getStageIndex(order);
                    const isConfirmed =
                      order.isPaymentConfirmed ||
                      order.paymentStatus === 'Payment Confirmed' ||
                      order.paymentStatus === 'Paid in Full' ||
                      order.paymentStatus === 'Paid' ||
                      currentStageIdx >= 1;

                    return (
                      <div
                        key={order.id}
                        className="rounded-3xl bg-stone-900 border border-amber-500/30 overflow-hidden shadow-2xl space-y-6 p-6 sm:p-8"
                      >
                        {/* Top Order Summary Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-800">
                          <div className="flex items-start sm:items-center gap-4">
                            <img
                              src={order.productImageUrl || ASSETS.ankaraGown1}
                              alt={order.productName || order.category}
                              className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl object-cover border-2 border-amber-400/60 shrink-0 shadow-lg"
                            />
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/15 px-3 py-0.5 rounded-lg border border-amber-500/30">
                                  {order.id}
                                </span>
                                <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400 text-stone-950">
                                  Status: {order.status}
                                </span>
                                {isConfirmed ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Payment Confirmed ✓</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Unverified — Pending Payment Confirmation</span>
                                  </span>
                                )}
                              </div>

                              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                                {order.productName || order.category}
                              </h3>

                              <div className="text-xs sm:text-sm text-stone-300 flex flex-wrap gap-x-4 gap-y-1">
                                <span>
                                  Client: <strong className="text-white">{order.name}</strong>
                                </span>
                                <span>
                                  Size:{' '}
                                  <strong className="text-white">{order.size || 'Standard'}</strong>
                                </span>
                                <span>
                                  Color:{' '}
                                  <strong className="text-white">
                                    {order.color || 'Signature'}
                                  </strong>
                                </span>
                                <span>
                                  Items (Qty):{' '}
                                  <strong className="text-amber-400 font-mono">
                                    {order.quantity || 1}
                                  </strong>
                                </span>
                              </div>

                              <div className="text-sm sm:text-base font-mono font-bold text-amber-400 pt-0.5">
                                Total Order Value: {formatNgn(order.totalAmountNgn || 0)}
                              </div>
                            </div>
                          </div>

                          {/* Right Actions: Refresh + Add More */}
                          <div className="flex sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 shrink-0">
                            <button
                              type="button"
                              disabled={addingMoreId === order.id}
                              onClick={() => handleAddMoreItems(order.id)}
                              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                              <span>
                                {addingMoreId === order.id ? 'Adding Item...' : 'Add More (+1 Item)'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => performLookup(lastSearchedQuery || order.id)}
                              className="px-3.5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`}
                              />
                              <span>Refresh Real-Time State</span>
                            </button>
                          </div>
                        </div>

                        {/* Visual 6-Stage Real-Time Progress Stepper */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold uppercase tracking-wider text-amber-400">
                              Your HOS|TED Order Progress
                            </span>
                            <span className="text-stone-400">
                              Stage {currentStageIdx + 1} of {FULFILLMENT_STAGES.length}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {FULFILLMENT_STAGES.map((stage, idx) => {
                              const Icon = stage.icon;
                              const isCompleted = idx < currentStageIdx;
                              const isCurrent = idx === currentStageIdx;
                              return (
                                <div
                                  key={stage.key}
                                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-2 ${
                                    isCurrent
                                      ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                                      : isCompleted
                                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                      : 'bg-stone-950/60 border-stone-800/80 text-stone-500'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div
                                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                                        isCurrent
                                          ? 'bg-amber-400 text-stone-950'
                                          : isCompleted
                                          ? 'bg-emerald-500/20 text-emerald-400'
                                          : 'bg-stone-900 text-stone-500'
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                      ) : (
                                        <Icon className="w-4 h-4" />
                                      )}
                                    </div>
                                    <span className="font-mono text-[10px] font-bold uppercase">
                                      0{idx + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <div
                                      className={`text-xs font-bold ${
                                        isCurrent
                                          ? 'text-amber-300'
                                          : isCompleted
                                          ? 'text-emerald-300'
                                          : 'text-stone-400'
                                      }`}
                                    >
                                      {stage.label}
                                    </div>
                                    <div className="text-[11px] leading-snug opacity-80 mt-0.5">
                                      {stage.sublabel}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Delivery & Tailor Info Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-stone-400 uppercase font-bold block text-[10px]">
                                Nationwide Delivery Destination
                              </span>
                              <span className="text-white font-medium mt-0.5 block">
                                {[order.deliveryAddress, order.deliveryCity, order.deliveryState]
                                  .filter(Boolean)
                                  .join(', ') || 'HOS|TED Nationwide Doorstep Delivery'}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-start gap-3">
                            <Scissors className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-stone-400 uppercase font-bold block text-[10px]">
                                Lead Creative Director & Atelier Notes
                              </span>
                              <span className="text-white font-medium mt-0.5 block">
                                {order.assignedTailor || 'Theresa Isama'} · Ordered on{' '}
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Real-Time Map-Based Delivery Tracker */}
                        <OrderDeliveryMapTracker order={order} stageIndex={currentStageIdx} />

                        {/* If Payment is Still Unverified, Show Payment Details Here Too */}
                        {!isConfirmed && (
                          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 border border-amber-500/40 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                                <CreditCard className="w-4 h-4" />
                                <span>HOS|TED Payment Details for Unverified Order {order.id}</span>
                              </div>
                              <span className="text-xs font-mono text-amber-300 font-bold">
                                Amount Due: {formatNgn(order.totalAmountNgn || 0)}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                                <span className="text-stone-400 block text-[10px] uppercase">
                                  Bank / Channel
                                </span>
                                <strong className="text-white">{bankName}</strong>
                              </div>
                              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                                <span className="text-stone-400 block text-[10px] uppercase">
                                  Account Name
                                </span>
                                <strong className="text-white">{accountName}</strong>
                              </div>
                              <div className="p-3 rounded-xl bg-stone-950 border border-amber-500/40 flex items-center justify-between">
                                <div>
                                  <span className="text-stone-400 block text-[10px] uppercase">
                                    Account Number
                                  </span>
                                  <strong className="text-amber-400 font-mono text-sm">
                                    {accountNumber}
                                  </strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleCopyAccount}
                                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-[11px] flex items-center gap-1"
                                >
                                  {copiedAccount ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-stone-300">{paymentInstructions}</p>
                          </div>
                        )}

                        {/* Bottom WhatsApp Request Order Status Button (Directly Loads Real Outfit Picture — No Links) */}
                        <div className="pt-1 space-y-2.5">
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleSendLookupWhatsAppWithRealImage(order)}
                              disabled={sendingWhatsAppOrderId === order.id}
                              className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-60"
                            >
                              <MessageCircle className="w-4 h-4 fill-stone-950" />
                              <span>
                                {sendingWhatsAppOrderId === order.id
                                  ? 'Loading Real Outfit Picture into WhatsApp...'
                                  : isConfirmed
                                  ? `Order Status: ${order.status} — Chat with HOS|TED on WhatsApp (With Real Photo)`
                                  : 'Request Order Status on WhatsApp (Directly Loads Real Outfit Picture)'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyLookupOutfitPhoto(order)}
                              className="py-3.5 px-4 rounded-xl bg-stone-950 hover:bg-stone-800 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition shrink-0"
                            >
                              <ImageIcon className="w-4 h-4 text-amber-400" />
                              <span>
                                {copiedPhotoOrderId === order.id
                                  ? 'Real Photo Copied ✓'
                                  : 'Copy Real Photo'}
                              </span>
                            </button>
                          </div>

                          {whatsappImageNoticeByOrderId[order.id] && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center">
                              {whatsappImageNoticeByOrderId[order.id]}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        ) : (
          /* TAB 2: PAST ORDERS & HISTORICAL CUSTOM TAILORING ARCHIVE FOR AUTHENTICATED USER */
          <div className="space-y-6">
            {/* Authenticated User Saved Tailoring Profile Banner */}
            {activeUser ? (
              <div className="p-5 sm:p-6 rounded-3xl bg-stone-900/95 border border-amber-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-serif font-bold text-base shrink-0">
                      <User className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                          {activeUser.name}’s Tailoring & Order History
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                          Synced Profile
                        </span>
                      </div>
                      <p className="text-xs text-stone-400">
                        Reference your past HOS|TED orders, bespoke measurements, sizes, and colors below.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchUserOrderHistory}
                      disabled={isLoadingHistory}
                      className="px-3.5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          isLoadingHistory ? 'animate-spin text-amber-400' : 'text-amber-400'
                        }`}
                      />
                      <span>Refresh History</span>
                    </button>

                    {onRequestCustomTailoring && (
                      <button
                        type="button"
                        onClick={() =>
                          onRequestCustomTailoring(activeUser.preferredStyle || 'Ankara Gown')
                        }
                        className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>New Tailoring Request</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Saved Baseline Sizing & Measurement Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-stone-800 text-xs">
                  <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                      Saved Preferred Style
                    </span>
                    <strong className="text-white mt-0.5 block">
                      {activeUser.preferredStyle || 'Ankara Gowns & Bubu Couture'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                      Saved Fit / Size
                    </span>
                    <strong className="text-amber-300 mt-0.5 block">
                      {activeUser.preferredSize || 'Custom Fit'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800">
                    <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                      Favorite Palette
                    </span>
                    <strong className="text-white mt-0.5 block">
                      {activeUser.favoriteColors || 'Imperial Gold & Emerald'}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 rounded-3xl bg-stone-900 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-lg font-serif font-bold text-white">
                    Sign In to Access Your Full Tailoring History
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-300 max-w-xl">
                    Sign in to your HOS|TED profile to automatically pull all your past bespoke tailoring requests, saved body measurements, and order records across devices.
                  </p>
                </div>
                {onOpenUserAuth && (
                  <button
                    type="button"
                    onClick={onOpenUserAuth}
                    className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider shrink-0 flex items-center gap-2 shadow-md transition"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In / Sign Up</span>
                  </button>
                )}
              </div>
            )}

            {/* Filter Pills for Historical Orders */}
            {pastOrders.length > 0 && (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      historyFilter === 'all'
                        ? 'bg-amber-400 text-stone-950 border-amber-400'
                        : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white'
                    }`}
                  >
                    All Past Orders ({pastOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('bespoke')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                      historyFilter === 'bespoke'
                        ? 'bg-amber-400 text-stone-950 border-amber-400'
                        : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>
                      Custom Tailoring Requests ({pastOrders.filter(isBespokeOrder).length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('completed')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      historyFilter === 'completed'
                        ? 'bg-amber-400 text-stone-950 border-amber-400'
                        : 'bg-stone-900 text-stone-300 border-stone-800 hover:text-white'
                    }`}
                  >
                    Completed & Shipped
                  </button>
                </div>
              </div>
            )}

            {/* Past Orders List */}
            {isLoadingHistory ? (
              <div className="p-10 rounded-3xl bg-stone-900/80 border border-stone-800 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-sm text-stone-300">Loading your past HOS|TED orders...</p>
              </div>
            ) : filteredPastOrders.length === 0 ? (
              <div className="p-8 sm:p-10 rounded-3xl bg-stone-900/80 border border-stone-800 text-center space-y-4">
                <History className="w-10 h-10 text-amber-400/70 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-bold text-white">
                    No Past Orders Recorded Yet
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto">
                    When you place a collection order or submit a custom tailoring request, your complete order details, measurements, and fit specifications will appear here for easy reference.
                  </p>
                </div>
                {onRequestCustomTailoring && (
                  <button
                    type="button"
                    onClick={() => onRequestCustomTailoring('Ankara Gown')}
                    className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Start a Custom Tailoring Request</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {filteredPastOrders.map((order) => {
                  const currentStageIdx = getStageIndex(order);
                  const isConfirmed =
                    order.isPaymentConfirmed ||
                    order.paymentStatus === 'Payment Confirmed' ||
                    order.paymentStatus === 'Paid in Full' ||
                    order.paymentStatus === 'Paid' ||
                    currentStageIdx >= 1;
                  const m = order.measurements || {};
                  const measurementEntries = [
                    { label: 'Bust', val: m.bust ? `${m.bust}"` : '' },
                    { label: 'Waist', val: m.waist ? `${m.waist}"` : '' },
                    { label: 'Hips', val: m.hips ? `${m.hips}"` : '' },
                    { label: 'Shoulder', val: m.shoulder ? `${m.shoulder}"` : '' },
                    { label: 'Gown / Outfit Length', val: m.dressLength ? `${m.dressLength}"` : '' },
                    { label: 'Sleeve Length', val: m.sleeveLength ? `${m.sleeveLength}"` : '' },
                    { label: 'Fabric Preference', val: m.fabricPreference || '' },
                    { label: 'Needed By', val: m.neededBy || order.dueDate || '' },
                  ].filter((item) => Boolean(item.val));

                  return (
                    <div
                      key={order.id}
                      className="p-6 rounded-3xl bg-stone-900 border border-stone-800 hover:border-amber-500/40 transition shadow-xl space-y-5"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <img
                            src={order.productImageUrl || ASSETS.ankaraGown1}
                            alt={order.productName || order.category}
                            className="w-18 h-22 sm:w-20 sm:h-24 rounded-2xl object-cover border border-amber-500/40 shrink-0"
                          />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                                {order.id}
                              </span>
                              <span className="text-xs text-stone-400 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                                <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-stone-800 text-amber-300 border border-stone-700">
                                {order.status}
                              </span>
                              {isConfirmed ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Payment Confirmed ✓
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Pending Payment
                                </span>
                              )}
                            </div>

                            <h4 className="text-lg sm:text-xl font-serif font-bold text-white">
                              {order.productName || order.category}
                            </h4>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-300">
                              <span>
                                Size: <strong className="text-white">{order.size || 'Custom'}</strong>
                              </span>
                              <span>
                                Color:{' '}
                                <strong className="text-amber-300">
                                  {order.color || 'Signature Palette'}
                                </strong>
                              </span>
                              <span>
                                Qty: <strong className="text-white">{order.quantity || 1}</strong>
                              </span>
                              {order.totalAmountNgn ? (
                                <span>
                                  Total:{' '}
                                  <strong className="text-amber-400 font-mono">
                                    {formatNgn(order.totalAmountNgn)}
                                  </strong>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Quick Reference Actions */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyTailoringSpecs(order)}
                            className="px-3.5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            {copiedSpecsOrderId === order.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">Copied Specs ✓</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-amber-400" />
                                <span>Copy Tailoring Specs</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('lookup');
                              setSearchInput(order.id);
                              performLookup(order.id);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Live Tracker</span>
                          </button>

                          {onRequestCustomTailoring && (
                            <button
                              type="button"
                              onClick={() =>
                                onRequestCustomTailoring(
                                  order.category || order.productName || 'Ankara Gown'
                                )
                              }
                              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                              <span>Reorder / Reference Fit</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Custom Tailoring & Measurements Reference Box */}
                      <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/90 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 text-[11px]">
                            <Ruler className="w-3.5 h-3.5" />
                            <span>Recorded Tailoring Specifications & Measurements</span>
                          </span>
                          <span className="text-[11px] text-stone-400">
                            Tailor: {order.assignedTailor || 'Theresa Isama'}
                          </span>
                        </div>

                        {measurementEntries.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {measurementEntries.map((item) => (
                              <div
                                key={item.label}
                                className="p-2.5 rounded-xl bg-stone-900 border border-stone-800"
                              >
                                <span className="text-[10px] uppercase text-stone-400 block">
                                  {item.label}
                                </span>
                                <strong className="text-white font-mono text-xs">{item.val}</strong>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-stone-400 text-xs">
                            Standard Fit Profile: <strong className="text-stone-200">{order.size || 'Standard'}</strong> · Color: <strong className="text-stone-200">{order.color || 'Signature'}</strong>
                          </div>
                        )}

                        {order.notes && (
                          <div className="pt-2 border-t border-stone-800/80 text-stone-300">
                            <span className="text-stone-400 font-semibold">Tailoring Notes: </span>
                            {order.notes}
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
      </div>
    </section>
  );
};
