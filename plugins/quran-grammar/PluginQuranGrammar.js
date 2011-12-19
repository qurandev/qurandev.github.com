//var QuranNavigator = (function() {

var CORPUS = {
	LinkWordMorphology: "http://corpus.quran.com/wordmorphology.jsp?location=($1)",
	LinkQuranDictionary: "http://corpus.quran.com/qurandictionary.jsp?q=$1",
	LinkLemmaSearch:	 "http://corpus.quran.com/search.jsp?q=lem:$1",

	TemplateRefLink:	"$3<A HREF=$1 TARGET=_>$2</A>",
	TemplateRootLink:	"$3<A HREF=$1 TARGET=_>$2</A>",
	TemplateRootDecoratedLink:	"<SPAN CLASS=r1 style=color:red>$1</SPAN>&zwnj;<SPAN CLASS=r2 style=color:green>$2</SPAN>&zwnj;<SPAN CLASS=r3 style=color:blue>$3</SPAN>",
	TemplateLemmaLink:	"$3<A HREF=$1 TARGET=_>$2</A>",
	
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
	
	UIgetPOSLink:		function(pos, linkname, linkprefix){
		return (linkprefix?linkprefix : 'Part-of-speech: ') + pos;
	},
	
	UIgetFeaturesLink:	function(features, linkname, linkprefix){
		return (linkprefix?linkprefix : 'Features: ') + escape(features);
	},
	
	UIgetMiscLink:		function(misc, linkname, linkprefix){
		return '<span style=font-size:8px>' + (linkprefix?linkprefix : 'Misc: ') + escape(misc) + '</span>';
	},
	
	UIgetWordGrammarDisplay: function(ref)
	{
		var corpus, str = '', root='Sbr', lemma = 'liHoyat', pos = 'V', features='3FS GEN MOOD:JUS PASS IMPF VN ACT|PCPL'; //hard coded root etc for now.
		
		try{
			corpus = CORPUS.parse( ref ); //console.log(corpus);
		}catch(err){ console.log(err.message); console.log(err); debugger; }
		if(corpus){
			if(corpus.pos) 			str +=			 CORPUS.UIgetPOSLink(corpus.pos) + ' form: ' + corpus.form;
			if(corpus.features) 	str += '<BR/>' + CORPUS.UIgetFeaturesLink(corpus.features);
			if(corpus.lemma)		str += '<BR/>' + CORPUS.UIgetLemmaLink(corpus.lemma, EnToAr(corpus.lemma));
			if(corpus.root)			str += '&nbsp;&nbsp;&nbsp;&nbsp;' + CORPUS.UIgetRootDecoratedLink(corpus.root, EnToAr(corpus.root)); //If u dont want colored, use UIgetRootLink
			if(corpus.misc)			str += '<BR/>' + CORPUS.UIgetMiscLink(corpus.misc);
		}
		str += '<BR/>' + CORPUS.UIgetRefLink(ref,'more info');
		var obj = {};
		obj.corpus = corpus;
		obj.html   = str;
		obj.pos    = corpus.pos;
		return obj;
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
	CORPUS._regexParse =		/(.*?)?(?:STEM)(?:\|POS:([^\|\n]*))?(?:\|((?:ACT|PASS)\|PCPL))?(?:\|(IMPF|IMPV|PERF))?(?:\|(PASS))?(?:\|(VN))?(?:\|(\([IVX]*\)))?(?:\|LEM:([^\|\n]*))?(?:\|ROOT:([^\|\n]*))?(?:\|(.*?))?$/;	
	CORPUS.LEMMA = 8; CORPUS.ROOT = 9; CORPUS.FORM = 7; CORPUS.PERSONGS = 10; CORPUS.MISC = 0; CORPUS.POS = 2;
	CORPUS._rawdata = CORPUS._rawdataArr = '';

	CORPUS.parse = function(ref, index){ if(!CORPUS.isInitialized){ CORPUS.init(); } 
		var oParsed, corpus; 
		try{//			if(!parseInt(index) ){debugger; return;}
			oParsed = CORPUS.regexParse( CORPUS.lookupRef(ref, index) );
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





	var escape = function(input){ if(!input) return; return input.replace(/\</g, '&lt;').replace(/\>/g, '&gt;'); }
	var unescape = function(input){ if(!input) return; return input.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>'); }


	
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

 