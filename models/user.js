var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');
module.exports = function (sequelize, DataTypes) {
    var user = sequelize.define('user', {
      email:{
        type:DataTypes.STRING,
        allowNull:false,
        unique: true,
        validate:{
          isEmail: true
        }
      },
      salt:{
        type:DataTypes.STRING
      },
      hashed_password:{
        type:DataTypes.STRING
      },
      password:{
        type:DataTypes.VIRTUAL,
        allowNull:false,
        validate:{
          len:[7,100]
        },
        set: function (password) {

          var salt = bcrypt.genSaltSync(10);
          var hashed_password = bcrypt.hashSync(password, salt);
          this.setDataValue('password',password);
          this.setDataValue('salt',salt);
          this.setDataValue('hashed_password',hashed_password);

        }

      }

    },{
  hooks: {
    beforeValidate: function(user, options) {
      user.email = user.email.toLowerCase();
    }
  },
  classMethods: {
    authenticate: function (body) {
      return new Promise(function(resolve, reject) {
        if(typeof body.email !== 'string' || typeof body.password !== 'string'){
          reject();
        }
        user.findOne({
          where: {
            email: body.email
          }
        }).then(function (user) {
          if(!user || !bcrypt.compareSync(body.password,user.get('hashed_password'))) {
            reject();
          }
          resolve(user);
        }, function (e) {
          reject();
        })
      });
    }
  },
  instanceMethods:{
    toPublicJson : function () {
      var json = this.toJSON();
      return _.pick(json,'id','email','createdAt','updatedAt');
    },
    generateToken : function (type) {
      if (!_.isString(type)) {
        return undefined;
      }
      try {
        var obj = {id: this.get('id'), type: type};
        var stringData = JSON.stringify(obj);
        var encryptedData = cryptojs.AES.encrypt(stringData,'abc123!@#').toString();
        var token = jwt.sign({
          token: encryptedData,
        }, 'qwerty098');
        return token;
      } catch (e) {
        console.log(e);
        return undefined;
      }
    }
  }

});
return user;
}
