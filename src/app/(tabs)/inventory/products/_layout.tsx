import { Stack } from "expo-router";

export default function ProductsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide headers, let parent drawer handle navigation
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="list" options={{ title: "Produtos" }} />
      <Stack.Screen name="create" options={{ title: "Cadastrar Produto" }} />
      <Stack.Screen name="details/[id]" options={{ title: "Detalhes do Produto" }} />
      <Stack.Screen name="edit/[id]" options={{ title: "Editar Produto" }} />
      <Stack.Screen name="brands" options={{ title: "Marcas" }} />
      <Stack.Screen name="brands/create" options={{ title: "Cadastrar Marca" }} />
      <Stack.Screen name="brands/list" options={{ title: "Listar Marcas" }} />
      <Stack.Screen name="brands/details/[id]" options={{ title: "Detalhes da Marca" }} />
      <Stack.Screen name="brands/edit/[id]" options={{ title: "Editar Marca" }} />
      <Stack.Screen name="categories" options={{ title: "Categorias" }} />
      <Stack.Screen name="categories/create" options={{ title: "Cadastrar Categoria" }} />
      <Stack.Screen name="categories/list" options={{ title: "Listar Categorias" }} />
      <Stack.Screen name="categories/details/[id]" options={{ title: "Detalhes da Categoria" }} />
      <Stack.Screen name="categories/edit/[id]" options={{ title: "Editar Categoria" }} />
    </Stack>
  );
}
