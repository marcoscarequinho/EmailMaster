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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { User } from "@shared/schema";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export default function CreateUserModal({ isOpen, onClose, currentUser }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'client',
    tempPassword: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      await apiRequest('POST', '/api/users', userData);
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
      });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'client',
        tempPassword: '',
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
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
        title: "Erro ao criar usuário",
        description: "Não foi possível criar o usuário. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.tempPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para criar o usuário.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canCreateAdmin = currentUser.role === 'super_admin';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Criar Novo Usuário
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-create-user">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              <strong>Dica:</strong> Após criar o usuário, ele poderá fazer login com email e senha temporária
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
              Nome
            </Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              data-testid="input-first-name"
            />
          </div>
          
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
              Sobrenome
            </Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              data-testid="input-last-name"
            />
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Endereço de email que será usado para login e comunicação</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              data-testid="input-email"
            />
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Label htmlFor="role" className="text-sm font-medium text-foreground">
                Tipo de Usuário
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p><strong>Cliente:</strong> Pode usar sistema de email</p>
                    <p><strong>Admin:</strong> Pode gerenciar usuários</p>
                    <p><strong>Super Admin:</strong> Controle total do sistema</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger data-testid="select-user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Cliente</SelectItem>
                {canCreateAdmin && <SelectItem value="admin">Administrador</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Label htmlFor="tempPassword" className="text-sm font-medium text-foreground">
                Senha Temporária
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Senha inicial que o usuário deverá alterar no primeiro login</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="tempPassword"
              type="password"
              value={formData.tempPassword}
              onChange={(e) => handleInputChange('tempPassword', e.target.value)}
              data-testid="input-temp-password"
            />
          </div>
        </form>

        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-create-user">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createUserMutation.isPending}
            data-testid="button-submit-create-user"
          >
            {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
