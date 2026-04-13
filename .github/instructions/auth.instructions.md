---
name: auth-instructions
description: 'Use when: implementing or modifying authentication (signup, login, JWT tokens, password management, role-based access control)'
applyTo: 'controllers/authController.js'
---

# Authentication Instructions

## JWT Token Pattern

### Token Creation

```javascript
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
```

### Token in Response

```javascript
exports.signup = catchAsync(async (req, res, next) => {
  // 1. Create user
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // 2. Create token
  const token = signToken(user._id);

  // 3. Send response
  res.status(201).json({
    status: 'success',
    token,
    data: { user },
  });
});
```

## Signup Implementation

```javascript
exports.signup = catchAsync(async (req, res, next) => {
  // 1. Validate required fields
  if (!req.body.email || !req.body.password || !req.body.passwordConfirm) {
    return next(
      new AppError('Please provide email, password, and password confirm', 400),
    );
  }

  // 2. Check if user already exists
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return next(new AppError('Email already in use', 400));
  }

  // 3. Password validation
  if (req.body.password !== req.body.passwordConfirm) {
    return next(new AppError('Passwords do not match', 400));
  }

  if (req.body.password.length < 8) {
    return next(new AppError('Password must be at least 8 characters', 400));
  }

  // 4. Create user (password hashing done in model pre-save hook)
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // 5. Generate token and send
  const token = signToken(user._id);

  res.status(201).json({
    status: 'success',
    token,
    data: { user },
  });
});
```

## Login Implementation

```javascript
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2. Check if user exists and password is correct
  // Note: .select('+password') needed if password field has select: false in schema
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3. Generate token
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});
```

## Protect Route Middleware

Protects routes that require authentication:

```javascript
exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get token from request
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in', 401));
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid token. Please login again', 401));
  }

  // 3. Get user from database
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError('User no longer exists', 401));
  }

  // 4. Check if user changed password after token was issued
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Password recently changed', 401));
  }

  // 5. Grant access to protected route
  req.user = user;
  next();
});
```

### User Model Support

Add to user schema:

```javascript
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp; // True if changed after token
  }
  return false;
};
```

## Restrict To Roles

Restrict routes to specific user roles:

```javascript
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles = ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};
```

### Usage in Routes

```javascript
router.delete(
  '/:id',
  authController.protect,
  authController.restrictTo('admin'),
  tourController.deleteTour,
);

router.patch(
  '/:id',
  authController.protect,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.updateTour,
);
```

## Update Password

```javascript
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from database
  const user = await User.findById(req.user.id).select('+password');

  // 2. Verify current password
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3. New password must be different
  if (req.body.password === req.body.passwordCurrent) {
    return next(
      new AppError('New password must be different from current', 400),
    );
  }

  // 4. Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); // This triggers the pre-save hook that hashes password

  // 5. Send new token
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});
```

## User Schema Requirements

For authentication to work, add these fields to User schema:

```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // Don't return by default
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password; // Check passwords match
      },
      message: 'Passwords are not the same',
    },
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  passwordChangedAt: Date,
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // Don't save to DB

  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password changed
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};
```

## Route Registration

In your routes:

```javascript
// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Protected routes (require authentication)
router.use(authController.protect);

router.post('/updateMyPassword', authController.updatePassword);
router.get('/:id', userController.getUser);

// Admin routes (require admin role)
router.use(authController.restrictTo('admin'));

router.get('/', userController.getAllUsers);
router.delete('/:id', userController.deleteUser);
```

## Best Practices

✅ Store JWT_SECRET in environment variables  
✅ Use Bearer token format in Authorization header  
✅ Hash passwords in model pre-save hook  
✅ Never return passwords in JSON responses  
✅ Check token expiration on protected routes  
✅ Invalidate old tokens when password is changed  
✅ Use appropriate error messages (401 for auth, 403 for authorization)  
✅ Require password confirmation for sensitive operations  
✅ Only allow HTTPS in production
