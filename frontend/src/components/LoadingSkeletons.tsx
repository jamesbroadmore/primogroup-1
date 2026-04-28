import { Skeleton } from "@/components/ui/skeleton";

// Page skeleton for dashboard-style pages
export function PageSkeleton(): React.ReactElement {
  return (
    <div className="p-6 space-y-6 animate-pulse" data-testid="page-skeleton">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Metrics row skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="divide-y divide-slate-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface CardSkeletonProps {
  className?: string;
}

// Card skeleton for individual cards
export function CardSkeleton({ className = "" }: CardSkeletonProps): React.ReactElement {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-100 ${className}`} data-testid="card-skeleton">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton(): React.ReactElement {
  return (
    <div className="p-4 flex items-center gap-4" data-testid="table-row-skeleton">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

interface ListSkeletonProps {
  count?: number;
}

// List skeleton for mobile views
export function ListSkeleton({ count = 5 }: ListSkeletonProps): React.ReactElement {
  return (
    <div className="space-y-3" data-testid="list-skeleton">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Form skeleton
export function FormSkeleton(): React.ReactElement {
  return (
    <div className="space-y-4" data-testid="form-skeleton">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-xl mt-6" />
    </div>
  );
}

interface AvatarSkeletonProps {
  size?: "sm" | "md" | "lg";
}

// Avatar skeleton
export function AvatarSkeleton({ size = "md" }: AvatarSkeletonProps): React.ReactElement {
  const sizeClasses: Record<"sm" | "md" | "lg", string> = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };
  return <Skeleton className={`${sizeClasses[size]} rounded-full`} data-testid="avatar-skeleton" />;
}

export default PageSkeleton;
