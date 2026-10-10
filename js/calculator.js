/**
 * Shree Ganesha Solar - Solar Savings Calculator Engine (Pune & Maharashtra Context)
 * Grounded in MSEDCL Tariff Slabs & PM Surya Ghar Muft Bijli Yojana Guidelines.
 * 
 * NOTE: All figures are engineering estimates based on Pune's average insolation (approx 4.15 peak sun hours/day).
 * Actual generation and savings depend on roof orientation, shadow factor, sanctioned load, and final discom approvals.
 */

export class SolarCalculator {
  constructor() {
    // Benchmark MSEDCL average tariffs in Pune (₹/kWh)
    this.tariffs = {
      residential: 8.50,    // MSEDCL progressive slab avg (effective ~₹8.50/unit)
      society: 9.20,        // MSEDCL commercial/common utility slab
      commercial: 11.50     // Commercial / MSME LT-2 tariff
    };

    // Indicative turnkey benchmark cost per kW (Tier-1 Waaree modules, inverter, structure, earthing, net-metering liaison)
    this.benchmarkCostPerKw = {
      residential: 58000,
      society: 52000,
      commercial: 48000
    };
  }

  /**
   * Calculate indicative subsidy based on official PM Surya Ghar Muft Bijli Yojana (MNRE) guidelines
   * @param {number} kw - Recommended system capacity in kW
   * @param {string} category - 'residential' | 'society' | 'commercial'
   * @returns {number} Indicative subsidy amount in INR
   */
  calculateSubsidy(kw, category) {
    if (category === 'commercial') {
      // Commercial installations are not eligible for central DBT subsidy, but benefit from 40% Accelerated Depreciation tax benefits
      return 0;
    }

    if (category === 'society') {
      // Group Housing Societies (GHS) get up to ₹18,000 per kW up to 500 kW for common meters (pumps, lifts, lights)
      return Math.min(Math.round(kw * 18000), 500 * 18000);
    }

    // Residential Individual Rooftop (PM Surya Ghar scheme):
    // 1 kW: ₹30,000
    // 2 kW: ₹60,000
    // 3 kW and above: capped at ₹78,000
    if (kw < 1.0) return 0;
    if (kw < 1.8) return 30000;
    if (kw < 2.8) return 60000;
    return 78000;
  }

  /**
   * Perform comprehensive financial & technical estimation
   * @param {number} monthlyBill - User's average monthly electricity bill in INR
   * @param {string} category - 'residential' | 'society' | 'commercial'
   * @param {number} customTariff - Optional custom tariff per unit (INR)
   */
  calculate(monthlyBill, category = 'residential', customTariff = null) {
    const tariff = customTariff || this.tariffs[category] || 8.50;
    const monthlyUnitsConsumed = Math.max(20, monthlyBill / tariff);

    // In Pune, 1 kW solar generates ~125 units (kWh) per month on average (approx 4.15 kWh/kW/day across 300+ sunny days)
    const unitsPerKwPerMonth = 125;

    // Target ~85% to 92% bill offset (remaining is fixed MSEDCL connection charges and taxes)
    let rawKw = (monthlyUnitsConsumed * 0.90) / unitsPerKwPerMonth;

    // Standard installer module step-sizing
    let recommendedKw;
    if (rawKw <= 1.2) recommendedKw = 1.0;
    else if (rawKw <= 2.3) recommendedKw = 2.0;
    else if (rawKw <= 3.3) recommendedKw = 3.0;
    else if (rawKw <= 4.3) recommendedKw = 4.0;
    else if (rawKw <= 5.4) recommendedKw = 5.0;
    else if (rawKw <= 7.4) recommendedKw = 6.0;
    else if (rawKw <= 9.4) recommendedKw = 8.0;
    else if (rawKw <= 12.0) recommendedKw = 10.0;
    else recommendedKw = Math.ceil(rawKw);

    // Commercial minimum standard
    if (category === 'commercial' && recommendedKw < 5) recommendedKw = 5;

    // Rooftop area needed: ~80 to 90 sq.ft per kW with high-efficiency Mono PERC / TOPCon panels
    const roofAreaSqFt = Math.round(recommendedKw * 85);

    // Expected monthly units generated
    const monthlyUnitsGenerated = Math.round(recommendedKw * unitsPerKwPerMonth);

    // Estimated monthly bill reduction
    const actualMonthlySavings = Math.min(monthlyBill * 0.90, monthlyUnitsGenerated * tariff);
    const annualSavings = Math.round(actualMonthlySavings * 12);

    // System investment benchmarks
    const costRate = this.benchmarkCostPerKw[category] || 56000;
    const grossCost = Math.round(recommendedKw * costRate);
    const subsidy = this.calculateSubsidy(recommendedKw, category);
    const netInvestment = Math.max(0, grossCost - subsidy);

    // Estimated Payback Period in years
    const paybackYears = (netInvestment > 0 && annualSavings > 0)
      ? (netInvestment / annualSavings).toFixed(1)
      : "3.2";

    // 25-Year Cumulative Savings:
    // Factors: 3.5% conservative annual electricity tariff escalation in Maharashtra, minus 0.5% module degradation per year
    let cumulative25YearSavings = 0;
    let currentYearSavings = annualSavings;
    for (let yr = 1; yr <= 25; yr++) {
      cumulative25YearSavings += currentYearSavings;
      currentYearSavings *= (1 + 0.035 - 0.005);
    }
    const lifetimeNetBenefit = Math.max(0, Math.round(cumulative25YearSavings - netInvestment));

    // CO2 offset: ~1.2 metric tons of CO2 offset per kW capacity per year
    const co2OffsetPerYear = (recommendedKw * 1.2).toFixed(1);

    return {
      recommendedKw,
      roofAreaSqFt,
      subsidy,
      grossCost,
      netInvestment,
      monthlySavings: Math.round(actualMonthlySavings),
      annualSavings,
      lifetime25YearSavings: Math.round(cumulative25YearSavings),
      lifetimeNetBenefit,
      paybackYears: parseFloat(paybackYears),
      co2OffsetPerYear,
      monthlyUnitsGenerated,
      tariff,
      assumptions: {
        insolation: "4.15 peak sun hours/day in Pune",
        generationRate: "approx 125 units (kWh) per kW per month",
        tariffRate: `₹${tariff.toFixed(2)}/unit (MSEDCL benchmark)`,
        subsidyCaveat: "Subject to PM Surya Ghar national portal approval, DCR module verification, and MSEDCL net meter installation"
      }
    };
  }
}
