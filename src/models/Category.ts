import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  userId: Types.ObjectId;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [1, 'Category name must be at least 1 character long'],
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    icon: {
      type: String,
      required: [true, 'Icon is required'],
      trim: true,
      validate: {
        validator: function (value: string) {
          // Basic validation for Lucide icon names (alphanumeric, hyphens, no spaces)
          return /^[a-zA-Z0-9-]+$/.test(value);
        },
        message: 'Icon must be a valid Lucide icon name',
      },
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
      validate: {
        validator: function (value: string) {
          // Validate hex color format (# followed by 6 hex characters)
          return /^#[0-9A-Fa-f]{6}$/.test(value);
        },
        message: 'Color must be a valid hex color (e.g., #3B82F6)',
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on userId + name for uniqueness per user
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Index on userId for querying user's categories
CategorySchema.index({ userId: 1 });

// Static method to find system default categories
CategorySchema.statics.findDefaultCategories = function () {
  return this.find({ isDefault: true }).sort({ name: 1 });
};

// Static method to find user's custom categories
CategorySchema.statics.findUserCategories = function (userId: Types.ObjectId) {
  return this.find({ userId, isDefault: false }).sort({ name: 1 });
};

// Static method to create custom category
CategorySchema.statics.createCustomCategory = function (data: Partial<ICategory>) {
  return this.create({
    ...data,
    isDefault: false,
  });
};

// Extend the interface with static methods
interface ICategoryModel extends mongoose.Model<ICategory> {
  findDefaultCategories(): Promise<ICategory[]>;
  findUserCategories(userId: Types.ObjectId): Promise<ICategory[]>;
  createCustomCategory(data: Partial<ICategory>): Promise<ICategory>;
}

export default mongoose.model<ICategory, ICategoryModel>('Category', CategorySchema);
