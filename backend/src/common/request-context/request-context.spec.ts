import { RequestContextService } from "./request-context.service.js";

describe("RequestContext Unit Tests", () => {
  const service = new RequestContextService();

  it("should generate, store, and fetch requestId correctly", (done) => {
    const store = new Map<string, any>();
    store.set("requestId", "test-request-id-123");

    service.run(store, () => {
      expect(RequestContextService.getRequestId()).toBe("test-request-id-123");
      expect(service.getRequestId()).toBe("test-request-id-123");
      done();
    });
  });

  it("should return undefined if context is not loaded", () => {
    expect(RequestContextService.getRequestId()).toBeUndefined();
    expect(service.getRequestId()).toBeUndefined();
  });
});
