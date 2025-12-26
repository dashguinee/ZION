import { useState, useRef, useEffect } from 'react';
import './index.css';

// Types
interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  susu?: string;
  translation?: string;
  confidence?: number;
  source?: string;
  suggestions?: { susu: string; english: string }[];
  pronunciation?: string;
  timestamp: Date;
}

interface Stats {
  englishWords: number;
  susuWords: number;
  sentences: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Icons
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const TranslateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
  </svg>
);

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<'chat' | 'translate'>('chat');
  const [stats, setStats] = useState<Stats | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load stats on mount
  useEffect(() => {
    fetch(`${API_URL}/api/stats`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'ai',
        text: 'Inou wali! (Hello!) I am Guinius, the first AI that speaks Susu. I can help you learn and translate Susu, the language of Guinea. Try saying something in English and I\'ll translate it for you!',
        susu: 'Inou wali! N xili Guinius. N nɔma i mali Susu xaranfe.',
        suggestions: [
          { susu: 'N xili [your name]', english: 'My name is [your name]' },
          { susu: 'I tan di?', english: 'How are you?' },
          { susu: 'N bara Susu xaranfe', english: 'I am learning Susu' }
        ],
        timestamp: new Date()
      }]);
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const endpoint = mode === 'chat' ? '/api/chat' : '/api/translate';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          text: input,
          sessionId: 'main'
        })
      });

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: mode === 'chat' ? data.response : `Translation: ${data.translation}`,
        susu: data.responseSusu || data.translation,
        translation: data.translation,
        confidence: data.confidence,
        source: data.translationSource || data.source,
        suggestions: data.suggestions,
        pronunciation: data.pronunciation,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: 'Sorry, I had trouble connecting. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];

          // Try Whisper transcription
          try {
            const response = await fetch(`${API_URL}/api/transcribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64 })
            });

            if (response.ok) {
              const data = await response.json();
              setInput(data.text);
            }
          } catch (e) {
            console.error('Transcription failed:', e);
          }
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSuggestionClick = (susu: string) => {
    setInput(susu);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="guinea-gradient h-1" />
      <div className="bg-slate-900/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-guinea-green to-guinea-yellow flex items-center justify-center text-white font-bold text-lg">
            G
          </div>
          <div>
            <h1 className="text-white font-semibold">Guinius</h1>
            <p className="text-slate-400 text-xs">Susu Language AI</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-800 rounded-full p-1">
          <button
            onClick={() => setMode('chat')}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              mode === 'chat'
                ? 'bg-guinea-green text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setMode('translate')}
            className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1 ${
              mode === 'translate'
                ? 'bg-guinea-green text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TranslateIcon />
            Translate
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-slate-800/50 px-4 py-2 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span>{stats.englishWords?.toLocaleString()} words</span>
          <span>{stats.sentences?.toLocaleString()} sentences</span>
          <span className="text-guinea-green">Guinius v2</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.type === 'user' ? 'message-user' : 'message-ai'
              }`}
            >
              <p className="text-white">{message.text}</p>

              {message.susu && message.type === 'ai' && (
                <p className="susu-text mt-2 text-sm">{message.susu}</p>
              )}

              {message.confidence !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-guinea-green transition-all"
                      style={{ width: `${message.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">
                    {(message.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {message.pronunciation && (
                <p className="text-xs text-slate-400 mt-2 italic">
                  Tip: {message.pronunciation}
                </p>
              )}

              {message.suggestions && message.suggestions.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-slate-400">Try saying:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s.susu)}
                        className="text-xs bg-slate-700/50 hover:bg-slate-600 px-2 py-1 rounded-full text-white transition-colors"
                      >
                        {s.english}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="message-ai rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-guinea-yellow rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-guinea-yellow rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-guinea-yellow rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-slate-900/80 backdrop-blur-sm p-4 sticky bottom-0">
        <div className="flex items-center gap-2 bg-slate-800 rounded-full p-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full transition-all ${
              isRecording
                ? 'bg-guinea-red recording-pulse'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <MicIcon />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={mode === 'chat'
              ? "Say something in English or Susu..."
              : "Enter text to translate..."
            }
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none px-2"
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-full transition-all ${
              input.trim() && !isLoading
                ? 'bg-guinea-green hover:bg-guinea-green/80'
                : 'bg-slate-700 opacity-50'
            }`}
          >
            <SendIcon />
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-2">
          Powered by Guinius v2 - 31,829 sentences
        </p>
      </div>
    </div>
  );
}

export default App;
