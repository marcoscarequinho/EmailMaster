import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Home from "@/pages/home";
import UsersPage from "@/pages/admin/users";
import DomainsPage from "@/pages/admin/domains";
import SettingsPage from "@/pages/admin/settings";

function Router() {
  const { isAuthenticated, isLoading, isAuthError } = useAuth();

  // Add timeout fallback - if still loading after 10 seconds, assume not authenticated
  const [fallbackTimeout, setFallbackTimeout] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth request timed out, falling back to unauthenticated state');
        setFallbackTimeout(true);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading && !fallbackTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={isAuthenticated ? Home : AuthPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin/users" component={UsersPage} />
      <Route path="/admin/domains" component={DomainsPage} />
      <Route path="/admin/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
