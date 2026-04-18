import natural from "natural";

const tokenizer = new natural.WordTokenizer();
const STOP_WORDS = new Set(natural.stopwords ?? []);
const SIMILARITY_THRESHOLD = 0.18;

const normalizeTokens = (text) =>
  tokenizer
    .tokenize((text ?? "").toLowerCase())
    .filter((token) => /^[a-z0-9%]+$/.test(token))
    .filter((token) => token.length > 2)
    .filter((token) => !STOP_WORDS.has(token));

const buildVector = (tfidf, index) => {
  const vector = new Map();
  const terms = tfidf.listTerms(index);
  for (const term of terms) {
    vector.set(term.term, term.tfidf);
  }
  return vector;
};

const cosineSimilarity = (left, right) => {
  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  let dotProduct = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (const value of left.values()) {
    leftNorm += value * value;
  }

  for (const value of right.values()) {
    rightNorm += value * value;
  }

  for (const [term, value] of left.entries()) {
    dotProduct += value * (right.get(term) ?? 0);
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
};

const toTitleCase = (value) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const buildSuggestedClusters = (complaints) => {
  const docs = complaints.map((item) => ({
    id: item.id,
    tokens: normalizeTokens(item.description),
  }));

  const tfidf = new natural.TfIdf();
  for (const doc of docs) {
    tfidf.addDocument(doc.tokens.join(" "));
  }

  const vectors = docs.map((_doc, index) => buildVector(tfidf, index));
  const adjacency = docs.map(() => new Set());

  for (let i = 0; i < docs.length; i += 1) {
    for (let j = i + 1; j < docs.length; j += 1) {
      const score = cosineSimilarity(vectors[i], vectors[j]);
      if (score >= SIMILARITY_THRESHOLD) {
        adjacency[i].add(j);
        adjacency[j].add(i);
      }
    }
  }

  const visited = new Set();
  const groups = [];

  for (let i = 0; i < docs.length; i += 1) {
    if (visited.has(i)) {
      continue;
    }

    const stack = [i];
    const group = [];

    while (stack.length > 0) {
      const current = stack.pop();
      if (visited.has(current)) {
        continue;
      }

      visited.add(current);
      group.push(current);

      for (const neighbor of adjacency[current]) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }

    if (group.length > 1) {
      groups.push(group);
    }
  }

  return groups.map((group) => {
    const ids = group.map((index) => docs[index].id);

    const keywordCounts = new Map();
    for (const index of group) {
      for (const token of docs[index].tokens) {
        keywordCounts.set(token, (keywordCounts.get(token) ?? 0) + 1);
      }
    }

    const topKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term]) => term);

    const suggestedLabel = topKeywords.length > 0
      ? toTitleCase(topKeywords.slice(0, 2).join(" "))
      : "Complaint Pattern";

    return {
      suggested_label: suggestedLabel,
      complaint_ids: ids,
      top_keywords: topKeywords,
    };
  });
};
