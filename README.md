# SÉRA — Yerel Dizi Keşfi

SÉRA, izleme tercihlerini tarayıcıda tutarak dizi önerileri üreten statik bir keşif uygulamasıdır. Sunucu hesabı, kullanıcı profili ya da gizli takip kodu kullanmaz.

## Nasıl çalışır?

Kullanıcı sevdiği yapımları veya aradığı temayı girer. Uygulama yerel veri setindeki başlık, özet ve tür alanlarını karşılaştırarak adayları sıralar.

Öneri skoru, gerçekten çalışan şu bileşenlerden oluşur:

- **Kosinüs benzerliği:** Seçilen yapımların kategori vektörü ile adayın vektörünü karşılaştırır.
- **BM25:** Serbest metindeki önemli kelimeleri özetlerde arar; sık geçen genel kelimeleri düşük ağırlıklandırır.
- **Jaccard ve Sørensen–Dice benzerliği:** Kullanıcı metni ve yapım metni arasındaki kelime kümelerinin kesişimini ölçer.
- **Rocchio tarzı geri bildirim:** Beğeni ve beğenmeme seçimleri, benzer adaylara küçük ve açıklanabilir bir ağırlık uygular.
- **Kalite yeniden sıralaması:** Puan ve oy sayısı, anlamsal eşleşmeyi bastırmadan nihai sıraya etki eder.

Bu proje eğitimli bir Transformer, işbirlikçi filtreleme ağı veya kişisel veriyle çalışan bir yapay zekâ modeli içermez. Bu isimler önceki sürümdeki açıklamalarda yer alıyordu; gerçek işleyişi yansıtmadıkları için kaldırıldı.

## Veri ve yükleme yaklaşımı

Depoda IMDb, TMDB biçimli, anime, K-drama ve Türk dizisi CSV arşivleri bulunur. İlk açılışta küçük çekirdek arşiv yüklenir; büyük uzman arşivleri ilk ekran çizildikten sonra boşta ve sırayla işlenir. Bu, özellikle mobil cihazlarda ilk etkileşimi hızlandırır.

Ağır veri nesneleri `localStorage` içine kopyalanmaz. Bu tarayıcı kotasını aşabilir ve her açılışta uzun JSON dönüştürme işlemlerine yol açar. Statik CSV dosyaları tarayıcının HTTP önbelleğinden yararlanır; yalnızca kullanıcının favorileri, izleme durumu ve beğeni geri bildirimi cihazda saklanır.

## Özellikler

- Favori yapımlardan kişisel öneri
- Tema ve kategoriyle keşif
- Başlığa göre doğrudan arama
- Trend listeleri ve detay görünümü
- Favori, izliyorum, izledim ve izleyeceğim listeleri
- Yerel yedekleme ve geri yükleme
- Mobil uyumlu, sunucusuz çalışma

## Yerelde çalıştırma

```bash
git clone https://github.com/caca1403/dizionerisistemi.git
cd dizionerisistemi
python3 -m http.server 8080
```

Ardından `http://localhost:8080` adresini açın. CSV dosyalarının `fetch` ile okunabilmesi için dosyayı doğrudan çift tıklamak yerine bir yerel sunucu kullanın.

## Sınırlar

Sonuç kalitesi, kaynak CSV verisinin kapsamı ve özet/tür alanlarının doğruluğuyla sınırlıdır. Dış API’lerden gelen trend, görsel ve çeviri verileri geçici olarak erişilemeyebilir; çekirdek yerel arşiv çalışmaya devam eder.

## Gizlilik

Tercihler ve listeler yalnızca tarayıcının yerel depolamasında kalır. SÉRA bunları bir sunucuya göndermez.
