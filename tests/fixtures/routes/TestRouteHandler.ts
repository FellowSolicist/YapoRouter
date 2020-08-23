import {
  HttpMethod,
  LambdaAlbEvent,
  EventContext,
  LambdaAlbResponse,
  RouteHandler
} from '../../../src/lib';
import * as utils from '../../../src/lib/utils';

export default class TestRouteHandler extends RouteHandler {
  async head(event: LambdaAlbEvent, context?: EventContext): Promise<LambdaAlbResponse> {
    return RouteHandler.response(HttpMethod.HEAD);
  }

  async get(event: LambdaAlbEvent, context?: EventContext): Promise<LambdaAlbResponse> {

    // Custom context tests
    if (context && context.has('customContextTest')) {
      return RouteHandler.response(context.get('customContextTest'));
    }

    // Middleware passing context tests
    if (context && context.has('middlewareTest')) {
      return RouteHandler.response(context.get('middlewareTest'));
    }

    // Path parameters tests
    if (context && context.has('pathParams')) {
      return RouteHandler.response(
         utils.mapToJsonObject(context.get('pathParams'))
      );
    }

    return RouteHandler.response(HttpMethod.GET);
  }

  async post(event: LambdaAlbEvent, context?: EventContext): Promise<LambdaAlbResponse> {
    return RouteHandler.response(HttpMethod.POST);
  }

  async put(event: LambdaAlbEvent, context?: EventContext): Promise<LambdaAlbResponse> {
    return RouteHandler.response(HttpMethod.PUT);
  }

  async patch(event: LambdaAlbEvent, context?: EventContext): Promise<LambdaAlbResponse> {
    return RouteHandler.response(HttpMethod.PATCH);
  }

  async delete(event: LambdaAlbEvent, context?: EventContext): Promise<LambdaAlbResponse> {
    return RouteHandler.response(HttpMethod.DELETE);
  }
}
