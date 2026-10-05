import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  RefreshCw,
  HelpCircle,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { WebsiteSettings } from '../types';
import { HostedLogo } from './HostedLogo';

export type LegalTabType = 'terms' | 'privacy' | 'returns' | 'security';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTabType;
  settings?: WebsiteSettings;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const termsText =
    settings?.termsOfServiceText ||
    `1. Bespoke & Ready-to-Wear Orders: Every HOS|TED garment is tailored with precision under the creative direction of Founder Theresa Isama. Custom bespoke orders begin production immediately upon payment confirmation.\n\n2. Accurate Measurements & Sizing: Clients may select from our Layman-Friendly Size Guide (S to 3XL & Free Size) or submit exact body measurements in inches. Tessy Ai is available 24/7 to assist with measurement accuracy.\n\n3. Nationwide & International Delivery: HOS|TED delivers across all 36 Nigerian states, FCT Abuja, and international destinations via insured doorstep courier or terminal pickup.\n\n4. Account & Platform Security: Each registered client account is protected with real-time One-Time Password (OTP) email verification, encrypted credentials, and anti-fraud monitoring.`;

  const privacyText =
    settings?.privacyPolicyText ||
    `1. Personal & Measurement Data Protection: HOS|TED collects only your name, verified email address, WhatsApp phone number, body measurements, style preferences, and delivery address solely to craft and deliver your garments.\n\n2. Strict Confidentiality: Your personal measurements, order history, and Tessy Ai styling conversations are encrypted and never sold or shared with third-party marketers.\n\n3. Real-Time OTP & Account Security: We use cryptographic 6-digit One-Time Passwords (OTP) and automated Web Application Firewall (WAF) protection to safeguard your profile from unauthorized access.\n\n4. Your Rights: You may view, update, or request deletion of your saved profile and chat memory at any time from your profile or by contacting HOS|TED.`;

  const returnsText =
    settings?.returnRefundPolicyText ||
    `1. Quality Guarantee: Every HOS|TED piece undergoes strict quality inspection before dispatch.\n\n2. Fit Adjustments & Alterations: If a bespoke garment requires a fit adjustment upon arrival, notify HOS|TED within 48 hours of delivery with photos on WhatsApp (+234 907 378 4461) for priority alteration support.\n\n3. Custom Tailoring Policy: Because bespoke pieces are cut to your individual measurements and fabric choice, custom orders are eligible for fit alteration or exchange rather than cash refunds once fabric has been cut.`;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-stone-900 border border-amber-500/40 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <HostedLogo variant="gold" size="sm" />
            <div className="border-l border-stone-800 pl-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                HOS|TED Hosting Nations · Legal, Privacy & Security
              </div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                Official Terms, Privacy Policy & Client Guarantees
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-4 bg-stone-900 border-b border-stone-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'terms'
                ? 'bg-amber-400 text-stone-950 shadow'
                : 'bg-stone-950 text-stone-300 hover:text-white border border-stone-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'privacy'
                ? 'bg-amber-400 text-stone-950 shadow'
                : 'bg-stone-950 text-stone-300 hover:text-white border border-stone-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('returns')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'returns'
                ? 'bg-amber-400 text-stone-950 shadow'
                : 'bg-stone-950 text-stone-300 hover:text-white border border-stone-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tailoring, Delivery & Alteration Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'security'
                ? 'bg-amber-400 text-stone-950 shadow'
                : 'bg-stone-950 text-stone-300 hover:text-white border border-stone-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & FAQ</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-sm text-stone-300 leading-relaxed">
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>HOS|TED Terms of Service & Bespoke Tailoring Agreement</span>
              </div>
              <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 whitespace-pre-line text-xs sm:text-sm text-stone-200 leading-relaxed">
                {termsText}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                <span>HOS|TED Client Privacy & Measurement Data Protection Policy</span>
              </div>
              <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 whitespace-pre-line text-xs sm:text-sm text-stone-200 leading-relaxed">
                {privacyText}
              </div>
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <RefreshCw className="w-4 h-4" />
                <span>Tailoring Guarantee, Nationwide Delivery & Alteration Policy</span>
              </div>
              <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 whitespace-pre-line text-xs sm:text-sm text-stone-200 leading-relaxed">
                {returnsText}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>High-Level Account Protection & Frequently Asked Questions</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-stone-950 border border-emerald-500/30 space-y-1.5">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Real-Time Email OTP Verification</span>
                  </div>
                  <p className="text-stone-400">
                    Every new account registration is verified with a cryptographic 6-digit One-Time Password (OTP) sent to your email.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950 border border-emerald-500/30 space-y-1.5">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Scrypt Password Hashing & WAF</span>
                  </div>
                  <p className="text-stone-400">
                    Passwords are encrypted with salted Scrypt hashing, while our active Web Application Firewall blocks script injection and brute-force attacks.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3 text-xs">
                <div className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>Quick Client FAQ</span>
                </div>
                <div>
                  <strong className="text-white block">How do I confirm my payment on WhatsApp?</strong>
                  <span className="text-stone-400">
                    After transferring to the official HOS|TED account ({settings?.paymentAccountNumber || '9073784461'} — {settings?.paymentAccountName || 'Theresa Isama (HOS|TED)'}), click "Request Order Status on WhatsApp". The real outfit photo is loaded directly into your WhatsApp message along with your Order ID.
                  </span>
                </div>
                <div>
                  <strong className="text-white block">Can I edit my measurements or delivery address anytime?</strong>
                  <span className="text-stone-400">
                    Yes! Click "My Profile" in the top navigation bar or tell Tessy Ai your updated measurements, size, or address and they will sync live.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-stone-950 border-t border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>HOS|TED — Hosting Nations · Founded by Theresa Isama</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
