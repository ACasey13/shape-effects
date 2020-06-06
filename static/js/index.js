var ctx = document.getElementById('myChart').getContext('2d');

var extent = [1.790438802777571947e-05 * 10**4,3.472830731025012679e-05 * 10**4]
var myChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'pore shape',
            data: [],
            backgroundColor: 'rgba(62, 149, 205, 0.5)',
            borderColor: 'rgba(62, 149, 205, 0.5)',
            borderWidth: 1,
            pointHoverBackgroundColor: 'rgba(62, 149, 205, 1)',
            pointHoverRadius: 5,
            showLine: true,
            lineTension: 0,
        },
        {
            label: 'original shape',
            data: [],
            //backgroundColor: 'rgba(60, 60, 60, 0.4)',
            borderColor: 'rgba(60, 60, 60, 0.4)',
            //borderDash: [10,10],
            borderWidth: 2,
            pointRadius: 0,
            showLine: true,
            lineTension: 0,
            dragData: false,
            fill: false,
        }]
      },
    options: {
        tooltips: {enabled: false},
        responsive: true,
        dragData: true,
        dragX: true,
        onDrag: function(e, datasetIndex, index, value) {
          if (index == 0) {
            data[data.length-1] = value
          }
          if (index == data.length-1) {
            data[0] = value
          }
          // console.log(datasetIndex, index, value)
        },
        // onDragEnd: function(e, datasetIndex, index, value) {
        //   if (JSON.stringify(myChart.data.datasets[0].data) != JSON.stringify(myChart.data.datasets[1].data)) {
        //     $("#b_reset_pore").removeAttr('disabled');
        //   }
        // },
        maintainAspectRatio: true,
        scales: {
            yAxes: [{type: 'linear',
               position: 'left',
               scaleLabel: {display: true, labelString: 'height (microns)'},
                ticks: {min: -extent[1], max:extent[1], /*display: false,*/},
              gridLines: {drawTicks: true,}},
              ],
            xAxes: [{type: 'linear',
                position: 'bottom',
                scaleLabel: {display: true, labelString: 'width (microns)'},
                ticks: {min: -extent[1], max:extent[1], display: true},
               //gridLines: {drawTicks: false}
             },
                ]
        },
        plugins: {
                      zoom: {
                          pan: {
                              enabled: false,
                              mode: 'xy'
                          },
                          zoom: {
                              enabled: true,
                              mode: 'xy',
                              onZoomComplete: function(){
                                $("#b_reset_zoom").removeAttr('disabled');
                              }
                          }
                      }
                  },
  }
});

(function() {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    if (xhr.status === 200){
        data = JSON.parse(xhr.response)
        myChart.data.datasets[0].data = data
        myChart.data.datasets[1].data = JSON.parse(JSON.stringify(data));
        myChart.update(0)
    }
  }
  xhr.open('GET', '/default', true)
  xhr.send(null)
}());

var grabPore = function(id, size) {
var xhr = new XMLHttpRequest();
xhr.onload = function() {
  if (xhr.status === 200){
      data = JSON.parse(xhr.response)
      myChart.data.datasets[0].data = data
      myChart.data.datasets[1].data = JSON.parse(JSON.stringify(data));
      myChart.update(0)
  }
}
xhr.open('POST', '/data', true)
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
xhr.send('id='+id+'&d='+size)
}

var filterPore = function(mc, n_h) {
var xhr = new XMLHttpRequest();
xhr.onload = function() {
  if (xhr.status === 200){
      data = JSON.parse(xhr.response);
      mc.data.datasets[0].data = data;
      mc.update(0);
  }
}
xhr.open('POST', '/filter', true)
xhr.setRequestHeader('Content-Type', 'application/json')
xhr.send(JSON.stringify({"n_h": n_h,
                         "data":mc.data.datasets[1].data}))
}

$("#b_reset_pore").click(function() {
    myChart.data.datasets[0].data = JSON.parse(JSON.stringify(myChart.data.datasets[1].data));
    myChart.update();
    $('#rotation').val(0);
});

$("#b_reset_zoom").click(function() {
    myChart.resetZoom();
    myChart.update();
    $("#b_reset_zoom").attr('disabled','disabled');
});

$("#b_filter").click(function() {
    var n_h = $("#nHarm").val();
    filterPore(myChart, n_h);
});


$("#b_rescale").click(normalizeShape);

$("#b_predict").click(function() {
    var n_h = $("#nHarm").val();
    filterPore(myChart, n_h);
});

var global_rotation=0;
$("#rotation").on('input', function() {
    var deg = $(this).val();
    if (!isNaN(+deg) && isFinite(deg)){
    var shift = deg-global_rotation;
    global_rotation += shift;
    var rad = shift * Math.PI / 180.;
    var m1 = [[Math.cos(rad), -Math.sin(rad)],
              [Math.sin(rad), Math.cos(rad)]];
    var m2 = dataToArray(myChart.data.datasets[0].data);
    var rotated = arrayToData(multiplyMatrices(m1, m2));
    myChart.data.datasets[0].data = rotated;
    myChart.update(0);
    }
});

function dataToArray(pts){
    var arr = [[],[]];
    for (let i=0; i < pts.length; i++){
      x = pts[i].x;
      y = pts[i].y;
      arr[0].push(x);
      arr[1].push(y);
    }
    return arr;
}

function arrayToData(arr){
    var pts = [];
    for (let i=0; i<arr[0].length; i++){
      pts.push({'x': arr[0][i], 'y': arr[1][i]})
    }
    return pts;
}

function multiplyMatrices(m1, m2) {
    var result = [];
    for (var i = 0; i < m1.length; i++) {
        result[i] = [];
        for (var j = 0; j < m2[0].length; j++) {
            var sum = 0;
            for (var k = 0; k < m1[0].length; k++) {
                sum += m1[i][k] * m2[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

function normalizeShape(){
    //green's theorem
    //https://leancrew.com/all-this/2018/01/greens-theorem-and-section-properties/
    var s = 0;
    var sx = 0;
    var sy = 0;
    var factor;

    arr = dataToArray(myChart.data.datasets[0].data);
    for (let i=0; i<(arr[0].length-1); i++){
      factor = arr[0][i]*arr[1][i+1] - arr[0][i+1]*arr[1][i];
      s += factor;
      sx += ((arr[0][i] + arr[0][i+1]) * factor);
      sy += ((arr[1][i] + arr[1][i+1]) * factor);
    }
    var area = s/2.;
    // area, x centroid, y centroid
    var res = [area, sx/(6*area), sy/(6*area)];

    // subtract centroid from data and rescale
    var target = (300 * 10**-3 / 2)**2 * Math.PI;
    scale_factor = Math.sqrt(target/area);
    arr[0] = arr[0].map(x => (x - res[1])*scale_factor);
    arr[1] = arr[1].map(y => (y - res[2])*scale_factor) ;
    var pts = arrayToData(arr);
    myChart.data.datasets[0].data = pts;
    myChart.update(0);
}
