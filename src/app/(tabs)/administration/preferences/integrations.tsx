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
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";

// Schema for integration settings form
const integrationSettingsSchema = z.object({
  // API Settings
  apiEnabled: z.boolean(),
  apiBaseUrl: z.string().url("URL da API inválida").optional().or(z.literal("")),
  apiKey: z.string().optional(),
  apiTimeout: z.number().min(1000, "Timeout mínimo de 1000ms").max(60000, "Timeout máximo de 60000ms"),

  // Email Integration
  emailEnabled: z.boolean(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().min(1, "Porta deve ser maior que 0").max(65535, "Porta deve ser menor que 65536").optional(),
  smtpUser: z.string().optional(),
  smtpPassword: z.string().optional(),
  smtpSecure: z.boolean(),

  // Webhook Settings
  webhookEnabled: z.boolean(),
  webhookUrl: z.string().url("URL do webhook inválida").optional().or(z.literal("")),
  webhookSecret: z.string().optional(),
  webhookEvents: z.array(z.string()),

  // SMS Integration
  smsEnabled: z.boolean(),
  smsProvider: z.string().optional(),
  smsApiKey: z.string().optional(),
  smsFromNumber: z.string().optional(),

  // Payment Integration
  paymentEnabled: z.boolean(),
  paymentProvider: z.string().optional(),
  paymentApiKey: z.string().optional(),
  paymentWebhookUrl: z.string().url("URL do webhook de pagamento inválida").optional().or(z.literal("")),

  // File Storage
  storageProvider: z.string(),
  storageApiKey: z.string().optional(),
  storageBucket: z.string().optional(),
  storageRegion: z.string().optional(),
});

type IntegrationSettingsFormData = z.infer<typeof integrationSettingsSchema>;

const defaultValues: IntegrationSettingsFormData = {
  apiEnabled: true,
  apiBaseUrl: "https://api.ankaa.com.br",
  apiKey: "",
  apiTimeout: 30000,

  emailEnabled: false,
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPassword: "",
  smtpSecure: true,

  webhookEnabled: false,
  webhookUrl: "",
  webhookSecret: "",
  webhookEvents: ["user.created", "task.completed", "order.received"],

  smsEnabled: false,
  smsProvider: "twilio",
  smsApiKey: "",
  smsFromNumber: "",

  paymentEnabled: false,
  paymentProvider: "stripe",
  paymentApiKey: "",
  paymentWebhookUrl: "",

  storageProvider: "aws-s3",
  storageApiKey: "",
  storageBucket: "",
  storageRegion: "us-east-1",
};

const webhookEventOptions = [
  { value: "user.created", label: "Usuário Criado" },
  { value: "user.updated", label: "Usuário Atualizado" },
  { value: "task.created", label: "Tarefa Criada" },
  { value: "task.completed", label: "Tarefa Concluída" },
  { value: "order.created", label: "Pedido Criado" },
  { value: "order.received", label: "Pedido Recebido" },
  { value: "inventory.low_stock", label: "Estoque Baixo" },
  { value: "backup.completed", label: "Backup Concluído" },
];

const IntegrationStatus = ({ enabled, lastSync }: { enabled: boolean; lastSync?: string }) => (
  <div className="flex-row items-center">
    <Badge variant={enabled ? "success" : "secondary"} size="sm" style={{ marginRight: 8 }}>
      {enabled ? "Ativo" : "Inativo"}
    </Badge>
    {enabled && lastSync && (
      <p className="text-xs text-muted-foreground">
        Última sinc.: {lastSync}
      </p>
    )}
  </div>
);

const testIntegration = async (type: string) => {
  // Simulate API test
  await new Promise(resolve => setTimeout(resolve, 2000));

  const success = Math.random() > 0.3; // 70% success rate for demo

  if (success) {
    toast.success(`Teste de ${type} realizado com sucesso!`);
  } else {
    toast.error(`Falha no teste de ${type}. Verifique as configurações.`);
  }
};

export default function IntegrationSettingsScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);

  const form = useForm<IntegrationSettingsFormData>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues,
  });

  const onSubmit = async (data: IntegrationSettingsFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("Integration settings saved:", data);
      toast.success("Configurações de integração salvas com sucesso!");
    } catch (error) {
      console.error("Error saving integration settings:", error);
      toast.error("Erro ao salvar configurações de integração");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestIntegration = async (type: string) => {
    setTestingIntegration(type);
    await testIntegration(type);
    setTestingIntegration(null);
  };

  return (
    <ThemedSafeAreaView>
      <Header
        title="Integrações"
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
          {/* API Configuration */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center justify-between">
                <div className="flex-row items-center">
                  <Icon name="api" size={20} className="text-primary mr-2" />
                  API Externa
                </div>
                <IntegrationStatus enabled={form.watch("apiEnabled")} lastSync="há 5 min" />
              </CardTitle>
              <CardDescription>
                Configure a integração com APIs externas para sincronização de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-row items-center justify-between">
                <Label className="text-base">Habilitar API</Label>
                <Controller
                  control={form.control}
                  name="apiEnabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {form.watch("apiEnabled") && (
                <>
                  <div>
                    <Label>URL Base da API</Label>
                    <Controller
                      control={form.control}
                      name="apiBaseUrl"
                      render={({ field, fieldState }) => (
                        <div>
                          <Input
                            placeholder="https://api.exemplo.com"
                            value={field.value || ""}
                            onChangeText={field.onChange}
                            autoCapitalize="none"
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
                    <Label>Chave da API</Label>
                    <Controller
                      control={form.control}
                      name="apiKey"
                      render={({ field }) => (
                        <Input
                          placeholder="sk_live_..."
                          value={field.value || ""}
                          onChangeText={field.onChange}
                          secureTextEntry
                          autoCapitalize="none"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Timeout (ms)</Label>
                    <Controller
                      control={form.control}
                      name="apiTimeout"
                      render={({ field, fieldState }) => (
                        <div>
                          <Input
                            placeholder="30000"
                            value={field.value.toString()}
                            onChangeText={(text) => field.onChange(parseInt(text) || 30000)}
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

                  <Button
                    variant="outline"
                    onPress={() => handleTestIntegration("API")}
                    disabled={testingIntegration === "API"}
                  >
                    {testingIntegration === "API" ? (
                      <>
                        <Icon name="loading" size={16} className="text-muted-foreground mr-2" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <Icon name="test-tube" size={16} className="text-muted-foreground mr-2" />
                        Testar Conexão
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Email Integration */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center justify-between">
                <div className="flex-row items-center">
                  <Icon name="mail" size={20} className="text-primary mr-2" />
                  Email SMTP
                </div>
                <IntegrationStatus enabled={form.watch("emailEnabled")} />
              </CardTitle>
              <CardDescription>
                Configure o servidor SMTP para envio de emails automáticos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-row items-center justify-between">
                <Label className="text-base">Habilitar Email</Label>
                <Controller
                  control={form.control}
                  name="emailEnabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {form.watch("emailEnabled") && (
                <>
                  <div>
                    <Label>Servidor SMTP</Label>
                    <Controller
                      control={form.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <Input
                          placeholder="smtp.gmail.com"
                          value={field.value || ""}
                          onChangeText={field.onChange}
                          autoCapitalize="none"
                        />
                      )}
                    />
                  </div>

                  <div className="flex-row space-x-4">
                    <div className="flex-1">
                      <Label>Porta</Label>
                      <Controller
                        control={form.control}
                        name="smtpPort"
                        render={({ field, fieldState }) => (
                          <div>
                            <Input
                              placeholder="587"
                              value={field.value?.toString() || ""}
                              onChangeText={(text) => field.onChange(parseInt(text) || 587)}
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

                    <div className="flex-1">
                      <Label>Conexão Segura</Label>
                      <div className="pt-3">
                        <Controller
                          control={form.control}
                          name="smtpSecure"
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Usuário</Label>
                    <Controller
                      control={form.control}
                      name="smtpUser"
                      render={({ field }) => (
                        <Input
                          placeholder="usuario@gmail.com"
                          value={field.value || ""}
                          onChangeText={field.onChange}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Senha</Label>
                    <Controller
                      control={form.control}
                      name="smtpPassword"
                      render={({ field }) => (
                        <Input
                          placeholder="••••••••"
                          value={field.value || ""}
                          onChangeText={field.onChange}
                          secureTextEntry
                          autoCapitalize="none"
                        />
                      )}
                    />
                  </div>

                  <Button
                    variant="outline"
                    onPress={() => handleTestIntegration("Email")}
                    disabled={testingIntegration === "Email"}
                  >
                    {testingIntegration === "Email" ? (
                      <>
                        <Icon name="loading" size={16} className="text-muted-foreground mr-2" />
                        Enviando Teste...
                      </>
                    ) : (
                      <>
                        <Icon name="mail" size={16} className="text-muted-foreground mr-2" />
                        Enviar Email de Teste
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Webhook Configuration */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center justify-between">
                <div className="flex-row items-center">
                  <Icon name="webhook" size={20} className="text-primary mr-2" />
                  Webhooks
                </div>
                <IntegrationStatus enabled={form.watch("webhookEnabled")} lastSync="há 2 horas" />
              </CardTitle>
              <CardDescription>
                Configure webhooks para notificar sistemas externos sobre eventos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-row items-center justify-between">
                <Label className="text-base">Habilitar Webhooks</Label>
                <Controller
                  control={form.control}
                  name="webhookEnabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {form.watch("webhookEnabled") && (
                <>
                  <div>
                    <Label>URL do Webhook</Label>
                    <Controller
                      control={form.control}
                      name="webhookUrl"
                      render={({ field, fieldState }) => (
                        <div>
                          <Input
                            placeholder="https://seu-site.com/webhook"
                            value={field.value || ""}
                            onChangeText={field.onChange}
                            autoCapitalize="none"
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
                    <Label>Chave Secreta</Label>
                    <Controller
                      control={form.control}
                      name="webhookSecret"
                      render={({ field }) => (
                        <Input
                          placeholder="chave_secreta_webhook"
                          value={field.value || ""}
                          onChangeText={field.onChange}
                          secureTextEntry
                          autoCapitalize="none"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Eventos (separados por vírgula)</Label>
                    <Controller
                      control={form.control}
                      name="webhookEvents"
                      render={({ field }) => (
                        <Textarea
                          placeholder="user.created, task.completed, order.received"
                          value={field.value.join(", ")}
                          onChangeText={(text) => field.onChange(text.split(",").map(s => s.trim()))}
                          className="min-h-[80px]"
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Eventos disponíveis: {webhookEventOptions.map(e => e.value).join(", ")}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onPress={() => handleTestIntegration("Webhook")}
                    disabled={testingIntegration === "Webhook"}
                  >
                    {testingIntegration === "Webhook" ? (
                      <>
                        <Icon name="loading" size={16} className="text-muted-foreground mr-2" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <Icon name="webhook" size={16} className="text-muted-foreground mr-2" />
                        Testar Webhook
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* SMS Integration */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center justify-between">
                <div className="flex-row items-center">
                  <Icon name="phone" size={20} className="text-primary mr-2" />
                  SMS
                </div>
                <IntegrationStatus enabled={form.watch("smsEnabled")} />
              </CardTitle>
              <CardDescription>
                Configure o provedor de SMS para notificações por mensagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-row items-center justify-between">
                <Label className="text-base">Habilitar SMS</Label>
                <Controller
                  control={form.control}
                  name="smsEnabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {form.watch("smsEnabled") && (
                <>
                  <div>
                    <Label>Provedor</Label>
                    <Controller
                      control={form.control}
                      name="smsProvider"
                      render={({ field }) => (
                        <Input
                          placeholder="twilio"
                          value={field.value || ""}
                          onChangeText={field.onChange}
                          autoCapitalize="none"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Chave da API</Label>
                    <Controller
                      control={form.control}
                      name="smsApiKey"
                      render={({ field }) => (
                        <Input
                          placeholder="API Key do provedor SMS"
                          value={field.value || ""}
                          onChangeText={field.onChange}
                          secureTextEntry
                          autoCapitalize="none"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Número de Origem</Label>
                    <Controller
                      control={form.control}
                      name="smsFromNumber"
                      render={({ field }) => (
                        <Input
                          placeholder="+5511999999999"
                          value={field.value || ""}
                          onChangeText={field.onChange}
                          keyboardType="phone-pad"
                        />
                      )}
                    />
                  </div>
                </>
              )}
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
                <Icon name="save" size={16} className="text-primary-foreground mr-2" />
                Salvar Integrações
              </>
            )}
          </Button>
        </ScrollView>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}