import mongoose, { Schema, Document, Types } from 'mongoose';

export type ScenarioType = 'ALTERNATIVE_TIMELINE' | 'STRATEGY_TEST' | 'HABIT_EXPERIMENT' | 'PREDICTION' | 'COMPARISON';
export type ScenarioStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';
export type VariableType = 'FREQUENCY' | 'DIFFICULTY' | 'TIMING' | 'DURATION' | 'CATEGORY' | 'REMINDER' | 'CUSTOM';

export interface IScenario extends Document {
  userId: Types.ObjectId;

  // Scenario details
  name: string;
  description: string;
  type: ScenarioType;
  status: ScenarioStatus;

  // Time parameters
  timeline: {
    startDate: Date;
    endDate: Date;
    simulatedPeriod: number; // in days
  };

  // Original habits (baseline)
  originalHabits: Array<{
    habitId: Types.ObjectId;
    habitData: any; // Snapshot of habit data
    performance: any; // Baseline performance metrics
  }>;

  // Modified habits (what changes in this scenario)
  modifiedHabits: Array<{
    habitId: Types.ObjectId;
    variables: Array<{
      type: VariableType;
      originalValue: any;
      newValue: any;
      reason: string;
    }>;
  }>;

  // Results and predictions
  results: {
    predictedCompletion: number; // Predicted completion rate
    predictedStreaks: number; // Predicted streak count
    confidence: number; // 0-100 confidence in prediction
    impact: {
      completionChange: number; // % change from baseline
      streakChange: number;
      energyImpact: number;
      wellbeingImpact: number;
    };
  };

  // Comparison with actual results (if scenario has run)
  actualResults?: {
    completion: number;
    streaks: number;
    accuracy: number; // How accurate was the prediction
  };

  // Learning insights
  insights: Array<{
    type: string;
    finding: string;
    confidence: number;
    actionable: boolean;
  }>;

  // Metadata
  metadata: {
    createdAt: Date;
    completedAt?: Date;
    processingTime?: number; // milliseconds
    algorithm: string;
    version: string;
  };
}

export interface ITimeBranch extends Document {
  userId: Types.ObjectId;
  scenarioId: Types.ObjectId;

  // Branch details
  branchName: string;
  branchPoint: Date; // Where this branch diverges from reality
  divergencePoint: Date; // Original divergence

  // Alternative history
  alternativeHistory: Array<{
    date: Date;
    event: string;
    reality: any; // What actually happened
    alternative: any; // What happened in this branch
    difference: string; // Description of difference
  }>;

  // Branch outcomes
  outcomes: {
    completionRate: number;
    totalCompletions: number;
    longestStreak: number;
    currencyEarned: number;
    achievements: string[];
  };

  // Comparison with reality
  comparison: {
    completionDifference: number;
    streakDifference: number;
    currencyDifference: number;
    betterIn: string[]; // Areas where this branch is better
    worseIn: string[]; // Areas where this branch is worse
  };

  createdAt: Date;
}

export interface IHabitExperiment extends Document {
  userId: Types.ObjectId;
  scenarioId: Types.ObjectId;

  // Experiment details
  experimentName: string;
  hypothesis: string;
  independentVariable: VariableType;
  dependentVariables: string[];

  // Control and test groups
  controlHabits: Array<{
    habitId: Types.ObjectId;
    performance: any;
  }>;

  testHabits: Array<{
    habitId: Types.ObjectId;
    modifications: any;
    performance: any;
  }>;

  // Experiment duration
  duration: {
    startDate: Date;
    endDate: Date;
    days: number;
  };

  // Results
  results: {
    hypothesisSupported: boolean;
    confidence: number;
    effectSize: number; // Magnitude of effect
    statisticalSignificance: number;
    insights: string[];
  };

  status: 'DESIGNED' | 'RUNNING' | 'COMPLETED' | 'INCONCLUSIVE';
  createdAt: Date;
  completedAt?: Date;
}

export interface IPredictionModel extends Document {
  userId: Types.ObjectId;

  // Model details
  modelName: string;
  version: string;
  algorithm: string;

  // Training data
  trainingData: {
    habits: any[];
    performance: any[];
    timeframe: {
      start: Date;
      end: Date;
    };
  };

  // Model parameters
  parameters: {
    accuracy: number; // Historical accuracy
    confidence: number;
    lastUpdated: Date;
  };

  // Predictions made
  predictions: Array<{
    madeAt: Date;
    forDate: Date;
    predicted: any;
    actual?: any;
    accuracy?: number;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

// Scenario Schema
const ScenarioSchema = new Schema<IScenario>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['ALTERNATIVE_TIMELINE', 'STRATEGY_TEST', 'HABIT_EXPERIMENT', 'PREDICTION', 'COMPARISON'],
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    timeline: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      simulatedPeriod: { type: Number, required: true },
    },
    originalHabits: [{
      habitId: { type: Schema.Types.ObjectId, ref: 'Habit' },
      habitData: Schema.Types.Mixed,
      performance: Schema.Types.Mixed,
    }],
    modifiedHabits: [{
      habitId: { type: Schema.Types.ObjectId, ref: 'Habit' },
      variables: [{
        type: {
          type: String,
          enum: ['FREQUENCY', 'DIFFICULTY', 'TIMING', 'DURATION', 'CATEGORY', 'REMINDER', 'CUSTOM'],
        },
        originalValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
        reason: String,
      }],
    }],
    results: {
      predictedCompletion: { type: Number, min: 0, max: 100 },
      predictedStreaks: { type: Number, min: 0 },
      confidence: { type: Number, min: 0, max: 100 },
      impact: {
        completionChange: Number,
        streakChange: Number,
        energyImpact: Number,
        wellbeingImpact: Number,
      },
    },
    actualResults: {
      completion: Number,
      streaks: Number,
      accuracy: { type: Number, min: 0, max: 100 },
    },
    insights: [{
      type: String,
      finding: String,
      confidence: { type: Number, min: 0, max: 100 },
      actionable: Boolean,
    }],
    metadata: {
      createdAt: { type: Date, default: Date.now },
      completedAt: Date,
      processingTime: Number,
      algorithm: { type: String, default: 'v1.0' },
      version: { type: String, default: '1.0' },
    },
  },
  {
    timestamps: true,
  }
);

// Time Branch Schema
const TimeBranchSchema = new Schema<ITimeBranch>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scenarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Scenario',
      required: true,
      index: true,
    },
    branchName: {
      type: String,
      required: true,
      maxlength: 100,
    },
    branchPoint: {
      type: Date,
      required: true,
    },
    divergencePoint: {
      type: Date,
      required: true,
    },
    alternativeHistory: [{
      date: Date,
      event: String,
      reality: Schema.Types.Mixed,
      alternative: Schema.Types.Mixed,
      difference: String,
    }],
    outcomes: {
      completionRate: { type: Number, min: 0, max: 100 },
      totalCompletions: { type: Number, min: 0 },
      longestStreak: { type: Number, min: 0 },
      currencyEarned: { type: Number, min: 0 },
      achievements: [String],
    },
    comparison: {
      completionDifference: Number,
      streakDifference: Number,
      currencyDifference: Number,
      betterIn: [String],
      worseIn: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Habit Experiment Schema
const HabitExperimentSchema = new Schema<IHabitExperiment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scenarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Scenario',
      required: true,
      index: true,
    },
    experimentName: {
      type: String,
      required: true,
      maxlength: 100,
    },
    hypothesis: {
      type: String,
      required: true,
      maxlength: 500,
    },
    independentVariable: {
      type: String,
      enum: ['FREQUENCY', 'DIFFICULTY', 'TIMING', 'DURATION', 'CATEGORY', 'REMINDER', 'CUSTOM'],
      required: true,
    },
    dependentVariables: [String],
    controlHabits: [{
      habitId: { type: Schema.Types.ObjectId, ref: 'Habit' },
      performance: Schema.Types.Mixed,
    }],
    testHabits: [{
      habitId: { type: Schema.Types.ObjectId, ref: 'Habit' },
      modifications: Schema.Types.Mixed,
      performance: Schema.Types.Mixed,
    }],
    duration: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      days: { type: Number, required: true },
    },
    results: {
      hypothesisSupported: Boolean,
      confidence: { type: Number, min: 0, max: 100 },
      effectSize: Number,
      statisticalSignificance: { type: Number, min: 0, max: 100 },
      insights: [String],
    },
    status: {
      type: String,
      enum: ['DESIGNED', 'RUNNING', 'COMPLETED', 'INCONCLUSIVE'],
      default: 'DESIGNED',
    },
  },
  {
    timestamps: true,
  }
);

// Prediction Model Schema
const PredictionModelSchema = new Schema<IPredictionModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    modelName: {
      type: String,
      required: true,
      maxlength: 100,
    },
    version: {
      type: String,
      required: true,
    },
    algorithm: {
      type: String,
      required: true,
    },
    trainingData: {
      habits: [Schema.Types.Mixed],
      performance: [Schema.Types.Mixed],
      timeframe: {
        start: Date,
        end: Date,
      },
    },
    parameters: {
      accuracy: { type: Number, min: 0, max: 100, default: 50 },
      confidence: { type: Number, min: 0, max: 100, default: 50 },
      lastUpdated: { type: Date, default: Date.now },
    },
    predictions: [{
      madeAt: Date,
      forDate: Date,
      predicted: Schema.Types.Mixed,
      actual: Schema.Types.Mixed,
      accuracy: Number,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ScenarioSchema.index({ userId: 1, status: 1 });
ScenarioSchema.index({ userId: 1, type: 1 });
ScenarioSchema.index({ 'timeline.startDate': 1, 'timeline.endDate': 1 });
ScenarioSchema.index({ 'results.confidence': -1 });

TimeBranchSchema.index({ userId: 1, scenarioId: 1 });
TimeBranchSchema.index({ branchPoint: -1 });

HabitExperimentSchema.index({ userId: 1, status: 1 });
HabitExperimentSchema.index({ scenarioId: 1 });

PredictionModelSchema.index({ userId: 1, algorithm: 1 });
PredictionModelSchema.index({ 'parameters.accuracy': -1 });

export const Scenario = mongoose.model<IScenario>('Scenario', ScenarioSchema);
export const TimeBranch = mongoose.model<ITimeBranch>('TimeBranch', TimeBranchSchema);
export const HabitExperiment = mongoose.model<IHabitExperiment>('HabitExperiment', HabitExperimentSchema);
export const PredictionModel = mongoose.model<IPredictionModel>('PredictionModel', PredictionModelSchema);