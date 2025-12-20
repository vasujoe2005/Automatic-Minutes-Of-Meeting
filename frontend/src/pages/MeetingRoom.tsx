import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Settings,
  Sparkles,
  Clock,
  Play,
  CheckCircle,
  Loader2,
  Hand,
  Users,
  Send,
  X
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface AgendaItem {
  id: number;
  title: string;
  order: number;
  status: string; // pending, in_progress, completed
  duration?: string;
}

interface Participant {
  id: string | number;
  name: string;
  avatar: string;
  isSelf: boolean;
  isMuted: boolean;
  isVideo: boolean;
  isHandRaised?: boolean;
}

interface ChatMessage {
  id: number;
  sender: string;
  message: string;
  time: string;
  isAI?: boolean;
}

export default function MeetingRoom() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false); // Pre-join screen state
  const [handRaised, setHandRaised] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isRecording, setIsRecording] = useState(false); // Used for Web Speech API toggle

  const recognitionRef = useRef<any>(null); // Type any as SpeechRecognition is experimental

  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState<string[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  // State Declarations
  const [meetingCode, setMeetingCode] = useState("unknown");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userName, setUserName] = useState("Guest");
  const [inputMessage, setInputMessage] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Media Stream (Camera/Mic)
  useEffect(() => {
    const initMedia = async () => {
      try {
        if (!streamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          streamRef.current = stream;
        }

        // Apply initial visual states based on React state (isMuted, isVideoOn)
        // Note: This effect runs on mount, states might change later
        // We handle dynamic toggling in separate effects/handlers
      } catch (err) {
        console.error("Error accessing media devices:", err);
        // toast.error("Could not access camera/microphone");
      }
    };

    // Only init if we are on the pre-join or joined
    initMedia();

    return () => {
      // Cleanup tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Update Media Tracks based on state
  useEffect(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => track.enabled = isVideoOn);

      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => track.enabled = !isMuted);

      // Attach to local video element if it exists in DOM
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }
    }
  }, [isVideoOn, isMuted, hasJoined, participants]); // Re-run when these change to ensure ref is attached if rendered




  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Get meeting code from URL params or fetch latest
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setMeetingCode(codeFromUrl);
      fetchMeetingDetails(codeFromUrl);
    } else {
      fetchLatestMeetingAgenda();
    }

    fetchUserInfo();
  }, [navigate, searchParams]);

  // Socket.IO Connection
  useEffect(() => {
    if (hasJoined && meetingCode !== "unknown" && userName) {
      // Connect to backend socket
      // Path must match backend mount point
      socketRef.current = io("/", {
        path: "/ws/socket.io",
        transports: ["websocket"],
      });

      const socket = socketRef.current;

      socket.on("connect", () => {
        console.log("Connected to Meeting Socket");
        toast.success("Connected to meeting server");

        socket.emit("join_meeting", {
          meeting_code: meetingCode,
          user_info: {
            name: userName,
            avatar: userName.charAt(0).toUpperCase(),
            isMuted,
            isVideo: isVideoOn
          }
        });
      });

      socket.on("user_joined", (data: any) => {
        console.log("User Joined:", data);
        toast.info(`${data.user_info.name} joined the meeting`);
        setParticipants(prev => {
          if (prev.find(p => p.id === data.sid)) return prev;
          return [...prev, {
            id: data.sid,
            name: data.user_info.name,
            avatar: data.user_info.avatar || "?",
            isSelf: false,
            isMuted: data.user_info.isMuted || false,
            isVideo: data.user_info.isVideo || true,
            isHandRaised: false
          }];
        });
      });

      socket.on("user_left", (data: any) => {
        toast.info(`User left the meeting`);
        setParticipants(prev => prev.filter(p => p.id !== data.sid));
      });

      socket.on("user_raised_hand", (data: any) => {
        toast.info(`${data.user_name} raised hand!`);
        setParticipants(prev => prev.map(p =>
          p.id === data.sid ? { ...p, isHandRaised: true } : p
        ));
        // Auto-lower after 5 seconds for visual effect or keep it? 
        // Let's keep it until they lower it or we have a mechanism? 
        // For simplicity, we just toggle it in UI mostly.
        setTimeout(() => {
          setParticipants(prev => prev.map(p =>
            p.id === data.sid ? { ...p, isHandRaised: false } : p
          ));
        }, 5000);
      });

      socket.on("new_message", (data: any) => {
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          sender: data.sender,
          message: data.message,
          time: data.time || new Date().toLocaleTimeString(),
          isAI: data.isAI
        }]);
      });

      socket.on("user_status_changed", (data: any) => {
        setParticipants(prev => prev.map(p =>
          p.id === data.sid ? { ...p, ...data.status } : p
        ));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [hasJoined, meetingCode, userName]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showChat]);


  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/v1/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserName(data.name || "Guest");
      }
    } catch (error) {
      console.error("Failed to fetch user info", error);
    }
  };

  const fetchMeetingDetails = async (code: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`/api/v1/meetings/${code}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const meeting = await res.json();
        setMeetingTitle(meeting.title || "");

        // Process Invitations into Participants List (Status: Invited/Offline)
        if (meeting.invitations) {
          const invitedParticipants: Participant[] = meeting.invitations.map((invite: any) => ({
            id: `invite-${invite.email}`,
            name: invite.email.split('@')[0], // Simple name extraction
            avatar: invite.email.charAt(0).toUpperCase(),
            isSelf: false,
            isMuted: true,
            isVideo: false,
            isHandRaised: false,
            status: 'invited' // custom field we can use or just imply by id
          }));
          // Prevent overwriting if socket already added some? 
          // Better to merge: existing socket participants take precedence
          setParticipants(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newInvites = invitedParticipants.filter(p => !existingIds.has(p.id));
            return [...prev, ...newInvites];
          });
        }

        // Fetch agenda for this meeting
        const agendaRes = await fetch(`/api/v1/meetings/${code}/agenda`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (agendaRes.ok) {
          const agendaData = await agendaRes.json();
          setAgendaItems(agendaData);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLatestMeetingAgenda = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/v1/meetings/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const meetings = await res.json();
        if (meetings.length > 0) {
          const latest = meetings[0];
          setMeetingCode(latest.meeting_code);
          setMeetingTitle(latest.title || "");

          const agendaRes = await fetch(`/api/v1/meetings/${latest.meeting_code}/agenda`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (agendaRes.ok) {
            const agendaData = await agendaRes.json();
            setAgendaItems(agendaData);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (itemId: number, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token || meetingCode === "unknown") return;

    try {
      const res = await fetch(`/api/v1/meetings/${meetingCode}/agenda/${itemId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setAgendaItems(prev => prev.map(item =>
          item.id === itemId ? { ...item, status: newStatus } : item
        ));
        // Could also emit socket event here to update agenda for everyone
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    // Optimistic update
    //   setChatMessages(prev => [...prev, {
    //       id: Date.now(),
    //       sender: userName,
    //       message: inputMessage,
    //       time: new Date().toLocaleTimeString(),
    //       isAI: false
    //   }]);

    if (socketRef.current) {
      socketRef.current.emit("send_message", {
        meeting_code: meetingCode,
        message: inputMessage,
        sender: userName,
        is_ai: false
      });
    }
    setInputMessage("");
  };

  const handleAISimulation = async () => {
    // This function mimics sending a transcript segment to AI for processing
    // In a real app, this would be triggered by STT
    const transcript = inputMessage || "Discussing project timeline.";
    if (!inputMessage) return;

    // Send as user message first
    handleSendMessage();

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/v1/ai/process_segment", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          meeting_code: meetingCode,
          transcript_text: transcript
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Emit AI response via socket so everyone sees it
        if (socketRef.current) {
          const aiResponse = `Start Assistant: Detected ${data.extracted_data?.action_items?.length || 0} actions.`;
          socketRef.current.emit("send_message", {
            meeting_code: meetingCode,
            message: aiResponse,
            sender: "AI Assistant",
            is_ai: true
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    if (socketRef.current) {
      if (newState) {
        socketRef.current.emit("raise_hand", {
          meeting_code: meetingCode,
          user_name: userName
        });
      }
    }
  };

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    if (socketRef.current) {
      socketRef.current.emit("update_status", {
        meeting_code: meetingCode,
        status: { isMuted: newState, isVideo: isVideoOn }
      });
    }
  };

  const toggleVideo = () => {
    const newState = !isVideoOn;
    setIsVideoOn(newState);
    if (socketRef.current) {
      socketRef.current.emit("update_status", {
        meeting_code: meetingCode,
        status: { isMuted: isMuted, isVideo: newState }
      });
    }
  };

  const handleJoin = () => {
    setHasJoined(true);
    // Initial self participant
    setParticipants([{
      id: "self",
      name: userName,
      avatar: userName.charAt(0).toUpperCase(),
      isSelf: true,
      isMuted,
      isVideo: isVideoOn
    }]);

    // Play a subtle sound?
  };

  // Handle Socket events including live transcript for others
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on("live_transcript", (data: any) => {
        // "data.sender_name: data.text"
        // SILENCED in Chat per request.
        // We could update a subtitle state here if desired:
        setLiveTranscript(`${data.sender_name}: ${data.text}`);
      });
    }
  }, [hasJoined]);

  // MediaRecorder Ref
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const activeItem = agendaItems.find(i => i.status === 'in_progress') || agendaItems.find(i => i.status === 'pending');

  const startLiveTranscription = () => {
    // 1. Speech Recognition (Text)
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) { // Only if supported, but recording can work without it too ideally
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLanguage;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        toast.success("Recording & Transcription Started 🎙️");
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Error", event.error);
        // Don't stop recording just because speech failed?
      };

      recognition.onend = () => {
        if (isRecording && recognitionRef.current) {
          try { recognition.start(); } catch (e) { }
        }
      };

      recognition.onresult = (event: any) => {
        // ... existing result logic ...
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalText = event.results[i][0].transcript;
            if (socketRef.current) {
              socketRef.current.emit("transcript_segment", {
                meeting_code: meetingCode,
                text: finalText,
                sender_name: userName,
                language: selectedLanguage,
                is_final: true
              });
            }
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setLiveTranscript(interimTranscript);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } else {
      toast.warning("Speech-to-Text not supported in this browser, but audio recording will work.");
      setIsRecording(true);
    }

    // 2. Audio Recording (Blob)
    if (streamRef.current) {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const a = document.createElement("a");
        a.href = audioUrl;
        a.download = `meeting-recording-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Recording downloaded!");
      };

      mediaRecorder.start();
    }
  };

  const stopLiveTranscription = () => {
    // Stop Speech
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop Recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    setIsRecording(false);
    toast.info("Recording Stopped");
  };

  const handleEndMeeting = async () => {
    if (!confirm("End meeting and generate minutes?")) return;

    stopLiveTranscription(); // Ensure recording stops and saves

    const token = localStorage.getItem("token");
    if (token) {
      toast.promise(
        fetch(`/api/v1/meetings/${meetingCode}/finalize`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        }),
        {
          loading: 'Generating Minutes of Meeting...',
          success: 'Meeting Finalized!',
          error: 'Failed to finalize meeting'
        }
      );
      // We wait a bit or just leave?
      // Ideally wait for the promise but toast.promise handles UI.
      // Let's await it to be sure.
      try {
        await fetch(`/api/v1/meetings/${meetingCode}/finalize`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (e) { console.error(e); }
    }

    if (socketRef.current) socketRef.current.disconnect();
    navigate("/dashboard");
  };

  const handleAskContext = async () => {
    if (meetingCode === "unknown") {
      toast.error("No valid meeting selected. Please start or join a meeting.");
      return;
    }

    toast.info("Asking AI...");

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/v1/ai/ask_ai", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          meeting_code: meetingCode,
          transcript_text: "Summarize the key points and decisions from the discussion so far." // Default query
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, {
          id: Date.now(),
          sender: "AI Assistant",
          message: data.answer,
          time: new Date().toLocaleTimeString(),
          isAI: true
        }]);
        toast.success("AI responded");
      } else {
        const err = await res.json();
        toast.error(`AI Error: ${err.detail || "Failed to respond"}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Error asking AI: Network or Server Error");
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Pre-join Screen
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 bg-gradient-primary rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-glow">
              <Video className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Ready to join?</h1>
            <p className="text-muted-foreground">{meetingTitle || `Meeting: ${meetingCode}`}</p>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden group">
              {isVideoOn ? (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <video
                    ref={localVideoRef}
                    muted
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                  <span className="text-2xl font-bold">{userName.charAt(0)}</span>
                </div>
              )}

              <div className="absolute bottom-4 flex gap-4">
                <Button
                  variant={isMuted ? "destructive" : "secondary"}
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className="rounded-full shadow-lg"
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  variant={isVideoOn ? "secondary" : "destructive"}
                  size="icon"
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className="rounded-full shadow-lg"
                >
                  {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Language Selector */}
              <div className="bg-muted/50 p-2 rounded-lg flex items-center justify-between border border-border/50">
                <span className="text-sm font-medium px-2">Speaking Language</span>
                <select
                  className="bg-transparent text-sm border-none focus:ring-0 cursor-pointer"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="hi">Hindi</option>
                  <option value="zh">Chinese</option>
                  <option value="ta">Tamil</option>
                </select>
              </div>

              <Button className="w-full h-12 text-lg font-medium shadow-glow" onClick={handleJoin}>
                Join Meeting
              </Button>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-accent" />
                <span>AI-Enhanced Experience Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Meeting Interface
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 border-b border-border/10 bg-card/30 backdrop-blur-md flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm md:text-base leading-tight">
              {meetingTitle || `Meeting: ${meetingCode}`}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="success" className="h-5 px-1.5 gap-1 shadow-glow-success">
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live
              </Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-accent/50 text-accent bg-accent/5 gap-1.5 py-1.5 hidden md:flex">
            <Sparkles className="h-3.5 w-3.5" />
            AI Assistant Active
          </Badge>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">

        {/* Video Grid */}
        <div className={`flex-1 p-4 transition-all duration-300 ${showChat ? 'mr-0' : ''}`}>
          <div className={`h-full grid ${participants.length <= 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'} gap-4 auto-rows-fr`}>
            {participants.map((p) => (
              <div key={p.id} className="relative group rounded-2xl overflow-hidden bg-card border border-white/5 shadow-xl">
                {(p as any).status === 'invited' ? (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                    <div className="h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-muted-foreground opacity-50">{p.avatar}</span>
                    </div>
                    <Badge variant="outline" className="text-muted-foreground border-white/10">Invited</Badge>
                  </div>
                ) : !p.isVideo ? (
                  <div className="absolute inset-0 bg-card flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-glow">
                      <span className="text-3xl font-bold text-white uppercase">{p.avatar}</span>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    {p.isSelf ? (
                      <video
                        ref={localVideoRef}
                        muted
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                    ) : (
                      <div className="w-full h-full bg-cover bg-center opacity-50" style={{ backgroundImage: `url('https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}')` }} />
                    )}
                  </div>
                )}

                {/* Indicators */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {p.isMuted && (
                    <div className="bg-destructive/90 p-1.5 rounded-full text-white shadow-lg backdrop-blur-sm">
                      <MicOff className="h-4 w-4" />
                    </div>
                  )}
                  {p.isHandRaised && (
                    <div className="bg-yellow-500/90 p-1.5 rounded-full text-white shadow-lg animate-bounce">
                      <Hand className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Name Label */}
                <div className="absolute bottom-4 left-4">
                  <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
                    {p.name} {p.isSelf && "(You)"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Controls Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl z-20">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="icon-lg"
            className="h-12 w-12 rounded-xl transition-all hover:scale-105"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            variant={isVideoOn ? "secondary" : "destructive"}
            size="icon-lg"
            className="h-12 w-12 rounded-xl transition-all hover:scale-105"
            onClick={toggleVideo}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Separator orientation="vertical" className="h-8 bg-border/20" />

          <Button
            variant={handRaised ? "default" : "ghost"}
            size="icon-lg"
            className={`h-12 w-12 rounded-xl transition-all hover:scale-105 ${handRaised ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}`}
            onClick={toggleHand}
          >
            <Hand className="h-5 w-5" />
          </Button>

          <Button
            variant={showParticipants ? "default" : "ghost"}
            size="icon-lg"
            className="h-12 w-12 rounded-xl"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users className="h-5 w-5" />
            {participants.length > 0 && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                {participants.length}
              </Badge>
            )}
          </Button>


          <Button
            variant={showChat ? "default" : "ghost"}
            size="icon-lg"
            className="h-12 w-12 rounded-xl"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          <Separator orientation="vertical" className="h-8 bg-border/20" />

          <Button
            variant={isRecording ? "destructive" : "secondary"}
            size="icon-lg"
            className={`h-12 w-12 rounded-xl transition-all hover:scale-105 ${isRecording ? 'animate-pulse' : ''}`}
            onClick={isRecording ? stopLiveTranscription : startLiveTranscription}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            <div className={`h-4 w-4 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`} />
          </Button>

          <Button
            variant="destructive"
            size="lg"
            className="h-12 px-6 rounded-xl font-medium"
            onClick={handleEndMeeting}
          >
            <PhoneOff className="h-5 w-5 mr-2" />
            End
          </Button>
        </div>

        {/* Right Sidebar (Chat & Agenda) */}
        {showChat && (
          <div className="w-96 border-l border-border/10 bg-card/30 backdrop-blur-xl flex flex-col transition-all duration-300 z-10 animate-in slide-in-from-right">
            <div className="flex items-center gap-1 p-1 border-b border-border/10">
              <Button variant="ghost" size="sm" className="flex-1 rounded-none border-b-2 border-primary text-primary font-medium">Chat</Button>
              <Button variant="ghost" size="sm" className="flex-1 rounded-none opacity-50">Agenda</Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.sender === userName ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 mb-1`}>
                      <span className="text-xs font-medium text-muted-foreground">{msg.sender}</span>
                      <span className="text-[10px] text-muted-foreground/60">{msg.time}</span>
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap ${msg.isAI
                      ? 'bg-accent/10 border border-accent/20 text-foreground'
                      : msg.sender === userName
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                      }`}>
                      {msg.isAI && (
                        <div className="flex items-center gap-1.5 text-accent text-xs font-semibold mb-1">
                          <Sparkles className="h-3 w-3" />
                          AI Assistant
                        </div>
                      )}
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/10 bg-background/40">
              <div className="relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message or asking AI..."
                  className="w-full bg-muted/50 border-none rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-1 focus:ring-primary/50 resize-none min-h-[50px] max-h-[100px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (inputMessage.startsWith('/ai')) {
                        handleAISimulation();
                      } else {
                        handleSendMessage();
                      }
                    }
                  }}
                />
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className={`h-8 w-8 text-accent hover:text-accent hover:bg-accent/10 transition-colors ${inputMessage.length > 0 ? 'text-primary' : ''}`}
                    onClick={handleAISimulation}
                    title="Send to AI Assistant"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="default"
                    className="h-8 w-8 rounded-lg"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Context / Catch-up Feature */}
            <div className="mt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs w-full text-muted-foreground hover:text-primary border-dashed"
                onClick={handleAskContext}
              >
                <Clock className="w-3 h-3 mr-1" />
                Catch me up on what missed
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Tip: Click the Sparkles icon to simulate AI processing.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
