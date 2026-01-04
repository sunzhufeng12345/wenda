import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Waveform from './components/Waveform';
import MusicPlayer from './components/MusicPlayer';
import QuickCommands from './components/QuickCommands';
import { 
    getSettings, 
    saveSettings, 
    getAccountingRecords, 
    saveAccountingRecord, 
    getSessions, 
    saveSession,
    clearHistory
} from './services/storageService';
import { generateChatResponse, analyzeReceipt } from './services/geminiService';
import { AppSettings, Message, MessageRole, ResponseMode, Theme, AccountingRecord, ChatSession, MusicState } from './types';

// --- Helper Components ---

const TypewriterText: React.FC<{ text: string; onComplete?: () => void }> = ({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    
    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            setDisplayedText((prev) => prev + text.charAt(index));
            index++;
            if (index >= text.length) {
                clearInterval(interval);
                onComplete && onComplete();
            }
        }, 15); 
        return () => clearInterval(interval);
    }, [text, onComplete]);

    return <div className="text-[15px] leading-7 font-normal text-slate-700">{displayedText}</div>;
};

const ChatBubble: React.FC<{ message: Message, onPlayAudio: (text: string) => void }> = ({ message, onPlayAudio }) => {
  const isUser = message.role === MessageRole.USER;
  const isSystem = message.role === MessageRole.SYSTEM;
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  if (isSystem) {
    return (
        <div className="flex justify-center my-8 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest bg-slate-100/80 px-4 py-1.5 rounded-full">{message.content}</span>
        </div>
    );
  }

  return (
    <div className={`flex w-full mb-8 group ${isUser ? 'justify-end' : 'justify-start'} opacity-0 animate-[slideUp_0.4s_ease-out_forwards]`}>
      {!isUser && (
        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mr-4 flex-shrink-0 mt-1">
           <img src="https://api.dicebear.com/7.x/bottts/svg?seed=XiaoyiBot&backgroundColor=transparent" alt="AI" className="w-7 h-7" />
        </div>
      )}
      <div className={`max-w-[70%] sm:max-w-[60%] p-5 shadow-sm relative transition-all duration-300 ${
        isUser 
            ? 'bg-blue-600 text-white rounded-[20px] rounded-br-sm shadow-lg shadow-blue-500/20' 
            : 'bg-white text-slate-800 rounded-[20px] rounded-bl-sm border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
      }`}>
        {message.isTyping ? (
            <div className="flex gap-1.5 h-6 items-center px-2">
                <div className={`w-2 h-2 rounded-full animate-bounce ${isUser ? 'bg-white/70' : 'bg-slate-400'}`}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce delay-75 ${isUser ? 'bg-white/70' : 'bg-slate-400'}`}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce delay-150 ${isUser ? 'bg-white/70' : 'bg-slate-400'}`}></div>
            </div>
        ) : (
            <>
                <div className="flex items-center justify-between gap-4 mb-1">
                     <span className={`text-[10px] font-bold uppercase tracking-wider ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                        {isUser ? 'You' : 'Nova AI'}
                     </span>
                     <span className={`text-[10px] font-medium opacity-60 ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>

                {!isUser ? (
                    <TypewriterText text={message.content} onComplete={() => setIsTypingComplete(true)} />
                ) : (
                    <div className="text-[15px] leading-7 font-normal">{message.content}</div>
                )}
                
                {!isUser && (isTypingComplete || message.content.length < 5) && (
                    <div className="mt-3 pt-2 border-t border-slate-50 flex justify-end">
                        <button 
                            onClick={() => onPlayAudio(message.content)} 
                            className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg px-2 py-1 flex items-center gap-1.5 transition-colors text-xs font-medium"
                        >
                            <i className="fa-solid fa-volume-high"></i> Play
                        </button>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

const SettingsModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    settings: AppSettings; 
    onUpdate: (s: AppSettings) => void;
    onClearHistory: () => void;
}> = ({ isOpen, onClose, settings, onUpdate, onClearHistory }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-2xl p-8 shadow-2xl border border-white/50 animate-slideUp">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">System Preferences</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <i className="fa-solid fa-xmark text-slate-400"></i>
                    </button>
                </div>

                <div className="space-y-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Response Mode</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: ResponseMode.TEXT, label: 'Text', icon: 'fa-message' },
                                { id: ResponseMode.MIXED, label: 'Mixed', icon: 'fa-wand-magic-sparkles' },
                                { id: ResponseMode.AUDIO, label: 'Audio', icon: 'fa-headphones' },
                                { id: ResponseMode.PCM, label: 'PCM', icon: 'fa-wave-square' }
                            ].map(mode => (
                                <button 
                                    key={mode.id}
                                    onClick={() => onUpdate({ ...settings, responseMode: mode.id })}
                                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-sm transition-all duration-200 ${
                                        settings.responseMode === mode.id
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                                        : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <i className={`fa-solid ${mode.icon} text-sm`}></i>
                                    <span className="font-semibold text-xs">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Appearance & Sound</label>
                         <div className="space-y-3">
                             <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500"><i className="fa-solid fa-moon"></i></div>
                                    <span className="text-slate-700 font-semibold text-sm">Dark Mode</span>
                                </div>
                                <button 
                                    onClick={() => onUpdate({ ...settings, theme: settings.theme === Theme.DARK ? Theme.LIGHT : Theme.DARK })}
                                    className={`w-11 h-6 rounded-full transition-colors relative ${settings.theme === Theme.DARK ? 'bg-slate-800' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${settings.theme === Theme.DARK ? 'translate-x-5' : ''}`}></span>
                                </button>
                            </div>
                             <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500"><i className="fa-solid fa-volume-high"></i></div>
                                    <span className="text-slate-700 font-semibold text-sm">Auto-play Response</span>
                                </div>
                                <button 
                                    onClick={() => onUpdate({ ...settings, autoPlayAudio: !settings.autoPlayAudio })}
                                    className={`w-11 h-6 rounded-full transition-colors relative ${settings.autoPlayAudio ? 'bg-blue-500' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${settings.autoPlayAudio ? 'translate-x-5' : ''}`}></span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                         <button 
                            onClick={() => {
                                if(window.confirm('This will delete all conversations permanently. Continue?')) {
                                    onClearHistory();
                                    onClose();
                                }
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-2"
                         >
                            <i className="fa-regular fa-trash-can"></i> Clear All Data
                         </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- Main App Component ---

const App: React.FC = () => {
  // --- State ---
  const [activeTab, setActiveTab] = useState('chat');
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Chat
  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showQuickCommands, setShowQuickCommands] = useState(false);
  
  // Music Player
  const [musicState, setMusicState] = useState<MusicState>({
    isPlaying: false,
    title: '',
    artist: '',
    progress: 0,
    duration: 180,
    isVisible: false
  });
  
  // Refs
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<any>(null);

  // Accounting
  const [records, setRecords] = useState<AccountingRecord[]>(getAccountingRecords());
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  // History
  const [sessions, setSessions] = useState<ChatSession[]>(getSessions());
  const [historySearch, setHistorySearch] = useState('');

  // --- Effects ---

  useEffect(() => {
    saveSettings(settings);
    if (settings.theme === Theme.DARK) {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Auto-save session
    if (messages.length > 0) {
        const userMsg = messages.find(m => m.role === MessageRole.USER);
        const title = userMsg ? userMsg.content.slice(0, 30) : 'New Conversation';
        
        const currentSession: ChatSession = {
            id: currentSessionId,
            title: title,
            lastMessage: messages[messages.length - 1]?.content || '',
            timestamp: Date.now(),
            messages
        };
        saveSession(currentSession);
        setSessions(getSessions());
    }
  }, [messages, currentSessionId]);

  useEffect(() => {
      if (isRecording) {
          setRecordingDuration(0);
          recordingTimerRef.current = setInterval(() => {
              setRecordingDuration(prev => prev + 1);
          }, 1000);
      } else {
          clearInterval(recordingTimerRef.current);
          setRecordingDuration(0);
      }
      return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  // --- Handlers ---

  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsAIProcessing(true);

    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));

    const typingMsgId = 'typing-' + Date.now();
    setMessages(prev => [...prev, { id: typingMsgId, role: MessageRole.MODEL, content: '...', timestamp: Date.now(), isTyping: true }]);

    let responseText = await generateChatResponse(history, text);

    const musicTagMatch = responseText.match(/\[MUSIC:\s*(.*?)\|(.*?)\]/);
    if (musicTagMatch) {
        const title = musicTagMatch[1];
        const artist = musicTagMatch[2];
        responseText = responseText.replace(musicTagMatch[0], '').trim();
        
        setMusicState({
            isVisible: true,
            isPlaying: true,
            title,
            artist,
            progress: 0,
            duration: 200
        });
    }

    setMessages(prev => prev.filter(m => m.id !== typingMsgId));
    const modelMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: MessageRole.MODEL, 
        content: responseText, 
        timestamp: Date.now() 
    };
    setMessages(prev => [...prev, modelMsg]);
    setIsAIProcessing(false);

    if (settings.responseMode !== ResponseMode.TEXT && settings.autoPlayAudio && responseText) {
        speakText(responseText);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
            (v.name.includes('Google') && v.name.includes('Female')) || 
            (v.name.includes('Samantha')) ||
            (v.name.includes('Microsoft Zira'))
        );
        if (preferredVoice) utterance.voice = preferredVoice;
        
        window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        setIsRecording(true);

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.interimResults = false;
            
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) handleSendMessage(transcript);
            };
            
            recognitionRef.current.onerror = (e: any) => {
                console.error("Speech Error", e);
                stopRecording();
            };
            
            recognitionRef.current.onend = () => stopRecording();
            recognitionRef.current.start();
        } else {
            alert('Speech recognition not supported.');
            stopRecording();
        }

    } catch (err) {
        console.error("Mic Error", err);
        alert("Microphone access denied.");
        setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
    }
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveTab('accounting');
    setIsAnalyzingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];

        const result = await analyzeReceipt(base64Data);
        if (result) {
            const newRecord: AccountingRecord = {
                id: Date.now().toString(),
                amount: result.amount || 0,
                category: result.category || 'Misc',
                merchant: result.merchant || 'Unknown',
                date: result.date || new Date().toISOString().split('T')[0],
                timestamp: Date.now(),
                imageUrl: base64
            };
            saveAccountingRecord(newRecord);
            setRecords(getAccountingRecords());
        } else {
            alert("Analysis failed.");
        }
        setIsAnalyzingImage(false);
    };
  };

  const handleClearHistory = () => {
    clearHistory();
    setSessions([]);
    setMessages([]); 
  };

  // --- Views ---

  const renderWelcomeState = () => (
      <div className="flex flex-col items-center justify-center h-full pb-20">
          <div className="relative mb-8 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-purple-400 blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl ring-1 ring-white/50 relative z-10">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=XiaoyiBot&backgroundColor=transparent" alt="Bot" className="w-16 h-16" />
              </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Welcome to Nova AI</h2>
          <p className="text-slate-500 mb-10 text-center max-w-md text-base leading-relaxed">
            Your personal desktop assistant. I can handle voice commands, track expenses, and manage your daily tasks.
          </p>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
              {[
                  { icon: 'fa-cloud-sun', title: "Check Weather", text: "How's the weather?" },
                  { icon: 'fa-receipt', title: "Expense Tracking", text: "Upload a receipt" },
                  { icon: 'fa-music', title: "Play Music", text: "Play something chill" },
                  { icon: 'fa-code', title: "Code Helper", text: "Write a React hook" }
              ].map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                        if(item.title === "Expense Tracking") setActiveTab('accounting');
                        else handleSendMessage(item.text);
                    }}
                    className="flex items-start gap-4 p-5 bg-white/60 hover:bg-white rounded-2xl border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left group"
                  >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <i className={`fa-solid ${item.icon}`}></i>
                      </div>
                      <div>
                          <div className="font-bold text-slate-800 text-sm">{item.title}</div>
                          <div className="text-xs text-slate-400 mt-1 font-medium">{item.text}</div>
                      </div>
                  </button>
              ))}
          </div>
      </div>
  );

  const renderChatView = () => (
    <div className="flex flex-col h-full relative bg-white/30">
        
        {/* Top Floating Music Player (Desktop Style) */}
        {musicState.isVisible && (
            <div className="absolute top-4 right-4 z-20">
                <MusicPlayer 
                    state={musicState} 
                    onClose={() => setMusicState(prev => ({...prev, isVisible: false, isPlaying: false}))}
                    onTogglePlay={() => setMusicState(prev => ({...prev, isPlaying: !prev.isPlaying}))}
                />
            </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 sm:px-16 no-scrollbar">
            <div className="h-8"></div>
            {messages.length === 0 ? renderWelcomeState() : (
                <>
                    <div className="flex justify-center sticky top-0 z-10 py-4 pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/80 backdrop-blur px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">Today's Session</span>
                    </div>
                    {messages.map(msg => (
                        <ChatBubble key={msg.id} message={msg} onPlayAudio={speakText} />
                    ))}
                </>
            )}
            <div ref={chatEndRef} className="h-8" />
        </div>

        {/* Input Footer */}
        <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 relative z-20">
            {showQuickCommands && (
                <div className="absolute bottom-full left-6 mb-2">
                    <QuickCommands 
                        onSelect={handleSendMessage} 
                        onClose={() => setShowQuickCommands(false)} 
                    />
                </div>
            )}
            
            <div className="max-w-4xl mx-auto flex items-end gap-3">
                 <button 
                    onClick={() => setShowQuickCommands(!showQuickCommands)}
                    className="w-12 h-12 flex-shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors flex items-center justify-center"
                    title="Quick Actions"
                >
                    <i className="fa-solid fa-bolt"></i>
                </button>

                <div className="flex-1 bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 rounded-xl transition-all duration-200 flex items-center p-1.5 gap-2">
                     <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask anything or type / command..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 px-4 py-2 font-medium"
                    />
                    
                    {!inputText && (
                         <button 
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                            title="Hold to Speak"
                        >
                            <i className="fa-solid fa-microphone"></i>
                        </button>
                    )}
                    
                    <button className="w-9 h-9 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors">
                        <label className="cursor-pointer flex items-center justify-center w-full h-full">
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <i className="fa-regular fa-image"></i>
                        </label>
                    </button>

                    {inputText && (
                        <button 
                            onClick={() => handleSendMessage()}
                            className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md hover:bg-blue-700 transition-transform active:scale-95"
                        >
                            <i className="fa-solid fa-arrow-up"></i>
                        </button>
                    )}
                </div>
            </div>
            
            {(isRecording || isPlayingAudio) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-4 pointer-events-none animate-fadeIn">
                     <div className="bg-slate-900/90 backdrop-blur text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-4 border border-white/10">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-xs font-bold tracking-wider">{isRecording ? 'LISTENING' : 'SPEAKING'}</span>
                         </div>
                         <div className="h-4 w-px bg-white/20"></div>
                         <Waveform isRecording={isRecording} isPlaying={isPlayingAudio} audioStream={audioStreamRef.current} />
                     </div>
                </div>
            )}
        </div>
    </div>
  );

  const renderAccountingView = () => {
    const totalSpent = records.reduce((sum, r) => sum + r.amount, 0);
    
    return (
    <div className="flex-1 overflow-y-auto p-8 scroll-smooth bg-white/40">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Financial Dashboard</h2>
                <p className="text-slate-500 text-sm mt-1">Overview of your recent expenses and analytics.</p>
            </div>
            <div className="flex gap-3">
                 <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                    <i className="fa-solid fa-download mr-2"></i> Export
                 </button>
                 <label className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shadow-lg shadow-blue-500/30 flex items-center">
                    {isAnalyzingImage ? <i className="fa-solid fa-spinner animate-spin mr-2"></i> : <i className="fa-solid fa-camera mr-2"></i>}
                    Scan Receipt
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isAnalyzingImage} />
                 </label>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Stats Card */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden group">
                     <div className="absolute right-[-20%] top-[-20%] w-48 h-48 bg-blue-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                     <div className="relative z-10">
                         <div className="flex items-center gap-2 mb-6 opacity-60">
                             <i className="fa-solid fa-wallet"></i>
                             <span className="text-xs font-bold uppercase tracking-widest">Total Spent</span>
                         </div>
                         <h3 className="text-4xl font-bold tracking-tight mb-2">${totalSpent.toFixed(2)}</h3>
                         <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-400/10 inline-block px-2 py-1 rounded">
                             <i className="fa-solid fa-arrow-trend-up"></i> +2.4% this month
                         </div>
                     </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-4 text-sm">Category Breakdown</h4>
                    <div className="space-y-4">
                        {['Food', 'Transport', 'Shopping', 'Misc'].map((cat, i) => {
                            const percent = Math.floor(Math.random() * 40) + 10;
                            return (
                                <div key={cat}>
                                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                                        <span>{cat}</span>
                                        <span>{percent}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${['bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500'][i]}`} style={{width: `${percent}%`}}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Right Col: Transaction List */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 text-sm">Recent Transactions</h3>
                        <button className="text-blue-600 text-xs font-bold hover:underline">View All</button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {records.map(record => (
                            <div key={record.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-sm ${
                                        record.category.toLowerCase().includes('food') ? 'bg-orange-100 text-orange-500' :
                                        record.category.toLowerCase().includes('transport') ? 'bg-indigo-100 text-indigo-500' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        <i className={`fa-solid ${
                                            record.category.toLowerCase().includes('food') ? 'fa-utensils' :
                                            record.category.toLowerCase().includes('transport') ? 'fa-car' :
                                            'fa-bag-shopping'
                                        }`}></i>
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{record.merchant}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                            <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="capitalize">{record.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">-${record.amount.toFixed(2)}</div>
                                    <button className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-500">Edit</button>
                                </div>
                            </div>
                        ))}
                        {records.length === 0 && (
                            <div className="py-12 text-center">
                                <div className="inline-block p-4 rounded-full bg-slate-50 mb-3">
                                    <i className="fa-solid fa-receipt text-slate-300 text-xl"></i>
                                </div>
                                <p className="text-slate-500 text-sm">No transactions found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  )};

  const renderHistoryView = () => (
    <div className="flex-1 flex flex-col relative bg-white/30 h-full">
        <header className="px-8 py-6 flex items-center justify-between bg-white/50 border-b border-slate-200/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-slate-800">Chat Archives</h2>
            <div className="relative group">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500"></i>
                <input 
                    type="text" 
                    placeholder="Search conversations..." 
                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                />
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions
                    .filter(s => s.title.toLowerCase().includes(historySearch.toLowerCase()))
                    .map(session => (
                    <button 
                        key={session.id} 
                        onClick={() => {
                            setMessages(session.messages);
                            setCurrentSessionId(session.id);
                            setActiveTab('chat');
                        }}
                        className="bg-white hover:bg-blue-50 p-5 rounded-xl border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all duration-200 text-left group flex flex-col h-40"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                                <i className="fa-regular fa-comments text-lg"></i>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded">
                                {new Date(session.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        
                        <h3 className="font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-blue-700">{session.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 opacity-80">{session.lastMessage}</p>
                        
                        <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                            <i className="fa-solid fa-clock"></i> {new Date(session.timestamp).toLocaleTimeString()}
                        </div>
                    </button>
                ))}
             </div>
        </div>
    </div>
  );

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        deviceId={settings.deviceId}
        onOpenSettings={() => setIsSettingsOpen(true)}
    >
      {activeTab === 'chat' && renderChatView()}
      {activeTab === 'accounting' && renderAccountingView()}
      {activeTab === 'history' && renderHistoryView()}
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onUpdate={setSettings}
        onClearHistory={handleClearHistory}
      />
    </Layout>
  );
};

export default App;