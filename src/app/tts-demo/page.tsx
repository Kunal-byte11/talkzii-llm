
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NariVoiceDemoPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  const speak = async () => {
    if (!text.trim()) {
      setError("Please enter some text to speak.");
      return;
    }
    setError(null);
    setLoading(true);

    // Stop any currently playing audio
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }

    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error from /api/speak:", errorData);
        setError(errorData.error || `Error: ${res.statusText}`);
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      if (blob.type !== 'audio/wav') {
         // Hugging Face might return JSON error even with 200 OK for some TTS models if input is bad
         // Or if the model isn't a TTS model
        const errorText = await blob.text();
        try {
            const jsonData = JSON.parse(errorText);
            setError(jsonData.error || "Received non-audio data. The model might not be a TTS model or input was invalid.");
        } catch {
            setError("Received non-audio data. Check if the Hugging Face model is a TTS model and if your input is valid.");
        }
        console.error("Received non-audio data:", errorText);
        setLoading(false);
        return;
      }

      const audioUrl = URL.createObjectURL(blob);
      const newAudio = new Audio(audioUrl);
      
      newAudio.onended = () => {
        setLoading(false);
        URL.revokeObjectURL(audioUrl); // Clean up object URL
      };
      newAudio.onerror = (e) => {
        console.error("Audio playback error", e);
        setError("Failed to play audio.");
        setLoading(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await newAudio.play();
      setAudioPlayer(newAudio); // Keep track of the current audio player
      // setLoading will be set to false on 'onended' or 'onerror'
    } catch (fetchError) {
      console.error("Fetch error in speak function:", fetchError);
      setError("Failed to fetch audio. Check your network or the server logs.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-10 min-h-screen flex flex-col items-center bg-background">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link href="/" passHref>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="bg-card p-6 sm:p-8 rounded-xl shadow-xl border border-border">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-primary">
            🎙️ Talkzii – Nari Voice Demo
          </h1>
          <p className="text-center text-muted-foreground mb-6 text-sm sm:text-base">
            Enter text below and click "Speak with Nari" to hear it spoken using the 
            <code className="bg-muted px-1 py-0.5 rounded text-xs mx-1">nari-labs/Dia-1.6B</code> model via Hugging Face.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tts-text" className="text-sm font-medium text-foreground mb-1 block">
                Text to Speak:
              </Label>
              <Textarea
                id="tts-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="bg-input border-border focus:border-primary placeholder:text-muted-foreground/70"
                placeholder="Type what you want Nari to say..."
              />
            </div>
            
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/30">{error}</p>
            )}

            <Button 
              onClick={speak} 
              disabled={loading || !text.trim()}
              className="w-full gradient-button text-base py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              {loading ? "Generating Audio..." : "Speak with Nari 🗣️"}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-8">
          Note: The Hugging Face model <code className="text-xs">nari-labs/Dia-1.6B</code> appears to be a large language model, not primarily a TTS model.
          If you don't hear audio or get an error, it might be due to model incompatibility for direct TTS output.
          This demo implements the client-server flow as requested.
        </p>
      </div>
    </div>
  );
}
