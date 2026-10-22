import bcrypt from 'bcryptjs';
import { dal } from '../db/dal';
import { OFFICIAL_EMISSION_FACTORS } from '../services/calculationService';

export async function seedDatabase(forceReset: boolean = false) {
  // Check if organization already exists
  const existingOrg = await dal.getFirstOrganization();
  if (existingOrg && !forceReset) {
    console.log('[Seed] Database already contains records. Skipping idempotent seed.');
    return { seeded: false, message: 'Database already initialized.' };
  }

  console.log('[Seed] Initializing database with realistic ESG development records...');

  // 1. Create Organization
  let org = await dal.getFirstOrganization();
  if (!org) {
    org = await dal.createOrganization({
      name: 'EcoVerde Industrial Solutions Corp',
      industry: 'Advanced Manufacturing & Precision Engineering',
      location: 'North American Operations (Austin & Chicago Facilities)',
      reportingCurrency: 'USD',
      reportingYear: 2026
    });
  }

  const orgId = org._id || org.id || 'ecoverde-org-2026';

  // 2. Create Users with securely hashed passwords
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = 'Admin@EcoTrack2026!';
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  const usersToSeed = [
    {
      name: 'Dr. Sarah Jenkins',
      email: 'admin@ecotrack.org',
      passwordHash: await bcrypt.hash('Admin@EcoTrack2026!', salt),
      role: 'Admin',
      organizationId: orgId,
      isActive: true
    },
    {
      name: 'Marcus Vance',
      email: 'manager@ecotrack.org',
      passwordHash: await bcrypt.hash('Manager@EcoTrack2026!', salt),
      role: 'Manager',
      organizationId: orgId,
      isActive: true
    },
    {
      name: 'Elena Rostova',
      email: 'employee@ecotrack.org',
      passwordHash: await bcrypt.hash('Employee@EcoTrack2026!', salt),
      role: 'Employee',
      organizationId: orgId,
      isActive: true
    },
    {
      name: 'Arthur Sterling (CPA, ESG Auditor)',
      email: 'auditor@ecotrack.org',
      passwordHash: await bcrypt.hash('Auditor@EcoTrack2026!', salt),
      role: 'Auditor',
      organizationId: orgId,
      isActive: true
    }
  ];

  for (const u of usersToSeed) {
    const existing = await dal.findUserByEmail(u.email);
    if (!existing) {
      await dal.createUser(u);
    }
  }

  // 3. Create 12+ Months of Monthly Energy Records
  // Generating realistic seasonal energy data across 2 facilities (Austin Campus, Chicago Plant)
  const months = [
    { year: 2025, month: 0, label: 'Jan 2025', baseElec: 48000, baseGas: 3200 },
    { year: 2025, month: 1, label: 'Feb 2025', baseElec: 46500, baseGas: 3400 },
    { year: 2025, month: 2, label: 'Mar 2025', baseElec: 44000, baseGas: 2800 },
    { year: 2025, month: 3, label: 'Apr 2025', baseElec: 41000, baseGas: 1900 },
    { year: 2025, month: 4, label: 'May 2025', baseElec: 43500, baseGas: 1200 },
    { year: 2025, month: 5, label: 'Jun 2025', baseElec: 52000, baseGas: 800 },
    { year: 2025, month: 6, label: 'Jul 2025', baseElec: 56000, baseGas: 700 },
    { year: 2025, month: 7, label: 'Aug 2025', baseElec: 54500, baseGas: 750 },
    { year: 2025, month: 8, label: 'Sep 2025', baseElec: 47000, baseGas: 1100 },
    { year: 2025, month: 9, label: 'Oct 2025', baseElec: 42000, baseGas: 1800 },
    { year: 2025, month: 10, label: 'Nov 2025', baseElec: 45000, baseGas: 2600 },
    { year: 2025, month: 11, label: 'Dec 2025', baseElec: 49000, baseGas: 3300 },
    { year: 2026, month: 0, label: 'Jan 2026', baseElec: 44500, baseGas: 3000 },
    { year: 2026, month: 1, label: 'Feb 2026', baseElec: 43000, baseGas: 2900 },
    { year: 2026, month: 2, label: 'Mar 2026', baseElec: 40500, baseGas: 2300 }
  ];

  for (const m of months) {
    const recordDate = new Date(m.year, m.month, 15).toISOString();

    // Electricity (Austin HQ)
    await dal.createEnergyRecord({
      organizationId: orgId,
      facility: 'Austin Tech Campus',
      energyType: 'Electricity',
      consumption: m.baseElec,
      unit: 'kWh',
      cost: Math.round(m.baseElec * 0.125),
      recordDate,
      notes: `Grid power consumption for ${m.label} - Austin Tech Campus`,
      createdBy: 'manager@ecotrack.org'
    });

    // Natural Gas (Chicago Plant)
    await dal.createEnergyRecord({
      organizationId: orgId,
      facility: 'Chicago Plant #2',
      energyType: 'Natural Gas',
      consumption: m.baseGas,
      unit: 'Therms',
      cost: Math.round(m.baseGas * 1.15),
      recordDate,
      notes: `Facility heating & boiler fuel for ${m.label}`,
      createdBy: 'manager@ecotrack.org'
    });

    // On-site Solar Generation (Austin HQ)
    await dal.createEnergyRecord({
      organizationId: orgId,
      facility: 'Austin Tech Campus',
      energyType: 'Solar',
      consumption: Math.round(m.baseElec * 0.22),
      unit: 'kWh',
      cost: 0,
      recordDate,
      notes: `Rooftop PV solar generation (${m.label})`,
      createdBy: 'manager@ecotrack.org'
    });
  }

  // 4. Create 12+ Months of Emission Records across Scopes 1, 2, 3
  const elecFactor = OFFICIAL_EMISSION_FACTORS.find(f => f.id === 'grid-elec-us')!;
  const gasFactor = OFFICIAL_EMISSION_FACTORS.find(f => f.id === 'nat-gas-therm')!;
  const fleetFactor = OFFICIAL_EMISSION_FACTORS.find(f => f.id === 'diesel-fleet')!;
  const airFactor = OFFICIAL_EMISSION_FACTORS.find(f => f.id === 'air-travel-long')!;

  for (const m of months) {
    const recordDate = new Date(m.year, m.month, 15).toISOString();

    // Scope 2: Purchased Electricity
    const elecEmissionsKg = Math.round(m.baseElec * elecFactor.factor);
    await dal.createEmissionRecord({
      organizationId: orgId,
      source: 'Purchased Electricity (Grid)',
      scope: 'Scope 2',
      activityValue: m.baseElec,
      activityUnit: elecFactor.unit,
      emissionFactor: elecFactor.factor,
      emissionFactorSource: elecFactor.sourceAuthority,
      emissionFactorVersion: elecFactor.version,
      emissionsKgCO2e: elecEmissionsKg,
      recordDate,
      createdBy: 'manager@ecotrack.org'
    });

    // Scope 1: Natural Gas Boilers
    const gasEmissionsKg = Math.round(m.baseGas * gasFactor.factor);
    await dal.createEmissionRecord({
      organizationId: orgId,
      source: 'Stationary Boilers & Heating',
      scope: 'Scope 1',
      activityValue: m.baseGas,
      activityUnit: gasFactor.unit,
      emissionFactor: gasFactor.factor,
      emissionFactorSource: gasFactor.sourceAuthority,
      emissionFactorVersion: gasFactor.version,
      emissionsKgCO2e: gasEmissionsKg,
      recordDate,
      createdBy: 'manager@ecotrack.org'
    });

    // Scope 1: Fleet Logistics Diesel
    const fleetGallons = Math.round(450 + (m.month % 4) * 35);
    const fleetEmissionsKg = Math.round(fleetGallons * fleetFactor.factor);
    await dal.createEmissionRecord({
      organizationId: orgId,
      source: 'Distribution Fleet Diesel',
      scope: 'Scope 1',
      activityValue: fleetGallons,
      activityUnit: fleetFactor.unit,
      emissionFactor: fleetFactor.factor,
      emissionFactorSource: fleetFactor.sourceAuthority,
      emissionFactorVersion: fleetFactor.version,
      emissionsKgCO2e: fleetEmissionsKg,
      recordDate,
      createdBy: 'manager@ecotrack.org'
    });

    // Scope 3: Executive & Engineering Air Travel
    const pkm = Math.round(8500 + (m.month % 3) * 1200);
    const flightEmissionsKg = Math.round(pkm * airFactor.factor);
    await dal.createEmissionRecord({
      organizationId: orgId,
      source: 'Business Flight Travel',
      scope: 'Scope 3',
      activityValue: pkm,
      activityUnit: airFactor.unit,
      emissionFactor: airFactor.factor,
      emissionFactorSource: airFactor.sourceAuthority,
      emissionFactorVersion: airFactor.version,
      emissionsKgCO2e: flightEmissionsKg,
      recordDate,
      createdBy: 'manager@ecotrack.org'
    });
  }

  // 5. Create Waste Records
  const wasteCategories: ('Paper & Cardboard' | 'Plastic' | 'Metals' | 'Electronic Waste' | 'Hazardous Chemical')[] = [
    'Paper & Cardboard',
    'Plastic',
    'Metals',
    'Electronic Waste',
    'Hazardous Chemical'
  ];

  for (const m of months.slice(-8)) {
    const recordDate = new Date(m.year, m.month, 20).toISOString();

    await dal.createWasteRecord({
      organizationId: orgId,
      wasteType: 'Paper & Cardboard',
      totalWasteKg: 3400,
      recycledWasteKg: 3100,
      disposedWasteKg: 300,
      recordDate,
      facility: 'Austin Tech Campus',
      createdBy: 'manager@ecotrack.org'
    });

    await dal.createWasteRecord({
      organizationId: orgId,
      wasteType: 'Plastic',
      totalWasteKg: 1850,
      recycledWasteKg: 1420,
      disposedWasteKg: 430,
      recordDate,
      facility: 'Chicago Plant #2',
      createdBy: 'manager@ecotrack.org'
    });

    await dal.createWasteRecord({
      organizationId: orgId,
      wasteType: 'Metals',
      totalWasteKg: 2900,
      recycledWasteKg: 2750,
      disposedWasteKg: 150,
      recordDate,
      facility: 'Chicago Plant #2',
      createdBy: 'manager@ecotrack.org'
    });
  }

  // 6. Create ESG Historical Metrics
  const esgPeriods = [
    { period: '2024-FullYear', env: 72, soc: 70, gov: 79, notes: 'Baseline ESG audit conducted by Third-Party auditor.' },
    { period: '2025-Q1', env: 76, soc: 74, gov: 82, notes: 'Initiated ISO 50001 energy efficiency protocols.' },
    { period: '2025-Q2', env: 79, soc: 75, gov: 84, notes: 'Expanded workplace diversity & ergonomics program.' },
    { period: '2025-Q3', env: 82, soc: 78, gov: 85, notes: 'Installed rooftop solar arrays at Austin HQ.' },
    { period: '2025-Q4', env: 85, soc: 80, gov: 88, notes: 'Zero-waste packaging milestone achieved in warehouse.' },
    { period: '2026-Q1', env: 88, soc: 83, gov: 90, notes: 'Current quarter ESG index review.' }
  ];

  for (const ep of esgPeriods) {
    await dal.createESGMetric({
      organizationId: orgId,
      reportingPeriod: ep.period,
      environmentalScore: ep.env,
      socialScore: ep.soc,
      governanceScore: ep.gov,
      methodologyVersion: 'EcoTrack Corporate ESG Standard v2026.1',
      notes: ep.notes
    });
  }

  // 7. Create Sustainability Goals
  const goalsToSeed = [
    {
      title: '30% Facility Electricity Reduction by 2028',
      description: 'Upgrade building automation, retrofit LED fixtures, and optimize HVAC chiller scheduling across all active plants.',
      metricType: 'Energy Reduction',
      baselineValue: 58000,
      currentValue: 43000,
      targetValue: 40600,
      unit: 'kWh/mo',
      baselineDate: new Date('2024-01-01').toISOString(),
      targetDate: new Date('2028-12-31').toISOString(),
      status: 'In Progress',
      createdBy: 'admin@ecotrack.org'
    },
    {
      title: 'Net-Zero Scope 2 Grid Emissions',
      description: 'Contract with 100% certified renewable energy power purchase agreements (PPAs) and install on-site solar battery storage.',
      metricType: 'Carbon Reduction',
      baselineValue: 24.5,
      currentValue: 16.6,
      targetValue: 0.0,
      unit: 'tCO2e/mo',
      baselineDate: new Date('2024-01-01').toISOString(),
      targetDate: new Date('2030-06-30').toISOString(),
      status: 'In Progress',
      createdBy: 'admin@ecotrack.org'
    },
    {
      title: 'Achieve 90% Industrial Waste Diversion',
      description: 'Eliminate single-use plastics from packing lines and recycle 100% of aluminum scraps and cardboard.',
      metricType: 'Recycling Rate',
      baselineValue: 62.0,
      currentValue: 88.5,
      targetValue: 90.0,
      unit: '%',
      baselineDate: new Date('2024-01-01').toISOString(),
      targetDate: new Date('2026-12-31').toISOString(),
      status: 'In Progress',
      createdBy: 'admin@ecotrack.org'
    },
    {
      title: 'Renewable Power Share Elevation',
      description: 'Increase local on-site solar generation share to 35% of total facility load.',
      metricType: 'Renewable Share',
      baselineValue: 8.0,
      currentValue: 22.0,
      targetValue: 35.0,
      unit: '%',
      baselineDate: new Date('2024-06-01').toISOString(),
      targetDate: new Date('2027-06-30').toISOString(),
      status: 'In Progress',
      createdBy: 'manager@ecotrack.org'
    }
  ];

  for (const g of goalsToSeed) {
    await dal.createGoal({
      ...g,
      organizationId: orgId
    });
  }

  console.log('[Seed] Database successfully seeded with 12+ months of records and 4 role accounts.');
  return { seeded: true, message: 'Database successfully seeded.' };
}
