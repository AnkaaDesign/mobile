// Ultra-Optimized Navigation with Privilege-Based Route Loading
// This version only loads routes that the user has access to
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from "react";
import { Drawer } from "expo-router/drawer";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/ui/icon";
import { usePathname } from "expo-router";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
import { SECTOR_PRIVILEGES } from '@/constants/enums';
import type { DrawerContentComponentProps } from "@react-navigation/drawer";

// Performance monitoring
const PERF_DEBUG = __DEV__;
const logPerformance = (action: string, startTime: number) => {
  if (PERF_DEBUG) {
    console.log(`[PERF] ${action}: ${Date.now() - startTime}ms`);
  }
};

// Lazy load drawer content
const DrawerContent = lazy(() => import('./PrivilegeDrawerContent'));

// Route configuration with privilege requirements
interface RouteConfig {
  name: string;
  title: string;
  requiredPrivilege?: SECTOR_PRIVILEGES | SECTOR_PRIVILEGES[];
  module?: string;
  alwaysLoad?: boolean; // Core routes that everyone needs
}

// Privilege hierarchy - higher privileges include lower ones
const PRIVILEGE_HIERARCHY: Record<SECTOR_PRIVILEGES, number> = {
  [SECTOR_PRIVILEGES.ADMIN]: 10,
  [SECTOR_PRIVILEGES.LEADER]: 9,
  [SECTOR_PRIVILEGES.HUMAN_RESOURCES]: 8,
  [SECTOR_PRIVILEGES.FINANCIAL]: 7,
  [SECTOR_PRIVILEGES.PRODUCTION]: 6,
  [SECTOR_PRIVILEGES.WAREHOUSE]: 5,
  [SECTOR_PRIVILEGES.MAINTENANCE]: 4,
  [SECTOR_PRIVILEGES.LOGISTIC]: 3,
  [SECTOR_PRIVILEGES.DESIGNER]: 2,
  [SECTOR_PRIVILEGES.EXTERNAL]: 1,
  [SECTOR_PRIVILEGES.BASIC]: 0,
};

// Core routes everyone can access (minimal set)
const CORE_ROUTES: RouteConfig[] = [
  { name: "inicio", title: "Início", alwaysLoad: true },
  { name: "meu-perfil", title: "Meu Perfil", alwaysLoad: true },
  { name: "configuracoes", title: "Configurações", alwaysLoad: true },
];

// Privilege-based route groups (only load if user has privilege)
const PRIVILEGED_ROUTES: Record<string, RouteConfig[]> = {
  // ADMIN routes
  [SECTOR_PRIVILEGES.ADMIN]: [
    { name: "administracao/index", title: "Administração", module: "admin" },
    { name: "administracao/colaboradores/index", title: "Colaboradores", module: "admin" },
    { name: "administracao/clientes/index", title: "Clientes", module: "admin" },
    { name: "administracao/setores/index", title: "Setores", module: "admin" },
    { name: "administracao/notificacoes/index", title: "Notificações", module: "admin" },
    { name: "servidor/index", title: "Servidor", module: "server" },
    { name: "servidor/backups/listar", title: "Backups", module: "server" },
    { name: "servidor/logs", title: "Logs", module: "server" },
  ],

  // HUMAN_RESOURCES routes
  [SECTOR_PRIVILEGES.HUMAN_RESOURCES]: [
    { name: "recursos-humanos/index", title: "Recursos Humanos", module: "hr" },
    { name: "recursos-humanos/colaboradores/listar", title: "Colaboradores", module: "hr" },
    { name: "recursos-humanos/ferias/index", title: "Férias", module: "hr" },
    { name: "recursos-humanos/feriados/index", title: "Feriados", module: "hr" },
    { name: "recursos-humanos/cargos/index", title: "Cargos", module: "hr" },
    { name: "recursos-humanos/avisos/index", title: "Advertências", module: "hr" },
    { name: "recursos-humanos/folha-de-pagamento/listar", title: "Folha de Pagamento", module: "hr" },
    { name: "recursos-humanos/epi/index", title: "EPIs", module: "hr" },
  ],

  // PRODUCTION routes
  [SECTOR_PRIVILEGES.PRODUCTION]: [
    { name: "producao/index", title: "Produção", module: "production" },
    { name: "producao/cronograma/index", title: "Cronograma", module: "production" },
    { name: "producao/aerografia/index", title: "Aerografia", module: "production" },
    { name: "producao/garagens/index", title: "Garagens", module: "production" },
    { name: "producao/observacoes/index", title: "Observações", module: "production" },
    { name: "producao/ordens-de-servico/listar", title: "Ordens de Serviço", module: "production" },
    { name: "producao/servicos/listar", title: "Serviços", module: "production" },
  ],

  // WAREHOUSE routes
  [SECTOR_PRIVILEGES.WAREHOUSE]: [
    { name: "estoque/index", title: "Estoque", module: "inventory" },
    { name: "estoque/produtos/index", title: "Produtos", module: "inventory" },
    { name: "estoque/movimentacoes/index", title: "Movimentações", module: "inventory" },
    { name: "estoque/fornecedores/index", title: "Fornecedores", module: "inventory" },
    { name: "estoque/pedidos/index", title: "Pedidos", module: "inventory" },
    { name: "estoque/manutencao/index", title: "Manutenção", module: "inventory" },
    { name: "estoque/emprestimos/index", title: "Empréstimos", module: "inventory" },
    { name: "estoque/epi/index", title: "EPIs Estoque", module: "inventory" },
  ],

  // FINANCIAL routes
  [SECTOR_PRIVILEGES.FINANCIAL]: [
    { name: "financeiro/index", title: "Financeiro", module: "financial" },
    { name: "financeiro/clientes/listar", title: "Clientes", module: "financial" },
  ],

  // LEADER routes (inherits from multiple)
  [SECTOR_PRIVILEGES.LEADER]: [
    { name: "meu-pessoal/index", title: "Meu Pessoal", module: "personal" },
    { name: "meu-pessoal/advertencias", title: "Avisos da Equipe", module: "personal" },
    { name: "meu-pessoal/ferias", title: "Férias da Equipe", module: "personal" },
    { name: "meu-pessoal/emprestimos", title: "Empréstimos da Equipe", module: "personal" },
    { name: "pintura/catalogo-basico/index", title: "Catálogo", module: "painting" },
    { name: "pintura/catalogo/index", title: "Catálogo Completo", module: "painting" },
  ],

  // MAINTENANCE routes
  [SECTOR_PRIVILEGES.MAINTENANCE]: [
    { name: "manutencao/index", title: "Manutenção", module: "maintenance" },
    { name: "estoque/manutencao/index", title: "Manutenção Estoque", module: "inventory" },
    { name: "estoque/manutencao/agendamentos/index", title: "Agendamentos", module: "inventory" },
  ],

  // DESIGNER routes
  [SECTOR_PRIVILEGES.DESIGNER]: [
    { name: "pintura/index", title: "Pintura", module: "painting" },
    { name: "pintura/catalogo/index", title: "Catálogo", module: "painting" },
    { name: "pintura/formulas/listar", title: "Fórmulas", module: "painting" },
    { name: "pintura/marcas-de-tinta/index", title: "Marcas de Tinta", module: "painting" },
    { name: "pintura/tipos-de-tinta/index", title: "Tipos de Tinta", module: "painting" },
  ],

  // BASIC routes (minimal access)
  [SECTOR_PRIVILEGES.BASIC]: [
    { name: "pessoal/meu-perfil", title: "Meu Perfil", module: "personal" },
    { name: "pessoal/minhas-notificacoes/listar", title: "Notificações", module: "personal" },
    { name: "pessoal/preferencias/tema", title: "Preferências", module: "personal" },
  ],

  // EXTERNAL routes (very limited)
  [SECTOR_PRIVILEGES.EXTERNAL]: [
    { name: "catalogo", title: "Catálogo", module: "catalog" },
    { name: "pintura/catalogo-basico/index", title: "Catálogo Básico", module: "painting" },
  ],
};

// Route access cache to avoid recalculation
const routeAccessCache = new Map<string, Set<string>>();

// Calculate which routes a user can access based on their privileges
function getUserAccessibleRoutes(userPrivileges: SECTOR_PRIVILEGES[]): RouteConfig[] {
  const startTime = Date.now();

  // Create cache key
  const cacheKey = userPrivileges.sort().join(',');

  // Check cache
  if (routeAccessCache.has(cacheKey)) {
    const cachedRoutes = routeAccessCache.get(cacheKey)!;
    logPerformance(`Route calculation (cached)`, startTime);
    return Array.from(cachedRoutes).map(name => {
      const privilegedRoute = Object.values(PRIVILEGED_ROUTES)
        .flat()
        .find(r => r.name === name);
      return privilegedRoute || CORE_ROUTES.find(r => r.name === name)!;
    }).filter(Boolean);
  }

  const accessibleRoutes = new Set<RouteConfig>();

  // Always add core routes
  CORE_ROUTES.forEach(route => accessibleRoutes.add(route));

  // Add routes based on user privileges
  userPrivileges.forEach(privilege => {
    const routes = PRIVILEGED_ROUTES[privilege];
    if (routes) {
      routes.forEach(route => accessibleRoutes.add(route));
    }

    // Admin gets everything
    if (privilege === SECTOR_PRIVILEGES.ADMIN) {
      Object.values(PRIVILEGED_ROUTES).flat().forEach(route => {
        accessibleRoutes.add(route);
      });
    }

    // Leader gets production and some inventory
    if (privilege === SECTOR_PRIVILEGES.LEADER) {
      PRIVILEGED_ROUTES[SECTOR_PRIVILEGES.PRODUCTION]?.forEach(route => {
        accessibleRoutes.add(route);
      });
      // Add specific inventory routes for leaders
      const leaderInventoryRoutes = [
        { name: "estoque/produtos/index", title: "Produtos", module: "inventory" },
        { name: "estoque/emprestimos/index", title: "Empréstimos", module: "inventory" },
      ];
      leaderInventoryRoutes.forEach(route => accessibleRoutes.add(route));
    }
  });

  // Cache the result
  const routeNames = new Set(Array.from(accessibleRoutes).map(r => r.name));
  routeAccessCache.set(cacheKey, routeNames);

  logPerformance(`Route calculation for ${accessibleRoutes.size} routes`, startTime);

  return Array.from(accessibleRoutes);
}

// Module loader that only loads needed modules
class PrivilegedModuleLoader {
  private loadedModules = new Set<string>();
  private modulePromises = new Map<string, Promise<void>>();

  async loadModulesForRoutes(routes: RouteConfig[]): Promise<void> {
    const modulesToLoad = new Set<string>();

    routes.forEach(route => {
      if (route.module && !this.loadedModules.has(route.module)) {
        modulesToLoad.add(route.module);
      }
    });

    if (modulesToLoad.size === 0) return;

    const startTime = Date.now();

    // Load modules in parallel
    await Promise.all(
      Array.from(modulesToLoad).map(module => this.loadModule(module))
    );

    logPerformance(`Loaded ${modulesToLoad.size} modules`, startTime);
  }

  private async loadModule(moduleName: string): Promise<void> {
    if (this.loadedModules.has(moduleName)) return;

    // Check if already loading
    if (this.modulePromises.has(moduleName)) {
      return this.modulePromises.get(moduleName)!;
    }

    const promise = this.simulateModuleLoad(moduleName);
    this.modulePromises.set(moduleName, promise);

    await promise;

    this.loadedModules.add(moduleName);
    this.modulePromises.delete(moduleName);
  }

  private async simulateModuleLoad(moduleName: string): Promise<void> {
    // Simulate async module loading
    // In real app, this would be dynamic imports
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`[MODULE] Loaded: ${moduleName}`);
        resolve();
      }, 50); // Simulate 50ms load time
    });
  }

  getLoadedModules(): string[] {
    return Array.from(this.loadedModules);
  }
}

const moduleLoader = new PrivilegedModuleLoader();

// Loading screen component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#15803d" />
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

// Main optimized drawer layout
export function PrivilegeOptimizedDrawerLayout() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const pathname = usePathname();
  const { canGoBack, goBack } = useNavigationHistory();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [accessibleRoutes, setAccessibleRoutes] = useState<RouteConfig[]>([]);

  // Get user privileges
  const userPrivileges = useMemo(() => {
    if (!user?.sectors) return [SECTOR_PRIVILEGES.BASIC];
    return user.sectors.map(s => s.privilege as SECTOR_PRIVILEGES);
  }, [user]);

  // Calculate and load accessible routes
  useEffect(() => {
    const loadUserRoutes = async () => {
      const startTime = Date.now();
      setIsLoading(true);

      // Calculate accessible routes based on privileges
      const routes = getUserAccessibleRoutes(userPrivileges);

      // Load only the necessary modules
      await moduleLoader.loadModulesForRoutes(routes);

      setAccessibleRoutes(routes);
      setIsLoading(false);

      const loadedModules = moduleLoader.getLoadedModules();
      console.log(`[PRIVILEGE-NAV] User has access to ${routes.length} routes`);
      console.log(`[PRIVILEGE-NAV] Loaded modules: ${loadedModules.join(', ')}`);
      logPerformance(`Total navigation setup`, startTime);

      // Show performance comparison
      if (PERF_DEBUG) {
        const totalPossibleRoutes = 380; // Your original route count
        const percentageLoaded = ((routes.length / totalPossibleRoutes) * 100).toFixed(1);
        console.log(`[OPTIMIZATION] Loading ${routes.length}/${totalPossibleRoutes} routes (${percentageLoaded}% of total)`);
        console.log(`[OPTIMIZATION] Saved loading ${totalPossibleRoutes - routes.length} unnecessary routes`);
      }
    };

    loadUserRoutes();
  }, [userPrivileges]);

  // Memoized drawer colors
  const drawerColors = useMemo(() => ({
    background: isDark ? "#0a0a0a" : "#ffffff",
    text: isDark ? "#e5e5e5" : "#262626",
    activeText: "#ffffff",
    active: "#15803d",
  }), [isDark]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Drawer
      drawerContent={(props) => (
        <Suspense fallback={<LoadingScreen />}>
          <DrawerContent
            {...props}
            accessibleRoutes={accessibleRoutes}
            userPrivileges={userPrivileges}
            theme={theme}
            isDark={isDark}
          />
        </Suspense>
      )}
      screenOptions={({ navigation }) => ({
        headerLeft: () => (
          canGoBack ? (
            <Pressable
              onPress={goBack}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed
              ]}
            >
              <Icon name="arrow-left" size="md" variant="default" />
            </Pressable>
          ) : null
        ),
        headerRight: () => (
          <View style={styles.headerRight}>
            <ThemeToggle />
            <Pressable
              onPress={() => navigation.openDrawer()}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.headerButtonPressed
              ]}
            >
              <Icon name="menu" size="md" variant="default" />
            </Pressable>
          </View>
        ),
        drawerPosition: "right",
        drawerStyle: {
          backgroundColor: drawerColors.background,
          width: 280,
        },
        drawerActiveTintColor: drawerColors.activeText,
        drawerActiveBackgroundColor: drawerColors.active,
        drawerInactiveTintColor: drawerColors.text,
      })}
    >
      {/* Only register routes the user can access */}
      {accessibleRoutes.map((route) => (
        <Drawer.Screen
          key={route.name}
          name={route.name}
          options={{
            title: route.title,
            lazy: true,
          }}
        />
      ))}
    </Drawer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#525252',
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
  },
  headerButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
});

export default PrivilegeOptimizedDrawerLayout;