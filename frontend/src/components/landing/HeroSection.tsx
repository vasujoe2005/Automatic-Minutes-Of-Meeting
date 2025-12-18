import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Sparkles, Video, Users, FileText } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-60 -left-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-60 w-[800px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex animate-fade-in">
            <Badge variant="outline" className="gap-2 px-4 py-1.5 text-sm border-primary/30 bg-primary/5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-Powered Meeting Intelligence
            </Badge>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl animate-slide-up">
            Transform Your Meetings with{" "}
            <span className="text-gradient-primary">AI Intelligence</span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Schedule, execute, and document meetings effortlessly. 
            Auto-generate agendas, capture decisions, and create 
            professional minutes with AI.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/dashboard">
              <Button variant="hero" size="xl" className="gap-2 group">
                Start Free Meeting
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button variant="glass" size="xl" className="gap-2">
              <Play className="h-4 w-4" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground">10k+</div>
              <div className="text-sm text-muted-foreground mt-1">Meetings Hosted</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground">98%</div>
              <div className="text-sm text-muted-foreground mt-1">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-foreground">4.9</div>
              <div className="text-sm text-muted-foreground mt-1">User Rating</div>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="mt-20 relative animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="mx-auto max-w-5xl">
            <div className="relative rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-destructive/80" />
                  <div className="h-3 w-3 rounded-full bg-warning/80" />
                  <div className="h-3 w-3 rounded-full bg-success/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-background text-xs text-muted-foreground">
                    meetflow.app/meeting/abc123
                  </div>
                </div>
              </div>
              
              {/* Meeting Preview */}
              <div className="aspect-video bg-gradient-to-br from-muted to-secondary p-8">
                <div className="h-full grid grid-cols-4 gap-4">
                  {/* Main video */}
                  <div className="col-span-3 rounded-xl bg-card border border-border flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-primary flex items-center justify-center mb-4">
                        <Video className="h-10 w-10 text-primary-foreground" />
                      </div>
                      <p className="text-muted-foreground">Meeting Room Preview</p>
                    </div>
                  </div>
                  
                  {/* Sidebar */}
                  <div className="space-y-4">
                    <div className="rounded-xl bg-card border border-border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Participants</span>
                      </div>
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted" />
                            <div className="h-2 w-16 rounded bg-muted" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-card border border-border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium">Agenda</span>
                      </div>
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-2 w-full rounded bg-muted" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -left-4 top-1/4 animate-float" style={{ animationDelay: "0.5s" }}>
              <div className="bg-card rounded-xl border border-border shadow-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">AI Summary</div>
                    <div className="text-xs text-muted-foreground">Auto-generated</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-4 bottom-1/4 animate-float" style={{ animationDelay: "1s" }}>
              <div className="bg-card rounded-xl border border-border shadow-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-success/20 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">MoM Ready</div>
                    <div className="text-xs text-muted-foreground">Download PDF</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
