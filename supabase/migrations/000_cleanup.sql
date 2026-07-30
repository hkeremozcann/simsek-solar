-- Şimşek Solar — Temizleme Scripti
-- UYARI: Tüm verileri siler. Sadece ilk kurulumda veya sıfırlamada kullanın.
-- Bu scripti çalıştırdıktan sonra 001_initial_schema.sql dosyasını tekrar çalıştırın.

-- Trigger'ları kaldır
drop trigger if exists tr_blok_asamasi_guncelleme_proje on blok_asamalari;
drop trigger if exists tr_blok_asamalari_guncelleme on blok_asamalari;
drop trigger if exists tr_proje_dokumanlari_guncelleme on proje_dokumanlari;
drop trigger if exists tr_projeler_guncelleme on projeler;
drop trigger if exists tr_firmalar_guncelleme on firmalar;

-- Fonksiyonları kaldır (CASCADE: bağımlı policy'leri de siler)
drop function if exists tr_blok_asamasi_degisince() cascade;
drop function if exists hesapla_proje_durumu(uuid) cascade;
drop function if exists set_guncelleme_tarihi() cascade;
drop function if exists blok_ve_asama_olustur(uuid, int, text) cascade;
drop function if exists proje_destek_dokumanlar_olustur(uuid) cascade;
drop function if exists auth_rol() cascade;

-- Sequence
drop sequence if exists proje_sira_no_seq;

-- Tabloları CASCADE ile sil (bağımlı tablolar otomatik silinir)
drop table if exists aktivite_logu cascade;
drop table if exists saha_raporlari cascade;
drop table if exists blok_asamalari cascade;
drop table if exists proje_dokumanlari cascade;
drop table if exists bloklar cascade;
drop table if exists rapor_alicilari cascade;
drop table if exists santiye_yetkilileri cascade;
drop table if exists projeler cascade;
drop table if exists kullanicilar cascade;
drop table if exists bayiler cascade;
drop table if exists firmalar cascade;
