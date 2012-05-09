var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var helper = require('../helpers');

/*
 * type
 * comment: ����
 * reply: �ظ�
 * message: ��Ϣ
 */
// define schema
var MessageSchema = new Schema({
	type: { type: String },
  content: { type: String },
  is_read: { type: Boolean, default: false },
	created_at: { type: Date, default: Date.now },
  author: { type: ObjectId, ref: 'Person' },
  topic: {type: ObjectId, ref: 'Topic'},
  parent: { type: ObjectId, ref: 'Message' }
});

// define model
mongoose.model('Message', MessageSchema);