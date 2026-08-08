export default function ProfileLoading() {
  return (
    <main className="w-full overflow-x-hidden md:ml-[240px] md:w-[calc(100%-240px)]">
      <div className="h-[220px] border-b border-white/[0.06] md:h-[300px]" />
      <div className="mx-auto -mt-16 max-w-[1200px] px-margin-mobile md:px-12">
        <div className="flex items-end gap-5">
          <div className="h-32 w-32 rounded-full border-4 border-[#0A0A0A] outline outline-1 outline-white/[0.08]" />
          <div className="mb-4 flex-1 space-y-3">
            <div className="h-8 w-56 rounded-full border border-white/[0.06]" />
            <div className="h-4 w-36 rounded-full border border-white/[0.06]" />
          </div>
        </div>
      </div>
    </main>
  );
}
