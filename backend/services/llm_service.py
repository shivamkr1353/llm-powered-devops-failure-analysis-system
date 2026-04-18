import asyncio

from google import genai

from models.schemas import AnalysisResponse
from config import get_settings

SYSTEM_PROMPT = """You are a DevOps expert.
Analyze CI/CD failure logs and return a structured diagnosis.

Rules:
- Be concise and practical.
- Focus on the most likely root cause.
- Do not add extra fields.
"""


class LLMServiceError(Exception):
    """Raised when the Gemini integration fails."""


def get_client() -> genai.Client:
    """Create a Gemini client from environment variables."""

    api_key = get_settings().gemini_api_key
    if not api_key:
        raise LLMServiceError("GEMINI_API_KEY is not set. Add it to backend/.env before running the API.")

    return genai.Client(api_key=api_key)


def build_user_prompt(cleaned_logs: str, original_logs: str) -> str:
    """Build the user prompt sent to the model."""

    original_excerpt = "\n".join(original_logs.splitlines()[:80]).strip()

    return f"""Analyze the following CI/CD logs and return JSON.

Cleaned logs:
{cleaned_logs}

Original log excerpt:
{original_excerpt}
"""


def send_generate_content_request(model_name: str, cleaned_logs: str, original_logs: str) -> dict[str, str]:
    """Call Gemini structured output and validate with Pydantic."""

    client = get_client()

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=build_user_prompt(cleaned_logs, original_logs),
            config={
                "system_instruction": SYSTEM_PROMPT,
                "temperature": 0.1,
                "max_output_tokens": 350,
                "response_mime_type": "application/json",
                "response_json_schema": AnalysisResponse.model_json_schema(),
            },
        )
    except Exception as exc:
        raise LLMServiceError(f"Gemini request failed: {exc}") from exc

    raw_output = (getattr(response, "text", None) or "").strip()
    if not raw_output:
        raise LLMServiceError("The model returned an empty response.")

    try:
        validated = AnalysisResponse.model_validate_json(raw_output)
    except Exception as exc:
        raise LLMServiceError(f"The model returned invalid structured output: {exc}") from exc

    return validated.model_dump()


async def analyze_logs(cleaned_logs: str, original_logs: str) -> dict[str, str]:
    """Send cleaned logs to Gemini and return the parsed analysis."""

    model_name = get_settings().gemini_model
    return await asyncio.to_thread(send_generate_content_request, model_name, cleaned_logs, original_logs)
