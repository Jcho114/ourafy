import os
import requests
import threading
import pvporcupine
from flask import Flask, redirect, request
from dotenv import load_dotenv
from pvrecorder import PvRecorder

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


def run_porcupine_listener():
    porcupine = pvporcupine.create(access_key=ACCESS_KEY, keywords=["bumblebee"])
    recorder = PvRecorder(frame_length=porcupine.frame.length)
    recorder.start()

    try:
        while True:
            audio_frame = recorder.read()
            keyword_index = porcupine.process(audio_frame)
            if keyword_index == 0:
                pass  # detected `bumblebee' activation word ->
    except Exception as e:
        print(f"Error: {e}")
    finally:
        recorder.stop()
        recorder.delete()
        porcupine.delete()


if __name__ == "__main__":
    # listener_thread = threading.Thread(target=run_porcupine_listener, daemon=True)
    # listener_thread.start()
    app.run(port=5000)
