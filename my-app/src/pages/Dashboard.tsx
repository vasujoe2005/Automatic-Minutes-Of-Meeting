
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
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, Meeting } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  const handleStartInstantMeeting = async () => {
    try {
      setIsCreatingMeeting(true);
      const response = await api.meetings.create();
      navigate(`/meeting-room?code=${response.meeting_code}`);
    } catch (error) {
      console.error("Failed to create meeting:", error);
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: api.meetings.list,
  });

  // Simple client-side filtering (ideally do this on backend)
  const sortedMeetings = meetings?.sort((a, b) =>
    new Date(b.created_at || b.start_time || "").getTime() - new Date(a.created_at || a.start_time || "").getTime()
  ) || [];

  const upcomingMeetings = sortedMeetings.filter(m => m.start_time && new Date(m.start_time) > new Date()).slice(0, 3);
  const recentMeetings = sortedMeetings.filter(m => !m.start_time || new Date(m.start_time) <= new Date()).slice(0, 5);

  const quickStats = [
    { label: "Total Meetings", value: meetings?.length || 0, change: "" },
    // placeholders for now as we don't have full stats API
    { label: "Hours Recorded", value: "0h", change: "" },
    { label: "Action Items", value: "0", change: "" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
            <p className="text-muted-foreground mt-1">
              You have {upcomingMeetings.length} upcoming meetings.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="hero"
              size="lg"
              className="gap-2"
              onClick={handleStartInstantMeeting}
              disabled={isCreatingMeeting}
            >
              {isCreatingMeeting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              {isCreatingMeeting ? "Creating..." : "Start Instant Meeting"}
            </Button>
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
            <Card key={stat.label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-display text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                {stat.change && (
                  <Badge variant="secondary" className="text-xs">
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
            <Card>
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
                {isLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : upcomingMeetings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No upcoming meetings scheduled.</p>
                ) : (
                  upcomingMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Video className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Meeting {meeting.meeting_code}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {meeting.start_time ? format(new Date(meeting.start_time), "PPP p") : "Not scheduled"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
            <Card>
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
                {isLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : recentMeetings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No recent meetings found.</p>
                ) : (
                  recentMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">Meeting {meeting.meeting_code}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {/* @ts-ignore - created_at exists in backend response */}
                            {meeting.created_at ? format(new Date(meeting.created_at), "PPP p") : "Unknown date"}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Placeholder badges until we have real data on recordings/mom */}
                      <div className="flex gap-2 mt-2">
                        {/* 
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Video className="h-3 w-3" />
                          Recording
                        </Badge> 
                        */}
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
            <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Schedule Meeting</h3>
                  <p className="text-sm text-muted-foreground">Plan ahead with smart scheduling</p>
                </div>
              </div>
            </Card>
          </Link>

          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow opacity-50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold">Create Agenda</h3>
                <p className="text-sm text-muted-foreground">AI-powered agenda templates (Coming Soon)</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow opacity-50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">Invite Team</h3>
                <p className="text-sm text-muted-foreground">Add team members easily (Coming Soon)</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
