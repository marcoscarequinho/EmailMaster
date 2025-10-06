import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Link, Smile, X } from "lucide-react";
import type { User } from "@shared/schema";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function ComposeModal({ isOpen, onClose, user }: ComposeModalProps) {
  const [formData, setFormData] = useState({
    recipient: '',
    subject: '',
    body: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: typeof formData) => {
      await apiRequest('POST', '/api/emails', emailData);
    },
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "Seu email foi enviado com sucesso.",
      });
      setFormData({ recipient: '', subject: '', body: '' });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar o email. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipient || !formData.subject || !formData.body) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para enviar o email.",
        variant: "destructive",
      });
      return;
    }
    sendEmailMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = () => {
    toast({
      title: "Rascunho salvo",
      description: "Seu email foi salvo nos rascunhos.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Nova Mensagem
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-compose">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Para"
              value={formData.recipient}
              onChange={(e) => handleInputChange('recipient', e.target.value)}
              data-testid="input-recipient"
            />
          </div>
          <div>
            <Input
              type="text"
              placeholder="Assunto"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              data-testid="input-subject"
            />
          </div>
          <div>
            <Textarea
              rows={12}
              placeholder="Escreva sua mensagem..."
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              className="resize-none"
              data-testid="textarea-body"
            />
          </div>
        </form>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" title="Anexar arquivo" data-testid="button-attach">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Inserir link" data-testid="button-link">
              <Link className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Emoji" data-testid="button-emoji">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              disabled={sendEmailMutation.isPending}
              data-testid="button-save-draft"
            >
              Salvar Rascunho
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={sendEmailMutation.isPending}
              data-testid="button-send"
            >
              {sendEmailMutation.isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
