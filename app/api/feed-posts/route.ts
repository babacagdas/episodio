import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let supabase: any;
    if (supabaseUrl && serviceRoleKey) {
      supabase = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });
    } else {
      supabase = await createServerClient();
    }

    const { data, error } = await supabase
      .from('admin_feed_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      // Varsayılan ilk Vitrin gönderisi (4:5 dikey format)
      return NextResponse.json([
        {
          id: 'default-1',
          image_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1080&auto=format&fit=crop',
          title: 'Eylül Ayında Yayınlanacak Diziler 🍿',
          caption: 'Bu ay ekranlara gelecek en heyecanlı yeni sezonlar ve yepyeni yapımlar Episodio\'da!',
          instagram_url: 'https://instagram.com',
          created_at: new Date().toISOString(),
        },
      ]);
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let supabase: any;
    if (supabaseUrl && serviceRoleKey) {
      supabase = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });
    } else {
      supabase = await createServerClient();
    }

    const body = await req.json();
    const { image_url, title, caption, instagram_url } = body;

    if (!image_url) {
      return NextResponse.json({ error: 'Görsel adresi zorunludur' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('admin_feed_posts')
      .insert({
        image_url,
        title: title || null,
        caption: caption || null,
        instagram_url: instagram_url || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('admin_feed_posts')) {
        return NextResponse.json(
          { error: 'Supabase SQL tablosu henüz oluşturulmadı. Lütfen Supabase SQL Editor alanında "admin_feed_posts" SQL kodunu 1 kez çalıştırın.' },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Sunucu hatası' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let supabase: any;
    if (supabaseUrl && serviceRoleKey) {
      supabase = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      });
    } else {
      supabase = await createServerClient();
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID gereklidir' }, { status: 400 });
    }

    const { error } = await supabase.from('admin_feed_posts').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Sunucu hatası' }, { status: 500 });
  }
}
