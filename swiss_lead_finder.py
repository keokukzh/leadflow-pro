import argparse
import json
import csv
import sys
import os
from dotenv import load_dotenv

# Try to import googlemaps, handle missing dependency gracefully
try:
    import googlemaps
    HAS_GOOGLE_MAPS = True
except ImportError:
    HAS_GOOGLE_MAPS = False

# Load environment variables from .env.local
load_dotenv(dotenv_path="leadflow-pro/.env.local")
API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

def extract_lead(place_id, client):
    """Extract standard lead info from a Google Places result."""
    try:
        # Get details for the specific place
        details = client.place(place_id=place_id, fields=['name', 'vicinity', 'website', 'rating', 'user_ratings_total'])
        result = details.get('result', {})
        
        return {
            "id": place_id,
            "name": result.get('name'),
            "city": result.get('vicinity'),
            "industry": "Local Business",
            "reviews": result.get('user_ratings_total', 0),
            "rating": float(result.get('rating', 0)),
            "website": result.get('website')
        }
    except Exception as e:
        print(f"Error extracting lead {place_id}: {e}")
        return None

def find_leads_real(city, industry, min_reviews, min_rating=4.0):
    """Actual search using official Google Maps (Places) API."""
    if not API_KEY:
        print("ERROR: GOOGLE_PLACES_API_KEY not found in .env.local")
        return []
    
    if not HAS_GOOGLE_MAPS:
        print("ERROR: 'googlemaps' library not installed. Run: pip install googlemaps")
        return []

    client = googlemaps.Client(key=API_KEY)
    
    try:
        # keyword search
        query = f"{industry} in {city}"
        results = client.places(query=query)
        
        leads = []
        for result in results.get('results', []):
            place_id = result.get('place_id')
            if not place_id:
                continue
                
            lead = extract_lead(place_id, client)
            if lead:
                # Apply filters
                if lead["reviews"] >= min_reviews and lead["rating"] >= min_rating:
                    leads.append(lead)
                    
        return leads
    except Exception as e:
        print(f"Search error: {e}")
        return []

def find_leads_mock(city, industry, min_reviews, min_rating):
    print(f"DEBUG: Using MOCK data for {industry} in {city}...")
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
    
    return [
        l for l in mock_leads 
        if l["reviews"] >= min_reviews and l["rating"] >= min_rating
    ]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bottie Lead Finder for Switzerland")
    parser.add_argument("--city", required=True, help="City to search in (e.g., Zurich)")
    parser.add_argument("--industry", help="Industry (e.g., restaurant)")
    parser.add_argument("--min-reviews", type=int, default=20, help="Minimum number of reviews")
    parser.add_argument("--min-rating", type=float, default=4.0, help="Minimum rating")
    parser.add_argument("--real", action="store_true", help="Use real Google Places API")
    
    args = parser.parse_args()
    
    if args.real or API_KEY:
        leads = find_leads_real(args.city, args.industry, args.min_reviews, args.min_rating)
    else:
        leads = find_leads_mock(args.city, args.industry, args.min_reviews, args.min_rating)
    
    print(f"\n✅ Found {len(leads)} potential leads in {args.city}")
    print("-" * 50)
    for lead in leads:
        print(f"📍 {lead['name']} | ⭐ {lead['rating']} ({lead['reviews']} reviews) | Website: {lead['website'] or 'NONE'}")
    
    # Save to CSV
    with open("leads.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "city", "industry", "reviews", "rating", "website"])
        writer.writeheader()
        writer.writerows(leads)
    
    print("\n💾 Leads saved to leads.csv")
