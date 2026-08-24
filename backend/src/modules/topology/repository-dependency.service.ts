import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { RepositoryDependencyType, DependencyConfidence } from "@prisma/client";

export interface CreateDependencyDto {
  enterpriseSystemId: string;
  sourceRepositoryId: string;
  targetRepositoryId: string;
  type: RepositoryDependencyType;
  confidence?: DependencyConfidence;
  evidence?: Record<string, any>;
}

@Injectable()
export class RepositoryDependencyService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateDependency(dto: CreateDependencyDto) {
    if (dto.sourceRepositoryId === dto.targetRepositoryId) {
      throw new BadRequestException(
        "Self-dependencies between repositories are not allowed",
      );
    }

    return this.prisma.repositoryDependency.upsert({
      where: {
        sourceRepositoryId_targetRepositoryId_type: {
          sourceRepositoryId: dto.sourceRepositoryId,
          targetRepositoryId: dto.targetRepositoryId,
          type: dto.type,
        },
      },
      create: {
        enterpriseSystemId: dto.enterpriseSystemId,
        sourceRepositoryId: dto.sourceRepositoryId,
        targetRepositoryId: dto.targetRepositoryId,
        type: dto.type,
        confidence: dto.confidence || DependencyConfidence.MEDIUM,
        evidence: dto.evidence || {},
      },
      update: {
        confidence: dto.confidence || DependencyConfidence.MEDIUM,
        evidence: dto.evidence || {},
      },
    });
  }

  async getDependenciesForSystem(enterpriseSystemId: string) {
    return this.prisma.repositoryDependency.findMany({
      where: { enterpriseSystemId },
      include: {
        sourceRepository: {
          select: {
            id: true,
            name: true,
            fullName: true,
            role: true,
            language: true,
          },
        },
        targetRepository: {
          select: {
            id: true,
            name: true,
            fullName: true,
            role: true,
            language: true,
          },
        },
      },
    });
  }
}
