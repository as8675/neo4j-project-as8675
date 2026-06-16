const tooltip = d3.select('#tooltip');

const svg = d3.select(`svg`)
      .attr( `width`, window.innerWidth )
      .attr( `height`, window.innerHeight );

const width = window.innerWidth,
      height = window.innerHeight;

function runQuery( cypher ) {
  fetch( `/graph?cypher=${encodeURIComponent( cypher )}` )
    .then( res => res.json() )
    .then( data => {

      svg.selectAll( `.container` ).remove(); // Clear SVG stage from previous query (if any)
      svg.selectAll( `.legend` ).remove(); // Clear SVG stage from previous query (if any)

      const container = svg.append(`g`)
        .attr(`class`, `container`);

      const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", (event) => {
          container.attr("transform", event.transform);
        });

      svg.call(zoom);
      
      // Create d3.js simulation with several forces
      const simulation = d3.forceSimulation( data.nodes )
        .force( `link`, d3.forceLink( data.links ).id( d => d.id ).distance( 150 ) )
        .force( `charge`, d3.forceManyBody().strength( -500 ) )
        .force( `center`, d3.forceCenter( width / 2, height / 2 ) )
        .force( `collide`, d3.forceCollide( 60 ) );

      // Create relationships (edges)
      const link = container.append( `g` )
        .selectAll( `line` )
        .data( data.links )
        .join( `line` )
        .attr( `stroke-width`, 2 );

      // Create nodes (vertices)
      const node = container.append( `g` )
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
            for (let [key, val] of Object.entries(d.properties)) if (typeof val === 'object' && val.low !== undefined) {
              html += `${key}: ${val.low}<br/>`;
            } else {
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
      const label = container.append( `g` )
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
      const relLabels = container.append(`g`)
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
            event.subject._dragged = false;
          })
          .on( `drag`, event => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
            event.subject._dragged = true;
          })
          .on( `end`, event => {
            if (!event.active) simulation.alphaTarget( 0 );
            event.subject.fx = null;
            event.subject.fy = null;
          });
      }

      let selectedNode = null;

      function reset() {
        selectedNode = null;
        node.style('opacity', 1);
        link.style('opacity', 1).style('stroke', '#999');
        label.style('opacity', 1);
        relLabels.style('opacity', 1);
      }

      function highlight( d ) {
        if ( selectedNode === d ) { reset(); return; }
        selectedNode = d;

        const neighborIds = new Set([ d.id ]);
        const connectedLinks = new Set();

        data.links.forEach( l => {
          if ( l.source.id === d.id ) { neighborIds.add( l.target.id ); connectedLinks.add( l ); }
          else if ( l.target.id === d.id ) { neighborIds.add( l.source.id ); connectedLinks.add( l ); }
        });

        node.style( 'opacity', n => neighborIds.has( n.id ) ? 1 : 0.08 );
        label.style( 'opacity', n => neighborIds.has( n.id ) ? 1 : 0.08 );
        link.style( 'opacity', l => connectedLinks.has( l ) ? 1 : 0.04 )
            .style( 'stroke', l => connectedLinks.has( l ) ? '#555' : '#999' );
        relLabels.style( 'opacity', l => connectedLinks.has( l ) ? 1 : 0.04 );
      }

      node.on( 'click', ( event, d ) => {
        if ( d._dragged ) return;
        event.stopPropagation();
        highlight( d );
      });

      svg.on( 'click', reset );

      const legend = d3.select("body")
        .append("div")
        .attr("class", "legend");

        const items = [
          { label: "Patient", color: "#f39c12" },
          { label: "Appointment", color: "#e74c3c" },
          { label: "Condition", color: "#2ecc71" },
          { label: "Neighbourhood", color: "#3498db" }
        ];

        items.forEach(item => {
          const legendItem = legend.append("div");
          
          legendItem.append("span")
            .style("background-color", item.color);
        
          legendItem.append("span")
            .text(item.label);
        });
    });
}

document.querySelector( `#query-btn` ).addEventListener( `click`, () => {
  runQuery( document.querySelector( `#cypher-query` ).value );
});

document.querySelectorAll( `.preset-btn` ).forEach( btn => {
  btn.addEventListener( `click`, () => {
    const query = btn.dataset.query;
    document.querySelector( `#cypher-query` ).value = query;
    runQuery( query );
  });
});
