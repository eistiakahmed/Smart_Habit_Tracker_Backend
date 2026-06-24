import mongoose, { Schema, Document, Types } from 'mongoose';

export type Frequency = 'DAILY' | 'WEEKLY' | 'CUSTOM';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface IHabit extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  category: Types.ObjectId;
  color: string;
  icon?: string;
  frequency: Frequency;
  targetDays: number;
  startDate: Date;
  endDate?: Date;
  reminderTime?: string;
  isActive: boolean;
  difficulty: Difficulty;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  populateCategory(): Promise<IHabit>;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    icon: String,
    frequency: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'CUSTOM'],
      default: 'DAILY',
    },
    targetDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    reminderTime: String,
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
HabitSchema.index({ userId: 1, isActive: 1 });
HabitSchema.index({ createdAt: -1 });
HabitSchema.index({ category: 1 });

// Index on category + userId for efficient category-based queries
HabitSchema.index({ userId: 1, category: 1 });

// Instance method to populate category details
HabitSchema.methods.populateCategory = async function (): Promise<IHabit> {
  return this.populate('category');
};

// Static method to migrate existing string categories to Category references
interface IHabitModel extends mongoose.Model<IHabit> {
  migrateStringCategories(): Promise<{ migrated: number; errors: number }>;
}

HabitSchema.statics.migrateStringCategories = async function (): Promise<{ migrated: number; errors: number }> {
  const Category = mongoose.model('Category');
  let migrated = 0;
  let errors = 0;

  try {
    // Find all habits with string categories (legacy data)
    const legacyHabits = await this.find({
      category: { $type: 'string' }
    });

    // Get or create default categories for common category names
    const defaultCategories = await Category.find({ isDefault: true });
    const categoryMap = new Map<string, Types.ObjectId>();

    defaultCategories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat._id);
    });

    for (const habit of legacyHabits) {
      try {
        const categoryName = habit.category as unknown as string;
        let categoryId = categoryMap.get(categoryName.toLowerCase());

        // If category doesn't exist, create a new one
        if (!categoryId) {
          // Find the user to assign the category to
          const userId = habit.userId;

          // Create a new category for this user
          const newCategory = await Category.create({
            name: categoryName,
            userId,
            icon: 'circle',
            color: '#3B82F6',
            isDefault: false,
          });

          categoryId = newCategory._id as Types.ObjectId;
          categoryMap.set(categoryName.toLowerCase(), categoryId);
        }

        // Update the habit with the new category ObjectId
        await this.findByIdAndUpdate(habit._id, {
          $set: { category: categoryId }
        });

        migrated++;
      } catch (error) {
        console.error(`Error migrating habit ${habit._id}:`, error);
        errors++;
      }
    }

    return { migrated, errors };
  } catch (error) {
    console.error('Error during migration:', error);
    return { migrated, errors };
  }
};

// Create the model with static methods
const HabitModel = mongoose.model<IHabit, IHabitModel>('Habit', HabitSchema);

export default HabitModel;
