import mongoose from 'mongoose';
import Category from '@/models/Category';
import logger from '@/utils/logger';
import connectDB from '@/config/database';

/**
 * Default Categories Configuration
 * These are the system default categories that will be available to all users
 * Expanded to 28 categories covering all aspects of life and habits
 */
const DEFAULT_CATEGORIES = [
  {
    name: 'Health',
    icon: 'Droplets',
    color: '#0ea5e9', // Blue
    isDefault: true,
  },
  {
    name: 'Fitness',
    icon: 'Dumbbell',
    color: '#f97316', // Orange
    isDefault: true,
  },
  {
    name: 'Learning',
    icon: 'BookOpen',
    color: '#10b981', // Green
    isDefault: true,
  },
  {
    name: 'Mental Health',
    icon: 'Brain',
    color: '#a855f7', // Purple
    isDefault: true,
  },
  {
    name: 'Nutrition',
    icon: 'Apple',
    color: '#ef4444', // Red
    isDefault: true,
  },
  {
    name: 'Productivity',
    icon: 'Zap',
    color: '#ec4899', // Pink
    isDefault: true,
  },
  {
    name: 'Goals',
    icon: 'Target',
    color: '#f59e0b', // Yellow
    isDefault: true,
  },
  {
    name: 'Wellness',
    icon: 'Heart',
    color: '#06b6d4', // Cyan
    isDefault: true,
  },
  {
    name: 'Finance',
    icon: 'DollarSign',
    color: '#10b981', // Green
    isDefault: true,
  },
  {
    name: 'Relationships',
    icon: 'Users',
    color: '#f97316', // Orange
    isDefault: true,
  },
  {
    name: 'Creativity',
    icon: 'Palette',
    color: '#a855f7', // Purple
    isDefault: true,
  },
  {
    name: 'Spirituality',
    icon: 'Sun',
    color: '#f59e0b', // Yellow
    isDefault: true,
  },
  {
    name: 'Sports',
    icon: 'Trophy',
    color: '#ef4444', // Red
    isDefault: true,
  },
  {
    name: 'Meditation',
    icon: 'Sparkles',
    color: '#a855f7', // Purple
    isDefault: true,
  },
  {
    name: 'Sleep',
    icon: 'Moon',
    color: '#6366f1', // Indigo
    isDefault: true,
  },
  {
    name: 'Cooking',
    icon: 'Utensils',
    color: '#f97316', // Orange
    isDefault: true,
  },
  {
    name: 'Reading',
    icon: 'Library',
    color: '#10b981', // Green
    isDefault: true,
  },
  {
    name: 'Writing',
    icon: 'PenTool',
    color: '#06b6d4', // Cyan
    isDefault: true,
  },
  {
    name: 'Technology',
    icon: 'Laptop',
    color: '#3b82f6', // Blue
    isDefault: true,
  },
  {
    name: 'Environment',
    icon: 'TreePine',
    color: '#10b981', // Green
    isDefault: true,
  },
  {
    name: 'Social',
    icon: 'MessageCircle',
    color: '#ec4899', // Pink
    isDefault: true,
  },
  {
    name: 'Travel',
    icon: 'Plane',
    color: '#0ea5e9', // Blue
    isDefault: true,
  },
  {
    name: 'Self-Care',
    icon: 'Spa',
    color: '#f472b6', // Pink
    isDefault: true,
  },
  {
    name: 'Career',
    icon: 'Briefcase',
    color: '#6366f1', // Indigo
    isDefault: true,
  },
  {
    name: 'Home',
    icon: 'Home',
    color: '#f59e0b', // Yellow
    isDefault: true,
  },
  {
    name: 'Hobbies',
    icon: 'Gamepad',
    color: '#8b5cf6', // Purple
    isDefault: true,
  },
  {
    name: 'Time Management',
    icon: 'Clock',
    color: '#f97316', // Orange
    isDefault: true,
  },
  {
    name: 'Mindfulness',
    icon: 'Smile',
    color: '#14b8a6', // Teal
    isDefault: true,
  },
];

/**
 * Seed default categories into the database
 * This function is idempotent - safe to run multiple times
 * It will only create categories that don't already exist
 */
export async function seedDefaultCategories(): Promise<void> {
  try {
    logger.info('Starting to seed default categories...');

    // Get existing default categories
    const existingCategories = await Category.find({ isDefault: true });
    const existingNames = new Set(existingCategories.map((cat) => cat.name));

    logger.info(`Found ${existingCategories.length} existing default categories`);

    // Filter out categories that already exist
    const categoriesToCreate = DEFAULT_CATEGORIES.filter(
      (cat) => !existingNames.has(cat.name)
    );

    if (categoriesToCreate.length === 0) {
      logger.info('All default categories already exist. No seeding needed.');
      return;
    }

    logger.info(`Creating ${categoriesToCreate.length} new default categories...`);

    // For default categories, we need to handle the userId requirement
    // We'll create a system user placeholder or use a dummy ObjectId
    const systemUserId = new mongoose.Types.ObjectId('000000000000000000000001');

    // Create categories that don't exist
    const categories = await Category.insertMany(
      categoriesToCreate.map((cat) => ({
        ...cat,
        userId: systemUserId, // System user ID for default categories
      }))
    );

    logger.info(`Successfully created ${categories.length} default categories:`);
    categories.forEach((cat) => {
      logger.info(`  - ${cat.name} (${cat.icon}, ${cat.color})`);
    });

    logger.info('Default categories seeding completed successfully');
  } catch (error: any) {
    logger.error('Error seeding default categories:', error);
    throw error;
  }
}

/**
 * Script to run the seeding process
 * Can be executed directly: npx ts-node src/utils/seedCategories.ts
 */
async function runSeeder(): Promise<void> {
  try {
    // Connect to database
    await connectDB();
    logger.info('Database connected successfully');

    // Run the seeding
    await seedDefaultCategories();

    logger.info('Seeding process completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding process failed:', error);
    process.exit(1);
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  runSeeder();
}

export default seedDefaultCategories;
