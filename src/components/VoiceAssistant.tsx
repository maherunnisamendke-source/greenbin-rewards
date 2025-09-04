import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const VoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  const recognition = useRef<any>(null);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        handleSpeechInput(speechResult);
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: "Could not process speech. Please try again.",
          variant: "destructive",
        });
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const startListening = () => {
    if (!recognition.current) {
      initializeSpeechRecognition();
    }
    
    if (recognition.current) {
      setIsListening(true);
      setTranscript('');
      recognition.current.start();
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
    }
  };

  const handleSpeechInput = async (text: string) => {
    try {
      // Generate AI response based on the input
      const aiResponse = getAIResponse(text);
      setResponse(aiResponse);

      // Convert to speech using ElevenLabs
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: aiResponse, voice: '9BWtsMINqrJLrRacOk9x' }
      });

      if (error) {
        throw error;
      }

      // Play the audio
      if (data?.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        setIsPlaying(true);
        
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          toast({
            title: "Audio Error",
            description: "Could not play audio response.",
            variant: "destructive",
          });
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Error processing speech:', error);
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('bin') || lowerInput.includes('garbage') || lowerInput.includes('waste')) {
      return "I can help you find nearby waste bins! The map shows all available bins in your area with their current status. Green bins are available, yellow bins are nearly full, and red bins need emptying.";
    }
    
    if (lowerInput.includes('recycle') || lowerInput.includes('recycling')) {
      return "For recycling, look for blue or green bins marked as recycling bins. Make sure to separate your materials properly - paper, plastic, glass, and metal should go in designated recycling bins.";
    }
    
    if (lowerInput.includes('location') || lowerInput.includes('where') || lowerInput.includes('find')) {
      return "You can use the search function to find specific bins, or tap the location button to center the map on your current position. I can help you navigate to the nearest available bin.";
    }
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! I'm your waste management assistant. I can help you find nearby bins, provide recycling information, and guide you to proper waste disposal locations. How can I assist you today?";
    }
    
    if (lowerInput.includes('help')) {
      return "I'm here to help with waste management! You can ask me about finding bins, recycling guidelines, or waste disposal procedures. Just speak naturally and I'll do my best to assist you.";
    }
    
    return "I'm your waste management assistant. I can help you find bins, provide recycling information, and guide you with waste disposal. Could you please be more specific about what you need help with?";
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg z-50"
          size="icon"
        >
          <Mic className="h-6 w-6 text-white" />
        </Button>
      )}

      {/* Voice Assistant Card */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 p-4 shadow-lg z-50 bg-background border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Voice Assistant</h3>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Transcript Display */}
            {transcript && (
              <div className="p-2 bg-muted rounded text-sm">
                <strong>You said:</strong> {transcript}
              </div>
            )}

            {/* Response Display */}
            {response && (
              <div className="p-2 bg-primary/10 rounded text-sm">
                <strong>Assistant:</strong> {response}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={isListening ? stopListening : startListening}
                disabled={isPlaying}
                variant={isListening ? "destructive" : "default"}
                size="sm"
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Listening
                  </>
                )}
              </Button>

              {isPlaying && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Volume2 className="h-4 w-4 mr-1" />
                  Playing...
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Click "Start Listening" and speak your question about waste management, bin locations, or recycling.
            </p>
          </div>
        </Card>
      )}
    </>
  );
};

export default VoiceAssistant;