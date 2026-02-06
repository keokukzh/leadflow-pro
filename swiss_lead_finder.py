import argparse
import json
import csv
import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(dotenv_path="leadflow-pro/.env.local")
API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

def search_places_new_api(city, industry, api_key):
    """Search using NEW Google Places API (REST API)."""
    if not api_key:
        print("ERROR: GOOGLE_PLACES_API_KEY not found in .env.local")
        return []
    
    try:
        # Places API (New) - Text Search
        url = "https://places.googleapis.com/v1/places:searchText"
        
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri"
        }
        
        data = {
            "textQuery": f"{industry} in {city}",
            "maxResultCount": 20
        }
        
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        if response.status_code != 200:
            print(f"API Error: {response.status_code} - {response.text}")
            return []
        
        results = response.json().get('places', [])
        
        leads = []
        for place in results:
            name = place.get('displayName', {}).get('text', 'Unknown')
            address = place.get('formattedAddress', city)
            rating = place.get('rating', 0)
            reviews = place.get('userRatingCount', 0)
            website = place.get('websiteUri', None)
            
            lead = {
                "id": place.get('id'),
                "name": name,
                "city": address,
                "industry": industry,
                "reviews": reviews,
                "rating": rating,
                "website": website
            }
            leads.append(lead)
        
        return leads
        
    except Exception as e:
        print(f"Error: {e}")
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

def filter_leads(leads, min_reviews, min_rating):
    """Filter leads by minimum reviews and rating."""
    return [
        l for l in leads
        if l.get("reviews", 0) >= min_reviews and l.get("rating", 0) >= min_rating
    ]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bottie Lead Finder for Switzerland - Places API (New)")
    parser.add_argument("--city", required=True, help="City to search in (e.g., Zurich)")
    parser.add_argument("--industry", help="Industry (e.g., restaurant)")
    parser.add_argument("--min-reviews", type=int, default=20, help="Minimum number of reviews")
    parser.add_argument("--min-rating", type=float, default=4.0, help="Minimum rating")
    parser.add_argument("--real", action="store_true", help="Use real Google Places API")
    parser.add_argument("--mock", action="store_true", help="Use mock data")
    
    args = parser.parse_args()
    
    print(f"\n🔍 Searching for {args.industry or 'Local Business'} in {args.city}")
    print(f"   Min Reviews: {args.min_reviews} | Min Rating: {args.min_rating}")
    print()
    
    if args.mock or not API_KEY:
        leads = find_leads_mock(args.city, args.industry or "Local Business", args.min_reviews, args.min_rating)
    else:
        leads = search_places_new_api(args.city, args.industry or "Local Business", API_KEY)
        leads = filter_leads(leads, args.min_reviews, args.min_rating)
        
        if not leads:
            print("⚠️  No results from API. Using mock data...")
            leads = find_leads_mock(args.city, args.industry or "Local Business", args.min_reviews, args.min_rating)
    
    print(f"\n✅ Found {len(leads)} potential leads in {args.city}")
    print("-" * 60)
    
    for i, lead in enumerate(leads, 1):
        print(f"{i}. {lead['name']}")
        print(f"   📍 {lead['city']}")
        print(f"   ⭐ {lead['rating']} ({lead['reviews']} reviews)")
        print(f"   🌐 {lead['website'] or 'NO WEBSITE'}")
        print()
    
    # Save to CSV
    with open("leads.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "city", "industry", "reviews", "rating", "website"])
        writer.writeheader()
        writer.writerows(leads)
    
    print("💾 Leads saved to leads.csv")
    print("\n📋 Lead IDs for CRM import:")
    for lead in leads:
        print(f"   - {lead['id']}: {lead['name']}")
