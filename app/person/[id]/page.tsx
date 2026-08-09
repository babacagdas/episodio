import Link from 'next/link';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { BottomNav, MobileHeader } from '@/components/Nav';
import { getPersonDetail, getPersonCredits } from '@/lib/tmdb';

const PROFILE_BASE = 'https://image.tmdb.org/t/p/w500';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getPersonDetail(id);

  if (!person) {
    notFound();
  }

  const credits = await getPersonCredits(id);

  // Calculate age if birthday is present
  let age: number | null = null;
  if (person.birthday) {
    const birth = new Date(person.birthday);
    const end = person.deathday ? new Date(person.deathday) : new Date();
    age = end.getFullYear() - birth.getFullYear();
  }

  return (
    <div className="font-body-md text-body-md antialiased pb-32 md:pb-0 pt-[60px] md:pt-0 bg-[#000000] min-h-screen text-[#F4F6FA]">
      <MobileHeader />
      <Sidebar />

      <main className="overflow-x-hidden px-margin-mobile py-7 md:ml-[240px] md:px-10">
        <div className="mx-auto max-w-[1200px]">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 transition-colors hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Geri Dön</span>
            </Link>
          </div>

          {/* Actor Profile Hero Header */}
          <div className="relative mb-10 overflow-hidden rounded-3xl border border-white/10 bg-[#121216] p-6 shadow-2xl md:p-10">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#C91520]/15 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
              {/* Portrait Photo */}
              <div className="relative h-56 w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-white/15 bg-[#18181c] shadow-2xl md:h-72 md:w-52">
                {person.profile_path ? (
                  <img
                    src={`${PROFILE_BASE}${person.profile_path}`}
                    alt={person.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-white/20">person</span>
                  </div>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-1 flex-col text-center md:text-left">
                <h1 className="font-['Poppins',sans-serif] text-3xl font-black text-white sm:text-4xl md:text-5xl">
                  {person.name}
                </h1>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  {age !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                      <span className="material-symbols-outlined text-[14px] text-[#C91520]">cake</span>
                      <span>{age} Yaşında</span>
                    </span>
                  )}
                  {person.place_of_birth && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                      <span className="material-symbols-outlined text-[14px] text-[#D4A017]">location_on</span>
                      <span className="truncate max-w-[200px]">{person.place_of_birth}</span>
                    </span>
                  )}
                  {person.known_for_department && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#C91520]/30 bg-[#C91520]/15 px-3 py-1 text-xs font-bold text-[#FF525D]">
                      <span>{person.known_for_department === 'Acting' ? 'Oyuncu' : person.known_for_department}</span>
                    </span>
                  )}
                </div>

                {/* Quick Action Button */}
                <div className="mt-6 flex justify-center md:justify-start">
                  <Link
                    href={`/actor-match`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#C91520] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-[#A8121B] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[16px]">extension</span>
                    <span>Oyuncu Eşleştiricide Ara</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Biography Section */}
            {person.biography && (
              <div className="relative z-10 mt-8 border-t border-white/10 pt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-white/40">Biyografi</h3>
                <p className="text-sm font-medium leading-relaxed text-white/75 whitespace-pre-line max-w-4xl">
                  {person.biography}
                </p>
              </div>
            )}
          </div>

          {/* Filmography Section */}
          <section className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-white sm:text-2xl">
                Rol Aldığı Dizi ve Yapımlar ({credits.length})
              </h2>
            </div>

            {credits.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-[#121216] p-8 text-center text-sm text-white/40">
                Yapım bilgisi bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
                {credits.map((item) => {
                  const title = item.name || item.title || 'Yapım';
                  const date = item.first_air_date || item.release_date;
                  const year = date ? new Date(date).getFullYear() : null;

                  return (
                    <Link
                      key={`${item.media_type}-${item.id}`}
                      href={`/show/${item.id}`}
                      className="group relative block aspect-[2/3] overflow-hidden rounded-xl border border-white/5 bg-[#141414] shadow-md transition-colors duration-200 hover:border-white/20"
                    >
                      {item.poster_path ? (
                        <img
                          src={`${POSTER_BASE}${item.poster_path}`}
                          alt={title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-white/20">movie</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80" />

                      {/* Character / Year Badge */}
                      <div className="absolute bottom-0 left-0 w-full p-2.5 sm:p-3">
                        <h4 className="truncate text-xs font-bold text-white sm:text-sm">{title}</h4>
                        {item.character && (
                          <p className="truncate text-[10.5px] font-medium text-white/50">{item.character}</p>
                        )}
                        {year && (
                          <p className="mt-0.5 text-[10px] font-bold text-[#D4A017]">{year}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
