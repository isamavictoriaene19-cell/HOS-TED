import React from 'react';
import { ArrowRight, Scissors, Star } from 'lucide-react';
import { ASSETS } from '../constants/assets';
import { WebsiteSettings } from '../types';

interface HeroProps {
  onOpenTessy: (mode?: 'stylist' | 'concierge') => void;
  onExploreCollections: () => void;
  onOpenBespoke: () => void;
  settings?: WebsiteSettings;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenTessy,
  onExploreCollections,
  onOpenBespoke,
  settings,
}) => {
  const slogan = settings?.slogan || 'HOS|TED Hosting Nations';
  const heroTitle = settings?.heroTitle || 'Crafted for Comfort, Style & Confidence.';
  const heroSubtitle =
    settings?.heroSubtitle ||
    'Specializing in elegant everyday wear and beautifully tailored Ankara pieces, crafted to deliver comfort, style, and confidence for every occasion.';

  return (
    <section className="relative overflow-hidden pt-8 pb-20 lg:pt-16 lg:pb-28">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {settings?.customBannerMessage && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-medium text-center">
            {settings.customBannerMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Brand Statement & Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.12]">
              {heroTitle.includes('Comfort, Style') ? (
                <>
                  Crafted for{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400">
                    Comfort, Style
                  </span>{' '}
                  & Confidence.
                </>
              ) : (
                heroTitle
              )}
            </h1>

            {/* Subheading verbatim from brand flier */}
            <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
              {heroSubtitle}
            </p>

            {/* Interactive Tessy Ai Callout Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-900/90 via-amber-950/20 to-stone-900/90 border border-amber-500/25 shadow-xl flex flex-col sm:flex-row items-center gap-4 text-left">
              <div className="relative shrink-0">
                <img
                  src={ASSETS.tessyAvatar}
                  alt="Tessy Ai"
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full object-cover ring-2 ring-amber-400/80 shadow-md"
                />
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-stone-900" title="Online" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif font-semibold text-white text-base">Tessy Ai</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-500/30">
                    Stylist & Concierge
                  </span>
                </div>
                <p className="text-xs text-stone-300">
                  Get personalized Ankara styling advice for weddings, galas, and work, or take precision measurements & nationwide delivery details for custom HOS|TED tailoring.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => onOpenTessy('stylist')}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                  >
                    <span>Try Stylist Mode</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <span className="text-stone-600">|</span>
                  <button
                    onClick={() => onOpenTessy('concierge')}
                    className="text-xs font-semibold text-stone-300 hover:text-white flex items-center gap-1 transition"
                  >
                    <span>Order Concierge</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onExploreCollections}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold text-sm uppercase tracking-wider transition-all duration-200 shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2"
              >
                <span>View Collections</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenBespoke}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700/80 font-medium text-sm tracking-wide transition flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Custom Tailoring Request</span>
              </button>
            </div>

          </div>

          {/* Right Column: Visual Collage & Flier Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Lookbook Feature Card */}
              <div className="relative rounded-3xl overflow-hidden border border-stone-700/60 shadow-2xl bg-stone-900 group">
                <img
                  src={ASSETS.bubuGold}
                  alt="Royal Gold Bubu Gown by HOS|TED"
                  className="w-full aspect-[3/4] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Floating overlay tag */}
                <div className="absolute top-4 left-4 bg-stone-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-700/80 text-xs font-medium text-stone-200 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Featured: Imperial Gold Bubu</span>
                </div>

                <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent">
                  <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold">{slogan}</div>
                  <h3 className="text-xl font-serif font-bold text-white mt-1">Royal Bubu & Ankara Couture</h3>
                  <p className="text-xs text-stone-300 mt-1">Custom crafted with matching accessories and headwraps.</p>
                </div>
              </div>

              {/* Overlapping secondary thumbnail */}
              <div className="absolute -bottom-6 -left-6 sm:-left-8 w-36 sm:w-44 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-stone-900 hidden sm:block">
                <img
                  src={ASSETS.ankaraGown}
                  alt="Ankara Evening Gown"
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="p-2 bg-stone-950/90 text-[10px] font-medium text-stone-300 text-center">
                  Ankara Gowns & Blouses
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
