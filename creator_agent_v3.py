#!/usr/bin/env python3
"""
Creator Agent 3.0 - Preview Engine Complete
============================================
P0 Features:
1. Dynamic Headline Generation
2. Industry-Specific Templates
3. Live Preview Server with Mobile/Desktop Toggle
4. SEO Preview (Google/Social)
"""

import json
import time
import hashlib
import random
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import threading
from collections import defaultdict

# ============================================
# DATA CLASSES
# ============================================

class Industry(Enum):
    RESTAURANT = "restaurant"
    BEAUTY = "beauty"
    HANDWERK = "handwerk"
    MEDICAL = "medical"
    RETAIL = "retail"
    SERVICE = "service"

class TemplateStyle(Enum):
    SWISS_NEUTRAL = "swiss_neutral"
    ALPINE_FRESH = "alpine_fresh"
    PREMIUM = "premium"
    MODERN = "modern"
    ECO = "eco"

@dataclass
class Lead:
    """Lead data model."""
    id: str
    company_name: str
    industry: str
    location: str
    website_status: str = ""
    rating: float = 0.0
    review_count: int = 0
    phone: Optional[str] = None
    email: Optional[str] = None
    calculated_score: int = 0
    brand_colors: Optional[str] = None
    existing_images: Dict[str, str] = field(default_factory=dict)
    current_website: Optional[str] = None

@dataclass
class PreviewConfig:
    """Preview configuration."""
    template_style: str = "swiss_neutral"
    variant_id: str = "default"
    device: str = "desktop"
    include_seo: bool = True
    include_social_card: bool = True
    locale: str = "de-CH"

@dataclass
class PreviewPage:
    """Complete preview page."""
    id: str
    lead_id: str
    html: str
    meta_tags: Dict[str, str]
    social_card: Dict[str, str]
    structured_data: Dict[str, Any]
    variant_config: Dict[str, Any]
    generated_at: datetime
    share_token: str

@dataclass
class IndustryTemplate:
    """Industry-specific template config."""
    name: str
    hero_background: str
    primary_cta: str
    secondary_cta: str
    features: List[str]
    testimonial_focus: List[str]
    price_range: str
    show_opening_hours: bool
    show_appointment_booking: bool
    show_portfolio: bool
    color_scheme: Dict[str, str]
    # Optional fields
    show_menu: bool = False
    show_treatments: bool = False
    show_certifications: bool = False
    show_emergency: bool = False
    show_products: bool = False
    show_testimonials: bool = True

# ============================================
# DYNAMIC HEADLINE GENERATOR
# ============================================

class DynamicHeadlineGenerator:
    """Generates personalized headlines based on lead characteristics."""
    
    HEADLINE_PATTERNS = {
        "no_website": {
            "professional": [
                "{name}: Ihre neue Website in {city}",
                "Professionelle Webpräsenz für {name}",
                "{name} verdient einen modernen Webauftritt",
                "Digitalisierung für {name} in {city}",
                "Ihr Unternehmen online: {name}"
            ],
            "friendly": [
                "Willkommen bei {name} - neu im Web",
                "{name} stellt sich vor",
                "Entdecken Sie {name} online",
                "Ihr lokaler Partner {name} jetzt digital",
                "{name} - Ihr Vertrauen, digital gelöst"
            ],
            "urgent": [
                "{name}: Zeit für eine Website",
                "Ohne Website verliert {name} Kunden",
                "{name} - noch nicht online? Das ändern wir",
                "Ihr Business verdient Sichtbarkeit: {name}",
                "{name} verdient mehr Kunden"
            ],
            "story": [
                "{name}: Eine Geschichte, die erzählt werden muss",
                "Von {city} in die weite Welt: {name}",
                "{name} - Tradition trifft Innovation",
                "Das digitale Zuhause von {name}",
                "{name}: Wo Qualität auf Design trifft"
            ]
        },
        "outdated": {
            "professional": [
                "{name}: Zeit für ein Update",
                "Moderne Website für {name}",
                "{name}: Digital gestärkt",
                "Ihr Unternehmen, neu interpretiert: {name}",
                "{name} erstrahlt in neuem Glanz"
            ],
            "friendly": [
                "{name} hat sich verändert - hat Ihre Website?",
                "Frischer Look für {name}",
                "{name}: Jetzt noch besser",
                "Entdecken Sie das neue {name}",
                "Bei {name} ist viel passiert"
            ],
            "urgent": [
                "{name}: Ihre Website ist veraltet",
                "Potenzielle Kunden verlassen Ihre Seite",
                "{name}: Update erforderlich",
                "Veraltete Website kostet Kunden",
                "{name} verdient einen modernen Auftritt"
            ],
            "story": [
                "Das neue Kapitel von {name}",
                "{name} transformiert sich",
                "Ein neues Design für {name}",
                "Die Evolution von {name}",
                "{name} - neu definiert"
            ]
        },
        "has_website": {
            "professional": [
                "{name}: Mehr aus Ihrer Website holen",
                "Conversion-Optimierung für {name}",
                "{name}: Digital gestärkt",
                "Ihr Unternehmen online perfektioniert: {name}",
                "{name} auf dem nächsten Level"
            ],
            "friendly": [
                "Noch mehr Besucher für {name}",
                "{name} kann noch mehr",
                "Helfen Sie {name} zu wachsen",
                "Gemeinsam stärker: {name}",
                "{name} auf Erfolgskurs"
            ],
            "urgent": [
                "Maximieren Sie Ihr Potenzial: {name}",
                "{name} kann mehr erreichen",
                "Der nächste Schritt für {name}",
                "Ungenutztes Potenzial bei {name}",
                "{name}: Bereit für mehr?"
            ],
            "story": [
                "Die nächste Stufe von {name}",
                "{name} träumt größer",
                "Das volle Potenzial von {name}",
                "{name} neu gedacht",
                "Eine Vision für {name}"
            ]
        }
    }
    
    def __init__(self):
        self._cache = {}
        self._lock = threading.Lock()
    
    def generate(self, lead: Lead, style: str = "professional") -> str:
        """Generate headline for lead."""
        cache_key = f"{lead.id}:{style}"
        with self._lock:
            if cache_key in self._cache:
                return self._cache[cache_key]
        
        status_key = self._get_status_key(lead.website_status)
        pattern_set = self.HEADLINE_PATTERNS.get(status_key, self.HEADLINE_PATTERNS["no_website"])
        patterns = pattern_set.get(style, pattern_set["professional"])
        pattern = random.choice(patterns)
        headline = pattern.format(name=lead.company_name, city=lead.location, industry=lead.industry)
        
        with self._lock:
            self._cache[cache_key] = headline
        return headline
    
    def generate_variants(self, lead: Lead, count: int = 4) -> Dict[str, str]:
        """Generate multiple headline variants."""
        variants = {}
        styles = ["professional", "friendly", "urgent", "story"]
        for i in range(min(count, len(styles))):
            variants[styles[i]] = self.generate(lead, styles[i])
        return variants
    
    def _get_status_key(self, status: str) -> str:
        """Convert status to pattern key."""
        status_lower = status.lower()
        if any(word in status_lower for word in ["keine", "kein", "fehlt", "no website"]):
            return "no_website"
        elif any(word in status_lower for word in ["veraltet", "old", "alt"]):
            return "outdated"
        elif any(word in status_lower for word in ["gut", "modern", "aktualisiert"]):
            return "has_website"
        return "no_website"

# ============================================
# INDUSTRY-SPECIFIC TEMPLATES
# ============================================

class IndustryTemplateEngine:
    """Industry-specific template variations."""
    
    TEMPLATES = {
        "restaurant": {
            "name": "Restaurant & Gastro",
            "hero_background": "foodInterior",
            "primary_cta": "Tisch reservieren",
            "secondary_cta": "Menü ansehen",
            "features": ["Frische Zutaten", "Saisonale Küche", "Gemütliches Ambiente", "Regional & lokal"],
            "testimonial_focus": ["Essen", "Service", "Atmosphäre", "Preis-Leistung"],
            "price_range": "CHF 30-80",
            "show_opening_hours": True,
            "show_appointment_booking": False,
            "show_portfolio": False,
            "show_menu": True,
            "color_scheme": {"primary": "#c2410c", "secondary": "#fff7ed", "accent": "#f97316", "text": "#1f2937", "light": "#ffedd5"}
        },
        "beauty": {
            "name": "Beauty & Wellness",
            "hero_background": "salonInterior",
            "primary_cta": "Termin buchen",
            "secondary_cta": "Preise",
            "features": ["Entspannung", "Premium-Produkte", "Erfahrenes Team", "Hygienisch & sauber"],
            "testimonial_focus": ["Ergebnis", "Beratung", "Wohlfühlen", "Preis"],
            "price_range": "CHF 50-250",
            "show_opening_hours": True,
            "show_appointment_booking": True,
            "show_portfolio": False,
            "show_treatments": True,
            "color_scheme": {"primary": "#be185d", "secondary": "#fdf2f8", "accent": "#ec4899", "text": "#831843", "light": "#fce7f3"}
        },
        "handwerk": {
            "name": "Handwerk & Bau",
            "hero_background": "workbench",
            "primary_cta": "Offerte anfordern",
            "secondary_cta": "Projekte",
            "features": ["Qualitätsarbeit", "Jahre Erfahrung", "Zuverlässig", "Termingerecht"],
            "testimonial_focus": ["Handwerk", "Preis", "Zeitplan", "Kommunikation"],
            "price_range": "Individuell",
            "show_opening_hours": True,
            "show_appointment_booking": False,
            "show_portfolio": True,
            "show_certifications": True,
            "color_scheme": {"primary": "#b45309", "secondary": "#fffbeb", "accent": "#d97706", "text": "#78350f", "light": "#fef3c7"}
        },
        "medical": {
            "name": "Medizin & Gesundheit",
            "hero_background": "practice",
            "primary_cta": "Termin vereinbaren",
            "secondary_cta": "Kontakt",
            "features": ["Kompetenz", "Erfahrung", "Moderne Ausstattung", "Einfühlsam"],
            "testimonial_focus": ["Behandlung", "Beratung", "Vertrauen", "Wartezeit"],
            "price_range": "KVG / UVG",
            "show_opening_hours": True,
            "show_appointment_booking": True,
            "show_portfolio": False,
            "show_emergency": True,
            "color_scheme": {"primary": "#0e7490", "secondary": "#ecfeff", "accent": "#06b6d4", "text": "#164e63", "light": "#cffafe"}
        },
        "retail": {
            "name": "Detailhandel",
            "hero_background": "storeFront",
            "primary_cta": "Besuchen Sie uns",
            "secondary_cta": "Sortiment",
            "features": ["Grosse Auswahl", "Faire Preise", "Persönliche Beratung", "Qualität"],
            "testimonial_focus": ["Produkte", "Preise", "Beratung", "Sortiment"],
            "price_range": "Verschieden",
            "show_opening_hours": True,
            "show_appointment_booking": False,
            "show_portfolio": False,
            "show_products": True,
            "color_scheme": {"primary": "#1e40af", "secondary": "#eff6ff", "accent": "#3b82f6", "text": "#1e3a8a", "light": "#dbeafe"}
        },
        "service": {
            "name": "Dienstleistungen",
            "hero_background": "office",
            "primary_cta": "Kontakt aufnehmen",
            "secondary_cta": "Mehr erfahren",
            "features": ["Professionell", "Zuverlässig", "Individuell", "Erfahren"],
            "testimonial_focus": ["Service", "Qualität", "Kommunikation", "Ergebnis"],
            "price_range": "Offerte",
            "show_opening_hours": True,
            "show_appointment_booking": True,
            "show_portfolio": True,
            "show_testimonials": True,
            "color_scheme": {"primary": "#475569", "secondary": "#f8fafc", "accent": "#64748b", "text": "#334155", "light": "#e2e8f0"}
        }
    }
    
    def __init__(self):
        self._cache = {}
        self._lock = threading.Lock()
    
    def get_template(self, industry: str) -> IndustryTemplate:
        """Get template for industry."""
        key = industry.lower()
        with self._lock:
            if key in self._cache:
                return self._cache[key]
        
        template_data = self.TEMPLATES.get(key, self.TEMPLATES["service"])
        template = IndustryTemplate(**template_data)
        
        with self._lock:
            self._cache[key] = template
        return template
    
    def generate_css(self, template: IndustryTemplate) -> str:
        """Generate CSS for template."""
        c = template.color_scheme
        return f"""
:root {{ --primary: {c['primary']}; --secondary: {c['secondary']}; --accent: {c['accent']}; --text: {c['text']}; --light: {c['light']}; }}
.btn-primary {{ background: var(--primary); color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; }}
.btn-primary:hover {{ transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }}
.hero {{ background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); color: white; padding: 80px 20px; text-align: center; }}
.section-light {{ background: var(--secondary); padding: 60px 20px; }}
.card {{ background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
"""

# ============================================
# LIVE PREVIEW SERVER
# ============================================

class LivePreviewServer:
    """Real-time preview generation and serving."""
    
    def __init__(self, host: str = "0.0.0.0", port: int = 8080):
        self.host = host
        self.port = port
        self._cache = LRUCache(max_size=1000)
        self._templates = IndustryTemplateEngine()
        self._headlines = DynamicHeadlineGenerator()
        self._share_tokens = {}
    
    async def generate_preview(self, lead: Lead, config: PreviewConfig = None) -> PreviewPage:
        """Generate complete preview page."""
        config = config or PreviewConfig()
        cache_key = f"{lead.id}:{config.template_style}:{config.device}:{config.variant_id}"
        
        cached = self._cache.get(cache_key)
        if cached and datetime.now() < cached.generated_at + timedelta(hours=1):
            return cached
        
        preview = self._core_generate(lead, config)
        self._cache.set(cache_key, preview, ttl=3600)
        return preview

    def _core_generate(self, lead: Lead, config: PreviewConfig) -> PreviewPage:
        """Internal core generation logic shared between sync and async methods."""
        template = self._templates.get_template(lead.industry)
        headline = self._headlines.generate(lead, "professional")
        headline_variants = self._headlines.generate_variants(lead)
        html = self._build_html(lead, template, headline, config)
        meta_tags = self._generate_meta_tags(lead, headline)
        social_card = self._generate_social_card(lead, headline)
        structured_data = self._generate_structured_data(lead, template)
        share_token = self._generate_share_token(lead.id)
        
        return PreviewPage(
            id=hashlib.md5(f"{time.time()}".encode()).hexdigest()[:8],
            lead_id=lead.id,
            html=html,
            meta_tags=meta_tags,
            social_card=social_card,
            structured_data=structured_data,
            variant_config={
                "template": template.name, 
                "style": config.template_style, 
                "device": config.device, 
                "headlines": headline_variants
            },
            generated_at=datetime.now(),
            share_token=share_token
        )
    
    def _sync_generate_preview(self, lead: Lead) -> PreviewPage:
        """Synchronous preview generation for testing using core logic."""
        return self._core_generate(lead, PreviewConfig())
    
    def _build_html(self, lead: Lead, template: IndustryTemplate, headline: str, config: PreviewConfig) -> str:
        """Build complete HTML page."""
        c = template.color_scheme
        device_css = {
            "desktop": "",
            "mobile": ".preview-frame { max-width: 375px; margin: 20px auto; border: 12px solid #1f2937; border-radius: 36px; overflow: hidden; }",
            "tablet": ".preview-frame { max-width: 768px; margin: 20px auto; border: 8px solid #1f2937; border-radius: 16px; overflow: hidden; }"
        }.get(config.device, "")
        
        html = f"""<!DOCTYPE html>
<html lang="de-CH">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{lead.company_name} - Vorschau</title>
    <meta name="description" content="Website-Vorschau für {lead.company_name} in {lead.location}">
    <style>
        {self._templates.generate_css(template)}
        {device_css}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .hero-title {{ font-size: 48px; font-weight: 800; margin-bottom: 16px; line-height: 1.2; }}
        .hero-subtitle {{ font-size: 20px; opacity: 0.9; margin-bottom: 32px; }}
        .trust-badges {{ display: flex; justify-content: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }}
        .badge {{ background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 14px; }}
        .cta-group {{ display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-top: 24px; }}
        .btn-secondary {{ background: transparent; border: 2px solid white; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; }}
        h2 {{ font-size: 32px; text-align: center; margin-bottom: 40px; }}
        .features-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; }}
        .feature-card {{ background: white; padding: 32px; border-radius: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .feature-icon {{ font-size: 40px; margin-bottom: 16px; }}
        .services-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }}
        .service-card {{ background: white; padding: 24px; border-radius: 12px; text-align: center; }}
        .about-card {{ background: white; padding: 48px; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .stats {{ display: flex; justify-content: center; gap: 48px; margin-top: 32px; }}
        .stat {{ text-align: center; }}
        .stat-value {{ display: block; font-size: 24px; font-weight: 700; }}
        .stat-label {{ font-size: 14px; color: #6b7280; }}
        .preview-controls {{ position: fixed; bottom: 20px; right: 20px; display: flex; gap: 8px; background: white; padding: 8px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1000; }}
        .control-btn {{ width: 44px; height: 44px; border: none; background: #f3f4f6; border-radius: 8px; cursor: pointer; font-size: 18px; }}
        .control-btn:hover {{ background: #e5e7eb; }}
    </style>
</head>
<body>
    <div class="preview-frame">
        <header class="hero">
            <div class="container">
                <div class="trust-badges">
                    <span class="badge">⭐ Google {lead.rating or 'Neu'}</span>
                    <span class="badge">📍 {lead.location}</span>
                    <span class="badge">🛡️ Schweizer Qualität</span>
                </div>
                <h1 class="hero-title">{headline}</h1>
                <p class="hero-subtitle">Professionelle Webpräsenz für Ihr {lead.industry}-Business in {lead.location}</p>
                <div class="cta-group">
                    <button class="btn-primary">{template.primary_cta}</button>
                    <button class="btn-secondary">{template.secondary_cta}</button>
                </div>
            </div>
        </header>
        
        <section class="section-light">
            <div class="container">
                <h2>Warum {lead.company_name}?</h2>
                <div class="features-grid">
                    {self._render_features(template.features)}
                </div>
            </div>
        </section>
        
        <section style="padding: 60px 20px;">
            <div class="container">
                <div class="about-card">
                    <h2>Über uns</h2>
                    <p>{lead.company_name} ist Ihr zuverlässiger Partner für {lead.industry} in {lead.location}. Mit Erfahrung und Engagement setzen wir uns für Ihre Projekte ein. Qualität, Zuverlässigkeit und persönlicher Service stehen bei uns an erster Stelle.</p>
                    <div class="stats">
                        <div class="stat"><span class="stat-value">{template.price_range}</span><span class="stat-label">Preisbereich</span></div>
                        <div class="stat"><span class="stat-value">⭐ {lead.rating or 'Neu'}</span><span class="stat-label">Bewertung</span></div>
                        <div class="stat"><span class="stat-value">✓</span><span class="stat-label">CH Qualität</span></div>
                    </div>
                </div>
            </div>
        </section>
        
        <section class="section-light">
            <div class="container">
                <h2>Unsere Leistungen</h2>
                <div class="services-grid">{self._render_services(lead.industry)}</div>
            </div>
        </section>
        
        <section style="background: {c['primary']}; color: white; padding: 60px 20px; text-align: center;">
            <div class="container">
                <h2>Bereit?</h2>
                <p>Kontaktieren Sie uns jetzt für ein unverbindliches Gespräch.</p>
                <div class="cta-group">
                    <button class="btn-primary" style="background: white; color: {c['primary']};">{template.primary_cta}</button>
                    <button class="btn-secondary">{lead.phone or 'Anrufen'}</button>
                </div>
            </div>
        </section>
        
        <footer style="background: #1f2937; color: white; padding: 40px 20px; text-align: center;">
            <div class="container">
                <p>© 2026 {lead.company_name}. Alle Rechte vorbehalten.</p>
                <p style="margin-top: 8px; opacity: 0.7;">🇨🇭 Schweizer Qualität aus {lead.location}</p>
            </div>
        </footer>
    </div>
    
    <div class="preview-controls">
        <button onclick="toggleDevice('desktop')" class="control-btn">🖥️</button>
        <button onclick="toggleDevice('tablet')" class="control-btn">📱</button>
        <button onclick="toggleDevice('mobile')" class="control-btn">📲</button>
        <button onclick="showVariants()" class="control-btn">🎨</button>
        <button onclick="sharePreview()" class="control-btn">🔗</button>
    </div>
    
    <script>
        function toggleDevice(device) {{
            const frame = document.querySelector('.preview-frame');
            frame.className = 'preview-frame';
            if (device === 'mobile') frame.style.maxWidth = '375px';
            else if (device === 'tablet') frame.style.maxWidth = '768px';
            else frame.style.maxWidth = '100%';
        }}
        function showVariants() {{ alert("Variants: Professional, Friendly, Urgent, Story"); }}
        function sharePreview() {{ alert("Share URL copied!"); }}
    </script>
</body>
</html>"""
        return html
    
    def _render_features(self, features: List[str]) -> str:
        icons = ['✨', '⭐', '🎯', '🚀']
        return ''.join(f'<div class="feature-card"><div class="feature-icon">{icons[i % 4]}</div><h3>{f}</h3></div>' for i, f in enumerate(features))
    
    def _render_services(self, industry: str) -> str:
        services = {"restaurant": ["Mittagsmenü", "Abendessen", "Events", "Catering"], "beauty": ["Haarschnitt", "Farbe", "Styling", "Pflege"], "handwerk": ["Neubau", "Renovation", "Reparatur", "Beratung"], "medical": ["Beratung", "Behandlung", "Kontrolle", "Notfall"], "retail": ["Beratung", "Produkte", "Service", "Reparatur"], "service": ["Beratung", "Planung", "Umsetzung", "Support"]}
        industry_services = services.get(industry.lower(), services["service"])
        return ''.join(f'<div class="service-card"><div style="background: #f3f4f6; height: 120px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 32px;">🖼️</div><h4 style="margin-top: 16px;">{s}</h4></div>' for s in industry_services)
    
    def _generate_meta_tags(self, lead: Lead, headline: str) -> Dict[str, str]:
        return {"title": f"{lead.company_name} - Website Vorschau", "description": f"{headline} Professionelle Webpräsenz für {lead.company_name} in {lead.location}.", "keywords": f"{lead.company_name}, {lead.industry}, {lead.location}, Website", "author": "LeadFlow Pro", "robots": "noindex"}
    
    def _generate_social_card(self, lead: Lead, headline: str) -> Dict[str, str]:
        return {"title": lead.company_name, "description": headline[:100], "image_url": f"https://preview.leadflow.pro/social/{lead.id}.png", "site_name": "LeadFlow Pro", "locale": "de_CH"}
    
    def _generate_structured_data(self, lead: Lead, template: IndustryTemplate) -> Dict[str, Any]:
        return {"@context": "https://schema.org", "@type": "LocalBusiness", "name": lead.company_name, "address": {"@type": "PostalAddress", "addressLocality": lead.location}, "telephone": lead.phone, "priceRange": template.price_range, "aggregateRating": {"@type": "AggregateRating", "ratingValue": lead.rating, "reviewCount": lead.review_count}}
    
    def _generate_share_token(self, lead_id: str) -> str:
        token = hashlib.md5(f"{lead_id}:{time.time()}".encode()).hexdigest()[:12]
        self._share_tokens[token] = {"lead_id": lead_id, "created": datetime.now(), "expires": datetime.now() + timedelta(days=7)}
        return token
    


class LRUCache:
    """Simple LRU Cache."""
    def __init__(self, max_size: int = 1000):
        self._max_size = max_size
        self._cache: Dict[str, Any] = {}
        self._order: List[str] = []
        self._lock = threading.Lock()
    
    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key in self._cache:
                self._order.remove(key)
                self._order.append(key)
                return self._cache[key]["value"]
            return None
    
    def set(self, key: str, value: Any, ttl: int = None):
        with self._lock:
            if key in self._cache:
                self._order.remove(key)
            elif len(self._order) >= self._max_size:
                evict_key = self._order.pop(0)
                del self._cache[evict_key]
            self._cache[key] = {"value": value, "expires": datetime.now() + timedelta(seconds=ttl) if ttl else None}
            self._order.append(key)
    
    def size(self) -> int:
        with self._lock:
            return len(self._cache)


def main():
    print("=" * 70)
    print("🎨 Creator Agent 3.0 - Preview Engine Complete")
    print("   Dynamic Headlines + Industry Templates + Live Preview")
    print("=" * 70)
    
    # Test with sample leads
    test_leads = [
        Lead(id="1", company_name="Coiffure Zurich", industry="beauty", location="Zürich", website_status="KEINE WEBSITE", rating=4.8, review_count=45, phone="+41 44 123 45 67"),
        Lead(id="2", company_name="Restaurant Keller", industry="restaurant", location="Bern", website_status="veraltet", rating=4.5, review_count=120, phone="+41 31 123 45 67"),
        Lead(id="3", company_name="Müller Handwerk", industry="handwerk", location="Basel", website_status="KEINE WEBSITE", rating=4.2, review_count=28, phone="+41 61 123 45 67")
    ]
    
    server = LivePreviewServer()
    
    print("\n🧪 Testing Preview Generation...")
    for lead in test_leads:
        preview = server._sync_generate_preview(lead)
        print(f"   ✓ {lead.company_name} ({lead.industry})")
        print(f"      Headline: {preview.variant_config['headlines']['professional'][:50]}...")
        print(f"      Template: {preview.variant_config['template']}")
        print(f"      Share Token: {preview.share_token}")
    
    print("\n📊 Headline Variants:")
    for lead in test_leads[:1]:
        variants = server._headlines.generate_variants(lead)
        for style, headline in variants.items():
            print(f"   [{style}]: {headline}")
    
    print("\n🎨 Industry Templates:")
    for industry in ["restaurant", "beauty", "handwerk", "medical"]:
        template = server._templates.get_template(industry)
        print(f"   {template.name}: {template.primary_cta}")
    
    print("\n✅ Creator Agent 3.0 Ready!")
    print("=" * 70)

# Add sync method for testing
if __name__ == "__main__":
    import asyncio
    
    def sync_wrapper():
        class SyncServer(LivePreviewServer):
            def _sync_generate_preview(self, lead):
                import asyncio
                return asyncio.run(self.generate_preview(lead))
        
        server = SyncServer()
        return server
    
    class SyncServer(LivePreviewServer):
        def _sync_generate_preview(self, lead):
            return self._core_generate(lead, PreviewConfig())
    
    server = SyncServer()
    main()
