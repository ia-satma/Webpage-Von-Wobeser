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

type LoginFormData = {
  username: string;
  password: string;
};

const createLoginSchema = (t: { emailRequired: string; passwordMin: string }) => z.object({
  username: z.string().min(1, t.emailRequired),
  password: z.string().min(6, t.passwordMin),
});

const translations = {
  en: {
    title: "Admin Login",
    description: "Enter your credentials to access the admin panel",
    username: "Email",
    usernamePlaceholder: "Enter your email",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    login: "Login",
    loggingIn: "Logging in...",
    loginSuccess: "Login successful",
    loginError: "Login failed",
    invalidCredentials: "Invalid email or password",
    emailRequired: "Email is required",
    passwordMin: "Password must be at least 6 characters",
  },
  es: {
    title: "Inicio de Sesión Admin",
    description: "Ingrese sus credenciales para acceder al panel de administración",
    username: "Correo Electrónico",
    usernamePlaceholder: "Ingrese su correo electrónico",
    password: "Contraseña",
    passwordPlaceholder: "Ingrese su contraseña",
    login: "Iniciar Sesión",
    loggingIn: "Iniciando sesión...",
    loginSuccess: "Inicio de sesión exitoso",
    loginError: "Error al iniciar sesión",
    invalidCredentials: "Correo electrónico o contraseña inválidos",
    emailRequired: "El correo electrónico es obligatorio",
    passwordMin: "La contraseña debe tener al menos 6 caracteres",
  },
  de: {
    title: "Admin-Anmeldung",
    description: "Geben Sie Ihre Zugangsdaten ein, um auf das Admin-Panel zuzugreifen",
    username: "E-Mail",
    usernamePlaceholder: "Geben Sie Ihre E-Mail ein",
    password: "Passwort",
    passwordPlaceholder: "Geben Sie Ihr Passwort ein",
    login: "Anmelden",
    loggingIn: "Anmeldung läuft...",
    loginSuccess: "Anmeldung erfolgreich",
    loginError: "Anmeldung fehlgeschlagen",
    invalidCredentials: "Ungültige E-Mail oder Passwort",
    emailRequired: "E-Mail ist erforderlich",
    passwordMin: "Das Passwort muss mindestens 6 Zeichen haben",
  },
  zh: {
    title: "管理员登录",
    description: "输入您的凭据以访问管理面板",
    username: "电子邮件",
    usernamePlaceholder: "输入您的电子邮件",
    password: "密码",
    passwordPlaceholder: "输入您的密码",
    login: "登录",
    loggingIn: "登录中...",
    loginSuccess: "登录成功",
    loginError: "登录失败",
    invalidCredentials: "电子邮件或密码无效",
    emailRequired: "电子邮件是必填项",
    passwordMin: "密码必须至少6个字符",
  },
  ko: {
    title: "관리자 로그인",
    description: "관리자 패널에 액세스하려면 자격 증명을 입력하세요",
    username: "이메일",
    usernamePlaceholder: "이메일을 입력하세요",
    password: "비밀번호",
    passwordPlaceholder: "비밀번호를 입력하세요",
    login: "로그인",
    loggingIn: "로그인 중...",
    loginSuccess: "로그인 성공",
    loginError: "로그인 실패",
    invalidCredentials: "잘못된 이메일 또는 비밀번호",
    emailRequired: "이메일은 필수입니다",
    passwordMin: "비밀번호는 최소 6자 이상이어야 합니다",
  },
  ja: {
    title: "管理者ログイン",
    description: "管理パネルにアクセスするには認証情報を入力してください",
    username: "メールアドレス",
    usernamePlaceholder: "メールアドレスを入力",
    password: "パスワード",
    passwordPlaceholder: "パスワードを入力",
    login: "ログイン",
    loggingIn: "ログイン中...",
    loginSuccess: "ログイン成功",
    loginError: "ログイン失敗",
    invalidCredentials: "メールアドレスまたはパスワードが無効です",
    emailRequired: "メールアドレスは必須です",
    passwordMin: "パスワードは6文字以上必要です",
  },
  ar: {
    title: "تسجيل دخول المسؤول",
    description: "أدخل بيانات الاعتماد الخاصة بك للوصول إلى لوحة الإدارة",
    username: "البريد الإلكتروني",
    usernamePlaceholder: "أدخل بريدك الإلكتروني",
    password: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    login: "تسجيل الدخول",
    loggingIn: "جاري تسجيل الدخول...",
    loginSuccess: "تم تسجيل الدخول بنجاح",
    loginError: "فشل تسجيل الدخول",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صالحة",
    emailRequired: "البريد الإلكتروني مطلوب",
    passwordMin: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
  },
  ru: {
    title: "Вход администратора",
    description: "Введите учетные данные для доступа к панели администратора",
    username: "Электронная почта",
    usernamePlaceholder: "Введите электронную почту",
    password: "Пароль",
    passwordPlaceholder: "Введите пароль",
    login: "Войти",
    loggingIn: "Вход в систему...",
    loginSuccess: "Вход выполнен успешно",
    loginError: "Ошибка входа",
    invalidCredentials: "Неверная электронная почта или пароль",
    emailRequired: "Электронная почта обязательна",
    passwordMin: "Пароль должен содержать не менее 6 символов",
  },
  fr: {
    title: "Connexion Admin",
    description: "Entrez vos identifiants pour accéder au panneau d'administration",
    username: "Email",
    usernamePlaceholder: "Entrez votre email",
    password: "Mot de passe",
    passwordPlaceholder: "Entrez votre mot de passe",
    login: "Connexion",
    loggingIn: "Connexion en cours...",
    loginSuccess: "Connexion réussie",
    loginError: "Échec de la connexion",
    invalidCredentials: "Email ou mot de passe invalide",
    emailRequired: "L'email est requis",
    passwordMin: "Le mot de passe doit contenir au moins 6 caractères",
  },
  it: {
    title: "Login Admin",
    description: "Inserisci le tue credenziali per accedere al pannello di amministrazione",
    username: "Email",
    usernamePlaceholder: "Inserisci la tua email",
    password: "Password",
    passwordPlaceholder: "Inserisci la tua password",
    login: "Accedi",
    loggingIn: "Accesso in corso...",
    loginSuccess: "Accesso effettuato con successo",
    loginError: "Accesso fallito",
    invalidCredentials: "Email o password non validi",
    emailRequired: "L'email è obbligatoria",
    passwordMin: "La password deve contenere almeno 6 caratteri",
  },
};

export default function AdminLogin() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  const loginSchema = createLoginSchema({ 
    emailRequired: t.emailRequired, 
    passwordMin: t.passwordMin 
  });

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
