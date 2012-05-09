var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

// define schema
var AssetSchema = new Schema({
	name: { type: String },
  filename: { type: String },
  type: { type: String },
  size: { type: String },
  width: { type: String },
  height: { type: String },
  path: { type: String },
  url: { type: String },
	description: { type: String },
	created_at: { type: Date, default: Date.now }
});

// define model
mongoose.model('Asset', AssetSchema);