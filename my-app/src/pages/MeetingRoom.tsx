import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api, Meeting } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  Users,
  FileText,
  Settings,
  Hand,
  Sparkles,
  Clock,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";



const agendaItems = [
  { id: 1, title: "Project Status Update", duration: "15 min", completed: true },
  { id: 2, title: "Q4 Goals Review", duration: "20 min", completed: false, current: true },
  { id: 3, title: "Resource Allocation", duration: "10 min", completed: false },
  { id: 4, title: "Open Discussion", duration: "15 min", completed: false },
];

const chatMessages = [
  { id: 1, sender: "Sarah Chen", message: "Can we focus on the timeline first?", time: "2:05 PM" },
  { id: 2, sender: "Michael Park", message: "Agreed, that's the priority", time: "2:06 PM" },
  { id: 3, sender: "AI Assistant", message: "Action item noted: Review timeline by Friday", time: "2:07 PM", isAI: true },
];

export default function MeetingRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const meetingCode = searchParams.get("code");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  const [participants, setParticipants] = useState([
    { id: 1, name: user?.name || "You", avatar: user?.name?.substring(0, 2).toUpperCase() || "YOU", isSelf: true, isMuted: false, isVideo: true },
    // Keep mocks for demo
    { id: 2, name: "Sarah Chen", avatar: "SC", isSelf: false, isMuted: true, isVideo: true },
    { id: 3, name: "Michael Park", avatar: "MP", isSelf: false, isMuted: false, isVideo: false },
  ]);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      if (!meetingCode) {
        navigate("/dashboard");
        return;
      }
      try {
        const data = await api.meetings.get(meetingCode);
        setMeeting(data);
      } catch (error) {
        console.error("Meeting not found:", error);
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeeting();
  }, [meetingCode, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-foreground text-background">
        Loading meeting...
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
            <h1 className="text-background font-medium">Meeting: {meeting?.meeting_code}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="success" className="text-xs">Live</Badge>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                45:23
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
      <div className="flex-1 flex">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className="h-full grid grid-cols-2 gap-4">
            {participants.map((participant) => (
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
            ))}
          </div>
        </div>

        {/* Sidebar */}
        {(showChat || showParticipants) && (
          <div className="w-80 border-l border-border/20 bg-card/5 flex flex-col">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-border/20">
              <button
                onClick={() => { setShowChat(true); setShowParticipants(false); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${showChat ? "text-background border-b-2 border-primary" : "text-muted-foreground"
                  }`}
              >
                Chat
              </button>
              <button
                onClick={() => { setShowParticipants(true); setShowChat(false); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${showParticipants ? "text-background border-b-2 border-primary" : "text-muted-foreground"
                  }`}
              >
                Participants ({participants.length})
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {showChat && (
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`${msg.isAI ? "bg-accent/10 rounded-lg p-3" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${msg.isAI ? "text-accent" : "text-background"}`}>
                          {msg.sender}
                        </span>
                        <span className="text-xs text-muted-foreground">{msg.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {showParticipants && (
                <div className="space-y-2">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/10">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-foreground">{p.avatar}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-background">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.isSelf ? "Host" : "Participant"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {p.isMuted && <MicOff className="h-4 w-4 text-muted-foreground" />}
                        {!p.isVideo && <VideoOff className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Agenda Panel */}
            <div className="border-t border-border/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-background flex items-center gap-2">
                  <FileText className="h-4 w-4 text-accent" />
                  Agenda
                </h3>
              </div>
              <div className="space-y-2">
                {agendaItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm ${item.current ? "bg-primary/20 text-background" : "text-muted-foreground"
                      } ${item.completed ? "line-through opacity-50" : ""}`}
                  >
                    <div className={`h-2 w-2 rounded-full ${item.completed ? "bg-success" : item.current ? "bg-primary animate-pulse" : "bg-muted"
                      }`} />
                    <span className="flex-1">{item.title}</span>
                    <span className="text-xs">{item.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            {showChat && (
              <div className="p-4 border-t border-border/20">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 rounded-lg bg-secondary/20 text-background placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>
        )}
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

        <Button variant="secondary" size="icon-lg" className="rounded-full">
          <Monitor className="h-5 w-5" />
        </Button>

        <Button variant="secondary" size="icon-lg" className="rounded-full">
          <Hand className="h-5 w-5" />
        </Button>

        <div className="w-px h-8 bg-border/30" />

        <Button
          variant={showChat ? "default" : "secondary"}
          size="icon-lg"
          className="rounded-full"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>

        <Button
          variant={showParticipants ? "default" : "secondary"}
          size="icon-lg"
          className="rounded-full"
          onClick={() => setShowParticipants(!showParticipants)}
        >
          <Users className="h-5 w-5" />
        </Button>

        <div className="w-px h-8 bg-border/30" />

        <Button variant="destructive" size="lg" className="rounded-full gap-2">
          <PhoneOff className="h-4 w-4" />
          End Meeting
        </Button>
      </div>
    </div>
  );
}
