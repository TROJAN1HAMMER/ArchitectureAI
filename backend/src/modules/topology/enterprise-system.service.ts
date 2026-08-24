import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

export interface CreateSystemDto {
  name: string;
  description?: string;
  repositoryIds?: string[];
}

export interface UpdateSystemDto {
  name?: string;
  description?: string;
}

@Injectable()
export class EnterpriseSystemService {
  private readonly logger = new Logger(EnterpriseSystemService.name);

  constructor(private readonly prisma: PrismaService) {}

  async verifySystemOwnership(userId: string, systemId: string): Promise<void> {
    const system = await this.prisma.enterpriseSystem.findFirst({
      where: { id: systemId, userId },
    });

    if (!system) {
      throw new NotFoundException(
        `Enterprise system with ID ${systemId} not found`,
      );
    }
  }

  async createSystem(userId: string, dto: CreateSystemDto) {
    const system = await this.prisma.enterpriseSystem.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description || null,
      },
    });

    if (dto.repositoryIds && dto.repositoryIds.length > 0) {
      for (const repoId of dto.repositoryIds) {
        await this.addRepositoryToSystem(userId, system.id, repoId);
      }
    }

    this.logger.log(
      `Created enterprise system ${system.id} (${system.name}) for user ${userId}`,
    );
    return this.getSystem(userId, system.id);
  }

  async listSystems(userId: string) {
    return this.prisma.enterpriseSystem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        repositories: {
          select: {
            id: true,
            name: true,
            fullName: true,
            role: true,
            language: true,
            stars: true,
          },
        },
        _count: {
          select: {
            repositories: true,
            dependencies: true,
            findings: true,
          },
        },
      },
    });
  }

  async getSystem(userId: string, systemId: string) {
    await this.verifySystemOwnership(userId, systemId);

    const system = await this.prisma.enterpriseSystem.findUnique({
      where: { id: systemId },
      include: {
        repositories: true,
        dependencies: {
          include: {
            sourceRepository: {
              select: { id: true, name: true, fullName: true, role: true },
            },
            targetRepository: {
              select: { id: true, name: true, fullName: true, role: true },
            },
          },
        },
        analyses: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        findings: {
          orderBy: { severity: "asc" },
        },
      },
    });

    if (!system) {
      throw new NotFoundException(
        `Enterprise system with ID ${systemId} not found`,
      );
    }

    return system;
  }

  async updateSystem(userId: string, systemId: string, dto: UpdateSystemDto) {
    await this.verifySystemOwnership(userId, systemId);

    return this.prisma.enterpriseSystem.update({
      where: { id: systemId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
      },
    });
  }

  async deleteSystem(userId: string, systemId: string) {
    await this.verifySystemOwnership(userId, systemId);

    // Unlink repositories before system deletion
    await this.prisma.repository.updateMany({
      where: { enterpriseSystemId: systemId },
      data: { enterpriseSystemId: null },
    });

    await this.prisma.enterpriseSystem.delete({
      where: { id: systemId },
    });

    return { success: true, message: `Enterprise system ${systemId} deleted` };
  }

  async addRepositoryToSystem(
    userId: string,
    systemId: string,
    repositoryId: string,
  ) {
    await this.verifySystemOwnership(userId, systemId);

    // Check user owns the repository connection
    const connection = await this.prisma.repositoryConnection.findFirst({
      where: { userId, repositoryId, disconnectedAt: null },
    });

    if (!connection) {
      throw new ForbiddenException(
        `User ${userId} does not have access to repository ${repositoryId}`,
      );
    }

    const updatedRepo = await this.prisma.repository.update({
      where: { id: repositoryId },
      data: { enterpriseSystemId: systemId },
    });

    this.logger.log(
      `Added repository ${repositoryId} to enterprise system ${systemId}`,
    );
    return updatedRepo;
  }

  async removeRepositoryFromSystem(
    userId: string,
    systemId: string,
    repositoryId: string,
  ) {
    await this.verifySystemOwnership(userId, systemId);

    const repo = await this.prisma.repository.findFirst({
      where: { id: repositoryId, enterpriseSystemId: systemId },
    });

    if (!repo) {
      throw new NotFoundException(
        `Repository ${repositoryId} is not in enterprise system ${systemId}`,
      );
    }

    const updatedRepo = await this.prisma.repository.update({
      where: { id: repositoryId },
      data: { enterpriseSystemId: null },
    });

    this.logger.log(
      `Removed repository ${repositoryId} from enterprise system ${systemId}`,
    );
    return updatedRepo;
  }
}
