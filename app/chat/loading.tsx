export default function ChatLoading() {
  return (
    <div className="flex h-screen bg-[#090909] md:pl-[200px]">
      <div className="hidden w-[340px] border-r border-white/[0.06] p-4 md:block">
        <div className="mb-5 h-10 rounded-full border border-white/[0.06]" />
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-16 rounded-2xl border border-white/[0.06]" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="h-20 w-20 rounded-2xl border border-white/[0.06]" />
      </div>
    </div>
  );
}
