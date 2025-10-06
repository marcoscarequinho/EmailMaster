import { Settings, Database, Shield, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground">
          Gerencie as configurações globais do EmailServer Pro
        </p>
      </div>

      <div className="grid gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <span>Banco de Dados</span>
              <Badge variant="default" className="bg-green-500">Conectado</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>Servidor de Email</span>
              <Badge variant="default" className="bg-green-500">Ativo</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>Autenticação</span>
              <Badge variant="default" className="bg-green-500">Funcionando</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Configurações de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <span>Sessões Ativas</span>
              <Badge variant="outline">Gerenciadas</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>Logs de Auditoria</span>
              <Badge variant="outline">Habilitados</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>Controle de Acesso</span>
              <Badge variant="outline">Baseado em Roles</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configurações de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <span>Domínios Configurados</span>
              <Badge variant="outline">Ver Domínios</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>Limite de Armazenamento</span>
              <Badge variant="outline">Ilimitado</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span>Filtro Anti-Spam</span>
              <Badge variant="default" className="bg-green-500">Ativo</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}