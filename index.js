/* eslint-disable no-undef */
const express = require( `express` );
const neo4j = require( `neo4j-driver` );

const app = express();
const port = 3000;

// Connect to Neo4j
const driver = neo4j.driver(
  `bolt://localhost:7687`,
  neo4j.auth.basic( `neo4j`, `student1` )
);
// Update with your Neo4j database name:
const session = driver.session( { database: `healthcare` } ); 

app.use( express.static( `public` ) );

app.get( `/graph`, async( req, res ) => {
  try {
    const query =
      req.query.cypher ||
      `
      MATCH (p:Patient)-[r1:HAS_APPOINTMENT]->(a:Appointment)-[r2:TREATS]->(c:Condition),
      (p)-[r3:LIVES_IN]->(n:Neighbourhood)
      RETURN p, r1, a, r2, c, r3, n
      LIMIT 50
      `;
      
      console.log( `Cypher query:`, query );

      const result = await session.run( query ),
            nodesMap = new Map(),
            links = [];

    // Iterate through all records returned from Neo4j.
    // Each record corresponds to a path in Neo4j; 
    //    it can have multiple nodes and relationships
    result.records.forEach(record => {

      // Iterate through all objects (nodes and relationships) in each record
      record.keys.forEach( key => {
        const obj = record.get( key ),
              identity = obj?.identity?.toString();

        // Store the list of nodes
        if ( obj?.constructor?.name === `Node` ) {
          if ( !nodesMap.has( identity ) ) {
            nodesMap.set( identity, {
              id: identity,
              label: obj.labels.join( ` ` ),
              properties: obj.properties
            });
          }
        }
        // Store the list of relationships
        //   (including the identities of the nodes that the relationship connects)
        else if ( obj?.constructor?.name === `Relationship` ) {
          links.push( {
            source: obj.start.toString(),
            target: obj.end.toString(),
            type: obj.type
          });
        }
      });

    });

    const nodes = Array.from( nodesMap.values() );

    res.json( { nodes, links } );
  } catch ( error ) {
    console.error( `Error fetching graph data:`, error );
    res.status( 500 ).send( `Internal Server Error` );
  }
});

app.listen( port, () => {
  console.log( `Server running at http://localhost:${port}` );
});
