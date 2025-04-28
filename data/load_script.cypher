// Create Constraints (like chronic_illness indexes)
CREATE CONSTRAINT FOR (p:Patient) REQUIRE p.patient_id IS UNIQUE;
CREATE CONSTRAINT FOR (a:Appointment) REQUIRE a.appointment_id IS UNIQUE;
CREATE CONSTRAINT FOR (c:Condition) REQUIRE c.condition_name IS UNIQUE;
CREATE CONSTRAINT FOR (n:Neighbourhood) REQUIRE n.name IS UNIQUE;

// Create Condition Nodes (static, like animals.psv)
MERGE (:Condition {condition_name: 'Hypertension'});
MERGE (:Condition {condition_name: 'Diabetes'});
MERGE (:Condition {condition_name: 'Alcoholism'});
MERGE (:Condition {condition_name: 'Handicap'});

:auto LOAD CSV WITH HEADERS FROM 'file:///healthcare_noshows.csv' AS line
CALL {
    WITH line
    MERGE (p:Patient {patient_id: line.PatientId})
    SET p.age = toInteger(line.Age),
        p.gender = line.Gender
    MERGE (a:Appointment {appointment_id: line.AppointmentID})
    SET a.sms_received = line.SMS_received = 'TRUE',
        a.showed_up = line.Showed_up = 'TRUE'
    MERGE (n:Neighbourhood {name: line.Neighbourhood})
    CREATE (p)-[:HAS_APPOINTMENT]->(a)
    CREATE (p)-[:LIVES_IN]->(n)
    CREATE (a)-[:LOCATED_IN]->(n)
} IN TRANSACTIONS OF 10000 ROWS;

// Load DIAGNOSED_WITH and TREATS for Hypertension
:auto LOAD CSV WITH HEADERS FROM 'file:///healthcare_noshows.csv' AS line
WITH line
WHERE line.Hypertension = 'TRUE'
CALL {
    WITH line
    MATCH (p:Patient {patient_id: line.PatientId})
    MATCH (a:Appointment {appointment_id: line.AppointmentID})
    MATCH (c:Condition {condition_name: 'Hypertension'})
    CREATE (p)-[:DIAGNOSED_WITH]->(c)
    CREATE (a)-[:TREATS]->(c)
} IN TRANSACTIONS OF 10000 ROWS;

// Load DIAGNOSED_WITH and TREATS for Diabetes
:auto LOAD CSV WITH HEADERS FROM 'file:///healthcare_noshows.csv' AS line
WITH line
WHERE line.Diabetes = 'TRUE'
CALL {
    WITH line
    MATCH (p:Patient {patient_id: line.PatientId})
    MATCH (a:Appointment {appointment_id: line.AppointmentID})
    MATCH (c:Condition {condition_name: 'Diabetes'})
    CREATE (p)-[:DIAGNOSED_WITH]->(c)
    CREATE (a)-[:TREATS]->(c)
} IN TRANSACTIONS OF 10000 ROWS;

// Load DIAGNOSED_WITH and TREATS for Alcoholism
:auto LOAD CSV WITH HEADERS FROM 'file:///healthcare_noshows.csv' AS line
WITH line
WHERE line.Alcoholism = 'TRUE'
CALL {
    WITH line
    MATCH (p:Patient {patient_id: line.PatientId})
    MATCH (a:Appointment {appointment_id: line.AppointmentID})
    MATCH (c:Condition {condition_name: 'Alcoholism'})
    CREATE (p)-[:DIAGNOSED_WITH]->(c)
    CREATE (a)-[:TREATS]->(c)
} IN TRANSACTIONS OF 10000 ROWS;


// Load DIAGNOSED_WITH and TREATS for Handicap
:auto LOAD CSV WITH HEADERS FROM 'file:///healthcare_noshows.csv' AS line
WITH line
WHERE line.Handcap = 'TRUE'
LIMIT 20000
CALL {
    WITH line
    MATCH (p:Patient {patient_id: line.PatientId})
    MATCH (a:Appointment {appointment_id: line.AppointmentID})
    MATCH (c:Condition {condition_name: 'Handicap'})
    CREATE (p)-[:DIAGNOSED_WITH]->(c)
    CREATE (a)-[:TREATS]->(c)
} IN TRANSACTIONS OF 10000 ROWS;