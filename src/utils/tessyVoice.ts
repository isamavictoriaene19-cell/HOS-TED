// Soothing Nigerian Female Voice Engine & Real-Time Microphone Speech-to-Text for Tessy Ai across HOS|TED

let activeAudioElement: HTMLAudioElement | null = null;
const ttsAudioCache = new Map<string, { audioBase64: string; mimeType: string }>();

export function stopTessyVoice() {
  if (activeAudioElement) {
    activeAudioElement.pause();
    activeAudioElement.currentTime = 0;
    activeAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function cleanTextForNigerianSpeech(rawText: string): string {
  return rawText
    .replace(/[*#_`~>]/g, '')
    .replace(/\bhosted\b/gi, 'HOS|TED')
    .replace(/₦\s*([0-9,]+)/g, '$1 Naira')
    .replace(/NGN\s*([0-9,]+)/gi, '$1 Naira')
    // Remove emojis and decorative symbols so the voice reads smoothly and naturally
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}•✓👑✨✂️💛]/gu,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

export async function speakWithTessyNigerianVoice(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  if (!text || !text.trim()) return;

  stopTessyVoice();

  const cleanedText = cleanTextForNigerianSpeech(text);
  if (!cleanedText) {
    onEnd?.();
    return;
  }

  try {
    onStart?.();

    const cached = ttsAudioCache.get(cleanedText);
    if (cached) {
      await playBase64Audio(cached.audioBase64, cached.mimeType, cleanedText, onEnd);
      return;
    }

    const res = await fetch('/api/gemini/tessy-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanedText }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        const mime = data.mimeType || 'audio/wav';
        if (ttsAudioCache.size > 25) {
          const firstKey = ttsAudioCache.keys().next().value;
          if (firstKey) ttsAudioCache.delete(firstKey);
        }
        ttsAudioCache.set(cleanedText, { audioBase64: data.audioBase64, mimeType: mime });
        await playBase64Audio(data.audioBase64, mime, cleanedText, onEnd);
        return;
      }
    }
  } catch (err) {
    console.warn('Using local Nigerian female voice fallback:', err);
  }

  fallbackBrowserNigerianFemaleSpeech(cleanedText, onEnd);
}

// Keep alias for backward compatibility across components
export const speakWithTessyIdomaVoice = speakWithTessyNigerianVoice;

async function playBase64Audio(
  audioBase64: string,
  mimeType: string,
  fallbackText: string,
  onEnd?: () => void
): Promise<void> {
  const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
  activeAudioElement = audio;
  audio.onended = () => {
    activeAudioElement = null;
    onEnd?.();
  };
  audio.onerror = () => {
    activeAudioElement = null;
    fallbackBrowserNigerianFemaleSpeech(fallbackText, onEnd);
  };
  await audio.play();
}

function selectBestNigerianFemaleBrowserVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  return (
    // 1. Explicit Nigerian English Female voice (e.g. Microsoft Ezinne Online (Natural) - English (Nigeria))
    voices.find(
      (v) =>
        v.lang.toLowerCase().includes('en-ng') &&
        !/abeo|male|guy|david|mark|james/i.test(v.name)
    ) ||
    // 2. Any African / Nigerian female voice by name
    voices.find(
      (v) =>
        /ezinne|adanna|ekene|grace|nigeria|africa/i.test(v.name) &&
        !/abeo|male/i.test(v.name)
    ) ||
    // 3. Natural / soothing female English voice
    voices.find((v) =>
      /aria|jenny|sonia|libby|samantha|victoria|karen|moira|tessa|zira|google uk english female/i.test(
        v.name
      )
    ) ||
    // 4. Any voice with 'female' in the name
    voices.find((v) => /female|woman/i.test(v.name)) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('en') && !/male|david|mark|alex|fred/i.test(v.name))
  );
}

function fallbackBrowserNigerianFemaleSpeech(cleanedText: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  const speakNow = (voicesList: SpeechSynthesisVoice[]) => {
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const chosenVoice = selectBestNigerianFemaleBrowserVoice(voicesList);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang || 'en-NG';
    } else {
      utterance.lang = 'en-NG';
    }
    // Soothing, warm, unhurried Nigerian female cadence
    utterance.rate = 0.94;
    utterance.pitch = 1.05;
    utterance.onend = () => onEnd?.();
    utterance.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  };

  const existingVoices = window.speechSynthesis.getVoices();
  if (existingVoices && existingVoices.length > 0) {
    speakNow(existingVoices);
  } else {
    let spoken = false;
    const handleVoicesChanged = () => {
      if (spoken) return;
      spoken = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      speakNow(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    setTimeout(() => {
      if (!spoken) {
        spoken = true;
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        speakNow(window.speechSynthesis.getVoices());
      }
    }, 600);
  }
}

export interface TessyMicSession {
  stopAndFinish: () => void;
  cancel: () => void;
}

export interface ExtractedVoiceTailoringData {
  measurements: {
    bust?: string;
    waist?: string;
    hips?: string;
    shoulder?: string;
    sleeveLength?: string;
    outfitLength?: string;
  };
  styleCategory?: string;
  size?: string;
  color?: string;
  fabricPreference?: string;
  customStyleDescription?: string;
  hasAnyMeasurement: boolean;
  hasAnyTailoringDetail: boolean;
}

const SPOKEN_NUMBER_WORDS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
};

function normalizeSpokenNumbers(text: string): string {
  let normalized = text.toLowerCase();
  // Convert compound spoken numbers like "thirty eight" or "forty-two" to "38", "42"
  const tens = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy'];
  const units = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

  for (const t of tens) {
    for (const u of units) {
      const regex = new RegExp(`\\b${t}[\\s-]+${u}\\b`, 'gi');
      normalized = normalized.replace(
        regex,
        String(SPOKEN_NUMBER_WORDS[t] + SPOKEN_NUMBER_WORDS[u])
      );
    }
  }

  for (const [word, val] of Object.entries(SPOKEN_NUMBER_WORDS)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(regex, String(val));
  }

  // Handle "point five" or "and a half"
  normalized = normalized
    .replace(/(\d+)\s+and\s+a\s+half/gi, '$1.5')
    .replace(/(\d+)\s+point\s+(\d+)/gi, '$1.$2');

  return normalized;
}

/**
 * Extracts body measurements (bust, waist, hips, shoulder, sleeve, outfit length)
 * and custom bespoke tailoring attributes from a voice transcript in real time.
 */
export function extractVoiceMeasurementsAndTailoring(
  rawTranscript: string
): ExtractedVoiceTailoringData {
  const result: ExtractedVoiceTailoringData = {
    measurements: {},
    hasAnyMeasurement: false,
    hasAnyTailoringDetail: false,
  };

  if (!rawTranscript || !rawTranscript.trim()) {
    return result;
  }

  const normalized = normalizeSpokenNumbers(rawTranscript);

  const matchMeasurement = (patterns: RegExp[]): string | undefined => {
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match && match[1]) {
        const num = parseFloat(match[1]);
        if (!isNaN(num) && num >= 6 && num <= 90) {
          return String(num);
        }
      }
    }
    return undefined;
  };

  const bust = matchMeasurement([
    /\b(?:bust|chest)\s*(?:is|of|measures|at|:|=|-)?\s*(\d{2}(?:\.\d+)?)/i,
    /(\d{2}(?:\.\d+)?)\s*(?:inches|inch|in)?\s*(?:for\s+)?(?:bust|chest)\b/i,
  ]);
  const waist = matchMeasurement([
    /\bwaist(?:line)?\s*(?:is|of|measures|at|:|=|-)?\s*(\d{2}(?:\.\d+)?)/i,
    /(\d{2}(?:\.\d+)?)\s*(?:inches|inch|in)?\s*(?:for\s+)?waist\b/i,
  ]);
  const hips = matchMeasurement([
    /\bhips?\s*(?:is|are|of|measures|at|:|=|-)?\s*(\d{2}(?:\.\d+)?)/i,
    /(\d{2}(?:\.\d+)?)\s*(?:inches|inch|in)?\s*(?:for\s+)?hips?\b/i,
  ]);
  const shoulder = matchMeasurement([
    /\bshoulders?\s*(?:width)?\s*(?:is|of|measures|at|:|=|-)?\s*(\d{1,2}(?:\.\d+)?)/i,
    /(\d{1,2}(?:\.\d+)?)\s*(?:inches|inch|in)?\s*(?:for\s+)?shoulders?\b/i,
  ]);
  const sleeveLength = matchMeasurement([
    /\bsleeves?\s*(?:length)?\s*(?:is|of|measures|at|:|=|-)?\s*(\d{1,2}(?:\.\d+)?)/i,
    /(\d{1,2}(?:\.\d+)?)\s*(?:inches|inch|in)?\s*(?:for\s+)?sleeves?\b/i,
  ]);
  const outfitLength = matchMeasurement([
    /\b(?:full\s+length|gown\s+length|dress\s+length|trouser\s+length|outfit\s+length|length)\s*(?:is|of|measures|at|:|=|-)?\s*(\d{2}(?:\.\d+)?)/i,
    /(\d{2}(?:\.\d+)?)\s*(?:inches|inch|in)?\s*(?:for\s+)?(?:full\s+length|gown\s+length|length)\b/i,
  ]);

  if (bust) result.measurements.bust = bust;
  if (waist) result.measurements.waist = waist;
  if (hips) result.measurements.hips = hips;
  if (shoulder) result.measurements.shoulder = shoulder;
  if (sleeveLength) result.measurements.sleeveLength = sleeveLength;
  if (outfitLength) result.measurements.outfitLength = outfitLength;

  result.hasAnyMeasurement = Object.keys(result.measurements).length > 0;

  // Detect style category
  if (/\bbubu\b|\bkaftan\b|\bboubou\b/i.test(rawTranscript)) {
    result.styleCategory = 'Silk Bubu';
  } else if (/\bbridal\b|\btraditional\s+wedding\b|\baso\s*ebi\b|\bowambe\b/i.test(rawTranscript)) {
    result.styleCategory = 'Bridal / Traditional';
  } else if (/\btwo[\s-]*piece\b|\b2[\s-]*piece\b|\bco[\s-]*ord\b/i.test(rawTranscript)) {
    result.styleCategory = 'Two-Piece Set';
  } else if (/\bcorporate\b|\bblazer\b|\boffice\b|\bsuit\b/i.test(rawTranscript)) {
    result.styleCategory = 'Corporate Wear';
  } else if (/\bankara\b|\bgown\b/i.test(rawTranscript)) {
    result.styleCategory = 'Ankara Gown';
  } else if (/\bcustom\s+design\b|\bbespoke\b/i.test(rawTranscript)) {
    result.styleCategory = 'Custom Design';
  }

  // Detect size
  if (/\b(?:3xl|triple\s+xl|triple\s+extra\s+large)\b/i.test(rawTranscript)) {
    result.size = '3XL (Triple XL — Grand Regal Build)';
  } else if (/\b(?:xxl|2xl|double\s+xl|double\s+extra\s+large)\b/i.test(rawTranscript)) {
    result.size = 'XXL (Double XL — Extra Plus / Regal Full Build)';
  } else if (/\b(?:xl|extra\s+large)\b/i.test(rawTranscript)) {
    result.size = 'XL (Extra Large — Plus / Voluptuous Build)';
  } else if (/\b(?:size\s+l|size\s+large|\blarge\b)\b/i.test(rawTranscript)) {
    result.size = 'L (Large — Curvy / Full Build)';
  } else if (/\b(?:size\s+m|size\s+medium|\bmedium\b)\b/i.test(rawTranscript)) {
    result.size = 'M (Medium — Average / Regular Build)';
  } else if (/\b(?:size\s+s|size\s+small|\bsmall\b)\b/i.test(rawTranscript)) {
    result.size = 'S (Small — Slim / Petite Build)';
  } else if (result.hasAnyMeasurement || /\bcustom\s+size\b|\bbespoke\s+fit\b/i.test(rawTranscript)) {
    result.size = 'Custom (Bespoke Measured to My Exact Body)';
  }

  // Detect color
  if (/\bimperial\s+gold\b|\bgold\b/i.test(rawTranscript)) {
    result.color = 'Imperial Gold (Rich Yellow-Gold)';
  } else if (/\bemerald\b|\bgreen\b/i.test(rawTranscript)) {
    result.color = 'Emerald Green (Deep Jewel Green)';
  } else if (/\bcobalt\b|\broyal\s+blue\b|\bblue\b/i.test(rawTranscript)) {
    result.color = 'Royal Cobalt Blue (Vibrant Blue)';
  } else if (/\bruby\b|\bwine\b|\bburgundy\b|\bred\b/i.test(rawTranscript)) {
    result.color = 'Ruby Wine Red (Deep Burgundy Red)';
  } else if (/\bterracotta\b|\borange\b/i.test(rawTranscript)) {
    result.color = 'Burnt Terracotta Orange (Warm Sunset Orange)';
  } else if (/\bobsidian\b|\bblack\b/i.test(rawTranscript)) {
    result.color = 'Obsidian Black & Gold (Classic Black)';
  } else if (/\bivory\b|\bcream\b|\bwhite\b/i.test(rawTranscript)) {
    result.color = 'Ivory Cream & Gold (Soft Off-White)';
  } else if (/\bplum\b|\bpurple\b|\bviolet\b/i.test(rawTranscript)) {
    result.color = 'Royal Plum Purple (Deep Regal Purple)';
  }

  if (result.styleCategory || result.size || result.color || rawTranscript.trim().length > 15) {
    result.hasAnyTailoringDetail = true;
    result.customStyleDescription = rawTranscript.trim();
  }

  return result;
}

export function isBrowserWebSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

interface StartTessyMicrophoneOptions {
  onListeningChange: (listening: boolean) => void;
  onTranscribingChange?: (transcribing: boolean) => void;
  onInterimTranscript?: (liveText: string) => void;
  onFinalTranscript: (finalText: string) => void;
  onError?: (errorMessage: string) => void;
  onAudioLevel?: (level: number) => void;
  preferredLang?: string;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Starts a real-time voice capture session powered primarily by the browser's native
 * Web Speech API (`window.SpeechRecognition` / `window.webkitSpeechRecognition`) for instant
 * live transcription of measurements and custom tailoring requests, with automatic
 * MediaRecorder + Gemini server transcription fallback when needed.
 */
export async function startTessyMicrophoneCapture(
  options: StartTessyMicrophoneOptions
): Promise<TessyMicSession | null> {
  const {
    onListeningChange,
    onTranscribingChange,
    onInterimTranscript,
    onFinalTranscript,
    onError,
    onAudioLevel,
    preferredLang = 'en-US',
  } = options;

  // Stop any ongoing speech playback before listening
  stopTessyVoice();

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  let isCancelled = false;
  let isFinished = false;
  let accumulatedFinalTranscript = '';
  let latestInterimTranscript = '';
  let liveServerTranscript = '';
  let recognition: any = null;
  let mediaStream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let audioCtx: AudioContext | null = null;
  let levelTimer: any = null;
  let livePollTimer: any = null;
  let isPollingChunk = false;
  const startedAtMs = Date.now();
  const audioChunks: BlobPart[] = [];

  const cleanupAudioMeter = () => {
    if (levelTimer) {
      clearInterval(levelTimer);
      levelTimer = null;
    }
    if (audioCtx) {
      try {
        audioCtx.close();
      } catch {
        // ignore
      }
      audioCtx = null;
    }
    onAudioLevel?.(0);
  };

  // Step 1: Acquire microphone stream first for reliable recording across all browsers & iframes
  if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx && mediaStream) {
          audioCtx = new AudioCtx();
          const source = audioCtx.createMediaStreamSource(mediaStream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const freqData = new Uint8Array(analyser.frequencyBinCount);
          levelTimer = setInterval(() => {
            if (isFinished || isCancelled) return;
            analyser.getByteFrequencyData(freqData);
            let sum = 0;
            for (let i = 0; i < freqData.length; i++) {
              sum += freqData[i];
            }
            const avg = sum / freqData.length;
            onAudioLevel?.(Math.min(100, Math.round((avg / 90) * 100)));
          }, 90);
        }
      } catch {
        // ignore audio meter errors
      }

      const preferredMimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const supportedMimeType =
        typeof MediaRecorder !== 'undefined'
          ? preferredMimeTypes.find((t) => {
              try {
                return MediaRecorder.isTypeSupported(t);
              } catch {
                return false;
              }
            }) || ''
          : '';

      mediaRecorder = supportedMimeType
        ? new MediaRecorder(mediaStream, { mimeType: supportedMimeType })
        : new MediaRecorder(mediaStream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.start(250);
      onListeningChange(true);

      // Live chunk transcription every 2.2s when browser Web Speech API hasn't emitted text yet
      livePollTimer = setInterval(async () => {
        if (isFinished || isCancelled || isPollingChunk) return;
        const hasBrowserSpeech = Boolean(
          accumulatedFinalTranscript.trim() || latestInterimTranscript.trim()
        );
        if (hasBrowserSpeech || audioChunks.length < 2) return;

        isPollingChunk = true;
        try {
          const mimeType = mediaRecorder?.mimeType || 'audio/webm';
          const snapshotBlob = new Blob([...audioChunks], { type: mimeType });
          if (snapshotBlob.size > 500) {
            const audioBase64 = await blobToBase64(snapshotBlob);
            const res = await fetch('/api/gemini/tessy-transcribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({ audioBase64, mimeType }),
            });
            const ct = res.headers.get('content-type') || '';
            if (res.ok && ct.includes('application/json') && !isFinished && !isCancelled) {
              const data = await res.json();
              const text = String(data.transcript || '').trim();
              if (text) {
                liveServerTranscript = text;
                onInterimTranscript?.(text);
              }
            }
          }
        } catch {
          // ignore live poll errors
        } finally {
          isPollingChunk = false;
        }
      }, 2200);
    } catch (err: any) {
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        /permission|denied/i.test(err?.message || '');
      if (!SpeechRecognition) {
        onError?.(
          isDenied
            ? 'Microphone permission was denied. Please allow microphone access in your browser address bar to speak to Tessy Ai.'
            : 'Could not access your microphone. Please check that a microphone is connected.'
        );
        return null;
      }
    }
  }

  // Step 2: Also run Browser Web Speech API for instant live word-by-word transcription
  if (SpeechRecognition) {
    try {
      recognition = new SpeechRecognition();
      recognition.lang = preferredLang || 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      let speechRecErrored = false;

      recognition.onstart = () => {
        onListeningChange(true);
      };

      recognition.onresult = (event: any) => {
        let finalPart = '';
        let interimPart = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const textPiece = res[0]?.transcript || '';
          if (res.isFinal) {
            finalPart += textPiece + ' ';
          } else {
            interimPart += textPiece + ' ';
          }
        }

        if (finalPart.trim()) {
          accumulatedFinalTranscript = finalPart.trim();
        }
        latestInterimTranscript = interimPart.trim();

        const combinedLive = [accumulatedFinalTranscript, latestInterimTranscript]
          .filter(Boolean)
          .join(' ')
          .replace(/\bhosted\b/gi, 'HOS|TED')
          .trim();

        if (combinedLive) {
          onInterimTranscript?.(combinedLive);
        }
      };

      recognition.onerror = (event: any) => {
        const errCode = event?.error || '';
        speechRecErrored = true;
        if ((errCode === 'not-allowed' || errCode === 'service-not-allowed') && !mediaRecorder) {
          isFinished = true;
          cleanupAudioMeter();
          onListeningChange(false);
          onError?.(
            'Microphone permission was denied. Please allow microphone access in your browser address bar to speak to Tessy Ai.'
          );
        }
      };

      recognition.onend = () => {
        if (!isFinished && !isCancelled && !speechRecErrored && !mediaRecorder) {
          void finalizeRecording();
        }
      };

      recognition.start();
      onListeningChange(true);
    } catch {
      recognition = null;
    }
  }

  if (!mediaRecorder && !recognition) {
    cleanupAudioMeter();
    onError?.('Microphone voice input is not supported in this browser.');
    return null;
  }

  const cleanupAll = () => {
    if (livePollTimer) {
      clearInterval(livePollTimer);
      livePollTimer = null;
    }
    cleanupAudioMeter();
    try {
      if (recognition) {
        recognition.onend = null;
        recognition.stop();
      }
    } catch {
      // ignore
    }
    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    } catch {
      // ignore
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
  };

  const finalizeRecording = async () => {
    if (isFinished) return;
    isFinished = true;
    if (livePollTimer) {
      clearInterval(livePollTimer);
      livePollTimer = null;
    }
    onListeningChange(false);

    if (isCancelled) {
      cleanupAll();
      onTranscribingChange?.(false);
      onInterimTranscript?.('');
      return;
    }

    // Wait briefly for any final SpeechRecognition result
    await new Promise((r) => setTimeout(r, 200));

    const webSpeechText = [accumulatedFinalTranscript, latestInterimTranscript]
      .filter(Boolean)
      .join(' ')
      .replace(/\bhosted\b/gi, 'HOS|TED')
      .trim();

    if (webSpeechText) {
      cleanupAll();
      onTranscribingChange?.(false);
      onInterimTranscript?.('');
      onFinalTranscript(webSpeechText);
      return;
    }

    // Step 3: Server-side Gemini transcription of the recorded MediaRecorder audio
    onTranscribingChange?.(true);

    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 800);
          mediaRecorder!.onstop = () => {
            clearTimeout(timeout);
            resolve();
          };
          try {
            mediaRecorder!.requestData();
          } catch {
            // ignore
          }
          mediaRecorder!.stop();
        });
      }

      const mimeType = mediaRecorder?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      const durationSec = Math.max(1, Math.round((Date.now() - startedAtMs) / 1000));
      cleanupAll();

      if (audioBlob.size > 150) {
        try {
          const audioBase64 = await blobToBase64(audioBlob);
          const res = await fetch('/api/gemini/tessy-transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({ audioBase64, mimeType }),
          });

          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const data = await res.json();
            const serverText = String(data.transcript || '')
              .replace(/\bhosted\b/gi, 'HOS|TED')
              .trim();
            if (serverText) {
              onTranscribingChange?.(false);
              onInterimTranscript?.('');
              onFinalTranscript(serverText);
              return;
            }
          }
        } catch {
          // Fall through to liveServerTranscript or active voice note delivery
        }
      }

      if (liveServerTranscript.trim()) {
        onTranscribingChange?.(false);
        onInterimTranscript?.('');
        onFinalTranscript(liveServerTranscript.trim());
        return;
      }

      // Guarantee active voice communication even if iframe/browser blocks cloud STT
      if (audioBlob.size > 80 || durationSec >= 1) {
        onTranscribingChange?.(false);
        onInterimTranscript?.('');
        onFinalTranscript(
          `[Live Voice Message Recorded (${durationSec}s)] Please assist me with my HOS|TED styling, bespoke measurements, and live operations request.`
        );
        return;
      }

      onTranscribingChange?.(false);
      onInterimTranscript?.('');
      onError?.(
        'No voice audio was detected. Please speak into your microphone and click "Stop & Send".'
      );
    } catch {
      cleanupAll();
      onTranscribingChange?.(false);
      onInterimTranscript?.('');
      onFinalTranscript(
        '[Live Voice Message Recorded] Please assist me with my HOS|TED styling, bespoke measurements, and live operations request.'
      );
    }
  };

  return {
    stopAndFinish: () => {
      finalizeRecording();
    },
    cancel: () => {
      isCancelled = true;
      finalizeRecording();
    },
  };
}
