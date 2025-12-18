import json
import os
from openai import AsyncOpenAI

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ACTIONS_PROMPT = """
You are an intelligent meeting assistant. Your goal is to analyze a segment of a meeting transcript and extract key information.

Current Context/Agenda Topic: {topic}

Transcript Segment:
{transcript}

Instructions:
1.  **Summary**: Provide a concise 1-sentence summary of what was discussed in this segment relative to the topic.
2.  **Action Items**: Identify any clear tasks assigned. Extract the description, who it is assigned to (owner_name), and any mentioned deadline (in YYYY-MM-DD format if possible, otherwise null).
3.  **Decisions**: Identify any formal decisions made. Classify them as 'policy', 'operational', or 'informational'.

Return your response strictly as a JSON object with the following structure:
{
  "summary_update": "string",
  "action_items": [
    { "description": "string", "owner_name": "string or null", "deadline": "string or null" }
  ],
  "decisions": [
    { "description": "string", "decision_type": "policy|operational|informational" }
  ]
}
If nothing relevant is found for a category, return an empty list or empty string.
"""

async def process_meeting_segment(transcript: str, topic: str):
    """
    Analyzes a transcript segment and returns structured data.
    """
    if not os.getenv("OPENAI_API_KEY"):
        # Mock response for dev/demo without API Key
        print("Warning: No OpenAI API Key found. Returning mock data.")
        return {
            "summary_update": f"Discussed {topic} briefly.",
            "action_items": [],
            "decisions": []
        }

    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo", # or gpt-4o-mini
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs JSON."},
                {"role": "user", "content": ACTIONS_PROMPT.format(topic=topic, transcript=transcript)}
            ],
            temperature=0.7,
            response_format={ "type": "json_object" } 
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        return data

    except Exception as e:
        print(f"AI Processing Error: {e}")
        return {
            "summary_update": "",
            "action_items": [],
            "decisions": []
        }
