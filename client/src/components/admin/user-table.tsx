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
import { Edit, UserMinus, Trash2, UserCheck, Plus, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CreateUserModal from "./create-user-modal";
import EditUserModal from "./edit-user-modal";
import type { User } from "@shared/schema";

interface UserTableProps {
  user: User;
}

export default function UserTable({ user }: UserTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users', { role: roleFilter, search }],
    retry: false,
  });

  const { data: stats } = useQuery<{total: number; admins: number; clients: number; activeToday: number}>({
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
      // Invalidate all user queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === '/api/users';
        }
      });
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

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log("🔥 FORCE DELETE: Attempting to delete user:", userId);
      // Use the new force-delete route
      await apiRequest('POST', `/api/users/${userId}/force-delete`);
    },
    onSuccess: () => {
      console.log("🔥 FORCE DELETE: User deletion successful");
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
      
      // Force refresh the queries - invalidate all queries that start with /api/users
      console.log("🔥 Invalidating queries...");
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === '/api/users';
        }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/stats'] });
      
      // Also force refetch with exact query key
      setTimeout(() => {
        console.log("🔥 Force refetching queries...");
        queryClient.refetchQueries({ queryKey: ['/api/users', { role: roleFilter, search }] });
        queryClient.refetchQueries({ queryKey: ['/api/users/stats'] });
      }, 100);
    },
    onError: (error) => {
      console.error("🔥 FORCE DELETE: User deletion failed:", error);
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
      
      // Extract more detailed error message
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao excluir",
        description: `${errorMessage}`,
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

  const formatLastLogin = (lastLoginAt: string | Date | null) => {
    if (!lastLoginAt) return 'Nunca';
    
    const date = typeof lastLoginAt === 'string' ? new Date(lastLoginAt) : lastLoginAt;
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

  const handleEditUser = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setEditUserOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      deleteUserMutation.mutate(userId);
    }
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
        {user.role === 'super_admin' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={() => setCreateUserOpen(true)}
                data-testid="button-create-user"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Criar novo usuário ou administrador no sistema</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* User Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-card border border-border rounded-lg p-6 cursor-help">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-total-users">{stats.total}</p>
                  </div>
                  <div className="text-2xl text-primary">👥</div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Número total de usuários registrados no sistema</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-card border border-border rounded-lg p-6 cursor-help">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Administradores</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-admins">{stats.admins}</p>
                  </div>
                  <div className="text-2xl text-yellow-500">🛡️</div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Usuários com permissões administrativas (Admin + Super Admin)</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-card border border-border rounded-lg p-6 cursor-help">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-clients">{stats.clients}</p>
                  </div>
                  <div className="text-2xl text-green-500">👤</div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Usuários finais que podem usar o sistema de email</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-card border border-border rounded-lg p-6 cursor-help">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ativos Hoje</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="stat-active-today">{stats.activeToday}</p>
                  </div>
                  <div className="text-2xl text-green-500">📈</div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Usuários que fizeram login nas últimas 24 horas</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Lista de Usuários</h2>
            <div className="flex items-center space-x-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select value={roleFilter || "all"} onValueChange={(value) => setRoleFilter(value === "all" ? "" : value)}>
                      <SelectTrigger className="w-48" data-testid="select-role-filter">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="client">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filtrar usuários por tipo de permissão</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    type="text"
                    placeholder="Buscar usuário..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64"
                    data-testid="input-search-users"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Buscar por nome, sobrenome ou email</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">Usuário</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">E-mail</th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span>Tipo</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Hierarquia: Super Admin → Admin → Cliente</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </th>
                <th className="text-left py-3 px-6 font-medium text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span>Status</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ativo: pode fazer login • Inativo: bloqueado</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </th>
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditUser(userData)}
                            data-testid={`button-edit-${userData.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar informações do usuário</p>
                        </TooltipContent>
                      </Tooltip>
                      {userData.isActive ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleToggleActive(userData.id, userData.isActive)}
                              disabled={updateUserMutation.isPending}
                              data-testid={`button-deactivate-${userData.id}`}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Desativar usuário - bloqueia acesso ao sistema</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleToggleActive(userData.id, userData.isActive)}
                              disabled={updateUserMutation.isPending}
                              data-testid={`button-activate-${userData.id}`}
                            >
                              <UserCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reativar usuário - permite acesso ao sistema</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {userData.role !== 'super_admin' && user.role === 'super_admin' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteUser(userData.id)}
                              disabled={deleteUserMutation.isPending}
                              data-testid={`button-delete-${userData.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir usuário permanentemente</p>
                          </TooltipContent>
                        </Tooltip>
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
      
      <EditUserModal
        isOpen={editUserOpen}
        onClose={() => {
          setEditUserOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        currentUser={user}
      />
    </div>
  );
}
