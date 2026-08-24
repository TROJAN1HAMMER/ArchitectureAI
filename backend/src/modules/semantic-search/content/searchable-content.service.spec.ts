import { Test, TestingModule } from "@nestjs/testing";
import { SearchableContentService } from "./searchable-content.service.js";
import { ConfigService } from "@nestjs/config";

describe("SearchableContentService Unit Tests", () => {
  let service: SearchableContentService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === "EMBEDDING_MAX_FILE_SIZE") return 524288;
      if (key === "EMBEDDING_CHUNK_SIZE") return 100;
      if (key === "EMBEDDING_CHUNK_OVERLAP") return 20;
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchableContentService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SearchableContentService>(SearchableContentService);
  });

  it("should filter supported file extensions and ignore binary/build files", () => {
    expect(service.isSupportedFile("src/auth.ts", 1000, "blob")).toBe(true);
    expect(service.isSupportedFile("README.md", 500, "blob")).toBe(true);
    expect(
      service.isSupportedFile("node_modules/express/index.js", 500, "blob"),
    ).toBe(false);
    expect(service.isSupportedFile("image.png", 500, "blob")).toBe(false);
    expect(service.isSupportedFile("large.ts", 900000, "blob")).toBe(false);
  });

  it("should generate searchable chunks with context header and hash", () => {
    const raw = "const a = 1;\nconst b = 2;";
    const chunks = service.generateSearchableChunks(
      "owner/repo",
      "src/test.ts",
      "TypeScript",
      raw,
    );

    expect(chunks.length).toBe(1);
    expect(chunks[0].inputContent).toContain("Repository: owner/repo");
    expect(chunks[0].inputContent).toContain("Path: src/test.ts");
    expect(chunks[0].contentHash).toBeDefined();
    expect(chunks[0].contentHash.length).toBe(64); // SHA-256 hex length
  });
});
