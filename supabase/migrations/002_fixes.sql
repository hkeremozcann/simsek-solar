-- ── Şimşek Solar — Kritik Düzeltmeler ──────────────────────

-- 1. blok_asamalari INSERT policy (kritik eksik — proje oluşturma bunu gerektiriyor)
drop policy if exists asamalar_insert on blok_asamalari;
create policy asamalar_insert on blok_asamalari for insert
  with check (auth.role() = 'authenticated');

-- 2. Auth'a yeni kullanıcı eklenince otomatik kullanicilar kaydı oluştur
create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.kullanicilar (id, ad_soyad, eposta, rol, aktif_mi)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'ad_soyad',
      split_part(new.email, '@', 1)
    ),
    new.email,
    'satis_temsilcisi',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- 3. Auth'ta olup kullanicilar tablosunda olmayan kayıtları oluştur
insert into public.kullanicilar (id, ad_soyad, eposta, rol, aktif_mi)
select
  u.id,
  split_part(u.email, '@', 1),
  u.email,
  'satis_temsilcisi',
  true
from auth.users u
left join public.kullanicilar k on k.id = u.id
where k.id is null;

-- 4. Mevcut kullanıcıyı yönetici yap (kendi e-postanızla değiştirin)
update kullanicilar
set rol = 'yonetici'
where eposta = 'kerem@simseksolar.com.tr';

-- 5. kullanicilar tablosunda güncelleme için policy ekle
drop policy if exists kullanicilar_update on kullanicilar;
create policy kullanicilar_update on kullanicilar for update
  using (auth_rol() = 'yonetici' or id = auth.uid())
  with check (auth_rol() = 'yonetici' or id = auth.uid());

-- 6. Firmalar INSERT için with check ekle (mevcut policy eksik)
drop policy if exists firmalar_insert on firmalar;
create policy firmalar_insert on firmalar for insert
  with check (auth_rol() in ('yonetici','satis_sonrasi_sorumlusu'));
