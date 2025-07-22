# server/tools/manim_tool.py

import os
import re
import json
import logging
import requests
from dotenv import load_dotenv, find_dotenv

# ——— configure logging —————————————————————
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# ——— load the nearest .env (walks upward), overriding any existing env vars —————————————————————
load_dotenv(find_dotenv(), override=True)

# ——— grab your token and verify it —————————————————————
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    logger.error("No GITHUB_TOKEN found in environment!")
else:
    logger.debug("→ GITHUB_TOKEN loaded (%d chars)", len(GITHUB_TOKEN))

# ——— system prompt + few-shot —————————————————————
SYSTEM = (
    "You are a code generator for Manim Community v0.19.0. "
    "Return ONLY a valid Python script defining one class `MyScene(Scene)` "
    "with a `construct()` method—no markdown fences or commentary."
    "And make sure the texts don't overlap and spelling is correct"
    "Avoid using heavy libraries like miktex mathtex"
    "Ensure the video is in 16:9 frame and as per user's prompt"
    "don't jinx while creating text by for ex:'Model â Context â '"
    "And please make sure text doesn't overlap"
)

FEW_SHOT = [
    {
        "role": "user",
        "content": "Create a red circle that grows from radius 0 to 2 over 3 seconds."
    },
    {
        "role": "assistant",
        "content": """
from manim import *

class MyScene(Scene):
    def construct(self):
        circle = Circle(radius=0)
        circle.set_fill(RED, opacity=0.8)
        self.play(circle.animate.set(radius=2), run_time=3)
        self.wait()
"""
    }
]

class ManimTool:
    def run(self, prompt: str, **_kwargs) -> dict:
        # early exit if no token
        if not GITHUB_TOKEN:
            return {"error": "Missing GITHUB_TOKEN in environment"}

        # build the chat messages
        messages = [{"role": "system", "content": SYSTEM}] + FEW_SHOT
        messages.append({"role": "user", "content": prompt})

        # inference endpoint
        url = "https://models.github.ai/inference/chat/completions"
        headers = {
            "Authorization":        f"Bearer {GITHUB_TOKEN}",
            "Accept":               "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type":         "application/json",
        }
        payload = {
            "model":       "openai/gpt-4.1",
            "messages":    messages,
            "temperature": 0.2,
            "max_tokens":  1200,
        }

        logger.debug("→ GitHub Models API request:")
        logger.debug("    URL:           %s", url)
        logger.debug("    Payload max_tokens=%d", payload["max_tokens"])

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            logger.debug("← status=%s body[:200]=%s", resp.status_code, resp.text[:200].replace("\n"," "))
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            return {"error": f"GitHub Models API error: {e}"}

        choices = data.get("choices")
        if not choices:
            return {"error": f"No choices in response: {json.dumps(data)}"}

        # extract the raw code
        code = choices[0]["message"]["content"]

        # strip any markdown fences
        code = re.sub(r"^```(?:python)?\n", "", code)
        code = re.sub(r"\n```$", "", code)

        # **replace bad rate_function names** with the correct ones
        code = re.sub(r"\brate_functions\.ease_in\b",   "rate_functions.ease_in_quad",  code)
        code = re.sub(r"\brate_functions\.ease_out\b",  "rate_functions.ease_out_quad", code)

        # second syntax check
        try:
            compile(code, "<generated>", "exec")
        except SyntaxError as e:
            logger.error("Final generated code failed to compile: %s", e)
            return {
                "error": "Generated code was invalid after post‑processing. Try again with a shorter prompt."
            }

        return {"code": code}
