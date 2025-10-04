// app/(auth)/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false, title: "Entrar" }} />
      <Stack.Screen name="register" options={{ headerShown: false, title: "Cadastrar" }} />
      <Stack.Screen name="verify-code" options={{ headerShown: false, title: "Verificar Código" }} />
      <Stack.Screen name="verify-password-code" options={{ headerShown: false, title: "Verificar Código de Recuperação" }} />
      <Stack.Screen name="recover-password" options={{ headerShown: false, title: "Recuperar Senha" }} />
      <Stack.Screen name="reset-password/[token]" options={{ headerShown: false, title: "Redefinir Senha" }} />
    </Stack>
  );
}
