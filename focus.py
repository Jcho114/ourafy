from openai import OpenAI
import subprocess
import json
import logging
from dotenv import load_dotenv
from check import (
    extract_readiness,
    extract_sleep,
    extract_stress,
    write_user_data,
    return_data,
)

load_dotenv()

logger = logging.getLogger("focus_logger")
logger.setLevel(logging.INFO)

if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    ch.setFormatter(formatter)
    logger.addHandler(ch)

client = OpenAI()

# updates user data to todays date and writes it to a json file called "user_data.json"
write_user_data()
metrics = return_data()

readiness = extract_readiness(metrics)
sleep = extract_sleep(metrics)
stress = extract_stress(metrics)


STATIC_RULES = {
    "allowed_apps": ["VSCode", "Notion", "Slack", "Figma", "Chrome"],
    "constraints": {"min_on": 25, "max_on": 60, "min_off": 5, "max_off": 10},
}

JSON_STRUCTURE = [
    {
        "apps_to_open": ["app_name_1", "app_name_2"],
        "pomodoro": {"minutes_on": "X", "minutes_off": "Y", "cycles": "Z"},
        "reason": "reason for this plan",
    }
]

SYSTEM_PROMPT = f"""
# Focus Session Optimization Engine – System Prompt

## Role

You are an optimization engine that determines a user’s ideal focus session configuration.

Your job is to decide:

1. Which apps to open
2. What Pomodoro configuration to use
   - X minutes ON
   - Y minutes OFF
   - Z cycles

## Locked Rules In JSON (DO NOT IGNORE)

```json
{json.dumps(STATIC_RULES)}
```

---

## Behavior Rules

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

## Output Format (STRICT JSON ONLY)

Return ONLY valid JSON in this exact structure:

```json
{json.dumps(JSON_STRUCTURE)}
```
"""


def get_focus_configs(user_text: str, oura_data: dict) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "user_text": user_text,
                        "oura_data": oura_data,
                    }
                ),
            },
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "focus_config",
                "schema": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "apps_to_open": {"type": "array", "items": {"type": "string"}},
                        "pomodoro": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "minutes_on": {"type": "integer"},
                                "minutes_off": {"type": "integer"},
                                "cycles": {"type": "integer"},
                            },
                            "required": ["minutes_on", "minutes_off", "cycles"],
                        },
                    },
                    "required": ["apps_to_open", "pomodoro"],
                },
            },
        },
    )

    return json.loads(response.choices[0].message.content)


APP_OPEN_MAP = {
    "VSCode": "Visual Studio Code",
}


def enact_on_config(focus_config: dict):
    for app in focus_config["apps_to_open"]:
        if app not in APP_OPEN_MAP:
            logger.warning(f"app {app} does not have an open mapping")
            continue

        logger.info(f"opening app {app}")
        exit_code = subprocess.call(["/usr/bin/open", "-a", APP_OPEN_MAP[app]])
        if exit_code != 0:
            logger.error(f"subprocess failed with exit code {exit_code}")
        else:
            logger.info("app opened successfully")


def main():
    voice_text = (
        "I want to focus on coding a new feature, and occasionally check Notion."
    )
    oura_data = {
        "stress_summary": stress["day_summary"],
        "readiness_score": readiness["score"],
        "resting_heart_rate": readiness["resting_heart_rate"],
        "hrv": readiness["hrv_balance"],
        "sleep_score": sleep["score"],
    }
    focus_configs = get_focus_configs(voice_text, oura_data)
    print(json.dumps(focus_configs, indent=2))

    enact_on_config(focus_configs[0])


if __name__ == "__main__":
    main()
