    var dataView;
    var grid;
    var data = [];

    var columns = [
		{id:"ref", name:"Location", field:"ref"},
		{id:"buck", name:"Form", field:"buck"},
		{id:"pos", name:"Tag", field:"pos"},
		{id:"tags", name:"Features", field:"tags"},
    ];

    var options = {
        editable:false,
        enableAddRow:false,
        enableCellNavigation:true
    };

    var percentCompleteThreshold = 0;
    var prevPercentCompleteThreshold = 0;
    var searchString = "";
    var h_runfilters = null;

    function myFilter(item, args) {
        return item["percentComplete"] >= args;
    }

    function DataItem(i) {
        this.num = i;
        this.id = "id_" + i;
        this.percentComplete = Math.round(Math.random() * 100);
        this.effortDriven = (i % 5 == 0);
        this.start = "01/01/2009";
        this.finish = "01/05/2009";
        this.title = "Task " + i;
        this.duration = "5 days";
    }


    $(function() {
return;
        //dataView = new Slick.Data.DataView();
        //grid = new Slick.Grid("#myGrid", dataView, columns, options);
        //var pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));

        // wire up model events to drive the grid
        dataView.onRowCountChanged.subscribe(function(e, args) {
            grid.updateRowCount();
            grid.render();
        });

        dataView.onRowsChanged.subscribe(function(e, args) {
            grid.invalidateRows(args.rows);
            grid.render();
        });


        // wire up the slider to apply the filter to the model
        $("#pcSlider").slider({
            "range":"min",
            "slide":function(event, ui) {
                if (percentCompleteThreshold != ui.value) {
                    window.clearTimeout(h_runfilters);
                    h_runfilters = window.setTimeout(filterAndUpdate, 10);
                    percentCompleteThreshold = ui.value;
                }
            }
        });

        function filterAndUpdate() {
            var isNarrowing = percentCompleteThreshold > prevPercentCompleteThreshold;
            var isExpanding = percentCompleteThreshold < prevPercentCompleteThreshold;
            var renderedRange = grid.getRenderedRange();

            dataView.setFilterArgs(percentCompleteThreshold);
            dataView.setRefreshHints({
                ignoreDiffsBefore:renderedRange.top,
                ignoreDiffsAfter:renderedRange.bottom + 1,
                isFilterNarrowing:isNarrowing,
                isFilterExpanding:isExpanding
            });
            dataView.refresh();

            prevPercentCompleteThreshold = percentCompleteThreshold;
        }

        // initialize the model after all the events have been hooked up
        dataView.beginUpdate();
        dataView.setItems(data);
        //dataView.setFilter(myFilter);
        //dataView.setFilterArgs(0);
        dataView.endUpdate();
    })
	var _rawdata;
	function go( isRecursive ){
		var output, inputs, inputsArr, pattern, arr, grammar="", ref, roots='', lems='';
		if(!_rawdata){
			_rawdata = document.getElementById('dataisland').innerHTML;
		}
		inputs = $('#rawoutput').val();
		if(inputs){
			$('#rawoutput2').val( '' ); $('#rawoutput3').val( '' );	$('#rawoutput4').val( '' ); $('#rawoutput5').val(''); //reset all output fields
			inputsArr = inputs.split('\n');
			for(l=0; l < inputsArr.length; ++l){
				ref = inputsArr[l]; if(!ref) continue;
				
				if(!parseInt(ref) ) continue; 
				pattern = new RegExp( "\\(" + ref + ":.*\\).*(?:\r?\n)", "mg");
				arr = _rawdata.match( pattern );
				if(!arr){ grammar += ref + ' NO MATCH\n'; continue;}
				//if(arr.length == 1) grammar += arr[0];
				if(arr.length >= 1){
					for(t=0; t<arr.length; ++t){
						if(arr[t].indexOf('STEM') == -1) continue; //ignore the PREFIX and SUFFIXes if any
						else{
							if(arr[t].indexOf('ROOT') == -1) 
								if(arr[t].indexOf('LEM') == -1) {
									//grammar += '**'+arr.length +' parts\n'+ arr.join('');
									grammar += arr[t];
									roots += '---\n';
									lems += '---\n';			
								}									
								else{
									grammar += arr[t];
									roots += '---\n';
									lems += arr[t].split('|LEM:')[1].split('|')[0] + '\n';								
								}
							else{
								lems  += arr[t].split('|LEM:')[1].split('|')[0] +'\n';
								roots += arr[t].split('|ROOT:')[1].split('|')[0] + '\n';
								grammar += arr[t];
							}
						}
					}
				}
			}
			$('#rawoutput2').val( grammar );
			$('#rawoutput3').val( roots );
			$('#rawoutput4').val( lems );
			renderResult('roots', roots);
			renderResult('lems', lems);
			if( $('#check2').is(':checked') && typeof(isRecursive) == 'undefined' ){
				$('#words').val( $('#rawoutput').val() ); go4(true);
			}
		}
	}

	function go3( isRecursive ){
		var output, inputs, inputsArr, pattern, arr, grammar="", ref, roots='', lems='', refs='';
		if(!_rawdata){	//rawdata = $('#rawdata').val();
			_rawdata = document.getElementById('dataisland').innerHTML;
		}
		inputs = $('#rawoutput3').val(); //get root inputs
		if(inputs){
			inputsArr = inputs.split('\n');
			var surano=1, map = {};
			for(surano=1; surano <=114; ++surano){
				map[surano] = '';
				for(l=0; l < inputsArr.length; ++l){
					ref = inputsArr[l]; if(!ref) continue;
					//pattern = new RegExp( "("+surano+":.*)ROOT\:" + escapeForRegex(ref) + ".*(?:\r?\n)", "mg"); 
					pattern = new RegExp( "\\(" + surano + ":(.*)" + "ROOT\:" + escapeForRegex(ref) + ".*(?:\r?\n)", "mg");
					if( pattern.test( _rawdata ) ){
						map[surano] += ref + '; ';
					}
				}
				console.log(surano +'\t\t'+ (map[surano] != '' ? map[surano].split(';').length : '-') +'\t'+ map[surano]);
			}
		}
		console.log( map );
	}
	
	function go2(isRecursive){//debugger;
		var output, inputs, inputsArr, pattern, arr, grammar="", ref, roots='', lems='', refs='', suras='';
		if(!_rawdata){
			_rawdata = document.getElementById('dataisland').innerHTML;
		}
		inputs = $('#rawoutput3').val(); //get root inputs
		if(inputs){
			$('#rawoutput2').val( '' ); $('#rawoutput').val( '' ); $('#rawoutput4').val( '' ); $('#rawoutput5').val( '' ); //reset all output fields
			inputsArr = inputs.split('\n');
			for(l=0; l < inputsArr.length; ++l){
				ref = inputsArr[l]; if(!ref) continue;				
				pattern = new RegExp( "(.*)ROOT\:" + escapeForRegex(ref) + ".*(?:\r?\n)", "mg"); 
				arr = _rawdata.match( pattern ); if(typeof(DEBUG) != 'undefined' && DEBUG) debugger;
				if(!arr){ grammar += ref + ' NO MATCH\n'; continue;}
				else{
					grammar += '**'+arr.length +' parts\n'+ arr.join('')  +'\n';
					for(p=0; p<arr.length;++p){
						suras += mapToSura( arr[p].split('\t')[0] ) + '\n';
						refs += mapToRef( arr[p].split('\t')[0] ) + '\n';
					}
				}
			}
			$('#rawoutput').val( refs ); $('#rawoutput5').val( suras );
			$('#rawoutput2').val( grammar ); 
			renderResult('refs', refs);			
			if( $('#check2').is(':checked') && typeof(isRecursive) == 'undefined'){
				$('#words').val( $('#rawoutput').val() ); go4( isRecursive );
			}
		}
	}
	
	var mapToSura = function(ref){
		var arr = ref.split(':'); if(arr.length > 3) ref=arr[0]; //PUT SURA REF ONLY. input: (6:146:7:1)
		return ref.substring(1);
	}
	var mapToRef = function(ref){
		var arr = ref.split(':'); if(arr.length > 3) ref=arr[0] +':'+arr[1] +':'+arr[2];
		return ref.substring(1);
	}
	var escapeForRegex = function(regex){
		if(!regex) return;
		return regex.replace(/\'/g, '\\\'').replace(/\[/g, '\\\[').replace(/\*/g, '\\\*').replace(/\$/g, '\\\$').replace(/\@/g, '\\\@').replace(/\+/g, '\\\+');
	}
	
	var obj;
	function renderResult(name, text){
		var map1={}, map2={}; if(!name) name='';
		if(text){
			var rootsArr = text.split('\n');
			for(var t=0; t<rootsArr.length; ++t){
				if( map1[ rootsArr[t] ] )map2[ rootsArr[t] ] = map1[ rootsArr[t] ] = map1[ rootsArr[t] ] + 1; 
				else map1[ rootsArr[t] ] = 1;
			}
		}obj = map1; var log=name.toUpperCase() + ':\n'; 
		for (var key in obj) {
			log += ([key, obj[key]].join("\t")) + '\n';
		}
		console.log( log ); $('#rawoutput5').val( $('#rawoutput5').val() +'\n==UNIQUES==\n'+ log + '\n'  );
		console.log(map2); console.log(map1);
	}
	
	
	function qLoadData(){
		var data=[], rawdataArr;
		//rawdata = $('#rawdata').val().replace(/\|PCPL\|/g, '*PCPL|').replace(/\|INDEF\|/g, '*INDEF|').replace(/\|PASS\|/g, '*PASS|');
		if(!_rawdata){	//rawdata = $('#rawdata').val();
			_rawdata = document.getElementById('dataisland').innerHTML;
		}
		rawdataArr = _rawdata.split("\n");
		for(var i=0, wordIndx=1; i<rawdataArr.length-1; ++i){
			if( rawdataArr[i] ){
				if(rawdataArr[i].indexOf('STEM')==-1) continue;
				data[wordIndx-1] = new qDataItem(i, rawdataArr[i]); ++wordIndx;
			}
		}//debugger;
		return data;
	}
	function qDataItem(i, dataline) {
		var tempArr;
        this.num = i;
        this.id = "id_" + i;
		if(dataline){
			tempArr = ( escape(dataline) ).split('\t');
			this.ref = tempArr[0];
			this.buck = tempArr[1];
			this.pos = tempArr[2];
			this.tags = tempArr[3];
		}
    }
	
	
	var _wordsdata, _wordsdataArr;
	function doWordsSearch( isRecursive ){ //this does simple word search in the word2word meanings data
		var keyword = $('#keyword').val(); if(!keyword){ alert('enter a valid search keyword'); return;}
		var refs = '', wordno, raw='', meanings='', temp2='', pattern, arr;
		$('#words').val('-'); $('#words2').val('-'); $('#words3').val();
		if(!_wordsdata){ 
			_wordsdataArr = (_wordsdata = _prefixData( document.getElementById('rawdata2').innerHTML ) ).split('\n');
		} if(typeof(DEBUG) != 'undefined' && DEBUG) debugger;
		pattern = new RegExp( ".*" + keyword + ".*(?:\r?\n)", "img");
		arr = _wordsdata.match( pattern );
		raw =( arr ? arr.join('\n') : 'no hits for ' + keyword );
		
		if(arr) for(var k=0; k<arr.length; ++k){ if(typeof(DEBUG) != 'undefined' && DEBUG) debugger;
			wordno = arr[k].toLowerCase().split(keyword.toLowerCase())[0].split('$').length;
			if(arr[k]) refs += mapLinenoToRef( arr[k].split('|')[0] ) + (wordno?(':'+wordno) : '') + '\n';
			if(wordno){ 
				temp2 = arr[k].split('$')[wordno-1];
				if( temp2.indexOf('|') != -1) temp2 = temp2.split('|')[1];
			}
			meanings += temp2 + '\n';
		}
		$('#words').val( refs );
		$('#words2').val( raw );
		$('#words3').val( meanings );
		if( $('#check').is(':checked') && typeof(isRecursive) == 'undefined' ){
			$('#rawoutput').val( $('#words').val() ); go(true);
		}
	}

	function go4( isRecursive ){ //this is mapping from references to either verse word2word meanings or else one word meaning.
		var refs, refsArr, result='', index, temparr, temp, _arr, temp2, raw='';
		refs = $('#words').val(); if(!refs) { alert('enter valid references ex: 1:7'); return;}
		if( typeof(isRecursive) == 'undefined') $('#words2').val('-'); $('#words3').val();
		if(!_wordsdata){ 
			_wordsdataArr = (_wordsdata = _prefixData( document.getElementById('rawdata2').innerHTML ) ).split('\n');

		} if(typeof(DEBUG) != 'undefined' && DEBUG) debugger;
		refsArr = refs.split('\n');
		for(k=0; k<refsArr.length; ++k){ if(!refsArr[k]) continue;
			if(!parseInt(refsArr[k])) debugger;
			index = -1 + mapRefToLineno( refsArr[k] );
			temparr = refsArr[k].split(':'); 
			if(temparr.length >= 3){
				temp = parseInt( temparr[2] ); 
				temp2 = (_wordsdataArr[index]).split('$')[ temp-1 ]; 
				if( temp2.indexOf('|') != -1) temp2 = temp2.split('|')[1];
				result +=  temp2 + '\n';
			}
			else raw += _wordsdataArr[ index ] + '\n';
		}
		$('#words2').val( raw );
		$('#words3').val( result );
	}
	
	//<!-- misc UTIL functions -->
	var _prefixData = function(DATA){           //profile('PREFIX-start');
		  if(!DATA) return;
		   var ARRAY = DATA.split('\n'), SEP='|'; //TODO: split using a regex, to account for /r/n
		   for(var n=0; n<ARRAY.length; ++n){
			 ARRAY[n] = (n) + '|' + ARRAY[n];
		   }
		   return ARRAY.join('\n');
	}
	
	function mapLinenoToRef(lineno, SEP){
		if(typeof(SEP) == 'undefined' || !SEP) SEP=':';
		var ref = '', pos, line,k; 
		line = parseInt( lineno );
		if( typeof(line) == 'undefined' || typeof(line) != 'number'){ debugger; return -1; }
		if(line==0){ return '1'+SEP+'1'; }
		for(k=0; k<verseIndexes.length-1;++k){
			if(verseIndexes[k+1] > (line+1) ){//BUGFIX for boundry case when search result is first line of Sura. Test for last line too!
				pos = k; break;
			}
		}
		ref = pos +SEP+ (line - verseIndexes[pos] +2);
		return ref;
	}

	var mapRefToLineno = function(ref, suraNo, versNo){
	if(!ref) return -1;
	var lineno = -1, startline=-1, maxVerses=-1;
	var SEP = ':';
	if(ref.indexOf(',') != -1) SEP = ',';
	else if(ref.indexOf(':') != -1) SEP = ':';
	else{ suraNo=ref; versNo=1;}
	if(!suraNo) suraNo = ref.split(SEP)[0]; 
	if(!versNo) versNo = ref.split(SEP)[1];
	suraNo = parseInt(suraNo); versNo = parseInt(versNo);
	if(suraNo != NaN && versNo != NaN && typeof(suraNo) == 'number' && typeof(versNo) == 'number') {
			startline = verseIndexes[suraNo]; //QuranData.Sura[ suraNo ][0];
			maxVerses = verseIndexes[suraNo+1];
			if(versNo <=0 || versNo > maxVerses) return -1; //invalid verse number
			lineoffset = versNo - 1;
			if(startline + lineoffset >= maxVerses) debugger;
			return (startline + lineoffset);
	}else debugger;
	return -1;  //there was some error
}

var mapRefToSurano = function(ref, suraNo, versNo){
	if(!ref) return -1;
	var lineno = -1;
	var SEP = ':';
	if(ref.indexOf(',') != -1) SEP = ',';
	else if(ref.indexOf(':') != -1) SEP = ':';
	else{ suraNo=ref; versNo=1;}
	if(!suraNo) suraNo = ref.split(SEP)[0]; 
	if(!versNo) versNo = ref.split(SEP)[1];
	suraNo = parseInt(suraNo); versNo = parseInt(versNo);
	if(suraNo != NaN && versNo != NaN && typeof(suraNo) == 'number' && typeof(versNo) == 'number') {
		return suraNo;
	}else debugger;
	return -1;  //there was some error
}

var mapRefToVersno = function(ref, suraNo, versNo){
	if(!ref) return -1;
	var lineno = -1;
	var SEP = ':';
	if(ref.indexOf(',') != -1) SEP = ',';
	else if(ref.indexOf(':') != -1) SEP = ':';
	else{ suraNo=ref; versNo=1;}
	if(!suraNo) suraNo = ref.split(SEP)[0]; 
	if(!versNo) versNo = ref.split(SEP)[1];
	suraNo = parseInt(suraNo); versNo = parseInt(versNo);
	if(suraNo != NaN && versNo != NaN && typeof(suraNo) == 'number' && typeof(versNo) == 'number') {
		return versNo;
	}else debugger;
	return -1;  //there was some error
}

	<!-- STATIC DATA -->
var verseCounts = new Array(-1, 7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123,
		111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93,
		88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59,
		37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11,
		11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
		29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8,
		11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6); //115

var verseIndexes = new Array(-1, 1, 8, 294, 494, 670, 790, 955, 1161, 1236, 1365, 1474, 1597, 1708, 1751, 1803, 1902, 2030, 2141, 2251, 2349, 2484, 
	2596, 2674, 2792, 2856, 2933, 3160, 3253, 3341, 3410, 3470, 3504, 3534, 3607, 3661, 3706, 3789, 3971, 4059, 4134, 4219, 4273, 4326, 4415, 4474, 
	4511, 4546, 4584, 4613, 4631, 4676, 4736, 4785, 4847, 4902, 4980, 5076, 5105, 5127, 5151, 5164, 5178, 5189, 5200, 5218, 5230, 5242, 5272, 5324, 
	5376, 5420, 5448, 5476, 5496, 5552, 5592, 5623, 5673, 5713, 5759, 5801, 5830, 5849, 5885, 5910, 5932, 5949, 5968, 5994, 6024, 6044, 6059, 6080, 
	6091, 6099, 6107, 6126, 6131, 6139, 6147, 6158, 6169, 6177, 6180, 6189, 6194, 6198, 6205, 6208, 6214, 6217, 6222, 6226, 6231, 6237);
	
var wordsCounts = new Array(-1, 29, 6116, 3481, 3747, 2804, 3050, 3320, 1233, 2498, 1833, 1917, 1777, 853, 830, 655, 1844, 1556, 1579, 961, 1335, 1169,
	1274, 1050, 1316, 893, 1318, 1151, 1430, 976, 817, 546, 372, 1287, 883, 775, 725, 861, 733, 1172, 1219, 794, 860, 830, 346, 488, 643, 539, 560, 
	347, 373, 360, 312, 360, 342, 351, 379, 574, 472, 445, 348, 221, 175, 180, 241, 287, 249, 333, 300, 258, 217, 226, 285, 199, 255, 164, 243, 181, 
	173, 179, 133, 104, 80, 169, 107, 109, 61, 72, 92, 137, 82, 54, 71, 40, 27, 34, 72, 30, 94, 36, 40, 36, 28, 14, 33, 23, 17, 25, 10, 26, 19, 23, 15,
	23, 20); //115. map.
	//diffrnt 3 6 7 8 13 16 17 19 // 22 25 27 29 32 37 38 41 84 96th. 3:165 ava lamma. 
var XordsCounts = new Array(-1, 29, 6116, 3482, 3747, 2804, 3053, 3324, 1234, 2498, 1833, 1917, 1777, 855, 830, 655, 1845, 1557, 1579, 962, 1335, 1169, 
    1276, 1050, 1316, 894, 1318, 1152, 1430, 977, 817, 546, 373, 1287, 883, 775, 725, 862, 734, 1172, 1219, 795, 860, 830, 346, 488, 643, 539, 560, 
	347, 373, 360, 312, 361, 342, 351, 380, 574, 472, 445, 348, 221, 175, 180, 241, 287, 249, 333, 300, 258, 217, 226, 285, 199, 255, 164, 243, 181, 
	173, 179, 133, 104, 80, 169, 108, 109, 61, 72, 92, 137, 82, 54, 71, 40, 27, 34, 73, 30, 94, 36, 40, 36, 28, 14, 33, 23, 17, 25, 10, 26, 19, 23, 15, 
	23, 20);

var linesIndexes = new Array(-1, 1, 30, 6146, 9627, 13374, 16178, 19228, 22548, 23781, 26279, 28112, 30029, 31806, 32659, 33489, 34144, 35988, 37544, 
	39123, 40084, 41419, 42588, 43862, 44912, 46228, 47121, 48439, 49590, 51020, 51996, 52813, 53359, 53731, 55018, 55901, 56676, 57401, 58262, 58995, 
	60167, 61386, 62180, 63040, 63870, 64216, 64704, 65347, 65886, 66446, 66793, 67166, 67526, 67838, 68198, 68540, 68891, 69270, 69844, 70316, 70761, 
	71109, 71330, 71505, 71685, 71926, 72213, 72462, 72795, 73095, 73353, 73570, 73796, 74081, 74280, 74535, 74699, 74942, 75123, 75296, 75475, 75608, 
	75712, 75792, 75961, 76068, 76177, 76238, 76310, 76402, 76539, 76621, 76675, 76746, 76786, 76813, 76847, 76919, 76949, 77043, 77079, 77119, 77155, 
	77183, 77197, 77230, 77253, 77270, 77295, 77305, 77331, 77350, 77373, 77388, 77411, 77431); //116. pos.

	var escape = function(input){ if(!input) return; return input.replace(/\</g, '&lt;').replace(/\>/g, '&gt;'); }
	var unescape = function(input){ if(!input) return; return input.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>'); }

	
	
	
	////////////////////////// IGNORE - EXPERIMENTAL ONLY ////////////////////////////////
	var pattern, arr, rawdata, surano=2, versno, verscount=256, _log1, _log2;	
	var searchGrammarDupes = function(){
		if(!_rawdata){
			_rawdata = document.getElementById('dataisland').innerHTML;
		}
		var _log = '';
		for(versno=1; versno < verscount; ++versno){
			//pattern = new RegExp( "\\(" + ref + ":.*\\).*(?:\r?\n)", "mg");			
			pattern = new RegExp( "\\(" + surano +':'+versno + ":.*?STEM", "mg");
			arr = _rawdata.match( pattern );
			_log += arr.length + ',\t'; //console.log(surano +':'+versno + '\tmatches\t' + arr.length );	
		}
		console.log( _log ); _log1 = _log;
	}
	
	var wordsCount = function(){
		if(!_wordsdata){ 
			_wordsdataArr = (_wordsdata = _prefixData( document.getElementById('rawdata2').innerHTML ) ).split('\n');
		}
		var _log = '';
		for(k=7; k<(7+256); ++k){
			_log += (_wordsdataArr[k].split('$').length-1) + ',\t'; 
		}
		console.log('\n\n'+_log); _log2 = _log;
	}
	
	
	var regexParse = function(){
		var regex = /(.*?)?(?:STEM)(?:\|POS:([^\|\n]*))?(?:\|(ACT\|PCPL))?(?:\|(IMPF|IMPV|PERF))?(?:\|(.*?))?(?:\|LEM:([^\|\n]*))?(?:\|ROOT:([^\|\n]*))?(?:\|(.*?))?$/mg;
		var refs = '#rawoutput', input = '#rawoutput2', output = '#words2', teststring, result, arr;
		$(refs).val('55');
		$('input:checked').attr('checked', false);
		go();
		$(output).val('');
		teststring = $(input).val();

		//Now test the regex and output result
		//arr = regex.exec( teststring );
		//arr = teststring.match( regex );
		//result = arr.join('\n')
		result = teststring.replace( regex, 'x' );
		result = result.split('\n').join(' ');
		$(output).val( result );
	}/*
	searchGrammarDupes(); 
	wordsCount();
	regexParse();*/
	$('#keyword').val( 'mercy' ); //$('#wordsbtn').click();
	doWordsSearch();
