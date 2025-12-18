import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  id: number;
  name: string;
  avatar: string;
  isSelf: boolean;
  isMuted: boolean;
  isVideo: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [meetingCode, setMeetingCode] = useState("unknown");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userName, setUserName] = useState("You");

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

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/v1/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserName(data.name || "You");
        // Set initial participant (yourself)
        setParticipants([
          { id: 1, name: data.name || "You", avatar: data.name?.charAt(0) || "Y", isSelf: true, isMuted: false, isVideo: true }
        ]);
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

      // Get List of Meetings to find the latest
      const res = await fetch("/api/v1/meetings/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const meetings = await res.json();
        if (meetings.length > 0) {
          const latest = meetings[0];
          setMeetingCode(latest.meeting_code);
          setMeetingTitle(latest.title || "");

          // Get Agenda for that meeting
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
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTranscriptSubmit = async (text: string) => {
    const token = localStorage.getItem("token");
    if (!token || meetingCode === "unknown") return;

    // Add user message to chat
    const newMessage: ChatMessage = {
      id: Date.now(),
      sender: userName,
      message: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMessage]);

    try {
      const res = await fetch("/api/v1/ai/process_segment", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          meeting_code: meetingCode,
          transcript_text: text
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log("AI Processed:", data);

        // Add AI response to chat
        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          sender: "AI Assistant",
          message: `Extracted: ${data.extracted_data?.action_items?.length || 0} Actions, ${data.extracted_data?.decisions?.length || 0} Decisions`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAI: true
        };
        setChatMessages(prev => [...prev, aiMessage]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEndMeeting = () => {
    navigate("/dashboard");
  };

  const activeItem = agendaItems.find(i => i.status === 'in_progress') || agendaItems.find(i => i.status === 'pending');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Video className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold text-background">MeetFlow</span>
          </div>
          <div className="h-6 w-px bg-border/30" />
          <div>
            <h1 className="text-background font-medium">
              {meetingTitle || `Meeting: ${meetingCode}`}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="success" className="text-xs">Live</Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {activeItem ? `Current: ${activeItem.title}` : "Meeting in progress"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="accent" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI Recording
          </Badge>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-background">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className={`h-full grid ${participants.length <= 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
            {participants.length === 0 ? (
              <div className="flex items-center justify-center text-muted-foreground">
                <p>Waiting for participants...</p>
              </div>
            ) : (
              participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`relative rounded-2xl overflow-hidden ${participant.isVideo ? "bg-muted/20" : "bg-secondary/20"
                    } flex items-center justify-center`}
                >
                  {participant.isVideo ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gradient-primary flex items-center justify-center">
                      <span className="font-display text-3xl font-bold text-primary-foreground">
                        {participant.avatar}
                      </span>
                    </div>
                  )}

                  {/* Participant overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground">
                        {participant.name} {participant.isSelf && "(You)"}
                      </Badge>
                      {participant.isMuted && (
                        <div className="h-6 w-6 rounded-full bg-destructive/80 flex items-center justify-center">
                          <MicOff className="h-3 w-3 text-destructive-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-border/20 bg-card/5 flex flex-col">
          {/* Agenda Panel */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border/20">
              <h3 className="text-sm font-semibold text-background flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Meeting Agenda
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {agendaItems.length === 0 && <p className="text-sm text-muted-foreground">No agenda items defined.</p>}

              {agendaItems.map((item) => {
                const isCurrent = item.status === 'in_progress';
                const isCompleted = item.status === 'completed';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border transition-all ${isCurrent
                      ? "bg-primary/10 border-primary/50"
                      : isCompleted
                        ? "bg-background/5 border-transparent opacity-60"
                        : "bg-transparent border-border/10 text-muted-foreground"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-sm font-medium ${isCurrent ? "text-primary" : "text-background"}`}>
                        {item.title}
                      </span>
                      {isCompleted && <CheckCircle className="h-4 w-4 text-success" />}
                      {isCurrent && <Badge variant="default" className="text-[10px] h-5">Active</Badge>}
                    </div>

                    {/* Controls for current item */}
                    {!isCompleted && (
                      <div className="mt-2 flex gap-2">
                        {isCurrent ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs w-full bg-background/10 border-border/20 hover:bg-success/20 hover:text-success"
                            onClick={() => handleStatusChange(item.id, 'completed')}
                          >
                            Mark Done
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs w-full hover:bg-primary/20 hover:text-primary"
                            onClick={() => handleStatusChange(item.id, 'in_progress')}
                          >
                            <Play className="h-3 w-3 mr-1" /> Start
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Chat Toggle Area */}
            <div className="p-4 border-t border-border/20">
              <Button variant="secondary" className="w-full justify-start gap-2" onClick={() => setShowChat(!showChat)}>
                <MessageSquare className="h-4 w-4" />
                {showChat ? "Hide Chat" : "Show Chat"}
              </Button>
            </div>
            {showChat && (
              <div className="h-1/3 border-t border-border/20 p-2 overflow-y-auto bg-background/5">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No messages yet</p>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className={`mb-2 p-2 rounded text-xs ${msg.isAI ? 'bg-accent/20 text-accent' : 'bg-background/10 text-muted-foreground'}`}>
                      <strong>{msg.sender}: </strong> {msg.message}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Simulation Input */}
            <div className="p-3 border-t border-border/20 bg-muted/20">
              <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">AI Simulator</p>
              <div className="flex gap-2">
                <input
                  id="transcript-input"
                  className="flex-1 bg-background text-xs text-foreground p-2 rounded border border-border/20"
                  placeholder="Simulate transcript..."
                />
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs h-auto"
                  onClick={() => {
                    const input = document.getElementById('transcript-input') as HTMLInputElement;
                    if (input && input.value) {
                      handleTranscriptSubmit(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-border/20 bg-card/5">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon-lg"
          className="rounded-full"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <Button
          variant={isVideoOn ? "secondary" : "destructive"}
          size="icon-lg"
          className="rounded-full"
          onClick={() => setIsVideoOn(!isVideoOn)}
        >
          {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full gap-2"
          onClick={handleEndMeeting}
        >
          <PhoneOff className="h-4 w-4" />
          End Meeting
        </Button>
      </div>
    </div>
  );
}
