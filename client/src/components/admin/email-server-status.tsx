import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, Mail, AlertCircle, CheckCircle, TestTube } from "lucide-react";

interface EmailServiceStatus {
  configured: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
}

export default function EmailServerStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['/api/email-service/status'],
    queryFn: () => apiRequest('GET', '/api/email-service/status'),
  });

  const testConnectionMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/email-service/test'),
    onSuccess: (data) => {
      toast({
        title: data.connected ? "Conexão OK" : "Falha na Conexão",
        description: data.message,
        variant: data.connected ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a conexão SMTP.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Status do Servidor de Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Configuração SMTP</span>
          </div>
          <Badge variant={status?.configured ? "default" : "destructive"}>
            {status?.configured ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <AlertCircle className="h-3 w-3 mr-1" />
            )}
            {status?.configured ? "Configurado" : "Não Configurado"}
          </Badge>
        </div>

        {status?.configured && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Host:</span>
                <span className="ml-2">{status.smtpHost}</span>
              </div>
              <div>
                <span className="font-medium">Porta:</span>
                <span className="ml-2">{status.smtpPort}</span>
              </div>
              <div>
                <span className="font-medium">Seguro:</span>
                <span className="ml-2">{status.smtpSecure ? "Sim" : "Não"}</span>
              </div>
              <div>
                <span className="font-medium">Usuário:</span>
                <span className="ml-2">{status.smtpUser}</span>
              </div>
            </div>
          </div>
        )}

        {!status?.configured && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">
                  Servidor de Email Desabilitado
                </p>
                <p className="text-yellow-700">
                  Configure as variáveis de ambiente SMTP_USER e SMTP_PASS no arquivo .env para habilitar o envio real de emails.
                </p>
                <p className="text-yellow-700 mt-2">
                  <strong>Para Gmail:</strong> Use uma senha de aplicativo, não sua senha normal.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={() => testConnectionMutation.mutate()}
            disabled={testConnectionMutation.isPending || !status?.configured}
            variant="outline"
            size="sm"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testConnectionMutation.isPending ? "Testando..." : "Testar Conexão"}
          </Button>
          
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/email-service/status'] })}
            variant="ghost"
            size="sm"
          >
            Atualizar Status
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Modo Atual:</strong> {status?.configured ? "SMTP Real" : "Simulação (apenas interno)"}</p>
          <p>Emails internos (entre usuários do sistema) sempre funcionam.</p>
        </div>
      </CardContent>
    </Card>
  );
}