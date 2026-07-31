-- ============================================================
-- Şimşek Solar V2 — Tohum Verisi
-- npm run seed ile çalıştırılır
-- ============================================================

-- Mevcut veriyi temizle (seed yeniden çalıştırılabilsin)
truncate table aktivite_logu cascade;
truncate table bildirimler cascade;
truncate table saha_raporlari cascade;
truncate table eksik_imalatlar cascade;
truncate table hatalar cascade;
truncate table dosyalar cascade;
truncate table blok_asamalari cascade;
truncate table bloklar cascade;
truncate table proje_malzemeleri cascade;
truncate table proje_dokumanlari cascade;
truncate table rapor_alicilari cascade;
truncate table santiye_yetkilileri cascade;
truncate table projeler cascade;
-- Proje kodları için sequence'i sıfırla
alter sequence proje_sira_seq restart with 1;
alter sequence hata_sira_seq restart with 1;
alter sequence rapor_sira_seq restart with 1;

-- ============================================================
-- 1. FİRMALAR (8 firma)
-- ============================================================
insert into firmalar(id, ad, kurum_tipi, ana_yuklenici, il, ilce, telefon, genel_eposta, aktif_mi) values
  ('f1000001-0000-0000-0000-000000000001', 'TOKİ Gaziantep 3. Etap', 'TOKİ', 'Özgün İnşaat A.Ş.', 'Gaziantep', 'Şahinbey', '0342 212 34 56', 'gaziantep3@toki.gov.tr', true),
  ('f1000001-0000-0000-0000-000000000002', 'TOKİ Şanlıurfa Karaköprü', 'TOKİ', 'Yıldız Yapı Grubu', 'Şanlıurfa', 'Karaköprü', '0414 312 45 67', 'urfa@toki.gov.tr', true),
  ('f1000001-0000-0000-0000-000000000003', 'Sağlık Bakanlığı Adıyaman DH', 'Sağlık Bakanlığı', 'Akar Yapı Ltd.', 'Adıyaman', 'Merkez', '0416 212 33 44', 'adiyaman@saglik.gov.tr', true),
  ('f1000001-0000-0000-0000-000000000004', 'Adalet Bakanlığı Kilis Adliye', 'Adalet Bakanlığı', 'Güçlü İnşaat', 'Kilis', 'Merkez', '0348 812 22 33', 'kilis@adalet.gov.tr', true),
  ('f1000001-0000-0000-0000-000000000005', 'GSB Kahramanmaraş Yurt', 'Gençlik ve Spor Bakanlığı', 'Akıncı Yapı A.Ş.', 'Kahramanmaraş', 'Dulkadiroğlu', '0344 212 55 66', 'maras@gsb.gov.tr', true),
  ('f1000001-0000-0000-0000-000000000006', 'MEB Osmaniye Pansiyon', 'MEB', 'Tepe İnşaat', 'Osmaniye', 'Merkez', '0328 812 11 22', 'osmaniye@meb.gov.tr', true),
  ('f1000001-0000-0000-0000-000000000007', 'Gaziantep Büyükşehir Belediyesi', 'Belediye', 'Belediye Şantiyesi', 'Gaziantep', 'Şehitkamil', '0342 320 20 20', 'proje@gaziantep.bel.tr', true),
  ('f1000001-0000-0000-0000-000000000008', 'Öz-Kaya İnşaat A.Ş.', 'Özel Sektör', null, 'Ankara', 'Çankaya', '0312 428 90 00', 'info@ozkaya.com.tr', true);

-- ============================================================
-- 2. BAYİLER (5 bayi)
-- ============================================================
insert into bayiler(id, ad, yetkili_kisi, telefon, eposta, il, aktif_mi) values
  ('b1000001-0000-0000-0000-000000000001', 'Anadolu Solar Tic.', 'Ahmet Kaya', '0532 111 22 33', 'ahmet@anadolusolar.com', 'Gaziantep', true),
  ('b1000001-0000-0000-0000-000000000002', 'Güneş Enerji Sistemleri', 'Mehmet Demir', '0533 222 33 44', 'mehmet@gunesenerji.com', 'Şanlıurfa', true),
  ('b1000001-0000-0000-0000-000000000003', 'Eko Enerji Çözümleri', 'Fatma Yıldız', '0534 333 44 55', 'fatma@ekoenerji.com', 'Adıyaman', true),
  ('b1000001-0000-0000-0000-000000000004', 'Verimli Enerji A.Ş.', 'Ali Çelik', '0535 444 55 66', 'ali@verimlienerji.com', 'Kahramanmaraş', true),
  ('b1000001-0000-0000-0000-000000000005', 'Solartek Distribütör', 'Ayşe Arslan', '0536 555 66 77', 'ayse@solartek.com', 'Ankara', true);

-- ============================================================
-- 3. KULLANICILAR (9 kullanıcı — auth.users'da da olmalı)
-- Gerçek projede auth.users üzerinden oluşturulur
-- Seed için doğrudan ekliyoruz
-- ============================================================
-- Not: auth.users ile FK olduğu için, seed çalıştırılmadan önce
-- Supabase Dashboard'dan kullanıcılar oluşturulmalı.
-- Alternatif: kullanicilar tablosunu auth.users FK'sız kullanabiliriz (test için)
-- Burada FK constraint olmadığı varsayımıyla ekliyoruz:

-- Kullanıcılar: auth.users FK olmadan (seed için geçici olarak kaldırılır)
-- Gerçek admin kullanıcısı zaten var — sadece rolu güncelle
alter table kullanicilar drop constraint if exists kullanicilar_id_fkey;

-- Mevcut kullanıcıyı yönetici yap
update kullanicilar set rol = 'yonetici', ad_soyad = 'Kerem Özcan'
where eposta = 'kerem@simseksolar.com.tr';

-- Test kullanıcılarını ekle (auth.users olmadan)
insert into kullanicilar(id, ad_soyad, eposta, rol, aktif_mi) values
  ('a0000001-0000-0000-0000-000000000002', 'Selin Yılmaz', 'selin@simseksolar.com.tr', 'satis_sonrasi_sorumlusu', true),
  ('a0000001-0000-0000-0000-000000000003', 'Burak Şahin', 'burak@simseksolar.com.tr', 'satis_sonrasi_sorumlusu', true),
  ('a0000001-0000-0000-0000-000000000004', 'Musa Koç', 'musa@simseksolar.com.tr', 'saha_teknisyeni', true),
  ('a0000001-0000-0000-0000-000000000005', 'Hakan Güler', 'hakan@simseksolar.com.tr', 'saha_teknisyeni', true),
  ('a0000001-0000-0000-0000-000000000006', 'Cem Aydın', 'cem@simseksolar.com.tr', 'satis_temsilcisi', true),
  ('a0000001-0000-0000-0000-000000000007', 'Deniz Karaca', 'deniz@simseksolar.com.tr', 'satis_temsilcisi', true),
  ('a0000001-0000-0000-0000-000000000008', 'Zeynep Kılıç', 'zeynep@simseksolar.com.tr', 'satis_temsilcisi', true),
  ('a0000001-0000-0000-0000-000000000009', 'Bayi Ali', 'ali@anadolusolar.com', 'bayi', true)
on conflict (eposta) do update set
  ad_soyad = excluded.ad_soyad,
  rol = excluded.rol;

-- bayi_id güncelle
update kullanicilar set bayi_id = 'b1000001-0000-0000-0000-000000000001'
where eposta = 'ali@anadolusolar.com';

-- satis_temsilcisi_id için alias view: gerçek admin UUID → seed UUID
-- Projeler admin ID yerine mevcut auth user'ı kullanacak
do $$ begin
  -- Gerçek admin UUID'yi seed UUID olarak kaydet (opsiyonel alias)
  update kullanicilar set id = 'a0000001-0000-0000-0000-000000000001'
  where eposta = 'kerem@simseksolar.com.tr'
    and id != 'a0000001-0000-0000-0000-000000000001'
    and not exists (select 1 from projeler); -- Henüz proje yoksa güvenle değiştir
exception when others then
  null; -- Çakışma varsa atla
end $$;

-- ============================================================
-- 4. PROJELER (24 proje — gerçekçi dağılım)
-- ============================================================

-- Helper: blok ve aşama oluşturma
create or replace function seed_blok_ve_asama(
  p_proje_id uuid,
  p_blok_sayisi int,
  p_adlandirma text,  -- 'harf' | 'sayi'
  p_tamamlanma_profili text  -- 'bos' | 'kaide' | 'yarisi' | 'ileri' | 'tamam'
) returns void language plpgsql as $$
declare
  i int;
  v_blok_id uuid;
  v_blok_adi text;
  j int;
  asama_tipleri text[] := array['Kaide Kontrolü','Dizilim','Borulama','Pano Bağlantısı','Devreye Alma'];
  v_durum text;
  v_sonuc text;
  v_kontrol_tarihi timestamptz;
  v_tamamla_kadar int;
begin
  for i in 1..p_blok_sayisi loop
    if p_adlandirma = 'harf' then
      v_blok_adi := chr(64 + i) || ' Blok';
    else
      v_blok_adi := i || '. Blok';
    end if;

    insert into bloklar(id, proje_id, blok_adi, sira_no)
    values(gen_random_uuid(), p_proje_id, v_blok_adi, i)
    returning id into v_blok_id;

    -- Kaç aşama tamamlanacak?
    v_tamamla_kadar := case p_tamamlanma_profili
      when 'bos'    then 0
      when 'kaide'  then 1
      when 'yarisi' then 3
      when 'ileri'  then 4
      when 'tamam'  then 5
      else 0
    end;

    -- Son birkaç blok yarım bırakılsın (test senaryoları için)
    if p_tamamlanma_profili = 'ileri' and i > p_blok_sayisi - 2 then
      v_tamamla_kadar := 3;
    end if;

    for j in 1..5 loop
      v_durum := 'Başlamadı';
      v_sonuc := null;
      v_kontrol_tarihi := null;

      if j <= v_tamamla_kadar then
        v_durum := 'Tamamlandı';
        v_sonuc := 'Uygun';
        v_kontrol_tarihi := now() - (interval '1 day' * (5 - j) * 3 + interval '1 day' * (p_blok_sayisi - i));
      elsif j = v_tamamla_kadar + 1 and p_tamamlanma_profili != 'bos' then
        v_durum := 'Devam Ediyor';
      end if;

      insert into blok_asamalari(
        blok_id, asama_tipi, sira_no, durum, sonuc,
        kontrol_tarihi, kontrol_eden_id,
        ilk_kontrol_sonucu, kontrol_sayisi
      ) values(
        v_blok_id, asama_tipleri[j], j, v_durum, v_sonuc,
        v_kontrol_tarihi,
        case when v_durum = 'Tamamlandı' then 'a0000001-0000-0000-0000-000000000004' else null end,
        case when v_durum = 'Tamamlandı' then 'Uygun' else null end,
        case when v_durum = 'Tamamlandı' then 1 else 0 end
      );
    end loop;
  end loop;
end; $$;

-- ── 14 Çalışıyor projesi ─────────────────────────────────────
insert into projeler(id, proje_adi, firma_id, sozlesme_no, sozlesme_tarihi, hedef_teslim_tarihi,
  santiye_adresi, il, ilce, satis_temsilcisi_id, bayi_id, montaj_kapsami,
  blok_sayisi, toplam_kollektor_sayisi, toplam_sehpa_sayisi, toplam_pano_sayisi,
  boyler_sayisi, boyler_kapasitesi_lt, pompa_grubu_sayisi, sistem_tipi,
  durum, aktif_mi, son_hareket_tarihi)
values
  -- 1: TOKİ Gaziantep 12 blok — ileri aşama (11/12)
  ('p0000001-0000-0000-0000-000000000001',
   'TOKİ Gaziantep 3. Etap — Güneş Enerjisi',
   'f1000001-0000-0000-0000-000000000001',
   'TK-2024-GAZ-089', '2024-03-15', '2025-09-30',
   'Gaziantep Şahinbey Yeni Mahalle TOKİ Şantiyesi', 'Gaziantep', 'Şahinbey',
   'a0000001-0000-0000-0000-000000000006', 'b1000001-0000-0000-0000-000000000001',
   array['Malzeme Satışı','Panel Dizilim Montajı','Borulama Montajı','Pano Montajı','Devreye Alma'],
   12, 288, 144, 12, 12, 300, 12, 'Kapalı Devre',
   'Çalışıyor', true, now() - interval '2 days'),

  -- 2: TOKİ Şanlıurfa 8 blok — borulama aşamasında
  ('p0000001-0000-0000-0000-000000000002',
   'TOKİ Karaköprü Sosyal Konut — Güneş Sistemi',
   'f1000001-0000-0000-0000-000000000002',
   'TK-2024-SUR-112', '2024-05-01', '2025-12-31',
   'Şanlıurfa Karaköprü TOKİ Şantiyesi', 'Şanlıurfa', 'Karaköprü',
   'a0000001-0000-0000-0000-000000000006', null,
   array['Malzeme Satışı','Panel Dizilim Montajı','Borulama Montajı','Proje Desteği'],
   8, 192, 96, 8, 8, 300, 8, 'Kapalı Devre',
   'Çalışıyor', true, now() - interval '5 days'),

  -- 3: Sağlık Bakanlığı 4 blok — kaide aşamasında
  ('p0000001-0000-0000-0000-000000000003',
   'Adıyaman Devlet Hastanesi Sıcak Su Sistemi',
   'f1000001-0000-0000-0000-000000000003',
   'SB-2024-ADY-034', '2024-06-10', '2025-08-30',
   'Adıyaman Hastane Caddesi No:1', 'Adıyaman', 'Merkez',
   'a0000001-0000-0000-0000-000000000007', 'b1000001-0000-0000-0000-000000000003',
   array['Malzeme Satışı','Panel Dizilim Montajı','Borulama Montajı','Pano Montajı','Devreye Alma'],
   4, 80, 40, 4, 4, 500, 4, 'Merkezi Sistem',
   'Çalışıyor', true, now() - interval '3 days'),

  -- 4: GSB 6 blok — yarısı tamamlandı
  ('p0000001-0000-0000-0000-000000000004',
   'Kahramanmaraş Öğrenci Yurdu Güneş Enerjisi',
   'f1000001-0000-0000-0000-000000000005',
   'GSB-2024-KMR-056', '2024-04-20', '2025-10-15',
   'Kahramanmaraş Dulkadiroğlu GSB Yurt Şantiyesi', 'Kahramanmaraş', 'Dulkadiroğlu',
   'a0000001-0000-0000-0000-000000000007', null,
   array['Malzeme Satışı','Panel Dizilim Montajı','Borulama Montajı','Pano Montajı'],
   6, 120, 60, 6, 6, 300, 6, 'Kapalı Devre',
   'Çalışıyor', true, now() - interval '1 day'),

  -- 5: MEB 3 blok — yeni başladı
  ('p0000001-0000-0000-0000-000000000005',
   'Osmaniye Öğrenci Pansiyonu Güneş Sistemi',
   'f1000001-0000-0000-0000-000000000006',
   'MEB-2024-OSM-023', '2024-07-15', '2026-01-31',
   'Osmaniye Merkez MEB Pansiyon Şantiyesi', 'Osmaniye', 'Merkez',
   'a0000001-0000-0000-0000-000000000008', 'b1000001-0000-0000-0000-000000000004',
   array['Malzeme Satışı','Panel Dizilim Montajı','Proje Desteği'],
   3, 60, 30, 3, 3, 200, 3, 'Açık Devre',
   'Çalışıyor', true, now() - interval '7 days'),

  -- 6: Belediye 5 blok — ileri
  ('p0000001-0000-0000-0000-000000000006',
   'Gaziantep BBB Hizmet Binası Güneş Enerjisi',
   'f1000001-0000-0000-0000-000000000007',
   'GBB-2024-ANT-018', '2024-02-01', '2025-07-31',
   'Gaziantep Şehitkamil Belediye Caddesi', 'Gaziantep', 'Şehitkamil',
   'a0000001-0000-0000-0000-000000000006', null,
   array['Malzeme Satışı','Panel Dizilim Montajı','Borulama Montajı','Pano Montajı','Devreye Alma'],
   5, 100, 50, 5, 5, 300, 5, 'Basınçlı',
   'Çalışıyor', true, now() - interval '4 days'),

  -- 7-14: Diğer çalışıyor projeler (kısa)
  ('p0000001-0000-0000-0000-000000000007', 'TOKİ Gaziantep 4. Etap', 'f1000001-0000-0000-0000-000000000001', 'TK-2025-GAZ-001', '2025-01-10', '2026-06-30', 'Gaziantep Şahinbey', 'Gaziantep', 'Şahinbey', 'a0000001-0000-0000-0000-000000000008', null, array['Malzeme Satışı','Panel Dizilim Montajı'], 16, 384, 192, 16, 16, 300, 16, 'Kapalı Devre', 'Çalışıyor', true, now() - interval '1 day'),
  ('p0000001-0000-0000-0000-000000000008', 'TOKİ Şanlıurfa 2. Etap', 'f1000001-0000-0000-0000-000000000002', 'TK-2025-SUR-002', '2025-02-01', '2026-08-31', 'Şanlıurfa Eyyübiye', 'Şanlıurfa', 'Eyyübiye', 'a0000001-0000-0000-0000-000000000006', 'b1000001-0000-0000-0000-000000000002', array['Malzeme Satışı'], 10, 240, 120, 10, 10, 300, 10, 'Kapalı Devre', 'Çalışıyor', true, now() - interval '2 days'),
  ('p0000001-0000-0000-0000-000000000009', 'Adalet Bakanlığı Adana Adliye', 'f1000001-0000-0000-0000-000000000004', 'AB-2024-ADA-045', '2024-09-01', '2025-11-30', 'Adana Merkez Adliye Caddesi', 'Adana', 'Seyhan', 'a0000001-0000-0000-0000-000000000007', null, array['Malzeme Satışı','Panel Dizilim Montajı','Borulama Montajı'], 7, 168, 84, 7, 7, 300, 7, 'Kapalı Devre', 'Çalışıyor', true, now() - interval '10 days'),
  ('p0000001-0000-0000-0000-000000000010', 'GSB Hatay Spor Merkezi', 'f1000001-0000-0000-0000-000000000005', 'GSB-2024-HAT-067', '2024-08-15', '2025-12-15', 'Hatay Antakya GSB Şantiyesi', 'Hatay', 'Antakya', 'a0000001-0000-0000-0000-000000000008', 'b1000001-0000-0000-0000-000000000005', array['Malzeme Satışı','Pano Montajı','Devreye Alma'], 4, 96, 48, 4, 4, 500, 4, 'Merkezi Sistem', 'Çalışıyor', true, now() - interval '6 days'),
  ('p0000001-0000-0000-0000-000000000011', 'Öz-Kaya Gaziantep Fabrika', 'f1000001-0000-0000-0000-000000000008', 'OK-2025-001', '2025-01-20', '2025-12-31', 'Gaziantep OSB 4. Cadde', 'Gaziantep', 'Şehitkamil', 'a0000001-0000-0000-0000-000000000006', null, array['Malzeme Satışı'], 2, 40, 20, 2, 2, 1000, 2, 'Basınçsız', 'Çalışıyor', true, now() - interval '8 days'),
  ('p0000001-0000-0000-0000-000000000012', 'MEB Kilis Pansiyon', 'f1000001-0000-0000-0000-000000000006', 'MEB-2025-KLS-001', '2025-03-01', '2025-12-31', 'Kilis Merkez MEB Şantiyesi', 'Kilis', 'Merkez', 'a0000001-0000-0000-0000-000000000007', 'b1000001-0000-0000-0000-000000000004', array['Malzeme Satışı','Panel Dizilim Montajı'], 5, 100, 50, 5, 5, 200, 5, 'Açık Devre', 'Çalışıyor', true, now() - interval '3 days'),
  ('p0000001-0000-0000-0000-000000000013', 'Belediye Şanlıurfa Sosyal Tesis', 'f1000001-0000-0000-0000-000000000007', 'SUR-2024-001', '2024-11-01', '2025-09-30', 'Şanlıurfa Eyyübiye Sosyal Tesis', 'Şanlıurfa', 'Eyyübiye', 'a0000001-0000-0000-0000-000000000008', null, array['Malzeme Satışı','Borulama Montajı'], 3, 60, 30, null, 3, 300, 3, 'Kapalı Devre', 'Çalışıyor', true, now() - interval '15 days'),
  ('p0000001-0000-0000-0000-000000000014', 'TOKİ Hatay 1. Etap', 'f1000001-0000-0000-0000-000000000001', 'TK-2024-HAT-099', '2024-10-15', '2025-10-30', 'Hatay Antakya TOKİ Şantiyesi', 'Hatay', 'Antakya', 'a0000001-0000-0000-0000-000000000006', 'b1000001-0000-0000-0000-000000000002', array['Malzeme Satışı','Panel Dizilim Montajı','Borulama Montajı','Pano Montajı','Devreye Alma'], 9, 216, 108, 9, 9, 300, 9, 'Kapalı Devre', 'Çalışıyor', true, now() - interval '12 days');

-- ── 6 Tamamlandı projesi ─────────────────────────────────────
insert into projeler(id, proje_adi, firma_id, sozlesme_no, sozlesme_tarihi, hedef_teslim_tarihi,
  santiye_adresi, il, ilce, satis_temsilcisi_id, montaj_kapsami,
  blok_sayisi, toplam_kollektor_sayisi, toplam_sehpa_sayisi, sistem_tipi,
  durum, aktif_mi, tamamlanma_tarihi, son_hareket_tarihi)
values
  ('p0000001-0000-0000-0000-000000000015', 'Adalet Bakanlığı Gaziantep Adliye', 'f1000001-0000-0000-0000-000000000004', 'AB-2023-GAZ-011', '2023-09-01', '2024-06-30', 'Gaziantep Adliye Sarayı', 'Gaziantep', 'Şahinbey', 'a0000001-0000-0000-0000-000000000006', array['Malzeme Satışı','Panel Dizilim Montajı','Borulama Montajı'], 4, 96, 48, 'Kapalı Devre', 'Tamamlandı', false, '2024-05-15', now() - interval '200 days'),
  ('p0000001-0000-0000-0000-000000000016', 'GSB Gaziantep Spor Okulu', 'f1000001-0000-0000-0000-000000000005', 'GSB-2023-GAZ-044', '2023-08-15', '2024-03-31', 'Gaziantep Spor Okulu', 'Gaziantep', 'Şahinbey', 'a0000001-0000-0000-0000-000000000007', array['Malzeme Satışı','Panel Dizilim Montajı'], 3, 72, 36, 'Kapalı Devre', 'Tamamlandı', false, '2024-03-20', now() - interval '400 days'),
  ('p0000001-0000-0000-0000-000000000017', 'MEB Gaziantep İmam Hatip', 'f1000001-0000-0000-0000-000000000006', 'MEB-2023-GAZ-056', '2023-06-01', '2024-01-31', 'Gaziantep Şehitkamil MEB Şantiyesi', 'Gaziantep', 'Şehitkamil', 'a0000001-0000-0000-0000-000000000008', array['Malzeme Satışı'], 2, 48, 24, 'Açık Devre', 'Tamamlandı', false, '2024-01-25', now() - interval '350 days'),
  ('p0000001-0000-0000-0000-000000000018', 'TOKİ Şanlıurfa 1. Etap', 'f1000001-0000-0000-0000-000000000002', 'TK-2022-SUR-078', '2022-11-01', '2023-10-31', 'Şanlıurfa Haliliye TOKİ', 'Şanlıurfa', 'Haliliye', 'a0000001-0000-0000-0000-000000000006', array['Malzeme Satışı','Panel Dizilim Montajı','Borulama Montajı','Pano Montajı','Devreye Alma'], 8, 192, 96, 'Kapalı Devre', 'Tamamlandı', false, '2023-10-10', now() - interval '600 days'),
  ('p0000001-0000-0000-0000-000000000019', 'Sağlık Bakanlığı Kilis Sağlık Evi', 'f1000001-0000-0000-0000-000000000003', 'SB-2023-KLS-019', '2023-04-10', '2023-11-30', 'Kilis Merkez Sağlık Evi', 'Kilis', 'Merkez', 'a0000001-0000-0000-0000-000000000007', array['Malzeme Satışı','Panel Dizilim Montajı'], 2, 40, 20, 'Açık Devre', 'Tamamlandı', false, '2023-11-15', now() - interval '450 days'),
  ('p0000001-0000-0000-0000-000000000020', 'GSB Adıyaman Yurt', 'f1000001-0000-0000-0000-000000000005', 'GSB-2023-ADY-031', '2023-03-01', '2023-09-30', 'Adıyaman GSB Yurt Şantiyesi', 'Adıyaman', 'Merkez', 'a0000001-0000-0000-0000-000000000008', array['Malzeme Satışı','Panel Dizilim Montajı'], 3, 60, 30, 'Kapalı Devre', 'Tamamlandı', false, '2023-09-20', now() - interval '500 days');

-- ── 2 Beklemede projesi ───────────────────────────────────────
insert into projeler(id, proje_adi, firma_id, sozlesme_no, sozlesme_tarihi, hedef_teslim_tarihi,
  santiye_adresi, il, ilce, satis_temsilcisi_id, montaj_kapsami,
  blok_sayisi, toplam_kollektor_sayisi, toplam_sehpa_sayisi, sistem_tipi,
  durum, manuel_durum, aktif_mi, son_hareket_tarihi)
values
  ('p0000001-0000-0000-0000-000000000021', 'TOKİ Kilis Konut Projesi', 'f1000001-0000-0000-0000-000000000001', 'TK-2025-KLS-003', '2025-01-05', '2026-03-31', 'Kilis Merkez TOKİ', 'Kilis', 'Merkez', 'a0000001-0000-0000-0000-000000000006', array['Malzeme Satışı','Panel Dizilim Montajı'], 6, 144, 72, 'Kapalı Devre', 'Beklemede', 'Beklemede', true, now() - interval '35 days'),
  ('p0000001-0000-0000-0000-000000000022', 'MEB Hatay Pansiyon', 'f1000001-0000-0000-0000-000000000006', 'MEB-2024-HAT-044', '2024-12-01', '2025-11-30', 'Hatay Merkez MEB', 'Hatay', 'Antakya', 'a0000001-0000-0000-0000-000000000007', array['Malzeme Satışı'], 4, 80, 40, 'Açık Devre', 'Beklemede', 'Beklemede', true, now() - interval '40 days');

-- ── 2 İptal projesi ──────────────────────────────────────────
insert into projeler(id, proje_adi, firma_id, sozlesme_no, sozlesme_tarihi,
  santiye_adresi, il, ilce, satis_temsilcisi_id, montaj_kapsami,
  blok_sayisi, toplam_kollektor_sayisi, toplam_sehpa_sayisi, sistem_tipi,
  durum, manuel_durum, aktif_mi, son_hareket_tarihi)
values
  ('p0000001-0000-0000-0000-000000000023', 'Özel Sektör Ankara İptal', 'f1000001-0000-0000-0000-000000000008', 'OK-2024-ANK-002', '2024-03-01', 'Ankara Çankaya', 'Ankara', 'Çankaya', 'a0000001-0000-0000-0000-000000000008', array['Malzeme Satışı'], 2, 40, 20, 'Açık Devre', 'İptal', 'İptal', false, now() - interval '180 days'),
  ('p0000001-0000-0000-0000-000000000024', 'Belediye Adıyaman İptal', 'f1000001-0000-0000-0000-000000000007', 'ADB-2024-001', '2024-01-15', 'Adıyaman Belediye', 'Adıyaman', 'Merkez', 'a0000001-0000-0000-0000-000000000006', array['Malzeme Satışı'], 3, 60, 30, 'Kapalı Devre', 'İptal', 'İptal', false, now() - interval '200 days');

-- ============================================================
-- 5. BLOKLAR VE AŞAMALAR
-- ============================================================

-- P1: 12 blok, 11 tamamlandı (kabul kriteri testi)
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000001', 11, 'harf', 'tamam');
-- 12. blok: 4 aşama tamamlandı, son aşama devam ediyor
do $$ declare v_blok_id uuid; begin
  insert into bloklar(id, proje_id, blok_adi, sira_no)
  values(gen_random_uuid(), 'p0000001-0000-0000-0000-000000000001', 'L Blok', 12)
  returning id into v_blok_id;
  insert into blok_asamalari(blok_id, asama_tipi, sira_no, durum, sonuc, kontrol_tarihi, kontrol_eden_id)
  values
    (v_blok_id,'Kaide Kontrolü',1,'Tamamlandı','Uygun',now()-interval '20 days','a0000001-0000-0000-0000-000000000004'),
    (v_blok_id,'Dizilim',2,'Tamamlandı','Uygun',now()-interval '15 days','a0000001-0000-0000-0000-000000000004'),
    (v_blok_id,'Borulama',3,'Tamamlandı','Uygun',now()-interval '10 days','a0000001-0000-0000-0000-000000000005'),
    (v_blok_id,'Pano Bağlantısı',4,'Tamamlandı','Uygun',now()-interval '5 days','a0000001-0000-0000-0000-000000000005'),
    (v_blok_id,'Devreye Alma',5,'Devam Ediyor',null,null,null);
end $$;

-- P2: 8 blok, borulama aşamasında
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000002', 8, 'harf', 'yarisi');

-- P3: 4 blok, kaide kontrolünde
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000003', 4, 'sayi', 'kaide');

-- P4: 6 blok, yarısı tamamlandı
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000004', 6, 'harf', 'yarisi');

-- P5: 3 blok, yeni başladı
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000005', 3, 'sayi', 'kaide');

-- P6: 5 blok, ileri aşama
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000006', 5, 'harf', 'ileri');

-- P7-P14: çeşitli profiller
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000007', 16, 'harf', 'kaide');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000008', 10, 'sayi', 'yarisi');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000009', 7, 'harf', 'ileri');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000010', 4, 'sayi', 'yarisi');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000011', 2, 'harf', 'kaide');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000012', 5, 'sayi', 'yarisi');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000013', 3, 'harf', 'bos');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000014', 9, 'harf', 'ileri');

-- Tamamlandı projeleri (tüm aşamalar uygun)
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000015', 4, 'harf', 'tamam');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000016', 3, 'sayi', 'tamam');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000017', 2, 'harf', 'tamam');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000018', 8, 'sayi', 'tamam');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000019', 2, 'harf', 'tamam');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000020', 3, 'sayi', 'tamam');

-- Beklemede projeleri (blok var ama aşama yok)
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000021', 6, 'harf', 'bos');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000022', 4, 'sayi', 'bos');

-- İptal projeleri
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000023', 2, 'harf', 'bos');
select seed_blok_ve_asama('p0000001-0000-0000-0000-000000000024', 3, 'sayi', 'bos');

-- Tamamlandı projelerinin durumunu güncelle (trigger çalışmış olmalı ama emin olalım)
select hesapla_proje_durumu(p.id) from projeler p
where id in (
  'p0000001-0000-0000-0000-000000000015',
  'p0000001-0000-0000-0000-000000000016',
  'p0000001-0000-0000-0000-000000000017',
  'p0000001-0000-0000-0000-000000000018',
  'p0000001-0000-0000-0000-000000000019',
  'p0000001-0000-0000-0000-000000000020'
);

-- ============================================================
-- 6. HATALAR (35 kayıt)
-- ============================================================
insert into hatalar(hata_kodu, proje_id, blok_id, kategori, siddet, sorumlu_taraf,
  aciklama, tespit_eden_id, tespit_tarihi, atanan_id, son_tarih, durum, tekrar_sayisi)
select
  'HT-' || extract(year from now())::text || '-' || lpad(row_number() over ()::text, 4, '0'),
  v.proje_id,
  (select id from bloklar where proje_id = v.proje_id order by sira_no limit 1 offset (row_number() over () % 3)),
  v.kategori, v.siddet, v.sorumlu_taraf, v.aciklama,
  'a0000001-0000-0000-0000-000000000004',
  now() - (interval '1 day' * v.gun_once),
  'a0000001-0000-0000-0000-000000000002',
  current_date + (interval '1 day' * v.son_tarih_gun),
  v.durum, v.tekrar
from (values
  ('p0000001-0000-0000-0000-000000000001','kot hatası','Majör','Şimşek Solar Ekibi','A Bloğunda kaide kotunun 5 cm yüksek tutulduğu tespit edildi, düzeltme gerekiyor.',5,7,'Açık',1),
  ('p0000001-0000-0000-0000-000000000001','sehpa açısı hatalı','Kritik','Ana Yüklenici','Sehpa açısı 30° yerine 25° monte edilmiş, güneş açısına göre verim düşük kalacak.',10,-2,'Düzeltiliyor',2),
  ('p0000001-0000-0000-0000-000000000001','izolasyon eksik','Minör','Şimşek Solar Ekibi','C Bloğunda borulama izolasyonu 40 cm eksik bırakılmış.',3,14,'Açık',1),
  ('p0000001-0000-0000-0000-000000000002','eğim hatası','Majör','Taşeron','B Bloğunda boru eğimi yetersiz, hava cebi oluşabilir.',7,5,'Açık',1),
  ('p0000001-0000-0000-0000-000000000002','kablo kesiti yanlış','Kritik','Şimşek Solar Ekibi','Pano bağlantısında kullanılan kablo kesiti spesifikasyonun altında.',15,-5,'Yeniden Kontrolde',3),
  ('p0000001-0000-0000-0000-000000000003','ankraj eksik','Majör','Ana Yüklenici','2. Bloğun kaidesinde 4 adet ankraj eksik, statik hesabı tehlikeli.',12,3,'Açık',1),
  ('p0000001-0000-0000-0000-000000000003','conta sızdırma','Minör','Şimşek Solar Ekibi','Kolektör girişinde conta düzgün sıkıştırılmamış, küçük sızıntı var.',2,21,'Açık',1),
  ('p0000001-0000-0000-0000-000000000004','basınç düşük','Kritik','Şimşek Solar Ekibi','Devreye almada sistem basıncı 1.8 bar olması gerekirken 1.2 bar ölçüldü.',20,-3,'Açık',1),
  ('p0000001-0000-0000-0000-000000000004','pompa yönü ters','Majör','Taşeron','D Bloğu pompa bağlantısı ters yapılmış, sirkülasyon sağlanamıyor.',25,-8,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000005','topraklama eksik','Kritik','Şimşek Solar Ekibi','Pano topraklama bağlantısı yapılmamış, iş güvenliği riski mevcut.',8,2,'Açık',1),
  ('p0000001-0000-0000-0000-000000000005','kollektör hasarlı','Majör','Malzeme/Üretim','A Bloğunda 2 adet kollektör iç boru hasarlı, değiştirilmesi gerekiyor.',5,10,'Düzeltiliyor',1),
  ('p0000001-0000-0000-0000-000000000006','gölgelenme','Minör','Ana Yüklenici','B Bloğu kolektörlerinin bir kısmı kuzey bacasından gölge alıyor.',30,30,'Kabul Edildi',1),
  ('p0000001-0000-0000-0000-000000000006','boru çapı yanlış','Majör','Şimşek Solar Ekibi','Ana besleme borusu DN25 yerine DN20 kullanılmış, değiştirilmesi gerekiyor.',18,-10,'Kapandı',2),
  ('p0000001-0000-0000-0000-000000000009','ölçü hatası','Majör','Ana Yüklenici','E Bloğu kaide boyutu planın 10cm dışında, yeniden yapım gerekebilir.',35,-1,'Açık',1),
  ('p0000001-0000-0000-0000-000000000009','kaynak hatası','Kritik','Taşeron','F Bloğu boru kaynak dikişi standarda uygun değil, basınç testinde kaçak verdi.',40,-15,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000010','askı eksik','Minör','Şimşek Solar Ekibi','Ana boru hattında 6 m aralık olması gerekirken 8 m bırakılmış.',6,12,'Açık',1),
  ('p0000001-0000-0000-0000-000000000010','sensör bağlantısı','Majör','Şimşek Solar Ekibi','Isı sensörü kolektör gövdesine değil kılıf borusuna monte edilmiş, hatalı ölçüm.',22,4,'Açık',1),
  ('p0000001-0000-0000-0000-000000000014','etiketleme eksik','Minör','Şimşek Solar Ekibi','Pano içi eleman etiketlemesi eksik, bakım için tehlike.',4,20,'Açık',1),
  ('p0000001-0000-0000-0000-000000000014','yalıtım delinmiş','Majör','Taşeron','B Bloğu kaidesinde ısı yalıtımı ankraj montajı sırasında delinmiş.',16,-4,'Yeniden Kontrolde',1),
  ('p0000001-0000-0000-0000-000000000007','sigorta eksik','Kritik','Şimşek Solar Ekibi','Pano sigortası eksik, kısa devre koruması yok.',9,1,'Açık',1),
  ('p0000001-0000-0000-0000-000000000007','sehpa sabitleme eksik','Majör','Ana Yüklenici','C Bloğu sehpa sabitleme vidaları eksik, rüzgar yüküne dayanamaz.',14,-6,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000008','genleşme tankı','Majör','Şimşek Solar Ekibi','Genleşme tankı basıncı 1.5 bar olması gerekirken 3 bar şarj edilmiş.',28,-12,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000008','kollektör sırası','Minör','Taşeron','A Bloğunda kolektör sıralaması projeden farklı, estetik sorun.',45,45,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000011','kaide yönü','Majör','Ana Yüklenici','Kaide güneye değil kuzeye bakar konumda inşa edilmiş, yıkılıp yeniden yapılacak.',50,-20,'Kapandı',2),
  ('p0000001-0000-0000-0000-000000000012','beton mukavemeti','Kritik','Ana Yüklenici','Kaide beton numunesi C20 yerine C12 çıktı, statik hesap gerekiyor.',60,-25,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000013','iş güvenliği','Majör','Taşeron','Çatıda emniyet kemeri kullanılmıyor, tehlikeli.',3,3,'Açık',1),
  ('p0000001-0000-0000-0000-000000000015','kot hatası','Minör','Ana Yüklenici','A Bloğu kotunda 2 cm sapma var, kabul edildi.',90,-90,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000015','conta sızdırma','Majör','Şimşek Solar Ekibi','Kolektör çıkış contası değiştirildi.',95,-95,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000016','boru çapı','Minör','Taşeron','Boru çapı düzeltildi.',120,-120,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000018','eğim hatası','Majör','Taşeron','Eğim düzeltildi ve boru hattı yeniden çekildi.',200,-200,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000018','gölgelenme','Minör','Ana Yüklenici','Sehpa yükseltilerek gölgelenme sorunu giderildi.',210,-210,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000002','malzeme eksik','Majör','Belirsiz','C bloğu borulama malzemesi sahaya ulaşmadı, tedarik bekleniyor.',1,7,'Açık',1),
  ('p0000001-0000-0000-0000-000000000003','temizlik','Minör','Şimşek Solar Ekibi','Çalışma sahası temizlik standardı altında, uyarı verildi.',4,21,'Kapandı',1),
  ('p0000001-0000-0000-0000-000000000004','otomasyon parametresi','Kritik','Şimşek Solar Ekibi','Sıcak su sirkülasyon otomasyon parametresi yanlış girilmiş.',28,-9,'Açık',1),
  ('p0000001-0000-0000-0000-000000000006','malzeme hasarlı','Majör','Malzeme/Üretim','Sevk edilen 3 adet boyler ambalaj hasarlı teslim alındı.',15,10,'Düzeltiliyor',1)
) as v(proje_id, kategori, siddet, sorumlu_taraf, aciklama, gun_once, son_tarih_gun, durum, tekrar);

-- ============================================================
-- 7. EKSİK İMALATLAR (20 kayıt, 6 engelleyici)
-- ============================================================
insert into eksik_imalatlar(proje_id, blok_id, asama_tipi, kalem, planlanan_adet, mevcut_adet,
  engelleyici_mi, sorumlu_taraf, tahmini_kapanma_tarihi, durum) values
  ('p0000001-0000-0000-0000-000000000001', (select id from bloklar where proje_id='p0000001-0000-0000-0000-000000000001' and sira_no=12 limit 1), 'Devreye Alma', 'Genleşme tankı basınç şarjı', 1, 0, true, 'Şimşek Solar Ekibi', current_date+7, 'Açık'),
  ('p0000001-0000-0000-0000-000000000002', null, 'Borulama', 'DN25 boru izolasyonu (m)', 120, 60, false, 'Şimşek Solar Ekibi', current_date+10, 'Sipariş Verildi'),
  ('p0000001-0000-0000-0000-000000000002', null, 'Borulama', 'Flanş kelepçesi', 24, 12, true, 'Taşeron', current_date+5, 'Açık'),
  ('p0000001-0000-0000-0000-000000000003', null, 'Kaide Kontrolü', 'Ankraj vidası M12×150', 32, 16, true, 'Ana Yüklenici', current_date+3, 'Açık'),
  ('p0000001-0000-0000-0000-000000000004', null, 'Pano Bağlantısı', 'Topraklama iletken (m)', 80, 40, true, 'Şimşek Solar Ekibi', current_date+4, 'Sahaya Sevk Edildi'),
  ('p0000001-0000-0000-0000-000000000005', null, 'Dizilim', 'Sehpa kelepçesi', 48, 36, false, 'Şimşek Solar Ekibi', current_date+14, 'Açık'),
  ('p0000001-0000-0000-0000-000000000006', null, 'Borulama', 'Köpük izolasyon bant (m)', 200, 120, false, 'Taşeron', current_date+7, 'Açık'),
  ('p0000001-0000-0000-0000-000000000007', null, 'Kaide Kontrolü', 'Zemin hazırlığı (m²)', 800, 400, true, 'Ana Yüklenici', current_date+21, 'Açık'),
  ('p0000001-0000-0000-0000-000000000008', null, 'Dizilim', 'Kollektör tutma rayı (adet)', 60, 45, false, 'Şimşek Solar Ekibi', current_date+5, 'Sipariş Verildi'),
  ('p0000001-0000-0000-0000-000000000009', null, 'Borulama', 'Hava alma vanaları', 14, 7, true, 'Şimşek Solar Ekibi', current_date+2, 'Açık'),
  ('p0000001-0000-0000-0000-000000000010', null, 'Pano Bağlantısı', 'Sigorta NH-1 160A', 4, 2, false, 'Şimşek Solar Ekibi', current_date+7, 'Açık'),
  ('p0000001-0000-0000-0000-000000000011', null, 'Kaide Kontrolü', 'Kaide kalıbı (m²)', 100, 0, false, 'Ana Yüklenici', current_date+30, 'Açık'),
  ('p0000001-0000-0000-0000-000000000012', null, 'Dizilim', 'Galvaniz vida M8×30 (kutu)', 5, 3, false, 'Şimşek Solar Ekibi', current_date+5, 'Tamamlandı'),
  ('p0000001-0000-0000-0000-000000000013', null, 'Kaide Kontrolü', 'Beton döküm', 3, 0, false, 'Ana Yüklenici', current_date+60, 'Açık'),
  ('p0000001-0000-0000-0000-000000000014', null, 'Borulama', 'Boru askı klipsi', 90, 60, false, 'Taşeron', current_date+10, 'Sipariş Verildi'),
  ('p0000001-0000-0000-0000-000000000004', null, 'Devreye Alma', 'Pompa yönü düzeltme işçiliği', 6, 0, false, 'Şimşek Solar Ekibi', current_date+2, 'Açık'),
  ('p0000001-0000-0000-0000-000000000009', null, 'Kaide Kontrolü', 'Harç + sıva tamirat', 5, 0, false, 'Ana Yüklenici', current_date+14, 'Açık'),
  ('p0000001-0000-0000-0000-000000000001', null, 'Pano Bağlantısı', 'Kablo kanalı kapağı', 24, 18, false, 'Şimşek Solar Ekibi', current_date+5, 'Tamamlandı'),
  ('p0000001-0000-0000-0000-000000000006', null, 'Devreye Alma', 'Pompa parametresi ayarı', 5, 3, false, 'Şimşek Solar Ekibi', current_date+3, 'Açık'),
  ('p0000001-0000-0000-0000-000000000010', null, 'Borulama', 'Boru birleştirme parçaları', 20, 10, false, 'Şimşek Solar Ekibi', current_date+7, 'Sahaya Sevk Edildi');

-- ============================================================
-- 8. SAHA RAPORLARI (15 rapor)
-- ============================================================
insert into saha_raporlari(proje_id, rapor_tarihi, hazirlayan_id, rapor_tipi,
  ozet, tespit_edilen_hatalar, yapilan_islemler, sonraki_adim,
  gonderildi_mi, gonderim_tarihi, gonderilen_epostalar, gonderim_durumu) values
  ('p0000001-0000-0000-0000-000000000001', current_date-30, 'a0000001-0000-0000-0000-000000000002', 'Kaide Kontrol', 'A-K Blokları kaide kontrolleri tamamlandı, L Blok devam ediyor.', 'A Bloğunda kot hatası, F Bloğu ankraj eksik.', 'A-K blokları kaide onaylandı. Hata raporları açıldı.', 'L Blok kaidesi için randevu alındı.', true, (current_date-29)::timestamptz, array['selin@simseksolar.com.tr','gaziantep3@toki.gov.tr'], 'Başarılı'),
  ('p0000001-0000-0000-0000-000000000001', current_date-15, 'a0000001-0000-0000-0000-000000000002', 'Montaj Kontrol', 'A-H Blok dizilim montajı tamamlandı, sehpa açısı hatası düzeltildi.', null, 'Sehpa açısı 30°a getirildi, yeniden onay alındı.', 'Borulama ekibinin sahaya girmesi planlandı.', true, (current_date-14)::timestamptz, array['selin@simseksolar.com.tr','gaziantep3@toki.gov.tr'], 'Başarılı'),
  ('p0000001-0000-0000-0000-000000000002', current_date-20, 'a0000001-0000-0000-0000-000000000003', 'İlk Keşif', 'Şantiye keşfi yapıldı, blok konumları belirlendi.', 'Kuzey yönünde komşu bina gölge riski.', 'Konstrüktif analiz yapıldı, teknik uygunluk raporu hazırlandı.', 'Proje onayı için firma yetkilisi ile toplantı.', true, (current_date-19)::timestamptz, array['burak@simseksolar.com.tr','urfa@toki.gov.tr'], 'Başarılı'),
  ('p0000001-0000-0000-0000-000000000002', current_date-5, 'a0000001-0000-0000-0000-000000000004', 'Kaide Kontrol', 'A-D Blok kaide kontrolleri yapıldı.', 'E Blok ankraj eksik, F Blok beton kürü yeterli değil.', 'A-D blok onaylandı.', 'E ve F bloğun tamiratı yapıldıktan sonra tekrar kontrol.', true, (current_date-4)::timestamptz, array['burak@simseksolar.com.tr','urfa@toki.gov.tr'], 'Başarılı'),
  ('p0000001-0000-0000-0000-000000000003', current_date-10, 'a0000001-0000-0000-0000-000000000004', 'Kaide Kontrol', '1. ve 2. Blok kaide kontrolleri yapıldı.', '2. Bloğun ankrajlarından 4 tanesi eksik.', '1. Blok kaidesi onaylandı.', '2. Blok için ankraj tamamlandıktan sonra tekrar kontrol.', true, (current_date-9)::timestamptz, array['musa@simseksolar.com.tr','adiyaman@saglik.gov.tr'], 'Başarılı'),
  ('p0000001-0000-0000-0000-000000000004', current_date-8, 'a0000001-0000-0000-0000-000000000005', 'Montaj Kontrol', 'A-C Blok dizilim ve borulama kontrolleri.', 'Pano bağlantısında kablo kesiti uygunsuz.', 'A-C blok borulama onaylandı.', 'D-F blok için ekip koordinasyonu.', true, (current_date-7)::timestamptz, array['hakan@simseksolar.com.tr','maras@gsb.gov.tr'], 'Başarılı'),
  ('p0000001-0000-0000-0000-000000000005', current_date-12, 'a0000001-0000-0000-0000-000000000002', 'İlk Keşif', 'MEB Osmaniye sahası ilk keşif raporu.', null, 'Saha ölçüleri alındı, teknik şartname hazırlandı.', 'Onay için MEB teknik ofisine gönderim.', true, (current_date-11)::timestamptz, array['selin@simseksolar.com.tr','osmaniye@meb.gov.tr'], 'Başarılı'),
  ('p0000001-0000-0000-0000-000000000006', current_date-3, 'a0000001-0000-0000-0000-000000000003', 'Ara Kontrol', 'A-D Blok pano bağlantı kontrolleri tamamlandı.', 'B Bloğu gölgelenme sorunu tespit edildi (kabul edildi).', 'A-D blok pano onaylandı.', 'E Blok devreye alma planlanıyor.', true, (current_date-2)::timestamptz, array['burak@simseksolar.com.tr','proje@gaziantep.bel.tr'], 'Başarılı'),
  -- 2 başarısız gönderim
  ('p0000001-0000-0000-0000-000000000009', current_date-2, 'a0000001-0000-0000-0000-000000000004', 'Ara Kontrol', 'E-G Blok borulama kontrolü.', 'E Blok ölçü hatası.', 'Kontroller yapıldı, hata kayıtları açıldı.', 'Düzeltme sonrası tekrar kontrol.', true, (current_date-1)::timestamptz, array['musa@simseksolar.com.tr','adana@adalet.gov.tr'], 'Hatalı'),
  ('p0000001-0000-0000-0000-000000000014', current_date-1, 'a0000001-0000-0000-0000-000000000005', 'Montaj Kontrol', 'A-F Blok dizilim ve borulama.', null, 'Kontroller yapıldı.', 'G-I Blok ekip koordinasyonu.', true, current_date::timestamptz, array['hakan@simseksolar.com.tr'], 'Hatalı'),
  -- 1 taslak
  ('p0000001-0000-0000-0000-000000000007', current_date, 'a0000001-0000-0000-0000-000000000004', 'Kaide Kontrol', 'A-D Blok ilk kaide kontrolü taslak.', null, null, null, false, null, '{}', null),
  -- Diğer gönderilmiş raporlar
  ('p0000001-0000-0000-0000-000000000015', current_date-200, 'a0000001-0000-0000-0000-000000000002', 'Kesin Teslim', 'Proje tamamlandı, tüm bloklar devreye alındı.', null, 'Kesin teslim tutanağı imzalandı.', null, true, (current_date-199)::timestamptz, array['selin@simseksolar.com.tr','gaziantep@adalet.gov.tr'], 'Başarılı'),
  ('p0000001-0000-0000-0000-000000000018', current_date-600, 'a0000001-0000-0000-0000-000000000003', 'Kesin Teslim', 'TOKİ Şanlıurfa 1. Etap tamamlandı.', null, 'Teslim tutanağı imzalandı.', null, true, (current_date-599)::timestamptz, array['burak@simseksolar.com.tr','urfa@toki.gov.tr'], 'Başarılı'),
  ('p0000001-0000-0000-0000-000000000010', current_date-4, 'a0000001-0000-0000-0000-000000000005', 'Devreye Alma', 'Hatay GSB 1. ve 2. Blok devreye alma.', null, 'Sistem çalışıyor, sıcak su üretiliyor.', '3. ve 4. Blok devreye alma randevusu alındı.', true, (current_date-3)::timestamptz, array['hakan@simseksolar.com.tr','hatay@gsb.gov.tr'], 'Başarılı'),
  ('p0000001-0000-0000-0000-000000000013', current_date-35, 'a0000001-0000-0000-0000-000000000004', 'İlk Keşif', 'Şanlıurfa Belediye sosyal tesis keşif raporu.', null, 'Saha analizi yapıldı.', null, true, (current_date-34)::timestamptz, array['musa@simseksolar.com.tr'], 'Başarılı');

-- ============================================================
-- 9. ŞANTİYE YETKİLİLERİ
-- ============================================================
insert into santiye_yetkilileri(proje_id, ad_soyad, gorevi, telefon, eposta, birincil_mi) values
  ('p0000001-0000-0000-0000-000000000001', 'Hüseyin Erdoğan', 'Şantiye Şefi', '0532 701 23 45', 'h.erdogan@ozguninsaat.com', true),
  ('p0000001-0000-0000-0000-000000000001', 'Kadir Polat', 'Kontrol Amiri', '0533 801 34 56', null, false),
  ('p0000001-0000-0000-0000-000000000002', 'Mehmet Başaran', 'Şantiye Şefi', '0534 901 45 67', 'm.basaran@yildizyapi.com', true),
  ('p0000001-0000-0000-0000-000000000003', 'Semih Kaya', 'Teknik Ofis', '0535 101 56 78', 's.kaya@akaryapi.com', true),
  ('p0000001-0000-0000-0000-000000000004', 'Ramazan Demir', 'Şantiye Şefi', '0536 201 67 89', null, true),
  ('p0000001-0000-0000-0000-000000000006', 'Ömer Aydın', 'Kontrol Amiri', '0537 301 78 90', 'o.aydin@gaziantep.bel.tr', true);

-- ============================================================
-- 10. RAPOR ALICILARI
-- ============================================================
insert into rapor_alicilari(proje_id, eposta, ad_soyad, alici_tipi, aktif_mi) values
  ('p0000001-0000-0000-0000-000000000001', 'gaziantep3@toki.gov.tr', 'TOKİ Gaziantep Teknik Ofis', 'Kime', true),
  ('p0000001-0000-0000-0000-000000000001', 'h.erdogan@ozguninsaat.com', 'Hüseyin Erdoğan', 'Kime', true),
  ('p0000001-0000-0000-0000-000000000001', 'selin@simseksolar.com.tr', 'Selin Yılmaz', 'Bilgi', true),
  ('p0000001-0000-0000-0000-000000000002', 'urfa@toki.gov.tr', 'TOKİ Şanlıurfa', 'Kime', true),
  ('p0000001-0000-0000-0000-000000000003', 'adiyaman@saglik.gov.tr', 'Sağlık Bakanlığı Adıyaman', 'Kime', true),
  ('p0000001-0000-0000-0000-000000000004', 'maras@gsb.gov.tr', 'GSB Kahramanmaraş', 'Kime', true),
  ('p0000001-0000-0000-0000-000000000006', 'proje@gaziantep.bel.tr', 'GBB Proje Müdürlüğü', 'Kime', true);

-- ============================================================
-- 11. AKTİVİTE LOGU (Son 6 aya yayılmış)
-- ============================================================
insert into aktivite_logu(kullanici_id, tarih, tablo, kayit_id, proje_id, islem, alan, yeni_deger) values
  ('a0000001-0000-0000-0000-000000000001', now()-interval '180 days', 'projeler', 'p0000001-0000-0000-0000-000000000015', 'p0000001-0000-0000-0000-000000000015', 'ekleme', null, 'Proje oluşturuldu'),
  ('a0000001-0000-0000-0000-000000000002', now()-interval '150 days', 'blok_asamalari', gen_random_uuid(), 'p0000001-0000-0000-0000-000000000015', 'guncelleme', 'durum', 'Tamamlandı'),
  ('a0000001-0000-0000-0000-000000000002', now()-interval '120 days', 'projeler', 'p0000001-0000-0000-0000-000000000015', 'p0000001-0000-0000-0000-000000000015', 'guncelleme', 'durum', 'Tamamlandı'),
  ('a0000001-0000-0000-0000-000000000003', now()-interval '90 days', 'projeler', 'p0000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000001', 'ekleme', null, 'Proje oluşturuldu'),
  ('a0000001-0000-0000-0000-000000000004', now()-interval '60 days', 'blok_asamalari', gen_random_uuid(), 'p0000001-0000-0000-0000-000000000001', 'guncelleme', 'durum', 'Tamamlandı'),
  ('a0000001-0000-0000-0000-000000000005', now()-interval '45 days', 'blok_asamalari', gen_random_uuid(), 'p0000001-0000-0000-0000-000000000001', 'guncelleme', 'durum', 'Tamamlandı'),
  ('a0000001-0000-0000-0000-000000000002', now()-interval '30 days', 'hatalar', gen_random_uuid(), 'p0000001-0000-0000-0000-000000000001', 'ekleme', null, 'Hata açıldı: kot hatası'),
  ('a0000001-0000-0000-0000-000000000004', now()-interval '20 days', 'blok_asamalari', gen_random_uuid(), 'p0000001-0000-0000-0000-000000000002', 'guncelleme', 'durum', 'Tamamlandı'),
  ('a0000001-0000-0000-0000-000000000003', now()-interval '15 days', 'saha_raporlari', gen_random_uuid(), 'p0000001-0000-0000-0000-000000000001', 'gonderim', null, 'Rapor gönderildi'),
  ('a0000001-0000-0000-0000-000000000001', now()-interval '10 days', 'projeler', 'p0000001-0000-0000-0000-000000000007', 'p0000001-0000-0000-0000-000000000007', 'ekleme', null, 'Proje oluşturuldu'),
  ('a0000001-0000-0000-0000-000000000005', now()-interval '8 days', 'blok_asamalari', gen_random_uuid(), 'p0000001-0000-0000-0000-000000000001', 'guncelleme', 'durum', 'Tamamlandı'),
  ('a0000001-0000-0000-0000-000000000004', now()-interval '5 days', 'blok_asamalari', gen_random_uuid(), 'p0000001-0000-0000-0000-000000000003', 'guncelleme', 'durum', 'Tamamlandı'),
  ('a0000001-0000-0000-0000-000000000002', now()-interval '3 days', 'hatalar', gen_random_uuid(), 'p0000001-0000-0000-0000-000000000004', 'ekleme', null, 'Hata açıldı: basınç düşük'),
  ('a0000001-0000-0000-0000-000000000005', now()-interval '2 days', 'blok_asamalari', gen_random_uuid(), 'p0000001-0000-0000-0000-000000000001', 'guncelleme', 'durum', 'Tamamlandı'),
  ('a0000001-0000-0000-0000-000000000003', now()-interval '1 day', 'saha_raporlari', gen_random_uuid(), 'p0000001-0000-0000-0000-000000000006', 'gonderim', null, 'Rapor gönderildi');

-- ============================================================
-- 12. BİLDİRİMLER
-- ============================================================
insert into bildirimler(kullanici_id, tip, baslik, mesaj, hedef_url, okundu_mu) values
  ('a0000001-0000-0000-0000-000000000001', 'hata_acildi', 'Kritik hata açıldı', 'P1 — A Bloğunda sehpa açısı hatası (Kritik)', '/projeler/p0000001-0000-0000-0000-000000000001', false),
  ('a0000001-0000-0000-0000-000000000002', 'hata_acildi', 'Kritik hata açıldı', 'P4 — Basınç düşük hatası tespit edildi', '/projeler/p0000001-0000-0000-0000-000000000004', false),
  ('a0000001-0000-0000-0000-000000000001', 'proje_tamamlandi', 'Proje tamamlandı', 'Adalet Bakanlığı Gaziantep Adliye projesi tamamlandı.', '/projeler/p0000001-0000-0000-0000-000000000015', true),
  ('a0000001-0000-0000-0000-000000000002', 'gecikme_uyarisi', 'Geciken proje', 'P9 — Adalet Bakanlığı Adana Adliye hedef teslim tarihi geçti.', '/projeler/p0000001-0000-0000-0000-000000000009', false);

-- MV yenile
refresh materialized view mv_proje_ozet;

-- Seed helper fonksiyonu temizle (artık gerekmez)
drop function if exists seed_blok_ve_asama(uuid, int, text, text);

select 'Seed tamamlandı: ' ||
  (select count(*) from projeler) || ' proje, ' ||
  (select count(*) from bloklar) || ' blok, ' ||
  (select count(*) from blok_asamalari) || ' aşama, ' ||
  (select count(*) from hatalar) || ' hata' as sonuc;
