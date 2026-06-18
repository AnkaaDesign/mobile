// admission-new-user-form.tsx (mobile)
// "Cadastro de colaborador" — the SOLE admission create form, mirroring web's
// admission-new-user-form.tsx adapted to React Native.
//
// The admission form IS the collaborator registration: it reuses the same
// collaborator fields (name/email/phone/cpf/pis/birth/address/professional/PPE)
// plus:
//   - a CPF auto-detect that attaches a NEW vínculo to an existing person
//     (rehire) instead of duplicating them (submits `userId` instead of `user`),
//   - a "Documentos" section that picks files (uploaded to fileIds at submit and
//     sent inline as documents:[{ type, fileId }]),
//   - contract fields (employeeType / contractType / provider) → nested `contract`.
//
// On submit it maps the flat form values to POST /admissions:
//   { user? | userId, contract, documents?, hireDate, notes }.

import { useEffect, useMemo, useRef, useState } from "react";
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SafeAreaView } from "react-native-safe-area-context";

import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { FormCard, FormFieldGroup, FormRow } from "@/components/ui/form-section";
import { FormActionBar } from "@/components/forms";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/lib/theme";
import { formSpacing } from "@/constants/form-styles";
import { fontSize, spacing } from "@/constants/design-system";
import { useKeyboardAwareScroll } from "@/hooks";
import { KeyboardAwareFormProvider, type KeyboardAwareFormContextType } from "@/contexts/KeyboardAwareFormContext";
import { mobileRoute } from "@/constants/routes.types";
import { useNav } from "@/contexts/nav";

import { admissionCollaboratorFormSchema } from "@/schemas/admission";
import type { AdmissionCollaboratorFormData, AdmissionCreateFormData } from "@/schemas/admission";
import type { User } from "@/types";
import { useAdmissionMutations } from "@/hooks/useAdmission";
import { useSectors } from "@/hooks/useSector";
import { usePositions } from "@/hooks/usePosition";
import { getUsers } from "@/api-client";
import { uploadSingleFile } from "@/api-client/file";
import { cleanCPF } from "@/utils/cleaners";
import {
  CONTRACT_TYPE,
  EMPLOYEE_TYPE,
  ADMISSION_DOCUMENT_TYPE,
  SECTOR_PRIVILEGES,
} from "@/constants";
import {
  CONTRACT_TYPE_LABELS,
  EMPLOYEE_TYPE_LABELS,
  ADMISSION_DOCUMENT_TYPE_LABELS,
} from "@/constants/enum-labels";

// Curated document checklist surfaced as file pickers on the form (parity with web).
const DOCUMENT_CHECKLIST: ADMISSION_DOCUMENT_TYPE[] = [
  ADMISSION_DOCUMENT_TYPE.CPF,
  ADMISSION_DOCUMENT_TYPE.RG,
  ADMISSION_DOCUMENT_TYPE.CTPS,
  ADMISSION_DOCUMENT_TYPE.PROOF_OF_RESIDENCE,
  ADMISSION_DOCUMENT_TYPE.ADMISSION_EXAM,
  ADMISSION_DOCUMENT_TYPE.EMPLOYMENT_CONTRACT,
  ADMISSION_DOCUMENT_TYPE.LGPD_TERM,
  ADMISSION_DOCUMENT_TYPE.PHOTO,
];

const BRAZIL_STATES: ComboboxOption[] = [
  { value: "AC", label: "Acre" }, { value: "AL", label: "Alagoas" }, { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" }, { value: "BA", label: "Bahia" }, { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" }, { value: "ES", label: "Espírito Santo" }, { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" }, { value: "MT", label: "Mato Grosso" }, { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" }, { value: "PA", label: "Pará" }, { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" }, { value: "PE", label: "Pernambuco" }, { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" }, { value: "RN", label: "Rio Grande do Norte" }, { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" }, { value: "RR", label: "Roraima" }, { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" }, { value: "SE", label: "Sergipe" }, { value: "TO", label: "Tocantins" },
];

const getDefaultBirthDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date;
};

interface AdmissionNewUserFormProps {
  /** Called after a successful create. When provided, the caller owns navigation. */
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
}

export function AdmissionNewUserForm({ onSuccess, onCancel }: AdmissionNewUserFormProps) {
  const nav = useNav();
  const { colors } = useTheme();
  const { handlers, refs } = useKeyboardAwareScroll();
  const { createAsync, createMutation } = useAdmissionMutations();

  const { data: sectors } = useSectors({ orderBy: { name: "asc" } });
  const { data: positions } = usePositions({ orderBy: { name: "asc" } });

  // Pending document files keyed by document type. Uploaded → fileIds at submit.
  const [docFiles, setDocFiles] = useState<Partial<Record<ADMISSION_DOCUMENT_TYPE, FilePickerItem>>>({});
  // Existing person detected by CPF (rehire path). When set we submit `userId`.
  const [matchedUser, setMatchedUser] = useState<User | null>(null);

  const form = useForm<AdmissionCollaboratorFormData>({
    resolver: zodResolver(admissionCollaboratorFormSchema as any),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      pis: "",
      birth: getDefaultBirthDate(),
      contract: {
        // New CLT hires start in the first experience period (EXPERIENCE_PERIOD_1).
        employeeType: EMPLOYEE_TYPE.CLT,
        contractType: CONTRACT_TYPE.EXPERIENCE_PERIOD_1,
        admissionDate: new Date(),
        providerName: null,
        providerCnpj: null,
      },
      sectorId: null,
      positionId: null,
      isSectorLeader: false,
      verified: false,
      isActive: true,
      performanceLevel: 0,
      address: "",
      addressNumber: "",
      addressComplement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      payrollNumber: null,
      ppeSize: {
        shirts: null, boots: null, pants: null, shorts: null,
        sleeves: null, mask: null, gloves: null, rainBoots: null,
      },
      notes: null,
    } as any,
  });

  const isLoading = createMutation.isPending;
  const watchedSectorId = form.watch("sectorId");
  const employeeType = useWatch({ control: form.control, name: "contract.employeeType" as any }) as EMPLOYEE_TYPE | undefined;
  const isClt = !employeeType || employeeType === EMPLOYEE_TYPE.CLT;
  const isProvider = employeeType === EMPLOYEE_TYPE.TERCEIRIZADO || employeeType === EMPLOYEE_TYPE.PJ;

  const selectedSector = useMemo(
    () => sectors?.data?.find((s) => s.id === watchedSectorId),
    [sectors?.data, watchedSectorId]
  );
  const isProductionSector = selectedSector?.privileges === SECTOR_PRIVILEGES.PRODUCTION;

  useEffect(() => {
    if (watchedSectorId && !isProductionSector) {
      form.setValue("isSectorLeader", false);
    }
  }, [watchedSectorId, isProductionSector, form]);

  // ----- CPF auto-detect (rehire path) — debounced 500ms -----
  const cpfValue = useWatch({ control: form.control, name: "cpf" as any }) as string | null | undefined;
  const [debouncedCpf, setDebouncedCpf] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCpf(cpfValue ?? ""), 500);
    return () => clearTimeout(t);
  }, [cpfValue]);

  useEffect(() => {
    let cancelled = false;
    const cleaned = cleanCPF(debouncedCpf || "");
    if (cleaned.length !== 11) {
      setMatchedUser(null);
      return;
    }
    (async () => {
      try {
        const response = await getUsers({
          where: { cpf: cleaned } as any,
          take: 1,
          include: { position: true, sector: true },
        } as any);
        if (cancelled) return;
        const found = (response.data || [])[0] as User | undefined;
        setMatchedUser(found ?? null);
      } catch {
        if (!cancelled) setMatchedUser(null);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedCpf]);

  // Prefill identity (read-only) when an existing person is detected.
  useEffect(() => {
    if (matchedUser) {
      form.setValue("name", matchedUser.name, { shouldValidate: false });
      if (matchedUser.email) form.setValue("email", matchedUser.email, { shouldValidate: false });
      if (matchedUser.phone) form.setValue("phone", matchedUser.phone, { shouldValidate: false });
      if (matchedUser.pis) form.setValue("pis", matchedUser.pis, { shouldValidate: false });
    }
  }, [matchedUser, form]);

  const matchedUserMeta = useMemo(() => {
    if (!matchedUser) return null;
    return [matchedUser.position?.name, matchedUser.sector?.name].filter(Boolean).join(" · ");
  }, [matchedUser]);

  const handleSubmit = async (data: AdmissionCollaboratorFormData) => {
    try {
      const { notes, contract: contractInput, ...userData } = data as any;
      const et: EMPLOYEE_TYPE = contractInput?.employeeType ?? EMPLOYEE_TYPE.CLT;
      const ct: CONTRACT_TYPE | null = et !== EMPLOYEE_TYPE.CLT ? null : (contractInput?.contractType ?? CONTRACT_TYPE.EXPERIENCE_PERIOD_1);
      const admissionDate = (contractInput?.admissionDate as Date | null) ?? null;

      // Upload pending document files → fileIds (inline documents[]).
      const documents: Array<{ type: ADMISSION_DOCUMENT_TYPE; fileId: string }> = [];
      for (const type of Object.keys(docFiles) as ADMISSION_DOCUMENT_TYPE[]) {
        const picked = docFiles[type];
        if (!picked) continue;
        const filePayload = {
          uri: picked.uri,
          name: picked.name,
          type: picked.mimeType || picked.type || "application/octet-stream",
        };
        const res = await uploadSingleFile(filePayload as any, { fileContext: "admissionDocument" } as any);
        const fileId = (res as any)?.data?.id;
        if (fileId) documents.push({ type, fileId });
      }

      const contract = {
        employeeType: et,
        contractType: ct,
        admissionDate,
        positionId: (userData.positionId as string) ?? null,
        sectorId: (userData.sectorId as string) ?? null,
        payrollNumber: (userData.payrollNumber as number) ?? null,
        providerName: (contractInput?.providerName as string) ?? null,
        providerCnpj: (contractInput?.providerCnpj as string) ?? null,
      };

      const payload: AdmissionCreateFormData = matchedUser
        ? ({
            userId: matchedUser.id,
            contract,
            documents: documents.length ? documents : undefined,
            hireDate: admissionDate,
            notes: notes ?? null,
          } as AdmissionCreateFormData)
        : ({
            user: { ...userData, contract } as any,
            contract,
            documents: documents.length ? documents : undefined,
            hireDate: admissionDate,
            notes: notes ?? null,
          } as AdmissionCreateFormData);

      const result = await createAsync(payload);
      const newId = (result as any)?.data?.id || (result as any)?.id;
      if (onSuccess) {
        onSuccess(newId);
      } else if (newId) {
        // Literal path — the admissions nav entry (routes.ts) is registered by a
        // later agent; this matches the route screen at admissoes/detalhes/[id].
        nav.replace(mobileRoute(`/recursos-humanos/admissoes/detalhes/${newId}`));
      } else {
        nav.goBack();
      }
    } catch {
      // Error toast shown automatically by the axios response interceptor.
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else nav.goBack();
  };

  const sectorOptions: ComboboxOption[] = sectors?.data?.map((s) => ({ value: s.id, label: s.name })) || [];
  const positionOptions: ComboboxOption[] = positions?.data?.map((p) => ({ value: p.id, label: p.name })) || [];
  const employeeTypeOptions: ComboboxOption[] = Object.entries(EMPLOYEE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  const contractTypeOptions: ComboboxOption[] = Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(() => ({
    onFieldLayout: handlers.handleFieldLayout,
    onFieldFocus: handlers.handleFieldFocus,
    onComboboxOpen: handlers.handleComboboxOpen,
    onComboboxClose: handlers.handleComboboxClose,
  }), [handlers.handleFieldLayout, handlers.handleFieldFocus, handlers.handleComboboxOpen, handlers.handleComboboxClose]);

  const lockedIdentity = isLoading || !!matchedUser;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={[]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          ref={refs.scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onLayout={handlers.handleScrollViewLayout}
          onScroll={handlers.handleScroll}
          scrollEventThrottle={16}
        >
          <KeyboardAwareFormProvider value={keyboardContextValue}>
            {/* Identificação (CPF first so auto-detect can fire early) */}
            <FormCard title="Identificação" icon="IconFileText">
              <FormRow>
                <FormFieldGroup label="CPF" required error={form.formState.errors.cpf?.message}>
                  <Controller
                    control={form.control}
                    name="cpf"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        type="cpf"
                        value={value || ""}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="000.000.000-00"
                        keyboardType="numeric"
                        editable={!isLoading}
                        error={!!form.formState.errors.cpf}
                      />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup label="PIS" error={form.formState.errors.pis?.message}>
                  <Controller
                    control={form.control}
                    name="pis"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        type="pis"
                        value={value || ""}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="000.00000.00-0"
                        keyboardType="numeric"
                        editable={!lockedIdentity}
                        error={!!form.formState.errors.pis}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>

              {matchedUser && (
                <View style={[styles.matchBanner, { borderColor: colors.primary, backgroundColor: colors.muted }]}>
                  <ThemedText style={[styles.matchText, { color: colors.foreground }]}>
                    Pessoa já cadastrada — um novo vínculo será criado para {matchedUser.name}
                  </ThemedText>
                  {matchedUserMeta ? (
                    <ThemedText style={[styles.matchMeta, { color: colors.mutedForeground }]}>{matchedUserMeta}</ThemedText>
                  ) : null}
                </View>
              )}
            </FormCard>

            {/* Informações Pessoais */}
            <FormCard title="Informações Pessoais" icon="IconUser">
              <FormFieldGroup label="Nome Completo" required error={form.formState.errors.name?.message}>
                <Controller
                  control={form.control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={value || ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Digite o nome completo"
                      editable={!lockedIdentity}
                      error={!!form.formState.errors.name}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormRow>
                <FormFieldGroup label="E-mail" error={form.formState.errors.email?.message}>
                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value || ""}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="email@exemplo.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!lockedIdentity}
                        error={!!form.formState.errors.email}
                      />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup label="Telefone" error={form.formState.errors.phone?.message}>
                  <Controller
                    control={form.control}
                    name="phone"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        type="phone"
                        value={value || ""}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="(00) 00000-0000"
                        keyboardType="phone-pad"
                        editable={!lockedIdentity}
                        error={!!form.formState.errors.phone}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>

              <FormRow>
                <FormFieldGroup label="Data de Nascimento" required error={form.formState.errors.birth?.message}>
                  <Controller
                    control={form.control}
                    name="birth"
                    render={({ field: { onChange, value } }) => (
                      <DatePicker value={value} onChange={onChange} placeholder="Selecione a data" disabled={lockedIdentity} />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup label="Nº da Folha" error={form.formState.errors.payrollNumber?.message}>
                  <Controller
                    control={form.control}
                    name="payrollNumber"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        value={value?.toString() || ""}
                        onChangeText={(text: string) => onChange(text ? parseInt(text, 10) : null)}
                        onBlur={onBlur}
                        placeholder="Nº"
                        keyboardType="numeric"
                        editable={!isLoading}
                        error={!!form.formState.errors.payrollNumber}
                      />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>
            </FormCard>

            {/* Informações Profissionais */}
            <FormCard title="Informações Profissionais" icon="IconBriefcase">
              <FormFieldGroup label="Cargo" required error={form.formState.errors.positionId?.message}>
                <Controller
                  control={form.control}
                  name="positionId"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={positionOptions}
                      value={value || undefined}
                      onValueChange={onChange}
                      placeholder="Selecione o cargo"
                      disabled={isLoading}
                      searchable
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>

              <FormFieldGroup label="Setor" required error={form.formState.errors.sectorId?.message}>
                <Controller
                  control={form.control}
                  name="sectorId"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={sectorOptions}
                      value={value || undefined}
                      onValueChange={onChange}
                      placeholder="Selecione o setor"
                      disabled={isLoading}
                      searchable
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>

              {isProductionSector && (
                <FormFieldGroup label="Líder do Setor">
                  <Controller
                    control={form.control}
                    name="isSectorLeader"
                    render={({ field: { onChange, value } }) => (
                      <View style={styles.switchRow}>
                        <Switch checked={Boolean(value)} onCheckedChange={onChange} disabled={isLoading || !watchedSectorId} />
                      </View>
                    )}
                  />
                </FormFieldGroup>
              )}
            </FormCard>

            {/* Vínculo do Colaborador */}
            <FormCard title="Vínculo do Colaborador" icon="IconBriefcase">
              <FormFieldGroup label="Categoria do Colaborador" required>
                <Controller
                  control={form.control}
                  name="contract.employeeType"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <Combobox
                      options={employeeTypeOptions}
                      value={value ?? undefined}
                      onValueChange={onChange}
                      placeholder="Selecione a categoria"
                      disabled={isLoading}
                      searchable={false}
                      clearable={false}
                      error={error?.message}
                    />
                  )}
                />
              </FormFieldGroup>

              {isClt && (
                <FormFieldGroup label="Modalidade do Vínculo" required error={(form.formState.errors as any).contract?.contractType?.message}>
                  <Controller
                    control={form.control}
                    name="contract.contractType"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox
                        options={contractTypeOptions}
                        value={value ?? undefined}
                        onValueChange={onChange}
                        placeholder="Selecione a modalidade"
                        disabled={isLoading}
                        searchable={false}
                        clearable={false}
                        error={error?.message}
                      />
                    )}
                  />
                </FormFieldGroup>
              )}

              {isProvider && (
                <FormRow>
                  <FormFieldGroup label="Nome do Prestador">
                    <Controller
                      control={form.control}
                      name="contract.providerName"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          value={value || ""}
                          onChangeText={(t: string) => onChange(t === "" ? null : t)}
                          onBlur={onBlur}
                          placeholder="Empresa / prestador"
                          editable={!isLoading}
                        />
                      )}
                    />
                  </FormFieldGroup>

                  <FormFieldGroup label="CNPJ do Prestador">
                    <Controller
                      control={form.control}
                      name="contract.providerCnpj"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          type="cnpj"
                          value={value || ""}
                          onChange={(v: string | number | null) => onChange(v === "" || v == null ? null : String(v))}
                          onBlur={onBlur}
                          placeholder="00.000.000/0000-00"
                          keyboardType="numeric"
                          editable={!isLoading}
                        />
                      )}
                    />
                  </FormFieldGroup>
                </FormRow>
              )}

              <FormFieldGroup label="Data de Admissão" required error={(form.formState.errors as any).contract?.admissionDate?.message}>
                <Controller
                  control={form.control}
                  name="contract.admissionDate"
                  render={({ field: { onChange, value } }) => (
                    <DatePicker value={value ?? undefined} onChange={onChange} placeholder="Selecione a data" disabled={isLoading} />
                  )}
                />
              </FormFieldGroup>
            </FormCard>

            {/* Endereço */}
            <FormCard title="Endereço" icon="IconMapPin">
              <FormFieldGroup label="Logradouro" error={form.formState.errors.address?.message}>
                <Controller
                  control={form.control}
                  name="address"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="Rua, Avenida, etc." editable={!isLoading} error={!!form.formState.errors.address} />
                  )}
                />
              </FormFieldGroup>

              <FormRow>
                <FormFieldGroup label="Número" error={form.formState.errors.addressNumber?.message}>
                  <Controller
                    control={form.control}
                    name="addressNumber"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="Nº" keyboardType="numeric" editable={!isLoading} error={!!form.formState.errors.addressNumber} />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup label="Complemento" error={form.formState.errors.addressComplement?.message}>
                  <Controller
                    control={form.control}
                    name="addressComplement"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="Apto, Bloco, etc." editable={!isLoading} error={!!form.formState.errors.addressComplement} />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>

              <FormRow>
                <FormFieldGroup label="Bairro" error={form.formState.errors.neighborhood?.message}>
                  <Controller
                    control={form.control}
                    name="neighborhood"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="Nome do bairro" editable={!isLoading} error={!!form.formState.errors.neighborhood} />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup label="Cidade" error={form.formState.errors.city?.message}>
                  <Controller
                    control={form.control}
                    name="city"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="Nome da cidade" editable={!isLoading} error={!!form.formState.errors.city} />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>

              <FormRow>
                <FormFieldGroup label="Estado" error={form.formState.errors.state?.message}>
                  <Controller
                    control={form.control}
                    name="state"
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <Combobox options={BRAZIL_STATES} value={value || undefined} onValueChange={onChange} placeholder="Selecione" disabled={isLoading} searchable clearable error={error?.message} />
                    )}
                  />
                </FormFieldGroup>

                <FormFieldGroup label="CEP" error={form.formState.errors.zipCode?.message}>
                  <Controller
                    control={form.control}
                    name="zipCode"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input value={value || ""} onChangeText={onChange} onBlur={onBlur} placeholder="00000-000" keyboardType="numeric" editable={!isLoading} error={!!form.formState.errors.zipCode} />
                    )}
                  />
                </FormFieldGroup>
              </FormRow>
            </FormCard>

            {/* Documentos */}
            <FormCard title="Documentos" icon="IconFileText">
              <ThemedText style={[styles.cardHint, { color: colors.mutedForeground }]}>
                Anexe os documentos do colaborador. Os arquivos serão vinculados à admissão ao salvar.
              </ThemedText>
              {DOCUMENT_CHECKLIST.map((type) => (
                <FormFieldGroup key={type} label={ADMISSION_DOCUMENT_TYPE_LABELS[type]}>
                  <FilePicker
                    value={docFiles[type] ? [docFiles[type] as FilePickerItem] : []}
                    onChange={(files) => {
                      const picked = files[0];
                      setDocFiles((prev) => {
                        const next = { ...prev };
                        if (picked) next[type] = picked;
                        else delete next[type];
                        return next;
                      });
                    }}
                    maxFiles={1}
                    disabled={isLoading}
                    placeholder={`Anexar ${ADMISSION_DOCUMENT_TYPE_LABELS[type]}`}
                  />
                </FormFieldGroup>
              ))}
            </FormCard>

            {/* Controle de Acesso */}
            <FormCard title="Controle de Acesso" icon="IconShieldCheck">
              <FormFieldGroup label="Ativo">
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.switchRow}>
                      <Switch checked={Boolean(value)} onCheckedChange={onChange} disabled={isLoading} />
                    </View>
                  )}
                />
              </FormFieldGroup>
              <FormFieldGroup label="Verificado">
                <Controller
                  control={form.control}
                  name="verified"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.switchRow}>
                      <Switch checked={Boolean(value)} onCheckedChange={onChange} disabled={isLoading} />
                    </View>
                  )}
                />
              </FormFieldGroup>
            </FormCard>

            {/* Processo de Admissão (observações) */}
            <FormCard title="Processo de Admissão" icon="IconUserPlus">
              <ThemedText style={[styles.cardHint, { color: colors.mutedForeground }]}>
                O checklist completo de documentos é gerado automaticamente; os arquivos anexados acima são vinculados ao processo.
              </ThemedText>
              <FormFieldGroup label="Observações">
                <Controller
                  control={form.control}
                  name={"notes" as any}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      value={(value as string | null) || ""}
                      onChangeText={(t: string) => onChange(t === "" ? null : t)}
                      onBlur={onBlur}
                      placeholder="Observações sobre o processo de admissão (opcional)"
                      multiline
                      numberOfLines={4}
                      editable={!isLoading}
                    />
                  )}
                />
              </FormFieldGroup>
            </FormCard>
          </KeyboardAwareFormProvider>
        </ScrollView>

        <FormActionBar
          onCancel={handleCancel}
          onSubmit={form.handleSubmit(handleSubmit)}
          isSubmitting={isLoading}
          submitLabel="Cadastrar Admissão"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: formSpacing.containerPaddingHorizontal,
    paddingTop: formSpacing.containerPaddingVertical,
    paddingBottom: 0,
  },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  matchBanner: { borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 2 },
  matchText: { fontSize: fontSize.sm, fontWeight: "600" },
  matchMeta: { fontSize: fontSize.xs },
  cardHint: { fontSize: fontSize.xs, marginBottom: spacing.sm },
});
