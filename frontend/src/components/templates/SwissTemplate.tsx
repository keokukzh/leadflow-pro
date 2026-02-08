import { Lead } from "@/lib/actions/server-actions";
import { TemplateProps } from "./HandwerkTemplate";

export interface Service {
  title: string;
  description: string;
  icon?: string;
}

export interface SwissTemplateData {
  header: {
    logo: string;
    tagline: string;
    cta: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    backgroundImage: string;
  };
  services: Service[];
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  footer: {
    legal: string;
    social: string[];
  };
}

interface SwissTemplateProps extends Partial<TemplateProps> {
  lead?: Lead;
  data?: Partial<SwissTemplateData>;
  showDebug?: boolean;
}

export function SwissTemplate({
  lead,
  data,
  showDebug = false,
  ...rest
}: SwissTemplateProps) {
  // Merge AI-generated preview_data with requested SwissTemplate structure
  const preview = lead?.preview_data;
  
  const templateData: SwissTemplateData = {
    header: {
      logo: lead?.company_name || rest.companyName || data?.header?.logo || "SWISS DESIGN",
      tagline: preview?.heroSubheadline || rest.brandTone || data?.header?.tagline || "Exzellenz in jeder Hinsicht",
      cta: data?.header?.cta || "Kontakt",
    },
    hero: {
      headline: preview?.heroHeadline || data?.hero?.headline || `Qualität für ${lead?.location || "die Schweiz"}`,
      subheadline: preview?.heroSubheadline || rest.brandTone || data?.hero?.subheadline || "Professionelle Lösungen für anspruchsvolle Kunden.",
      backgroundImage: preview?.heroImageUrl || data?.hero?.backgroundImage || "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&q=80",
    },
    services: (preview?.usps || rest.keySells?.map(s => ({ title: s, description: "Professionelle Dienstleistung." })) || data?.services || [
      { title: "Service 1", description: "Hochwertige Dienstleistung nach Schweizer Standard." },
      { title: "Service 2", description: "Präzision und Zuverlässigkeit in jedem Projekt." },
      { title: "Service 3", description: "Kundenzufriedenheit steht bei uns an erster Stelle." },
    ]) as Service[],
    contact: {
      phone: preview?.phoneNumber || data?.contact?.phone || "+41 44 123 45 67",
      email: data?.contact?.email || `info@${lead?.company_name?.toLowerCase().replace(/\s+/g, "") || "firma"}.ch`,
      address: lead?.location || data?.contact?.address || "Zürich, Schweiz",
    },
    footer: {
      legal: data?.footer?.legal || `© ${new Date().getFullYear()} ${lead?.company_name || "LeadFlow Pro"}. Alle Rechte vorbehalten.`,
      social: data?.footer?.social || ["LinkedIn", "Instagram"],
    },
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#FF0000] selection:text-white">
      {/* Swiss Flag Accent */}
      <div className="h-2 bg-[#FF0000] w-full" />

      {/* Header */}
      <header className="py-8 px-6 md:px-12 flex justify-between items-center bg-white border-b border-gray-100">
        <div className="flex flex-col">
          <span className="text-2xl font-black tracking-tighter text-[#FF0000]">
            {templateData.header.logo}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
            {templateData.header.tagline}
          </span>
        </div>
        <nav className="hidden md:flex gap-8 items-center font-bold text-sm">
          <a href="#services" className="hover:text-[#FF0000] transition-colors">Services</a>
          <a href="#contact" className="hover:text-[#FF0000] transition-colors">Kontakt</a>
          <button className="bg-[#FF0000] text-white px-6 py-2 rounded-none hover:bg-black transition-all">
            {templateData.header.cta}
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={templateData.hero.backgroundImage} 
            alt="Hero" 
            className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
          />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
        </div>
        
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-black">
              {templateData.hero.headline.split(' ').map((word, i) => (
                <span key={i} className={i === 0 ? "text-[#FF0000] block" : "block"}>
                  {word}{" "}
                </span>
              ))}
            </h1>
            <p className="text-xl md:text-2xl text-gray-800 font-medium max-w-xl leading-relaxed">
              {templateData.hero.subheadline}
            </p>
            <div className="pt-4">
              <button className="bg-black text-white px-10 py-5 text-lg font-bold hover:bg-[#FF0000] transition-all">
                Jetzt entdecken
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-24 px-6 md:px-12 bg-white">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <h2 className="text-sm uppercase tracking-[0.3em] font-black text-[#FF0000] mb-4">
                Unsere Expertise
              </h2>
              <p className="text-4xl md:text-5xl font-black tracking-tight">
                Präzision & Qualität in jedem Detail.
              </p>
            </div>
            <p className="text-gray-500 max-w-xs font-medium border-l-2 border-[#FF0000] pl-6 py-2">
              Wir setzen auf Schweizer Standards und erstklassige Materialien.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-1px bg-gray-200 border border-gray-200">
            {templateData.services.map((service, i) => (
              <div key={i} className="bg-white p-12 hover:bg-gray-50 transition-colors group">
                <span className="text-5xl font-black text-gray-100 group-hover:text-[#FF0000]/10 transition-colors mb-6 block">
                  0{i + 1}
                </span>
                <h3 className="text-2xl font-black mb-4 group-hover:translate-x-2 transition-transform">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed font-normal">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Status / Local Focus */}
      <section className="py-24 bg-black text-white px-6 md:px-12">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-5xl font-black tracking-tighter mb-8 italic">
              &quot;Schweizer Qualität ist kein Versprechen, sondern ein Standard.&quot;
            </h2>
            <div className="flex gap-12">
              <div>
                <span className="text-4xl font-black block text-[#FF0000]">100%</span>
                <span className="text-xs uppercase tracking-widest opacity-50">Lokal</span>
              </div>
              <div>
                <span className="text-4xl font-black block text-[#FF0000]">24/7</span>
                <span className="text-xs uppercase tracking-widest opacity-50">Support</span>
              </div>
            </div>
          </div>
          <div className="bg-[#FF0000] p-12 aspect-video flex items-center justify-center">
             <span className="text-white text-[12vw] font-black tracking-tighter opacity-20 whitespace-nowrap">
               {lead?.location?.toUpperCase().split(',')[0] || "SWISS"}
             </span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 md:px-12 bg-white">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-24">
          <div className="space-y-12">
            <h2 className="text-6xl font-black tracking-tighter">
              Sprechen wir <br /> <span className="text-[#FF0000]">darüber.</span>
            </h2>
            <div className="space-y-8 font-bold text-xl">
              <div className="flex items-center gap-6">
                <span className="w-12 h-12 bg-gray-100 flex items-center justify-center text-[#FF0000]">📞</span>
                <p>{templateData.contact.phone}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="w-12 h-12 bg-gray-100 flex items-center justify-center text-[#FF0000]">📧</span>
                <p>{templateData.contact.email}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="w-12 h-12 bg-gray-100 flex items-center justify-center text-[#FF0000]">📍</span>
                <p>{templateData.contact.address}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-12 md:p-16 border border-gray-100">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <input type="text" placeholder="Name" className="bg-white border-b-2 border-gray-200 p-4 focus:border-[#FF0000] outline-none transition-colors" />
                <input type="email" placeholder="Email" className="bg-white border-b-2 border-gray-200 p-4 focus:border-[#FF0000] outline-none transition-colors" />
              </div>
              <textarea placeholder="Nachricht" rows={4} className="w-full bg-white border-b-2 border-gray-200 p-4 focus:border-[#FF0000] outline-none transition-colors" />
              <button className="w-full bg-black text-white hover:bg-[#FF0000] p-6 font-black uppercase tracking-widest transition-all">
                Senden
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 bg-white border-t border-gray-100">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-black font-black text-xl tracking-tighter">
            {lead?.company_name} <span className="text-[#FF0000]">.</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">
            {templateData.footer.legal}
          </p>
          <div className="flex gap-6 font-bold text-xs uppercase tracking-widest">
            {templateData.footer.social.map((s, i) => (
              <a key={i} href="#" className="hover:text-[#FF0000] transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Debug Info */}
      {showDebug && (
        <div className="bg-yellow-50 p-12 border-t border-yellow-200 overflow-auto">
          <h3 className="font-bold mb-4">Debug Information</h3>
          <pre className="text-[10px] text-yellow-800">{JSON.stringify({ lead, templateData }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default SwissTemplate;
