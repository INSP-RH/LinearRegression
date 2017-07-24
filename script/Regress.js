// Set the dimensions and margins of the diagram
var margin = { top: 20, right: 30, bottom: 30, left: 20 },
    canvas = {
        width:  500 - margin.left - margin.right,
        height: 500 - margin.top  - margin.bottom,
        max: { "x": 10, "y": 10 },
        min: { "x": -10, "y": -10 },
        clicks: 0,
        radius: 5,
        color: "red",
        factor: NaN
    };

document.getElementById("borrar").onclick = function() {
    window.location.reload();
}


//Delete point when pressing sup or delete
document.addEventListener('keydown', function(e) {
    if (e.keyCode == 8 || e.keyCode == 46) {
        if (data.length > 0) {
            canvas.clicks -= 1;
            data.pop();
            drawCanvas(data);
        }
    }
}, false);

//Reset document on load
function startload() {

    //Create dafault canvas
    data =  [];
    drawCanvas(data);
}


//Add svg element to contain regress    
var svg = d3.select("#regress").append("svg")
    .attr("width", canvas.width + margin.left + margin.right)
    .attr("height", canvas.height + margin.top + margin.bottom)
    .attr("id", "knnpoints")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add tooltip
var div = d3.select("body").append("div")
    .attr("class", "tooltip well")
    .style("opacity", 0);

// Add tooltip
var div2 = d3.select("body").append("div")
    .attr("class", "tooltip2 well")
    .style("opacity", 0);

var div3 = d3.select("body").append("div")
    .attr("class", "tooltip2 well")
    .style("opacity", 0);

//Function for drawing data
function drawCanvas(data) {

    //Remove class
    removeElementsByClass("svgobject");

    //Create canvas axis
    var Xscale = d3.scaleLinear()
        .range([0, canvas.width])
        .domain([canvas.min.x, canvas.max.x]);

    var Yscale = d3.scaleLinear()
        .range([canvas.height, 0])
        .domain([canvas.min.y, canvas.max.y]);

    svg.append("g")
        .attr("class", "x axis svgobject")
        .attr("transform", "translate(0," + Yscale(0) + ")")
        .call(d3.axisBottom(Xscale));

    svg.append("g")
        .attr("class", "y axis svgobject")
        .attr("transform", "translate(" + Xscale(0) + ",0 )")
        .call(d3.axisLeft(Yscale));

    //Plot points on data
    var figure = svg.selectAll("dot")
        .data(data)
        .enter().append("circle");

    //Add attributes to plotted points
    figure.attr("cx", function(d) { return Xscale(d.x); })
            .attr("cy", function(d) { return Yscale(d.y); })
            .attr("class", "mydot svgobject ")
            .style("fill", canvas.color)
            .on("mouseover", function(d) {
                div.transition()
                    .duration(200)
                    .style("opacity", 1);
                div.text("(" + Math.round(100 * d.x) / 100 + "," + Math.round(100 * d.y) / 100 + ")")
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
                div.style("background-color", d.color);
            })
            .on("mouseout", function(d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .attr("r", canvas.radius);

    //Add line if more than 2 points
    if(data.length >= 2){
      drawline(data, Xscale, Yscale);
    } 

    //Add point on click
    svg.on("click", function(e) {

        //Cound added point 
        canvas.clicks += 1;

        //Get coordinates (pixels)
        var coords = d3.mouse(this);
        var myclick = {
            "x": Xscale.invert(coords[0]),
            "y": Yscale.invert(coords[1])
        };

        data.push({
            "x": myclick.x,
            "y": myclick.y,
            "color": canvas.color,
        });

        //Re-draw plot
        drawCanvas(data);  
    });  

};

//On start create random data set
document.body.onload = function() {
    startload()
}

//Remove objects 
//http://stackoverflow.com/questions/4777077/removing-elements-by-class-name
function removeElementsByClass(className) {
    var elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}

//Function for drawing lsq line
function drawline(data,  Xscale, Yscale){

  var lsCoef = LeastSquares(data);

  var lineFunction = d3.line()
  .x(function(d) { return d.x; })
  .y(function(d) { return d.y; })
  .curve(d3.curveLinear);
  
  svg.append('path')
     .attr("stroke-width", 2)
     .attr("class", "svgobject")
     .attr("stroke", "black")
     .attr('d', lineFunction([{"x": Xscale(canvas.min.x) , "y": Yscale(lsCoef.a + lsCoef.b*canvas.min.x)},
                              {"x": Xscale(0) , "y": Yscale(lsCoef.a)},
                              {"x": Xscale(-lsCoef.a/lsCoef.b) , "y": Yscale(0)},
                              {"x": Xscale(canvas.max.x), "y": Yscale(lsCoef.a + lsCoef.b*canvas.max.x) }]));


}

//Least squares function
function LeastSquares(data) {
    var xbar = 0;
    var ybar = 0;
    var lcount = 1;
    
    if (data.length <= 1) {
        return [ [], [] ];
    } else {

        for (var j = 0; j < data.length; j++) {
            lcount ++;
            xbar += data[j].x/data.length;
            ybar += data[j].y/data.length; 
        }

       svals = sxsy(data, xbar, ybar);
       

        var b = svals.Sxy/svals.Sxx;
        var a = ybar - b*xbar;

        return {'b': b, 'a': a, 'xbar': xbar, 'ybar': ybar, 'Sxx': svals.Sxx, 'Sxy': svals.Sxy};
    }
}

function sxsy(data, xbar, ybar){

    var Sxx = 0;
    var Sxy = 0;
    var Syy = 0;

    for (var k = 0; k < data.length; k++) {
        Sxx += Math.pow(data[k].x - xbar, 2);
        Syy += Math.pow(data[k].y - ybar, 2);
        Sxy += (data[k].x - xbar)*(data[k].y - ybar);
    }  

    var sexy = {'Sxx': Sxx, 'Sxy': Sxy, 'Syy': Syy}

    return sexy;

}
