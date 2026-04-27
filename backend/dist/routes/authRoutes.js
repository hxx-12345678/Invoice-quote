"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.post('/forgot-password', authController_1.forgotPassword);
router.get('/me', auth_1.authMiddleware, authController_1.getMe);
// GDPR Compliance routes
router.get('/export-data', auth_1.authMiddleware, authController_1.exportData);
router.delete('/account', auth_1.authMiddleware, authController_1.deleteAccount);
exports.default = router;
