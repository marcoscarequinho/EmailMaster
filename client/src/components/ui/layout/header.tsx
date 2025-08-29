import { Search, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@shared/schema";

interface HeaderProps {
  user: User;
  onToggleSidebar: () => void;
}

export default function Header({ user, onToggleSidebar }: HeaderProps) {
  const getRoleClass = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'role-super-admin';
      case 'admin':
        return 'role-admin';
      default:
        return 'role-client';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      default:
        return 'Cliente';
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleSidebar}
            data-testid="button-toggle-sidebar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <div className="flex items-center space-x-2">
            <Mail className="text-primary text-xl h-6 w-6" />
            <span className="text-xl font-semibold text-foreground">EmailServer Pro</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              type="text" 
              placeholder="Pesquisar emails..." 
              className="pl-10 w-80"
              data-testid="input-search"
            />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <span className={`role-badge ${getRoleClass(user.role)}`} data-testid="text-user-role">
              {getRoleLabel(user.role)}
            </span>
            <div className="relative">
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block text-sm font-medium text-foreground" data-testid="text-user-name">
                  {user.firstName} {user.lastName}
                </span>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
