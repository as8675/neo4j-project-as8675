# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

```bash
npm install        # first-time setup
node index.js      # start server at http://localhost:3000
```

No build step — static assets in `public/` are served directly by Express.

## Neo4j Prerequisites

The server connects to a local Neo4j instance:
- **Bolt URL:** `bolt://localhost:7687`
- **Credentials:** `neo4j` / `student1` (hardcoded in [index.js](index.js))
- **Database name:** `healthcare`

Before starting the server, Neo4j Desktop must be running with a database named `healthcare` that has been loaded via [data/load_script.cypher](data/load_script.cypher).

To load data into Neo4j: open Neo4j Browser, copy the contents of `data/load_script.cypher`, and run each block. The CSV file must be placed in Neo4j's `import/` directory first (`data/healthcare_noshows.csv`).

## Linting

```bash
npx eslint .
```

No test suite exists (`npm test` exits with an error by design).

## Architecture

This is a single-route Express server with a vanilla JS + D3.js frontend — no framework, no bundler.

**Request flow:**
1. Browser loads `public/index.html` (served as static)
2. User types a Cypher query and clicks "Run Query"
3. `public/assets/js/graph.js` sends `GET /graph?cypher=<query>` to the server
4. `index.js` runs the Cypher against Neo4j using `neo4j-driver`, then transforms the results into `{ nodes, links }` — each node gets `{ id, label, properties }`, each relationship gets `{ source, target, type }`
5. The browser receives JSON and D3.js renders a force-directed graph

**Graph schema (Neo4j):**

| Node | Key property |
|---|---|
| `Patient` | `patient_id`, `age`, `gender` |
| `Appointment` | `appointment_id`, `sms_received`, `showed_up` |
| `Condition` | `condition_name` (Hypertension, Diabetes, Alcoholism, Handicap) |
| `Neighbourhood` | `name` |

| Relationship | From → To |
|---|---|
| `HAS_APPOINTMENT` | Patient → Appointment |
| `LIVES_IN` | Patient → Neighbourhood |
| `LOCATED_IN` | Appointment → Neighbourhood |
| `DIAGNOSED_WITH` | Patient → Condition |
| `TREATS` | Appointment → Condition |

**Neo4j integer handling:** Neo4j integers come back as `{ low, high }` objects. [graph.js](public/assets/js/graph.js):59 checks `val.low !== undefined` to handle this when building tooltip HTML.

**Node coloring** is hardcoded by label in [graph.js](public/assets/js/graph.js):51-55 — Patient (orange), Appointment (red), Condition (green), Neighbourhood (blue).
