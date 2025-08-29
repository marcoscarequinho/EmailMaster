import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Server, Shield, Users } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
  });

  // Redirect to home if already logged in
  if (!isLoading && user) {
    window.location.href = "/";
    return null;
  }

  const loginMutation = useMutation({
    mutationFn: async (credentials: typeof loginData) => {
      const response = await apiRequest('POST', '/api/login', credentials);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao EmailServer Pro!",
      });
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Erro no login",
        description: "Usuário ou senha incorretos.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: typeof registerData) => {
      const response = await apiRequest('POST', '/api/register', credentials);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conta criada com sucesso",
        description: "Bem-vindo ao EmailServer Pro!",
      });
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Erro no cadastro",
        description: "Não foi possível criar a conta. Verifique os dados.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha usuário e senha.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username || !registerData.password || !registerData.firstName || !registerData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A confirmação de senha deve ser igual à senha.",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(registerData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login/Register Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Mail className="mx-auto text-4xl text-primary mb-4 h-16 w-16" />
            <h1 className="text-3xl font-bold text-foreground mb-2">EmailServer Pro</h1>
            <p className="text-muted-foreground">Sistema Profissional de E-mail</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Cadastro</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <Card className="p-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="text-sm font-medium">
                      Usuário
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={loginData.username}
                      onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Digite seu usuário"
                      data-testid="input-login-username"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Digite sua senha"
                      data-testid="input-login-password"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full py-6 text-lg"
                    disabled={loginMutation.isPending}
                    data-testid="button-submit-login"
                  >
                    {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>

                {/* Demo credentials */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Credenciais de Demonstração:</p>
                  <p className="text-xs text-muted-foreground">Super Admin: <strong>0admin</strong> / <strong>BB03@5bb03#5</strong></p>
                </div>
              </Card>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <Card className="p-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        Nome
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                        data-testid="input-register-first-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Sobrenome
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                        data-testid="input-register-last-name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      data-testid="input-register-email"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="regUsername" className="text-sm font-medium">
                      Usuário
                    </Label>
                    <Input
                      id="regUsername"
                      type="text"
                      value={registerData.username}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                      data-testid="input-register-username"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="regPassword" className="text-sm font-medium">
                      Senha
                    </Label>
                    <Input
                      id="regPassword"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      data-testid="input-register-password"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirmar Senha
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      data-testid="input-register-confirm-password"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full py-6 text-lg"
                    disabled={registerMutation.isPending}
                    data-testid="button-submit-register"
                  >
                    {registerMutation.isPending ? 'Criando conta...' : 'Criar Conta'}
                  </Button>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Sistema Profissional de E-mail
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4 text-left">
              <Server className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Gestão de Domínios</h3>
                <p className="text-sm text-muted-foreground">Controle total sobre domínios de email</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-left">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Segurança Avançada</h3>
                <p className="text-sm text-muted-foreground">Autenticação em camadas e logs de auditoria</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-left">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Hierarquia de Usuários</h3>
                <p className="text-sm text-muted-foreground">Super Admin → Admin → Cliente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}