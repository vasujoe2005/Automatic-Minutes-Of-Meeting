import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Video } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-hero relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow mb-8">
            <Video className="h-8 w-8 text-primary-foreground" />
          </div>
          
          <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
            Ready to Transform Your Meetings?
          </h2>
          
          <p className="mt-6 text-lg text-muted-foreground">
            Join thousands of teams who have already upgraded their meeting experience
            with AI-powered intelligence. Start for free, no credit card required.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button variant="hero" size="xl" className="gap-2 group">
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="xl">
                Schedule a Demo
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Free forever for up to 40 minutes per meeting. No credit card needed.
          </p>
        </div>
      </div>
    </section>
  );
}
