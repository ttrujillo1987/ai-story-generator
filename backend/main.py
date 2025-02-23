import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import openai
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Check if API key is loaded
if not OPENAI_API_KEY:
    raise ValueError("Error: OPENAI_API_KEY is not set in the .env file!")

# Initialize OpenAI API
client = openai.OpenAI(api_key=OPENAI_API_KEY)

# FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow frontend to access backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class StoryRequest(BaseModel):
    name: str
    character: str
    topic: str

# API route to generate stories
@app.post("/generate-story")
def generate_story(request: StoryRequest):
    try:
        prompt_text = f"Write a short children's story about {request.topic} starring a {request.character} named {request.name}."

        story_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a creative assistant that writes engaging children's stories."},
                {"role": "user", "content": prompt_text}
            ],
            max_tokens=500
        )
        story = story_response.choices[0].message.content.strip()

        # Generate AI-generated illustration
        image_prompt = f"A cute and colorful illustration of a {request.character} in a {request.topic} setting, in a children's book style."
        
        image_response = client.images.generate(
            model="dall-e-3",
            prompt=image_prompt,
            size="1024x1024",
            quality="standard",
            n=1
        )

        image_url = image_response.data[0].url

        return {"story": story, "image_url": image_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Root route
@app.get("/")
def home():
    return {"message": "AI Story Generator API is running!"}