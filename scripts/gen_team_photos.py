import asyncio
import base64
import os
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

OUT = "/app/frontend/public/media/team"
os.makedirs(OUT, exist_ok=True)

STYLE = "Professional corporate studio headshot portrait, photorealistic, editorial magazine quality, soft studio key light with subtle rim light, seamless dark charcoal (#141414) background, sharp focus on face, shoulders-up square crop, confident warm expression"

PEOPLE = [
    ("ayesha-rahman", f"Headshot of a confident Pakistani businesswoman in her late 30s, founder and chief strategy officer of a marketing agency, shoulder-length dark hair, elegant dark blazer, minimal jewellery, assured subtle smile. {STYLE}"),
    ("hassan-raza", f"Headshot of a Pakistani man in his mid 30s, head of research at a marketing agency, short neat beard, dark suit jacket over crisp open-collar shirt, thoughtful intelligent expression. {STYLE}"),
    ("sana-qureshi", f"Headshot of a young Pakistani businesswoman in her early 30s, performance marketing director, modern professional dark blazer, confident energetic slight smile. {STYLE}"),
    ("daniyal-sheikh", f"Headshot of a creative Pakistani man in his early 30s, creative director, stylish thin-framed glasses, well-groomed short beard, black turtleneck, calm artistic confidence. {STYLE}"),
]


async def gen(slug, prompt):
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"team-{slug}", system_message="You generate photorealistic professional headshots.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    text, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
    if images:
        path = os.path.join(OUT, f"{slug}.png")
        with open(path, "wb") as f:
            f.write(base64.b64decode(images[0]["data"]))
        print("saved", path, os.path.getsize(path), "bytes")
    else:
        print("NO IMAGE for", slug, "| text:", (text or "")[:120])


async def main():
    for slug, prompt in PEOPLE:
        try:
            await gen(slug, prompt)
        except Exception as e:
            print("FAILED", slug, str(e)[:150])


asyncio.run(main())
