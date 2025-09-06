import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { X, Save } from "lucide-react";
import type { User } from "@shared/schema";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentUser: User;
}

export default function EditUserModal({ isOpen, onClose, user, currentUser }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'client',
    isActive: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      if (!user) return;
      await apiRequest('PATCH', `/api/users/${user.id}`, userData);
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Não autorizado",
          description: "Fazendo login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canEditRole = currentUser.role === 'super_admin';
  const canEditUser = currentUser.role === 'super_admin' || 
    (currentUser.role === 'admin' && user?.role === 'client');

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Editar Usuário
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-sm font-medium text-muted-foreground">
              Nome de Usuário
            </Label>
            <Input
              id="username"
              type="text"
              value={user.username}
              disabled
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email || ''}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
              Nome
            </Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={!canEditUser}
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
              disabled={!canEditUser}
            />
          </div>
          
          {canEditRole && (
            <div>
              <Label htmlFor="role" className="text-sm font-medium text-foreground">
                Tipo de Usuário
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => handleInputChange('role', value)}
                disabled={user.id === currentUser.id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Label htmlFor="active" className="text-sm font-medium text-foreground">
              Usuário Ativo
            </Label>
            <Switch
              id="active"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              disabled={!canEditUser || user.id === currentUser.id}
            />
          </div>
        </form>

        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={updateUserMutation.isPending || !canEditUser}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateUserMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}