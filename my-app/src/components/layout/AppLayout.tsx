import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  BarChart3,
  Calendar,
  FileText,
  Bell,
  User,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Meetings", href: "/meetings", icon: Video },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Minutes", href: "/minutes", icon: FileText },
  { name: "Meeting Room", href: "/meeting-room", icon: Video },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-md">
              <Video className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">MeetFlow</span>
            <Badge variant="accent" className="hidden sm:inline-flex">
              AI
            </Badge>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" />
              </Button>
              <Button variant="ghost" size="icon-sm">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 bg-background z-20">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto p-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
