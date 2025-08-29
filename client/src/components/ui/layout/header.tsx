import { Search, Mail, Users, Globe, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
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

          {/* Admin Navigation */}
          <div className="flex items-center space-x-3">
            {['admin', 'super_admin'].includes(user.role) && (
              <div className="flex items-center space-x-2">
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm" className="text-sm" data-testid="link-admin-users">
                    <Users className="h-4 w-4 mr-2" />
                    Usuários
                  </Button>
                </Link>
                {user.role === 'super_admin' && (
                  <Link href="/admin/domains">
                    <Button variant="ghost" size="sm" className="text-sm" data-testid="link-admin-domains">
                      <Globe className="h-4 w-4 mr-2" />
                      Domínios
                    </Button>
                  </Link>
                )}
              </div>
            )}
            
            <span className={`role-badge ${getRoleClass(user.role)}`} data-testid="text-user-role">
              {getRoleLabel(user.role)}
            </span>

            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
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
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Caixa de Entrada</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600" data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
