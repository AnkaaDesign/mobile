import { MEASURE_UNIT, MEASURE_TYPE, MEASURE_UNIT_LABELS, MEASURE_TYPE_LABELS } from '../constants';
import { getMeasureUnitCategory, convertValue, canConvertUnits, getUnitsInCategory, MEASURE_CATEGORIES } from '../types';

export interface MeasureFormData {
  value: number;
  unit: MEASURE_UNIT;
  measureType: MEASURE_TYPE;
}

export interface ConversionOption {
  unit: MEASURE_UNIT;
  value: number | null;
  label: string;
  isRecommended?: boolean;
}

export interface MeasureValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a single measure entry
 */
export function validateMeasure(measure: Partial<MeasureFormData>): MeasureValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!measure.value || measure.value <= 0) {
    errors.push("Valor da medida deve ser maior que zero");
  }

  if (!measure.unit) {
    errors.push("Unidade de medida é obrigatória");
  }

  if (!measure.measureType) {
    errors.push("Tipo de medida é obrigatório");
  }

  // Logical validation
  if (measure.unit && measure.measureType) {
    const unitCategory = getMeasureUnitCategory(measure.unit);
    const expectedCategory = measure.measureType.toLowerCase();

    if (unitCategory.toLowerCase() !== expectedCategory) {
      errors.push(`Unidade ${MEASURE_UNIT_LABELS[measure.unit]} não é compatível com o tipo ${MEASURE_TYPE_LABELS[measure.measureType]}`);
    }
  }

  // Value range warnings
  if (measure.value && measure.value > 1000000) {
    warnings.push("Valor muito alto - verifique se está correto");
  }

  if (measure.value && measure.value < 0.001) {
    warnings.push("Valor muito baixo - considere usar uma unidade menor");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates an array of measures for duplicates and compatibility
 */
export function validateMeasures(measures: MeasureFormData[]): MeasureValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Individual measure validation
  measures.forEach((measure, index) => {
    const result = validateMeasure(measure);
    errors.push(...result.errors.map((error) => `Medida ${index + 1}: ${error}`));
    warnings.push(...result.warnings.map((warning) => `Medida ${index + 1}: ${warning}`));
  });

  // Check for duplicate measure types
  const measureTypes = measures.map((m) => m.measureType);
  const duplicateTypes = measureTypes.filter((type, index) => measureTypes.indexOf(type) !== index);

  if (duplicateTypes.length > 0) {
    const uniqueDuplicates = [...new Set(duplicateTypes)];
    errors.push(`Tipos de medida duplicados: ${uniqueDuplicates.map((type) => MEASURE_TYPE_LABELS[type]).join(", ")}`);
  }

  // Check for conflicting units of the same type
  const typeGroups = measures.reduce(
    (acc, measure) => {
      if (!acc[measure.measureType]) {
        acc[measure.measureType] = [];
      }
      acc[measure.measureType].push(measure);
      return acc;
    },
    {} as Record<MEASURE_TYPE, MeasureFormData[]>,
  );

  Object.entries(typeGroups).forEach(([type, typeMeasures]) => {
    if (typeMeasures.length > 1) {
      // Multiple measures of same type - check if they can be consolidated
      const units = typeMeasures.map((m) => m.unit);
      const canAllConvert = units.every((unit) => units.every((otherUnit) => unit === otherUnit || canConvertUnits(unit, otherUnit)));

      if (canAllConvert) {
        warnings.push(`Múltiplas medidas do tipo ${MEASURE_TYPE_LABELS[type as MEASURE_TYPE]} podem ser consolidadas`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets available conversion options for a measure
 */
export function getConversionOptions(measure: MeasureFormData, maxOptions: number = 5): ConversionOption[] {
  const category = getMeasureUnitCategory(measure.unit);
  const compatibleUnits = getUnitsInCategory(category).filter((unit) => unit !== measure.unit && canConvertUnits(measure.unit, unit));

  const conversions = compatibleUnits
    .map((unit) => {
      const convertedValue = convertValue(measure.value, measure.unit, unit);
      return {
        unit,
        value: convertedValue,
        label: MEASURE_UNIT_LABELS[unit] || unit,
        isRecommended: isRecommendedConversion(measure.unit, unit, convertedValue || 0),
      };
    })
    .filter((conversion) => conversion.value !== null);

  // Sort by recommendation and then by converted value
  conversions.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return (a.value || 0) - (b.value || 0);
  });

  return conversions.slice(0, maxOptions);
}

/**
 * Determines if a conversion is recommended (results in a "nice" number)
 */
function isRecommendedConversion(fromUnit: MEASURE_UNIT, toUnit: MEASURE_UNIT, convertedValue: number): boolean {
  // Recommend conversions that result in numbers between 1-1000
  if (convertedValue >= 1 && convertedValue <= 1000) {
    return true;
  }

  // Recommend common conversions
  const commonConversions = [
    [MEASURE_UNIT.GRAM, MEASURE_UNIT.KILOGRAM],
    [MEASURE_UNIT.MILLILITER, MEASURE_UNIT.LITER],
    [MEASURE_UNIT.MILLIMETER, MEASURE_UNIT.CENTIMETER],
    [MEASURE_UNIT.CENTIMETER, MEASURE_UNIT.METER],
    [MEASURE_UNIT.UNIT, MEASURE_UNIT.DOZEN],
    [MEASURE_UNIT.UNIT, MEASURE_UNIT.HUNDRED],
  ];

  return commonConversions.some(([from, to]) => (fromUnit === from && toUnit === to) || (fromUnit === to && toUnit === from));
}

/**
 * Formats a measure value with appropriate decimal places
 */
export function formatMeasureValue(value: number, unit: MEASURE_UNIT): string {
  const category = getMeasureUnitCategory(unit);

  // Different formatting based on measure category
  switch (category) {
    case MEASURE_CATEGORIES.WEIGHT:
    case MEASURE_CATEGORIES.VOLUME:
      // Use up to 3 decimal places for weight/volume
      return value.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      });

    case MEASURE_CATEGORIES.LENGTH:
      // Use up to 2 decimal places for length
      return value.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });

    case MEASURE_CATEGORIES.COUNT:
    case MEASURE_CATEGORIES.PACKAGING:
      // No decimal places for count/packaging
      return Math.round(value).toLocaleString("pt-BR");

    default:
      return value.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
      });
  }
}

/**
 * Gets the primary measure from an array of measures (best for display)
 */
export function getPrimaryMeasure(measures: MeasureFormData[]): MeasureFormData | null {
  if (!measures.length) return null;

  // Priority order for primary measure
  const typePriority = [MEASURE_TYPE.WEIGHT, MEASURE_TYPE.VOLUME, MEASURE_TYPE.LENGTH, MEASURE_TYPE.COUNT, MEASURE_TYPE.AREA];

  // Find first measure by priority
  for (const type of typePriority) {
    const measure = measures.find((m) => m.measureType === type);
    if (measure) return measure;
  }

  // Fall back to first measure
  return measures[0];
}

/**
 * Suggests optimal unit for a given value and measure type
 */
export function suggestOptimalUnit(value: number, measureType: MEASURE_TYPE): MEASURE_UNIT {
  const category = measureType.toLowerCase();
  const availableUnits = getUnitsInCategory(Object.values(MEASURE_CATEGORIES).find((cat) => cat.toLowerCase() === category) || MEASURE_CATEGORIES.COUNT);

  // Find unit that results in a value between 1-1000
  for (const unit of availableUnits) {
    const testConversion = convertValue(value, availableUnits[0], unit);
    if (testConversion && testConversion >= 1 && testConversion <= 1000) {
      return unit;
    }
  }

  // Fall back to base unit
  return availableUnits[0];
}

/**
 * Checks if measures contain enough information for inventory tracking
 */
export function validateInventoryMeasures(measures: MeasureFormData[]): MeasureValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if we have at least one countable measure
  const hasCountableMeasure = measures.some(
    (m) => m.measureType === MEASURE_TYPE.COUNT || getMeasureUnitCategory(m.unit) === MEASURE_CATEGORIES.COUNT || getMeasureUnitCategory(m.unit) === MEASURE_CATEGORIES.PACKAGING,
  );

  if (!hasCountableMeasure) {
    warnings.push("Considere adicionar uma medida de contagem para facilitar o controle de estoque");
  }

  // Check for very precise measurements that might be impractical
  measures.forEach((measure, index) => {
    if (measure.value > 0 && measure.value < 1) {
      if (getMeasureUnitCategory(measure.unit) === MEASURE_CATEGORIES.COUNT) {
        errors.push(`Medida ${index + 1}: Não é possível ter frações de unidades contáveis`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
