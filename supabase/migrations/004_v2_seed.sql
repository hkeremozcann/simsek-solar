-- Şimşek Solar V2 — Başlangıç Kurulumu
-- Sadece yapısal ayarlar, veri yok.
-- Tüm veriler uygulama üzerinden girilir.

-- Mevcut auth kullanıcısını yönetici yap
-- (Supabase'de kayıtlı e-posta adresinize göre güncellenir)
update kullanicilar set rol = 'yonetici'
where eposta = (select email from auth.users order by created_at limit 1);

-- Materialized view başlat
refresh materialized view mv_proje_ozet;

select 'Kurulum tamamlandı. Uygulamadan veri girişi yapabilirsiniz.' as mesaj;
