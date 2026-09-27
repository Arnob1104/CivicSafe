import json

from fastapi import APIRouter, Depends, HTTPException
from groq import Groq, APIStatusError

from app.config import GROQ_API_KEY, GROQ_VISION_MODEL
from app.schemas import AIAnalyzeRequest, AIAnalyzeResult, CATEGORIES, SEVERITIES
from app.security import CurrentUser, get_current_user

router = APIRouter(tags=["ai"])

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


@router.post("/api/ai/analyze-incident", response_model=AIAnalyzeResult)
def analyze_incident(payload: AIAnalyzeRequest, _: CurrentUser = Depends(get_current_user)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured on the server")

    client = Groq(api_key=GROQ_API_KEY)

    try:
        completion = client.chat.completions.create(
            model=GROQ_VISION_MODEL,
            messages=[
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
            ],
            tools=[CLASSIFY_TOOL],
            tool_choice={"type": "function", "function": {"name": "classify_incident"}},
        )
    except APIStatusError as e:
        if e.status_code == 429:
            raise HTTPException(status_code=429, detail="Rate limited. Please try again.")
        raise HTTPException(status_code=502, detail=f"AI provider error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {e}")

    tool_calls = completion.choices[0].message.tool_calls
    if tool_calls:
        try:
            args = json.loads(tool_calls[0].function.arguments)
            return AIAnalyzeResult(**args)
        except (json.JSONDecodeError, TypeError, ValueError):
            pass

    # Fallback if the model didn't return a usable tool call
    return AIAnalyzeResult(
        title="Incident Report",
        description="Unable to classify. Please review manually.",
        category="other",
        severity="medium",
    )
