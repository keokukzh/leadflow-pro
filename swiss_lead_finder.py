import argparse
import json
import csv
import sys

def find_leads(city, industry, min_reviews, min_rating):
    print(f"DEBUG: Searching for {industry} in {city} with >= {min_reviews} reviews and >= {min_rating} rating...")
    
    # This is a mockup of what the script would do.
    # In a real scenario, it would call Google Places API or OSM.
    
    mock_leads = [
        {
            "id": "lead_zh_001",
            "name": "Restaurant Limmat",
            "city": city,
            "industry": industry or "Restaurant",
            "reviews": 45,
            "rating": 4.5,
            "website": None
        },
        {
            "id": "lead_zh_002",
            "name": "Schreinerei Meier",
            "city": city,
            "industry": industry or "Handwerk",
            "reviews": 22,
            "rating": 4.2,
            "website": "http://veraltet-meier.ch"
        }
    ]
    
    filtered_leads = [
        l for l in mock_leads 
        if l["reviews"] >= min_reviews and l["rating"] >= min_rating
    ]
    
    return filtered_leads

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bottie Lead Finder for Switzerland")
    parser.add_argument("--city", required=True, help="City to search in (e.g., Zurich)")
    parser.add_argument("--industry", help="Industry (e.g., restaurant)")
    parser.add_argument("--min-reviews", type=int, default=20, help="Minimum number of reviews")
    parser.add_argument("--min-rating", type=float, default=4.0, help="Minimum rating")
    
    args = parser.parse_args()
    
    leads = find_leads(args.city, args.industry, args.min_reviews, args.min_rating)
    
    print(f"\n✅ Found {len(leads)} potential leads in {args.city}")
    print("-" * 50)
    for lead in leads:
        print(f"📍 {lead['name']} | ⭐ {lead['rating']} ({lead['reviews']} reviews) | Website: {lead['website'] or 'NONE'}")
    
    # Save to CSV for the next step
    with open("leads.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "city", "industry", "reviews", "rating", "website"])
        writer.writeheader()
        writer.writerows(leads)
    
    print("\n💾 Leads saved to leads.csv")
