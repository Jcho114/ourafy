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
from close import kill_running_processes
from flask_cors import CORS

"""
File for the wakeword daemon as well as refreshing auth tokens for Oura and Spotify
"""

load_dotenv()

app = Flask(__name__)
CORS(app)
app.secret_key = os.urandom(24)

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_TOKEN = ""
REDIRECT_URI = "http://127.0.0.1:8000/spotify/callback"
AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
ACCESS_KEY = os.getenv("ACCESS_KEY")

# oauth2 application credentials for Oura
OURA_CLIENT_ID = os.getenv("CLIENT_ID")
OURA_CLIENT_SECRET = os.getenv("CLIENT_SECRET")
OURA_REDIRECT_URI = "http://localhost:8000/oura/callback"


@app.route("/ourafy")
def ourafy_index():
    auth_params = {
        "client_id": OURA_CLIENT_ID,
        "redirect_uri": OURA_REDIRECT_URI,
        "response_type": "code",
        "scope": "daily heartrate personal stress resilience",
    }

    auth_url = f"https://cloud.ouraring.com/oauth/authorize?{urlencode(auth_params)}"
    print(f"Please visit this URL to authorize: {auth_url}")
    return redirect(auth_url)


@app.route("/oura/callback")
def oura_callback():
    def save_ourafy_tokens(auth_code: str):
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

        access_token = tokens["ourafy_access_token"]
        refresh_token = tokens["ourafy_refresh_token"]

        data = {
            "ourafy_access_token": access_token,
            "ourafy_refresh_token": refresh_token,
        }

        with open("tokens.json", "r+") as file:
            file_raw = file.read()
            file_data = (
                json.loads(file_raw)
                if file_raw is not None and file_raw.strip() != ""
                else {}
            )
        file_data["ourafy_access_token"] = data["ourafy_access_token"]
        file_data["ourafy_refresh_token"] = data["ourafy_refresh_token"]
        with open("tokens.json", "w") as file:
            json.dump(file_data, file, indent=4)

    auth_code = request.args.get("code")
    if auth_code:
        save_ourafy_tokens(auth_code)
        return f"Authorization Code Received: {auth_code}. You can close this tab and return to your IDE."
    else:
        return "No code found in the URL.", 400


def get_tokens() -> dict:
    with open("tokens.json", "r") as file:
        tokens = json.load(file)

    return tokens


@app.route("/oura/data")
def oura_data():
    tokens = get_tokens()
    oura_data = get_bio_snapshot(
        tokens["ourafy_access_token"], tokens["ourafy_refresh_token"]
    )
    return oura_data


@app.route("/spotify")
def spotify_index():
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        print("Client ID or secret not found. Did you edit .env?")
        return
    scope = "playlist-modify-public playlist-modify-private user-read-private user-read-email playlist-modify-public playlist-modify-private"
    auth_query = f"{AUTH_URL}?response_type=code&client_id={SPOTIFY_CLIENT_ID}&scope={scope}&redirect_uri={REDIRECT_URI}"
    return redirect(auth_query)


@app.route("/spotify/callback")
def spotify_callback():
    def save_spotify_token(access_token: str):
        with open("tokens.json", "r+") as file:
            file_raw = file.read()
            file_data = (
                json.loads(file_raw)
                if file_raw is not None and file_raw.strip() != ""
                else {}
            )
        file_data["spotify_access_token"] = access_token
        with open("tokens.json", "w") as file:
            json.dump(file_data, file, indent=4)

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
    save_spotify_token(access_token)
    return access_token


@app.route("/close", methods=["POST"])
def app_close():
    """
    Upon POST kills apps sent in params.
    Closes all apps and uses 11labs to give a message of praise and admiration
    param data:
    - apps str[]: list of apps to close
    """
    apps = request.args.get("apps")
    for app in apps:
        kill_running_processes(app)


@app.route("/open", methods=["POST"])
def app_open():
    """
    Upon POST launches productive apps sent from frontend.
    Also starts music playlist recommended by AI.
    param data:
    - apps str[]: list of apps to close
    - songs str[]: list of song titles to add to playlist generated by AI
    """
    data = request.get_json()
    tokens = get_tokens()
    uri = create_playlist(
        tokens["spotify_access_token"], data["playlist_title"], data["songs"]
    )

    def spotify_uri_to_url(uri: str) -> str:
        parts = uri.split(":")
        return f"https://open.spotify.com/{parts[1]}/{parts[2]}"

    return {
        "url": spotify_uri_to_url(uri),
    }


def create_playlist(access_token, song_title, song_names):
    """
    Recieves a songlist (from AI) and adds them to a playlist.
    Requires an active spotify session.
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    track_uris = []

    for name in song_names:
        search_url = f"https://api.spotify.com/v1//search?q={name}&type=track&limit=1"
        res = requests.get(search_url, headers=headers).json()
        items = res.get("tracks", {}).get("items", [])
        if items:
            track_uris.append(items[0]["uri"])

    if not track_uris:
        return "No songs found."

    playlist = requests.post(
        "https://api.spotify.com/v1/me/playlists",
        headers=headers,
        json={"name": song_title, "public": False},
    ).json()
    playlist_id = playlist["id"]
    playlist_uri = playlist["uri"]

    requests.post(
        f"https://api.spotify.com/v1/playlists/{playlist_id}/items",
        headers=headers,
        json={"uris": track_uris},
    )

    return playlist_uri


def run_porcupine_listener():
    porcupine = pvporcupine.create(access_key=ACCESS_KEY, keywords=["bumblebee"])
    recorder = PvRecorder(frame_length=porcupine.frame_length)
    recorder.start()

    try:
        while True:
            audio_frame = recorder.read()
            keyword_index = porcupine.process(audio_frame)
            if keyword_index == 0:
                print("Keyword heard")  # WORKS
    except Exception as e:
        print(f"Error: {e}")
    finally:
        recorder.stop()
        recorder.delete()
        porcupine.delete()


if __name__ == "__main__":
    # listener_thread = threading.Thread(target=run_porcupine_listener, daemon=True)
    # listener_thread.start()
    app.run(host="127.0.0.1", port=8000, debug=True)
