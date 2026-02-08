import argparse
import csv
import json
import os

def enrich_leads(input_file):
    print(f"🔥 Enriching leads from {input_file} using Firecrawl...")
    
    enriched_leads = []
    
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                print(f"🔍 Scraping data for: {row['name']}...")
                # Simulated Firecrawl logic
                row["email"] = f"info@{row['name'].lower().replace(' ', '')}.ch"
                row["phone"] = "+41 44 XXX XX XX"
                row["tech_stack"] = "WordPress, outdated" if row["website"] else "None"
                enriched_leads.append(row)
    except FileNotFoundError:
        print(f"❌ Error: {input_file} not found.")
        return

    # Save enriched leads - use relative pathing
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(BASE_DIR, "leads_enriched.csv")
    if enriched_leads:
        with open(output_file, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=enriched_leads[0].keys())
            writer.writeheader()
            writer.writerows(enriched_leads)
        print(f"\n✅ Enrichment complete. Saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bottie Lead Enrichment with Firecrawl")
    parser.add_argument("--input", required=True, help="Input CSV file with leads")
    
    args = parser.parse_args()
    
    enrich_leads(args.input)
