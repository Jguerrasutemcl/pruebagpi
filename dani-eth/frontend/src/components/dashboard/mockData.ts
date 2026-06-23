import type {
  ActiveScan,
  HeatmapCategory,
  PatchProgressResponse,
  QuickStatsResponse,
  RiskScoreResponse,
  Vulnerability,
} from './types';

export const mockRiskScore: RiskScoreResponse = {
  score: 6.8,
  trend: 'increasing',
  previous: 6.2,
};

export const mockQuickStats: QuickStatsResponse = {
  critical: 14,
  high: 33,
  resolved: 142,
};

export const mockHeatmap: HeatmapCategory[] = [
  { name: 'Web Applications', score: 9.4, count: 23, severity: 'CRITICAL', vulnerabilityTab: 'applications' },
  { name: 'Databases', score: 8.9, count: 18, severity: 'CRITICAL', vulnerabilityTab: 'servers' },
  { name: 'APIs', score: 7.8, count: 31, severity: 'HIGH', vulnerabilityTab: 'applications' },
  { name: 'Cloud Infrastructure', score: 7.2, count: 12, severity: 'HIGH', vulnerabilityTab: 'network' },
  { name: 'Network Devices', score: 5.5, count: 15, severity: 'MEDIUM', vulnerabilityTab: 'network' },
  { name: 'Containers', score: 4.9, count: 8, severity: 'MEDIUM', vulnerabilityTab: 'servers' },
  { name: 'Mobile Apps', score: 2.1, count: 4, severity: 'LOW', vulnerabilityTab: 'applications' },
];

export const mockRecentVulnerabilities: Vulnerability[] = [
  {
    cveId: 'CVE-2024-1234',
    title: 'SQL Injection in Auth System',
    severity: 'CRITICAL',
    asset: 'api.company.com/auth',
    detectedDate: '2026-06-02T10:00:00Z',
    status: 'In Progress',
    cvss: 9.8,
    description: 'Unsanitized input in authentication flow allows SQL injection.',
  },
  {
    cveId: 'CVE-2024-5678',
    title: 'Stored XSS in User Profile',
    severity: 'HIGH',
    asset: 'portal.company.com/profile',
    detectedDate: '2026-06-02T08:30:00Z',
    status: 'Open',
    cvss: 7.4,
    description: 'User-controlled profile fields are rendered without sanitization.',
  },
  {
    cveId: 'CVE-2024-3094',
    title: 'Authentication Bypass in Firewall',
    severity: 'CRITICAL',
    asset: 'fw-prod-01.company.com',
    detectedDate: '2026-06-02T07:10:00Z',
    status: 'Open',
    cvss: 9.8,
    description: 'Improper auth validation allows unauthorized access.',
  },
  {
    cveId: 'CVE-2025-1001',
    title: 'JWT None Algorithm Accepted',
    severity: 'CRITICAL',
    asset: 'api.company.com/jwt',
    detectedDate: '2026-06-01T23:15:00Z',
    status: 'Open',
    cvss: 9.1,
    description: 'JWT validation accepts insecure none algorithm.',
  },
  {
    cveId: 'CVE-2025-1002',
    title: 'Weak CORS Policy',
    severity: 'MEDIUM',
    asset: 'dashboard.company.com',
    detectedDate: '2026-06-01T22:10:00Z',
    status: 'Resolved',
    cvss: 5.3,
    description: 'Wildcard origins expose authenticated endpoints to abuse.',
  },
  {
    cveId: 'CVE-2025-1003',
    title: 'Sensitive Data in Logs',
    severity: 'HIGH',
    asset: 'auth-service.company.com',
    detectedDate: '2026-06-01T21:00:00Z',
    status: 'In Progress',
    cvss: 7.1,
    description: 'Access tokens are exposed in plaintext logs.',
  },
  {
    cveId: 'CVE-2025-1004',
    title: 'Outdated OpenSSL Dependency',
    severity: 'MEDIUM',
    asset: 'gateway.company.com',
    detectedDate: '2026-06-01T19:40:00Z',
    status: 'Open',
    cvss: 6.0,
    description: 'Gateway uses outdated OpenSSL with known vulnerabilities.',
  },
  {
    cveId: 'CVE-2025-1005',
    title: 'SSRF in Import Function',
    severity: 'HIGH',
    asset: 'portal.company.com/import',
    detectedDate: '2026-06-01T18:20:00Z',
    status: 'Open',
    cvss: 8.0,
    description: 'Remote file import can be abused to reach internal services.',
  },
  {
    cveId: 'CVE-2025-1006',
    title: 'Privilege Escalation via Role API',
    severity: 'CRITICAL',
    asset: 'api.company.com/users',
    detectedDate: '2026-06-01T17:15:00Z',
    status: 'In Progress',
    cvss: 9.3,
    description: 'Role assignment endpoint lacks authorization checks.',
  },
  {
    cveId: 'CVE-2025-1007',
    title: 'Exposed Admin Panel',
    severity: 'LOW',
    asset: 'admin-preview.company.com',
    detectedDate: '2026-06-01T15:00:00Z',
    status: 'Resolved',
    cvss: 3.2,
    description: 'Preview admin panel was externally reachable.',
  },
];

export const mockPatchProgress: PatchProgressResponse = {
  overall: {
    completed: 84,
    total: 120,
    percentage: 70,
  },
  bySeverity: [
    { severity: 'CRITICAL', completed: 10, total: 14 },
    { severity: 'HIGH', completed: 26, total: 33 },
    { severity: 'MEDIUM', completed: 30, total: 43 },
    { severity: 'LOW', completed: 18, total: 30 },
  ],
};

export const mockActiveScans: ActiveScan[] = [
  { id: 'scan-1', target: 'api.company.com', progress: 67, eta: '15 min', status: 'Running' },
  { id: 'scan-2', target: 'portal.company.com', progress: 42, eta: '22 min', status: 'Running' },
  { id: 'scan-3', target: 'fw-prod-01.company.com', progress: 10, eta: '35 min', status: 'Running' },
  { id: 'scan-4', target: 'db-cluster.internal', progress: 0, eta: 'Queued', status: 'Queued' },
];