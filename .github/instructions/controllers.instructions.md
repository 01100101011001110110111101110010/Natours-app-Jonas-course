---
name: controllers-instructions
description: 'Use when: creating or modifying controllers in controllers/ directory. Includes error handling, async patterns, and request/response patterns.'
applyTo: 'controllers/**/*.js'
---

# Controllers Instructions

## Request Handler Pattern

### Basic Structure

All controllers must follow this pattern:

```javascript
exports.getResource = catchAsync(async (req, res, next) => {
  // 1. Get data from request
  const id = req.params.id;

  // 2. Query database
  const resource = await Resource.findById(id);

  // 3. Handle not found
  if (!resource) {
    return next(new AppError('Resource not found', 404));
  }

  // 4. Send response
  res.status(200).json({
    status: 'success',
    data: { resource },
  });
});
```

## Error Handling

### Use AppError for client errors

```javascript
// ✅ Correct
if (!tour) {
  return next(new AppError('Tour not found', 404));
}

// ❌ Wrong
if (!tour) {
  throw new Error('Tour not found'); // Don't throw in controllers
}
```

### Validation errors

```javascript
exports.createTour = catchAsync(async (req, res, next) => {
  // Validate input
  if (!req.body.name || !req.body.price) {
    return next(new AppError('Please provide name and price', 400));
  }

  const tour = await Tour.create(req.body);
  res.status(201).json({ status: 'success', data: { tour } });
});
```

### Catching async errors

```javascript
// ✅ Always wrap in catchAsync
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // If query fails, catchAsync will pass error to next(err)
});

// ❌ Don't use try-catch in controllers
exports.getTour = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id);
  } catch (err) {
    next(err); // Use catchAsync wrapper instead
  }
};
```

## Response Patterns

### Success Response (200 OK)

```javascript
res.status(200).json({
  status: 'success',
  data: { tour },
});
```

### Created Response (201)

```javascript
res.status(201).json({
  status: 'success',
  data: { tour },
});
```

### Multiple Records with Metadata

```javascript
res.status(200).json({
  status: 'success',
  results: tours.length,
  data: { tours },
});
```

## Common CRUD Patterns

### Get One

```javascript
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});
```

### Get All with Filtering/Sorting

```javascript
exports.getAllTours = catchAsync(async (req, res, next) => {
  // Use APIFeatures utility
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .paginate();

  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});
```

### Create

```javascript
exports.createTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: { tour },
  });
});
```

### Update

```javascript
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Return updated document
    runValidators: true, // Run schema validators
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});
```

### Delete

```javascript
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
```

## Authentication Controller Pattern

### Signup/Login

```javascript
exports.signup = catchAsync(async (req, res, next) => {
  // 1. Check if email exists
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return next(new AppError('Email already in use', 400));
  }

  // 2. Create user
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // 3. Create JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // 4. Send response
  res.status(201).json({
    status: 'success',
    token,
    data: { user },
  });
});
```

## Input Validation

Always validate at the start:

```javascript
exports.createTour = catchAsync(async (req, res, next) => {
  // Validate required fields
  if (!req.body.name) {
    return next(new AppError('Tour must have a name', 400));
  }

  if (req.body.price < 0) {
    return next(new AppError('Price cannot be negative', 400));
  }

  // Continue...
});
```

## Best Practices

✅ Always wrap with `catchAsync()`  
✅ Return AppError() for client errors  
✅ Check resource exists before operation  
✅ Use 201 for POST (creation)  
✅ Use 204 for DELETE with no content  
✅ Always include `status` in response  
✅ Use consistent field ordering in responses  
✅ Validate before database operations
