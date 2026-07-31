-- ── 1. Aşama Hatalı → Uygun geçince ilgili hataları otomatik kapat ──
CREATE OR REPLACE FUNCTION tr_asama_uygun_hatalar_kapat()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Önceden Hatalıydı, şimdi Uygun yapıldı
  IF OLD.sonuc = 'Hatalı' AND NEW.sonuc = 'Uygun' THEN
    UPDATE hatalar
    SET durum = 'Kapandı',
        kapanma_tarihi = now()
    WHERE blok_asama_id = NEW.id
      AND durum IN ('Açık', 'Düzeltiliyor', 'Yeniden Kontrolde');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tr_asama_uygun_hatalar_kapat ON blok_asamalari;
CREATE TRIGGER tr_asama_uygun_hatalar_kapat
  AFTER UPDATE ON blok_asamalari
  FOR EACH ROW EXECUTE FUNCTION tr_asama_uygun_hatalar_kapat();

-- ── 2. Mevcut test hatalarını temizle (tüm aşamaları Uygun olan blokların hataları) ──
UPDATE hatalar h
SET durum = 'Kapandı',
    kapanma_tarihi = now()
WHERE h.blok_asama_id IN (
  SELECT id FROM blok_asamalari
  WHERE sonuc = 'Uygun' AND durum = 'Tamamlandı'
)
AND h.durum IN ('Açık', 'Düzeltiliyor', 'Yeniden Kontrolde');

-- ── 3. Hata kapanınca proje durumunu yeniden hesapla ─────────────
CREATE OR REPLACE FUNCTION tr_hata_degisince_proje()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (OLD.durum != NEW.durum) THEN
    PERFORM hesapla_proje_durumu(coalesce(NEW.proje_id, OLD.proje_id));
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tr_hata_degisince ON hatalar;
CREATE TRIGGER tr_hata_degisince
  AFTER UPDATE ON hatalar
  FOR EACH ROW EXECUTE FUNCTION tr_hata_degisince_proje();

-- ── 4. MV'yi şimdi yenile ───────────────────────────────────────
REFRESH MATERIALIZED VIEW mv_proje_ozet;

SELECT
  (SELECT COUNT(*) FROM hatalar WHERE durum IN ('Açık','Düzeltiliyor','Yeniden Kontrolde')) AS acik_hata,
  (SELECT COUNT(*) FROM hatalar WHERE durum = 'Kapandı') AS kapali_hata,
  'Tamamlandı' AS sonuc;
