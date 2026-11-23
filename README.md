# anicixor-promo

Anicixor için sinematik tanıtım videosu (1920x1080, 30 FPS, MP4/H.264). Ana Anicixor reposundan bağımsızdır; yalnızca herkese açık sayfalara GET isteği yapar.

## Nasıl çalışır
GitHub Actions (`Promo Video`):
1. Playwright (Chrome) `anicixor.fun` herkese açık sayfalarını gerçek 1920x1080'de yakalar.
2. Remotion sahneleri kamera sistemiyle render eder.
3. MP4 ffprobe/ffmpeg ile doğrulanır.
4. Video ve ekran görüntüleri **Releases** bölümüne yüklenir. Teknik rapor `reports` dalındadır.

Telefondan yeniden çalıştırma: Actions → Promo Video → Run workflow. Profil sahnesi için `profile_username` girilebilir.

## Gizlilik
Yorumlar, kullanıcı adı bağlantıları ve avatarlar görüntüde gizlenir. Giriş yapılmaz, gizli anahtar kullanılmaz.
