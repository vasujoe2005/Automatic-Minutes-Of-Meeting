import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Video,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  Play,
  MoreVertical,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  start_time: string | null;
  status: string;
  host_id: number;
}

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMeetings();
  }, [navigate]);

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/v1/meetings/", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error("Failed to fetch meetings", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not scheduled";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter meetings based on active tab
  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.meeting_code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeTab) {
      case "upcoming":
        return meeting.status === "scheduled" || meeting.status === "in_progress";
      case "completed":
        return meeting.status === "completed";
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Meetings</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your meetings
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Input
                placeholder="Search meetings..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Link to="/schedule">
              <Button variant="hero" className="gap-2">
                <Video className="h-4 w-4" />
                New Meeting
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-4">
          <Button
            variant={activeTab === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("all")}
          >
            All Meetings ({meetings.length})
          </Button>
          <Button
            variant={activeTab === "upcoming" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming ({meetings.filter(m => m.status === "scheduled" || m.status === "in_progress").length})
          </Button>
          <Button
            variant={activeTab === "completed" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("completed")}
          >
            Completed ({meetings.filter(m => m.status === "completed").length})
          </Button>
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No meetings found</h3>
              <p className="text-sm mb-4">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by scheduling your first meeting"}
              </p>
              <Link to="/schedule">
                <Button variant="default">Schedule Meeting</Button>
              </Link>
            </div>
          ) : (
            filteredMeetings.map((meeting) => (
              <Card key={meeting.id} variant="default" className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${meeting.status === "scheduled" || meeting.status === "in_progress"
                          ? "bg-primary/10"
                          : "bg-muted"
                        }`}>
                        <Video className={`h-6 w-6 ${meeting.status === "scheduled" || meeting.status === "in_progress"
                            ? "text-primary"
                            : "text-muted-foreground"
                          }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{meeting.title || `Meeting ${meeting.meeting_code}`}</h3>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(meeting.start_time)}
                          </span>
                          {meeting.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatTime(meeting.start_time)}
                            </span>
                          )}
                          <span className="font-mono text-xs">{meeting.meeting_code}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{meeting.status}</Badge>

                      {meeting.status === "completed" && (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon-sm">
                            <FileText className="h-4 w-4 text-accent" />
                          </Button>
                          <Button variant="ghost" size="icon-sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {(meeting.status === "scheduled" || meeting.status === "in_progress") ? (
                        <Link to={`/meeting-room?code=${meeting.meeting_code}`}>
                          <Button variant="default" size="sm" className="gap-1">
                            <Play className="h-3.5 w-3.5" />
                            Join
                          </Button>
                        </Link>
                      ) : (
                        <Badge variant="muted">Completed</Badge>
                      )}

                      <Button variant="ghost" size="icon-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
