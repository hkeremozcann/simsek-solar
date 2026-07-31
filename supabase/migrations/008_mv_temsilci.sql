-- MV'ye satis_temsilcisi_adi ekle
DROP MATERIALIZED VIEW IF EXISTS mv_proje_ozet;

CREATE MATERIALIZED VIEW mv_proje_ozet AS
SELECT
  p.id, p.proje_kodu, p.proje_adi, p.durum, p.aktif_mi,
  p.il, p.ilce, p.blok_sayisi, p.konut_sayisi,
  p.hedef_teslim_tarihi, p.tamamlanma_tarihi, p.son_hareket_tarihi,
  p.satis_temsilcisi_id, p.firma_id, p.montaj_sorumlusu_id,
  p.bedelsiz_mi, p.taslak_mi, p.montaj_kapsami,
  f.kurum_tipi,
  f.ad AS firma_adi,
  me.ad AS montaj_ekibi_adi,
  kt.ad_soyad AS satis_temsilcisi_adi,
  COUNT(DISTINCT b.id) AS toplam_blok,
  COUNT(DISTINCT ba.id) FILTER (WHERE ba.durum='Tamamlandı' AND ba.sonuc='Uygun') AS tamamlanan_asama,
  COUNT(DISTINCT ba.id) AS toplam_asama,
  CASE WHEN COUNT(DISTINCT ba.id) > 0
    THEN FLOOR(COUNT(DISTINCT ba.id) FILTER (WHERE ba.durum='Tamamlandı' AND ba.sonuc='Uygun') * 100.0
         / NULLIF(COUNT(DISTINCT ba.id), 0))::int
  ELSE 0 END AS saha_yuzdesi,
  COUNT(DISTINCT ba_da.blok_id)       AS devreye_alinan_blok,
  COUNT(DISTINCT h.id) FILTER (WHERE h.durum IN ('Açık','Düzeltiliyor','Yeniden Kontrolde')) AS acik_hata,
  COALESCE(FLOOR(SUM(pm.sevk_edilen_adet) * 100.0 / NULLIF(SUM(pm.sozlesme_adedi), 0))::int, 0) AS sevk_yuzdesi,
  COUNT(DISTINCT ba_kaide.blok_id)    AS kaide_tamamlanan,
  COUNT(DISTINCT ba_dizilim.blok_id)  AS dizilim_tamamlanan,
  COUNT(DISTINCT ba_borulama.blok_id) AS borulama_tamamlanan,
  COUNT(DISTINCT ba_pano.blok_id)     AS pano_tamamlanan,
  CASE WHEN p.hedef_teslim_tarihi < CURRENT_DATE AND p.durum != 'Tamamlandı' THEN true ELSE false END AS gecikmis_mi,
  CASE WHEN p.son_hareket_tarihi < now() - INTERVAL '30 days' AND p.aktif_mi THEN true ELSE false END AS hareketsiz_mi,
  EXTRACT(DAY FROM now() - p.son_hareket_tarihi)::int AS hareketsiz_gun,
  (CURRENT_DATE - p.hedef_teslim_tarihi) AS gecikme_gun
FROM projeler p
LEFT JOIN firmalar f ON f.id = p.firma_id
LEFT JOIN montaj_ekipleri me ON me.id = p.montaj_sorumlusu_id
LEFT JOIN kullanicilar kt ON kt.id = p.satis_temsilcisi_id
LEFT JOIN bloklar b ON b.proje_id = p.id
LEFT JOIN blok_asamalari ba ON ba.blok_id = b.id
LEFT JOIN blok_asamalari ba_da ON ba_da.blok_id = b.id
  AND ba_da.asama_tipi = 'Devreye Alma' AND ba_da.durum = 'Tamamlandı' AND ba_da.sonuc = 'Uygun'
LEFT JOIN blok_asamalari ba_kaide ON ba_kaide.blok_id = b.id
  AND ba_kaide.asama_tipi = 'Kaide Kontrolü' AND ba_kaide.durum = 'Tamamlandı' AND ba_kaide.sonuc = 'Uygun'
LEFT JOIN blok_asamalari ba_dizilim ON ba_dizilim.blok_id = b.id
  AND ba_dizilim.asama_tipi = 'Dizilim' AND ba_dizilim.durum = 'Tamamlandı' AND ba_dizilim.sonuc = 'Uygun'
LEFT JOIN blok_asamalari ba_borulama ON ba_borulama.blok_id = b.id
  AND ba_borulama.asama_tipi = 'Borulama' AND ba_borulama.durum = 'Tamamlandı' AND ba_borulama.sonuc = 'Uygun'
LEFT JOIN blok_asamalari ba_pano ON ba_pano.blok_id = b.id
  AND ba_pano.asama_tipi = 'Pano Bağlantısı' AND ba_pano.durum = 'Tamamlandı' AND ba_pano.sonuc = 'Uygun'
LEFT JOIN hatalar h ON h.proje_id = p.id
LEFT JOIN proje_malzemeleri pm ON pm.proje_id = p.id
WHERE p.silindi_mi = false
GROUP BY p.id, f.kurum_tipi, f.ad, me.ad, kt.ad_soyad;

CREATE UNIQUE INDEX idx_mv_proje_ozet_id ON mv_proje_ozet(id);
CREATE INDEX idx_mv_durum ON mv_proje_ozet(durum);
CREATE INDEX idx_mv_il ON mv_proje_ozet(il);
CREATE INDEX idx_mv_kapsam ON mv_proje_ozet USING GIN(montaj_kapsami);

REFRESH MATERIALIZED VIEW mv_proje_ozet;

SELECT 'MV güncellendi — satis_temsilcisi_adi eklendi' AS sonuc;
