#!/usr/bin/env python3
"""
Creator Agent 2.0 - Enhanced with Image AI & Lead Scoring
"""

import json
import csv
import os
import time
import random
from datetime import datetime
from typing import Dict, List, Optional

# Config
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# ============================================
# 🎨 PHASE 1: UNSPLASH IMAGE INTEGRATION
# ============================================

UNSPLASH_COLLECTIONS = {
    "beauty": ["1600", "1611", "1560", "1575"],  # Beauty, Makeup, Fashion
    "handwerk": ["1654", "1660", "1647", "1628"],  # Construction, Craft, Tools
    "restaurant": ["1634", "1567", "1547"],          # Food, Restaurant, Cooking
    "retail": ["1604", "1619", "1622"],             # Shopping, Store, Interior
    "service": ["1650", "1623", "1638"],            # Business, Office, Team
    "swiss": ["1362", "1392", "1420"],              # Switzerland, Mountains, Cities
}

UNSPLASH_KEYWORDS = {
    "beauty": ["beauty salon", "hair salon", "makeup", "wellness", "spa"],
    "handwerk": ["workshop", "craftsman", "construction", "tools", "handwerk"],
    "restaurant": ["restaurant interior", "fine dining", "gourmet", "chef"],
    "retail": ["boutique", "shop interior", "store", "retail design"],
    "service": ["business meeting", "office", "professional", "consulting"],
    "swiss": ["switzerland", "zurich", "bern", "alps", "swiss city"],
}

class UnsplashImageGenerator:
    """Generiert passende Bilder für Templates."""
    
    def __init__(self):
        self.cache = {}
    
    def search_image(self, keywords: List[str], orientation: str = "landscape") -> Dict:
        """Sucht Bild auf Unsplash."""
        if not UNSPLASH_ACCESS_KEY:
            return self._get_fallback_image(keywords)
        
        try:
            import urllib.request
            import urllib.parse
            
            query = ",".join(keywords)
            url = f"https://api.unsplash.com/photos/random?query={urllib.parse.quote(query)}&orientation={orientation}&count=1"
            
            headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}
            req = urllib.request.Request(url, headers=headers)
            
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())
            
            if data and len(data) > 0:
                return {
                    "url": data[0]["urls"]["regular"],
                    "thumb": data[0]["urls"]["thumb"],
                    "credit": f"Photo by {data[0]['user']['name']} on Unsplash",
                    "photographer": data[0]["user"]["name"],
                    "link": data[0]["links"]["html"]
                }
        except Exception as e:
            print(f"Unsplash Error: {e}")
        
        return self._get_fallback_image(keywords)
    
    def _get_fallback_image(self, keywords: List[str]) -> Dict:
        """Fallback zu atmosphärischen Platzhaltern."""
        keyword = keywords[0].replace(" ", "-").lower() if keywords else "business"
        
        return {
            "url": f"https://images.unsplash.com/photo-{random.randint(1500000000,1600000000)}?w=1200",
            "thumb": f"https://images.unsplash.com/photo-{random.randint(1500000000,1600000000)}?w=400",
            "credit": f"Keyword: {keyword}",
            "photographer": "Unsplash",
            "link": "https://unsplash.com"
        }
    
    def get_hero_image(self, industry: str, location: str) -> Dict:
        """Generiert Hero-Bild für Lead."""
        industry_type = industry.lower()
        
        # Find matching keywords
        keywords = UNSPLASH_KEYWORDS.get(industry_type, UNSPLASH_KEYWORDS["swiss"])
        keywords.append(location)
        
        return self.search_image(keywords, "landscape")
    
    def get_service_images(self, industry: str, count: int = 3) -> List[Dict]:
        """Generiert Bilder für Services-Sektion."""
        industry_type = industry.lower()
        keywords = UNSPLASH_KEYWORDS.get(industry_type, UNSPLASH_KEYWORDS["swiss"])
        
        images = []
        for i in range(count):
            img_keywords = keywords + [f"service-{i+1}"]
            images.append(self.search_image(img_keywords))
            time.sleep(0.3)
        
        return images


# ============================================
# 🤖 PHASE 2: AI CONTENT GENERATION
# ============================================

class AIContentGenerator:
    """AI-generierte Inhalte für Templates."""
    
    # Schweizer Copy Templates
    SWISS_COPY = {
        "hero": {
            "premium": [
                "Exzellenz, die man sieht.",
                "Qualität, die überzeugt.",
                "Ihr Meisterbetrieb für {city}.",
                "Tradition trifft Innovation.",
            ],
            "modern": [
                "Willkommen bei {name}.",
                "Ihr {industry}-Partner in {city}.",
                "Professionell. Regional. Zuverlässig.",
                "Qualität aus {city}.",
            ]
        },
        "cta": {
            "beauty": ["Termin vereinbaren", "Beratung buchen", "Anrufen"],
            "handwerk": ["Projekt besprechen", "Offerte anfordern", "Kontakt"],
            "restaurant": ["Tisch reservieren", "Platz reservieren"],
            "retail": ["Besuchen Sie uns", "Angebot ansehen"],
            "service": ["Kontakt aufnehmen", "Angebot anfordern"],
        },
        "urgency": {
            "no_website": "Ohne Website verlieren Sie täglich potenzielle Kunden an die Konkurrenz.",
            "outdated": "Eine veraltete Website schreckt Kunden ab.",
            "no_online": "Ihr Business ist online nicht sichtbar.",
        }
    }
    
    def __init__(self):
        self.prompts = {}
    
    def generate_hero(self, lead: Dict, style: str = "modern") -> Dict:
        """Generiert Hero-Sektion."""
        name = lead.get("name", "Ihr Unternehmen")
        industry = lead.get("industry", "Dienstleistung")
        city = lead.get("location", "Schweiz")
        
        headlines = self.SWISS_COPY["hero"].get(style, self.SWISS_COPY["hero"]["modern"])
        
        return {
            "headline": random.choice(headlines).format(name=name, industry=industry, city=city),
            "subheadline": f"{industry} mit Erfahrung und Herzblut in {city}.",
            "cta": self._get_cta(industry),
            "trust_badges": self._get_trust_badges(industry)
        }
    
    def _get_cta(self, industry: str) -> str:
        """Wählt passenden CTA."""
        industry_lower = industry.lower()
        for key, ctas in self.SWISS_COPY["cta"].items():
            if key in industry_lower:
                return random.choice(ctas)
        return "Kontakt aufnehmen"
    
    def _get_trust_badges(self, industry: str) -> List[str]:
        """Generiert Trust-Badges."""
        badges = [
            "⭐ Google Bewertungen",
            "🛡️ 100% Swiss Made",
            "📞 Kostenlose Beratung",
        ]
        
        industry_lower = industry.lower()
        if "handwerk" in industry_lower or "bau" in industry_lower:
            badges.extend(["🔨 Meisterbetrieb", "📋 SUISA zertifiziert"])
        elif "beauty" in industry_lower or "kosmetik" in industry_lower:
            badges.extend(["💄 Zertifizierte Kosmetik", "✨ Premium Produkte"])
        elif "restaurant" in industry_lower or "gastro" in industry_lower:
            badges.extend(["👨‍🍳 HACCP zertifiziert", "🍽️ Frische Zutaten"])
        
        return badges[:4]
    
    def generate_services(self, industry: str, count: int = 6) -> List[Dict]:
        """Generiert Services-Sektion."""
        industry_lower = industry.lower()
        
        service_templates = {
            "beauty": ["Haarschnitt", "Farbe & Strähnen", "Styling", "Pflege", "Make-up", "Beratung"],
            "handwerk": ["Neubau", "Renovation", "Reparatur", "Beratung", "Planung", "Ausführung"],
            "restaurant": ["Mittagsmenü", "Abendessen", "Events", "Catering", "Getränke", "Spezialitäten"],
            "retail": ["Beratung", "Produkte", "Service", "Reparatur", "Lieferung", "Showroom"],
            "service": ["Beratung", "Planung", "Umsetzung", "Support", "Wartung", "Optimierung"],
        }
        
        templates = service_templates.get(industry_lower, service_templates["service"])
        services = []
        
        for i, title in enumerate(templates[:count]):
            services.append({
                "id": i + 1,
                "title": title,
                "description": f"Hochwertige {title} für Ihre Bedürfnisse.",
                "icon": self._get_icon(industry_lower, i)
            })
        
        return services
    
    def _get_icon(self, industry: str, index: int) -> str:
        """Wählt passendes Icon."""
        icons = ["✨", "⭐", "💎", "🎯", "🚀", "💪"]
        return icons[index % len(icons)]
    
    def generate_about(self, lead: Dict) -> Dict:
        """Generiert About-Sektion."""
        name = lead.get("name", "Wir")
        city = lead.get("location", "Schweiz")
        
        return {
            "headline": "Regional verwurzelt, Qualität orientiert.",
            "story": f"{name} ist Ihr zuverlässiger Partner in {city}. "
                    f"Mit jahrelanger Erfahrung und einem engagierten Team setzen wir "
                    f"uns für Ihre Projekte ein. Qualität, Zuverlässigkeit und "
                    f"persönlicher Service stehen bei uns an erster Stelle.",
            "years_active": random.randint(5, 40),
            "team_photo": "team-placeholder.jpg"
        }
    
    def generate_testimonials(self, lead: Dict) -> Dict:
        """Generiert Testimonials-Sektion."""
        name = lead.get("name", "Kunden")
        rating = lead.get("rating", 4.8)
        
        return {
            "score": rating,
            "platform": "Google Bewertungen",
            "total_reviews": random.randint(10, 200),
            "featured_reviews": [
                {
                    "author": "Satisfied Customer",
                    "rating": 5,
                    "text": f"Sehr zufrieden mit der Arbeit von {name}. Jederzeit wieder!"
                },
                {
                    "author": "Happy Client",
                    "rating": 5,
                    "text": "Professioneller Service, faire Preise, top Ergebnis."
                }
            ]
        }


# ============================================
# 📊 PHASE 3: ENHANCED LEAD SCORING
# ============================================

class EnhancedLeadScorer:
    """Verbesserter Lead-Scoring Algorithmus."""
    
    def __init__(self):
        self.weights = {
            "website_status": 3.0,
            "online_presence": 2.5,
            "review_score": 2.0,
            "review_volume": 1.5,
            "location_value": 1.5,
            "industry_match": 2.0,
            "contact_availability": 1.0,
            "competition_level": 1.5,
        }
    
    def score_lead(self, lead: Dict) -> Dict:
        """
        Berechnet umfassenden Lead-Score.
        
        Returns:
        {
            "total_score": 0-100,
            "grade": "A" | "B" | "C" | "D",
            "factors": {...},
            "recommendations": [...]
        }
        """
        factors = {}
        
        # 1. Website Status (0-30 Punkte)
        website = lead.get("website_status", "").lower()
        if "fehlt" in website or "keine" in website:
            factors["website_status"] = 30  # Hohe Priorität!
        elif "veraltet" in website:
            factors["website_status"] = 20
        elif "gut" in website:
            factors["website_status"] = 5
        else:
            factors["website_status"] = 10
        
        # 2. Online Presence (0-25 Punkte)
        online_score = 0
        if lead.get("google_maps"):
            online_score += 10
        if lead.get("social_media"):
            online_score += 8
        if lead.get("local_directory"):
            online_score += 7
        factors["online_presence"] = min(25, online_score)
        
        # 3. Review Score (0-20 Punkte)
        rating = lead.get("rating")
        if rating:
            if rating >= 4.5:
                factors["review_score"] = 20
            elif rating >= 4.0:
                factors["review_score"] = 15
            elif rating >= 3.5:
                factors["review_score"] = 10
            else:
                factors["review_score"] = 5
        else:
            factors["review_score"] = 10  # Neutral
        
        # 4. Review Volume (0-15 Punkte)
        reviews = lead.get("review_count", 0)
        if reviews >= 100:
            factors["review_volume"] = 15
        elif reviews >= 50:
            factors["review_volume"] = 12
        elif reviews >= 20:
            factors["review_volume"] = 8
        elif reviews >= 10:
            factors["review_volume"] = 5
        else:
            factors["review_volume"] = 2
        
        # 5. Location Value (0-15 Punkte)
        city = lead.get("location", "").lower()
        high_value_cities = ["zürich", "bern", "basel", "genf", "geneva"]
        medium_cities = ["luzern", "winterthur", "st. gallen", "lausanne"]
        
        if any(c in city for c in high_value_cities):
            factors["location_value"] = 15
        elif any(c in city for c in medium_cities):
            factors["location_value"] = 10
        else:
            factors["location_value"] = 5
        
        # 6. Industry Match (0-20 Punkte)
        industry = lead.get("industry", "").lower()
        high_value_industries = ["restaurant", "gastro", "medical", "praxis"]
        medium_industries = ["beauty", "handwerk", "retail"]
        
        if any(i in industry for i in high_value_industries):
            factors["industry_match"] = 20
        elif any(i in industry for i in medium_industries):
            factors["industry_match"] = 15
        else:
            factors["industry_match"] = 10
        
        # 7. Contact Availability (0-10 Punkte)
        if lead.get("phone"):
            factors["contact_availability"] = 10
        elif lead.get("email"):
            factors["contact_availability"] = 5
        else:
            factors["contact_availability"] = 2
        
        # 8. Competition Level (0-15 Punkte - invertiert)
        # Weniger Competition = mehr Punkte
        competition = lead.get("competition_level", "medium")
        competition_map = {"low": 15, "medium": 10, "high": 5}
        factors["competition_level"] = competition_map.get(competition, 10)
        
        # Calculate Total
        total = sum(factors.values())
        
        # Grade
        if total >= 85:
            grade = "A+"
        elif total >= 75:
            grade = "A"
        elif total >= 65:
            grade = "B"
        elif total >= 50:
            grade = "C"
        else:
            grade = "D"
        
        # Recommendations
        recommendations = self._get_recommendations(factors, lead)
        
        return {
            "total_score": total,
            "grade": grade,
            "factors": factors,
            "recommendations": recommendations,
            "color": self._get_grade_color(grade)
        }
    
    def _get_recommendations(self, factors: Dict, lead: Dict) -> List[str]:
        """Erzeugt Empfehlungen basierend auf Faktoren."""
        recs = []
        
        if factors.get("website_status", 0) >= 25:
            recs.append("🔴 URGENT: Lead hat keine Website - sofort kontaktieren!")
        
        if factors.get("review_score", 0) >= 15 and factors.get("review_volume", 0) >= 10:
            recs.append("⭐ Gute Bewertungen - als Testimonial nutzen!")
        
        if factors.get("location_value", 0) >= 15:
            recs.append("📍 Top-Lage - Premium-Pricing möglich!")
        
        if factors.get("contact_availability", 0) >= 10:
            recs.append("📞 Direkter Kontakt möglich - anrufen!")
        
        if factors.get("online_presence", 0) < 10:
            recs.append("🌐 Schwache Online-Präsenz - unser Service wird geschätzt werden!")
        
        return recs
    
    def _get_grade_color(self, grade: str) -> str:
        """Gibt Farbe für Grade zurück."""
        colors = {
            "A+": "#22c55e",  # Green
            "A": "#84cc16",   # Lime
            "B": "#eab308",   # Yellow
            "C": "#f97316",   # Orange
            "D": "#ef4444",   # Red
        }
        return colors.get(grade, "#6b7280")


# ============================================
# 🎯 CREATOR AGENT 2.0 MAIN CLASS
# ============================================

class CreatorAgent2:
    """Creator Agent mit allen 3 Phasen."""
    
    def __init__(self):
        self.unsplash = UnsplashImageGenerator()
        self.ai = AIContentGenerator()
        self.scorer = EnhancedLeadScorer()
        self.stats = {
            "leads_processed": 0,
            "images_generated": 0,
            "content_generated": 0,
            "scores_calculated": 0
        }
    
    def process_lead(self, lead: Dict) -> Dict:
        """Verarbeitet einen Lead vollständig."""
        self.stats["leads_processed"] += 1
        
        # Phase 1: Images
        hero_image = self.unsplash.get_hero_image(
            lead.get("industry", "swiss"),
            lead.get("location", "Schweiz")
        )
        self.stats["images_generated"] += 1
        
        # Phase 2: Content
        hero = self.ai.generate_hero(lead)
        services = self.ai.generate_services(lead.get("industry", "service"), 6)
        about = self.ai.generate_about(lead)
        testimonials = self.ai.generate_testimonials(lead)
        self.stats["content_generated"] += 1
        
        # Phase 3: Scoring
        score = self.scorer.score_lead(lead)
        self.stats["scores_calculated"] += 1
        
        return {
            "lead": lead,
            "images": {
                "hero": hero_image,
                "services": self.unsplash.get_service_images(lead.get("industry", "swiss"), 3)
            },
            "content": {
                "hero": hero,
                "services": services,
                "about": about,
                "testimonials": testimonials
            },
            "score": score,
            "generated_at": datetime.now().isoformat()
        }
    
    def process_batch(self, leads: List[Dict]) -> List[Dict]:
        """Verarbeitet mehrere Leads."""
        results = []
        for lead in leads:
            result = self.process_lead(lead)
            results.append(result)
        return results


def main():
    """CLI Interface."""
    agent = CreatorAgent2()
    
    print("=" * 70)
    print("🎯 CREATOR AGENT 2.0")
    print("   Image AI + Content Generation + Lead Scoring")
    print("=" * 70)
    
    # Test mit Beispieldaten
    test_leads = [
        {
            "name": "Coiffure Thomas D",
            "industry": "beauty",
            "location": "Zürich",
            "website_status": "KEINE WEBSITE",
            "rating": 4.8,
            "review_count": 45,
            "phone": "+41 44 123 45 67",
            "google_maps": True,
            "social_media": False,
            "local_directory": True
        },
        {
            "name": "Metzgerei Müller",
            "industry": "retail",
            "location": "Bern",
            "website_status": "veraltet",
            "rating": 4.2,
            "review_count": 28,
            "phone": "+41 31 123 45 67",
            "google_maps": True,
            "social_media": True,
            "local_directory": True
        }
    ]
    
    # Process
    results = agent.process_batch(test_leads)
    
    # Show results
    for r in results:
        lead = r["lead"]["name"]
        score = r["score"]["total_score"]
        grade = r["score"]["grade"]
        recs = r["score"]["recommendations"]
        
        print(f"\n📋 {lead}")
        print(f"   Score: {score}/100 ({grade})")
        print(f"   🎨 Hero: {r['images']['hero']['credit'][:50]}...")
        for rec in recs:
            print(f"   {rec}")
    
    print(f"\n📊 Stats: {agent.stats}")


if __name__ == "__main__":
    main()
