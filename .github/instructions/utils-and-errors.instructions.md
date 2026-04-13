---
name: utils-and-errors-instructions
description: 'Use when: creating utilities, working with error handling, or implementing catchAsync wrapper and AppError class.'
applyTo: 'utils/**'
---

# Utilities and Error Handling Instructions

## AppError Class

The `AppError` class extends Error and is used for all client-facing errors.

### Pattern

```javascript
// utils/appError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

### Usage

```javascript
// Always use for client errors
return next(new AppError('Tour not found', 404));
return next(new AppError('Invalid email format', 400));
return next(new AppError('Unauthorized access', 401));

// Never use throw in controllers
throw new Error('User not found'); // ❌ Wrong
```

### Status Codes

- `400` — Bad Request (validation errors)
- `401` — Unauthorized (not logged in)
- `403` — Forbidden (logged in but no permission)
- `404` — Not Found (resource doesn't exist)
- `409` — Conflict (duplicate email, etc.)
- `500` — Server Error (unexpected error)

## CatchAsync Wrapper

The `catchAsync` utility wraps async functions and automatically passes errors to the error handler.

### Pattern

```javascript
// utils/catchAsync.js
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Pass errors to express error handler
  };
};
```

### Usage

```javascript
// ✅ Correct - errors are automatically passed to error handler
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id); // If fails, goes to error handler
  res.status(200).json({ status: 'success', data: { tour } });
});

// ❌ Wrong - need manual try-catch if not using catchAsync
exports.getTour = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json(tour);
  } catch (err) {
    next(err);
  }
};
```

## Global Error Handler

The error handler middleware catches all errors from the app.

### Pattern (`controllers/errorController.js`)

```javascript
const AppError = require('../utils/appError');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // Development: send full error details
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production: don't leak error details
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // Programming or unknown error
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  }
};

module.exports = errorHandler;
```

### Registration in app.js

```javascript
app.use(globalErrorHandler); // Must be last middleware
```

## Common Error Scenarios

### Validation Error

```javascript
if (!req.body.name) {
  return next(new AppError('Tour name is required', 400));
}
```

### Resource Not Found

```javascript
const tour = await Tour.findById(req.params.id);
if (!tour) {
  return next(new AppError('No tour found with that ID', 404));
}
```

### Authentication Error

```javascript
if (!token) {
  return next(new AppError('Please provide a token', 401));
}
```

### Authorization Error

```javascript
if (user.role !== 'admin') {
  return next(new AppError('You do not have permission to delete tours', 403));
}
```

### Database Duplicate Key Error

```javascript
if (err.code === 11000) {
  return next(new AppError('Duplicate field value entered', 400));
}
```

## APIFeatures Utility

Helper for filtering, sorting, and paginating queries.

### Pattern

```javascript
// utils/apiFeatures.js
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering: {duration: {$gte: 5}}
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
```

### Usage

```javascript
exports.getAllTours = catchAsync(async (req, res, next) => {
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

## Best Practices for Errors

✅ Always use AppError for expected errors  
✅ Always wrap async functions in catchAsync()  
✅ Check for resource existence before operations  
✅ Use appropriate HTTP status codes  
✅ Never expose stack traces in production  
✅ Log errors for debugging  
✅ Distinguish operational errors from programming errors  
✅ Return consistent error format

## Error Response Format

```javascript
{
  "status": "fail",
  "message": "Description of what went wrong"
}
```

## Common HTTP Error Codes Quick Reference

- 400 Bad Request — Invalid input
- 401 Unauthorized — Not authenticated
- 403 Forbidden — Authenticated but no permission
- 404 Not Found — Resource doesn't exist
- 409 Conflict — Duplicate resource
- 500 Server Error — Unexpected error
