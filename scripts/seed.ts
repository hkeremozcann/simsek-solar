import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('VITE_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.')
  console.error('Service role key Supabase Dashboard → Settings → API → service_role altında.')
  process.exit(1)
}

// Service role key RLS'i bypass eder — seed için gerekli
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function runSeed() {
  console.log('🌱 Şimşek Solar seed başlıyor…')

  const seedSql = readFileSync(
    join(process.cwd(), 'supabase/migrations/004_v2_seed.sql'),
    'utf-8'
  )

  // SQL'i bloklar halinde çalıştır
  const { error } = await supabase.rpc('exec_sql', { sql: seedSql }).single()

  if (error) {
    // Alternatif: doğrudan REST API
    console.log('RPC yöntemi çalışmadı, doğrudan seed verisi ekleniyor…')
    await seedDirect()
  } else {
    console.log('✅ Seed tamamlandı!')
  }
}

async function seedDirect() {
  // Alternatif yol: supabase-js ile doğrudan insert
  console.log('Firmalar ekleniyor…')
  const { error: firmaErr } = await supabase.from('firmalar').upsert([
    { id: 'f1000001-0000-0000-0000-000000000001', ad: 'TOKİ Gaziantep 3. Etap', kurum_tipi: 'TOKİ', ana_yuklenici: 'Özgün İnşaat A.Ş.', il: 'Gaziantep', ilce: 'Şahinbey', aktif_mi: true },
    { id: 'f1000001-0000-0000-0000-000000000002', ad: 'TOKİ Şanlıurfa Karaköprü', kurum_tipi: 'TOKİ', ana_yuklenici: 'Yıldız Yapı Grubu', il: 'Şanlıurfa', ilce: 'Karaköprü', aktif_mi: true },
    { id: 'f1000001-0000-0000-0000-000000000003', ad: 'Sağlık Bakanlığı Adıyaman DH', kurum_tipi: 'Sağlık Bakanlığı', il: 'Adıyaman', aktif_mi: true },
    { id: 'f1000001-0000-0000-0000-000000000004', ad: 'Adalet Bakanlığı Kilis Adliye', kurum_tipi: 'Adalet Bakanlığı', il: 'Kilis', aktif_mi: true },
    { id: 'f1000001-0000-0000-0000-000000000005', ad: 'GSB Kahramanmaraş Yurt', kurum_tipi: 'Gençlik ve Spor Bakanlığı', il: 'Kahramanmaraş', aktif_mi: true },
    { id: 'f1000001-0000-0000-0000-000000000006', ad: 'MEB Osmaniye Pansiyon', kurum_tipi: 'MEB', il: 'Osmaniye', aktif_mi: true },
    { id: 'f1000001-0000-0000-0000-000000000007', ad: 'Gaziantep Büyükşehir Belediyesi', kurum_tipi: 'Belediye', il: 'Gaziantep', aktif_mi: true },
    { id: 'f1000001-0000-0000-0000-000000000008', ad: 'Öz-Kaya İnşaat A.Ş.', kurum_tipi: 'Özel Sektör', il: 'Ankara', aktif_mi: true },
  ], { onConflict: 'id' })
  if (firmaErr) console.error('Firma hatası:', firmaErr.message)
  else console.log('✅ Firmalar eklendi')

  console.log('\n📋 Seed için Supabase SQL Editor kullanın:')
  console.log('supabase/migrations/003_v2_schema.sql → çalıştır')
  console.log('supabase/migrations/004_v2_seed.sql → çalıştır')
}

runSeed().catch(console.error)
