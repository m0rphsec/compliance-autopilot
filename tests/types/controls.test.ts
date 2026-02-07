/**
 * Tests for control definitions
 */

import { describe, it, expect } from '@jest/globals';
import {
  ControlCategory,
  EvidenceType,
  SOC2_CONTROLS,
  GDPR_CONTROLS,
  ISO27001_CONTROLS,
  getControlsForFramework,
  getControlById,
  getControlsByCategory,
  type ControlDefinition
} from '../../src/types/controls.js';
import { ComplianceFramework } from '../../src/types/evidence.js';

describe('Control Definition Enums', () => {
  it('should have correct ControlCategory values', () => {
    expect(ControlCategory.ACCESS_CONTROL).toBe('access_control');
    expect(ControlCategory.CHANGE_MANAGEMENT).toBe('change_management');
    expect(ControlCategory.MONITORING).toBe('monitoring');
  });

  it('should have correct EvidenceType values', () => {
    expect(EvidenceType.PULL_REQUEST).toBe('pull_request');
    expect(EvidenceType.CODE_REVIEW).toBe('code_review');
    expect(EvidenceType.SECURITY_SCAN).toBe('security_scan');
  });
});

describe('SOC2 Controls', () => {
  it('should have valid SOC2 control definitions', () => {
    expect(SOC2_CONTROLS.length).toBeGreaterThan(0);

    SOC2_CONTROLS.forEach(control => {
      expect(control.framework).toBe(ComplianceFramework.SOC2);
      expect(control.id).toBeTruthy();
      expect(control.name).toBeTruthy();
      expect(control.description).toBeTruthy();
      expect(control.requiredEvidence.length).toBeGreaterThan(0);
      expect(control.criteria.length).toBeGreaterThan(0);
    });
  });

  it('should have CC6.1 control', () => {
    const control = SOC2_CONTROLS.find(c => c.id === 'CC6.1');
    expect(control).toBeDefined();
    expect(control?.name).toBe('Logical and Physical Access Controls');
    expect(control?.category).toBe(ControlCategory.ACCESS_CONTROL);
  });

  it('should have CC7.2 control', () => {
    const control = SOC2_CONTROLS.find(c => c.id === 'CC7.2');
    expect(control).toBeDefined();
    expect(control?.name).toBe('System Monitoring');
    expect(control?.category).toBe(ControlCategory.MONITORING);
  });

  it('should have CC8.1 control', () => {
    const control = SOC2_CONTROLS.find(c => c.id === 'CC8.1');
    expect(control).toBeDefined();
    expect(control?.name).toBe('Change Management');
    expect(control?.category).toBe(ControlCategory.CHANGE_MANAGEMENT);
  });
});

describe('GDPR Controls', () => {
  it('should have valid GDPR control definitions', () => {
    expect(GDPR_CONTROLS.length).toBeGreaterThan(0);

    GDPR_CONTROLS.forEach(control => {
      expect(control.framework).toBe(ComplianceFramework.GDPR);
      expect(control.id).toBeTruthy();
      expect(control.name).toBeTruthy();
    });
  });

  it('should have Article 32 control', () => {
    const control = GDPR_CONTROLS.find(c => c.id === 'GDPR-Art32');
    expect(control).toBeDefined();
    expect(control?.name).toBe('Security of Processing');
    expect(control?.category).toBe(ControlCategory.DATA_PROTECTION);
  });

  it('should have Article 25 control', () => {
    const control = GDPR_CONTROLS.find(c => c.id === 'GDPR-Art25');
    expect(control).toBeDefined();
    expect(control?.name).toBe('Data Protection by Design and Default');
  });
});

describe('ISO27001 Controls', () => {
  it('should have valid ISO27001 control definitions', () => {
    expect(ISO27001_CONTROLS.length).toBeGreaterThan(0);

    ISO27001_CONTROLS.forEach(control => {
      expect(control.framework).toBe(ComplianceFramework.ISO27001);
      expect(control.id).toBeTruthy();
      expect(control.name).toBeTruthy();
    });
  });

  it('should have 9.1.1 control', () => {
    const control = ISO27001_CONTROLS.find(c => c.id === 'ISO27001-9.1.1');
    expect(control).toBeDefined();
    expect(control?.name).toBe('Access Control Policy');
  });

  it('should have 12.1.2 control', () => {
    const control = ISO27001_CONTROLS.find(c => c.id === 'ISO27001-12.1.2');
    expect(control).toBeDefined();
    expect(control?.name).toBe('Change Management');
  });
});

describe('getControlsForFramework', () => {
  it('should return SOC2 controls', () => {
    const controls = getControlsForFramework(ComplianceFramework.SOC2);
    expect(controls).toEqual(SOC2_CONTROLS);
  });

  it('should return GDPR controls', () => {
    const controls = getControlsForFramework(ComplianceFramework.GDPR);
    expect(controls).toEqual(GDPR_CONTROLS);
  });

  it('should return ISO27001 controls', () => {
    const controls = getControlsForFramework(ComplianceFramework.ISO27001);
    expect(controls).toEqual(ISO27001_CONTROLS);
  });

  it('should return empty array for unknown framework', () => {
    const controls = getControlsForFramework('UNKNOWN' as ComplianceFramework);
    expect(controls).toEqual([]);
  });
});

describe('getControlById', () => {
  it('should find SOC2 control by ID', () => {
    const control = getControlById('CC6.1');
    expect(control).toBeDefined();
    expect(control?.id).toBe('CC6.1');
    expect(control?.framework).toBe(ComplianceFramework.SOC2);
  });

  it('should find GDPR control by ID', () => {
    const control = getControlById('GDPR-Art32');
    expect(control).toBeDefined();
    expect(control?.id).toBe('GDPR-Art32');
  });

  it('should find ISO27001 control by ID', () => {
    const control = getControlById('ISO27001-9.1.1');
    expect(control).toBeDefined();
    expect(control?.id).toBe('ISO27001-9.1.1');
  });

  it('should return undefined for unknown control ID', () => {
    const control = getControlById('UNKNOWN-ID');
    expect(control).toBeUndefined();
  });
});

describe('getControlsByCategory', () => {
  it('should find all access control controls', () => {
    const controls = getControlsByCategory(ControlCategory.ACCESS_CONTROL);
    expect(controls.length).toBeGreaterThan(0);

    controls.forEach(control => {
      expect(control.category).toBe(ControlCategory.ACCESS_CONTROL);
    });
  });

  it('should find all change management controls', () => {
    const controls = getControlsByCategory(ControlCategory.CHANGE_MANAGEMENT);
    expect(controls.length).toBeGreaterThan(0);

    controls.forEach(control => {
      expect(control.category).toBe(ControlCategory.CHANGE_MANAGEMENT);
    });
  });

  it('should find all monitoring controls', () => {
    const controls = getControlsByCategory(ControlCategory.MONITORING);
    expect(controls.length).toBeGreaterThan(0);

    controls.forEach(control => {
      expect(control.category).toBe(ControlCategory.MONITORING);
    });
  });

  it('should find all data protection controls', () => {
    const controls = getControlsByCategory(ControlCategory.DATA_PROTECTION);
    expect(controls.length).toBeGreaterThan(0);

    controls.forEach(control => {
      expect(control.category).toBe(ControlCategory.DATA_PROTECTION);
    });
  });
});

describe('Control Cross-References', () => {
  it('should have valid related controls', () => {
    const allControls = [...SOC2_CONTROLS, ...GDPR_CONTROLS, ...ISO27001_CONTROLS];
    const allControlIds = allControls.map(c => c.id);

    // Build a map from prefixed IDs (used in relatedControls) to actual control IDs
    // relatedControls use format like "SOC2-CC6.1" or "ISO27001-9.1.1" or "GDPR-Art32"
    // while actual IDs are "CC6.1", "ISO27001-9.1.1", "GDPR-Art32"
    allControls.forEach(control => {
      if (control.relatedControls) {
        control.relatedControls.forEach(relatedId => {
          // Strip the framework prefix if present to resolve the actual control ID
          // e.g. "SOC2-CC6.1" -> "CC6.1", "ISO27001-12.4.1" -> "ISO27001-12.4.1" (already correct)
          let resolvedId = relatedId;
          if (relatedId.startsWith('SOC2-')) {
            resolvedId = relatedId.replace('SOC2-', '');
          }
          // GDPR and ISO27001 prefixed IDs already match actual control IDs

          const relatedControl = getControlById(resolvedId);
          expect(relatedControl).toBeDefined();
        });
      }
    });
  });

  it('should have bidirectional relationships', () => {
    const cc61 = getControlById('CC6.1');
    const iso9_1_1 = getControlById('ISO27001-9.1.1');

    expect(cc61?.relatedControls).toContain('ISO27001-9.1.1');
    expect(iso9_1_1?.relatedControls).toContain('SOC2-CC6.1');
  });
});
