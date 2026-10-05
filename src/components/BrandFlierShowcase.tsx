import React from 'react';
import { 
  MessageCircle, 
  Sparkles, 
  Instagram,
  Video
} from 'lucide-react';
import { HostedLogo } from './HostedLogo';
import { ASSETS, BRAND_CONTACTS } from '../constants/assets';

interface BrandFlierShowcaseProps {
  onOpenTessy: () => void;
  onSelectCategory: (category: string) => void;
}

export const BrandFlierShowcase: React.FC<BrandFlierShowcaseProps> = ({
  onOpenTessy,
  onSelectCategory,
}) => {
  const serviceList = [
    { title: 'Everyday wears', desc: 'Crisp work shifts, tailored blazers, everyday blouses and chic pants for daily comfort.' },
    { title: 'Skirt and blouse', desc: 'Sculpted peplums, high-waist pencil skirts, flared hems with flawless structure.' },
    { title: 'Ankara gowns', desc: 'Mermaid cuts, corseted bodies, A-lines, and statement shoulder details for owambe & galas.' },
    { title: 'Bubu gowns', desc: 'Regal silk, organza, and rich damask boubous with matching headwraps for effortless royalty.' },
    { title: 'Chic casual outfits', desc: 'Two-piece matching sets, lightweight kimonos, and relaxed weekend ensembles.' },
    { title: 'And lots more', desc: 'Couple ensembles, bespoke bridal wear, aso-ebi styling, and nationwide delivery.' },
  ];

  return (
    <section id="flier" className="py-16 sm:py-24 bg-stone-950 relative overflow-hidden">
      
      {/* Decorative ambient background */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-300 text-xs font-semibold uppercase tracking-widest">
            <span>HOS|TED Hosting Nations</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            HOS|TED Profile & Services
          </h2>
          <p className="text-sm sm:text-base text-stone-300">
            A celebration of African craftsmanship, tailored perfection, and everyday confidence.
          </p>
        </div>

        {/* Flier Presentation Card Container */}
        <div className="mt-12 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border border-amber-500/30 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left Column: Brand Bio & Services list */}
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-8">
              
              <div className="space-y-6">
                {/* Brand Logo & Title */}
                <div>
                  <HostedLogo variant="gold" size="lg" />
                  <p className="mt-4 text-stone-300 text-sm sm:text-base leading-relaxed font-light">
                    "Specializing in elegant everyday wear and beautifully tailored Ankara pieces, crafted to deliver comfort, style, and confidence for every occasion."
                  </p>
                </div>

                {/* What We Do Panel verbatim from flier */}
                <div className="bg-stone-950/80 rounded-2xl p-6 border border-stone-800/90 space-y-4">
                  <div className="inline-block px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold text-xs uppercase tracking-wider shadow">
                    What we do
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {serviceList.map((service, index) => (
                      <div 
                        key={index}
                        onClick={() => onSelectCategory(service.title)}
                        className="group cursor-pointer p-3 rounded-xl bg-stone-900/80 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-500/40 transition flex items-start gap-2.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                            {service.title}
                          </div>
                          <div className="text-[11px] text-stone-400 leading-snug mt-0.5">
                            {service.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct Social & Contact Ribbon from Flier */}
              <div className="pt-6 border-t border-stone-800 space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Connect & Order Directly from HOS|TED
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* WhatsApp hotline */}
                  <a
                    href={`${BRAND_CONTACTS.whatsappUrl}?text=${encodeURIComponent('Hello HOS|TED! I would like to place an order or book a bespoke consultation.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-emerald-500/40 hover:border-emerald-400 transition flex items-center gap-3 text-stone-200 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 fill-emerald-500/20" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">Phone / WhatsApp</div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                        09073784461
                      </div>
                    </div>
                  </a>

                  {/* TikTok */}
                  <a
                    href={BRAND_CONTACTS.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-pink-500/40 transition flex items-center gap-3 text-stone-200 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">TikTok</div>
                      <div className="text-xs font-bold text-white group-hover:text-pink-400 transition">
                        theresaisama
                      </div>
                    </div>
                  </a>

                  {/* Instagram & Facebook */}
                  <a
                    href={BRAND_CONTACTS.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-amber-400/40 transition flex items-center gap-3 text-stone-200 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-stone-400 font-bold tracking-wider">IG & Facebook</div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                        @Tessy Isima
                      </div>
                    </div>
                  </a>

                </div>
              </div>

            </div>

            {/* Right Column: Visual Lookbook Moodboard */}
            <div className="lg:col-span-5 bg-stone-950/60 p-6 sm:p-10 border-t lg:border-t-0 lg:border-l border-stone-800 flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-bold text-amber-400 uppercase tracking-widest">
                    HOS|TED Lookbook
                  </span>
                  <span className="text-[10px] px-2.5 py-1 rounded bg-stone-900 border border-stone-800 text-stone-400">
                    Hosting Nations
                  </span>
                </div>

                {/* 4-Image Grid reflecting flier thumbnails */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl overflow-hidden aspect-[3/4] border border-stone-800 relative group">
                    <img
                      src={ASSETS.bubuGold}
                      alt="Gold Bubu Gown"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent text-[11px] font-medium text-stone-200">
                      Bubu Gowns
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden aspect-[3/4] border border-stone-800 relative group">
                    <img
                      src={ASSETS.ankaraGown}
                      alt="Ankara Gown"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent text-[11px] font-medium text-stone-200">
                      Ankara Gowns
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden aspect-[3/4] border border-stone-800 relative group">
                    <img
                      src={ASSETS.chicCasual}
                      alt="Everyday Wear"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent text-[11px] font-medium text-stone-200">
                      Everyday Wears
                    </div>
                  </div>

                  <div className="rounded-2xl overflow-hidden aspect-[3/4] border border-stone-800 relative group">
                    <img
                      src={ASSETS.ankaraCouple}
                      alt="Couple and Bespoke"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent text-[11px] font-medium text-stone-200">
                      Couple Sets & More
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Tessy Ai Assistant */}
              <div className="mt-6 pt-5 border-t border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={ASSETS.tessyAvatar}
                    alt="Tessy Ai"
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-amber-400"
                  />
                  <div>
                    <div className="text-xs font-bold text-white">Need personal styling?</div>
                    <div className="text-[10px] text-stone-400">Consult Tessy Ai</div>
                  </div>
                </div>

                <button
                  onClick={onOpenTessy}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tessy Ai</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
