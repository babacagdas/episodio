export default function SearchLoading() {
  return (
    <div className="min-h-screen px-6 pb-24 pt-8 md:ml-[200px] md:px-12">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-32 rounded-full border border-white/[0.06]" />
        <div className="h-10 max-w-2xl rounded-full border border-white/[0.06]" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="aspect-[2/3] rounded-xl border border-white/[0.06]" />
        ))}
      </div>
    </div>
  );
}
