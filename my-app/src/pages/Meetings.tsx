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
} from "lucide-react";
import { Link } from "react-router-dom";

const meetings = [
  {
    id: 1,
    title: "Product Sprint Planning",
    date: "Today",
    time: "2:00 PM",
    duration: "1 hour",
    status: "upcoming",
    participants: 8,
    department: "Product",
  },
  {
    id: 2,
    title: "Design Review - Q4 Updates",
    date: "Today",
    time: "4:30 PM",
    duration: "45 mins",
    status: "upcoming",
    participants: 5,
    department: "Design",
  },
  {
    id: 3,
    title: "Client Onboarding - Acme Corp",
    date: "Dec 14, 2024",
    time: "10:00 AM",
    duration: "52 mins",
    status: "completed",
    participants: 4,
    department: "Sales",
    hasMoM: true,
    hasRecording: true,
  },
  {
    id: 4,
    title: "Budget Review Meeting",
    date: "Dec 13, 2024",
    time: "3:00 PM",
    duration: "1h 15m",
    status: "completed",
    participants: 6,
    department: "Finance",
    hasMoM: true,
  },
  {
    id: 5,
    title: "Engineering Standup",
    date: "Tomorrow",
    time: "9:00 AM",
    duration: "30 mins",
    status: "upcoming",
    participants: 12,
    department: "Engineering",
    recurring: true,
  },
  {
    id: 6,
    title: "Team Retrospective",
    date: "Dec 12, 2024",
    time: "2:00 PM",
    duration: "45 mins",
    status: "completed",
    participants: 8,
    department: "Engineering",
    hasMoM: true,
    hasRecording: true,
  },
];

export default function Meetings() {
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
          <Button variant="secondary" size="sm">All Meetings</Button>
          <Button variant="ghost" size="sm">Upcoming</Button>
          <Button variant="ghost" size="sm">Completed</Button>
          <Button variant="ghost" size="sm">Recurring</Button>
        </div>

        {/* Meetings List */}
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <Card key={meeting.id} variant="default" className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${
                      meeting.status === "upcoming" 
                        ? "bg-primary/10" 
                        : "bg-muted"
                    }`}>
                      <Video className={`h-6 w-6 ${
                        meeting.status === "upcoming" 
                          ? "text-primary" 
                          : "text-muted-foreground"
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{meeting.title}</h3>
                        {meeting.recurring && (
                          <Badge variant="secondary" className="text-xs">Recurring</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {meeting.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {meeting.time} · {meeting.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {meeting.participants} participants
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{meeting.department}</Badge>
                    
                    {meeting.status === "completed" && (
                      <div className="flex items-center gap-2">
                        {meeting.hasMoM && (
                          <Button variant="ghost" size="icon-sm">
                            <FileText className="h-4 w-4 text-accent" />
                          </Button>
                        )}
                        {meeting.hasRecording && (
                          <Button variant="ghost" size="icon-sm">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {meeting.status === "upcoming" ? (
                      <Link to="/meeting-room">
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
          ))}
        </div>
      </main>
    </div>
  );
}
