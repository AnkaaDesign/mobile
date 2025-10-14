import React, { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedSafeAreaView } from "@/components/ui/themed-safe-area-view";
import { Header } from "@/components/ui/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";

// Schema for general settings form
const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Nome da empresa é obrigatório"),
  companyDocument: z.string().min(1, "CNPJ é obrigatório"),
  companyEmail: z.string().email("Email inválido"),
  companyPhone: z.string().min(1, "Telefone é obrigatório"),
  companyAddress: z.string().min(1, "Endereço é obrigatório"),
  timezone: z.string().min(1, "Fuso horário é obrigatório"),
  currency: z.string().min(1, "Moeda é obrigatório"),
  dateFormat: z.string().min(1, "Formato de data é obrigatório"),
  workHoursStart: z.string().min(1, "Horário de início é obrigatório"),
  workHoursEnd: z.string().min(1, "Horário de fim é obrigatório"),
  maintenanceMode: z.boolean(),
  allowRegistration: z.boolean(),
  requireEmailVerification: z.boolean(),
  autoBackup: z.boolean(),
  systemDescription: z.string().optional(),
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

const defaultValues: GeneralSettingsFormData = {
  companyName: "Ankaa Manufacturing",
  companyDocument: "12.345.678/0001-90",
  companyEmail: "contato@ankaa.com.br",
  companyPhone: "(11) 9999-9999",
  companyAddress: "Rua das Indústrias, 123 - São Paulo, SP",
  timezone: "America/Sao_Paulo",
  currency: "BRL",
  dateFormat: "DD/MM/YYYY",
  workHoursStart: "08:00",
  workHoursEnd: "17:00",
  maintenanceMode: false,
  allowRegistration: false,
  requireEmailVerification: true,
  autoBackup: true,
  systemDescription: "Sistema de gestão industrial para manufatura e serviços",
};

const timezoneOptions = [
  { value: "America/Sao_Paulo", label: "São Paulo (UTC-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (UTC-3)" },
  { value: "America/Manaus", label: "Manaus (UTC-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (UTC-5)" },
];

const currencyOptions = [
  { value: "BRL", label: "Real Brasileiro (R$)" },
  { value: "USD", label: "Dólar Americano ($)" },
  { value: "EUR", label: "Euro (€)" },
];

const dateFormatOptions = [
  { value: "DD/MM/YYYY", label: "DD/MM/AAAA" },
  { value: "MM/DD/YYYY", label: "MM/DD/AAAA" },
  { value: "YYYY-MM-DD", label: "AAAA-MM-DD" },
];

export default function GeneralSettingsScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: showError, warning, info } = useToast();


  const form = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues,
  });

  const onSubmit = async (data: GeneralSettingsFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Here you would typically call your API to save the settings
      console.log("General settings saved:", data);

      success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving general settings:", error);
      showError("Erro ao salvar configurações");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaintenanceModeChange = (enabled: boolean) => {
    if (enabled) {
      Alert.alert(
        "Modo de Manutenção",
        "Ativar o modo de manutenção impedirá que usuários acessem o sistema. Deseja continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Ativar", onPress: () => form.setValue("maintenanceMode", true) }
        ]
      );
    } else {
      form.setValue("maintenanceMode", false);
    }
  };

  return (
    <ThemedSafeAreaView>
      <Header
        title="Configurações Gerais"
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
          {/* Company Information */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Icon name="building" size={20} className="text-primary mr-2" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome da Empresa</Label>
                <Controller
                  control={form.control}
                  name="companyName"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        placeholder="Digite o nome da empresa"
                        value={field.value}
                        onChangeText={field.onChange}
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
                <Label>CNPJ</Label>
                <Controller
                  control={form.control}
                  name="companyDocument"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        placeholder="00.000.000/0001-00"
                        value={field.value}
                        onChangeText={field.onChange}
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
                <Label>Email</Label>
                <Controller
                  control={form.control}
                  name="companyEmail"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        placeholder="contato@empresa.com"
                        value={field.value}
                        onChangeText={field.onChange}
                        keyboardType="email-address"
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
                <Label>Telefone</Label>
                <Controller
                  control={form.control}
                  name="companyPhone"
                  render={({ field, fieldState }) => (
                    <div>
                      <Input
                        placeholder="(11) 9999-9999"
                        value={field.value}
                        onChangeText={field.onChange}
                        keyboardType="phone-pad"
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
                <Label>Endereço</Label>
                <Controller
                  control={form.control}
                  name="companyAddress"
                  render={({ field, fieldState }) => (
                    <div>
                      <Textarea
                        placeholder="Endereço completo da empresa"
                        value={field.value}
                        onChangeText={field.onChange}
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
            </CardContent>
          </Card>

          {/* System Configuration */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Icon name="settings" size={20} className="text-primary mr-2" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Fuso Horário</Label>
                <Controller
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fuso horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezoneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label>Moeda</Label>
                <Controller
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a moeda" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label>Formato de Data</Label>
                <Controller
                  control={form.control}
                  name="dateFormat"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                      <SelectContent>
                        {dateFormatOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex-row space-x-4">
                <div className="flex-1">
                  <Label>Horário de Trabalho - Início</Label>
                  <Controller
                    control={form.control}
                    name="workHoursStart"
                    render={({ field, fieldState }) => (
                      <div>
                        <Input
                          placeholder="08:00"
                          value={field.value}
                          onChangeText={field.onChange}
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
                  <Label>Horário de Trabalho - Fim</Label>
                  <Controller
                    control={form.control}
                    name="workHoursEnd"
                    render={({ field, fieldState }) => (
                      <div>
                        <Input
                          placeholder="17:00"
                          value={field.value}
                          onChangeText={field.onChange}
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
              </div>

              <div>
                <Label>Descrição do Sistema</Label>
                <Controller
                  control={form.control}
                  name="systemDescription"
                  render={({ field }) => (
                    <Textarea
                      placeholder="Descrição opcional do sistema"
                      value={field.value || ""}
                      onChangeText={field.onChange}
                      maxLength={500}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Options */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex-row items-center">
                <Icon name="toggle-left" size={20} className="text-primary mr-2" />
                Opções do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Modo de Manutenção</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Impede o acesso de usuários ao sistema
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="maintenanceMode"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={handleMaintenanceModeChange}
                    />
                  )}
                />
              </div>

              <Separator />

              <div className="flex-row items-center justify-between">
                <div className="flex-1 pr-4">
                  <Label className="text-base">Permitir Registro</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permite que novos usuários se registrem
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="allowRegistration"
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
                <div className="flex-1 pr-4">
                  <Label className="text-base">Verificação de Email</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Exige verificação de email para novos usuários
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="requireEmailVerification"
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
                <div className="flex-1 pr-4">
                  <Label className="text-base">Backup Automático</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Executa backup automático dos dados
                  </p>
                </div>
                <Controller
                  control={form.control}
                  name="autoBackup"
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
                Salvar Configurações
              </>
            )}
          </Button>
        </ScrollView>
      </ThemedView>
    </ThemedSafeAreaView>
  );
}
