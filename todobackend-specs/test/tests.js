const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Promise = require('bluebird');
const request = require('superagent-promise')(require('superagent'), Promise);

chai.use(chaiAsPromised);

const should = chai.should;
const expect = chai.expect;

const url = process.env.URL || 'http://localhost:8000/todos';

describe('Cross Origin Requests', () => {
  let result;

  before(() => {
    result = request('OPTIONS', url)
      .set('Origin', 'http://someplace.com')
      .end();
  });

  it('should return the correct CORS headers', () => {
    return assert(result, 'header').to.contain.all.keys([
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ]);
  });

  it('should allow all origins', () => {
    return assert(result, 'header.access-control-allow-origin').to.equal('*');
  });
});

describe('Create Todo Item', () => {
  let result;

  before(() => {
    result = post(url, { title: 'Walk the dog' });
  });

  it('should return a 201 CREATED response', () => {
    return assert(result, 'status').to.equal(201);
  });

  it('should receive a location hyperlink', () => {
    return assert(result, 'header.location')
      .to.match(/^https?:\/\/.+\/todos\/[\d]+$/);
  });

  it('should create the item', () => {
    const item = result.then((res) => {
      return get(res.header['location']);
    });

    return assert(item, 'body.title').that.equals('Walk the dog');
  });

  after(() => {
    return del(url)
  });
});

describe('Update Todo Item', () => {
  let location;

  beforeEach((done) => {
    post(url, { title: 'Walk the dog' })
      .then((res) => {
        location = res.header['location'];
        done();
      });
  });

  it('should have completed set to true after PUT update', () => {
    const result = update(location, 'PUT', { completed: true });

    return assert(result, 'body.completed').to.be.true;
  });

  it('should have completed set to true after a PATCH update', () => {
    const result = update(location, 'PATCH', { completed: true });

    return assert(result, 'body.completed').to.be.true;
  });

  after(() => {
    return del(url)
  });
});

describe('Delete Todo Item', () => {
  let location;

  beforeEach((done) => {
    post(url, { title: 'Walk the dog' })
      .then((res) => {
        location = res.header['location'];
        done();
      });
  });

  it('should return a 204 NO CONTENT response', () => {
    const result = del(location);

    return assert(result, 'status').to.equal(204);
  });

  it('should delete the item', () => {
    const result = del(location).then((res) => {
      return get(location);
    });

    return expect(result).to.eventually.be.rejectedWith('Not Found');
  });
});

/**
 *  Convenience functions
 */

 // POST request with data and return promise
function post(url, data) {
  return request.post(url)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send(data)
    .end();
}

// GET request and return promise
function get(url) {
  return request.get(url)
    .set('Accept', 'application/json')
    .end();
}

// DELETE request and return promise
function del(url) {
  return request.del(url)
    .end();
}

// UPDATE request with data and return promise
function update(url, method, data) {
  return request(method, url)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .send(data)
    .end();
}

// Resolve promise for property and return expectation
function assert(result, prop) {
  return expect(result).to.eventually.have.deep.nested.property(prop);
}
