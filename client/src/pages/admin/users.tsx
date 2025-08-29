import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/ui/layout/header";
import Sidebar from "@/components/ui/layout/sidebar";
import UserTable from "@/components/admin/user-table";
import { useState } from "react";

export default function UsersPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
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

    if (user && !['admin', 'super_admin'].includes(user.role)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      // Redirect to home page
      window.location.href = "/";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

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

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
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
          currentSection="users"
          onSectionChange={() => {}}
          collapsed={sidebarCollapsed}
          onCompose={() => {}}
        />
        
        <main className="flex-1 p-6">
          <UserTable user={user} />
        </main>
      </div>
    </div>
  );
}
