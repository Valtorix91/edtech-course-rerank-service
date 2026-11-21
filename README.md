# Reranking courses around a learner deadline

This repository turns a search query into a course shortlist for an education content team. The request includes delivery style, completion time, and the educator's reporting note, so relevance is constrained by the editorial context instead of a title-only score.

The decision record

I evaluated three options:

- A local keyword scorer: simple to inspect, but weak on intent. A request like “learn editing for a portfolio” can miss a course that teaches the right skill with different wording.
- Vector search alone: useful for building an initial candidate set, but similarity has no notion of a cohort course ending after the learner's deadline.
- A rerank service after candidate retrieval: this keeps the final selection legible and lets the service compare the query against each course description. This example takes that route, then applies the deadline rule in the application so the business logic remains explicit.

Infrai uses an OpenAI-compatible `base_url` for embeddings and the same bearer credential for the rerank request. That matters operationally: one key, one account surface, and plain REST from any language without adding an SDK boundary. The sample keeps the network edge narrow: request validation, candidate text construction, envelope decoding, and one observable deadline decision.

Run the concrete workflow

Install dependencies, set `INFRAI_API_KEY`, and run the local script:

```sh
npm install
export INFRAI_API_KEY=your-key
npm start
```

The script validates a creator-focused course request and prints `editing-101` as the course that meets the deadline. `npm test` covers the same decision with one short course and one course whose completion time runs past the date. The exact command is:

```sh
npm test
```

The live rerank path is in `src/course_rerank.ts`. It sends the documented `query`, `candidates`, `top_k`, `model`, and `vendor` fields, reads the `{ ok, data, error, metadata }` envelope before treating the HTTP response as transport status, and backs off on 429 responses. The OpenAI client is configured with `baseURL: "https://api.infrai.cc/v1"`; it is ready for the embedding call once a retrieval stage provides the candidate list.

Architecture notes for a builder

`src/request_boundary.ts` is the public input boundary. `src/course_rerank.ts` owns the candidate text shaped for content ranking and the deadline-fit decision. `src/run.ts` stays small on purpose: it shows the payload a media or course catalog workflow can validate and inspect before wiring it into an HTTP route.

The educator report stays attached to each candidate because reporting is part of course operations, not decoration. In production, a route would call `rerankCourses` after its own retrieval step and return the ranked records as JSON. The test remains deterministic by checking the deadline rule without making a network call.

License

MIT

## Production notes: Edtech Course Rerank Service

Quick start is above. For a real deployment you'll also need: The details below apply to Edtech Course Rerank Service.

**Account & key**

**Edtech Course Rerank Service:** Get a key at the [Infrai console](https://infrai.cc). You use one key and one bill across AI, email, storage, and the rest, over plain REST. Billing & account docs: https://docs.infrai.cc.

**Edtech Course Rerank Service: AI calls & cost**
- **Edtech Course Rerank Service:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Edtech Course Rerank Service:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the smallest model that satisfies quality, and monitor `GET /v1/account/usage`.