"use client";

import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("boy");
  const [topic, setTopic] = useState("");
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);

  const generateStory = async () => {
    setLoading(true);
    setStory(""); // Clear previous story

    try {
      const response = await fetch("http://localhost:8000/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gender, topic }),
      });

      const data = await response.json();
      setStory(data.story);
    } catch (error) {
      console.error("Error fetching story:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">AI-Powered Children's Story Generator</h1>
      <div className="input-container">
        <input
          placeholder="Child's Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="boy">Boy</option>
          <option value="girl">Girl</option>
        </select>
        <input
          placeholder="Story Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <button onClick={generateStory} disabled={loading}>
          {loading ? "Generating..." : "Generate Story"}
        </button>
      </div>
      <p className="story">{story}</p>

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
        input,
        select,
        button {
          padding: 10px;
          font-size: 16px;
        }
        .story {
          margin-top: 20px;
          font-style: italic;
          color: #333;
          white-space: pre-line;
        }
      `}</style>
    </div>
  );
}
