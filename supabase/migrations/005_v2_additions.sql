-- ============================================================
-- Şimşek Solar V2 — Ek Tablolar ve Alan Güncellemeleri
-- Excel'deki gerçek yapının tam karşılığı
-- ============================================================

-- ── 1. montaj_ekipleri (Excel T sütunu: MONTAJ SORUMLULUK) ──
create table if not exists montaj_ekipleri (
  id               uuid primary key default gen_random_uuid(),
  ad               text not null,  -- 'Şimşek Ekibi', 'Baztaş', 'Volt', 'Promot', 'Şimşek YES', 'Yüklenici Kendi'
  tip              text check (tip in ('İç Ekip', 'Taşeron', 'Yüklenici')),
  yetkili_kisi     text,
  telefon          text,
  aktif_mi         boolean not null default true,
  silindi_mi       boolean not null default false,
  olusturma_tarihi timestamptz not null default now(),
  guncelleme_tarihi timestamptz not null default now()
);

create trigger tr_montaj_ekipleri_guncelleme before update on montaj_ekipleri
  for each row execute function set_guncelleme_tarihi();

-- Varsayılan ekipler
insert into montaj_ekipleri(ad, tip) values
  ('Şimşek Ekibi', 'İç Ekip'),
  ('Şimşek YES', 'İç Ekip'),
  ('Baztaş', 'Taşeron'),
  ('Volt', 'Taşeron'),
  ('Promot', 'Taşeron'),
  ('Yüklenici Kendi Yapıyor', 'Yüklenici')
on conflict do nothing;

-- ── 2. malzemeler tanım tablosu (Bölüm 2.1 kataloğu) ────────
create table if not exists malzemeler (
  id               uuid primary key default gen_random_uuid(),
  ad               text not null,
  varyant          text,   -- '3''lü', '2''li', '--'
  kategori         text check (kategori in ('Kollektör','Sehpa','Pano','Sıvı','Bağlantı','Diğer')),
  birim            text not null default 'adet' check (birim in ('adet','litre','metre')),
  excel_sutun_kodu text,  -- AG,AH,AI... kolon harfleri — aktarım için
  aktif_mi         boolean not null default true,
  olusturma_tarihi timestamptz not null default now()
);

-- Gerçek malzeme kataloğu (Excel'den)
insert into malzemeler(ad, varyant, kategori, birim, excel_sutun_kodu) values
  ('Kollektör', null, 'Kollektör', 'adet', 'AG'),
  ('Teras Sehpa', '3''lü', 'Sehpa', 'adet', 'AI'),
  ('Teras Sehpa', '2''li', 'Sehpa', 'adet', 'AK'),
  ('Profil Sehpa (Eski)', '3''lü', 'Sehpa', 'adet', 'AM'),
  ('Profil Sehpa (Eski)', '2''li', 'Sehpa', 'adet', 'AO'),
  ('Profil Sehpa (Yeni)', '3''lü', 'Sehpa', 'adet', 'AQ'),
  ('Profil Sehpa (Yeni)', '2''li', 'Sehpa', 'adet', 'AS'),
  ('Kiremit Sigmalı Sehpa', '3''lü', 'Sehpa', 'adet', 'AU'),
  ('Kiremit Sigmalı Sehpa', '2''li', 'Sehpa', 'adet', 'AW'),
  ('Solar Sıvı', null, 'Sıvı', 'litre', 'AY'),
  ('Pano — Röleli', null, 'Pano', 'adet', 'BA'),
  ('Pano — Besleme', null, 'Pano', 'adet', 'BC'),
  ('Pano — Kondaktörlü', null, 'Pano', 'adet', 'BE'),
  ('Pano — AD598', null, 'Pano', 'adet', 'BG')
on conflict do nothing;

-- ── 3. sevkiyatlar (Excel'deki =780+800 toplam formüllerinin yerine) ──
create table if not exists sevkiyatlar (
  id               uuid primary key default gen_random_uuid(),
  proje_id         uuid not null references projeler(id) on delete cascade,
  malzeme_id       uuid not null references malzemeler(id),
  adet             int not null check (adet > 0),
  sevk_tarihi      date not null,
  irsaliye_no      text,
  arac_plaka       text,
  teslim_alan      text,
  notlar           text,
  kaydeden_id      uuid references kullanicilar(id),
  import_id        uuid,  -- Excel aktarımından gelenleri gruplamak için
  olusturma_tarihi timestamptz not null default now()
);

create index idx_sevkiyatlar_proje on sevkiyatlar(proje_id);
create index idx_sevkiyatlar_malzeme on sevkiyatlar(malzeme_id);
create index idx_sevkiyatlar_tarih on sevkiyatlar(sevk_tarihi desc);

-- ── 4. saha_ziyaretleri (Excel A-E sütunları: aylık "1" işaretleri) ──
create table if not exists saha_ziyaretleri (
  id               uuid primary key default gen_random_uuid(),
  proje_id         uuid not null references projeler(id) on delete cascade,
  ziyaret_tarihi   date not null,
  ziyaret_eden_id  uuid references kullanicilar(id),
  ziyaret_tipi     text check (ziyaret_tipi in ('Keşif','Kontrol','Montaj','Devreye Alma','Servis')),
  blok_idler       uuid[] default '{}',
  saha_raporu_id   uuid references saha_raporlari(id),
  notlar           text,
  import_id        uuid,
  olusturma_tarihi timestamptz not null default now()
);

create index idx_ziyaret_proje on saha_ziyaretleri(proje_id);
create index idx_ziyaret_tarih on saha_ziyaretleri(ziyaret_tarihi desc);

-- ── 5. Excel aktarım geçmişi ─────────────────────────────────
create table if not exists excel_aktarimlari (
  id               uuid primary key default gen_random_uuid(),
  dosya_adi        text not null,
  dosya_boyut      int,
  aktaran_id       uuid references kullanicilar(id),
  baslama_tarihi   timestamptz not null default now(),
  bitis_tarihi     timestamptz,
  durum            text not null default 'Devam Ediyor'
                     check (durum in ('Devam Ediyor','Tamamlandı','Hatalı','Geri Alındı')),
  proje_sayisi     int default 0,
  blok_sayisi      int default 0,
  hata_sayisi      int default 0,
  uyari_sayisi     int default 0,
  ozet             jsonb,  -- detaylı aktarım özeti
  hata_mesaji      text
);

-- ── 6. projeler — Yeni alanlar ───────────────────────────────
alter table projeler
  add column if not exists konut_sayisi        int,         -- Excel L sütunu: konut adedi
  add column if not exists montaj_sorumlusu_id uuid references montaj_ekipleri(id),  -- Excel T: montaj sorumlusu
  add column if not exists bedelsiz_mi         boolean not null default false,  -- Excel U: BEDELSİZ
  add column if not exists solar_sivi_lt       numeric(10,2),  -- litre
  add column if not exists excel_sira_no       int unique,  -- orijinal Excel sıra numarası
  add column if not exists import_id           uuid references excel_aktarimlari(id);  -- hangi aktarımdan

-- ── 7. blok_asamalari — Adet bazlı ilerleme (Excel AB-AE) ───
alter table blok_asamalari
  add column if not exists montaj_ekibi_id  uuid references montaj_ekipleri(id),
  add column if not exists olcu_birimi      text default 'blok' check (olcu_birimi in ('blok','kollektör')),
  add column if not exists planlanan_adet   int,   -- dizilim/borulama için kollektör adedi
  add column if not exists tamamlanan_adet  int default 0;

-- Dizilim ve Borulama → kollektör ile ölçülür
-- otomatik ayarla (mevcut kayıtlar için)
update blok_asamalari set olcu_birimi = 'kollektör'
where asama_tipi in ('Dizilim', 'Borulama');

-- ── 8. mv_proje_ozet — Güncelle (yeni alanlar dahil) ─────────
drop materialized view if exists mv_proje_ozet;

create materialized view mv_proje_ozet as
select
  p.id, p.proje_kodu, p.proje_adi, p.durum, p.aktif_mi,
  p.il, p.ilce, p.blok_sayisi, p.konut_sayisi,
  p.hedef_teslim_tarihi, p.tamamlanma_tarihi, p.son_hareket_tarihi,
  p.satis_temsilcisi_id, p.firma_id, p.montaj_sorumlusu_id,
  p.bedelsiz_mi, p.taslak_mi,
  f.kurum_tipi, f.ad as firma_adi,
  me.ad as montaj_ekibi_adi,
  -- Saha ilerlemesi
  count(distinct b.id) as toplam_blok,
  count(distinct ba.id) filter (
    where ba.durum = 'Tamamlandı' and ba.sonuc = 'Uygun'
  ) as tamamlanan_asama,
  count(distinct ba.id) as toplam_asama,
  case when count(distinct ba.id) > 0 then
    floor(
      count(distinct ba.id) filter (where ba.durum='Tamamlandı' and ba.sonuc='Uygun')
      * 100.0 / nullif(count(distinct ba.id), 0)
    )::int
  else 0 end as saha_yuzdesi,
  -- Devreye alınan blok sayısı
  count(distinct ba2.blok_id) as devreye_alinan_blok,
  -- Açık hata
  count(distinct h.id) filter (
    where h.durum in ('Açık','Düzeltiliyor','Yeniden Kontrolde')
  ) as acik_hata,
  -- Sevk oranı
  coalesce(
    floor(sum(pm.sevk_edilen_adet) * 100.0 / nullif(sum(pm.sozlesme_adedi), 0))::int,
    0
  ) as sevk_yuzdesi,
  -- Durum hesaplama
  case
    when p.hedef_teslim_tarihi < current_date and p.durum != 'Tamamlandı'
    then true else false
  end as gecikmis_mi,
  case
    when p.son_hareket_tarihi < now() - interval '30 days' and p.aktif_mi
    then true else false
  end as hareketsiz_mi,
  extract(day from now() - p.son_hareket_tarihi)::int as hareketsiz_gun,
  extract(day from current_date - p.hedef_teslim_tarihi)::int as gecikme_gun
from projeler p
left join firmalar f on f.id = p.firma_id
left join montaj_ekipleri me on me.id = p.montaj_sorumlusu_id
left join bloklar b on b.proje_id = p.id
left join blok_asamalari ba on ba.blok_id = b.id
left join blok_asamalari ba2 on ba2.blok_id = b.id
  and ba2.asama_tipi = 'Devreye Alma'
  and ba2.durum = 'Tamamlandı' and ba2.sonuc = 'Uygun'
left join hatalar h on h.proje_id = p.id
left join proje_malzemeleri pm on pm.proje_id = p.id
where p.silindi_mi = false
group by p.id, f.kurum_tipi, f.ad, me.ad;

create unique index idx_mv_proje_ozet_id on mv_proje_ozet(id);
create index idx_mv_durum on mv_proje_ozet(durum);
create index idx_mv_il on mv_proje_ozet(il);
create index idx_mv_aktif on mv_proje_ozet(aktif_mi);
create index idx_mv_gecikme on mv_proje_ozet(gecikmis_mi) where gecikmis_mi = true;

-- ── 9. proje_malzemeleri güncellemesi ────────────────────────
-- sozlesme_adedi, sevk_edilen_adet (trigger ile hesaplanır)
alter table proje_malzemeleri
  add column if not exists sozlesme_adedi   int not null default 0,
  add column if not exists import_id        uuid;

-- sevk_edilen_adet otomatik hesaplama
create or replace function guncelle_sevk_edilen_adet()
returns trigger language plpgsql as $$
begin
  update proje_malzemeleri
  set sevk_edilen_adet = (
    select coalesce(sum(adet), 0)
    from sevkiyatlar
    where proje_id = coalesce(new.proje_id, old.proje_id)
      and malzeme_id = coalesce(new.malzeme_id, old.malzeme_id)
  )
  where proje_id = coalesce(new.proje_id, old.proje_id)
    and malzeme_id = coalesce(new.malzeme_id, old.malzeme_id);
  return coalesce(new, old);
end; $$;

create trigger tr_sevkiyat_sonrasi_guncelle
  after insert or update or delete on sevkiyatlar
  for each row execute function guncelle_sevk_edilen_adet();

-- ── 10. RLS: yeni tablolar ───────────────────────────────────
alter table montaj_ekipleri enable row level security;
alter table malzemeler enable row level security;
alter table sevkiyatlar enable row level security;
alter table saha_ziyaretleri enable row level security;
alter table excel_aktarimlari enable row level security;

create policy select_montaj_ekipleri on montaj_ekipleri for select using (auth.role()='authenticated');
create policy write_montaj_ekipleri on montaj_ekipleri for all using (auth_rol() = 'yonetici');

create policy select_malzemeler on malzemeler for select using (auth.role()='authenticated');
create policy write_malzemeler on malzemeler for all using (auth_rol() = 'yonetici');

create policy all_sevkiyatlar on sevkiyatlar for all using (auth.role()='authenticated');
create policy all_ziyaretler on saha_ziyaretleri for all using (auth.role()='authenticated');
create policy all_excel_aktarimlari on excel_aktarimlari for all using (auth_rol() = 'yonetici');

-- ── 11. VARSAYIMLAR.md için: ilk MV yenileme ─────────────────
refresh materialized view mv_proje_ozet;

select 'Schema güncellemesi tamamlandı.' as sonuc;
