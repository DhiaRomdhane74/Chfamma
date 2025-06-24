from flask import Flask, jsonify, Response
from flask_cors import CORS
import json
from pymongo import MongoClient
import certifi

app = Flask(__name__)
CORS(app)

MONGO_URI = "mongodb+srv://chfammauser:Dhia-romdhan5@cluster0.lc99sho.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client['chfamma']
sports_collection = db['sports']
economy_collection = db['economy']
weather_collection = db['weather']
sports_news_collection = db['sports_news']
prayers_collection = db['prayers']

@app.route('/matches_calendar', methods=['GET'])
def matches_calendar():
    data = sports_collection.find_one(sort=[('_id', -1)])
    if data:
        data['_id'] = str(data['_id'])
        return Response(json.dumps(data, ensure_ascii=False), content_type="application/json")
    else:
        return jsonify({"status": "error", "message": "No data found."}), 404

@app.route('/scrape_economy_news', methods=['GET'])
def get_economy_news():
    data = list(economy_collection.find())
    for item in data:
        item.pop('_id', None)
    if data:
        return Response(json.dumps({"news": data}, ensure_ascii=False), content_type="application/json; charset=utf-8")
    else:
        return jsonify({"status": "error", "message": "No data found"}), 404

@app.route('/scrape_sport_news', methods=['GET'])
def get_sports_news():
    data = list(sports_news_collection.find({'type': 'news'}))
    for item in data:
        item.pop('_id', None)
    if data:
        return Response(json.dumps({"news": data}, ensure_ascii=False), content_type="application/json; charset=utf-8")
    else:
        return jsonify({"status": "error", "message": "No data found"}), 404

@app.route('/scrape_temperatures', methods=['GET'])
def get_temperatures():
    data = list(weather_collection.find())
    for item in data:
        item.pop('_id', None)
    if data:
        return Response(json.dumps({"temperatures": data}, ensure_ascii=False), content_type="application/json; charset=utf-8")
    else:
        return jsonify({"status": "error", "message": "No data found"}), 404

@app.route('/scrape_prayers', methods=['GET'])
def get_prayer_times():
    data = list(prayers_collection.find())
    for item in data:
        item.pop('_id', None)
    if data:
        return Response(json.dumps({"prayers": data}, ensure_ascii=False), content_type="application/json; charset=utf-8")
    else:
        return jsonify({"status": "error", "message": "No data found"}), 404


if __name__ == '__main__':
    app.run(debug=True, port=8001)
