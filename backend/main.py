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
        prompt = f"Write a short children's story about {request.topic} starring a {request.character} named {request.name}."

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",  
            messages=[
                {"role": "system", "content": "You are a helpful assistant that writes engaging children's stories."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500
        )

        return {"story": response.choices[0].message.content.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Root route
@app.get("/")
def home():
    return {"message": "AI Story Generator API is running!"}