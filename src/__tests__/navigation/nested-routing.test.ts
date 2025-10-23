/**
 * Nested Routing Tests
 * Tests for nested route resolution and navigation hierarchy
 */

import { getEnglishPath, routeToMobilePath } from '../../lib/route-mapper';
import { isRouteRegistered, validateRoute, getFallbackRoute } from '../../utils/route-validator';
import { routes } from '../../constants';

describe('Nested Routing - Route Resolution', () => {
  describe('getEnglishPath', () => {
    test('should convert simple Portuguese routes to English', () => {
      expect(getEnglishPath('/estoque')).toBe('/inventory');
      expect(getEnglishPath('/producao')).toBe('/production');
      expect(getEnglishPath('/administracao')).toBe('/administration');
    });

    test('should convert nested Portuguese routes to English', () => {
      expect(getEnglishPath('/estoque/produtos')).toBe('/inventory/products');
      expect(getEnglishPath('/producao/cronograma')).toBe('/production/schedule');
      expect(getEnglishPath('/administracao/clientes')).toBe('/administration/customers');
    });

    test('should convert deeply nested Portuguese routes to English', () => {
      expect(getEnglishPath('/estoque/produtos/marcas')).toBe('/inventory/products/brands');
      expect(getEnglishPath('/producao/recorte/plano-de-recorte')).toBe('/production/cutting/cutting-plan');
      expect(getEnglishPath('/estoque/pedidos/automaticos')).toBe('/inventory/orders/automatic');
    });

    test('should handle routes with dynamic segments', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(getEnglishPath(`/estoque/produtos/detalhes/${uuid}`)).toBe(`/inventory/products/details/${uuid}`);
      expect(getEnglishPath(`/producao/cronograma/editar/${uuid}`)).toBe(`/production/schedule/edit/${uuid}`);
    });

    test('should handle routes with multiple dynamic segments', () => {
      const orderId = '123e4567-e89b-12d3-a456-426614174000';
      expect(getEnglishPath(`/estoque/pedidos/${orderId}/itens/listar`))
        .toBe(`/inventory/orders/${orderId}/items/list`);
    });

    test('should handle routes with (tabs) prefix', () => {
      expect(getEnglishPath('/(tabs)/estoque')).toBe('/inventory');
      expect(getEnglishPath('/(tabs)/estoque/produtos/marcas')).toBe('/inventory/products/brands');
    });

    test('should return home route for root path', () => {
      expect(getEnglishPath('/')).toBe('/home');
      expect(getEnglishPath(routes.home)).toBe('/home');
    });
  });

  describe('routeToMobilePath', () => {
    test('should convert Portuguese routes to mobile paths with (tabs) prefix', () => {
      expect(routeToMobilePath('/estoque')).toBe('/(tabs)/inventory');
      expect(routeToMobilePath('/producao')).toBe('/(tabs)/production');
    });

    test('should handle nested routes correctly', () => {
      expect(routeToMobilePath('/estoque/produtos')).toBe('/(tabs)/inventory/products');
      expect(routeToMobilePath('/estoque/produtos/marcas')).toBe('/(tabs)/inventory/products/brands');
    });

    test('should handle routes with dynamic segments', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(routeToMobilePath(`/estoque/produtos/detalhes/${uuid}`))
        .toBe(`/(tabs)/inventory/products/details/${uuid}`);
    });

    test('should handle home route correctly', () => {
      expect(routeToMobilePath(routes.home)).toBe('/(tabs)/home');
      expect(routeToMobilePath('/')).toBe('/(tabs)/home');
    });
  });

  describe('isRouteRegistered', () => {
    test('should return true for registered static routes', () => {
      expect(isRouteRegistered('/(tabs)/home')).toBe(true);
      expect(isRouteRegistered('/(tabs)/inventory')).toBe(true);
      expect(isRouteRegistered('/(tabs)/production/schedule')).toBe(true);
    });

    test('should return true for registered nested routes', () => {
      expect(isRouteRegistered('/(tabs)/inventory/products')).toBe(true);
      expect(isRouteRegistered('/(tabs)/inventory/products/brands')).toBe(true);
      expect(isRouteRegistered('/(tabs)/production/cutting')).toBe(true);
    });

    test('should return true for routes with dynamic segments', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(isRouteRegistered(`/(tabs)/inventory/products/details/${uuid}`)).toBe(true);
      expect(isRouteRegistered(`/(tabs)/production/schedule/edit/${uuid}`)).toBe(true);
    });

    test('should return false for unregistered routes', () => {
      expect(isRouteRegistered('/(tabs)/nonexistent')).toBe(false);
      expect(isRouteRegistered('/(tabs)/inventory/invalid')).toBe(false);
    });

    test('should handle routes without (tabs) prefix', () => {
      expect(isRouteRegistered('/home')).toBe(true);
      expect(isRouteRegistered('/inventory/products')).toBe(true);
    });
  });

  describe('validateRoute', () => {
    test('should validate correct routes', () => {
      expect(validateRoute('/(tabs)/home')).toEqual({ valid: true });
      expect(validateRoute('/(tabs)/inventory/products')).toEqual({ valid: true });
    });

    test('should reject invalid routes', () => {
      const result = validateRoute('/(tabs)/nonexistent');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject routes without leading slash', () => {
      const result = validateRoute('home');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must start with /');
    });

    test('should reject empty routes', () => {
      const result = validateRoute('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('getFallbackRoute', () => {
    test('should return home route as fallback', () => {
      expect(getFallbackRoute()).toBe('/(tabs)/home');
    });
  });
});

describe('Nested Routing - Navigation Hierarchy', () => {
  describe('Simple Nesting (2 levels)', () => {
    test('production/schedule hierarchy', () => {
      const baseRoute = routeToMobilePath(routes.production.schedule.root);
      expect(baseRoute).toBe('/(tabs)/production/schedule');

      const listRoute = routeToMobilePath(routes.production.schedule.list);
      expect(listRoute).toBe('/(tabs)/production/schedule/list');

      const createRoute = routeToMobilePath(routes.production.schedule.create);
      expect(createRoute).toBe('/(tabs)/production/schedule/create');
    });

    test('administration/customers hierarchy', () => {
      const baseRoute = routeToMobilePath(routes.administration.customers.root);
      expect(baseRoute).toBe('/(tabs)/administration/customers');

      const listRoute = routeToMobilePath(routes.administration.customers.list);
      expect(listRoute).toBe('/(tabs)/administration/customers/list');
    });
  });

  describe('Complex Nesting (3 levels)', () => {
    test('inventory/products/brands hierarchy', () => {
      const productsRoute = routeToMobilePath(routes.inventory.products.root);
      expect(productsRoute).toBe('/(tabs)/inventory/products');

      const brandsRoute = routeToMobilePath(routes.inventory.products.brands.root);
      expect(brandsRoute).toBe('/(tabs)/inventory/products/brands');

      const brandsList = routeToMobilePath(routes.inventory.products.brands.list);
      expect(brandsList).toBe('/(tabs)/inventory/products/brands/list');
    });

    test('inventory/products/categories hierarchy', () => {
      const categoriesRoute = routeToMobilePath(routes.inventory.products.categories.root);
      expect(categoriesRoute).toBe('/(tabs)/inventory/products/categories');

      const categoriesList = routeToMobilePath(routes.inventory.products.categories.list);
      expect(categoriesList).toBe('/(tabs)/inventory/products/categories/list');
    });

    test('production/cutting/cutting-plan hierarchy', () => {
      const cuttingRoute = routeToMobilePath(routes.production.cutting.root);
      expect(cuttingRoute).toBe('/(tabs)/production/cutting');

      // Note: cutting-plan routes are nested under cutting
      expect(isRouteRegistered('/(tabs)/production/cutting/cutting-plan')).toBe(true);
    });
  });

  describe('Dynamic Parent Segments', () => {
    test('inventory/orders with orderId segment', () => {
      const orderId = '123e4567-e89b-12d3-a456-426614174000';
      const orderItemsRoute = `/(tabs)/inventory/orders/${orderId}/items/list`;

      expect(isRouteRegistered(orderItemsRoute)).toBe(true);
    });

    test('painting/formulas with formulaId segment', () => {
      const formulaId = '123e4567-e89b-12d3-a456-426614174000';
      const formulaComponentsRoute = `/(tabs)/painting/formulas/${formulaId}/components/list`;

      expect(isRouteRegistered(formulaComponentsRoute)).toBe(true);
    });
  });

  describe('Nested Route Registration', () => {
    test('all production nested routes are registered', () => {
      const routes = [
        '/(tabs)/production',
        '/(tabs)/production/schedule',
        '/(tabs)/production/schedule/list',
        '/(tabs)/production/cutting',
        '/(tabs)/production/cutting/list',
        '/(tabs)/production/airbrushing',
        '/(tabs)/production/trucks',
      ];

      routes.forEach(route => {
        expect(isRouteRegistered(route)).toBe(true);
      });
    });

    test('all inventory nested routes are registered', () => {
      const routes = [
        '/(tabs)/inventory',
        '/(tabs)/inventory/products',
        '/(tabs)/inventory/products/list',
        '/(tabs)/inventory/products/brands',
        '/(tabs)/inventory/products/categories',
        '/(tabs)/inventory/orders',
        '/(tabs)/inventory/ppe',
      ];

      routes.forEach(route => {
        expect(isRouteRegistered(route)).toBe(true);
      });
    });

    test('all human-resources nested routes are registered', () => {
      const routes = [
        '/(tabs)/human-resources',
        '/(tabs)/human-resources/employees',
        '/(tabs)/human-resources/employees/list',
        '/(tabs)/human-resources/payroll',
        '/(tabs)/human-resources/sectors',
      ];

      routes.forEach(route => {
        expect(isRouteRegistered(route)).toBe(true);
      });
    });
  });
});

describe('Nested Routing - Edge Cases', () => {
  describe('Invalid Routes', () => {
    test('should handle non-existent nested routes', () => {
      const invalidRoutes = [
        '/(tabs)/inventory/invalid/nested',
        '/(tabs)/production/nonexistent/route',
        '/(tabs)/administration/missing/section',
      ];

      invalidRoutes.forEach(route => {
        expect(isRouteRegistered(route)).toBe(false);
      });
    });

    test('should handle malformed routes', () => {
      const malformedRoutes = [
        'inventory/products', // missing leading slash
        '/(tabs)//inventory', // double slash
        '/(tabs)/inventory/', // trailing slash with nothing after
      ];

      malformedRoutes.forEach(route => {
        const result = validateRoute(route);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('Path Normalization', () => {
    test('should handle routes with and without (tabs) prefix consistently', () => {
      const withPrefix = getEnglishPath('/(tabs)/estoque/produtos');
      const withoutPrefix = getEnglishPath('/estoque/produtos');

      expect(withPrefix).toBe(withoutPrefix);
    });

    test('should handle routes with trailing slashes', () => {
      expect(getEnglishPath('/estoque/produtos/')).toBe('/inventory/products');
      expect(getEnglishPath('/producao/cronograma/')).toBe('/production/schedule');
    });
  });

  describe('Special Characters in Routes', () => {
    test('should handle routes with hyphens', () => {
      expect(getEnglishPath('/recursos-humanos')).toBe('/human-resources');
      expect(getEnglishPath('/producao/recorte/plano-de-recorte')).toBe('/production/cutting/cutting-plan');
    });

    test('should handle routes with multiple word segments', () => {
      expect(getEnglishPath('/estoque/retiradas-externas')).toBe('/inventory/external-withdrawals');
      expect(getEnglishPath('/recursos-humanos/folha-de-pagamento')).toBe('/human-resources/payroll');
    });
  });
});
