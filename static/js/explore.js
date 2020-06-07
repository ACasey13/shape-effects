import * as charting from './charting.js';
import * as utils from './utils.js';

$( document ).ready(function() {
var ctx = document.getElementById('myChart').getContext('2d');

var labels = ['', '', '', '', ''];
var labelEls = [$("#rf"), $("#xgb"), $("#gp"),
                $("#cnn"), $("#actual")];
var extent = [1.790438802777571947e-05 * 10**4,
              3.472830731025012679e-05 * 10**4];
var upperLim = [6152];

var myChart = charting.createChart(ctx, extent[1], $("#b_reset_zoom"));

utils.getDefaultData(myChart, labelEls, labels);

var grabPore = function(id, size) {
var xhr = new XMLHttpRequest();
xhr.onload = function() {
  if (xhr.status === 200){
    var data = JSON.parse(xhr.response);
    if (data['msg']) {
      $('#info').html('<b>Error:</b> '+data['msg']);
      $('#info').removeAttr("hidden");
      return;
    }
    myChart.data.datasets[0].data = data['path'];
    myChart.data.datasets[1].data = JSON.parse(JSON.stringify(data['path']));

    $('#rotation').val(0);
    $("#nHarm").val(511);
      for (let i=0; i<5; i++){
      labels[i] = data['labels'][i];
      labelEls[i].text(data['labels'][i]);
    }
      myChart.data.datasets[1].label = 'original ' + data['set'];

      myChart.update(0);
  }
}
xhr.open('POST', '/data', true);
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
xhr.send('id='+id+'&d='+size);
}

$('input[type=radio][name=sizeselect]').change(function() {
    if (this.value == '300') {
        $('#poreID').attr('placeholder','1-6152');
        myChart.options.scales.yAxes[0].ticks['min'] = -extent[1];
        myChart.options.scales.yAxes[0].ticks['max'] =  extent[1];
        myChart.options.scales.xAxes[0].ticks['min'] = -extent[1];
        myChart.options.scales.xAxes[0].ticks['max'] =  extent[1];
        myChart.data.datasets[0].data = [];
        myChart.data.datasets[1].data = [];
        myChart.update(0);
        upperLim[0] = 6152;
        $('#info').attr("hidden", "hidden");
    }
    else if (this.value == '150') {
        $('#poreID').attr('placeholder','1-6285');
        myChart.options.scales.yAxes[0].ticks['min'] = -extent[0];
        myChart.options.scales.yAxes[0].ticks['max'] =  extent[0];
        myChart.options.scales.xAxes[0].ticks['min'] = -extent[0];
        myChart.options.scales.xAxes[0].ticks['max'] =  extent[0];
        myChart.data.datasets[0].data = [];
        myChart.data.datasets[1].data = [];
        myChart.update(0);
        upperLim[0] = 6285;
        $('#info').attr("hidden", "hidden");
    }
});

$('#b_fetch').click(function(){
   var size = $('input[type=radio][name=sizeselect]:checked').val();
   var id = $('#poreID').val();
   $('#info').attr("hidden", "hidden");
   $('#rotation').val(0);
   $("#nHarm").val(511);
   if (id < 1 || id > upperLim[0]){
     $('#info').html('<b>Invalid Pore ID:</b> For this pore size, pore ID must be between 1 and '+upperLim[0]+'.');
     $('#info').removeAttr("hidden");
     return;
   }
   grabPore(id, size);
});

$('#poreID').on('input', function(){
  console.log(this.value);
  if (this.value){
  if (this.value < 1 || this.value > upperLim[0]) {
    $('#info').html('<b>Info:</b> Pore ID must be between 1 and '+upperLim[0]+'.');
    $('#info').removeAttr("hidden");
  }
  else {
    $('#info').attr("hidden", "hidden");
  }}
});

$("#b_reset_pore").click(function() {
    myChart.data.datasets[0].data = JSON.parse(JSON.stringify(myChart.data.datasets[1].data));
    myChart.update();
    $('#info').attr("hidden", "hidden");
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
    $('#info').attr("hidden", "hidden");
    if (n_h < 1 || n_h > 511){
      $('#info').html('<b>Invalid Number of Harmonics:</b> Please select a number between 1 and 511.');
      $('#info').removeAttr("hidden");
      return;
    }
    utils.filterPore(myChart, n_h);
});

$("#b_rescale").click(function(){
  var size = parseInt($('input[type=radio][name=sizeselect]:checked').val());
  utils.normalizeShape(myChart, size);
});

$("#b_predict").click(function() {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    if (xhr.status === 200){
        var data = JSON.parse(xhr.response);
        $('#rf').text(data['rf']);
        $('#xgb').text(data['xgb']);
        $('#gp').text(data['gp']);
        $('#cnn').text(data['cnn']);
        //$('#actual').text('----');
    }
  }
  xhr.open('POST', '/predict', true);
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
