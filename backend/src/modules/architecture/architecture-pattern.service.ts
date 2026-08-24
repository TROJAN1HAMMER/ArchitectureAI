import { Injectable } from "@nestjs/common";
import {
  GraphNode,
  GraphEdge,
  ArchitectureFindingSeverity,
  ArchitectureFindingType,
} from "@prisma/client";
import { DraftFinding } from "./architecture-auditor.service.js";

export interface DetectedPattern {
  name: string;
  confidence: number;
  explanation: string;
  supportingNodeIds: string[];
  supportingPaths: string[];
}

@Injectable()
export class ArchitecturePatternService {
  detectPatterns(
    nodes: GraphNode[],
    _edges: GraphEdge[],
  ): { patterns: DetectedPattern[]; findings: DraftFinding[] } {
    const patterns: DetectedPattern[] = [];
    const findings: DraftFinding[] = [];

    if (!nodes || nodes.length === 0) {
      return { patterns, findings };
    }

    const pathSet = new Set(nodes.map((n) => (n.path || n.name).toLowerCase()));

    // 1. Modular Monolith Pattern Detection
    const modulePaths = Array.from(pathSet).filter((p) =>
      p.includes("modules/"),
    );
    if (modulePaths.length >= 2) {
      const supportingNodes = nodes.filter((n) =>
        (n.path || "").toLowerCase().includes("modules/"),
      );
      const pattern: DetectedPattern = {
        name: "Modular Monolith",
        confidence: 0.95,
        explanation:
          "The repository structure isolates functional domain areas into cohesive backend modules.",
        supportingNodeIds: supportingNodes.map((n) => n.id),
        supportingPaths: supportingNodes.map((n) => n.path!).filter(Boolean),
      };
      patterns.push(pattern);

      findings.push({
        type: ArchitectureFindingType.PATTERN_DETECTED,
        severity: ArchitectureFindingSeverity.INFO,
        title: `Architectural Pattern Detected: Modular Monolith`,
        description: pattern.explanation,
        confidence: pattern.confidence,
        evidence: {
          patternName: pattern.name,
          moduleCount: modulePaths.length,
        },
      });
    }

    // 2. Service Layer Pattern Detection
    const serviceNodes = nodes.filter((n) =>
      (n.path || "").toLowerCase().includes(".service.ts"),
    );
    if (serviceNodes.length >= 2) {
      const pattern: DetectedPattern = {
        name: "Service Layer Pattern",
        confidence: 0.92,
        explanation:
          "Encapsulates core business logic and domain execution within injectable NestJS domain services.",
        supportingNodeIds: serviceNodes.map((n) => n.id),
        supportingPaths: serviceNodes.map((n) => n.path!).filter(Boolean),
      };
      patterns.push(pattern);

      findings.push({
        type: ArchitectureFindingType.PATTERN_DETECTED,
        severity: ArchitectureFindingSeverity.INFO,
        title: `Architectural Pattern Detected: Service Layer`,
        description: pattern.explanation,
        confidence: pattern.confidence,
        evidence: {
          patternName: pattern.name,
          serviceCount: serviceNodes.length,
        },
      });
    }

    // 3. REST API Gateway / Controller Pattern Detection
    const controllerNodes = nodes.filter((n) =>
      (n.path || "").toLowerCase().includes(".controller.ts"),
    );
    if (controllerNodes.length >= 1) {
      const pattern: DetectedPattern = {
        name: "REST API Gateway",
        confidence: 0.94,
        explanation:
          "Exposes structured HTTP API resource endpoints using NestJS REST controllers.",
        supportingNodeIds: controllerNodes.map((n) => n.id),
        supportingPaths: controllerNodes.map((n) => n.path!).filter(Boolean),
      };
      patterns.push(pattern);

      findings.push({
        type: ArchitectureFindingType.PATTERN_DETECTED,
        severity: ArchitectureFindingSeverity.INFO,
        title: `Architectural Pattern Detected: REST API Gateway`,
        description: pattern.explanation,
        confidence: pattern.confidence,
        evidence: {
          patternName: pattern.name,
          controllerCount: controllerNodes.length,
        },
      });
    }

    // 4. Component-Based Frontend Architecture
    const frontendComponentNodes = nodes.filter((n) =>
      (n.path || "").toLowerCase().startsWith("frontend/src/components/"),
    );
    if (frontendComponentNodes.length >= 2) {
      const pattern: DetectedPattern = {
        name: "Component-Based Frontend",
        confidence: 0.9,
        explanation:
          "Decomposes user interface elements into reusable React components.",
        supportingNodeIds: frontendComponentNodes.map((n) => n.id),
        supportingPaths: frontendComponentNodes
          .map((n) => n.path!)
          .filter(Boolean),
      };
      patterns.push(pattern);

      findings.push({
        type: ArchitectureFindingType.PATTERN_DETECTED,
        severity: ArchitectureFindingSeverity.INFO,
        title: `Architectural Pattern Detected: Component-Based Frontend`,
        description: pattern.explanation,
        confidence: pattern.confidence,
        evidence: {
          patternName: pattern.name,
          componentCount: frontendComponentNodes.length,
        },
      });
    }

    return { patterns, findings };
  }
}
