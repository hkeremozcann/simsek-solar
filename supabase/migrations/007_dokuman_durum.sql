-- Proje dokümanı durum değerlerini güncelle
ALTER TABLE proje_dokumanlari
  DROP CONSTRAINT IF EXISTS proje_dokumanlari_durum_check;

-- Mevcut değerleri yeni değerlere eşle
UPDATE proje_dokumanlari SET durum = 'Dosya Bekleniyor'   WHERE durum IN ('Başlamadı');
UPDATE proje_dokumanlari SET durum = 'Çiziliyor'          WHERE durum IN ('Hazırlanıyor');
UPDATE proje_dokumanlari SET durum = 'Tamamlandı'         WHERE durum IN ('Müşteriye Gönderildi','Onaylandı');
UPDATE proje_dokumanlari SET durum = 'İptal Edildi'       WHERE durum IN ('Revizyon İstendi');

ALTER TABLE proje_dokumanlari
  ADD CONSTRAINT proje_dokumanlari_durum_check
  CHECK (durum IN ('Dosya Bekleniyor','Çiziliyor','Tamamlandı','İptal Edildi'));

SELECT 'Doküman durum güncellendi' AS sonuc;
