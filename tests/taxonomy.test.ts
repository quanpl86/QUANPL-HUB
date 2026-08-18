import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveTags,
  pickExistingCategory,
  scoreCategory,
  slugifyTaxonomy,
  type CategoryRow,
} from "../src/lib/content/taxonomy.ts";

const CATS: CategoryRow[] = [
  { id: 3, name: "STEM Education", slug: "stem-education" },
  { id: 4, name: "Artificial Intelligence", slug: "artificial-intelligence" },
  { id: 5, name: "Robotics & Hardware", slug: "robotics-hardware" },
];

test("matches existing category by exact name", () => {
  const picked = pickExistingCategory(CATS, {
    category: "STEM Education",
    haystack: "stem education",
  });
  assert.equal(picked?.category.id, 3);
  assert.equal(picked?.score, 100);
});

test("matches existing category by id", () => {
  const picked = pickExistingCategory(CATS, {
    category_id: "4",
    haystack: "",
  });
  assert.equal(picked?.category.slug, "artificial-intelligence");
});

test("infers STEM Education from preschool teaching haystack", () => {
  const picked = pickExistingCategory(CATS, {
    haystack: "ai va game hoa trong hoc tap cho giao vien mam non hoc lieu",
  });
  assert.ok(picked);
  assert.equal(picked?.category.slug, "stem-education");
});

test("slugify taxonomy strips vietnamese", () => {
  assert.equal(slugifyTaxonomy("Giáo dục mầm non"), "giao-duc-mam-non");
});

test("derive tags from seo when tags omitted", () => {
  const tags = deriveTags({
    seo: {
      primary_keyword: "AI mầm non",
      secondary_keywords: ["game hóa", "học liệu"],
      semantic_entities: ["UNESCO"],
    },
  });
  assert.ok(tags.includes("AI mầm non"));
  assert.ok(tags.includes("game hóa"));
});

test("stem score beats robotics for classroom pedagogy", () => {
  const haystack = "giao vien mam non pbl 5e hoc lieu bai hoc";
  const stem = scoreCategory(CATS[0], haystack);
  const robot = scoreCategory(CATS[2], haystack);
  assert.ok(stem > robot);
});
