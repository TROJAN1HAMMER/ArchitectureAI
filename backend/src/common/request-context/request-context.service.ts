import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

@Injectable()
export class RequestContextService {
  public static readonly asyncLocalStorage = new AsyncLocalStorage<
    Map<string, any>
  >();

  static getRequestId(): string | undefined {
    const store = RequestContextService.asyncLocalStorage.getStore();
    return store?.get("requestId");
  }

  getStore() {
    return RequestContextService.asyncLocalStorage.getStore();
  }

  run(context: Map<string, any>, callback: () => void) {
    RequestContextService.asyncLocalStorage.run(context, callback);
  }

  setRequestId(requestId: string) {
    const store = this.getStore();
    if (store) {
      store.set("requestId", requestId);
    }
  }

  getRequestId(): string | undefined {
    return RequestContextService.getRequestId();
  }
}
