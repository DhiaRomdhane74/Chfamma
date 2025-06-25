# scraper.py
import requests
from bs4 import BeautifulSoup
import re
import json
from pymongo import MongoClient
import certifi
import os
MONGO_URI = "mongodb+srv://chfammauser:Dhia-romdhan5@cluster0.lc99sho.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"


client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client['chfamma']
sports_collection = db['sports']
economy_collection = db['economy']
weather_collection = db['weather']
sports_news_collection = db['sports_news']
prayers_collection = db['prayers']

base_url_for_matches = "https://www.footmercato.net"
calendar_url = f"{base_url_for_matches}/tunisie/ligue-1-pro/calendrier/"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
}

def get_match_data(match_url):
    response = requests.get(match_url, headers=headers, verify=False)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, "html.parser")
        
        match_parts = re.findall(r'/live/\d+-(.*)-vs-(.*)', match_url)
        if match_parts:
            home_team, away_team = match_parts[0]
            home_team = home_team.replace("-", " ").title()
            away_team = away_team.replace("-", " ").title()
        else:
            home_team, away_team = "Unknown", "Unknown"
        
        score_elements = soup.find_all("span", class_="scoreboard__scoreTeam")
        home_score = int(score_elements[0].text.strip()) if len(score_elements) >= 2 else None
        away_score = int(score_elements[1].text.strip()) if len(score_elements) >= 2 else None
        
        stadium_name, surface, capacity = None, None, None
        venue_info = soup.find("div", class_="venue__infos")
        if venue_info:
            stadium_element = venue_info.find("div", class_="venue__name")
            if stadium_element:
                stadium_name = stadium_element.text.strip()
            venue_details = venue_info.find_all("li", class_="venue__info")
            for detail in venue_details:
                label = detail.find("span", class_="venue__label")
                value = detail.find("strong", class_="venue__value")
                if label and value:
                    if "Surface" in label.text.strip():
                        surface = value.text.strip()
                    elif "Capacité" in label.text.strip():
                        capacity = int(value.text.strip().replace(" ", ""))
        
        time_element = soup.find("strong", class_="table__value")
        match_time = time_element.text.strip() if time_element else None
        
        round_element = soup.find("span", class_="matchTopBar__phaseName")
        round_number = round_element.text.strip() if round_element else "Unknown"
        
        return {
            "round": round_number,
            "home_team": home_team,
            "away_team": away_team,
            "home_score": home_score,
            "away_score": away_score,
            "stadium": stadium_name,
            "surface": surface,
            "capacity": capacity,
            "match_time": match_time,
        }
    return None

def scrape_matches_calendar():
    try:
        response = requests.get(calendar_url, headers=headers, verify=False)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        round_links = [a["href"] for a in soup.find_all("a", class_="select__itemButton") if "href" in a.attrs]

        active_buttons = soup.find_all('a', class_='select__itemButton active')
        round_text = "Round not found"
        for btn in active_buttons:
            href = btn.get('href', '')
            if 'journee' in href.lower():
                label_span = btn.find('span', class_='select__itemLabel', attrs={'data-selectlabel': True})
                if label_span:
                    round_text = label_span.get_text(strip=True)
                    break

        matches_data = []

        for round_link in round_links:
            if not round_link.startswith("http"):
                round_link = f"{base_url_for_matches}{round_link}"
            round_response = requests.get(round_link, headers=headers, verify=False)

            if round_response.status_code == 200:
                round_soup = BeautifulSoup(round_response.text, "html.parser")
                match_links = [a["href"] for a in round_soup.find_all("a", class_="matchFull__link") if "href" in a.attrs]

                for match_link in match_links[:8]:
                    if not match_link.startswith("http"):
                        match_link = f"{base_url_for_matches}{match_link}"
                    match_data = get_match_data(match_link)
                    if match_data:
                        matches_data.append(match_data)

        data = {
            "next_round": round_text,
            "matches": matches_data
        }

        # --- Save to MongoDB instead of file ---
        sports_collection.delete_many({})   # Remove old matches (optional)
        sports_collection.insert_one(data)  # Insert new document

        print("[INFO] Calendar data scraped and saved to MongoDB.")
        return data

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Failed to fetch data: {e}")
        return None
    

def scrape_and_save_economy_news():
    url = 'https://www.jawharafm.net/ar/articles/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1/%D8%A5%D9%82%D8%AA%D8%B5%D8%A7%D8%AF/43'
    headers = {'User-Agent': 'Mozilla/5.0'}

    try:
        response = requests.get(url, headers=headers, verify=False)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        economy_titles = soup.find_all('h2', class_='titr_ev')
        economy_descriptions = soup.find_all('p', class_='disc_ev')

        news_list = [{"title": t.text.strip(), "description": d.text.strip()} for t, d in zip(economy_titles, economy_descriptions)]
        economy_collection.delete_many({})
        economy_collection.insert_many(news_list)

        print("[INFO] Economy news scraped and saved to MongoDB.")
        return {"news": news_list}

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Failed to fetch economy news: {e}")
        return None

def scrape_and_save_sports_news():
    url = 'https://www.jawharafm.net/ar/articles/%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9-/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D8%A9/39'
    headers = {'User-Agent': 'Mozilla/5.0'}

    try:
        response = requests.get(url, headers=headers, verify=False)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        titles = soup.find_all('h2', class_='titr_ev')
        descriptions = soup.find_all('p', class_='disc_ev')

        news_list = [{"title": t.text.strip(), "description": d.text.strip()} for t, d in zip(titles, descriptions)]
        sports_collection.delete_many({'type': 'news'})  # Remove old sports news only

        if news_list:
            for item in news_list:
                item['type'] = 'news'
            sports_news_collection.insert_many(news_list)

        print("[INFO] Sports news scraped and saved to MongoDB.")
        return {"news": news_list}

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Failed to fetch sports news: {e}")
        return None

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
}

def scrape_and_save_temperatures():
    base_url = "https://www.meteocity.com/tunisie/"
    links = [
        "ariana-v2473247", "beja-v2472774", "ben-arous-v2472479", "bizerte-v2472706", "gabes-v2468369",
        "gafsa-v2468353", "jendouba-v2470088", "kairouan-v2473449", "kasserine-v2473457", "kebili-v2468018",
        "manouba-v2469274", "tozeur-v2464648", "medenine-v2469473", "monastir-v2473493", "mahdia-v2473572",
        "nabeul-v2468579", "sfax-v2467454", "sidi-bouzid-v2465840", "siliana-v2465030", "sousse-v2464915",
        "tunis-v2464470", "zaghouan-v2464041", "tataouine-v2464701", "kef-v2124902"
    ]
    city_names = [
        "Ariana", "Beja", "Ben Arous", "Bizerte", "Gabes", "Gafsa", "Jendouba", "Kairouan", "Kasserine", "Kebili",
        "Manouba", "Tozeur", "Medenine", "Monastir", "Mahdia", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana", "Sousse",
        "Tunis", "Zaghouan", "Tataouine", "Kef"
    ]

    weather_data = []

    for idx, link in enumerate(links):
        url = base_url + link
        try:
            response = requests.get(url, headers=HEADERS, timeout=12)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                hourly_items = soup.find_all('li', class_='js-weather-hours-item')
                city_hours = []
                for li in hourly_items:
                    time_str = li.get('data-weather-hour')
                    infos_json = li.get('data-weather-infos')
                    if infos_json:
                        try:
                            infos = json.loads(infos_json)
                            city_hours.append({
                                "time": time_str,
                                "temperature": infos.get("temperature"),
                                "feels_like": infos.get("temperature.feels-like"),
                                "description": infos.get("description"),
                                "rain_probability": infos.get("rain.probability"),
                                "rain_amount": infos.get("rain"),
                                "wind_cardinal": infos.get("wind.cardinal-point"),
                                "wind_speed": infos.get("wind.speed"),
                                "wind_gust": infos.get("wind.gust"),
                                "humidity": infos.get("humidity"),
                                "uv": infos.get("uv"),
                                "pressure": infos.get("pressure"),
                                "air_quality": infos.get("air.quality"),
                                "cloud_cover": infos.get("cloud-cover"),
                            })
                        except Exception as e:
                            print(f"[WARNING] JSON decode error for {city_names[idx]} at {time_str}: {e}")
                weather_data.append({
                    "city": city_names[idx],
                    "hourly": city_hours
                })
                print(f"[INFO] Scraped {len(city_hours)} hourly items for {city_names[idx]}")
            else:
                print(f"[ERROR] Failed to retrieve {city_names[idx]}. Status: {response.status_code}")
        except Exception as e:
            print(f"[ERROR] Request failed for {city_names[idx]}: {e}")

    weather_collection.delete_many({})
    if weather_data:
        weather_collection.insert_many(weather_data)
        print("[INFO] Weather data scraped and saved to MongoDB.")
    else:
        print("[ERROR] No weather data found or saved.")
    return weather_data

def fetch_html(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.text

def extract_prayer_times(html):
    rows = re.split(r'<tr>', html)
    all_prayer_times = []
    for row in rows:
        city_match = re.search(r'data-label=Ville><a [^>]*>([^<]+)</a>', row)
        if city_match:
            city = city_match.group(1)
            times = {
                'Ville': city,
                'Fejr': re.search(r'data-label=Fejr>([\d:]+)', row).group(1) if re.search(r'data-label=Fejr>([\d:]+)', row) else None,
                'Sunrise': re.search(r'data-label=Sunrise>([\d:]+)', row).group(1) if re.search(r'data-label=Sunrise>([\d:]+)', row) else None,
                'Dhuhr': re.search(r'data-label=Dhuhr>([\d:]+)', row).group(1) if re.search(r'data-label=Dhuhr>([\d:]+)', row) else None,
                'Asser': re.search(r'data-label=Asser>([\d:]+)', row).group(1) if re.search(r'data-label=Asser>([\d:]+)', row) else None,
                'Sunset': re.search(r'data-label=Sunset>([\d:]+)', row).group(1) if re.search(r'data-label=Sunset>([\d:]+)', row) else None,
                'Maghreb': re.search(r'data-label=Maghreb>([\d:]+)', row).group(1) if re.search(r'data-label=Maghreb>([\d:]+)', row) else None,
                'Icha': re.search(r'data-label=Icha>([\d:]+)', row).group(1) if re.search(r'data-label=Icha>([\d:]+)', row) else None,
            }
            all_prayer_times.append(times)
    return all_prayer_times

def scrape_and_save_prayer_times():
    all_prayer_times = []
    for p in [1, 2, 3]:
        url = f"https://prieres.date/pays/tunisie?p={p}"
        print(f"Fetching {url}")
        html = fetch_html(url)
        all_prayer_times.extend(extract_prayer_times(html))

    unique_cities = {}
    for entry in all_prayer_times:
        unique_cities[entry['Ville']] = entry
    all_prayer_times = list(unique_cities.values())

    for entry in all_prayer_times:
        prayers_collection.update_one(
            {'Ville': entry['Ville']},
            {'$set': entry},
            upsert=True
        )

    print(f"Inserted/updated {len(all_prayer_times)} cities in MongoDB collection 'prayers'.")

def main():
    scrape_and_save_temperatures()
    scrape_and_save_economy_news()
    scrape_and_save_sports_news()
    scrape_matches_calendar()
    scrape_and_save_prayer_times()
    print("[INFO] All data updated in MongoDB.")

if __name__ == "__main__":
    main()
