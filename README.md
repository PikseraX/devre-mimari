# Devre Mimarı — Expo

Android ve iOS için Expo SDK 58 projesi. Oyun WebView içinde çalışır; HTML, stiller ve Türkçe karakterleri içeren fontlar uygulamaya gömülür. Mobil sürüm oyun sırasında internet bağlantısı gerektirmez.

## Çalıştırma

Node.js LTS ve npm ile bu klasörde:

```sh
npm ci
npm start
```

Expo Go'nun SDK 58 ile uyumlu sürümünü kullanın. Windows üzerinde iOS Simulator çalışmaz; iPhone üzerinde test veya EAS bulut derlemesi kullanılabilir.

## Android ve iOS çıktısı

İlk kullanımda kendi Expo hesabınıza giriş yapın ve projeyi bağlayın. Birden fazla hesabınız/organizasyonunuz varsa doğru sahibi seçin:

```sh
npx eas-cli@latest login
npx eas-cli@latest init
```

`eas init`, gerçek proje kimliğini `app.json` içine ekler. Örnek veya başka projeye ait EAS kimliği kullanılmamıştır.

| Çıktı | Komut | Kullanım |
| --- | --- | --- |
| Android APK | `npm run build:android:apk` | Telefona doğrudan yükleme |
| Android AAB | `npm run build:android` | Google Play |
| iOS IPA | `npm run build:ios` | TestFlight / App Store |
| iOS Simulator | `npm run build:ios:simulator` | Mac üzerindeki simülatör |

İlk derlemede EAS imzalama bilgilerini sorar. Gerçek iPhone/App Store dağıtımı Apple Developer hesabı ve imzalama gerektirir. Simülatör çıktısı iPhone'a kurulamaz. Mağazaya yükleme otomatik yapılmaz.

Uygulama kimliği iki platformda da `pikserax.devremimari` olarak hazırlanmıştır. İlk mağaza kaydından önce kendi yayıncı kimliğinize uygunluğunu kontrol edin. Sürüm `1.0.0`; mağaza derleme numaraları EAS tarafından artırılır.

## Dosyalar

- `index.html`: Oyunun tek düzenlenebilir kaynağı; tarayıcıda doğrudan açılan sürümü CDN kullanır.
- `App.js`: Native kayıt, pano, güvenli ekran alanı ve Android geri tuşu desteği.
- `scripts/build-game.cjs`: CDN bağımlılıklarını yerel CSS/fontlarla değiştirip mobil paketi üretir. `npm ci` ve başlatma/export komutları otomatik çalıştırır.
- `generated/`: Otomatik üretilir; düzenlemeyin ve sürüm kontrolüne eklemeyin.
- `assets/`: Uygulama simgeleri. `npm run icons` ile yeniden üretilebilir.
- `app.json`, `eas.json`: Platform ve derleme profilleri.
- `tests/mobile.cjs`: Çevrimdışı oyun ve native iletişim köprüsü testi.

İlerleme cihazda AsyncStorage içinde saklanır. Masaüstü tarayıcısındaki kayıt telefona otomatik taşınmaz; oyunun hesap ekranındaki yedek kodunu kullanın. Uygulamayı silmek yerel kayıtları da silebilir.

## Doğrulama

```sh
npm test
npm run check
npm run export
npx expo-doctor
```

Windows testi kurulu Microsoft Edge'i başsız çalıştırır. Diğer sistemlerde önce `npx playwright install chromium` çalıştırın.

19 Kasım 2026 kontrol sonuçları:

- Android ve iOS Hermes paketleri başarıyla üretildi (`dist/`). Bunlar APK/IPA değildir.
- Çevrimdışı açılış, telefon/tablet tahta genişliği, kayıt okuma/yazma mesajları, pano mesajı, geri dönüş ve arka planda sayaç durması testi geçti.
- Dört test grubu geçiyor: temel mobil akış; geçersiz yedeğin reddi, geri alma ve geçerli/eski kayıtların yüklenmesi; özel karakterli oyuncu adlarıyla mobil açılış; gün/hafta değişiminde kariyer ve çöküş görevlerinin korunması.
- Expo sürüm uyumu ve yerel Android/iOS yapılandırma üretimi geçti.
- Expo Doctor 18/20 kontrolü geçti. Şema API'si bağlantı zaman aşımı ve React Native Directory servis yanıtı nedeniyle iki çevrimiçi kontrol tamamlanamadı; derleme öncesi tekrar çalıştırın.
- npm denetiminde Expo araç zincirinden gelen orta düzey uyarılar var; eski SDK'ya düşüren `npm audit fix --force` uygulanmadı.
- Fiziksel Android/iPhone testi ve imzalı bulut derlemesi yapılmadı. Yayın öncesi ses, klavye, uygulamayı kapatıp açınca kayıt ve ekran geçişlerini gerçek cihazlarda doğrulayın.

20 Kasım 2026: Görev başlıkları HTML olarak yorumlanmadan gösterilir. Çarkın ücreti ve ödülü animasyondan önce birlikte kaydedilir; animasyon yarıda kesilirse ödül korunur. Bu iki düzeltmeyle test grubu sayısı altıya çıktı. Çark testi ücretli/ücretsiz tüm beş ödülü, tekrar dokunmayı, yeniden açılışı ve yetersiz bakiyeyi kapsar.

Resmî kaynaklar: [EAS Build kurulumu](https://docs.expo.dev/build/setup/), [Android APK](https://docs.expo.dev/build-reference/apk/), [Expo WebView](https://docs.expo.dev/versions/latest/sdk/webview/).
