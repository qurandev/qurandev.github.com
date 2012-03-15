//var QuranNavigator = (function() {

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
	
	UIgetRootLink:		function(root, linkname, linkprefix){
		var link = CORPUS.LinkQuranDictionary.replace(/\$1/, root);
		return CORPUS.TemplateRootLink.replace(/\$1/, link).replace(/\$2/, linkname?linkname:root).replace(/\$3/, linkprefix?linkprefix:'Root: ');
	},

	UIgetRootDecoratedLink:		function(root, linkname, linkprefix){
		var temp='', rootLetters = (linkname ? linkname.split('') : root.split('') );
		temp = CORPUS.TemplateRootDecoratedLink.replace(/\$1/, rootLetters[0]).replace(/\$2/, rootLetters[1]).replace(/\$3/, rootLetters[2]);
		return CORPUS.UIgetRootLink(root, temp, linkprefix);
	},

	UIgetLemmaLink:		function(lemma, linkname, linkprefix){
		var link = CORPUS.LinkLemmaSearch.replace(/\$1/, escape(lemma));
		return CORPUS.TemplateLemmaLink.replace(/\$1/, link).replace(/\$2/, linkname?linkname:escape(lemma)).replace(/\$3/, linkprefix?linkprefix:'Lemma: ');
	},
	
	UIgetLemmaCount:	function(lemma, linkname, linkprefix){
		if(CORPUS._RAWDATAALL == ''){
			CORPUS._RAWDATAALL = gq.strings.join('\n'); 
		}
		var pattern = 'LEM\\:';
		var regexp = RegExp( pattern + escapeForRegex(lemma), "g");
		return CORPUS._RAWDATAALL.match( regexp ).length;
	},
	
	UIgetRootCount:		function(root, linkname, linkprefix){
		if(CORPUS._RAWDATAALL == ''){
			CORPUS._RAWDATAALL = gq.strings.join('\n'); 
		}
		var pattern = 'ROOT\\:';
		var regexp = RegExp( pattern + escapeForRegex(root), "g");
		return CORPUS._RAWDATAALL.match( regexp ).length;
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
	
	UIgetWordGrammarDisplay: function(ref)
	{
		var corpus, str = '', root='', lemma = '', pos = '', features='';
		
		try{
			corpus = CORPUS.parse( ref ); //console.log(corpus);
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
			if(corpus.lemma)		str += CORPUS.UIgetLemmaLink(corpus.lemma, EnToAr(corpus.lemma), 'Dict: ' + CORPUS.UIgetLemmaCount(corpus.lemma) + 'x ') + '&nbsp;';
			//if(corpus.lemma)		str += '&nbsp;('+ CORPUS.UIgetLemmaCount(corpus.lemma) + ' times)&nbsp;';
			if(corpus.root)			str += CORPUS.UIgetRootDecoratedLink(corpus.root, EnToAr(corpus.root), 'Root: ' + CORPUS.UIgetRootCount(corpus.root) + 'x ' ) + '&nbsp;'; //If u dont want colored, use UIgetRootLink
			//if(corpus.root)			str += '&nbsp;('+ CORPUS.UIgetRootCount(corpus.root) + ' times)&nbsp;';
			if(corpus.misc)			str += '</li><li>' + CORPUS.UIgetMiscLink(corpus.misc);// + CORPUS.UIgetRefLink(ref,'more info');
			if(corpus.features)
				if(CORPUS.FEATURES_MAPPING[ corpus.features ])
									str += '</li><li>' + '<IMG SRC=../plugins/quran-grammar/Images/' + [ corpus.features ] + 'PERF3MS.gif /><BR/> ';
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

	var escapeForRegex = function(regex){
		if(!regex) return;
		return regex.replace(/\'/g, '\\\'').replace(/\[/g, '\\\[').replace(/\*/g, '\\\*').replace(/\$/g, '\\\$').replace(/\@/g, '\\\@').replace(/\+/g, '\\\+');
	}
	
	var escapeMisc = function(input){ var output='';
		if(!input) return; output = input.replace(/\</g, '&#171;').replace(/\>/g, '&gt;').replace(/\"/g, '&#9674;');  //&#60; for <. 9668 for left diamond like.
		if(input.indexOf('<') != -1 || input.indexOf('>') != -1){ console.log(input +'\t\t'+ output ); if(typeof(DEBUG) != 'undefined')debugger; }
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

 