var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var helper = require('../helpers');

var markdown = require('node-markdown').Markdown;

// define schema
var TopicSchema = new Schema({
  title: { type: String },
  content: { type: String },
  is_elite: { type: Boolean, default: false },
  topimg: { type: String },
  author: { type: ObjectId, ref: 'Person' },
  permission: { type: String, default: 'public' }, // ['public', 'protect', 'private']
  visit_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  tags: [{ type: ObjectId, ref: 'Tag' }],
  comments: [{ type: ObjectId, ref: 'Message' }]
});

TopicSchema.virtual('brief').get(function(){
  var brief = helper.brief_cut(this.content, 500);
  //brief = helper.brief_filter(brief);
  return markdown(brief);
});

TopicSchema.virtual('timestamp').get(function(){
  return helper.format_date(this.created_at);
});

// define model
mongoose.model('Topic', TopicSchema);