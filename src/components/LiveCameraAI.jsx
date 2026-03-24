import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Video, X, Sparkles, Mic, MicOff, Camera, Radio, Loader2, AlertTriangle, CheckCircle2, Play, Square, Volume2, Star, Lightbulb } from 'lucide-react';

/**
 * LiveCameraAI - Zaawansowany komponent do analizy problemów przez kamerę w czasie rzeczywistym
 * 
 * Funkcjonalności:
 * - Live feed z kamery
 * - Continuous streaming - automatyczna analiza co kilka sekund
 * - Multi-frame analysis - analiza sekwencji klatek
 * - AR overlays - nakładanie instrukcji na obraz z kamery
 * - Provider matching - automatyczne dopasowanie wykonawców
 * - Voice input & output
 * - Text-to-speech odpowiedzi AI
 */
export default function LiveCameraAI({ open, onClose, onAnalyzeComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Debug
  useEffect(() => {
    if (open) {
      console.log('📹 LiveCameraAI opened, open prop:', open);
    }
  }, [open]);
  
  const [isActive, setIsActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceInput, setVoiceInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [description, setDescription] = useState('');
  
  // Continuous streaming
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamInterval, setStreamInterval] = useState(5); // sekundy
  const streamingIntervalRef = useRef(null);
  
  // Multi-frame analysis
  const [frameBuffer, setFrameBuffer] = useState([]);
  const [maxFrames] = useState(5); // Maksymalna liczba klatek w buforze
  const [multiFrameResult, setMultiFrameResult] = useState(null);
  
  // AR Overlays
  const [showAROverlays, setShowAROverlays] = useState(true);
  const [arInstructions, setArInstructions] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  
  // Provider matching
  const [matchedProviders, setMatchedProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  
  // Text-to-speech
  const synthRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastAnalysisRef = useRef(null);

  // Geolokalizacja
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
          });
        },
        () => console.warn('Geolocation not available')
      );
    }
  }, []);

  // Nie uruchamiamy kamery automatycznie – przeglądarki wymagają gestu użytkownika (kliknięcia) dla getUserMedia.
  // Użytkownik klika "Włącz kamerę", wtedy startCamera() ma prawidłowy user gesture.
  useEffect(() => {
    if (!open && isActive) {
      stopCamera();
    }
    return () => {
      if (!open) {
        stopCamera();
        stopStreaming();
      }
    };
  }, [open]);

  // Inicjalizacja Web Speech API
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pl-PL';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceInput(transcript);
        setDescription(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Rysowanie AR overlays
  useEffect(() => {
    if (!showAROverlays || !overlayCanvasRef.current || !videoRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    const drawOverlays = () => {
      if (!video.videoWidth || !video.videoHeight) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Rysuj instrukcje AR
      arInstructions.forEach((instruction, idx) => {
        const { x, y, text, type } = instruction;
        
        // Tło dla tekstu
        ctx.fillStyle = type === 'danger' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(99, 102, 241, 0.8)';
        ctx.fillRect(x - 10, y - 25, text.length * 8 + 20, 30);
        
        // Tekst
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(text, x, y);
        
        // Strzałka wskazująca
        if (type === 'instruction') {
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y + 5);
          ctx.lineTo(x, y + 20);
          ctx.lineTo(x - 5, y + 15);
          ctx.moveTo(x, y + 20);
          ctx.lineTo(x + 5, y + 15);
          ctx.stroke();
        }
      });
    };
    
    const interval = setInterval(drawOverlays, 100);
    return () => clearInterval(interval);
  }, [showAROverlays, arInstructions]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Twoja przeglądarka nie obsługuje dostępu do kamery. Użyj nowszej przeglądarki lub HTTPS.');
      }

      // Najpierw minimalne wymagania – największa szansa na działanie (NotReadableError często przy 1280x720)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      } catch (simpleError) {
        console.warn('getUserMedia(video: true) failed:', simpleError);
        throw simpleError;
      }
      
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.style.display = 'block';
        video.style.visibility = 'visible';
        try {
          await video.play();
        } catch (playErr) {
          console.warn('video.play() failed:', playErr);
        }
        // Czekaj na pierwszy obraz (wymiary > 0), max 3 s
        await new Promise((resolve) => {
          if (video.videoWidth > 0) {
            resolve();
            return;
          }
          const onReady = () => {
            video.removeEventListener('loadeddata', onReady);
            video.removeEventListener('loadedmetadata', onReady);
            video.removeEventListener('error', onErr);
            resolve();
          };
          const onErr = () => {
            video.removeEventListener('loadeddata', onReady);
            video.removeEventListener('loadedmetadata', onReady);
            video.removeEventListener('error', onErr);
            resolve();
          };
          video.addEventListener('loadeddata', onReady);
          video.addEventListener('loadedmetadata', onReady);
          video.addEventListener('error', onErr);
          setTimeout(resolve, 3000);
        });
        // Jeśli po oczekiwaniu nadal brak wymiarów – kamera nie zwraca obrazu
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          stream.getTracks().forEach(t => t.stop());
          streamRef.current = null;
          video.srcObject = null;
          setCameraError('Kamera nie zwraca obrazu. Zamknij inne programy używające kamery (Teams, Zoom, Skype) i spróbuj ponownie.');
          setIsActive(false);
          return;
        }
      }
      setIsActive(true);
      setCameraError(null);
    } catch (error) {
      console.error('Camera error:', error);
      let errorMessage = 'Nie można uzyskać dostępu do kamery.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Odmówiono dostępu do kamery. Kliknij ikonę kłódki w pasku adresu i zezwól na dostęp do kamery.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'Nie znaleziono kamery. Sprawdź czy kamera jest podłączona i włączona.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Nie można uruchomić kamery. Zamknij inne programy (Teams, Zoom, Skype, inne karty z kamerą) i spróbuj ponownie.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Kamera nie obsługuje wymaganych ustawień. Spróbuj innej przeglądarki (Chrome, Edge).';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCameraError(errorMessage);
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    stopStreaming();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const speak = (text) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pl-PL';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const startVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj Chrome, Edge lub Safari.');
      return;
    }
    
    try {
      // Sprawdź czy już nagrywamy
      if (isRecording) {
        stopVoiceInput();
        return;
      }
      
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Speech recognition start error:', error);
      if (error.name === 'InvalidStateError') {
        // Recognition już działa lub jest w trakcie zatrzymywania
        console.log('Recognition already running or stopping');
      } else {
        alert(`Błąd rozpoznawania mowy: ${error.message || 'Nieznany błąd'}`);
      }
      setIsRecording(false);
    }
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Analiza pojedynczej klatki
  const analyzeFrame = async (imageData, isMultiFrame = false) => {
    try {
      // Konwersja base64 do blob
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('files', blob, 'camera-capture.jpg');
      
      const token = localStorage.getItem('token');
      const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/ai/concierge/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Błąd przesyłania obrazu');
      }
      
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.files?.[0]?.url || uploadData.attachments?.[0]?.url;
      
      if (!imageUrl) {
        throw new Error('Nie otrzymano URL obrazu z serwera');
      }
      
      // Analiza z AI
      const fullDescription = description.trim() || 
        (voiceInput ? `Pokazuję: ${voiceInput}` : 'Zobacz co to jest i pomóż mi to naprawić.');
      
      const analyzeRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/ai/concierge/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: fullDescription,
          imageUrls: [imageUrl],
          urgency: 'normal',
          lat: userLocation?.lat,
          lon: userLocation?.lon
        })
      });
      
      if (!analyzeRes.ok) {
        const errorData = await analyzeRes.json();
        throw new Error(errorData.message || 'Błąd analizy AI');
      }
      
      const result = await analyzeRes.json();
      
      // Aktualizuj AR overlays
      if (result.diySteps && result.diySteps.length > 0) {
        const instructions = result.diySteps.slice(0, 3).map((step, idx) => ({
          x: 50,
          y: 100 + (idx * 40),
          text: step.substring(0, 30) + '...',
          type: 'instruction'
        }));
        
        if (result.dangerFlags && result.dangerFlags.length > 0) {
          instructions.push({
            x: 50,
            y: 50,
            text: '⚠️ UWAGA: Zagrożenie!',
            type: 'danger'
          });
        }
        
        setArInstructions(instructions);
      }
      
      // Provider matching
      if (result.serviceCandidate?.code && userLocation) {
        loadMatchedProviders(result.serviceCandidate.code, userLocation);
      }
      
      return result;
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  };

  // Multi-frame analysis
  const analyzeMultiFrame = async () => {
    if (frameBuffer.length < 2) return;
    
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Przygotuj wszystkie klatki
      for (let i = 0; i < frameBuffer.length; i++) {
        const base64Data = frameBuffer[i].split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        formData.append('files', blob, `frame-${i}.jpg`);
      }
      
      // Upload wszystkich klatek
      const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/ai/concierge/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Błąd przesyłania klatek');
      
      const uploadData = await uploadRes.json();
      const imageUrls = uploadData.files?.map(f => f.url) || [];
      
      // Analiza sekwencji
      const analyzeRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/ai/concierge/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: description || 'Analizuję sekwencję klatek z kamery. Zidentyfikuj problem i zaproponuj rozwiązanie.',
          imageUrls: imageUrls,
          urgency: 'normal',
          lat: userLocation?.lat,
          lon: userLocation?.lon
        })
      });
      
      if (!analyzeRes.ok) throw new Error('Błąd analizy sekwencji');
      
      const result = await analyzeRes.json();
      setMultiFrameResult(result);
      
      if (result.serviceCandidate?.code && userLocation) {
        loadMatchedProviders(result.serviceCandidate.code, userLocation);
      }
      
    } catch (error) {
      console.error('Multi-frame analysis error:', error);
      alert(`Błąd: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Provider matching
  const loadMatchedProviders = async (serviceCode, location) => {
    setLoadingProviders(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/search/providers?service=${serviceCode}&lat=${location.lat}&lon=${location.lon}&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        setMatchedProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Provider matching error:', error);
    } finally {
      setLoadingProviders(false);
    }
  };

  // Continuous streaming
  const startStreaming = () => {
    if (!isActive || isStreaming) return;
    if (videoRef.current && (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0)) {
      alert('Obraz z kamery nie jest jeszcze gotowy. Poczekaj chwilę aż pojawi się podgląd.');
      return;
    }
    
    setIsStreaming(true);
    streamingIntervalRef.current = setInterval(async () => {
      try {
        const frame = captureFrame();
        if (!frame) return;
        
        // Dodaj do bufora multi-frame
        setFrameBuffer(prev => {
          const newBuffer = [...prev, frame];
          return newBuffer.slice(-maxFrames);
        });
        
        // Analizuj klatkę (tylko jeśli nie analizujemy już)
        if (!isAnalyzing) {
          setIsAnalyzing(true);
          try {
            const result = await analyzeFrame(frame, true);
            
            // Porównaj z poprzednią analizą (żeby nie mówić tego samego)
            const resultKey = result.serviceCandidate?.code || '';
            if (resultKey !== lastAnalysisRef.current) {
              lastAnalysisRef.current = resultKey;
              
              if (result.serviceCandidate) {
                const voiceText = `Widzę problem związany z ${result.serviceCandidate.name}. ${result.selfHelp?.[0]?.substring(0, 50) || ''}`;
                speak(voiceText);
              }
              
              setAnalysisResult(result);
            }
          } catch (error) {
            console.error('Streaming analysis error:', error);
          } finally {
            setIsAnalyzing(false);
          }
        }
      } catch (error) {
        console.error('Streaming error:', error);
      }
    }, streamInterval * 1000);
  };

  const stopStreaming = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setIsStreaming(false);
  };

  const analyzeWithAI = async () => {
    if (!isActive) {
      alert('Najpierw włącz kamerę (kliknij „Włącz kamerę”).');
      return;
    }
    if (videoRef.current && (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0)) {
      alert('Obraz z kamery nie jest jeszcze gotowy. Poczekaj chwilę aż pojawi się podgląd.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const imageData = captureFrame();
      if (!imageData) {
        throw new Error('Nie udało się przechwycić obrazu. Upewnij się, że widać podgląd z kamery.');
      }
      
      setCapturedImage(imageData);
      const result = await analyzeFrame(imageData);
      setAnalysisResult(result);
      
      const voiceText = result.serviceCandidate 
        ? `Widzę problem związany z ${result.serviceCandidate.name}. ${result.selfHelp?.[0] || 'Mogę pomóc znaleźć wykonawcę w Twojej okolicy.'}`
        : 'Analizuję problem. Za chwilę otrzymasz szczegółowe informacje.';
      
      speak(voiceText);
      
      if (onAnalyzeComplete) {
        onAnalyzeComplete(result);
      }
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Błąd: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createOrderFromAnalysis = () => {
    const result = analysisResult || multiFrameResult;
    if (!result) return;
    
    const orderData = {
      description: description || 'Problem wykryty przez AI Camera',
      service: result.serviceCandidate?.code,
      urgency: result.urgency || 'normal',
      imageUrl: capturedImage,
      recommendedProviders: matchedProviders
    };
    
    navigate('/create-order', { 
      state: { 
        prefill: orderData,
        fromCamera: true 
      } 
    });
    
    if (onClose) onClose();
  };

  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col relative z-50"
      >
        {/* Header - spójny z AI Concierge */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white text-lg">AI Camera Assistant</div>
              <div className="text-xs text-white/80">
                {isStreaming ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    Analiza w czasie rzeczywistym
                  </span>
                ) : (
                  'Pokaż problem, a AI pomoże'
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Camera View with AR Overlay */}
          <div className="flex-1 bg-black relative flex items-center justify-center min-h-[400px]">
            {cameraError ? (
              <div className="text-white text-center p-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="text-lg">{cameraError}</p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2 mx-auto"
                >
                  <Camera className="w-4 h-4" />
                  Spróbuj ponownie
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain absolute inset-0"
                  style={{ zIndex: 1 }}
                />
                <canvas ref={canvasRef} className="hidden" />
                {showAROverlays && (
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 2 }}
                  />
                )}
                
                {!isActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 gap-4 p-4">
                    <p className="text-white/90 text-center text-sm max-w-sm">
                      Kliknij poniżej, aby włączyć kamerę. Przeglądarka poprosi o zgodę na dostęp.
                    </p>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold z-30 flex items-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Włącz kamerę
                    </button>
                  </div>
                )}
                
                {isActive && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 items-center">
                    {/* Streaming toggle */}
                    <button
                      onClick={isStreaming ? stopStreaming : startStreaming}
                      className={`px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 ${
                        isStreaming 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isStreaming ? (
                        <>
                          <Square className="w-4 h-4" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Stream
                        </>
                      )}
                    </button>
                    
                    {/* Single capture */}
                    <button
                      onClick={analyzeWithAI}
                      disabled={isAnalyzing}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-semibold flex items-center gap-2"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analizuję...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Analizuj
                        </>
                      )}
                    </button>
                    
                    {/* AR toggle */}
                    <button
                      onClick={() => setShowAROverlays(!showAROverlays)}
                      className={`px-4 py-2 rounded-xl font-semibold ${
                        showAROverlays 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-600 text-white'
                      }`}
                    >
                      AR {showAROverlays ? 'ON' : 'OFF'}
                    </button>
                  </div>
                )}
                
                {/* Streaming indicator */}
                {isStreaming && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Streaming ({streamInterval}s)
                  </div>
                )}
              </>
            )}
          </div>

          {/* Control Panel */}
          <div className="w-full md:w-96 bg-gray-50 p-4 overflow-y-auto flex flex-col gap-4">
            {/* Przyciski akcji – widoczne w panelu po prawej */}
            {isActive && (
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-medium mb-3">Akcje kamery</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={isStreaming ? stopStreaming : startStreaming}
                    className={`px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm ${
                      isStreaming ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isStreaming ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isStreaming ? 'Stop' : 'Stream'}
                  </button>
                  <button
                    type="button"
                    onClick={analyzeWithAI}
                    disabled={isAnalyzing}
                    className="px-4 py-2 rounded-xl font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    {isAnalyzing ? 'Analizuję...' : 'Analizuj'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAROverlays(!showAROverlays)}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                      showAROverlays ? 'bg-purple-600 text-white' : 'bg-gray-600 text-white'
                    }`}
                  >
                    AR {showAROverlays ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}

            {/* Streaming Controls */}
            {isActive && (
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-medium mb-2">Częstotliwość analizy (sekundy)</label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={streamInterval}
                  onChange={(e) => {
                    setStreamInterval(Number(e.target.value));
                    if (isStreaming) {
                      stopStreaming();
                      setTimeout(startStreaming, 100);
                    }
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>2s</span>
                  <span>{streamInterval}s</span>
                  <span>10s</span>
                </div>
              </div>
            )}

            {/* Multi-frame Analysis */}
            {frameBuffer.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Bufor klatek: {frameBuffer.length}/{maxFrames}</p>
                  <button
                    onClick={analyzeMultiFrame}
                    disabled={isAnalyzing || frameBuffer.length < 2}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Analizuj sekwencję
                  </button>
                </div>
                <button
                  onClick={() => setFrameBuffer([])}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Wyczyść bufor
                </button>
              </div>
            )}

            {/* Voice Input */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <label className="block text-sm font-medium mb-2">Opisz problem (głosowo lub tekstowo)</label>
              
              <div className="flex gap-2 mb-2">
                <button
                  onClick={isRecording ? stopVoiceInput : startVoiceInput}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isRecording 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-4 h-4" />
                      Zatrzymaj
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Nagraj
                    </>
                  )}
                </button>
              </div>
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opisz problem lub użyj nagrywania głosowego..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                rows={3}
              />
              
              {voiceInput && (
                <p className="text-xs text-gray-500 mt-1">Rozpoznano: {voiceInput}</p>
              )}
            </div>

            {/* Analysis Result */}
            <AnimatePresence>
              {(isAnalyzing || isStreaming) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                    <p className="text-sm text-gray-600">
                      {isStreaming ? 'AI analizuje w czasie rzeczywistym...' : 'AI analizuje obraz...'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {(analysisResult || multiFrameResult) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-xl p-4 border border-gray-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Wynik analizy</h3>
                    {isSpeaking && (
                      <span className="text-xs text-indigo-600 flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        Mówi...
                      </span>
                    )}
                  </div>
                  
                  {(analysisResult || multiFrameResult)?.serviceCandidate && (
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="text-xs text-indigo-600 font-medium mb-1">Sugerowana usługa</p>
                      <p className="font-semibold">{(analysisResult || multiFrameResult).serviceCandidate.name}</p>
                    </div>
                  )}
                  
                  {(analysisResult || multiFrameResult)?.selfHelp && (analysisResult || multiFrameResult).selfHelp.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Kroki DIY:</p>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {(analysisResult || multiFrameResult).selfHelp.slice(0, 3).map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-600">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {(analysisResult || multiFrameResult)?.dangerFlags && (analysisResult || multiFrameResult).dangerFlags.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-800" />
                        <p className="text-sm font-medium text-red-800">Uwaga!</p>
                      </div>
                      <p className="text-xs text-red-600">
                        Wykryto potencjalne zagrożenie. Zalecamy kontakt z fachowcem.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={createOrderFromAnalysis}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                      Utwórz zlecenie
                    </button>
                    <button
                      onClick={() => speak((analysisResult || multiFrameResult)?.selfHelp?.[0] || 'Analiza zakończona.')}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center"
                      title="Powtórz odpowiedź"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Matched Providers */}
            {matchedProviders.length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-lg mb-2">Dopasowani wykonawcy</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {matchedProviders.slice(0, 3).map((provider) => (
                    <div key={provider._id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-semibold">
                        {provider.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{provider.name}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{provider.averageRating?.toFixed(1) || '—'}</span>
                          <span>•</span>
                          <span>{provider.location || '—'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4" />
                <p className="font-medium">Funkcje zaawansowane</p>
              </div>
              <p className="mb-2 text-blue-700">Użyj przycisków „Akcje kamery” u góry panelu:</p>
              <ul className="space-y-1.5 ml-6">
                <li className="list-disc"><strong>Stream</strong> – automatyczna analiza co {streamInterval} s</li>
                <li className="list-disc"><strong>Analizuj</strong> – analiza pojedynczej klatki lub sekwencji</li>
                <li className="list-disc"><strong>AR ON/OFF</strong> – instrukcje nakładane na obraz</li>
                <li className="list-disc">Provider Matching – automatyczne dopasowanie wykonawców po analizie</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Renderuj przez Portal, aby być nad wszystkimi modalami
  return createPortal(modalContent, document.body);
}
