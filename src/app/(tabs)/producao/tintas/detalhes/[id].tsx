
import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { usePaintDetail } from '../../../../../hooks';
import { PaintCatalogCard, PaintFormulaDetail, MobileProductionCalculator } from "@/components/painting";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { ErrorScreen } from "@/components/ui/error-screen";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PaintDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: paintResponse,
    isLoading,
    error,
  } = usePaintDetail(id as string, {
    include: {
      formulas: {
        include: {
          components: {
            include: {
              item: true,
            },
          },
        },
      },
      relatedPaints: true,
      relatedTo: true,
    },
  });

  const paint = paintResponse?.data;

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Carregando...",
            headerBackTitle: "Voltar",
          }}
        />
        <LoadingScreen />
      </>
    );
  }

  if (error || !paint) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Erro",
            headerBackTitle: "Voltar",
          }}
        />
        <ErrorScreen title="Erro ao carregar tinta" message={error?.message || "Tinta não encontrada"} />
      </>
    );
  }

  // Get the best formula for production (most complete data)
  const getBestFormula = () => {
    if (!paint?.formulas || paint.formulas.length === 0) {
      return null;
    }

    // Score formulas based on data completeness
    const scoredFormulas = paint.formulas.map((formula) => {
      let score = 0;
      if (formula.components) {
        formula.components.forEach((component) => {
          if (component.ratio) score += 3;
          score += 1; // Base score for having the component
        });
      }
      if (formula.density) score += 5;
      if (formula.pricePerLiter) score += 2;

      return { formula, score };
    });

    // Return formula with highest score
    scoredFormulas.sort((a, b) => b.score - a.score);
    return scoredFormulas[0].formula;
  };

  const bestFormula = getBestFormula();

  return (
    <>
      <Stack.Screen
        options={{
          title: paint?.name || "Tinta",
          headerBackTitle: "Voltar",
        }}
      />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4">
          {/* Production Context Header */}
          <Card className="p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Icon name="factory" size={20} className="text-primary" />
              <Text className="text-lg font-semibold text-foreground">Tinta para Produção</Text>
            </View>
            <Text className="text-sm text-muted-foreground">Informações técnicas e cálculos para produção industrial</Text>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="formulas">Fórmulas</TabsTrigger>
              <TabsTrigger value="production">Produção</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <PaintCatalogCard paint={paint!} />

              {/* Production Readiness */}
              <Card className="p-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <Icon name="clipboard-check" size={16} className="text-primary" />
                  <Text className="text-base font-medium text-foreground">Status de Produção</Text>
                </View>

                <View className="space-y-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted-foreground">Fórmulas Disponíveis:</Text>
                    <Badge variant={paint?.formulas && paint.formulas.length > 0 ? "default" : "destructive"}>{paint?.formulas?.length || 0}</Badge>
                  </View>

                  {bestFormula && (
                    <>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-muted-foreground">Melhor Fórmula:</Text>
                        <Text className="text-sm font-medium">{bestFormula.description || "Sem descrição"}</Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-muted-foreground">Componentes:</Text>
                        <Badge variant="secondary">{bestFormula.components?.length || 0} itens</Badge>
                      </View>
                    </>
                  )}

                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted-foreground">Pronto para Produção:</Text>
                    <Badge variant={bestFormula && bestFormula.components && bestFormula.components.length > 0 ? "default" : "destructive"}>
                      {bestFormula && bestFormula.components && bestFormula.components.length > 0 ? "Sim" : "Não"}
                    </Badge>
                  </View>
                </View>
              </Card>
            </TabsContent>

            <TabsContent value="formulas" className="space-y-4">
              {paint?.formulas && paint.formulas.length > 0 ? (
                paint.formulas.map((formula, index) => (
                  <View key={formula.id || index}>
                    <PaintFormulaDetail formula={formula} showComponents={true} showCalculations={true} />
                    {index < paint.formulas!.length - 1 && <Separator className="my-4" />}
                  </View>
                ))
              ) : (
                <Alert>
                  <Icon name="info" size={16} />
                  <AlertDescription>Esta tinta não possui fórmulas cadastradas. Não é possível realizar produção sem fórmulas.</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="production" className="space-y-4">
              {bestFormula ? (
                <>
                  <Card className="p-4">
                    <View className="flex-row items-center gap-2 mb-3">
                      <Icon name="beaker" size={16} className="text-primary" />
                      <Text className="text-base font-medium text-foreground">Fórmula Recomendada</Text>
                    </View>
                    <Text className="text-sm text-muted-foreground mb-2">{bestFormula.description || "Fórmula selecionada automaticamente"}</Text>
                    <View className="flex-row items-center gap-2">
                      <Badge variant="secondary">{bestFormula.components?.length || 0} componentes</Badge>
                      {bestFormula.density && <Badge variant="outline">{bestFormula.density.toFixed(4)} g/ml</Badge>}
                    </View>
                  </Card>

                  <MobileProductionCalculator formula={bestFormula} targetQuantity={1} />
                </>
              ) : (
                <Alert>
                  <Icon name="alert-triangle" size={16} />
                  <AlertDescription>Não é possível calcular produção sem fórmulas. Adicione pelo menos uma fórmula com componentes para esta tinta.</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </View>
      </ScrollView>
    </>
  );
}
