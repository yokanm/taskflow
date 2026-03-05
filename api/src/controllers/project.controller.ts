import type { Request, Response } from 'express';
import { prisma } from '../lib/db';

export interface AuthRequest extends Request {
  userId?: string;
}

export const listProjects = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const projects = await prisma.project.findMany({
      where: { userId: req.userId },
      include: { tasks: { include: { subTasks: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ data: projects, message: 'Projects fetched' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const project = await prisma.project.findUnique({
      where: { id, userId: req.userId },
      include: { tasks: { include: { subTasks: true } } },
    });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    return res.status(200).json({ data: project });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {  // ✅ AuthRequest
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, color, emoji } = req.body;

    const project = await prisma.project.create({
      data: { name, color, emoji, userId: req.userId }, // ✅ no ! needed after guard
      include: { tasks: true },
    });

    return res.status(201).json({ data: project, message: 'Project created' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {  // ✅ AuthRequest
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const { name, color, emoji } = req.body; // ✅ whitelist fields, don't spread req.body

    const project = await prisma.project.findUnique({
      where: { id, userId: req.userId }, // ✅ ownership at DB level
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const updated = await prisma.project.update({
      where: { id },
      data: { name, color, emoji },
      include: { tasks: { include: { subTasks: true } } },
    });

    return res.status(200).json({ data: updated, message: 'Project updated' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {  // ✅ AuthRequest
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    const project = await prisma.project.findUnique({
      where: { id, userId: req.userId }, // ✅ ownership at DB level
    });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await prisma.project.delete({ where: { id } });

    return res.status(200).json({ message: 'Project deleted' });
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
};