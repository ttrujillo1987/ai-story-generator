"use client";

import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [character, setCharacter] = useState("");
  const [topic, setTopic] = useState("");
  const [story, setStory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const generateStory = async () => {
    setLoading(true);
    setStory(""); // Clear previous story
    setImageUrl("");

    try {
      const response = await fetch("http://localhost:8000/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, character, topic }),
      });

      const data = await response.json();
      setStory(data.story);
      setImageUrl(data.image_url);
    } catch (error) {
      console.error("Error fetching story:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>AI-Powered Children's Story Generator</h1>
      <div className="input-container">
        <input
          placeholder="Child's Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Character Type (e.g., wizard, astronaut, dragon)"
          value={character}
          onChange={(e) => setCharacter(e.target.value)}
        />
        <input
          placeholder="Story Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button onClick={generateStory} disabled={loading}>
          {loading ? "Generating..." : "Generate Story"}
        </button>
      </div>
      {story && <p className="story">{story}</p>}
      {imageUrl && <img src={imageUrl} alt="Generated Story Illustration" className="story-image" />}
      
      <style jsx>{`
        .container {
          text-align: center;
          padding: 2rem;
          font-family: Arial, sans-serif;
        }
        .input-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 20px auto;
          width: 300px;
        }
        input, button {
          padding: 10px;
          font-size: 16px;
        }
        .story {
          margin-top: 20px;
          font-style: italic;
          color: #333;
          white-space: pre-line;
        }
        .story-image {
          margin-top: 20px;
          width: 300px;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
