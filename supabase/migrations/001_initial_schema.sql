-- Şimşek Solar — Veritabanı Şeması
-- PostgreSQL / Supabase

-- UUID uzantısı
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 1. firmalar
-- ────────────────────────────────────────────────────────────
create table firmalar (
  id                uuid primary key default uuid_generate_v4(),
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
  olusturma_tarihi  timestamptz not null default now(),
  guncelleme_tarihi timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 2. bayiler
-- ────────────────────────────────────────────────────────────
create table bayiler (
  id               uuid primary key default uuid_generate_v4(),
  ad               text not null,
  yetkili_kisi     text,
  telefon          text,
  eposta           text,
  il               text,
  aktif_mi         boolean not null default true,
  olusturma_tarihi timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 3. kullanicilar (Supabase auth.users ile bağlantılı)
-- ────────────────────────────────────────────────────────────
create table kullanicilar (
  id               uuid primary key references auth.users(id) on delete cascade,
  ad_soyad         text not null,
  eposta           text not null unique,
  telefon          text,
  rol              text not null check (rol in (
    'yonetici','satis_sonrasi_sorumlusu','saha_teknisyeni',
    'satis_temsilcisi','bayi'
  )),
  aktif_mi         boolean not null default true,
  olusturma_tarihi timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 4. projeler (sıra no için sequence)
-- ────────────────────────────────────────────────────────────
create sequence proje_sira_no_seq start 1;

create table projeler (
  id                        uuid primary key default uuid_generate_v4(),
  proje_kodu                text not null unique,
  proje_adi                 text not null,
  firma_id                  uuid not null references firmalar(id),
  sozlesme_no               text,
  sozlesme_tarihi           date,
  hedef_teslim_tarihi       date,
  santiye_adresi            text not null,
  il                        text not null,
  ilce                      text,
  harita_konumu             text,
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
  durum                     text not null default 'Çalışıyor' check (durum in (
    'Çalışıyor','Beklemede','Tamamlandı','İptal'
  )),
  aktif_mi                  boolean not null default true,
  tamamlanma_tarihi         date,
  notlar                    text,
  olusturan_id              uuid not null references kullanicilar(id),
  olusturma_tarihi          timestamptz not null default now(),
  guncelleme_tarihi         timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 5. santiye_yetkilileri
-- ────────────────────────────────────────────────────────────
create table santiye_yetkilileri (
  id          uuid primary key default uuid_generate_v4(),
  proje_id    uuid not null references projeler(id) on delete cascade,
  ad_soyad    text not null,
  gorevi      text check (gorevi in (
    'Şantiye Şefi','Kontrol Amiri','Teknik Ofis','Taşeron Yetkilisi'
  )),
  telefon     text,
  eposta      text,
  birincil_mi boolean not null default false
);

-- ────────────────────────────────────────────────────────────
-- 6. rapor_alicilari
-- ────────────────────────────────────────────────────────────
create table rapor_alicilari (
  id          uuid primary key default uuid_generate_v4(),
  proje_id    uuid not null references projeler(id) on delete cascade,
  eposta      text not null,
  ad_soyad    text,
  alici_tipi  text not null default 'Kime' check (alici_tipi in ('Kime','Bilgi')),
  aktif_mi    boolean not null default true
);

-- ────────────────────────────────────────────────────────────
-- 7. bloklar
-- ────────────────────────────────────────────────────────────
create table bloklar (
  id               uuid primary key default uuid_generate_v4(),
  proje_id         uuid not null references projeler(id) on delete cascade,
  blok_adi         text not null,
  sira_no          int not null,
  kollektor_sayisi int,
  sehpa_sayisi     int,
  pano_sayisi      int,
  kat_sayisi       int,
  daire_sayisi     int,
  unique(proje_id, sira_no)
);

-- ────────────────────────────────────────────────────────────
-- 8. proje_dokumanlari
-- ────────────────────────────────────────────────────────────
create table proje_dokumanlari (
  id               uuid primary key default uuid_generate_v4(),
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
  dosya_ekleri     text[] default '{}',
  aciklama         text,
  olusturma_tarihi timestamptz not null default now(),
  guncelleme_tarihi timestamptz not null default now(),
  unique(proje_id, dokuman_tipi)
);

-- ────────────────────────────────────────────────────────────
-- 9. blok_asamalari — Sistemin kalbi
-- ────────────────────────────────────────────────────────────
create table blok_asamalari (
  id                         uuid primary key default uuid_generate_v4(),
  blok_id                    uuid not null references bloklar(id) on delete cascade,
  asama_tipi                 text not null check (asama_tipi in (
    'Kaide Kontrolü','Dizilim','Borulama','Pano Bağlantısı','Devreye Alma'
  )),
  sira_no                    int not null check (sira_no between 1 and 5),
  durum                      text not null default 'Başlamadı' check (durum in (
    'Başlamadı','Devam Ediyor','Tamamlandı'
  )),
  sonuc                      text check (sonuc in ('Uygun','Hatalı')),
  kontrol_tarihi             timestamptz,
  kontrol_eden_id            uuid references kullanicilar(id),
  aciklama                   text,
  fotograflar                text[] default '{}',
  duzeltme_talep_edildi_mi   boolean default false,
  duzeltme_son_tarih         date,
  yeniden_kontrol_tarihi     date,
  guncelleme_gecmisi         jsonb default '[]'::jsonb,
  olusturma_tarihi           timestamptz not null default now(),
  guncelleme_tarihi          timestamptz not null default now(),
  unique(blok_id, asama_tipi),
  -- sonuc sadece Tamamlandı iken doldurulabilir
  constraint sonuc_tamamlandi_zorunlu check (
    durum != 'Tamamlandı' or sonuc is not null
  ),
  -- Hatalı iken aciklama zorunlu ve en az 10 karakter
  constraint hatali_aciklama_zorunlu check (
    sonuc != 'Hatalı' or (aciklama is not null and length(aciklama) >= 10)
  )
);

-- ────────────────────────────────────────────────────────────
-- 10. saha_raporlari
-- ────────────────────────────────────────────────────────────
create table saha_raporlari (
  id                   uuid primary key default uuid_generate_v4(),
  proje_id             uuid not null references projeler(id) on delete cascade,
  blok_idler           uuid[] not null default '{}',
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
  fotograflar          text[] default '{}',
  pdf_dosyasi          text,
  gonderildi_mi        boolean not null default false,
  gonderim_tarihi      timestamptz,
  gonderilen_epostalar text[] default '{}',
  gonderim_durumu      text check (gonderim_durumu in ('Başarılı','Hatalı')),
  olusturma_tarihi     timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────
-- 11. aktivite_logu
-- ────────────────────────────────────────────────────────────
create table aktivite_logu (
  id           uuid primary key default uuid_generate_v4(),
  kullanici_id uuid references kullanicilar(id),
  tarih        timestamptz not null default now(),
  tablo        text not null,
  kayit_id     uuid not null,
  islem        text not null check (islem in ('ekleme','guncelleme','silme')),
  eski_deger   jsonb,
  yeni_deger   jsonb
);

-- Log silinemez (yönetici dahil)
create rule aktivite_log_silinemez as
  on delete to aktivite_logu
  do instead nothing;

-- ────────────────────────────────────────────────────────────
-- FONKSİYONLAR ve TRİGGER'LAR
-- ────────────────────────────────────────────────────────────

-- guncelleme_tarihi otomatik güncelleme
create or replace function set_guncelleme_tarihi()
returns trigger language plpgsql as $$
begin
  new.guncelleme_tarihi = now();
  return new;
end;
$$;

create trigger tr_firmalar_guncelleme
  before update on firmalar
  for each row execute function set_guncelleme_tarihi();

create trigger tr_projeler_guncelleme
  before update on projeler
  for each row execute function set_guncelleme_tarihi();

create trigger tr_proje_dokumanlari_guncelleme
  before update on proje_dokumanlari
  for each row execute function set_guncelleme_tarihi();

create trigger tr_blok_asamalari_guncelleme
  before update on blok_asamalari
  for each row execute function set_guncelleme_tarihi();

-- ─── K1: Proje durumu otomatik hesaplama ───────────────────
create or replace function hesapla_proje_durumu(p_proje_id uuid)
returns void language plpgsql as $$
declare
  v_blok_sayisi int;
  v_devreye_alinan int;
  v_acik_hata int;
  v_mevcut_durum text;
  v_yeni_durum text;
begin
  select blok_sayisi, durum
  into v_blok_sayisi, v_mevcut_durum
  from projeler
  where id = p_proje_id;

  -- Devreye alınan blok: Devreye Alma aşaması Tamamlandı + Uygun
  select count(*) into v_devreye_alinan
  from bloklar b
  join blok_asamalari ba on ba.blok_id = b.id
  where b.proje_id = p_proje_id
    and ba.asama_tipi = 'Devreye Alma'
    and ba.durum = 'Tamamlandı'
    and ba.sonuc = 'Uygun';

  -- Açık hata sayısı
  select count(*) into v_acik_hata
  from bloklar b
  join blok_asamalari ba on ba.blok_id = b.id
  where b.proje_id = p_proje_id
    and ba.sonuc = 'Hatalı';

  -- Manuel olarak Beklemede veya İptal yapılmışsa koru
  if v_mevcut_durum in ('Beklemede', 'İptal') then
    return;
  end if;

  -- Tüm bloklar devreye alındı ve açık hata yok
  if v_blok_sayisi > 0
     and v_devreye_alinan = v_blok_sayisi
     and v_acik_hata = 0
  then
    v_yeni_durum := 'Tamamlandı';
    update projeler
    set durum = 'Tamamlandı',
        aktif_mi = false,
        tamamlanma_tarihi = current_date
    where id = p_proje_id;
  else
    -- Eğer önceden Tamamlandı idi, geri al
    if v_mevcut_durum = 'Tamamlandı' then
      update projeler
      set durum = 'Çalışıyor',
          aktif_mi = true,
          tamamlanma_tarihi = null
      where id = p_proje_id;
    else
      update projeler
      set durum = 'Çalışıyor',
          aktif_mi = true
      where id = p_proje_id
        and durum != 'Çalışıyor';
    end if;
  end if;
end;
$$;

-- Blok aşaması değişince proje durumunu yeniden hesapla
create or replace function tr_blok_asamasi_degisince()
returns trigger language plpgsql as $$
declare
  v_proje_id uuid;
begin
  select b.proje_id into v_proje_id
  from bloklar b
  where b.id = coalesce(new.blok_id, old.blok_id);

  perform hesapla_proje_durumu(v_proje_id);
  return coalesce(new, old);
end;
$$;

create trigger tr_blok_asamasi_guncelleme_proje
  after insert or update or delete on blok_asamalari
  for each row execute function tr_blok_asamasi_degisince();

-- ─── Otomatik blok ve aşama oluşturma ──────────────────────
create or replace function blok_ve_asama_olustur(
  p_proje_id uuid,
  p_blok_sayisi int,
  p_adlandirma_tipi text  -- 'harf' | 'sayi'
)
returns void language plpgsql as $$
declare
  i int;
  v_blok_id uuid;
  v_blok_adi text;
  asama record;
begin
  for i in 1..p_blok_sayisi loop
    -- Blok adı
    if p_adlandirma_tipi = 'harf' then
      v_blok_adi := chr(64 + i) || ' Blok';
    else
      v_blok_adi := i || '. Blok';
    end if;

    -- Blok oluştur
    insert into bloklar (proje_id, blok_adi, sira_no)
    values (p_proje_id, v_blok_adi, i)
    returning id into v_blok_id;

    -- 5 aşama oluştur
    insert into blok_asamalari (blok_id, asama_tipi, sira_no, durum)
    values
      (v_blok_id, 'Kaide Kontrolü', 1, 'Başlamadı'),
      (v_blok_id, 'Dizilim', 2, 'Başlamadı'),
      (v_blok_id, 'Borulama', 3, 'Başlamadı'),
      (v_blok_id, 'Pano Bağlantısı', 4, 'Başlamadı'),
      (v_blok_id, 'Devreye Alma', 5, 'Başlamadı');
  end loop;
end;
$$;

-- Proje desteği kapsamındaysa doküman kayıtları oluştur
create or replace function proje_destek_dokumanlar_olustur(p_proje_id uuid)
returns void language plpgsql as $$
begin
  insert into proje_dokumanlari (proje_id, dokuman_tipi, durum)
  values
    (p_proje_id, 'Kaide Projesi', 'Başlamadı'),
    (p_proje_id, 'Borulama Projesi', 'Başlamadı'),
    (p_proje_id, 'Uygulama Projesi', 'Başlamadı')
  on conflict (proje_id, dokuman_tipi) do nothing;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- İNDEKSLER (performans)
-- ────────────────────────────────────────────────────────────
create index idx_projeler_firma_id on projeler(firma_id);
create index idx_projeler_durum on projeler(durum);
create index idx_projeler_il on projeler(il);
create index idx_projeler_satis_temsilcisi on projeler(satis_temsilcisi_id);
create index idx_projeler_olusturma on projeler(olusturma_tarihi desc);
create index idx_bloklar_proje_id on bloklar(proje_id);
create index idx_blok_asamalari_blok_id on blok_asamalari(blok_id);
create index idx_saha_raporlari_proje_id on saha_raporlari(proje_id);
create index idx_aktivite_logu_tarih on aktivite_logu(tarih desc);
create index idx_aktivite_logu_kayit on aktivite_logu(tablo, kayit_id);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────
alter table firmalar enable row level security;
alter table bayiler enable row level security;
alter table kullanicilar enable row level security;
alter table projeler enable row level security;
alter table santiye_yetkilileri enable row level security;
alter table rapor_alicilari enable row level security;
alter table bloklar enable row level security;
alter table proje_dokumanlari enable row level security;
alter table blok_asamalari enable row level security;
alter table saha_raporlari enable row level security;
alter table aktivite_logu enable row level security;

-- Yardımcı fonksiyon: mevcut kullanıcının rolünü al
create or replace function auth_rol()
returns text language sql stable as $$
  select rol from kullanicilar where id = auth.uid();
$$;

-- Firmalar: herkes okuyabilir, yönetici + sorumlu yazabilir
create policy firmalar_select on firmalar for select
  using (auth.role() = 'authenticated');
create policy firmalar_insert on firmalar for insert
  with check (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));
create policy firmalar_update on firmalar for update
  using (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));
create policy firmalar_delete on firmalar for delete
  using (auth_rol() = 'yonetici');

-- Projeler: herkes okuyabilir (kendi projelerini), yönetici + sorumlu yazabilir
create policy projeler_select on projeler for select
  using (
    auth.role() = 'authenticated' and (
      auth_rol() in ('yonetici','satis_sonrasi_sorumlusu','saha_teknisyeni') or
      satis_temsilcisi_id = auth.uid() or
      bayi_id in (select id from bayiler where eposta = auth.email())
    )
  );
create policy projeler_insert on projeler for insert
  with check (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));
create policy projeler_update on projeler for update
  using (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));
create policy projeler_delete on projeler for delete
  using (auth_rol() = 'yonetici');

-- Bloklar ve aşamalar: proje erişimi olanlar okuyabilir
create policy bloklar_select on bloklar for select
  using (auth.role() = 'authenticated');
create policy bloklar_write on bloklar for all
  using (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));

-- Blok aşamaları: teknisyen + sorumlu + yönetici güncelleyebilir
create policy asamalar_select on blok_asamalari for select
  using (auth.role() = 'authenticated');
create policy asamalar_update on blok_asamalari for update
  using (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu','saha_teknisyeni'));

-- Saha raporları
create policy raporlar_select on saha_raporlari for select
  using (auth.role() = 'authenticated');
create policy raporlar_write on saha_raporlari for all
  using (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));

-- Kullanıcılar: kendini ve başkalarını görebilir (yönetici yönetir)
create policy kullanicilar_select on kullanicilar for select
  using (auth.role() = 'authenticated');
create policy kullanicilar_write on kullanicilar for all
  using (auth_rol() = 'yonetici' or id = auth.uid());

-- Aktivite logu: herkes okuyabilir, yazma sadece sistem
create policy aktivite_select on aktivite_logu for select
  using (auth.role() = 'authenticated');
create policy aktivite_insert on aktivite_logu for insert
  with check (auth.role() = 'authenticated');

-- Diğer tablolar
create policy sy_all on santiye_yetkilileri for all using (auth.role() = 'authenticated');
create policy ra_all on rapor_alicilari for all using (auth.role() = 'authenticated');
create policy pd_all on proje_dokumanlari for all using (auth.role() = 'authenticated');
create policy bayiler_all on bayiler for all using (auth.role() = 'authenticated');
