import { NextResponse } from 'next/server';



export async function GET() {
  const apiKey = process.env.TMDB_API_KEY ?? process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return NextResponse.json([]);

  try {
    // TMDB En Yüksek Puanlı / Popüler dizilerden #50 ile #150 sıralaması arasındaki sayfaları çek (Sayfa 3, 4, 5, 6, 7, 8)
    const pages = [3, 4, 5, 6, 7, 8];
    const fetchPromises = pages.map((page) =>
      fetch(
        `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=tr-TR&sort_by=vote_average.desc&vote_count.gte=250&page=${page}`,
        { next: { revalidate: 86400 } }
      ).then((res) => (res.ok ? res.json() : { results: [] }))
    );

    const resultsArray = await Promise.all(fetchPromises);
    const combinedShows: any[] = [];

    resultsArray.forEach((data) => {
      if (Array.isArray(data.results)) {
        combinedShows.push(...data.results);
      }
    });

    // Filtreleme: Görseli ve açıklaması olan kaliteli dizileri seç, tam 100 dizilik havuz oluştur
    const validPool = combinedShows
      .filter((show) => show.poster_path && show.name)
      .slice(0, 100);

    return NextResponse.json(validPool);
  } catch (err) {
    console.error('Random pool error:', err);
    return NextResponse.json([]);
  }
}
