"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./globals.css";
import { motion } from "framer-motion";

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
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">AI-Powered Children's Story Generator</h1>
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
        <input
          placeholder="Child's Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 p-2 border rounded-lg text-gray-500 placeholder-gray-300"
        />
        <input
          placeholder="Character Type (e.g., wizard, astronaut, dragon)"
          value={character}
          onChange={(e) => setCharacter(e.target.value)}
          className="w-full mb-3 p-2 border rounded-lg text-gray-500 placeholder-gray-300"
        />
        <input
          placeholder="Story Topic (e.g. Space Adventure, Pirate Adventure)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full mb-3 p-2 border rounded-lg text-gray-500 placeholder-gray-300"
        />
        <button onClick={generateStory} disabled={loading} className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition">
          {loading ? "Generating..." : "Generate Story"}
        </button>
      </div>
      {story && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          id="story-container" 
          className="mt-6 w-full max-w-lg bg-white p-6 rounded-xl shadow-md"
          >
          <h3 className="text-lg font-semibold text-gray-800">{name} - {topic}</h3>
          {imageUrl && (
            <motion.img 
              id="story-image" 
              src={imageUrl} 
              alt="Story Illustration" 
              className="w-full" 
              crossOrigin="anonymous" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              onLoad={() => console.log("Image loaded")} 
              />)}
          <p className="text-gray-600">{story}</p>
          <button onClick={saveStory} disabled={!story} className="w-full mt-4 bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition">Save Story</button>
          <button onClick={downloadPDF} disabled={!story} className="w-full mt-4 bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition">Download as PDF</button>
        </motion.div>
)}


      {!showPastStories && (
        <button onClick={fetchStories} className="w-96 mt-4 border-2 border-green-500 bg-transparent text-green-500 p-2 rounded-lg hover:bg-green-500 hover:text-white transition">Show Past Stories</button>
      )}

      {showPastStories && (
        <button onClick={hideStories} className="w-96 mt-4 border-2 border-green-500 bg-transparent text-green-500 p-2 rounded-lg hover:bg-green-500 hover:text-white transition">Hide Past Stories</button>
      )}

      {showPastStories && pastStories.length > 0 && (
        <div className="mt-6 w-full max-w-lg bg-white p-6 rounded-xl shadow-md">
          <h2 className="hidden">Past Stories</h2>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{pastStories[currentStoryIndex].name} - {pastStories[currentStoryIndex].topic}</h3>
            <p className="text-gray-600">{pastStories[currentStoryIndex].story}</p>
            <img src={pastStories[currentStoryIndex].image_url} className="w-full"alt="Story Illustration" />
            <button onClick={() => deleteStory(pastStories[currentStoryIndex].id)} className="w-48 mt-4 border-2 border-red-500 bg-transparent text-red-500 p-2 rounded-lg hover:bg-red-500 hover:text-white transition">Delete</button>
          </div>

          <button onClick={() => setCurrentStoryIndex((currentStoryIndex - 1 + pastStories.length) % pastStories.length)} className="w-48 mt-4 mr-2 border-2 border-blue-500 bg-transparent text-blue-500 p-2 rounded-lg hover:bg-blue-500 hover:text-white transition">Previous</button>
          <button onClick={() => setCurrentStoryIndex((currentStoryIndex + 1) % pastStories.length)} className="w-48 mt-4 border-2 border-blue-500 bg-transparent text-blue-500 p-2 rounded-lg hover:bg-blue-500 hover:text-white transition">Next</button>
        </div>
      )}
    </div>
  );
}
