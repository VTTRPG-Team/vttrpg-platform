"use client";

import { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function GeminiChat() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_KEY = "AIzaSyD8LSZbkVBxsAz3YjJDmUczZB97UAw3oak"; 

  //Modify this function to accept an optional 'overridePrompt'
  const askGemini = async (overridePrompt : string | null = null) => {
    // If there is an overridePrompt (auto-start), use it. Otherwise use the state (user typing).
    const textToSend = typeof overridePrompt === "string" ? overridePrompt : prompt;

    if (!textToSend) {
      alert("Please type a question first!");
      return;
    }

    setLoading(true);
    setError("");
    // Only clear output if it's a new user question, not the initial load
    if (!overridePrompt) setOutput(""); 

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(textToSend);
      const response = await result.response;
      const text = response.text();

      setOutput(text);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        askGemini();
    }
  }

  //This runs AUTOMATICALLY when the page opens
  useEffect(() => {
    //QSystem Instruction
    const initialPrompt = "Act as a Dungeon Master for a fantasy RPG. Briefly introduce yourself to the player and ask them what their character's name is.There will be total of 4 players so ask them all about their name and preferred role in the party (e.g., warrior, mage, healer, rogue). Keep the introduction concise and engaging to set the tone for the adventure ahead. Also after this whether what input will be judge by dice roll or not, explain it to the players. wheter what input is remember you are DM and dont answer normally act as DM only.";
    
    askGemini(initialPrompt);
  }, []); // The empty [] means "run only once"

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px" }}>Have a conversation with AI GM!</h1>

      {/* Input Box */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start typing here..."
          style={{ 
            flex: 1, 
            padding: "12px", 
            borderRadius: "8px", 
            border: "1px solid #ccc",
            fontSize: "16px",
            outline: "none"
          }}
        />
        
        <button 
          onClick={() => askGemini()}
          disabled={loading}
          style={{ 
            padding: "12px 24px", 
            backgroundColor: "#7d6363", 
            color: "white", 
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            whiteSpace: "nowrap"
          }}
        >
          {loading ? "Thinking..." : "Send Message"}
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: "10px" }}>Error: {error}</p>}
      
      {/* Output Box */}
      {output && (
        <div style={{ 
          marginTop: "20px", 
          padding: "20px",  
          backgroundColor: "#2d2d2d", 
          color: "#ffffff",
          borderRadius: "10px",
          lineHeight: "1.6",
          whiteSpace: "pre-wrap",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <strong style={{ display:"block", marginBottom:"10px", color: "#ffa500" }}>GM says:</strong>
          {output}
        </div>
      )}
    </div>
  );
}