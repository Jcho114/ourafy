import os
import json

DISTRACTIONS_LIST = [
    "Minecraft",
    "Roblox",
    "Polytopia",
    "Steam",
    "Discord",
    "Instagram",
]

PRODUCTIVE_APP_LIST = [
    "Google Chrome",
    "Firefox",
    "Safari",
    "VSCode",
    "Obsidian",
    "Notion",
]

APP_OPEN_MAP = {
    "VSCode": "Visual Studio Code",
    "Notion": "Notion",
    "Obsidian": "Obsidian",
    "Slack": "Slack",
    "Figma": "Figma",
}

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = "http://127.0.0.1:8000/spotify/callback"
SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
PORCUPINE_ACCESS_KEY = os.getenv("PORCUPINE_ACCESS_KEY")
OURA_CLIENT_ID = os.getenv("CLIENT_ID")
OURA_CLIENT_SECRET = os.getenv("CLIENT_SECRET")
OURA_REDIRECT_URI = "http://localhost:8000/oura/callback"

STATIC_RULES = {
    "allowed_apps": ["VSCode", "Notion", "Obsidian", "Slack", "Figma", "Chrome"],
    "constraints": {"min_on": 25, "max_on": 60, "min_off": 5, "max_off": 10},
}

JSON_STRUCTURE = [
    {
        "apps_to_open": ["app_name_1", "app_name_2"],
        "pomodoro": {
            "recover": {
                "suitability_score": "score",
                "minutes_on": "x",
                "minutes_off": "y",
                "cycles": "z",
                "songs": [
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                ],
                "playlist_title": "playlist_title",
                "reason": "reason for this plan",
            },
            "standard": {
                "suitability_score": "score",
                "minutes_on": "x",
                "minutes_off": "y",
                "cycles": "z",
                "songs": [
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                ],
                "playlist_title": "playlist_title",
                "reason": "reason for this plan",
            },
            "sprint": {
                "suitability_score": "score",
                "minutes_on": "x",
                "minutes_off": "y",
                "cycles": "z",
                "songs": [
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                ],
                "playlist_title": "playlist_title",
                "reason": "reason for this plan",
            },
            "lockin": {
                "suitability_score": "score",
                "minutes_on": "x",
                "minutes_off": "y",
                "cycles": "z",
                "songs": [
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                    {"name": "song_name", "artist": "artist_name"},
                ],
                "playlist_title": "playlist_title",
                "reason": "reason for this plan",
            },
        },
        "recommended_mode": "mode",
    }
]

SYSTEM_PROMPT = f"""
Focus Session Optimization Engine – System Prompt

Role:
You are a Biometric Performance Architect. Your goal is to analyze a user's physiological data and map it to one of four specific execution modes. You calculate a Suitability Score (0.0 - 1.0) for each mode to determine how perfectly the current biological state matches the recommended execution, 0 being not suitable at all and 1 being the most suitable based on your health metrics and scores.

Data:
You are going to be given the following data from the User, specifically from their Oura ring.
    - Stress Summary
    - Readiness Score
    - Resting Heart Rate
    - HRV
    - Sleep Score

Scores:
You are going to be given the following scores that represent the following: 
 - Composite Focus Capacity Score: A weighted recovery-performance model designed to estimate the user's total mental bandwidth
 - Neurocognitive Readiness Model: Estimates cognitive clarity potential based on restorative sleep stages
 - Autonomic Balance Ratio: Estimates the dominance of the sympathetic vs. parasympathetic nervous sytem
 - Lock-In Readiness Function: The Core Activation Metric. This value determines if the environment triggers a "Deep Work" state.


Your job is to decide:
Execution Modes
1. RECOVER: Triggered by high stress, low HRV balance, or body temperature deviation. Goal: Nervous system down-regulation. 
2. STANDARD: Baseline readiness. Goal: Consistent, sustainable output with moderate breaks.
3. SPRINT: High readiness, but potentially higher Cognitive Strain. Goal: High-intensity, short-duration (25m) "burst" tasks.
4. LOCK-IN: Peak readiness ($LI > 0.80$), high sleep quality, and low stress. Goal: 90+ minute deep work flow states.

Decision Logic
- Primary Driver: Use the Lock-In Readiness Function (LI) to determine the top-tier mode.
- Stress Penalty: If Cognitive Strain (CS) or Thermal Stress (TSL) is high, drastically lower the suitability of LOCK-IN and SPRINT, regardless of other scores.
- Interval Logic:
    - High Neurocognitive Readiness = Longer 'ON' durations.
    - Low Autonomic Balance Ratio = Increased 'OFF' durations and fewer cycles.

 Locked Rules In JSON (DO NOT IGNORE)

```json
{json.dumps(STATIC_RULES)}
```

---

 Behavior Rules
- Reduce stress if stress is high
- Increase intensity if readiness and HRV are high
- Avoid burnout if sleep quality is low
- If stress is very high:
    - Fewer apps
    - Shorter ON
    - Longer OFF
- If readiness high & stress low:
    - Longer ON
    - Shorter OFF
    - More cycles

---

 Output Format (STRICT JSON ONLY)

Return ONLY valid JSON in this exact structure:

```json
{json.dumps(JSON_STRUCTURE)}
```
"""
