import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Inbox, 
  Send, 
  FileText, 
  Shield, 
  Trash2, 
  Users, 
  Settings, 
  FileCode, 
  LogOut,
  Plus
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { User } from "@shared/schema";

interface SidebarProps {
  user: User;
  currentSection: string;
  onSectionChange: (section: string) => void;
  collapsed: boolean;
  onCompose: () => void;
}

export default function Sidebar({ 
  user, 
  currentSection, 
  onSectionChange, 
  collapsed, 
  onCompose 
}: SidebarProps) {
  const [location] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const isAdmin = ['admin', 'super_admin'].includes(user.role);

  const navigationItems = [
    { id: 'inbox', label: 'Caixa de Entrada', icon: Inbox, badge: '12', path: '/' },
    { id: 'sent', label: 'Enviados', icon: Send, path: '/' },
    { id: 'drafts', label: 'Rascunhos', icon: FileText, badge: '3', path: '/' },
    { id: 'spam', label: 'Spam', icon: Shield, path: '/' },
    { id: 'trash', label: 'Lixeira', icon: Trash2, path: '/' },
  ];

  const adminItems = [
    { id: 'users', label: 'Usuários', icon: Users, path: '/admin/users', tooltip: 'Gerenciar usuários, roles e permissões' },
    { id: 'settings', label: 'Configurações', icon: Settings, path: '/admin/settings', tooltip: 'Configurações do sistema e segurança' },
    { id: 'logs', label: 'Logs de Auditoria', icon: FileCode, path: '/admin/logs', tooltip: 'Histórico de ações administrativas' },
  ];

  return (
    <nav className={`gmail-sidebar bg-card border-r border-border flex flex-col ${collapsed ? 'collapsed' : ''}`}>
      <div className="p-4">
        <Button 
          onClick={onCompose} 
          className="w-full py-3 px-4 font-medium flex items-center justify-center space-x-2"
          data-testid="button-compose"
        >
          <Plus className="h-4 w-4" />
          <span className="sidebar-text">Escrever</span>
        </Button>
      </div>

      <div className="flex-1 px-4 pb-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <Link href={item.path}>
                <a 
                  onClick={() => onSectionChange(item.id)}
                  className={`nav-item flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-muted transition-colors ${
                    currentSection === item.id ? 'active' : 'text-muted-foreground'
                  }`}
                  data-testid={`link-${item.id}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sidebar-text">{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-text ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </a>
              </Link>
            </li>
          ))}
        </ul>

        {/* Admin-only sections */}
        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="sidebar-text text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Administração
            </h3>
            <ul className="space-y-1">
              {adminItems.map((item) => (
                <li key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.path}>
                        <a 
                          className={`nav-item flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-muted transition-colors ${
                            location === item.path ? 'active' : 'text-muted-foreground'
                          }`}
                          data-testid={`link-${item.id}`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="sidebar-text">{item.label}</span>
                        </a>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 text-muted-foreground hover:text-destructive"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="sidebar-text">Sair</span>
        </Button>
      </div>
    </nav>
  );
}
