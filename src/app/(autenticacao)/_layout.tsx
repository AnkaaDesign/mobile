// app/(autenticacao)/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="entrar" options={{ headerShown: false, title: "Entrar" }} />
      <Stack.Screen name="registrar" options={{ headerShown: false, title: "Cadastrar" }} />
      <Stack.Screen name="verificar-codigo" options={{ headerShown: false, title: "Verificar Código" }} />
      <Stack.Screen name="verificar-redefinicao-senha" options={{ headerShown: false, title: "Verificar Código de Recuperação" }} />
      <Stack.Screen name="recuperar-senha" options={{ headerShown: false, title: "Recuperar Senha" }} />
      <Stack.Screen name="redefinir-senha/[token]" options={{ headerShown: false, title: "Redefinir Senha" }} />
    </Stack>
  );
}
