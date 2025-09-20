// Lightweight Isolation Forest implementation in TypeScript for browser usage
// Based on the original iForest paper with numeric features only.

export type FeatureVector = number[];

function randInt(max: number) {
  return Math.floor(Math.random() * max);
}

function sampleWithoutReplacement(n: number, k: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.min(k, n));
}

function harmonicNumber(n: number): number {
  // Approximation: H(n) ~ ln(n) + gamma + 1/(2n) - 1/(12n^2)
  if (n <= 0) return 0;
  const gamma = 0.5772156649015329;
  return Math.log(n) + gamma + 1 / (2 * n) - 1 / (12 * n * n);
}

function cFactor(n: number): number {
  if (n <= 1) return 1;
  return 2 * (harmonicNumber(n - 1)) - (2 * (n - 1)) / n;
}

export interface TreeNode {
  feature: number | null;
  split: number | null;
  left?: TreeNode;
  right?: TreeNode;
  size: number; // number of samples at this node (for leaves)
  external: boolean;
}

export interface IsolationForestModel {
  nTrees: number;
  sampleSize: number;
  heightLimit: number;
  trees: TreeNode[];
  featureNames: string[];
}

function columnMinMax(data: FeatureVector[], indices: number[], col: number): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  for (const i of indices) {
    const v = data[i][col];
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return null;
  return { min, max };
}

function buildTree(
  data: FeatureVector[],
  indices: number[],
  height: number,
  heightLimit: number
): TreeNode {
  if (height >= heightLimit || indices.length <= 1) {
    return { feature: null, split: null, size: indices.length, external: true };
  }

  const nFeatures = data[0]?.length || 0;
  const validFeatures: number[] = [];
  for (let f = 0; f < nFeatures; f++) {
    const mm = columnMinMax(data, indices, f);
    if (mm) validFeatures.push(f);
  }
  if (validFeatures.length === 0) {
    return { feature: null, split: null, size: indices.length, external: true };
  }

  const feature = validFeatures[randInt(validFeatures.length)];
  const mm = columnMinMax(data, indices, feature)!;
  const maxTry = 5;
  let left: number[] = [];
  let right: number[] = [];
  let split = mm.min + Math.random() * (mm.max - mm.min);
  let tries = 0;
  const partition = (s: number) => {
    left = [];
    right = [];
    for (const i of indices) {
      const v = data[i][feature];
      const val = Number.isFinite(v) ? v : s - 1; // send NaN to left deterministically
      if (val < s) left.push(i);
      else right.push(i);
    }
  };
  partition(split);
  while ((left.length === 0 || right.length === 0) && tries < maxTry) {
    split = mm.min + Math.random() * (mm.max - mm.min);
    partition(split);
    tries++;
  }
  if (left.length === 0 || right.length === 0) {
    return { feature: null, split: null, size: indices.length, external: true };
  }
  return {
    feature,
    split,
    size: indices.length,
    external: false,
    left: buildTree(data, left, height + 1, heightLimit),
    right: buildTree(data, right, height + 1, heightLimit),
  };
}

function pathLength(x: FeatureVector, node: TreeNode, current: number): number {
  if (node.external) {
    return current + cFactor(node.size);
  }
  const v = x[node.feature as number];
  const val = Number.isFinite(v) ? v : (node.split as number) - 1;
  if (val < (node.split as number)) {
    return pathLength(x, node.left as TreeNode, current + 1);
  }
  return pathLength(x, node.right as TreeNode, current + 1);
}

export class IsolationForest {
  private trees: TreeNode[] = [];
  private sampleSize: number;
  private nTrees: number;
  private heightLimit: number;
  private featureNames: string[];

  constructor(opts?: { nTrees?: number; sampleSize?: number; featureNames?: string[] }) {
    this.nTrees = opts?.nTrees ?? 100;
    this.sampleSize = opts?.sampleSize ?? 256;
    this.heightLimit = Math.ceil(Math.log2(this.sampleSize));
    this.featureNames = opts?.featureNames ?? [];
  }

  fit(data: FeatureVector[], featureNames: string[]) {
    if (!data.length) {
      this.trees = [];
      this.featureNames = featureNames;
      return;
    }
    this.featureNames = featureNames;
    const n = data.length;
    this.heightLimit = Math.ceil(Math.log2(this.sampleSize));
    this.trees = [];
    for (let t = 0; t < this.nTrees; t++) {
      const idx = sampleWithoutReplacement(n, Math.min(this.sampleSize, n));
      const root = buildTree(data, idx, 0, this.heightLimit);
      this.trees.push(root);
    }
  }

  score(x: FeatureVector): number {
    if (this.trees.length === 0) return 0;
    const c = cFactor(Math.min(this.sampleSize, Math.max(2, this.sampleSize)));
    let pathSum = 0;
    for (const tree of this.trees) {
      pathSum += pathLength(x, tree, 0);
    }
    const avgPath = pathSum / this.trees.length;
    const s = Math.pow(2, -avgPath / c);
    return s;
  }

  predict(x: FeatureVector, threshold = 0.6): { score: number; isAnomaly: boolean } {
    const score = this.score(x);
    return { score, isAnomaly: score >= threshold };
  }

  toModel(): IsolationForestModel {
    return {
      nTrees: this.nTrees,
      sampleSize: this.sampleSize,
      heightLimit: this.heightLimit,
      trees: this.trees,
      featureNames: this.featureNames,
    };
  }

  static fromModel(m: IsolationForestModel): IsolationForest {
    const forest = new IsolationForest({ nTrees: m.nTrees, sampleSize: m.sampleSize, featureNames: m.featureNames });
    (forest as any).trees = m.trees;
    (forest as any).heightLimit = m.heightLimit;
    return forest;
  }
}

export function computeMedians(data: FeatureVector[]): number[] {
  if (data.length === 0) return [];
  const d = data[0].length;
  const med: number[] = new Array(d).fill(0);
  for (let j = 0; j < d; j++) {
    const col: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const v = data[i][j];
      if (Number.isFinite(v)) col.push(v);
    }
    col.sort((a, b) => a - b);
    if (col.length === 0) med[j] = 0;
    else if (col.length % 2 === 1) med[j] = col[(col.length - 1) / 2];
    else med[j] = (col[col.length / 2 - 1] + col[col.length / 2]) / 2;
  }
  return med;
}

export function imputeWithMedians(data: FeatureVector[], medians: number[]): FeatureVector[] {
  return data.map(row => row.map((v, i) => (Number.isFinite(v) ? v : medians[i])));
}

export function extractNumericFeatures(records: any[], featureNames: string[]): FeatureVector[] {
  const out: FeatureVector[] = [];
  for (const r of records) {
    const row: number[] = [];
    for (const f of featureNames) {
      const v = (r as any)[f];
      const num = typeof v === 'number' ? v : Number.isFinite(parseFloat(v)) ? parseFloat(v) : NaN;
      row.push(num);
    }
    out.push(row);
  }
  return out;
}
