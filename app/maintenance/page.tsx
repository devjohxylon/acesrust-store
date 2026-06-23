import { siteConfig } from '@/lib/site';
import { Wrench } from 'lucide-react';

const maintenanceMessage =
  process.env.MAINTENANCE_MESSAGE ||
  'We are performing scheduled maintenance. The store will be back online shortly.';

export default function MaintenancePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      <div className="relative z-10 max-w-lg w-full text-center p-10 rounded-2xl bg-gradient-card border border-primary/30 glow-primary">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-6 mx-auto">
          <Wrench className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          {siteConfig.name}
        </h1>
        <p className="text-primary font-medium mb-4">Store Under Maintenance</p>
        <p className="text-muted text-lg leading-relaxed">{maintenanceMessage}</p>
      </div>
    </div>
  );
}
