import {Key, pathToRegexp} from 'path-to-regexp';
import {
  HttpStatus,
  HttpMethod,
  ContentType,
  LambdaAlbRoute,
  LambdaAlbEvent,
  LambdaAlbResponse,
  isLambdaAlbResponse, RouterOptions
} from './models';
import RouteHandler from './RouteHandler';
import AbstractHealthCheckHandler, {DefaultHealthCheckRoute} from './AbstractHealthCheckHandler';
import * as utils from '../utils';

const DEFAULT_CONTENT_TYPE = ContentType.json;

export default class YapoRouter {

  static readonly CONTENT_TYPE_HEADER: string = 'content-type';

  private routes: Array<LambdaAlbRoute> = [];
  private corsWhiteList: Array<string> = [];
  private ampOrigins: Array<string> = [];

  constructor(routes: Array<LambdaAlbRoute>, options: RouterOptions = {}) {
    // Add all routes
    routes.forEach(route => {
      this.routes.push(route);
    });

    // Set the healthcheck route
    this.setHealthCheckRoute(options.healthCheckHandler || undefined);

    if (options) {
      const {
        corsWhiteList,
        ampOrigins
      } = options;

      if (corsWhiteList) {
        this.setCorsWhitelist(corsWhiteList);
      }

      if (ampOrigins) {
        this.setAmpOrigins(ampOrigins);
      }
    }
  }

  setHealthCheckRoute(healthCheckHandler?: LambdaAlbRoute): void {
    const hr = healthCheckHandler || new DefaultHealthCheckRoute(
      AbstractHealthCheckHandler.healthCheckPath,
       {
         allowedMethods: [HttpMethod.GET]
       }
    );
    this.routes.unshift(hr);
  }

  setCorsWhitelist(corsWhiteList: Array<string>): void {
    this.corsWhiteList = corsWhiteList;
  }

  setAmpOrigins(ampOrigins: Array<string> = []) {
    this.ampOrigins = ampOrigins;
  }

  async dispatch(event: LambdaAlbEvent): Promise<LambdaAlbResponse> {
    const {path, httpMethod} = event;
    let response: LambdaAlbResponse | null = null;
    let dispatchedRoute: LambdaAlbRoute | null = null;
    let fullContext: Map<string, any> = new Map();

    // Process the event to extract required pieces of information
    YapoRouter.processEvent(event);

    // Cors preflight
    if (httpMethod === HttpMethod.OPTIONS && this.corsWhiteList.length > 0) {
      return this.corsPreFlight(event.origin);
    }

    // for loop with cached length is fastest
    // iteration method that allows continues & breaks: http://jsben.ch/LjzEZ
    const numRoutes = this.routes.length;
    for (let i = 0; i < numRoutes; i++) {
      const keys: Array<Key> = [];
      const result = pathToRegexp(this.routes[i].path, keys).exec(path);
      if (!result) {
        continue;
      }

      dispatchedRoute = this.routes[i];

      // Get the full route context
      fullContext = new Map(dispatchedRoute.context);
      YapoRouter.mapRequestPathParametersToContext(fullContext, result, keys);
    }

    if (!dispatchedRoute) {
      response = RouteHandler.NotFoundError(`No route found for path ${event.path}`);
    } else {
       if (!dispatchedRoute.allowedMethods.includes(httpMethod as HttpMethod)) {
         const allowedMethods = JSON.parse(JSON.stringify(dispatchedRoute.allowedMethods));

         if (this.corsWhiteList.length > 0) {
           allowedMethods.unshift(HttpMethod.OPTIONS);
         }

         response = RouteHandler.NotAllowedError(
            RouteHandler.getNotFoundDetail(httpMethod, path, allowedMethods)
         );
       } else {
         // Run any middleware attached to the route
         if (dispatchedRoute.middleware.length > 0) {
           for (let m = 0; m < dispatchedRoute.middleware.length; m++) {
             const mw = dispatchedRoute.middleware[m];
             const mwResult: any = await mw(event, fullContext);
             if (isLambdaAlbResponse(mwResult)) {
               response = mwResult;
             }
           }
         }

         // No middleware response, run route
         if (!response) {
           // @ts-ignore
           response = await dispatchedRoute[httpMethod.toLowerCase()](event, fullContext);
         }
       }
    }

    // For safety
    if (isLambdaAlbResponse(response)) {
      const contentType: string = DEFAULT_CONTENT_TYPE;

      let cacheTtl = 0;
      if (dispatchedRoute && !utils.isErrorStatusCode(response.statusCode)) {
        cacheTtl = dispatchedRoute.cacheTtl;
      }

      // This is a multiValueHeaders event
      // Retrieve the standard headers first, then merge in any headers specified in the response object
      if (Object.prototype.hasOwnProperty.call(event, 'multiValueHeaders')) {
        const headers = this.getHeaders(event, response, contentType, cacheTtl);
        response.multiValueHeaders = {
          ...headers,
          ...response.multiValueHeaders
        };
      }
    } else {
      response = RouteHandler.InternalServerError('Server replied with an invalid response');
    }

    // Log errors
    if (utils.isErrorStatusCode(response.statusCode)) {
      YapoRouter.logErrors(event, response);
    }

    return response;
  }

  async corsPreFlight(origin: string | null) {
    const multiValueHeaders = this.getHeadersWithCors(origin, {});
    return RouteHandler.response(true, HttpStatus.OK, {multiValueHeaders});
  }

  getHeaders(event: LambdaAlbEvent, response: LambdaAlbResponse, contentType: string = DEFAULT_CONTENT_TYPE, cacheTtl: number = 0) {
    const multiValueHeaders = this.getHeadersWithCors(
       event.origin,
       {'Content-Type': [contentType]},
       event.multiValueHeaders
    );

    const cacheControl = YapoRouter.getCacheControl(cacheTtl);
    if (cacheControl) {
      multiValueHeaders['Cache-Control'] = cacheControl;
    }

    return multiValueHeaders;
  }

  getHeadersWithCors(origin: string | null, multiValueHeaders?: any, requestHeaders?: any) {
    let corsHeaders = {};

    if (multiValueHeaders && origin && this.corsWhiteList.includes(origin)) {
      corsHeaders = {
        'Access-Control-Allow-Origin': [origin],
        'Access-Control-Allow-Credentials': ['true'],
        'Access-Control-Allow-Methods': ['GET, POST, PATCH, PUT, DELETE, OPTIONS']
      };
    } else if (multiValueHeaders && origin && this.ampOrigins.some((ampDomain) => origin.endsWith(ampDomain))) {
      corsHeaders = {
        'Access-Control-Allow-Origin': [origin],
        'Access-Control-Allow-Credentials': ['true'],
        'Access-Control-Allow-Methods': ['GET, POST, OPTIONS']
      };
    } else if (requestHeaders && requestHeaders['amp-same-origin'] && requestHeaders['amp-same-origin'][0] == 'true') {
      corsHeaders = {
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Credentials': ['true'],
        'Access-Control-Allow-Methods': ['GET, POST, PATCH, PUT, DELETE, OPTIONS']
      };
    }

    return {
      ...multiValueHeaders,
      ...corsHeaders
    };
  }

  static getCacheControl(maxAgeSeconds: number) {
    return Number.isInteger(maxAgeSeconds) && maxAgeSeconds >= 0 ? [`max-age=${maxAgeSeconds}`] : null;
  }

  static processEvent(event: LambdaAlbEvent) {
    event.host = utils.getRequestHeader(event, 'host');
    event.origin = utils.getRequestHeader(event, 'origin');
    event.payload = YapoRouter.getRequestPayload(event);
  }

  static getRequestPayload(event: LambdaAlbEvent) {
    if (event.body === null) {
      console.debug('No event.body found. Exiting');
      return null;
    }

    // parse event.body as JSON
    try {
      // Maybe the body is stringified JSON
      return JSON.parse(event.body);
    } catch (e) {
      // It's not stringified. Use it directly
      return event.body;
    }
  }

  static mapRequestPathParametersToContext(fullContext: Map<string, any>, result: any, keys: Array<any>): void {
   if (keys && keys.length > 0) {
     const pathParams = new Map<string, any>();
     keys.forEach((key, i) => {
       pathParams.set(key.name, String(result[i + 1]));
     });
     fullContext.set('pathParams', pathParams);
   }
  }

  static logErrors(event: LambdaAlbEvent, response: LambdaAlbResponse) {
    const error = JSON.parse(response.body);
    const errorText = `${error.detail}. Host: ${event.host} Path: ${event.path} Method: ${event.httpMethod}`;
    if (Math.trunc(response.statusCode / 100) === 4) {
      console.warn(errorText);
    } else {
      console.error(errorText);
    }
  }
}
