import React, { useState } from 'react';
import { HostedLogo } from './HostedLogo';
import {
  Sparkles,
  MessageCircle,
  Menu,
  X,
  Scissors,
  BookOpen,
  PackageSearch,
  User,
  Crown,
  UserPlus,
  ShoppingBag,
  Heart,
} from 'lucide-react';
import { BRAND_CONTACTS, ASSETS } from '../constants/assets';
import { ActiveFrontendUser } from './UserAuthOnboardingModal';

interface NavbarProps {
  onOpenTessy: (mode?: 'stylist' | 'concierge') => void;
  onNavigateSection: (sectionId: string) => void;
  activeSection: string;
  activeUser?: ActiveFrontendUser | null;
  onOpenUserAuth?: () => void;
  onOpenUserProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTessy,
  onNavigateSection,
  activeSection,
  activeUser = null,
  onOpenUserAuth,
  onOpenUserProfile,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    onNavigateSection(sectionId);
    setMobileMenuOpen(false);
  };

  const isShopActive = activeSection === 'hero' || activeSection === 'collections';
  const isStoryActive = activeSection === 'story' || activeSection === 'founder';

  return (
    <header className="sticky top-0 z-40 w-full bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div
            onClick={() => handleNavClick('collections')}
            className="cursor-pointer transition hover:opacity-90"
          >
            <HostedLogo variant="light" size="md" />
          </div>

          {/* Desktop Orderly Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-2xl bg-stone-900/90 border border-stone-800 text-xs font-medium tracking-wide">
            <button
              onClick={() => handleNavClick('collections')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                isShopActive
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shop & Collections</span>
            </button>

            <button
              onClick={() => handleNavClick('bespoke')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeSection === 'bespoke'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Bespoke Tailoring</span>
            </button>

            <button
              onClick={() => handleNavClick('order-lookup')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeSection === 'order-lookup'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <PackageSearch className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </button>

            <button
              onClick={() => handleNavClick('story')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                isStoryActive
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Founder & Story</span>
            </button>

            <button
              onClick={() => handleNavClick('flier')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeSection === 'flier'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Brand Flier</span>
            </button>
          </nav>

          {/* Quick CTA & User Profile Actions */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Tessy Ai trigger */}
            <button
              onClick={() => onOpenTessy('stylist')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 transition"
              title="Open Tessy Ai (Nigerian Female Voice)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-xs">Tessy Ai</span>
            </button>

            {activeUser ? (
              <button
                onClick={onOpenUserProfile}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition ${
                  activeUser.isFounder
                    ? 'bg-amber-400/20 hover:bg-amber-400/30 border-amber-400 text-amber-200'
                    : 'bg-stone-900 hover:bg-stone-800 border-amber-500/40 text-stone-100'
                }`}
                title="View Your HOS|TED Profile & Saved Preferences"
              >
                {activeUser.isFounder ? (
                  <img
                    src={ASSETS.tessyAvatar}
                    alt={activeUser.name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-amber-400"
                  />
                ) : (
                  <User className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="max-w-[120px] truncate">
                  {activeUser.isFounder ? 'Queen Theresa' : activeUser.name.split(' ')[0]}
                </span>
                {activeUser.isFounder && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </button>
            ) : (
              <button
                onClick={onOpenUserAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold tracking-wider text-amber-300 bg-stone-900 hover:bg-stone-800 border border-amber-500/40 rounded-xl transition"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign Up / Sign In</span>
              </button>
            )}

            <a
              href={`${BRAND_CONTACTS.whatsappUrl}?text=${encodeURIComponent(
                'Hello HOS|TED! I would like to inquire about your collections and bespoke tailoring.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-sm transition"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-stone-950" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {activeUser ? (
              <button
                onClick={onOpenUserProfile}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-amber-300 bg-stone-900 border border-amber-500/40 rounded-lg"
                title="My Profile"
              >
                {activeUser.isFounder ? (
                  <Crown className="w-4 h-4 text-amber-400" />
                ) : (
                  <User className="w-4 h-4 text-amber-400" />
                )}
                <span className="max-w-[80px] truncate">{activeUser.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={onOpenUserAuth}
                className="px-2.5 py-1.5 text-xs font-bold text-amber-300 bg-stone-900 border border-amber-500/40 rounded-lg flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={() => onOpenTessy('stylist')}
              className="p-2 text-amber-400 bg-amber-950/40 border border-amber-500/30 rounded-lg"
              title="Tessy Ai"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-300 hover:text-white rounded-lg bg-stone-900 border border-stone-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-900/95 border-b border-stone-800 px-6 py-5 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-2 font-medium text-stone-200">
            {activeUser ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenUserProfile?.();
                }}
                className="text-left p-3 rounded-xl bg-stone-950 border border-amber-500/40 flex items-center justify-between"
              >
                <span className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  {activeUser.isFounder ? (
                    <Crown className="w-4 h-4 text-amber-400" />
                  ) : (
                    <User className="w-4 h-4 text-amber-400" />
                  )}
                  <span>
                    {activeUser.name} ({activeUser.isFounder ? 'Founder & Owner' : 'My Profile'})
                  </span>
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-bold">
                  View Profile
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenUserAuth?.();
                }}
                className="text-left p-3 rounded-xl bg-stone-950 border border-amber-500/40 flex items-center justify-between text-amber-300 font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>New Visitor Sign Up / Returning Sign In</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-stone-950 font-bold">
                  Open
                </span>
              </button>
            )}

            <button
              onClick={() => handleNavClick('collections')}
              className={`text-left px-3 py-2.5 rounded-xl flex items-center gap-2 ${
                isShopActive ? 'bg-amber-400 text-stone-950 font-bold' : 'hover:text-amber-400'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop & Collections</span>
            </button>

            <button
              onClick={() => handleNavClick('bespoke')}
              className={`text-left px-3 py-2.5 rounded-xl flex items-center gap-2 ${
                activeSection === 'bespoke'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'hover:text-amber-400'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Bespoke Tailoring & Measurements</span>
            </button>

            <button
              onClick={() => handleNavClick('order-lookup')}
              className={`text-left px-3 py-2.5 rounded-xl flex items-center gap-2 ${
                activeSection === 'order-lookup'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'hover:text-amber-400'
              }`}
            >
              <PackageSearch className="w-4 h-4" />
              <span>Order Lookup & Live Status</span>
            </button>

            <button
              onClick={() => handleNavClick('story')}
              className={`text-left px-3 py-2.5 rounded-xl flex items-center gap-2 ${
                isStoryActive ? 'bg-amber-400 text-stone-950 font-bold' : 'hover:text-amber-400'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Founder Theresa Isama & Story</span>
            </button>

            <button
              onClick={() => handleNavClick('flier')}
              className={`text-left px-3 py-2.5 rounded-xl flex items-center gap-2 ${
                activeSection === 'flier'
                  ? 'bg-amber-400 text-stone-950 font-bold'
                  : 'hover:text-amber-400'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Official Brand Flier</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTessy('stylist');
              }}
              className="text-left px-3 py-2.5 rounded-xl text-amber-400 font-semibold flex items-center justify-between bg-stone-950 border border-stone-800"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Tessy Ai (Nigerian Voice)</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Open
              </span>
            </button>
          </div>

          <div className="pt-3 border-t border-stone-800 flex flex-col gap-2">
            <a
              href={`${BRAND_CONTACTS.whatsappUrl}?text=${encodeURIComponent(
                'Hello HOS|TED! I would like to inquire about your collections and bespoke tailoring.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-950 bg-amber-400 rounded-lg"
            >
              <MessageCircle className="w-4 h-4 fill-stone-950" />
              Chat on WhatsApp ({BRAND_CONTACTS.phoneFormatted})
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
