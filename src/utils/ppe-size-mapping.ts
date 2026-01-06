import type { Item, Measure } from '../types';
import { PPE_SIZE, MEASURE_TYPE } from '../constants';

/**
 * Helper utilities for working with PPE sizes stored in the measures array.
 * PPE sizes are now stored as measures with measureType: "SIZE" and unit: [PPE_SIZE_VALUE]
 */

/**
 * Extract PPE size from item's measures array
 * Returns the size value from the first SIZE measure found
 */
export function getItemPpeSize(item: Item): string | null {
  if (!item.measures || item.measures.length === 0) {
    return null;
  }

  const sizeMeasure = item.measures.find(m => m.measureType === MEASURE_TYPE.SIZE);
  return sizeMeasure?.unit || null;
}

/**
 * Check if item has specific PPE size
 */
export function itemHasPpeSize(item: Item, size: string): boolean {
  const itemSize = getItemPpeSize(item);
  return itemSize === size;
}

/**
 * Filter items by PPE size
 */
export function filterItemsByPpeSize(items: Item[], size: string): Item[] {
  return items.filter(item => itemHasPpeSize(item, size));
}

/**
 * Get all items that have a PPE size (any SIZE measure)
 */
export function filterItemsWithPpeSize(items: Item[]): Item[] {
  return items.filter(item => getItemPpeSize(item) !== null);
}

/**
 * Group items by their PPE size
 */
export function groupItemsByPpeSize(items: Item[]): Record<string, Item[]> {
  const groups: Record<string, Item[]> = {};

  items.forEach(item => {
    const size = getItemPpeSize(item);
    if (size) {
      if (!groups[size]) {
        groups[size] = [];
      }
      groups[size].push(item);
    }
  });

  return groups;
}

/**
 * Create a measure object for PPE size
 * This can be used when creating or updating items
 */
export function createPpeSizeMeasure(size: string): Omit<Measure, 'id' | 'itemId' | 'createdAt' | 'updatedAt'> {
  return {
    measureType: MEASURE_TYPE.SIZE,
    unit: size as MEASURE_UNIT | null, // Size is stored in the unit field
    value: null, // No numeric value for SIZE measures
  };
}

/**
 * Update or add PPE size measure to an item's measures array
 * Returns a new measures array with the size measure updated/added
 */
export function updateItemPpeSize(item: Item, newSize: string): Measure[] {
  const currentMeasures = item.measures || [];
  const nonSizeMeasures = currentMeasures.filter(m => m.measureType !== MEASURE_TYPE.SIZE);

  return [
    ...nonSizeMeasures,
    createPpeSizeMeasure(newSize) as Measure,
  ];
}

/**
 * Remove PPE size measure from an item's measures array
 * Returns a new measures array without the SIZE measure
 */
export function removeItemPpeSize(item: Item): Measure[] {
  const currentMeasures = item.measures || [];
  return currentMeasures.filter(m => m.measureType !== MEASURE_TYPE.SIZE);
}

/**
 * Check if a measure is a PPE size measure
 */
export function isSizeMeasure(measure: Measure): boolean {
  return measure.measureType === MEASURE_TYPE.SIZE;
}

/**
 * Validate if a size value is a valid PPE size
 */
export function isValidPpeSize(size: string): boolean {
  return Object.values(PPE_SIZE).includes(size as PPE_SIZE);
}
