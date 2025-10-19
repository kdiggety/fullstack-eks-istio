from typing import Any, Dict, List
async def bedrock_chat(model: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    return {"provider": "bedrock", "model": model, "output": "stubbed-response"}
