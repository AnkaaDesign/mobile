
import { View, Text, ScrollView } from 'react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';

export default function EstatisticasScreen() {
  const router = useRouter();

  const modules = [
    {
      title: 'Administração',
      description: 'Estatísticas administrativas',
      path: '/(tabs)/estatisticas/administracao',
      icon: '⚙️',
    },
    {
      title: 'Estoque',
      description: 'Análise de inventário e consumo',
      path: '/(tabs)/estatisticas/estoque',
      icon: '📦',
    },
    {
      title: 'Produção',
      description: 'Métricas de produção',
      path: '/(tabs)/estatisticas/producao',
      icon: '🏭',
    },
    {
      title: 'Recursos Humanos',
      description: 'Indicadores de RH',
      path: '/(tabs)/estatisticas/recursos-humanos',
      icon: '👥',
    },
  ];

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-6 text-foreground">Estatísticas</Text>

        {modules.map((module, index) => (
          <Card key={index} className="mb-4 p-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-3">{module.icon}</Text>
              <Text className="text-lg font-semibold text-foreground">{module.title}</Text>
            </View>
            <Text className="text-muted-foreground mb-4">{module.description}</Text>
            <Button
              onPress={() => router.push(module.path as any)}
              className="bg-primary"
            >
              <Text className="text-primary-foreground">Visualizar</Text>
            </Button>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}