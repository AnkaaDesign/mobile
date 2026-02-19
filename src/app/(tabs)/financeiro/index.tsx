
import { View, Text, ScrollView } from 'react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function FinanceiroScreen() {
  useScreenReady();
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-6 text-foreground">Financeiro</Text>

        <Card className="mb-4 p-4">
          <Text className="text-lg font-semibold mb-2 text-foreground">Clientes</Text>
          <Text className="text-muted-foreground mb-4">Gerenciar informações financeiras de clientes</Text>
          <Button
            onPress={() => router.push('/(tabs)/financeiro/clientes' as any)}
            className="bg-primary"
          >
            <Text className="text-primary-foreground">Acessar</Text>
          </Button>
        </Card>

        <Card className="mb-4 p-4">
          <Text className="text-lg font-semibold mb-2 text-foreground">Produção</Text>
          <Text className="text-muted-foreground mb-4">Acompanhar financeiro da produção</Text>
          <Button
            onPress={() => router.push('/(tabs)/financeiro/producao' as any)}
            className="bg-primary"
          >
            <Text className="text-primary-foreground">Acessar</Text>
          </Button>
        </Card>
      </View>
    </ScrollView>
  );
}