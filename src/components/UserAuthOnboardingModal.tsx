import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  UserPlus,
  LogIn,
  Crown,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Scissors,
  Truck,
  HelpCircle,
  X,
  Lock,
  Mail,
  Phone,
  User,
  Palette,
  Ruler,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { CustomerRecord, CustomAttachmentFile } from '../types';
import {
  FacialRecognitionCapture,
  CustomFilesAttachmentBox,
} from './FacialRecognitionCapture';
import {
  ASSETS,
  NIGERIAN_STATES,
  LAYMAN_SIZE_GUIDE,
  LAYMAN_COLOR_GUIDE,
  findLaymanSizeOption,
  findLaymanColorOption,
} from '../constants/assets';
import { HostedLogo } from './HostedLogo';
import { LegalTabType } from './LegalPoliciesModal';

const FOUNDER_EMAIL = 'isamatheresa12@gmail.com';
const isFounderEmail = (val?: string) =>
  Boolean(val && val.trim().toLowerCase() === FOUNDER_EMAIL);

export interface ActiveFrontendUser extends CustomerRecord {
  tailoredGreeting?: string;
}

interface UserAuthOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recognizedEmail?: string;
  recognizedName?: string;
  onAuthenticated: (user: ActiveFrontendUser) => void;
  onOpenLegalModal?: (tab: LegalTabType) => void;
}

export const UserAuthOnboardingModal: React.FC<UserAuthOnboardingModalProps> = ({
  isOpen,
  onClose,
  recognizedEmail = '',
  recognizedName = '',
  onAuthenticated,
  onOpenLegalModal,
}) => {
  // 'signup' for first-time visitors, 'signin' for returning recognized visitors
  const [authTab, setAuthTab] = useState<'signup' | 'signin'>(
    recognizedEmail ? 'signin' : 'signup'
  );
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(recognizedEmail || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Real-Time Email One-Time Password (OTP) Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpStatusMessage, setOtpStatusMessage] = useState('');
  const [sandboxOtpPreview, setSandboxOtpPreview] = useState('');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState('');

  // Step 2 Onboarding fields (with layman-friendly defaults)
  const [preferredStyle, setPreferredStyle] = useState('Ankara Gowns & Bubu Couture');
  const [preferredSize, setPreferredSize] = useState(
    'Medium (Regular / Average Fit — UK 10–12)'
  );
  const [favoriteColors, setFavoriteColors] = useState(
    'Gold / Yellow (Bright Royal Gold)'
  );
  const [deliveryState, setDeliveryState] = useState('Lagos');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showSimpleSizeGuide, setShowSimpleSizeGuide] = useState(false);

  // Facial Recognition Photo & Custom Bespoke Attachments on Sign-Up
  const [facialPhotoUrl, setFacialPhotoUrl] = useState('');
  const [customAttachments, setCustomAttachments] = useState<CustomAttachmentFile[]>([]);

  // Founder detection state
  const [isFounderDetected, setIsFounderDetected] = useState(
    isFounderEmail(recognizedEmail)
  );
  const [completedUser, setCompletedUser] = useState<ActiveFrontendUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (recognizedEmail) {
      setEmail(recognizedEmail);
      setAuthTab('signin');
      if (isFounderEmail(recognizedEmail)) {
        setIsFounderDetected(true);
      }
    }
  }, [recognizedEmail]);

  if (!isOpen) return null;

  const selectedSizeGuide = findLaymanSizeOption(preferredSize);
  const selectedColorGuide = findLaymanColorOption(favoriteColors);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setErrorMsg('');
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
    setOtpStatusMessage('');
    setSandboxOtpPreview('');
    if (isFounderEmail(val)) {
      // Never detect Founder emails as a new user — recognize her as Founder & Owner!
      setIsFounderDetected(true);
      setAuthTab('signin');
    } else {
      setIsFounderDetected(false);
    }
  };

  // Send 6-Digit One-Time Password (OTP) to User's Email in Real Time
  const handleSendEmailOtp = async () => {
    setErrorMsg('');
    setOtpStatusMessage('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address first to receive your 6-digit OTP verification code.');
      return;
    }

    if (isFounderEmail(cleanEmail)) {
      setIsFounderDetected(true);
      setAuthTab('signin');
      return;
    }

    setIsSendingOtp(true);
    try {
      const checkRes = await fetch('/api/users/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, phone }),
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.isFounder) {
          setIsFounderDetected(true);
          setAuthTab('signin');
          setIsSendingOtp(false);
          return;
        }
        if (checkData.exists) {
          setAuthTab('signin');
          setErrorMsg(
            `Welcome back, ${checkData.name}! Your email is already registered—please sign in below.`
          );
          setIsSendingOtp(false);
          return;
        }
      }

      const res = await fetch('/api/users/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: fullName.trim() || 'Valued Client',
          purpose: 'REGISTRATION_OTP',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not send OTP to your email.');
      }

      setOtpSent(true);
      setOtpVerified(false);
      setOtpStatusMessage(data.message || `6-digit OTP code dispatched to ${cleanEmail}.`);
      if (data.sandboxOtpPreview) {
        setSandboxOtpPreview(String(data.sandboxOtpPreview));
      }
      if (data.previewUrl) {
        setEmailPreviewUrl(String(data.previewUrl));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send OTP email.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify the 6-digit OTP code entered by the user
  const handleVerifyEmailOtp = async (codeToVerify: string = otpCode) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = codeToVerify.replace(/\s+/g, '');
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg('Please enter the 6-digit OTP code sent to your email.');
      return false;
    }

    setIsVerifyingOtp(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/users/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP code.');
      }
      setOtpVerified(true);
      setOtpStatusMessage(`Email verified (${cleanEmail}) ✓`);
      return true;
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid OTP code.');
      return false;
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 1 -> Step 2 validation (Requires real-time Email OTP verification + Terms & Privacy acceptance)
  const handleProceedToStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();

    if (isFounderEmail(cleanEmail)) {
      setIsFounderDetected(true);
      setAuthTab('signin');
      return;
    }

    if (!fullName.trim() || !cleanEmail || !phone.trim() || !password.trim()) {
      setErrorMsg('Please fill in your full name, email, WhatsApp phone number, and password.');
      return;
    }

    if (password.trim().length < 6) {
      setErrorMsg('For high-level account security, please choose a password of at least 6 characters.');
      return;
    }

    if (!acceptedTerms) {
      setErrorMsg('Please accept the HOS|TED Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (!otpSent) {
      await handleSendEmailOtp();
      return;
    }

    if (!otpVerified) {
      const verifiedNow = await handleVerifyEmailOtp(otpCode);
      if (!verifiedNow) return;
    }

    setOnboardingStep(2);
  };

  // Complete Sign-Up & Onboarding (Step 2 -> Step 3) — Saves exact real-time user data
  const handleCompleteSignupOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const approxMeasurements = selectedSizeGuide?.approxInches?.bust
        ? {
            bust: selectedSizeGuide.approxInches.bust,
            waist: selectedSizeGuide.approxInches.waist,
            hips: selectedSizeGuide.approxInches.hips,
            shoulder: selectedSizeGuide.approxInches.shoulder,
            dressLength: selectedSizeGuide.approxInches.dressLength,
            sleeveLength: selectedSizeGuide.approxInches.sleeveLength,
            sizeNote: selectedSizeGuide.everydayName,
          }
        : {};

      const res = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          preferredStyle: preferredStyle.trim(),
          preferredSize: preferredSize.trim(),
          favoriteColors: favoriteColors.trim(),
          deliveryState: deliveryState.trim(),
          deliveryCity: deliveryCity.trim(),
          deliveryAddress: deliveryAddress.trim(),
          measurements: approxMeasurements,
          otpCode: otpCode.trim(),
          acceptedTerms,
          facialPhotoUrl,
          customAttachments,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.exists) {
          setAuthTab('signin');
        }
        throw new Error(data.error || 'Could not complete sign-up.');
      }

      if (data.user) {
        setCompletedUser(data.user);
        setOnboardingStep(3);
        onAuthenticated(data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Sign-up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Returning User or Founder Sign-In
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Please enter your registered email address or phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/users/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.notFound && email.trim().toLowerCase() !== FOUNDER_EMAIL) {
          setAuthTab('signup');
          setOnboardingStep(1);
        }
        throw new Error(data.error || 'Sign-in failed.');
      }

      if (data.user) {
        setCompletedUser(data.user);
        setOnboardingStep(3);
        onAuthenticated(data.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-stone-900 border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Top Brand Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/50 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <HostedLogo variant="gold" size="sm" />
            <div className="border-l border-stone-700 pl-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                HOS|TED Hosting Nations
              </div>
              <div className="text-xs text-stone-300">
                {onboardingStep === 3
                  ? completedUser?.isFounder
                    ? 'Founder & Owner Royal Welcome'
                    : 'Welcome to HOS|TED'
                  : isFounderDetected
                  ? 'Founder & Owner Recognition'
                  : authTab === 'signup'
                  ? `New Visitor Onboarding (Step ${onboardingStep} of 2)`
                  : 'Returning Member Sign In'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-stone-950/80 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 transition shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto">
          {/* STEP 3: TAILORED GREETING (FOR FOUNDER OR SIGNED-IN / ONBOARDED USER) */}
          {onboardingStep === 3 && completedUser ? (
            <div className="space-y-6 text-center py-2">
              <div className="relative w-24 h-24 mx-auto">
                <img
                  src={ASSETS.tessyAvatar}
                  alt={completedUser.isFounder ? 'Theresa Isama' : 'Tessy Ai'}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-amber-400 shadow-2xl mx-auto"
                />
                <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg">
                  {completedUser.isFounder ? (
                    <Crown className="w-4 h-4 fill-stone-950" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </span>
              </div>

              {completedUser.isFounder ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-400 text-amber-300 text-xs font-bold uppercase tracking-widest">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Founder & Owner of HOS|TED Recognized</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
                    Welcome Home, Queen Theresa Isama! 👑✨
                  </h3>
                  <p className="text-sm text-stone-200 leading-relaxed max-w-lg mx-auto bg-gradient-to-br from-amber-950/50 via-stone-950 to-stone-900 p-4 rounded-2xl border border-amber-500/40">
                    “Blessed greetings to our visionary Founder, Owner, and Creative Director of{' '}
                    <strong className="text-amber-400">HOS|TED (HOS|TED Hosting Nations)</strong>! Your elegance inspires every stitch we craft.{' '}
                    <strong className="text-amber-300">Tessy Ai</strong> has all your live orders, registered clients, and conversations ready for you.”
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tailored HOS|TED Member Greeting</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                    Welcome back to HOS|TED, {completedUser.name}! ✨
                  </h3>
                </div>
              )}

              {/* Saved Real-Time Profile Summary (Fixed wrapping & responsive grid so email never overlaps Membership) */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-left grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="min-w-0 p-3 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-0.5">
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                    Member Name & Contact
                  </span>
                  <strong className="text-white block text-sm truncate">
                    {completedUser.name}
                  </strong>
                  {completedUser.email && (
                    <span className="block text-[11px] text-stone-300 font-mono break-all leading-snug">
                      {completedUser.email}
                    </span>
                  )}
                  {completedUser.phone && (
                    <span className="block text-[11px] text-stone-400 font-mono">
                      {completedUser.phone}
                    </span>
                  )}
                </div>

                <div className="min-w-0 p-3 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-0.5">
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                    Membership
                  </span>
                  <strong className="text-amber-400 block text-sm break-words">
                    {completedUser.roleLabel || 'Registered HOS|TED Client'}
                  </strong>
                  <span className="block text-[11px] text-emerald-400 font-medium">
                    Profile Active ✓
                  </span>
                </div>

                <div className="min-w-0 p-3 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-0.5">
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                    Saved Size & Color
                  </span>
                  <strong className="text-stone-200 block break-words">
                    {completedUser.preferredSize || 'Standard Fit'}
                  </strong>
                  <span className="block text-[11px] text-amber-300 break-words">
                    {completedUser.favoriteColors || 'Gold'}
                  </span>
                </div>

                <div className="min-w-0 p-3 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-0.5">
                  <span className="text-stone-400 block text-[10px] uppercase tracking-wider">
                    Tessy Ai Memory
                  </span>
                  <strong className="text-emerald-400 block">
                    Active ({completedUser.chatHistory?.length || 1} saved messages)
                  </strong>
                  <span className="block text-[11px] text-stone-400 break-words leading-snug">
                    {[completedUser.delivery?.address, completedUser.delivery?.city, completedUser.delivery?.state]
                      .filter(Boolean)
                      .join(', ') || 'Nigeria'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <span>Explore HOS|TED Collections</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Switcher Tabs (New Visitor Sign Up vs Returning Member Sign In) */}
              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-stone-950 rounded-2xl border border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signup');
                    setOnboardingStep(1);
                    setErrorMsg('');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                    authTab === 'signup' && !isFounderDetected
                      ? 'bg-amber-400 text-stone-950 shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>New Visitor Sign Up</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signin');
                    setErrorMsg('');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                    authTab === 'signin' || isFounderDetected
                      ? 'bg-amber-400 text-stone-950 shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Returning Sign In</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* RETURNING USER OR FOUNDER SIGN-IN */}
              {authTab === 'signin' || isFounderDetected ? (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  {isFounderDetected ? (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-stone-900 to-amber-950/40 border border-amber-400/50 flex items-center gap-3.5">
                      <img
                        src={ASSETS.tessyAvatar}
                        alt="Theresa Isama"
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-400 shrink-0"
                      />
                      <div className="text-xs space-y-1">
                        <div className="inline-flex items-center gap-1 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
                          <Crown className="w-3.5 h-3.5" />
                          <span>Founder & Owner of HOS|TED Detected</span>
                        </div>
                        <h4 className="text-base font-serif font-bold text-white">
                          Welcome Home, Theresa Isama! ✨
                        </h4>
                        <p className="text-stone-300">
                          Your email (<span className="font-mono text-amber-300">{FOUNDER_EMAIL}</span>) is recognized as the Founder & Owner of HOS|TED. Enter your password below.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <h3 className="text-xl font-serif font-bold text-white">
                        {recognizedName
                          ? `Welcome Back to HOS|TED, ${recognizedName}!`
                          : 'Welcome Back to HOS|TED'}
                      </h3>
                      <p className="text-xs text-stone-400">
                        Sign in so <strong className="text-amber-400">Tessy Ai</strong> can greet you by name and restore your previous chats, measurements, and orders.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1.5">
                      Registered Email or WhatsApp Phone *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="e.g. yourname@email.com or 08012345678"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {isLoading
                        ? 'Signing In...'
                        : isFounderDetected
                        ? 'Sign In as Founder & Owner (Theresa Isama)'
                        : 'Sign In to HOS|TED'}
                    </span>
                  </button>
                </form>
              ) : onboardingStep === 1 ? (
                /* NEW USER SIGN UP — STEP 1: ACCOUNT DETAILS */
                <form onSubmit={handleProceedToStep2} className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        Step 1 of 2 • Quick New User Sign-Up
                      </span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white">
                      Welcome to HOS|TED — Create Your Profile
                    </h3>
                    <p className="text-xs text-stone-400">
                      Sign up once so we can recognize you on every visit and let <strong className="text-amber-400">Tessy Ai</strong> remember your name and chats.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Chidinma Okafor"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-300 mb-1">
                        WhatsApp Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="08012345678"
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-300 mb-1">
                      Create a Password (Encrypted with Scrypt Security) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a secure password (min 6 characters)"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Real-Time Email One-Time Password (OTP) Verification Box */}
                  <div className="p-4 rounded-2xl bg-stone-950 border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Real-Time Email OTP Verification *</span>
                      </div>
                      {otpVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Email Verified ✓</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={isSendingOtp || !email.trim()}
                          className="px-3 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSendingOtp ? 'animate-spin' : ''}`} />
                          <span>{otpSent ? 'Resend 6-Digit OTP' : 'Send 6-Digit OTP to Email'}</span>
                        </button>
                      )}
                    </div>

                    {!otpSent && !otpVerified ? (
                      <p className="text-[11px] text-stone-400">
                        Click <strong>"Send 6-Digit OTP to Email"</strong> (or click Next below) to receive a one-time security code at your email address.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {otpStatusMessage && (
                          <div className="text-[11px] text-emerald-300 font-medium">
                            {otpStatusMessage}
                          </div>
                        )}

                        {sandboxOtpPreview && !otpVerified && (
                          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-400/40 flex items-center justify-between gap-2 text-xs">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-amber-300 block font-bold">
                                Instant Real-Time OTP Relay Dispatch:
                              </span>
                              <span className="text-stone-300 text-[11px]">
                                Your 6-digit verification code is{' '}
                                <strong className="font-mono text-amber-300 text-sm tracking-widest">
                                  {sandboxOtpPreview}
                                </strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOtpCode(sandboxOtpPreview);
                                handleVerifyEmailOtp(sandboxOtpPreview);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[11px] shrink-0"
                            >
                              Auto-Fill & Verify
                            </button>
                          </div>
                        )}

                        {!otpVerified && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="Enter 6-digit OTP code"
                              className="flex-1 bg-stone-900 border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-widest text-amber-300 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => handleVerifyEmailOtp(otpCode)}
                              disabled={isVerifyingOtp || otpCode.length < 6}
                              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition disabled:opacity-50"
                            >
                              {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                            </button>
                          </div>
                        )}

                        {emailPreviewUrl && (
                          <div className="text-[10px] text-stone-400">
                            <a
                              href={emailPreviewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 underline hover:text-amber-300"
                            >
                              View Dispatched Email Message Certificate ↗
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Terms of Service & Privacy Policy Consent */}
                  <div className="p-3 rounded-xl bg-stone-950/90 border border-stone-800 flex items-start gap-2.5 text-xs">
                    <input
                      id="accept-terms-checkbox"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-0.5 rounded border-stone-700 text-amber-400 focus:ring-amber-400"
                    />
                    <label htmlFor="accept-terms-checkbox" className="text-[11px] text-stone-300 leading-relaxed">
                      I agree to the HOS|TED{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegalModal?.('terms')}
                        className="text-amber-400 hover:text-amber-300 underline font-semibold"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={() => onOpenLegalModal?.('privacy')}
                        className="text-amber-400 hover:text-amber-300 underline font-semibold"
                      >
                        Privacy & Data Protection Policy
                      </button>
                      .
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || isSendingOtp || isVerifyingOtp}
                    className="w-full py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
                  >
                    <span>
                      {isSendingOtp
                        ? 'Sending 6-Digit OTP to Your Email...'
                        : isVerifyingOtp
                        ? 'Verifying OTP Code...'
                        : !otpSent
                        ? 'Send Email OTP & Continue'
                        : !otpVerified
                        ? 'Verify Email OTP & Proceed to Step 2'
                        : 'Next: Easy Style, Size & Color Setup'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* NEW USER SIGN UP — STEP 2: LAYMAN-FRIENDLY STYLE, SIZE, COLOR & DELIVERY ONBOARDING */
                <form onSubmit={handleCompleteSignupOnboarding} className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        Step 2 of 2 • Easy Style, Size & Color Onboarding
                      </span>
                      <button
                        type="button"
                        onClick={() => setOnboardingStep(1)}
                        className="text-xs text-stone-400 hover:text-white flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Back</span>
                      </button>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white">
                      Personalize Your Fit & Colors, {fullName.split(' ')[0]}
                    </h3>
                    <p className="text-xs text-stone-400">
                      No fashion jargon or tape measure needed! Pick what feels most like you in plain everyday terms.
                    </p>
                  </div>

                  {/* 1. Preferred HOS|TED Style */}
                  <div className="text-xs">
                    <label className="block font-semibold text-stone-200 mb-1.5 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-amber-400" />
                      <span>1. What Kind of Outfits Do You Love Most?</span>
                    </label>
                    <select
                      value={preferredStyle}
                      onChange={(e) => setPreferredStyle(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                    >
                      <option value="Ankara Gowns & Bubu Couture">Ankara Gowns & Flowing Bubu (Party & Owambe)</option>
                      <option value="Everyday Wears (Tops & Pants)">Everyday Wears (Comfortable Tops & Trousers)</option>
                      <option value="Skirt and Blouse Sets">Traditional Skirt & Blouse Sets</option>
                      <option value="Regal Silk & Damask Bubu">Loose, Rich-Aunty Silk & Damask Bubu Gowns</option>
                      <option value="Chic Casual Co-ords & Kimonos">Casual Two-Piece Sets & Kimono Jackets</option>
                      <option value="Custom Bespoke Bridal / Aso-Ebi">Wedding / Aso-Ebi Custom Tailoring</option>
                    </select>
                  </div>

                  {/* 2. Layman-Friendly Size Selection */}
                  <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="font-semibold text-stone-200 flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-amber-400" />
                        <span>2. Your Everyday Body Size (Plain English Guide)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSimpleSizeGuide(!showSimpleSizeGuide)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{showSimpleSizeGuide ? 'Hide Size Helper' : 'Not sure? See Simple Size Helper'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {LAYMAN_SIZE_GUIDE.map((sz) => {
                        const isSelected = preferredSize === sz.value;
                        return (
                          <button
                            key={sz.value}
                            type="button"
                            onClick={() => setPreferredSize(sz.value)}
                            className={`text-left p-2.5 rounded-xl border transition ${
                              isSelected
                                ? 'bg-amber-400/15 border-amber-400 text-white shadow'
                                : 'bg-stone-900/90 border-stone-800 text-stone-300 hover:border-stone-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-amber-300">{sz.shortLabel}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-950 text-stone-400">
                                {sz.ukSize}
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-200 font-medium mt-0.5">
                              {sz.everydayName}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Plain-English Explanation of Selected Size */}
                    {selectedSizeGuide && (
                      <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-500/30 text-[11px] text-stone-300">
                        <strong className="text-amber-400">What this means:</strong>{' '}
                        {selectedSizeGuide.bodyDescription}
                      </div>
                    )}

                    {showSimpleSizeGuide && (
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-stone-200 space-y-1">
                        <div className="font-bold text-amber-300">
                          💡 Easy Tip (No Tailor Tape Needed!):
                        </div>
                        <p>
                          • If you usually wear a <strong>Small T-shirt</strong>, choose <strong>Small (Slim Fit)</strong>.
                        </p>
                        <p>
                          • If you have an <strong>average build</strong>, choose <strong>Medium (Average Fit)</strong>.
                        </p>
                        <p>
                          • If you have <strong>curvy hips or a fuller chest</strong>, choose <strong>Large (Curvy Fit)</strong> or <strong>XL (Plus Size)</strong>.
                        </p>
                        <p>
                          • If you love <strong>loose, airy Bubu gowns</strong> that fit everyone comfortably, choose <strong>Free Size (Loose & Flowing)</strong>!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 3. Layman-Friendly Visual Color Swatches */}
                  <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2.5 text-xs">
                    <label className="block font-semibold text-stone-200 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      <span>3. Your Favorite Color (Tap a Color Swatch or Type Any Color)</span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {LAYMAN_COLOR_GUIDE.slice(1).map((clr) => {
                        const isSelected = favoriteColors === clr.value;
                        return (
                          <button
                            key={clr.value}
                            type="button"
                            onClick={() => setFavoriteColors(clr.value)}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                              isSelected
                                ? 'bg-amber-400/15 border-amber-400 text-white font-bold'
                                : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-full shrink-0 border"
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

                    {selectedColorGuide && (
                      <div className="text-[11px] text-amber-300">
                        Selected Color: <strong>{selectedColorGuide.simpleName}</strong> — {selectedColorGuide.description}
                      </div>
                    )}

                    <input
                      type="text"
                      value={favoriteColors}
                      onChange={(e) => setFavoriteColors(e.target.value)}
                      placeholder="Or type your own favorite colors in your own words (e.g. Light Blue and Silver)"
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-white placeholder-stone-500"
                    />
                  </div>

                  {/* 4. Nationwide Delivery Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-stone-300 mb-1 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Delivery State</span>
                      </label>
                      <select
                        value={deliveryState}
                        onChange={(e) => setDeliveryState(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-white"
                      >
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-stone-300 mb-1">
                        City / Town
                      </label>
                      <input
                        type="text"
                        value={deliveryCity}
                        onChange={(e) => setDeliveryCity(e.target.value)}
                        placeholder="e.g. Lekki, Wuse 2, GRA"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-stone-300 mb-1">
                        Street Address / Landmark
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Doorstep delivery address"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-white"
                      />
                    </div>
                  </div>

                  {/* 5. Facial Recognition Photo & Custom Tailored Bespoke Attachments */}
                  <div className="space-y-3 pt-2">
                    <FacialRecognitionCapture
                      photoUrl={facialPhotoUrl}
                      onChangePhoto={setFacialPhotoUrl}
                      label="5. Enroll Facial Recognition Photo (Frontend & Admin Portal)"
                      subtitle="Take a live camera selfie or upload your face photo so HOS|TED and the Admin Portal recognize your identity and skin undertone."
                    />
                    <CustomFilesAttachmentBox
                      attachments={customAttachments}
                      onChangeAttachments={setCustomAttachments}
                      title="6. Attach Custom Tailored Bespoke & Measurement Files (Optional)"
                      description="Upload any style inspiration photos, sketches, or measurement charts to save to your HOS|TED profile."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isLoading ? 'Saving Exact Details Live...' : 'Save My Profile & Meet Tessy Ai'}</span>
                  </button>
                </form>
              )}

              {/* Trust Footer */}
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
                <span>🔒 Encrypted HOS|TED Profile</span>
                <span>✨ Tessy Ai Chat Memory Enabled</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
