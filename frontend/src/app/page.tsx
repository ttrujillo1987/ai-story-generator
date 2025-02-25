"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./styles.css";

export default function Home() {
  const [name, setName] = useState("");
  const [character, setCharacter] = useState("");
  const [topic, setTopic] = useState("");
  const [story, setStory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showPastStories, setShowPastStories] = useState(false);
  const [pastStories, setPastStories] = useState<{ 
    id:number;
    name: string; 
    character: string; 
    topic: string; 
    story: string; 
    image_url: string; 
  }[]>([]);

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

  const saveStory = async () => {
    if (!story) return;  // Prevent saving empty stories
  
    try {
      const response = await fetch("http://localhost:8000/save-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, character, topic, story, image_url: imageUrl }),
      });
  
      const data = await response.json();
      alert(data.message); // Show success message
    } catch (error) {
      console.error("Error saving story:", error);
    }
  };

  const downloadPDF = async () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
  
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const marginLeft = 10;
    const marginTop = 20;
    const maxWidth = 180; // Text width
    const lineHeight = 7; // Space between lines
  
    // Set the font and title
    pdf.setFont("times", "bold");
    pdf.setFontSize(18);
    pdf.text(`${name}'s AI-Generated Story`, marginLeft, marginTop);

    let textY = marginTop + 10; // Initial Y position for content

    // Add the image
    const imageElement = document.getElementById("story-image") as HTMLImageElement;
    if (imageElement) {
      try {
        console.log("Capturing image...");
        const imageCanvas = await html2canvas(imageElement, { useCORS: true });
        const imgData = imageCanvas.toDataURL("image/png");

        // Calculate image dimensions to maintain aspect ratio
        const imgWidth = maxWidth; // Make image full width
        const imgHeight = (imageElement.naturalHeight / imageElement.naturalWidth) * imgWidth; 

        pdf.addImage(imgData, "PNG", marginLeft, textY, imgWidth, imgHeight);
        textY += imgHeight + 10; // Move text below the image
      } catch (error) {
        console.error("Image capture failed:", error);
      }
    }
  
    // Wrap text properly
    pdf.setFont("times", "normal");
    pdf.setFontSize(12);
    const storyLines = pdf.splitTextToSize(story, maxWidth);

    storyLines.forEach((line: string | string[], index: any) => {
      if (textY + 10 > pageHeight - 20) { // Check if text exceeds page height
        pdf.addPage(); // Add new page
        textY = marginTop; // Reset text position
      }
      pdf.text(line, marginLeft, textY);
      textY += 7; // Line height
    });
  
    // Save PDF with name included
    pdf.save(`${name}_story.pdf`);
  };

  // Fetch past stories
  const fetchStories = async () => {
    try {
      const response = await fetch("http://localhost:8000/stories");
      const data = await response.json();
      setPastStories(data);
      setShowPastStories(true);
      setCurrentStoryIndex(0);
    } catch (error) {
      console.error("Error fetching past stories:", error);
    }
  };

  // Hide past stories
  const hideStories = async () => {
    setShowPastStories(false);   
  };

  // Delete a story
  const deleteStory = async (storyId: number) => {
    try {
      await fetch(`http://localhost:8000/delete-story/${storyId}`, { method: "DELETE" });
      alert("Story deleted successfully!");
      fetchStories(); // Refresh stories list
    } catch (error) {
      console.error("Error deleting story:", error);
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
      {story && (
        <div id="story-container" className="story-container">
          <h3 className="story-title">{name}'s AI-Generated Story</h3>
          {imageUrl && <img id="story-image" src={imageUrl} alt="Story Illustration" className="story-image" crossOrigin="anonymous" onLoad={() => console.log("Image loaded")} />}
          <p className="story-text">{story}</p>
          <button onClick={saveStory} disabled={!story}>Save Story</button>
          <button onClick={downloadPDF} disabled={!story}>Download as PDF</button>
        </div>
)}


      {!showPastStories && (
        <button onClick={fetchStories}>Show Past Stories</button>
      )}

      {showPastStories && (
        <button onClick={hideStories}>Hide Past Stories</button>
      )}

      {showPastStories && pastStories.length > 0 && (
        <div>
          <h2>Past Stories</h2>
          <div className="story-card">
            <h3>{pastStories[currentStoryIndex].name} - {pastStories[currentStoryIndex].character}</h3>
            <p>{pastStories[currentStoryIndex].story}</p>
            <img src={pastStories[currentStoryIndex].image_url} alt="Story Illustration" />
            <button onClick={() => deleteStory(pastStories[currentStoryIndex].id)}>Delete</button>
          </div>

          <button onClick={() => setCurrentStoryIndex((currentStoryIndex - 1 + pastStories.length) % pastStories.length)}>Previous</button>
          <button onClick={() => setCurrentStoryIndex((currentStoryIndex + 1) % pastStories.length)}>Next</button>
        </div>
      )}
      
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
