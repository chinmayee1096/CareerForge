import CodingProblem from "../models/CodingProblem.js";
import { codingProblemCatalog } from "../utils/codingProblemCatalog.js";

let initialized = false;

export const ensureCodingCatalog = async () => {
  if (initialized) return;

  const ops = codingProblemCatalog.map((problem) => ({
    updateOne: {
      filter: { slug: problem.slug },
      update: { $set: problem },
      upsert: true
    }
  }));

  if (ops.length) await CodingProblem.bulkWrite(ops);
  initialized = true;
};
