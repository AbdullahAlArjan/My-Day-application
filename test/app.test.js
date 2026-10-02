import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('My Day Project Verification Suite', async (t) => {
  await t.test('1. Environment files and placeholders exist without secret leaks', () => {
    assert.strictEqual(fs.existsSync('.env.example'), true, '.env.example must exist');
    const envExample = fs.readFileSync('.env.example', 'utf-8');
    assert.match(envExample, /VITE_SUPABASE_URL=/, 'Contains VITE_SUPABASE_URL');
    assert.match(envExample, /VITE_SUPABASE_ANON_KEY=/, 'Contains VITE_SUPABASE_ANON_KEY');
    assert.doesNotMatch(envExample, /service_role/, 'Must NEVER contain service-role key');
  });

  await t.test('2. Supabase Migration SQL file exists with all required tables and RLS', () => {
    const migrationDir = path.resolve('supabase', 'migrations');
    assert.strictEqual(fs.existsSync(migrationDir), true, 'supabase/migrations exists');
    const files = fs.readdirSync(migrationDir);
    assert.ok(files.length > 0, 'At least one migration file exists');

    const migrationContent = fs.readFileSync(path.join(migrationDir, files[0]), 'utf-8');
    assert.match(migrationContent, /CREATE TABLE IF NOT EXISTS public\.profiles/, 'profiles table created');
    assert.match(migrationContent, /CREATE TABLE IF NOT EXISTS public\.categories/, 'categories table created');
    assert.match(migrationContent, /CREATE TABLE IF NOT EXISTS public\.tasks/, 'tasks table created');
    assert.match(migrationContent, /CREATE TABLE IF NOT EXISTS public\.subtasks/, 'subtasks table created');
    assert.match(migrationContent, /CREATE TABLE IF NOT EXISTS public\.user_settings/, 'user_settings table created');
    assert.match(migrationContent, /ENABLE ROW LEVEL SECURITY/, 'RLS enabled');
    assert.match(migrationContent, /handle_new_user_init/, 'Default categories and profile initialization trigger present');
  });

  await t.test('3. PWA manifest and icons exist in public directory', () => {
    assert.strictEqual(fs.existsSync('public/favicon.svg'), true, 'favicon.svg exists');
    assert.strictEqual(fs.existsSync('public/icons/icon-192x192.png'), true, 'icon-192x192.png exists');
    assert.strictEqual(fs.existsSync('public/icons/icon-512x512.png'), true, 'icon-512x512.png exists');
  });

  await t.test('4. Capacitor configuration and Android platform are present', () => {
    assert.strictEqual(fs.existsSync('capacitor.config.ts'), true, 'capacitor.config.ts exists');
    assert.strictEqual(fs.existsSync('android/app/src/main/AndroidManifest.xml'), true, 'AndroidManifest.xml exists');
    
    const manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf-8');
    assert.match(manifest, /android\.permission\.INTERNET/, 'Internet permission defined');
  });

  await t.test('5. Production bundle exists in dist after build', () => {
    assert.strictEqual(fs.existsSync('dist/index.html'), true, 'dist/index.html exists');
    assert.strictEqual(fs.existsSync('dist/sw.js'), true, 'Service worker sw.js generated');
    assert.strictEqual(fs.existsSync('dist/manifest.webmanifest'), true, 'manifest.webmanifest generated');
  });
});
