from openai import OpenAI
import json
import logging
from dotenv import load_dotenv
from config import SYSTEM_PROMPT

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


def get_focus_configs(user_text: str, oura_data: dict, oura_scores: dict) -> dict:
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
                        "scores": oura_scores,
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
