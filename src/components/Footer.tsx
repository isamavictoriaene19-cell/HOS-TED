import React from 'react';
import { HostedLogo } from './HostedLogo';
import {
  MessageCircle,
  Phone,
  Instagram,
  Facebook,
  Video,
  Lock,
  Scissors,
  Sparkles,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { BRAND_CONTACTS } from '../constants/assets';
import { LegalTabType } from './LegalPoliciesModal';

interface FooterProps {
  onOpenTessy: () => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenStaffModal: () => void;
  onOpenLegalModal?: (tab: LegalTabType) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenTessy,
  onNavigateSection,
  onOpenStaffModal,
  onOpenLegalModal,
}) => {
  return (
    <footer className="bg-stone-950 border-t border-stone-800/80 text-stone-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <HostedLogo variant="gold" size="md" />
            <div className="text-xs font-serif font-bold uppercase tracking-widest text-amber-400">
              HOS|TED Hosting Nations
            </div>
            <p className="text-stone-400 text-sm leading-relaxed max-w-sm">
              Specializing in elegant everyday wear and beautifully tailored Ankara pieces, crafted to deliver comfort, style, and confidence for every occasion.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href={`${BRAND_CONTACTS.whatsappUrl}?text=${encodeURIComponent('Hello HOS|TED! I would like to inquire about your collections.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-emerald-500/20 text-stone-300 hover:text-emerald-400 border border-stone-800 transition flex items-center justify-center"
                title="WhatsApp 09073784461"
              >
                <MessageCircle className="w-4 h-4" />
              </a>

              <a
                href={BRAND_CONTACTS.tiktokUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-pink-500/20 text-stone-300 hover:text-pink-400 border border-stone-800 transition flex items-center justify-center"
                title="TikTok: @theresaisama"
              >
                <Video className="w-4 h-4" />
              </a>

              <a
                href={BRAND_CONTACTS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-amber-500/20 text-stone-300 hover:text-amber-400 border border-stone-800 transition flex items-center justify-center"
                title="Instagram: @Tessy Isima"
              >
                <Instagram className="w-4 h-4" />
              </a>

              <a
                href={BRAND_CONTACTS.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-blue-500/20 text-stone-300 hover:text-blue-400 border border-stone-800 transition flex items-center justify-center"
                title="Facebook: @Tessy Isima"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Collections */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-white uppercase tracking-wider text-xs">
              HOS|TED Collections
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigateSection('collections')}
                  className="hover:text-amber-400 transition font-semibold text-amber-300"
                >
                  Materials (Luxury Fabrics)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('collections')}
                  className="hover:text-amber-400 transition"
                >
                  Everyday Wears
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('collections')}
                  className="hover:text-amber-400 transition"
                >
                  Skirt and Blouse
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('collections')}
                  className="hover:text-amber-400 transition"
                >
                  Ankara Gowns
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('collections')}
                  className="hover:text-amber-400 transition"
                >
                  Bubu Gowns
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('collections')}
                  className="hover:text-amber-400 transition"
                >
                  Chic Casual Outfits
                </button>
              </li>
            </ul>
          </div>

          {/* Atelier Services & Legal Policies */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-white uppercase tracking-wider text-xs">
              Services & Policies
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigateSection('bespoke')}
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <Scissors className="w-3.5 h-3.5 text-amber-400" />
                  <span>Custom Measurements</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateSection('order-lookup')}
                  className="hover:text-amber-400 transition font-semibold text-stone-200"
                >
                  Order Lookup & Past Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenTessy()}
                  className="hover:text-amber-300 transition flex items-center gap-1.5 text-amber-400 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tessy Ai</span>
                </button>
              </li>
              {onOpenLegalModal && (
                <>
                  <li>
                    <button
                      onClick={() => onOpenLegalModal('terms')}
                      className="hover:text-amber-400 transition flex items-center gap-1.5"
                    >
                      <FileText className="w-3 h-3 text-amber-400/80" />
                      <span>Terms of Service</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onOpenLegalModal('privacy')}
                      className="hover:text-amber-400 transition flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-400/80" />
                      <span>Privacy Policy</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => onOpenLegalModal('returns')}
                      className="hover:text-amber-400 transition"
                    >
                      Tailoring & Alteration Policy
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Direct Atelier Contact */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-white uppercase tracking-wider text-xs">
              Direct Contact
            </h4>
            <div className="space-y-2.5">
              <a
                href={`${BRAND_CONTACTS.whatsappUrl}?text=${encodeURIComponent('Hello HOS|TED! I would like to inquire about your collections.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-amber-400 transition text-stone-300"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono">{BRAND_CONTACTS.phoneFormatted}</span>
              </a>
              <div className="text-stone-400 text-xs">
                Founder: <span className="text-stone-200 font-medium">Theresa Isama</span>
              </div>
              <div className="text-stone-400 text-xs">
                TikTok: <span className="text-stone-200 font-medium">@{BRAND_CONTACTS.tiktokHandle}</span>
              </div>
              <div className="text-stone-400 text-xs">
                IG & FB: <span className="text-stone-200 font-medium">{BRAND_CONTACTS.instagramHandle}</span>
              </div>
              <div className="pt-1 text-[11px] text-amber-400/90">
                Nationwide Delivery Across Nigeria & International
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Sub-bar */}
        <div className="mt-12 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <span>© {new Date().getFullYear()} HOS|TED — Hosting Nations. Founded by Theresa Isama.</span>
            {onOpenLegalModal && (
              <div className="flex items-center gap-2 text-stone-400">
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('terms')}
                  className="hover:text-amber-400 underline underline-offset-2 transition"
                >
                  Terms
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('privacy')}
                  className="hover:text-amber-400 underline underline-offset-2 transition"
                >
                  Privacy Policy
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onOpenLegalModal('security')}
                  className="hover:text-emerald-400 underline underline-offset-2 transition"
                >
                  OTP Security & FAQ
                </button>
              </div>
            )}
          </div>

          {/* Discreet Bottom Trigger */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenStaffModal}
              className="text-stone-600 hover:text-stone-400 flex items-center gap-1 transition text-[10px]"
              title="Portal"
            >
              <Lock className="w-3 h-3 opacity-60" />
              <span>Portal</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
