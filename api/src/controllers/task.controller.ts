import type { Request, Response } from 'express';
import { prisma } from '../lib/db.ts';
import type { Priority, TaskStatus } from '../../generated/prisma/client.ts';

export interface AuthRequest extends Request {
  userId?: string;
}

const getParam = (req: AuthRequest, key: string): string | null => {
  const val = req.params[key];
  if (!val || Array.isArray(val)) return null;
  return val;
};

const STATUS_CYCLE: Record<string, string> = {
  'TODO':        'IN_PROGRESS',
  'IN_PROGRESS': 'DONE',
  'DONE':        'TODO',
};

export const list = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const { status, priority, projectId } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.userId,
        ...(status    ? { status:    status    as TaskStatus } : {}),
        ...(priority  ? { priority:  priority  as Priority   } : {}),
        ...(projectId ? { projectId: projectId as string     } : {}),
      },
      include: { subTasks: true, project: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ data: tasks, message: 'Tasks fetched' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const get = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = getParam(req, 'id');
    if (!id) return res.status(400).json({ message: 'Invalid task ID' });

    const task = await prisma.task.findUnique({
      where: { id, userId: req.userId },
      include: { subTasks: true, project: true },
    });

    if (!task) return res.status(404).json({ message: 'Task not found' });

    return res.status(200).json({ data: task });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const create = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const { title, description, priority, dueDate, projectId } = req.body;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate:   dueDate   ? new Date(dueDate) : null,
        userId:    req.userId,
        projectId: projectId ?? null,
      },
      include: { subTasks: true, project: true },
    });

    return res.status(201).json({ data: task, message: 'Task created' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const update = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = getParam(req, 'id');
    if (!id) return res.status(400).json({ message: 'Invalid task ID' });

    const existing = await prisma.task.findUnique({
      where: { id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    const { title, description, priority, status, dueDate, projectId } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title       !== undefined ? { title }                     : {}),
        ...(description !== undefined ? { description }               : {}),
        ...(priority    !== undefined ? { priority }                  : {}),
        ...(status      !== undefined ? { status }                    : {}),
        ...(dueDate     !== undefined ? { dueDate: new Date(dueDate) } : {}),
        ...(projectId   !== undefined ? { projectId }                  : {}),
      },
      include: { subTasks: true, project: true },
    });

    return res.status(200).json({ data: task, message: 'Task updated' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Cycles status: TODO → IN_PROGRESS → DONE → TODO
 */
export const toggle = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = getParam(req, 'id');
    if (!id) return res.status(400).json({ message: 'Invalid task ID' });

    const existing = await prisma.task.findUnique({
      where: { id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    const nextStatus = (STATUS_CYCLE[existing.status] ?? 'TODO') as TaskStatus;

    const task = await prisma.task.update({
      where: { id },
      data:  { status: nextStatus },
      include: { subTasks: true },
    });

    return res.status(200).json({ data: task, message: 'Task toggled' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = getParam(req, 'id');
    if (!id) return res.status(400).json({ message: 'Invalid task ID' });

    const existing = await prisma.task.findUnique({
      where: { id, userId: req.userId },
    });
    if (!existing) return res.status(404).json({ message: 'Task not found' });

    await prisma.task.delete({ where: { id } });

    return res.status(200).json({ message: 'Task deleted' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const addSubtask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const id = getParam(req, 'id');
    if (!id) return res.status(400).json({ message: 'Invalid task ID' });

    const task = await prisma.task.findUnique({
      where: { id, userId: req.userId },
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const subTask = await prisma.subTask.create({
      data: { title: req.body.title, taskId: id },
    });

    return res.status(201).json({ data: subTask, message: 'Subtask added' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const toggleSubtask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const subId = getParam(req, 'subId');
    if (!subId) return res.status(400).json({ message: 'Invalid subtask ID' });

    const subTask = await prisma.subTask.findUnique({
      where: { id: subId },
      include: { task: true },
    });
    if (!subTask) return res.status(404).json({ message: 'Subtask not found' });
    if (subTask.task.userId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await prisma.subTask.update({
      where: { id: subId },
      data:  { done: !subTask.done },
    });

    return res.status(200).json({ data: updated, message: 'Subtask toggled' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
