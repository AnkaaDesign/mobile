import { Redirect } from 'expo-router';

/**
 * Minha Equipe Index - Redirects to team members list
 */
export default function MinhaEquipeIndex() {
  return <Redirect href="/(tabs)/meu-pessoal/usuarios" />;
}
