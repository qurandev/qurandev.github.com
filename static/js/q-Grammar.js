		var dataView;
		var grid;
		var data = [];
        var options = {
            enableCellNavigation: true,
            showHeaderRow: true
        };
        var columns = [];
        var columnFilters = {};
		var searchString = "";

		var _wordsdata, _wordsdataArr;
		var mapRefToWordMeaning = function(ref){ var index, temparr, temp, temp2, result;
			if(!parseInt(ref)){ debugger; return;}
			if(!_wordsdata){ 
				_wordsdataArr = (_wordsdata = _prefixData( document.getElementById('rawdata2').innerHTML ) ).split('\n');
			}
			index = -1 + mapRefToLineno( ref );
			temparr = ref.split(':'); 
			if(temparr.length >= 3){
				temp = parseInt( temparr[2] ); 
				temp2 = (_wordsdataArr[index]).split('$')[ temp-1 ]; 
				if( temp2.indexOf('|') != -1) temp2 = temp2.split('|')[1];
				result =  temp2 + '\n';
			}
			else result = _wordsdataArr[ index ] + '\n';
			return result;
		}
		
		var wordToWordFormatter = function(row, cell, value, columnDef,  dataContext){
			return '<span></span>';
		}
		
		var urlFormatter = function(row, cell, value, columnDef,  dataContext){
	         if (value == null || value === "")
                return "<span>-</span>";
            else {
				tempValue = 'http://corpus.quran.com/wordmorphology.jsp?location=('+value+')'; //value.replace("LEM:", "").replace("ROOT:", "");
                return "<span><a href='" + tempValue + "' target=_>" + value + '</a></span>';
			}
   	
		}

		var arabicFormatter = function(row, cell, value, columnDef, dataContext) {
            if (value == null || value === "")
                return "-";
            else {
				tempValue = value; //value.replace("LEM:", "").replace("ROOT:", "");
                return "<span style='color:green;font-weight:bold;' class='arr2'>" + EnToAr(unescape(tempValue)) +'</span><span style="font-size:1em;" class="small">&nbsp;&nbsp;'+ value + "</span>";
			}
        }

		var arabicFormatter2 = function(row, cell, value, columnDef, dataContext) {
            if (value == null || value === "")
                return "-";
            else {
				if(value.indexOf("LEM:")==-1 && value.indexOf("ROOT:")==-1)
					return value;
				else{
					tempValue = value.replace("LEM:", "").replace("ROOT:", "");
					tempValue = EnToAr(unescape(tempValue));
					if(value.indexOf("ROOT:") != -1) tempValue = fnMapWordToRoots( tempValue );
					return "<span style='color:green;font-weight:bold;' class='arr2'>" + tempValue +'</span><span style="font-size:0.8em;" class="small">&nbsp;&nbsp;'+ value + "</span>";
				}
			}
        }

		var arabicRootsFormatter2 = function(row, cell, value, columnDef, dataContext) {
            if (value == null || value === "")
                return "-";
            else {
				if(value.indexOf("LEM:")==-1 && value.indexOf("ROOT:")==-1)
					return value;
				else{
					tempValue = value.replace("LEM:", "").replace("ROOT:", "");
					tempValue = EnToAr(unescape(tempValue));
					if(value.indexOf("ROOT:") != -1){// tempValue = /*fnMapWordToRoots*/( tempValue );
						tempValue = '<span class="r1">' +tempValue[0]+ '</span>-<span class="r2">' +tempValue[1]+ '</span>-<span class="r3">'  +tempValue[2]+ '</span>';
					}
					return "<span style='color:Xgreen;font-weight:bold;' class='arr2'>" + tempValue +'</span><span style="font-size:0.8em;" class="small">&nbsp;&nbsp;'+ value + "</span>";
				}
			}
        }

		var arabicRootsFormatter = function(row, cell, value, columnDef, dataContext) {
            if (value == null || value === "")
                return "-";
            else {
				var tempValue = EnToAr(unescape(value));
				if(!tempValue) return "-";
				tempValue = '<span class="r1">' +tempValue[0]+ '</span>-<span class="r2">' +tempValue[1]+ '</span>-<span class="r3">'+tempValue[2]+ '</span>';
				return "<span class='arr3'>" + tempValue +'</span><span style="font-size:0.8em;" class="small">&nbsp;&nbsp;'+ value + "</span>";
			}
        }

		var arabicLemsFormatter = function(row, cell, value, columnDef, dataContext) {
            if (value == null || value === "")
                return "-";
            else {
				var tempValue;
				tempValue = value.replace("LEM:", "");
				tempValue = EnToAr(unescape(tempValue));
				return "<span style='color:Xgreen;font-weight:bold;' class='arr2'>" + tempValue +'</span><span style="font-size:0.8em;" class="small">&nbsp;&nbsp;'+ value + "</span>";
			}
        }

		
		var posFormatter = function(row, cell, value, columnDef, dataContext) {
            if (value == null || value === "")
                return "-";
            else if (value == "N")
                return "<span style='color:blue;font-weight:bold;'>" + value + "</span>";
            else if( value == "V")
                return "<span style='color:green;font-weight:bold;'>" + value + "</span>";
			else if( value == "COND" || value == "NEG")
                return "<span style='color:orange;font-weight:bold;'>" + value + "</span>";
			else if( value == "REM")
                return "<span style='color:voilet;font-weight:bold;'>" + value + "</span>";
			else if( value == "PRON")
                return "<span style='color:gray;font-weight:bold;'>" + value + "</span>";
			else
				return "<span style='color:gray'>" + value + "</span>";
        }
		
		var columns = [
			{id:"ref", name:"Location", field:"ref", formatter:urlFormatter, sortable: true},
			{id:"buck", name:"Form", field:"buck", formatter:arabicFormatter, sortable: true},
			{id:"pos", name:"Tag", field:"pos",  formatter:posFormatter, sortable: true},
			{id:"tags", name:"Features", field:"tags", sortable: true},
			{id:"f0", name:"field0", field:"f0", formatter:arabicLemsFormatter, sortable: true},
			{id:"f1", name:"field1", field:"f1", formatter:arabicRootsFormatter, sortable: true},
			{id:"f2", name:"field2", field:"f2", sortable: true},
			{id:"f3", name:"field3", field:"f3", sortable: true},
			{id:"f4", name:"field4", field:"f4", sortable: true},
			{id:"f5", name:"field5", field:"f5", sortable: true},
			{id:"f6", name:"field6", field:"f6", sortable: true},
			{id:"f7", name:"field7", field:"f7", sortable: true},
			{id:"f8", name:"field8", field:"f8", sortable: true},
			{id:"f9", name:"field9", field:"f9", sortable: true}
		];

		var options = {
			rowHeight: 54, //64
			enableCellNavigation: true,
            enableColumnReorder: false,
			resizable: true,
            showHeaderRow: true
		};

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

		var _regex;
        function filter(item) {
			if(!searchString) return true; //return all records
			else
			if(searchString && (searchString[0] == '!' || searchString[0] == '^')){
				//searchString = searchString.substring(1); //do reverse logic
				if ( !item["tags"] || item["tags"].indexOf(searchString.substring(1) ) != -1	)
					return false;
			}
			else
			if(searchString != "" && parseInt(searchString) ){ //make sure you match on starting references only. not in middle. ex: 2:
				if(!item["tags"] ) return false; if(typeof(DEBUG) != "undefined" && DEBUG) debugger;
				var pattern, regex;
				pattern = '^'+searchString;
				if(!regex)
					_regex = new RegExp( pattern, "igm" ); //ISSUE: make sure _regex made null, if not parseInt
				return _regex.test( item["ref"] );
			}
			else
			if (searchString != "" && (	( !item["tags"] || item["tags"].indexOf(searchString) == -1)
									  && (!item["ref"] || item["ref"].indexOf(searchString) == -1 )  //&& item["buck"].indexOf(searchString) == -1
								   )
				)
				return false;
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
		
		function collapseAllGroups() {
            dataView.beginUpdate();
            for (var i = 0; i < dataView.getGroups().length; i++) {
                dataView.collapseGroup(dataView.getGroups()[i].value);
            }
            dataView.endUpdate();
        }

        function expandAllGroups() {
            dataView.beginUpdate();
            for (var i = 0; i < dataView.getGroups().length; i++) {
                dataView.expandGroup(dataView.getGroups()[i].value);
            }
            dataView.endUpdate();
        }

        function clearGrouping() {
            dataView.groupBy(null);
        }

		var counter = -1;		
		function groupByNext() {
			if(++counter > 9) counter=0;
			var fieldName = 'f' + counter;
			groupBy( fieldName );
		}
		
		function groupBy(fieldName){
            dataView.groupBy(
                fieldName,
                function (g) {
					var percent = parseInt( (g.count / dataView.getPagingInfo().totalRows)*100 );
                    var response = "Group:  " + g.value + "  <span style='color:green'>(" + g.count + " items) " + percent + "% </span>";
					
					if(percent > 25) response = "<b>" + response + "</b>";
					else if(percent < 10) response = "<span style='color:gray !important'>" + "Group:  " + g.value + " (" + g.count + " items) " + percent + "% </span>";
					return response;
                },
                function (a, b) {
					return b.count - a.count; //<- DESC.  ASC -> return a.count - b.count;
                }
            );
            dataView.setAggregators([
                new Slick.Data.Aggregators.Avg("percentComplete")
            ], false);
        }

	var _regexParse =		/(.*?)?(?:STEM)(?:\|POS:([^\|\n]*))?(?:\|((?:ACT|PASS)\|PCPL))?(?:\|(IMPF|IMPV|PERF))?(?:\|(PASS))?(?:\|(VN))?(?:\|(\([IVX]*\)))?(?:\|LEM:([^\|\n]*))?(?:\|ROOT:([^\|\n]*))?(?:\|(.*?))?$/;

	// /(.*?)?(?:STEM)(?:\|POS:([^\|\n]*))?(?:\|((?:ACT|PASS)\|PCPL))?(?:\|(IMPF|IMPV|PERF))?(?:\|(PASS))?(?:\|(\([IVX]*\)))?(?:\|LEM:([^\|\n]*))?(?:\|ROOT:([^\|\n]*))?(?:\|(.*?))?$/;
	
	// /(.*?)?(?:STEM)(?:\|POS:([^\|\n]*))?(?:\|(ACT\|PCPL))?(?:\|(IMPF|IMPV|PERF))?(?:\|(\([IVX]*\)))?(?:\|LEM:([^\|\n]*))?(?:\|ROOT:([^\|\n]*))?(?:\|(.*?))?$/;
	var regexParse = function(teststring){
		return _regexParse.exec( teststring );
	}
	//SAMPLE OUTPUT of regexParse
	//0,1,2 ["(9:1:9:2)	mu$orikiyna	N	STEM|POS:N|ACT|PCPL|(IV)|LEM:mu$orik|ROOT:$rk|MP|GEN", "(9:1:9:2)	mu$orikiyna	N	", "N", 
	//3,4 "ACT|PCPL", undefined, 
	//5 6 7 8      "(IV)", "mu$orik", "$rk", "MP|GEN"]
	
		var LEMMA = 8, ROOT = 9, FORM = 7, PERSONGS = 10, MISC = 6;
		var _rawdata, _rawdataArr, _regexStems = /.*?STEM[^\n]*/g;	
		$(function() {
            var data = [];
			/////////////////////////////////////////////////////
			if(!_rawdataArr){
				_rawdata = document.getElementById('dataisland').innerHTML; //.replace(/\|PCPL\|/g, '*PCPL|').replace(/\|INDEF\|/g, '*INDEF|').replace(/\|PASS\|/g, '*PASS|');
				_rawdataArr = _rawdata.match( _regexStems ); //.split("\n");
			}
			var qdata = [], temp, ref, oParsed, lemma, root, form, personGenderSingular, misc=MISC;
			for(var i=0; i<_rawdataArr.length-1; ++i, misc=MISC){
				temp = _rawdataArr[i].split("\t");	
				ref = temp[0].replace('(', '').replace(')', '');
				temp[1] = escape(temp[1]);	//escape temp1
				temp[3] = escape(temp[3]);	//escape temp1
				
//				if(temp[3] != null && temp[3].indexOf("|") != -1)
//					temp2 = temp[3].split("|");
				oParsed = regexParse( _rawdataArr[i] ); if(typeof(DEBUG) != 'undefined' && DEBUG) debugger;
				if(oParsed == null){debugger; oParsed = ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-" ]; }
				else{
					lemma = oParsed[ LEMMA ];
					root  = oParsed[ ROOT ];
					form  = oParsed[ FORM ];
					personGenderSingular = oParsed[ PERSONGS ];
					for(var k=oParsed.length; k < 10; k++)
						oParsed[k] = "-";
				}
				if(i<20) console.log(oParsed);
				
				qdata[i] = {
					id: i,
                    ref: ref,
                    buck: temp[1],
                    pos: temp[2],
                    tags: temp[3],
                    f0: escape( lemma ), //lemma  7/8/9/10
                    f1: escape( root ), //root
					f2: (form ? form : '(I)'), //form
					f3: escape(personGenderSingular), //3MS, 2f etc. + all others. Ex: SP:
					f4: oParsed[misc--],  //ACT PCPL
					f5: oParsed[misc--],
					f6: oParsed[misc--],
					f7: oParsed[misc--],
					f8: escape( oParsed[misc--] ),
					f9: escape( oParsed[misc--] )
                };
			}
			data = qdata;
			/////////////////////////////////////////////////////
			var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
			dataView = new Slick.Data.DataView({
                groupItemMetadataProvider: groupItemMetadataProvider
            });
			//dataView = new Slick.Data.DataView();
			grid = new Slick.Grid("#myGrid", dataView, columns, options);
			// register the group item metadata provider to add expand/collapse group handlers
            grid.registerPlugin(groupItemMetadataProvider);

            grid.setSelectionModel(new Slick.CellSelectionModel());

			var pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));
			var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);

			
			
			dataView.onRowCountChanged.subscribe(function(e,args) {
				grid.updateRowCount();
                grid.render();
			});

			dataView.onRowsChanged.subscribe(function(e,args) {
				grid.invalidateRows(args.rows);
				grid.render();
            });

            $(grid.getHeaderRow()).delegate(":input", "change keyup", function(e) {
                columnFilters[$(this).data("columnId")] = $.trim($(this).val());
                dataView.refresh();
            });


            grid.onColumnsReordered.subscribe(function(e, args) {
                updateHeaderRow();
            });

            grid.onColumnsResized.subscribe(function(e, args) {
                updateHeaderRow();
            });

			// wire up the search textbox to apply the filter to the model
			$("#txtSearch,#txtSearch2").keyup(function(e) {
                Slick.GlobalEditorLock.cancelCurrentEdit();

				// clear on Esc
				if (e.which == 27)
					this.value = "";

				searchString = escape( this.value ); //Need to escape. for ex: searches like: LEM:bada>a
				dataView.refresh();
			});

			dataView.beginUpdate();
            dataView.setItems(data);
            dataView.setFilter(filter);
			//groupBy("buck");
            dataView.collapseGroup(0);			
            dataView.endUpdate();
            updateHeaderRow(); 
//			$("#myGrid").show();
			UIsetupRootsClickBehavior(); //UIsetupRootsSliderBehavior();
			UIsetupPRLLinks();
			$('#PRL').html( PRL.UIgetPRLLink('A') );
			$('#CORPUS').html( CORPUS.UIgetLink('A'));
			$('#CORPUS2').html( CORPUS.UIgetRefLink() );
		})

	//<!-- UI related -->
	var rootLetter = "", prevRootLetter = "";
    var percentCompleteThreshold = 0;
    var prevPercentCompleteThreshold = 0;
    var searchString = "";
    var h_runfilters = null;

    function myFilter(item, args) { if(typeof(DEBUG) != 'undefined' && DEBUG) debugger;
		if(args != "" && rootLetter != "")
			return item["pos"][0] == args; //item["percentComplete"] >= args;
		return true;
    }

	function filterAndUpdate() {
		var isNarrowing = true; //false; //percentCompleteThreshold > prevPercentCompleteThreshold;
		var isExpanding = false; //true; //percentCompleteThreshold < prevPercentCompleteThreshold;
		var renderedRange = grid.getRenderedRange();
		dataView.setFilterArgs(rootLetter);
		/*dataView.setRefreshHints({
			ignoreDiffsBefore:renderedRange.top,
			ignoreDiffsAfter:renderedRange.bottom + 1,
			isFilterNarrowing:isNarrowing,
			isFilterExpanding:isExpanding
		});*/
		dataView.refresh();
		prevRootLetter = rootLetter;		//prevPercentCompleteThreshold = percentCompleteThreshold;
	}

	var UIsetupRootsClickBehavior = function(){
		$('div .entryArea').hide();
		$('div .entryArea:first').slideDown();
		$('.navEntry:visible').unbind('click').bind('click', function(event){
			var word = $(this).prev('select').val(); 
			word = decodeURIComponent( word );
			console.info( 'Button clicked. 1) combo selection changed to: ' + word );
			$('#txtSearch').val('ROOT:' + word ).keyup(); 
			$('#PRL').html( PRL.UIgetPRLWordLink( word ) );
			$('#CORPUS').html( CORPUS.UIgetLink(word) );
			return false;
		});
		$('div.sectionArea a').unbind('click').bind('click', function(event){ 
			var root = (this.href.split('')[this.href.length - 1]); //debugger;
			UIsetContextRootLetter( root ); //UIdisplayRootWords( root );
			$('#PRL').html( PRL.UIgetPRLLink( root ) );
			$('#CORPUS').html( CORPUS.UIgetLink(root) );
			return false; 
		} );
	}
	var navigateDictionary = function(){}
	var UIsetupRootsSliderBehavior = function(){
        $("#pcSlider").slider({
            "range":"min",
            "slide":function(event, ui) {//map the ui.value 1 to 100 -- to Arabic letter 1-26
				var letterNum = parseInt( (ui.value/100)*28 );
				var buck = 'A A b t v j H x d * r z s $ S D T Z E g f q k l m n h w y';
				var letter = buck.split(' ')[ letterNum ]; console.info( letter );
				if(letterNum == 0) letter="";
				UIsetContextRootLetter( letter ); 
            }
        });	
	}
	
	var CORPUS = {}
	CORPUS.UIgetLink = function(root){
		return '<A href=http://corpus.quran.com/qurandictionary.jsp?q='+root +' target=_ >Corpus Dictionary ('+root +')</A>';
	}
	CORPUS.UIgetRefLink = function(ref){
		if(!ref) ref='1:1:1';
		var surano, versno, template, param='?chapter=61&verse=12', url1='http://corpus.quran.com/treebank.jsp', url2='http://corpus.quran.com/wordbyword.jsp',
			url3='http://corpus.quran.com/wordmorphology.jsp?location=';
		template = '<A HREF=' + url1 + ' target=_>Corpus treebank (' + ref +')</A> &nbsp;&nbsp;'+
				   '<A HREF=' + url2 + ' target=_>wordbyword (' + ref +')</A> '+
				   '<A HREF=' + url3 +'('+ ref +') target=_>morphology (' + ref +')</A>';
		if(!ref || !parseInt(ref) ) return template;
		surano = parseInt( ref.split(':')[0] ); 
		if(ref.indexOf(':') == -1) versno = 1;
		else versno = parseInt( ref.split(':')[1] );
		if(!surano || !versno || surano<1 || surano > 114) return template;
		param = '?chapter=' + surano +'&verse=' + versno;
		url1 += param; url2 += param;
		template = '<A HREF=' + url1 + ' target=_>Corpus treebank (' + ref +')</A> &nbsp;&nbsp;'+
				   '<A HREF=' + url2 + ' target=_>wordbyword (' + ref +')</A>'+
				   '<A HREF=' + url3 +'('+ ref +') target=_>morphology (' + ref +')</A>';
		return template;
   }
	
	
	var PRL = {}
	var UIsetupPRLLinks = function(){
		PRL.buck = 'A A b t v j H x d * r z s $ S D T Z E g f q k l m n h w y';
		PRL.index = '1_ALIF 1_ALIF 3_BA 21_TA 23_THA 10_JIIM 9_HAA 12_KHA 5_DAL 24_THAL 17_RA 28_ZAY 20_SIIN 19_SH 18_SAD 4_DAD 22_TAY 27_ZA 2_AYN 7_GH 6_FA 16_QAF 11_KAF 13_LAM 14_MIIM 15_NUN 8_ha 25_WAW 26_YA'; //.htm  data/PRLonline/ .htm
		PRL.map = {};
		arr1 = PRL.buck.split(' ');
		arr2 = PRL.index.split(' ');
		for(index=0; index<arr1.length; ++index){
			PRL.map[ arr1[index] ] = arr2[index].split('_')[1];
		}

		PRL.UIgetPRLWordLink = function(word){
			if(!word || word.length <= 2) return;
			var hash = [];
			for(j=0; j<word.length; ++j){
				hash[j] = PRL.map[ word[j] ];
			}
			var hashtag = hash.join('-');
			var url = PRL.UIgetPRLLink( word[0], hashtag );
			return url;
		}
		
		PRL.UIgetPRLLink = function(root, hashtag){
			if(!root) return; if(root.length > 1) return PRL.UIgetPRLWordLink(root);
			var arr1, arr2, index;
			arr1 = PRL.buck.split(' ');
			arr2 = PRL.index.split(' ');
			for(index=0; index<arr1.length; ++index)
				if(root == arr1[index]){
					var url = 'data/PRLonline/' + arr2[index] + '.htm';
					url = '<A href=' + url + (hashtag ? '#'+hashtag : '') +' target=_ >PRL link ('+root + ')</A>';
					if(hashtag) url += '#' + hashtag;
					return url;
				}
			return; //return null
		}

	}
	
	var UIsetContextRootLetter = function( letter ){
		if( rootLetter != letter ){
			window.clearTimeout(h_runfilters);
			h_runfilters = window.setTimeout(filterAndUpdate, 10);
			rootLetter = letter;
		}	    
		if(letter != "") UIdisplayRootWords(letter);
	}
	var UIdisplayRootWords = function(root){
		if(!root) return; var rootID = root;
		if(root == '*') rootID = 'TH'; if(root == '$') rootID = 'SH';
		var selector = '#' + rootID + '-entryList';
		$('div .entryArea').hide();	
		$(selector).parent().slideDown('slow');	
		$('#txtSearch').val('ROOT:' + root).keyup();
		$(selector).focus().unbind('change').bind('change', function(event){
			var word = $(this).val();
			word = decodeURIComponent( word );
			console.info( '2) combo selection changed to: ' + word );
			$('#txtSearch').val('ROOT:' + word ).keyup();
			$('#PRL').html( PRL.UIgetPRLLink( word ) );
			$('#CORPUS').html( CORPUS.UIgetLink( word )  );			
		});
		$(selector).next('button').unbind('click').bind('click', function(event){
			var word = $(this).prev('select').val();
			word = decodeURIComponent( word );
			console.info( '3) combo selection changed to: ' + word );
			$('#txtSearch').val('ROOT:' + word ).keyup(); 
			$('#PRL').html( PRL.UIgetPRLWordLink( word ) );
			$('#CORPUS').html( CORPUS.UIgetLink( word ) );
			return false;
		});
	}
	
	//<!-- UTILITY -->
	var fnMapWordToRoots = function(word){ var ROOTS = '', ch = '&zwnj;&zwnj;&zwnj;'; //'\200C'; //&#8204; '&zwnj;';  \200E &lrm;
		if(!word) return ROOTS;
		ROOTS = word.trim().split('').join(ch);
		return ROOTS;
	}
	var BuckToBare = function(str){ if(!str) return;
		str = str.replace(/[{`><]/g, 'A').replace(/[\&]/g, 'w').replace(/[}]/g, 'y').replace( /[\FNK#aeiou~\^]/g, '');
		return str;
	}
	var escape = function(input){ if(!input) return; return input.replace(/\</g, '&lt;').replace(/\>/g, '&gt;'); }
	var unescape = function(input){ if(!input) return; return input.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>'); }
	
	
	
	//SEARCH RELATED FUNCTIONALITY
	 function morphological_search(notOnChange) {
	        var query = "";  // Initiate.

	        // Part-of-speech.
	        var pos = document.getElementById("partOfSpeechList").value;

	        if (pos != "none") {
	            if (query.length > 0) {
	                query += ' ';
	            }
	            query += "pos:" + pos;
            }

            // Form.
            var form = document.getElementById("formList").value;
            if (form != "none") {
                if (query.length > 0) {
                    query += ' ';
                }
                query += form;
            }

            // Root.
            var root = document.getElementById("rootTextBox").value;
            if (root != null && root.length > 0) {
                if (query.length > 0) {
                    query += ' ';
                }
                query += "root:" + root;
            }

            // Lemma.
            var lemma = document.getElementById("lemmaTextBox").value;
            if (lemma != null && lemma.length > 0) {
                if (query.length > 0) {
                    query += ' ';
                }
                query += "lem:" + lemma;
            }

            // Stem.
            var stem = document.getElementById("stemTextBox").value;
            if (stem != null && stem.length > 0) {
                if (query.length > 0) {
                    query += ' ';
                }
                query += "stem:" + stem;
            }
			
			//pos form root lemme stem
			if( form && form != 'none' && form != '(i)') $('#txtSearch').val( form.toUpperCase() ).keyup(); 
			if( pos  && pos  != 'none' ){ $('.ui-state-default .c2 > input').val(pos).change();}  //<div class="ui-state-default slick-headerrow-column c2"><input type="text" style="width: 65px; "></div>
			if( pos  && pos  == 'none' ){ if($('.ui-state-default .c2 > input').val() != '' ) $('.ui-state-default .c2 > input').val('').change();} 
			if( root != null && root.length > 0) $('#txtSearch').val( 'ROOT:'+root ).keyup();
			if( lemma != null && lemma.length > 0) $('#txtSearch').val( 'LEM:'+lemma ).keyup();
			if( stem != null && stem.length > 0) $('#txtSearch').val( 'STEM:'+stem ).keyup();
			
            // Execute search.
	        console.info(query +'\n'+ encodeURIComponent(query) );//document.location.href = "/search.jsp?q=" + encodeURIComponent(query);
			return false;
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
