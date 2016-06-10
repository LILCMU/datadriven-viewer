var serverURL = "https://data.learninginventions.org/channels/";

var config = { results:1000, dynamic:false };

var fieldTxt = "field";
var params	= {};
var channel = {fields:[],names:[],data:{}};


var isLoading = {};
var seriesOptions = [],
		seriesCounter = 0,
		// create the chart when all data is loaded
		createChart = function () {
				var channelID = Number(getUrlParameter("channelID"));
				$('#container').highcharts('StockChart', {
						chart : {
								events : {
										load : function () {

														var series2 = this.series.slice(0,this.series.length-1);
														handleLoaded(series2);

										}
								}
						},

						title: {
		            text: channel.name
		        },
						rangeSelector: {
								//selected: 4,
								buttons: [
								{
										type: 'minute',
										count: 5,
										text: '5min'
								},
								{
										type: 'hour',
										count: 1,
										text: '1hr'
								},
								{
										type: 'day',
										count: 1,
										text: '1d'
								},
								{
										type: 'week',
										count: 1,
										text: '1w'
								},
								{
										type: 'month',
										count: 1,
										text: '1m'
								}, {
										type: 'ytd',
										text: 'YTD'
								}, {
										type: 'year',
										count: 1,
										text: '1y'
								}, {
										type: 'all',
										text: 'All'
								}]
						},

						yAxis: {
								// labels: {
								//     formatter: function () {
								//         return (this.value > 0 ? ' + ' : '') + this.value + '%';
								//     }
								// },
								plotLines: [{
										value: 0,
										width: 2,
										color: 'silver'
								}]
						},

						legend: {
							enabled: true,
										layout: 'vertical',
										align: 'right',
										verticalAlign: 'middle',
										borderWidth: 0
								},

						plotOptions: {
								// series: {
								//     compare: 'percent'
								// }
								 bar: {
										dataLabels: {
												enabled: true
										}
								}

						},

						tooltip: {
								pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
								valueDecimals: 2
						},

						series: seriesOptions
				});
		};

$(function () {
	params = getUrlParameter();
	validateParams();

	//Fetch channel information
	$.getJSON( serverURL+params.channelID+"/feeds.json?results=0&api_key="+params.api_key,    function (data) {

			channel = $.extend(channel, data.channel);
			setFields(data);
			initData(data);

	}).fail(function() {
    alert("Invalid parametors");
  });


});

function initData(object){
	console.log("Loading...");
/*
	// Fetch entire channel
	var fetch_url = serverURL+params.channelID+'/feeds.json?api_key='+params.api_key+'&results='+config.results;

	$.getJSON(fetch_url,    function (data) {
			console.log(data);
			var list = {};


			for (field of channel.fields) {
				list[field] = [];
			}

			if (data.feeds){
					//var fetch_data = data.data.split("\r\n");
					$.each(data.feeds, function (index, record) {

							for (field of channel.fields) {
								if(record[field]){
									var parsedData = parseDataLog({ datetime:record.created_at,value:record[field] });
									list[field].push( [parsedData.datetime, parsedData.value ] )
								};
							}
							// var entry = record.split(",");
							// if (entry.length == 2){
							// 		var parsedData = parseDataLog({datetime:entry[0],value:entry[1]});
							// 		list.push([parsedData.datetime, parsedData.value ]);
							// }
					});
			}

			isLoading[name] =  false;

			for (var index in channel.fields) {
				seriesOptions[index] = {
						name: channel.names[index],
						data: list[channel.fields[index]]
				};
			}


			// As we're loading the data asynchronously, we don't know what order it will arrive. So
			// we keep a counter and create the chart when all the data is loaded.
			//seriesCounter += 1;

			// if (seriesCounter === names.length) {
					createChart();
			// }

	});
	*/

	$.each(channel.list, function (i, name) {

			var option = {results : config.results, api_key : params.api_key}
			var fetch_url = serverURL+params.channelID+'/field/'+name+'.json?'+$.param(option);

			$.getJSON(fetch_url,    function (data) {

					var list = []
					if (data.feeds){
							$.each(data.feeds, function (index, record) {
									if(record[fieldTxt+name]){
										var parsedData = parseDataLog({ datetime:record.created_at,value:record[fieldTxt+name] });
										list.push( [parsedData.datetime, parsedData.value ] )
									};
							});
					}

					// Store last upadted
					if (list.length>0){
						channel.data[name].updated_at = channel.updated_at;
						channel.updated_at = data.channel.updated_at;
					}

					isLoading[name] =  false;
					seriesOptions[i] = {
							name: channel.data[name].name,
							data: list
					};

					// As we're loading the data asynchronously, we don't know what order it will arrive. So
					// we keep a counter and create the chart when all the data is loaded.
					seriesCounter += 1;

					if (seriesCounter === channel.names.length) {
							createChart();
					}

			});
	});
	return;
}

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
		var datas = {};
    for (var i = 0; i < sURLVariables.length; i++)
    {
        var sParameterName = sURLVariables[i].split('=');
				datas[sParameterName[0]] = sParameterName[1];
        if (sParameterName[0] == sParam)
        {
            return sParameterName[1];
        }
    }
		return datas;
}

function validateParams(){
	var datas = getUrlParameter();
	if ( !Number(datas.channelID) || Number(datas.channelID)<1 ) {
		alert("Invalid Channel ID");
		return false;
	} else if ( datas.api_key && datas.api_key.length != 16 ) {
			alert("Invalid Read API Key");
			return false;
	}

	if (!"api_key" in datas){
		datas.api_key = "";
	}

	if ("results" in datas && Number(datas.results) ){
		config.results = Number(datas.results);
	}
	if ("days" in datas && Number(datas.days) ){
		config.days = Number(datas.days);
	}

	config.dynamic = ("dynamic" in datas && datas.dynamic=='true');

	return true;
}

function getLogNames(object){
	var names = [];
	if (object.channel){
		for (var i=1 ; i<=8 && fieldTxt+i in object.channel ; i++){
				channel.names.push( fieldTxt+i+ ':' + object.channel[fieldTxt+i] );
		}
	}
	return names;
}

function setFields(object){
	channel.list = [];
	if (object.channel){
		for (var i=1 ; i<=8 && fieldTxt+i in object.channel ; i++){

				channel.data[i] = {
					i			:	i,
					field	: fieldTxt+i,
					label	: object.channel[fieldTxt+i],
					name	: fieldTxt+i+ ':' +  object.channel[fieldTxt+i]
				}

				channel.fields.push(fieldTxt+i);
				channel.list.push(i);
				channel.names.push( fieldTxt+i+ ':' +  object.channel[fieldTxt+i]);
		}
	}
}

function getLogNameFromUrl() {
	return getUrlParameter("name").split(",");
}

function getReduce() {
		return getUrlParameter("average")=="true";
}

function parseDataLog(data){
    var date = new Date(data.datetime);
    var localdate = date-1*date.getTimezoneOffset()*60*1000;
    data.datetime = localdate;
    data.value    = Number(data.value);
    return data;
}

function handleLoaded(series){

		 if (config.dynamic) {

			 // push data every 5 seconds
				 setInterval(function() {

					 var option = {results : config.results, api_key : params.api_key, start:channel.updated_at}
					 var fetch_url = serverURL+params.channelID+'/feeds.json?'+$.param(option);

					 $.getJSON(fetch_url,    function (data) {

						 if (data.feeds){
							 $.each(data.feeds, function (index, record) {

								 $.each(channel.list, function (i, name) {

									 if(record[fieldTxt+name]){
										 var parsedData = parseDataLog({ datetime:record.created_at,value:record[fieldTxt+name] });
										 series[i].addPoint([parsedData.datetime,parsedData.value], true, true);
									 };

									 channel.data[name].updated_at = data.channel.updated_at;
									 channel.updated_at = data.channel.updated_at;
								 });

							 });
						 }

					 });
				 }, 5000);

		 }
		return;
}
