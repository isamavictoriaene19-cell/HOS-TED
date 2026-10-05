import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Scissors,
  UserCheck,
  RefreshCw,
  Mic,
  MicOff,
  CheckCircle2,
  Ruler,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AssistantMode, ChatMessage } from '../types';
import { ASSETS } from '../constants/assets';
import { ActiveFrontendUser } from './UserAuthOnboardingModal';
import {
  speakWithTessyIdomaVoice,
  stopTessyVoice,
  startTessyMicrophoneCapture,
  TessyMicSession,
  extractVoiceMeasurementsAndTailoring,
} from '../utils/tessyVoice';
import { renderFormattedTessyReply } from '../utils/formatTessyText';

interface TessyAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AssistantMode;
  initialPrompt?: string;
  activeUser?: ActiveFrontendUser | null;
  onUserChatUpdated?: (updatedChats: ChatMessage[]) => void;
  onUserProfileSynced?: (updatedUser: ActiveFrontendUser) => void;
  onStorefrontUpdated?: () => void;
}

const QUICK_PROMPTS: Record<AssistantMode, string[]> = {
  stylist: [
    'What Ankara style suits a wedding guest in Lagos?',
    'Recommend a regal Silk Bubu gown for a milestone birthday',
    'How should I style the Peplum Skirt & Blouse for work?',
    'Which HOS|TED colors flatter warm undertones best?',
  ],
  concierge: [
    'Guide me step-by-step on taking my body measurements',
    'What are your nationwide delivery timelines across Nigeria?',
    'My Bust is 38, Waist 31, Hips 42, Length 60 inches—what is my size?',
    'How do I book a bespoke tailoring order with Theresa Isama?',
  ],
};

export const TessyAIAssistant: React.FC<TessyAIAssistantProps> = ({
  isOpen,
  onClose,
  initialMode = 'stylist',
  initialPrompt = '',
  activeUser,
  onUserChatUpdated,
  onUserProfileSynced,
  onStorefrontUpdated,
}) => {
  const [mode, setMode] = useState<AssistantMode>(initialMode);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Live Voice Recording & Transcription State
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceAudioLevel, setVoiceAudioLevel] = useState(0);
  const [autoSendVoice, setAutoSendVoice] = useState(true);
  const autoSendVoiceRef = useRef<boolean>(true);
  const [micError, setMicError] = useState('');
  const [showVoiceTailoringStudio, setShowVoiceTailoringStudio] = useState(false);
  const [voiceSyncedNotice, setVoiceSyncedNotice] = useState('');
  const [accumulatedVoiceMeasurements, setAccumulatedVoiceMeasurements] = useState<{
    bust?: string;
    waist?: string;
    hips?: string;
    shoulder?: string;
    sleeveLength?: string;
    outfitLength?: string;
    styleCategory?: string;
    size?: string;
    color?: string;
    customStyleDescription?: string;
  }>({});

  const [brainActionBanner, setBrainActionBanner] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const micSessionRef = useRef<TessyMicSession | null>(null);
  const handleSendRef = useRef<(textOverride?: string) => Promise<void>>(async () => {});

  const setAutoSend = (val: boolean) => {
    autoSendVoiceRef.current = val;
    setAutoSendVoice(val);
  };

  // Build tailored initial greeting based on signed-in user (or Founder Theresa Isama)
  const getInitialMessages = (
    m: AssistantMode,
    user?: ActiveFrontendUser | null
  ): ChatMessage[] => {
    if (user?.chatHistory && user.chatHistory.length > 0) {
      return user.chatHistory;
    }

    if (user?.isFounder) {
      return [
        {
          id: 'founder-welcome-msg',
          role: 'assistant',
          content: `Welcome home, my Queen **Theresa Isama**! 👑✨ Visionary Founder, Owner & Creative Director of **HOS|TED** (*HOS|TED Hosting Nations*).\n\nI remember all our conversations and have your live catalog, client profiles, bespoke measurements, and orders ready at your command. Tap the **microphone** to speak directly to me or type below!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
    }

    if (user?.name) {
      return [
        {
          id: 'user-welcome-msg',
          role: 'assistant',
          content:
            m === 'stylist'
              ? `Welcome back, **${user.name}**! ✨ I am **Tessy Ai** at **HOS|TED** (*HOS|TED Hosting Nations*).\n\nTap the **microphone** to speak with me live or type below—what occasion are we styling you for today, ${user.name.split(' ')[0]}?`
              : `Welcome back to **HOS|TED** Concierge, **${user.name}**! ✂️\n\nYou can speak your measurements, size, or delivery details using the **microphone** or type below, and I will assist you right away!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
    }

    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content:
          m === 'stylist'
            ? "Hello! I'm **Tessy Ai**, your personal fashion stylist for **HOS|TED** (*HOS|TED Hosting Nations*), founded by **Theresa Isama**. Whether you need the perfect Ankara gown, a flowing silk Bubu, or chic everyday wear, tap the **microphone** to speak or type below!"
            : "Welcome to **HOS|TED** Concierge (*HOS|TED Hosting Nations*), led by Founder **Theresa Isama**. I can guide you through body measurements, custom tailoring orders, and nationwide delivery across Nigeria. Tap the **microphone** or type below!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getInitialMessages(initialMode, activeUser)
  );

  // Sync messages when activeUser signs in or switches
  useEffect(() => {
    if (activeUser?.chatHistory && activeUser.chatHistory.length > 0) {
      setMessages(activeUser.chatHistory);
    } else {
      setMessages(getInitialMessages(mode, activeUser));
    }
  }, [activeUser?.id, activeUser?.email]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      void handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, interimSpeech]);

  // Stop speech synthesis & microphone when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopTessyVoice();
      setIsSpeaking(false);
      if (micSessionRef.current) {
        micSessionRef.current.cancel();
        micSessionRef.current = null;
      }
      setIsListening(false);
      setIsTranscribing(false);
      setInterimSpeech('');
      setVoiceAudioLevel(0);
    }
  }, [isOpen]);

  // Live timer while recording microphone audio
  useEffect(() => {
    if (!isListening) {
      setRecordingSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isListening]);

  // Speak text out loud using Tessy's soothing Nigerian Female (Idoma) voice
  const speakResponse = (text: string) => {
    if (!speechEnabled) return;
    speakWithTessyIdomaVoice(
      text,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopTessyVoice();
      setIsSpeaking(false);
    }
    setSpeechEnabled(!speechEnabled);
  };

  // Extract spoken body measurements & tailoring specs from voice transcript
  const updateExtractedFromSpeech = (transcriptText: string) => {
    const parsed = extractVoiceMeasurementsAndTailoring(transcriptText);
    if (parsed.hasAnyMeasurement || parsed.hasAnyTailoringDetail) {
      setAccumulatedVoiceMeasurements((prev) => ({
        ...prev,
        ...parsed.measurements,
        ...(parsed.styleCategory ? { styleCategory: parsed.styleCategory } : {}),
        ...(parsed.size ? { size: parsed.size } : {}),
        ...(parsed.color ? { color: parsed.color } : {}),
        ...(parsed.customStyleDescription
          ? { customStyleDescription: parsed.customStyleDescription }
          : {}),
      }));
    }
  };

  // Start or finish real microphone voice input
  const startVoiceRecording = async () => {
    setMicError('');
    setVoiceSyncedNotice('');
    setInterimSpeech('');

    const session = await startTessyMicrophoneCapture({
      onListeningChange: (listening) => setIsListening(listening),
      onTranscribingChange: (transcribing) => setIsTranscribing(transcribing),
      onAudioLevel: (level) => setVoiceAudioLevel(level),
      onInterimTranscript: (liveText) => {
        setInterimSpeech(liveText);
        updateExtractedFromSpeech(liveText);
      },
      onFinalTranscript: (finalText) => {
        const cleaned = String(finalText || '').trim();
        setInterimSpeech('');
        setVoiceAudioLevel(0);
        if (!cleaned) return;
        updateExtractedFromSpeech(cleaned);
        if (autoSendVoiceRef.current) {
          void handleSendRef.current(cleaned);
        } else {
          setInput((prev) => (prev ? `${prev} ${cleaned}` : cleaned));
        }
      },
      onError: (errMsg) => {
        setMicError(errMsg);
        setVoiceAudioLevel(0);
      },
    });

    micSessionRef.current = session;
  };

  const stopAndSendVoice = () => {
    setAutoSend(true);
    if (micSessionRef.current) {
      micSessionRef.current.stopAndFinish();
      micSessionRef.current = null;
    }
  };

  const stopVoiceToEdit = () => {
    setAutoSend(false);
    if (micSessionRef.current) {
      micSessionRef.current.stopAndFinish();
      micSessionRef.current = null;
    }
  };

  const cancelVoiceRecording = () => {
    if (micSessionRef.current) {
      micSessionRef.current.cancel();
      micSessionRef.current = null;
    }
    setIsListening(false);
    setIsTranscribing(false);
    setInterimSpeech('');
    setVoiceAudioLevel(0);
  };

  const toggleVoiceInput = async () => {
    if (isListening && micSessionRef.current) {
      stopAndSendVoice();
      return;
    }
    await startVoiceRecording();
  };

  // Sync recorded voice measurements & tailoring request to the Bespoke Tailoring Form on the page
  const handleSyncVoiceToBespokeForm = (alsoSendToChat: boolean = false) => {
    const combinedText = [input, interimSpeech].filter(Boolean).join(' ').trim();
    const liveParsed = extractVoiceMeasurementsAndTailoring(combinedText);
    const merged = {
      bust: accumulatedVoiceMeasurements.bust || liveParsed.measurements.bust || '',
      waist: accumulatedVoiceMeasurements.waist || liveParsed.measurements.waist || '',
      hips: accumulatedVoiceMeasurements.hips || liveParsed.measurements.hips || '',
      shoulder: accumulatedVoiceMeasurements.shoulder || liveParsed.measurements.shoulder || '',
      sleeveLength:
        accumulatedVoiceMeasurements.sleeveLength || liveParsed.measurements.sleeveLength || '',
      outfitLength:
        accumulatedVoiceMeasurements.outfitLength || liveParsed.measurements.outfitLength || '',
      styleCategory:
        accumulatedVoiceMeasurements.styleCategory || liveParsed.styleCategory || '',
      size: accumulatedVoiceMeasurements.size || liveParsed.size || '',
      color: accumulatedVoiceMeasurements.color || liveParsed.color || '',
      customStyleDescription:
        combinedText || accumulatedVoiceMeasurements.customStyleDescription || '',
    };

    window.dispatchEvent(
      new CustomEvent('tessy-voice-measurements', {
        detail: merged,
      })
    );

    const summaryParts: string[] = [];
    if (merged.bust) summaryParts.push(`Bust: ${merged.bust}"`);
    if (merged.waist) summaryParts.push(`Waist: ${merged.waist}"`);
    if (merged.hips) summaryParts.push(`Hips: ${merged.hips}"`);
    if (merged.shoulder) summaryParts.push(`Shoulder: ${merged.shoulder}"`);
    if (merged.sleeveLength) summaryParts.push(`Sleeve: ${merged.sleeveLength}"`);
    if (merged.outfitLength) summaryParts.push(`Length: ${merged.outfitLength}"`);
    if (merged.styleCategory) summaryParts.push(`Style: ${merged.styleCategory}`);
    if (merged.size) summaryParts.push(`Size: ${merged.size.split(' ')[0]}`);
    if (merged.color) summaryParts.push(`Color: ${merged.color.split(' (')[0]}`);

    setVoiceSyncedNotice(
      summaryParts.length > 0
        ? `Synced to Bespoke Form: ${summaryParts.join(' · ')}`
        : 'Synced your voice tailoring details to the Bespoke Form!'
    );

    if (alsoSendToChat) {
      const chatPrompt =
        summaryParts.length > 0
          ? `Here are my spoken HOS|TED measurements and custom tailoring details: ${summaryParts.join(', ')}. ${
              merged.customStyleDescription ? `Additional notes: "${merged.customStyleDescription}"` : ''
            }`
          : combinedText || 'Please review my custom tailoring measurements.';
      void handleSend(chatPrompt);
    }
  };

  const handleModeSwitch = (newMode: AssistantMode) => {
    setMode(newMode);
    const switchMsg: ChatMessage = {
      id: `mode-${Date.now()}`,
      role: 'assistant',
      content:
        newMode === 'stylist'
          ? 'Switched to **Fashion Stylist Mode** ✨. Tell me about your upcoming event, preferred colors, or silhouette!'
          : 'Switched to **Order & Measurement Concierge Mode** ✂️. Speak or type your Bust, Waist, Hips, Length, or delivery state and I will assist you!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, switchMsg]);
    speakResponse(switchMsg.content);
  };

  const handleResetChat = () => {
    stopTessyVoice();
    setIsSpeaking(false);
    setMessages(getInitialMessages(mode, activeUser));
    setBrainActionBanner('');
    setMicError('');
  };

  const handleSend = async (textOverride?: string) => {
    const userText = (textOverride ?? input).trim();
    if (!userText || isLoading) return;

    if (isListening && micSessionRef.current) {
      micSessionRef.current.cancel();
      micSessionRef.current = null;
      setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textOverride) setInput('');
    setInterimSpeech('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/tessy-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          mode,
          userId: activeUser?.id,
          userEmail: activeUser?.email,
          userName: activeUser?.name,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Temporary connection hiccup while reaching Tessy Ai.');
      }

      const data = await response.json();
      if (!response.ok && !data.reply) {
        throw new Error(data.error || 'Could not reach Tessy Ai right now.');
      }

      const replyContent =
        data.reply ||
        'I am here with you at **HOS|TED** (*HOS|TED Hosting Nations*). Please share your style preference, size, or Order ID and I will assist you right away!';

      const assistantMsg: ChatMessage = {
        id: `tessy-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedAll = [...nextHistory, assistantMsg];
      setMessages(updatedAll);
      if (onUserChatUpdated) {
        onUserChatUpdated(updatedAll);
      }
      if (data.updatedUser && onUserProfileSynced) {
        onUserProfileSynced(data.updatedUser);
      }
      if (Array.isArray(data.executedActions) && data.executedActions.length > 0) {
        setBrainActionBanner(data.executedActions.join(' · '));
        if (onStorefrontUpdated) {
          onStorefrontUpdated();
        }
      }
      speakResponse(replyContent);
    } catch (error: any) {
      const fallbackReply =
        `Welcome to **HOS|TED** (*HOS|TED Hosting Nations*), founded by **Theresa Isama**! ✨\n\n` +
        `I received your message: *"${userText}"*.\n\n` +
        `• **Collections & Custom Fit:** We craft regal **Silk Bubu Gowns** (from ₦50,000), **Sculpted Couture Ankara Gowns** (from ₦45,000), **Peplum Skirt & Blouse Sets** (from ₦38,000), and **Everyday Luxury Two-Pieces** (from ₦32,000).\n` +
        `• **Direct Atelier WhatsApp:** **+234 907 378 4461** (Theresa Isama).\n` +
        `• Tap any prompt below or tell me your **Bust, Waist, Hips, and Gown Length** to sync your bespoke fit!`;

      const fallbackMsg: ChatMessage = {
        id: `fallback-${Date.now()}`,
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakResponse(fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };

  handleSendRef.current = handleSend;

  if (!isOpen) return null;

  const hasCapturedAnyVoiceSpec = Boolean(
    accumulatedVoiceMeasurements.bust ||
      accumulatedVoiceMeasurements.waist ||
      accumulatedVoiceMeasurements.hips ||
      accumulatedVoiceMeasurements.shoulder ||
      accumulatedVoiceMeasurements.sleeveLength ||
      accumulatedVoiceMeasurements.outfitLength ||
      accumulatedVoiceMeasurements.styleCategory ||
      accumulatedVoiceMeasurements.size ||
      accumulatedVoiceMeasurements.color
  );

  const formatTimer = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end p-2 sm:p-5 bg-stone-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-stone-900 border border-amber-500/35 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] sm:h-[88vh] max-h-[820px]">
        {/* 1. Compact Header Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/40 border-b border-stone-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={ASSETS.tessyAvatar}
                alt="Tessy Ai"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400 shadow-md"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-stone-900 ${
                  isListening
                    ? 'bg-red-500 animate-ping'
                    : isSpeaking
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-emerald-500'
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-serif font-bold text-base text-white leading-tight">
                  Tessy Ai
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-500/30">
                  HOS|TED
                </span>
                {activeUser && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 truncate max-w-[130px]">
                    Hi, {activeUser.name.split(' ')[0]}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 truncate">
                {isListening
                  ? `Recording live voice (${formatTimer(recordingSeconds)})...`
                  : isTranscribing
                  ? 'Transcribing your voice...'
                  : isSpeaking
                  ? 'Speaking in Nigerian female voice...'
                  : 'Personal Fashion Stylist & Bespoke Concierge'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleSpeech}
              className={`p-2 rounded-xl border transition ${
                speechEnabled
                  ? 'bg-amber-400/15 border-amber-400/40 text-amber-300 hover:bg-amber-400/25'
                  : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
              }`}
              title={speechEnabled ? 'Mute Tessy Voice' : 'Unmute Tessy Voice'}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleResetChat}
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-400 hover:text-white border border-stone-700/70 transition"
              title="Reset Chat Conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-rose-950/60 text-stone-300 hover:text-rose-200 border border-stone-700/70 transition"
              title="Close Tessy Ai"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Compact Mode & Voice Tools Bar */}
        <div className="px-3.5 py-2 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleModeSwitch('stylist')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                mode === 'stylist'
                  ? 'bg-amber-400 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Stylist</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch('concierge')}
              className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                mode === 'concierge'
                  ? 'bg-amber-400 text-stone-950 shadow'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Order Concierge</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowVoiceTailoringStudio((v) => !v)}
            className={`py-1.5 px-2.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 border transition ${
              showVoiceTailoringStudio || hasCapturedAnyVoiceSpec
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            <Ruler className="w-3.5 h-3.5 text-amber-400" />
            <span>Measurements Pad</span>
            {showVoiceTailoringStudio ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Optional Collapsible Voice Measurements Pad (Closed by default so Chat Space stays wide & clean) */}
        {showVoiceTailoringStudio && (
          <div className="px-4 py-3 bg-stone-950/95 border-b border-amber-500/30 space-y-2.5 shrink-0 max-h-56 overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" />
                <span>Spoken Body Measurements & Fit Pad (Inches)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowVoiceTailoringStudio(false)}
                className="text-[11px] text-stone-400 hover:text-white"
              >
                Hide
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { key: 'bust', label: 'Bust', val: accumulatedVoiceMeasurements.bust, ph: '38' },
                { key: 'waist', label: 'Waist', val: accumulatedVoiceMeasurements.waist, ph: '31' },
                { key: 'hips', label: 'Hips', val: accumulatedVoiceMeasurements.hips, ph: '42' },
                { key: 'shoulder', label: 'Shoulder', val: accumulatedVoiceMeasurements.shoulder, ph: '16' },
                { key: 'sleeveLength', label: 'Sleeve', val: accumulatedVoiceMeasurements.sleeveLength, ph: '22' },
                { key: 'outfitLength', label: 'Length', val: accumulatedVoiceMeasurements.outfitLength, ph: '60' },
              ].map((slot) => (
                <div
                  key={slot.key}
                  className={`p-1.5 rounded-lg border text-center ${
                    slot.val
                      ? 'bg-emerald-950/40 border-emerald-500/40'
                      : 'bg-stone-900 border-stone-800'
                  }`}
                >
                  <span className="block text-[9px] uppercase text-stone-400 font-semibold">
                    {slot.label}
                  </span>
                  <input
                    type="text"
                    value={slot.val || ''}
                    placeholder={slot.ph}
                    onChange={(e) =>
                      setAccumulatedVoiceMeasurements((prev) => ({
                        ...prev,
                        [slot.key]: e.target.value,
                      }))
                    }
                    className="w-full bg-transparent text-center font-mono font-bold text-xs text-white focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-stone-400">
                Say e.g. <span className="text-amber-300">“Bust 38, Waist 31, Hips 42, Length 60”</span> or type above.
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSyncVoiceToBespokeForm(false)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[11px] flex items-center gap-1 transition"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Sync to Form</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSyncVoiceToBespokeForm(true)}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 font-semibold text-[11px] flex items-center gap-1 transition"
                >
                  <span>Send to Tessy</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {voiceSyncedNotice && (
              <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px]">
                {voiceSyncedNotice}
              </div>
            )}
          </div>
        )}

        {/* Synced Action Notification Banner */}
        {brainActionBanner && (
          <div className="px-4 py-2 bg-emerald-950/90 border-b border-emerald-500/40 flex items-center justify-between gap-2 text-xs text-emerald-200 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                <strong>Saved Live:</strong> {brainActionBanner}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBrainActionBanner('')}
              className="text-emerald-300 hover:text-white text-[10px] uppercase font-bold shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 3. Main Chatting Space (Generous, Clean & Well-Arranged Scrollable Area) */}
        <div className="flex-1 min-h-[280px] overflow-y-auto px-4 py-4 space-y-3.5 bg-stone-900/90">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[88%]">
                  {!isUser && (
                    <img
                      src={ASSETS.tessyAvatar}
                      alt="Tessy Ai"
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400 shrink-0 mb-1"
                    />
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md ${
                      isUser
                        ? 'bg-amber-400 text-stone-950 font-medium rounded-br-none'
                        : 'bg-stone-800/95 text-stone-100 border border-stone-700/80 rounded-bl-none'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-line break-words">{msg.content}</div>
                    ) : (
                      <div className="space-y-1.5 break-words">
                        {renderFormattedTessyReply(msg.content)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-stone-500 mt-1 px-2">{msg.timestamp}</span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-stone-400 text-xs pl-2">
              <img
                src={ASSETS.tessyAvatar}
                alt="Tessy thinking"
                className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400 animate-pulse"
              />
              <div className="bg-stone-800/90 border border-stone-700/80 rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center gap-2">
                <div className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-stone-300 text-xs">Tessy Ai is crafting your response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 4. Quick Suggested Prompts Strip */}
        <div className="px-3.5 py-2 bg-stone-950/90 border-t border-stone-800/80 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1.5 w-max">
            {QUICK_PROMPTS[mode].map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(prompt)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 hover:border-amber-500/40 transition whitespace-nowrap disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Active Live Voice Recording Bar (Appears when recording or transcribing) */}
        {(isListening || isTranscribing || micError) && (
          <div className="px-4 py-2.5 bg-stone-950 border-t border-amber-500/30 shrink-0 space-y-2">
            {isListening && (
              <div className="p-2.5 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-bold text-red-200">
                      Live Voice Recording ({formatTimer(recordingSeconds)})
                    </span>
                    {/* Live Audio Level Waveform */}
                    <div className="flex items-end gap-0.5 h-3.5 px-1">
                      {[0.35, 0.65, 1, 0.8, 0.5, 0.9, 0.45].map((mult, idx) => {
                        const barHeight = Math.max(
                          20,
                          Math.min(100, Math.round((voiceAudioLevel || 18) * mult))
                        );
                        return (
                          <span
                            key={idx}
                            className="w-1 bg-amber-400 rounded-full transition-all duration-75"
                            style={{ height: `${barHeight}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={stopAndSendVoice}
                      className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[11px] flex items-center gap-1 shadow transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>Stop & Send</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopVoiceToEdit}
                      className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-[11px] border border-stone-700 transition"
                    >
                      Stop to Edit
                    </button>
                    <button
                      type="button"
                      onClick={cancelVoiceRecording}
                      className="px-2 py-1 rounded-xl bg-stone-900 hover:bg-rose-950 text-stone-400 hover:text-rose-200 text-[11px] transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="text-xs text-amber-100 bg-stone-950/80 rounded-xl px-3 py-2 border border-stone-800 min-h-[34px] flex items-center">
                  {interimSpeech ? (
                    <span>“{interimSpeech}”</span>
                  ) : (
                    <span className="text-stone-400 italic">
                      Listening to your voice... speak naturally, then click Stop & Send.
                    </span>
                  )}
                </div>
              </div>
            )}

            {isTranscribing && (
              <div className="flex items-center gap-2 text-xs text-amber-300 px-2 py-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Transcribing your recorded voice for Tessy Ai...</span>
              </div>
            )}

            {micError && (
              <div className="flex items-center justify-between gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl px-3 py-2">
                <span>{micError}</span>
                <button
                  type="button"
                  onClick={() => setMicError('')}
                  className="text-[10px] uppercase font-bold text-rose-200 hover:text-white shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. Unified Bottom Input Bar (Voice Mic + Text Input + Send) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="p-3.5 bg-stone-950 border-t border-stone-800 flex items-center gap-2 shrink-0"
        >
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={isLoading || isTranscribing}
            className={`p-3 rounded-xl border transition shrink-0 flex items-center justify-center ${
              isListening
                ? 'bg-red-500 border-red-400 text-white animate-pulse shadow-lg shadow-red-500/30'
                : 'bg-stone-900 hover:bg-stone-800 border-amber-500/40 text-amber-400 hover:text-amber-300'
            }`}
            title={
              isListening
                ? 'Click to Stop & Send your voice recording'
                : 'Click to start live voice recording with Tessy Ai'
            }
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={isListening && interimSpeech ? interimSpeech : input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? 'Speaking live... click Stop & Send when done'
                : mode === 'stylist'
                ? 'Type a message or tap the mic to speak to Tessy Ai...'
                : 'Type your measurements, Order ID, or tap the mic...'
            }
            className="flex-1 min-w-0 bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500/60"
          />

          <button
            type="submit"
            disabled={(!input.trim() && !interimSpeech.trim()) || isLoading}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
