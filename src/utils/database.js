const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'bot.db');
let db;

function initDatabase() {
  const fs = require('fs');
  const dataDir = path.join(__dirname, '..', '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(dbPath);

  // Leveling table
  db.exec(`
    CREATE TABLE IF NOT EXISTS levels (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      total_messages INTEGER DEFAULT 0,
      last_xp_time INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    )
  `);

  // Ticket config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_config (
      guild_id TEXT PRIMARY KEY,
      category_id TEXT,
      log_channel_id TEXT,
      support_role_id TEXT
    )
  `);

  // Welcome/Goodbye config
  db.exec(`
    CREATE TABLE IF NOT EXISTS welcome_config (
      guild_id TEXT PRIMARY KEY,
      welcome_channel_id TEXT,
      welcome_message TEXT,
      goodbye_channel_id TEXT,
      goodbye_message TEXT
    )
  `);

  // Auto roles
  db.exec(`
    CREATE TABLE IF NOT EXISTS autoroles (
      guild_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, role_id)
    )
  `);

  // Reaction role panels
  db.exec(`
    CREATE TABLE IF NOT EXISTS reaction_panels (
      message_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      panel_type TEXT DEFAULT 'button',
      placeholder TEXT
    )
  `);

  // Reaction roles
  db.exec(`
    CREATE TABLE IF NOT EXISTS reaction_roles (
      message_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      emoji TEXT,
      label TEXT,
      style TEXT DEFAULT 'Primary',
      PRIMARY KEY (message_id, guild_id, role_id)
    )
  `);

  // Temp voice config
  db.exec(`
    CREATE TABLE IF NOT EXISTS tempvoice_config (
      guild_id TEXT PRIMARY KEY,
      creator_channel_id TEXT NOT NULL,
      channel_name_template TEXT DEFAULT '🎙️ {user}''s Room',
      default_user_limit INTEGER DEFAULT 0,
      interface_channel_id TEXT
    )
  `);

  // Temp voice active channels
  db.exec(`
    CREATE TABLE IF NOT EXISTS temp_channels (
      channel_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      owner_id TEXT NOT NULL
    )
  `);

  // Giveaways
  db.exec(`
    CREATE TABLE IF NOT EXISTS giveaways (
      message_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      prize TEXT NOT NULL,
      winners_count INTEGER DEFAULT 1,
      end_time INTEGER NOT NULL,
      host_id TEXT NOT NULL,
      entries TEXT DEFAULT '[]',
      ended INTEGER DEFAULT 0
    )
  `);

  // Notifications (YouTube/TikTok)
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      platform_id TEXT NOT NULL,
      discord_channel_id TEXT NOT NULL,
      message_template TEXT,
      ping_role_id TEXT,
      last_check TEXT
    )
  `);

  // Onboarding
  db.exec(`
    CREATE TABLE IF NOT EXISTS onboarding (
      guild_id TEXT PRIMARY KEY,
      channel_id TEXT,
      title TEXT,
      description TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS onboarding_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      roles TEXT
    )
  `);

  // Server stats config
  db.exec(`
    CREATE TABLE IF NOT EXISTS stats_config (
      guild_id TEXT PRIMARY KEY,
      total_channel_id TEXT,
      members_channel_id TEXT,
      bots_channel_id TEXT
    )
  `);

  console.log('✅ Database initialized!');
  return db;
}

function getDb() {
  if (!db) initDatabase();
  return db;
}

module.exports = { initDatabase, getDb };
