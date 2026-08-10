'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

const popularEmojis = ['😀', '😂', '😍', '👍', '🔥', '❤️', '🎬', '🍿', '😮', '😢', '👏', '🎉'];
const CHAT_LIST_MESSAGE_LIMIT = 120;
const MESSAGE_PAGE_LIMIT = 80;

export default function ChatClient({ currentUser }: ChatClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('user');

  // State'ler
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connections, setConnections] = useState<Profile[]>([]);
  const [connectionsLoaded, setConnectionsLoaded] = useState(false);
  
  // Arayüz State'leri
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Beğeni & Silme State'leri
  const [likedMessages, setLikedMessages] = useState<Record<string, boolean>>({});
  const [heartAnimMsgId, setHeartAnimMsgId] = useState<string | null>(null);
  const [deleteTargetMsg, setDeleteTargetMsg] = useState<Message | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('episodio_liked_messages');
      if (cached) setLikedMessages(JSON.parse(cached));
    } catch {}
  }, []);

  const toggleLikeMessage = (msgId: string) => {
    setLikedMessages((prev) => {
      const updated = { ...prev, [msgId]: !prev[msgId] };
      try {
        localStorage.setItem('episodio_liked_messages', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDoubleTapLike = (msgId: string) => {
    toggleLikeMessage(msgId);
    setHeartAnimMsgId(msgId);
    setTimeout(() => {
      setHeartAnimMsgId((curr) => (curr === msgId ? null : curr));
    }, 700);
  };

  const handleMessageClick = (msgId: string) => {
    const now = Date.now();
    if (lastTapRef.current && lastTapRef.current.id === msgId && now - lastTapRef.current.time < 320) {
      handleDoubleTapLike(msgId);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { id: msgId, time: now };
    }
  };

  const handleTouchStart = (msg: Message, isMe: boolean) => {
    if (!isMe) return;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setDeleteTargetMsg(msg);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message, isMe: boolean) => {
    if (!isMe) return;
    e.preventDefault();
    setDeleteTargetMsg(msg);
  };

  const handleDeleteMessage = async () => {
    if (!deleteTargetMsg) return;
    const targetId = deleteTargetMsg.id;
    setDeleteTargetMsg(null);

    setMessages((prev) => prev.filter((m) => m.id !== targetId));

    try {
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', targetId)
        .eq('sender_id', currentUser.id);

      if (error) {
        console.error('Mesaj silme hatası:', error);
      }
    } catch (err) {
      console.error('Mesaj silinirken hata:', err);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChatIdRef = useRef<string | null>(null);

  // Aktif sohbet ID'sini ref'te saklayalım (realtime callback'leri için)
  useEffect(() => {
    activeChatIdRef.current = selectedUserId;
    if (selectedUserId) {
      document.body.classList.add('in-active-chat');
    } else {
      document.body.classList.remove('in-active-chat');
    }
    return () => {
      document.body.classList.remove('in-active-chat');
    };
  }, [selectedUserId]);

  // Sohbet geçmişini (son mesajları) yükle
  const loadChats = useCallback(async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, content, created_at, is_read')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })
        .limit(CHAT_LIST_MESSAGE_LIMIT);

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

      const messagesByUser = new Map<string, Message[]>();
      messagesData.forEach((message) => {
        const otherId = message.sender_id === currentUser.id ? message.receiver_id : message.sender_id;
        const existing = messagesByUser.get(otherId) ?? [];
        existing.push(message);
        messagesByUser.set(otherId, existing);
      });

      const activeChats: ChatListItem[] = profilesData
        .map((profile) => {
          const userMessages = messagesByUser.get(profile.id) ?? [];
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

  const loadConnections = useCallback(async () => {
    if (connectionsLoaded) return;
    try {
      const [followingRes, followersRes] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', currentUser.id),
        supabase.from('follows').select('follower_id').eq('following_id', currentUser.id),
      ]);

      const followingIds = (followingRes.data ?? []).map((f) => f.following_id);
      const followerIds = (followersRes.data ?? []).map((f) => f.follower_id);
      const uniqueIds = Array.from(new Set([...followingIds, ...followerIds]));

      if (uniqueIds.length === 0) {
        setConnectionsLoaded(true);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', uniqueIds);

      if (profiles) {
        setConnections(profiles);
      }
      setConnectionsLoaded(true);
    } catch (err) {
      console.error('Takipçiler çekilirken hata oluştu:', err);
    }
  }, [connectionsLoaded, currentUser.id, supabase]);

  // Sayfa yüklendiğinde sadece sohbet özetlerini getir
  useEffect(() => {
    loadChats();
  }, [loadChats]);

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
    setChats(prev => prev.map(chat => (
      chat.otherUser.id === otherId ? { ...chat, unreadCount: 0 } : chat
    )));
    setMessages(prev => prev.map(message => (
      message.sender_id === otherId && message.receiver_id === currentUser.id
        ? { ...message, is_read: true }
        : message
    )));

    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', otherId)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);

      if (error) throw error;
      
      // Sol listedeki unread sayılarını güncellemek için sohbet listesini sessizce yenileyelim
      window.dispatchEvent(new Event('episodio:messages-read'));
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
          .select('id, sender_id, receiver_id, content, created_at, is_read')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},receiver_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: false })
          .limit(MESSAGE_PAGE_LIMIT);

        if (error) throw error;
        setMessages((data ?? []).reverse());
        
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          if (updatedMsg.sender_id !== currentUser.id && updatedMsg.receiver_id !== currentUser.id) return;

          setMessages((prev) => prev.map((message) => (
            message.id === updatedMsg.id ? { ...message, ...updatedMsg } : message
          )));
          loadChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, loadChats, markChatAsRead, supabase]);

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
      <main className="md:ml-[200px] flex-1 flex h-[100dvh] min-h-[100dvh] fixed inset-0 md:relative md:inset-auto md:h-full md:min-h-0 w-full md:w-[calc(100%-200px)] bg-[#090909] overflow-hidden">
        
        {/* Sinematik Arka Plan Işık Huzmeleri */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_26%)]" />

        {/* İçerik Katmanı */}
        <div className="flex-1 flex h-full w-full relative z-10 overflow-hidden">
          
          {/* SOL PANEL: Sohbet Listesi */}
          <div
            className={`${
              selectedUserId ? 'hidden md:flex' : 'flex'
            } w-full md:w-[350px] border-r border-white/[0.04] flex-col h-full bg-[#0A0A0A]/40 backdrop-blur-2xl shrink-0 overflow-hidden`}
          >
            {/* Header */}
            <div className="px-5 py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] md:py-5 border-b border-white/[0.05] grid grid-cols-[2.25rem_1fr_2.25rem] items-center bg-black/10 shrink-0">
              <div />
              <h1 className="text-center text-xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">Mesajlarım</h1>
              <button
                onClick={() => {
                  setShowNewChatModal(true);
                  void loadConnections();
                }}
                className="w-9 h-9 rounded-xl active:scale-95 text-[#C91520] hover:text-white flex items-center justify-center transition-colors group"
                title="Yeni Sohbet Başlat"
              >
                <span className="material-symbols-outlined text-2xl font-bold group-hover:rotate-90 transition-transform duration-300">add</span>
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
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-[#D4A017]/40 focus:ring-2 focus:ring-[#D4A017]/5 rounded-full py-2 pl-10 pr-4 text-[16px] md:text-xs text-white placeholder-white/20 focus:outline-none transition-all duration-300"
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
                    onClick={() => {
                      setShowNewChatModal(true);
                      void loadConnections();
                    }}
                    className="mt-3 text-xs text-[#C91520] font-semibold hover:underline"
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
                      onClick={() => {
                        setSelectedUserId(chat.otherUser.id);
                        if (chat.unreadCount > 0) void markChatAsRead(chat.otherUser.id);
                      }}
                      className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all text-left ${
                        isActive
                          ? 'bg-white/[0.06] border-l-2 border-[#C91520]'
                          : 'hover:bg-white/[0.03] border-l-2 border-transparent hover:translate-x-0.5'
                      }`}
                    >
                      {/* Instagram Boyutunda Profil Resmi (w-14 h-14 / 56px) */}
                      <div className={`w-14 h-14 rounded-full border ${isActive ? 'border-[#C91520]/50' : 'border-white/10'} overflow-hidden bg-[#1A1A1A] shrink-0 flex items-center justify-center relative`}>
                        {chat.otherUser.avatar_url ? (
                          <img
                            src={chat.otherUser.avatar_url}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-white/30 text-2xl">
                            person
                          </span>
                        )}
                        {isUnread && (
                          <span className="absolute top-0 right-0 bg-[#C91520] w-3 h-3 rounded-full border-2 border-[#0E0E0E]" />
                        )}
                      </div>

                      {/* Bilgiler & Unread Badge */}
                      <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-baseline gap-1 mb-0.5">
                            <span className={`text-[13.5px] font-semibold truncate ${isActive ? 'text-white font-bold' : isUnread ? 'text-white font-bold' : 'text-white/90'}`}>
                              {displayName}
                            </span>
                            {lastMsg && (
                              <span className={`text-[10.5px] shrink-0 ${isUnread ? 'text-[#C91520] font-bold' : 'text-white/35'}`}>
                                {new Date(lastMsg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className={`text-[12px] truncate leading-normal ${isUnread ? 'text-white font-semibold' : 'text-white/45'}`}>
                            {lastMsg
                              ? lastMsg.sender_id === currentUser.id
                                ? `Sen: ${lastMsg.content}`
                                : lastMsg.content
                              : 'Sohbeti başlatın...'}
                          </p>
                        </div>

                        {isUnread && (
                          <div className="shrink-0 bg-[#C91520] text-white text-[9.5px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
            } flex-1 flex-col h-full bg-black/10 backdrop-blur-3xl overflow-hidden`}
          >
            {activeChat ? (
              <>
                {/* Üst Bar */}
                <div className="h-16 pt-[env(safe-area-inset-top,0px)] border-b border-white/[0.05] flex items-center justify-between px-5 shrink-0 bg-[#0A0A0A]/40 backdrop-blur-md">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Mobilde Geri Butonu */}
                    <button
                      onClick={() => {
                        setSelectedUserId(null);
                        window.dispatchEvent(new Event('episodio:messages-read'));
                        void loadChats();
                      }}
                      className="md:hidden flex h-8 w-5 items-center justify-center text-white/75 hover:text-white active:scale-95 transition-all"
                      aria-label="Sohbet listesine dön"
                    >
                      <span className="text-3xl leading-none">‹</span>
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
                    <div className="min-w-0 ml-1.5">
                      <div className="flex min-w-0 items-center gap-1">
                        <Link
                          href={`/u/${activeChat.otherUser.username}`}
                          className="min-w-0 truncate text-[15px] font-bold leading-tight text-white transition-colors hover:text-[#D4A017] md:text-sm md:font-semibold"
                        >
                          {activeChat.otherUser.full_name || activeChat.otherUser.username}
                        </Link>
                        <Link
                          href={`/u/${activeChat.otherUser.username}`}
                          className="md:hidden shrink-0 text-white/35 transition-colors hover:text-white/70"
                          aria-label="Profili gör"
                        >
                          <span className="text-lg leading-none">›</span>
                        </Link>
                      </div>
                      <span className="block text-[11px] font-semibold leading-tight text-white/38 md:text-[10px] md:font-normal">
                        @{activeChat.otherUser.username}
                      </span>
                    </div>
                  </div>

                  {/* Desktop Profili Gör butonu kaldırıldı */}
                </div>

                {/* Mesaj Alanı - Hafif Kırmızı-Siyah Gradyan Arka Tema */}
                <div className="relative flex-1 overflow-y-auto p-5 space-y-4 bg-[radial-gradient(ellipse_at_top_right,rgba(201,21,32,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(201,21,32,0.08),transparent_50%),linear-gradient(180deg,#09090D_0%,#050508_100%)]">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="w-6 h-6 border-2 border-white/10 border-t-[#C91520] rounded-full animate-spin" />
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
                          className="flex flex-col my-1"
                          style={{
                            animation: 'chatFadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                          }}
                        >
                          {showTime && (
                            <span className="text-[10.5px] font-semibold text-white/30 self-center my-3 tracking-wider uppercase">
                              {new Date(msg.created_at).toLocaleDateString('tr-TR', {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              &bull;{' '}
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}

                          <div className={`flex items-end gap-2 ${isMe ? 'self-end justify-end max-w-[80%] sm:max-w-[72%]' : 'self-start justify-start max-w-[80%] sm:max-w-[72%]'}`}>
                            {/* Gelen mesajda mini profil resmi */}
                            {!isMe && (
                              <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 bg-[#1a1a1a] shrink-0 mb-0.5">
                                {activeChat.otherUser.avatar_url ? (
                                  <img src={activeChat.otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[12px] text-white/40">person</span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div
                              onClick={() => handleMessageClick(msg.id)}
                              onTouchStart={() => handleTouchStart(msg, isMe)}
                              onTouchEnd={handleTouchEnd}
                              onTouchMove={handleTouchEnd}
                              onContextMenu={(e) => handleContextMenu(e, msg, isMe)}
                              className={`relative flex flex-col px-4 py-2.5 cursor-pointer select-none transition-transform active:scale-[0.98] ${
                                isMe
                                  ? 'bg-[#C91520] text-white rounded-[22px] rounded-br-[4px] shadow-[0_6px_20px_rgba(201,21,32,0.22)]'
                                  : 'bg-[#262626] text-white rounded-[22px] rounded-bl-[4px] border border-white/[0.04]'
                              }`}
                            >
                              {/* Çift Tıklamada Yüzen Kalp Animasyonu */}
                              {heartAnimMsgId === msg.id && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-[chatScaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
                                  <span className="text-3xl drop-shadow-md select-none">❤️</span>
                                </div>
                              )}

                              <p className="text-[13.5px] font-normal leading-[1.4] whitespace-pre-wrap break-words text-white">
                                {msg.content}
                              </p>
                              <span
                                className={`text-[9.5px] self-end mt-1 font-medium ${
                                  isMe ? 'text-white/75' : 'text-white/40'
                                }`}
                              >
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>

                              {/* Beğeni Rozeti (Liked Badge) */}
                              {likedMessages[msg.id] && (
                                <div className="absolute -bottom-2 -right-1 bg-[#18181c] text-[11px] rounded-full px-1.5 py-0.5 border border-white/10 shadow-lg flex items-center justify-center animate-[chatScaleIn_0.2s_ease-out] select-none">
                                  ❤️
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Mesaj Yazma Girişi */}
                <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:p-4 bg-[#0A0A0A]/90 backdrop-blur-md border-t border-white/[0.05] shrink-0">
                  <form
                    onSubmit={handleSendMessage}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-full py-1.5 px-3 flex items-center gap-2 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.2)]"
                  >
                    {/* Emoji Picker Butonu ve Listesi */}
                    <div className="relative flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className={`w-7 h-7 rounded-full hover:bg-white/[0.04] flex items-center justify-center transition-colors ${showEmojiPicker ? 'text-[#D4A017]' : 'text-white/30 hover:text-white/70'}`}
                        title="Emoji Ekle"
                      >
                        <span className="material-symbols-outlined text-lg">sentiment_satisfied</span>
                      </button>

                      {showEmojiPicker && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                          <div className="absolute bottom-10 left-0 z-50 bg-[#141414] border border-white/[0.08] rounded-xl p-2 shadow-2xl grid grid-cols-6 gap-1.5 w-[210px] animate-[chatScaleIn_0.2s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
                            {popularEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setInputMessage((prev) => prev + emoji);
                                }}
                                className="w-7 h-7 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg transition-colors active:scale-90"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Giriş Alanı */}
                    <input
                      type="text"
                      placeholder="Bir mesaj yazın..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 bg-transparent border-0 px-2 py-1 text-[16px] md:text-xs text-white placeholder-white/20 focus:outline-none focus:ring-0"
                    />

                    {/* Gönder Butonu - Standalone Instagram Paperplane Icon */}
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className={`p-1.5 mr-3.5 sm:mr-4 shrink-0 transition-all duration-200 active:scale-90 ${
                        inputMessage.trim()
                          ? 'text-[#C91520] hover:text-[#E50914] cursor-pointer opacity-100'
                          : 'text-white/20 cursor-not-allowed opacity-30'
                      }`}
                      aria-label="Mesaj gönder"
                      title="Mesaj gönder"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-5 h-5"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              // Boş Ekran
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
                <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
                  <img src="/logo.png" alt="Logo Watermark" className="w-[280px] h-auto object-contain select-none" />
                </div>
                <div className="relative z-10 max-w-sm flex flex-col items-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.28)]">
                    <span className="material-symbols-outlined text-[#D4A017] text-4xl">
                      forum
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 tracking-tight">Sohbete Başlayın</h3>
                  <p className="text-sm text-white/40 leading-relaxed mb-6">
                    Arkadaşlarınızla en sevdiğiniz film ve diziler hakkında konuşmak için soldan bir sohbet seçin veya yeni bir mesajlaşma başlatın.
                  </p>
                  <button
                    onClick={() => {
                      setShowNewChatModal(true);
                      void loadConnections();
                    }}
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
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-[#D4A017]/40 focus:ring-2 focus:ring-[#D4A017]/5 rounded-xl py-2 pl-9 pr-4 text-[16px] md:text-xs text-white placeholder-white/20 focus:outline-none transition-all duration-300"
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

      {/* MESAJ SİLME MODALİ */}
      {deleteTargetMsg && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setDeleteTargetMsg(null)}
          />
          <div className="relative z-10 w-full max-w-xs bg-[#121216] border border-white/10 rounded-2xl p-4 flex flex-col items-center text-center shadow-2xl animate-[chatScaleIn_0.2s_ease-out]">
            <div className="w-10 h-10 rounded-full bg-[#C91520]/20 text-[#C91520] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-xl">delete</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Mesajı Sil</h3>
            <p className="text-xs text-white/50 mb-4">Bu mesajı sohbetten silmek istediğinize emin misiniz?</p>
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setDeleteTargetMsg(null)}
                className="flex-1 py-2 text-xs font-semibold text-white/60 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDeleteMessage}
                className="flex-1 py-2 text-xs font-semibold text-white rounded-xl bg-[#C91520] hover:bg-[#E50914] transition-colors shadow-md"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobilde eğer sohbet açıksa alt menüyü gizle (input klavyenin üstünde düzgün kalsın) */}
      {!selectedUserId && <BottomNav />}
    </div>
  );
}
