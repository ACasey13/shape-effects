export function getDefaultData(myChart, labelEls, labels) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    if (xhr.status === 200){
        var data = JSON.parse(xhr.response);
        myChart.data.datasets[0].data = data['path'];
        myChart.data.datasets[1].data = JSON.parse(JSON.stringify(data['path']));
        for (let i=0; i<5; i++){
        labels[i] = data['labels'][i];
        labelEls[i].text(data['labels'][i]);
      }
        myChart.data.datasets[1].label = 'original ' + data['set'];
        myChart.update(0);
    }
  }
  xhr.open('GET', '/default', true);
  xhr.send(null);
}

export function filterPore(mc, n_h, button) {
var xhr = new XMLHttpRequest();
xhr.onload = function() {
  if (xhr.status === 200){
      var data = JSON.parse(xhr.response);
      mc.data.datasets[0].data = data;
      mc.update(0);
  }
  button.html('<sup>&#8224;</sup>Filter Pore').removeAttr('disabled');
}
const bWidth = button.width();
button.html("<span class='spinner-border spinner-border-sm text-primary m-1' role='status'></span>").attr('disabled', 'disabled');
xhr.open('POST', '/filter', true);
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.send(JSON.stringify({"n_h": n_h,
                         "data":mc.data.datasets[0].data}));
}

export function modelsLoad(loading, sButton) {
  if (loading.attr("value") == 'loading') {
    console.log('models loading... do nothing');
    loading.addClass("shake");
    setTimeout(function(){loading.removeClass("shake")},500);
  }
  else {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      var status = false;
      if (xhr.status === 200){
          if (JSON.parse(xhr.response)['status'] === 'True') {
            status = true;
          }
        }

          console.log('models request returned on button click:')
          console.log(status);
          if (status) {
            setTimeout(function() {
              sButton.removeAttr('disabled');
              loading.attr('value', 'true').html('Models Loaded! Reload?');
            }, 1000);

          }
          else {
            loading.attr('value', 'false').html('Models Failed to Load! Reload?');
          }

    }
    xhr.open('GET', '/models_load', true);
    // xhr.setRequestHeader('Content-Type', 'application/json');

    loading.attr("value", "loading").html("<span class='spinner-border spinner-border-sm text-danger m-1' role='status'></span><span style='color:red;'> Loading models. Please wait to make predictions.</span>");
    sButton.attr('disabled', 'disabled');
    xhr.send();

  }
}


export function dataToArray(pts){
    var arr = [[],[]];
    for (let i=0; i < pts.length; i++){
      arr[0].push(pts[i].x);
      arr[1].push(pts[i].y);
    }
    return arr;
}

export function arrayToData(arr){
    var pts = [];
    for (let i=0; i<arr[0].length; i++){
      pts.push({'x': arr[0][i], 'y': arr[1][i]});
    }
    return pts;
}

export function multiplyMatrices(m1, m2) {
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

export function normalizeShape(myChart, diam){
    //green's theorem
    //https://leancrew.com/all-this/2018/01/greens-theorem-and-section-properties/
    var s = 0;
    var sx = 0;
    var sy = 0;
    var factor;

    var arr = dataToArray(myChart.data.datasets[0].data);
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
    var target = (diam * 10**-3 / 2)**2 * Math.PI;
    var scale_factor = Math.sqrt(target/area);
    arr[0] = arr[0].map(x => (x - res[1])*scale_factor);
    arr[1] = arr[1].map(y => (y - res[2])*scale_factor) ;
    var pts = arrayToData(arr);
    myChart.data.datasets[0].data = pts;
    myChart.update(0);
}
