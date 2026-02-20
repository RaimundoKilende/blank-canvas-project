import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Zap, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);

      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando...",
      });

      // Navigation will be handled by the auth provider
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-8 safe-area-inset">
        {/* Logo & Brand */}
        <div className="text-center mb-8 animate-in">
          <Link to="/" className="inline-flex flex-col items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-primary/30 rounded-2xl" />
              <div className="relative w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-2xl glow-effect">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <span className="font-display text-2xl font-bold text-foreground">Kilende</span>
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Bem-vindo de volta
          </h1>
          <p className="text-muted-foreground text-lg">
            Entre na sua conta para continuar
          </p>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-md slide-up">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-border/50 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors">
                    <Mail className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 text-base rounded-xl bg-secondary/50 border-border/50 focus:border-primary focus:bg-background transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Senha
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 text-base rounded-xl bg-secondary/50 border-border/50 focus:border-primary focus:bg-background transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold gradient-primary text-primary-foreground rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Entrar</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-muted-foreground">
                Não tem uma conta?{" "}
                <Link 
                  to="/register" 
                  className="text-primary hover:text-primary/80 font-semibold transition-colors inline-flex items-center gap-1"
                >
                  <Sparkles className="w-4 h-4" />
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="mt-8 text-sm text-muted-foreground/60 text-center animate-in">
          Técnicos qualificados à sua porta
        </p>
      </div>
    </div>
  );
}
