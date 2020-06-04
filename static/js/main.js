var ctx = document.getElementById('myChart').getContext('2d');
var data = [{x: 10, y: 20},
       {x: 20, y: 20},
       {x: 20, y: 30},
       {x: 10, y: 30},
       {x: 10, y: 20}
     ]
var myChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'pore shape',
            data: data,
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            pointHoverBackgroundColor: 'rgba(255,192,203,1)',
            pointHoverBorderWidth: 5,
            showLine: true,
            lineTension: 0,
        },
        {
            label: 'original shape',
            data: [{x: 10, y: 20},
                   {x: 20, y: 20},
                   {x: 20, y: 30},
                   {x: 10, y: 30},
                   {x: 10, y: 20}
                 ],
            backgroundColor: 'rgba(255, 255, 132, 0.2)',
            borderColor: 'rgba(255, 255, 132, 1)',
            borderWidth: 1,
            pointHoverBackgroundColor: 'rgba(255,192,203,1)',
            pointHoverBorderWidth: 5,
            showLine: true,
            lineTension: 0,
            dragData: false
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
          console.log(data)
},
        maintainAspectRatio: true,
        scales: {
            yAxes: [{type: 'linear',
               position: 'left',
                ticks: {min: 0, max:50, display: false,},
              gridLines: {drawTicks: true,}},
              ],
            xAxes: [{type: 'linear',
                position: 'bottom',
                ticks: {min: 0, max:50, display: false},
               gridLines: {drawTicks: false}},
                ]
        }
    }
});
