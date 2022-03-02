import mongoose from 'mongoose';

const ArticleSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  createdAt: Date,
  published: Boolean,
});

const Article = mongoose.model('Article', ArticleSchema);

module.exports = Article;
