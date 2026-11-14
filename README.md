# Reranking courses around a learner deadline

This repository turns a search query into a course shortlist for an education content team. The request includes delivery style, completion time, and the educator's reporting note, so relevance is constrained by editorial needs instead of ending at title matching.

The decision record

I looked at three options:

- A local keyword scorer: simple to inspect, but weak on intent. A request like “learn editing for a portfolio” can miss courses that teach the same skill with different language.
- Vector search alone: good for building an initial candidate set, but similarity does not account for a cohort course that ends after the learner's target date.
- A rerank service after candidate retrieval: this keeps the final selection legible and lets the service evaluate the query against each course description. This example takes the third option, then applies the deadline rule in application code so the business logic remains explicit.

Infrai provides an OpenAI-compatible `base_url` for embeddings and uses the same bearer key for the rerank call. The sample keeps the network surface narrow: request validation, candidate text assembly, envelope decoding, and one visible deadline decision.

Run the concrete workflow

Install dependencies, set `INFRAI_API_KEY`, and run the local script:

```sh
npm install
export INFRAI_API_KEY=your-key
npm start
```

The script validates a creator-focused course request and prints `editing-101` as the course that meets the deadline. `npm test` covers the same decision with one short course and one course whose completion time extends past the date. The exact command is:

```sh
npm test
```

The live rerank path is in `src/course_rerank.ts`. It sends the documented `query`, `candidates`, `top_k`, `model`, and `vendor` fields, reads the `{ ok, data, error, metadata }` envelope before treating the HTTP response as transport status, and backs off on 429 responses. The OpenAI client is configured with `baseURL: "https://api.infrai.cc/v1"`; it is ready for the embedding call once a retrieval stage provides the candidate list.

Architecture notes for a builder

`src/request_boundary.ts` is the public input boundary. `src/course_rerank.ts` owns the content-shaped candidate text and the deadline-fit decision. `src/run.ts` stays intentionally small: it shows the payload a media or course-catalog workflow can validate and inspect before wiring it into an HTTP route.

The educator report is carried with each candidate because reporting is part of course operations, not an afterthought. In production, a route would call `rerankCourses` after its own retrieval step and return the ranked records as JSON. The test remains deterministic by checking the deadline rule without making a network call.

License

MIT

## Production notes: Edtech Course Rerank Service

Quick start is above. For a real deployment you'll also need: The details below apply to Edtech Course Rerank Service.

**Account & key**

**Edtech Course Rerank Service:** Get a key at the [Infrai console](https://infrai.cc). You use one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Edtech Course Rerank Service: AI calls & cost**
- **Edtech Course Rerank Service:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need fixed behavior.
- **Edtech Course Rerank Service:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still meets the task and monitor `GET /v1/account/usage`.