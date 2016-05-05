var margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var parseDate = d3.time.format("%Y").parse;

var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

var color = d3.scale.category10();

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
    .interpolate("basis")
    .defined(function(d){
      
      if (d.gpa) { return d.gpa;}
      //return d.gpa != null && d.gpa != undefined && d.gpa !== 0 && d.gpa
    })
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.gpa); });

    //this is the change I made for the defined 

var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var labels = {
  "MU" : "Mizzou",
  "Alabama" : "Alabma",
  "Auburn" : "Auburn",
  "Florida" : "Florida",
  "Georgia" : "Georgia",
  "Kentucky" : "Kentucky",
  "SC" : "South Carolina",
  "Vanderbilt" : "Vanderbilt",
  "LSU" : "LSU",
  "Texas A&M" : "Texas A&M",
  "Arkansas" : "Arkansas",


}

d3.tsv("js/data - fixed georgia, rounded 2.tsv", function(error, data) {

  if (error) throw error;

  color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

  console.log(data);

  data.forEach(function(d) {
    console.log(d);
    d.date = parseDate(d.date);
  });

  var schools = color.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {date: d.date, 
                gpa: +d[name], 
                name: labels[name]};
      })
    };
  });

  x.domain(d3.extent(data, function(d) { return d.date; }));

  y.domain([2.4,
    d3.max(schools, function(c) { return d3.max(c.values, function(v) { return v.gpa; }); })
  ]);

   svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    // .append("text")
    //   .attr("transform", "rotate(-90)")
    //   .attr("y", 6)
    //   .attr("dy", ".71em")
    //   .style("text-anchor", "end")
    //   .text("gpa (ºF)");

  var school = svg.selectAll(".school")
      .data(schools)
    .enter().append("g")
      .attr("class", "school");

  school.append("path")
      .attr("class", "line")
      .attr("name", function(d) {
        return d.name;
      })
      .attr("d", function(d) {return line(d.values); })
      .style("stroke", function(d) { return color(d.name); });




  school.append("text")
      .datum(function(d) {

        //This is a little tricky. The line label in the blocks example assumes
        // the data is consistent, and that the last value of each array will be a number.
        // The last value of the array determines our x/y coordinate (date and gpa).
        // Our arrays are all the same length, but they don't all have a value for gpa.
        // So, here's a trick. We'll iterate backwards through the array with a loop and stop
        // when we encounter a value. i=28... i=27... i=26... etc.
        // The test:
        // `if (d.values[i].gpa)`  
        // It may not look like a test, but it is.
        // We're basically saying if d.values[i].gpa is a value, use it as our key. 
        var key = d.values.length - 1;
        for (i = key; i > 0; i--) {
          if (d.values[i].gpa) {
            key = i;
            break;
          }
        }

        return {name: d.name, value: d.values[key]};
      })
      .attr("transform", function(d) {
        return "translate(" + x(d.value.date) + "," + y(d.value.gpa) + ")";
      })
      .attr("x", 3)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });


    /* --------------- */
    /* This is the tooltip logic. */
    // For each value in our data, we're adding a dot to the page.
    // In our css, we'll set the .dot to opacity : 0, which makes it invisible.
    // It is, however, still something we can mouseover.
    // So each line has an invisible chain of dots representing each value.
    // When we mouseover it, we'll do 4 things:
    // 1) Make the dot visible.
    // 2) Get the date, place name, and rate for that data point
    // 3) Append those values to the tooltip.
    // 4) Show the tooltip.
    
    // We'll also use a `mousemove` listener to position our dots.
    // And a `mouseout` listener to hide the tooltip and the dot.

    school.selectAll(".dot")
        .data(function(d) {
          //The `city` selection already holds the data for our three lines.
          //So we'll use it to draw our dots. The value for each array of dots
          //will be the array of values attached to each line:
            return d.values;
        })
        .enter().append("circle") //Add a new circle for each data point in the array.
        .attr("class", "dot")
        .attr("cx", function(d) {
            return x(d.date); //Position accordingly.
        })
        .attr("cy", function(d) {
            return y(d.gpa); //Position accordingly.
        })
        .attr("r", 5)
        .on("mouseover", function(d) {

            //We're using the Moment.js library to get a month and year for our tooltip.
            //We're using Moment.js because our dates are in the js date format.
            var displayDate = moment(d.date).format("Y");
            var displayGPA = d.gpa+" GPA";
           

            //Append the values to the tooltip with some markup.
            $(".tt").html(
              "<div class='name'>"+d.name+"</div>"+
              "<div class='date'>"+displayDate+": </div>"+
              "<div class='gpa'>"+displayGPA+"</div>"
            )

            //Show the tooltip.
            $(".tt").show();

            //Make the dot visible.
            d3.select(this).style("opacity", 1);
            
        })
        .on("mousemove", function(d) {

            //Get the mouse position relative to the .chart div.
            //Add the margin.left and margin.top values to make the div set properly in the .chart.
            //Add 10px to each so the tooltip is offset appropriately.
            var xPos = d3.mouse(this)[0] + margin.left + 10;
            var yPos = d3.mouse(this)[1] + margin.top + 10;

            //Use jQuery to position the .tt div with the .chart div.
            //See the CSS for important style info here. 
            $(".tt").css({
                "left": xPos + "px",
                "top": yPos + "px"
            })

        })
        .on("mouseout", function(d) {
            //Turn this dot's opacity back to 0
            //And hide the tooltip.
            d3.select(this).style("opacity", 0);
            $(".tt").hide();
        })


});