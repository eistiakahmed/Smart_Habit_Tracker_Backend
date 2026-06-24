import mongoose, { Schema, Document, Types } from 'mongoose';

export type EnergyLevel = 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
export type EnergySource = 'HABIT_COMPLETION' | 'USER_REPORTED' | 'DETECTED' | 'PREDICTED';
export type ActivityType = 'EXERCISE' | 'WORK' | 'SOCIAL' | 'REST' | 'HOBBY' | 'CHORES' | 'LEARNING';

export interface IEnergyLog extends Document {
  userId: Types.ObjectId;

  // Energy level data
  energyLevel: EnergyLevel;
  energyScore: number; // 0-100 numerical score
  timestamp: Date;

  // Source and confidence
  source: EnergySource;
  confidence: number; // 0-100 how confident we are in this reading

  // Contextual data
  context: {
    activity?: ActivityType;
    habitId?: Types.ObjectId;
    mood?: number; // 1-5 mood rating
    stress?: number; // 1-5 stress level
    sleep?: number; // hours of sleep last night
    location?: string;
    withOthers?: boolean;
  };

  // Factors affecting energy
  factors: {
    caffeine?: number; // mg consumed
    exercise?: boolean;
    meal?: boolean;
    weather?: string;
    season?: string;
  };

  createdAt: Date;
}

export interface IEnergyPattern extends Document {
  userId: Types.ObjectId;

  // Pattern identification
  patternName: string;
  patternType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASONAL';

  // Time-based patterns
  timePatterns: {
    morning: {
      average: number; // 0-100
      peak: number;
      consistency: number; // 0-100
    };
    afternoon: {
      average: number;
      peak: number;
      consistency: number;
    };
    evening: {
      average: number;
      peak: number;
      consistency: number;
    };
    night: {
      average: number;
      peak: number;
      consistency: number;
    };
  };

  // Day-based patterns
  dayPatterns: Array<{
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    average: number;
    peak: number;
  }>;

  // Pattern confidence and reliability
  reliability: number; // 0-100
  dataPoints: number;
  lastUpdated: Date;

  // Predictions
  predictions: {
    nextPeak: Date;
    nextLow: Date;
    confidence: number;
  };

  createdAt: Date;
}

export interface IScheduleRecommendation extends Document {
  userId: Types.ObjectId;
  habitId: Types.ObjectId;

  // Recommendation details
  recommendedTime: Date;
  confidence: number; // 0-100
  priority: number; // 1-10

  // Reasoning
  factors: {
    energyMatch: number; // How well habit matches energy pattern
    historical: number; // Based on past performance
    preference: number; // User preference alignment
    constraints: string[]; // Any scheduling conflicts
  };

  // Performance tracking
  tracking: {
    followed: boolean;
    actualTime?: Date;
    outcome?: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    energyAtTime?: number;
  };

  // Validity
  validUntil: Date;
  createdAt: Date;
}

export interface IEnergyGoal extends Document {
  userId: Types.ObjectId;

  // Goal details
  title: string;
  description?: string;

  // Target energy management
  target: {
    minimum: number; // Minimum energy to maintain
    optimal: number; // Optimal energy level
    maximum: number; // Maximum energy (avoid burnout)
  };

  // Time-based targets
  schedule: {
    morning: { min: number; max: number };
    afternoon: { min: number; max: number };
    evening: { min: number; max: number };
    night: { min: number; max: number };
  };

  // Goal tracking
  progress: {
    currentLevel: number;
    adherenceRate: number; // % of time within target range
    totalDays: number;
    successfulDays: number;
  };

  // Goal status
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  startDate: Date;
  targetDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// Energy Log Schema
const EnergyLogSchema = new Schema<IEnergyLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    energyLevel: {
      type: String,
      enum: ['VERY_LOW', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'],
      required: true,
    },
    energyScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['HABIT_COMPLETION', 'USER_REPORTED', 'DETECTED', 'PREDICTED'],
      default: 'USER_REPORTED',
    },
    confidence: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    context: {
      activity: {
        type: String,
        enum: ['EXERCISE', 'WORK', 'SOCIAL', 'REST', 'HOBBY', 'CHORES', 'LEARNING'],
      },
      habitId: { type: Schema.Types.ObjectId, ref: 'Habit' },
      mood: { type: Number, min: 1, max: 5 },
      stress: { type: Number, min: 1, max: 5 },
      sleep: Number,
      location: String,
      withOthers: Boolean,
    },
    factors: {
      caffeine: Number,
      exercise: Boolean,
      meal: Boolean,
      weather: String,
      season: String,
    },
  },
  {
    timestamps: true,
  }
);

// Energy Pattern Schema
const EnergyPatternSchema = new Schema<IEnergyPattern>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patternName: {
      type: String,
      required: true,
    },
    patternType: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'SEASONAL'],
      default: 'DAILY',
    },
    timePatterns: {
      morning: {
        average: { type: Number, default: 50 },
        peak: { type: Number, default: 50 },
        consistency: { type: Number, default: 50 },
      },
      afternoon: {
        average: { type: Number, default: 50 },
        peak: { type: Number, default: 50 },
        consistency: { type: Number, default: 50 },
      },
      evening: {
        average: { type: Number, default: 50 },
        peak: { type: Number, default: 50 },
        consistency: { type: Number, default: 50 },
      },
      night: {
        average: { type: Number, default: 50 },
        peak: { type: Number, default: 50 },
        consistency: { type: Number, default: 50 },
      },
    },
    dayPatterns: [{
      dayOfWeek: { type: Number, min: 0, max: 6 },
      average: Number,
      peak: Number,
    }],
    reliability: { type: Number, default: 50, min: 0, max: 100 },
    dataPoints: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    predictions: {
      nextPeak: Date,
      nextLow: Date,
      confidence: { type: Number, default: 50 },
    },
  },
  {
    timestamps: true,
  }
);

// Schedule Recommendation Schema
const ScheduleRecommendationSchema = new Schema<IScheduleRecommendation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    habitId: {
      type: Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    recommendedTime: {
      type: Date,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    factors: {
      energyMatch: { type: Number, default: 50 },
      historical: { type: Number, default: 50 },
      preference: { type: Number, default: 50 },
      constraints: [String],
    },
    tracking: {
      followed: { type: Boolean, default: false },
      actualTime: Date,
      outcome: { type: String, enum: ['SUCCESS', 'PARTIAL', 'FAILED'] },
      energyAtTime: Number,
    },
    validUntil: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Energy Goal Schema
const EnergyGoalSchema = new Schema<IEnergyGoal>(
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
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    target: {
      minimum: { type: Number, required: true, min: 0, max: 100 },
      optimal: { type: Number, required: true, min: 0, max: 100 },
      maximum: { type: Number, required: true, min: 0, max: 100 },
    },
    schedule: {
      morning: { min: Number, max: Number },
      afternoon: { min: Number, max: Number },
      evening: { min: Number, max: Number },
      night: { min: Number, max: Number },
    },
    progress: {
      currentLevel: { type: Number, default: 50 },
      adherenceRate: { type: Number, default: 0 },
      totalDays: { type: Number, default: 0 },
      successfulDays: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED'],
      default: 'ACTIVE',
    },
    startDate: { type: Date, required: true },
    targetDate: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
EnergyLogSchema.index({ userId: 1, timestamp: -1 });
EnergyLogSchema.index({ userId: 1, energyScore: -1 });
EnergyLogSchema.index({ timestamp: -1 }); // For cleanup and analysis

EnergyPatternSchema.index({ userId: 1, patternType: 1 });
EnergyPatternSchema.index({ reliability: -1 });

ScheduleRecommendationSchema.index({ userId: 1, habitId: 1 });
ScheduleRecommendationSchema.index({ recommendedTime: 1 });
ScheduleRecommendationSchema.index({ confidence: -1 });

EnergyGoalSchema.index({ userId: 1, status: 1 });
EnergyGoalSchema.index({ startDate: 1 });

// Virtual for energy level calculation
EnergyLogSchema.virtual('timeOfDay').get(function(this: IEnergyLog) {
  const hour = this.timestamp.getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
});

export const EnergyLog = mongoose.model<IEnergyLog>('EnergyLog', EnergyLogSchema);
export const EnergyPattern = mongoose.model<IEnergyPattern>('EnergyPattern', EnergyPatternSchema);
export const ScheduleRecommendation = mongoose.model<IScheduleRecommendation>('ScheduleRecommendation', ScheduleRecommendationSchema);
export const EnergyGoal = mongoose.model<IEnergyGoal>('EnergyGoal', EnergyGoalSchema);