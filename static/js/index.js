import * as charting from './charting.js';
import * as utils from './utils.js';

$( document ).ready(function() {
var ctx = document.getElementById('myChart').getContext('2d');

var labels = ['', '']
var extent = [1.790438802777571947e-05 * 10**4,
              3.472830731025012679e-05 * 10**4];

var myChart = charting.createChart(ctx, extent[1], $("#b_reset_zoom"));

utils.getDefaultData(myChart, $('#actual'), labels);

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

$("#b_reset_pore").click(function() {
    myChart.data.datasets[0].data = JSON.parse(JSON.stringify(myChart.data.datasets[1].data));
    myChart.update();
    $('#rotation').val(0);
    $('#rf').text(labels[0]);
    $("#actual").text(labels[1]);
});

$("#b_reset_zoom").click(function() {
    myChart.resetZoom();
    myChart.update();
    $("#b_reset_zoom").attr('disabled','disabled');
});

$("#b_filter").click(function() {
    var n_h = $("#nHarm").val();
    utils.filterPore(myChart, n_h);
});

$("#b_rescale").click(function(){
  utils.normalizeShape(myChart);
});

$("#b_predict").click(function() {
  console.log('predict button hit!');
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    if (xhr.status === 200){
        var data = JSON.parse(xhr.response);
        $('#rf').text(data['rf']);
        $('#actual').text('----');
    }
  }
  xhr.open('POST', '/pred_default', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify({"data":myChart.data.datasets[0].data}));
});

var global_rotation=0;
$("#rotation").on('input', function() {
    var deg = $(this).val();
    if (deg==''){deg = 0;}
    if (!isNaN(+deg) && isFinite(deg)){
    var shift = deg-global_rotation;
    global_rotation += shift;
    var rad = shift * Math.PI / 180.;
    var m1 = [[Math.cos(rad), -Math.sin(rad)],
              [Math.sin(rad), Math.cos(rad)]];
    var m2 = utils.dataToArray(myChart.data.datasets[0].data);
    var rotated = utils.arrayToData(utils.multiplyMatrices(m1, m2));
    myChart.data.datasets[0].data = rotated;
    myChart.update(0);
    }
});

});
