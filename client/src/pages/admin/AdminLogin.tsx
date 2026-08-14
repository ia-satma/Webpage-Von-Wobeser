import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { establishAdminSession, loadAdminSession } from "@/lib/adminAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogIn, AlertCircle } from "lucide-react";

type LoginFormData = {
  username: string;
  password: string;
};

const createLoginSchema = (t: { emailRequired: string; passwordMin: string }) => z.object({
  username: z.string().min(1, t.emailRequired),
  // El acceso mantiene compatibilidad con credenciales heredadas; el rango
  // de 12–16 caracteres se aplica únicamente al crear o cambiar contraseñas.
  password: z.string().min(1, t.passwordMin).max(128),
});

const translations = {
  en: {
    title: "Admin Login",
    description: "Enter your credentials to access the admin panel",
    username: "Email or username",
    usernamePlaceholder: "Enter your email or username",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    login: "Login",
    loggingIn: "Logging in...",
    loginSuccess: "Login successful",
    loginError: "Login failed",
    invalidCredentials: "Invalid email or password",
    emailRequired: "Email is required",
    passwordMin: "Password is required",
  },
  es: {
    title: "Inicio de Sesión Admin",
    description: "Ingrese sus credenciales para acceder al panel de administración",
    username: "Correo electrónico o usuario",
    usernamePlaceholder: "Ingrese su correo o usuario",
    password: "Contraseña",
    passwordPlaceholder: "Ingrese su contraseña",
    login: "Iniciar Sesión",
    loggingIn: "Iniciando sesión...",
    loginSuccess: "Inicio de sesión exitoso",
    loginError: "Error al iniciar sesión",
    invalidCredentials: "Correo electrónico o contraseña inválidos",
    emailRequired: "El correo electrónico es obligatorio",
    passwordMin: "La contraseña es obligatoria",
  },
  de: {
    title: "Admin-Anmeldung",
    description: "Geben Sie Ihre Zugangsdaten ein, um auf das Admin-Panel zuzugreifen",
    username: "E-Mail oder Benutzername",
    usernamePlaceholder: "Geben Sie Ihre E-Mail oder Ihren Benutzernamen ein",
    password: "Passwort",
    passwordPlaceholder: "Geben Sie Ihr Passwort ein",
    login: "Anmelden",
    loggingIn: "Anmeldung läuft...",
    loginSuccess: "Anmeldung erfolgreich",
    loginError: "Anmeldung fehlgeschlagen",
    invalidCredentials: "Ungültige E-Mail oder Passwort",
    emailRequired: "E-Mail ist erforderlich",
    passwordMin: "Das Passwort ist erforderlich",
  },
  zh: {
    title: "管理员登录",
    description: "输入您的凭据以访问管理面板",
    username: "电子邮件或用户名",
    usernamePlaceholder: "输入您的电子邮件或用户名",
    password: "密码",
    passwordPlaceholder: "输入您的密码",
    login: "登录",
    loggingIn: "登录中...",
    loginSuccess: "登录成功",
    loginError: "登录失败",
    invalidCredentials: "电子邮件或密码无效",
    emailRequired: "电子邮件是必填项",
    passwordMin: "密码为必填项",
  },
  ko: {
    title: "관리자 로그인",
    description: "관리자 패널에 액세스하려면 자격 증명을 입력하세요",
    username: "이메일 또는 사용자 이름",
    usernamePlaceholder: "이메일 또는 사용자 이름을 입력하세요",
    password: "비밀번호",
    passwordPlaceholder: "비밀번호를 입력하세요",
    login: "로그인",
    loggingIn: "로그인 중...",
    loginSuccess: "로그인 성공",
    loginError: "로그인 실패",
    invalidCredentials: "잘못된 이메일 또는 비밀번호",
    emailRequired: "이메일은 필수입니다",
    passwordMin: "비밀번호는 필수입니다",
  },
  ja: {
    title: "管理者ログイン",
    description: "管理パネルにアクセスするには認証情報を入力してください",
    username: "メールアドレスまたはユーザー名",
    usernamePlaceholder: "メールアドレスまたはユーザー名を入力",
    password: "パスワード",
    passwordPlaceholder: "パスワードを入力",
    login: "ログイン",
    loggingIn: "ログイン中...",
    loginSuccess: "ログイン成功",
    loginError: "ログイン失敗",
    invalidCredentials: "メールアドレスまたはパスワードが無効です",
    emailRequired: "メールアドレスは必須です",
    passwordMin: "パスワードは必須です",
  },
  ar: {
    title: "تسجيل دخول المسؤول",
    description: "أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة الإدارة",
    username: "البريد الإلكتروني أو اسم المستخدم",
    usernamePlaceholder: "أدخل بريدك الإلكتروني أو اسم المستخدم",
    password: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    login: "تسجيل الدخول",
    loggingIn: "جاري تسجيل الدخول...",
    loginSuccess: "تم تسجيل الدخول بنجاح",
    loginError: "فشل تسجيل الدخول",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صالحة",
    emailRequired: "البريد الإلكتروني مطلوب",
    passwordMin: "كلمة المرور مطلوبة",
  },
  ru: {
    title: "Вход администратора",
    description: "Введите учетные данные для доступа к панели администратора",
    username: "Электронная почта или имя пользователя",
    usernamePlaceholder: "Введите электронную почту или имя пользователя",
    password: "Пароль",
    passwordPlaceholder: "Введите пароль",
    login: "Войти",
    loggingIn: "Вход в систему...",
    loginSuccess: "Вход выполнен успешно",
    loginError: "Ошибка входа",
    invalidCredentials: "Неверная электронная почта или пароль",
    emailRequired: "Электронная почта обязательна",
    passwordMin: "Пароль обязателен",
  },
  fr: {
    title: "Connexion Admin",
    description: "Entrez vos identifiants pour accéder au panneau d'administration",
    username: "E-mail ou nom d’utilisateur",
    usernamePlaceholder: "Saisissez votre e-mail ou nom d’utilisateur",
    password: "Mot de passe",
    passwordPlaceholder: "Entrez votre mot de passe",
    login: "Connexion",
    loggingIn: "Connexion en cours...",
    loginSuccess: "Connexion réussie",
    loginError: "Échec de la connexion",
    invalidCredentials: "Email ou mot de passe invalide",
    emailRequired: "L'email est requis",
    passwordMin: "Le mot de passe est requis",
  },
  it: {
    title: "Login Admin",
    description: "Inserisci le tue credenziali per accedere al pannello di amministrazione",
    username: "Email o nome utente",
    usernamePlaceholder: "Inserisci email o nome utente",
    password: "Password",
    passwordPlaceholder: "Inserisci la tua password",
    login: "Accedi",
    loggingIn: "Accesso in corso...",
    loginSuccess: "Accesso effettuato con successo",
    loginError: "Accesso fallito",
    invalidCredentials: "Email o password non validi",
    emailRequired: "L'email è obbligatoria",
    passwordMin: "La password è obbligatoria",
  },
};

export default function AdminLogin() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;
  const isSpanish = language === "es";
  
  const loginSchema = createLoginSchema({ 
    emailRequired: t.emailRequired, 
    passwordMin: t.passwordMin 
  });

  useEffect(() => {
    void loadAdminSession().then((user) => {
      if (user) setLocation("/admin/dashboard");
    });
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
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = String(body?.code || "");
        const messages: Record<string, string> = {
          INVALID_CREDENTIALS: t.invalidCredentials,
          LOGIN_RATE_LIMITED: isSpanish
            ? "Demasiados intentos. Espera unos minutos antes de volver a intentar."
            : "Too many attempts. Wait a few minutes before trying again.",
          SCHEMA_MIGRATION_REQUIRED: isSpanish
            ? "El panel necesita completar una actualización de base de datos antes de iniciar sesión."
            : "The administration panel must complete a database update before you can sign in.",
          LOGIN_FAILED: isSpanish
            ? "El panel no pudo completar el acceso. Intenta nuevamente o solicita apoyo al administrador."
            : "The administration panel could not complete sign-in. Try again or contact the administrator.",
        };
        throw new Error(messages[code] || (typeof body?.error === "string" ? body.error : t.invalidCredentials));
      }
      return body;
    },
    onSuccess: (data) => {
      establishAdminSession(data);
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
    <div className="admin-shell min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(120%_120%_at_50%_0%,hsl(var(--muted))_0%,hsl(var(--background))_60%)]">
      <Card className="w-full max-w-md rounded-xl border-t-2 border-t-primary shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold text-center" data-testid="text-login-title">
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
