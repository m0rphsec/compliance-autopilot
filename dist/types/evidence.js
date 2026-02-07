"use strict";
/**
 * Evidence and compliance reporting type definitions
 * @module types/evidence
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Severity = exports.ControlResult = exports.ComplianceStatus = exports.EvidenceStatus = exports.ComplianceFramework = void 0;
/**
 * Supported compliance frameworks
 */
var ComplianceFramework;
(function (ComplianceFramework) {
    ComplianceFramework["SOC2"] = "SOC2";
    ComplianceFramework["GDPR"] = "GDPR";
    ComplianceFramework["ISO27001"] = "ISO27001";
})(ComplianceFramework || (exports.ComplianceFramework = ComplianceFramework = {}));
/**
 * Evidence collection status
 */
var EvidenceStatus;
(function (EvidenceStatus) {
    EvidenceStatus["PENDING"] = "pending";
    EvidenceStatus["COLLECTED"] = "collected";
    EvidenceStatus["FAILED"] = "failed";
    EvidenceStatus["INVALID"] = "invalid";
})(EvidenceStatus || (exports.EvidenceStatus = EvidenceStatus = {}));
/**
 * Compliance status enum
 */
var ComplianceStatus;
(function (ComplianceStatus) {
    ComplianceStatus["PASS"] = "PASS";
    ComplianceStatus["FAIL"] = "FAIL";
    ComplianceStatus["WARNING"] = "WARNING";
    ComplianceStatus["NOT_APPLICABLE"] = "NOT_APPLICABLE";
    ComplianceStatus["ERROR"] = "ERROR";
    ComplianceStatus["MANUAL_REVIEW"] = "MANUAL_REVIEW";
})(ComplianceStatus || (exports.ComplianceStatus = ComplianceStatus = {}));
var ControlResult;
(function (ControlResult) {
    ControlResult["PASS"] = "pass";
    ControlResult["FAIL"] = "fail";
    ControlResult["PARTIAL"] = "partial";
    ControlResult["NOT_APPLICABLE"] = "not_applicable";
    ControlResult["ERROR"] = "error";
})(ControlResult || (exports.ControlResult = ControlResult = {}));
/**
 * Evidence severity level
 */
var Severity;
(function (Severity) {
    Severity["CRITICAL"] = "critical";
    Severity["HIGH"] = "high";
    Severity["MEDIUM"] = "medium";
    Severity["LOW"] = "low";
    Severity["INFO"] = "info";
})(Severity || (exports.Severity = Severity = {}));
//# sourceMappingURL=evidence.js.map