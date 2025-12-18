import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Template {
  id: number;
  title: string;
  description: string;
  structure: string;
}

export default function Schedule() {
  const [meetingTitle, setMeetingTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [participants, setParticipants] = useState("");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Local agenda items (if not using template or customized)
  // For V1, let's keep it simple: Select Template -> That dictates Agenda
  const [agendaItems, setAgendaItems] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await fetch("/api/v1/templates/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (e) {
      console.error("Error fetching templates", e);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    // Parse structure for preview
    try {
      const items = JSON.parse(template.structure);
      setAgendaItems(items);
    } catch (e) {
      setAgendaItems(["Error parsing template"]);
    }
  };

  const handleSchedule = async () => {
    if (!meetingTitle) {
      toast.error("Please enter a meeting title");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please sign in");
      return;
    }

    try {
      // Construct datetime
      let start_time = null;
      if (selectedDate && selectedTime) {
        start_time = new Date(`${selectedDate}T${selectedTime}`).toISOString();
      }

      const response = await fetch("/api/v1/meetings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: meetingTitle,
          template_id: selectedTemplate?.id || null,
          start_time: start_time
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Meeting scheduled successfully!");
        // Navigate to meeting room or dashboard? 
        // For demo flow, let's go to Meeting Room with the code (simulating 'starting' it, or just dashboard)
        // But real flow: Dashboard -> Click Join. 
        navigate("/dashboard");
      } else {
        toast.error("Failed to schedule meeting");
      }
    } catch (e) {
      toast.error("Error scheduling meeting");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Schedule Meeting</h1>
          <p className="text-muted-foreground mt-1">
            Create and schedule a new meeting. Select a template to auto-populate the agenda.
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
                    <Label>Template</Label>
                    <div className="text-sm font-medium p-2 border rounded-md min-h-[40px] flex items-center bg-muted/50">
                      {selectedTemplate ? selectedTemplate.title : "No template selected"}
                    </div>
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
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
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
                        value={selectedTime}
                        onChange={e => setSelectedTime(e.target.value)}
                      />
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agenda Preview */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="text-lg">Agenda Preview</CardTitle>
                  <CardDescription>
                    {selectedTemplate ? "Based on selected template" : "Select a template to view agenda"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agendaItems.length > 0 ? agendaItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <div className="flex-1 font-medium text-sm">
                        {item}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-muted-foreground py-4">No agenda items</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplate?.id === template.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3 h-auto py-3 items-start"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{template.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                    </div>
                  </Button>
                ))}
                {templates.length === 0 && <p className="text-sm text-muted-foreground">No templates found.</p>}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button variant="hero" size="lg" className="w-full gap-2" onClick={handleSchedule}>
                <Video className="h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
