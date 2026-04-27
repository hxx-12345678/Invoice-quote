"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const businessController_1 = require("../controllers/businessController");
const router = (0, express_1.Router)();
router.get('/', businessController_1.getBusinessProfile);
router.post('/', businessController_1.createBusinessProfile);
router.put('/', businessController_1.updateBusinessProfile);
exports.default = router;
