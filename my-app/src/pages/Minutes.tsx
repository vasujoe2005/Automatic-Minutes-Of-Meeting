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

const minutesOfMeeting = [
  {
    id: 1,
    title: "Product Sprint Planning",
    date: "Dec 14, 2024",
    status: "approved",
    actionItems: 5,
    decisions: 3,
    department: "Product",
    participants: 8,
  },
  {
    id: 2,
    title: "Client Onboarding - Acme Corp",
    date: "Dec 14, 2024",
    status: "pending",
    actionItems: 4,
    decisions: 2,
    department: "Sales",
    participants: 4,
  },
  {
    id: 3,
    title: "Budget Review Meeting",
    date: "Dec 13, 2024",
    status: "approved",
    actionItems: 7,
    decisions: 4,
    department: "Finance",
    participants: 6,
  },
  {
    id: 4,
    title: "Team Retrospective",
    date: "Dec 12, 2024",
    status: "approved",
    actionItems: 3,
    decisions: 2,
    department: "Engineering",
    participants: 8,
  },
  {
    id: 5,
    title: "Design Review - Q4 Updates",
    date: "Dec 11, 2024",
    status: "draft",
    actionItems: 6,
    decisions: 3,
    department: "Design",
    participants: 5,
  },
];

const recentActionItems = [
  {
    id: 1,
    title: "Update project timeline with new milestones",
    dueDate: "Dec 18, 2024",
    assignee: "Sarah Chen",
    status: "pending",
    meeting: "Sprint Planning",
  },
  {
    id: 2,
    title: "Prepare Q4 budget presentation",
    dueDate: "Dec 16, 2024",
    assignee: "Michael Park",
    status: "in-progress",
    meeting: "Budget Review",
  },
  {
    id: 3,
    title: "Review client contract terms",
    dueDate: "Dec 20, 2024",
    assignee: "Emily Davis",
    status: "pending",
    meeting: "Client Onboarding",
  },
];

export default function Minutes() {
  return (
    <div className="w-full">
      <main className="container py-8 px-4 sm:px-6 lg:px-8">
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
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* MoM List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 mb-4">
              <Button variant="secondary" size="sm">All</Button>
              <Button variant="ghost" size="sm">Pending Review</Button>
              <Button variant="ghost" size="sm">Approved</Button>
              <Button variant="ghost" size="sm">Drafts</Button>
            </div>

            {minutesOfMeeting.map((mom) => (
              <Card key={mom.id} variant="default" className="hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${mom.status === "approved"
                          ? "bg-success/10"
                          : mom.status === "pending"
                            ? "bg-warning/10"
                            : "bg-muted"
                        }`}>
                        <FileText className={`h-5 w-5 ${mom.status === "approved"
                            ? "text-success"
                            : mom.status === "pending"
                              ? "text-warning"
                              : "text-muted-foreground"
                          }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{mom.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {mom.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {mom.participants}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right mr-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">{mom.actionItems} actions</Badge>
                          <Badge variant="accent">{mom.decisions} decisions</Badge>
                        </div>
                      </div>

                      <Badge
                        variant={
                          mom.status === "approved"
                            ? "success"
                            : mom.status === "pending"
                              ? "warning"
                              : "muted"
                        }
                        className="capitalize"
                      >
                        {mom.status}
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
            {/* Stats */}
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
                    <p className="font-display text-2xl font-bold">25</p>
                    <p className="text-xs text-muted-foreground mt-1">Action Items</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-muted">
                    <p className="font-display text-2xl font-bold">14</p>
                    <p className="text-xs text-muted-foreground mt-1">Decisions</p>
                  </div>
                </div>
                <div className="text-center p-4 rounded-xl bg-accent/10">
                  <p className="font-display text-2xl font-bold text-accent">92%</p>
                  <p className="text-xs text-muted-foreground mt-1">Completion Rate</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Action Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Actions</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActionItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center mt-0.5 ${item.status === "in-progress" ? "bg-warning/20" : "bg-muted"
                        }`}>
                        {item.status === "in-progress" ? (
                          <Clock className="h-3 w-3 text-warning" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {item.assignee}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            Due: {item.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
