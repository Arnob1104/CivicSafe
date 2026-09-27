import json
import re

from fastapi import APIRouter, Depends, HTTPException
from groq import Groq, APIStatusError

from app.config import GROQ_API_KEY, GROQ_VISION_MODEL
from app.schemas import AIAnalyzeRequest, AIAnalyzeResult, CATEGORIES, SEVERITIES
from app.security import CurrentUser, get_current_user

router = APIRouter(tags=["ai"])

# Groq has been retiring vision models frequently (qwen3.6-27b was decommissioned
# shortly after llama-4-scout was). If the configured model 404s as no-longer-existing,
# these are tried in order rather than failing the whole feature outright. Update this
# list if Groq deprecates another one - check https://console.groq.com/docs/deprecations
FALLBACK_VISION_MODELS = list(dict.fromkeys([
    GROQ_VISION_MODEL,
    "qwen/qwen3.8-27b",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
]))

SYSTEM_PROMPT = (
    "You are an AI incident analyst for a public safety platform. You will be "
    "shown a photo submitted in an incident report. Look carefully at everything "
    "visible in the image - the setting, any people, vehicles, structures, smoke, "
    "flames, damage, weather, or hazards - and describe it concretely, the way a "
    "witness would describe it to a 911 dispatcher. Do not just name a category; "
    "describe what is actually happening in the scene. You MUST call the "
    "classify_incident function with your analysis."
)

CLASSIFY_TOOL = {
    "type": "function",
    "function": {
        "name": "classify_incident",
        "description": "Report what is visible in the incident photo and classify it",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "A concise, specific incident title (5-10 words) naming what is actually "
                                   "shown, e.g. 'House fire with heavy smoke from second floor', not a generic "
                                   "label like 'Fire incident'.",
                },
                "description": {
                    "type": "string",
                    "description": "A vivid, literal description (3-5 sentences) of exactly what is visible in "
                                   "the image: the type of structure/vehicle/location, the extent and location "
                                   "of any fire/smoke/damage/flooding/crowd, visible people or injuries, and "
                                   "environmental context (time of day, weather, surroundings). Example: 'A "
                                   "two-story residential house is engulfed in flames, with thick black smoke "
                                   "billowing from the roof and second-floor windows. Fire appears to have "
                                   "spread across most of the upper floor. No people are visible in the frame. "
                                   "The house next door appears close enough to be at risk.' Write only what "
                                   "you can actually see - do not guess at causes or invent details.",
                },
                "category": {"type": "string", "enum": CATEGORIES},
                "severity": {"type": "string", "enum": SEVERITIES},
            },
            "required": ["title", "description", "category", "severity"],
        },
    },
}

# Some Qwen models occasionally emit the tool call as literal
# "<tool_call>{...}</tool_call>" text in message.content instead of the
# structured tool_calls field (a known quirk in "thinking" mode). This
# extracts it as a fallback so a stray formatting choice doesn't silently
# turn into a useless placeholder description.
_TOOL_CALL_TEXT_RE = re.compile(r"<tool_call>\s*(\{.*?\})\s*</tool_call>", re.DOTALL)


def _extract_args_from_text(text: str) -> dict | None:
    if not text:
        return None
    match = _TOOL_CALL_TEXT_RE.search(text)
    candidate = match.group(1) if match else text.strip()
    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError:
        return None
    # The model may nest the classification under "arguments", or return it directly.
    if isinstance(parsed.get("arguments"), dict):
        return parsed["arguments"]
    if isinstance(parsed.get("arguments"), str):
        try:
            return json.loads(parsed["arguments"])
        except json.JSONDecodeError:
            return None
    if "title" in parsed and "description" in parsed:
        return parsed
    return None


@router.post("/api/ai/analyze-incident", response_model=AIAnalyzeResult)
def analyze_incident(payload: AIAnalyzeRequest, _: CurrentUser = Depends(get_current_user)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured on the server")

    client = Groq(api_key=GROQ_API_KEY)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"This photo was submitted as part of a public safety incident report "
                            f"({payload.fileCount} file(s) attached in total). Describe exactly what "
                            f"you see in the image, then classify the incident.",
                },
                {"type": "image_url", "image_url": {"url": payload.image}},
            ],
        },
    ]

    completion = None
    tried = []
    for model_id in FALLBACK_VISION_MODELS:
        tried.append(model_id)
        try:
            completion = client.chat.completions.create(
                model=model_id,
                messages=messages,
                tools=[CLASSIFY_TOOL],
                tool_choice={"type": "function", "function": {"name": "classify_incident"}},
                # This is a short classification task, not a reasoning task - non-thinking
                # mode is faster/cheaper and avoids Qwen sometimes writing the tool call out
                # as text instead of a structured tool_calls entry while "thinking". These
                # are newer Groq params not yet in the pinned SDK's typed signature, so they
                # go through extra_body, which forwards arbitrary fields into the request body.
                extra_body={"reasoning_effort": "none", "reasoning_format": "hidden"},
            )
            break  # success
        except APIStatusError as e:
            is_deprecated = e.status_code == 404 and "model_not_found" in (e.body.get("error", {}).get("code", "") if isinstance(e.body, dict) else "")
            if is_deprecated and model_id != FALLBACK_VISION_MODELS[-1]:
                continue  # try the next model in the fallback chain
            if e.status_code == 429:
                raise HTTPException(status_code=429, detail="Rate limited. Please try again.")
            raise HTTPException(
                status_code=502,
                detail=f"AI provider error on model '{model_id}': {e.message} "
                       f"(tried: {', '.join(tried)})",
            )
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"AI provider error: {e}")

    if completion is None:
        raise HTTPException(
            status_code=502,
            detail=f"No configured vision model is currently available on Groq (tried: {', '.join(tried)}). "
                   f"Check https://console.groq.com/docs/deprecations for current model IDs.",
        )

    message = completion.choices[0].message
    tool_calls = message.tool_calls

    if tool_calls:
        try:
            args = json.loads(tool_calls[0].function.arguments)
            return AIAnalyzeResult(**args)
        except (json.JSONDecodeError, TypeError, ValueError):
            pass

    # Fallback: the model may have written the call as text instead of using
    # the structured tool-call field.
    args = _extract_args_from_text(message.content or "")
    if args:
        try:
            return AIAnalyzeResult(**args)
        except (TypeError, ValueError):
            pass

    # Nothing usable came back - surface a real error (with a hint of what the
    # model actually said) instead of silently returning a fake placeholder
    # that looks like a successful analysis.
    preview = (message.content or "")[:300]
    raise HTTPException(
        status_code=502,
        detail=f"AI did not return a usable classification. Raw response: {preview!r}",
    )
