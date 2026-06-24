import { Types } from 'mongoose';
import HabitDNA from '@/models/HabitDNA';
import Habit from '@/models/Habit';
import HabitLog from '@/models/HabitLog';
import Category from '@/models/Category';
import { HabitGenetics, MutationType } from '@/types';
import logger from '@/utils/logger';
import habitService from '@/services/habit.service';

class HabitDNAService {
  // Analyze habit performance and generate genetics
  async analyzeHabitGenetics(habitId: string, userId: string): Promise<any> {
    try {
      const habit = await Habit.findOne({
        _id: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!habit) {
        throw new Error('Habit not found');
      }

      // Get historical data
      const logs = await HabitLog.find({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      })
        .sort({ completedAt: 1 })
        .lean();

      // Generate genetics from performance data
      const genetics = await this.calculateGenetics(habit, logs);

      // Create or update DNA record
      let dna = await HabitDNA.findOne({
        habitId: new Types.ObjectId(habitId),
      });

      if (dna) {
        // Track mutations
        this.trackMutations(dna, genetics);
        dna.genetics = genetics;
        dna.metadata.lastAnalyzed = new Date();
        dna.metadata.dataPoints = logs.length;
        await dna.save();
      } else {
        dna = await HabitDNA.create({
          userId: new Types.ObjectId(userId),
          habitId: new Types.ObjectId(habitId),
          genetics,
          metadata: {
            dataPoints: logs.length,
          },
        });
      }

      logger.info(`Habit genetics analyzed: ${habitId}`);

      return {
        dna,
        insights: this.generateGeneticInsights(genetics, logs.length),
      };
    } catch (error: any) {
      logger.error('Analyze habit genetics error:', error);
      throw error;
    }
  }

  // Breed two habits to create offspring
  async breedHabits(parentId1: string, parentId2: string, userId: string): Promise<any> {
    try {
      const parent1 = await Habit.findOne({
        _id: new Types.ObjectId(parentId1),
        userId: new Types.ObjectId(userId),
      }).populate('category');

      const parent2 = await Habit.findOne({
        _id: new Types.ObjectId(parentId2),
        userId: new Types.ObjectId(userId),
      }).populate('category');

      if (!parent1 || !parent2) {
        throw new Error('One or both parent habits not found');
      }

      const dna1 = await HabitDNA.findOne({ habitId: new Types.ObjectId(parentId1) });
      const dna2 = await HabitDNA.findOne({ habitId: new Types.ObjectId(parentId2) });

      if (!dna1 || !dna2) {
        throw new Error('Parent habits must be analyzed first');
      }

      // Check breeding compatibility
      const compatibility = this.calculateBreedingCompatibility(dna1, dna2);
      if (compatibility < 30) {
        throw new Error('Habits are not genetically compatible for breeding');
      }

      // Perform breeding
      const offspringGenetics = this.breedGenetics(dna1.genetics, dna2.genetics, dna1.breedingStats.dominance, dna2.breedingStats.dominance);

      // Create offspring habit
      const offspringTitle = this.generateOffspringName(parent1.title, parent2.title);
      const parent1CategoryName = (parent1.category as any)?.name || 'General';
      const parent2CategoryName = (parent2.category as any)?.name || 'General';
      const offspringCategoryName = this.inheritCategory(parent1CategoryName, parent2CategoryName);

      // Get or create the category for the offspring
      let offspringCategory = await Category.findOne({
        name: offspringCategoryName,
        userId: new Types.ObjectId(userId),
      });

      if (!offspringCategory) {
        offspringCategory = await Category.create({
          name: offspringCategoryName,
          userId: new Types.ObjectId(userId),
          icon: 'circle',
          color: '#3B82F6',
          isDefault: false,
        });
      }

      const offspring = await Habit.create({
        userId: new Types.ObjectId(userId),
        title: offspringTitle,
        description: `Bred from ${parent1.title} and ${parent2.title}`,
        category: offspringCategory._id,
        color: this.blendColors(parent1.color, parent2.color),
        difficulty: this.mapDifficulty(offspringGenetics.difficulty.level),
        targetDays: Math.max(parent1.targetDays, parent2.targetDays),
      });

      // Create DNA record for offspring
      const offspringDNA = await HabitDNA.create({
        userId: new Types.ObjectId(userId),
        habitId: offspring._id,
        genetics: offspringGenetics,
        parentIds: [new Types.ObjectId(parentId1), new Types.ObjectId(parentId2)],
        generation: Math.max(dna1.generation, dna2.generation) + 1,
        lineage: [
          ...(dna1.lineage || [[parent1.title]]),
          ...(dna2.lineage || [[parent2.title]]),
        ],
        breedingStats: {
          attractiveness: this.calculateAttractiveness(offspringGenetics),
          fertility: this.inheritFertility(dna1.breedingStats.fertility, dna2.breedingStats.fertility),
          dominance: this.generateDominance(offspringGenetics),
        },
        metadata: {
          dataPoints: 0,
        },
      });

      // Apply mutations
      await this.applyBreedingMutations(offspringDNA, compatibility);

      logger.info(`Habit breeding successful: ${offspring._id} from parents ${parentId1}, ${parentId2}`);

      return {
        offspring: {
          habit: offspring,
          dna: offspringDNA,
        },
        breedingReport: {
          compatibility,
          inheritedTraits: this.identifyInheritedTraits(dna1, dna2, offspringGenetics),
          mutations: offspringDNA.mutations.length,
          generation: offspringDNA.generation,
        },
      };
    } catch (error: any) {
      logger.error('Breed habits error:', error);
      throw error;
    }
  }

  // Get breeding suggestions for a habit
  async getBreedingSuggestions(habitId: string, userId: string): Promise<any[]> {
    try {
      const dna = await HabitDNA.findOne({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!dna) {
        throw new Error('Habit DNA not found');
      }

      // Find compatible habits
      const userHabits = await Habit.find({
        userId: new Types.ObjectId(userId),
        _id: { $ne: new Types.ObjectId(habitId) },
        isActive: true,
      }).lean();

      const suggestions = [];

      for (const habit of userHabits) {
        const partnerDNA = await HabitDNA.findOne({ habitId: habit._id });
        if (!partnerDNA) continue;

        const compatibility = this.calculateBreedingCompatibility(dna, partnerDNA);
        if (compatibility >= 40) { // Only suggest compatible matches
          const potentialOffspring = this.breedGenetics(
            dna.genetics,
            partnerDNA.genetics,
            dna.breedingStats.dominance,
            partnerDNA.breedingStats.dominance
          );

          suggestions.push({
            habit,
            compatibility,
            potentialOffspring: {
              genetics: potentialOffspring,
              attractiveness: this.calculateAttractiveness(potentialOffspring),
              strengths: this.identifyGeneticStrengths(potentialOffspring),
            },
          });
        }
      }

      // Sort by compatibility and offspring potential
      suggestions.sort((a, b) =>
        b.compatibility + b.potentialOffspring.attractiveness -
        (a.compatibility + a.potentialOffspring.attractiveness)
      );

      return suggestions.slice(0, 10); // Top 10 suggestions
    } catch (error: any) {
      logger.error('Get breeding suggestions error:', error);
      throw error;
    }
  }

  // Apply random mutations to a habit
  async mutateHabit(habitId: string, userId: string, forcedType?: MutationType): Promise<any> {
    try {
      const dna = await HabitDNA.findOne({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!dna) {
        throw new Error('Habit DNA not found');
      }

      const mutation = this.generateMutation(dna.genetics, forcedType);

      // Apply mutation
      const genePath = mutation.gene.split('.');
      const targetGene = this.getNestedGene(dna.genetics, genePath);

      if (targetGene !== undefined) {
        // Record mutation
        dna.mutations.push({
          type: mutation.type,
          gene: mutation.gene,
          oldValue: targetGene as number,
          newValue: mutation.newValue,
          timestamp: new Date(),
          reason: forcedType ? 'Artificial mutation' : 'Natural genetic drift',
        });

        // Apply new value
        this.setNestedGene(dna.genetics, genePath, mutation.newValue);

        await dna.save();

        logger.info(`Habit mutated: ${habitId}, ${mutation.type} mutation on ${mutation.gene}`);

        return {
          dna,
          mutation: {
            type: mutation.type,
            gene: mutation.gene,
            change: mutation.newValue - (targetGene as number),
            impact: this.assessMutationImpact(mutation),
          },
        };
      }

      throw new Error('Invalid gene path for mutation');
    } catch (error: any) {
      logger.error('Mutate habit error:', error);
      throw error;
    }
  }

  // Get genetic insights and recommendations
  async getGeneticInsights(habitId: string, userId: string): Promise<any> {
    try {
      const dna = await HabitDNA.findOne({
        habitId: new Types.ObjectId(habitId),
        userId: new Types.ObjectId(userId),
      });

      if (!dna) {
        throw new Error('Habit DNA not found');
      }

      return {
        genetics: dna.genetics,
        analysis: {
          strengths: this.identifyGeneticStrengths(dna.genetics),
          weaknesses: this.identifyGeneticWeaknesses(dna.genetics),
          potential: dna.evolution,
          breedingValue: dna.breedingStats.attractiveness,
          mutationRisk: this.calculateMutationRisk(dna),
        },
        recommendations: this.generateGeneticRecommendations(dna),
        ancestry: this.buildAncestryReport(dna),
      };
    } catch (error: any) {
      logger.error('Get genetic insights error:', error);
      throw error;
    }
  }

  // Get all habit DNA for a user
  async getUserHabitDNA(userId: string): Promise<any[]> {
    try {
      const dnas = await HabitDNA.find({
        userId: new Types.ObjectId(userId),
      }).populate('habitId');

      return dnas;
    } catch (error: any) {
      logger.error('Get user habit DNA error:', error);
      throw error;
    }
  }

  // Private helper methods

  private async calculateGenetics(habit: any, logs: any[]): Promise<HabitGenetics> {
    const g = {
      consistency: this.calculateConsistencyGenetics(habit, logs),
      difficulty: this.calculateDifficultyGenetics(habit, logs),
      energy: this.calculateEnergyGenetics(habit, logs),
      success: await this.calculateSuccessGenetics(habit, logs),
      social: this.calculateSocialGenetics(habit, logs),
      wellness: this.calculateWellnessGenetics(habit, logs),
    };

    return g;
  }

  private calculateConsistencyGenetics(_habit: any, logs: any[]): HabitGenetics['consistency'] {
    if (logs.length === 0) {
      return { level: 50, volatility: 50, stability: 50 };
    }

    // Calculate completion consistency
    const completionByDay = new Map<string, number>();
    logs.forEach(log => {
      const day = log.completedAt.toISOString().split('T')[0];
      completionByDay.set(day, (completionByDay.get(day) || 0) + 1);
    });

    // Calculate volatility (variance in completion patterns)
    const completions = Array.from(completionByDay.values());
    const avgCompletions = completions.reduce((a, b) => a + b, 0) / completions.length;
    const variance = completions.reduce((sum, val) => sum + Math.pow(val - avgCompletions, 2), 0) / completions.length;
    const volatility = Math.min(100, Math.max(0, 50 + variance * 10));

    // Calculate stability (how consistent the completion rate is over time)
    const weeks = Math.ceil(logs.length / 7);
    const stability = weeks > 0 ? Math.min(100, (logs.length / weeks) * 10) : 50;

    // Overall consistency level
    const level = Math.min(100, (100 - volatility + stability) / 2);

    return { level, volatility, stability };
  }

  private calculateDifficultyGenetics(habit: any, logs: any[]): HabitGenetics['difficulty'] {
    const difficulty = habit.difficulty || 'MEDIUM';
    const baseLevel = difficulty === 'EASY' ? 30 : difficulty === 'HARD' ? 70 : 50;

    // Learning curve (how quickly user improved)
    const learningCurve = logs.length > 10
      ? Math.min(100, 50 + (logs.length * 2))
      : 50;

    return {
      level: baseLevel,
      learningCurve,
      adaptability: learningCurve,
    };
  }

  private calculateEnergyGenetics(_habit: any, logs: any[]): HabitGenetics['energy'] {
    // Analyze completion times
    const hourlyDistribution = [0, 0, 0, 0]; // morning, afternoon, evening, night
    logs.forEach(log => {
      const hour = log.completedAt.getHours();
      if (hour >= 6 && hour < 12) hourlyDistribution[0]++;
      else if (hour >= 12 && hour < 18) hourlyDistribution[1]++;
      else if (hour >= 18 && hour < 24) hourlyDistribution[2]++;
      else hourlyDistribution[3]++;
    });

    const total = hourlyDistribution.reduce((a, b) => a + b, 0);
    const percentages = total > 0
      ? hourlyDistribution.map(count => (count / total) * 100)
      : [25, 25, 25, 25];

    const maxIndex = percentages.indexOf(Math.max(...percentages));
    const optimum = ['morning', 'afternoon', 'evening', 'night'][maxIndex] as 'morning' | 'afternoon' | 'evening' | 'night';

    return {
      morning: percentages[0],
      afternoon: percentages[1],
      evening: percentages[2],
      optimum: optimum,
    };
  }

  private async calculateSuccessGenetics(habit: any, _logs: any[]): Promise<HabitGenetics['success']> {
    const stats = await habitService.getHabitStats(habit._id, habit.userId);

    return {
      completionRate: stats.completionRate,
      streakAffinity: Math.min(100, stats.currentStreak * 5),
      recoverySpeed: stats.longestStreak > 0 ? Math.min(100, (stats.currentStreak / stats.longestStreak) * 100) : 50,
    };
  }

  private calculateSocialGenetics(_habit: any, _logs: any[]): HabitGenetics['social'] {
    // Base values - can be enhanced with social data later
    return {
      contagiousness: 50,
      collaborationBoost: 50,
      accountability: 50,
    };
  }

  private calculateWellnessGenetics(_habit: any, _logs: any[]): HabitGenetics['wellness'] {
    // Base values - can be enhanced with wellness data later
    return {
      moodBoost: 50,
      stressReduction: 50,
      energyReturn: 50,
    };
  }

  private breedGenetics(genetics1: HabitGenetics, genetics2: HabitGenetics, dominance1: any, dominance2: any): HabitGenetics {
    const offspring = {} as HabitGenetics;

    // Breed each genetic trait
    for (const key in genetics1) {
      const trait1 = genetics1[key as keyof HabitGenetics];
      const trait2 = genetics2[key as keyof HabitGenetics];

      if (typeof trait1 === 'object' && typeof trait2 === 'object') {
        offspring[key as keyof HabitGenetics] = {} as any;
        for (const subKey in trait1) {
          const val1 = (trait1 as any)[subKey];
          const val2 = (trait2 as any)[subKey];
          const dom1 = dominance1[key]?.[subKey] || 50;
          const dom2 = dominance2[key]?.[subKey] || 50;

          // Weighted average based on dominance
          const weight1 = dom1 / (dom1 + dom2);
          const weight2 = dom2 / (dom1 + dom2);

          (offspring[key as keyof HabitGenetics] as any)[subKey] = Math.round(val1 * weight1 + val2 * weight2);
        }
      }
    }

    return offspring;
  }

  private calculateBreedingCompatibility(dna1: any, dna2: any): number {
    // Compatibility based on genetic similarity and complementary traits
    let score = 50;

    // Genetic diversity bonus (too similar = bad, too different = bad)
    const similarity = this.calculateGeneticSimilarity(dna1.genetics, dna2.genetics);
    if (similarity > 60 && similarity < 80) score += 20;

    // Complementary energy patterns
    if (dna1.genetics.energy.optimum !== dna2.genetics.energy.optimum) score += 10;

    // Breeding stats
    const avgFertility = (dna1.breedingStats.fertility + dna2.breedingStats.fertility) / 2;
    score += avgFertility * 0.2;

    return Math.min(100, Math.max(0, score));
  }

  private calculateGeneticSimilarity(genetics1: HabitGenetics, genetics2: HabitGenetics): number {
    let totalDiff = 0;
    let count = 0;

    for (const key in genetics1) {
      const trait1 = genetics1[key as keyof HabitGenetics];
      const trait2 = genetics2[key as keyof HabitGenetics];

      if (typeof trait1 === 'object' && typeof trait2 === 'object') {
        for (const subKey in trait1) {
          const val1 = (trait1 as any)[subKey];
          const val2 = (trait2 as any)[subKey];
          totalDiff += Math.abs(val1 - val2);
          count++;
        }
      }
    }

    return count > 0 ? Math.max(0, 100 - (totalDiff / count)) : 50;
  }

  private generateMutation(genetics: HabitGenetics, forcedType?: MutationType): any {
    const genes = Object.keys(genetics);
    const randomGene = genes[Math.floor(Math.random() * genes.length)];
    const subGenes = Object.keys(genetics[randomGene as keyof HabitGenetics]);
    const randomSubGene = subGenes[Math.floor(Math.random() * subGenes.length)];

    const genePath = `${randomGene}.${randomSubGene}`;
    const currentValue = (genetics[randomGene as keyof HabitGenetics] as any)[randomSubGene];

    // Determine mutation type
    const type = forcedType || this.determineMutationType(currentValue);

    // Calculate new value
    const change = Math.floor(Math.random() * 20) - 10; // -10 to +10
    let newValue = Math.max(0, Math.min(100, currentValue + change));

    return {
      type,
      gene: genePath,
      oldValue: currentValue,
      newValue,
    };
  }

  private determineMutationType(_currentValue: number): MutationType {
    const change = Math.random() * 20 - 10;

    if (change > 5) return 'beneficial';
    if (change < -5) return 'detrimental';
    if (Math.abs(change) < 3) return 'neutral';
    return 'adaptive';
  }

  private trackMutations(dna: any, newGenetics: HabitGenetics): void {
    for (const key in newGenetics) {
      const trait = newGenetics[key as keyof HabitGenetics];
      const oldTrait = dna.genetics[key as keyof HabitGenetics];

      if (typeof trait === 'object' && typeof oldTrait === 'object') {
        for (const subKey in trait) {
          const newVal = (trait as any)[subKey];
          const oldVal = (oldTrait as any)[subKey];

          if (newVal !== oldVal && Math.abs(newVal - oldVal) > 5) {
            dna.mutations.push({
              type: this.determineMutationType(oldVal),
              gene: `${key}.${subKey}`,
              oldValue: oldVal,
              newValue: newVal,
              timestamp: new Date(),
              reason: 'Genetic analysis update',
            });
          }
        }
      }
    }
  }

  private async applyBreedingMutations(dna: any, compatibility: number): Promise<void> {
    const mutationChance = Math.max(0.1, (compatibility - 50) / 200);

    if (Math.random() < mutationChance) {
      const mutation = this.generateMutation(dna.genetics);
      const genePath = mutation.gene.split('.');
      this.setNestedGene(dna.genetics, genePath, mutation.newValue);

      dna.mutations.push({
        type: mutation.type,
        gene: mutation.gene,
        oldValue: mutation.oldValue,
        newValue: mutation.newValue,
        timestamp: new Date(),
        reason: 'Breeding mutation',
      });
    }

    await dna.save();
  }

  private getNestedGene(obj: any, path: string[]): number {
    return path.reduce((current, key) => current?.[key], obj);
  }

  private setNestedGene(obj: any, path: string[], value: number): void {
    const lastKey = path.pop();
    const target = path.reduce((current, key) => current[key], obj);
    if (target && lastKey) {
      target[lastKey] = value;
    }
  }

  private calculateAttractiveness(_genetics: HabitGenetics): number {
    // Simple average of all genetic values
    return 50; // Placeholder for now
  }

  private inheritFertility(fertility1: number, fertility2: number): number {
    return Math.round((fertility1 + fertility2) / 2);
  }

  private generateDominance(_genetics: HabitGenetics): any {
    // Random dominance values
    return {
      consistency: Math.floor(Math.random() * 40) + 30,
      difficulty: Math.floor(Math.random() * 40) + 30,
      energy: Math.floor(Math.random() * 40) + 30,
      success: Math.floor(Math.random() * 40) + 30,
    };
  }

  private generateOffspringName(name1: string, name2: string): string {
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');

    // Combine first half of name1 with second half of name2
    const mid1 = Math.ceil(words1.length / 2);
    const mid2 = Math.ceil(words2.length / 2);

    const combined = [
      ...words1.slice(0, mid1),
      ...words2.slice(mid2),
    ];

    return combined.join(' ') || `${name1}-${name2}`;
  }

  private inheritCategory(cat1: string, cat2: string): string {
    return cat1 === cat2 ? cat1 : 'OTHER';
  }

  private blendColors(color1: string, color2: string): string {
    // Simple hex color blending
    const hex = (c: string) => parseInt(c.replace('#', ''), 16);

    const r1 = (hex(color1) >> 16) & 255;
    const g1 = (hex(color1) >> 8) & 255;
    const b1 = hex(color1) & 255;

    const r2 = (hex(color2) >> 16) & 255;
    const g2 = (hex(color2) >> 8) & 255;
    const b2 = hex(color2) & 255;

    const r = Math.round((r1 + r2) / 2);
    const g = Math.round((g1 + g2) / 2);
    const b = Math.round((b1 + b2) / 2);

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  private mapDifficulty(geneticLevel: number): string {
    if (geneticLevel < 40) return 'EASY';
    if (geneticLevel > 70) return 'HARD';
    return 'MEDIUM';
  }

  private identifyInheritedTraits(dna1: any, dna2: any, offspring: HabitGenetics): string[] {
    const inherited = [];

    for (const key in offspring) {
      const trait = offspring[key as keyof HabitGenetics];
      const trait1 = dna1.genetics[key as keyof HabitGenetics];
      const trait2 = dna2.genetics[key as keyof HabitGenetics];

      if (typeof trait === 'object' && typeof trait1 === 'object') {
        for (const subKey in trait) {
          const val = (trait as any)[subKey];
          const val1 = (trait1 as any)[subKey];
          const val2 = (trait2 as any)[subKey];

          if (Math.abs(val - val1) < Math.abs(val - val2)) {
            inherited.push(`From ${dna1.habitId}: ${key}.${subKey}`);
          } else {
            inherited.push(`From ${dna2.habitId}: ${key}.${subKey}`);
          }
        }
      }
    }

    return inherited;
  }

  private identifyGeneticStrengths(genetics: HabitGenetics): string[] {
    const strengths = [];

    for (const key in genetics) {
      const trait = genetics[key as keyof HabitGenetics];
      if (typeof trait === 'object') {
        for (const subKey in trait) {
          const value = (trait as any)[subKey];
          if (value > 70) {
            strengths.push(`${key}.${subKey}: ${value}`);
          }
        }
      }
    }

    return strengths;
  }

  private identifyGeneticWeaknesses(genetics: HabitGenetics): string[] {
    const weaknesses = [];

    for (const key in genetics) {
      const trait = genetics[key as keyof HabitGenetics];
      if (typeof trait === 'object') {
        for (const subKey in trait) {
          const value = (trait as any)[subKey];
          if (value < 30) {
            weaknesses.push(`${key}.${subKey}: ${value}`);
          }
        }
      }
    }

    return weaknesses;
  }

  private calculateMutationRisk(dna: any): number {
    // Higher risk for habits with many recent mutations
    const recentMutations = dna.mutations.filter((m: any) => {
      const daysSinceMutation = (Date.now() - m.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceMutation < 30;
    });

    return Math.min(100, recentMutations.length * 10);
  }

  private assessMutationImpact(mutation: any): string {
    const impact = Math.abs(mutation.newValue - mutation.oldValue);

    if (impact > 15) return 'Major';
    if (impact > 5) return 'Moderate';
    return 'Minor';
  }

  private generateGeneticInsights(genetics: HabitGenetics, dataPoints: number): any {
    return {
      confidence: Math.min(100, dataPoints * 2),
      overallHealth: this.calculateAttractiveness(genetics),
      recommendations: this.generateGeneticRecommendationsFromGenetics(genetics),
    };
  }

  private generateGeneticRecommendations(dna: any): string[] {
    const recommendations = [];
    const g = dna.genetics;

    if (g.consistency.level < 50) {
      recommendations.push('Work on consistency - try to complete this habit at the same time each day');
    }

    if (g.energy.optimum && g.energy[g.energy.optimum as keyof typeof g.energy] < 40) {
      recommendations.push(`Consider scheduling this habit during your ${g.energy.optimum} energy peak`);
    }

    if (g.success.streakAffinity < 40) {
      recommendations.push('This habit struggles with streaks - focus on consistency over streak length');
    }

    if (dna.breedingStats.attractiveness > 70) {
      recommendations.push('This habit has strong genetics - consider breeding it with complementary habits');
    }

    return recommendations;
  }

  private generateGeneticRecommendationsFromGenetics(_genetics: HabitGenetics): string[] {
    // Similar to above but based purely on genetics
    return [];
  }

  private buildAncestryReport(dna: any): any {
    return {
      generation: dna.generation,
      lineage: dna.lineage,
      parentCount: dna.parentIds?.length || 0,
      mutationHistory: dna.mutations.slice(-10), // Last 10 mutations
    };
  }
}

export default new HabitDNAService();