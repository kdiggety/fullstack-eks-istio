import os
ALLOW_MODELS = os.getenv("ALLOW_MODELS", "mistral:7b,gpt-4.1-mini,anthropic.claude-3-5-sonnet").split(",")
class PolicyViolation(Exception): ...
def enforce(user: str, model: str, prompt: str):
    if not user: raise PolicyViolation("missing user")
    if not model or model not in ALLOW_MODELS: raise PolicyViolation(f"model not allowed: {model}")
    if not prompt.strip(): raise PolicyViolation("empty prompt")
