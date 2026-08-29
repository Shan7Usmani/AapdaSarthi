export type Severity = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";

export interface DistrictRisk {
  name: string;
  severity: Severity;
  riskScore: number; // 0-100
  affected: number; // population displaced
  waterLevel: number; // meters above danger mark
  trend: "rising" | "stable" | "falling";
  centroid: [number, number];
}

export interface ResourceItem {
  id: string;
  icon: string;
  label: string;
  quantity: number;
  unit: string;
  ward: string;
  status: "dispatched" | "ready" | "requested";
}

export interface EvacRoute {
  id: string;
  label: string;
  from: string;
  to: string;
  path: [number, number][];
  lengthKm: number;
  people: number;
}

export interface AlertTemplate {
  lang: string;
  code: string;
  sms: string;
  recipients: number;
}

export interface TimelinePoint {
  label: string;
  riskIndex: number; // avg risk 0-100
  districtsAtRisk: number; // HIGH+CRITICAL count
}

export interface Scenario {
  id: string;
  name: string;
  state: string;
  year: number;
  summary: string;
  center: [number, number];
  zoom: number;
  districts: DistrictRisk[];
  resources: ResourceItem[];
  routes: EvacRoute[];
  alerts: AlertTemplate[];
  timeline: TimelinePoint[];
}
