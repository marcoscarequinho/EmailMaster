import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/ui/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Globe, Shield, AlertCircle } from "lucide-react";
import type { Domain, CreateDomain } from "@shared/schema";

export default function DomainsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState<CreateDomain>({
    domain: '',
    description: '',
  });

  // Redirect non-super-admins
  if (user && user.role !== 'super_admin') {
    window.location.href = "/";
    return null;
  }

  const { data: domains, isLoading } = useQuery<Domain[]>({
    queryKey: ['/api/domains'],
    enabled: !!user && user.role === 'super_admin',
  });

  const createDomainMutation = useMutation({
    mutationFn: async (domainData: CreateDomain) => {
      const response = await apiRequest('POST', '/api/domains', domainData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/domains'] });
      setIsCreateDialogOpen(false);
      setNewDomain({ domain: '', description: '' });
      toast({
        title: "Domínio criado",
        description: "O domínio foi adicionado ao sistema com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar domínio",
        description: "Não foi possível criar o domínio. Verifique os dados.",
        variant: "destructive",
      });
    },
  });

  const toggleDomainStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest('PATCH', `/api/domains/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/domains'] });
      toast({
        title: "Status atualizado",
        description: "O status do domínio foi alterado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do domínio.",
        variant: "destructive",
      });
    },
  });

  const handleCreateDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.domain.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do domínio é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    createDomainMutation.mutate(newDomain);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user!} onToggleSidebar={() => {}} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Gestão de Domínios</h1>
            <p className="text-muted-foreground">
              Configure e gerencie os domínios de email do sistema
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="space-x-2" data-testid="button-create-domain">
                <Plus className="h-4 w-4" />
                <span>Novo Domínio</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Domínio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDomain} className="space-y-4">
                <div>
                  <Label htmlFor="domain">Nome do Domínio *</Label>
                  <Input
                    id="domain"
                    value={newDomain.domain}
                    onChange={(e) => setNewDomain(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="exemplo.com"
                    data-testid="input-domain-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={newDomain.description || ''}
                    onChange={(e) => setNewDomain(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do domínio (opcional)"
                    data-testid="input-domain-description"
                  />
                </div>


                <div className="flex space-x-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createDomainMutation.isPending}
                    data-testid="button-submit-domain"
                  >
                    {createDomainMutation.isPending ? 'Criando...' : 'Criar Domínio'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-domain"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando domínios...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Domínios do Sistema</span>
              </CardTitle>
              <CardDescription>
                Lista de todos os domínios configurados no sistema de email
              </CardDescription>
            </CardHeader>
            <CardContent>
              {domains && domains.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domínio</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                      <TableRow key={domain.id} data-testid={`row-domain-${domain.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span>{domain.domain}</span>
                          </div>
                        </TableCell>
                        <TableCell>{domain.description || 'Sem descrição'}</TableCell>
                        <TableCell>
                          <Badge variant={domain.isActive ? "default" : "secondary"}>
                            {domain.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {domain.createdAt ? new Date(domain.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={domain.isActive}
                            onCheckedChange={(checked) => 
                              toggleDomainStatusMutation.mutate({ 
                                id: domain.id, 
                                isActive: checked 
                              })
                            }
                            disabled={toggleDomainStatusMutation.isPending}
                            data-testid={`switch-domain-status-${domain.id}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nenhum domínio configurado
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Comece criando o primeiro domínio para o sistema de email
                  </p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    data-testid="button-create-first-domain"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Domínio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Domain Security Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Configurações de Segurança</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>Configuração DNS</span>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Configure os registros MX, SPF e DKIM para cada domínio ativo
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Certificados SSL</span>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Certificados automáticos para todos os domínios ativos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}