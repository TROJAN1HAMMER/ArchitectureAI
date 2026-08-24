import { Injectable } from "@nestjs/common";
import { DiagramLayoutService } from "./diagram-layout.service.js";
import {
  DiscoveredSystemElement,
  DiscoveredSystemRelationship,
} from "./system-design-discovery.service.js";
import { DiagramType, DiagramNodeType, DiagramEdgeType } from "@prisma/client";

export interface GeneratedDiagramData {
  type: DiagramType;
  name: string;
  description: string;
  nodes: Array<{
    graphNodeId?: string;
    type: DiagramNodeType;
    name: string;
    label: string;
    description: string;
    x: number;
    y: number;
    width: number;
    height: number;
    metadata?: any;
  }>;
  edges: Array<{
    sourceName: string;
    targetName: string;
    type: DiagramEdgeType;
    label?: string;
    metadata?: any;
  }>;
}

@Injectable()
export class DiagramGenerationService {
  constructor(private readonly layoutService: DiagramLayoutService) {}

  generateAllDiagrams(
    elements: DiscoveredSystemElement[],
    relationships: DiscoveredSystemRelationship[],
  ): GeneratedDiagramData[] {
    return [
      this.generateSystemContextDiagram(elements, relationships),
      this.generateContainerDiagram(elements, relationships),
      this.generateComponentDiagram(elements, relationships),
    ];
  }

  private generateSystemContextDiagram(
    elements: DiscoveredSystemElement[],
    relationships: DiscoveredSystemRelationship[],
  ): GeneratedDiagramData {
    const contextElements = elements.filter(
      (e) =>
        e.type === "PERSON" ||
        e.type === "SYSTEM" ||
        e.type === "EXTERNAL_SYSTEM",
    );

    const contextRel = relationships.filter(
      (r) =>
        contextElements.some((e) => e.name === r.sourceName) &&
        contextElements.some((e) => e.name === r.targetName),
    );

    const positions = this.layoutService.computeDeterministicLayout(
      contextElements.map((e) => ({ id: e.name, name: e.name, type: e.type })),
      "SYSTEM_CONTEXT",
    );

    const posMap = new Map(positions.map((p) => [p.name, p]));

    return {
      type: DiagramType.SYSTEM_CONTEXT,
      name: "C4 System Context Diagram",
      description:
        "High-level overview of users, ArchitectAI system, and external services.",
      nodes: contextElements.map((e) => {
        const pos = posMap.get(e.name) || {
          x: 100,
          y: 100,
          width: 200,
          height: 90,
        };
        return {
          graphNodeId: e.graphNodeId,
          type: (e.type as DiagramNodeType) || DiagramNodeType.SYSTEM,
          name: e.name,
          label: e.label,
          description: e.description,
          x: pos.x,
          y: pos.y,
          width: pos.width,
          height: pos.height,
          metadata: { path: e.path },
        };
      }),
      edges: contextRel.map((r) => ({
        sourceName: r.sourceName,
        targetName: r.targetName,
        type: (r.type as DiagramEdgeType) || DiagramEdgeType.USES,
        label: r.label,
      })),
    };
  }

  private generateContainerDiagram(
    elements: DiscoveredSystemElement[],
    relationships: DiscoveredSystemRelationship[],
  ): GeneratedDiagramData {
    const containerElements = elements.filter(
      (e) => e.type === "CONTAINER" || e.type === "DATABASE",
    );

    const containerRel = relationships.filter(
      (r) =>
        containerElements.some((e) => e.name === r.sourceName) &&
        containerElements.some((e) => e.name === r.targetName),
    );

    const positions = this.layoutService.computeDeterministicLayout(
      containerElements.map((e) => ({
        id: e.name,
        name: e.name,
        type: e.type,
      })),
      "CONTAINER",
    );

    const posMap = new Map(positions.map((p) => [p.name, p]));

    return {
      type: DiagramType.CONTAINER,
      name: "C4 Container Diagram",
      description:
        "Decomposes ArchitectAI into web UI, backend API service, database, and Redis cache.",
      nodes: containerElements.map((e) => {
        const pos = posMap.get(e.name) || {
          x: 100,
          y: 100,
          width: 200,
          height: 90,
        };
        return {
          graphNodeId: e.graphNodeId,
          type: (e.type as DiagramNodeType) || DiagramNodeType.CONTAINER,
          name: e.name,
          label: e.label,
          description: e.description,
          x: pos.x,
          y: pos.y,
          width: pos.width,
          height: pos.height,
          metadata: { path: e.path },
        };
      }),
      edges: containerRel.map((r) => ({
        sourceName: r.sourceName,
        targetName: r.targetName,
        type: (r.type as DiagramEdgeType) || DiagramEdgeType.USES,
        label: r.label,
      })),
    };
  }

  private generateComponentDiagram(
    elements: DiscoveredSystemElement[],
    relationships: DiscoveredSystemRelationship[],
  ): GeneratedDiagramData {
    const componentElements = elements.filter(
      (e) => e.type === "SERVICE" || e.type === "COMPONENT" || e.type === "API",
    );

    const componentRel = relationships.filter(
      (r) =>
        componentElements.some((e) => e.name === r.sourceName) &&
        componentElements.some((e) => e.name === r.targetName),
    );

    const positions = this.layoutService.computeDeterministicLayout(
      componentElements.map((e) => ({
        id: e.name,
        name: e.name,
        type: e.type,
      })),
      "COMPONENT",
    );

    const posMap = new Map(positions.map((p) => [p.name, p]));

    return {
      type: DiagramType.COMPONENT,
      name: "C4 Component Diagram",
      description:
        "Detailed view of backend modules (Auth, Knowledge Graph, Semantic Search, RAG, Audit Engine).",
      nodes: componentElements.map((e) => {
        const pos = posMap.get(e.name) || {
          x: 100,
          y: 100,
          width: 200,
          height: 90,
        };
        return {
          graphNodeId: e.graphNodeId,
          type: (e.type as DiagramNodeType) || DiagramNodeType.COMPONENT,
          name: e.name,
          label: e.label,
          description: e.description,
          x: pos.x,
          y: pos.y,
          width: pos.width,
          height: pos.height,
          metadata: { path: e.path },
        };
      }),
      edges: componentRel.map((r) => ({
        sourceName: r.sourceName,
        targetName: r.targetName,
        type: (r.type as DiagramEdgeType) || DiagramEdgeType.CONTAINS,
        label: r.label,
      })),
    };
  }
}
