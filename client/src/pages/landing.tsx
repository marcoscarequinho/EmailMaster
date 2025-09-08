import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="max-w-md w-full mx-4">
        <Card className="shadow-2xl p-8 border border-border">
          <div className="text-center mb-8">
            <Mail className="mx-auto text-4xl text-primary mb-4 h-16 w-16" />
            <h1 className="text-3xl font-bold text-foreground mb-2">EmailServer Pro</h1>
            <p className="text-muted-foreground">Sistema Profissional de E-mail</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Button 
                onClick={handleLogin} 
                className="w-full py-6 text-lg font-medium"
                data-testid="button-login"
              >
                Fazer Login
              </Button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Sistema seguro com autenticação em camadas
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
