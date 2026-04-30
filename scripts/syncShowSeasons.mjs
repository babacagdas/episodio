import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const TMDB_KEY = process.env.TMDB_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!TMDB_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env vars. Please set TMDB_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

function tmdb(path) {
  return fetch(`https://api.themoviedb.org/3${path}?api_key=${TMDB_KEY}`).then(r => {
    if (!r.ok) throw new Error(`TMDB ${r.status} ${r.statusText}`);
    return r.json();
  });
}

async function upsertShow(tvId, showData) {
  // Attempts to upsert a minimal show row. Adjust fields to match your schema if needed.
  const payload = {
    tmdb_id: Number(tvId),
    title: showData.name || showData.original_name || showData.title,
    poster_path: showData.poster_path || null,
    overview: showData.overview || null
  };

  const { data, error } = await supabase
    .from('shows')
    .upsert(payload, { onConflict: 'tmdb_id' })
    .select();

  if (error) throw error;
  // If upsert returns an array, pick first; otherwise assume payload hasn't returned id.
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.id) {
    // try to get id by querying
    const { data: q, error: qerr } = await supabase.from('shows').select('id').eq('tmdb_id', tvId).limit(1).maybeSingle();
    if (qerr) throw qerr;
    return q?.id ?? null;
  }
  return row.id;
}

async function upsertSeason(localShowId, season) {
  const payload = {
    show_id: localShowId,
    season_number: season.season_number,
    name: season.name || null,
    episode_count: season.episode_count ?? null,
    poster_path: season.poster_path || null,
    air_date: season.air_date || null
  };

  const { error } = await supabase
    .from('seasons')
    .upsert(payload, { onConflict: 'show_id,season_number' });

  if (error) throw error;
}

async function upsertEpisodes(localShowId, seasonNumber, episodes) {
  if (!episodes || episodes.length === 0) return;
  const payload = episodes.map((ep) => ({
    show_id: localShowId,
    season_number: seasonNumber,
    episode_number: ep.episode_number,
    tmdb_episode_id: ep.id || null,
    name: ep.name || null,
    overview: ep.overview || null,
    air_date: ep.air_date || null,
    runtime: ep.runtime || null,
    still_path: ep.still_path || null,
    vote_average: ep.vote_average ?? null
  }));

  // Upsert in batches (Supabase may have limits on batch size)
  const chunkSize = 100;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('episodes')
      .upsert(chunk, { onConflict: 'show_id,season_number,episode_number' });
    if (error) throw error;
  }
}

async function sync(tvId, providedLocalShowId) {
  console.log('Fetching show', tvId);
  const showData = await tmdb(`/tv/${tvId}`);

  let localShowId = providedLocalShowId ?? null;
  if (!localShowId) {
    console.log('Upserting show into `shows` table...');
    localShowId = await upsertShow(tvId, showData);
    if (!localShowId) throw new Error('Could not determine local show id after upsert.');
  } else {
    console.log('Using provided local show id:', localShowId);
  }

  const seasons = showData.seasons || [];
  for (const s of seasons) {
    console.log(`Processing season ${s.season_number} (${s.name || 'n/a'})`);
    try {
      await upsertSeason(localShowId, s);
      const seasonData = await tmdb(`/tv/${tvId}/season/${s.season_number}`);
      await upsertEpisodes(localShowId, s.season_number, seasonData.episodes || []);
    } catch (err) {
      console.error(`Failed season ${s.season_number}:`, err.message || err);
    }
  }

  console.log('Sync complete.');
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 1) {
    console.error('Usage: node scripts/syncShowSeasons.mjs <tmdb_tv_id> [local_show_id]');
    process.exit(1);
  }
  const tvId = argv[0];
  const localShowId = argv[1] ? Number(argv[1]) : undefined;

  try {
    await sync(tvId, localShowId);
  } catch (err) {
    console.error('Sync failed:', err.message || err);
    process.exit(1);
  }
}

main();
