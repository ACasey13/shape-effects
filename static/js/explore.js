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
        onDragEnd: function(e, datasetIndex, index, value) {
          if (JSON.stringify(myChart.data.datasets[0].data) != JSON.stringify(myChart.data.datasets[1].data)) {
            $("#b_reset_pore").removeAttr('disabled');
          }
        },
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
      if (JSON.stringify(mc.data.datasets[0].data) != JSON.stringify(mc.data.datasets[1].data)) {
        $("#b_reset_pore").removeAttr('disabled');
      }
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
    $("#b_reset_pore").attr('disabled','disabled');
});

$("#b_reset_zoom").click(function() {
    myChart.resetZoom();
    myChart.update();
    $("#b_reset_zoom").attr('disabled','disabled');
});

$("#filter").click(function() {
    var n_h = $("#nHarm").val();
    filterPore(myChart, n_h);
});
