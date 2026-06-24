/**
 * Icon Migration Utility for Habit Tracker
 * Migrates legacy emoji icons to Lucide icon names
 * Safe to run multiple times (idempotent)
 */

import Habit from '../models/Habit';

// ============================================
// Type Definitions
// ============================================

/**
 * Supported Lucide icon names
 */
type LucideIconName =
  | 'Target'
  | 'Star'
  | 'Flame'
  | 'Heart'
  | 'BookOpen'
  | 'Dumbbell'
  | 'Droplets'
  | 'Brain'
  | 'Apple'
  | 'Zap'
  | 'CheckCircle'
  | 'Moon'
  | 'Sun'
  | 'Coins'
  | 'Music'
  | 'Palette'
  | 'DollarSign'
  | 'Users'
  | 'Home'
  | 'Calendar'
  | 'Clock'
  | 'Settings'
  | 'TrendingUp'
  | 'TrendingDown'
  | 'Award'
  | 'Coffee'
  | 'Smile'
  | 'Frown'
  | 'Meh'
  | 'Activity'
  | 'BarChart'
  | 'LineChart'
  | 'PieChart'
  | 'Lightbulb'
  | 'Pencil'
  | 'Trash'
  | 'Plus'
  | 'Minus'
  | 'X'
  | 'Search'
  | 'Filter'
  | 'Sort'
  | 'ChevronDown'
  | 'ChevronUp'
  | 'ChevronLeft'
  | 'ChevronRight'
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'RefreshCw'
  | 'Download'
  | 'Upload'
  | 'Share'
  | 'Copy'
  | 'Clipboard'
  | 'Eye'
  | 'EyeOff'
  | 'Lock'
  | 'Unlock'
  | 'Bell'
  | 'HelpCircle'
  | 'Info';

/**
 * Migration statistics interface
 */
interface MigrationStats {
  totalHabits: number;
  habitsWithEmojis: number;
  migratedCount: number;
  skippedCount: number;
  errors: Array<{
    habitId: string;
    habitTitle: string;
    error: string;
  }>;
}

/**
 * Migration result interface
 */
interface MigrationResult {
  success: boolean;
  stats: MigrationStats;
  message: string;
}

// ============================================
// Emoji to Lucide Migration Map
// ============================================

/**
 * Maps legacy emoji icons to Lucide icon names
 * Same mapping as frontend for consistency
 */
const EMOJI_TO_LUCIDE_MAP: Record<string, LucideIconName> = {
  '🎯': 'Target',
  '⭐': 'Star',
  '🔥': 'Flame',
  '❤️': 'Heart',
  '📚': 'BookOpen',
  '💪': 'Dumbbell',
  '💧': 'Droplets',
  '🧠': 'Brain',
  '🍎': 'Apple',
  '⚡': 'Zap',
  '✅': 'CheckCircle',
  '🌙': 'Moon',
  '☀️': 'Sun',
  '💰': 'Coins',
  '🎵': 'Music',
  '🎨': 'Palette',
};

/**
 * Default icons by category
 */
const CATEGORY_DEFAULT_ICONS: Record<string, LucideIconName> = {
  'Health': 'Droplets',
  'Fitness': 'Dumbbell',
  'Learning': 'BookOpen',
  'Mental Health': 'Brain',
  'Nutrition': 'Apple',
  'Productivity': 'Zap',
  'Goals': 'Target',
  'Wellness': 'Heart',
  'Finance': 'DollarSign',
  'Relationships': 'Users',
  'Creativity': 'Palette',
  'Spirituality': 'Sun',
};

// ============================================
// Helper Functions
// ============================================

/**
 * Checks if a string is an emoji
 */
function isEmoji(str: string): boolean {
  if (!str) return false;

  // Check if the string contains emoji characters
  // This regex matches most common emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(str);
}

/**
 * Converts emoji or category name to Lucide icon
 */
function toLucideIcon(icon?: string, category?: string): LucideIconName {
  // If no icon provided, use category default or fallback
  if (!icon) {
    if (category && CATEGORY_DEFAULT_ICONS[category]) {
      return CATEGORY_DEFAULT_ICONS[category];
    }
    return 'Target';
  }

  // If it's an emoji, migrate to Lucide icon
  if (isEmoji(icon) && EMOJI_TO_LUCIDE_MAP[icon]) {
    return EMOJI_TO_LUCIDE_MAP[icon];
  }

  // If it's already a valid Lucide icon name, return it
  if (Object.values(EMOJI_TO_LUCIDE_MAP).includes(icon as LucideIconName)) {
    return icon as LucideIconName;
  }

  // Check if it's a category name
  if (CATEGORY_DEFAULT_ICONS[icon]) {
    return CATEGORY_DEFAULT_ICONS[icon];
  }

  // Fallback to Target
  return 'Target';
}

// ============================================
// Migration Functions
// ============================================

/**
 * Migrates all habits with emoji icons to Lucide icon names
 * This function is idempotent - safe to run multiple times
 *
 * @returns Promise<MigrationResult> - Migration statistics and results
 */
export async function migrateEmojiIconsToLucide(): Promise<MigrationResult> {
  const stats: MigrationStats = {
    totalHabits: 0,
    habitsWithEmojis: 0,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    console.log('🔍 Starting icon migration...');

    // Find all habits that have emoji icons
    // We'll check each habit's icon field
    const allHabits = await Habit.find({});
    stats.totalHabits = allHabits.length;

    console.log(`📊 Found ${stats.totalHabits} total habits`);

    // Filter habits with emoji icons
    const habitsToMigrate = allHabits.filter((habit) => {
      return habit.icon && isEmoji(habit.icon);
    });

    stats.habitsWithEmojis = habitsToMigrate.length;
    console.log(`🎯 Found ${stats.habitsWithEmojis} habits with emoji icons`);

    // Migrate each habit
    for (const habit of habitsToMigrate) {
      try {
        const oldIcon = habit.icon;
        const newIcon = toLucideIcon(habit.icon, (habit.category as any)?.name || 'General');

        // Skip if already migrated (idempotent check)
        if (oldIcon === newIcon) {
          stats.skippedCount++;
          console.log(`⏭️  Skipping already migrated habit: "${habit.title}"`);
          continue;
        }

        // Update the habit
        habit.icon = newIcon;
        await habit.save();

        stats.migratedCount++;
        console.log(`✅ Migrated habit: "${habit.title}" (${oldIcon} → ${newIcon})`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.errors.push({
          habitId: habit._id.toString(),
          habitTitle: habit.title,
          error: errorMessage,
        });
        console.error(`❌ Error migrating habit "${habit.title}":`, errorMessage);
      }
    }

    // Generate summary message
    const success = stats.errors.length === 0;
    let message = `Migration complete: ${stats.migratedCount} migrated, ${stats.skippedCount} skipped`;

    if (stats.errors.length > 0) {
      message += `, ${stats.errors.length} errors`;
    }

    console.log('✨ Migration finished');
    console.log(`📈 Summary: ${message}`);

    return {
      success,
      stats,
      message,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown migration error';
    console.error('💥 Migration failed:', errorMessage);

    return {
      success: false,
      stats,
      message: `Migration failed: ${errorMessage}`,
    };
  }
}

/**
 * CLI function to run the migration
 * Can be called directly: npx ts-node src/utils/migrateIcons.ts
 */
export async function runMigration(): Promise<void> {
  console.log('🚀 Icon Migration Utility');
  console.log('=========================\n');

  // Check if running in CLI environment
  if (require.main === module) {
    const result = await migrateEmojiIconsToLucide();

    console.log('\n📊 Final Statistics:');
    console.log(`   Total Habits: ${result.stats.totalHabits}`);
    console.log(`   Habits with Emojis: ${result.stats.habitsWithEmojis}`);
    console.log(`   Migrated: ${result.stats.migratedCount}`);
    console.log(`   Skipped: ${result.stats.skippedCount}`);
    console.log(`   Errors: ${result.stats.errors.length}`);
    console.log(`   Success: ${result.success}`);

    if (result.stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.stats.errors.forEach((err) => {
        console.log(`   - ${err.habitTitle}: ${err.error}`);
      });
    }

    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
  }
}

// ============================================
// Direct Execution (CLI)
// ============================================

// Allow running this file directly
if (require.main === module) {
  runMigration().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}
