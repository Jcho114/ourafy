import requests
from dotenv import load_dotenv
import os
import json
from urllib.parse import urlencode
import webbrowser
from flask import Flask, request

# oauth2 application credentials
client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
redirect_uri = "http://localhost:5500/callback"

load_dotenv()

app = Flask(__name__)


def run_background():
    # authorization page
    auth_params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "daily heartrate personal stress resilience",
    }

    auth_url = f"https://cloud.ouraring.com/oauth/authorize?{urlencode(auth_params)}"
    print(f"Please visit this URL to authorize: {auth_url}")
    webbrowser.open(auth_url)


def access_token(auth_code: str):
    # access token
    token_url = "https://api.ouraring.com/oauth/token"
    token_data = {
        "grant_type": "authorization_code",
        "code": auth_code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
    }

    response = requests.post(token_url, data=token_data)
    tokens = response.json()

    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    data = {"access_token": access_token, "refresh_token": refresh_token}

    with open("tokens.json", "w") as file:
        json.dump(data, file, indent=4)

    get_readiness(access_token)


def get_readiness(access_token: str):

    tokens = get_tokens()

    try:
        headers = {"authorization": f"Bearer {tokens['access_token']}"}
        readiness = requests.get(
            "https://api.ouraring.com/v2/usercollection/daily_readiness",
            headers=headers,
            params={"start_date": "2026-02-27", "end_date": "2026-02-27"},
        )

        print(json.dumps(readiness.json(), indent=4))
    except:
        if readiness.status_code == 401:
            print("token expired. refreshing now")
            refresh_tokens(tokens["refresh_token"])
            get_readiness()


def get_tokens() -> dict:
    with open("tokens.json", "r") as file:
        tokens = json.load(file)

    return tokens


def refresh_tokens(refresh_token):

    tokens = get_tokens()
    refresh_token = tokens["refresh_token"]
    try:
        token_url = "https://api.ouraring.com/oauth/token"
        token_data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": os.getenv("CLIENT_ID"),
            "client_secret": os.getenv("CLIENT_SECRET"),
        }
        response = requests.post(token_url, data=token_data)
        new_tokens = response.json()

        with open("tokens.json", "w") as file:
            json.dumps(new_tokens, file, indent=4)

        print("tokens refresed.")
        return True

    except Exception as e:
        print(e)
        return False


run_background()


@app.route("/")
def index():
    return "testing"


@app.route("/callback")
def callback():

    # gets code from url
    auth_code = request.args.get("code")
    if auth_code:
        access_token(auth_code)
        return f"Authorization Code Received: {auth_code}. You can close this tab and return to your IDE."
    else:
        return "No code found in the URL.", 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5500, debug=True)
