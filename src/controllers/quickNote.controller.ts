import { Response } from 'express';
import quickNoteService from '@/services/quickNote.service';
import { AuthenticatedRequest } from '@/types';
import logger from '@/utils/logger';
import ResponseUtil from '@/utils/response';

class QuickNoteController {
  async getAllNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filter = {
        category: req.query.category as any,
        priority: req.query.priority as any,
        status: req.query.status as any,
        isArchived: req.query.isArchived === 'true' ? true : req.query.isArchived === 'false' ? false : undefined,
        isPinned: req.query.isPinned === 'true' ? true : req.query.isPinned === 'false' ? false : undefined,
        folder: req.query.folder as string | undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',').map(t => t.trim()) : undefined,
        search: req.query.search as string | undefined,
        sortBy: req.query.sortBy as any,
        reminderDue: req.query.reminderDue as any,
        dueDate: req.query.dueDate as any,
        templateId: req.query.templateId as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await quickNoteService.getAllNotes(req.user!.id, filter);
      ResponseUtil.success(res, result);
    } catch (error: any) {
      logger.error('Get notes controller error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch notes');
    }
  }

  async getNoteById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const note = await quickNoteService.getNoteById(req.params.id, req.user!.id);
      ResponseUtil.success(res, { note });
    } catch (error: any) {
      logger.error('Get note controller error:', error);

      if (error.message === 'Note not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to fetch note');
    }
  }

  async createNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const note = await quickNoteService.createNote(req.user!.id, req.body);
      ResponseUtil.created(res, { note }, 'Quick note created successfully');
    } catch (error: any) {
      logger.error('Create note controller error:', error);

      if (error.message.includes('limit reached')) {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      if (error.message.includes('validation')) {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to create note');
    }
  }

  async updateNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const note = await quickNoteService.updateNote(req.params.id, req.user!.id, req.body);
      ResponseUtil.success(res, { note }, 'Quick note updated successfully');
    } catch (error: any) {
      logger.error('Update note controller error:', error);

      if (error.message === 'Note not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to update note');
    }
  }

  async deleteNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await quickNoteService.deleteNote(req.params.id, req.user!.id);
      ResponseUtil.success(res, null, 'Quick note deleted successfully');
    } catch (error: any) {
      logger.error('Delete note controller error:', error);

      if (error.message === 'Note not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to delete note');
    }
  }

  async archiveNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const note = await quickNoteService.archiveNote(req.params.id, req.user!.id);
      ResponseUtil.success(res, { note }, `Quick note ${note.isArchived ? 'archived' : 'unarchived'} successfully`);
    } catch (error: any) {
      logger.error('Archive note controller error:', error);

      if (error.message === 'Note not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to archive note');
    }
  }

  async togglePin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const note = await quickNoteService.togglePin(req.params.id, req.user!.id);
      ResponseUtil.success(res, { note }, `Quick note ${note.isPinned ? 'pinned' : 'unpinned'} successfully`);
    } catch (error: any) {
      logger.error('Toggle pin controller error:', error);

      if (error.message === 'Note not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to toggle pin');
    }
  }

  // Checklist operations
  async addChecklistItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { text } = req.body;
      const item = await quickNoteService.addChecklistItem(req.params.id, req.user!.id, text);
      ResponseUtil.created(res, { item }, 'Checklist item added successfully');
    } catch (error: any) {
      logger.error('Add checklist item controller error:', error);

      if (error.message === 'Note not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to add checklist item');
    }
  }

  async toggleChecklistItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { completed } = req.body;
      const item = await quickNoteService.toggleChecklistItem(
        req.params.id,
        req.user!.id,
        req.params.itemId,
        completed
      );
      ResponseUtil.success(res, { item }, 'Checklist item updated successfully');
    } catch (error: any) {
      logger.error('Toggle checklist item controller error:', error);

      if (error.message === 'Note not found' || error.message === 'Checklist item not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to toggle checklist item');
    }
  }

  async deleteChecklistItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await quickNoteService.deleteChecklistItem(req.params.id, req.user!.id, req.params.itemId);
      ResponseUtil.success(res, null, 'Checklist item deleted successfully');
    } catch (error: any) {
      logger.error('Delete checklist item controller error:', error);

      if (error.message === 'Note not found') {
        ResponseUtil.notFound(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to delete checklist item');
    }
  }

  // Bulk operations
  async bulkAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { action, noteIds } = req.body;
      const result = await quickNoteService.bulkAction(req.user!.id, action, noteIds);
      ResponseUtil.success(res, result, `Bulk ${action} completed successfully`);
    } catch (error: any) {
      logger.error('Bulk action controller error:', error);

      if (error.message === 'Invalid bulk action') {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to perform bulk action');
    }
  }

  // Folder operations
  async getFolders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const folders = await quickNoteService.getFolders(req.user!.id);
      ResponseUtil.success(res, { folders });
    } catch (error: any) {
      logger.error('Get folders controller error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch folders');
    }
  }

  async createFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name } = req.body;
      await quickNoteService.createFolder(req.user!.id, name);
      ResponseUtil.created(res, null, 'Folder created successfully');
    } catch (error: any) {
      logger.error('Create folder controller error:', error);

      if (error.message === 'Folder already exists') {
        ResponseUtil.badRequest(res, error.message);
        return;
      }

      ResponseUtil.serverError(res, 'Failed to create folder');
    }
  }

  async getNoteCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const categories = await quickNoteService.getNoteCategories(req.user!.id);
      ResponseUtil.success(res, { categories });
    } catch (error: any) {
      logger.error('Get note categories controller error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch categories');
    }
  }

  async getAllTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tags = await quickNoteService.getAllTags(req.user!.id);
      ResponseUtil.success(res, { tags });
    } catch (error: any) {
      logger.error('Get all tags controller error:', error);
      ResponseUtil.serverError(res, 'Failed to fetch tags');
    }
  }

  // Smart suggestions
  async getSmartSuggestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { content, title } = req.body;
      const suggestions = await quickNoteService.getSmartSuggestions(req.user!.id, content, title);
      ResponseUtil.success(res, suggestions);
    } catch (error: any) {
      logger.error('Get smart suggestions controller error:', error);
      ResponseUtil.serverError(res, 'Failed to generate suggestions');
    }
  }
}

export default new QuickNoteController();