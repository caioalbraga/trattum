import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={`rounded-lg bg-muted ${className}`}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function GreetingSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonPulse className="h-10 w-72" />
      <SkeletonPulse className="h-5 w-56" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card className="card-elevated">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <SkeletonPulse className="h-4 w-32" />
        <SkeletonPulse className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <SkeletonPulse className="h-8 w-24 mb-2" />
        <SkeletonPulse className="h-4 w-20" />
      </CardContent>
    </Card>
  );
}

export function MetasCardSkeleton() {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <SkeletonPulse className="h-7 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/40"
          >
            <SkeletonPulse className="h-5 w-5 rounded" />
            <SkeletonPulse className="h-5 flex-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8">
      <GreetingSkeleton />
      
      <div className="grid gap-6 md:grid-cols-3">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      
      <MetasCardSkeleton />
    </div>
  );
}

export function TratamentoSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SkeletonPulse className="h-10 w-64" />
        <SkeletonPulse className="h-5 w-80" />
      </div>
      
      <Card className="card-elevated">
        <CardContent className="p-8 space-y-6">
          <SkeletonPulse className="h-6 w-48" />
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-3/4" />
          <SkeletonPulse className="h-12 w-40 rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ContaSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <SkeletonPulse className="h-10 w-48" />
        <SkeletonPulse className="h-5 w-64" />
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader>
            <SkeletonPulse className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <SkeletonPulse className="h-10 w-full" />
            <SkeletonPulse className="h-10 w-full" />
            <SkeletonPulse className="h-10 w-full" />
          </CardContent>
        </Card>
        
        <Card className="card-elevated">
          <CardHeader>
            <SkeletonPulse className="h-6 w-28" />
          </CardHeader>
          <CardContent className="space-y-4">
            <SkeletonPulse className="h-10 w-full" />
            <SkeletonPulse className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
