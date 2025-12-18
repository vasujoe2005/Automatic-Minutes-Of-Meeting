import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Calendar,
  FileText,
  Mic,
  Brain,
  Users,
  Clock,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "HD Video Conferencing",
    description: "Crystal-clear video and audio with multi-participant support, screen sharing, and real-time chat.",
    badge: "Core",
    color: "primary",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "AI-powered scheduling that finds the perfect time for all participants across time zones.",
    badge: "AI",
    color: "accent",
  },
  {
    icon: FileText,
    title: "Agenda Management",
    description: "Create, share, and manage meeting agendas with templates and AI auto-generation.",
    badge: "Core",
    color: "primary",
  },
  {
    icon: Mic,
    title: "Live Transcription",
    description: "Real-time speech-to-text transcription with speaker identification and timestamps.",
    badge: "AI",
    color: "accent",
  },
  {
    icon: Brain,
    title: "AI Summarization",
    description: "Automatic meeting summaries, key decisions, and action items extracted by AI.",
    badge: "AI",
    color: "accent",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Department and group organization with role-based access control.",
    badge: "Core",
    color: "primary",
  },
  {
    icon: Clock,
    title: "Action Tracking",
    description: "Track decisions, deadlines, and follow-ups with automated reminders.",
    badge: "Core",
    color: "primary",
  },
  {
    icon: CheckCircle2,
    title: "Minutes of Meeting",
    description: "Professional MoM documents generated automatically from your meetings.",
    badge: "AI",
    color: "accent",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Insights into meeting patterns, attendance, and productivity metrics.",
    badge: "Pro",
    color: "success",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Features
          </Badge>
          <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
            Everything You Need for{" "}
            <span className="text-gradient-primary">Productive Meetings</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            From scheduling to follow-ups, MeetFlow handles the entire meeting lifecycle
            with AI-powered intelligence.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              variant="interactive"
              className="group animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      feature.color === "primary"
                        ? "bg-primary/10"
                        : feature.color === "accent"
                        ? "bg-accent/10"
                        : "bg-success/10"
                    }`}
                  >
                    <feature.icon
                      className={`h-6 w-6 ${
                        feature.color === "primary"
                          ? "text-primary"
                          : feature.color === "accent"
                          ? "text-accent"
                          : "text-success"
                      }`}
                    />
                  </div>
                  <Badge
                    variant={
                      feature.color === "accent"
                        ? "accent"
                        : feature.color === "success"
                        ? "success"
                        : "secondary"
                    }
                  >
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
