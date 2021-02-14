const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const authMiddleware = require('../middleware/is-auth');

//you don't want a test external dependencies(because it's the job of the package offers to test their own code & to make sure that works correctly)

//describeメソッド(provided by mocha)でグループ化できる
describe('Auth middleware', function () {
  it('should throw an error if no authorization header is present', function () {
    const req = {
      //req.getの返り値がなかった場合をtest
      get: function (headerName) {
        return null;
      },
    };
    //適切なErrorMessageがthrowできているか
    //instead of calling directly auth middleware, we should only pass a prepared reference to this function
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw(
      'Not authenticated.'
    );
  });

  it('should throw an error if the authorization header is only one string', function () {
    const req = {
      get: function (headerName) {
        return 'xyz';
      },
    };
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });

  it('should yield userId after decoding the token', function () {
    const req = {
      get: function (headerName) {
        return 'Bearer fsdfkjsdk;lfjsdklafjs;daf';
      },
    };
    //overwrite the actual verify method that this package has.(3rd party library の関数でせき止められてしまうため)
    // jwt.verify = function () {
    //   return { userId: 'abc' };
    // };//この場合,globalにメソッドを変えてしまうので他のtestに影響を与えてしまう

    //第一引数にobject,第２引数でreplaceしたいmethod をstringで渡す
    sinon.stub(jwt, 'verify');
    //verifyメソッドの返り値を固定化
    jwt.verify.returns({ userId: 'abc' });

    authMiddleware(req, {}, () => {});
    expect(req).to.have.property('userId');
    expect(req).to.have.property('userId', 'abc');
    expect(jwt.verify.called).to.be.true;

    //restored the original function after the test where I needed a different behavior
    jwt.verify.restore();
  });

  it('should throw an error if the token cannot be verified', function () {
    const req = {
      get: function (headerName) {
        return 'Bearer xyz';
      },
    };
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });
});
