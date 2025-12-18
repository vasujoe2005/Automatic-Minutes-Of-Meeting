import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Users,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface Meeting {
  id: number;
  meeting_code: string;
  start_time: string;
  end_time: string;
  title?: string;
  action_item_count: number;
  decision_count: number;
  status: string;
}

export default function Minutes() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/v1/meetings/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Minutes of Meeting</h1>
            <p className="text-muted-foreground mt-1">
              AI-generated meeting minutes and action items
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Input
                placeholder="Search minutes..."
                className="pl-10 w-64"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* MoM List */}
          <div className="lg:col-span-2 space-y-4">
            {meetings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No meetings found. Schedule one to get started.
              </div>
            )}

            {meetings.map((mom) => (
              <Card key={mom.id} variant="default" className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${mom.status === "finalized" ? "bg-success/10" : mom.status === "in_progress" ? "bg-warning/10" : "bg-muted"
                        }`}>
                        <FileText className={`h-5 w-5 ${mom.status === "finalized" ? "text-success" : mom.status === "in_progress" ? "text-warning" : "text-primary"
                          }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">Meeting: {mom.meeting_code}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {mom.start_time ? new Date(mom.start_time).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right mr-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">{mom.action_item_count} actions</Badge>
                          <Badge variant="accent">{mom.decision_count} decisions</Badge>
                        </div>
                      </div>

                      <Badge
                        variant={
                          mom.status === "finalized"
                            ? "success"
                            : mom.status === "in_progress"
                              ? "warning"
                              : "muted"
                        }
                        className="capitalize"
                      >
                        {mom.status || "scheduled"}
                      </Badge>

                      <Button variant="ghost" size="icon-sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-xl bg-muted">
                    <p className="font-display text-2xl font-bold">
                      {meetings.reduce((sum, m) => sum + (m.action_item_count || 0), 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Action Items</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted">
                    <p className="font-display text-2xl font-bold">
                      {meetings.reduce((sum, m) => sum + (m.decision_count || 0), 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Decisions</p>
                  </div>
                </div>
                <div className="text-center p-4 rounded-xl bg-accent/10">
                  <p className="font-display text-2xl font-bold text-accent">{meetings.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Meetings</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
