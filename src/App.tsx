import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CollectionsShowcase } from './components/CollectionsShowcase';
import { BrandFlierShowcase } from './components/BrandFlierShowcase';
import { BespokeTailoringSection } from './components/BespokeTailoringSection';
import { OrderLookupSection } from './components/OrderLookupSection';
import { AtelierStory } from './components/AtelierStory';
import { Footer } from './components/Footer';
import { TessyAIAssistant } from './components/TessyAIAssistant';
import { StaffAtelierModal } from './components/StaffAtelierModal';
import {
  UserAuthOnboardingModal,
  ActiveFrontendUser,
} from './components/UserAuthOnboardingModal';
import { UserProfileModal } from './components/UserProfileModal';
import { LegalPoliciesModal, LegalTabType } from './components/LegalPoliciesModal';
import {
  AssistantMode,
  ChatMessage,
  CustomStyleEditRecord,
  ProductItem,
  WebsiteSettings,
} from './types';
import { ASSETS } from './constants/assets';
import { PRODUCTS_CATALOG } from './data/products';
import {
  getSavedFounderImage,
  getSavedAdminAddedOrEditedProducts,
  getDeletedProductIds,
  reconcilePermanentStorefrontState,
  hydratePermanentStateFromIndexedDB,
} from './utils/permanentSync';
import {
  Sparkles,
  Crown,
  User,
  MessageSquare,
  ShoppingBag,
  Scissors,
  PackageSearch,
  Heart,
  BookOpen,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState('collections');
  const [showAllSections, setShowAllSections] = useState(false);
  const [isTessyOpen, setIsTessyOpen] = useState(false);
  const [tessyMode, setTessyMode] = useState<AssistantMode>('stylist');
  const [tessyInitialPrompt, setTessyInitialPrompt] = useState('');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [bespokeCategory, setBespokeCategory] = useState('Ankara Gown');
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  // Frontend User Recognition, Sign-Up, Onboarding & Profile State
  const [activeUser, setActiveUser] = useState<ActiveFrontendUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTabType>('terms');
  const [recognizedEmail, setRecognizedEmail] = useState('');
  const [recognizedName, setRecognizedName] = useState('');

  const handleOpenLegalModal = (tab: LegalTabType = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  useEffect(() => {
    hydratePermanentStateFromIndexedDB().then(() => {
      const deletedIds = new Set(getDeletedProductIds());
      const customAdded = getSavedAdminAddedOrEditedProducts();
      if (customAdded.length > 0) {
        setLiveProducts((prev) => {
          const filtered = prev.filter((p) => !deletedIds.has(p.id));
          for (const item of customAdded) {
            if (!item?.id || deletedIds.has(item.id)) continue;
            const idx = filtered.findIndex((p) => p.id === item.id);
            if (idx === -1) {
              filtered.unshift(item);
            } else {
              filtered[idx] = { ...filtered[idx], ...item };
            }
          }
          return [...filtered];
        });
      }
      const savedImg = getSavedFounderImage();
      if (savedImg) {
        setWebsiteSettings((prev) => ({ ...prev, founderImageUrl: savedImg }));
      }
    });
  }, []);

  // Live synchronized storefront state from HOS|TED backend (with localStorage mirror so confirmed edits are instant on reload)
  const [liveProducts, setLiveProducts] = useState<ProductItem[]>(() => {
    try {
      const deletedIds = new Set(getDeletedProductIds());
      const customAdded = getSavedAdminAddedOrEditedProducts();
      const saved = localStorage.getItem('hosted_permanent_products_v1');
      let baseList: ProductItem[] = PRODUCTS_CATALOG;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) baseList = parsed;
      }
      const filtered = baseList.filter((p) => !deletedIds.has(p.id));
      for (const item of customAdded) {
        if (!item?.id || deletedIds.has(item.id)) continue;
        const idx = filtered.findIndex((p) => p.id === item.id);
        if (idx === -1) {
          filtered.unshift(item);
        } else {
          filtered[idx] = item;
        }
      }
      return filtered;
    } catch {
      return PRODUCTS_CATALOG;
    }
  });
  const [customStyleEdits, setCustomStyleEdits] = useState<Record<string, CustomStyleEditRecord>>(
    () => {
      try {
        const saved = localStorage.getItem('hosted_permanent_style_edits_v1');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
      return {};
    }
  );
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings>(() => ({
    brandName: 'HOS|TED',
    founderName: 'Theresa Isama',
    founderRole: 'Founder & Creative Director, HOS|TED',
    founderImageUrl: getSavedFounderImage() || ASSETS.tessyAvatar,
    founderQuote:
      'Every garment we craft at HOS|TED is designed to host nations—uniting African heritage with effortless modern confidence.',
    founderBioParagraph1:
      'Theresa Isama is the visionary Founder and Creative Director behind HOS|TED (HOS|TED Hosting Nations). With a deep passion for contemporary African fashion and precision tailoring, she established HOS|TED to deliver comfort, style, and confidence for every occasion.',
    founderBioParagraph2:
      'From regal silk Bubu gowns and sculpted Ankara evening pieces to chic everyday wear delivered nationwide, Theresa Isama leads every collection with uncompromising attention to fit, fabric quality, and timeless elegance.',
    slogan: 'HOS|TED Hosting Nations',
    announcementText: 'HOS|TED — Hosting Nations • Nationwide Delivery Available • Consult Tessy Ai',
    heroTitle: 'Crafted for Comfort, Style & Confidence.',
    heroHighlightText: 'Comfort, Style',
    heroSubtitle:
      'Specializing in elegant everyday wear and beautifully tailored Ankara pieces, crafted to deliver comfort, style, and confidence for every occasion.',
    whatsappNumber: '09073784461',
    whatsappFormatted: '+234 907 378 4461',
    tiktokHandle: 'theresaisama',
    instagramHandle: 'Tessy Isima',
    acceptingCustomOrders: true,
    standardLeadTime: '',
    nationwideDeliveryText: 'Nationwide Delivery Across All 36 States, FCT Abuja & International',
    themeColor: 'obsidian',
    accentColor: 'amber',
    showAnnouncementBar: true,
    showFlierSection: true,
    showBespokeSection: true,
    showStorySection: true,
    showFounderSection: true,
    customBannerMessage: '',
    paymentBankName: 'OPay / Moniepoint / Direct Bank Transfer',
    paymentAccountName: 'Theresa Isama (HOS|TED)',
    paymentAccountNumber: '9073784461',
    paymentInstructions:
      'Transfer the total order amount for your selected items, then click "Request Order Status on WhatsApp" below to send your order details and specific outfit image for instant HOS|TED payment confirmation.',
  }));

  const fetchPublicStorefrontState = useCallback(async () => {
    try {
      const res = await fetch('/api/public/state', {
        headers: { Accept: 'application/json' },
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const reconciled = await reconcilePermanentStorefrontState(
          Array.isArray(data.products) ? data.products : [],
          data.websiteSettings
        );
        if (Array.isArray(reconciled.products) && reconciled.products.length > 0) {
          setLiveProducts(reconciled.products);
        }
        if (reconciled.websiteSettings) {
          setWebsiteSettings(reconciled.websiteSettings);
        }
        if (data.customStyleEdits && typeof data.customStyleEdits === 'object') {
          setCustomStyleEdits(data.customStyleEdits);
          try {
            localStorage.setItem(
              'hosted_permanent_style_edits_v1',
              JSON.stringify(data.customStyleEdits)
            );
          } catch {
            // ignore storage quota
          }
        }
      }
    } catch {
      // Silently ignore transient network or dev-server restart HTML responses
    }
  }, []);

  useEffect(() => {
    fetchPublicStorefrontState();

    // Real-Time Server-Sent Events (SSE) subscription so Admin Dashboard & Client confirmed changes apply immediately for all users & storefront
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/events');
      eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'STATE_UPDATED' || data.type === 'CONNECTED') {
            const reconciled = await reconcilePermanentStorefrontState(
              Array.isArray(data.products) ? data.products : [],
              data.websiteSettings
            );
            if (Array.isArray(reconciled.products) && reconciled.products.length > 0) {
              setLiveProducts(reconciled.products);
            }
            if (reconciled.websiteSettings) {
              setWebsiteSettings(reconciled.websiteSettings);
            }
            if (data.customStyleEdits && typeof data.customStyleEdits === 'object') {
              setCustomStyleEdits(data.customStyleEdits);
              try {
                localStorage.setItem(
                  'hosted_permanent_style_edits_v1',
                  JSON.stringify(data.customStyleEdits)
                );
              } catch {
                // ignore
              }
            }
            // Also refresh active user profile in real time if signed in
            const storedUserId = localStorage.getItem('hosted_active_user_id') || '';
            const storedEmail = localStorage.getItem('hosted_recognized_email') || '';
            const signedOutFlag = localStorage.getItem('hosted_signed_out') === 'true';
            if ((storedUserId || storedEmail) && !signedOutFlag) {
              const userRes = await fetch(
                `/api/users/session?userId=${encodeURIComponent(storedUserId)}&email=${encodeURIComponent(storedEmail)}`
              );
              if (userRes.ok) {
                const userData = await userRes.json();
                if (userData.found && userData.user) {
                  setActiveUser(userData.user);
                }
              }
            }
          }
        } catch {
          // ignore parse errors
        }
      };
    } catch {
      // Fallback polling if EventSource is unavailable
    }

    const fallbackInterval = setInterval(() => {
      fetchPublicStorefrontState();
    }, 5000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(fallbackInterval);
    };
  }, [fetchPublicStorefrontState]);

  // Detect first-time visitors vs returning recognized visitors
  useEffect(() => {
    const checkVisitorStatus = async () => {
      try {
        const storedUserId = localStorage.getItem('hosted_active_user_id') || '';
        const storedEmail = localStorage.getItem('hosted_recognized_email') || '';
        const storedName = localStorage.getItem('hosted_recognized_name') || '';
        const signedOutFlag = localStorage.getItem('hosted_signed_out') === 'true';

        if (storedEmail) {
          setRecognizedEmail(storedEmail);
        }
        if (storedName) {
          setRecognizedName(storedName);
        }

        // If the user has an active session and hasn't explicitly signed out, restore their real-time profile & Tessy Ai chat memory
        if ((storedUserId || storedEmail) && !signedOutFlag) {
          const res = await fetch(
            `/api/users/session?userId=${encodeURIComponent(storedUserId)}&email=${encodeURIComponent(storedEmail)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.found && data.user) {
              setActiveUser(data.user);
              setRecognizedEmail(data.user.email || '');
              setRecognizedName(data.user.name || '');
              return;
            }
          }
        }

        // If returning visitor who signed out previously, recognize them and prompt Sign In
        if (storedEmail && signedOutFlag) {
          setIsAuthModalOpen(true);
          return;
        }

        // First-time visitor clicking the web link: detect as new user and ask to Sign Up & complete quick onboarding
        setIsAuthModalOpen(true);
      } catch (err) {
        console.error('Visitor recognition error:', err);
      }
    };

    checkVisitorStatus();
  }, []);

  const handleUserAuthenticated = (user: ActiveFrontendUser) => {
    setActiveUser(user);
    if (user.id) localStorage.setItem('hosted_active_user_id', user.id);
    if (user.email) {
      localStorage.setItem('hosted_recognized_email', user.email);
      setRecognizedEmail(user.email);
    }
    if (user.name) {
      localStorage.setItem('hosted_recognized_name', user.name);
      setRecognizedName(user.name);
    }
    localStorage.removeItem('hosted_signed_out');
    fetchPublicStorefrontState();
  };

  const handleUserSignOut = () => {
    setActiveUser(null);
    localStorage.removeItem('hosted_active_user_id');
    localStorage.setItem('hosted_signed_out', 'true');
    setIsAuthModalOpen(true);
  };

  const handleUserChatUpdated = (updatedChats: ChatMessage[]) => {
    setActiveUser((prev) => (prev ? { ...prev, chatHistory: updatedChats } : prev));
  };

  // Discreet access: keyboard shortcut (Ctrl+Shift+A), ?admin=true, or #admin
  useEffect(() => {
    const checkAdminTrigger = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get('admin') === 'true' ||
        urlParams.get('admin') === '1' ||
        window.location.hash === '#admin'
      ) {
        setIsStaffModalOpen(true);
      }
    };

    checkAdminTrigger();
    window.addEventListener('hashchange', checkAdminTrigger);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsStaffModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', checkAdminTrigger);
    };
  }, []);

  const handleOpenTessy = (mode: AssistantMode = 'stylist', prompt: string = '') => {
    setTessyMode(mode);
    setTessyInitialPrompt(prompt);
    setIsTessyOpen(true);
  };

  const handleAskTessyAboutProduct = (productName: string) => {
    handleOpenTessy(
      'stylist',
      `How would you recommend styling the "${productName}" from HOS|TED? What accessories, shoes, and occasions suit it best?`
    );
  };

  const handleNavigateSection = (sectionId: string) => {
    const normalized =
      sectionId === 'hero'
        ? 'collections'
        : sectionId === 'founder'
        ? 'story'
        : sectionId;
    setActiveSection(normalized);
    setShowAllSections(false);

    setTimeout(() => {
      if (sectionId === 'hero') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(sectionId) || document.getElementById(normalized);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  };

  const handleOpenBespokeWithCategory = (cat: string) => {
    setBespokeCategory(cat);
    handleNavigateSection('bespoke');
  };

  const themeBgClass =
    websiteSettings.themeColor === 'midnight'
      ? 'bg-slate-950 text-stone-100'
      : websiteSettings.themeColor === 'espresso'
      ? 'bg-[#120D0A] text-stone-100'
      : websiteSettings.themeColor === 'emerald'
      ? 'bg-[#061A14] text-stone-100'
      : websiteSettings.themeColor === 'burgundy'
      ? 'bg-[#1C080E] text-stone-100'
      : websiteSettings.themeColor === 'cream'
      ? 'bg-[#FAF6EE] text-stone-900'
      : websiteSettings.themeColor === 'custom'
      ? 'bg-stone-950 text-stone-100'
      : 'bg-stone-950 text-stone-100';

  return (
    <div
      className={`min-h-screen ${themeBgClass} flex flex-col font-sans selection:bg-amber-600 selection:text-white`}
    >
      {websiteSettings.themeColor === 'custom' && websiteSettings.customThemeBg && (
        <style>{`
          .hosted-custom-theme-root {
            background-color: ${websiteSettings.customThemeBg} !important;
            color: ${websiteSettings.customThemeText || '#F5F5F4'} !important;
          }
        `}</style>
      )}

      {/* Main Navigation */}
      <Navbar
        onOpenTessy={handleOpenTessy}
        onNavigateSection={handleNavigateSection}
        activeSection={activeSection}
        activeUser={activeUser}
        onOpenUserAuth={() => setIsAuthModalOpen(true)}
        onOpenUserProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Tailored Greeting Bar for Signed-In User or Founder & Owner Theresa Isama */}
      {activeUser && (
        <div
          className={`border-b px-4 py-2.5 text-xs ${
            activeUser.isFounder
              ? 'bg-gradient-to-r from-amber-950/90 via-stone-900 to-amber-950/90 border-amber-400/50 text-amber-100'
              : 'bg-stone-900/95 border-stone-800 text-stone-200'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              {activeUser.isFounder ? (
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>
                {activeUser.isFounder ? (
                  <>
                    <strong className="text-amber-300">
                      Royal Founder & Owner Greeting — Welcome Home, Queen Theresa Isama! 👑✨
                    </strong>{' '}
                    Visionary Founder & Owner of HOS|TED (HOS|TED Hosting Nations). Tessy Ai remembers all your chats & live operations.
                  </>
                ) : (
                  <strong className="text-amber-400">
                    Welcome back to HOS|TED, {activeUser.name}! ✨
                  </strong>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenTessy('stylist')}
                className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold flex items-center gap-1 transition"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Tessy Ai ({activeUser.chatHistory?.length || 1})</span>
              </button>

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-700 font-semibold flex items-center gap-1 transition"
              >
                <User className="w-3 h-3 text-amber-400" />
                <span>My Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <main className={`flex-1 ${websiteSettings.themeColor === 'custom' ? 'hosted-custom-theme-root' : ''}`}>

        {/* 1. Home & Collections View */}
        {(showAllSections || activeSection === 'collections' || activeSection === 'hero') && (
          <>
            <Hero
              onOpenTessy={handleOpenTessy}
              onExploreCollections={() => {
                const el = document.getElementById('collections');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenBespoke={() => handleNavigateSection('bespoke')}
              settings={websiteSettings}
            />

            <CollectionsShowcase
              onAskTessyAboutProduct={handleAskTessyAboutProduct}
              onOpenBespokeWithCategory={handleOpenBespokeWithCategory}
              products={liveProducts}
              settings={websiteSettings}
              onOrderSubmitted={fetchPublicStorefrontState}
              customStyleEdits={customStyleEdits}
            />

            {/* Orderly Quick Directory to Other Storefront Sections */}
            {!showAllSections && (
              <section className="py-12 bg-stone-950 border-t border-stone-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center max-w-2xl mx-auto mb-8">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                      Simple Storefront Navigation
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
                      Explore More of HOS|TED
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      Select any section below to open custom measurements, live order tracking, founder story, or our brand flier.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => handleNavigateSection('bespoke')}
                      className="text-left p-5 rounded-2xl bg-stone-900/90 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/50 transition group flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <h4 className="font-serif font-bold text-white text-sm group-hover:text-amber-300">
                          Bespoke Tailoring & Sizing
                        </h4>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          Easy layman size & color guides, body measurements, and custom tailoring orders.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <span>Open Bespoke Tailoring</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>

                    <button
                      onClick={() => handleNavigateSection('order-lookup')}
                      className="text-left p-5 rounded-2xl bg-stone-900/90 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/50 transition group flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center">
                          <PackageSearch className="w-4 h-4" />
                        </div>
                        <h4 className="font-serif font-bold text-white text-sm group-hover:text-amber-300">
                          Order Lookup & Status
                        </h4>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          Track your Order ID, check live payment confirmation, or add more items.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <span>Track Your Order</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>

                    <button
                      onClick={() => handleNavigateSection('story')}
                      className="text-left p-5 rounded-2xl bg-stone-900/90 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/50 transition group flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center">
                          <Heart className="w-4 h-4" />
                        </div>
                        <h4 className="font-serif font-bold text-white text-sm group-hover:text-amber-300">
                          Founder & Atelier Story
                        </h4>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          Meet Visionary Founder Theresa Isama and discover HOS|TED Hosting Nations.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <span>Read Our Story</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>

                    <button
                      onClick={() => handleNavigateSection('flier')}
                      className="text-left p-5 rounded-2xl bg-stone-900/90 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/50 transition group flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <h4 className="font-serif font-bold text-white text-sm group-hover:text-amber-300">
                          Official Brand Flier
                        </h4>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          View our official showcase flier, specialties, and social channels.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                        <span>View Brand Flier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* 2. Bespoke Tailoring & Sizing View */}
        {(showAllSections || activeSection === 'bespoke') &&
          websiteSettings.showBespokeSection !== false && (
            <BespokeTailoringSection
              onOpenTessyWithGuide={() =>
                handleOpenTessy(
                  'concierge',
                  'How do I accurately measure my bust, waist, hips, and gown length at home for HOS|TED?'
                )
              }
              preselectedCategory={bespokeCategory}
              onOrderSubmitted={fetchPublicStorefrontState}
              settings={websiteSettings}
              products={liveProducts}
              customStyleEdits={customStyleEdits}
            />
          )}

        {/* 3. Order Lookup & Live Status View */}
        {(showAllSections || activeSection === 'order-lookup') && (
          <OrderLookupSection
            settings={websiteSettings}
            onOrderUpdated={fetchPublicStorefrontState}
            activeUser={activeUser}
            onOpenUserAuth={() => setIsAuthModalOpen(true)}
            onRequestCustomTailoring={handleOpenBespokeWithCategory}
          />
        )}

        {/* 4. Founder Theresa Isama & Atelier Story View */}
        {(showAllSections || activeSection === 'story' || activeSection === 'founder') && (
          <AtelierStory
            settings={websiteSettings}
            onFounderImageUpdated={fetchPublicStorefrontState}
          />
        )}

        {/* 5. Official Brand Flier View */}
        {(showAllSections || activeSection === 'flier') &&
          websiteSettings.showFlierSection !== false && (
            <BrandFlierShowcase
              onOpenTessy={() => handleOpenTessy('stylist')}
              onSelectCategory={(cat) => handleOpenBespokeWithCategory(cat)}
            />
          )}
      </main>

      {/* Footer */}
      <Footer
        onOpenTessy={() => handleOpenTessy('stylist')}
        onNavigateSection={handleNavigateSection}
        onOpenStaffModal={() => setIsStaffModalOpen(true)}
        onOpenLegalModal={handleOpenLegalModal}
      />

      {/* Floating Tessy Ai Trigger Pill */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        <button
          onClick={() => handleOpenTessy('stylist')}
          className="group relative flex items-center gap-3 pl-2 pr-4 py-2 rounded-full bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 border border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.4)] transition-all transform hover:scale-105"
        >
          <div className="relative">
            <img
              src={ASSETS.tessyAvatar}
              alt="Tessy Ai"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400 shadow-md"
            />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-stone-950" />
            </span>
          </div>

          <div className="text-left">
            <div className="text-xs font-serif font-bold text-white flex items-center gap-1.5">
              <span>Tessy Ai</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 uppercase tracking-widest font-sans font-semibold">
                HOS|TED
              </span>
            </div>
            <div className="text-[10px] text-stone-400 font-sans">
              {activeUser
                ? `Remembering ${activeUser.name.split(' ')[0]}`
                : 'Stylist & Concierge'}
            </div>
          </div>
        </button>
      </div>

      {/* Tessy Ai Interactive Modal / Drawer */}
      <TessyAIAssistant
        isOpen={isTessyOpen}
        onClose={() => setIsTessyOpen(false)}
        initialMode={tessyMode}
        initialPrompt={tessyInitialPrompt}
        activeUser={activeUser}
        onUserChatUpdated={handleUserChatUpdated}
        onUserProfileSynced={(updatedUser) => {
          handleUserAuthenticated(updatedUser);
          fetchPublicStorefrontState();
        }}
        onStorefrontUpdated={fetchPublicStorefrontState}
      />

      {/* First-Time Visitor Sign-Up & Onboarding / Returning Visitor & Founder Sign-In Modal */}
      <UserAuthOnboardingModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        recognizedEmail={recognizedEmail}
        recognizedName={recognizedName}
        onAuthenticated={handleUserAuthenticated}
        onOpenLegalModal={handleOpenLegalModal}
      />

      {/* Official Terms of Service, Privacy Policy & Security Modal */}
      <LegalPoliciesModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
        settings={websiteSettings}
      />

      {/* Frontend User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={activeUser}
        onUserUpdated={handleUserAuthenticated}
        onSignOut={handleUserSignOut}
        onOpenTessy={() => handleOpenTessy('stylist')}
      />

      {/* HOS|TED Complete Business Management Admin Dashboard */}
      <StaffAtelierModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onStorefrontUpdated={fetchPublicStorefrontState}
      />
    </div>
  );
}
