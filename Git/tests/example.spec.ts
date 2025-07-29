import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

 // Basic addition function
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function version
const addArrow = (a: number, b: number): number => a + b;

// Function with multiple parameters (variadic)
function addMultiple(...numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

// Generic addition function that works with different numeric types
function addGeneric<T extends number | bigint>(a: T, b: T): T {
  return (a as any) + (b as any);
}

// Addition with optional parameters and default values
function addWithDefaults(a: number, b: number = 0, c: number = 0): number {
  return a + b + c;
}

// Examples of usage:
console.log(add(5, 3)); // 8
console.log(addArrow(10, 20)); // 30
console.log(addMultiple(1, 2, 3, 4, 5)); // 15
console.log(addGeneric(100n, 200n)); // 300n (BigInt)
console.log(addWithDefaults(5)); // 5
console.log(addWithDefaults(5, 10)); // 15
console.log(addWithDefaults(5, 10, 15)); // 30
});
