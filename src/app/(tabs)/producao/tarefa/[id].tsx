/**
 * Unified Task Detail Route
 *
 * This is the canonical task detail page that works regardless of task status.
 * Tasks can be in different statuses (PREPARATION, WAITING_PRODUCTION, IN_PRODUCTION,
 * COMPLETED, CANCELLED) and may appear in different list views (agenda, cronograma, historico),
 * but this unified route ensures deep links and notifications always work.
 *
 * Routes:
 * - /producao/tarefa/[id] - Unified route (RECOMMENDED for deep links/notifications)
 * - /producao/agenda/detalhes/[id] - Backwards compatible
 * - /producao/cronograma/detalhes/[id] - Backwards compatible
 * - /producao/historico/detalhes/[id] - Backwards compatible
 *
 * All routes render the same component - the task detail screen from cronograma.
 */
export { default } from "../cronograma/detalhes/[id]";
