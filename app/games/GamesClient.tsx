'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type GameMode = 'hub' | 'versus' | 'poster-quiz' | 'personality-test';

export default function GamesClient() {
  const [activeMode, setActiveMode] = useState<GameMode>('hub');

  // --- GAME 1: VS BATTLES STATE ---
  const [versusIndex, setVersusIndex] = useState(0);
  const [versusVoted, setVersusVoted] = useState<number | null>(null);

  const versusPairs = [
    {
      id: 1,
      title1: 'Breaking Bad',
      poster1: '/splash_bg.jpg',
      tmdbId1: 1396,
      votes1: 68,
      title2: 'Game of Thrones',
      poster2: '/splash_bg.jpg',
      tmdbId2: 1399,
      votes2: 32,
    },
    {
      id: 2,
      title1: 'Ezel',
      poster1: '/splash_bg.jpg',
      tmdbId1: 30584,
      votes1: 74,
      title2: 'Kurtlar Vadisi',
      poster2: '/splash_bg.jpg',
      tmdbId2: 44264,
      votes2: 26,
    },
    {
      id: 3,
      title1: 'Stranger Things',
      poster1: '/splash_bg.jpg',
      tmdbId1: 66732,
      votes1: 54,
      title2: 'The Last of Us',
      poster2: '/splash_bg.jpg',
      tmdbId2: 100088,
      votes2: 46,
    },
    {
      id: 4,
      title1: 'Gibi',
      poster1: '/splash_bg.jpg',
      tmdbId1: 116120,
      votes1: 82,
      title2: 'Prens',
      poster2: '/splash_bg.jpg',
      tmdbId2: 228080,
      votes2: 18,
    },
  ];

  // --- GAME 2: BLURRED POSTER QUIZ STATE ---
  const [quizScore, setQuizScore] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const quizQuestions = [
    {
      id: 1,
      correctTitle: 'Peaky Blinders',
      options: ['Peaky Blinders', 'Boardwalk Empire', 'Sherlock', 'The Crown'],
      showId: 60574,
      image: 'https://image.tmdb.org/t/p/w500/v9L1aD3s3nZpXo2T5P2sYyB8w.jpg',
    },
    {
      id: 2,
      correctTitle: 'Dark',
      options: ['1899', 'Dark', 'Stranger Things', 'Black Mirror'],
      showId: 70523,
      image: 'https://image.tmdb.org/t/p/w500/5E3BTo81g0wIjT2s9M20uB7Zz5F.jpg',
    },
    {
      id: 3,
      correctTitle: 'Succession',
      options: ['Billions', 'The Morning Show', 'Succession', 'Mad Men'],
      showId: 76331,
      image: 'https://image.tmdb.org/t/p/w500/77zG0T7m1N7qM8oW8eK8Fz9L0Z.jpg',
    },
  ];

  // --- GAME 3: PERSONALITY TEST STATE ---
  const [testStep, setTestStep] = useState(0);
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [testResult, setTestResult] = useState<{ name: string; quote: string; image: string } | null>(null);

  const personalityQuestions = [
    {
      question: 'Zor ve krizli bir durumla karşılaştığında ilk tepkin ne olur?',
      options: [
        { label: 'Sakin kalır, 5 hamle sonrasını planlarım', score: 'shelby' },
        { label: 'Sorunu zekam ve bilmimle çözerim', score: 'walter' },
        { label: 'Espritüel yaklaşıp ortamı yumuşatırım', score: 'gibi' },
        { label: 'Cesurca öne atılır, savaşırim', score: 'got' },
      ],
    },
    {
      question: 'İdeal bir akşamında ne yapmayı tercih edersin?',
      options: [
        { label: 'Loş bir mekanda viski yudumlarken strateji kurmak', score: 'shelby' },
        { label: 'Sessizce harika bir dizi maratonu yapmak', score: 'walter' },
        { label: 'Arkadaşlarımla geyik yapıp eğlenmek', score: 'gibi' },
        { label: 'Macera dolu aksiyon sahneleri izlemek', score: 'got' },
      ],
    },
  ];

  function handlePersonalityAnswer(scoreType: string) {
    const next = testStep + 1;
    if (next < personalityQuestions.length) {
      setTestStep(next);
    } else {
      // Calculate result
      if (scoreType === 'shelby') {
        setTestResult({
          name: 'Thomas Shelby (Peaky Blinders)',
          quote: '"Kafamda binlerce plan var. Her zaman soğukkanlı ve lider ruhlusun."',
          image: '/splash_bg.jpg',
        });
      } else if (scoreType === 'walter') {
        setTestResult({
          name: 'Walter White (Breaking Bad)',
          quote: '"Zekan ve detaycılığınla her durumu kendi lehine çeviriyorsun."',
          image: '/splash_bg.jpg',
        });
      } else {
        setTestResult({
          name: 'Yılmaz (Gibi)',
          quote: '"Hayatı çok ciddiye almayan ama en derin tespitleri yapan birisin."',
          image: '/splash_bg.jpg',
        });
      }
    }
  }

  // GAME MODES HANDLERS
  const gamesList = [
    {
      id: 'versus',
      title: 'Dizi Düellosu',
      category: 'VS Battles',
      badge: '🔥 Popüler',
      badgeColor: 'bg-[#C91520]/20 text-[#C91520] border-[#C91520]/40',
      description: 'İki efsane dizi karşı karşıya! Hangi dizi daha iyi? Seçimini yap, topluluğun canlı oy dağılımını gör.',
      cover: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=600&auto=format&fit=crop',
      actionText: 'Düelloya Başla ⚔️',
      onPlay: () => {
        setVersusIndex(0);
        setVersusVoted(null);
        setActiveMode('versus');
      },
    },
    {
      id: 'poster-quiz',
      title: 'Afiş Tahmin Etme',
      category: 'Bilgi Oyunu',
      badge: '🎯 Bilgi Testi',
      badgeColor: 'bg-[#D4A017]/20 text-[#D4A017] border-[#D4A017]/40',
      description: 'Buzlanmış dizi afişinden hangi dizi olduğunu bulabilir misin? 5 soruda dizi gurmeliğini kanıtla.',
      cover: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop',
      actionText: 'Tahmine Başla 🧩',
      onPlay: () => {
        setQuizIndex(0);
        setQuizScore(0);
        setSelectedAnswer(null);
        setActiveMode('poster-quiz');
      },
    },
    {
      id: 'personality-test',
      title: 'Hangi Dizi Karakterisin?',
      category: 'Kişilik Testi',
      badge: '🎭 Eğlenceli',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      description: 'Kişilik sorularını yanıtla, Peaky Blinders’tan Breaking Bad’e hangi dizi karakteri olduğunu keşfet.',
      cover: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600&auto=format&fit=crop',
      actionText: 'Karakterini Bul 🎭',
      onPlay: () => {
        setTestStep(0);
        setTestResult(null);
        setActiveMode('personality-test');
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-[#F4F6FA] select-none pb-24">
      
      {/* Mobile Header (Sadece Mobilde "Oyunlar" Yazar) */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0E]/95 backdrop-blur-2xl px-4 py-3.5 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-2">
          {activeMode !== 'hub' ? (
            <button
              type="button"
              onClick={() => setActiveMode('hub')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
            </button>
          ) : (
            <Link href="/home" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80">
              <span className="material-symbols-outlined text-base">arrow_back</span>
            </Link>
          )}
          <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#C91520] text-lg">sports_esports</span>
            <span>Oyunlar</span>
          </h1>
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4A017] bg-[#D4A017]/10 border border-[#D4A017]/20 px-2.5 py-0.5 rounded-full">
          Episodio Arcade
        </span>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 md:px-10 pt-6 md:pt-10 space-y-8">

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C91520]/15 text-[#C91520] border border-[#C91520]/30 shadow-[0_0_25px_rgba(201,21,32,0.3)]">
                <span className="material-symbols-outlined text-2xl">sports_esports</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">Dizi Oyunları & Arcade</h1>
            </div>
            <p className="mt-1 text-sm text-white/45">
              Dizi dünyasında bilginizi sınayın, düellolarda oy kullanın ve eğlenceli kişilik testlerini çözün.
            </p>
          </div>

          {activeMode !== 'hub' && (
            <button
              type="button"
              onClick={() => setActiveMode('hub')}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/20 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Tüm Oyunlara Dön</span>
            </button>
          )}
        </div>

        {/* --- HUB MODE: OYUN KARTLARI LİSTESİ --- */}
        {activeMode === 'hub' && (
          <div className="space-y-6">
            
            {/* Mobil Açıklama Metni */}
            <div className="md:hidden">
              <p className="text-xs text-white/50">
                Dizi dünyasında bilginizi sınayın, düellolarda oy kullanın veya karakterinizi keşfedin.
              </p>
            </div>

            {/* Oyun Kartları Grid Layout (Mobilde 1 Satır 1 Oyun Kartı Afiş Tarzı / Desktopta 3 Kolon) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gamesList.map((game) => (
                <div
                  key={game.id}
                  onClick={game.onPlay}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E14] transition-all duration-300 hover:border-[#C91520]/50 hover:bg-[#12121A] shadow-2xl cursor-pointer flex flex-col justify-between h-[360px] sm:h-[380px]"
                >
                  {/* Afiş Arka Plan Görseli */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={game.cover}
                      alt={game.title}
                      className="h-full w-full object-cover opacity-35 group-hover:opacity-50 transition-all duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E14] via-[#0E0E14]/75 to-transparent" />
                  </div>

                  {/* Üst Rozet */}
                  <div className="relative z-10 p-5 flex items-center justify-between">
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider backdrop-blur-md ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/70 backdrop-blur-md group-hover:bg-[#C91520] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">play_arrow</span>
                    </span>
                  </div>

                  {/* Alt İçerik & Açıklama */}
                  <div className="relative z-10 p-5 sm:p-6 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/40 block">
                      {game.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight group-hover:text-[#C91520] transition-colors">
                      {game.title}
                    </h2>
                    <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
                      {game.description}
                    </p>

                    <button
                      type="button"
                      className="mt-2 w-full py-2.5 rounded-2xl bg-white/10 group-hover:bg-[#C91520] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 backdrop-blur-md border border-white/10 group-hover:border-transparent"
                    >
                      <span>{game.actionText}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* --- GAME MODE 1: DİZİ DÜELLOSU (VERSUS BATTLES) --- */}
        {activeMode === 'versus' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C91520]">Dizi Düellosu #{versusIndex + 1}</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Hangi Dizi Daha İyi?</h2>
              <p className="text-xs text-white/50">Favori dizine tıkla ve topluluğun canlı oy oranını gör.</p>
            </div>

            {/* İki Dizi Karşılaştırma Kartı */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Dizi 1 */}
              <div
                onClick={() => setVersusVoted(1)}
                className={`relative overflow-hidden rounded-3xl border p-6 text-center cursor-pointer transition-all duration-300 ${
                  versusVoted === 1
                    ? 'border-[#C91520] bg-[#C91520]/20 shadow-[0_0_40px_rgba(201,21,32,0.3)] scale-[1.02]'
                    : 'border-white/10 bg-[#0E0E14] hover:border-white/20'
                }`}
              >
                <div className="h-44 w-full rounded-2xl bg-white/5 mb-4 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <span className="absolute bottom-3 left-3 z-20 text-lg font-black text-white">
                    {versusPairs[versusIndex].title1}
                  </span>
                </div>

                {versusVoted !== null ? (
                  <div className="space-y-1 animate-pulse">
                    <p className="text-3xl font-black text-[#C91520]">{versusPairs[versusIndex].votes1}%</p>
                    <p className="text-xs text-white/50">Topluluk Oyu</p>
                  </div>
                ) : (
                  <button type="button" className="w-full py-2.5 rounded-xl bg-white/10 font-bold text-xs text-white hover:bg-[#C91520] transition-colors">
                    Bu Diziyi Seç 🥊
                  </button>
                )}
              </div>

              {/* Dizi 2 */}
              <div
                onClick={() => setVersusVoted(2)}
                className={`relative overflow-hidden rounded-3xl border p-6 text-center cursor-pointer transition-all duration-300 ${
                  versusVoted === 2
                    ? 'border-[#C91520] bg-[#C91520]/20 shadow-[0_0_40px_rgba(201,21,32,0.3)] scale-[1.02]'
                    : 'border-white/10 bg-[#0E0E14] hover:border-white/20'
                }`}
              >
                <div className="h-44 w-full rounded-2xl bg-white/5 mb-4 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <span className="absolute bottom-3 left-3 z-20 text-lg font-black text-white">
                    {versusPairs[versusIndex].title2}
                  </span>
                </div>

                {versusVoted !== null ? (
                  <div className="space-y-1 animate-pulse">
                    <p className="text-3xl font-black text-white">{versusPairs[versusIndex].votes2}%</p>
                    <p className="text-xs text-white/50">Topluluk Oyu</p>
                  </div>
                ) : (
                  <button type="button" className="w-full py-2.5 rounded-xl bg-white/10 font-bold text-xs text-white hover:bg-[#C91520] transition-colors">
                    Bu Diziyi Seç 🥊
                  </button>
                )}
              </div>

            </div>

            {versusVoted !== null && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setVersusVoted(null);
                    setVersusIndex((prev) => (prev + 1) % versusPairs.length);
                  }}
                  className="px-8 py-3 rounded-full bg-[#C91520] hover:bg-[#E50914] text-white font-bold text-xs transition-all shadow-[0_4px_25px_rgba(201,21,32,0.4)] active:scale-95 flex items-center gap-2"
                >
                  <span>Sonraki Düelloya Geç</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- GAME MODE 2: AFİŞ TAHMİN ETME (POSTER QUIZ) --- */}
        {activeMode === 'poster-quiz' && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D4A017]">Soru {quizIndex + 1} / {quizQuestions.length}</span>
              <span className="text-xs font-bold text-emerald-400">Skor: {quizScore} Puan</span>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0E0E14] p-6 text-center space-y-6">
              
              {/* Buzlanmış Afiş */}
              <div className="relative h-64 w-44 mx-auto rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                <img
                  src={quizQuestions[quizIndex].image}
                  alt=""
                  className={`h-full w-full object-cover transition-all duration-700 ${
                    selectedAnswer ? 'blur-0' : 'blur-xl scale-110'
                  }`}
                />
              </div>

              {/* Şıklar */}
              <div className="grid grid-cols-1 gap-2.5">
                {quizQuestions[quizIndex].options.map((opt) => {
                  const isCorrect = opt === quizQuestions[quizIndex].correctTitle;
                  const isSelected = selectedAnswer === opt;

                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={selectedAnswer !== null}
                      onClick={() => {
                        setSelectedAnswer(opt);
                        if (isCorrect) setQuizScore((prev) => prev + 20);
                      }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                        selectedAnswer
                          ? isCorrect
                            ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                            : isSelected
                            ? 'bg-red-500/20 border border-red-500 text-red-400'
                            : 'bg-white/5 text-white/40 border border-white/5'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/15'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {selectedAnswer && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAnswer(null);
                    setQuizIndex((prev) => (prev + 1) % quizQuestions.length);
                  }}
                  className="w-full py-3 rounded-full bg-[#C91520] hover:bg-[#E50914] text-white font-bold text-xs transition-all shadow-[0_4px_20px_rgba(201,21,32,0.4)] active:scale-95"
                >
                  Sonraki Soruya Geç
                </button>
              )}

            </div>
          </div>
        )}

        {/* --- GAME MODE 3: KARAKTER TESTİ (PERSONALITY TEST) --- */}
        {activeMode === 'personality-test' && (
          <div className="max-w-xl mx-auto space-y-6">
            {!testResult ? (
              <div className="rounded-3xl border border-white/10 bg-[#0E0E14] p-6 space-y-6">
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-purple-400">Soru {testStep + 1} / {personalityQuestions.length}</span>
                  <h2 className="text-lg font-bold text-white leading-snug">
                    {personalityQuestions[testStep].question}
                  </h2>
                </div>

                <div className="space-y-3">
                  {personalityQuestions[testStep].options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePersonalityAnswer(opt.score)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/40 text-xs font-semibold text-white text-left transition-all active:scale-[0.99]"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-purple-500/30 bg-[#0E0E14] p-8 text-center space-y-6 shadow-[0_15px_50px_rgba(168,85,247,0.2)]">
                <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Test Sonucun</span>
                <h2 className="text-2xl font-black text-white">{testResult.name}</h2>
                <p className="text-xs text-white/70 italic max-w-md mx-auto">{testResult.quote}</p>

                <button
                  type="button"
                  onClick={() => {
                    setTestStep(0);
                    setTestResult(null);
                  }}
                  className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-lg active:scale-95"
                >
                  Testi Tekrar Çöz
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
