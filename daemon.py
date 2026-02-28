import os
import requests
import threading
import pvporcupine
from flask import Flask, redirect, request
from dotenv import load_dotenv
from pvrecorder import PvRecorder
import webbrowser
import json
from urllib.parse import urlencode
from check import get_bio_snapshot

"""
File for the wakeword daemon as well as refreshing auth tokens for Oura and Spotify
"""

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = "http://127.0.0.1:5000/callback"
AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
ACCESS_KEY = os.getenv("ACCESS_KEY")

# oauth2 application credentials
OURA_CLIENT_ID = os.getenv("CLIENT_ID")
OURA_CLIENT_SECRET = os.getenv("CLIENT_SECRET")
OURA_REDIRECT_URI = "http://localhost:5000/callback"

def run_background():
    # authorization page
    auth_params = {
        "client_id": OURA_CLIENT_ID,
        "redirect_uri": OURA_REDIRECT_URI,
        "response_type": "code",
        "scope": "daily heartrate personal stress resilience",
    }

    auth_url = f"https://cloud.ouraring.com/oauth/authorize?{urlencode(auth_params)}"
    print(f"Please visit this URL to authorize: {auth_url}")
    webbrowser.open(auth_url)

def save_tokens(auth_code: str):
    # access token
    token_url = "https://api.ouraring.com/oauth/token"
    token_data = {
        "grant_type": "authorization_code",
        "code": auth_code,
        "client_id": OURA_CLIENT_ID,
        "client_secret": OURA_CLIENT_SECRET,
        "redirect_uri": OURA_REDIRECT_URI,
    }

    response = requests.post(token_url, data=token_data)
    tokens = response.json()

    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    data = {"access_token": access_token, "refresh_token": refresh_token}

    with open("tokens.json", "w") as file:
        json.dump(data, file, indent=4)


@app.route("/")
def index(): 
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        print("Client ID or secret not found. Did you edit .env?")
        return
    scope = "playlist-modify-public playlist-modify-private"
    auth_query = f"{AUTH_URL}?response_type=code&client_id={SPOTIFY_CLIENT_ID}&scope={scope}&redirect_uri={REDIRECT_URI}"
    return redirect(auth_query)


@app.route("/callback")
def callback():
    code = request.args.get("code")
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }
    response = requests.post(TOKEN_URL, data=token_data)
    token_info = response.json()
    print(token_info)
    access_token = token_info.get("access_token")
    if not access_token:
        return "Access token invalid"
    return access_token

@app.route("/oura/callback")
def oura_callback():
    auth_code = request.args.get("code")
    if auth_code:
        save_tokens(auth_code)
        return f"Authorization Code Received: {auth_code}. You can close this tab and return to your IDE."
    else:
        return "No code found in the URL.", 400
    
@app.route("oura/data")
def oura_data():
    oura_data = get_bio_snapshot()
    return oura_data


def run_porcupine_listener():
    porcupine = pvporcupine.create(
        access_key=ACCESS_KEY, 
        keywords=['bumblebee'] 
    )
    recorder = PvRecorder(frame_length=porcupine.frame_length)
    recorder.start()

    try:
        while True:
            audio_frame = recorder.read()
            keyword_index = porcupine.process(audio_frame)
            if keyword_index == 0:
                print("Keyword heard") # WORKS
    except Exception as e:
        print(f"Error: {e}")
    finally:
        recorder.stop()
        recorder.delete()
        porcupine.delete()


if __name__ == "__main__":
    # listener_thread = threading.Thread(target=run_porcupine_listener, daemon=True)
    # listener_thread.start()
    app.run(host = "127.0.0.1", port=5000, debug=True)
