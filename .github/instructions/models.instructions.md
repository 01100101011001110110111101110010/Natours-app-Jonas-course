---
name: models-instructions
description: 'Use when: creating or modifying MongoDB models in models/ directory. Includes schema design, validation, and Mongoose best practices.'
applyTo: 'models/**'
---

# MongoDB Models Instructions

## Schema Design Principles

### 1. Field Validation

Always include validators for required fields:

```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    unique: false,
    trim: true,
    maxlength: [40, 'A user name must have less or equal then 40 characters'],
    minlength: [10, 'A user name must have more or equal then 10 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
});
```

### 2. Schema Methods

Add instance methods for common operations:

```javascript
// Instance methods (available on document)
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Static methods (available on Model)
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};
```

### 3. Schema Middleware (Hooks)

Use `pre` and `post` hooks for validation and side effects:

```javascript
// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// Remove sensitive fields from output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};
```

### 4. Indexes

Define indexes for frequently queried fields:

```javascript
const tourSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Create indexes
tourSchema.index({ slug: 1 });
tourSchema.index({ createdAt: -1 });
tourSchema.index({ ratingsAverage: -1, ratingsQuantity: -1 });
```

## Common Patterns

### Password Hashing (User Model)

```javascript
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});
```

### Timestamps

```javascript
const schema = new mongoose.Schema(
  {
    /* fields */
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
```

### Virtual Fields

```javascript
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
```

## Validation Rules

- **Required**: Всегда добавляй [true, 'Error message']
- **Email**: Используй regex или validator library
- **Password**: Минимум 8 символов, требуй подтверждение
- **Dates**: Используй Date.now для defaults
- **Enums**: Для фиксированных значений

```javascript
const tourSchema = new mongoose.Schema({
  difficulty: {
    type: String,
    required: true,
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'Difficulty is either: easy, medium, difficult',
    },
  },
});
```

## Don'ts

❌ Не используй `this.save()` для обновления в контроллере  
❌ Не храни пароли в plain text — всегда хеши  
❌ Не добавляй бизнес-логику в schema — это job контроллеров  
❌ Не забывай вызывать `next()` в middleware hooks
