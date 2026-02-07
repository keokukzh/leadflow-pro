#!/usr/bin/env node
// ============================================
// LeadFlow Pro - Quick Setup Verification
// ============================================

import fs from 'fs';
import path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath: string): boolean {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✅ ${filePath}`, 'green');
  } else {
    log(`❌ ${filePath} - MISSING`, 'red');
  }
  return exists;
}

console.log('');
log('╔══════════════════════════════════════════════════════════╗', 'blue');
log('║    LeadFlow Pro - Setup Verification                      ║', 'blue');
log('╚══════════════════════════════════════════════════════════╝', 'blue');
console.log('');

// Check files
log('📁 Checking database files...', 'blue');
const dbFiles = [
  'src/lib/db/types.ts',
  'src/lib/db/client.ts',
  'src/lib/db/index.ts',
  'database/schema_enhanced.sql',
];

dbFiles.forEach(file => checkFile(path.join(process.cwd(), file)));

console.log('');
log('📁 Checking VAPI files...', 'blue');
const vapiFiles = [
  'src/services/voice/vapi/vapiService.ts',
  'src/services/voice/vapi/index.ts',
  'src/app/api/voice/vapi/route.ts',
  'src/app/api/voice/vapi/webhook/route.ts',
];

vapiFiles.forEach(file => checkFile(path.join(process.cwd(), file)));

console.log('');
log('📁 Checking config...', 'blue');
checkFile(path.join(process.cwd(), '.env.local.example'));

console.log('');
log('📋 Next Steps:', 'blue');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('');
log('1. 📋 Copy environment template:', 'yellow');
log('   cp .env.local.example .env.local');
log('');
log('2. 🔗 Get VAPI credentials:', 'yellow');
log('   - https://dashboard.vapi.ai');
log('   - Create API Key');
log('   - Create Assistant (use Swiss German prompt)');
log('   - Add Swiss phone number');
log('');
log('3. 🗄️ Setup Database:', 'yellow');
log('   - Go to Supabase SQL Editor');
log('   - Run: database/schema_enhanced.sql');
log('');
log('4. 🔑 Fill in .env.local:', 'yellow');
log('   - VAPI_API_KEY');
log('   - VAPI_ASSISTANT_ID');
log('   - VAPI_PHONE_NUMBER');
log('   - SUPABASE credentials');
log('');
log('5. 🧪 Test:', 'yellow');
log('   npm run dev');
log('   → Dashboard → Creator → Voice Agent → Anrufen');
log('');
log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('');
log('📚 Documentation:', 'blue');
log('   - VAPI Guide: VAPI_AI_COMPLETE_GUIDE.md');
log('   - Optimization: OPTIMIZATION_PLAN.md');
log('');
