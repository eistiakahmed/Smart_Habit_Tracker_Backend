import { Types } from 'mongoose';
import QuickNote from '@/models/QuickNote';
import User from '@/models/User';
import DateUtil from '@/utils/date';
import logger from '@/utils/logger';
import * as NoteSmart from '@/utils/noteSmart';
import {
  CreateQuickNoteData,
  UpdateQuickNoteData,
  QuickNoteFilter,
  QuickNoteStats,
  QuickNoteResponse,
  NotePriority,
  NoteCategory,
  NoteStatus,
} from '@/types';

class QuickNoteService {
  async getAllNotes(userId: string, filter?: QuickNoteFilter): Promise<{
    notes: QuickNoteResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const where: any = { userId: new Types.ObjectId(userId) };

      // Filter by archived status (default: show only active notes)
      if (filter?.isArchived !== undefined) {
        where.isArchived = filter.isArchived;
      } else {
        where.isArchived = false;
      }

      // Filter by status
      if (filter?.status) {
        where.status = filter.status;
      }

      // Filter by category
      if (filter?.category) {
        where.category = filter.category;
      }

      // Filter by priority
      if (filter?.priority) {
        where.priority = filter.priority;
      }

      // Filter by folder
      if (filter?.folder) {
        where.folder = filter.folder;
      }

      // Filter by pinned
      if (filter?.isPinned !== undefined) {
        where.isPinned = filter.isPinned;
      }

      // Filter by tags
      if (filter?.tags && filter.tags.length > 0) {
        where.tags = { $in: filter.tags };
      }

      // Search by title or content
      if (filter?.search) {
        where.$or = [
          { title: { $regex: filter.search, $options: 'i' } },
          { content: { $regex: filter.search, $options: 'i' } },
        ];
      }

      // Filter by reminder due
      if (filter?.reminderDue) {
        const user = await User.findById(userId).select('timezone');
        const timezone = user?.timezone || 'UTC';

        if (filter.reminderDue === 'today') {
          const today = DateUtil.startOfDayInTimezone(new Date(), timezone);
          const endOfDay = DateUtil.endOfDayInTimezone(new Date(), timezone);
          where.reminderDate = { $gte: today, $lte: endOfDay };
        } else if (filter.reminderDue === 'upcoming') {
          where.reminderDate = { $gte: new Date() };
        } else if (filter.reminderDue === 'overdue') {
          where.reminderDate = { $lt: new Date() };
        }
      }

      // Filter by due date
      if (filter?.dueDate) {
        const user = await User.findById(userId).select('timezone');
        const timezone = user?.timezone || 'UTC';

        if (filter.dueDate === 'today') {
          const today = DateUtil.startOfDayInTimezone(new Date(), timezone);
          const endOfDay = DateUtil.endOfDayInTimezone(new Date(), timezone);
          where.dueDate = { $gte: today, $lte: endOfDay };
        } else if (filter.dueDate === 'upcoming') {
          where.dueDate = { $gte: new Date() };
        } else if (filter.dueDate === 'overdue') {
          where.dueDate = { $lt: new Date() };
        }
      }

      // Filter by template
      if (filter?.templateId) {
        where.templateId = filter.templateId;
      }

      // Sorting
      const sort: any = { isPinned: -1 }; // Pinned notes always first

      if (filter?.sortBy === 'priority') {
        sort.priority = -1;
      } else if (filter?.sortBy === 'reminder') {
        sort.reminderDate = 1;
      } else if (filter?.sortBy === 'due') {
        sort.dueDate = 1;
      } else if (filter?.sortBy === 'title') {
        sort.title = 1;
      } else if (filter?.sortBy === 'updated') {
        sort.updatedAt = -1;
      } else if (filter?.sortBy === 'checklist') {
        sort['checklist.completed'] = 1;
      }
      sort.createdAt = -1; // Default sort

      const page = filter?.page || 1;
      const limit = filter?.limit || 20;
      const skip = (page - 1) * limit;

      const [notes, total] = await Promise.all([
        QuickNote.find(where)
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .lean(),
        QuickNote.countDocuments(where),
      ]);

      const notesWithStats = await Promise.all(
        notes.map(async (note) => {
          const stats = await this.getNoteStats(note._id.toString(), userId);
          const checklistProgress = this.calculateChecklistProgress(note.checklist || []);

          return {
            ...note,
            id: note._id.toString(),
            userId: note.userId?.toString() || userId,
            sharedWith: note.sharedWith?.map((id: Types.ObjectId) => id.toString()) || [],
            metadata: {
              ...note.metadata,
              duplicateOf: note.metadata?.duplicateOf?.toString(),
              relatedNotes: note.metadata?.relatedNotes?.map((id: Types.ObjectId) => id.toString()),
            },
            category: note.category as NoteCategory,
            priority: note.priority as NotePriority,
            status: note.status as NoteStatus,
            stats,
            checklistProgress,
          };
        })
      );

      return {
        notes: notesWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error('Get notes error:', error);
      throw error;
    }
  }

  async getNoteById(noteId: string, userId: string): Promise<QuickNoteResponse> {
    try {
      const note = await QuickNote.findOne({
        _id: new Types.ObjectId(noteId),
        userId: new Types.ObjectId(userId),
      }).lean();

      if (!note) {
        throw new Error('Note not found');
      }

      const stats = await this.getNoteStats(noteId, userId);
      const checklistProgress = this.calculateChecklistProgress(note.checklist || []);

      return {
        ...note,
        id: note._id.toString(),
        userId: note.userId?.toString() || userId,
        sharedWith: note.sharedWith?.map((id: Types.ObjectId) => id.toString()) || [],
        metadata: {
          ...note.metadata,
          duplicateOf: note.metadata?.duplicateOf?.toString(),
          relatedNotes: note.metadata?.relatedNotes?.map((id: Types.ObjectId) => id.toString()),
        },
        category: note.category as NoteCategory,
        priority: note.priority as NotePriority,
        status: note.status as NoteStatus,
        stats,
        checklistProgress,
      };
    } catch (error: any) {
      logger.error('Get note error:', error);
      throw error;
    }
  }

  async createNote(userId: string, data: CreateQuickNoteData) {
    try {
      // Check user's notes limit
      const activeNotesCount = await QuickNote.countDocuments({
        userId: new Types.ObjectId(userId),
        isArchived: false,
        status: { $ne: 'DRAFT' },
      });

      if (activeNotesCount >= 100) {
        throw new Error('Maximum active notes limit reached (100)');
      }

      // Smart enhancement: auto-categorize and suggest features if not provided
      const enhanced = NoteSmart.enhanceNote(data.content, data.title);

      // Extract links if not provided
      const links = data.links && data.links.length > 0
        ? data.links
        : NoteSmart.extractLinks(data.content);

      // Generate title if not provided or empty
      const title = data.title?.trim() || enhanced.autoGeneratedTitle || 'Untitled Note';

      // Suggest category if not provided
      const category = data.category || enhanced.suggestedCategory;

      // Suggest priority if not provided
      const priority = data.priority || enhanced.suggestedPriority;

      // Suggest color if not provided
      const color = data.color || enhanced.suggestedColor;

      // Combine and deduplicate tags
      const allTags = [...(data.tags || []), ...(enhanced.suggestedTags || [])];
      const uniqueTags = [...new Set(allTags)];

      const note = await QuickNote.create({
        userId: new Types.ObjectId(userId),
        title,
        content: data.content,
        richContent: data.richContent,
        category,
        priority,
        color,
        tags: uniqueTags,
        suggestedTags: enhanced.suggestedTags || [],
        checklist: data.checklist || [],
        links,
        isPinned: data.isPinned || false,
        status: data.status || 'ACTIVE',
        templateId: data.templateId,
        folder: data.folder,
        reminderDate: data.reminderDate,
        dueDate: data.dueDate,
        recurringPattern: data.recurringPattern || 'NONE',
        sharedWith: data.sharedWith || [],
        isPublic: data.isPublic || false,
        location: data.location,
        metadata: {
          source: data.metadata?.source || 'api',
          autoGenerated: !!enhanced.autoGeneratedTitle,
          wordCount: enhanced.wordCount,
          readingTime: enhanced.readingTime,
          lastAutoSaved: new Date(),
        },
      });

      logger.info(`Quick Note created: ${note._id} by user ${userId} with smart features`);

      return {
        ...note.toObject(),
        id: note._id.toString(),
      };
    } catch (error: any) {
      logger.error('Create note error:', error);
      throw error;
    }
  }

  async updateNote(noteId: string, userId: string, data: UpdateQuickNoteData) {
    try {
      const note = await QuickNote.findOne({
        _id: new Types.ObjectId(noteId),
        userId: new Types.ObjectId(userId),
      });

      if (!note) {
        throw new Error('Note not found');
      }

      // Smart enhancement for content updates
      const updateData: any = { ...data };

      if (data.content) {
        const enhanced = NoteSmart.enhanceNote(data.content, data.title || note.title);

        // Auto-update title if content changed significantly and title is generic
        if (!data.title && note.title === 'Untitled Note') {
          updateData.title = enhanced.autoGeneratedTitle;
        }

        // Update word count and reading time
        if (!updateData.metadata) {
          updateData.metadata = {};
        }
        updateData.metadata.wordCount = enhanced.wordCount;
        updateData.metadata.readingTime = enhanced.readingTime;
        updateData.metadata.lastAutoSaved = new Date();
      }

      const updatedNote = await QuickNote.findOneAndUpdate(
        {
          _id: new Types.ObjectId(noteId),
          userId: new Types.ObjectId(userId),
        },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      logger.info(`Quick Note updated: ${noteId} by user ${userId}`);

      return {
        ...updatedNote!.toObject(),
        id: updatedNote!._id.toString(),
      };
    } catch (error: any) {
      logger.error('Update note error:', error);
      throw error;
    }
  }

  async deleteNote(noteId: string, userId: string) {
    try {
      const note = await QuickNote.findOne({
        _id: new Types.ObjectId(noteId),
        userId: new Types.ObjectId(userId),
      });

      if (!note) {
        throw new Error('Note not found');
      }

      // Permanently delete the note
      await QuickNote.deleteOne({ _id: note._id });

      logger.info(`Quick Note deleted: ${noteId} by user ${userId}`);
    } catch (error: any) {
      logger.error('Delete note error:', error);
      throw error;
    }
  }

  async archiveNote(noteId: string, userId: string) {
    try {
      const note = await QuickNote.findOne({
        _id: new Types.ObjectId(noteId),
        userId: new Types.ObjectId(userId),
      });

      if (!note) {
        throw new Error('Note not found');
      }

      // Toggle archive status
      note.isArchived = !note.isArchived;
      await note.save();

      logger.info(`Quick Note ${note.isArchived ? 'archived' : 'unarchived'}: ${noteId} by user ${userId}`);

      return {
        ...note.toObject(),
        id: note._id.toString(),
      };
    } catch (error: any) {
      logger.error('Archive note error:', error);
      throw error;
    }
  }

  async togglePin(noteId: string, userId: string) {
    try {
      const note = await QuickNote.findOne({
        _id: new Types.ObjectId(noteId),
        userId: new Types.ObjectId(userId),
      });

      if (!note) {
        throw new Error('Note not found');
      }

      // Toggle pin status
      note.isPinned = !note.isPinned;
      await note.save();

      logger.info(`Quick Note ${note.isPinned ? 'pinned' : 'unpinned'}: ${noteId} by user ${userId}`);

      return {
        ...note.toObject(),
        id: note._id.toString(),
      };
    } catch (error: any) {
      logger.error('Toggle pin error:', error);
      throw error;
    }
  }

  // Checklist operations
  async addChecklistItem(noteId: string, userId: string, itemText: string) {
    try {
      const note = await QuickNote.findOne({
        _id: new Types.ObjectId(noteId),
        userId: new Types.ObjectId(userId),
      });

      if (!note) {
        throw new Error('Note not found');
      }

      const newItem = {
        id: new Types.ObjectId().toString(),
        text: itemText,
        completed: false,
      };

      note.checklist.push(newItem);
      await note.save();

      logger.info(`Checklist item added to note ${noteId} by user ${userId}`);

      return newItem;
    } catch (error: any) {
      logger.error('Add checklist item error:', error);
      throw error;
    }
  }

  async toggleChecklistItem(noteId: string, userId: string, itemId: string, completed: boolean) {
    try {
      const note = await QuickNote.findOne({
        _id: new Types.ObjectId(noteId),
        userId: new Types.ObjectId(userId),
      });

      if (!note) {
        throw new Error('Note not found');
      }

      const item = note.checklist.find(item => item.id === itemId);
      if (!item) {
        throw new Error('Checklist item not found');
      }

      item.completed = completed;
      item.completedAt = completed ? new Date() : undefined;

      await note.save();

      logger.info(`Checklist item ${itemId} ${completed ? 'completed' : 'uncompleted'} in note ${noteId}`);

      return item;
    } catch (error: any) {
      logger.error('Toggle checklist item error:', error);
      throw error;
    }
  }

  async deleteChecklistItem(noteId: string, userId: string, itemId: string) {
    try {
      const note = await QuickNote.findOne({
        _id: new Types.ObjectId(noteId),
        userId: new Types.ObjectId(userId),
      });

      if (!note) {
        throw new Error('Note not found');
      }

      note.checklist = note.checklist.filter(item => item.id !== itemId);
      await note.save();

      logger.info(`Checklist item ${itemId} deleted from note ${noteId}`);
    } catch (error: any) {
      logger.error('Delete checklist item error:', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkAction(userId: string, action: string, noteIds: string[]) {
    try {
      const objectIds = noteIds.map(id => new Types.ObjectId(id));

      let updateData: any = {};

      switch (action) {
        case 'archive':
          updateData = { isArchived: true };
          break;
        case 'unarchive':
          updateData = { isArchived: false };
          break;
        case 'pin':
          updateData = { isPinned: true };
          break;
        case 'unpin':
          updateData = { isPinned: false };
          break;
        case 'complete':
          updateData = { status: 'COMPLETED', completedAt: new Date() };
          break;
        case 'restore':
          updateData = { status: 'ACTIVE', completedAt: null };
          break;
        default:
          throw new Error('Invalid bulk action');
      }

      const result = await QuickNote.updateMany(
        {
          _id: { $in: objectIds },
          userId: new Types.ObjectId(userId),
        },
        { $set: updateData }
      );

      logger.info(`Bulk action ${action} performed on ${result.modifiedCount} notes by user ${userId}`);

      return {
        action,
        affected: result.modifiedCount,
      };
    } catch (error: any) {
      logger.error('Bulk action error:', error);
      throw error;
    }
  }

  // Folder operations
  async getFolders(userId: string): Promise<{ folder: string; count: number }[]> {
    try {
      const folders = await QuickNote.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            isArchived: false,
            folder: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$folder',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      return folders.map(f => ({
        folder: f._id,
        count: f.count,
      }));
    } catch (error: any) {
      logger.error('Get folders error:', error);
      throw error;
    }
  }

  async createFolder(userId: string, folderName: string) {
    try {
      // Check if folder already exists
      const existing = await QuickNote.findOne({
        userId: new Types.ObjectId(userId),
        folder: folderName,
      });

      if (existing) {
        throw new Error('Folder already exists');
      }

      logger.info(`Folder ${folderName} created by user ${userId}`);
      return { message: 'Folder created successfully' };
    } catch (error: any) {
      logger.error('Create folder error:', error);
      throw error;
    }
  }

  async getNoteStats(noteId: string, _userId: string): Promise<QuickNoteStats> {
    try {
      const note = await QuickNote.findById(noteId);

      if (!note) {
        throw new Error('Note not found');
      }

      const ageInDays = DateUtil.getDaysBetween(note.createdAt, new Date());
      const isCompleted = note.status === 'COMPLETED' || !!note.completedAt;
      const isOverdue = note.dueDate && note.dueDate < new Date() && !isCompleted;
      const isReminderOverdue = note.reminderDate && note.reminderDate < new Date() && !isCompleted;

      return {
        ageInDays,
        isCompleted,
        isOverdue: isOverdue || isReminderOverdue || false,
        hasReminder: !!note.reminderDate,
        daysUntilReminder: note.reminderDate
          ? DateUtil.getDaysBetween(new Date(), note.reminderDate)
          : undefined,
        daysUntilDue: note.dueDate
          ? DateUtil.getDaysBetween(new Date(), note.dueDate)
          : undefined,
      };
    } catch (error: any) {
      logger.error('Get note stats error:', error);
      throw error;
    }
  }

  async getNoteCategories(userId: string): Promise<{ category: NoteCategory; count: number }[]> {
    try {
      const categories = await QuickNote.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            isArchived: false,
          },
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      return categories.map((cat) => ({
        category: cat._id as NoteCategory,
        count: cat.count,
      }));
    } catch (error: any) {
      logger.error('Get note categories error:', error);
      throw error;
    }
  }

  async getAllTags(userId: string): Promise<{ tag: string; count: number }[]> {
    try {
      const notes = await QuickNote.find({
        userId: new Types.ObjectId(userId),
        isArchived: false,
        tags: { $exists: true, $ne: [] },
      }).lean();

      const tagCounts = new Map<string, number>();

      notes.forEach((note) => {
        note.tags.forEach((tag) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      return Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error: any) {
      logger.error('Get all tags error:', error);
      throw error;
    }
  }

  async getNotesDueForReminder(): Promise<Array<{ noteId: string; userId: string; reminderDate: Date; title: string }>> {
    try {
      const notes = await QuickNote.find({
        reminderDate: {
          $lte: new Date(),
        },
        status: { $ne: 'COMPLETED' },
        completedAt: { $exists: false },
      })
        .select('_id userId reminderDate title')
        .lean();

      return notes.map((note) => ({
        noteId: note._id.toString(),
        userId: note.userId.toString(),
        reminderDate: note.reminderDate!,
        title: note.title,
      }));
    } catch (error: any) {
      logger.error('Get notes due for reminder error:', error);
      throw error;
    }
  }

  // Smart suggestions
  async getSmartSuggestions(userId: string, content: string, title?: string) {
    try {
      const enhanced = NoteSmart.enhanceNote(content, title);

      // Check for similar existing notes
      const existingNotes = await QuickNote.find({
        userId: new Types.ObjectId(userId),
        isArchived: false,
      }).select('content title').limit(20).lean();

      const duplicates = NoteSmart.findPotentialDuplicates(content, existingNotes);

      return {
        ...enhanced,
        potentialDuplicates: duplicates,
      };
    } catch (error: any) {
      logger.error('Get smart suggestions error:', error);
      throw error;
    }
  }

  private calculateChecklistProgress(checklist: any[]): number {
    if (checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  }
}

export default new QuickNoteService();