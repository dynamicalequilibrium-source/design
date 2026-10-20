import test from "node:test";
import assert from "node:assert/strict";
import {
  handovers,
  migrateQuestions,
  matchesQuery,
  questionMatches,
  questionStatus,
  quoteFor,
  searchTarget,
} from "../src/handover.js";

test("migration keeps existing content and never treats resolution as review", () => {
  const [q] = migrateQuestions([
    {
      id: 90,
      doc: 1,
      person: "정하늘",
      title: "기존 질문",
      body: "내용 유지",
      date: "어제",
      status: "해결됨",
      answer: "기존 답변",
    },
  ]);
  assert.equal(q.resolved, true);
  assert.equal(q.answers[0].reviewed, false);
  assert.equal(q.answers[0].body, "기존 답변");
  assert.equal(q.quote, handovers[0].quote);
  assert.equal(q.block, "procedure");
  assert.deepEqual(migrateQuestions([q]), [q]);
});
test("waiting, review and resolution filters describe separate facts", () => {
  const q = {
    person: "정하늘",
    resolved: false,
    answers: [{ reviewed: false }],
  };
  assert.equal(questionMatches(q, "검토 필요"), true);
  assert.equal(questionMatches(q, "답변 대기"), false);
  assert.equal(questionStatus(q), "답변 있음");
  const resolved = { ...q, resolved: true };
  assert.equal(questionMatches(resolved, "검토 필요"), true);
  assert.equal(questionMatches(resolved, "해결됨"), true);
  assert.equal(questionStatus(resolved), "해결됨");
});
test("search includes answer content and navigates to its actual conversation", () => {
  const questions = migrateQuestions();
  assert.equal(matchesQuery(handovers[2], "회계 연도", questions), true);
  assert.equal(matchesQuery(handovers[0], "회계 연도", questions), false);
  assert.deepEqual(searchTarget(handovers[2], "회계 연도", questions), {
    block: "procedure",
    thread: 3,
  });
  assert.deepEqual(searchTarget(handovers[0], "보조사업", questions), {});
});
test("body search navigates to the relevant section and preserves distinct context", () => {
  assert.deepEqual(searchTarget(handovers[0], "10월25일", []), {
    block: "schedule",
  });
  assert.notEqual(
    quoteFor(handovers[0], "overview"),
    quoteFor(handovers[0], "procedure"),
  );
  assert.notEqual(
    quoteFor(handovers[0], "procedure"),
    quoteFor(handovers[1], "procedure"),
  );
  assert.equal(quoteFor(handovers[0], "sources"), handovers[0].files[0]);
});
test("unknown legacy document does not create a broken conversation", () => {
  assert.deepEqual(migrateQuestions([null, { doc: 999 }]), []);
});
