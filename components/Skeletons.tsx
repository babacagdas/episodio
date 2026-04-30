export function CardSkeleton() {
  return (
    <div className="aspect-[2/3] rounded-xl bg-[#141414] border border-white/5 overflow-hidden animate-pulse">
      <div className="w-full h-full bg-gradient-to-b from-white/5 to-transparent" />
    </div>
  );
}

export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

export function EpisodeSkeleton() {
  return (
    <div className="bg-[#141414] border border-white/5 rounded-xl p-4 flex gap-4 items-center animate-pulse">
      <div className="w-28 h-16 md:w-40 md:h-24 rounded-lg bg-white/5 shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 bg-white/5 rounded w-2/3" />
        <div className="h-2 bg-white/5 rounded w-full" />
        <div className="h-2 bg-white/5 rounded w-1/3" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[530px] md:h-[600px] bg-[#141414] animate-pulse">
      <div className="absolute bottom-0 left-0 w-full px-6 md:px-12 pb-10 flex flex-col gap-3">
        <div className="h-8 bg-white/5 rounded w-64" />
        <div className="h-4 bg-white/5 rounded w-40" />
        <div className="h-4 bg-white/5 rounded w-24" />
        <div className="flex gap-3 mt-2">
          <div className="h-10 bg-white/5 rounded-full w-32" />
          <div className="h-10 bg-white/5 rounded-full w-36" />
        </div>
      </div>
    </div>
  );
}
