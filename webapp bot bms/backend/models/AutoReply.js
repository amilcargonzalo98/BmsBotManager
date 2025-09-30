import mongoose from '../config/database.js';

const sanitizeToken = (value) => {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const autoReplyPointSchema = new mongoose.Schema(
  {
    alias: { type: String, required: true },
    token: { type: String, required: true },
    pointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Point', required: true },
  },
  { _id: false }
);

const autoReplySchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    keyword: { type: String, required: true },
    normalizedKeyword: { type: String, required: true },
    responseBody: { type: String, required: true },
    points: { type: [autoReplyPointSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

autoReplySchema.index({ groupId: 1, normalizedKeyword: 1 }, { unique: true });

autoReplySchema.pre('validate', function handleNormalize(next) {
  if (this.keyword) {
    this.normalizedKeyword = this.keyword.trim().toLowerCase();
  }

  if (!Array.isArray(this.points)) {
    this.points = [];
  } else {
    this.points = this.points
      .filter((p) => p && p.alias && p.pointId)
      .map((p) => {
        const alias = p.alias.toString().trim();
        const token = sanitizeToken(p.token || alias);
        return {
          alias,
          token,
          pointId: p.pointId,
        };
      })
      .filter((p) => p.token);
  }

  next();
});

autoReplySchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

autoReplySchema.set('toObject', {
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('AutoReply', autoReplySchema);
export { sanitizeToken };
