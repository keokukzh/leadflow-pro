import { getLeadById } from "@/lib/actions/server-actions";
import MasterTemplate from "@/components/templates/MasterTemplate";
import { DynamicRenderer } from "@/components/preview/DynamicRenderer";
import { notFound } from "next/navigation";

export default async function PreviewPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const lead = await getLeadById(leadId);

  if (!lead) {
    notFound();
  }

  if (!lead.preview_data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Vorschau wird vorbereitet</h2>
            <p className="text-slate-500">Wir erstellen gerade das Design für {lead.company_name}. Dies dauert nur einen Moment...</p>
          </div>
          <div className="pt-4">
             <p className="text-xs text-slate-400">Bitte lade die Seite in Kürze neu, falls sie nicht automatisch aktualisiert wird.</p>
          </div>
        </div>
      </div>
    );
  }

  // BACKWARD COMPATIBILITY LAYER
  // If the lead has old 'preview_data' but no 'siteConfig', we map it on the fly
  // or show a "Regeneration Needed" message if mapping is too complex.
  // Ideally, we want to support both or migrate.
  
  if (lead.siteConfig) {
      return <DynamicRenderer config={lead.siteConfig} />;
  }

  // Fallback for old data (optional: map old data to new schema or use old template)
  // For now, let's keep MasterTemplate as fallback if you want, 
  // OR force regeneration by showing a message.
  
  if (lead.preview_data) {
     // Option A: Use old template (requires keeping it)
     return <MasterTemplate data={lead.preview_data} />;
  }
  
  return null;
}
