﻿//var QuranNavigator = (function() {

var CORPUS = {
	LinkWordMorphology: "http://corpus.quran.com/wordmorphology.jsp?location=($1)",
	LinkQuranDictionary: "http://corpus.quran.com/qurandictionary.jsp?q=$1",
	LinkLemmaSearch:	 "http://corpus.quran.com/search.jsp?q=lem:$1",

	TemplateRefLink:	"$3<A HREF=$1 TARGET=_>$2</A><IMG SRC=images/external_link.gif></IMG>",
	TemplateRootLink:	"$3<A HREF=$1 TARGET=_>$2</A>",
	TemplateRootDecoratedLink:	"<SPAN CLASS=r1 style=color:red>$1</SPAN>&zwnj;<SPAN CLASS=r2 style=color:green>$2</SPAN>&zwnj;<SPAN CLASS=r3 style=color:blue>$3</SPAN>",
	TemplateLemmaLink:	"$3<A HREF='$1' TARGET=_>$2</A>",
	
	UIgetRefLink:		function(ref, linkname, linkprefix){
		var link = CORPUS.LinkWordMorphology.replace(/\$1/, ref);
		return CORPUS.TemplateRefLink.replace(/\$1/, link).replace(/\$2/, linkname?linkname:ref).replace(/\$3/, linkprefix?linkprefix:'');
	},
	
	UIgetArabicAlmanacLink:	function(root){
		var ejlink = '&nbsp;<A HREF=http://ejtaal.net/m/aa/#q=' + CORPUS.mapBuckToEjtaal(root) + ' TARGET=_ title=Arabic_Almanac><span dir=ltr style=font-size:0.81em;>(AA)</span></A>';
		return ejlink;
	},
	
	mapBuckToEjtaal:	function(root){
		root = root.replace(/v/g, 'th').replace(/x/g, 'kh').replace(/\*/g, 'dh').replace(/\$/g, 'sh') ; //.replace(/g/g, 'gh'); //no need ghain. g ok.
		return root;
	},
	
	UIgetRootLink:		function(root, linkname, linkprefix){
		var link = CORPUS.LinkQuranDictionary.replace(/\$1/, root);
		return CORPUS.TemplateRootLink.replace(/\$1/, link).replace(/\$2/, linkname?linkname:root).replace(/\$3/, linkprefix?linkprefix:'Root: ') + 
			( CORPUS.UIgetRootCount(root) ? '&nbsp;<span dir=ltr style=font-size:0.87em;>(' + CORPUS.UIgetRootCount(root) + ' times)</span>' : '' ) + 
			CORPUS.UIgetArabicAlmanacLink(root);
	},

	UIgetRootDecoratedLink:		function(root, linkname, linkprefix){
		var temp='', rootLetters = (linkname ? linkname.split('') : root.split('') );
		temp = CORPUS.TemplateRootDecoratedLink.replace(/\$1/, rootLetters[0]).replace(/\$2/, rootLetters[1]).replace(/\$3/, rootLetters[2]);
		return CORPUS.UIgetRootLink(root, temp, linkprefix);
	},

	UIgetLemmaLink:		function(lemma, linkname, linkprefix){
		var link = CORPUS.LinkLemmaSearch.replace(/\$1/, escape(lemma));
		return CORPUS.TemplateLemmaLink.replace(/\$1/, link).replace(/\$2/, linkname?linkname:escape(lemma)).replace(/\$3/, linkprefix?linkprefix:'Lemma: ') + (CORPUS.UIgetLemmaCount(lemma) ? '&nbsp;<span dir=ltr style=font-size:0.92em;>(' + CORPUS.UIgetLemmaCount(lemma) + ' times)</span>' : '');
	},
	
	
	UIgetLemmaCountTillRef: function(lemma, root, gq_verse, ref){  if(gq.loadedPercent != 100) return '';
		var tempstr = '', temparr, pattern = 'LEM\\:', count = 0, message = '', regexp, arr, lineno;
		if(lemma){
			try{//get verseNo from ref. ref '4:5:12'
				lineno = Quran.verseNo.ayah( parseInt(ref.split(':')[0]), parseInt(ref.split(':')[1]) );
			}catch(e){} 
			if(!lineno){ console.log('invalid ref ' + ref + ' using gq_verse ' + gq_verse); lineno = gq_verse;
			}
			temparr = gq.strings.slice(0, lineno);
			
			if(temparr) tempstr = temparr.join('\n');
			regexp = RegExp( pattern + escapeForRegex(lemma), "g");
			arr = tempstr.match( regexp ); if(arr) count = arr.length;
			tempstr = ''; tempstr = null;
			message = count>0 ? CORPUS.UIprettifyCount(1+count) +' occurence' : '<b>First</b> occurrence';	
			if(CORPUS.UIgetLemmaCount(lemma))
				message += ' of <b>' + CORPUS.UIgetLemmaCount(lemma) + '</b> total. ';
		}
		//if(root) message  += '<small><b>' + CORPUS.UIgetRootCount(root) + '</b>x as root.</small>';
		return '<BR/>' + message + '<BR/>';
	},
	
	UIprettifyCount: function(number){ var suffix = '';
		suffix = (number%10 == 1 ? 'st' : (number%10 == 2 ? 'nd' : (number%10 ==3 ? 'rd' : 'th') ) );
		return '<b>'+number + '</b><span style=vertical-align:super;font-size:xx-small;>'+suffix + '</span>';
	},
	
	UIgetNearSynonyms: function(lemma){
		var nearsynonyms = '', synonymFound = false, antonyms='', antonymFound = false; //, lemmaBare = BuckToBare(lemma);
		//var regexp = RegExp( '\\b' + escapeForRegex(lemma) /*+ '\\b'*/);
		if(NEAR_SYNONYMS && NEAR_SYNONYMS_METADATA){
			$.each(NEAR_SYNONYMS, function(lineno, line){
				if( /*regexp.test( line ) CHECK FOR EXACT WORD only using regex.. */ 
					(' ' + line + ' ').indexOf(' ' + lemma +' ') != -1  /*|| BuckToBare(line).indexOf(lemmaBare) != -1*/ ){ //console.log(lemma + '\t\t' + line);
					if(line.split('||').length <= 1){
						synonymFound = true; nearsynonyms = '';
						nearsynonyms += EnToAr(line);
					}else{
						antonymFound = true; antonyms = '';
						antonyms += EnToAr(line);
					}					
					if( NEAR_SYNONYMS_METADATA[lineno]){
						var info = NEAR_SYNONYMS_METADATA[lineno].info, MAXINFO = 400;
						if(!info) info = CORPUS.UIgetNearSynonymsPageLink( lemma, NEAR_SYNONYMS_METADATA[lineno].page );
						else{
							if(info.length > MAXINFO)
								info = info.substring(0, MAXINFO) + "<span onclick='$(\"#moreinfo\").show();return false;\'>...</span><span id=moreinfo style=display:none;>" + 
								info.substring(MAXINFO, info.length - MAXINFO) + '</span>';
//								"... <BR/><strong><small>Click Lens icon above, to read full entry.</small></strong>";
						}
						//nearsynonyms = NEAR_SYNONYMS_METADATA[a].split('|')[0] + nearsynonyms + NEAR_SYNONYMS_METADATA[a].split('|')[1];
						nearsynonyms =  NEAR_SYNONYMS_METADATA[lineno].topic + '<BR/>' + nearsynonyms + '<BR/>' +  info + '<BR/>'; 
					}else nearsynonyms += '<BR/>Refer book for details. (User contributions welcome!)<BR/>' + CORPUS.UIgetNearSynonymsPageLink( 1 ) + '&nbsp; (Pls type summary & submit via feedback.)'; 
				}
			});
		}
		return (synonymFound ? '<BR/><font color=green><b>near-Synonyms</b></font>: ' + nearsynonyms + '<BR/>' : '') +
			   (antonymFound ? '<BR/><font color=maroon><b>Antonyms</b></font>: ' + antonyms + '<BR/>' : '');
	},
	
	UIgetNearSynonymsPageLink: function(lemma, pageno){
		var TEMPLATE = '<A HREF="javascript:CORPUS.UIsynonymClicked(\'$LEM\', $PAGENO, $1);" TARGET=_>$2</A>';
		//'<A HREF="javascript:CORPUS.UIsynonymClicked(\'$LEM\', $2, \'http://www.scribd.com/embeds/82681420/content?access_key=key-6w25dij9keuw0vv8keu&amp;start_page=$1\')" TARGET=_ >$2</A>';
		var mapPageno = pageno ? ( 18 + parseInt(pageno) ) : 1;
		var linktext = pageno ? 'Page# ' + parseInt(pageno) : 'Book';
		return TEMPLATE.replace(/\$1/g, mapPageno ).replace(/\$2/g, linktext ).replace(/\$LEM/g, lemma).replace(/\$PAGENO/g, pageno);
	},
	
	_scribd_doc: null,
	
	UIsynonymClicked: function(lemma, pageno, mappageno){ //var iframeURL = 'http://www.scribd.com/embeds/82681420/content?access_key=key-6w25dij9keuw0vv8keu&amp;start_page=$1'; iframeURL = iframeURL.replace(/\$1/g, mappageno);
		if( !$('#book') || $('#book').length <= 0 ){
			loadExtraFiles('http://www.scribd.com/javascripts/scribd_api.js');
			$('body').append('<div id=book style="position:fixed; bottom:0; left:0;"><div style="background-color: #32BD2F; height: 12px;"><div style="float: right; width: 42px; height: 12px; padding: 2px;"><img id="bookclose" alt="Close" src="images/close.gif" /></div></div><div id="embedded_doc" class=leftcolumn><a href="http://www.scribd.com" target=_>Scribd</a></div></div></div>');
			CORPUS.UILoadPDF(mappageno);
		}
		else{ //navigate to the specified page.. mappageno
			$('#book').show();
			if(CORPUS._scribd_doc){
				CORPUS._scribd_doc.api.setPage( mappageno );
			}
		}
		$("#bookclose, #bookclose2").click(function() { $('#book').hide(); /*$.unblockUI();*/ });
		/*$.blockUI({ message: $("#book"), css: {
			 Xwidth: '425px',
			 Xheight: '225px',
			 Xleft: ($(window).width() - 425) /2 + 'px',
			 Xtop: '10%'
		}});*/
		return false;
	},
	
	UILoadPDF: function(mappageno){
		if(typeof(scribd) == 'undefined' || !scribd || !scribd.Document){
			setTimeout('CORPUS.UILoadPDF('+ mappageno + ')', 100); //TODO: there must be max number of attempts!!!
			return;
		}
		var scribd_doc  = scribd.Document.getDoc(82681420, 'key-6w25dij9keuw0vv8keu');
		var onDocReady = function(e){ /*alert('document pdf ready');*/ $('#book').show(); if(scribd_doc) scribd_doc.api.setPage(mappageno); CORPUS._scribd_doc = scribd_doc; }
		if(scribd_doc){ scribd_doc.addParam('jsapi_version', 1); scribd_doc.addEventListener('docReady', onDocReady); 
			scribd_doc.addParam('height', 550);  scribd_doc.addParam('width', 425); scribd_doc.addParam('auto_size', true);
			scribd_doc.addParam('mode', 'list'); scribd_doc.addParam('jsapi_version', 2);
			scribd_doc.write('embedded_doc'); $('#book').show(); // Write the instance
		}
	},
	
	UIgetSarfSagheer: function(root, form){
		var sarfSagheer = '', sarfFound = false;
		if(SARF_SAGHEER){
			var key = root;
			if(form) (form!='(I)') ? key = root + ',d' + CORPUS.FORM_MAPPING[ form ] : key = root + ',b'; //to avoid multiple false matches
			$.each(SARF_SAGHEER, function(a, line){
				if(line.indexOf(key) != -1){ console.log(key +'\t\t'+ line);
					sarfFound = true; sarfSagheer = '';
					var arr = line.split(',');
					for(var j=0; j<6; ++j) sarfSagheer += arr[arr.length - 9 +j ] + '&nbsp;&nbsp;';
					//break;
				}
			});
		}
		return sarfFound ? '<BR/>Sarf: ' + sarfSagheer + '<BR/>': '';
	},
	
	FORM_MAPPING: { "(I)": "1", "(II)": "2", "(III)": "3", "(IV)": "4", "(V)": "5",
					"(VI)": "6", "(VII)": "7", "(VIII)": "8", "(IX)": "9", "(X)": "10", "(XI)": "11", "(XII)": "12" },
	
	UIgetLemmaCount:	function(lemma){ if(gq.loadedPercent != 100) return;
		if(CORPUS._RAWDATAALL == ''){
			CORPUS._RAWDATAALL = gq.strings.join('\n'); 
		}
		var pattern = 'LEM\\:', count = '';
		var regexp = RegExp( pattern + escapeForRegex(lemma), "g");
		var arr = CORPUS._RAWDATAALL.match( regexp ); if(arr) count = arr.length;
		return count;
	},
	
	UIgetRootCount:		function(root, linkname, linkprefix){  if(gq.loadedPercent != 100) return;
		if(CORPUS._RAWDATAALL == ''){
			CORPUS._RAWDATAALL = gq.strings.join('\n'); 
		}
		var pattern = 'ROOT\\:', count='';
		var regexp = RegExp( pattern + escapeForRegex(root), "g");
		var arr = CORPUS._RAWDATAALL.match( regexp ); if(arr) count = arr.length;
		return count;
	},
	
	
	UIgetPOSLink:		function(pos, linkname, linkprefix){
		return (linkprefix?linkprefix : '') + pos;
	},
	
	UIgetFeaturesLink:	function(features, linkname, linkprefix){
		if(!features) return;
		var html='', items = features.split('|'), item, lookup;
		lookup = CORPUS.FEATURES_MAPPING[ features ]; //it might be readymade
		if(lookup) html += lookup  + '&nbsp;&nbsp;';
		else for(var i=0; i<items.length; ++i){
			item = items[i];
			lookup = CORPUS.FEATURES_MAPPING[ item ];
			if(lookup) html += lookup + '&nbsp;&nbsp;';
			else html += UI_grammarEscapeUIFriendly( item ) + '&nbsp;&nbsp;'; //since it can be SP: w foreign chars.
		}
		//if(CORPUS.FEATURES_MAPPING[ features ]){
		//	html += '<IMG SRC=../plugins/quran-grammar/Images/' + [ features ] + '.gif /><BR/> ';
		//}
		html += '<!--&nbsp;('+ UI_grammarEscapeUIFriendly(features) +')-->'; //(linkprefix?linkprefix : 'Features: ') + 
		return html;
	},
	
	UIgetMiscLink:		function(misc, linkname, linkprefix){
		return '<span style=font-size:8px;color:#C0C0C0;#F0F0F0; >' + (linkprefix?linkprefix : 'Misc: ') + escapeMisc(misc) + '</span>';
	},
	
	UIgetWordGrammarDisplay: function(refAndData)
	{
		var corpus, str = '', root='', lemma = '', pos = '', features='', ref, Data;
		if(!refAndData || refAndData.indexOf('||')==-1) return;
		ref = refAndData.split('||')[0];
		Data = refAndData.split('||')[1];
		try{
			corpus = CORPUS.parse( Data ); //console.log(corpus);
		}catch(err){ console.log(err.message); console.log(err); debugger; }
		if(corpus){
			str = '<ul style="line-height:1.2em !important;">';
			if(corpus.pos) 			str +=	'<li>'+ '<span style=font-size:1.3em; class=POS-'+ corpus.pos + '>'+ corpus.pos +'</span> – '+
											//CORPUS.UIgetPOSLink(corpus.pos) + 
											(corpus.vn ? ' Verbal Noun ' : '' ) + 
											(corpus.activepassivepcpl ? ' '+ CORPUS.ACTIVEPASSIVEPCPL_MAPPING[corpus.activepassivepcpl] + ' ' : '') + 
											(corpus.passive ? ' '+(corpus.passive == 'PASS' ? 'Passive' : corpus.passive )+' ' : '') +
											(corpus.form != '(I)' ? (' Form '+corpus.form+' ') : '') + // form: ' + corpus.form +
											(corpus.tense ? ' ' + CORPUS.TENSE_MAPPING[ corpus.tense ] + ' ' : '') + 
											'<span style=font-size:1.3em; class=POS-'+ corpus.pos + '>'+ CORPUS.UIlookupPOS(corpus.pos) +'</span></li>';
			if(corpus.features) 	str += '<li>' + CORPUS.UIgetFeaturesLink(corpus.features) + '</li>';
			str += '<li>';
			if(corpus.lemma)		str += CORPUS.UIgetLemmaLink(corpus.lemma, EnToAr(corpus.lemma), 'Dict: ') + '&nbsp;';
			if(corpus.root)			str += CORPUS.UIgetRootDecoratedLink(corpus.root, EnToAr(corpus.root), 'Root: ') + '&nbsp;'; //If u dont want colored, use UIgetRootLink
			if(corpus.lemma)		str += CORPUS.UIgetLemmaCountTillRef(corpus.lemma, corpus.root, gq.verse(), ref );
			if(typeof(corpus.pos) != 'undefined' && corpus.pos == 'V' && corpus.root && corpus.form)
									str += CORPUS.UIgetSarfSagheer(corpus.root, corpus.form);
			if(typeof(corpus.lemma) != 'undefined' && corpus.lemma /*&& corpus.pos == 'N'*/)
									str += CORPUS.UIgetNearSynonyms( corpus.lemma );
			if(corpus.misc)			str += '</li><li>' + CORPUS.UIgetMiscLink(corpus.misc);// + CORPUS.UIgetRefLink(ref,'more info');
			if(corpus.features)
				if(CORPUS.FEATURES_MAPPING[ corpus.features ])
									str += '</li><li>' + '<IMG SRC=../plugins/quran-grammar/Images/' + [ corpus.features ] /*+ 'PERF3MS'*/ + '.gif /><BR/> ';
			str += '</li></ul>';
		}
		var obj = {};
		obj.corpus = corpus;
		obj.html   = str;
		obj.pos    = corpus.pos;
		return obj;
	},
	
	FEATURES_MAPPING: {'GEN': 'Genitive case.', 'ACC': 'Accusative case.', 'NOM': 'Nominative case.', 'INDEF': 'Indefinte.', 
						'3MS': '3rd person Masculine Singular.', '3MP': '3rd person Masculine Plural.', 
						'2MP': '2nd person Masculine Plural.', '2MS': '2nd person Masculine Singular.',
						'M': 'Masculine.', 'F': 'Feminine.', 'S': 'Singular.', 'P': 'Plural.',
						'SP:kaAn': 'belongs to a special group of words known as <BR/>kāna and her sisters (كان واخواتها). <BR/>', 
						'SP:<in~': 'belongs to a special group of words known as <BR/>inna and her sisters (ان واخواتها). <BR/>',
						'SP:kaAd': 'belongs to a special group of words known as <BR/>kāda and her sisters (كاد واخواتها). <BR/>', 
						'MP': 'Masculine Plural', '1P': '1st person Plural', 
						'2MS': '2nd person Masculine Singular', '3FS': '3rd person Feminine Singular', 'MS': 'Masculine singular', 
						'FP': 'Feminine plural', 'FS': 'Feminine Singular', '1S': '1st person Singular', 
						'MD': 'Masculine Dual', 'FD': 'Feminine Dual', '3D': '3rd person Dual', '3FD': '', 
						'MOOD:JUS': 'Jussive mood.', 'MOOD:SUBJ': 'Subjunctive mood.'},
	
	TENSE_MAPPING: {"IMPV": "Imperative", "IMPF": "Imperfect", "PERF": "Perfect"},
					//{"IMPV": "Imperative (commanding etc tense)", "IMPF": "Imperfect (present, future tense)", "PERF": "Perfect (past tense)"},
					
	ACTIVEPASSIVEPCPL_MAPPING: {"PASS|PCPL": "Passive participle", "ACT|PCPL": "Active participle"},
	
	POS_MAPPING: { "N": "NOUN", "V": "VERB", 'PN': 'Proper Name', 'ADJ': 'Adjective', 'REL': 'Relative pronoun', 
						'PRON': 'Pronoun', 'CONJ': 'Conjunction', 'NEG': 'Negative particle', 'P': 'Preposition',
						'INL': 'Quranic initials', 'DEM': 'Demonstrative pronoun', 'ACC': 'accusative particle',
						'RES': 'restriction particle', 'T': 'time adverb', 'PRO': 'prohibition particle', 'PREV': 'preventive particle',
						'INC': 'inceptive particle', 'AMD': 'amendment particle', 'SUB': 'subordinating conjunction', 'LOC': 'Location adverb', 'COND': 'conditional particle'
					},
		//REM: prefixed resumption particle
		//EQ: prefixed equalization particle
		//INTG: prefixed interrogative alif
		//EMPH: emphatic prefix lām
		//VOC: prefixed vocative particle ya
					
	UIlookupPOS: function(pos){
		if( CORPUS.POS_MAPPING[pos]) return CORPUS.POS_MAPPING[pos];
		else return pos;
	}
			
};









	//   -- SAMPLE CORPUS links to get idea -- 
	//LEMMA link:	http://corpus.quran.com/search.jsp?q=lem:liHoyat
	//ROOT  link:	http://corpus.quran.com/search.jsp?q=root:lHy
	//				http://corpus.quran.com/qurandictionary.jsp?q=jwz
	//Form link:	http://corpus.quran.com/search.jsp?q=(vii)
	//POS link:		http://corpus.quran.com/search.jsp?q=POS:N
	//STEM link:	http://corpus.quran.com/search.jsp?q=stem:fiY
	//Meaning:		http://corpus.quran.com/search.jsp?q=%22old%20woman%22  (u can quote the word for exact search)

	var CORPUS_SEARCH_TEMPLATES = [ 'http://corpus.quran.com/search.jsp?q=LEM:', 'http://corpus.quran.com/search.jsp?q=ROOT:', 'http://corpus.quran.com/search.jsp?q=', 'http://corpus.quran.com/search.jsp?q=POS:', 'http://corpus.quran.com/search.jsp?q=STEM:', 'http://corpus.quran.com/search.jsp?q=', 'http://corpus.quran.com/qurandictionary.jsp?q=' ];
	function linkifyCorpusFeature(typeindex, value){ if(typeindex<0 || typeindex >= CORPUS_SEARCH_TEMPLATES.length){debugger; return value; }//failed ASSERTION
		var template = CORPUS_SEARCH_TEMPLATES[typeindex];
		if(!template) return value;
		if(typeindex == 5) template += '"' + value + '"'; //This for meanings, to enclose in dbl quotes
		else template += value;
		var url = "<A HREF='"+ template + "' target=_blank >" + value + "</A>";
		if(typeindex == 1) url += "&nbsp;&nbsp;&nbsp;&nbsp;<A HREF='" + CORPUS_SEARCH_TEMPLATES[6] + value + "' target=_blank >" + "<small>2</small>" + "</A>";
		return url;		
	}
	
	CORPUS.isInitialized = false;
	CORPUS._regexStems = /.*?STEM[^\n]*/g;
	CORPUS._regexMatchRef = "\\($REF.*$"; //Ex: "\\(1:7:9.*$";
	CORPUS._regexParse =							   /(([^\|\n]*))?(?:\|((?:ACT|PASS)\|PCPL))?(?:\|(IMPF|IMPV|PERF))?(?:\|(PASS))?(?:\|(VN))?(?:\|(\([IVX]*\)))?(?:\|LEM:([^\|\n]*))?(?:\|ROOT:([^\|\n]*))?(?:\|(.*?))?$/;	
	CORPUS._regexParseFullLine = /(.*?)?(?:STEM)(?:\|POS:([^\|\n]*))?(?:\|((?:ACT|PASS)\|PCPL))?(?:\|(IMPF|IMPV|PERF))?(?:\|(PASS))?(?:\|(VN))?(?:\|(\([IVX]*\)))?(?:\|LEM:([^\|\n]*))?(?:\|ROOT:([^\|\n]*))?(?:\|(.*?))?$/;	
	CORPUS.LEMMA = 8; CORPUS.ROOT = 9; CORPUS.FORM = 7; CORPUS.PERSONGS = 10; CORPUS.MISC = 0; CORPUS.POS = 2;
	CORPUS.ACTIVEPASSIVEPCPL = 3; CORPUS.TENSE = 4; CORPUS.PASSIVE = 5; CORPUS.VN = 6;
	CORPUS._rawdata = CORPUS._rawdataArr = '';
	CORPUS._RAWDATAALL = '';


	CORPUS.parse = function(corpustext){ if(!CORPUS.isInitialized){ CORPUS.init(); } 
		var oParsed, corpus; 
		try{//			if(!parseInt(index) ){debugger; return;}
			oParsed = CORPUS.regexParse( corpustext );
			corpus = {}; corpus.lemma = corpus.root  = corpus.form  = corpus.features = corpus.misc = corpus.pos = '--';
			corpus.lemma = oParsed[ CORPUS.LEMMA ];
			corpus.root  = oParsed[ CORPUS.ROOT ];
			corpus.form  = oParsed[ CORPUS.FORM ]; if(!corpus.form) corpus.form = '(I)';
			corpus.features = oParsed[ CORPUS.PERSONGS ];
			corpus.misc  = oParsed[ CORPUS.MISC ];
			corpus.pos	 = $.trim( oParsed[ CORPUS.POS ] );
			
			corpus.tense = $.trim( oParsed[ CORPUS.TENSE ] );
			corpus.passive = $.trim( oParsed[ CORPUS.PASSIVE ] );
			corpus.activepassivepcpl = $.trim( oParsed[ CORPUS.ACTIVEPASSIVEPCPL ] );
			corpus.vn = $.trim( oParsed[ CORPUS.VN ] );
		}catch(err){ console.log(err.message); console.log(err); debugger; }
		return corpus;
	}
	
	CORPUS.parseFromRef = function(ref, index){ if(!CORPUS.isInitialized){ CORPUS.init(); } 
		var oParsed, corpus; 
		try{//			if(!parseInt(index) ){debugger; return;}
			oParsed = CORPUS.regexParseFullLine( CORPUS.lookupRef(ref, index) );
			corpus = {}; corpus.lemma = corpus.root  = corpus.form  = corpus.features = corpus.misc = corpus.pos = '--';
			corpus.lemma = oParsed[ CORPUS.LEMMA ];
			corpus.root  = oParsed[ CORPUS.ROOT ];
			corpus.form  = oParsed[ CORPUS.FORM ]; if(!corpus.form) corpus.form = '(I)';
			corpus.features = oParsed[ CORPUS.PERSONGS ];
			corpus.misc  = oParsed[ CORPUS.MISC ];
			corpus.pos	 = oParsed[ CORPUS.POS ];
		}catch(err){ console.log(err.message); console.log(err); debugger; }
		return corpus;
	}

	CORPUS.lookupRef = function(ref, index){ var str = '', pattern, regexp;
		pattern = CORPUS._regexMatchRef.replace(/\$REF/, ref);
		regexp = new RegExp(pattern, "m");
		str = regexp.exec( CORPUS._rawdataArr.join('\n') );
		if(!str){ debugger;
			if(index && parseInt(index) ) str = CORPUS._rawdataArr[ index ];
		}
		return str;
	}
	
	CORPUS.init = function(){ if(CORPUS.isInitialized) return;
		try{
			CORPUS._rawdata = document.getElementById('dataislandcorpus').innerHTML; 
			//.replace(/\|PCPL\|/g, '*PCPL|').replace(/\|INDEF\|/g, '*INDEF|').replace(/\|PASS\|/g, '*PASS|');
		}catch(err){ console.log(err.message); console.log(err); }
		if(!CORPUS._rawdata){ debugger; return; }
		CORPUS._rawdataArr = CORPUS._rawdata.match( CORPUS._regexStems ); 
		CORPUS.isInitialized = true;
	}

	CORPUS.regexParse = function(teststring){
		return CORPUS._regexParse.exec( teststring );
	}

	CORPUS.regexParseFullLine = function(teststring){
		return CORPUS._regexParseFullLine.exec( teststring );
	}

	



	
	
	
	
	
	
	
	
	
	
	
	
var BuckToBare = function(str){ if(!str) return;
	str = str.replace(/[{`><]/g, 'A').replace(/[\&]/g, 'w').replace(/[}]/g, 'y').replace( /[\FNK#aeiou~\^]/g, '');
	return str;
}


var EnToAr = function(word){
	if(!word) return null;
	initializeMapper();
	var ar = '', l, letter, found=false;
	try{
		var wordArr = word.split(''); //split into letters.	//lookup from english to arabic letter. and return it.
		for(l=0; l<wordArr.length; ++l){
			letter = wordArr[l]; found = false;
			for(n=1; n<_buckArr.length; ++n){
				if(letter == _buckArr[n]){
					ar += _charsArr[n]; found=true;
					break;
				}
			}
			if(!found)  ar += ''; //letter; //' ??'+letter+'?? ';
		}
	}catch(ex){
		debugger;
		ar = '-err: ' + ex + ex.message + ex.lineno;
	}
	return ar;
}

var ArToEn = function(word){
	if(!word) return null;
	initializeMapper();
	var ar = '', l, letter, found=false;
	try{
		var wordArr = word.split(''); //split into letters.	//lookup from english to arabic letter. and return it.
		for(l=0; l<wordArr.length; ++l){
			letter = wordArr[l]; found = false;
			for(n=1; n<_charsArr.length; ++n){
				if(letter == _charsArr[n]){
					ar += _buckArr[n]; found=true;
					break;
				}
			}
			if(!found){  ar += ''; 
						 if(_bMAPPER_DEBUG){ 
							if(typeof(UNKNOWNS) == NULL) UNKNOWNS={}; 
							else{
								if(!UNKNOWNS[letter]){ UNKNOWNS[letter] = 1; _log('No mapping found:\t' + letter + '');  }
								else UNKNOWNS[letter] = 1+UNKNOWNS[letter];
							}								
						}
			}
		}
	}catch(ex){
		debugger;
		ar = '-err: ' + ex + ex.message + ex.lineno;
	}
	return ar;
}

var _charsArr, _buckArr, bInitialized = false;
var initializeMapper = function(){
	if(bInitialized) return;
	var qBare = null, qBuck = null;		
	var stopletters = "ۚۖۛۗۙ";
	var chars='آ ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي';
	var buck = 'A A b t v j H x d * r z s $ S D T Z E g f q k l m n h w y';
	var buckArr, charsArr;
	var ext = new Array();
	var map = { };
	charsArr = chars.split(' ');
	buckArr  = buck.split(' ');
	//mISSING CHARACTERS:		// أ إ ئ ء ة ؤ
	charsArr.push( 'ى' ); buckArr.push( 'Y' );
	charsArr.push( 'أ' ); buckArr.push( '>' );
	charsArr.push( 'إ' ); buckArr.push( '<' );	//charsArr.push( ' ' ); buckArr.push( ' ' ); //charsArr.push( '' ); buckArr.push( '' );
	charsArr.push( 'ئ' ); buckArr.push( '}' );
	charsArr.push( 'ء' ); buckArr.push( 'X' ); //buckArr.push( '\'' );
	//charsArr.push( 'ة' ); buckArr.push( 'P' );
	charsArr.push( 'ؤ' ); buckArr.push( '&' );
	//missing characters for harakath.
	charsArr.push( '\u0652' ); buckArr.push( 'o' );
	charsArr.push( '\u064e' ); buckArr.push( 'a' );
	charsArr.push( '\u0650' ); buckArr.push( 'i' );
	charsArr.push( '\u064f' ); buckArr.push( 'u' );
	charsArr.push( '\u064b' ); buckArr.push( 'F' );
	charsArr.push( '\u064d' ); buckArr.push( 'K' );
	charsArr.push( '\u064c' ); buckArr.push( 'N' );
	charsArr.push( '\u0626' ); buckArr.push( '}' );
	charsArr.push( '\u0640' ); buckArr.push( '_' );
	charsArr.push( '\u0651' ); buckArr.push( '~' );
	charsArr.push( '\u0653' ); buckArr.push( '^' );
	charsArr.push( '\u0654' ); buckArr.push( '#' );
	charsArr.push( '\u0671' ); buckArr.push( '{' );
	charsArr.push( '\u0670' ); buckArr.push( '`' );
	charsArr.push( '\u06e5' ); buckArr.push( ',' );
	charsArr.push( '\u06e6' ); buckArr.push( '.' );
	charsArr.push( 'ة' ); buckArr.push( 'p' );
	charsArr.push( '\u06df' ); buckArr.push( '@' );
	charsArr.push( '\u06e2' ); buckArr.push( '[' );
	charsArr.push( '\u06ed' ); buckArr.push( ']' );
	charsArr.push( '\u0621' ); buckArr.push( '\'' );
	charsArr.push( '\u06DC' ); buckArr.push( ':' );
	charsArr.push( '\u06E0' ); buckArr.push( '\"' );
	charsArr.push( ' ' ); buckArr.push( ' ' );
	charsArr.push( ';' ); buckArr.push( ';' );
	charsArr.push( '\n' ); buckArr.push( '\n' );
	
	charsArr.push( 'ع' ); buckArr.push( '3' ); //ayn //support for arabi/chat letters
	charsArr.push( 'ء' ); buckArr.push( '2' ); //hamza
	charsArr.push( 'ح' ); buckArr.push( '7' ); //HAA
	charsArr.push( 'خ' ); buckArr.push( '5' ); //KHAA
	charsArr.push( 'ص' ); buckArr.push( '9' ); //Saad
	charsArr.push( 'ط' ); buckArr.push( '6' ); //Thaw

	charsArr.push( charsArr[2] ); buckArr.push( 'B' ); //Support for Capital letters
	charsArr.push( charsArr[4] ); buckArr.push( 'V' );
	charsArr.push( charsArr[5] ); buckArr.push( 'J' );
	charsArr.push( charsArr[10] ); buckArr.push( 'R' );
	charsArr.push( charsArr[19] ); buckArr.push( 'G' );
	charsArr.push( charsArr[21] ); buckArr.push( 'Q' );
	charsArr.push( charsArr[23] ); buckArr.push( 'L' );
	charsArr.push( charsArr[24] ); buckArr.push( 'M' );
	charsArr.push( charsArr[27] ); buckArr.push( 'W' );
	charsArr.push( 'ة' ); buckArr.push( 'P' );
	
	//For IndoPak script extra letters
	charsArr.push( 'ی' ); buckArr.push( 'y' );
	charsArr.push( 'ۃ' ); buckArr.push( 'p' );
	charsArr.push( 'ہ' ); buckArr.push( 'h' );
	charsArr.push( 'ی' ); buckArr.push( 'Y' );
	charsArr.push( 'ک' ); buckArr.push( 'k' );
	charsArr.push( 'ۤ ' ); buckArr.push( '?' );
	charsArr.push( 'ۤۚ ' ); buckArr.push( '?' );
	charsArr.push( 'ۡ ' ); buckArr.push( '?' );
	charsArr.push( 'ۚ ' ); buckArr.push( '?' );
	charsArr.push( 'ۤ ' ); buckArr.push( '?' );

	_charsArr = charsArr; _buckArr = buckArr;
	bInitialized = true;
}		
initializeMapper();





	var Escape = function(input){ if(!input) return; return input.replace(/\</g, '&lt;').replace(/\>/g, '&gt;'); }
	var Unescape = function(input){ if(!input) return; return input.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>'); }

	var escapeForRegex = function(regex){ //^l~
		if(!regex) return;
		return regex.replace(/\'/g, '\\\'').replace(/\^/g, '\\\^').replace(/\~/g, '\\\~').replace(/\[/g, '\\\[').replace(/\*/g, '\\\*').replace(/\$/g, '\\\$').replace(/\@/g, '\\\@').replace(/\+/g, '\\\+');
	}
	
	var escapeMisc = function(input){ var output='';
		if(!input) return; output = input.replace(/\</g, '&#171;').replace(/\>/g, '&gt;').replace(/\"/g, '&#9674;');  //&#60; for <. 9668 for left diamond like.
		//if(input.indexOf('<') != -1 || input.indexOf('>') != -1){ console.log(input +'\t\t'+ output ); if(typeof(DEBUG) != 'undefined')debugger; }
		return output;
	}

	
//DELETE THIS BELOW
	CORPUS.XUIgetRefLink = function(ref){
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

 
var SARF_SAGHEER = [ //'Verbs_VerbNo,Verbs_Words_Corpus_Root_English,Verbs_Type,Verbs_class,Verbs_Sura,Verbs_Verse,Meaning-English,Meaning-Urdu,Count,perfect,Imperfect,Imperative,Active-participle,Passive-participle,Verbal-noun,root,type,class',
'1,fEl,b1,فتح,2,24,to do,كرنا ,105,فَعَلَ, يَفْعَلُ, اِفْعَلْ , فَاعِل, مَفْعُول, فِعْل,ف ع ل ,1,فتح',
'2,ftH,b1,فتح,2,76,"to open, to give victory",کھولنا,29,فَتَحَ, يَفْتَحُ, اِفْتَحْ, فَاتِح, مَفْتُوح, فَتْح,ف ت ح ,1,فتح',
'3,bEv,b1,فتح,2,56,to raise; to resurrect, پہنچا نا,65,بَعَثَ, يَبْعَثُ, اِبْعَثْ, بَاعِث, مَبْعُوث, بَعْث,ب ع ث ,1,فتح',
'4,jEl,b1,فتح,2,19,"to make, to place, to set up",کردینا,346,جَعَلَ, يَجْعَلُ, اِجْعَلْ, جَاعِل, مَجْعُول, جَعْل,ج ع ل ,1,فتح',
'5,jmE,b1,فتح,3,25,"to gather,  to collect",جمع کرنا,40,جَمَعَ, يَجْمَعُ, اِجْمَعْ, جَامِع, مَجْمُوع, جَمْع,ج م ع ,1,فتح',
'6,*hb,b1,فتح,2,17,to go,جانا ,35,ذَهَبَ, يَذْهَبُ, اِذْهَبْ, ذَاهِب, -, ذِهَاب,ذ ه ب ,1,فتح',
'7,rfE,b1,فتح,2,63,to raise,اونچا كرنا,28,رَفَعَ, يَرْفَعُ, اِرْفَعْ, رَافِع, مَرْفُوع, رَفْع,ر ف ع ,1,فتح',
'8,sHr,b1,فتح,7,116,"to enchant, to bewitch",جادو كرنا,49,سَحَرَ, يَسْحَرُ, اِسْحَرْ, سَاحِر, مَسْحُور, سِحْر,س ح ر ,1,فتح',
'9,slH,b1,فتح,3,39,to act righteously,نيك هونا,131,صَلَحَ, يَصْلَحُ, اِصْلَحْ, صَالِح, -, مَصْلَحَة,ص ل ح ,1,فتح',
'10,lEn,b1,فتح,2,88,to curse,لعنت كرنا,27,لَعَنَ, يَلْعَنُ, اِلْعَنْ, لَاعِن, مَلْعُون, لَعْن,ل ع ن ,1,فتح',

'11,nfE,b1,فتح,2,102,to profit,نفع پهنچانا,42,نَفَعَ, يَنْفَعُ, اِنْفَعْ, نَافِع, مَنْفُوع, نَفْع,ن ف ع ,1,فتح',
'12,nsr,b2,نصر,2,250,to help; to deliver,مدد كرنا,92,نَصَرَ, يَنْصُرُ, اُنْصُرْ, نَاصِر, مَنْصُور, نَصْر,ن ص ر ,1,نصر',
'13,blg,b2,نصر,2,196,to reach,پهنچنا,49,بلَغَ, يَبْلُغُ, اُبْلُغْ, بَالِغ, -, بُلُوغ,ب ل غ ,1,نصر',
'14,trk,b2,نصر,,,to leave,چھوڑ دينا,43,تَرَكَ, يَتْرُكُ, اُتْرُكْ, تَارِك, مَتْرُوك, تَرْك  ,ت ر ك ,1,نصر',
'15,H$r,b2,نصر,4,172,to gather; to bring together,جمع کرنا,43,حَشَرَ, يَحْشُرُ, اُحْشُرْ, حَاشِر, مَحْشُور, حَشْر ,ح ش ر ,1,نصر',
'16,Hkm,b2,نصر,,,to judge; to rule,فيصله كرنا,80,حَكَمَ, يَحْكُمُ, اُحْكُمْ, حَاكِم, مَحْكُوم, حُكْم,ح ك م ,1,نصر',
'17,xrj,b2,نصر,2,74,to come out,نكلنا,61,خَرَجَ, يَخْرُجُ, اُخْرُجْ, خَارِج, -, خُرُوج,خ ر ج ,1,نصر',
'18,xld,b2,نصر,3,15,to live forever,هميشه رهنا,83,خَلَدَ, يَخْلُدُ, اُخْلُدْ, خَالِد, -, خُلُود,خ ل د ,1,نصر',
'19,xlq,b2,نصر,2,21,to create out of nothing,پيدا كرنا,248,خَلَقَ, يَخْلُقُ, اُخْلُقْ, خَالِق, مَخْلُوق, خَلْق,خ ل ق ,1,نصر',

'20,dxl,b2,نصر,2,58,to enter,داخل هونا,78,دَخَلَ, يَدْخُلُ, اُدْخُلْ, دَاخِل, مَدْخُول, دُخُول,د خ ل ,1,نصر',
'21,*kr,b2,نصر,,,to remember,ياد كرنا,163,ذَكَرَ, يَذْكُرُ, اُذْكُرْ, ذَاكِر, مَذْكُور, ذِكْر,ذ ك ر ,1,نصر',
'22,rzq,b2,نصر,2,3,to provide,رزق دينا,122,رَزَقَ, يَرْزُقُ, اُرْزُقْ, رَازِق, مَرْزُوق, رِزْق,ر ز ق ,1,نصر',
'23,sjd,b2,نصر,2,34,to prostrate,سجده كرنا,49,سَجَدَ, يَسْجُدُ, اُسْجُدْ, سَاجِد, مَسْجُود, سُجُود,س ج د ,1,نصر',
'24,$Er,b2,نصر,2,9,to perceive,سمجھنا,29,شَعَرَ, يَشْعُرُ, اُشْعُرْ, شَاعِر, -, شُعُور,ش ع ر ,1,نصر',
'25,$kr,b2,نصر,,,to be grateful,شكر كرنا,63,شَكَرَ, يَشْكُرُ, اُشْكُرْ, شَاكِر, مَشْكُور, شُكْر,ش ك ر ,1,نصر',
'26,sdq,b2,نصر,2,111,to be true; to say the truth,سچ بولنا,89,صَدَقَ, يَصْدُقُ, اُصْدُقْ, صَادِق, مَصْدُوق, صِدْق,ص د ق ,1,نصر',
'27,Ebd,b2,نصر,1,5,to worship; to serve,عبادت كرنا,143,عَبَدَ , يَعْبُدُ, اُعْبُدْ, عَابِد, مَعْبُود, عِبَادَة,ع ب د  ,1,نصر',
'28,fsq,b2,نصر,2,59,to transgress,نافرماني كرنا,54,فَسَقَ, يَفْسُقُ, اُفْسُقْ, فَاسِق, -, فِسْق، فُسُوق,ف س ق ,1,نصر',
'29,qtl,b2,نصر,2,54,to kill; to slay,قتل كرنا، مارنا,93,قَتَلَ, يَقْتُلُ, اُقْتُلْ, قَاتِل, مَقْتُول, قَتْل,ق ت ل ,1,نصر',
'30,qEd,b2,نصر,3,168,to sit; to remain behind,بيٹھنا,23,قَعَدَ, يَقْعُدُ, اُقْعُدْ, قَاعِد, -, قُعُود ,ق ع د ,1,نصر',
'31,ktb,b2,نصر,,,to prescribe; to write,لكھنا,56,كَتَبَ, يَكْتُبُ, اُكْتُبْ, كَاتِب, مَكْتُوب, كِتَابَة,ك ت ب ,1,نصر',
'32,kfr,b2,نصر,,,to disbelieve; to be ungrateful,انكار كرنا، ناشكري كرنا,461,كَفَرَ, يَكْفُرُ, اُكْفُرْ, كَافِر, مَكْفُور, كُفْر,ك ف ر ,1,نصر',
'33,mkr,b2,نصر,,,to plot,چال چلنا، مكر كرنا,43,مَكَرَ, يَمْكُرُ, اُمْكُرْ, مَاكِر, مَمْكُور, مَكْر,م ك ر ,1,نصر',
'34,nZr,b2,نصر,2,50,to look; to wait,ديكھنا,95,نَظَرَ, يَنْظُرُ, اُنْظُرْ, نَاظِر, مَنْظُور, نَظَر,ن ظ ر ,1,نصر',
'35,Drb,b3,ضرب,2,26,to strike,مارنا,58,ضَرَبَ, يَضْرِبُ, اِضْرِبْ, ضَارِب, مَضْرُوب, ضَرْب,ض ر ب ,1,ضرب',
'36,Hml,b3,ضرب,2,248,to carry; to bear,اٹھانا,50,حَمَلَ, يَحْمِلُ, اِحْمِلْ, حَامِل, مَحْمُول, حَمْل,ح م ل ,1,ضرب',
'37,sbr,b3,ضرب,2,175,to bear with patience,صبر كرنا,94,صَبَرَ, يَصْبِرُ, اِصْبِرْ, صَابِر, -, صَبْر,ص ب ر ,1,ضرب',
'38,Zlm,b3,ضرب,2,54,to wrong,ظلم كرنا,266,ظَلَمَ, يَظْلِمُ, اِظْلِمْ, ظَالِم, مَظْلُوم, ظُلْم,ظ ل م ,1,ضرب',
'39,Erf,b3,ضرب,2,146,to recognize,پهچاننا,59,عَرَفَ, يَعْرِفُ , اِعْرِفْ, عَارِف, مَعْرُوف, مَعْرِفَة,ع ر ف ,1,ضرب',
'40,Eql,b3,ضرب,2,44,to understand; to comprehend,عقل كا استعمال كرنا,49,عَقَلَ, يَعْقِلُ, اِعْقِلْ, عَاقِل, مَعْقُول, عَقْل,ع ق ل ,1,ضرب',
'41,gfr,b3,ضرب,2,58,to forgive;  to cover,بخش دينا,95,غَفَرَ, يَغْفِرُ, اِغْفِرْ, غَافِر, مَغْفُور, مَغْفِرَة,غ ف ر ,1,ضرب',
'42,qdr,b3,ضرب,2,264,to decree; to have power; ..,,47,قَدَرَ, يَقْدِرُ, اِقْدِرْ, قَادِر, مَقْدُور, قَدْر، قُدْرَة,ق د ر ,1,ضرب',
'43,k*b,b3,ضرب,,,to lie,جھوٹ بولنا,76,كَذَبَ, يَكْذِبُ, اِكْذِبْ, كَاذِب, مَكْذُوب, كَذِب ,ك ذ ب ,1,ضرب',
'44,ksb,b3,ضرب,,,to earn,كمانا,62,كَسَبَ, يَكْسِبُ, اِكْسِبْ, كَاسِب, مَكْسُوب, كَسْب,ك س ب ,1,ضرب',
'45,mlk,b3,ضرب,,,to possess,مالك هونا,49,مَلَكَ, يَمْلِكُ, اِمْلِكْ, مَالِك, مَمْلُوك, مِلْك,م ل ك ,1,ضرب',
'46,smE,b4,سمع,2,7,to hear,سننا,100,سَمِعَ, يَسْمَعُ, اِسْمَعْ, سَامِع, مَسْمُوع, سَمَاعَة,س م ع ,1,سمع',
'47,Hzn,b4,سمع,2,38,to be grieved,غم كرنا,30,حَزِنَ, يَحْزَنُ, اِحْزَنْ, حَازِن, -, حُزْن,ح ز ن ,1,سمع',
'48,Hsb,b4,سمع,2,214,to think;  to consider,گمان كرنا,46,حَسِبَ, يَحْسَبُ, اِحْسَبْ, حَاسِب, مَحْسُوب, حَسْب,ح س ب ,1,سمع',
'49,HfZ,b4,سمع,4,34,to guard; to protect,حفاظت كرنا,27,حَفِظَ, يَحْفَظُ, اِحْفَظْ, حَافِظ, مَحْفُوظ, حِفْظ ,ح ف ظ ,1,سمع',
'50,xsr,b4,سمع,3,85,to lose,نقصان ميں پڑنا,51,خَسِرَ, يَخْسَرُ, اِخْسَرْ, خَاسِر, -, خُسْر,خ س ر ,1,سمع',
'51,rHm,b4,سمع,2,286,to have mercy on someone,رحم كرنا,148,رَحِمَ, يَرْحَمُ, اِرْحَمْ, رَاحِم, مَرْحُوم, رَحْمَة,ر ح م ,1,سمع',
'52,$hd,b4,سمع,2,84,to bear witness; to be present,گواهي دينا,66,شَهِدَ, يَشْهَدُ, اِشْهَدْ, شَاهِد, مَشْهُود, شَهُود,ش ه د ,1,سمع',
'53,Elm,b4,سمع,2,13,to know,جاننا,518,عَلِمَ, يَعْلَمُ, اِعْلَمْ, عَالِم, مَعْلُوم, عِلْم,ع ل م ,1,سمع',
'54,Eml,b4,سمع,2,25,to work; to do,عمل كرنا,318,عَمِلَ, يَعْمَلُ, اِعْمَلْ, عَامِل, مَعْمُول, عَمَل,ع م ل ,1,سمع',
'55,krh,b4,سمع,,,to dislike;  to detest,كراهت كرنا، ناپسند كرنا,25,كَرِهَ, يَكْرَهُ, اِكْرَهْ, كَارِه, مَكْرُوه, كُرْه,ك ر ه ,1,سمع',
'56,w*r,b5,وعد,26,166,to leave behind,چھوڑ دينا,45,وَذَرَ, يَذَرُ, ذَرْ, وَاذِر, مَوْذُور, وَذْر,و ذ ر ,1,سمع',
'57,wDE,b5,وعد,,,to put; to set,ركھ دينا,22,وَضَعَ, يَضَعُ, ضَعْ, وَاضِع, مَوْضُوع, وُضْع,و ض ع ,1,سمع',
'58,wqE,b5,وعد,,,to befall,واقع هونا,20,وَقَعَ, يَقَعُ, قَعْ, وَاقِع, -, وَقُوع,و ق ع ,1,سمع',
'59,whb,b5,وعد,3,8,to grant,دينا,23,وَهَبَ, يَهَبُ, هَبْ, وَاهِب, مَوْهُوب, وَهْب,و ه ب ,1,سمع',
'60,wjd,b5,وعد,2,96,to find,پانا,107,وَجَدَ, يَجِدُ, جِدْ, وَاجِد, مَوْجُود, وُجُود,و ج د ,1,سمع',
'61,wrv,b5,وعد,4,176,to inherit,وارث هونا,19,وَرِثَ, يَرِثُ, رِثْ, وَارِث, مَوْرُوث, وَرَاثَة,و ر ث ,1,سمع',
'62,wzr,b5,وعد,6,31,to bear a load,بوجھ اٹھانا,19,وَزَرَ, يَزِرُ, زِرْ, وَازِر, مَوْزُور, وِزْر,و ز ر ,1,سمع',
'63,wsf,b5,وعد,6,100,to describe; to ascribe,بيان كرنا,14,وَصَفَ, يَصِفُ, صِفْ, وَاصِف, مَوْصُوف, وَصْف,و ص ف ,1,سمع',
'64,wEd,b5,وعد,2,268,to promise,وعده كرنا,124,وَعَدَ, يَعِدُ, عِدْ, وَاعِد, مَوْعُود, وَعْد,و ع د ,1,سمع',
'65,wqy,b5,وعد,2,201,to protect;  to save,بچانا,19,وَقَى, يَقِي, قِ, وَاق, مَوْقى, وِقَايَة,و ق ى,1,سمع',
'66,wsE,b5,وعد,,,to embrace;  to comprehend,سما لينا، وسيع هونا,25,وَسِعَ, يَوْسَعُ, اِيْسَعْ, وَاسِع, مَوْسُوع, سَعَة,و س ع ,1,سمع',
'67,twb,b6,قال,2,37,to repent,پلٹنا,72,تَابَ, يَتُوبُ, تُبْ, تَائِب, -, تَوْبَة,ت و ب ,1,سمع',
'68,*wq,b6,قال,3,106,to taste,چكھنا,42,ذَاقَ, يَذُوقُ, ذُقْ, ذَائِق, مَذَاق, ذَوْق,ذ و ق ,1,سمع',
'69,fwz,b6,قال,3,185,to succeed; to gain victory,كامياب هونا,26,فَازَ, يَفُوزُ, فُزْ, فَائِز, -, فُوْز ,ف و ز ,1,سمع',
'70,qwl,b6,قال,2,8,to say,كهنا,1719,قَالَ, يَقُولُ, قُلْ, قَائِل, مَقَال, قَوْل,ق و ل ,1,سمع',
'71,qwm,b6,قال,2,20,to stand up; to raise,كھڑا هونا,55,قَامَ, يَقُومُ, قُمْ, قَائِم, -, قِيَام، قَوْمَة,ق و م ,1,سمع',
'72,kwn,b6,قال,,,to be,هونا,1361,كَانَ, يَكُونُ, كُنْ, كَائِن, -, كَوْن,ك و ن ,1,سمع',
'73,mwt,b6,قال,2,132,to die,مرنا، بے جان هونا,93,مَاتَ, يَمُوتُ, مُتْ, مَائِت, -, مَوْت,م و ت ,1,سمع',
'74,xwf,b6,قال,2,112,to be afraid,ڈرنا,112,خَافَ, يَخَافُ, خِفْ, خَائِف, -, خَوْف,خ و ف ,1,سمع',
'75,kwd,b6,قال,,,to become nigh; to be close to,قريب هونا,24,كَادَ, يَكَادُ, كِدْ, كَائِد, -, كَوْد,ك و د ,1,سمع',
'76,kyd,b6,قال,,,to plot against,خفيه تدبير كرنا,35,كَادَ, يَكِيدُ, كِدْ, كَائِد, مَكَيد, كَيْد,ك ي د ,1,سمع',
'77,zyd,b6,قال,2,10,to increase,زياده كرنا,51,زَادَ, يَزِيدُ, زِدْ, زَائِد, مَزِيد, زِيَادَة,ز ي د ,1,سمع',
'78,tlw,b7,دعا,,,to recite,تلاوت كرنا,61,تَلَا, يَتْلُو, اُتْلُ, تَالٍ, مَتْلُو, تِلَاوَة,ت ل و ,1,سمع',
'79,dEw,b7,دعا,2,23,to call; to pray,پكارنا، بلانا,197,دَعَا, يَدْعُو, اُدْعُ, دَاعٍ, مَدْعُوّ, دُعَاء,د ع و ,1,سمع',
'80,Efw,b7,دعا,2,52,to forgo,معاف كرنا,30,عَفَا, يَعْفُو, اُعْفُ, عَافٍ, مَعْفُو, عَفْو,ع ف و ,1,سمع',
'81,bgy,b7,دعا,3,83,"to want, to seek",چاهنا، زيادتي كرنا,29,بَغَى, يَبْغِي, اِبْغِ, بَاغٍ, مَبْغَى, بَغْى,ب غ ى,1,سمع',
'82,jry,b7,دعا,,,to flow,چلنا ، جاري هونا,60,جَرَى, يَجْرِي, اِجْرِ, جَارٍ, -, جَرَيَان,ج ر ى,1,سمع',
'83,jzy,b7,دعا,,,to reward,بدله دينا,116,جَزَى, يَجْزِي, اِجْزِ, جَازٍ, مَجْزِي, جَزَاء,ج ز ى,1,سمع',
'84,qDy,b7,دعا,,,to decree;  to fulfil,فيصله كرنا، پورا كرنا,62,قَضَى, يَقْضِي, اِقْضِ, قَاضٍ, مَقْضِيّ,  قَضَاء ,ق ض ى,1,سمع',
'85,kfy,b7,دعا,,,to suffice,كافي هونا، ضرورت پورا كرنا,32,كَفَى, يَكْفِي, اِكْفِ, كَافٍ, مَكْفِيّ, كِفَايَة,ك ف ى,1,سمع',
'86,hdy,b7,دعا,1,6,to guide;  to direct,راسته بتانا,163,هَدَى, يَهْدِي, اِهْدِ, هَادٍ, مَهْدِيّ, هَدْى,ه د ى,1,سمع',
'87,x$y,b7,دعا,2,150,to fear,ڈرنا، خوف كھانا,48,خَشِيَ, يَخْشَى, اِخْشَ, خَاشٍ, -, خَشِيَّة,خ ش ي ,1,سمع',
'88,rDy,b7,دعا,,,"to be satisfied, to be content",راضي هونا، خوش هونا,57,رَضِيَ, يَرْضَى, اِرْضَ, رَاضٍ, مَرْضِيّ, رِضْوَان,ر ض ي ,1,سمع',
'89,nsy,b7,دعا,2,44,to forget,بھول جانا,36,نَسِيَ, يَنْسَى, اِنْسَ, نَاسٍ, مَنْسِيّ, نِسْيَان,ن س ي ,1,سمع',
'90,sAl,b8,أمر,2,61,to ask,پوچھنا,119,سَأَلَ, يَسْأَلُ, سَلْ  اِسْئَلْ, سَائِل, مَسْئُول, سُؤَال   ,س أ  ل ,1,سمع',
'91,qrA,b8,أمر,,,to read; to recite,پڑھنا,17,قَرَأَ, يَقْرَأُ, اِقْرَأْ, قَارِئ, مَقْرُوء, قِرَاءَة,ق ر أ  ,1,سمع',
'92,Ax*,b8,أمر,2,55,to take; to catch,پكڑنا، لينا,142,أَخَذَ, يَأْخُذُ, خُذْ, آخِذ, مَأْخُوذ, أَخْذ,أ  خ ذ ,1,سمع',
'93,Akl,b8,أمر,,,to eat,كھانا,101,أَكَلَ, يَأْكُلُ, كُلْ, آكِل, مَأْكُول, أَكْل,أ  ك ل ,1,سمع',
'94,Amr,b8,أمر,2,27,to command,حكم دينا,232,أَمَرَ, يَأْمُرُ, مُرْ, آمِر, مَأْمُور, أَمْر,أ  م ر ,1,سمع',
'95,Amn,b8,أمر,2,196,to be safe; to feel safe; to trust,امن ميں هونا,25,أَمِنَ, يَأَمَنُ, ائْمَنْ, آمِن, -, أَمْن ,أ  م ن ,1,سمع',
'96,Aby,b8,أمر,,,to refuse,سخت انكار كرنا,13,أَبَى, يَأْبَى, اِئْبَ, آبٍ, -, اِبَاء,أ  ب ى,1,سمع',
'97,rAy,b8,أمر,2,55,to see,ديكھنا,269,رَأَى, يَرَى, رَ, رَاءٍ, مَرْءِيّ, رَأْيٌ,ر أ  ى,1,سمع',
'98,Aty,b8,أمر,,,to come,آنا,263,أَتَى, يَأْتِي, اِئْتِ, آتٍ, مَأْتِيّ, اِتْيَان,أ  ت ى,1,سمع',
'99,$yA,b8,أمر,2,20,"to will, to wish",چاهنا,277,شَاءَ, يَشَاءُ, شَأْ, شَاءٍ, -, مَشِيئَة,ش ي ء ,1,سمع',
'100,swA,b8,أمر,,,to be evil,برُا هونا,39,سَاءَ, يَسُوءُ, سُؤْ, سَاوِئ, -, سَوْء,س و ء ,1,سمع',
'101,jyA,b8,أمر,2,71,to come,آنا,236,جَاءَ, يَجِيءُ, جِئْ, جَاءٍ, -, مَجِيء,ج ي ء ,1,سمع',
'102,Dll,b9,ضَلَّ,2,108,to go astray; to err; to waste,گمراه هونا,113,ضَلَّ, يَضِلُّ , ضِلَّ, ضَالّ, -, ضَلَالَة، ضَلَال,ض ل ل,1,ضَلَّ',
'103,Hyy,b9,ضَلَّ,4,86,to live; to greet,جينا، زنده رهنا,83,حَيَّ, يَحْيَا, حَيَّ, حَيّ, -, حَيَاة,ح ي ي,1,ضَلَّ',
'104,rdd,b9,ضَلَّ,2,109,to give back;  to return,لوٹانا، واپس كرنا,45,رَدَّ, يَرُدُّ, رُدَّ, رَادّ, مَرْدُود, رَدّ,ر د د,1,ضَلَّ',
'105,sdd,b9,ضَلَّ,3,99,to turn away;  to hinder,روكنا، ركنا,39,صَدَّ, يَصُدُّ, صُدَّ, صَادّ, مَصْدُود, صَدّ,ص د د ,1,ضَلَّ',
'106,Drr,b9,ضَلَّ,2,102,to hurt; to harm,نقصان پهنچانا,31,ضَرَّ, يَضُرُّ, ضُرَّ, ضَارّ, مَضْرُور, ضَرّ,ض ر ر,1,ضَلَّ',
'107,Znn,b9,ضَلَّ,2,46,to think;   to believe,گمان كرنا، يقين كرنا,68,ظَنَّ, يَظُنُّ, ظُنَّ, ظَانّ, -, ظَنّ,ظ ن ن,1,ضَلَّ',
'108,Edd,b9,ضَلَّ,14,34,to count,گننا، شمار كرنا,17,عَدَّ, يَعُدُّ, عُدَّ, عَادّ, مَعْدُود, عَدّ,ع د د,1,ضَلَّ',
'109,grr,b9,ضَلَّ,,,to beguile,دھوكه دينا,24,غَرَّ, يَغِرُّ, غِرَّ, غَارّ, مَغْرُور, غُرُور,غ ر ر,1,ضَلَّ',
'110,mdd,b9,ضَلَّ,13,3,to spread out;  to stretch,پھيلانا، مهلت دينا,17,مَدَّ, يَمُدُّ, مُدَّ, مَادّ, مَمْدُود, مَدّ,م د د,1,ضَلَّ',
'111,mss,b9,ضَلَّ,2,80,to touch,چھونا,58,مَسَّ, يَمَسُّ, مَسَّ, مَاسّ, مَمْسُوس, مَسّ,م س س,1,ضَلَّ',
'112,wdd,b9,ضَلَّ,2,96,to love; to wish,چاهنا,18,وَدَّ, يَوَدُّ, وَدَّ, وَادّ, مَوْدُود, وُدّ,و د د,1,ضَلَّ',
'113,bdl,d2,سَبَّحَ,2,59,to change,بدل دينا,33,بَدَّلَ, يُبَدِّلُ, بَدِّلْ, مُبَدِّل, مُبَدَّل, تَبْدِيْل,ب د ل ,2,سَبَّحَ',
'114,b$r,d2,سَبَّحَ,2,25,to give good news,بشارت، خوشخبري دينا,48,بَشَّرَ, يُبَشِّرُ, بَشِّرْ, مُبَشِّر, مُبَشَّر, تَبْشِيْر,ب ش ر ,2,سَبَّحَ',
'115,byn,d2,سَبَّحَ,2,68,to make clear,بيان كرنا، واضح كرنا,35,بَيَّنَ, يُبَيِّنُ, بَيِّنْ, مُبَيِّن, مُبَيَّن, تَبْيِيْن,ب ي ن ,2,سَبَّحَ',
'116,zyn,d2,سَبَّحَ,2,212,to adorn / make st  to seem fair,خوشنما بنانا، زينت دينا,26,زَيَّنَ, يُزَيِّنُ, زَيِّنْ, مُزَيِّن, مُزَيَّن, تَزْيِين,ز ي ن ,2,سَبَّحَ',
'117,sbH,d2,سَبَّحَ,2,30,to glorify;  to praise,پاكي بيان كرنا,48,سَبَّحَ, يُسَبِّحُ, سَبِّحْ, مُسَبِّح, مُسَبَّح, تَسْبِيْح,س ب ح ,2,سَبَّحَ',
'118,sxr,d2,سَبَّحَ,2,164,to bring under control,مسخر كنرا,26,سَخَّرَ, يُسَخِّرُ, سَخِّرْ, مُسَخِّر, مُسَخَّر, تَسْخِير ,س خ ر ,2,سَبَّحَ',
'119,sdq,d2,سَبَّحَ,2,41,to pronounce ss to be true,سچا ماننا، تصديق كرنا,31,صَدَّقَ, يُصَدِّقُ, صَدِّقْ, مُصَدِّق, مُصَدَّق, تَصْدِيْق,ص د ق ,2,سَبَّحَ',
'120,E*b,d2,سَبَّحَ,2,284,to punish;  to torment,عذاب دينا,49,عَذَّبَ, يُعَذِّبُ, عَذِّبْ, مُعَذِّب, مُعَذَّب, تَعْذِيْب,ع ذ ب ,2,سَبَّحَ',
'121,Elm,d2,سَبَّحَ,2,31,to teach,سكھانا,42,عَلَّمَ, يُعَلِّمُ, عَلِّمْ, مُعَلِّم, مُعَلَّم, تَعْلِيْم,ع ل م ,2,سَبَّحَ',
'122,qdm,d2,سَبَّحَ,2,95,to send forward,آگے بھيجنا، سامنے لانا,27,قَدَّمَ, يُقَدِّمُ, قَدِّمْ, مُقَدِّم, مُقَدَّم, تَقْدِيْم,ق د م ,2,سَبَّحَ',
'123,k*b,d2,سَبَّحَ,,,to accuse ss of falsehood,جھٹلانا,198,كَذَّبَ, يُكَذِّبُ, كَذِّبْ, مُكَذِّب, مُكَذَّب, تَكْذِيْب,ك ذ ب ,2,سَبَّحَ',
'124,nbw,d2,سَبَّحَ,,,to declare;  to apprise,خبر دينا، بتانا,46,نَبَّأَ, يُنَبِّئُ, نَبِّئْْ, مُنَبِّئ, مُنَبَّئْ, تَنْبِئَة,ن ب و  ,2,سَبَّحَ',
'125,nzl,d2,سَبَّحَ,2,23,to send down,اُتارنا,79,نَزَّلَ, يُنَزِّلُ, نَزِّلْ, مُنَزِّل, مُنَزَّل, تَنْزِيْل,ن ز ل ,2,سَبَّحَ',
'126,njy,d2,سَبَّحَ,,,to deliver;  to rescue,نجات دينا,39,نَجَّى, يُنَجِّي, نَجِّ, مُنَجِّي, مُنَجَّى, تَنْجِيَة,ن ج ى,2,سَبَّحَ',
'127,wly,d2,سَبَّحَ,2,115,to turn,رخ كرنا، منه موڑنا,45,وَلَّى, يُوَلِّي, وَلِّ, مُوَلِّي, -, تَوْلِيَة,و ل ى,2,سَبَّحَ',
'128,jhd,d3,جَاهَدَ,2,218,to struggle;  to strive,جهاد كرنا,31,جَاهَدَ, يُجَاهِدُ, جَاهِدْ, مُجَاهِد, مُجَاهَد, مُجَاهَدَة,ج ه د ,3,جَاهَدَ',
'129,qtl,d3,جَاهَدَ,2,190,to fight,قتال كرنا، لڑنا,54,قَاتَلَ, يُقَاتِلُ, قَاتِلْ, مُقَاتِل, مُقَاتَل, مُقَاتَلَة,ق ت ل ,3,جَاهَدَ',
'130,ndy,d3,جَاهَدَ,,,to call out; to cry unto,پكارنا,44,نَادَى, يُنَادِي , نَادِ,مُنَادٍ, مُنَادَى   , مُنَادَاة,ن د ى,3,جَاهَدَ',
'131,nfq,d3,جَاهَدَ,3,167,to play hypocricy,منافقت كرنا,34,نَافَقَ, يُنَافِقُ, نَافِقْ, مُنَافِق, -, مُنَافَقَة,ن ف ق ,3,جَاهَدَ',
'132,hjr,d3,جَاهَدَ,2,218,to migrate,هجرت كرنا، چھوڑنا,24,هَاجَرَ, يُهَاجِرُ, هَاجِرْ, مُهَاجِر, -, مُهَاجَرَة,ه ج ر ,3,جَاهَدَ',
'133,bsr,d4,أَسْلَمَ,2,17,to see; to watch,ديكھنا,36,أَبْصَرَ, يُبْصِرُ, أَبْصِرْ, مُبْصِر, مُبْصَر, إِبْصَار,ب ص ر ,4,أَسْلَمَ',
'134,Hsn,d4,أَسْلَمَ,2,58,to do good; to do excellently,اچھي طرح كرنا,72,أَحْسَنَ, يُحْسِنُ, أَحْسِنْ, مُحْسِن, مُحْسَن, إِحْسَان,ح س ن ,4,أَسْلَمَ',
'135,xrj,d4,أَسْلَمَ,2,22,to bring forth,باهر نكالنا,108,أَخْرَجَ, يُخْرِجُ, أَخْرِجْ, مُخْرِج, مُخْرَج, إِخْرَاج,خ ر ج ,4,أَسْلَمَ',
'136,dxl,d4,أَسْلَمَ,3,185,to make ss enter,داخل كرنا,45,أَدْخَلَ, يُدْخِلُ, أَدْخِلْ, مُدْخِل, مُدْخَل, إِدْخَال,د خ ل ,4,أَسْلَمَ',
'137,rjE,d4,أَسْلَمَ,,,to send back; to take back,لوٹانا، واپس كرنا,33,أَرْجَعَ, يُرْجِعُ, أَرْجِعْ, مُرْجِع, مُرْجَع, إِرْجَاع ,ر ج ع ,4,أَسْلَمَ',
'138,rsl,d4,أَسْلَمَ,2,119,to send,بھيجنا,135,أَرْسَلَ, يُرْسِلُ, أَرْسِلْ, مُرْسِل, مُرْسَل, إِرْسَال,ر س ل ,4,أَسْلَمَ',
'139,srf,d4,أَسْلَمَ,3,147,to exceed; to be extravagant,اسراف كرنا,23,أَسْرَفَ, يُسْرِفُ, اَسْرِفْ, مُسْرِف, -, إِسْرَاف ,س ر ف ,4,أَسْلَمَ',
'140,slm,d4,أَسْلَمَ,2,112,to submit;  to surrender,حكم ماننا,72,أَسْلَمَ, يُسْلِمُ, أَسْلِمْ, مُسْلِم, -, إِسْلَام,س ل م ,4,أَسْلَمَ',
'141,$rk,d4,أَسْلَمَ,,,to ascribe a partner,شريك كرنا,120,أَشْرَكَ, يُشْرِكُ, أَشْرِكْ, مُشْرِك, مُشْرَك, إِشْرَاك,ش ر ك ,4,أَسْلَمَ',
'142,sbH,d4,أَسْلَمَ,3,103,to become,هوجانا، صبح كرنا,34,أَصْبَحَ, يُصْبِحُ, أَصْبِحْ, مُصْبِح, -, إِصْبَاح ,ص ب ح ,4,أَسْلَمَ',
'143,slH,d4,أَسْلَمَ,2,11,to become good; to make good,اصلاح كرنا,40,أَصْلَحَ, يُصْلِحُ, أَصْلِحْ, مُصْلِح, مُصْلَح, إِصْلَاح,ص ل ح ,4,أَسْلَمَ',
'144,ErD,d4,أَسْلَمَ,2,83,to turn away; to backslide,منه پھيرنا,53,أَعْرَضَ, يُعْرِضُ, أَعْرِضْ, مُعْرِض, -, إِعْرَاض,ع ر ض ,4,أَسْلَمَ',
'145,grq,d4,أَسْلَمَ,2,50,to drown,ڈبو دينا,21,أَغْرَقَ, يُغْرِقُ, أَغْرِقْ, مُغْرِق, -, إِغْرَاق,غ ر ق ,4,أَسْلَمَ',
'146,fsd,d4,أَسْلَمَ,2,11,to spread corruption,خراب كرنا، فساد پھيلانا,36,أَفْسَدَ, يُفْسِدُ, أَفْسِدْ, مُفْسِد, مُفْسَد, إِفْسَاد,ف س د ,4,أَسْلَمَ',
'147,flH,d4,أَسْلَمَ,2,5,to be successful,فلاح پانا,40,أَفْلَحَ, يُفْلِحُ, أَفْلِحْ, مُفْلِح, -, إِفْلَاح,ف ل ح ,4,أَسْلَمَ',
'148,nbt,d4,أَسْلَمَ,2,61,to make st grow; to cause to grow,اگانا,16,أَنْبَتَ, يُنْبِتُ, أَنْبِتْ, مُنْبِت, -, إِنْبِات,ن ب ت ,4,أَسْلَمَ',
'149,n*r,d4,أَسْلَمَ,2,6,to warn,ڈرانا,70,أَنْذَرَ, يُنْذِرُ, أَنْذِرْ, مُنْذِر, مُنْذَر, إِنْذَار,ن ذ ر ,4,أَسْلَمَ',
'150,nzl,d4,أَسْلَمَ,2,4,to send down; to reveal,نازل كرنا,190,أَنْزَلَ, يُنْزِلُ, أَنْزِلْ, مُنْزِل, مُنْزَل, إِنْزَال,ن ز ل ,4,أَسْلَمَ',
'151,n$A,d4,أَسْلَمَ,6,6,to produce/ create;  to make st grow,كھڑا كرنا,22,أَنْشَأَ, يُنْشِئُ, أَنْشِئْ, مُنْشِئ, مُنْشَئ, إِنْشَاء,ن ش أ,4,أَسْلَمَ',
'152,nEm,d4,أَسْلَمَ,1,7,to favor; to bestow grace,انعام كرنا,17,أَنْعَمَ, يُنْعِمُ, أَنْعِمْ, مُنْعِم, مُنْعَم, إِنْعَام,ن ع م ,4,أَسْلَمَ',
'153,nfq,d4,أَسْلَمَ,2,3,to spend,خرچ كرنا,69,أَنْفَقَ, يُنْفِقُ, أَنْفِقْ, مُنْفِق, مُنْفَق, إِنْفَاق,ن ف ق ,4,أَسْلَمَ',
'154,nkr,d4,أَسْلَمَ,,,to not recognize; to deny,انكار كرنا,25,أَنْكَرَ, يُنْكِرُ, أَنْكِرْ, مُنْكِر, مُنْكَر, إِنْكَار ,ن ك ر ,4,أَسْلَمَ',
'155,hlk,d4,أَسْلَمَ,,,to destroy,هلاك كرنا,58,أَهْلَكَ, يُهْلِكُ, أَهْلِكْ, مُهْلِك, مُهْلَك, إِهْلَاك,ه ل ك ,4,أَسْلَمَ',
'156,tmm,d4,أَسْلَمَ,2,124,to complete,پورا كرنا,17,أَتَمَّ, يُتِمُّ, أَتْمِمْ, مُتِمّ, مُتَمّ, إِتْمَام,ت م م,4,أَسْلَمَ',
'157,Hbb,d4,أَسْلَمَ,2,165,to love,محبت كرنا,64,أَحَبَّ, يُحِبُّ, أَحْبِبْ, مُحِبّ, مُحَبّ, إِحْبَاب,ح ب ب,4,أَسْلَمَ',
'158,Hll,d4,أَسْلَمَ,2,187,to make lawful; to cause to dwell,حلال كرنا، ركھوانا,21,أَحَلَّ, يُحِلُّ, أَحْلِلْ, مُحِلّ, مُحَلّ, إِحْلَال ,ح ل ل,4,أَسْلَمَ',
'159,srr,d4,أَسْلَمَ,2,77,to conceal; to speak secretly,چھپانا,18,أَسَرَّ, يُسِرُّ, أَسْرِرْ, مُسِرّ, مُسَرّ, إِسْرَار,س ر ر,4,أَسْلَمَ',
'160,Dll,d4,أَسْلَمَ,2,26,to leave in error; to send astray,گمراه كرنا,68,أَضَلَّ, يُضِلُّ, أَضْلِلْ, مُضِلّ, مُضَلّ, إِضْلَال,ض ل ل,4,أَسْلَمَ',
'161,Edd,d4,أَسْلَمَ,2,24,to prepare; to make st ready,تياري كرنا,20,أَعَدَّ, يُعِدُّ, أَعْدِدْ, مُعِدّ, مُعَدّ, إِعْدَاد,ع د د,4,أَسْلَمَ',
'162,*wq,d4,أَسْلَمَ,6,65,to make sb taste,چكھانا,22,أَذَاقَ, يُذِيقُ, أَذِقْ, مُذِيق, مُذَاق, إِذَاقَة,ذ و ق ,4,أَسْلَمَ',
'163,rwd,d4,أَسْلَمَ,2,26,to intend;  to wish,اراده كرنا,139,أَرَادَ, يُرِيدُ, أَرِدْ, مُرِيد, مُرَاد, إِرَادَة,ر و د ,4,أَسْلَمَ',
'164,syb,d4,أَسْلَمَ,,,to befall; to inflict,آپڑنا,65,أَصَابَ, يُصِيبُ, أَصِبْ, مُصِيب, مُصَاب, إِصَابَة,ص ي ب ,4,أَسْلَمَ',
'165,TwE,d4,أَسْلَمَ,2,285,to obey,اطاعت كرنا,74,أَطَاعَ, يُطِيعُ, أَطِعْ, مُطِيع, مُطَاع, إِطَاعَة,ط وع ,4,أَسْلَمَ',
'166,qwm,d4,أَسْلَمَ,2,3,to establish;  to set upright,كھڑا كرنا,67,أَقَامَ, يُقِيمُ, أَقِمْ, مُقِيم, مُقَام, إِقَامَة,ق و م ,4,أَسْلَمَ',
'167,mwt,d4,أَسْلَمَ,2,28,to cause someone to die,موت دينا,21,أَمَاتَ, يُمِيتُ, أَمِتْ, مُمِيت, مُمَات, إِمَاتَة,م و ت ,4,أَسْلَمَ',
'168,Hyy,d4,أَسْلَمَ,2,28,to give life,زندگي دينا,53,أَحْيَا, يُحْيِي, أَحْيِ, مُحْيٍ, مُحْيَا, إِحْيَاء,ح ي ي,4,أَسْلَمَ',
'169,xfy,d4,أَسْلَمَ,2,271,to conceal,چھپانا,18,أَخْفَى, يُخْفِي, أَخْفِ, مُخْفٍ, مُخْفَى, إِخْفَاء,خ ف ى,4,أَسْلَمَ',
'170,rAy,d4,أَسْلَمَ,2,73,to show,دِكھانا,44,أَرَى, يُرِي, أَرِ, مُرٍ, مُرً, إِرَاءَ ة,ر أ ى,4,أَسْلَمَ',
'171,gny,d4,أَسْلَمَ,3,10,to enrich,كام آنا، غني كرنا,41,أَغْنَى, يُغْنِي, أَغْنِ, مُغْنٍ, مُغْنَى, إِغْنَاء,غ ن ى,4,أَسْلَمَ',
'172,lqy,d4,أَسْلَمَ,2,195,to throw; to cast; to place,ڈالنا,71,أَلْقَى, يُلقِي, أَلْقِ, مُلقٍ, مُلقَى, إِلقَاء,ل ق ى,4,أَسْلَمَ',
'173,njy,d4,أَسْلَمَ,,,to rescue; to save; to deliver,نجات دينا,23,أَنْجَى, يُنْجِي, أَنْجِ, مُنْجٍ, مُنْجَى, إِنْجَاء,ن ج ى,4,أَسْلَمَ',
'174,wHy,d4,أَسْلَمَ,3,44,to reveal;  to inspire,وحي كرنا,72,أَوْحَى, يُوحِي, أَوْحِ, مُوحٍ, مُوحَى, إِيحَاء,و ح ى,4,أَسْلَمَ',
'175,wfy,d4,أَسْلَمَ,2,40,to fulfil,پورا كرنا,18,أَوْفَى, يُوفِي, أَوْفِ, مُوفٍ, مُوفَى, إِيفَاء,و ف ى,4,أَسْلَمَ',
'176,Amn,d4,أَسْلَمَ,2,3,to believe,ايمان لانا,782,آمَنَ, يُؤْمِنُ, آمِنْ, مُؤْمِن, مُؤْمَن, إِيمَان,أ م ن ,4,أَسْلَمَ',
'177,Aty,d4,أَسْلَمَ,,,to give,دينا,274,آ تَى, يُؤْتِي, آتِ, مُؤْتِي, مُؤْتَى, إِيتَاء,أ ت ى,4,أَسْلَمَ',
'178,A*y,d4,أَسْلَمَ,,,to give trouble; to harm; to annoy,تكليف دينا,16,آذَى, يُؤْذِي, آذِ, مُؤْذِي, مُؤْذَى, إِيذَاء,أ ذ ى,4,أَسْلَمَ',
'179,fkr,d5,تَدَبَّرَ,,,to think over; to reflect,تفكر كرنا، غور كنا,17,تَفَكَّرَ, يَتَفَكَّرُ, تَفَكَّرْ, مُتَفَكِّر, مُتَفَكَّر, تَفَكُّر,ف ك ر,5,تَدَبَّرَ',
'180,*kr,d5,تَدَبَّرَ,,,to receive admonition; to remember,نصيحت پكڑنا,51,تَذَكَّرَ, يَتَذَكَّرُ, تَذَكَّرْ, مُتَذَكِّر, مُتَذَكَّر, تَذَكُّر,ذ ك ر,5,تَدَبَّرَ',
'181,wkl,d5,تَدَبَّرَ,,,to put one\'s trust,بھروسه كرنا,44,تَوَكَّلَ, يَتَوَكَّلُ, تَوَكَّلْ, مُتَوَكِّل, مُتَوَكَّل, تَوَكُّل,و ك ل,5,تَدَبَّرَ',
'182,byn,d5,تَدَبَّرَ,2,109,to become clear,ظاهر هونا، واضح هونا,18,تَبَيَّنَ, يَتَبَيَّنُ, تَبَيَّنْ, مُتَبَيِّن, مُتَبَيَّن, تَبَيُّن,ب ي ن,5,تَدَبَّرَ',
'183,rbs,d5,تَدَبَّرَ,2,226,to wait & watch for opportunity,انتظار كرنا,17,تَرَبَّصَ, يَتَرَبَّصُ, تَرَبَّصْ, مُتَرَبِّص, مُتَرَبَّص, تَرَبُّص,ر ب ص,5,تَدَبَّرَ',
'184,wly,d5,تَدَبَّرَ,2,64,to turn away; to take for friend,دوستي كرنا، منه موڑنا,79,تَوَلَّى, يَتَوَلَّى, تَوَلَّ, مُتَوَلٍّ, مُتَوَلَّى, تَوَلٍّ,و ل ي,5,تَدَبَّرَ',
'185,wfy,d5,تَدَبَّرَ,2,234,to make sb die; to receive in full,جان نكالنا,25,تَوَفَّى, يَتَوَفَّى, تَوَفَّ, مُتَوَفٍّ, مُتَوَفَّى, تَوَفٍّ,و ف ي,5,تَدَبَّرَ',
'186,brk,d6,تَدَارَسَ,,,to be blessed or exalted,با بركت هونا,9,تَبَارَكَ, يَتَبَارَكُ, تَبَارَكْ, مُتَبَارِك, -, تَبَارُك,ب ر ك,6,تَدَارَسَ',
'187,sAl,d6,تَدَارَسَ,4,1,to ask each other,آپس ميں پوچھنا,9,تَسَاءَلَ, يَتَسَاءَلُ, تَسَاءَلْ, مُتَسَاءِل, مُتَسَاءَل, تَسَاءُل,س أ ل,6,تَدَارَسَ',
'188,xlf,d7,اِخْتَلَفَ,,,to differ,اختلاف كرنا,52,اِخْتَلَفَ, يَخْتَلِفُ, اِخْتَلِفْ, مُخْتَلِف, مُخْتَلَف, اِخْتِلَاف,خ ل ف,7,اِخْتَلَفَ',
'189,tbE,d7,اِخْتَلَفَ,,,to follow,پيروي كرنا، اتباع كرنا,140,اِتَّبَعَ, يَتَّبِعُ, اِتَّبِعْ, مُتَّبِع, مُتَّبَع, اِتِّبَاع,ت ب ع,7,اِخْتَلَفَ',
'190,Ax*,d7,اِخْتَلَفَ,,,to take; to adopt,اختيار كرنا,128,اِتَّخَذَ, يَتَّخِذُ, اِتَّخِذْ, مُتَّخِذ, مُتَّخَذ, اِتِّخَاذ,أ خ ذ,7,اِخْتَلَفَ',
'191,wqy,d7,اِخْتَلَفَ,,,to be on guard; to protect,تقوي كرنا,215,اِتَّقَى, يَتَّقِي, اِتَّقِ, مُتَّقِي, -, اِتِّقَاء,و ق ي,7,اِخْتَلَفَ',
'192,fry,d7,اِخْتَلَفَ,,,to fabricate a lie,جھوٹ باندھنا,59,اِفْتَرَى, يَفْتَرِي, اِفْتَرِ, مُفْتَرٍ, -, اِفْتِرَاء,ف ر ي,7,اِخْتَلَفَ',
'193,hdy,d7,اِخْتَلَفَ,,,to find or to follow the right path,هدايت پانا,61,اِهْتَدَى, يَهْتَدِي, اِهْتَدِ, مُهْتَدٍ, -, اِهْتِدَاء,ه د ي,7,اِخْتَلَفَ',
'194,bgy,d7,اِخْتَلَفَ,19,92,to seek,چاهنا، تلاش كرنا,48,اِبْتَغَى, يَبْتَغِي, اِبْتَغِ, مُبْتَغٍ, مُبْتَغَى, اِبْتِغَاء,ب غ ي,7,اِخْتَلَفَ',
'195,nhy,d7,اِخْتَلَفَ,,,to refrain; to end,چھوڑ دينا، رك جانا,16,اِنْتَهَى, يَنْتَهِي, اِنْتَهِ, مُنْتَهٍ, -, اِنْتِهَاء,ن ه ي,7,اِخْتَلَفَ',
'196,qlb,d8,اِنْقَلَبَ,,,to turn around; to return,پھر جانا,20,اِنْقَلَبَ, يَنْقَلِبُ, اِنْقَلِبْ, مُنْقَلِب, -, اِنْقِلَاب,ق ل ب,8,اِنْقَلَبَ',
'197,byD,d9,اِبْيَضَّ,3,106,to become white,سفيد هونا,3,اِبْيَضَّ, يَبْيَضُّ, اِبْيَضَّ, مُبْيَضٍّ, -, اِبْيِضَاض,ب ي ض,9,اِبْيَضَّ',
'198,swd,d9,اِبْيَضَّ,3,106,to become black,كالا هونا,3,اِسْوَدَّ, يَسْوَدُّ, اِسْوَدَّ, مُسْوَدٍّ, -, اِسْوِدَاد,س و د,9,اِبْيَضَّ',
'199,Ejl,d10,اِسْتَغْفَرَ,6,57,to seek ss to hasten,جلدي كرنا,20,اِسْتَعْجَلَ, يَسْتَعْجِلُ, اِسْتَعْجِلْ, مُسْتَعْجِل,  -, اِسْتِعْجَال,ع ج ل,10,اِسْتَغْفَرَ',
'200,gfr,d10,اِسْتَغْفَرَ,2,199,to ask forgiveness,بخشش مانگنا,42,اِسْتَغْفَرَ, يَسْتَغْفِرُ, اِسْتَغْفِرْ, مُسْتَغْفِر, مُسْتَغْفَر, اِسْتِغْفَار,غ ف ر,10,اِسْتَغْفَرَ',
'201,kbr,d10,اِسْتَغْفَرَ,,,to act arrogantly,گھمنڈ كرنا,48,اِسْتَكْبَرَ, يَسْتَكْبِرُ, اِسْتَكْبِرْ, مُسْتَكْبِر, -, اِسْتِكْبَار,ك ب ر,10,اِسْتَغْفَرَ',
'202,hzA,d10,اِسْتَغْفَرَ,2,14,to mock at,ٹھٹھا كرنا,23,اِسْتَهْزَأَ, يَسْتَهْزِئُ, اِسْتَهْزِئْ, مُسْتَهْزِئ, مُسْتَهْزَئ, اِسْتِهْزَاء,ه ز ء,10,اِسْتَغْفَرَ',
'203,jwb,d10,اِسْتَغْفَرَ,2,186,to accept;  to respond,قبول كرنا,28,اِسْتَجَابَ, يَسْتَجِيب, اِسْتَجِبْ, مُسْتَجِيب, مُسْتَجَاب, اِسْتِجَابَة,ج و ب,10,اِسْتَغْفَرَ',
'204,TwE,d10,اِسْتَغْفَرَ,2,217,to be able to,كرسكنا,42,اِسْتَطَاعَ, يَسْتَطِيعُ, اِسْتَطِعْ, مُسْتَطِيع, مُسْتَطَاع, اِسْتِطَاعَة,ط و ع,10,اِسْتَغْفَرَ',
'205,qwm,d10,اِسْتَغْفَرَ,1,6,to be straight;  to act straight,ثابت قدم رهنا,47,اِسْتَقَامَ, يَسْتَقِيمُ, اِسْتَقِمْ, مُسْتَقِيم, -, اِسْتِقَامَة,ق و م,10,اِسْتَغْفَرَ',
];

var NEAR_SYNONYMS = [
"falak samaA^' ",
"{ll~ah <ila`h",
">aHad waHiyd farod fura`daY`",
"S~amad ganiY~",
"lam l~ayosa lan laA <in maA hal balaY` kal~aA ", 
"walada waDaEa",
"kaAna >aSobaHa yaSoduru waAqiE",
"kufuw qariyn >atoraAb samiy~ kufuw Saf~ Sa`^f~a`t yuDa`hi_#u ",

"faEala fiEol faEolat Eamila Eamal SanaEu SunoE SanoEap {SodaEo jaraHo {jotaraHu taEam~adato >amor >amara $a>on", //"fEl Eml SnE SdE jrH AjtrH tEmd >mr $>n",
"Hamod $ukor $akara mdH", //"HmdN $krN mdHN",  mdHN??
"sakan sakana >asokan yatabaw~a>u vaAwiy mavowFY badow bada>a HaDara >axolada xulod yaxoludo m~uxal~aduwn EaA$iru", //"skn tbw> vwy vwy bd> HDr xld gny EA$r",  gny?? (7:92:6) yaghnaw	they (had) lived
"n~aAs <insa`n <ins <insiy~ A^dam ba$ar", //"n~aAs <ns >nAs A^dam b$rN", //إنس أناس آدم بشرٌ 
"qadimo yasotaqodimu musotaqodimiyn taqad~ama sabaqa saboq >aqobala", //"qdm sbq >qbl",

"Sawot Sad~a yaSoTarixu hamos Hasiys mukaA^' taSodiyap DaboH xuwaAr $ahiyq zafiyr yalohavo rikoz SayoHap tagay~uZ S~aA^x~ap had~ yagoliY galoY SaloSa`l qaAriEap", //"SwtN Sad~a Srx hms HsysN mkAXN tSdypN DbH xwAr $hyq zfyr lhv rkzN SyHp tgyZ SAxp hdN glyN SlSAlN qArEp",
">amor >amara >a*ina Hukom Hakama Hakam yuHak~imu >awoSa`", //">mr >*n Hkm >wSy",
"Har~ama muHar~amap s~uHot",
"hadaY hudFY {hotadaY` r~a$iyd ra$ad m~uro$id ru$od yaro$udu", //"hdY <htdY r$d",
"Earafa Ear~afa mutawas~imiyn",
"yumaH~iSa zak~aY` m~uSaf~FY bar~a>a tubori}u", //"mHS zkY SfA tbr> m~uSaf~FY Sfw",
"n~ukur nakira naqamu munkar >ankar n~ukur n~ukor", //"nakira naqama",

"xaAfa xawof xa$iYa xaA$iE xa$aEati xu$uwE {t~aqaY` taqowaY yaHo*aru Hi*or Ha*ar r~awoE xiyfap >awojasa wajilato wajilap wajiluwn yarohabu rahobap ruEob mu$ofiquwn waAjifap >awojafo", //"xa$iYa  xaA$iE  wqy xwf x$y H*r x$E rhb $fq wjl rEb wjs wjf rwE",
"qaroD >aqoraDu dayon", //"qrDN dynN",
"faDol man~a >anoEama >aHosana >aHosan", //"fDlN man~a >nEm >Hsn",
"ka*ib ba`Til z~uwr <ifok", //"k*b bATl zwr AfkN",
"jaA^'a >ataY hayota lum~a taEaAla", //"jAX >tAY hyt hlm~ tEAl",
"qad~ama taqad~ama salafa >asolafato", //"qad~ma >solafa >asolafato",
"qara>a nuqori}u talaY` tarotiyl darasu diraAsat >amolaY`", //"qara>a talY rat~ala darasa >amolY >amolaY`",
"Eaduw~ bagoDaA^' Eada`wap $ana_#aAn $aAni}", //"Eaduw~N bagoDaA^' $ana_#aAn $aAni} $AnyN",
"qalob fu&aAd Sador nafos", //"qalob fu&Ad Sador nafos", //28

"jaAr {sotajaAra Eu*o {sotaEi*o",
"rab~",
"malik",
"$ar~",
"wasowaAs wasowasa",
"xan~aAs jin~ap",

"falaq",
"xalaqa",
"gaAsiq waqaba",
"<i*aA",
"n~af~a`va`t",

"tab~a",
"lahab",
">agonaY`",
"kasaba",
"yaSolaY",
"naAr",
"*uw",
"HaTab",
"jiyd",
"Habol m~asad",

"baAri} badiyE faTara xa`liq xalaqa xaloq >an$a>a <in$aA^' *ara>a",

//ANTONYMS START HERE...
"||<ivom  bar~",
"||>aviym  saliym",
"||>abadFA  >azal~a",
"||A^xir  >aw~al  saAbiq",
"||A^xar  >aw~al",
"||>ax~ara  qad~ama",
"||yasotaqodimu yasota>oxiru",
"||>aroD samaA^'",
"||>aSol >aSiyl bukorap",
"||>al~afa $at~aY`", //shatta didnt find in uniq, why??
"|| >amara nahaY`",
"||'aAmana kafara",
"||>amon xawof",
"||>ama`nat xiyaAnap",
"||>unvaY` *akar", //zakar no found
"||<ins jin~",
"||<ins wH$",
"||>aw~al A^xir",
];

var _PDF = "<A HREF=http://ia600705.us.archive.org/12/items/BayyinahE-bookGemsCollection-Linguisticmiracle.com/near-synonyms-nouman-ali-khan-muslimmattersorg.pdf TARGET=_>Source: NearSynonyms PDF - Nouman Ali Khan</A><BR/>";
var NEAR_SYNONYMS_METADATA = {
	"0": {"topic": "The Sky", "page": 83, 
		"info": _PDF + "<BR/>samaa': Essentially means height without limitation. <BR/>  Purely linguistically, anything that is above another thing is a <BR/>  samaa' and that which is below is arDh. This explains the usage in ayah 65:12 and 7:176 <BR/>  where the sky is used for heights above and the word arDh is used for depths below. <BR/><BR/> falak: Though commonly interpreted as the sky, it actually refers to <BR/>  the paths or orbits assigned to planets and stars. These orbits are usually <BR/>  oval in shape and so the word is appropriate in that they <BR/>  resemble the shape of a ship الفُلْك !<PRE>\n\n\
ءآ\n\
▪ Essentially means height without limitation.\n\
▪ Purely linguistically, anything that is above another thing is a ءا and that which is\n\
below is ضرأ . This explains the usage in ayah 65:13\n\
▪ نهلثم ضرلأا نمو تاوا عبس قلخ يلذا اللها ▪ Where the sky is used for heights above, the word ضرأ is used for depths below.7:176\n\
▪ ضرلأا إ لدخأ هنكـلو ا هانعفرل انئش ولو\n\n\
كلف\n\
▪ Though commonly interpreted as the sky, it actually refers to the paths or orbits assigned to planets and stars.\n\
▪ These orbits are usually oval in shape and so the word is appropriate in that they\n\
resemble the shape of a ship كلفلا !\n\
▪ نوحبس كلف في لكو\n\n\
		</PRE>See: Aasmaan."},
		
	"1": {"topic": "God", "page": 818, "info": "Allah, ilah are the different synonyms.<BR/> See entry: ma3bood in below page. " },
	"2": {"topic": "Alone", "page": 138, "info": "aHad, waHiyd, fard, furādā different synonyms.<BR/> See entry: akeyla in below page. " },
	"3": {"topic": "Self-Sufficient", "page": 256, "info": "ghaniyy and Samad are synonyms.<BR/> See entry: beniyaaz in below page. " },
	
	"4": {"topic": "Not", "page": 862, "info": "lam laysa lan laa 'in maa hal balaa kallaa etc are some synonyms. lot more below.<BR/> See entry: naheen in below page. " },	
	"5": {"topic": "Begetting", "page": 396, "info": "walada and waḍaʿa are synonyms.<BR/> See entry: jann-naa in below page. " },
	"6": {"topic": "Become", "page": 900, "info": "kaana, aSbaHa, Sadara, aSdara, waqa3a are synonyms.<BR/> See entry: how-naa in below page. " },
	"7": {"topic": "Equal", "page": 890, "info": "Kufuw, qariyn, aTraab, samiyy, Saffa, Saaffaat, yuḍāhiūna. <BR/>See entry: hamhaa-hangiy hona in below page. " },
	
	"8": {"topic": "Work/doing work", "info": "faEala Eamila SanaE SadaE jaraH ijtaraH tEmd amr Sha'n" },
	"9": {"topic": "Praise & Thanks", "page": 347, "info": "Hamd, Shukr, madH. See: 'Ta3reef karna' topic in book at below page."},
	"10": {"topic": "Settling down. Also see '(7:92:6) yaghnaw	they (had) lived'", "page": 67, "info": _PDF + "<BR><PRE>\n\
نكس ▪ The word نوكس is the opposite of motion or disturbance. When used for settling it\n\
implies moving from somewhere to a new location.\n\
▪ ةنجلا كجوزو تنأ نكسا مدآ اي انلقو (2:35) . This implies that the event of creation was elsewhere.\n\
▪ عرز يذ يرغ داوب يتيرذ نم تنكسأ إ انبر (14:37). Since he relocated his family...\n\
أوب و أوبت\n\
▪ Two unique additions to the general meaning: Return to a relaxed environment and\n\
▪ Used when the climate, environment, neighbors etc are all exactly as the settler wants them to be. It fits the criteria that the settler has in mind.\n\
▪ (12:56) ءاش ثيح ا م أوبتي ضرلأا في فسويل انك م كلذكو ▪ (3:121) لاتقلل دعاقم يننمؤملا ءىوبت كلهأ نم تودغ ذإو\n\
ىوث ▪ To be buried, to stop by, to settle down. لجرلا ىوث – the man died. To remain &\n\
intend to remain in the same location in the future where one has been since numerous generations.\n\
▪ (28:45) ينلسرم انك انكلو انتايآ م لع ولتت نيدم لهأ في ايواث تنك امو\n\
ادب\n\
▪ To live as a Bedouin in the outskirts / rural areas. A place where, because of the lack of\n\
structures, one can see far and wide. A word derived from this is ةيداب which is another\n\
word for the desert.\n\
▪ (12:100) ودبلا نم مكب ءاجو نجسلا نم ينجرخأ ذإ\n\
رضح ▪ The opposite of ادب in some sense. To live in a city, to take up residence in a city.	\n\
▪ (2:196) مارحلا دجسملا يرضاح لههأ نكي مل نمل كلذ\n\
لدخ\n\
▪ To remain somewhere for an extended period of time.\n\
▪ (2:25) نولداخ ا ف و\n\
ينغ\n\
▪ To live in a place so comfortably that you don’t consider the thought of moving. To be happy where you are because of being well settled.\n\
▪ (7:92) ا ف اونغي مل نأك ابيعش اوبذك نيلذا\n\
رشاع ▪ Comes from ع which denotes two distinct things: the number 10 and to mix,\n\
associate, interfere and be involved in one another’s affairs. The word ةيرشع meaning\n\
tribe also comes from this root. رشاع then means to live together with a family.\n\
▪ (4:19) فو ملاب نهورشاعو \n\n\
</PRE>See: Abaad hona, bemaana rahnaa."},

	"11": {"topic":"human", "page": 71, "info":  "ins, unaas, aadam, bashar. " + _PDF + "<PRE>\n\n\
س إ ▪ Ibn Qutaybah writes that ناس إ is called س إ because he is visible to the eye, unlike Jinn.\n\
He cites 28:29 إ اوثكما لههلأ لاق اران روطلا بناج نم س آ لههأب راسو لجلأ ا وم ىضق املف اران تس آ\n\
as evidence.\n\
▪ Ibn Abbas narrates that يس إ is used because a covenant was made with him and he\n\
forgot, from the word ناوس ىس ي يس .\n\
▪ Imam Raghib assumes the word is derived from س أ; meaning a creature predisposed to\n\
loving and mutual living. From this prospective, the antonym would be شحو.\n\
▪ Ibn Al Faris combines both of the above; a) to be visible and b) to not have attributes of wild beasts.\n\
▪ س إ is an Ism Jins; it could mean a person or all of humanity. ناس إ is the same way but\n\
mostly gets used for all of humanity. The exclusive singular for ناس إ is يس إ and its\n\
plural is سان, سانأ and انأ.\n\n\
سانأ\n\
▪ UNAAS is used for distinct groups, tribes, nations or otherwise.\n\
▪ 2:60 م م\n\
سانأ لك ملع دق\n\
▪ انأ is used for a massive group of people.\n\
▪ (25:49) ايرثك انأو اماعنأ انقلخ امم هيقس و اتيم ةلدب هب ييحنل\n\
مدآ ▪ It comes from the root م و لاد و فلأ; meaning compassion, softness and agreement.\n\
▪ It is the name of the father of humanity; whenever it is used in the Quran, it deals with the history of human creation.\n\
▪ Something manifest with great beauty.\n\
▪ ة لا refers to the outer layer of our body, meaning our skin.\n\
▪ (74:29) لل ةحاول ▪ Its plural is both and راش أ; one reason he is called this is because his skin is more\n\
visible than other animals.\n\
▪ The word is used when the intent is to highlight the instinctive animal dimensions of people.\n\
▪ (23:47) نودباع انل امهموقو انلثم ني ل نمؤنأ اولاقف ▪ (17: 94-95) لاوسر ا اللها ثعبأ اولاق\n\
▪ لاوسر اكلم ءامسلا نم م لع انلزنل ينن مطم نوشمي ةك لآم ضرلأا في ناك ول لق \n\n\
</PRE>See: Aadmi, insaan.</PRE>"
},

	"12": {"topic":"Go ahead", "page": 94, "info": _PDF + "<PRE>\n\n\
مدق\n\
▪ To go ahead of someone on one’s feet.\n\
▪ (11:98) دوروملا درولا سئبو رانلا دروأف ةمايقلا موي هموق مدقي\n\
▪ مدقتسا is to intend to get ahead and move forward\n\n\
قبس ▪ To proceed, come side by side, take the lead. قبس is a bet on racing. قباس is used for a\n\
racehorse and قبس for the give and take done after the race. It implies competition in\n\
getting ahead.\n\
▪ (59:10) ناميلإاب انوقبس نيلذا انناوخلإو انل رفغا انبر نولوقي دعب نم اوؤاج نيلذاو\n\
▪ قبتسا is to do ones best to get ahead in a race\n\
▪ (12:25) بابلا اقبتساو\n\
لبقأ ▪ Both لبقأ and لبقتسا are to proceed towards someone or alongside someone\n\
▪ (68:30) نومولاتي ضعب ع ضعب لبقأف\n\
▪ (46:24) حير هب لجعتسا ام وه لب انرطمم ضراع اذه اولاق\n\
م يدوأ لبقتسم اضراع هوأر املف لأ باذع ا ف 6. 	\n\n\
	</PRE>See: agay badhaana"},
	
	"13": {"topic":"noise", "page": 100, "info": _PDF +"<PRE>\
صَوْت\n\
▪ Used for any time of noise whether made from living or non living things. Ibn AlFaris calls defines it as any sound that hits the ears of the listener.\n\
▪ (31:19) يرمحلا توصل تاوصلأا ركنأ نإ كتوص نم ضضغاو\n\
صَدَّ\n\
▪ The cry of a person that has fallen or been hurt. Some have also taken it to mean the\n\
opposite; the cry of someone jumping with joy/ hooting and howling. اديدص دصي دص\n\
▪ (43:57) نودصي هنم كموق اذإ لاثم رم نبا برض املو\n\
صرخ\n\
▪ To scream when in danger or terrorized\n\
▪ (35:37) ا ف نوخرطصي و\n\
هَمْس\n\
▪ The sound made by any movement of a person. Whispering/ near silence.\n\
▪ (20:108) اسمه لاإ عمس لاف ن رلل تاوصلأا تعشخو\n\
حَسِيس \n\
▪ The sound of a footstep. The lightest bit of sound like the subtle crackling of a flame\n\
▪ (21:102) اهس سح نوعمس لا\n\
 ُكَآء\n\
▪ To whistle or to use instruments that create whistle-like sounds (flutes etc.)\n\
▪ (8:35) ةيدصتو ءاكم لاإ تيبلا دنع م لاص ناك امو\n\
تَصْدِيَة \n\
▪ To clap with both hands or to use instruments of percussion.\n\
▪ (8:35) ةيدصتو ءاكم لاإ تيبلا دنع م لاص ناك امو\n\
ضَبْح \n\
▪ Horses panting because of their exhausting gallop\n\
▪ (100:1) احبض تايداعلاو\n\
خُوَار \n\
▪ The mooing of a cow or bull.\n\
▪ (7:148) راوخ له ادسج لاجع م لح نم هدعب نم وم موق ذختاو\n\
شَهِيق\n\
▪ The progressively lower moaning of a donkey as it comes a journey’s end.\n\
▪ (11:106) قيهشو يرفز ا ف ل رانلا يفف اوقش نيلذا امأف\n\
 زَفِير \n\
▪ To extend the exhale after a long inhale.\n\
▪ The progressively louder braying of a donkey as it begins its journey.\n\
▪ (11:106) قيهشو يرفز ا ف ل رانلا يفف اوقش نيلذا امأف\n\
لْهَثْ \n\
▪ The sound of a dehydrated panting dog\n\
▪ (7:176) ثهلي هكترت وأ ثهلي هيلع لمحت نإ بلكلا لثمك لهثمف\n\
رِكْز \n\
▪ The barely audible buzzing of a fly\n\
▪ (19:98) ازكر ل عمس وأ دحأ نم م م سحت له نرق نم لبق انكلهأ مكو\n\
صَيْحَة \n\
▪ To scream at the top of one’s lungs. The sound of the horn being blown. A sound that shakes the insides. A cry that doesn’t carry meaning.\n\
▪ (15:73) ينق م ةحيصلا م ذخأف\n\
تَغَيُّظ\n\
▪ The cry of one overwhelmed with rage and fury. The sounds produced by the raging flames of hell.\n\
▪ (25:12) ايرفزو اظيغت اله اوع ديعب ناكم نم م أر اذإ\n\
  صَّآخَّة\n\
▪ A harsh deafening sound. A sound that hurts the ear.\n\
▪ (80:33) ةخاصلا تءاج اذإف\n\
هَدّ\n\
▪ The crashing sound of a collapsing wall or building.\n\
▪ 19:90\n\
غَلْى \n\
▪ The sound of sizzling or boiling stew.\n\
▪ 44:45-46\n\
صَلْصَٰل ▪ Is considered a derivative of the word للاص\n\
▪ The crackling sound of dry, hard soil. The sound of a nail or peg being driven into the\n\
ground.\n\
▪ 15:26\n\
 قَارِعَة  ▪ قَارِعَة   means to strike one thing against another. بابلا عرق is to knock on a door.\n\
Resurrection has been called ةعراق because a lot of noise will be generated because of\n\
things striking against one another on that day.	\n\n\
</PRE>See: Awaaz aur uske aqsaam."},
	
	"14": {"topic":"Executing Authority", "page": 451, "info": _PDF + "<PRE>\n\n\
رمأ ▪ رمأ means issue or matter, the plural being رومأ . رمأ also means command and in that\n\
case its plural is رماوأ. رمأي رمأ means to instruct, to send instructions or to command.\n\
It can be used for something good or bad is the most general term in the group.\n\
▪ 3:14\n\
▪ 34:33\n\n\
نذأ\n\
▪ Means to give approval or permission. It also means to command but used only when the command is to conform to divine will.\n\
▪ 24:36\n\n\
مكح\n\
▪ Means to stop someone or something for their/ its own benefit. Also used to leash an\n\
animal. ةبالدا ةمكح means the leash/ reigns on an animal. مكح has also been\n\
understood to mean ملظلا نع عنم meaning a command that prevents or prohibits\n\
wrongdoing.\n\
▪ 5:47\n\n\
ىصوأ\n\
▪ Means to take a binding promise or commitment from someone, to command or to urge & bid someone that is under one’s wing.\n\
▪ When attributed to اللها it means that the command in question is being issued as\n\
counsel and the one being commanded needs to understand that it deserves extra attention because it is for his /her own benefit.\n\n\
	</PRE>See: Hukum deyna."},
	
	"15": {"topic":"The Forbidden", "page": 446, "info": _PDF + "<PRE>\n\
مارح ▪ Things or actions that are forbidden by divine law. Some have identified it as عنملا\n\
ديدشلا .\n\
▪ 2:275\n\n\
تحس\n\
▪ Is associated specifically with earnings and wealth. Moneys earned from the selling of\n\
haram or gambling etc. would all be تحس.\n\
▪ 5:42\n\n\
</PRE>	See: Haraam."},
	
	"16": {"topic":"To Guide & to be guided", "page": 883, "info": _PDF + "<PRE>\n\n\
ىده ▪ To guide someone to what is good out of one’s grace and favor. The opposite of لضأ .\n\
▪ It includes natural predispositions like a child suckling from the mother.\n\
▪ (20:50)\n\
▪ It includes the turning of one’s world view from disbelief to belief. To guide someone to obedience and away from rebellion. Prophets, messengers and da’ees try to call people to guidance, but in the end Allah is the one who grants it.\n\
▪ 28:56\n\
▪ Those who are guided to Islam, to show them the right way now that they are convinced of living by it.\n\n\
ىدتها\n\
▪ To acquire, internalize and commit oneself to guidance.\n\
▪ 10:108\n\n\
دشر ▪ The opposite of ىوغ . It describes someone who not only accepts the right path but\n\
makes changes for the better in his / her character.\n\
▪ 11:78 \n\n\
</PRE>	See: hidayath deyna, paana"},
	
	"17": {"topic":"To recognize", "page": 296, "info": _PDF + "<PRE>\n\n\
ف\n\
▪ To recognize something after observing its signs, symbols or identifying markers. It is a\n\
less comprehensive term than ملع\n\
▪ (2:146) ءانبأ نوف ي امك هنوف ي باتكلا انيتآ نيلذا\n\n\
مسوت ▪ مسو means to brand or tattoo something. To scratch off a birth mark. ماسو is the tool\n\
used to brand or tattoo. سو is beautiful. مسوت is to describe something in great\n\
detail. To demand identifying.\n\
▪ (15:75) ين و تملل تايلآ كلذ في نإ 11.\n\
</PRE>	See: pehchaanna"},

	"18": {"topic":"To Purify", "page": 265, "info": _PDF + "<PRE>\n\n\
صحم ▪ To purify something of flaws, blemishes or impurities. بهلذا صحم is the term used to\n\
describe the process used to purify gold of its impurities.\n\
▪ (3:141) نيرفاكلا\n\
قحميو اونمآ نيلذا اللها صحميلو\n\n\
ىكز ▪ To purify the inner self سفن of spiritual diseases, immorality and evil inclinations. To\n\
declare oneself pure of such ills.\n\
▪ (53:32) ىقتا نمب ملعأ وه مكسفنأ اوكزت لاف\n\n\
افص\n\
▪ To remove any or all impurities. It is used to describe the process of filtration.\n\
▪ (47:15) ىفصم لسع نم را أو ينبراشلل ةلذ ر نم را أو\n\n\
أرب ▪ أبرتTo acquire a cure from disease. To be free and clear of someone or something. أربأ\n\
to make someone healthy or heal someone\n\
▪ (3:149) اللها نذإب وملا يـيحأو صربلأاو همكلأا ءىربأو\n\
▪ Also means to purify someone of an accusation or fault. To free someone.\n\
▪ (33:69) اولاق امم اللها هأبرف وم اوذآ نيلذاك اونوكت لا 12.\n\
</PRE>	See: paak karna"},

	"19": {"topic":"To feel bad", "page": 209, "info": _PDF + "<PRE>\n\n\
ركن ▪ Has two implications: (i) estrangement and (ii) unacceptability. ركنأ means to deny as\n\
well as to find someone shocking. ركنم is everything that society finds detestable or\n\
that divine law declares unacceptable. ركن is something considered bad universally.\n\
▪ (54:6) ركن ء إ عالدا عدي موي م ع لوتف\n\n\
مقن ▪ مقن و مقن to consider something bad. To recognize something as detestable, to find\n\
fault in something, to condemn something, to punish. Thus ةمقن is something that is\n\
found so unacceptable to someone that whether or not it is universally bad or not, the one finding it unacceptable is willing to punish in retaliation to it. That is why it includes the meanings of punishment and revenge.\n\
▪ (85:8) ديمحلا زيزعلا اللهاب اونمؤي نأ لاإ م م اومقن امو 13. \n\n\
</PRE>	naqama nakira. See: Buraa lagna."},
	
	"20": {"topic":"Fear", "page": 518, "info": "Khawf Khashyah Khushoo' Taqwa Hadthr Raa'a Wajas Wajl Rahb Ru'b Shafaq Wajf. <BR/> See <A HREF=http://www.linguisticmiracle.com/gems/usage-of-fear-in-the-quran TARGET=_>Article</A> and entry for 'Darna' in the book below."},
	
	"21": {"topic":"Borrowing", "page": 127, "info": "qarDun daynun. "+_PDF + "<PRE>\n\n\
ضرق\n\
▪ A loan taken by someone because of one’s personal needs. It is on the condition that it\n\
will be returned. If there is a time period allotted for the return, it is نيد, otherwise it is\n\n\
ضرق .\n\
▪ A نسح ضرق is coined by Allah in the Qur’an for when He is collecting taking the loan\n\
from His subjects. The term is used to put the subject to shame and to challenge the \n\
reverence he or she may have for Allah.\n\
▪ (2:245) مَّن ذَا الَّذِي يُقْرِضُ اللَّـهَ قَرْضًا حَسَنًا\n\n\
daynun\n\
▪ Is  a  more generic  term  used  for all  types of  transactions  for  which one  becomes  \n\
financially responsible;  be they  business or  personal in  nature.    \n\
▪ A  person  can  be 'madyuwn' when engaged a  mixture of  accounts  receivable & payable transactions. \n\
▪ 2:282 إِذَا تَدَايَنتُم بِدَيْنٍ إِلَىٰ أَجَلٍ مُّسَمًّى\n\n\
</PRE>	See: udhaar."},

	"22": {"topic":"Favors", "page": 124, "info": "faDlun manna an3ama aHsana. See: ihsaan karna."},
	"23": {"topic":"Lie", "page": 405, "info": "kazib (opposite: Sidqun). baaTil (opposite: Haqqun), zuwr, ifkun. See: jhuwt."},
	"24": {"topic":"Coming", "page": 97, "info": "jaa'a ataa hayta halumma ta3aala. See: aana."},
	"25": {"topic":"To send forward", "page": 95, "info": "qaddama aslafa. See: aage bhejna."},
	"26": {"topic":"Read & Recite", "page": 251, "info": "qara'a talaa rattala darasa amlaa. See: padhna, padhaana."},
	"27": {"topic":"Enemy, Enmity", "page": 481, "info": "3aduwwun baghDaa'u shaaniyyun. See: Dushman, dushmani."},
	"28": {"topic":"The heart, the chest & the self", "page": 483, "info": "qalb fu'ad Sadr nafs. See: Dil."},


	"29": {"topic": "Seeking protection", "page": 289, "info": "Ajaar and istijaar. Aa3aza and isti3aza. Panah dena, panah maangna." },
	"30": {"topic": "Lord", "page": 279, "info": "Rabb. Parvarish karna." },
	"31": {"topic": "King", "page": 172, "info": "Malik. Badshahi." },
	"32": {"topic": "Evil", "page": 206, "info": "Shar. Burai." },
	"33": {"topic": "Whisperer", "page": 485, "info": "Waswaas. dil main baat daalna." },
	"34": {"topic": "One who withdraws", "page": 392, "info": "Khannas. Jinn. Also pg 326 'peeche ke doosre mustaqqaat'." },
	
	"35": {"topic": "Dawn", "page": 302, "info": "Falaq. Phaarna." },
	"36": {"topic": "Creator", "page": 327, "info": "Khalaq. peda karna." },
	"37": {"topic": "darkness", "page": 337, "info": "Ghaasiq. taareeki chaana." },
	"38": {"topic": "when", "page": 381, "info": "Iza." },
	"39": {"topic": "blowers", "page": 313, "info": "naffathaat. phoonkna." },
	
	"40": {"topic": "Perish", "page": 370, "info": "Tabbat. tootna. Also see pg 884, Halaakat." },
	"41": {"topic": "Flame", "page": 610, "info": "Lahab. Sho`la." },
	"42": {"topic": "to be of use/to avail", "page": 692, "info": "Aghna. kaam aana." },
	"43": {"topic": "to earn", "page": 706, "info": "kasab. kamaana." },
	"44": {"topic": "to enter", "page": 473, "info": "Yasla, daakhil hona" },
	"45": {"topic": "fire", "page": 85, "info": "Naaran, aag" },
	"46": {"topic": "owner/possessor of", "page": 873, "info": "Zaat (zu), waala" },
	"47": {"topic": "fuel/firewood", "page": 165, "info": "Hatab, eendhan. Also see pg 764, Lakri." },
	"48": {"topic": "neck", "page": 728, "info": "Jeed, gardan" },
	"49": {"topic": "rope", "page": 541, "info": "Habl, rassi. Masad, moonj ki rassi." },

	"50": {"topic": "to create", "page": 327, "info": "bara'a badaEa faTara khalaqa ansha'a dhara'a <PRE> \n\
GIST:\n\
1) bara'a: To bring forth/create something from nothing. See 2:57.\n\
2) bada3a: Without a model or example, create something for the first time. See 2:117.\n\
3) faTara: To give good shape by splitting. See 35:1.\n\
4) Khalaqa: to create/produce something that already exists. See 4:1, 5:110.\n\
5) ansha'a: To create and raise up. Ex: 6:98, 43:18, 56:72.\n\
6) dhara'a: to create and multiply. see 7:179, 67:24.\n\
\n\n\
DETAILS:\n\
1) bara'a: To create from nothing, and give it a shape. Invent. See 2:57.\n\
2) bada3a: To begin, make/create for the first time without any model. bariy3: to create a unique thing. See 2:117.\n\
3) faTara: To create/split to make it more beautiful. See 35:1.\n\
4) Khalaqa: i) to measure accurately and define the dimensions of anything. ii) to be created by The Creator. \n\
	iii) commonly means to create/produce another thing from one that already exists/created. See 4:1. \n\
	In this case it can be attributed to others too other than The Creator, eg: 5:110.\n\
5) ansha'a: From nasha'a = production/creation. Basically it has two meanings: i) to create a thing \n\
	ii) then to care for it & help in its growth/increase/to raise up.\n\
This word has been used both in individual meaning as well as in both meanings together.\n\
Ex: To create/give birth: see 6:98. To raise up/help grow: see 43:18. To create & raise up: see 56:72.\n\
6) dhara'a: i) to create/produce ii) to multiply. This word is used in both meanings, separately & jointly.\n\
Ex: To create: see 7:179. To multiply: 67:24. (ex: of a seed as well as man)\n\
sowed & multiplied; created & multiplied.	\n\n\
	</PRE>See: payda karna." },
	"51": {"topic": "", "page": 1, "info": "" },
	"52": {"topic": "", "page": 1, "info": "" },
	"53": {"topic": "", "page": 1, "info": "" },
	"54": {"topic": "", "page": 1, "info": "" },
	"55": {"topic": "", "page": 1, "info": "" },
	"56": {"topic": "", "page": 1, "info": "" },
	"57": {"topic": "", "page": 1, "info": "" },
	"58": {"topic": "", "page": 1, "info": "" },
	"59": {"topic": "", "page": 1, "info": "" },
	"60": {"topic": "", "page": 1, "info": "" },

	};
	
	
var offlinesearch = function(keyword){ 
		UIblockForSearch('Searching for keyword: ' + keyword, 'PLEASE WAIT...<IMG SRC=wait.gif>');
		//UIdisplayResults(null, 'Searching for keyword: ' + keyword + '<BR><BR>Please wait...<IMG SRC=wait.gif>');
		var results = {}, title='', mixMode=false, arrMode=false, engMode=false, transMode=false;
		var keyword1, keyword2, keyword3, keyword4, keyword5,  word=keyword;
		if(!arrMode && !engMode) transMode=true;
mixMode = arrMode = engMode = transMode = true;
keyword1 = keyword2 = keyword3 = keyword4 = keyword5 = keyword;
		if(mixMode){
			title='mix';
			regexp = new RegExp(".*(?:" + escapeForRegex(word=keyword1) + ").*", "g");
			results[title] = search2(word, regexp); //COST=profile(title,0,true); results[title+'COST'] = COST;
			//console.log( results[title] );//UI_displaySearchHits(title, word, results, COST);
			if(results[title]){ var refs = '';
				console.log( results[title].length + ' hits for keyword: ' + keyword);
				$.each(results[title], function(a, hit){
					refs += ( hit ? hit.split('|')[0] : '-') + '; ';
				});
				UIdisplayResults(refs, 'Search results for keyword: ' + keyword); console.log(refs);
			}else{ UIdisplayResults(null, 'No search results for keyword: ' + keyword); console.log( 'no hits for keyword: ' + keyword ); }
		}
return;
		if(arrMode || engMode){ transMode = true;
			title='arabic';
			regexp = new RegExp(".*(?:" + escapeForRegex(word=keyword1) + ").*", "g");
			results[title] = search2(word, regexp, qBare); //COST=profile(title,0,true); results[title+'COST'] = COST;
			console.log( results );//UI_displaySearchHits(title, word, results, COST);
		}
		
		if(arrMode || engMode){
			title = 'arabicBuckTranslit';
			regexp = new RegExp(".*(?:" + escapeForRegex(word=keyword2) + ").*", "g");
			results[title] = search2(word, regexp, qBuck); //COST=profile(title,0,true); results[title+'COST'] = COST;
			console.log( results );//UI_displaySearchHits(title, word, results, COST);
		}		
return;
		if(transMode && keyword.length < 3) transMode=false;
		if(transMode){
			title='translation';
			regexp = new RegExp(".*(?:" + escapeForRegex(word=keyword3) + ").*", "gi");
			results[title] = searchTrans(word, regexp); //COST=profile(title,0,true); results[title+'COST'] = COST;
			UI_displaySearchHits(title, word, results,COST);
		}
}

var UIlinkifySearchResult = function(ref){
	var TEMPLATE = '<A HREF=#!/quran-corpus/$1 onclick=$.unblockUI();>$2</A>';
	return TEMPLATE.replace(/\$1/, ref).replace(/\$2/, ref);
}

var UIblockForSearch = function(msg, html){
	var height = $(window).height() * 68/100;
	var width  = $(window).width() * 68/100;
	$.blockUI({
		message: '<BR/><h3>' + msg + '</h3><div style=font-size:3em;text-align:left;overflow:scroll;max-height:'+ height +';height:' + height +'>' + html + '</div>',
		//message: '<BR/><h3>' + msg + '</h3><div style=font-size:3em;text-align:left;>' + html + '</div>',
		css: { 
			top: '60px', //($(window).height() - width) /2 + 'px', 
			left: ($(window).width() - width) /2 + 'px', 
			width: '68%', //'400px' 
			height: '68%'
		},
		//	css: { height: '500px', width: '800px', top: '20%' }
	});
	$('.blockOverlay').attr('title','Click to unblock').click($.unblockUI); //ui-tooltip-content
}

var UIunblockForSearch = function(){
	$.unblockUI();
}

var UIdisplayResults = function(refs, msg){
	var html = '';
	if(refs){
		$.each(refs.split('; '), function(a, ref){
			if(ref) html += (a+1) + ') ' + UIlinkifySearchResult(ref) + '<BR/>';
		});
		html = '<div style=max-height:400px;overflow:scroll;>' + html + '</div';
	}
	UIblockForSearch( msg, html );
}

		var qBuck, qBare2, qBuck2, RESET=false, qBare, qBareArr, qBare2, qBuck2, percentComplete = -1;
var _bPROFILE_SEARCH = false;
		var search2 = function(word, regexp, DATA){ var results;
			if(gq.loadedPercent != 100){
				alert('Searching on partial data only ' + gq.loadedPercent + '%');
			}
			else if(gq.loadedPercent == 0){ alert('data yet to be loaded'); return; }
			if(percentComplete != gq.loadedPercent){
				qBuck = gq.strings.join('\n');
				qBuck2 = _prefixData( qBuck );
				percentComplete = gq.loadedPercent;
			}
			
		  if(!DATA) DATA = qBuck;
		  //if(qBare == null)		qBare = BuckToBare(qBuck);
		  //if(qBareArr == null)	qBareArr = qBare.split(/\r?\n/);
		  //if(!qBare2 || RESET){ qBare2 = _prefixData( qBare ); RESET=false;}
		  if(!qBuck2 || RESET){ qBuck2 = _prefixData( qBuck ); RESET=false;}
		  if(DATA == qBuck) results = qBuck2.match(regexp);
		  //else if(DATA == qBare) results = qBare2.match(regexp);
		  //if(!results){if(_bPROFILE_SEARCH) _log('no hits');}else{ if(_bPROFILE_SEARCH) _log(results.length + ' hits');}
		  return results;
		}

		var _prefixData = function(DATA){  if(!DATA) return;
		   var ARRAY = DATA.split('\n'), SEP='|'; //TODO: split using a regex, to account for /r/n
		   for(var n=0; n<ARRAY.length; ++n){
			 ARRAY[n] = mapLinenoToRef(n, SEP) + '|' + ARRAY[n];
		   } /*console.log( ARRAY );*/
		   return ARRAY.join('\n');
		}

		var mapLinenoToRef = function(lineno){
			var obj = Quran.ayah.fromVerse(lineno);
			return obj.surah +':'+ obj.ayah;
		}

//		offlinesearch('beard');

//KNOWN ISSUES:  For LemmaCountTillRef, check 2:228:22 (says 7 occurences. only 6 in corpus). 