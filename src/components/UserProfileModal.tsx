import React, { useState, useEffect } from 'react';
import {
  Crown,
  LogOut,
  Save,
  CheckCircle2,
  Scissors,
  MessageSquare,
  Trash2,
  X,
  Ruler,
  Palette,
  HelpCircle,
} from 'lucide-react';
import { ActiveFrontendUser } from './UserAuthOnboardingModal';
import { CustomAttachmentFile } from '../types';
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

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ActiveFrontendUser | null;
  onUserUpdated: (updated: ActiveFrontendUser) => void;
  onSignOut: () => void;
  onOpenTessy: () => void;
  onTrackOrder?: (orderId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onSignOut,
  onOpenTessy,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('');
  const [preferredSize, setPreferredSize] = useState('');
  const [favoriteColors, setFavoriteColors] = useState('');
  const [deliveryState, setDeliveryState] = useState('Lagos');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [facialPhotoUrl, setFacialPhotoUrl] = useState('');
  const [customAttachments, setCustomAttachments] = useState<CustomAttachmentFile[]>([]);
  const [showSizeHelper, setShowSizeHelper] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setPreferredStyle(user.preferredStyle || 'Ankara Gowns & Bubu Couture');
      setPreferredSize(
        user.preferredSize || 'Medium (Regular / Average Fit — UK 10–12)'
      );
      setFavoriteColors(
        user.favoriteColors || 'Gold / Yellow (Bright Royal Gold)'
      );
      setDeliveryState(user.delivery?.state || 'Lagos');
      setDeliveryCity(user.delivery?.city || '');
      setDeliveryAddress(user.delivery?.address || '');
      setFacialPhotoUrl(user.facialPhotoUrl || '');
      setCustomAttachments(user.customAttachments || []);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const matchedSizeGuide = findLaymanSizeOption(preferredSize);
  const matchedColorGuide = findLaymanColorOption(favoriteColors);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedNotice('');

    try {
      const approxMeasurements = matchedSizeGuide?.approxInches?.bust
        ? {
            ...user.measurements,
            sizeNote: matchedSizeGuide.everydayName,
          }
        : user.measurements;

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: name.trim(),
          phone: phone.trim(),
          preferredStyle: preferredStyle.trim(),
          preferredSize: preferredSize.trim(),
          favoriteColors: favoriteColors.trim(),
          deliveryState: deliveryState.trim(),
          deliveryCity: deliveryCity.trim(),
          deliveryAddress: deliveryAddress.trim(),
          measurements: approxMeasurements,
          facialPhotoUrl,
          customAttachments,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onUserUpdated(data.user);
          setSavedNotice(
            'Your HOS|TED profile and style preferences have been saved!'
          );
          setTimeout(() => setSavedNotice(''), 4000);
        }
      }
    } catch (err) {
      console.error('Failed to update user profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearChatMemory = async () => {
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          clearChatHistory: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          onUserUpdated(data.user);
          setSavedNotice('Tessy Ai conversation memory reset.');
          setTimeout(() => setSavedNotice(''), 3000);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-stone-900 border border-amber-500/40 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Profile Header with Fitted Back to Storefront Button */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/40 border-b border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            {facialPhotoUrl ? (
              <img
                src={facialPhotoUrl}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-400 shadow-lg shrink-0"
              />
            ) : user.isFounder ? (
              <img
                src={ASSETS.tessyAvatar}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400 shadow-lg shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/50 text-amber-300 flex items-center justify-center font-serif font-bold text-lg shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-serif font-bold text-white truncate">
                  {user.name}
                </h3>
                {user.isFounder ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold text-[10px] uppercase tracking-wider">
                    <Crown className="w-3 h-3 fill-stone-950" />
                    <span>Founder & Owner of HOS|TED</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                    {user.roleLabel || 'HOS|TED Member'}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 font-mono mt-0.5 truncate">
                {user.email} · {user.phone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-800 transition shrink-0"
            title="Exit Profile"
            aria-label="Exit Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto">
          {/* Tailored Greeting Banner */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-stone-200 leading-relaxed">
              <strong className="text-amber-400 block mb-0.5">
                {user.isFounder ? '👑 Royal Founder & Owner Greeting:' : '✨ Your Personal HOS|TED Greeting:'}
              </strong>
              {user.tailoredGreeting ||
                `Welcome back to HOS|TED, ${user.name}! Tessy Ai remembers your style preferences and all your previous conversations.`}
            </div>
          </div>

          {/* Tessy Ai Persistent Chat Memory Bar */}
          <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <img
                src={ASSETS.tessyAvatar}
                alt="Tessy Ai"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400 shrink-0"
              />
              <div>
                <div className="font-serif font-bold text-white text-sm flex items-center gap-1.5">
                  <span>Tessy Ai Personal Memory</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {user.chatHistory?.length || 0} Saved Messages
                  </span>
                </div>
                <p className="text-stone-400">
                  Tessy Ai remembers your name, size ({preferredSize}), and all previous chats.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTessy();
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Continue Chat</span>
              </button>
              {(user.chatHistory?.length || 0) > 0 && (
                <button
                  type="button"
                  onClick={handleClearChatMemory}
                  className="p-2 rounded-xl bg-stone-900 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-800"
                  title="Clear saved chat history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}

          {/* Editable Frontend Profile Form with Layman Sizing & Colors */}
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <h4 className="font-serif font-bold text-amber-400 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5" />
              <span>Your Saved Style, Easy Size, Color & Delivery Profile</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">WhatsApp Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Preferred Style</label>
                <select
                  value={preferredStyle}
                  onChange={(e) => setPreferredStyle(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-white"
                >
                  <option value="Ankara Gowns & Bubu Couture">Ankara Gowns & Bubu Couture</option>
                  <option value="Everyday Wears (Tops & Pants)">Everyday Wears (Tops & Pants)</option>
                  <option value="Skirt and Blouse Sets">Skirt and Blouse Sets</option>
                  <option value="Regal Silk & Damask Bubu">Regal Silk & Damask Bubu</option>
                  <option value="Chic Casual Co-ords & Kimonos">Chic Casual Co-ords & Kimonos</option>
                  <option value="Custom Bespoke Bridal / Aso-Ebi">Custom Bespoke Bridal / Aso-Ebi</option>
                </select>
              </div>
            </div>

            {/* Layman-Friendly Size Picker */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-stone-200 font-semibold flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  <span>Your Everyday Size (Easy Layman Guide)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowSizeHelper(!showSizeHelper)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showSizeHelper ? 'Hide Size Meaning' : 'Explain Sizes Simply'}</span>
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
                          ? 'bg-amber-400/15 border-amber-400 text-white'
                          : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">{sz.shortLabel}</span>
                        <span className="text-[10px] font-mono text-stone-400">{sz.ukSize}</span>
                      </div>
                      <div className="text-[11px] text-stone-300 mt-0.5">{sz.everydayName}</div>
                    </button>
                  );
                })}
              </div>

              {(showSizeHelper || matchedSizeGuide) && matchedSizeGuide && (
                <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-500/30 text-[11px] text-stone-300">
                  <strong className="text-amber-400">Plain-English Fit:</strong>{' '}
                  {matchedSizeGuide.bodyDescription}
                </div>
              )}
            </div>

            {/* Layman-Friendly Visual Color Swatches */}
            <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2.5">
              <label className="text-stone-200 font-semibold flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Favorite Colors (Tap a Visual Color or Type Below)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        className="w-4 h-4 rounded-full shrink-0 border"
                        style={{
                          background: clr.hex,
                          borderColor: clr.borderHex || 'rgba(255,255,255,0.25)',
                        }}
                      />
                      <span className="truncate text-[11px]">{clr.simpleName}</span>
                    </button>
                  );
                })}
              </div>
              {matchedColorGuide && (
                <div className="text-[11px] text-amber-300">
                  Selected: <strong>{matchedColorGuide.simpleName}</strong> ({matchedColorGuide.description})
                </div>
              )}
              <input
                type="text"
                value={favoriteColors}
                onChange={(e) => setFavoriteColors(e.target.value)}
                placeholder="Or type your favorite colors in plain words..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Delivery State</label>
                <select
                  value={deliveryState}
                  onChange={(e) => setDeliveryState(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                >
                  {NIGERIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Delivery City / Town</label>
                <input
                  type="text"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Street Address</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-white"
                />
              </div>
            </div>

            {/* Facial Recognition Photo & Custom Bespoke Attachments in Profile */}
            <div className="space-y-3 pt-2">
              <FacialRecognitionCapture
                photoUrl={facialPhotoUrl}
                onChangePhoto={setFacialPhotoUrl}
                label="Your HOS|TED Facial Recognition Photo"
                subtitle="Capture a live camera selfie or upload a face photo. Syncs immediately with the HOS|TED Admin Portal."
              />

              <CustomFilesAttachmentBox
                attachments={customAttachments}
                onChangeAttachments={setCustomAttachments}
                title="Your Attached Bespoke Style & Measurement Files"
                description="Attach custom style inspiration images, sketches, or measurement sheets directly to your account."
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Live...' : 'Save Profile Changes'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-stone-950 hover:bg-stone-800 text-rose-300 border border-stone-800 font-bold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out / Switch Account</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
