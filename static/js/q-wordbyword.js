    var dataView;
    var grid;
    var data = [];

    var columns = [
		{id:"id", 		name:"#", 			field:"id", 										width: 40},
		{id:"ref", 		name:"Location", 	field:"ref", 		formatter:qUrlFormatter, 		width:65},
		{id:"buck", 	name:"buck", 		field:"buck", 		formatter:qStemFormatter,		width: 95},
		{id:"meaning", 	name:"meaning", 	field:"meaning", 	formatter:qMeaningFormatter,	width: 140},
		{id:"info", 	name:"info", 		field:"info", 		formatter:qInfoFormatter,  		width: 250, 	cssClass:"infocell" }
    ];
	var columnFilters = {};
	var searchString = "", searchFilter = false;

    var options = {
		rowHeight: 84, //54, //64
        editable:false,
        enableAddRow:false,
        enableCellNavigation:true
    };
	
	function qUrlFormatter(row, cell, value, columnDef,  dataContext){
		 if (!value) return "<span>-</span>";
		else {
			var tempValue = 'http://corpus.quran.com/wordmorphology.jsp?location=('+value+')';
			return "<span><a href='" + tempValue + "' target=_>" + value + '</a></span>';
		}   	
	}
	
	function qStemFormatter(row, cell, value, columnDef, dataContext){
		if(!value) return '-';
		return linkifyCorpusFeature(4, value);
	}
	
	function qMeaningFormatter(row, cell, value, columnDef, dataContext){
		if(!value) return '-';
		return linkifyCorpusFeature(5, value);
	}
	
	function qInfoFormatter(row, cell, value, columnDef, dataContext){  //(value, val2) {//return "wait...";
		if (!value) return "-"; //row=rowNo, cell=cellNo, dataContext has all the row data
		var buck = dataContext["buck"], bare, str = '', corpus;
		var ref = dataContext["ref"], index = dataContext["id"], tokens = [], i=0;
		if( corpus = lookupCorpusFeatures(index, ref, buck)){
			if(corpus.lemma)	tokens[i++] = 'Lemma: ' 	  + linkifyCorpusFeature(0, corpus.lemma);
			if(corpus.root)		tokens[i++] = 'Root: '        + linkifyCorpusFeature(1, corpus.root);
			if(corpus.form)		tokens[i++] = 'form: '        + linkifyCorpusFeature(2, corpus.form);
			if(corpus.pos)		tokens[i++] = 'pos: '         + linkifyCorpusFeature(3, corpus.pos);
			if(corpus.features)	tokens[i++] = 'features: '    + corpus.features;
			if(corpus.misc)		tokens[i++] = 'misc: '    	  + corpus.misc;
		}
		tokens[i++] = bare = 'Bare: ' 	  + lookupBare( ref, buck );
		//tokens[i++] = bare = 'Translit: ' + lookupTranslit( ref, buck );
		str = '<ul><li>' + tokens.join('</li><li>') + '</li></ul>';
		return ( '<span>'+ str + '</span>' );
	}
	
	
	function lookupBare( ref, buck ){
		return escape( BuckToBare(unescape(buck)) );
	}
	
	function lookupTranslit(ref, buck ){
		return buck;
	}
	
	function lookupCorpusFeatures(index, ref, buck){
		var corpus; if(!CORPUS.isInitialized) CORPUS.init();
		return corpus = CORPUS.parse(index, ref);
	}
	//LEMMA link:	http://corpus.quran.com/search.jsp?q=lem:liHoyat
	//ROOT  link:	http://corpus.quran.com/search.jsp?q=root:lHy
	//				http://corpus.quran.com/qurandictionary.jsp?q=jwz
	//Form link:	http://corpus.quran.com/search.jsp?q=(vii)
	//POS link:		http://corpus.quran.com/search.jsp?q=POS:N
	//STEM link:	http://corpus.quran.com/search.jsp?q=stem:fiY
	//Meaning:		http://corpus.quran.com/search.jsp?q=%22old%20woman%22  (u can quote the word for exact search)

	var CORPUS_SEARCH_TEMPLATES = [ 'http://corpus.quran.com/search.jsp?q=LEM:', 'http://corpus.quran.com/search.jsp?q=ROOT:', 'http://corpus.quran.com/search.jsp?q=', 'http://corpus.quran.com/search.jsp?q=POS:', 'http://corpus.quran.com/search.jsp?q=STEM:', 'http://corpus.quran.com/search.jsp?q=', 'http://corpus.quran.com/qurandictionary.jsp?q=' ];
	function linkifyCorpusFeature(typeindex, value){ if(typeindex<0 || typeindex >= CORPUS_SEARCH_TEMPLATES){debugger; return value; }//failed ASSERTION
		var template = CORPUS_SEARCH_TEMPLATES[typeindex];
		if(!template) return value;
		if(typeindex == 5) template += '"' + value + '"'; //This for meanings, to enclose in dbl quotes
		else template += value;
		var url = "<A HREF='"+ template + "' target=_blank >" + value + "</A>";
		if(typeindex == 1) url += "&nbsp;&nbsp;&nbsp;&nbsp;<A HREF='" + CORPUS_SEARCH_TEMPLATES[6] + value + "' target=_blank >" + "<small>2</small>" + "</A>";
		return url;		
	}
	
	var CORPUS = {}
	CORPUS.isInitialized = false;
	CORPUS._regexStems = /.*?STEM[^\n]*/g;
	CORPUS._regexMatchRef = "\\(REF.*$"; //Ex: "\\(1:7:9.*$";
	CORPUS._regexParse =		/(.*?)?(?:STEM)(?:\|POS:([^\|\n]*))?(?:\|((?:ACT|PASS)\|PCPL))?(?:\|(IMPF|IMPV|PERF))?(?:\|(PASS))?(?:\|(VN))?(?:\|(\([IVX]*\)))?(?:\|LEM:([^\|\n]*))?(?:\|ROOT:([^\|\n]*))?(?:\|(.*?))?$/;	
	CORPUS.LEMMA = 8; CORPUS.ROOT = 9; CORPUS.FORM = 7; CORPUS.PERSONGS = 10; CORPUS.MISC = 0; CORPUS.POS = 2;
	CORPUS._rawdata = CORPUS._rawdataArr = '';

	CORPUS.parse = function(index, ref){ if(!CORPUS.isInitialized) return;
		var oParsed, corpus; 
		try{
			if(!parseInt(index) ){debugger; return;}
			oParsed = CORPUS.regexParse( CORPUS.lookupRef(index, ref) );
			corpus = {}; corpus.lemma = corpus.root  = corpus.form  = corpus.features = corpus.misc = corpus.pos = '--';
			corpus.lemma = oParsed[ CORPUS.LEMMA ];
			corpus.root  = oParsed[ CORPUS.ROOT ];
			corpus.form  = oParsed[ CORPUS.FORM ]; if(!corpus.form) corpus.form = '(I)';
			corpus.features = oParsed[ CORPUS.PERSONGS ];
			corpus.misc  = oParsed[ CORPUS.MISC ];
			corpus.pos	 = oParsed[ CORPUS.POS ];
		}catch(err){ console.log(err.message); console.log(err); debugger; }
		if(index < 10) console.log(oParsed);
		return corpus;
	}

	CORPUS.lookupRef = function(index, ref){ var str = '', pattern, regexp;
		pattern = CORPUS._regexMatchRef.replace(/REF/, ref);
		regexp = new RegExp(pattern, "m");
		str = regexp.exec( CORPUS._rawdataArr.join('\n') );
		if(!str){ debugger;
			str = CORPUS._rawdataArr[ index ];
		}
		return str;
	}
	
	CORPUS.init = function(){ if(CORPUS.isInitialized) return;
		CORPUS._rawdata = document.getElementById('dataislandcorpus').innerHTML; 
			//.replace(/\|PCPL\|/g, '*PCPL|').replace(/\|INDEF\|/g, '*INDEF|').replace(/\|PASS\|/g, '*PASS|');
		CORPUS._rawdataArr = CORPUS._rawdata.match( CORPUS._regexStems ); 
		CORPUS.isInitialized = true;
	}

	CORPUS.regexParse = function(teststring){
		return CORPUS._regexParse.exec( teststring );
	}
	

	 function updateHeaderRow() {
		for (var i = 0; i < columns.length; i++) {
			if (columns[i].id !== "selector") {
				var header = grid.getHeaderRowColumn(columns[i].id);
				$(header).empty();
				$("<input type='text'>")
					.data("columnId", columns[i].id)
					.width(65) ///$(header).width() - 4)
					.val(columnFilters[columns[i].id])
					.appendTo(header);
			}
		}
	}

	function filter(item) {
		if (searchString != "" && (item["buck"].indexOf(searchString) == -1
							   && item["meaning"].indexOf(searchString) == -1
							   && item["ref"].indexOf(searchString) == -1
							   && item["info"].indexOf(searchString) == -1
							   )
			)
			return false;
		else
		if(searchFilter && searchString != ""){
			$('#rawoutput').text ( $('#rawoutput').text()  + item["ref"] + '\n');
			$('#rawoutput2').text( $('#rawoutput2').text() + item["meaning"] + '\n');
		}
		for (var columnId in columnFilters) {
			if (columnId !== undefined && columnFilters[columnId] !== "") {
				var c = grid.getColumns()[grid.getColumnIndex(columnId)];
				if (item[c.field] != columnFilters[columnId]) {
					return false;
				}
			}
		}
		return true;
	}

    var searchString = "", searchFilter=false;
    var h_runfilters = null;

    function myFilter(item, args) {
        return item["percentComplete"] >= args;
    }

    $(function() {
        // prepare the data
        data = qLoadData(); //grid = new Slick.Grid("#myGrid", data, columns, options);
        dataView = new Slick.Data.DataView();
        grid = new Slick.Grid("#myGrid", dataView, columns, options);
        var pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));

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
		dataView.setFilter(filter);
        //dataView.setFilterArgs(0);
        dataView.endUpdate();
		
		// wire up the search textbox to apply the filter to the model
		$("#txtSearch,#txtSearch2").keyup(function(e) {
			Slick.GlobalEditorLock.cancelCurrentEdit();

			// clear on Esc
			if (e.which == 27)
				this.value = "";

			searchString = this.value;
			searchFilter = false;
			dataView.refresh();
		});
		
		$("#go").click(function(e) {
			searchString = $('#txtSearch').val();
			searchFilter = true;
			$('#rawoutput').text(''); $('#rawoutput2').text('');
			dataView.refresh();
			//searchFilter = false;
		});


    })


	var _rawdata, _rawdataArr, _rawdata2, _rawdata2Arr, _rawdataBare, _rawdataBareArr;
	
	function qLoadData(){ 
		var data=[], wordsArr, wordsArrBare, word2wordArr;
		var rawdata2, rawdata2Arr;
		if(!_rawdataArr){
				_rawdata = escape( document.getElementById('dataislandbuck').innerHTML ); //.replace(/\|PCPL\|/g, '*PCPL|').replace(/\|INDEF\|/g, 
				_rawdata2 = document.getElementById('dataislandmeaning').innerHTML;
				_rawdataArr = _rawdata.split('\n');
				_rawdata2Arr = _rawdata2.split('\n');
				_rawdataBare = escape( BuckToBare( document.getElementById('dataislandbuck').innerHTML ) );		
				_rawdataBareArr = _rawdataBare.split('\n');
		}
		var surano=0, versno=-1, wordno=-1, ref='', numberOfVerses=-1, startLineIndex=-1, endLineIndex=-1, wordIndx=1;
		var verseLine = '', verseLineSegments, meaningsLine, meaningsSegments;
		for(surano=1; surano <= 114; ++surano){
			numberOfVerses = verseCounts[ surano ];
			startLineIndex = verseIndexes[ surano ];
			endLineIndex   = verseIndexes[ surano + 1];
			if(numberOfVerses != endLineIndex-startLineIndex ) debugger; //ASSERT failed!! Check if data correct
			for(var i=startLineIndex, versno=1, wordno=1; i < endLineIndex; ++i, ++versno){
				verseLine = _rawdataArr[i]; meaningsLine = _rawdata2Arr[i];
				if(verseLine && meaningsLine ){
					verseLineSegments = verseLine.split(' ');
					meaningsSegments = meaningsLine.split('$');
					for(var k=0; k < verseLineSegments.length; ++k){
						wordno = k + 1;  ref=surano+':'+versno+':'+wordno;
						data[wordIndx-1] = new qDataItem(wordIndx, ref, verseLineSegments[k], meaningsSegments[k] ); ++wordIndx;
					}
				}
			}
		}
		return data;
	}
	function qDataItem(i, ref, word, wordToWordMeaning) {
		var tempArr;
        this.id = i;
		if(word){
			this.ref = ref;// +'   '+ i;
			this.buck = (word);	//this.bare = ''; //escape( BuckToBare( unescape(word) ) );
			this.meaning = (wordToWordMeaning);
			this.info = '--';
		}else this.ref = this.buck = this.meaning = this.info = '-';
    }

	var BuckToBare = function(str){ if(!str) return;
		str = str.replace(/[{`><]/g, 'A').replace(/[\&]/g, 'w').replace(/[}]/g, 'y').replace( /[\FNK#aeiou~\^]/g, '');
		return str;
	}
	var escape = function(input){ if(!input) return; return input.replace(/\</g, '&lt;').replace(/\>/g, '&gt;'); }
	var unescape = function(input){ if(!input) return; return input.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>'); }

	<!-- misc UTIL functions -->
	var _prefixData = function(DATA){           //profile('PREFIX-start');
		  if(!DATA) return;
		   var ARRAY = DATA.split('\n'), SEP='|'; //TODO: split using a regex, to account for /r/n
		   for(var n=0; n<ARRAY.length; ++n){
			 ARRAY[n] = mapLinenoToRef(n, SEP) + '|' + ARRAY[n];
		   } /*console.log( ARRAY );*/              //profile('PREFIX-end');
		   return ARRAY.join('\n');
	}	
	var fnMapWordToRoots = function(word){ var ROOTS = '', ch = '&zwnj;'; //'\200C'; //&#8204; '&zwnj;';  \200E &lrm;
		if(!word) return ROOTS;
		ROOTS = word.trim().split('').join(ch);
		return ROOTS;
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

