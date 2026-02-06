import argparse
import json
import csv
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

def extract_lead_new_api(place, api_key):
    """Extract lead info from Google Places API (New) format."""
    try:
        return {
            "id": place.get('id'),
            "name": place.get('displayName', {}).get('text'),
            "city": place.get('formattedAddress'),
            "industry": "Local Business",
            "reviews": place.get('userRatingCount', 0),
            "rating": place.get('rating', 0),
            "website": place.get('websiteUri')
        }
    except Exception as e:
        print(f"Error extracting lead: {e}")
        return None

def find_leads_new_api(city, industry, min_reviews, min_rating=4.0):
    """Search using NEW Google Places API (2024+)."""
    if not API_KEY:
        print("ERROR: GOOGLE_PLACES_API_KEY not found in .env.local")
        return []
    
    if not HAS_GOOGLE_MAPS:
        print("ERROR: 'googlemaps' library not installed. Run: pip install googlemaps")
        return []

    try:
        # Use the new Places API via googlemaps client
        client = googlemaps.Client(key=API_KEY)
        
        # Text Search (New API)
        query = f"{industry} in {city}"
        results = client.places(query=query)
        
        leads = []
        for result in results.get('results', []):
            lead = {
                "id": result.get('place_id'),
                "name": result.get('name'),
                "city": result.get('vicinity'),
                "industry": industry,
                "reviews": result.get('user_ratings_total', 0),
                "rating": float(result.get('rating', 0)),
                "website": result.get('website')
            }
            
            # Apply filters
            if lead["reviews"] >= min_reviews and lead["rating"] >= min_rating:
                leads.append(lead)
                
        return leads
        
    except Exception as e:
        print(f"API Error: {e}")
        print("Hinweis: Places API (New) erfordert separaten API Key")
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
        },
        {
            "id": "lead_zh_003",
            "name": "Coiffeur Schönheit",
            "city": city,
            "industry": industry or "Beauty",
            "reviews": 67,
            "rating": 4.8,
            "website": None
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
    
    # Check if we should use real API
    use_real = args.real or (API_KEY and not args.real is False)
    
    if use_real:
        leads = find_leads_new_api(args.city, args.industry, args.min_reviews, args.min_rating)
        if not leads:
            print("\n⚠️  API returned no results. Trying with --mock fallback...")
            leads = find_leads_mock(args.city, args.industry, args.min_reviews, args.min_rating)
    else:
        leads = find_leads_mock(args.city, args.industry, args.min_reviews, args.min_rating)
    
    print(f"\n✅ Found {len(leads)} potential leads in {args.city}")
    print("-" * 50)
    for lead in leads:
        print(f"📍 {lead['name']}")
        print(f"   ⭐ {lead['rating']} ({lead['reviews']} reviews)")
        print(f"   🌐 {lead['website'] or 'NO WEBSITE'}")
        print()
    
    # Save to CSV
    with open("leads.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "city", "industry", "reviews", "rating", "website"])
        writer.writeheader()
        writer.writerows(leads)
    
    print("💾 Leads saved to leads.csv")
