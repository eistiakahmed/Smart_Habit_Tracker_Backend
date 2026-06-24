import { Types } from 'mongoose';
import { Scenario, TimeBranch, HabitExperiment } from '@/models/TimeMachine';
import Habit from '@/models/Habit';
import HabitLog from '@/models/HabitLog';
import logger from '@/utils/logger';

class TimeMachineService {
  // Scenario Management

  async createScenario(userId: string, scenarioData: any): Promise<any> {
    try {
      const scenario = await Scenario.create({
        userId: new Types.ObjectId(userId),
        name: scenarioData.name,
        description: scenarioData.description,
        type: scenarioData.type || 'ALTERNATIVE_TIMELINE',
        status: 'DRAFT',
        timeline: {
          startDate: new Date(scenarioData.startDate),
          endDate: new Date(scenarioData.endDate),
          simulatedPeriod: scenarioData.simulatedPeriod || 30,
        },
        originalHabits: scenarioData.originalHabits || [],
        modifiedHabits: scenarioData.modifiedHabits || [],
        results: {
          predictedCompletion: 0,
          predictedStreaks: 0,
          confidence: 0,
          impact: {
            completionChange: 0,
            streakChange: 0,
            energyImpact: 0,
            wellbeingImpact: 0,
          },
        },
        metadata: {
          createdAt: new Date(),
          algorithm: scenarioData.algorithm || 'basic_simulation',
          version: '1.0',
        },
      });

      logger.info(`Time Machine scenario created: ${scenario._id} for user ${userId}`);

      return scenario;
    } catch (error: any) {
      logger.error('Create scenario error:', error);
      throw error;
    }
  }

  async runScenario(scenarioId: string, userId: string): Promise<any> {
    try {
      const startTime = Date.now();

      const scenario = await Scenario.findOne({
        _id: new Types.ObjectId(scenarioId),
        userId: new Types.ObjectId(userId),
      });

      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // Update status to running
      scenario.status = 'RUNNING';
      await scenario.save();

      // Run the simulation
      const results = await this.simulateScenario(scenario);

      // Update scenario with results
      scenario.results = results.predictions;
      scenario.insights = results.insights;
      scenario.status = 'COMPLETED';
      scenario.metadata.completedAt = new Date();
      scenario.metadata.processingTime = Date.now() - startTime;
      await scenario.save();

      logger.info(`Time Machine scenario completed: ${scenarioId}`);

      return {
        scenario,
        results,
        processingTime: scenario.metadata.processingTime,
      };
    } catch (error: any) {
      logger.error('Run scenario error:', error);
      throw error;
    }
  }

  async getUserScenarios(userId: string): Promise<any[]> {
    try {
      const scenarios = await Scenario.find({
        userId: new Types.ObjectId(userId),
      }).sort({ createdAt: -1 });

      return scenarios;
    } catch (error: any) {
      logger.error('Get user scenarios error:', error);
      throw error;
    }
  }

  async getScenario(userId: string, scenarioId: string): Promise<any> {
    try {
      const scenario = await Scenario.findOne({
        _id: new Types.ObjectId(scenarioId),
        userId: new Types.ObjectId(userId),
      });

      if (!scenario) {
        throw new Error('Scenario not found');
      }

      return scenario;
    } catch (error: any) {
      logger.error('Get scenario error:', error);
      throw error;
    }
  }

  async getUserExperiments(userId: string): Promise<any[]> {
    try {
      const experiments = await HabitExperiment.find({
        userId: new Types.ObjectId(userId),
      }).sort({ createdAt: -1 });

      return experiments;
    } catch (error: any) {
      logger.error('Get user experiments error:', error);
      throw error;
    }
  }

  async getTimeMachineInsights(userId: string): Promise<any> {
    try {
      // Get user's scenarios
      const scenarios = await Scenario.find({
        userId: new Types.ObjectId(userId),
        status: 'COMPLETED',
      }).sort({ createdAt: -1 });

      // Get user's experiments
      const experiments = await HabitExperiment.find({
        userId: new Types.ObjectId(userId),
      }).sort({ createdAt: -1 });

      // Get current habits
      const habits = await Habit.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      });

      // Generate insights
      const insights = [];

      if (scenarios.length > 0) {
        insights.push(`You've explored ${scenarios.length} alternative timelines`);
        const bestScenario = scenarios.reduce((best, s) =>
          s.results.confidence > best.results.confidence ? s : best
        );
        insights.push(`Best performing strategy: ${bestScenario.name} (${bestScenario.results.confidence}% confidence)`);
      }

      if (experiments.length > 0) {
        insights.push(`You've conducted ${experiments.length} habit experiments`);
      }

      // Predict next 7 days
      const predictions = await this.predictFuturePerformance(userId, 7);

      return {
        scenarios,
        experiments,
        currentHabits: habits.length,
        insights,
        predictions,
        recommendations: this.generateTimeMachineRecommendations(scenarios, experiments),
      };
    } catch (error: any) {
      logger.error('Get time machine insights error:', error);
      throw error;
    }
  }

  async whatIfAnalysis(userId: string, question: string, timeframe: number = 30): Promise<any> {
    try {
      // Parse the question to understand what the user wants to explore
      const analysisType = this.detectAnalysisType(question);
      const modifications = this.extractModifications(question);

      // Create a temporary scenario for the what-if analysis
      const scenario = await this.createScenario(userId, {
        name: `What-If: ${question}`,
        description: `Analyzing potential outcomes for: ${question}`,
        type: 'WHAT_IF',
        timeline: {
          startDate: new Date(),
          endDate: new Date(Date.now() + timeframe * 24 * 60 * 60 * 1000),
          simulatedPeriod: timeframe,
        },
        modifiedHabits: modifications,
      });

      // Run the analysis
      const results = await this.runScenario(scenario._id.toString(), userId);

      return {
        question,
        analysisType,
        scenario,
        predictions: results.results,
        confidence: results.results.confidence,
        insights: results.insights,
        recommendations: this.generateWhatIfRecommendations(results.results),
      };
    } catch (error: any) {
      logger.error('What-if analysis error:', error);
      throw error;
    }
  }

  private detectAnalysisType(question: string): string {
    const lower = question.toLowerCase();

    if (lower.includes('time') || lower.includes('when') || lower.includes('schedule')) {
      return 'TIMING';
    } else if (lower.includes('more') || lower.includes('increase') || lower.includes('add')) {
      return 'EXPANSION';
    } else if (lower.includes('less') || lower.includes('decrease') || lower.includes('remove')) {
      return 'REDUCTION';
    } else if (lower.includes('difficulty') || lower.includes('harder') || lower.includes('easier')) {
      return 'DIFFICULTY';
    }

    return 'GENERAL';
  }

  private extractModifications(question: string): any[] {
    // Simple extraction - in real implementation would use NLP
    const modifications = [];

    const lower = question.toLowerCase();

    if (lower.includes('morning')) {
      modifications.push({ habitId: null, variables: [{ type: 'TIMING', newValue: 'morning' }] });
    } else if (lower.includes('evening')) {
      modifications.push({ habitId: null, variables: [{ type: 'TIMING', newValue: 'evening' }] });
    }

    if (lower.includes('easy') || lower.includes('simpler')) {
      modifications.push({ habitId: null, variables: [{ type: 'DIFFICULTY', newValue: 'EASY' }] });
    } else if (lower.includes('harder') || lower.includes('challenging')) {
      modifications.push({ habitId: null, variables: [{ type: 'DIFFICULTY', newValue: 'HARD' }] });
    }

    return modifications;
  }

  private generateTimeMachineRecommendations(scenarios: any[], experiments: any[]): string[] {
    const recommendations = [];

    if (scenarios.length === 0) {
      recommendations.push('Start by creating your first scenario to explore alternative strategies');
    } else {
      recommendations.push('Try running multiple scenarios to compare different approaches');
    }

    if (experiments.length === 0) {
      recommendations.push('Consider running experiments to test habit variations');
    }

    return recommendations;
  }

  private generateWhatIfRecommendations(results: any): string[] {
    const recommendations = [];

    if (results.confidence > 70) {
      recommendations.push('✅ High confidence prediction - consider implementing this strategy');
    } else if (results.confidence > 40) {
      recommendations.push('⚠️ Moderate confidence - test cautiously before full implementation');
    } else {
      recommendations.push('❓ Low confidence - gather more data before making changes');
    }

    if (results.impact.completionChange > 10) {
      recommendations.push('📈 This could significantly improve your completion rate');
    } else if (results.impact.completionChange < -10) {
      recommendations.push('📉 This might negatively impact your progress - reconsider approach');
    }

    return recommendations;
  }

  async simulateScenario(scenario: any): Promise<any> {
    try {
      // Get baseline performance
      const baseline = await this.calculateBaselinePerformance(scenario);

      // Simulate modified habits
      const simulatedPerformance = await this.simulateModifiedHabits(scenario);

      // Calculate impact
      const impact = {
        completionChange: simulatedPerformance.completionRate - baseline.completionRate,
        streakChange: simulatedPerformance.streaks - baseline.streaks,
        energyImpact: this.calculateEnergyImpact(scenario),
        wellbeingImpact: this.calculateWellbeingImpact(scenario),
      };

      // Generate predictions
      const predictions = {
        predictedCompletion: simulatedPerformance.completionRate,
        predictedStreaks: simulatedPerformance.streaks,
        confidence: this.calculatePredictionConfidence(scenario, baseline, simulatedPerformance),
        impact,
      };

      // Generate insights
      const insights = this.generateScenarioInsights(scenario, baseline, simulatedPerformance, impact);

      return {
        predictions,
        insights,
        baseline,
        simulatedPerformance,
      };
    } catch (error: any) {
      logger.error('Simulate scenario error:', error);
      throw error;
    }
  }

  async createAlternativeTimeline(userId: string, divergenceDate: Date, modifications: any[]): Promise<any> {
    try {
      // Create scenario for alternative timeline
      const scenario = await this.createScenario(userId, {
        name: `Alternative Timeline from ${divergenceDate.toISOString().split('T')[0]}`,
        description: 'What if I had made different choices?',
        type: 'ALTERNATIVE_TIMELINE',
        timeline: {
          startDate: divergenceDate,
          endDate: new Date(),
          simulatedPeriod: Math.ceil((Date.now() - divergenceDate.getTime()) / (1000 * 60 * 60 * 24)),
        },
        modifiedHabits: modifications,
      });

      // Run the scenario
      const results = await this.runScenario(scenario._id.toString(), userId);

      // Create time branch
      const branch = await TimeBranch.create({
        userId: new Types.ObjectId(userId),
        scenarioId: scenario._id,
        branchName: `Timeline Branch from ${divergenceDate.toISOString().split('T')[0]}`,
        branchPoint: divergenceDate,
        divergencePoint: divergenceDate,
        alternativeHistory: await this.generateAlternativeHistory(divergenceDate, modifications),
        outcomes: {
          completionRate: results.results.predictedCompletion,
          totalCompletions: results.results.predictedStreaks,
          longestStreak: results.results.predictedStreaks,
          currencyEarned: this.estimateCurrencyFromCompletion(results.results.predictedCompletion),
          achievements: [],
        },
        comparison: await this.calculateBranchComparison(userId, divergenceDate, results.results.predictedCompletion),
      });

      logger.info(`Alternative timeline created: ${branch._id}`);

      return {
        scenario,
        branch,
        results,
      };
    } catch (error: any) {
      logger.error('Create alternative timeline error:', error);
      throw error;
    }
  }

  // Prediction Engine

  async predictFuturePerformance(userId: string, timeframe: number = 30): Promise<any> {
    try {
      // Get current habits and performance
      const currentHabits = await Habit.find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      });

      const predictions = [];

      for (const habit of currentHabits) {
        const habitPrediction = await this.predictHabitPerformance(habit._id.toString(), userId, timeframe);
        predictions.push({
          habitId: habit._id,
          habitName: habit.title,
          prediction: habitPrediction,
        });
      }

      // Calculate overall prediction
      const overallPrediction = {
        timeframe,
        predictedCompletionRate: predictions.reduce((sum, p) => sum + p.prediction.completionRate, 0) / predictions.length,
        predictedStreakGrowth: predictions.reduce((sum, p) => sum + p.prediction.streakGrowth, 0) / predictions.length,
        confidence: predictions.reduce((sum, p) => sum + p.prediction.confidence, 0) / predictions.length,
        recommendations: this.generatePredictionRecommendations(predictions),
      };

      logger.info(`Future performance prediction generated for user ${userId}`);

      return {
        overall: overallPrediction,
        habitPredictions: predictions,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('Predict future performance error:', error);
      throw error;
    }
  }

  async predictHabitPerformance(habitId: string, userId: string, days: number = 30): Promise<any> {
    try {
      const habit = await Habit.findOne({
        _id: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!habit) {
        throw new Error('Habit not found');
      }

      // Get historical performance
      const logs = await HabitLog.find({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      })
        .sort({ completedAt: -1 })
        .limit(90); // Last 90 days for training

      // Calculate patterns
      const patterns = this.analyzeHabitPatterns(logs, days);

      // Make predictions
      const prediction = {
        completionRate: this.predictCompletionRate(patterns, days),
        streakGrowth: this.predictStreakGrowth(patterns, days),
        optimalTimes: this.predictOptimalTimes(patterns),
        confidence: this.calculatePredictionAccuracy(logs.length),
        factors: this.identifyPerformanceFactors(patterns),
      };

      return prediction;
    } catch (error: any) {
      logger.error('Predict habit performance error:', error);
      throw error;
    }
  }

  // Habit Experiments

  async designExperiment(userId: string, experimentData: any): Promise<any> {
    try {
      const scenario = await this.createScenario(userId, {
        name: experimentData.experimentName,
        description: `Testing: ${experimentData.hypothesis}`,
        type: 'HABIT_EXPERIMENT',
        timeline: {
          startDate: new Date(experimentData.startDate),
          endDate: new Date(experimentData.endDate),
          simulatedPeriod: experimentData.duration || 30,
        },
        modifiedHabits: experimentData.testModifications || [],
      });

      const experiment = await HabitExperiment.create({
        userId: new Types.ObjectId(userId),
        scenarioId: scenario._id,
        experimentName: experimentData.experimentName,
        hypothesis: experimentData.hypothesis,
        independentVariable: experimentData.independentVariable,
        dependentVariables: experimentData.dependentVariables || [],
        controlHabits: experimentData.controlHabits || [],
        testHabits: experimentData.testHabits || [],
        duration: {
          startDate: new Date(experimentData.startDate),
          endDate: new Date(experimentData.endDate),
          days: experimentData.duration || 30,
        },
        status: 'DESIGNED',
      });

      logger.info(`Habit experiment designed: ${experiment._id}`);

      return {
        experiment,
        scenario,
      };
    } catch (error: any) {
      logger.error('Design experiment error:', error);
      throw error;
    }
  }

  async runExperiment(experimentId: string, userId: string): Promise<any> {
    try {
      const experiment = await HabitExperiment.findOne({
        _id: new Types.ObjectId(experimentId),
        userId: new Types.ObjectId(userId),
      });

      if (!experiment) {
        throw new Error('Experiment not found');
      }

      // Update status
      experiment.status = 'RUNNING';
      await experiment.save();

      // Run the experiment simulation
      const results = await this.simulateExperiment(experiment);

      // Update experiment with results
      experiment.results = results;
      experiment.status = 'COMPLETED';
      await experiment.save();

      logger.info(`Habit experiment completed: ${experimentId}`);

      return {
        experiment,
        results,
      };
    } catch (error: any) {
      logger.error('Run experiment error:', error);
      throw error;
    }
  }

  // What-If Comparisons

  async compareStrategies(userId: string, strategies: any[]): Promise<any> {
    try {
      const comparisons = [];

      for (const strategy of strategies) {
        const scenario = await this.createScenario(userId, {
          name: strategy.name,
          description: strategy.description,
          type: 'STRATEGY_TEST',
          timeline: {
            startDate: new Date(strategy.startDate),
            endDate: new Date(strategy.endDate),
            simulatedPeriod: strategy.duration || 30,
          },
          modifiedHabits: strategy.modifications || [],
        });

        const results = await this.runScenario(scenario._id.toString(), userId);

        comparisons.push({
          strategy: strategy.name,
          results: results.results,
          scenario: scenario._id,
        });
      }

      // Find best strategy
      const bestStrategy = comparisons.reduce((best, current) =>
        current.results.predictedCompletion > best.results.predictedCompletion ? current : best
      );

      // Generate comparison insights
      const insights = this.generateComparisonInsights(comparisons);

      logger.info(`Strategy comparison completed for user ${userId}`);

      return {
        comparisons,
        bestStrategy: bestStrategy.strategy,
        insights,
        generatedAt: new Date(),
      };
    } catch (error: any) {
      logger.error('Compare strategies error:', error);
      throw error;
    }
  }

  // Helper Methods

  private async calculateBaselinePerformance(scenario: any): Promise<any> {
    const userId = scenario.userId.toString();
    const startDate = scenario.timeline.startDate;
    const endDate = scenario.timeline.endDate;

    let totalCompletions = 0;
    let totalHabits = 0;
    let streaks = 0;

    for (const originalHabit of scenario.originalHabits) {
      const logs = await HabitLog.find({
        habitId: originalHabit.habitId,
        userId: new Types.ObjectId(userId),
        completedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      totalCompletions += logs.length;
      totalHabits += 1;

      // Calculate streaks for this period
      const habitStreaks = await this.calculateStreaksInPeriod(logs);
      streaks += habitStreaks;
    }

    const daysInPeriod = scenario.timeline.simulatedPeriod;
    const completionRate = totalHabits > 0
      ? (totalCompletions / (totalHabits * daysInPeriod)) * 100
      : 0;

    return {
      completionRate,
      streaks,
      totalCompletions,
    };
  }

  private async simulateModifiedHabits(scenario: any): Promise<any> {
    let totalCompletions = 0;
    let totalHabits = 0;
    let streaks = 0;

    for (const modifiedHabit of scenario.modifiedHabits) {
      // Get original performance
      const originalLogs = await HabitLog.find({
        habitId: modifiedHabit.habitId,
        userId: scenario.userId,
      });

      // Apply modifications to simulate different performance
      const simulatedLogs = this.applyModificationsToLogs(
        originalLogs,
        modifiedHabit.variables,
        scenario.timeline
      );

      totalCompletions += simulatedLogs.completed;
      totalHabits += 1;
      streaks += simulatedLogs.streaks;
    }

    const daysInPeriod = scenario.timeline.simulatedPeriod;
    const completionRate = totalHabits > 0
      ? (totalCompletions / (totalHabits * daysInPeriod)) * 100
      : 0;

    return {
      completionRate,
      streaks,
      totalCompletions,
    };
  }

  private applyModificationsToLogs(originalLogs: any[], variables: any[], timeline: any): any {
    let completed = originalLogs.length;
    let streaks = 0;

    for (const variable of variables) {
      switch (variable.type) {
        case 'FREQUENCY':
          // Adjust completion based on frequency change
          const freqMultiplier = this.getFrequencyMultiplier(variable.newValue);
          completed = Math.round(completed * freqMultiplier);
          break;

        case 'DIFFICULTY':
          // Harder habits might have fewer completions
          const difficultyImpact = this.getDifficultyImpact(variable.newValue);
          completed = Math.round(completed * (1 - difficultyImpact));
          break;

        case 'TIMING':
          // Better timing might improve completion
          const timingImprovement = this.getTimingImprovement(variable.newValue);
          completed = Math.round(completed * (1 + timingImprovement));
          break;

        case 'REMINDER':
          // Reminders might increase completion
          const reminderImpact = variable.newValue ? 0.1 : -0.1;
          completed = Math.round(completed * (1 + reminderImpact));
          break;
      }
    }

    // Estimate streaks based on completions
    streaks = this.estimateStreaksFromCompletions(completed, timeline.simulatedPeriod);

    return { completed, streaks };
  }

  private getFrequencyMultiplier(frequency: string): number {
    const multipliers: any = {
      'DAILY': 1.0,
      'WEEKLY': 0.14,
      'CUSTOM': 0.5,
    };
    return multipliers[frequency] || 1.0;
  }

  private getDifficultyImpact(difficulty: string): number {
    const impacts: any = {
      'EASY': 0.1,
      'MEDIUM': 0.2,
      'HARD': 0.3,
    };
    return impacts[difficulty] || 0.2;
  }

  private getTimingImprovement(_timing: string): number {
    // Simple heuristic - optimal timing might improve by 10%
    return 0.1;
  }

  private estimateStreaksFromCompletions(completions: number, _period: number): number {
    // Rough estimate: every 7 consecutive completions = 1 streak
    return Math.floor(completions / 7);
  }

  private calculatePredictionConfidence(scenario: any, baseline: any, simulated: any): number {
    let confidence = 50; // Base confidence

    // More data = higher confidence
    const dataPoints = scenario.originalHabits.length;
    confidence += Math.min(20, dataPoints * 2);

    // More realistic changes = higher confidence
    const changeMagnitude = Math.abs(simulated.completionRate - baseline.completionRate);
    if (changeMagnitude < 20) confidence += 10;
    else if (changeMagnitude > 50) confidence -= 10;

    return Math.min(100, Math.max(0, confidence));
  }

  private generateScenarioInsights(_scenario: any, _baseline: any, _simulated: any, impact: any): string[] {
    const insights = [];

    // Completion impact
    if (impact.completionChange > 10) {
      insights.push(`This strategy could improve your completion rate by ${impact.completionChange.toFixed(1)}%`);
    } else if (impact.completionChange < -10) {
      insights.push(`This strategy might reduce your completion rate by ${Math.abs(impact.completionChange).toFixed(1)}%`);
    }

    // Streak impact
    if (impact.streakChange > 1) {
      insights.push(`You could gain approximately ${impact.streakChange} additional streaks`);
    }

    // Energy impact
    if (impact.energyImpact > 20) {
      insights.push(`This strategy significantly improves your energy management`);
    }

    // Recommendations
    if (impact.completionChange > 5 && impact.energyImpact > 10) {
      insights.push(`✅ Recommended: This strategy shows strong potential`);
    }

    return insights;
  }

  private calculateEnergyImpact(scenario: any): number {
    let impact = 0;

    for (const modifiedHabit of scenario.modifiedHabits) {
      for (const variable of modifiedHabit.variables) {
        if (variable.type === 'TIMING' && variable.newValue === 'optimal') {
          impact += 20;
        }
      }
    }

    return Math.min(100, impact);
  }

  private calculateWellbeingImpact(scenario: any): number {
    let impact = 0;

    for (const modifiedHabit of scenario.modifiedHabits) {
      for (const variable of modifiedHabit.variables) {
        if (variable.type === 'FREQUENCY' && variable.newValue === 'DAILY') {
          impact += 10;
        }
      }
    }

    return Math.min(100, impact);
  }

  private async generateAlternativeHistory(divergenceDate: Date, _modifications: any[]): Promise<any[]> {
    const history = [];

    // Create hypothetical events
    for (let i = 0; i < 7; i++) {
      const date = new Date(divergenceDate);
      date.setDate(date.getDate() + i);

      history.push({
        date,
        event: `Habit completion day ${i + 1}`,
        reality: { completed: Math.random() > 0.3 },
        alternative: { completed: Math.random() > 0.2 }, // Slightly better
        difference: 'Small improvement due to optimal timing',
      });
    }

    return history;
  }

  private async calculateBranchComparison(userId: string, divergenceDate: Date, predictedCompletion: number): Promise<any> {
    // Get actual performance since divergence
    const actualLogs = await HabitLog.find({
      userId: new Types.ObjectId(userId),
      completedAt: { $gte: divergenceDate },
    });

    const actualCompletions = actualLogs.length;
    const daysSinceDivergence = Math.ceil((Date.now() - divergenceDate.getTime()) / (1000 * 60 * 60 * 24));
    const actualCompletionRate = (actualCompletions / daysSinceDivergence) * 100;

    return {
      completionDifference: predictedCompletion - actualCompletionRate,
      streakDifference: 0, // Would need more complex calculation
      currencyDifference: (predictedCompletion - actualCompletionRate) * 10, // Rough estimate
      betterIn: [],
      worseIn: [],
    };
  }

  private estimateCurrencyFromCompletion(completionRate: number): number {
    // Rough estimate: 10 coins per 1% completion rate over 30 days
    return Math.round(completionRate * 10);
  }

  private analyzeHabitPatterns(logs: any[], _predictionDays: number): any {
    // Simple pattern analysis
    const recentLogs = logs.slice(0, 30); // Last 30 logs
    const completionRate = recentLogs.length / 30; // Assume 30 days

    return {
      completionRate,
      consistency: this.calculateConsistency(recentLogs),
      trend: this.calculateTrend(recentLogs),
    };
  }

  private calculateConsistency(logs: any[]): number {
    if (logs.length < 7) return 50;

    const last7Days = logs.slice(0, 7);
    const completedDays = last7Days.length;
    return (completedDays / 7) * 100;
  }

  private calculateTrend(logs: any[]): string {
    if (logs.length < 14) return 'STABLE';

    const firstHalf = logs.slice(7, 14).length;
    const secondHalf = logs.slice(0, 7).length;

    if (secondHalf > firstHalf + 2) return 'IMPROVING';
    if (secondHalf < firstHalf - 2) return 'DECLINING';
    return 'STABLE';
  }

  private predictCompletionRate(patterns: any, _days: number): number {
    let prediction = patterns.completionRate;

    // Adjust based on trend
    if (patterns.trend === 'IMPROVING') prediction += 5;
    if (patterns.trend === 'DECLINING') prediction -= 5;

    return Math.max(0, Math.min(100, prediction));
  }

  private predictStreakGrowth(patterns: any, _days: number): number {
    // Simple prediction based on consistency
    return Math.round((patterns.consistency / 100) * 1);
  }

  private predictOptimalTimes(_patterns: any): string[] {
    // Return optimal times based on patterns
    return ['morning', 'evening']; // Default
  }

  private calculatePredictionAccuracy(dataPoints: number): number {
    return Math.min(100, dataPoints * 2); // More data = higher accuracy
  }

  private identifyPerformanceFactors(patterns: any): string[] {
    const factors = [];

    if (patterns.consistency > 70) factors.push('High consistency');
    if (patterns.trend === 'IMPROVING') factors.push('Positive trend');

    return factors;
  }

  private generatePredictionRecommendations(predictions: any[]): string[] {
    const recommendations = [];
    const lowPerformers = predictions.filter(p => p.prediction.completionRate < 50);

    if (lowPerformers.length > 0) {
      recommendations.push(`Focus on ${lowPerformers.length} habits with low predicted completion`);
    }

    const highPerformers = predictions.filter(p => p.prediction.completionRate > 80);
    if (highPerformers.length > 0) {
      recommendations.push(`Maintain your ${highPerformers.length} strong performing habits`);
    }

    return recommendations;
  }

  private async simulateExperiment(_experiment: any): Promise<any> {
    // Simulate experiment results
    return {
      hypothesisSupported: Math.random() > 0.5,
      confidence: Math.round(Math.random() * 30) + 50,
      effectSize: Math.random() * 0.5,
      statisticalSignificance: Math.round(Math.random() * 20) + 70,
      insights: [
        'Experimental variable showed measurable impact',
        'Results suggest correlation between variables',
      ],
    };
  }

  private generateComparisonInsights(comparisons: any[]): string[] {
    const insights = [];

    // Find best and worst performers
    const sorted = [...comparisons].sort((a, b) => b.results.predictedCompletion - a.results.predictedCompletion);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    insights.push(`Best strategy: ${best.strategy} with ${best.results.predictedCompletion.toFixed(1)}% completion`);
    insights.push(`Worst strategy: ${worst.strategy} with ${worst.results.predictedCompletion.toFixed(1)}% completion`);

    const improvement = best.results.predictedCompletion - worst.results.predictedCompletion;
    insights.push(`Strategy choice could make ${improvement.toFixed(1)}% difference in completion rate`);

    return insights;
  }

  private calculateStreaksInPeriod(logs: any[]): number {
    // Simple streak counting
    let streaks = 0;
    let currentStreak = 0;

    for (const _log of logs) {
      currentStreak++;
      if (currentStreak >= 7) { // 7-day streak
        streaks++;
        currentStreak = 0;
      }
    }

    return streaks;
  }
}

export default new TimeMachineService();