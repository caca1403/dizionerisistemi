# SÉRA - Series Emotion Recommendation AI 🤖🎬

![SÉRA Logo](https://raw.githubusercontent.com/caca1403/dizionerisistemi/master/assets/seraai.ico) > 

> SÉRA, izleme alışkanlıklarınızı ve duygusal tercihlerinizi analiz ederek size en uygun yapımları sunan, tarayıcı tabanlı gelişmiş bir yapay zeka öneri motorudur.
**"Zevk DNA'nıza Göre Dizi Keşfi"**
---

## ✨ Öne Çıkan Özellikler

* **🤖 Çok Katmanlı AI Analizi:** Sadece tür bazlı değil, anlamsal (Semantic) analiz yaparak dizinin ruhuna göre eşleştirme sağlar.
* **📊 Hibrit Öneri Algoritması:** Transformer Attention, NCF (Neural Collaborative Filtering) ve BM25 skorlama sistemlerini birleştirir.
* **🌍 Dev Veri Havuzu:** 57.000'den fazla küresel yapımı kapsayan TMDB, IMDb, Anime (MyAnimeList), K-Drama ve yerli Türk dizileri veritabanı.
* **📱 Netflix Style UI:** Tamamen responsive, modern ve akıcı kullanıcı arayüzü.
* **💾 Veri Gizliliği:** Tüm analizler tarayıcınızda yapılır. Favorilerinizi ve tercihlerinizi yedekleyebilir veya geri yükleyebilirsiniz.
* **📺 Akıllı İzleme Takibi:** "İzliyorum", "İzledim" veya "İzleyeceğim" listeleri ile kişisel kütüphane yönetimi.

---

## 🛠 Teknik Mimari (Engine Room)

SÉRA, arkada oldukça karmaşık bir matematiksel modelleme kullanır. Algoritmanın kalbinde şunlar yer alır:

### 🧠 Öneri Motoru (Ensemble Learning)
Öneri skoru oluşturulurken 18 farklı benzerlik algoritması harmanlanır:
- **Cosine Similarity:** Vektörel benzerlik ölçümü.
- **Transformer Attention:** Önemli anahtar kelimelere odaklanma.
- **BM25 Skorlaması:** Metin tabanlı aramalarda alaka düzeyi hesaplama.
- **Sigmoid & Pearson:** Verilerin normalizasyonu ve korelasyon analizi.

### 📈 Veri Kaynakları & İşleme
- Parçalanmış JSON mimarisi sayesinde +180MB veri seti, belleği yormadan asenkron (Lazy Load) olarak yüklenir.
- **Otomatik Çeviri Motoru:** İngilizce içerik özetlerini anlık olarak Türkçeye çevirir.
- **Fallback Image System:** Eksik kapak görsellerini birden fazla API (TMDB, TVMaze, Jikan) üzerinden dinamik olarak tamamlar.

---

## 🚀 Hızlı Başlangıç

Bu projeyi yerel bilgisayarınızda çalıştırmak için:

1.  Depoyu klonlayın:
    ```bash
    git clone [https://github.com/caca1403/dizionerisistemi.git](https://github.com/caca1403/dizionerisistemi.git)
    ```
2.  `index.html` dosyasını modern bir tarayıcıda açın.
3.  AI modelinin veri havuzunu yüklemesini bekleyin (Startup ekranında ilerlemeyi görebilirsiniz).

---

## 📸 Ekran Görüntüleri

| Dizi Analizi | Akıllı Arama | Detaylı Görünüm |
| :--- | :--- | :--- |
| ![Analiz](https://via.placeholder.com/300x200?text=AI+Analiz) | ![Arama](https://via.placeholder.com/300x200?text=Arama+Motoru) | ![Detay](https://via.placeholder.com/300x200?text=Dizi+Detay) |

---

## 📄 Lisans

Bu proje MIT lisansı altında korunmaktadır. Geliştirilmeye ve katkıya açıktır.

---
**Geliştirici:** [Çağatay Çayır](https://github.com/caca1403)
*"Zekayı sanatla, veriyi duyguyla birleştiriyoruz."*
