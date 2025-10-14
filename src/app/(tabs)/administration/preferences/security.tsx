import React, { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedSafeAreaView } from "@/components/ui/themed-safe-area-view";
import { Header } from "@/components/ui/header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/lib/toast";

// Schema for security settings form
const securitySettingsSchema = z.object({
  // Password Policies
  passwordMinLength: z.number().min(4, "Mínimo de 4 caracteres").max(128, "Máximo de 128 caracteres"),
  passwordRequireUppercase: z.boolean(),
  passwordRequireLowercase: z.boolean(),
  passwordRequireNumbers: z.boolean(),
  passwordRequireSymbols: z.boolean(),
  passwordExpiryDays: z.number().min(0, "Mínimo de 0 dias").max(365, "Máximo de 365 dias"),
  passwordHistoryCount: z.number().min(0, "Mínimo de 0").max(24, "Máximo de 24 senhas"),

  // Login Security
  maxLoginAttempts: z.number().min(1, "Mínimo de 1 tentativa").max(10, "Máximo de 10 tentativas"),
  lockoutDurationMinutes: z.number().min(1, "Mínimo de 1 minuto").max(1440, "Máximo de 1440 minutos"),
  requireTwoFactor: z.boolean(),
  sessionTimeoutMinutes: z.number().min(5, "Mínimo de 5 minutos").max(1440, "Máximo de 1440 minutos"),
  allowMultipleSessions: z.boolean(),

  // IP and Access Control
  ipWhitelistEnabled: z.boolean(),
  ipWhitelist: z.array(z.string()),
  geoBlockingEnabled: z.boolean(),
  allowedCountries: z.array(z.string()),

  // Audit and Monitoring
  auditLoggingEnabled: z.boolean(),
  auditRetentionDays: z.number().min(1, "Mínimo de 1 dia").max(2555, "Máximo de 2555 dias (7 anos)"),
  suspiciousActivityDetection: z.boolean(),
  failedLoginNotifications: z.boolean(),

  // Data Protection
  dataEncryptionAtRest: z.boolean(),
  dataEncryptionInTransit: z.boolean(),
  autoDataBackup: z.boolean(),
  gdprCompliance: z.boolean(),
  dataRetentionDays: z.number().min(30, "Mínimo de 30 dias").max(2555, "Máximo de 2555 dias"),

  // API Security
  apiRateLimitEnabled: z.boolean(),
  apiRateLimitRequestsPerMinute: z.number().min(1, "Mínimo de 1 request").max(1000, "Máximo de 1000 requests"),
  apiKeyRotationDays: z.number().min(1, "Mínimo de 1 dia").max(365, "Máximo de 365 dias"),
  corsEnabled: z.boolean(),
  corsAllowedOrigins: z.array(z.string()),
});

type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;

const defaultValues: SecuritySettingsFormData = {
  // Password Policies
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  passwordExpiryDays: 90,
  passwordHistoryCount: 5,

  // Login Security
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  requireTwoFactor: false,
  sessionTimeoutMinutes: 480,
  allowMultipleSessions: false,

  // IP and Access Control
  ipWhitelistEnabled: false,
  ipWhitelist: [],
  geoBlockingEnabled: false,
  allowedCountries: ["BR"],

  // Audit and Monitoring
  auditLoggingEnabled: true,
  auditRetentionDays: 365,
  suspiciousActivityDetection: true,
  failedLoginNotifications: true,

  // Data Protection
  dataEncryptionAtRest: true,
  dataEncryptionInTransit: true,
  autoDataBackup: true,
  gdprCompliance: true,
  dataRetentionDays: 2555, // 7 years

  // API Security
  apiRateLimitEnabled: true,
  apiRateLimitRequestsPerMinute: 100,
  apiKeyRotationDays: 90,
  corsEnabled: true,
  corsAllowedOrigins: ["https://ankaa.com.br", "https://app.ankaa.com.br"],
};

const SecurityRisk = ({ level }: { level: "low" | "medium" | "high" }) => {
  const config = {
    low: { variant: "success" as const, text: "Baixo", icon: "shield-check" },
    medium: { variant: "warning" as const, text: "Médio", icon: "shield-alert" },
    high: { variant: "destructive" as const, text: "Alto", icon: "shield-x" }
  };

  const { variant, text, icon } = config[level as keyof typeof config];

  return (
    <Badge variant={variant} size="sm" style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Icon name={icon} size={12} className="mr-1" />
      Risco {text}
    </Badge>
  );
};

export default function SecuritySettingsScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: showError, warning, info } = useToast();


  const form = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues,
  });

  const onSubmit = async (data: SecuritySettingsFormData) => {
    // Show confirmation for critical changes
    Alert.alert(
      "Confirmar Alterações de Segurança",
      "As alterações de segurança podem afetar o acesso dos usuários. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => saveSettings(data) }
      ]
    );
  };

  const saveSettings = async (data: SecuritySettingsFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("Security settings saved:", data);
      success("Configurações de segurança salvas com sucesso!");
    } catch (error) {
      console.error("Error saving security settings:", error);
      showError("Erro ao salvar configurações de segurança");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSecurityScore = () => {
    const data = form.getValues();
    let score = 0;

    // Password strength
    if (data.passwordMinLength >= 8) score += 10;
    if (data.passwordRequireUppercase) score += 5;
    if (data.passwordRequireLowercase) score += 5;
    if (data.passwordRequireNumbers) score += 5;
    if (data.passwordRequireSymbols) score += 10;

    // Login security
    if (data.requireTwoFactor) score += 20;
    if (data.maxLoginAttempts <= 5) score += 5;
    if (data.sessionTimeoutMinutes <= 480) score += 5;

    // Monitoring
    if (data.auditLoggingEnabled) score += 10;
    if (data.suspiciousActivityDetection) score += 10;

    // Data protection
    if (data.dataEncryptionAtRest) score += 10;
    if (data.dataEncryptionInTransit) score += 10;

    return Math.min(100, score);
  };

  const securityScore = calculateSecurityScore();
  const riskLevel = securityScore >= 80 ? "low" : securityScore >= 60 ? "medium" : "high";

  return (
    <ThemedSafeAreaView>
      <Header
        title="Segurança"
        showBackButton
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            onPress={form.handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icon name="loading" size={16} className="text-primary" />
            ) : (
              "Salvar"
            )}
          </Button>
        }
      />

      <ThemedView className="flex-1">
        <ScrollView className="flex-1 p-4">
          {/* Security Score Card */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center justify-between">
                <div className="flex-row items-center">
                  <Icon name="shield-check" size={20} className="text-primary mr-2" />
                  Pontuação de Segurança
                </div>
                <SecurityRisk level={riskLevel} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex-row items-center justify-between mb-2">
                <p className="text-2xl font-bold text-primary">{securityScore}%</p>
                <p className="text-sm text-muted-foreground">
                  {securityScore >= 80 ? "Excelente" : securityScore >= 60 ? "Bom" : "Precisa melhorar"}
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    securityScore >= 80 ? "bg-green-500" :
                    securityScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${securityScore}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Password Policies */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Icon name="key" size={20} className="text-primary mr-2" />
                Políticas de Senha
              </CardTitle>
              <CardDescription>
                Configure os requisitos para senhas de usuários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Comprimento Mínimo: {form.watch("passwordMinLength")} caracteres</Label>
                <Controller
                  control={form.control}
                  name="passwordMinLength"
                  render={({ field }) => (
                    <Slider
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                      maximumValue={32}
                      minimumValue={4}
                      step={1}
                      style={{ marginTop: 8 }}
                    />
                  )}
                />
              </div>

              <div className="flex-row items-center justify-between">
                <Label className="text-base">Requerer Maiúsculas</Label>
                <Controller
                  control={form.control}
                  name="passwordRequireUppercase"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex-row items-center justify-between">
                <Label className="text-base">Requerer Minúsculas</Label>
                <Controller
                  control={form.control}
                  name="passwordRequireLowercase"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex-row items-center justify-between">
                <Label className="text-base">Requerer Números</Label>
                <Controller
                  control={form.control}
                  name="passwordRequireNumbers"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex-row items-center justify-between">
                <Label className="text-base">Requerer Símbolos</Label>
                <Controller
                  control={form.control}
                  name="passwordRequireSymbols"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <Separator />

              <div>
                <Label>Expiração da Senha (dias)</Label>
                <Controller
                  control={form.control}
                  name="passwordExpiryDays"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        placeholder="90"
                        value={field.value.toString()}
                        onChangeText={(text) => field.onChange(parseInt(text) || 90)}
                        keyboardType="numeric"
                        className={fieldState.error ? "border-destructive" : ""}
                      />
                      {fieldState.error && (
                        <p className="text-destructive text-xs mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div>
                <Label>Histórico de Senhas</Label>
                <Controller
                  control={form.control}
                  name="passwordHistoryCount"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        placeholder="5"
                        value={field.value.toString()}
                        onChangeText={(text) => field.onChange(parseInt(text) || 5)}
                        keyboardType="numeric"
                        className={fieldState.error ? "border-destructive" : ""}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Número de senhas antigas que não podem ser reutilizadas
                      </p>
                      {fieldState.error && (
                        <p className="text-destructive text-xs mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Login Security */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Icon name="user-check" size={20} className="text-primary mr-2" />
                Segurança de Login
              </CardTitle>
              <CardDescription>
                Configure políticas de autenticação e sessão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Máximo de Tentativas de Login</Label>
                <Controller
                  control={form.control}
                  name="maxLoginAttempts"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        placeholder="5"
                        value={field.value.toString()}
                        onChangeText={(text) => field.onChange(parseInt(text) || 5)}
                        keyboardType="numeric"
                        className={fieldState.error ? "border-destructive" : ""}
                      />
                      {fieldState.error && (
                        <p className="text-destructive text-xs mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div>
                <Label>Duração do Bloqueio (minutos)</Label>
                <Controller
                  control={form.control}
                  name="lockoutDurationMinutes"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        placeholder="30"
                        value={field.value.toString()}
                        onChangeText={(text) => field.onChange(parseInt(text) || 30)}
                        keyboardType="numeric"
                        className={fieldState.error ? "border-destructive" : ""}
                      />
                      {fieldState.error && (
                        <p className="text-destructive text-xs mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Obrigatória para todos os usuários
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="requireTwoFactor"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div>
                <Label>Timeout de Sessão (minutos)</Label>
                <Controller
                  control={form.control}
                  name="sessionTimeoutMinutes"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        placeholder="480"
                        value={field.value.toString()}
                        onChangeText={(text) => field.onChange(parseInt(text) || 480)}
                        keyboardType="numeric"
                        className={fieldState.error ? "border-destructive" : ""}
                      />
                      {fieldState.error && (
                        <p className="text-destructive text-xs mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Múltiplas Sessões</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permite login simultâneo em vários dispositivos
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="allowMultipleSessions"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Audit and Monitoring */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Icon name="eye" size={20} className="text-primary mr-2" />
                Auditoria e Monitoramento
              </CardTitle>
              <CardDescription>
                Configure logs de auditoria e detecção de atividades suspeitas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Log de Auditoria</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Registra todas as ações dos usuários
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="auditLoggingEnabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {form.watch("auditLoggingEnabled") && (
                <div>
                  <Label>Retenção de Logs (dias)</Label>
                  <Controller
                    control={form.control}
                    name="auditRetentionDays"
                    render={({ field, fieldState }) => (
                      <div>
                        <Input
                          placeholder="365"
                          value={field.value.toString()}
                          onChangeText={(text) => field.onChange(parseInt(text) || 365)}
                          keyboardType="numeric"
                          className={fieldState.error ? "border-destructive" : ""}
                        />
                        {fieldState.error && (
                          <p className="text-destructive text-xs mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              )}

              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Detecção de Atividade Suspeita</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Alerta sobre padrões anômalos de uso
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="suspiciousActivityDetection"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Notificações de Login Falhado</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notifica administradores sobre tentativas mal sucedidas
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="failedLoginNotifications"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Icon name="database" size={20} className="text-primary mr-2" />
                Proteção de Dados
              </CardTitle>
              <CardDescription>
                Configure criptografia e políticas de retenção de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Criptografia em Repouso</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dados criptografados no banco de dados
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="dataEncryptionAtRest"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled // This should be managed at infrastructure level
                    />
                  )}
                />
              </div>

              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Criptografia em Trânsito</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    HTTPS/TLS para todas as comunicações
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="dataEncryptionInTransit"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled // This should be managed at infrastructure level
                    />
                  )}
                />
              </div>

              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Conformidade LGPD/GDPR</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Aplica políticas de proteção de dados
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="gdprCompliance"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div>
                <Label>Retenção de Dados (dias)</Label>
                <Controller
                  control={form.control}
                  name="dataRetentionDays"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        placeholder="2555"
                        value={field.value.toString()}
                        onChangeText={(text) => field.onChange(parseInt(text) || 2555)}
                        keyboardType="numeric"
                        className={fieldState.error ? "border-destructive" : ""}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Dados são automaticamente removidos após este período
                      </p>
                      {fieldState.error && (
                        <p className="text-destructive text-xs mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onPress={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="mb-6"
          >
            {isLoading ? (
              <>
                <Icon name="loading" size={16} className="text-primary-foreground mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Icon name="shield-check" size={16} className="text-primary-foreground mr-2" />
                Salvar Configurações de Segurança
              </>
            )}
          </Button>
        </ScrollView>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}
