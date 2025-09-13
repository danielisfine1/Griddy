import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lutDir = path.join(__dirname, "public/lut");

const allLuts = fs
    .readdirSync(lutDir)
    .filter((f) => f.endsWith(".cube"))
    .map((f) => f.replace(".cube", ""));

const numeric = allLuts
    .filter((f) => !isNaN(Number(f)))
    .map((f) => ({ raw: f, num: Number(f) }))
    .sort((a, b) => a.num - b.num)
    .map((entry) => entry.raw);

const nonNumeric = allLuts.filter((f) => isNaN(Number(f)));

const sorted = [...numeric, ...nonNumeric];

const lutTypes = sorted.map((n) => `  | "${n}"`).join("\n");

function makeName(value) {
    return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

const lutOptions = [
    `  { name: "None", value: null }`,
    ...sorted.map((v) => `  { name: "${makeName(v)}", value: "${v}" }`),
].join(",\n");

const out = `export type LUT =
${lutTypes}
  | null;

export interface LUTOption {
  name: string;
  value: LUT;
};

export const options: LUTOption[] = [
${lutOptions}
];
`;

fs.writeFileSync(
    path.join(__dirname, "./src/components/editor/luts.ts"),
    out
);
