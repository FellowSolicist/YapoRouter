import RouteHandler from './RouteHandler';
import {LambdaAlbEvent, LambdaAlbResponse} from './models';

export default abstract class AbstractHealthCheckHandler extends RouteHandler {
  static readonly healthCheckPath: string = '/healthcheck';

  async get(event: LambdaAlbEvent, context?: Map<string, any>) {
    if (this.isHealthy()) {
      return this.getHealthyResponse();
    }

    return RouteHandler.InternalServerError();
  }

  getHealthyResponse(): LambdaAlbResponse {
    return RouteHandler.response({healthy: true});
  }

  abstract isHealthy(): boolean;
}

export class DefaultHealthCheckRoute extends AbstractHealthCheckHandler {
  isHealthy() { return true; }
}
