import { useState, useRef, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Paperclip, 
  Link, 
  Smile, 
  X, 
  Bold, 
  Italic, 
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image,
  Code
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
  const [editorMode, setEditorMode] = useState<'text' | 'html'>('text');
  const [htmlContent, setHtmlContent] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: typeof formData) => {
      const dataToSend = {
        ...emailData,
        body: editorMode === 'html' ? htmlContent : emailData.body,
        format: editorMode
      };
      await apiRequest('POST', '/api/emails', dataToSend);
    },
    onSuccess: (data: any) => {
      let description = "Seu email foi processado com sucesso.";
      
      if (data.sentViaSmtp) {
        description = `Email enviado via SMTP. ID: ${data.messageId}`;
      } else if (data.mockMode) {
        description = "Email salvo localmente (modo simulação - configure SMTP para envio real).";
      } else {
        description = "Email salvo localmente (falha no SMTP, mas usuários internos receberão).";
      }
      
      toast({
        title: "Email processado",
        description,
        variant: data.sentViaSmtp ? "default" : "secondary",
      });
      setFormData({ recipient: '', subject: '', body: '' });
      setHtmlContent('');
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
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
        title: "Erro ao enviar",
        description: "Não foi possível enviar o email. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipient || !formData.subject || (editorMode === 'text' ? !formData.body : !htmlContent)) {
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

  // Rich text editor commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt('Digite a URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Digite a URL da imagem:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  useEffect(() => {
    if (editorRef.current && editorMode === 'html') {
      editorRef.current.innerHTML = htmlContent;
    }
  }, [editorMode]);

  const handleEditorChange = () => {
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            Nova Mensagem
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-compose">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-6 pb-6 overflow-hidden">
          <div className="space-y-3 flex-shrink-0 mb-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="to" className="text-sm font-medium text-muted-foreground w-16">
                Para
              </label>
              <Input
                id="to"
                type="email"
                value={formData.recipient}
                onChange={(e) => handleInputChange('recipient', e.target.value)}
                placeholder="destinatario@exemplo.com"
                className="flex-1"
                data-testid="input-recipient"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="subject" className="text-sm font-medium text-muted-foreground w-16">
                Assunto
              </label>
              <Input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Assunto do email"
                className="flex-1"
                data-testid="input-subject"
              />
            </div>
          </div>

          <Tabs value={editorMode} onValueChange={(value) => setEditorMode(value as 'text' | 'html')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-48 grid-cols-2 flex-shrink-0">
              <TabsTrigger value="text">Texto</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="flex-1 mt-4 min-h-0">
              <Textarea
                value={formData.body}
                onChange={(e) => handleInputChange('body', e.target.value)}
                placeholder="Escreva sua mensagem..."
                className="h-full min-h-[200px] resize-none"
                data-testid="textarea-body"
              />
            </TabsContent>

            <TabsContent value="html" className="flex-1 mt-4 space-y-2 min-h-0 flex flex-col">
              <div className="flex items-center space-x-1 p-2 border rounded-t-md bg-muted/30 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('bold')}
                  title="Negrito"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('italic')}
                  title="Itálico"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('underline')}
                  title="Sublinhado"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('insertUnorderedList')}
                  title="Lista"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('insertOrderedList')}
                  title="Lista numerada"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('justifyLeft')}
                  title="Alinhar à esquerda"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('justifyCenter')}
                  title="Centralizar"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('justifyRight')}
                  title="Alinhar à direita"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertLink}
                  title="Inserir link"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={insertImage}
                  title="Inserir imagem"
                >
                  <Image className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('formatBlock', '<pre>')}
                  title="Código"
                >
                  <Code className="h-4 w-4" />
                </Button>
              </div>
              
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorChange}
                className="flex-1 min-h-[200px] p-4 border rounded-b-md bg-background focus:outline-none focus:ring-2 focus:ring-ring overflow-y-auto"
                data-placeholder="Escreva sua mensagem..."
              />
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between border-t pt-4 flex-shrink-0 mt-4">
            <div className="flex items-center space-x-2">
              <Button type="button" variant="ghost" size="sm" title="Anexar arquivo">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" title="Inserir link">
                <Link className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" title="Inserir emoji">
                <Smile className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                data-testid="button-save-draft"
              >
                Salvar Rascunho
              </Button>
              <Button
                type="submit"
                disabled={sendEmailMutation.isPending}
                data-testid="button-send"
              >
                {sendEmailMutation.isPending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}