import { Link } from '@tanstack/react-router';
import { Compass } from 'lucide-react';
import { Empty } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="py-20">
      <Empty
        icon={Compass}
        title="Page not found"
        description="The route you tried to open doesn't exist (yet)."
        action={
          <Button asChild variant="teal">
            <Link to="/">Go to Overview</Link>
          </Button>
        }
      />
    </div>
  );
}
