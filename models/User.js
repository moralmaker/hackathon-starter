const bcrypt = require('bcrypt');
const crypto = require('crypto');
var Database  = require('arangojs').Database;
var db = new Database('http://username:password@host:8529/');
db.useDatabase('moral');

class User {
  constructor(obj) {
    console.log("constructing user with :",obj)
    this.isModified = false;
    this.email = obj.email || '';
    this.password = obj.password || '';
    this.passwordResetToken = obj.passwordResetToken ||'';
    this.passwordResetExpires = obj.passwordResetExpires || new Date;
    this.emailVerificationToken = obj.emailVerificationToken || '';
    this.emailVerified =  obj.emailVerified || false;
    this.twitter = obj.twitter || '';
    this.google = obj.google || '';
    this.github = obj.github || '';
    this.tokens = obj.tokens || []; 
    this._id = obj._id || 0
    this.id = obj._id || 0    
    this._key = obj._key || 0

    this.profile = obj.profile || {
      name : '',
      gender : '',
      location : '',
      website : '',
      picture: ''
    }   
  }

  comparePassword(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      cb(err, isMatch);
    });
  } 

  async save(next) {
    try {
      const user = this;
      console.log('InSave 1:',user) 

      if (!user.password)  {
        const ret =  await db.collection('users').save(user)
        return ret
      }
      bcrypt.genSalt(10, (err, salt) => {
        if (err) { return next(err); }
        console.log("salt ? :",user.password, salt)
        bcrypt.hash(user.password, salt, async (err, hash) => {
          if (err) { return next(err); }
          user.password = hash;

          console.log('InSave 2:',user)
          if( user._key > 0 ) {return await db.collection('users').replace(user,user)} 
            else{
              delete user._key
              delete user._id
              await db.collection('users').save(user)
            }  
        });
      });      
      } catch (err) {
        console.log('InSave catch :',err) 
        return err
      }
  } 


  gravatar(size) {
    if (!size) {
      size = 200;
    }
    if (!this.email) {
      return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto.createHash('md5').update(this.email).digest('hex');
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
  };

}

  User.findOne = async function(obj, cb) {
    try {
      const field = Object.keys(obj)[0]
      const value = obj[field]
      const cursor = await db.query(`FOR x IN users FILTER x.${field}=="${value}" RETURN x`);
      const result = await cursor.next();
      const usr = result ? new User(result) : result  
      cb(null,usr)
      } catch (err) {
        cb(err,null)
      }
  }


  User.findById = async function(id, cb) {
    try {
      const cursor = await db.query(`FOR x IN users FILTER x._id=="${id}" RETURN x`);
      const result = await cursor.next();  
      const usr = result ? new User(result) : result 
      cb(null,usr)
      } catch (err) {
        cb(err,null)
      }
  }


User.deleteOne = async function(obj, cb) {
    const id = obj._id
    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",id)
    try {
      const cursor = await db.query(`REMOVE { _key: "${id}" } IN users`);
      const result = await cursor.next();      
      cb(null,result)
      } catch (err) {
        cb(err,null)
      }
  }
  const deleteOne = 0;  

module.exports = {User};
