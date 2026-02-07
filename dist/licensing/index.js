"use strict";
/**
 * Licensing Module
 * Handles license validation, tier limits, and feature gating
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseEnforcer = exports.getLicenseValidator = exports.LicenseValidator = exports.getTierLimits = exports.TIER_LIMITS = void 0;
var tiers_1 = require("./tiers");
Object.defineProperty(exports, "TIER_LIMITS", { enumerable: true, get: function () { return tiers_1.TIER_LIMITS; } });
Object.defineProperty(exports, "getTierLimits", { enumerable: true, get: function () { return tiers_1.getTierLimits; } });
var validator_1 = require("./validator");
Object.defineProperty(exports, "LicenseValidator", { enumerable: true, get: function () { return validator_1.LicenseValidator; } });
Object.defineProperty(exports, "getLicenseValidator", { enumerable: true, get: function () { return validator_1.getLicenseValidator; } });
var enforcer_1 = require("./enforcer");
Object.defineProperty(exports, "LicenseEnforcer", { enumerable: true, get: function () { return enforcer_1.LicenseEnforcer; } });
//# sourceMappingURL=index.js.map