"""AI interpretation using OpenAI gpt-4o-mini (user-provided key)."""
import json
import os
from typing import Any

from openai import OpenAI

from antibiotics_data import default_breakpoints

_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
_API_KEY = os.environ.get("OPENAI_API_KEY", "")

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=_API_KEY)
    return _client


SYSTEM_PROMPT = """You are a clinical microbiology assistant for an educational
Antibiotic Susceptibility Testing (AST) app that uses the Kirby-Bauer disc
diffusion method. Given the zone of inhibition diameter, antibiotic, and
specimen type, you return:

1. An interpretation: "Sensitive", "Intermediate", or "Resistant" — apply
   CLSI-style breakpoints for the specific antibiotic when possible.
2. An estimated MIC range expressed as a string (e.g. "<= 1 mcg/mL",
   "4-8 mcg/mL", ">= 32 mcg/mL"). Never give a single exact MIC.
3. A ranked list of up to 4 plausible organisms, each with a confidence
   score between 0.0 and 1.0 (sum need not equal 1).
4. A short plain-English explanation (max 80 words) of the reasoning.
5. An overall confidence score 0-1 for the whole interpretation.

Respond ONLY with valid JSON matching this schema:
{
  "interpretation": "Sensitive" | "Intermediate" | "Resistant",
  "estimated_mic_range": string,
  "possible_organisms": [{"name": string, "confidence": number}, ...],
  "explanation": string,
  "confidence_score": number
}
No markdown. No code fences. JSON only.
"""


def interpret(
    zone_mm: float,
    antibiotic: str,
    antibiotic_category: str,
    sample_type: str,
) -> dict[str, Any]:
    """Call OpenAI. On any failure, return a deterministic fallback."""
    user_prompt = (
        f"Zone of inhibition: {zone_mm} mm\n"
        f"Antibiotic: {antibiotic} (category: {antibiotic_category})\n"
        f"Specimen type: {sample_type}\n"
        "Return the JSON now."
    )

    try:
        client = _get_client()
        resp = client.chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
            max_tokens=500,
        )
        raw = resp.choices[0].message.content or ""
        data = json.loads(raw)
        # sanitize
        interp = data.get("interpretation", default_breakpoints(zone_mm))
        if interp not in ("Sensitive", "Intermediate", "Resistant"):
            interp = default_breakpoints(zone_mm)
        orgs = data.get("possible_organisms") or []
        clean_orgs = []
        for o in orgs[:4]:
            name = str(o.get("name", "")).strip()
            if not name:
                continue
            try:
                conf = float(o.get("confidence", 0.5))
            except (TypeError, ValueError):
                conf = 0.5
            clean_orgs.append({"name": name, "confidence": max(0.0, min(1.0, conf))})
        return {
            "interpretation": interp,
            "estimated_mic_range": str(data.get("estimated_mic_range", "N/A")),
            "possible_organisms": clean_orgs,
            "explanation": str(data.get("explanation", "")).strip(),
            "confidence_score": max(0.0, min(1.0, float(data.get("confidence_score", 0.6)))),
            "source": "ai",
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "interpretation": default_breakpoints(zone_mm),
            "estimated_mic_range": "N/A",
            "possible_organisms": [],
            "explanation": (
                f"AI service unavailable ({type(exc).__name__}). "
                f"Using heuristic breakpoint based on zone size."
            ),
            "confidence_score": 0.4,
            "source": "fallback",
        }
