'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { BottomNav } from '@/components/Nav';

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ChatListItem {
  otherUser: Profile;
  lastMessage: Message | null;
  unreadCount: number;
}

interface ChatClientProps {
  currentUser: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export default function ChatClient({ currentUser }: ChatClientProps) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('user');

  // State'ler
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connections, setConnections] = useState<Profile[]>([]);
  
  // Arayüz State'leri
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChatIdRef = useRef<string | null>(null);

  // Aktif sohbet ID'sini ref'te saklayalım (realtime callback'leri için)
  useEffect(() => {
    activeChatIdRef.current = selectedUserId;
  }, [selectedUserId]);

  // Sohbet geçmişini (son mesajları) yükle
  const loadChats = useCallback(async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) throw error;

      if (!messagesData || messagesData.length === 0) {
        setChats([]);
        setLoadingChats(false);
        return;
      }

      // Benzersiz kullanıcı ID'lerini bul
      const otherUserIds = Array.from(
        new Set(
          messagesData.map((m) =>
            m.sender_id === currentUser.id ? m.receiver_id : m.sender_id
          )
        )
      );

      // Bu kullanıcıların profil detaylarını çek
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', otherUserIds);

      if (!profilesData) {
        setChats([]);
        setLoadingChats(false);
        return;
      }

      const activeChats: ChatListItem[] = profilesData
        .map((profile) => {
          const userMessages = messagesData.filter(
            (m) => m.sender_id === profile.id || m.receiver_id === profile.id
          );
          const unreadCount = userMessages.filter(
            (m) => m.sender_id === profile.id && m.receiver_id === currentUser.id && !m.is_read
          ).length;
          return {
            otherUser: profile,
            lastMessage: userMessages[0] || null,
            unreadCount,
          };
        })
        .sort((a, b) => {
          const t1 = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
          const t2 = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
          return t2 - t1;
        });

      setChats(activeChats);
    } catch (err) {
      console.error('Sohbet listesi yüklenirken hata oluştu:', err);
    } finally {
      setLoadingChats(false);
    }
  }, [currentUser.id, supabase]);

  // Sayfa yüklendiğinde sohbetleri ve bağlantıları (takipçi/takip edilen) getir
  useEffect(() => {
    loadChats();

    const fetchConnections = async () => {
      try {
        const [followingRes, followersRes] = await Promise.all([
          supabase.from('follows').select('following_id').eq('follower_id', currentUser.id),
          supabase.from('follows').select('follower_id').eq('following_id', currentUser.id),
        ]);

        const followingIds = (followingRes.data ?? []).map((f) => f.following_id);
        const followerIds = (followersRes.data ?? []).map((f) => f.follower_id);
        const uniqueIds = Array.from(new Set([...followingIds, ...followerIds]));

        if (uniqueIds.length === 0) return;

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', uniqueIds);

        if (profiles) {
          setConnections(profiles);
        }
      } catch (err) {
        console.error('Takipçiler çekilirken hata oluştu:', err);
      }
    };

    fetchConnections();
  }, [currentUser.id, loadChats, supabase]);

  // URL'deki ?user= parametresini dinle
  useEffect(() => {
    if (targetUserId && !loadingChats) {
      const existing = chats.find((c) => c.otherUser.id === targetUserId);
      if (existing) {
        setSelectedUserId(targetUserId);
      } else {
        const fetchTargetUser = async () => {
          const { data } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', targetUserId)
            .maybeSingle();

          if (data) {
            const newTemp: ChatListItem = {
              otherUser: data,
              lastMessage: null,
              unreadCount: 0,
            };
            setChats((prev) => [newTemp, ...prev.filter((c) => c.otherUser.id !== targetUserId)]);
            setSelectedUserId(targetUserId);
          }
        };
        fetchTargetUser();
      }
    }
  }, [targetUserId, loadingChats, chats, supabase]);

  // Seçili sohbetin okunmamış mesajlarını okundu olarak işaretle
  const markChatAsRead = useCallback(async (otherId: string) => {
    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', otherId)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);
      
      // Sol listedeki unread sayılarını güncellemek için sohbet listesini sessizce yenileyelim
      const { data: messagesData } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })
        .limit(300);
      
      if (messagesData) {
        setChats(prev => prev.map(chat => {
          if (chat.otherUser.id === otherId) {
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        }));
      }
    } catch (err) {
      console.error('Okundu işaretlenirken hata:', err);
    }
  }, [currentUser.id, supabase]);

  // Seçili sohbetin mesajlarını yükle
  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`sender_id.eq.${selectedUserId},receiver_id.eq.${selectedUserId}`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data ?? []);
        
        // Mesajları okundu olarak işaretle
        markChatAsRead(selectedUserId);
      } catch (err) {
        console.error('Mesajlar yüklenirken hata:', err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedUserId, markChatAsRead, supabase]);

  // Mesajlar geldikçe veya yeni mesaj eklendikçe en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gerçek zamanlı mesaj dinleme
  useEffect(() => {
    const channel = supabase
      .channel('direct_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;

          // Mesajın benimle ilgisi var mı?
          if (newMsg.sender_id === currentUser.id || newMsg.receiver_id === currentUser.id) {
            // Eğer açık olan sohbetten geldiyse ekrana ekle
            const activeChatId = activeChatIdRef.current;
            if (
              (newMsg.sender_id === activeChatId && newMsg.receiver_id === currentUser.id) ||
              (newMsg.sender_id === currentUser.id && newMsg.receiver_id === activeChatId)
            ) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              if (newMsg.sender_id === activeChatId) {
                markChatAsRead(activeChatId);
              }
            } else {
              // Sohbet listesindeki son mesajı güncelle ve listenin tepesine taşı
              loadChats();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, loadChats, supabase]);

  // Mesaj Gönder
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedUserId) return;

    const messageText = inputMessage.trim();
    setInputMessage('');

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: selectedUserId,
          content: messageText,
        })
        .select()
        .single();

      if (error) throw error;

      // Kendi gönderdiğimiz mesajı anında yerel state'e de ekleyelim (Realtime bazen 1-2sn gecikirse diye)
      // Ancak realtime aboneliği de bu mesajı yakalayacak, çifte eklemeyi önlemek için ID kontrolü yapacağız.
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });

      // Sohbet listesini güncelle
      setChats((prev) => {
        const updated = prev.map((chat) => {
          if (chat.otherUser.id === selectedUserId) {
            return { ...chat, lastMessage: data };
          }
          return chat;
        });

        // En son mesaj atılanı tepeye çek
        const chatIdx = updated.findIndex((c) => c.otherUser.id === selectedUserId);
        if (chatIdx > -1) {
          const [item] = updated.splice(chatIdx, 1);
          return [item, ...updated];
        }
        return updated;
      });
    } catch (err) {
      console.error('Mesaj gönderilirken hata oluştu:', err);
    }
  };

  // Yeni sohbet başlatma fonksiyonu
  const startNewChat = (user: Profile) => {
    const existing = chats.find((c) => c.otherUser.id === user.id);
    if (!existing) {
      const newTemp: ChatListItem = {
        otherUser: user,
        lastMessage: null,
        unreadCount: 0,
      };
      setChats((prev) => [newTemp, ...prev]);
    }
    setSelectedUserId(user.id);
    setShowNewChatModal(false);
  };

  // Seçili kullanıcı detayı
  const activeChat = chats.find((c) => c.otherUser.id === selectedUserId);

  // Arama filtrelemeleri
  const filteredChats = chats.filter((chat) => {
    const name = (chat.otherUser.full_name || '').toLowerCase();
    const username = chat.otherUser.username.toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || username.includes(query);
  });

  const filteredConnections = connections.filter((conn) => {
    const name = (conn.full_name || '').toLowerCase();
    const username = conn.username.toLowerCase();
    const query = modalSearchQuery.toLowerCase();
    return name.includes(query) || username.includes(query);
  });

  return (
    <div className="font-body-md text-body-md antialiased h-[100dvh] bg-[#070707] text-white overflow-hidden flex">
      {/* Global CSS Animasyonları */}
      <style>{`
        @keyframes chatFadeInUp {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes chatFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes chatScaleIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <Sidebar />

      {/* Ana Sohbet Konteyneri */}
      <main className="md:ml-[240px] flex-1 flex h-full w-full md:w-[calc(100%-240px)] relative bg-[#090909] overflow-hidden">
        
        {/* Sinematik Arka Plan Işık Huzmeleri */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.15]">
          <div className="absolute -top-[10%] -right-[10%] w-[400px] h-[400px] bg-[#E50914] rounded-full filter blur-[150px] animate-pulse duration-[8000ms]" />
          <div className="absolute -bottom-[10%] -left-[10%] w-[350px] h-[350px] bg-[#D4A017] rounded-full filter blur-[120px] opacity-70 animate-pulse duration-[10000ms]" />
        </div>

        {/* İçerik Katmanı */}
        <div className="flex-1 flex h-full w-full relative z-10">
          
          {/* SOL PANEL: Sohbet Listesi */}
          <div
            className={`${
              selectedUserId ? 'hidden md:flex' : 'flex'
            } w-full md:w-[350px] border-r border-white/[0.04] flex-col h-full bg-[#0A0A0A]/40 backdrop-blur-2xl shrink-0`}
          >
            {/* Header */}
            <div className="px-5 py-5 border-b border-white/[0.05] flex items-center justify-between bg-black/10">
              <div>
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">Gelen Kutusu</h1>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mt-0.5">
                  {chats.length} sohbet • {chats.reduce((acc, curr) => acc + curr.unreadCount, 0)} okunmamış
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E50914] to-[#B80710] hover:from-[#f40f1c] hover:to-[#cd0812] active:scale-95 text-white flex items-center justify-center transition-all shadow-[0_4px_15px_rgba(229,9,20,0.3)] hover:shadow-[0_4px_20px_rgba(229,9,20,0.5)] border border-red-500/10 group"
                title="Yeni Sohbet Başlat"
              >
                <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform duration-300">add</span>
              </button>
            </div>

            {/* Arama Çubuğu */}
            <div className="px-4 py-3">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 text-sm group-focus-within:text-[#D4A017] transition-colors duration-300">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Sohbetlerde ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-[#D4A017]/40 focus:ring-2 focus:ring-[#D4A017]/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Sohbet Listesi */}
            <div className="flex-1 overflow-y-auto px-2 pb-24 md:pb-5 space-y-1">
              {loadingChats ? (
                <div className="flex flex-col gap-2 p-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-3 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-white/5" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/5 rounded w-1/3" />
                        <div className="h-3 bg-white/5 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-10 px-4 text-white/30">
                  <span className="material-symbols-outlined text-4xl mb-2">forum</span>
                  <p className="text-sm">Henüz sohbet bulunamadı.</p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-3 text-xs text-[#E50914] font-semibold hover:underline"
                  >
                    Yeni sohbet başlat
                  </button>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const isActive = selectedUserId === chat.otherUser.id;
                  const displayName = chat.otherUser.full_name || chat.otherUser.username;
                  const lastMsg = chat.lastMessage;
                  const isUnread = chat.unreadCount > 0;

                  return (
                    <button
                      key={chat.otherUser.id}
                      onClick={() => setSelectedUserId(chat.otherUser.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-white/[0.07] to-white/[0.01] border-l-2 border-[#D4A017] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                          : 'hover:bg-white/[0.03] border-l-2 border-transparent hover:translate-x-0.5'
                      }`}
                    >
                      {/* Profil Resmi */}
                      <div className={`w-11 h-11 rounded-full border ${isActive ? 'border-[#D4A017]/30' : 'border-white/10'} overflow-hidden bg-[#1A1A1A] shrink-0 flex items-center justify-center relative`}>
                        {chat.otherUser.avatar_url ? (
                          <img
                            src={chat.otherUser.avatar_url}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-white/30 text-lg">
                            person
                          </span>
                        )}
                        {isUnread && (
                          <span className="absolute -top-0.5 -right-0.5 bg-[#E50914] w-3 h-3 rounded-full border border-[#0E0E0E]" />
                        )}
                      </div>

                      {/* Bilgiler & Unread Badge */}
                      <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-baseline gap-1 mb-0.5">
                            <span className={`text-sm font-semibold truncate ${isActive ? 'text-white' : isUnread ? 'text-[#D4A017]' : 'text-white/80'}`}>
                              {displayName}
                            </span>
                            {lastMsg && (
                              <span className={`text-[10px] shrink-0 ${isUnread ? 'text-[#D4A017] font-semibold' : 'text-white/30'}`}>
                                {new Date(lastMsg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs truncate leading-normal ${isUnread ? 'text-white/90 font-medium' : 'text-white/45'}`}>
                            {lastMsg
                              ? lastMsg.sender_id === currentUser.id
                                ? `Siz: ${lastMsg.content}`
                                : lastMsg.content
                              : 'Sohbeti başlatın...'}
                          </p>
                        </div>

                        {isUnread && (
                          <div className="shrink-0 bg-gradient-to-r from-[#E50914] to-[#B80710] text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-[0_0_10px_rgba(229,9,20,0.4)] animate-pulse">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* SAĞ PANEL: Sohbet Penceresi */}
          <div
            className={`${
              !selectedUserId ? 'hidden md:flex' : 'flex'
            } flex-1 flex-col h-full bg-black/10 backdrop-blur-3xl`}
          >
            {activeChat ? (
              <>
                {/* Üst Bar */}
                <div className="h-16 border-b border-white/[0.05] flex items-center justify-between px-5 shrink-0 bg-[#0A0A0A]/40 backdrop-blur-md">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Mobilde Geri Butonu */}
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className="md:hidden w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mr-1 text-white hover:bg-white/10 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">arrow_back</span>
                    </button>

                    {/* Profil Resmi */}
                    <Link
                      href={`/u/${activeChat.otherUser.username}`}
                      className="w-10 h-10 rounded-full border border-white/[0.08] hover:border-[#D4A017]/40 overflow-hidden bg-[#151515] shrink-0 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      {activeChat.otherUser.avatar_url ? (
                        <img
                          src={activeChat.otherUser.avatar_url}
                          alt={activeChat.otherUser.full_name || activeChat.otherUser.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-white/30 text-base">
                          person
                        </span>
                      )}
                    </Link>

                    {/* İsim ve Kullanıcı Adı */}
                    <div className="min-w-0">
                      <Link
                        href={`/u/${activeChat.otherUser.username}`}
                        className="font-semibold text-white hover:text-[#D4A017] transition-colors text-sm block truncate"
                      >
                        {activeChat.otherUser.full_name || activeChat.otherUser.username}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500/85 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                        <span className="text-[10px] text-white/40 block">
                          @{activeChat.otherUser.username} • Aktif
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profil Bağlantısı Butonu */}
                  <Link
                    href={`/u/${activeChat.otherUser.username}`}
                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/10 hover:border-[#D4A017]/30 hover:text-[#D4A017] text-xs font-semibold text-white/80 transition-all duration-300 flex items-center gap-1"
                  >
                    <span>Profili Gör</span>
                    <span className="material-symbols-outlined text-[10px]">chevron_right</span>
                  </Link>
                </div>

                {/* Mesaj Alanı */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="w-6 h-6 border-2 border-white/10 border-t-[#E50914] rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/20">
                      <span className="material-symbols-outlined text-4xl mb-2">waving_hand</span>
                      <p className="text-sm">İlk mesajı göndererek sohbeti başlatın!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.sender_id === currentUser.id;
                      const prevMsg = index > 0 ? messages[index - 1] : null;
                      const showTime =
                        !prevMsg ||
                        new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() >
                          300000; // 5 dakikadan uzun ara varsa saat göster

                      return (
                        <div 
                          key={msg.id} 
                          className="flex flex-col"
                          style={{
                            animation: 'chatFadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                            opacity: 0,
                            transform: 'translateY(12px)'
                          }}
                        >
                          {showTime && (
                            <span className="text-[10px] text-white/15 self-center my-3">
                              {new Date(msg.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                          <div
                            className={`flex max-w-[70%] flex-col rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? 'bg-gradient-to-br from-[#E50914] to-[#A5070E] border border-red-500/10 text-white self-end rounded-tr-sm shadow-[0_4px_15px_rgba(229,9,20,0.25)]'
                                : 'bg-white/[0.04] border border-white/[0.03] text-white/90 self-start rounded-tl-sm shadow-[0_2px_10px_rgba(0,0,0,0.1)]'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {msg.content}
                            </p>
                            <span
                              className={`text-[9px] self-end mt-1 ${
                                isMe ? 'text-white/60' : 'text-white/35'
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Mesaj Yazma Girişi */}
                <div className="p-4 bg-[#0A0A0A]/40 backdrop-blur-md border-t border-white/[0.05]">
                  <form
                    onSubmit={handleSendMessage}
                    className="bg-white/[0.02] border border-white/[0.06] focus-within:border-[#D4A017]/40 focus-within:ring-2 focus-within:ring-[#D4A017]/5 rounded-2xl p-2 flex items-center gap-2 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.2)]"
                  >
                    {/* Dekoratif Medya İkonları */}
                    <div className="flex items-center gap-1 px-1">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-xl hover:bg-white/[0.04] text-white/30 hover:text-white/70 flex items-center justify-center transition-colors"
                        title="Medya Ekle"
                      >
                        <span className="material-symbols-outlined text-lg">image</span>
                      </button>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-xl hover:bg-white/[0.04] text-white/30 hover:text-white/70 flex items-center justify-center transition-colors"
                        title="Dizi/Film Öner"
                      >
                        <span className="material-symbols-outlined text-lg">movie</span>
                      </button>
                    </div>

                    {/* Giriş Alanı */}
                    <input
                      type="text"
                      placeholder="Bir mesaj yazın..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 bg-transparent border-0 px-2 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-0"
                    />

                    {/* Gönder Butonu */}
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E50914] to-[#B80710] hover:from-[#f40f1c] hover:to-[#cd0812] disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all shadow-[0_4px_12px_rgba(229,9,20,0.3)] hover:shadow-[0_4px_15px_rgba(229,9,20,0.5)] shrink-0 border border-red-500/10"
                    >
                      <span className="material-symbols-outlined text-base">send</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              // Boş Ekran
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
                <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
                  <img src="/logo.png" alt="Logo Watermark" className="w-[300px] h-auto object-contain select-none filter invert" />
                </div>
                <div className="relative z-10 max-w-sm flex flex-col items-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:scale-105 transition-transform duration-300">
                    <span className="material-symbols-outlined text-[#D4A017] text-4xl drop-shadow-[0_0_15px_rgba(212,160,23,0.3)]">
                      forum
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 tracking-tight">Sohbete Başlayın</h3>
                  <p className="text-sm text-white/40 leading-relaxed mb-6">
                    Arkadaşlarınızla en sevdiğiniz film ve diziler hakkında konuşmak için soldan bir sohbet seçin veya yeni bir mesajlaşma başlatın.
                  </p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="px-5 py-2.5 rounded-full bg-white/[0.03] hover:bg-white/10 hover:text-[#D4A017] border border-white/[0.05] hover:border-[#D4A017]/30 text-xs text-white/70 font-semibold transition-all duration-300 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Yeni Sohbet Başlat</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* YENİ SOHBET MODALİ */}
      {showNewChatModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ animation: 'chatFadeIn 0.2s ease-out forwards' }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setShowNewChatModal(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Gövdesi */}
          <div 
            className="relative bg-[#101010]/95 backdrop-blur-2xl border border-white/[0.08] w-full max-w-md rounded-2xl overflow-hidden flex flex-col max-h-[80vh] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"
            style={{ animation: 'chatScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-black/20">
              <h2 className="text-base font-bold text-white tracking-tight">Yeni Sohbet Başlat</h2>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Modal Arama */}
            <div className="px-4 py-3 bg-black/10 border-b border-white/[0.06]">
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm group-focus-within:text-[#D4A017] transition-colors">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Kullanıcı adı ara..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-[#D4A017]/40 focus:ring-2 focus:ring-[#D4A017]/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-white/20 focus:outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Modal Bağlantı Listesi */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-transparent">
              <p className="text-[9px] text-white/30 uppercase tracking-widest font-semibold px-2 mb-2">
                Takipçiler & Takip Edilenler
              </p>
              {filteredConnections.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-xs">
                  {connections.length === 0 ? (
                    <p>Sohbet başlatabileceğiniz bir takipçi bulunamadı.</p>
                  ) : (
                    <p>Arama kriterine uygun kullanıcı bulunamadı.</p>
                  )}
                </div>
              ) : (
                filteredConnections.map((user) => {
                  const displayName = user.full_name || user.username;
                  return (
                    <button
                      key={user.id}
                      onClick={() => startNewChat(user)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/[0.04] transition-all text-left group"
                    >
                      {/* Profil Resmi */}
                      <div className="w-10 h-10 rounded-full border border-white/10 group-hover:border-[#D4A017]/30 overflow-hidden bg-[#1A1A1A] shrink-0 flex items-center justify-center transition-colors duration-300">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-white/30 text-sm">
                            person
                          </span>
                        )}
                      </div>

                      {/* Bilgiler */}
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-white group-hover:text-[#D4A017] truncate text-xs block transition-colors duration-300">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-white/30 block -mt-0.5">
                          @{user.username}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobilde eğer sohbet açıksa alt menüyü gizle (input klavyenin üstünde düzgün kalsın) */}
      {!selectedUserId && <BottomNav />}
    </div>
  );
}
