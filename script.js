var serverURL = "https://data.learninginventions.org/channels/";

var config = { results:1000, dynamic:false };

var fieldTxt = "field";
var params	= {};
var channel = {fields:[],names:[],data:{}};
var validTypes = ["line","column","spline"];

var isLoading = {};
var seriesOptions = [];
var seriesCounter = 0;
var chart = null;

// create the chart when all data is loaded
var createChart = function (seriesOptions) {
	var channelID = Number(getUrlParameter("channelID"));
	chart = $('#container').highcharts('StockChart', {
		chart : {
			events : {
				load : function () {
					var series2 = this.series.slice(0,this.series.length-1);
					if (seriesOptions) { handleLoaded(series2) };
				}
			}
		},

		title: {
			text: (channel.name || '')
		},
		rangeSelector: {
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

			credits: {
      	enabled: true, href: 'https://data.learninginventions.org/', text: 'data.learninginventions.org'
      },

			tooltip: {
				pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
				valueDecimals: 2
			},

			series: (seriesOptions ? seriesOptions : [])
		});

		chart = $('#container').highcharts();

	};

	var updateChannelShow = function(data){
		channel = $.extend(channel, data.channel);
		setFields(data);
		createChart();
		initData(data);
	}

	var updateChannelMultiShow = function(data){
		channel = $.extend(channel, data.channel);
		setFields(data);

		var template = $('<iframe src="show.html" width="100%" height="400px" style="border: 0px"></iframe>');
		var params_clone = params;
		delete params_clone.types;
		delete params_clone.fields;

		for (fieldi in channel.data){
			var field = channel.data[fieldi];
			var $iframe = $(template).clone();
			var src = "show.html?"+$.param( $.extend(params_clone, {fields:field.field, types:field.type} ) );
			$iframe.attr("src", src);
			$('#container').append($iframe);
		}
	}

	function getChannelInfo(callback){
		$.getJSON( serverURL+params.channelID+"/feeds.json?results=0&api_key="+params.api_key, callback).fail(function() {
			alert("Invalid parametors or Private Channel");
		});

	}

	function initData(object){
		console.log("Loading...");
		chart.showLoading();

		$.each(channel.list, function (i, name) {

			var option = config;//{results : config.results, api_key : params.api_key}
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
				channel.data[name].last_entry_id = data.channel.last_entry_id
				channel.data[name].updated_at = data.channel.updated_at;
				channel.updated_at = data.channel.updated_at;

				isLoading[name] =  false;

				seriesOptions[i] = {
					name: channel.data[name].name,
					data: list,
					type: ( validTypes.indexOf(channel.data[name].type) > -1  ? channel.data[name].type : 'line' ),
					step: channel.data[name].type=="step" ? 'left' : false
				};

			})
			.always(function() {
				// As we're loading the data asynchronously, we don't know what order it will arrive. So
				// we keep a counter and create the chart when all the data is loaded.
				seriesCounter += 1;

				if (seriesCounter === channel.list.length) {
					createChart(seriesOptions);
					chart.hideLoading();
				}
		  });;
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

	config.api_key = ("api_key" in datas) ? datas.api_key : '';

	if ("results" in datas && Number(datas.results) ){
		config.results = Number(datas.results);
	}

	if ("days" in datas && Number(datas.days) ){
		config.days = Number(datas.days);
		delete config.results;
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
	//changes params
	params.types = decodeURIComponent(params.types).split(',');
	if (params.fields){
		params.fields = decodeURIComponent(params.fields).split(',');
	}


	channel.list = [];
	var fieldIndex = 0;
	if (!object.channel) return;

	for (var i=1 ; i<=8 ; i++){

		var fieldString = fieldTxt+i;
		if ( ! (fieldString in object.channel) ){
			continue;
		}

		if ( ( params.fields && params.fields.indexOf(fieldString)>-1) || !params.fields){
			channel.data[i] = {
				i			:	i,
				field	: fieldString,
				label	: object.channel[fieldString],
				name	: fieldTxt+i+ ':' +  object.channel[fieldString],
				type 	: ( fieldIndex in params.types ? params.types[fieldIndex] : '' )
			}

			channel.fields.push(fieldString);
			channel.list.push(i);
			channel.names.push( fieldString+ ':' +  object.channel[fieldString]);
			fieldIndex++;
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

	if (!config.dynamic) {
		return;
	}

	// push data every 5 seconds
	setInterval(function() {

		var option = {results : config.results, api_key : params.api_key, start:channel.updated_at}
		var fetch_url = serverURL+params.channelID+'/feeds.json?'+$.param(option);

		$.getJSON(fetch_url,    function (data) {

			if (data.feeds){
				$.each(data.feeds, function (index, record) {

					$.each(channel.list, function (i, name) {

						if(record.entry_id > channel.data[name].last_entry_id && record[fieldTxt+name]){
							var parsedData = parseDataLog({ datetime:record.created_at,value:record[fieldTxt+name] });
							series[i].addPoint([parsedData.datetime,parsedData.value], true, true);
							channel.data[name].last_entry_id = record.entry_id;
						};

						channel.data[name].updated_at = data.channel.updated_at;
						channel.updated_at = data.channel.updated_at;
					});

				});
			}

		});
	}, 5000);

}
