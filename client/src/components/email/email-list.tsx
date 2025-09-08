import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  RotateCcw, 
  Archive, 
  Trash2, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Star,
  Inbox
} from "lucide-react";
import type { User, Email } from "@shared/schema";

interface EmailListProps {
  currentSection: string;
  user: User;
}

export default function EmailList({ currentSection, user }: EmailListProps) {
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const { data: emails = [], isLoading } = useQuery<Email[]>({
    queryKey: ['/api/emails', { folder: currentSection }],
    retry: false,
  });

  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return '';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmails(emails.map((email: Email) => email.id));
    } else {
      setSelectedEmails([]);
    }
  };

  const handleSelectEmail = (emailId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmails([...selectedEmails, emailId]);
    } else {
      setSelectedEmails(selectedEmails.filter(id => id !== emailId));
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Email List Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Checkbox 
              checked={selectedEmails.length === emails.length && emails.length > 0}
              onCheckedChange={handleSelectAll}
              data-testid="checkbox-select-all"
            />
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" title="Atualizar" data-testid="button-refresh">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Arquivar" data-testid="button-archive">
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Excluir" data-testid="button-delete">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Marcar como spam" data-testid="button-spam">
                <AlertTriangle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span data-testid="text-email-count">1-{emails.length} de {emails.length}</span>
            <Button variant="ghost" size="sm" data-testid="button-prev-page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-next-page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">Nenhum email encontrado</p>
              <p className="text-muted-foreground">Sua {currentSection === 'inbox' ? 'caixa de entrada' : currentSection} está vazia.</p>
            </div>
          </div>
        ) : (
          emails.map((email: Email) => (
            <div 
              key={email.id} 
              className="email-item border-b border-border p-4 cursor-pointer"
              data-testid={`email-item-${email.id}`}
            >
              <div className="flex items-center space-x-4">
                <Checkbox 
                  checked={selectedEmails.includes(email.id)}
                  onCheckedChange={(checked) => handleSelectEmail(email.id, checked as boolean)}
                  data-testid={`checkbox-email-${email.id}`}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={email.isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"}
                  data-testid={`button-star-${email.id}`}
                >
                  <Star className={`h-4 w-4 ${email.isStarred ? 'fill-current' : ''}`} />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span 
                        className={`${email.isRead ? 'text-muted-foreground' : 'font-medium text-foreground'}`}
                        data-testid={`text-sender-${email.id}`}
                      >
                        {email.sender}
                      </span>
                      <span 
                        className={`text-sm truncate ${email.isRead ? 'text-muted-foreground' : 'font-medium text-foreground'}`}
                        data-testid={`text-subject-${email.id}`}
                      >
                        {email.subject}
                      </span>
                    </div>
                    <span 
                      className="text-sm text-muted-foreground whitespace-nowrap"
                      data-testid={`text-time-${email.id}`}
                    >
                      {formatTime(email.createdAt!)}
                    </span>
                  </div>
                  <p 
                    className="text-sm text-muted-foreground truncate mt-1"
                    data-testid={`text-preview-${email.id}`}
                  >
                    {email.body.substring(0, 150)}...
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
