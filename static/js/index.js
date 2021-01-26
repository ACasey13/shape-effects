import * as charting from './charting.js';
import * as utils from './utils.js';

$( document ).ready(function() {
var sButton = $("#b_predict");
var loading = $("#loadingModels");
sButton.attr('disabled', 'disabled');
var xhr = new XMLHttpRequest();
xhr.onload = function() {
  var status = false;
  if (xhr.status === 200){
      if (JSON.parse(xhr.response)['status'] === 'True') {
        status = true;
      }
    }

      console.log('models request returned:')
      console.log(status);
      if (status) {
        sButton.removeAttr('disabled');
        loading.attr('value', 'true').html('Models Loaded! Reload?');
      }
      else {
        loading.attr('value', 'false').html('Models Failed to Load! Reload?');
      }

}
xhr.open('GET', '/models_load', true);
// xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send();

var ctx = document.getElementById('myChart').getContext('2d');

var labels = ['', '', '', '', ''];
var labelEls = [$("#rf"), $("#xgb"), $("#gp"),
                $("#cnn"), $("#actual")];
var extent = [1.790438802777571947e-05 * 10**4,
              3.472830731025012679e-05 * 10**4];

var myChart = charting.createChart(ctx, extent[1], $("#b_reset_zoom"));

utils.getDefaultData(myChart, labelEls, labels);

$("#b_reset_pore").click(function() {
    myChart.data.datasets[0].data = JSON.parse(JSON.stringify(myChart.data.datasets[1].data));
    myChart.update();
    $('#rotation').val(0);
    $('#rf').text(labels[0]);
    $('#xgb').text(labels[1]);
    $('#gp').text(labels[2]);
    $('#cnn').text(labels[3]);
    $('#actual').text(labels[4]);
    $("#nHarm").val(511);
});

$("#b_reset_zoom").click(function() {
    myChart.resetZoom();
    myChart.update();
    $("#b_reset_zoom").attr('disabled','disabled');
});

$("#b_filter").click(function() {
    var n_h = $("#nHarm").val();
    utils.filterPore(myChart, n_h, $("#b_filter"));
});

$("#b_rescale").click(function(){
  utils.normalizeShape(myChart, 300);
});

$("#b_predict").click(function() {
  var button = $("#b_predict");
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    if (xhr.status === 200){
        var data = JSON.parse(xhr.response);
        $('#rf').html(data['rf']+"<span class='blurred'>XX</span> ");
        $('#xgb').html(data['xgb']+"<span class='blurred'>XX</span> ");
        $('#gp').html(data['gp']+"<span class='blurred'>XX</span> ");
        $('#cnn').html(data['cnn']+"<span class='blurred'>XX</span> ");
        //$('#actual').text('----');
    }
    button.text('Predict').removeAttr('disabled');
  }
  const bWidth = button.width();
  console.log(bWidth);
  button.html("<span class='spinner-border spinner-border-sm text-success m-1' role='status'></span>").attr('disabled', 'disabled');
  // button.width(bWidth);
  // console.log(`success width ${button.innerWidth()}`);
  xhr.open('POST', '/pred_default', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify({"data":myChart.data.datasets[0].data,
                           "size":300}));
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
