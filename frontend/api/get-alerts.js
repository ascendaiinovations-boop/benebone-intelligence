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

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { factory } = req.body;

  if (!factory || !MOS_THRESHOLDS[factory]) {
    return res.status(400).json({ error: "Invalid factory" });
  }

  const threshold = MOS_THRESHOLDS[factory];
  const prodField = PRODUCTION_FIELDS[factory];

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

  return res.status(200).json({
    factory,
    threshold,
    count: alertSkus.length,
    skus: alertSkus,
  });
}
