-- ============================================================
-- Şimşek Solar V2 — Tam Veritabanı Şeması
-- Önce çalıştır: migrations/000_cleanup.sql
-- ============================================================

-- Uzantılar
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- Arama performansı için

-- ============================================================
-- YARDIMCI FONKSİYONLAR
-- ============================================================

create or replace function set_guncelleme_tarihi()
returns trigger language plpgsql as $$
begin new.guncelleme_tarihi = now(); return new; end; $$;

-- Yumuşak silme yardımcısı
create or replace function soft_delete()
returns trigger language plpgsql as $$
begin
  new.silindi_mi = true;
  new.silme_tarihi = now();
  return new;
end; $$;

-- ============================================================
-- 1. firmalar
-- ============================================================
create table firmalar (
  id                uuid primary key default gen_random_uuid(),
  ad                text not null,
  kurum_tipi        text not null check (kurum_tipi in (
    'TOKİ','Sağlık Bakanlığı','Adalet Bakanlığı',
    'Gençlik ve Spor Bakanlığı','MEB','Belediye','Özel Sektör','Diğer'
  )),
  ana_yuklenici     text,
  vergi_dairesi     text,
  vergi_no          text,
  adres             text,
  il                text,
  ilce              text,
  telefon           text,
  genel_eposta      text,
  notlar            text,
  aktif_mi          boolean not null default true,
  silindi_mi        boolean not null default false,
  silen_id          uuid,
  silme_tarihi      timestamptz,
  olusturma_tarihi  timestamptz not null default now(),
  guncelleme_tarihi timestamptz not null default now()
);

create trigger tr_firmalar_guncelleme before update on firmalar
  for each row execute function set_guncelleme_tarihi();

-- ============================================================
-- 2. bayiler
-- ============================================================
create table bayiler (
  id               uuid primary key default gen_random_uuid(),
  ad               text not null,
  yetkili_kisi     text,
  telefon          text,
  eposta           text,
  il               text,
  aktif_mi         boolean not null default true,
  silindi_mi       boolean not null default false,
  olusturma_tarihi timestamptz not null default now(),
  guncelleme_tarihi timestamptz not null default now()
);

create trigger tr_bayiler_guncelleme before update on bayiler
  for each row execute function set_guncelleme_tarihi();

-- ============================================================
-- 3. kullanicilar
-- ============================================================
create table kullanicilar (
  id                uuid primary key references auth.users(id) on delete cascade,
  ad_soyad          text not null,
  eposta            text not null unique,
  telefon           text,
  rol               text not null check (rol in (
    'yonetici','satis_sonrasi_sorumlusu','saha_teknisyeni',
    'satis_temsilcisi','bayi'
  )),
  bayi_id           uuid references bayiler(id),
  auth_user_id      uuid unique references auth.users(id),
  aktif_mi          boolean not null default true,
  son_giris_tarihi  timestamptz,
  olusturma_tarihi  timestamptz not null default now(),
  guncelleme_tarihi timestamptz not null default now(),
  constraint bayi_id_zorunlu check (
    rol != 'bayi' or bayi_id is not null
  )
);

create trigger tr_kullanicilar_guncelleme before update on kullanicilar
  for each row execute function set_guncelleme_tarihi();

-- ============================================================
-- 4. projeler
-- ============================================================
create sequence proje_sira_seq start 1;

create table projeler (
  id                        uuid primary key default gen_random_uuid(),
  proje_kodu                text not null unique
                              default ('SS-' || extract(year from now())::text || '-' ||
                                       lpad(nextval('proje_sira_seq')::text, 4, '0')),
  proje_adi                 text not null,
  firma_id                  uuid not null references firmalar(id),
  sozlesme_no               text,
  sozlesme_tarihi           date,
  hedef_teslim_tarihi       date,
  santiye_adresi            text not null,
  il                        text not null,
  ilce                      text,
  enlem                     numeric(10,7),
  boylam                    numeric(10,7),
  satis_temsilcisi_id       uuid not null references kullanicilar(id),
  bayi_id                   uuid references bayiler(id),
  montaj_kapsami            text[] not null default '{}',
  blok_sayisi               int not null default 1 check (blok_sayisi >= 1),
  toplam_kollektor_sayisi   int not null default 0,
  toplam_sehpa_sayisi       int not null default 0,
  toplam_pano_sayisi        int,
  boyler_sayisi             int,
  boyler_kapasitesi_lt      int,
  pompa_grubu_sayisi        int,
  genlesme_tanki_sayisi     int,
  sistem_tipi               text check (sistem_tipi in (
    'Açık Devre','Kapalı Devre','Basınçlı','Basınçsız','Merkezi Sistem'
  )),
  -- Durum (trigger ile hesaplanır)
  durum                     text not null default 'Çalışıyor' check (durum in (
    'Çalışıyor','Beklemede','Tamamlandı','İptal'
  )),
  manuel_durum              text check (manuel_durum in ('Beklemede','İptal')),
  aktif_mi                  boolean not null default true,
  tamamlanma_tarihi         date,
  son_hareket_tarihi        timestamptz default now(),
  notlar                    text,
  olusturan_id              uuid references kullanicilar(id),
  taslak_mi                 boolean not null default false,
  -- Yumuşak silme
  silindi_mi                boolean not null default false,
  silen_id                  uuid references kullanicilar(id),
  silme_tarihi              timestamptz,
  olusturma_tarihi          timestamptz not null default now(),
  guncelleme_tarihi         timestamptz not null default now()
);

create trigger tr_projeler_guncelleme before update on projeler
  for each row execute function set_guncelleme_tarihi();

-- ============================================================
-- 5. santiye_yetkilileri
-- ============================================================
create table santiye_yetkilileri (
  id          uuid primary key default gen_random_uuid(),
  proje_id    uuid not null references projeler(id) on delete cascade,
  ad_soyad    text not null,
  gorevi      text check (gorevi in (
    'Şantiye Şefi','Kontrol Amiri','Teknik Ofis','Taşeron Yetkilisi','Diğer'
  )),
  telefon     text,
  eposta      text,
  birincil_mi boolean not null default false,
  olusturma_tarihi timestamptz not null default now()
);

-- ============================================================
-- 6. rapor_alicilari
-- ============================================================
create table rapor_alicilari (
  id          uuid primary key default gen_random_uuid(),
  proje_id    uuid not null references projeler(id) on delete cascade,
  eposta      text not null,
  ad_soyad    text,
  alici_tipi  text not null default 'Kime' check (alici_tipi in ('Kime','Bilgi')),
  aktif_mi    boolean not null default true
);

-- ============================================================
-- 7. bloklar
-- ============================================================
create table bloklar (
  id               uuid primary key default gen_random_uuid(),
  proje_id         uuid not null references projeler(id) on delete cascade,
  blok_adi         text not null,
  sira_no          int not null,
  kollektor_sayisi int,
  sehpa_sayisi     int,
  pano_sayisi      int,
  kat_sayisi       int,
  daire_sayisi     int,
  olusturma_tarihi timestamptz not null default now(),
  unique(proje_id, sira_no)
);

-- ============================================================
-- 8. proje_dokumanlari
-- ============================================================
create table proje_dokumanlari (
  id               uuid primary key default gen_random_uuid(),
  proje_id         uuid not null references projeler(id) on delete cascade,
  dokuman_tipi     text not null check (dokuman_tipi in (
    'Kaide Projesi','Borulama Projesi','Uygulama Projesi'
  )),
  durum            text not null default 'Başlamadı' check (durum in (
    'Başlamadı','Hazırlanıyor','Müşteriye Gönderildi','Revizyon İstendi','Onaylandı'
  )),
  revizyon_no      text,
  hazirlayan_id    uuid references kullanicilar(id),
  gonderim_tarihi  timestamptz,
  onay_tarihi      timestamptz,
  aciklama         text,
  olusturma_tarihi  timestamptz not null default now(),
  guncelleme_tarihi timestamptz not null default now(),
  unique(proje_id, dokuman_tipi)
);

create trigger tr_proje_dokumanlari_guncelleme before update on proje_dokumanlari
  for each row execute function set_guncelleme_tarihi();

-- ============================================================
-- 9. blok_asamalari — Sistemin kalbi
-- ============================================================
create table blok_asamalari (
  id                       uuid primary key default gen_random_uuid(),
  blok_id                  uuid not null references bloklar(id) on delete cascade,
  asama_tipi               text not null check (asama_tipi in (
    'Kaide Kontrolü','Dizilim','Borulama','Pano Bağlantısı','Devreye Alma'
  )),
  sira_no                  int not null check (sira_no between 1 and 5),
  durum                    text not null default 'Başlamadı' check (durum in (
    'Başlamadı','Devam Ediyor','Tamamlandı'
  )),
  sonuc                    text check (sonuc in ('Uygun','Hatalı')),
  baslama_tarihi           timestamptz,
  kontrol_tarihi           timestamptz,
  kontrol_eden_id          uuid references kullanicilar(id),
  aciklama                 text,
  ilk_kontrol_sonucu       text check (ilk_kontrol_sonucu in ('Uygun','Hatalı')),
  kontrol_sayisi           int not null default 0,
  surum                    int not null default 1,  -- Optimistic locking
  olusturma_tarihi         timestamptz not null default now(),
  guncelleme_tarihi        timestamptz not null default now(),
  unique(blok_id, asama_tipi),
  -- Tamamlandı ise sonuc zorunlu
  constraint sonuc_zorunlu check (
    durum != 'Tamamlandı' or sonuc is not null
  ),
  -- Hatalı ise aciklama zorunlu (min 10 karakter)
  constraint hatali_aciklama_zorunlu check (
    sonuc != 'Hatalı' or (aciklama is not null and length(trim(aciklama)) >= 10)
  )
);

create trigger tr_blok_asamalari_guncelleme before update on blok_asamalari
  for each row execute function set_guncelleme_tarihi();

-- ============================================================
-- 10. hatalar — Bağımsız hata kaydı
-- ============================================================
create sequence hata_sira_seq start 1;

create table hatalar (
  id                 uuid primary key default gen_random_uuid(),
  hata_kodu          text not null unique
                       default ('HT-' || extract(year from now())::text || '-' ||
                                lpad(nextval('hata_sira_seq')::text, 4, '0')),
  proje_id           uuid not null references projeler(id) on delete cascade,
  blok_id            uuid references bloklar(id),
  blok_asama_id      uuid references blok_asamalari(id),
  kategori           text not null,
  siddet             text not null check (siddet in ('Kritik','Majör','Minör')),
  sorumlu_taraf      text not null check (sorumlu_taraf in (
    'Şimşek Solar Ekibi','Ana Yüklenici','Taşeron','Bayi',
    'Malzeme/Üretim','Belirsiz'
  )),
  aciklama           text not null check (length(trim(aciklama)) >= 10),
  kok_neden          text,
  tespit_eden_id     uuid references kullanicilar(id),
  tespit_tarihi      timestamptz not null default now(),
  atanan_id          uuid references kullanicilar(id),
  son_tarih          date,
  durum              text not null default 'Açık' check (durum in (
    'Açık','Düzeltiliyor','Yeniden Kontrolde','Kapandı','Kabul Edildi'
  )),
  kapanma_tarihi     timestamptz,
  kapatan_id         uuid references kullanicilar(id),
  tekrar_sayisi      int not null default 1,
  tahmini_maliyet    numeric(12,2),
  oncesi_fotograflar text[] default '{}',
  sonrasi_fotograflar text[] default '{}',
  olusturma_tarihi   timestamptz not null default now(),
  guncelleme_tarihi  timestamptz not null default now()
);

create trigger tr_hatalar_guncelleme before update on hatalar
  for each row execute function set_guncelleme_tarihi();

-- ============================================================
-- 11. eksik_imalatlar — Punch list
-- ============================================================
create table eksik_imalatlar (
  id                       uuid primary key default gen_random_uuid(),
  proje_id                 uuid not null references projeler(id) on delete cascade,
  blok_id                  uuid references bloklar(id),
  asama_tipi               text check (asama_tipi in (
    'Kaide Kontrolü','Dizilim','Borulama','Pano Bağlantısı','Devreye Alma'
  )),
  kalem                    text not null,
  planlanan_adet           int not null default 1,
  mevcut_adet              int not null default 0,
  engelleyici_mi           boolean not null default false,
  sorumlu_taraf            text,
  tahmini_kapanma_tarihi   date,
  durum                    text not null default 'Açık' check (durum in (
    'Açık','Sipariş Verildi','Sahaya Sevk Edildi','Tamamlandı'
  )),
  aciklama                 text,
  olusturan_id             uuid references kullanicilar(id),
  olusturma_tarihi         timestamptz not null default now(),
  guncelleme_tarihi        timestamptz not null default now()
);

create trigger tr_eksik_guncelleme before update on eksik_imalatlar
  for each row execute function set_guncelleme_tarihi();

-- ============================================================
-- 12. proje_malzemeleri
-- ============================================================
create table proje_malzemeleri (
  id                    uuid primary key default gen_random_uuid(),
  proje_id              uuid not null references projeler(id) on delete cascade,
  malzeme_adi           text not null,
  birim                 text not null default 'adet',
  planlanan_adet        int not null default 0,
  sevk_edilen_adet      int not null default 0,
  sahada_kullanilan_adet int not null default 0,
  iade_adet             int not null default 0,
  son_sevk_tarihi       date,
  olusturma_tarihi      timestamptz not null default now(),
  guncelleme_tarihi     timestamptz not null default now()
);

create trigger tr_malzeme_guncelleme before update on proje_malzemeleri
  for each row execute function set_guncelleme_tarihi();

-- ============================================================
-- 13. saha_raporlari
-- ============================================================
create sequence rapor_sira_seq start 1;

create table saha_raporlari (
  id                   uuid primary key default gen_random_uuid(),
  proje_id             uuid not null references projeler(id) on delete cascade,
  blok_idler           uuid[] not null default '{}',
  rapor_no             text not null unique
                         default ('SR-' || extract(year from now())::text || '-' ||
                                  lpad(nextval('rapor_sira_seq')::text, 4, '0')),
  rapor_tarihi         date not null default current_date,
  hazirlayan_id        uuid not null references kullanicilar(id),
  rapor_tipi           text not null check (rapor_tipi in (
    'İlk Keşif','Ara Kontrol','Kaide Kontrol','Montaj Kontrol',
    'Devreye Alma','Arıza/Servis','Kesin Teslim'
  )),
  ozet                 text not null,
  tespit_edilen_hatalar text,
  yapilan_islemler     text,
  sonraki_adim         text,
  pdf_url              text,
  gonderildi_mi        boolean not null default false,
  gonderim_tarihi      timestamptz,
  gonderilen_epostalar text[] default '{}',
  gonderim_durumu      text check (gonderim_durumu in ('Bekliyor','Başarılı','Hatalı')),
  hata_mesaji          text,
  deneme_sayisi        int not null default 0,
  olusturma_tarihi     timestamptz not null default now()
);

-- ============================================================
-- 14. dosyalar — Merkezi dosya tablosu
-- ============================================================
create table dosyalar (
  id           uuid primary key default gen_random_uuid(),
  sahip_tablo  text not null,
  sahip_id     uuid not null,
  dosya_tipi   text not null check (dosya_tipi in ('Fotoğraf','PDF','Çizim','Diğer')),
  url          text not null,
  dosya_adi    text,
  boyut        int,
  aciklama     text,
  yukleyen_id  uuid references kullanicilar(id),
  cekim_tarihi timestamptz,
  enlem        numeric(10,7),
  boylam       numeric(10,7),
  olusturma_tarihi timestamptz not null default now()
);

-- ============================================================
-- 15. aktivite_logu — DEĞİŞTİRİLEMEZ
-- ============================================================
create table aktivite_logu (
  id           uuid primary key default gen_random_uuid(),
  kullanici_id uuid references kullanicilar(id),
  tarih        timestamptz not null default now(),
  tablo        text not null,
  kayit_id     uuid,
  proje_id     uuid references projeler(id),
  islem        text not null check (islem in (
    'ekleme','guncelleme','silme','giris','gonderim','kural_asimi'
  )),
  alan         text,
  eski_deger   text,
  yeni_deger   text,
  gerekce      text,
  ip           inet
);

-- UPDATE ve DELETE yasak (immutable log)
create rule aktivite_log_guncelleme_yasak as
  on update to aktivite_logu do instead nothing;
create rule aktivite_log_silme_yasak as
  on delete to aktivite_logu do instead nothing;

-- ============================================================
-- 16. bildirimler
-- ============================================================
create table bildirimler (
  id               uuid primary key default gen_random_uuid(),
  kullanici_id     uuid not null references kullanicilar(id) on delete cascade,
  tip              text not null,
  baslik           text not null,
  mesaj            text,
  hedef_url        text,
  okundu_mu        boolean not null default false,
  olusturma_tarihi timestamptz not null default now()
);

-- ============================================================
-- 17. kayitli_gorunumler
-- ============================================================
create table kayitli_gorunumler (
  id             uuid primary key default gen_random_uuid(),
  kullanici_id   uuid not null references kullanicilar(id) on delete cascade,
  ad             text not null,
  ekran          text not null,
  filtreler      jsonb not null default '{}',
  varsayilan_mi  boolean not null default false,
  olusturma_tarihi timestamptz not null default now()
);

-- ============================================================
-- İNDEKSLER
-- ============================================================
create index idx_projeler_durum on projeler(durum) where silindi_mi = false;
create index idx_projeler_il on projeler(il) where silindi_mi = false;
create index idx_projeler_satis_temsilcisi on projeler(satis_temsilcisi_id);
create index idx_projeler_firma on projeler(firma_id);
create index idx_projeler_olusturma on projeler(olusturma_tarihi desc);
create index idx_projeler_son_hareket on projeler(son_hareket_tarihi desc);
create index idx_projeler_hedef_teslim on projeler(hedef_teslim_tarihi);
create index idx_projeler_arama on projeler using gin(
  to_tsvector('turkish', proje_adi || ' ' || proje_kodu)
);
create index idx_bloklar_proje_id on bloklar(proje_id);
create index idx_blok_asamalari_blok_id on blok_asamalari(blok_id);
create index idx_blok_asamalari_asama on blok_asamalari(asama_tipi, durum, sonuc);
create index idx_hatalar_proje_id on hatalar(proje_id);
create index idx_hatalar_durum on hatalar(durum);
create index idx_hatalar_son_tarih on hatalar(son_tarih) where durum not in ('Kapandı','Kabul Edildi');
create index idx_aktivite_logu_tarih on aktivite_logu(tarih desc);
create index idx_aktivite_logu_proje on aktivite_logu(proje_id, tarih desc);
create index idx_saha_raporlari_proje on saha_raporlari(proje_id);
create index idx_dosyalar_sahip on dosyalar(sahip_tablo, sahip_id);
create index idx_bildirimler_kullanici on bildirimler(kullanici_id, okundu_mu);

-- ============================================================
-- İŞ KURALLARI FONKSİYONLARI
-- ============================================================

-- Yardımcı: kullanıcı rolünü al
create or replace function auth_rol()
returns text language sql stable security definer as $$
  select rol from kullanicilar where id = auth.uid() and aktif_mi = true;
$$;

-- K1: Proje durumu otomatik hesaplama
create or replace function hesapla_proje_durumu(p_proje_id uuid)
returns void language plpgsql security definer as $$
declare
  v_blok_sayisi    int;
  v_devreye_alinan int;
  v_acik_hata      int;
  v_manuel_durum   text;
  v_eski_durum     text;
  v_yeni_durum     text;
begin
  select blok_sayisi, manuel_durum, durum
  into v_blok_sayisi, v_manuel_durum, v_eski_durum
  from projeler where id = p_proje_id;

  if not found then return; end if;

  select count(*) into v_devreye_alinan
  from bloklar b
  join blok_asamalari ba on ba.blok_id = b.id
  where b.proje_id = p_proje_id
    and ba.asama_tipi = 'Devreye Alma'
    and ba.durum = 'Tamamlandı' and ba.sonuc = 'Uygun';

  select count(*) into v_acik_hata
  from hatalar
  where proje_id = p_proje_id
    and durum in ('Açık','Düzeltiliyor','Yeniden Kontrolde');

  if v_manuel_durum = 'İptal' then
    v_yeni_durum := 'İptal';
  elsif v_manuel_durum = 'Beklemede' then
    v_yeni_durum := 'Beklemede';
  elsif v_blok_sayisi > 0
        and v_devreye_alinan = v_blok_sayisi
        and v_acik_hata = 0 then
    v_yeni_durum := 'Tamamlandı';
  else
    v_yeni_durum := 'Çalışıyor';
  end if;

  if v_yeni_durum = 'Tamamlandı' then
    update projeler set
      durum = 'Tamamlandı', aktif_mi = false,
      tamamlanma_tarihi = current_date,
      guncelleme_tarihi = now()
    where id = p_proje_id;
  elsif v_yeni_durum = 'İptal' then
    update projeler set
      durum = 'İptal', aktif_mi = false,
      guncelleme_tarihi = now()
    where id = p_proje_id;
  else
    update projeler set
      durum = v_yeni_durum,
      aktif_mi = (v_yeni_durum != 'İptal'),
      tamamlanma_tarihi = null,
      guncelleme_tarihi = now()
    where id = p_proje_id and durum != v_yeni_durum;
  end if;

  -- Geri dönüş logu
  if v_eski_durum = 'Tamamlandı' and v_yeni_durum != 'Tamamlandı' then
    insert into aktivite_logu(tablo, kayit_id, proje_id, islem, alan, eski_deger, yeni_deger)
    values('projeler', p_proje_id, p_proje_id, 'guncelleme', 'durum', 'Tamamlandı', v_yeni_durum);
  end if;
end; $$;

-- Trigger: blok_asamalari değişince proje durumunu yeniden hesapla
create or replace function tr_asama_sonrasi_durum()
returns trigger language plpgsql as $$
declare v_proje_id uuid;
begin
  select b.proje_id into v_proje_id
  from bloklar b where b.id = coalesce(new.blok_id, old.blok_id);

  perform hesapla_proje_durumu(v_proje_id);

  -- son_hareket_tarihi güncelle
  update projeler set son_hareket_tarihi = now()
  where id = v_proje_id;

  return coalesce(new, old);
end; $$;

create trigger tr_blok_asamasi_degisince
  after insert or update or delete on blok_asamalari
  for each row execute function tr_asama_sonrasi_durum();

-- K2: Hatalı aşama → otomatik hata kaydı (kategori/şiddet ön tanım)
create or replace function tr_hatali_asama_hata_ac()
returns trigger language plpgsql as $$
declare v_proje_id uuid;
begin
  if new.sonuc = 'Hatalı' and (old.sonuc is distinct from 'Hatalı') then
    select b.proje_id into v_proje_id from bloklar b where b.id = new.blok_id;

    insert into hatalar(
      proje_id, blok_id, blok_asama_id,
      kategori, siddet, sorumlu_taraf, aciklama,
      tespit_eden_id, tespit_tarihi, durum,
      son_tarih
    ) values (
      v_proje_id, new.blok_id, new.id,
      'Genel',  -- Kullanıcı sonradan güncelleyecek
      'Majör',
      'Belirsiz',
      coalesce(new.aciklama, 'Aşama kontrolünde hata tespit edildi. Detay için aşamaya bakın.'),
      new.kontrol_eden_id,
      coalesce(new.kontrol_tarihi, now()),
      'Açık',
      current_date + interval '7 days'
    );
  end if;
  return new;
end; $$;

create trigger tr_hatali_asama
  after update on blok_asamalari
  for each row execute function tr_hatali_asama_hata_ac();

-- K5/K6: Gecikme ve hareketsizlik hesabı (view ile)
-- K9: Optimistic locking — surum kontrolü
create or replace function tr_asama_surum_kontrol()
returns trigger language plpgsql as $$
begin
  if old.surum != new.surum - 1 then
    -- Başkası aynı anda güncelledi
    raise exception 'EŞZAMANLILIK_HATASI:% tarafından % tarihinde güncellendi',
      (select ad_soyad from kullanicilar where id = old.kontrol_eden_id),
      old.guncelleme_tarihi
      using errcode = 'P0001';
  end if;
  return new;
end; $$;

-- Not: surum kontrolü istemci tarafında da uygulanır
-- create trigger tr_surum_kontrol before update on blok_asamalari
--   for each row when (old.surum is not null) execute function tr_asama_surum_kontrol();

-- Yeni auth kullanıcısı → otomatik kullanicilar kaydı
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.kullanicilar(id, ad_soyad, eposta, rol, aktif_mi, auth_user_id)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'ad_soyad',
             split_part(new.email, '@', 1)),
    new.email,
    'satis_temsilcisi',
    true,
    new.id
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Mevcut auth kullanıcıları için eksik kayıt oluştur
insert into public.kullanicilar(id, ad_soyad, eposta, rol, aktif_mi, auth_user_id)
select u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email,'@',1)),
  u.email, 'satis_temsilcisi', true, u.id
from auth.users u
left join public.kullanicilar k on k.id = u.id
where k.id is null;

-- ============================================================
-- MATERİALİZED VIEW — Analitik performansı
-- ============================================================
create materialized view mv_proje_ozet as
select
  p.id,
  p.proje_kodu,
  p.proje_adi,
  p.durum,
  p.il,
  p.blok_sayisi,
  p.hedef_teslim_tarihi,
  p.tamamlanma_tarihi,
  p.son_hareket_tarihi,
  p.satis_temsilcisi_id,
  p.firma_id,
  f.kurum_tipi,
  count(distinct b.id) as toplam_blok,
  count(distinct ba.id) filter (
    where ba.durum = 'Tamamlandı' and ba.sonuc = 'Uygun'
  ) as tamamlanan_asama,
  count(distinct ba.id) as toplam_asama,
  case when count(distinct ba.id) > 0 then
    round(
      count(distinct ba.id) filter (where ba.durum='Tamamlandı' and ba.sonuc='Uygun')
      * 100.0 / count(distinct ba.id)
    )
  else 0 end as saha_yuzdesi,
  count(distinct h.id) filter (
    where h.durum in ('Açık','Düzeltiliyor','Yeniden Kontrolde')
  ) as acik_hata,
  case
    when p.hedef_teslim_tarihi < current_date
         and p.durum != 'Tamamlandı' then true
    else false
  end as gecikmis_mi,
  case
    when p.son_hareket_tarihi < now() - interval '30 days'
         and p.aktif_mi then true
    else false
  end as hareketsiz_mi
from projeler p
left join firmalar f on f.id = p.firma_id
left join bloklar b on b.proje_id = p.id
left join blok_asamalari ba on ba.blok_id = b.id
left join hatalar h on h.proje_id = p.id
where p.silindi_mi = false
group by p.id, f.kurum_tipi;

create unique index idx_mv_proje_ozet_id on mv_proje_ozet(id);
create index idx_mv_proje_ozet_durum on mv_proje_ozet(durum);
create index idx_mv_proje_ozet_il on mv_proje_ozet(il);

-- MV yenileme fonksiyonu
create or replace function yenile_proje_ozet()
returns void language sql security definer as $$
  refresh materialized view concurrently mv_proje_ozet;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table firmalar enable row level security;
alter table bayiler enable row level security;
alter table kullanicilar enable row level security;
alter table projeler enable row level security;
alter table santiye_yetkilileri enable row level security;
alter table rapor_alicilari enable row level security;
alter table bloklar enable row level security;
alter table proje_dokumanlari enable row level security;
alter table blok_asamalari enable row level security;
alter table hatalar enable row level security;
alter table eksik_imalatlar enable row level security;
alter table proje_malzemeleri enable row level security;
alter table saha_raporlari enable row level security;
alter table dosyalar enable row level security;
alter table aktivite_logu enable row level security;
alter table bildirimler enable row level security;
alter table kayitli_gorunumler enable row level security;

-- Tüm kimlik doğrulanmış kullanıcılar: okuma
create policy select_firmalar on firmalar for select using (auth.role()='authenticated');
create policy select_bayiler on bayiler for select using (auth.role()='authenticated');
create policy select_kullanicilar on kullanicilar for select using (auth.role()='authenticated');

-- Projeler: rol bazlı görme
create policy select_projeler on projeler for select using (
  auth.role() = 'authenticated' and silindi_mi = false and (
    auth_rol() in ('yonetici','satis_sonrasi_sorumlusu') or
    (auth_rol() = 'saha_teknisyeni') or  -- atanan projeler (basit: tümü görür)
    satis_temsilcisi_id = auth.uid() or
    bayi_id in (select id from bayiler where eposta = auth.email())
  )
);

-- Yazma yetkileri
create policy insert_projeler on projeler for insert
  with check (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));
create policy update_projeler on projeler for update
  using (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));
create policy delete_projeler on projeler for delete
  using (auth_rol() = 'yonetici');

-- Bloklar ve aşamalar
create policy select_bloklar on bloklar for select using (auth.role()='authenticated');
create policy write_bloklar on bloklar for all
  using (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));
create policy insert_bloklar on bloklar for insert
  with check (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));

create policy select_asamalar on blok_asamalari for select using (auth.role()='authenticated');
create policy insert_asamalar on blok_asamalari for insert
  with check (auth.role()='authenticated');
create policy update_asamalar on blok_asamalari for update
  using (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu','saha_teknisyeni'));

-- Hatalar
create policy select_hatalar on hatalar for select using (auth.role()='authenticated');
create policy insert_hatalar on hatalar for insert
  with check (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu','saha_teknisyeni'));
create policy update_hatalar on hatalar for update
  using (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));

-- Diğer tablolar: genel authenticated erişimi
create policy all_santiye on santiye_yetkilileri for all using (auth.role()='authenticated');
create policy all_rapor_alicilari on rapor_alicilari for all using (auth.role()='authenticated');
create policy all_proje_dok on proje_dokumanlari for all using (auth.role()='authenticated');
create policy all_eksik on eksik_imalatlar for all using (auth.role()='authenticated');
create policy all_malzeme on proje_malzemeleri for all using (auth.role()='authenticated');
create policy all_raporlar on saha_raporlari for all using (auth.role()='authenticated');
create policy all_dosyalar on dosyalar for all using (auth.role()='authenticated');
create policy select_log on aktivite_logu for select using (auth.role()='authenticated');
create policy insert_log on aktivite_logu for insert with check (auth.role()='authenticated');
create policy own_bildirimler on bildirimler for all using (kullanici_id = auth.uid());
create policy own_gorunumler on kayitli_gorunumler for all using (kullanici_id = auth.uid());

-- Kullanıcılar: kendi kaydını ve yönetici tüm kayıtları günceller
create policy update_kullanicilar on kullanicilar for update
  using (auth_rol() = 'yonetici' or id = auth.uid())
  with check (auth_rol() = 'yonetici' or id = auth.uid());
create policy insert_kullanicilar on kullanicilar for insert
  with check (auth_rol() = 'yonetici' or id = auth.uid());

-- Firmalar yazma: yönetici + sorumlu
create policy insert_firmalar on firmalar for insert
  with check (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));
create policy update_firmalar on firmalar for update
  using (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));
create policy delete_firmalar on firmalar for delete
  using (auth_rol() = 'yonetici');
create policy all_bayiler on bayiler for all using (auth.role()='authenticated');
