import { Types } from 'mongoose';
import { EnergyLog, EnergyPattern, ScheduleRecommendation, EnergyGoal } from '@/models/EnergyTracking';
import Habit from '@/models/Habit';
import HabitLog from '@/models/HabitLog';
import User from '@/models/User';
import logger from '@/utils/logger';

class EnergySchedulingService {
  // Energy Logging

  async logEnergy(userId: string, energyData: any): Promise<any> {
    try {
      // Calculate energy score if level provided
      let energyScore = energyData.energyScore;
      if (!energyScore && energyData.energyLevel) {
        energyScore = this.levelToScore(energyData.energyLevel);
      }

      const energyLog = await EnergyLog.create({
        userId: new Types.ObjectId(userId),
        energyLevel: energyData.energyLevel || this.scoreToLevel(energyScore),
        energyScore: energyScore || 50,
        timestamp: energyData.timestamp || new Date(),
        source: energyData.source || 'USER_REPORTED',
        confidence: energyData.confidence || 50,
        context: energyData.context || {},
        factors: energyData.factors || {},
      });

      // Update patterns if we have enough data
      await this.updateEnergyPatterns(userId);

      logger.info(`Energy logged for user ${userId}: ${energyScore}`);

      return energyLog;
    } catch (error: any) {
      logger.error('Log energy error:', error);
      throw error;
    }
  }

  async logEnergyFromHabit(habitId: string, userId: string, completionData: any = {}): Promise<any> {
    try {
      // Predict energy based on habit completion
      const habit = await Habit.findOne({
        _id: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      }).populate('category');

      if (!habit) {
        throw new Error('Habit not found');
      }

      // Get category name from populated category
      const categoryName = (habit.category as any)?.name || 'General';

      // Calculate energy impact based on habit difficulty and completion
      const baseEnergy = 50;
      const difficultyImpact = habit.difficulty === 'HARD' ? -20 : habit.difficulty === 'EASY' ? 10 : 0;
      const moodBonus = completionData.mood ? (completionData.mood - 3) * 5 : 0;

      const predictedEnergy = Math.max(0, Math.min(100, baseEnergy + difficultyImpact + moodBonus));

      const energyLog = await this.logEnergy(userId, {
        energyScore: predictedEnergy,
        timestamp: new Date(),
        source: 'HABIT_COMPLETION',
        confidence: 70,
        context: {
          activity: this.habitToActivity(categoryName),
          habitId: new Types.ObjectId(habitId),
          mood: completionData.mood,
        },
        factors: {
          exercise: categoryName === 'HEALTH',
        },
      });

      return energyLog;
    } catch (error: any) {
      logger.error('Log energy from habit error:', error);
      throw error;
    }
  }

  // Energy Analysis

  async getTodayEnergyLogs(userId: string): Promise<any[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const logs = await EnergyLog.find({
        userId: new Types.ObjectId(userId),
        timestamp: {
          $gte: today,
          $lt: tomorrow,
        },
      }).sort({ timestamp: -1 });

      return logs;
    } catch (error: any) {
      logger.error('Get today energy logs error:', error);
      throw error;
    }
  }

  async getCurrentEnergyLevel(userId: string): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const latestLog = await EnergyLog.findOne({
        userId: new Types.ObjectId(userId),
        timestamp: {
          $gte: today,
          $lt: tomorrow,
        },
      }).sort({ timestamp: -1 });

      if (!latestLog) {
        return {
          energyLevel: 'MODERATE',
          energyScore: 50,
          timestamp: new Date(),
          source: 'DEFAULT',
        };
      }

      return {
        energyLevel: latestLog.energyLevel,
        energyScore: latestLog.energyScore,
        timestamp: latestLog.timestamp,
        source: latestLog.source,
      };
    } catch (error: any) {
      logger.error('Get current energy level error:', error);
      throw error;
    }
  }

  async getEnergyPatterns(userId: string): Promise<any[]> {
    try {
      const patterns = await EnergyPattern.find({
        userId: new Types.ObjectId(userId),
      }).sort({ reliability: -1 });

      return patterns;
    } catch (error: any) {
      logger.error('Get energy patterns error:', error);
      throw error;
    }
  }

  async analyzeEnergyPatterns(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId).select('timezone');
      const timezone = user?.timezone || 'UTC';

      // Get recent energy logs
      const energyLogs = await EnergyLog.find({
        userId: new Types.ObjectId(userId),
      })
        .sort({ timestamp: -1 })
        .limit(200); // Analyze last 200 logs

      if (energyLogs.length < 10) {
        throw new Error('Not enough energy data for analysis. Need at least 10 logs.');
      }

      // Analyze time patterns
      const timePatterns = this.analyzeTimePatterns(energyLogs, timezone);

      // Analyze day patterns
      const dayPatterns = this.analyzeDayPatterns(energyLogs, timezone);

      // Calculate reliability
      const reliability = Math.min(100, energyLogs.length / 2); // More data = higher reliability

      // Generate predictions
      const predictions = this.generateEnergyPredictions(timePatterns);

      // Create or update pattern
      let pattern = await EnergyPattern.findOne({
        userId: new Types.ObjectId(userId),
        patternType: 'DAILY',
      });

      if (pattern) {
        pattern.timePatterns = timePatterns;
        pattern.dayPatterns = dayPatterns;
        pattern.reliability = reliability;
        pattern.dataPoints = energyLogs.length;
        pattern.predictions = predictions;
        pattern.lastUpdated = new Date();
        await pattern.save();
      } else {
        pattern = await EnergyPattern.create({
          userId: new Types.ObjectId(userId),
          patternName: 'Daily Energy Pattern',
          patternType: 'DAILY',
          timePatterns,
          dayPatterns,
          reliability,
          dataPoints: energyLogs.length,
          predictions,
        });
      }

      logger.info(`Energy patterns analyzed for user ${userId}`);

      return {
        pattern,
        insights: this.generateEnergyInsights(timePatterns, dayPatterns),
      };
    } catch (error: any) {
      logger.error('Analyze energy patterns error:', error);
      throw error;
    }
  }

  // Smart Scheduling

  async generateScheduleRecommendations(userId: string, habitId: string): Promise<any> {
    try {
      const habit = await Habit.findOne({
        _id: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!habit) {
        throw new Error('Habit not found');
      }

      // Get user's energy patterns
      const pattern = await EnergyPattern.findOne({
        userId: new Types.ObjectId(userId),
        patternType: 'DAILY',
      });

      if (!pattern) {
        throw new Error('No energy patterns found. Please complete more habits first.');
      }

      // Get historical performance data
      const habitLogs = await HabitLog.find({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      })
        .sort({ completedAt: -1 })
        .limit(50);

      // Analyze optimal times based on energy patterns
      const recommendations = [];

      // Morning recommendation
      const morningScore = this.calculateTimeRecommendationScore('morning', habit, pattern, habitLogs);
      if (morningScore.confidence > 40) {
        recommendations.push({
          timeOfDay: 'morning',
          confidence: morningScore.confidence,
          factors: morningScore.factors,
          suggestedTime: this.suggestSpecificTime('morning', pattern),
        });
      }

      // Afternoon recommendation
      const afternoonScore = this.calculateTimeRecommendationScore('afternoon', habit, pattern, habitLogs);
      if (afternoonScore.confidence > 40) {
        recommendations.push({
          timeOfDay: 'afternoon',
          confidence: afternoonScore.confidence,
          factors: afternoonScore.factors,
          suggestedTime: this.suggestSpecificTime('afternoon', pattern),
        });
      }

      // Evening recommendation
      const eveningScore = this.calculateTimeRecommendationScore('evening', habit, pattern, habitLogs);
      if (eveningScore.confidence > 40) {
        recommendations.push({
          timeOfDay: 'evening',
          confidence: eveningScore.confidence,
          factors: eveningScore.factors,
          suggestedTime: this.suggestSpecificTime('evening', pattern),
        });
      }

      // Sort by confidence
      recommendations.sort((a, b) => b.confidence - a.confidence);

      // Save best recommendation
      if (recommendations.length > 0) {
        const best = recommendations[0];
        await ScheduleRecommendation.create({
          userId: new Types.ObjectId(userId),
          habitId: new Types.ObjectId(habitId),
          recommendedTime: best.suggestedTime,
          confidence: best.confidence,
          priority: this.calculatePriority(habit, best.confidence),
          factors: best.factors,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
        });
      }

      logger.info(`Schedule recommendations generated for habit ${habitId}`);

      return {
        habit: habit.title,
        recommendations,
        bestMatch: recommendations[0] || null,
        energyPattern: {
          peakTime: this.findPeakEnergyTime(pattern),
          lowTime: this.findLowEnergyTime(pattern),
        },
      };
    } catch (error: any) {
      logger.error('Generate schedule recommendations error:', error);
      throw error;
    }
  }

  async getOptimalSchedule(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId);
      const timezone = user?.timezone || 'UTC';

      // Get all active habits
      const habits = await Habit.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      });

      // Get energy patterns
      const pattern = await EnergyPattern.findOne({
        userId: new Types.ObjectId(userId),
        patternType: 'DAILY',
      });

      if (!pattern) {
        throw new Error('No energy patterns found');
      }

      // Generate optimal schedule
      const schedule: Record<string, Array<{
        habit: string;
        habitId: Types.ObjectId;
        confidence: any;
        suggestedTime: any;
        difficulty: string;
      }>> = {
        morning: [],
        afternoon: [],
        evening: [],
        night: [],
      };

      for (const habit of habits) {
        const timeRec = await this.generateScheduleRecommendations(userId, habit._id.toString());
        if (timeRec.bestMatch) {
          const timeOfDay = timeRec.bestMatch.timeOfDay;
          if (schedule[timeOfDay]) {
            schedule[timeOfDay].push({
              habit: habit.title,
              habitId: habit._id,
              confidence: timeRec.bestMatch.confidence,
              suggestedTime: timeRec.bestMatch.suggestedTime,
              difficulty: habit.difficulty,
            });
          }
        }
      }

      // Sort each time block by confidence
      for (const timeBlock in schedule) {
        schedule[timeBlock].sort((a, b) => b.confidence - a.confidence);
      }

      return {
        schedule,
        energyPattern: pattern,
        timezone,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('Get optimal schedule error:', error);
      throw error;
    }
  }

  // Energy Goals

  async getEnergyGoals(userId: string): Promise<any[]> {
    try {
      const goals = await EnergyGoal.find({
        userId: new Types.ObjectId(userId),
      }).sort({ createdAt: -1 });

      // Update progress for each goal
      const goalsWithProgress = await Promise.all(
        goals.map(async (goal) => {
          await this.trackEnergyGoalProgress(goal._id.toString(), userId);
          return goal;
        })
      );

      return goalsWithProgress;
    } catch (error: any) {
      logger.error('Get energy goals error:', error);
      throw error;
    }
  }

  async getEnergyInsights(userId: string): Promise<any> {
    try {
      const pattern = await EnergyPattern.findOne({
        userId: new Types.ObjectId(userId),
        patternType: 'DAILY',
      });

      if (!pattern) {
        throw new Error('No energy patterns found. Please complete more habits first.');
      }

      const goals = await EnergyGoal.find({
        userId: new Types.ObjectId(userId),
        status: 'ACTIVE',
      });

      const insights = this.generateEnergyInsights(pattern.timePatterns, pattern.dayPatterns);

      return {
        pattern,
        goals,
        insights,
        recommendations: {
          peakTime: this.findPeakEnergyTime(pattern),
          lowTime: this.findLowEnergyTime(pattern),
          bestHabitsForPeak: this.getBestHabitsForTime(pattern, 'peak'),
          bestHabitsForLow: this.getBestHabitsForTime(pattern, 'low'),
        },
      };
    } catch (error: any) {
      logger.error('Get energy insights error:', error);
      throw error;
    }
  }

  private getBestHabitsForTime(_pattern: any, energyType: 'peak' | 'low'): string[] {
    // This would analyze habits and recommend based on energy levels
    // For now, return generic recommendations
    if (energyType === 'peak') {
      return ['Challenging habits', 'Learning new skills', 'Creative work'];
    }
    return ['Light habits', 'Review tasks', 'Planning'];
  }

  async createEnergyGoal(userId: string, goalData: any): Promise<any> {
    try {
      const energyGoal = await EnergyGoal.create({
        userId: new Types.ObjectId(userId),
        title: goalData.title,
        description: goalData.description,
        target: goalData.target,
        schedule: goalData.schedule,
        status: 'ACTIVE',
        startDate: new Date(),
        targetDate: goalData.targetDate,
      });

      logger.info(`Energy goal created for user ${userId}: ${goalData.title}`);

      return energyGoal;
    } catch (error: any) {
      logger.error('Create energy goal error:', error);
      throw error;
    }
  }

  async trackEnergyGoalProgress(goalId: string, userId: string): Promise<any> {
    try {
      const goal = await EnergyGoal.findOne({
        _id: new Types.ObjectId(goalId),
        userId: new Types.ObjectId(userId),
      });

      if (!goal) {
        throw new Error('Energy goal not found');
      }

      // Get recent energy logs
      const recentLogs = await EnergyLog.find({
        userId: new Types.ObjectId(userId),
        timestamp: {
          $gte: goal.startDate,
          $lte: goal.targetDate || new Date(),
        },
      });

      // Calculate adherence
      let totalReadings = 0;
      let successfulReadings = 0;

      for (const log of recentLogs) {
        totalReadings++;
        const energy = log.energyScore;

        // Check if within target range
        if (energy >= goal.target.minimum && energy <= goal.target.maximum) {
          successfulReadings++;
        }
      }

      const adherenceRate = totalReadings > 0 ? (successfulReadings / totalReadings) * 100 : 0;

      // Update goal progress
      goal.progress.adherenceRate = Math.round(adherenceRate);
      goal.progress.totalDays = totalReadings;
      goal.progress.successfulDays = successfulReadings;
      goal.progress.currentLevel = recentLogs.length > 0
        ? recentLogs[recentLogs.length - 1].energyScore
        : 50;

      // Check goal completion
      if (goal.targetDate && new Date() >= goal.targetDate) {
        goal.status = adherenceRate >= 80 ? 'COMPLETED' : 'FAILED';
      }

      await goal.save();

      return goal;
    } catch (error: any) {
      logger.error('Track energy goal progress error:', error);
      throw error;
    }
  }

  // Helper Methods

  private async updateEnergyPatterns(userId: string): Promise<void> {
    // Check if we should update patterns (every 20 new logs)
    const logCount = await EnergyLog.countDocuments({ userId: new Types.ObjectId(userId) });
    const pattern = await EnergyPattern.findOne({ userId: new Types.ObjectId(userId) });

    if (logCount >= 20 && (!pattern || logCount - pattern.dataPoints >= 20)) {
      await this.analyzeEnergyPatterns(userId);
    }
  }

  private analyzeTimePatterns(logs: any[], _timezone: string): any {
    const timeGroups: Record<string, number[]> = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };

    for (const log of logs) {
      const hour = log.timestamp.getHours();
      const timeOfDay = this.getTimeOfDay(hour);
      timeGroups[timeOfDay].push(log.energyScore);
    }

    const calculateStats = (scores: number[]) => {
      if (scores.length === 0) return { average: 50, peak: 50, consistency: 0 };
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      const peak = Math.max(...scores);
      const variance = scores.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / scores.length;
      const consistency = Math.max(0, 100 - Math.sqrt(variance));
      return { average, peak, consistency };
    };

    return {
      morning: calculateStats(timeGroups.morning),
      afternoon: calculateStats(timeGroups.afternoon),
      evening: calculateStats(timeGroups.evening),
      night: calculateStats(timeGroups.night),
    };
  }

  private analyzeDayPatterns(logs: any[], _timezone: string): any[] {
    const dayGroups: number[][] = Array.from({ length: 7 }, () => []);

    for (const log of logs) {
      const dayOfWeek = log.timestamp.getDay();
      dayGroups[dayOfWeek].push(log.energyScore);
    }

    return dayGroups.map((scores, dayOfWeek) => ({
      dayOfWeek,
      average: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50,
      peak: scores.length > 0 ? Math.max(...scores) : 50,
    }));
  }

  private generateEnergyPredictions(timePatterns: any): any {
    // Find peak and low energy times
    const times = ['morning', 'afternoon', 'evening', 'night'] as const;
    let peakTime = 'morning';
    let lowTime = 'morning';
    let peakScore = 0;
    let lowScore = 100;

    for (const time of times) {
      const score = timePatterns[time].average;
      if (score > peakScore) {
        peakScore = score;
        peakTime = time;
      }
      if (score < lowScore) {
        lowScore = score;
        lowTime = time;
      }
    }

    return {
      nextPeak: this.nextTimeOfDay(peakTime),
      nextLow: this.nextTimeOfDay(lowTime),
      confidence: Math.round(peakScore - lowScore),
    };
  }

  private calculateTimeRecommendationScore(timeOfDay: string, habit: any, pattern: any, habitLogs: any[]): any {
    const timePattern = pattern.timePatterns[timeOfDay];

    // Energy match: how well habit energy needs match available energy
    const energyNeeds = habit.difficulty === 'HARD' ? 70 : habit.difficulty === 'EASY' ? 30 : 50;
    const energyMatch = 100 - Math.abs(timePattern.average - energyNeeds);

    // Historical: how well has user performed at this time
    const timeLogs = habitLogs.filter(log => {
      const hour = log.completedAt.getHours();
      return this.getTimeOfDay(hour) === timeOfDay;
    });

    const historical = timeLogs.length > 0
      ? Math.min(100, timeLogs.length * 10)
      : 50;

    // Consistency bonus
    const consistency = timePattern.consistency;

    const confidence = Math.round((energyMatch + historical + consistency) / 3);

    return {
      confidence,
      factors: {
        energyMatch,
        historical,
        consistency,
      },
    };
  }

  private suggestSpecificTime(timeOfDay: string, _pattern: any): Date {
    const now = new Date();
    const suggested = new Date(now);

    switch (timeOfDay) {
      case 'morning':
        suggested.setHours(8, 0, 0, 0);
        break;
      case 'afternoon':
        suggested.setHours(14, 0, 0, 0);
        break;
      case 'evening':
        suggested.setHours(18, 0, 0, 0);
        break;
      case 'night':
        suggested.setHours(21, 0, 0, 0);
        break;
    }

    // If time has passed, suggest for tomorrow
    if (suggested <= now) {
      suggested.setDate(suggested.getDate() + 1);
    }

    return suggested;
  }

  private calculatePriority(habit: any, confidence: number): number {
    let priority = 5; // Base priority

    if (habit.difficulty === 'HARD') priority += 2;
    if (habit.difficulty === 'EASY') priority -= 1;
    if (habit.isPinned) priority += 3;
    if (confidence > 70) priority += 2;

    return Math.min(10, Math.max(1, priority));
  }

  private generateEnergyInsights(timePatterns: any, dayPatterns: any[]): string[] {
    const insights = [];

    // Find peak energy time
    const times = ['morning', 'afternoon', 'evening', 'night'] as const;
    let peakTime = 'morning';
    let peakScore = 0;

    for (const time of times) {
      if (timePatterns[time].average > peakScore) {
        peakScore = timePatterns[time].average;
        peakTime = time;
      }
    }

    insights.push(`Your peak energy time is ${peakTime} with an average score of ${Math.round(peakScore)}`);

    // Find best day
    const bestDay = dayPatterns.reduce((best, day) =>
      day.average > best.average ? day : best
    );

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    insights.push(`Your best day is ${dayNames[bestDay.dayOfWeek]} with average energy ${Math.round(bestDay.average)}`);

    return insights;
  }

  private findPeakEnergyTime(pattern: any): string {
    const times = ['morning', 'afternoon', 'evening', 'night'] as const;
    let peakTime = 'morning';
    let peakScore = 0;

    for (const time of times) {
      if (pattern.timePatterns[time].average > peakScore) {
        peakScore = pattern.timePatterns[time].average;
        peakTime = time;
      }
    }

    return peakTime;
  }

  private findLowEnergyTime(pattern: any): string {
    const times = ['morning', 'afternoon', 'evening', 'night'] as const;
    let lowTime = 'morning';
    let lowScore = 100;

    for (const time of times) {
      if (pattern.timePatterns[time].average < lowScore) {
        lowScore = pattern.timePatterns[time].average;
        lowTime = time;
      }
    }

    return lowTime;
  }

  private levelToScore(level: string): number {
    const levels: any = {
      'VERY_LOW': 10,
      'LOW': 30,
      'MODERATE': 50,
      'HIGH': 75,
      'VERY_HIGH': 95,
    };
    return levels[level] || 50;
  }

  private scoreToLevel(score: number): string {
    if (score <= 20) return 'VERY_LOW';
    if (score <= 40) return 'LOW';
    if (score <= 60) return 'MODERATE';
    if (score <= 80) return 'HIGH';
    return 'VERY_HIGH';
  }

  private getTimeOfDay(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 24) return 'evening';
    return 'night';
  }

  private nextTimeOfDay(timeOfDay: string): Date {
    const now = new Date();
    const next = new Date(now);

    switch (timeOfDay) {
      case 'morning':
        next.setHours(8, 0, 0, 0);
        break;
      case 'afternoon':
        next.setHours(14, 0, 0, 0);
        break;
      case 'evening':
        next.setHours(18, 0, 0, 0);
        break;
      case 'night':
        next.setHours(21, 0, 0, 0);
        break;
    }

    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  private habitToActivity(category: string): string {
    const mapping: any = {
      'HEALTH': 'EXERCISE',
      'WORK': 'WORK',
      'LEARNING': 'LEARNING',
      'SOCIAL': 'SOCIAL',
      'FINANCE': 'WORK',
      'CREATIVITY': 'HOBBY',
    };
    return mapping[category] || 'OTHER';
  }
}

export default new EnergySchedulingService();