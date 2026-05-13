import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { AppShell } from '@/components/layout/AppShell';
import { OverviewPage } from '@/routes/overview';
import { OperationsCenterPage } from '@/routes/operations-center/index';
import { AgentDetailPage } from '@/routes/operations-center/agent';
import { CockpitPage } from '@/routes/cockpit/index';
import { ProjectDetailPage } from '@/routes/cockpit/project';
import { KnowledgePage } from '@/routes/knowledge/index';
import { KnowledgeCategoryPage } from '@/routes/knowledge/category';
import { NotFoundPage } from '@/routes/not-found';

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFoundPage,
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: OverviewPage,
});

const operationsCenterIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations-center',
  component: OperationsCenterPage,
});

const agentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/operations-center/$agentId',
  component: AgentDetailPage,
});

const cockpitIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cockpit',
  component: CockpitPage,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cockpit/$projectId',
  component: ProjectDetailPage,
});

const knowledgeIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/knowledge',
  component: KnowledgePage,
});

const knowledgeCategoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/knowledge/$category',
  component: KnowledgeCategoryPage,
});

const routeTree = rootRoute.addChildren([
  overviewRoute,
  operationsCenterIndexRoute,
  agentDetailRoute,
  cockpitIndexRoute,
  projectDetailRoute,
  knowledgeIndexRoute,
  knowledgeCategoryRoute,
]);

export const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
