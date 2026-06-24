import mongoose, { Schema, Document, Types } from 'mongoose';

// Genetic traits for habits
export interface HabitGenetics {
  // Consistency gene (how predictable the habit is)
  consistency: {
    level: number; // 0-100
    volatility: number; // 0-100
    stability: number; // 0-100
  };

  // Difficulty gene (inherent challenge level)
  difficulty: {
    level: number; // 0-100
    learningCurve: number; // 0-100
    adaptability: number; // 0-100
  };

  // Energy gene (how much energy required)
  energy: {
    morning: number; // 0-100
    afternoon: number; // 0-100
    evening: number; // 0-100
    optimum: 'morning' | 'afternoon' | 'evening' | 'night';
  };

  // Success gene (historical performance)
  success: {
    completionRate: number; // 0-100
    streakAffinity: number; // 0-100
    recoverySpeed: number; // 0-100 (how fast after breaking streak)
  };

  // Social gene (how this habit interacts with social features)
  social: {
    contagiousness: number; // 0-100 (how easily it spreads to friends)
    collaborationBoost: number; // 0-100 (performance boost when done with others)
    accountability: number; // 0-100 (how much accountability helps)
  };

  // Wellness gene (impact on user wellbeing)
  wellness: {
    moodBoost: number; // 0-100
    stressReduction: number; // 0-100
    energyReturn: number; // 0-100 (energy gained vs spent)
  };
}

// Mutation types
export type MutationType = 'beneficial' | 'neutral' | 'detrimental' | 'adaptive';

export interface IHabitDNA extends Document {
  userId: Types.ObjectId;
  habitId: Types.ObjectId;

  // Primary genetics
  genetics: HabitGenetics;

  // Ancestry tracking
  parentIds?: Types.ObjectId[]; // Parent habits (if bred)
  generation: number; // 0 = original, 1+ = bred
  lineage?: string[][]; // Names of ancestors

  // Mutation history
  mutations: Array<{
    type: MutationType;
    gene: string;
    oldValue: number;
    newValue: number;
    timestamp: Date;
    reason: string;
  }>;

  // Breeding potential
  breedingStats: {
    attractiveness: number; // 0-100 (how appealing to other habits)
    fertility: number; // 0-100 (chance of successful breeding)
    dominance: {
      consistency: number; // 0-100 (how strongly passed to offspring)
      difficulty: number;
      energy: number;
      success: number;
    };
  };

  // Evolution potential
  evolution: {
    currentLevel: number; // 1-100
    potential: number; // 0-100
    nextMilestone: number; // XP to next evolution
    unlockedTraits: string[];
  };

  // Metadata
  metadata: {
    createdAt: Date;
    lastAnalyzed: Date;
    analysisConfidence: number; // 0-100
    dataPoints: number; // How much data this is based on
  };
}

const HabitDNASchema = new Schema<IHabitDNA>(
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
      unique: true,
      index: true,
    },

    // Primary genetics
    genetics: {
      consistency: {
        level: { type: Number, default: 50, min: 0, max: 100 },
        volatility: { type: Number, default: 50, min: 0, max: 100 },
        stability: { type: Number, default: 50, min: 0, max: 100 },
      },
      difficulty: {
        level: { type: Number, default: 50, min: 0, max: 100 },
        learningCurve: { type: Number, default: 50, min: 0, max: 100 },
        adaptability: { type: Number, default: 50, min: 0, max: 100 },
      },
      energy: {
        morning: { type: Number, default: 50, min: 0, max: 100 },
        afternoon: { type: Number, default: 50, min: 0, max: 100 },
        evening: { type: Number, default: 50, min: 0, max: 100 },
        optimum: {
          type: String,
          enum: ['morning', 'afternoon', 'evening', 'night'],
          default: 'morning',
        },
      },
      success: {
        completionRate: { type: Number, default: 50, min: 0, max: 100 },
        streakAffinity: { type: Number, default: 50, min: 0, max: 100 },
        recoverySpeed: { type: Number, default: 50, min: 0, max: 100 },
      },
      social: {
        contagiousness: { type: Number, default: 50, min: 0, max: 100 },
        collaborationBoost: { type: Number, default: 50, min: 0, max: 100 },
        accountability: { type: Number, default: 50, min: 0, max: 100 },
      },
      wellness: {
        moodBoost: { type: Number, default: 50, min: 0, max: 100 },
        stressReduction: { type: Number, default: 50, min: 0, max: 100 },
        energyReturn: { type: Number, default: 50, min: 0, max: 100 },
      },
    },

    // Ancestry tracking
    parentIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Habit',
    }],
    generation: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineage: [[String]], // Array of arrays (each generation)

    // Mutation history
    mutations: [{
      type: {
        type: String,
        enum: ['beneficial', 'neutral', 'detrimental', 'adaptive'],
      },
      gene: String,
      oldValue: Number,
      newValue: Number,
      timestamp: Date,
      reason: String,
    }],

    // Breeding stats
    breedingStats: {
      attractiveness: { type: Number, default: 50, min: 0, max: 100 },
      fertility: { type: Number, default: 50, min: 0, max: 100 },
      dominance: {
        consistency: { type: Number, default: 50, min: 0, max: 100 },
        difficulty: { type: Number, default: 50, min: 0, max: 100 },
        energy: { type: Number, default: 50, min: 0, max: 100 },
        success: { type: Number, default: 50, min: 0, max: 100 },
      },
    },

    // Evolution system
    evolution: {
      currentLevel: { type: Number, default: 1, min: 1, max: 100 },
      potential: { type: Number, default: 50, min: 0, max: 100 },
      nextMilestone: { type: Number, default: 100 },
      unlockedTraits: [String],
    },

    // Metadata
    metadata: {
      createdAt: { type: Date, default: Date.now },
      lastAnalyzed: { type: Date, default: Date.now },
      analysisConfidence: { type: Number, default: 50, min: 0, max: 100 },
      dataPoints: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
HabitDNASchema.index({ userId: 1, generation: 1 });
HabitDNASchema.index({ 'genetics.success.completionRate': -1 });
HabitDNASchema.index({ 'breedingStats.attractiveness': -1 });
HabitDNASchema.index({ 'evolution.currentLevel': -1 });

// Virtual for genetic strength
HabitDNASchema.virtual('geneticStrength').get(function(this: IHabitDNA) {
  const g = this.genetics;
  return Math.round((
    g.consistency.level +
    g.success.completionRate +
    g.wellness.moodBoost +
    this.breedingStats.attractiveness
  ) / 4);
});

// Pre-save middleware for evolution calculation
HabitDNASchema.pre('save', function(next) {
  if (this.isModified('genetics')) {
    // Update evolution progress based on genetic improvements
    const totalGeneticValue = Object.values(this.genetics)
      .flatMap((gene: any) => typeof gene === 'object' ? Object.values(gene) : [])
      .reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);

    this.evolution.currentLevel = Math.floor(totalGeneticValue / 15); // ~15 genetic points per level
    this.evolution.nextMilestone = (this.evolution.currentLevel + 1) * 15;

    // Update analysis confidence based on data points
    this.metadata.analysisConfidence = Math.min(100, this.metadata.dataPoints * 2);
  }
  next();
});

export default mongoose.model<IHabitDNA>('HabitDNA', HabitDNASchema);