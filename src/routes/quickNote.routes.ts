import { Router, type Router as RouterType } from 'express';
import quickNoteController from '@/controllers/quickNote.controller';
import { authenticate } from '@/middleware/auth.middleware';
import validate from '@/middleware/validation.middleware';
import {
  createQuickNoteSchema,
  updateQuickNoteSchema,
  checklistItemSchema,
  toggleChecklistItemSchema,
  bulkActionSchema,
} from '@/validators/quickNote.validator';
import { idParamSchema as commonIdParamSchema } from '@/validators/common.validator';

const router: RouterType = Router();

// All quick note routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/quick-notes:
 *   get:
 *     summary: Get all user quick notes
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [PERSONAL, WORK, IDEAS, TASKS, OTHER]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, ACTIVE, COMPLETED]
 *       - in: query
 *         name: isArchived
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isPinned
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tag names
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and content
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [priority, reminder, due, title, created, updated, checklist]
 *       - in: query
 *         name: reminderDue
 *         schema:
 *           type: string
 *           enum: [today, upcoming, overdue]
 *       - in: query
 *         name: dueDate
 *         schema:
 *           type: string
 *           enum: [today, upcoming, overdue]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quick notes retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', quickNoteController.getAllNotes);

/**
 * @swagger
 * /api/v1/quick-notes/suggestions:
 *   post:
 *     summary: Get smart suggestions for a note
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Suggestions generated successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/suggestions', quickNoteController.getSmartSuggestions);

/**
 * @swagger
 * /api/v1/quick-notes/categories:
 *   get:
 *     summary: Get note categories distribution
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/categories', quickNoteController.getNoteCategories);

/**
 * @swagger
 * /api/v1/quick-notes/tags:
 *   get:
 *     summary: Get all tags with counts
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/tags', quickNoteController.getAllTags);

/**
 * @swagger
 * /api/v1/quick-notes/folders:
 *   get:
 *     summary: Get all folders
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Folders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/folders', quickNoteController.getFolders);

/**
 * @swagger
 * /api/v1/quick-notes/folders:
 *   post:
 *     summary: Create a new folder
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Folder created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/folders', quickNoteController.createFolder);

/**
 * @swagger
 * /api/v1/quick-notes/bulk:
 *   post:
 *     summary: Perform bulk actions on notes
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [archive, unarchive, delete, pin, unpin, complete, restore]
 *               noteIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Bulk action completed successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/bulk', validate(bulkActionSchema), quickNoteController.bulkAction);

/**
 * @swagger
 * /api/v1/quick-notes:
 *   post:
 *     summary: Create a new quick note
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *               richContent:
 *                 type: string
 *                 maxLength: 10000
 *               category:
 *                 type: string
 *                 enum: [PERSONAL, WORK, IDEAS, TASKS, OTHER]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               color:
 *                 type: string
 *                 format: hex color
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 15
 *               checklist:
 *                 type: array
 *                 items:
 *                   type: object
 *                 maxItems: 20
 *               links:
 *                 type: array
 *                 items:
 *                   type: object
 *                 maxItems: 10
 *               isPinned:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, COMPLETED]
 *               folder:
 *                 type: string
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               recurringPattern:
 *                 type: string
 *                 enum: [NONE, DAILY, WEEKLY, MONTHLY]
 *               sharedWith:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   placeName:
 *                     type: string
 *     responses:
 *       201:
 *         description: Quick note created successfully with smart features
 *       400:
 *         description: Validation error or limit reached
 *       401:
 *         description: Unauthorized
 */
router.post('/', validate(createQuickNoteSchema), quickNoteController.createNote);

/**
 * @swagger
 * /api/v1/quick-notes/{id}:
 *   get:
 *     summary: Get quick note details
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quick note retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.get('/:id', validate(commonIdParamSchema, 'params'), quickNoteController.getNoteById);

/**
 * @swagger
 * /api/v1/quick-notes/{id}:
 *   put:
 *     summary: Update quick note
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *               richContent:
 *                 type: string
 *                 maxLength: 10000
 *               category:
 *                 type: string
 *                 enum: [PERSONAL, WORK, IDEAS, TASKS, OTHER]
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               color:
 *                 type: string
 *                 format: hex color
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 15
 *               checklist:
 *                 type: array
 *                 items:
 *                   type: object
 *                 maxItems: 20
 *               links:
 *                 type: array
 *                 items:
 *                   type: object
 *                 maxItems: 10
 *               isPinned:
 *                 type: boolean
 *               isArchived:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [DRAFT, ACTIVE, COMPLETED]
 *               folder:
 *                 type: string
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               recurringPattern:
 *                 type: string
 *                 enum: [NONE, DAILY, WEEKLY, MONTHLY]
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Quick note updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.put('/:id', validate(commonIdParamSchema, 'params'), validate(updateQuickNoteSchema), quickNoteController.updateNote);

/**
 * @swagger
 * /api/v1/quick-notes/{id}:
 *   delete:
 *     summary: Delete quick note permanently
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quick note deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.delete('/:id', validate(commonIdParamSchema, 'params'), quickNoteController.deleteNote);

/**
 * @swagger
 * /api/v1/quick-notes/{id}/archive:
 *   patch:
 *     summary: Toggle quick note archive status
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archive status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.patch('/:id/archive', validate(commonIdParamSchema, 'params'), quickNoteController.archiveNote);

/**
 * @swagger
 * /api/v1/quick-notes/{id}/pin:
 *   patch:
 *     summary: Toggle quick note pin status
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pin status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.patch('/:id/pin', validate(commonIdParamSchema, 'params'), quickNoteController.togglePin);

/**
 * @swagger
 * /api/v1/quick-notes/{id}/checklist:
 *   post:
 *     summary: Add checklist item to note
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 200
 *     responses:
 *       201:
 *         description: Checklist item added successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.post('/:id/checklist', validate(commonIdParamSchema, 'params'), validate(checklistItemSchema), quickNoteController.addChecklistItem);

/**
 * @swagger
 * /api/v1/quick-notes/{id}/checklist/{itemId}:
 *   patch:
 *     summary: Toggle checklist item completion
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Checklist item updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note or checklist item not found
 */
router.patch(
  '/:id/checklist/:itemId',
  validate(commonIdParamSchema, 'params'),
  validate(toggleChecklistItemSchema),
  quickNoteController.toggleChecklistItem
);

/**
 * @swagger
 * /api/v1/quick-notes/{id}/checklist/{itemId}:
 *   delete:
 *     summary: Delete checklist item
 *     tags: [Quick Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Checklist item deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 */
router.delete(
  '/:id/checklist/:itemId',
  validate(commonIdParamSchema, 'params'),
  quickNoteController.deleteChecklistItem
);

export default router;
