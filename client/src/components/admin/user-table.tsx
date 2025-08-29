import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, UserMinus, Trash2, UserCheck, Plus } from "lucide-react";
import CreateUserModal from "./create-user-modal";
import type { User } from "@shared/schema";

interface UserTableProps {
  user: User;
}

export default function UserTable({ user }: UserTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users', { role: roleFilter, search }],
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/users/stats'],
    retry: false,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: any }) => {
      await apiRequest('PATCH', `/api/users/${userId}`, userData);
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas.",
      });
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
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    },
  });

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

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    ) : (
      <Badge variant="secondary">Inativo</Badge>
    );
  };

  const formatLastLogin = (lastLoginAt: string | null) => {
    if (!lastLoginAt) return 'Nunca';
    
    const date = new Date(lastLoginAt);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} horas atrás`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleToggleActive = (userId: string, currentStatus: boolean) => {
    updateUserMutation.mutate({
      userId,
      userData: { isActive: !currentStatus }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Gerenciamento de Usuários</h1>
        <Button 
          onClick={() => setCreateUserOpen(true)}
          data-testid="button-create-user"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* User Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-users">{stats.total}</p>
              </div>
              <div className="text-2xl text-primary">👥</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-admins">{stats.admins}</p>
              </div>
              <div className="text-2xl text-yellow-500">🛡️</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-clients">{stats.clients}</p>
              </div>
              <div className="text-2xl text-green-500">👤</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos Hoje</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-active-today">{stats.activeToday}</p>
              </div>
              <div className="text-2xl text-green-500">📈</div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Lista de Usuários</h2>
            <div className="flex items-center space-x-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48" data-testid="select-role-filter">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="text"
                placeholder="Buscar usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
                data-testid="input-search-users"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Usuário</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">E-mail</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Último Acesso</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((userData: User) => (
                <tr key={userData.id} className="hover:bg-muted/50" data-testid={`user-row-${userData.id}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userData.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {(userData.firstName?.[0] || '') + (userData.lastName?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground" data-testid={`text-user-name-${userData.id}`}>
                        {userData.firstName} {userData.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-muted-foreground" data-testid={`text-user-email-${userData.id}`}>
                    {userData.email}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`role-badge ${getRoleClass(userData.role)}`} data-testid={`text-user-role-${userData.id}`}>
                      {getRoleLabel(userData.role)}
                    </span>
                  </td>
                  <td className="py-4 px-6" data-testid={`text-user-status-${userData.id}`}>
                    {getStatusBadge(userData.isActive)}
                  </td>
                  <td className="py-4 px-6 text-muted-foreground" data-testid={`text-user-last-login-${userData.id}`}>
                    {formatLastLogin(userData.lastLoginAt)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" title="Editar" data-testid={`button-edit-${userData.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {userData.isActive ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Desativar"
                          onClick={() => handleToggleActive(userData.id, userData.isActive)}
                          disabled={updateUserMutation.isPending}
                          data-testid={`button-deactivate-${userData.id}`}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Ativar"
                          onClick={() => handleToggleActive(userData.id, userData.isActive)}
                          disabled={updateUserMutation.isPending}
                          data-testid={`button-activate-${userData.id}`}
                        >
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {userData.role !== 'super_admin' && (
                        <Button variant="ghost" size="sm" title="Excluir" data-testid={`button-delete-${userData.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
          </div>
        )}
      </div>

      <CreateUserModal 
        isOpen={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        currentUser={user}
      />
    </div>
  );
}
