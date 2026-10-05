import React from 'react';
import { ASSETS } from '../constants/assets';
import { Heart, Award, Scissors, Quote, Sparkles } from 'lucide-react';
import { WebsiteSettings } from '../types';

interface AtelierStoryProps {
  settings?: WebsiteSettings;
}

export const AtelierStory: React.FC<AtelierStoryProps> = ({ settings }) => {
  const founderName = settings?.founderName || 'Theresa Isama';
  const founderRole = settings?.founderRole || 'Founder & Creative Director, HOS|TED';
  const founderImageUrl = settings?.founderImageUrl?.trim()
    ? settings.founderImageUrl
    : ASSETS.tessyAvatar;
  const founderQuote =
    settings?.founderQuote ||
    'Every garment we craft at HOS|TED is designed to host nations—uniting African heritage with effortless modern confidence.';
  const founderBioParagraph1 =
    settings?.founderBioParagraph1 ||
    'Theresa Isama is the visionary Founder and Creative Director behind HOS|TED (HOS|TED Hosting Nations). With a deep passion for contemporary African fashion and precision tailoring, she established HOS|TED to deliver comfort, style, and confidence for every occasion.';
  const founderBioParagraph2 =
    settings?.founderBioParagraph2 ||
    'From regal silk Bubu gowns and sculpted Ankara evening pieces to chic everyday wear delivered nationwide, Theresa Isama leads every collection with uncompromising attention to fit, fabric quality, and timeless elegance.';

  const showFounder = settings?.showFounderSection !== false;
  const showStory = settings?.showStorySection !== false;

  return (
    <>
      {/* Dedicated About the Founder Section (Editable only from the HOS|TED Admin Dashboard) */}
      {showFounder && (
        <section id="founder" className="py-16 sm:py-24 bg-stone-950 relative overflow-hidden border-t border-stone-800/80">
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[150px] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Founder Portrait Card */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-sm lg:max-w-none">
                  <div className="rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-stone-900">
                    <img
                      src={founderImageUrl}
                      alt={founderName}
                      className="w-full aspect-square object-cover object-center"
                    />
                  </div>
                  <div className="mt-4 p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex items-center justify-between shadow-xl">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-amber-400">
                        HOS|TED Hosting Nations
                      </div>
                      <h3 className="font-serif font-bold text-white text-lg mt-0.5">{founderName}</h3>
                      <p className="text-xs text-stone-400">{founderRole}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold">
                      TI
                    </div>
                  </div>
                </div>
              </div>

              {/* Founder Biography & Vision */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>About the Founder</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                  Meet {founderName} — The Creative Force Behind HOS|TED
                </h2>

                {/* Highlight Quote */}
                <div className="p-5 rounded-2xl bg-stone-900/90 border-l-4 border-amber-400 text-stone-200 italic text-sm sm:text-base leading-relaxed flex items-start gap-3">
                  <Quote className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <span>"{founderQuote}"</span>
                </div>

                <div className="space-y-4 text-stone-300 text-sm sm:text-base leading-relaxed font-light">
                  <p>{founderBioParagraph1}</p>
                  <p>{founderBioParagraph2}</p>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Atelier Brand Story Section */}
      {showStory && (
        <section id="story" className="py-16 sm:py-24 bg-stone-900/50 relative overflow-hidden border-t border-stone-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Visual Showcase: HOS|TED Atelier */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  
                  <div className="rounded-3xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-900">
                    <img
                      src={ASSETS.heroAtelier}
                      alt="HOS|TED Atelier"
                      className="w-full aspect-[4/3] object-cover"
                    />
                  </div>

                  {/* Floating Director card */}
                  <div className="mt-4 p-4 rounded-2xl bg-stone-900/95 border border-stone-800 backdrop-blur-md flex items-center gap-4 shadow-xl">
                    <img
                      src={founderImageUrl}
                      alt={founderName}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-400"
                    />
                    <div>
                      <h4 className="font-serif font-bold text-white text-base">{founderName}</h4>
                      <p className="text-xs text-amber-400 font-medium">{founderRole}</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">HOS|TED • Hosting Nations</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Brand Philosophy Text */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-amber-400 text-xs font-semibold uppercase tracking-widest">
                  <span>HOS|TED Hosting Nations</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
                  African Heritage Reimagined for Modern Elegance
                </h2>

                <div className="space-y-4 text-stone-300 text-sm sm:text-base leading-relaxed font-light">
                  <p>
                    <strong>HOS|TED</strong> was founded by <strong>{founderName}</strong> on a simple yet profound conviction: every woman and gentleman deserves garments that seamlessly transition from boardroom meetings to joyous traditional celebrations without sacrificing ease, elegance, or authenticity.
                  </p>
                  <p>
                    Under our banner <strong>HOS|TED Hosting Nations</strong>, from our signature sweeping Bubu kaftans engineered in breathable silks to our sculptured Ankara gowns with statement structured detailing, each piece is cut to flatter and celebrate diverse body silhouettes with nationwide delivery.
                  </p>
                  <p>
                    With the introduction of <strong className="text-amber-400 font-semibold">Tessy Ai</strong>, we are pioneering a personalized, bespoke digital atelier experience—offering couture styling advice and made-to-measure sizing guidance right at your fingertips.
                  </p>
                </div>

                {/* Core Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                    <Scissors className="w-5 h-5 text-amber-400" />
                    <div className="font-semibold text-white text-sm">Sculpted Tailoring</div>
                    <div className="text-xs text-stone-400">Precision darts and structural boning.</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                    <Award className="w-5 h-5 text-amber-400" />
                    <div className="font-semibold text-white text-sm">Authentic Ankara</div>
                    <div className="text-xs text-stone-400">High-grade 100% cotton wax fabrics.</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                    <Heart className="w-5 h-5 text-amber-400" />
                    <div className="font-semibold text-white text-sm">Everyday Confidence</div>
                    <div className="text-xs text-stone-400">Crafted to make you feel regal daily.</div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>
      )}
    </>
  );
};
