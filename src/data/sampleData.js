export const todayAppointments = [
  { id: 1, time: "8:00 AM", customer: "Maria Rodriguez", vehicle: "2021 Toyota Camry", service: "Oil Change + Brake Inspection", bay: 1, tech: "James K.", status: "in_progress", phone: "(512) 555-0142", aiNote: "Brake pads at 3mm — recommend replacement" },
  { id: 2, time: "8:30 AM", customer: "David Chen", vehicle: "2019 Honda CR-V", service: "Check Engine Light - P0420", bay: 2, tech: "Mike R.", status: "inspection", phone: "(512) 555-0198", aiNote: "Catalytic converter efficiency below threshold — likely cat failure" },
  { id: 3, time: "9:00 AM", customer: "Sarah Johnson", vehicle: "2022 Ford F-150", service: "60K Mile Service", bay: 3, tech: "Carlos M.", status: "estimate_sent", phone: "(512) 555-0231", aiNote: "Transmission fluid dark — recommend flush" },
  { id: 4, time: "10:00 AM", customer: "James Wilson", vehicle: "2020 BMW X3", service: "AC Not Blowing Cold", bay: null, tech: null, status: "checked_in", phone: "(512) 555-0177", aiNote: "Common R1234yf leak at condenser seal" },
  { id: 5, time: "11:00 AM", customer: "Angela Martinez", vehicle: "2018 Subaru Outback", service: "Head Gasket Assessment", bay: null, tech: null, status: "scheduled", phone: "(512) 555-0265", aiNote: "Known EJ25 head gasket issue — check coolant contamination" },
  { id: 6, time: "1:00 PM", customer: "Robert Taylor", vehicle: "2023 Hyundai Tucson", service: "Steering Noise Investigation", bay: null, tech: null, status: "scheduled", phone: "(512) 555-0309", aiNote: "TSB for intermediate shaft bearing" },
];

export const revenueData = [
  { day: "Mon", revenue: 4200, target: 4500 },
  { day: "Tue", revenue: 5100, target: 4500 },
  { day: "Wed", revenue: 3800, target: 4500 },
  { day: "Thu", revenue: 6200, target: 4500 },
  { day: "Fri", revenue: 5800, target: 4500 },
  { day: "Sat", revenue: 3200, target: 3000 },
];

export const weeklyMetrics = [
  { week: "W1", aro: 485, carCount: 42, laborRate: 145, hours: 168 },
  { week: "W2", aro: 512, carCount: 38, laborRate: 148, hours: 155 },
  { week: "W3", aro: 498, carCount: 45, laborRate: 146, hours: 172 },
  { week: "W4", aro: 534, carCount: 41, laborRate: 150, hours: 165 },
];

export const monthlyData = [
  { month: "Sep", revenue: 68400, carCount: 152, aro: 450 },
  { month: "Oct", revenue: 72100, carCount: 158, aro: 456 },
  { month: "Nov", revenue: 81300, carCount: 162, aro: 502 },
  { month: "Dec", revenue: 69800, carCount: 138, aro: 506 },
  { month: "Jan", revenue: 85200, carCount: 168, aro: 507 },
  { month: "Feb", revenue: 78400, carCount: 155, aro: 506 },
];

export const techEfficiency = [
  { name: "James K.", billed: 38.5, available: 40, efficiency: 96, aro: 545, satisfaction: 4.8 },
  { name: "Mike R.", billed: 34.2, available: 40, efficiency: 85, aro: 512, satisfaction: 4.6 },
  { name: "Carlos M.", billed: 36.8, available: 40, efficiency: 92, aro: 498, satisfaction: 4.7 },
];

export const serviceBreakdown = [
  { name: "Maintenance", value: 35, color: "#0D3B45" },
  { name: "Brakes", value: 22, color: "#FF6B35" },
  { name: "Diagnostics", value: 18, color: "#7C3AED" },
  { name: "Engine", value: 12, color: "#22C55E" },
  { name: "Other", value: 13, color: "#9CA3AF" },
];

export const partsComparison = [
  { part: "Walker 16468 Catalytic Converter", supplier: "O'Reilly", price: 342, markup: 496.90, avail: "In Stock", rating: 4.7, delivery: "Same day pickup", warranty: "5yr/50K" },
  { part: "Dorman 674-975 Cat Converter", supplier: "AutoZone", price: 389, markup: 564.05, avail: "In Stock", rating: 4.3, delivery: "Same day pickup", warranty: "3yr/36K" },
  { part: "Honda OEM 18190-5PH-A00", supplier: "Honda Direct", price: 890, markup: 1290.50, avail: "Backorder", rating: 5.0, delivery: "7-10 days", warranty: "OEM" },
  { part: "MagnaFlow 52545", supplier: "RockAuto", price: 425, markup: 616.25, avail: "Ships Today", rating: 4.6, delivery: "2-3 days", warranty: "Lifetime" },
];
