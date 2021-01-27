import * as charting from './charting.js';
import * as utils from './utils.js';

$( document ).ready(function() {
  var sButton = $("#b_predict");
  var loading = $("#loadingModels");
  loading.attr("value", "loading");
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

var labels = ['&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', ''];
var labelEls = [$("#rf"), $("#xgb"), $("#gp"),
                $("#cnn"), $("#actual")];
var extent = [1.790438802777571947e-05 * 10**4,
              3.472830731025012679e-05 * 10**4];
var upperLim = [6152]; //is updated dynamically on client side

var myChart = charting.createChart(ctx, extent[1], $("#b_reset_zoom"));

utils.getDefaultData(myChart, labelEls, labels);

loading.click(function() {
    utils.modelsLoad(loading, sButton);
});

var grabPore = function(id, size, button) {
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
  button.text('Fetch Pore').removeAttr('disabled');
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
   var button = $("#b_fetch");
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
   const bWidth = button.width();
   button.html("<span class='spinner-border spinner-border-sm text-primary m-1' role='status'></span>").attr('disabled', 'disabled');
   grabPore(id, size, button);
});

$('#poreID').on('input', function(){
  //console.log(this.value);
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
    $('#rf').html(labels[0]);
    $('#xgb').html(labels[1]);
    $('#gp').html(labels[2]);
    $('#cnn').html(labels[3]);
    $('#actual').text(labels[4]);

    $('#rf_o').html('&nbsp;');
    $('#xgb_o').html('&nbsp;');
    $('#gp_o').html('&nbsp;');
    $('#cnn_o').html('&nbsp;');

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
    utils.filterPore(myChart, n_h, $("#b_filter"));
});

$("#b_rescale").click(function(){
  var size = parseInt($('input[type=radio][name=sizeselect]:checked').val());
  utils.normalizeShape(myChart, size);
});

$("#b_predict").click(function() {
  var button = $("#b_predict");
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    if (xhr.status === 200){
        var data = JSON.parse(xhr.response);
        var rf_o = $('#rf').html();
        var xgb_o = $('#xgb').html();
        var gp_o = $('#gp').html();
        var cnn_o = $('#cnn').html();

        $('#rf_o').html(rf_o);
        $('#xgb_o').html(xgb_o);
        $('#gp_o').html(gp_o);
        $('#cnn_o').html(cnn_o);

        $('#rf').text(data['rf']);
        $('#xgb').text(data['xgb']);
        $('#gp').html(data['gp'] + "&#177;"+data['gp_std']+"<sup>&#167;</sup>");
        $('#cnn').text(data['cnn']);

    }
    button.text('Predict').removeAttr('disabled');
  }
  const bWidth = button.width();
  button.html("<span class='spinner-border spinner-border-sm text-success m-1' role='status'></span>").attr('disabled','disabled');
  xhr.open('POST', '/predict', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify({"data":myChart.data.datasets[0].data,
                           "size":300})); //need to connect 150nm models
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
