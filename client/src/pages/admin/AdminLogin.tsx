import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { setToken, isAuthenticated } from "@/lib/adminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogIn, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const translations = {
  en: {
    title: "Admin Login",
    description: "Enter your credentials to access the admin panel",
    username: "Username",
    usernamePlaceholder: "Enter your username",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    login: "Login",
    loggingIn: "Logging in...",
    loginSuccess: "Login successful",
    loginError: "Login failed",
    invalidCredentials: "Invalid username or password",
  },
  es: {
    title: "Inicio de Sesión Admin",
    description: "Ingrese sus credenciales para acceder al panel de administración",
    username: "Usuario",
    usernamePlaceholder: "Ingrese su usuario",
    password: "Contraseña",
    passwordPlaceholder: "Ingrese su contraseña",
    login: "Iniciar Sesión",
    loggingIn: "Iniciando sesión...",
    loginSuccess: "Inicio de sesión exitoso",
    loginError: "Error al iniciar sesión",
    invalidCredentials: "Usuario o contraseña inválidos",
  },
};

export default function AdminLogin() {
  const { displayLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const t = translations[displayLanguage];

  useEffect(() => {
    if (isAuthenticated()) {
      setLocation("/admin/dashboard");
    }
  }, [setLocation]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || t.invalidCredentials);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      setToken(data.token);
      toast({
        title: t.loginSuccess,
      });
      setLocation("/admin/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: t.loginError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center" data-testid="text-login-title">
            {t.title}
          </CardTitle>
          <CardDescription className="text-center" data-testid="text-login-description">
            {t.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.username}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t.usernamePlaceholder}
                        autoComplete="username"
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-username" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.password}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t.passwordPlaceholder}
                        autoComplete="current-password"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage data-testid="error-password" />
                  </FormItem>
                )}
              />

              {loginMutation.isError && (
                <div 
                  className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm"
                  data-testid="error-login-message"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{loginMutation.error?.message || t.invalidCredentials}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  t.loggingIn
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t.login}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
