const expect = require('chai').expect;
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const AuthController = require('../controllers/auth');

describe('Auth Controller', function () {
  before(function (done) {
    //beforeメソッドはすべてのtestの最初に実行される(only runs once per test run)
    mongoose
      .connect(
        //test用データベース(don't use a production database!)
        `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ymvli.mongodb.net/test-messages?retryWrites=true&w=majority`
      )
      .then(result => {
        const user = new User({
          email: 'test@test.com',
          password: 'tester',
          name: 'Test',
          posts: [],
          _id: '5c0f66b979af55031b34728a',
        });
        return user.save();
      })
      .then(() => {
        done();
      })
      .catch(() => {
        done();
      });
  });
  //   beforeEach(function () {
  //     //beforeEachメソッドはitメソッドの前に毎度実行されるhooks

  //   });
  //   afterEach(function({
  //       //afterEachはitの最後に毎度実行されるhooks
  //   }))
  it('should throw an error with code 500 if accessing the database fails', function (done) {
    //doneはasynchronous codeに対して使う
    sinon.stub(User, 'findOne'); //Userモデル(mongooseモデル)のfindOneメソッドを固定化
    User.findOne.throws(); //errorをthrowさせる

    //dummy reqオブジェクトの作成
    const req = {
      body: {
        email: 'test@test.com',
        password: 'tester',
      },
    };
    AuthController.login(req, {}, () => {})
      .then(result => {
        expect(result).to.be.an('error'); //types of data
        expect(result).to.have.property('statusCode', 500);
        done(); //call it inside of then block(asynchronous func)(to signal that I want mocha to wait for this code to execute )
      })
      .catch(err => {
        done(err);
      });

    User.findOne.restore();
  });
  it('should send a response with a valid user status for an existing user', function (done) {
    const req = { userId: '5c0f66b979af55031b34728a' };
    const res = {
      statusCode: 500, //defaultのstatus
      userStatus: null, //defaultのstatus
      status: function (code) {
        this.statusCode = code;
        return this; //statusオブジェクトを返す(jsonメソッドが使えるように)
      },
      json: function (data) {
        this.userStatus = data.status; //statusを上書き
      },
    };
    AuthController.getUserStatus(req, res, () => {}).then(() => {
      expect(res.statusCode).to.be.equal(200);
      expect(res.userStatus).to.be.equal('I am new!');
      done();
    });
  });
  after(function (done) {
    //afterメソッドでclean upする
    User.deleteMany({}) //clean up database
      .then(() => {
        return mongoose.disconnect();
      })
      .then(() => {
        done();
      })
      .catch(() => {
        done();
      });
  });
});
