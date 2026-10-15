import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function relativeLuminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
  const light = Math.max(relativeLuminance(first), relativeLuminance(second));
  const dark = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (light + 0.05) / (dark + 0.05);
}

function customProperty(css, name) {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{3,6})`, "i"));
  assert.ok(match, `Expected ${name} to be declared`);
  const value = match[1];
  return value.length === 4
    ? `#${value.slice(1).split("").map((digit) => digit.repeat(2)).join("")}`
    : value;
}

test("focus indicator contrasts with adjacent light surfaces", async () => {
  const css = await readFile(new URL("../app/styles.css", import.meta.url), "utf8");
  const focusRing = customProperty(css, "--focus-ring");

  assert.ok(contrastRatio(focusRing, "#ffffff") >= 3);
  assert.ok(contrastRatio(focusRing, "#eef2f7") >= 3);
  assert.match(css, /outline:\s*3px solid var\(--focus-ring\)/);
});

test("focus halo separates colored buttons from the outer ring", async () => {
  const css = await readFile(new URL("../app/styles.css", import.meta.url), "utf8");
  const focusHalo = customProperty(css, "--focus-halo");

  assert.ok(contrastRatio(focusHalo, "#2457c5") >= 3);
  assert.ok(contrastRatio(focusHalo, "#a61b1b") >= 3);
  assert.match(css, /box-shadow:\s*0 0 0 2px var\(--focus-halo\)/);
});
