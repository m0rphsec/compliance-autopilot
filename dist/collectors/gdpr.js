"use strict";
/**
 * GDPR Collector - Comprehensive GDPR compliance analysis
 * Combines regex PII detection with Claude contextual analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GDPRCollector = void 0;
const sdk_1 = require("@anthropic-ai/sdk");
const pii_detector_1 = require("../analyzers/pii-detector");
class GDPRCollector {
    anthropic;
    piiDetector;
    cache;
    constructor(config) {
        this.anthropic = new sdk_1.Anthropic({
            apiKey: config.apiKey,
        });
        this.piiDetector = new pii_detector_1.PIIDetector();
        this.cache = new Map();
    }
    /**
     * Scan a single file for GDPR compliance
     */
    async scanFile(code, _filePath) {
        // Check cache first
        const cacheKey = this.getCacheKey(code);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        // Step 1: Fast regex-based PII detection
        const piiMatches = this.piiDetector.detectAll(code);
        const hasPII = piiMatches.length > 0;
        const piiTypes = [...new Set(piiMatches.map((m) => m.type))];
        // Step 2: Quick checks for encryption and security patterns
        const encryptionTransit = this.detectEncryptionTransit(code);
        const encryptionRest = this.detectEncryptionRest(code);
        const consentMechanism = this.detectConsentMechanism(code);
        const retentionPolicy = this.detectRetentionPolicy(code);
        const deletionCapability = this.detectDeletionCapability(code);
        // Step 3: If PII detected, use Claude for contextual analysis
        let claudeAnalysis = {};
        if (hasPII) {
            try {
                claudeAnalysis = await this.analyzeWithClaude(code, _filePath);
            }
            catch (error) {
                console.warn('Claude analysis failed, using regex-only detection:', error);
                // Fallback to regex-only results
            }
        }
        // Step 4: Combine results
        const result = {
            has_pii: hasPII,
            pii_types: piiTypes,
            collection_methods: claudeAnalysis.collection_methods || this.inferCollectionMethods(code),
            encryption_transit: claudeAnalysis.encryption_transit ?? encryptionTransit,
            encryption_rest: claudeAnalysis.encryption_rest ?? encryptionRest,
            consent_mechanism: claudeAnalysis.consent_mechanism ?? consentMechanism,
            retention_policy: claudeAnalysis.retention_policy ?? retentionPolicy,
            deletion_capability: claudeAnalysis.deletion_capability ?? deletionCapability,
            gdpr_compliant: false, // Will be calculated
            violations: claudeAnalysis.violations || [],
            recommendations: claudeAnalysis.recommendations || [],
        };
        // Calculate GDPR compliance
        result.gdpr_compliant = this.calculateCompliance(result);
        // Add violations based on missing requirements
        this.addViolations(result, piiMatches, _filePath);
        // Cache result
        this.cache.set(cacheKey, result);
        return result;
    }
    /**
     * Scan multiple files (repository-wide analysis)
     */
    async scanRepository(files) {
        const fileResults = [];
        // Process files in batches for efficiency
        const batchSize = 5;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map(async (file) => {
                const piiMatches = this.piiDetector.detectAll(file.code);
                const result = await this.scanFile(file.code, file.path);
                return { path: file.path, result, piiMatches };
            });
            const batchResults = await Promise.all(batchPromises);
            fileResults.push(...batchResults);
        }
        // Aggregate results
        const allViolations = [];
        const allPIIMatches = [];
        let filesWithPII = 0;
        fileResults.forEach(({ path, result, piiMatches }) => {
            if (result.has_pii) {
                filesWithPII++;
            }
            // Convert violations to structured format
            result.violations.forEach((violation) => {
                allViolations.push({
                    severity: this.categorizeSeverity(violation, result),
                    category: 'GDPR',
                    description: violation,
                    file: path,
                    recommendation: this.getRecommendation(violation),
                });
            });
            // Add PII matches with file context
            piiMatches.forEach((match) => {
                allPIIMatches.push({ ...match });
            });
        });
        // Calculate overall score
        const score = this.calculateRepositoryScore(fileResults);
        const compliant = score >= 80;
        return {
            score,
            compliant,
            violations: allViolations,
            pii_detected: allPIIMatches,
            summary: {
                total_files_scanned: files.length,
                files_with_pii: filesWithPII,
                total_violations: allViolations.length,
                compliance_percentage: score,
            },
        };
    }
    /**
     * Analyze code with Claude using exact prompt template
     */
    async analyzeWithClaude(code, _filePath) {
        const prompt = `Analyze this code for GDPR compliance:

${code}

Detect:
1. PII data types (email, name, SSN, phone, address, etc.)
2. How PII is collected (forms, API, cookies)
3. Encryption in transit (HTTPS, TLS)
4. Encryption at rest (database encryption)
5. Consent mechanism (checkboxes, agreements)
6. Data retention policies (TTL, expiration)
7. Right to deletion (delete endpoints, data removal)

Return JSON:
{
  has_pii: boolean,
  pii_types: string[],
  collection_methods: string[],
  encryption_transit: boolean,
  encryption_rest: boolean,
  consent_mechanism: boolean,
  retention_policy: boolean,
  deletion_capability: boolean,
  gdpr_compliant: boolean,
  violations: string[],
  recommendations: string[]
}`;
        const response = await this.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            system: 'You are a GDPR compliance expert. Analyze code and return structured JSON responses.',
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });
        const content = response.content[0];
        if (content.type === 'text') {
            try {
                // Extract JSON from response
                const jsonMatch = content.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            }
            catch (error) {
                console.warn('Failed to parse Claude response:', error);
            }
        }
        return {};
    }
    /**
     * Detect HTTPS/TLS usage for transit encryption
     */
    detectEncryptionTransit(code) {
        const patterns = [
            /https:\/\//i, // HTTPS URLs
            /https\./i, // Node.js https module (https.createServer, https.get)
            /tls\./i, // TLS module usage
            /ssl/i, // SSL references
            /process\.env\.NODE_TLS_REJECT_UNAUTHORIZED/i,
        ];
        return patterns.some((pattern) => pattern.test(code));
    }
    /**
     * Detect database encryption patterns
     */
    detectEncryptionRest(code) {
        const patterns = [
            /encrypt\(/i,
            /crypto\.createCipher/i,
            /AES|RSA/i,
            /encryption\s*[:=]\s*true/i,
            /ENCRYPTED/i,
        ];
        return patterns.some((pattern) => pattern.test(code));
    }
    /**
     * Detect consent mechanism
     */
    detectConsentMechanism(code) {
        const patterns = [
            /consent/i,
            /gdpr.*accept/i,
            /checkbox.*agree/i,
            /hasGivenConsent/i,
            /userConsent/i,
            /privacyAgreement/i,
        ];
        return patterns.some((pattern) => pattern.test(code));
    }
    /**
     * Detect data retention policies
     */
    detectRetentionPolicy(code) {
        const patterns = [
            /TTL|expir/i,
            /retention/i,
            /deleteAfter/i,
            /\.set\s*\([^,]+,\s*[^,]+,\s*['"]EX['"]/i,
            /INTERVAL.*day/i,
            /maxAge/i,
        ];
        return patterns.some((pattern) => pattern.test(code));
    }
    /**
     * Detect deletion capability
     */
    detectDeletionCapability(code) {
        const patterns = [
            /\.delete\s*\(/i,
            /\.destroy\s*\(/i,
            /\.remove\s*\(/i,
            /DELETE\s+FROM/i,
            /right.*deletion/i,
            /deleteUser/i,
            /removeData/i,
        ];
        return patterns.some((pattern) => pattern.test(code));
    }
    /**
     * Infer collection methods from code patterns
     */
    inferCollectionMethods(code) {
        const methods = [];
        if (/input|form|<input|<form/i.test(code)) {
            methods.push('form input');
        }
        if (/fetch|axios|request|api/i.test(code)) {
            methods.push('API');
        }
        if (/cookie|localStorage|sessionStorage/i.test(code)) {
            methods.push('cookies/storage');
        }
        if (/query|params|req\.(body|query|params)/i.test(code)) {
            methods.push('URL parameters');
        }
        return methods;
    }
    /**
     * Calculate compliance based on requirements
     */
    calculateCompliance(result) {
        if (!result.has_pii) {
            return true; // No PII means GDPR doesn't apply
        }
        // All critical requirements must be met
        return (result.encryption_transit &&
            result.encryption_rest &&
            result.consent_mechanism &&
            result.retention_policy &&
            result.deletion_capability);
    }
    /**
     * Add violations based on missing requirements
     */
    addViolations(result, piiMatches, _filePath) {
        if (!result.has_pii) {
            return;
        }
        if (!result.encryption_transit) {
            result.violations.push('No encryption in transit (HTTPS/TLS) detected');
            result.recommendations.push('Use HTTPS for all API calls handling PII');
        }
        if (!result.encryption_rest) {
            result.violations.push('No encryption at rest detected');
            result.recommendations.push('Implement database encryption for PII storage');
        }
        if (!result.consent_mechanism) {
            result.violations.push('No consent mechanism detected');
            result.recommendations.push('Add explicit user consent checkboxes before collecting PII');
        }
        if (!result.retention_policy) {
            result.violations.push('No data retention policy detected');
            result.recommendations.push('Implement TTL/expiration for PII data');
        }
        if (!result.deletion_capability) {
            result.violations.push('No data deletion capability detected');
            result.recommendations.push('Implement "right to deletion" endpoints');
        }
        // Check for insecure PII handling
        piiMatches.forEach((match) => {
            if (match.type === 'ssn' || match.type === 'credit_card') {
                result.violations.push(`Sensitive PII (${match.type}) detected in code`);
                result.recommendations.push(`Never hardcode ${match.type} in source code`);
            }
        });
    }
    /**
     * Categorize violation severity
     */
    categorizeSeverity(violation, result) {
        if (violation.includes('SSN') || violation.includes('credit_card')) {
            return 'critical';
        }
        if (!result.encryption_transit || !result.encryption_rest) {
            return 'critical';
        }
        if (!result.consent_mechanism) {
            return 'high';
        }
        if (!result.deletion_capability) {
            return 'high';
        }
        if (!result.retention_policy) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * Get recommendation for violation
     */
    getRecommendation(violation) {
        const recommendations = {
            'encryption in transit': 'Use HTTPS for all API calls. Configure TLS 1.2+ on servers.',
            'encryption at rest': 'Enable database encryption. Use crypto libraries for sensitive data.',
            'consent mechanism': 'Add GDPR-compliant consent forms with clear opt-in checkboxes.',
            'retention policy': 'Implement data retention policies with automatic expiration (TTL).',
            'deletion capability': 'Create DELETE endpoints for user data removal. Implement cascading deletes.',
            SSN: 'Never store SSN in plaintext. Use tokenization or encryption.',
            credit_card: 'Use PCI-DSS compliant payment processors. Never store card data.',
        };
        for (const [key, rec] of Object.entries(recommendations)) {
            if (violation.toLowerCase().includes(key)) {
                return rec;
            }
        }
        return 'Review GDPR requirements and implement necessary controls.';
    }
    /**
     * Calculate overall repository score
     */
    calculateRepositoryScore(fileResults) {
        if (fileResults.length === 0) {
            return 100;
        }
        let totalScore = 0;
        let filesWithPII = 0;
        fileResults.forEach(({ result }) => {
            if (result.has_pii) {
                filesWithPII++;
                // Score based on compliance requirements (20 points each)
                let fileScore = 0;
                if (result.encryption_transit)
                    fileScore += 20;
                if (result.encryption_rest)
                    fileScore += 20;
                if (result.consent_mechanism)
                    fileScore += 20;
                if (result.retention_policy)
                    fileScore += 20;
                if (result.deletion_capability)
                    fileScore += 20;
                totalScore += fileScore;
            }
        });
        // If no PII detected, perfect score
        if (filesWithPII === 0) {
            return 100;
        }
        // Average score across files with PII
        return Math.round(totalScore / filesWithPII);
    }
    /**
     * Generate cache key for code content
     */
    getCacheKey(code) {
        // Simple hash for caching
        let hash = 0;
        for (let i = 0; i < code.length; i++) {
            const char = code.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}
exports.GDPRCollector = GDPRCollector;
//# sourceMappingURL=gdpr.js.map