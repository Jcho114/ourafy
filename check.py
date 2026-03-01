import requests
import json
from datetime import date
import os
from dotenv import load_dotenv

load_dotenv()

# dates for request parameters
today = date.today()
# yesterday = today - timedelta(days=1)


def get_tokens() -> dict:
    with open("tokens.json", "r") as file:
        tokens = json.load(file)

    return tokens


# GLOBAL header and parameter for GET requests
PARAMS = {"start_date": f"{today}", "end_date": f"{today}"}


def refresh_tokens():
    refresh_token = get_tokens["refresh_token"]
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


def return_data() -> dict:
    with open("user_data.json", "r") as file:
        metrics = json.load(file)
    return metrics


def extract_readiness(metrics):

    score = metrics["readiness"]["data"][0]["score"]
    c = metrics["readiness"]["data"][0]["contributors"]

    return {
        "score": score,
        "activity_balance": c["activity_balance"],
        "body_temperature": c["body_temperature"],
        "hrv_balance": c["hrv_balance"],
        "recovery_index": c["recovery_index"],
        "resting_heart_rate": c["resting_heart_rate"],
        "sleep_balance": c["sleep_balance"],
        "sleep_regularity": c["sleep_regularity"],
    }


def extract_sleep(metrics):
    sleep_data = metrics["sleep"]["data"][0]
    c = sleep_data["contributors"]

    return {
        "score": sleep_data["score"],
        "deep_sleep": c["deep_sleep"],
        "efficiency": c["efficiency"],
        "latency": c["latency"],
        "rem_sleep": c["rem_sleep"],
        "restfulness": c["restfulness"],
        "timing": c["timing"],
        "total_sleep": c["total_sleep"],
        # "day": sleep_data["day"]
    }


def extract_stress(metrics):
    stress_data = metrics["stress"]["data"][0]

    return {
        # "day": stress_data["day"],
        "day_summary": stress_data["day_summary"],
        "stress_high": stress_data["stress_high"],
    }


def get_bio_snapshot(ourafy_access_token: str, ourafy_refresh_token: str):
    HEADERS = {"Authorization": f"Bearer {ourafy_access_token}"}

    def get_readiness() -> dict:
        try:
            url = "https://api.ouraring.com/v2/usercollection/daily_readiness"

            response = requests.get(url=url, headers=HEADERS, params=PARAMS)

            # returning data in json format
            return response.json()
        except Exception:
            if response.status_code == 401:
                refresh_tokens(ourafy_refresh_token)
                get_readiness()

    def get_resilience() -> dict:
        try:
            url = "https://api.ouraring.com/v2/usercollection/daily_resilience"

            response = requests.get(url=url, headers=HEADERS, params=PARAMS)

            # returning data in json format
            return response.json()
        except Exception:
            if response.status_code == 401:
                refresh_tokens(ourafy_refresh_token)
                get_resilience()

    def get_sleep() -> dict:
        try:
            url = "https://api.ouraring.com/v2/usercollection/daily_sleep"

            response = requests.get(url=url, headers=HEADERS, params=PARAMS)

            # returning data in json format
            return response.json()
        except Exception:
            if response.status_code == 401:
                refresh_tokens(ourafy_refresh_token)
                get_sleep()

    def get_stress() -> dict:
        try:
            url = "https://api.ouraring.com/v2/usercollection/daily_stress"

            response = requests.get(url=url, headers=HEADERS, params=PARAMS)

            # returning data in json format
            return response.json()
        except Exception:
            if response.status_code == 401:
                refresh_tokens(ourafy_refresh_token)
                get_stress()

    def write_user_data():
        data = {
            "readiness": get_readiness(),
            "resilience": get_resilience(),
            "sleep": get_sleep(),
            "stress": get_stress(),
        }

        with open("user_data.json", "w") as file:
            json.dump(data, file, indent=4)

    write_user_data()
    metrics = return_data()

    readiness = extract_readiness(metrics)
    sleep = extract_sleep(metrics)
    stress = extract_stress(metrics)

    return {**readiness, **sleep, **stress}

if __name__ == "__main__":
    tokens = get_tokens()
    get_bio_snapshot(**tokens)
