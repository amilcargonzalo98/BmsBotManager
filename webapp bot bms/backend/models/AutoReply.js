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

const allowedAttributes = ['lastPresentValue', 'lastUpdate', 'pointName'];

const transformationRuleSchema = new mongoose.Schema(
  {
    operator: {
      type: String,
      enum: ['==', '!=', '>', '>=', '<', '<='],
      required: true,
    },
    value: { type: String, required: true },
    output: { type: String, required: true },
  },
  { _id: false }
);

const autoReplyPointSchema = new mongoose.Schema(
  {
    alias: { type: String },
    token: { type: String, required: true },
    pointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Point', required: true },
    attribute: {
      type: String,
      enum: allowedAttributes,
      default: 'lastPresentValue',
    },
    transformations: { type: [transformationRuleSchema], default: [] },
    fallback: { type: String, default: '' },
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
      .filter((p) => p && p.pointId && (p.alias || p.token))
      .map((p) => {
        const aliasRaw = p.alias || p.token;
        const alias = aliasRaw ? aliasRaw.toString().trim() : '';
        const token = sanitizeToken(p.token || alias);
        const attribute = allowedAttributes.includes(p.attribute) ? p.attribute : 'lastPresentValue';
        const transformations = Array.isArray(p.transformations)
          ? p.transformations
              .filter((rule) =>
                rule &&
                typeof rule.output !== 'undefined' &&
                typeof rule.value !== 'undefined' &&
                ['==', '!=', '>', '>=', '<', '<='].includes(rule.operator),
              )
              .map((rule) => ({
                operator: rule.operator,
                value: rule.value.toString(),
                output: rule.output.toString(),
              }))
          : [];
        const fallback =
          typeof p.fallback === 'string'
            ? p.fallback
            : typeof p.fallback === 'number'
              ? p.fallback.toString()
              : '';

        if (!token) return null;

        return {
          alias: alias || token,
          token,
          pointId: p.pointId,
          attribute,
          transformations,
          fallback,
        };
      })
      .filter(Boolean);
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
