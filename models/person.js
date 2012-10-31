var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var helper = require('../helpers');

// define schema
var PersonSchema = new Schema({
  email: { type: String },
  hashed_password: { type: String },
  salt: { type: String },
  name: { type: String, index: true },
  title: { type: String },
  avatar: { type: String },
  motto: { type: String },
  active: { type: Boolean, default: false },
  duty: { type: Boolean, default: false },
  description: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

PersonSchema.virtual('timestamp').get(function(){
  return helper.format_date(this.created_at);
});

// define model
mongoose.model('Person', PersonSchema);