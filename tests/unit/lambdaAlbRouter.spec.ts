import chai from 'chai';
import {HttpMethod, HttpStatus} from '../../src/lib/router/models';
import LambdaAlbEventRouter from '../../src/lib/router/YapoRouter';
import testRoutes from '../fixtures/routes';
import * as fixtures from '../fixtures';
import {
  validateError,
  validateHeaders,
  validateResponse
} from './helpers';
import {getResponseHeader} from "../../src/lib/utils";

// Instantiate the router
const testRouter = new LambdaAlbEventRouter(testRoutes,{
  corsWhiteList: fixtures.corsWhitelist,
  ampOrigins: fixtures.ampOriginDomains
});

// Being tests
describe('Lambda Alb Event Router', () => {

  describe('CORS', () => {
    const corsTestPath = '/healthcheck';

    fixtures.corsWhitelist.forEach((host) => {
      it('Should include CORS headers if origin is in whitelist', async () => {
        const event = fixtures.newMultiValueHeadersEvent(HttpMethod.GET, corsTestPath);
        event.multiValueHeaders.origin = [host];

        const response = await testRouter.dispatch(event);
        validateHeaders(response, {
          statusCode: 200,
          statusDescription: '200 OK',
          body: {healthy: true},
          cors: true,
          origin: host
        });
      });

      it('Should respond to CORS Preflight if origin is in whitelist', async () => {
        const event = fixtures.newMultiValueHeadersEvent(HttpMethod.OPTIONS, corsTestPath);
        event.multiValueHeaders.origin = [host];

        const response = await testRouter.dispatch(event);
        validateHeaders(response, {
          statusCode: 200,
          statusDescription: '200 OK',
          body: true,
          cors: true,
          origin: host
        });
      });
    });

    it('Should not include CORS headers if origin is not in whitelist', async () => {
      const event = fixtures.newMultiValueHeadersEvent(HttpMethod.GET, corsTestPath);
      const origin = 'https://test.chicagotribune.com';
      event.multiValueHeaders.origin = [origin];

      const response = await testRouter.dispatch(event);
      validateHeaders(response, {
        statusCode: 200,
        statusDescription: '200 OK',
        body: {healthy: true},
        cors: false,
        origin: origin
      });
    });

    it('Should include restricted CORS headers if origin is an AMP subdomain', async () => {
      for (const eventOrigin of fixtures.restrictedAmpOrigins) {
        const event = fixtures.newMultiValueHeadersEvent(HttpMethod.GET, corsTestPath);
        event.multiValueHeaders.origin = [eventOrigin];

        const response = await testRouter.dispatch(event);
        validateHeaders(response, {
          statusCode: 200,
          statusDescription: '200 OK',
          body: {healthy: true},
          cors: true,
          corsAllowedMethods: 'GET, POST, OPTIONS',
          origin: eventOrigin
        });
      }
    });

    it('Should include CORS headers if AMP-Same origin header is in request', async () => {
      const event = fixtures.newMultiValueHeadersEvent(HttpMethod.GET, corsTestPath);
      event.multiValueHeaders['amp-same-origin'] = ['true'];
      delete event.multiValueHeaders.origin;

      const response = await testRouter.dispatch(event);
      validateHeaders(response, {
        statusCode: 200,
        statusDescription: '200 OK',
        body: {healthy: true},
        cors: true,
        origin: '*'
      });
    });
  });

  describe('Routes', () => {
    const testsPath = '/tests';

    it('should return 404 if path is not matched', async () => {
      const method = HttpMethod.GET;
      const response = await testRouter.dispatch(fixtures.newMultiValueHeadersEvent(method, `${testsPath}/some-random-path`));

      validateError(response, {
        statusCode: HttpStatus.NOT_FOUND,
        statusDescription: '404 Not Found',
        detail: 'No route found for path /tests/some-random-path'
      });
    });

    it('should return 405 if method is not matched', async () => {
      const method = HttpMethod.TRACE;
      const response = await testRouter.dispatch(fixtures.newMultiValueHeadersEvent(method, testsPath));

      validateError(response, {
        statusCode: HttpStatus.METHOD_NOT_ALLOWED,
        statusDescription: '405 Method Not Allowed',
        detail: 'Method: TRACE is not allowed for path: /tests. Allowed methods: OPTIONS,HEAD,GET,POST,PUT,PATCH,DELETE'
      });
    });

    it('should run a HEAD route', async () => {
      const method = HttpMethod.HEAD;
      const response = await testRouter.dispatch(fixtures.newEvent(method, testsPath));

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: HttpMethod.HEAD
      })
    });

    it('should run a OPTIONS route', async () => {
      const method = HttpMethod.OPTIONS;
      const response = await testRouter.dispatch(fixtures.newEvent(method, testsPath));

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: true
      });
    });

    it('should run a GET route', async () => {
      const method = HttpMethod.GET;
      const response = await testRouter.dispatch(fixtures.newEvent(method, testsPath));

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: HttpMethod.GET
      });
    });

    it('should run a POST route', async () => {
      const method = HttpMethod.POST;
      const response = await testRouter.dispatch(fixtures.newEvent(method, testsPath));

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: HttpMethod.POST
      });
    });

    it('should run a PUT route', async () => {
      const method = HttpMethod.PUT;
      const response = await testRouter.dispatch(fixtures.newEvent(method, testsPath));

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: HttpMethod.PUT
      });
    });

    it('should run a PATCH route', async () => {
      const method = HttpMethod.PATCH;
      const response = await testRouter.dispatch(fixtures.newEvent(method, testsPath));

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: HttpMethod.PATCH
      });
    });

    it('should run a DELETE route', async () => {
      const method = HttpMethod.DELETE;
      const response = await testRouter.dispatch(fixtures.newEvent(method, testsPath));

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: HttpMethod.DELETE
      });
    });

    it('should pass custom context to the route handler', async () => {
      const method = HttpMethod.GET;
      const response = await testRouter.dispatch(fixtures.newEvent(method, `${testsPath}/custom-context`));

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: true
      });
    });

    it('should extract path params and query params', async () => {
      const method = HttpMethod.GET;
      const param = Math.floor(Math.random() * 90000) + 10000;
      const param2 = Math.floor(Math.random() * 90000) + 10000;
      const response = await testRouter.dispatch(fixtures.newEvent(method, `${testsPath}/${param}/subPath/${param2}`));

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: JSON.stringify({ param, param2 })
      });
    });

    it('should run middleware and pass context to routeHandler', async () => {
      const method = HttpMethod.GET;
      const response = await testRouter.dispatch(fixtures.newEvent(method, `${testsPath}/middleware`));

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: true
      });
    });

    it('should run middleware and return a response', async () => {
      const method = HttpMethod.GET;
      const response = await testRouter.dispatch(fixtures.newEvent(method, `${testsPath}/middleware-response`));

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: 'response from middleware'
      });
    });

    it('should run a GET route with cache TTL', async () => {
      const method = HttpMethod.GET;
      const event = fixtures.newMultiValueHeadersEvent(method, `${testsPath}/cache-ttl`)
      const response = await testRouter.dispatch(event);

      validateResponse(response, {
        statusCode: HttpStatus.OK,
        statusDescription: '200 OK',
        body: HttpMethod.GET
      });

      const cacheControl = getResponseHeader(response, 'Cache-Control');
      chai.assert.equal('max-age=300', cacheControl);
    });

    it('errors on a route with cacheTtl specified should have Cache-Control = 0', async () => {
      const method = HttpMethod.GET;
      const event = fixtures.newMultiValueHeadersEvent(method, `${testsPath}/cache-ttl-error`);
      const response = await testRouter.dispatch(event);

      validateError(response, {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        statusDescription: '500 Server Error',
        detail: 'Middleware should throw error response with no cache-ttl'
      });

      const cacheControl = getResponseHeader(response, 'Cache-Control');
      chai.assert.equal('max-age=0', cacheControl);
    });
  });

});
