---
name: routes-instructions
description: 'Use when: creating or modifying routes in routes/ directory. Includes routing patterns, middleware integration, and RESTful conventions.'
applyTo: 'routes/**/*.js'
---

# Routes Instructions

## File Naming and Structure

- File name: Plural (e.g., `tourRouts.js`, `userRouts.js`) — note the typo "Routs" follows existing project convention
- Use Express Router: `const router = express.Router()`
- Export router: `module.exports = router`

## RESTful Route Pattern

Follow standard REST conventions for resource operations:

```javascript
const express = require('express');
const tourController = require('../controllers/tourController');
const router = express.Router();

// GET all resources
router.get('/', tourController.getAllTours);

// POST new resource (create)
router.post('/', tourController.createTour);

// GET single resource by ID
router.get('/:id', tourController.getTour);

// PATCH (update) resource
router.patch('/:id', tourController.updateTour);

// DELETE resource
router.delete('/:id', tourController.deleteTour);

module.exports = router;
```

## Chaining Routes

Group related routes for cleaner code:

```javascript
// ✅ Recommended - using router.route()
router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);
```

## Using Middleware

### Apply to All Routes in Router

```javascript
const router = express.Router();

// Middleware applies to all routes in this router
router.use((req, res, next) => {
  console.log('Tour router middleware');
  next();
});

router.get('/', tourController.getAllTours);
```

### Apply to Specific Routes

```javascript
// Only this route uses middleware
router.post('/', authController.protect, tourController.createTour);

// Multiple middleware
router.delete(
  '/:id',
  authController.protect,
  authController.restrictTo('admin'),
  tourController.deleteTour,
);
```

## Common Middleware Patterns

### Authentication

```javascript
// Protect route - user must be logged in
router.get('/', authController.protect, tourController.getAllTours);
```

### Authorization

```javascript
// Restrict to specific roles
router.delete(
  '/:id',
  authController.protect,
  authController.restrictTo('admin', 'lead-guide'),
  tourController.deleteTour,
);
```

### Validation

```javascript
// Middleware to validate input
router.post(
  '/',
  validateTourInput, // Check request body
  tourController.createTour,
);
```

## Routes Organization

### User Routes (`userRouts.js`)

```javascript
const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Protected routes (require auth)
router.use(authController.protect); // Apply to all routes below

router.get('/me', userController.getMe);
router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', userController.updateMe);

// Admin routes
router.use(authController.restrictTo('admin'));
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
```

### Tour Routes (`tourRouts.js`)

```javascript
const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

// Public routes
router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTour);

// Protected routes
router.use(authController.protect);

// Create tour (admin only)
router.post(
  '/',
  authController.restrictTo('admin', 'lead-guide'),
  tourController.createTour,
);

// Update/Delete (admin only)
router.patch(
  '/:id',
  authController.restrictTo('admin', 'lead-guide'),
  tourController.updateTour,
);

router.delete(
  '/:id',
  authController.restrictTo('admin'),
  tourController.deleteTour,
);

module.exports = router;
```

## Route Parameters

### Named Parameters

```javascript
// Single parameter
router.get('/:id', tourController.getTour);

// Multiple parameters
router.get('/:id/:name', tourController.getByIdAndName);

// Parameter matching (regex)
router.get('/:id(\\d+)', tourController.getTour); // Only numbers
```

### Access in Controller

```javascript
exports.getTour = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const tour = await Tour.findById(id);
  // ...
});
```

## Query Parameters

```javascript
// URL: GET /tours?difficulty=easy&ratingsAverage=4
// Access in controller:
const { difficulty, ratingsAverage } = req.query;
```

## Main App Routes Registration

In `app.js`:

```javascript
const tourRouter = require('./routes/tourRouts');
const userRouter = require('./routes/userRouts');

// Mount routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
```

## HTTP Method Summary

| Method | Purpose           | Status Code |
| ------ | ----------------- | ----------- |
| GET    | Retrieve resource | 200         |
| POST   | Create resource   | 201         |
| PATCH  | Partial update    | 200         |
| PUT    | Full replacement  | 200         |
| DELETE | Remove resource   | 204         |

## Best Practices

✅ Use `router.route()` for grouped endpoints  
✅ Apply middleware as close as possible to where it's needed  
✅ Keep routes simple — logic goes in controllers  
✅ Use RESTful naming conventions  
✅ Order routes: public first, then protected, then admin  
✅ Use consistent URL patterns across the API  
✅ Protect sensitive operations with auth middleware  
✅ Return appropriate status codes (201 for POST, 204 for DELETE)
