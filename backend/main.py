from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import openai
from fastapi.middleware.cors import CORSMiddleware
import cloudinary;
import cloudinary.uploader;

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Set database
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# Check if API key is loaded
if not OPENAI_API_KEY:
    raise ValueError("Error: OPENAI_API_KEY is not set in the .env file!")

# Initialize OpenAI API
client = openai.OpenAI(api_key=OPENAI_API_KEY)

# Story model for database
class Story(Base):
    __tablename__ = "stories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    character = Column(String)
    topic = Column(String)
    story = Column(Text)
    image_url = Column(String)

# Pydantic model for API requests and responses
class StoryCreate(BaseModel):
    name: str
    character: str
    topic: str
    story: str
    image_url: str

# Request model
class StoryRequest(BaseModel):
    name: str
    character: str
    topic: str

# Create database table
Base.metadata.create_all(bind=engine)

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

# Get all past saved stories 
@app.get("/stories")
def get_stories():
    session = SessionLocal()
    stories = session.query(Story).all()
    session.close()
    return [
        {
            "id": story.id,
            "name": story.name,
            "character": story.character,
            "topic": story.topic,
            "story": story.story,
            "image_url": story.image_url
        }
        for story in stories
    ]

# Save story to database
@app.post("/save-story")
def save_story(story_data: StoryCreate):
    session = SessionLocal()
    new_story = Story(
        name=story_data.name,
        character=story_data.character,
        topic=story_data.topic,
        story=story_data.story,
        image_url=story_data.image_url
    )
    session.add(new_story)
    session.commit()
    session.refresh(new_story)  # Get the newly inserted story with its ID
    session.close()
    return {"message": "Story saved successfully", "story_id": new_story.id}

# Delete a saved story by ID
@app.delete("/delete-story/{story_id}")
def delete_story(story_id: int):
    session = SessionLocal()
    story = session.query(Story).filter(Story.id == story_id).first()
    if not story:
        session.close()
        raise HTTPException(status_code=404, detail="Story not found")
    
    session.delete(story)
    session.commit()
    session.close()
    return {"message": "Story deleted successfully"}

# API route to generate stories
@app.post("/generate-story")
def generate_story(request: StoryRequest):
    session = SessionLocal()
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

        # Download the image and upload it to Cloudinary
        dall_e_image_url = image_response.data[0].url
        uploaded_image = cloudinary.uploader.upload(dall_e_image_url)
        permanent_image_url = uploaded_image["secure_url"]

        # Save to database
        new_story = Story(name=request.name, 
                          character=request.character, 
                          topic=request.topic, 
                          story=story, 
                          image_url=permanent_image_url)
        session.add(new_story)
        session.commit()
        session.close()

        return {"story": story, "image_url": permanent_image_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Root route
@app.get("/")
def home():
    return {"message": "AI Story Generator API is running!"}