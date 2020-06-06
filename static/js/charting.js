export function createChart(ctx, extent, elReset){
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
            pointHoverRadius: 6.5,
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
          var last_index = myChart.data.datasets[0].data.length-1;
          if (index === 0){
            myChart.data.datasets[0].data[last_index] = value
          }
          if (index === last_index){
            myChart.data.datasets[0].data[0] = value
          }
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
                ticks: {min: -extent, max : extent, /*display: false,*/},
              gridLines: {drawTicks: true,}},
              ],
            xAxes: [{type: 'linear',
                position: 'bottom',
                scaleLabel: {display: true, labelString: 'width (microns)'},
                ticks: {min: -extent, max : extent, display: true},
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
                                elReset.removeAttr('disabled');
                              }
                          }
                      }
                  },
  }
});
return myChart;
}
