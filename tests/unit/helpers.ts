import {isLambdaAlbResponse} from '../../src/lib';
import {getResponseHeader} from '../../src/lib/utils';
import chai from 'chai';

const assert = chai.assert;

export const validateResponse = (response: any, expected: any) => {
  assert.isObject(response);
  assert.isTrue(isLambdaAlbResponse(response));

  // Validate response values
  assert.equal(response.statusCode, expected.statusCode);
  assert.equal(response.statusDescription, expected.statusDescription);
};

export const validateError = (response: any, expected: any) => {
  validateResponse(response, expected);

  // Validate error headers
  const cacheControl = getResponseHeader(response, 'Cache-Control');
  const contentType = getResponseHeader(response, 'Content-Type');
  assert.equal(cacheControl, 'max-age=0');
  assert.equal(contentType, 'application/json; charset=utf-8');

  // Validate the error itself
  const body = JSON.parse(response.body);
  assert.equal(body.detail, expected.detail);
};

export const validateHeaders = (response: any, expected: any,) => {
  validateResponse(response, expected);
  assert.deepEqual(JSON.parse(response.body), expected.body);

  if (expected.cors) {
    assert.equal(getResponseHeader(response, 'Access-Control-Allow-Origin'), expected.origin);
    assert.equal(getResponseHeader(response, 'Access-Control-Allow-Credentials'), 'true');
    const allowedMethods = expected.corsAllowedMethods ? expected.corsAllowedMethods : 'GET, POST, PATCH, PUT, DELETE, OPTIONS';
    assert.equal(getResponseHeader(response, 'Access-Control-Allow-Methods'), allowedMethods);
  } else {
    assert.notProperty(response.multiValueHeaders, 'Access-Control-Allow-Origin');
    assert.notProperty(response.multiValueHeaders, 'Access-Control-Allow-Credentials');
    assert.notProperty(response.multiValueHeaders, 'Access-Control-Allow-Methods');
  }
};
