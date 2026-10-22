import fs from 'fs';
import path from 'path';
import { dal } from '../db/dal';
import { calculationService } from './calculationService';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const REPORTS_DIR = path.resolve(
  isServerless ? '/tmp' : process.cwd(),
  '.data',
  'reports'
);

function ensureReportsDir() {
  try {
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[PDF] Could not create reports directory:', err);
  }
}

export interface ReportGenerationParams {
  organizationId: string;
  reportType: 'Annual Sustainability Report' | 'Carbon Emissions Report' | 'Energy Consumption Report' | 'ESG Performance Report' | 'Waste Management Report';
  reportingPeriod: string;
  generatedBy: string;
  startDate?: string;
  endDate?: string;
}

export const pdfService = {
  async generateReport(params: ReportGenerationParams): Promise<{ reportId: string; filePath: string; fileName: string; summary: any }> {
    ensureReportsDir();

    const org = await dal.findOrganizationById(params.organizationId);
    const orgName = org?.name || 'EcoVerde Global Corp';
    const currency = org?.reportingCurrency || 'USD';

    // Fetch live records for the organization
    const [energyRecords, emissionRecords, wasteRecords, esgMetrics, goals] = await Promise.all([
      dal.findEnergyRecords({ organizationId: params.organizationId, startDate: params.startDate, endDate: params.endDate }),
      dal.findEmissionRecords({ organizationId: params.organizationId, startDate: params.startDate, endDate: params.endDate }),
      dal.findWasteRecords({ organizationId: params.organizationId, startDate: params.startDate, endDate: params.endDate }),
      dal.findESGMetrics(params.organizationId),
      dal.findGoals(params.organizationId)
    ]);

    // Calculate KPI figures
    const totalEnergyKWh = energyRecords.reduce((sum, r) => sum + calculationService.toStandardKWh(r.consumption, r.unit), 0);
    const totalEnergyCost = energyRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

    const totalEmissionsKg = emissionRecords.reduce((sum, r) => sum + (r.emissionsKgCO2e || 0), 0);
    const totalEmissionsTCO2e = Math.round((totalEmissionsKg / 1000) * 100) / 100;

    const scope1Kg = emissionRecords.filter(r => r.scope === 'Scope 1').reduce((s, r) => s + r.emissionsKgCO2e, 0);
    const scope2Kg = emissionRecords.filter(r => r.scope === 'Scope 2').reduce((s, r) => s + r.emissionsKgCO2e, 0);
    const scope3Kg = emissionRecords.filter(r => r.scope === 'Scope 3').reduce((s, r) => s + r.emissionsKgCO2e, 0);

    const totalWasteKg = wasteRecords.reduce((s, r) => s + (r.totalWasteKg || 0), 0);
    const recycledWasteKg = wasteRecords.reduce((s, r) => s + (r.recycledWasteKg || 0), 0);
    const disposedWasteKg = wasteRecords.reduce((s, r) => s + (r.disposedWasteKg || 0), 0);
    const recyclingRate = calculationService.calculateRecyclingRate(recycledWasteKg, totalWasteKg);

    const latestESG = esgMetrics[0] || {
      environmentalScore: 0,
      socialScore: 0,
      governanceScore: 0,
      overallScore: 0,
      methodologyVersion: 'EcoTrack ESG Index v1.0'
    };

    const summary = {
      totalEnergyKWh: Math.round(totalEnergyKWh),
      totalEnergyCost: Math.round(totalEnergyCost),
      totalEmissionsTCO2e,
      scope1TCO2e: Math.round((scope1Kg / 1000) * 100) / 100,
      scope2TCO2e: Math.round((scope2Kg / 1000) * 100) / 100,
      scope3TCO2e: Math.round((scope3Kg / 1000) * 100) / 100,
      totalWasteKg: Math.round(totalWasteKg),
      recyclingRate,
      overallESGScore: latestESG.overallScore,
      activeGoalsCount: goals.filter(g => g.status === 'In Progress').length
    };

    // Prepare PDF file details
    const timestamp = Date.now();
    const safeType = params.reportType.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `${safeType}_${params.reportingPeriod}_${timestamp}.pdf`;
    const filePath = path.resolve(REPORTS_DIR, fileName);

    // Create PDF document using PDFKit dynamically
    const { default: PDFDocument } = await import('pdfkit');
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // --- Header Brand & Meta ---
      doc.rect(40, 40, 515, 60).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(18).text('ECOTRACK SUSTAINABILITY REPORT', 55, 52, { characterSpacing: 1 });
      doc.fontSize(10).fillColor('#10b981').text(params.reportType.toUpperCase(), 55, 75);
      doc.fillColor('#94a3b8').fontSize(9).text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })} | Period: ${params.reportingPeriod}`, 280, 75, { align: 'right' });

      doc.moveDown(4);

      // --- Organization Details ---
      doc.fillColor('#0f172a').fontSize(14).text(orgName, 40, 115);
      doc.fillColor('#64748b').fontSize(9).text(`Industry: ${org?.industry || 'Manufacturing'}  ·  Location: ${org?.location || 'Global Operations'}  ·  Currency: ${currency}`, 40, 133);

      doc.moveTo(40, 150).lineTo(555, 150).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // --- Key Executive Metrics Grid ---
      doc.fillColor('#0f172a').fontSize(11).text('EXECUTIVE SUSTAINABILITY SUMMARY', 40, 165);

      const boxY = 185;
      const boxW = 120;
      const boxH = 50;

      // Card 1: Energy
      doc.rect(40, boxY, boxW, boxH).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#64748b').fontSize(8).text('TOTAL ENERGY', 50, boxY + 8);
      doc.fillColor('#0f172a').fontSize(13).text(`${summary.totalEnergyKWh.toLocaleString()} kWh`, 50, boxY + 22);

      // Card 2: Carbon
      doc.rect(170, boxY, boxW, boxH).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#64748b').fontSize(8).text('CARBON EMISSIONS', 180, boxY + 8);
      doc.fillColor('#0f172a').fontSize(13).text(`${summary.totalEmissionsTCO2e} tCO2e`, 180, boxY + 22);

      // Card 3: Recycling
      doc.rect(300, boxY, boxW, boxH).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#64748b').fontSize(8).text('RECYCLING RATE', 310, boxY + 8);
      doc.fillColor('#0f172a').fontSize(13).text(`${summary.recyclingRate}%`, 310, boxY + 22);

      // Card 4: ESG
      doc.rect(430, boxY, boxW, boxH).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor('#64748b').fontSize(8).text('OVERALL ESG SCORE', 440, boxY + 8);
      doc.fillColor('#0f172a').fontSize(13).text(`${summary.overallESGScore} / 100`, 440, boxY + 22);

      let currentY = 250;

      // --- Carbon Emissions Scope Breakdown ---
      if (['Annual Sustainability Report', 'Carbon Emissions Report'].includes(params.reportType)) {
        doc.fillColor('#0f172a').fontSize(11).text('1. GREENHOUSE GAS EMISSIONS BY SCOPE', 40, currentY);
        currentY += 16;

        doc.fillColor('#475569').fontSize(9).text('Measured in metric tons of carbon dioxide equivalent (tCO2e) adhering to the GHG Protocol Corporate Standard:', 40, currentY);
        currentY += 16;

        // Table Header
        doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
        doc.fillColor('#334155').fontSize(8).text('GHG SCOPE', 50, currentY + 6);
        doc.text('DESCRIPTION', 140, currentY + 6);
        doc.text('RECORDS', 360, currentY + 6);
        doc.text('EMISSIONS (tCO2e)', 440, currentY + 6, { align: 'right' });
        currentY += 22;

        const scopeRows = [
          { scope: 'Scope 1 (Direct)', desc: 'Natural gas combustion, vehicle fleet fuel', count: emissionRecords.filter(r => r.scope === 'Scope 1').length, t: summary.scope1TCO2e },
          { scope: 'Scope 2 (Indirect)', desc: 'Purchased electricity and steam', count: emissionRecords.filter(r => r.scope === 'Scope 2').length, t: summary.scope2TCO2e },
          { scope: 'Scope 3 (Value Chain)', desc: 'Business travel, logistics & procurement', count: emissionRecords.filter(r => r.scope === 'Scope 3').length, t: summary.scope3TCO2e }
        ];

        for (const row of scopeRows) {
          doc.fillColor('#1e293b').fontSize(8).text(row.scope, 50, currentY);
          doc.fillColor('#64748b').text(row.desc, 140, currentY);
          doc.text(String(row.count), 370, currentY);
          doc.fillColor('#0f172a').text(`${row.t.toFixed(2)} tCO2e`, 440, currentY, { align: 'right' });
          currentY += 16;
        }

        doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor('#e2e8f0').stroke();
        currentY += 18;
      }

      // --- Energy Management Section ---
      if (['Annual Sustainability Report', 'Energy Consumption Report'].includes(params.reportType)) {
        doc.fillColor('#0f172a').fontSize(11).text('2. ENERGY CONSUMPTION & EXPENDITURE', 40, currentY);
        currentY += 16;

        // Table Header
        doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
        doc.fillColor('#334155').fontSize(8).text('ENERGY TYPE', 50, currentY + 6);
        doc.text('FACILITY', 160, currentY + 6);
        doc.text('CONSUMPTION', 310, currentY + 6);
        doc.text(`COST (${currency})`, 440, currentY + 6, { align: 'right' });
        currentY += 22;

        const sampleRecords = energyRecords.slice(0, 5);
        for (const rec of sampleRecords) {
          doc.fillColor('#1e293b').fontSize(8).text(rec.energyType, 50, currentY);
          doc.fillColor('#64748b').text(rec.facility, 160, currentY);
          doc.text(`${rec.consumption.toLocaleString()} ${rec.unit}`, 310, currentY);
          doc.fillColor('#0f172a').text(`$${rec.cost.toLocaleString()}`, 440, currentY, { align: 'right' });
          currentY += 15;
        }

        if (energyRecords.length > 5) {
          doc.fillColor('#94a3b8').fontSize(8).text(`... and ${energyRecords.length - 5} additional logged records`, 50, currentY);
          currentY += 14;
        }

        currentY += 10;
      }

      // --- Waste Management Section ---
      if (['Annual Sustainability Report', 'Waste Management Report'].includes(params.reportType)) {
        doc.fillColor('#0f172a').fontSize(11).text('3. WASTE DIVERSION & CIRCULARITY', 40, currentY);
        currentY += 16;

        doc.fillColor('#475569').fontSize(8).text(
          `Total waste logged: ${summary.totalWasteKg.toLocaleString()} kg | Recycled: ${Math.round(recycledWasteKg).toLocaleString()} kg | Disposed to Landfill: ${Math.round(disposedWasteKg).toLocaleString()} kg | Achieved Diversion Rate: ${summary.recyclingRate}%`,
          40,
          currentY
        );
        currentY += 24;
      }

      // --- ESG Pillars & Targets ---
      if (['Annual Sustainability Report', 'ESG Performance Report'].includes(params.reportType)) {
        doc.fillColor('#0f172a').fontSize(11).text('4. ESG PILLARS & ACTIVE TARGET PROGRESS', 40, currentY);
        currentY += 16;

        doc.fillColor('#475569').fontSize(8).text(
          `Environmental Pillar: ${latestESG.environmentalScore}/100  ·  Social Pillar: ${latestESG.socialScore}/100  ·  Governance Pillar: ${latestESG.governanceScore}/100  ·  Overall: ${latestESG.overallScore}/100 (${latestESG.methodologyVersion})`,
          40,
          currentY
        );
        currentY += 16;

        // Goals list
        for (const g of goals.slice(0, 3)) {
          const progress = calculationService.calculateGoalProgress(g.metricType, g.baselineValue, g.currentValue, g.targetValue);
          doc.fillColor('#1e293b').fontSize(8).text(`• ${g.title}: ${progress.percentage}% progress (${g.currentValue} ${g.unit} / Target: ${g.targetValue} ${g.unit})`, 50, currentY);
          currentY += 14;
        }
      }

      // --- Methodology & Disclaimer Footer ---
      doc.moveDown(2);
      const footerY = 740;
      doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#e2e8f0').stroke();
      doc.fillColor('#94a3b8').fontSize(7).text(
        'Methodology: Emissions calculated using EPA GHG Hub 2024 & UK DEFRA conversion factors (kgCO2e = Activity × Factor). Energy converted to standardized kWh. Waste diversion: (Recycled / Total) × 100. This report was generated automatically by EcoTrack ESG Platform.',
        40,
        footerY + 10,
        { width: 515, align: 'justify' }
      );

      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });

    const fileStat = fs.statSync(filePath);

    // Persist Report metadata in DB
    const reportRecord = await dal.createReport({
      organizationId: params.organizationId,
      reportType: params.reportType,
      reportingPeriod: params.reportingPeriod,
      generatedBy: params.generatedBy,
      fileName,
      status: 'Completed',
      summary,
      fileSize: fileStat.size,
      filePath
    });

    return {
      reportId: reportRecord._id || reportRecord.id,
      filePath,
      fileName,
      summary
    };
  }
};
