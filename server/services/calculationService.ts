// Standardized Illustrative Emission Factors Library with documented sources and versions
export interface EmissionFactorMetadata {
  id: string;
  sourceName: string;
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  factor: number; // in kgCO2e per unit
  unit: string;
  sourceAuthority: string;
  version: string;
  description: string;
}

export const OFFICIAL_EMISSION_FACTORS: EmissionFactorMetadata[] = [
  {
    id: 'grid-elec-us',
    sourceName: 'Purchased Electricity (Grid Average)',
    scope: 'Scope 2',
    factor: 0.386,
    unit: 'kWh',
    sourceAuthority: 'EPA eGRID 2024',
    version: 'v2024.1',
    description: 'US national average grid emission factor per kilowatt-hour'
  },
  {
    id: 'nat-gas-therm',
    sourceName: 'Natural Gas (Stationary Combustion)',
    scope: 'Scope 1',
    factor: 5.300,
    unit: 'Therms',
    sourceAuthority: 'EPA GHG Emission Factors Hub',
    version: 'v2024.1',
    description: 'Direct combustion of natural gas for facility heating'
  },
  {
    id: 'diesel-fleet',
    sourceName: 'Fleet Diesel (Mobile Combustion)',
    scope: 'Scope 1',
    factor: 10.210,
    unit: 'Gallons',
    sourceAuthority: 'EPA GHG Emission Factors Hub',
    version: 'v2024.1',
    description: 'Direct fleet vehicle combustion per gallon of diesel'
  },
  {
    id: 'air-travel-short',
    sourceName: 'Commercial Flights (Short Haul)',
    scope: 'Scope 3',
    factor: 0.245,
    unit: 'passenger-km',
    sourceAuthority: 'UK DEFRA / DESNZ',
    version: 'v2024.1',
    description: 'Business travel passenger-kilometer flights under 500 km'
  },
  {
    id: 'air-travel-long',
    sourceName: 'Commercial Flights (Long Haul)',
    scope: 'Scope 3',
    factor: 0.150,
    unit: 'passenger-km',
    sourceAuthority: 'UK DEFRA / DESNZ',
    version: 'v2024.1',
    description: 'Business travel passenger-kilometer flights over 500 km'
  },
  {
    id: 'mfg-feedstock',
    sourceName: 'Industrial Processing Materials',
    scope: 'Scope 3',
    factor: 1.820,
    unit: 'kg',
    sourceAuthority: 'IEA Industrial GHG Guide',
    version: 'v2024.2',
    description: 'Emissions associated with raw plastic and aluminum supply chain'
  }
];

export const calculationService = {
  // Convert various energy units to standardized kWh for aggregate KPIs
  toStandardKWh(consumption: number, unit: string): number {
    switch (unit) {
      case 'MWh':
        return consumption * 1000;
      case 'Therms':
        return consumption * 29.3001;
      case 'Gallons':
        return consumption * 40.7; // ~40.7 kWh per gallon of diesel
      case 'kWh':
      default:
        return consumption;
    }
  },

  // Calculate carbon emissions in kgCO2e and tCO2e
  calculateEmissions(activityValue: number, emissionFactor: number): { kgCO2e: number; tCO2e: number } {
    const kgCO2e = Math.round(activityValue * emissionFactor * 100) / 100;
    const tCO2e = Math.round((kgCO2e / 1000) * 1000) / 1000;
    return { kgCO2e, tCO2e };
  },

  // Calculate waste recycling rate
  calculateRecyclingRate(recycledKg: number, totalKg: number): number {
    if (!totalKg || totalKg <= 0) return 0;
    const rate = (recycledKg / totalKg) * 100;
    return Math.round(rate * 10) / 10;
  },

  // Calculate overall ESG score
  calculateOverallESG(envScore: number, socialScore: number, govScore: number): number {
    const raw = (envScore + socialScore + govScore) / 3;
    return Math.round(raw * 10) / 10;
  },

  // Calculate Goal Progress based on direction (reduction vs increase)
  calculateGoalProgress(
    metricType: string,
    baselineValue: number,
    currentValue: number,
    targetValue: number
  ): {
    percentage: number;
    rawPercentage: number;
    isExceeded: boolean;
    isReduction: boolean;
    remaining: number;
  } {
    const isReduction = metricType.toLowerCase().includes('reduction') || baselineValue > targetValue;

    if (baselineValue === targetValue) {
      return {
        percentage: 100,
        rawPercentage: 100,
        isExceeded: false,
        isReduction,
        remaining: 0
      };
    }

    let rawPercentage = 0;
    let remaining = 0;

    if (isReduction) {
      // Progress = (Baseline - Current) / (Baseline - Target) * 100
      const totalReductionNeeded = baselineValue - targetValue;
      const reductionAchieved = baselineValue - currentValue;
      rawPercentage = (reductionAchieved / totalReductionNeeded) * 100;
      remaining = Math.max(0, currentValue - targetValue);
    } else {
      // Progress = (Current - Baseline) / (Target - Baseline) * 100
      const totalIncreaseNeeded = targetValue - baselineValue;
      const increaseAchieved = currentValue - baselineValue;
      rawPercentage = (increaseAchieved / totalIncreaseNeeded) * 100;
      remaining = Math.max(0, targetValue - currentValue);
    }

    const isExceeded = rawPercentage > 100;
    const clampedPercentage = Math.min(100, Math.max(0, Math.round(rawPercentage * 10) / 10));

    return {
      percentage: clampedPercentage,
      rawPercentage: Math.round(rawPercentage * 10) / 10,
      isExceeded,
      isReduction,
      remaining: Math.round(remaining * 10) / 10
    };
  }
};
