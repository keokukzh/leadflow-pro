import argparse
import json
import csv
import os
import re
import logging
import requests
import time
from typing import List, Dict, Optional
from dotenv import load_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("SwissLeadFinder")

# Load environment variables
load_dotenv(dotenv_path=".env.local")
API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

def sanitize_input(text: str) -> str:
    """Remove potentially dangerous characters from search queries."""
    if not text: return ""
    return re.sub(r'[;\"\'\\]', '', text)

def get_session_with_retries() -> requests.Session:
    """Create a session with exponential backoff retry logic."""
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["POST"]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    return session

def search_places_new_api(city: str, industry: str, api_key: str) -> List[Dict]:
    """Search using NEW Google Places API (REST API) with resilience."""
    if not api_key:
        logger.error("GOOGLE_PLACES_API_KEY not found")
        return []
    
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri"
    }
    
    data = {
        "textQuery": f"{sanitize_input(industry)} in {sanitize_input(city)}",
        "maxResultCount": 20
    }
    
    session = get_session_with_retries()
    
    try:
        response = session.post(url, headers=headers, json=data, timeout=30)
        
        if response.status_code != 200:
            logger.error(f"API Error: {response.status_code} - {response.text}")
            return []
        
        results = response.json().get('places', [])
        
        leads = []
        for place in results:
            name = place.get('displayName', {}).get('text', 'Unknown')
            address = place.get('formattedAddress', city)
            rating = place.get('rating', 0)
            reviews = place.get('userRatingCount', 0)
            website = place.get('websiteUri', None)
            
            leads.append({
                "id": place.get('id'),
                "name": name,
                "city": address,
                "industry": industry,
                "reviews": reviews,
                "rating": rating,
                "website": website
            })
        
        return leads
        
    except Exception as e:
        logger.exception(f"Unexpected error during API call: {e}")
        return []

def find_leads_mock(city: str, industry: str, min_reviews: int, min_rating: float) -> List[Dict]:
    """Provide realistic mock data for testing."""
    logger.debug(f"Generating mock data for {industry} in {city}")
    mock_leads = [
        {"id": "zh_001", "name": "Restaurant Limmat", "city": city, "industry": industry, "reviews": 45, "rating": 4.5, "website": None},
        {"id": "zh_002", "name": "Schreinerei Meier", "city": city, "industry": industry, "reviews": 22, "rating": 4.2, "website": "http://meier.ch"},
        {"id": "zh_003", "name": "Coiffeur Schönheit", "city": city, "industry": industry, "reviews": 67, "rating": 4.8, "website": None}
    ]
    return [l for l in mock_leads if l["reviews"] >= min_reviews and l["rating"] >= min_rating]

def filter_leads(leads: List[Dict], min_reviews: int, min_rating: float) -> List[Dict]:
    """Filter leads based on strictness criteria."""
    return [l for l in leads if l.get("reviews", 0) >= min_reviews and l.get("rating", 0) >= min_rating]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Resilient Lead Finder for LeadFlow Pro")
    parser.add_argument("--city", required=True)
    parser.add_argument("--industry", default="Local Business")
    parser.add_argument("--min-reviews", type=int, default=20)
    parser.add_argument("--min-rating", type=float, default=4.0)
    parser.add_argument("--real", action="store_true")
    
    args = parser.parse_args()
    logger.info(f"Starting search: {args.industry} in {args.city}")
    
    leads = []
    if args.real and API_KEY:
        leads = search_places_new_api(args.city, args.industry, API_KEY)
        leads = filter_leads(leads, args.min_reviews, args.min_rating)
    
    if not leads:
        logger.warning("No real leads found or mock mode enabled. Using mock data.")
        leads = find_leads_mock(args.city, args.industry, args.min_reviews, args.min_rating)
    
    # Save to CSV
    with open("leads.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "city", "industry", "reviews", "rating", "website"])
        writer.writeheader()
        writer.writerows(leads)
    
    logger.info(f"Search complete. {len(leads)} leads saved to leads.csv")
    for lead in leads:
        logger.info(f"- {lead['id']}: {lead['name']} ({lead['rating']} stars)")
