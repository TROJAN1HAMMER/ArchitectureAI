import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { RedisModule } from "../../common/redis/redis.module.js";
import { EnterpriseSystemService } from "./enterprise-system.service.js";
import { RepositoryDependencyService } from "./repository-dependency.service.js";
import { TopologyDiscoveryService } from "./topology-discovery.service.js";
import { TopologyAuditorService } from "./topology-auditor.service.js";
import { TopologyRiskService } from "./topology-risk.service.js";
import { TopologyAnalysisService } from "./topology-analysis.service.js";
import { TopologyContextService } from "./topology-context.service.js";
import { EnterpriseTopologyController } from "./enterprise-topology.controller.js";

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [
    EnterpriseSystemService,
    RepositoryDependencyService,
    TopologyDiscoveryService,
    TopologyAuditorService,
    TopologyRiskService,
    TopologyAnalysisService,
    TopologyContextService,
  ],
  controllers: [EnterpriseTopologyController],
  exports: [
    EnterpriseSystemService,
    RepositoryDependencyService,
    TopologyDiscoveryService,
    TopologyAuditorService,
    TopologyRiskService,
    TopologyAnalysisService,
    TopologyContextService,
  ],
})
export class TopologyModule {}
