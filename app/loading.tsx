export default function AppLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] px-6 py-8 text-white md:ml-[200px] md:px-10">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div className="space-y-4">
          <div className="h-9 w-72 rounded-full border border-white/[0.06]" />
          <div className="h-9 w-[min(460px,80vw)] rounded-full border border-white/[0.06]" />
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <div className="h-9 w-28 rounded-full border border-white/[0.06]" />
          <div className="h-9 w-9 rounded-full border border-white/[0.06]" />
          <div className="h-9 w-9 rounded-full border border-white/[0.06]" />
        </div>
      </div>
      <div className="space-y-8">
        <div className="h-[300px] rounded-2xl border border-white/[0.06]" />
        <div>
          <div className="mb-4 h-5 w-36 rounded-full border border-white/[0.06]" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] rounded-xl border border-white/[0.06]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
