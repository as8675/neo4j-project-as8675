# Neo4j Project - Healthcare No-Shows

## Overview

This project explores a healthcare dataset tracking patient appointment no-shows, modeled and visualized using a Neo4j graph database.  
The goal is to uncover patterns related to medical conditions, patient behavior, and neighborhood health trends through graph analysis and compelling D3.js-based visualizations.

---

## Data Choice

I selected a healthcare dataset from Kaggle focused on patient appointment no-shows. This dataset contains approximately **_100,000_** appointment records, capturing:

- Patient Info: Age, gender
- Appointment Details: Scheduled dates, SMS notifications, attendance (show/no-show)
- Medical Conditions: Hypertension, Diabetes, Alcoholism, Handicap
- Neighborhood Data: Locations of patients and appointments

This dataset is ideal for Neo4j because it’s highly interconnected—patients, appointments, conditions, and neighborhoods form a rich graph. It enables insights like how conditions affect no-shows or how health trends vary by neighborhood.

---

## Process

### Data Preparation

- **Data Cleaning:**
  - Converted string boolean values ("TRUE"/"FALSE") to Neo4j booleans.
  - Corrected typos, notably "Hipertension" → "Hypertension".
- **Constraints:**
  - Added unique constraints on key fields for better data integrity and query performance.
    - `Patient.patient_id`
    - `Appointment.appointment_id`
    - `Condition.condition_name`
    - `Neighbourhood.name`

### Database Loading

- **Node Creation:**
  - Created nodes for `Patient`, `Appointment`, `Condition`, and `Neighbourhood`.
- **Relationships Established:**
  - `(:Patient)-[:HAS_APPOINTMENT]->(:Appointment)`
  - `(:Patient)-[:LIVES_IN]->(:Neighbourhood)`
  - `(:Appointment)-[:LOCATED_IN]->(:Neighbourhood)`
  - `(:Patient)-[:DIAGNOSED_WITH]->(:Condition)`
  - `(:Appointment)-[:TREATS]->(:Condition)`
- **Batch Processing:**
  - Used `:auto` transactions with 10,000 rows per batch for memory-efficient loading.

### Challenges Addressed

- Managed large dataset with batching to avoid memory overflows.
- Handled typos and boolean inconsistencies.
- Prevented duplicate nodes via constraints.

---

## Database Volume

| Metric            | Count   |
| ----------------- | ------- |
| **Nodes**         | 167,342 |
| **Relationships** | 391,649 |

---

## Variety: Sample Queries

### 1. Patients with Conditions in a Neighborhood

```cypher
MATCH (p:Patient)-[r1:DIAGNOSED_WITH]->(c:Condition),
      (p)-[r2:LIVES_IN]->(n:Neighbourhood)
WHERE n.name = 'JARDIM DA PENHA'
RETURN p, c, n,r1, r2
LIMIT 300
```

### 2. No-Show Appointments by Condition

```cypher
MATCH (p:Patient)-[r1:HAS_APPOINTMENT]->(a:Appointment)-[r2:TREATS]->(c:Condition)
WHERE a.showed_up = false
RETURN p, a, c, r1, r2
LIMIT 300
```

### 3. No-Show Patients with Multiple Conditions, Their Appointments, and Neighborhoods

```cypher
MATCH (p:Patient)-[:DIAGNOSED_WITH]->(c:Condition)
WITH p, count(c) AS condition_count
WHERE condition_count > 1
MATCH (p)-[r1:HAS_APPOINTMENT]->(a:Appointment)
WHERE a.showed_up = false
MATCH (p)-[r2:DIAGNOSED_WITH]->(c)
MATCH (p)-[r3:LIVES_IN]->(n:Neighbourhood)
RETURN p, r1, a, r2, c, r3, n
LIMIT 1000
```

### 4. Appointment Patterns by Age Group

```cypher
MATCH (p:Patient)-[r:HAS_APPOINTMENT]->(a:Appointment)
WHERE p.age >= 60
RETURN p, a, r
LIMIT 50
```

### 5. Neighborhoods with High SMS Notifications

```cypher
MATCH (a:Appointment)-[r:LOCATED_IN]->(n:Neighbourhood)
WHERE a.sms_received = true
RETURN a, n, r
LIMIT 500
```

## Bells and Whistles

### Enhanced Visualization

- Added a **legend** to the D3.js graph showing node types (`Patient`, `Appointment`, `Condition`, `Neighbourhood`) with distinct color coding.
- Implemented **tooltips** that display key node properties on hover, such as:
  - Patient Age
  - Condition Name
  - Appointment Date
- Displayed **relationship labels** like `HAS_APPOINTMENT`, `DIAGNOSED_WITH`, and `LOCATED_IN` to clarify graph connections.

### Improved User Interface

- Styled the query input box and button with:
  - A **modern blue theme** for aesthetic consistency
  - **Rounded corners** and **subtle shadows** for a sleek, modern look
- Fixed the position of the legend and tooltips to make the graph **more readable** and **less cluttered** during exploration.

### Optimized Performance

- Enforced **unique constraints** on nodes (`Patient`, `Appointment`, `Condition`, `Neighbourhood`) to:
  - Prevent duplicates
  - Improve load and query performance
- Used **batch processing** (`:auto` with 10,000 rows) in Cypher to handle large data ingestion efficiently without memory overflow.

### Robust Data Handling

- Corrected typographical errors (e.g., mapped "Handcap" → "Handicap").
- Converted boolean string values ("TRUE"/"FALSE") into Neo4j booleans.
- Limited the loading of **Handicap** condition entries to 20,000 rows to balance data completeness and database performance.

## What I'm Most Proud Of

The **visualization improvements** are what set this project apart.  
By integrating an interactive **legend**, **tooltips** on hover, and **relationship labels**, the graph becomes highly **intuitive**, **informative**, and **easy to navigate** for users.

Combined with:

- Efficient and scalable data ingestion
- Careful data cleaning and modeling
- A polished, user-friendly interface

this project achieves both **technical robustness** and **excellent user experience**.  
These enhancements together deliver a **professional-quality** data science and visualization solution.
