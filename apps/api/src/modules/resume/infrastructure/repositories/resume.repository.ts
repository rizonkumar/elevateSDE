import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { ResumeAnalysis } from '../../domain/entities/resume-analysis';
import { IResumeRepository } from '../../domain/interfaces/resume-repository.interface';
import { ResumeMapper } from '../mappers/resume.mapper';

@Injectable()
export class ResumeRepository implements IResumeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(resume: ResumeAnalysis): Promise<void> {
    await this.prisma.resume.create({ data: ResumeMapper.toPersistence(resume) });
  }

  async save(resume: ResumeAnalysis): Promise<void> {
    await this.prisma.resume.update({
      where: { id: resume.getId() },
      data: ResumeMapper.toAnalysisUpdate(resume),
    });
  }

  async findById(id: string): Promise<ResumeAnalysis | null> {
    const record = await this.prisma.resume.findUnique({ where: { id } });
    return record ? ResumeMapper.toDomain(record) : null;
  }

  async findAllForUser(userId: string, limit: number): Promise<ResumeAnalysis[]> {
    const records = await this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return records.map((record) => ResumeMapper.toDomain(record));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.resume.delete({ where: { id } });
  }
}
