# SÉRA — Yerel Dizi Keşfi ve Hibrit Öneri Motoru

SÉRA, bir kullanıcının seçtiği yapımlardan veya yazdığı temadan dizi önerileri çıkaran statik bir web uygulamasıdır. Kullanıcı hesabı, merkezi profil sunucusu ve takip kodu kullanmaz: tercihler, geri bildirimler ve model verisi yalnızca kullanılan tarayıcıda kalır.

## Öneri hattı

Bir arama beş aşamada ilerler. İlk üç aşama sonuçların temelini oluşturur; nöral ve görsel katmanlar bunları küçük bir payla yeniden sıralar. Böylece ağdaki bir görsel model sorunu sonuç ekranını boş bırakmaz.

1. **Metin ve tür profili:** Seçilen yapımların özetleri ve türleri, uygulamanın kategori sözlüğüyle sayısal bir profile dönüştürülür.
2. **Bilgi-getirim skoru:** BM25, başlık/özet içindeki ayırt edici kelimeleri ölçer. Kosinüs benzerliği, Jaccard ve Sørensen–Dice ise kategori ve kelime kümelerinin yakınlığını hesaplar.
3. **Kalite sinyalleri:** Puan, oy sayısı, tür filtresi ve veri kaynağı normalleştirilir. Bunlar yalnızca eşit derecede ilgili adaylar arasında etkili olur.
4. **Yerel NLP sinir ağı:** İlk aramada tarayıcı, arşivden en fazla 180 adaylık küçük bir örnek alır. Metinler 128 boyutlu hash-token vektörüne çevrilir; TensorFlow.js ile iki katmanlı gerçek bir yoğun ağ eğitilir. Hedef, arşivdeki tür/kategori profilidir. Ağın ara katmanındaki embedding, sorgu ve aday arasındaki ek anlamsal yakınlığı verir. Bu katman dışarıya veri göndermez.
5. **Geri bildirim MLP:** En az altı geri bildirim ve her iki sınıfta en az iki örnek olduğunda, beğeni/beğenmeme profilleriyle ikinci bir ikili MLP eğitilir. Bu model yalnızca küçük bir yeniden sıralama etkisi uygular; az veriyle rastgele davranmaması için önce devre dışıdır.

## Gerçek görsel CNN

Öneri listesi ekrana geldikten sonra SÉRA otomatik olarak ön-eğitimli **MobileNet v2 (alpha .35)** modelini yükler. Bu, posterleri vektöre çeviren gerçek bir evrişimli sinir ağıdır.

- Favori tabanlı aramada, seçtiğiniz en fazla üç yapımın posterlerinden bir görsel merkez vektörü çıkarılır ve ilk 18 adayla karşılaştırılır.
- Kategori aramasında, ilk matematiksel adaylar görsel stil merkezi olarak kullanılır; poster yakınlığı sonuçların küçük bir bölümünü yeniden sıralar.
- Detay kartındaki **Poster CNN** düğmesi aynı analizi tekrarlar. TMDB’de YouTube fragman anahtarı bulunursa, fragmanın açık thumbnail karesi de ikinci bir görsel sinyal olarak kullanılır.
- YouTube iframe’i veya başka sitelerin kapalı oynatıcısından video karesi okunamaz. Bu, sitenin değil tarayıcının çapraz kaynak güvenlik kuralıdır. SÉRA doğrudan erişilebilir fragman thumbnail’i varsa onu analiz eder; erişilemeyen medya analizi atlanır.

CNN, ağır binlerce poster taraması yerine liste çizildikten sonra küçük bir öncelikli kümede çalışır. Bu karar mobilde ilk etkileşimi korur. Detayda açılan yapım ayrıca istenildiğinde tekrar ölçülebilir.

## Performans yaklaşımı

- İlk ekranda çekirdek CSV arşivi yüklenir; büyük anime, Türk dizi ve K-drama arşivleri boş zamanda sırayla hazırlanır.
- Hesaplama döngüleri periyodik olarak ana iş parçacığına geri döner; uzun taramalar dokunma ve kaydırmayı kilitlemez.
- Yerel arşiv taranırken ara budama yapılır, yüzlerce yerine en güçlü adaylar bellekte tutulur.
- Ağır veri setleri `localStorage` içine JSON olarak kopyalanmaz. Tarayıcının HTTP önbelleği CSV’leri önbellekler; yalnızca kullanıcının listesi ve geri bildirimleri cihazda saklanır.
- Görsel CNN ilk sonuçlar çizildikten sonra çalışır; yüklenemediğinde BM25/kosinüs tabanlı sonuçlar kullanılmaya devam eder.

## Veri kaynakları

Depoda IMDb, TMDB biçimli, anime, K-drama ve Türk dizisi CSV arşivleri bulunur. Trend, poster, çeviri, ayrıntı ve fragman anahtarı için bazı ekranlar dış API’leri kullanabilir. Bir dış servis geçici olarak erişilemezse yerel arşivdeki temel keşif akışı çalışmaya devam eder.

## Gizlilik

SÉRA kullanıcı tercihlerinin, beğeni kayıtlarının veya yerelde eğitilen nöral modelin ağırlıklarının bir kopyasını kendi sunucusuna göndermez. TensorFlow.js ve MobileNet model dosyaları CDN’den indirilir; analiz verisi tarayıcıda işlenir. İsterseniz tarayıcı site verisini temizleyerek tüm yerel tercihleri silebilirsiniz.

## Yerelde çalıştırma

```bash
git clone https://github.com/caca1403/dizionerisistemi.git
cd dizionerisistemi
python3 -m http.server 8080
```

Ardından `http://localhost:8080` adresini açın. CSV dosyaları `fetch` ile okunduğu için `index.html` dosyasını çift tıklamak yerine yerel bir sunucu kullanın.

## Teknik sınırlar

SÉRA’daki NLP modeli genel amaçlı bir Transformer değildir; yerel dizi arşivinin tür ve özet sinyalleriyle hızlıca eğitilen küçük bir sınıflandırıcıdır. Bu nedenle sonuç kalitesi kaynak verinin kapsamına, diline ve özet kalitesine bağlıdır. Görsel CNN de oyuncu yüzleri veya poster estetiğini ölçer; tek başına hikâye kalitesini çıkarmaz. Bu sınırlara rağmen her katmanın çalışma alanı, veri kaynağı ve etkisi arayüzde ve bu belgede açıkça belirtilmiştir.
