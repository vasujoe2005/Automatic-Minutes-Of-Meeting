import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  Sparkles,
  Video,
  ChevronLeft,
  ChevronRight,
  Trash2,
  GripVertical,
} from "lucide-react";

const agendaTemplates = [
  { id: 1, name: "Sprint Planning", items: 5 },
  { id: 2, name: "Team Standup", items: 3 },
  { id: 3, name: "Client Review", items: 4 },
  { id: 4, name: "Brainstorming", items: 4 },
];

const defaultAgendaItems = [
  { id: 1, title: "Welcome & Introductions", duration: 5, owner: "Host" },
  { id: 2, title: "Review Previous Action Items", duration: 10, owner: "Host" },
  { id: 3, title: "Main Discussion", duration: 30, owner: "All" },
  { id: 4, title: "Next Steps & Action Items", duration: 10, owner: "Host" },
  { id: 5, title: "Q&A and Wrap-up", duration: 5, owner: "All" },
];

export default function Schedule() {
  const [agendaItems, setAgendaItems] = useState(defaultAgendaItems);
  const [meetingTitle, setMeetingTitle] = useState("");

  const totalDuration = agendaItems.reduce((acc, item) => acc + item.duration, 0);

  const addAgendaItem = () => {
    setAgendaItems([
      ...agendaItems,
      {
        id: Date.now(),
        title: "New Agenda Item",
        duration: 10,
        owner: "TBD",
      },
    ]);
  };

  const removeAgendaItem = (id: number) => {
    setAgendaItems(agendaItems.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full">
      <main className="container py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Schedule Meeting</h1>
          <p className="text-muted-foreground mt-1">
            Create and schedule a new meeting with AI-powered agenda generation
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meeting Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Meeting Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Weekly Team Sync"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Meeting Type</Label>
                    <select
                      id="type"
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option>Regular Meeting</option>
                      <option>Sprint Planning</option>
                      <option>Client Meeting</option>
                      <option>Training Session</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <div className="relative">
                      <Input
                        id="date"
                        type="date"
                        className="pl-10"
                      />
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <div className="relative">
                      <Input
                        id="time"
                        type="time"
                        className="pl-10"
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participants">Participants</Label>
                  <div className="relative">
                    <Input
                      id="participants"
                      placeholder="Add participants by email..."
                      className="pl-10"
                    />
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Separate multiple emails with commas
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Agenda */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Meeting Agenda</CardTitle>
                    <CardDescription>
                      Total duration: {totalDuration} minutes
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      AI Generate
                    </Button>
                    <Button variant="secondary" size="sm" className="gap-1" onClick={addAgendaItem}>
                      <Plus className="h-3.5 w-3.5" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agendaItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const updated = [...agendaItems];
                            updated[index].title = e.target.value;
                            setAgendaItems(updated);
                          }}
                          className="w-full bg-transparent font-medium focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={item.duration}
                            onChange={(e) => {
                              const updated = [...agendaItems];
                              updated[index].duration = parseInt(e.target.value) || 0;
                              setAgendaItems(updated);
                            }}
                            className="w-12 bg-transparent text-sm text-center focus:outline-none border-b border-transparent focus:border-primary"
                          />
                          <span className="text-sm text-muted-foreground">min</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {item.owner}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeAgendaItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agenda Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {agendaTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="ghost"
                    className="w-full justify-start gap-3"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.items} items</p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Preview */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg">Meeting Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-primary text-primary-foreground">
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="h-5 w-5" />
                    <span className="font-semibold">
                      {meetingTitle || "Untitled Meeting"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {totalDuration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {agendaItems.length} items
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Agenda items:</p>
                  {agendaItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{item.title}</span>
                    </div>
                  ))}
                  {agendaItems.length > 3 && (
                    <p className="text-muted-foreground">
                      +{agendaItems.length - 3} more items
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button variant="hero" size="lg" className="w-full gap-2">
                <Video className="h-4 w-4" />
                Schedule Meeting
              </Button>
              <Button variant="outline" size="lg" className="w-full">
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
