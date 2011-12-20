//alert('OFFLINE DATA');

var WORDSMEANING = {
	isInitialized: false,
	
	init: function(){ 
		if(WORDSMEANING.isInitialized) return;
		try{
			WORDSMEANING._rawdata = document.getElementById('dataislandmeaning').innerHTML; 
		}catch(err){ console.log(err.message); console.log(err); }
		if(!WORDSMEANING._rawdata){ debugger; return; }
		WORDSMEANING._rawdataArr = WORDSMEANING._rawdata.split('\n');
		WORDSMEANING.isInitialized = true;
	},

	fetchLine: function(lineno, surah, ayah){
		try{
			if(parseInt(lineno) && WORDSMEANING._rawdataArr){
				var obj = {}, verseline;
				verseline = WORDSMEANING._rawdataArr[lineno];
				obj.surah = surah ? surah : Quran.ayah.fromVerse(verseNo).surah;
				obj.ayah  = ayah  ? ayah  : Quran.ayah.fromVerse(verrseNo).ayah;
				obj.verse = verseline;
				return obj;
			}
		}catch(err){ console.write(err.message); console.write(err);
		}
	},
	
	n: 0
}


	
var OFFLINEDATA = {
	isInitialized: false,
	
	init: function(){ 
		if(OFFLINEDATA.isInitialized) return;
		try{
			OFFLINEDATA._rawdata = document.getElementById('dataislandbuck').innerHTML; 
		}catch(err){ console.log(err.message); console.log(err); }
		if(!OFFLINEDATA._rawdata){ debugger; return; }
		OFFLINEDATA._rawdataArr = OFFLINEDATA._rawdata.split('\n');
		OFFLINEDATA.isInitialized = true;
	},
		
	preload: function(quranBy, fromVerseNo, toVerseNo, self_data){
		var result = false, obj, self_data2, bUthmani=false;
		bUthmani = (quranBy == 'quran-uthmani');
		if(!OFFLINEDATA.isInitialized){ OFFLINEDATA.init(); }
		if(!self_data || !self_data.quran){ debugger; }
		if (self_data.quran[quranBy]){	
			if (!self_data.quran[quranBy][fromVerseNo]){
				self_data2 = $.extend(true, self_data, obj = OFFLINEDATA.fetch(quranBy, fromVerseNo, toVerseNo, self_data) ); result=true; //notCached.push(quranBy);
			}
		}
		else{
			self_data2 = $.extend(true, self_data, OFFLINEDATA.fetch(quranBy, fromVerseNo, toVerseNo, self_data) ); result=true; //notCached.push(quranBy);	
		}
		//console.log(quranBy + '\t'+ fromVerseNo +'-'+ toVerseNo + self_data); console.log(obj); console.log(self_data2);  
		if(!result) return;
		return self_data2; //$.extend(true, self.data, response);
	},
	
	fetch: function(quranBy, fromVerseNo, toVerseNo, self_data){
		var q = {}, verseline='', bUthmani = (quranBy == 'quran-uthmani'), bEnSahih = (quranBy == 'en.sahih'), bWordMeaning = (quranBy == 'bs.mlivo');
		q.quran = {};
		q.quran[ quranBy ] = {};
		//q = OFFLINEDATA.fetchStubbedForTesting(quranBy, fromVerseNo, toVerseNo, self_data);
		if((bUthmani || bEnSahih || bWordMeaning) && OFFLINEDATA._rawdataArr){
			for(var m=fromVerseNo; m<toVerseNo; ++m){
				if(bUthmani || bEnSahih)
					verseline = (bUthmani ? EnToAr( OFFLINEDATA._rawdataArr[ m ] )+' *' : escape( OFFLINEDATA._rawdataArr[m] ) ); 
				q.quran[ quranBy ][m] = {};
				q.quran[ quranBy ][m].surah = Quran.ayah.fromVerse(m).surah;
				q.quran[ quranBy ][m].ayah  = Quran.ayah.fromVerse(m).ayah;
				q.quran[ quranBy ][m].verse = verseline;
			}
		}
		return q;
	},

	fetchStubbedForTesting: function(quranBy, fromVerseNo, toVerseNo, self_data){
		var q = {};
		q.quran = {};
		//q = {"quran":{"en.sahih":{"91":{"surah":2,"ayah":84,"verse":"And [recall] when We took your covenant, [saying], \"Do not shed each other's blood or evict one another from your homes.\" Then you acknowledged [this] while you were witnessing."},"92":{"surah":2,"ayah":85,"verse":"Then, you are those [same ones who are] killing one another and evicting a party of your people from their homes, cooperating against them in sin and aggression. And if they come to you as captives, you ransom them, although their eviction was forbidden to you. So do you believe in part of the Scripture and disbelieve in part? Then what is the recompense for those who do that among you except disgrace in worldly life; and on the Day of Resurrection they will be sent back to the severest of punishment. And Allah is not unaware of what you do."},"93":{"surah":2,"ayah":86,"verse":"Those are the ones who have bought the life of this world [in exchange] for the Hereafter, so the punishment will not be lightened for them, nor will they be aided."},"94":{"surah":2,"ayah":87,"verse":"And We did certainly give Moses the Torah and followed up after him with messengers. And We gave Jesus, the son of Mary, clear proofs and supported him with the Pure Spirit. But is it [not] that every time a messenger came to you, [O Children of Israel], with what your souls did not desire, you were arrogant? And a party [of messengers] you denied and another party you killed."},"95":{"surah":2,"ayah":88,"verse":"And they said, \"Our hearts are wrapped.\" But, [in fact], Allah has cursed them for their disbelief, so little is it that they believe."}}}};
		if(!q.quran[quranBy]) q.quran[quranBy] = {};
		for(var k=fromVerseNo; k<toVerseNo; ++k)
			q.quran[quranBy][k] = {};
		$.each(q.quran[quranBy], function(key, value){
			console.log( q.quran[quranBy][key]["verse"] );
			q.quran[quranBy][key]["verse"] = "THIS IS FROM PRELOADED OFFLINE DATA. ENJOY!";
			if(!q.quran[quranBy][key]["surah"]) q.quran[quranBy][key]["surah"] = 2;
			if(!q.quran[quranBy][key]["ayah"]) q.quran[quranBy][key]["ayah"] = key;
		});
		return q;
	},
	
	x: 0 //just dummy to put at end
};

//OFFLINEDATA.preload(quranBy, fromVerseNo, toVerseNo, self.data.quran);

















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
