import { jsPDF } from "jspdf";
import { Table } from "@jspdf/plugin-table";
jsPDF.plugin.autotable;
import { INVENTORY_DATA } from "./inventory-data.js";

const MOS_THRESHOLDS = {
  AIM: 1.5,
  Midbury: 2.0,
  LTM: 2.0,
  "201": 2.0,
  Bennett: 2.0,
  DMG: 2.0,
  Coltoys: 2.0,
  "Loving Pets": 2.0,
};

const PRODUCTION_FIELDS = {
  AIM: "aimProduction",
  Midbury: "midburyProduction",
  LTM: "ltmProduction",
  "201": "grupoProduction",
  Bennett: "bennettProduction",
  DMG: "dmgProduction",
  Coltoys: "coltoysProduction",
  "Loving Pets": "lovingPetsProduction",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { factory } = req.body;

  if (!factory || !MOS_THRESHOLDS[factory]) {
    return res.status(400).json({ error: "Invalid factory" });
  }

  const threshold = MOS_THRESHOLDS[factory];
  const prodField = PRODUCTION_FIELDS[factory];

  // Filter SKUs
  const alertSkus = INVENTORY_DATA.filter((sku) => {
    if (!sku.factoryFlag || !sku.factoryFlag[factory]) return false;
    // KEY: exclude exact MOS=0, include everything 0 < MOS <= threshold
    if (
      sku.mos === undefined ||
      sku.mos === null ||
      sku.mos <= 0 ||
      sku.mos > threshold
    )
      return false;
    if (!sku.plannedProdEaches || sku.plannedProdEaches <= 0) return false;
    if (sku.exclude === "X") return false;
    const factoryProd = sku[prodField] || 0;
    return factoryProd > 0;
  }).sort((a, b) => a.mos - b.mos);

  if (alertSkus.length === 0) {
    return res.status(200).json({
      message: `No SKUs on alert for ${factory} at threshold ${threshold}`,
      skus: [],
    });
  }

  // Build Word document using Docx
  const Docx = require("docx");
  const {
    Document,
    Paragraph,
    Table: DocxTable,
    TableCell,
    TableRow,
    WidthType,
    AlignmentType,
    BorderStyle,
  } = Docx;

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph("SKU")],
          width: { size: 15, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph("Description")],
          width: { size: 35, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph("On Hand")],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph("Available")],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph("Avg Monthly Sales")],
          width: { size: 12, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph("MOS")],
          width: { size: 8, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph("Amt to SS")],
          width: { size: 10, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
  ];

  alertSkus.forEach((sku) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(sku.sku)],
          }),
          new TableCell({
            children: [new Paragraph(sku.description || "")],
          }),
          new TableCell({
            children: [new Paragraph(String(sku.onHand))],
          }),
          new TableCell({
            children: [new Paragraph(sku.available.toFixed(0))],
          }),
          new TableCell({
            children: [new Paragraph(sku.avgMonthlySales.toFixed(0))],
          }),
          new TableCell({
            children: [new Paragraph(sku.mos.toFixed(2))],
          }),
          new TableCell({
            children: [new Paragraph(sku.amtToSS.toFixed(0))],
          }),
        ],
      })
    );
  });

  const table = new DocxTable({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: `Weekly Low SKU Alert - ${factory}`,
            bold: true,
            size: 28,
          }),
          new Paragraph({
            text: `Generated: ${new Date().toISOString().split("T")[0]}`,
            size: 20,
          }),
          new Paragraph(""),
          table,
        ],
      },
    ],
  });

  const buffer = await Docx.Packer.toBuffer(doc);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Benebone_Alert_${factory}_${new Date()
      .toISOString()
      .split("T")[0]}.docx"`
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );

  return res.status(200).send(buffer);
}
