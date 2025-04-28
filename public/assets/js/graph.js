const tooltip = d3.select('#tooltip');

document.querySelector( `#query-btn` ).addEventListener( `click`, () => {
  fetch( `/graph?cypher=${document.querySelector( `#cypher-query` ).value}` )
    .then( res => res.json() )
    .then( data => {
      const svg = d3.select(`svg`),
            width = window.innerWidth,
            height = window.innerHeight;
      
      // Clear SVG stage from previous query (if any)
      svg.selectAll( `*` ).remove();

      // Create d3.js simulation with several forces
      const simulation = d3.forceSimulation( data.nodes )
        .force( `link`, d3.forceLink( data.links ).id( d => d.id ).distance( 150 ) )
        .force( `charge`, d3.forceManyBody().strength( -500 ) )
        .force( `center`, d3.forceCenter( width / 2, height / 2 ) )
        .force( `collide`, d3.forceCollide( 60 ) );

      // Create relationships (edges)
      const link = svg.append( `g` )
        .selectAll( `line` )
        .data( data.links )
        .join( `line` )
        .attr( `stroke-width`, 2 );

      // Create nodes (vertices)
      const node = svg.append( `g` )
        .selectAll( `circle` )
        .data( data.nodes )
        .join( `circle` )
        .attr( `r`, 20 )
        .attr('class', d => d.label )
        .attr('fill', d => {
          if (d.label.includes('Patient')) return '#f39c12';        // orange
          if (d.label.includes('Appointment')) return '#e74c3c';    // red
          if (d.label.includes('Condition')) return '#2ecc71';      // green
          if (d.label.includes('Neighbourhood')) return '#3498db';  // blue
          return '#7f8c8d'; // default gray
        })
          .on('mouseover', (event, d) => {
            let html = `<strong>${d.label}</strong><br/>`;
            for (let [key, val] of Object.entries(d.properties)) {
              html += `${key}: ${val}<br/>`;
            }
            tooltip.html(html).style('display', 'block');
          })
          .on('mousemove', (event) => {
            tooltip
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY + 10) + 'px');
          })
          .on('mouseleave', () => {
            tooltip.style('display', 'none');
          })
        .call( drag( simulation ) );

      // Add labels to nodes
      const label = svg.append( `g` )
        .selectAll( `text` )
        .data( data.nodes )
        .join( `text` )
        .text(d => {
          if (d.label.includes("Patient")) return `Patient: ${d.properties.patient_id}`;
          if (d.label.includes("Appointment")) return `Appt: ${d.properties.appointment_id}`;
          if (d.label.includes("Condition")) return `Condition: ${d.properties.condition_name}`;
          if (d.label.includes("Neighbourhood")) return `${d.properties.name}`;
          return d.label;
        })
        .attr( `dx`, 25 )
        .attr( `dy`, `.35em` );

      // Add relationship labels to edges
      const relLabels = svg.append(`g`)
      .selectAll(`text`)
      .data(data.links)
      .join(`text`)
      .text(d => d.type)
      .attr('font-size', '10px')
      .attr('fill', '#333');

      // Position relationship and node elements
      simulation.on( `tick`, () => {
        link
          .attr( `x1`, d => d.source.x )
          .attr( `y1`, d => d.source.y )
          .attr( `x2`, d => d.target.x )
          .attr( `y2`, d => d.target.y );

        node
          .attr( `cx`, d => d.x )
          .attr( `cy`, d => d.y );

        label
          .attr( `x`, d => d.x )
          .attr( `y`, d => d.y );

        relLabels
          .attr( `x`, d => (d.source.x + d.target.x) / 2 )
          .attr( `y`, d => (d.source.y + d.target.y) / 2 );
      });

      function drag( simulation ) {
        return d3.drag()
          .on( `start`, event => {
            if ( !event.active ) simulation.alphaTarget( 0.3 ).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
          })
          .on( `drag`, event => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
          })
          .on( `end`, event => {
            if (!event.active) simulation.alphaTarget( 0 );
            event.subject.fx = null;
            event.subject.fy = null;
          });
      }
    });
});
