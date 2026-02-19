import { Redirect } from 'expo-router';
import { useScreenReady } from '@/hooks/use-screen-ready';

/**
 * Minha Equipe Index - Redirects to team members list
 */
export default function MinhaEquipeIndex() {
  useScreenReady();
  return <Redirect href="/(tabs)/meu-pessoal/usuarios" />;
}
