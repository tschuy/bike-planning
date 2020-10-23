import os

from flask import Flask, request
import requests
import requests_cache
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

OPENROUTESERVICE_API_KEY = os.environ.get("ORS_API_KEY")
print(OPENROUTESERVICE_API_KEY)

requests_cache.install_cache(allowable_methods=["GET", "POST"])
app = Flask(__name__, static_url_path="/static")


@app.route("/")
def hello_world():
    return "Hello, World!"


@app.route("/directions", methods=["POST"])
def directions():
    content = request.json
    headers = {
        "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        "Authorization": OPENROUTESERVICE_API_KEY,
        "Content-Type": "application/json; charset=utf-8",
    }
    call = requests.post(
        "https://api.openrouteservice.org/v2/directions/cycling-regular/geojson",
        json=content,
        headers=headers,
    )
    print(call.status_code, call.reason)
    print(call.from_cache)
    return call.text
