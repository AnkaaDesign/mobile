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
import { Progress } from "@/components/ui/progress";
import { toast } from "@/lib/toast";

// Schema for backup settings form
const backupSettingsSchema = z.object({
  // Automated Backup
  autoBackupEnabled: z.boolean(),
  backupFrequency: z.enum(["daily", "weekly", "monthly"]),
  backupTime: z.string(),
  backupRetentionDays: z.number().min(1, "Mínimo de 1 dia").max(3650, "Máximo de 3650 dias (10 anos)"),

  // Backup Types
  fullBackupEnabled: z.boolean(),
  incrementalBackupEnabled: z.boolean(),
  databaseBackupEnabled: z.boolean(),
  fileBackupEnabled: z.boolean(),
  configBackupEnabled: z.boolean(),

  // Storage Configuration
  storageProvider: z.enum(["local", "aws-s3", "google-drive", "dropbox", "azure-blob"]),
  storagePath: z.string().optional(),
  storageAccessKey: z.string().optional(),
  storageSecretKey: z.string().optional(),
  storageBucket: z.string().optional(),
  storageRegion: z.string().optional(),

  // Compression and Encryption
  compressionEnabled: z.boolean(),
  compressionLevel: z.number().min(1, "Nível mínimo 1").max(9, "Nível máximo 9"),
  encryptionEnabled: z.boolean(),
  encryptionPassword: z.string().optional(),

  // Notifications
  notifyOnSuccess: z.boolean(),
  notifyOnFailure: z.boolean(),
  notificationEmail: z.string().email("Email inválido").optional().or(z.literal("")),

  // Advanced Settings
  parallelBackups: z.boolean(),
  maxParallelJobs: z.number().min(1, "Mínimo de 1 job").max(10, "Máximo de 10 jobs"),
  excludePatterns: z.array(z.string()),
  customScript: z.string().optional(),
});

type BackupSettingsFormData = z.infer<typeof backupSettingsSchema>;

const defaultValues: BackupSettingsFormData = {
  // Automated Backup
  autoBackupEnabled: true,
  backupFrequency: "daily",
  backupTime: "02:00",
  backupRetentionDays: 90,

  // Backup Types
  fullBackupEnabled: true,
  incrementalBackupEnabled: true,
  databaseBackupEnabled: true,
  fileBackupEnabled: true,
  configBackupEnabled: true,

  // Storage Configuration
  storageProvider: "local",
  storagePath: "/var/backups/ankaa",
  storageAccessKey: "",
  storageSecretKey: "",
  storageBucket: "",
  storageRegion: "us-east-1",

  // Compression and Encryption
  compressionEnabled: true,
  compressionLevel: 6,
  encryptionEnabled: true,
  encryptionPassword: "",

  // Notifications
  notifyOnSuccess: false,
  notifyOnFailure: true,
  notificationEmail: "",

  // Advanced Settings
  parallelBackups: false,
  maxParallelJobs: 2,
  excludePatterns: ["*.log", "*.tmp", "node_modules/**"],
  customScript: "",
};

interface BackupStatus {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  lastBackup?: Date;
  nextBackup?: Date;
  lastBackupSize?: string;
  status: "success" | "error" | "running" | "idle";
}

const mockBackupStatus: BackupStatus = {
  isRunning: false,
  progress: 0,
  currentStep: "Idle",
  lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
  nextBackup: new Date(Date.now() + 2 * 60 * 60 * 1000), // In 2 hours
  lastBackupSize: "2.4 GB",
  status: "success",
};

const StorageProviderConfig = ({ provider, form }: { provider: string; form: any }) => {
  switch (provider) {
    case "local":
      return (
        <div>
          <Label>Caminho Local</Label>
          <Controller
            control={form.control}
            name="storagePath"
            render={({ field }) => (
              <Input
                placeholder="/var/backups/ankaa"
                value={field.value || ""}
                onChangeText={field.onChange}
              />
            )}
          />
        </div>
      );

    case "aws-s3":
      return (
        <div className="space-y-4">
          <div>
            <Label>Access Key ID</Label>
            <Controller
              control={form.control}
              name="storageAccessKey"
              render={({ field }) => (
                <Input
                  placeholder="AKIA..."
                  value={field.value || ""}
                  onChangeText={field.onChange}
                  autoCapitalize="none"
                />
              )}
            />
          </div>
          <div>
            <Label>Secret Access Key</Label>
            <Controller
              control={form.control}
              name="storageSecretKey"
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
          <div>
            <Label>Bucket Name</Label>
            <Controller
              control={form.control}
              name="storageBucket"
              render={({ field }) => (
                <Input
                  placeholder="my-backup-bucket"
                  value={field.value || ""}
                  onChangeText={field.onChange}
                  autoCapitalize="none"
                />
              )}
            />
          </div>
          <div>
            <Label>Região</Label>
            <Controller
              control={form.control}
              name="storageRegion"
              render={({ field }) => (
                <Select value={field.value || "us-east-1"} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                    <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                    <SelectItem value="sa-east-1">South America (São Paulo)</SelectItem>
                    <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      );

    case "google-drive":
    case "dropbox":
      return (
        <div>
          <Label>Token de Acesso</Label>
          <Controller
            control={form.control}
            name="storageAccessKey"
            render={({ field }) => (
              <Input
                placeholder="Token de API"
                value={field.value || ""}
                onChangeText={field.onChange}
                secureTextEntry
                autoCapitalize="none"
              />
            )}
          />
        </div>
      );

    default:
      return null;
  }
};

export default function BackupSettingsScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>(mockBackupStatus);

  const form = useForm<BackupSettingsFormData>({
    resolver: zodResolver(backupSettingsSchema),
    defaultValues,
  });

  const onSubmit = async (data: BackupSettingsFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("Backup settings saved:", data);
      toast.success("Configurações de backup salvas com sucesso!");
    } catch (error) {
      console.error("Error saving backup settings:", error);
      toast.error("Erro ao salvar configurações de backup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualBackup = async () => {
    Alert.alert(
      "Backup Manual",
      "Deseja iniciar um backup manual agora? Este processo pode levar alguns minutos.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Iniciar", onPress: startManualBackup }
      ]
    );
  };

  const startManualBackup = async () => {
    setBackupStatus(prev => ({ ...prev, isRunning: true, status: "running", progress: 0 }));

    // Simulate backup progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setBackupStatus(prev => ({
        ...prev,
        progress: i,
        currentStep: i < 30 ? "Preparando..." :
                    i < 60 ? "Copiando base de dados..." :
                    i < 80 ? "Copiando arquivos..." :
                    i < 100 ? "Comprimindo..." : "Finalizando..."
      }));
    }

    setBackupStatus(prev => ({
      ...prev,
      isRunning: false,
      status: "success",
      progress: 100,
      currentStep: "Concluído",
      lastBackup: new Date(),
      lastBackupSize: "2.6 GB"
    }));

    toast.success("Backup manual concluído com sucesso!");
  };

  const handleTestConnection = async () => {
    const provider = form.watch("storageProvider");

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));

      const success = Math.random() > 0.2; // 80% success rate

      if (success) {
        toast.success(`Conexão com ${provider} testada com sucesso!`);
      } else {
        toast.error(`Falha na conexão com ${provider}. Verifique as credenciais.`);
      }
    } catch (error) {
      toast.error("Erro ao testar conexão");
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR") + " às " + date.toLocaleTimeString("pt-BR", {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ThemedSafeAreaView>
      <Header
        title="Backup e Recuperação"
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
          {/* Backup Status Card */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center justify-between">
                <div className="flex-row items-center">
                  <Icon name="database" size={20} className="text-primary mr-2" />
                  Status do Backup
                </div>
                <Badge
                  variant={
                    backupStatus.status === "success" ? "success" :
                    backupStatus.status === "error" ? "destructive" :
                    backupStatus.status === "running" ? "warning" : "secondary"
                  }
                  size="sm"
                >
                  {backupStatus.status === "success" ? "Sucesso" :
                   backupStatus.status === "error" ? "Erro" :
                   backupStatus.status === "running" ? "Executando" : "Inativo"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {backupStatus.isRunning ? (
                <div>
                  <div className="flex-row items-center justify-between mb-2">
                    <p className="text-sm font-medium">{backupStatus.currentStep}</p>
                    <p className="text-sm text-muted-foreground">{backupStatus.progress}%</p>
                  </div>
                  <Progress value={backupStatus.progress} style={{ height: 8 }} />
                </div>
              ) : (
                <div className="space-y-2">
                  {backupStatus.lastBackup && (
                    <div className="flex-row items-center justify-between">
                      <p className="text-sm text-muted-foreground">Último Backup:</p>
                      <p className="text-sm font-medium">{formatDate(backupStatus.lastBackup)}</p>
                    </div>
                  )}
                  {backupStatus.nextBackup && (
                    <div className="flex-row items-center justify-between">
                      <p className="text-sm text-muted-foreground">Próximo Backup:</p>
                      <p className="text-sm font-medium">{formatDate(backupStatus.nextBackup)}</p>
                    </div>
                  )}
                  {backupStatus.lastBackupSize && (
                    <div className="flex-row items-center justify-between">
                      <p className="text-sm text-muted-foreground">Tamanho:</p>
                      <p className="text-sm font-medium">{backupStatus.lastBackupSize}</p>
                    </div>
                  )}
                </div>
              )}

              <Button
                onPress={handleManualBackup}
                disabled={backupStatus.isRunning}
                variant="outline"
              >
                {backupStatus.isRunning ? (
                  <>
                    <Icon name="loading" size={16} className="text-muted-foreground mr-2" />
                    Executando Backup...
                  </>
                ) : (
                  <>
                    <Icon name="play" size={16} className="text-muted-foreground mr-2" />
                    Backup Manual
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Automated Backup Settings */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Icon name="calendar" size={20} className="text-primary mr-2" />
                Backup Automático
              </CardTitle>
              <CardDescription>
                Configure backups automáticos programados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-row items-center justify-between">
                <Label className="text-base">Habilitar Backup Automático</Label>
                <Controller
                  control={form.control}
                  name="autoBackupEnabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {form.watch("autoBackupEnabled") && (
                <>
                  <div>
                    <Label>Frequência</Label>
                    <Controller
                      control={form.control}
                      name="backupFrequency"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diariamente</SelectItem>
                            <SelectItem value="weekly">Semanalmente</SelectItem>
                            <SelectItem value="monthly">Mensalmente</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label>Horário do Backup</Label>
                    <Controller
                      control={form.control}
                      name="backupTime"
                      render={({ field }) => (
                        <Input
                          placeholder="02:00"
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label>Retenção (dias)</Label>
                    <Controller
                      control={form.control}
                      name="backupRetentionDays"
                      render={({ field, fieldState }) => (
                        <div>
                          <Input
                            placeholder="90"
                            value={field.value.toString()}
                            onChangeText={(text) => field.onChange(parseInt(text) || 90)}
                            keyboardType="numeric"
                            className={fieldState.error ? "border-destructive" : ""}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Backups serão removidos após este período
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
                </>
              )}
            </CardContent>
          </Card>

          {/* Backup Types */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Icon name="layers" size={20} className="text-primary mr-2" />
                Tipos de Backup
              </CardTitle>
              <CardDescription>
                Selecione quais dados incluir nos backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Backup Completo</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Copia todos os dados a cada execução
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="fullBackupEnabled"
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
                  <Label className="text-base">Backup Incremental</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Copia apenas as alterações desde o último backup
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="incrementalBackupEnabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <Separator />

              <div className="flex-row items-center justify-between">
                <Label className="text-base">Base de Dados</Label>
                <Controller
                  control={form.control}
                  name="databaseBackupEnabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex-row items-center justify-between">
                <Label className="text-base">Arquivos</Label>
                <Controller
                  control={form.control}
                  name="fileBackupEnabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="flex-row items-center justify-between">
                <Label className="text-base">Configurações</Label>
                <Controller
                  control={form.control}
                  name="configBackupEnabled"
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

          {/* Storage Configuration */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Icon name="cloud" size={20} className="text-primary mr-2" />
                Armazenamento
              </CardTitle>
              <CardDescription>
                Configure onde os backups serão armazenados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Provedor de Armazenamento</Label>
                <Controller
                  control={form.control}
                  name="storageProvider"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o provedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Armazenamento Local</SelectItem>
                        <SelectItem value="aws-s3">Amazon S3</SelectItem>
                        <SelectItem value="google-drive">Google Drive</SelectItem>
                        <SelectItem value="dropbox">Dropbox</SelectItem>
                        <SelectItem value="azure-blob">Azure Blob Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <StorageProviderConfig
                provider={form.watch("storageProvider")}
                form={form}
              />

              {form.watch("storageProvider") !== "local" && (
                <Button
                  variant="outline"
                  onPress={handleTestConnection}
                >
                  <Icon name="wifi" size={16} className="text-muted-foreground mr-2" />
                  Testar Conexão
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Compression and Encryption */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Icon name="shield-check" size={20} className="text-primary mr-2" />
                Compressão e Criptografia
              </CardTitle>
              <CardDescription>
                Configure compressão e segurança dos backups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Compressão</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reduz o tamanho dos arquivos de backup
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="compressionEnabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {form.watch("compressionEnabled") && (
                <div>
                  <Label>Nível de Compressão: {form.watch("compressionLevel")}</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    1 = Rápido, 9 = Máxima compressão
                  </p>
                  <Controller
                    control={form.control}
                    name="compressionLevel"
                    render={({ field, fieldState }) => (
                      <div>
                        <Input
                          placeholder="6"
                          value={field.value.toString()}
                          onChangeText={(text) => field.onChange(parseInt(text) || 6)}
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
                  <Label className="text-base">Criptografia</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Protege os backups com senha
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="encryptionEnabled"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {form.watch("encryptionEnabled") && (
                <div>
                  <Label>Senha de Criptografia</Label>
                  <Controller
                    control={form.control}
                    name="encryptionPassword"
                    render={({ field }) => (
                      <Input
                        placeholder="Digite uma senha forte"
                        value={field.value || ""}
                        onChangeText={field.onChange}
                        secureTextEntry
                      />
                    )}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    ⚠️ Guarde esta senha em local seguro. Sem ela, não será possível restaurar os backups.
                  </p>
                </div>
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
                Salvar Configurações de Backup
              </>
            )}
          </Button>
        </ScrollView>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}