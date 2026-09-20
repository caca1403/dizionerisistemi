# SÉRA — yerel dizi keşif motoru

SÉRA, dev bir dizi arşivini tek tek katalog gezdirmeden kişisel bir izleme rotasına dönüştüren, tarayıcıda çalışan bir keşif uygulamasıdır. Arayüz; yapay zekâ panosu taklidi yerine, sinematik bir **yapım dosyası** ve editoryal keşif deneyimi için tasarlanmıştır.

Uygulama kullanıcı hesabı gerektirmez. İzleme listesi, izleme durumu ve ilk rota tercihleri yalnızca cihazdaki `localStorage` alanında kalır.

## Canlı arşiv ve mevcut veri yapısı

SÉRA, örnek kartlarla sınırlı değildir. İlk açılışta bir Web Worker aşağıdaki mevcut arşivleri sırayla okur; ana iş parçacığı boşta kalır ve sonuçlar kaynaklar geldikçe güncellenir.

| Kaynak | Kullanımı |
| --- | --- |
| `/api/tmdb` | Vercel sunucu işlevi üzerinden yalnızca istenen TMDB sonuç sayfası |

SÉRA, arşivin tamamını tarayıcıya indirmez. Kullanıcının sorgusu, ruh hali ve sıralama tercihi için yalnızca gerekli TMDB sonuç sayfasını sunucu proxy üzerinden alır; sonuçlar istemcide kısa süreli önbellekte tutulur. Poster, arka plan, tür ve özet yalnızca dönen kayıttan üretilir.

## Keşif mantığı

Öneri motoru açıklanabilir, istemci taraflı bir sıralama uygular:

1. Arama cümlesi başlık, özgün ad, özet, tür ve duygu etiketlerine ayrıştırılır.
2. Türkçe niyet sözcükleri (`gizemli`, `hızlı`, `distopya`, `hacker`, `rahat` vb.) ruh hali kümeleriyle eşleştirilir.
3. Tür, tempo, anlatı karmaşıklığı, platform, TMDB puanı ve oy yoğunluğu filtreleri uygulanır.
4. İlk kurulumdaki rota; seçilen mod, tempo, anlatı yoğunluğu ve platform ile puanı kişiselleştirir.
5. **Sana göre**, **Popüler**, **En yüksek puan** ve **Yeni eklenen** görünümleri aynı arşiv üzerinde farklı sıralama sinyalleri kullanır.

Metin araması Web Worker içindeki BM25, TF-IDF, tür kesişimi, Bayes puanı ve rota sinyalleriyle anında çalışır. Poster dosyasında ise ön-eğitimli **MobileNet V2** CNN yalnız kullanıcı analiz açtığında TensorFlow.js ile tarayıcıda yüklenir; sınıflandırma, özellik vektörü, renk paleti ve kontrast cihazda çıkarılır ve yerelde saklanır. Bu CNN sonucu görsel bağlam sağlar; öneri sırasını tek başına belirlemez.

## GitHub üzerinden güncellenen arşiv

Vercel projesine `TMDB_API_KEY` veya `TMDB_BEARER_TOKEN` ortam değişkeni tanımlanır. İstemci anahtarı hiç görmez: `/api/tmdb` yalnızca sonuç verisini döndürür. Yerel geliştirmede aynı yol Vite middleware ile çalışır; anahtar `.env.local` içinde tutulur ve depoya eklenmez.

## Deneyim

- İlk kullanımdaki üç soruluk rota kurulumu; sonrasında sonuçlar profil doğrultusunda gelir.
- Doğal dil araması ve hızlı duygu rotaları.
- Canlı kaynak sayacı ve kaynak bazlı hata toleransı.
- Yapım dosyasında spoiler’sız özet, neden uygun olduğu, izleme bağlantıları, izleme profili, kadro ve poster profili.
- İzleme listesi: planlıyorum, izliyorum, izledim.
- Modal erişilebilirliği: Radix Dialog ile focus trap ve `Esc` kapatma.
- Posterler `loading="lazy"` kullanır; görseli olmayan kaynaklarda kontrollü bir kapak yedeği gösterilir.
- Mobilde tek kolon akışı, geniş dokunma hedefleri ve azaltılmış hareket tercihi desteği.

## Mimari

```text
src/
├── components/
│   ├── navbar/        SÉRA ana gezinme
│   ├── hero/          editoryal giriş ve arama
│   ├── onboarding/    ilk rota kurulumu
│   ├── discovery/     arşiv durumu, filtreler, trendler ve kartlar
│   ├── dossier/       yapım dosyası önizlemesi
│   ├── modal/         erişilebilir ayrıntı penceresi
│   ├── postercnn/     görsel profil penceresi
│   └── watchlist/     yerel izleme listesi
├── hooks/             arşiv Worker bağlayıcısı ve yerel saklama
├── services/          TMDB canlı sorgu, eşleme ve yerel poster analizi
├── data/              arayüz için küçük imza seçkisi
├── lib/               yerel yedek öneri yardımcıları
└── types.ts           paylaşılan TypeScript sözleşmeleri
```

Eski statik uygulama `legacy/sera-legacy.html` altında korunur. Yeni uygulama aynı mevcut veri dosyalarını kullanır; yalnızca arşivi ana iş parçacığından Worker’a taşır.

## Yerelde çalıştırma

```bash
pnpm install
pnpm dev
```

Üretim derlemesi:

```bash
pnpm build
pnpm preview
```

Bu çalışma ortamında Node yolu özelse doğrulama komutu şöyledir:

```bash
NODE=/home/cagatay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$NODE node_modules/typescript/bin/tsc -b
$NODE node_modules/vite/bin/vite.js build
```

## Gizlilik ve ağ davranışı

Tercihler ve izleme listesi bir sunucuya gönderilmez. İstenen arşiv sayfası aynı origin üzerindeki sunucu proxy üzerinden, poster/backdrop görselleri ise TMDB görsel CDN’inden yüklenir. Yapımın izleme/fragman düğmeleri kullanıcıyı ilgili haricî hedefe yönlendirir.
