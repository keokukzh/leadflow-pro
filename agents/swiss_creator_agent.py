#!/usr/bin/env python3
"""
Swiss Creator Agent - Lead-zu-Website Generator für Schweizer KMU
"""

import json
import csv
import os
from datetime import datetime
from typing import Dict, List, Optional

class SwissCreatorAgent:
    """Agent für Schweizer Lead-zu-Website Conversion."""
    
    TEMPLATES = {
        "beauty": {
            "name": "Beauty & Wellness",
            "colors": ["spa-pink", "relax-green"],
            "cta": "Termin vereinbaren"
        },
        "handwerk": {
            "name": "Handwerk & Bau",
            "colors": ["tradition-brown", "craft-orange"],
            "cta": "Projekt besprechen"
        },
        "restaurant": {
            "name": "Restaurant & Gastro",
            "colors": ["warm-orange", "elegant-black"],
            "cta": "Tisch reservieren"
        },
        "retail": {
            "name": "Laden & Shop",
            "colors": ["modern-purple", "urban-gray"],
            "cta": "Besuchen Sie uns"
        },
        "service": {
            "name": "Dienstleister",
            "colors": ["professional-blue", "dark-navy"],
            "cta": "Angebot anfordern"
        },
        "swiss": {
            "name": "Swiss Premium",
            "colors": ["swiss-neutral", "alpine-fresh"],
            "cta": "Kontakt aufnehmen"
        }
    }
    
    INDUSTRY_MAP = {
        "coiffeur": "beauty",
        "friseur": "beauty",
        "hairdresser": "beauty",
        "hair": "beauty",
        "nagel": "beauty",
        "kosmetik": "beauty",
        "bäckerei": "retail",
        "bakery": "retail",
        "metzgerei": "retail",
        "butcher": "retail",
        "blumen": "retail",
        "restaurant": "restaurant",
        "gastro": "restaurant",
        "handwerk": "handwerk",
        "schreiner": "handwerk",
        "elektriker": "handwerk",
        "maler": "handwerk",
        "metzger": "handwerk",
    }
    
    def detect_industry(self, industry: str) -> str:
        if not industry:
            return "swiss"
        industry_lower = industry.lower()
        for keyword, template in self.INDUSTRY_MAP.items():
            if keyword in industry_lower:
                return template
        return "swiss"
    
    def calculate_priority(self, row: Dict) -> int:
        score = 5
        
        # Phone available?
        tel = row.get("Telefon", "").strip()
        if tel and tel != "KEINE WEBSITE":
            score += 2
        
        # Priority from CSV
        prio = row.get("Prioritaet", "")
        if prio == "1":
            score += 3
        
        # Location
        stadt = row.get("Stadt", "").lower()
        if any(x in stadt for x in ["zürich", "bern", "basel"]):
            score += 1
        
        return min(10, score)
    
    def generate_strategy(self, row: Dict) -> Dict:
        industry = self.detect_industry(row.get("Branche", ""))
        template = self.TEMPLATES[industry]
        
        name = row.get("Name", "Unternehmen")
        stadt = row.get("Stadt", "Schweiz")
        
        urgency = "Ohne Website verlieren Sie täglich potenzielle Kunden."
        if not row.get("Telefon", "").strip():
            urgency = "Mit einer Website werden Sie auch online gefunden!"
        
        return {
            "company_name": name,
            "industry": row.get("Branche", "Dienstleistung"),
            "location": stadt,
            "brand_tone": f"Professionell & Regional aus {stadt}",
            "key_sells": [
                f"Qualität aus {stadt}",
                "Erfahrenes Team",
                "Persönlicher Service"
            ],
            "color_palette": template["colors"][0],
            "template_type": template["name"],
            "cta": template["cta"],
            "urgency_factor": urgency,
            "priority_score": self.calculate_priority(row),
            "swiss_specific": {
                "domain": f"{name.lower().replace(' ', '').replace('&', 'und')}.ch",
                "phone_format": "044 XXX XX XX",
                "pricing": "Individuelles Angebot",
                "language": "de-CH"
            }
        }
    
    def process_csv(self, input_file: str, output_file: str):
        results = []
        
        with open(input_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        delimiter = ";" if ";" in content else ","
        reader = csv.DictReader(content.splitlines(), delimiter=delimiter)
        
        for row in reader:
            strategy = self.generate_strategy(row)
            results.append(strategy)
        
        # Save JSON
        with open(output_file.replace(".csv", ".json"), "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Save CSV summary
        fieldnames = ["company_name", "industry", "location", "brand_tone",
                     "template_type", "cta", "priority_score", "urgency_factor",
                     "domain"]
        
        with open(output_file, "w", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=";")
            writer.writeheader()
            for r in results:
                row = {k: v for k, v in r.items() if k in fieldnames}
                row["domain"] = r.get("swiss_specific", {}).get("domain", "")
                writer.writerow(row)
        
        return {
            "total": len(results),
            "high_priority": sum(1 for r in results if r["priority_score"] >= 7),
            "output_csv": output_file,
            "output_json": output_file.replace(".csv", ".json")
        }


def main():
    agent = SwissCreatorAgent()
    
    # Adjusted paths for agents/ folder
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(BASE_DIR, "..", "frontend", "data", "leads_alle.csv")
    output_file = os.path.join(BASE_DIR, "..", "frontend", "data", "lead_strategies.csv")
    
    if os.path.exists(input_file):
        result = agent.process_csv(input_file, output_file)
        
        print("=" * 70)
        print("🎯 SWISS CREATOR AGENT")
        print("=" * 70)
        print(f"\n✅ {result['total']} Leads verarbeitet")
        print(f"⭐ High Priority: {result['high_priority']}")
        print(f"\n💾 CSV: {result['output_csv']}")
        print(f"💾 JSON: {result['output_json']}")
        
        # Show sample
        with open(output_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter=";")
            print("\n🏆 TOP 5 PRIORITY:")
            for row in sorted(reader, key=lambda x: int(x.get("priority_score", 0)), reverse=True)[:5]:
                print(f"  ⭐ {row['priority_score']}/10 | {row['company_name'][:25]} | {row['template_type']}")
    else:
        print(f"❌ {input_file} nicht gefunden")


if __name__ == "__main__":
    main()
