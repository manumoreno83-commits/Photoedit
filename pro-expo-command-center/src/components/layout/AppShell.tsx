import { Outlet } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { RightPanel } from './RightPanel';

export function AppShell() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <div className="flex flex-1 min-w-0">
          <main className="flex-1 min-w-0 px-6 py-6">
            <div className="mx-auto w-full max-w-[1280px] space-y-6 animate-fade-in">
              <Outlet />
            </div>
          </main>
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
