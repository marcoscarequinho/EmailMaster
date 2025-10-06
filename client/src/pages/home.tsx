import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/ui/layout/header";
import Sidebar from "@/components/ui/layout/sidebar";
import EmailList from "@/components/email/email-list";
import ComposeModal from "@/components/email/compose-modal";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState('inbox');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        user={user}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex">
        <Sidebar 
          user={user}
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          collapsed={sidebarCollapsed}
          onCompose={() => setComposeOpen(true)}
        />
        
        <main className="flex-1 flex flex-col">
          <EmailList 
            currentSection={currentSection}
            user={user}
          />
        </main>
      </div>

      <ComposeModal 
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        user={user}
      />
    </div>
  );
}
