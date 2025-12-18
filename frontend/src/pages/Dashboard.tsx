import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  FileText,
  ChevronRight,
  Play,
  MoreVertical,
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

export default function Dashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMeetings();
    fetchUserInfo();
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

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/v1/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUserName(data.name || "User");
      }
    } catch (error) {
      console.error("Failed to fetch user info", error);
    }
  };

  const upcomingMeetings = meetings.filter(m => m.status === "scheduled" || m.status === "in_progress");
  const recentMeetings = meetings.filter(m => m.status === "completed");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not scheduled";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const quickStats = [
    { label: "Total Meetings", value: meetings.length.toString(), change: "" },
    { label: "Upcoming", value: upcomingMeetings.length.toString(), change: "" },
    { label: "Completed", value: recentMeetings.length.toString(), change: "" },
    {
      label: "This Week", value: meetings.filter(m => {
        if (!m.start_time) return false;
        const date = new Date(m.start_time);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo && date <= now;
      }).length.toString(), change: ""
    },
  ];

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
        {/* Welcome Section */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Welcome back{userName ? `, ${userName}` : ""}!</h1>
            <p className="text-muted-foreground mt-1">
              {upcomingMeetings.length > 0
                ? `You have ${upcomingMeetings.length} meeting${upcomingMeetings.length > 1 ? 's' : ''} scheduled`
                : "No upcoming meetings scheduled"}
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/meeting-room">
              <Button variant="hero" size="lg" className="gap-2">
                <Video className="h-4 w-4" />
                Start Instant Meeting
              </Button>
            </Link>
            <Link to="/schedule">
              <Button variant="outline" size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Meeting
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat) => (
            <Card key={stat.label} variant="default" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                {stat.change && (
                  <Badge variant="success" className="text-xs">
                    {stat.change}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Meetings */}
          <div className="lg:col-span-2">
            <Card variant="default">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Upcoming Meetings</CardTitle>
                <Link to="/meetings">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingMeetings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming meetings</p>
                    <Link to="/schedule">
                      <Button variant="link" className="mt-2">Schedule one now</Button>
                    </Link>
                  </div>
                ) : (
                  upcomingMeetings.slice(0, 5).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Video className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{meeting.title || `Meeting ${meeting.meeting_code}`}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDate(meeting.start_time)}
                            </span>
                            <span className="text-xs font-mono">{meeting.meeting_code}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{meeting.status}</Badge>
                        <Link to={`/meeting-room?code=${meeting.meeting_code}`}>
                          <Button variant="default" size="sm" className="gap-1">
                            <Play className="h-3.5 w-3.5" />
                            Join
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Meetings */}
          <div>
            <Card variant="default">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Meetings</CardTitle>
                <Link to="/minutes">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentMeetings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No completed meetings yet</p>
                  </div>
                ) : (
                  recentMeetings.slice(0, 5).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{meeting.title || `Meeting ${meeting.meeting_code}`}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(meeting.start_time)}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="accent" className="text-xs gap-1">
                          <FileText className="h-3 w-3" />
                          MoM
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <Link to="/schedule">
            <Card variant="interactive" className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Schedule Meeting</h3>
                  <p className="text-sm text-muted-foreground">Plan ahead with smart scheduling</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/templates">
            <Card variant="interactive" className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-accent flex items-center justify-center">
                  <FileText className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Create Agenda</h3>
                  <p className="text-sm text-muted-foreground">AI-powered agenda templates</p>
                </div>
              </div>
            </Card>
          </Link>

          <Card variant="interactive" className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Invite Team</h3>
                <p className="text-sm text-muted-foreground">Add team members easily</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
