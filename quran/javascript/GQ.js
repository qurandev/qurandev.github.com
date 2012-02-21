/**
 * Global Quran object to navigate through quran.
 * @author Basit (i@basit.me || http://Basit.me)
 *
 * Online Quran Project
 * http://GlobalQuran.com/
 *
 * Copyright 2011, imegah.com
 * Simple Public License (Simple-2.0)
 * http://www.opensource.org/licenses/Simple-2.0
 * 
 */
var gq = {
	
	apiURL: 'http://api.globalquran.com/',
	noData: false, // switch to true, if you want to have audio only.
	
	googleAnalyticsID: '',
	
	/**
	 * object contains selected page info
	 */
	settings: {
		ayah: 1,
		surah: 1,
		page: 0,
		juz: 0,
		selectedBy: null,
		selectedLanguage: null,
		selectedSearchBy: null,		
		
		selectedRecitor: null,
		selectedLastRecitorBytes: '',
		playing: true,
		volume: 100,
		muted: false,
		repeat: false,
		repeatEach: 'ayah',
		repeatTimes: 0,
		audioDelay: 0,
		
		showAlef: true,
		showSigns: true,
		ignoreInternalSigns: false,
		
		wbwDirection: 'arabic2english', // if change, then it will be english2arabic
		wbwMouseOver: false,
		
		font: 'auto',
		fontSize: 'medium',
		
		fullScreen: false,
		view: ''
	},
	
	_gaID: 'UA-1019966-3',
	
	
	/**
	 * caching all the data here
	 */
	data: {
		loaded: false,
		ayahList: {},
		quranList: {},
		quran: {},		
		languageCountryList: {},
		languageList: {},		
		search: {}
	},
	
	/**
	 * initial load 
	 */
	init: function () {
		Quran.init();
		
		for (var i in Quran._data.UGroups)
	        Quran._data.UGroups[i] = this.quran.parse.regTrans(Quran._data.UGroups[i]);
		
		this.googleAnalytics();
	},
	
	/**
	 * language object holds all the site languages
	 * TODO still need to add more functoins here
	 */
	language: {
		
		load: function () {},
		
		list: function ()
		{
			return gq.data.languageList;
		},
		
		countryList: function ()
		{
			return gq.data.languageCountryList;
		},
		
		selected: function ()
		{
			return gq.settings.selectedLanguage;
		}
	},
	
	/**
	 * quran object
	 */
	quran: {
		
		init: function ()
		{
			if (gq.settings.selectedBy && typeof(gq.settings.selectedBy) == 'object' && this.length() > 0)
				return false;
			
			//backward compatibility
			if (gq.settings.selectedBy && typeof(gq.settings.selectedBy) != 'object')
			{
				by = gq.settings.selectedBy;
				gq.quran.reset();
				var selectedArray = by.split('|');
				$.each(selectedArray, function(a, quranBy) {
					gq.quran.add(quranBy);					
				});
			}
			else
				gq.quran.reset();
		},
		
		load: function () {
			gq.load(gq.settings.surah, gq.settings.ayah);
		},
		
		text: function ()
		{
			var text = {};
			var selected = this.selected();
			var fromVerseNo = Quran.verseNo.page(gq.settings.page);
			var toVerseNo = Quran.verseNo.page(gq.settings.page+1)-1;

			if (typeof selected == 'object')
			{					
				$.each(selected, function(a, quranBy) {
					text[quranBy] = {};
					for (var i = fromVerseNo; i <= toVerseNo; i++)
					{
						if (gq.data.quran[quranBy])
							text[quranBy][i] = gq.data.quran[quranBy][i];
						else
						{
							gq.quran.remove(quranBy);
							gq._gaqPush(['_trackEvent', 'Text', 'Error::`'+quranBy+'` not loaded in text']);
						}
					}
				});
			}
			
			return text;
		},
		
		textNotCached: function ()
		{
			var notCached = [];
			var selected = this.selected();
			var fromVerseNo = Quran.verseNo.page(gq.settings.page);
					
			$.each(selected, function(i, quranBy) {

				if (gq.data.quran[quranBy])
				{	
					if (!gq.data.quran[quranBy][fromVerseNo])
						notCached.push(quranBy);		
				}
				else
					notCached.push(quranBy);	
			});
			
			return notCached.join('|');
		},
		
		list: function (format)
		{
			if (!format)
				return gq.data.quranList;
			else
			{
				list = {};
				$.each(gq.data.quranList, function(i, info) {
					if (format == info['format'])
						list[i] = info;
				});
				
				return list;
			}
		},
		
		detail: function (by)
		{
			return this.list()[by];
		},
		
		direction: function (by)
		{
			if (by == 'quran-wordbyword')
				return (gq.settings.wbwDirection == 'arabic2english') ? 'right' : 'left';
			else if (by == 'quran-kids')
				return (gq.settings.wbwDirection == 'arabic2english') ? 'right' : 'left';
			
			languageCode = this.detail(by).language_code;
			return  (typeof(gq.language.list()[languageCode]) !== 'undefined') ? gq.language.list()[languageCode].dir : 'left';
		},
		
		selected: function ()
		{
			return gq.settings.selectedBy;
		},
		
		selectedString: function ()
		{
			var by = [];
			var selected = this.selected();
					
			$.each(selected, function(i, quranBy) {
				by.push(quranBy);	
			});
			
			return by.join('|');
		},
		
		reset: function ()
		{
			gq.settings.selectedBy = {};
			gq.save();
		},
		
		length: function ()
		{
			if (!gq.settings.selectedBy || typeof(gq.settings.selectedBy) != 'object')
				return 0;
			
			return Object.keys(gq.settings.selectedBy).length;
		},
		
		isSelected: function (quranBy)
		{
			return gq.settings.selectedBy[quranBy] ? true : false;
		},
		
		add: function (quranBy)
		{
			gq.settings.selectedBy[quranBy] = quranBy;
			gq.save();
		},
		
		remove: function (quranBy)
		{
			delete gq.settings.selectedBy[quranBy];
			gq.save();
		},
		
		parse: {
			
			load: function (quranBy, text, value)
			{	
				type = gq.data.quranList[quranBy].type;
				
				if (type == 'quran' && /tajweed/.test(quranBy))
					return this.parseTajweed(quranBy, text);
				else if (type == 'quran' && /wordbyword/.test(quranBy))
					return this.parseWordByWord(quranBy, text, value);
				else if (type == 'quran' && /kids/.test(quranBy))
					return this.parseKidsWordByWord(quranBy, text, value);
				else if (type == 'quran' && /corpus/.test(quranBy))
					return this.parseCorpus(quranBy, text, value);
				else if (type == 'quran')
					return this.parseQuran(quranBy, text);
				else
					return this.parseTranslation(quranBy, text);
			},
			
			parseQuran: function (quranBy, text)
			{
				if (gq.settings.showSigns)
			    {
			        text = this.pregReplace(' ([$HIGH_SALA-$HIGH_SEEN])', '<span class="sign">&nbsp;$1</span>', text);
			        text = this.pregReplace('($SAJDAH)', gq.settings.ignoreInternalSigns ? '' : '<span class="internal-sign">$1</span>', text);
			        text = this.pregReplace('$RUB_EL_HIZB', gq.settings.ignoreInternalSigns ? '' : '<span class="icon juz-sign"></span>', text);
			    }
			    else
			    	text = this.pregReplace('[$HIGH_SALA-$RUB_EL_HIZB$SAJDAH]', '', text);
			    
			    if (!gq.settings.showAlef)
			    	text = this.pregReplace('$SUPERSCRIPT_ALEF', '', text);
			    
			    if (gq.settings.font == 'me_quran')
			    {
			        text = this.addSpaceTatweel(text);
			        text = this.pregReplace('($LAM$HARAKA*)$TATWEEL$HAMZA_ABOVE($HARAKA*$ALEF)', '$1$HAMZA$2', text);
			    }
			    else if (/uthmani/.test(quranBy))
			    {
			        text = this.removeExtraMeems(text);
			    }
			    
			    text = this.addTatweel(text);
			    text = this.pregReplace('$ALEF$MADDA', '$ALEF_WITH_MADDA_ABOVE', text);
			    
			    if (gq.settings.font != 'me_quran')
			    {
			        text = this.pregReplace('($SHADDA)([$KASRA$KASRATAN])', '$2$1', text);
			        text = this.pregReplace('($LAM$HARAKA*$LAM$HARAKA*)($HEH)', '$1$TATWEEL$2', text);
			    }
			    
			    return text;
			},
			
			parseWordByWord: function (quranBy, text, value)
			{
				var words = text.split('$');
				var verse_html = '';
				$.each(words, function(i, verse) {
					if (verse)
					{
						var verse = verse.split('|');
					    var ref, refHtml=''; if(value && value.surah && value.ayah) ref = (value?value.surah:'?') +':'+ (value?value.ayah:'?') + ':'+ (1+i);
						var urlTemplate = '<A HREF=\'http://corpus.quran.com/wordmorphology.jsp?location=($1)\' target=_>$1</A>'; 
						if(ref) refHtml = ' title="<span color=green class=corpusref>' + urlTemplate.replace(/\$1/g, ref) + '</span>" ';
						
						if (gq.settings.wbwDirection == 'english2arabic')
						{
							if (gq.settings.wbwMouseOver)
								verse_html += '<span class="word"><span class="en tipsWord" title="'+verse[0]+'">'+verse[1]+'</span></span>';
							else
								verse_html += '<span class="word staticWord"><span class="en first ltr" dir="ltr">'+verse[1]+'</span><span class="ar quranText second rtl" dir="rtl">'+verse[0]+'</span></span>';
						}
						else
						{
							if (gq.settings.wbwMouseOver)
								verse_html += '<span class="word"><span class="ar quranText tipsWord" title="'+verse[1]+'">'+verse[0]+'</span></span>';
							else
								verse_html   += '<span class="word staticWord"><span class="ar quranText top first rtl tipsWord tipsGrmr" dir="rtl" ' + refHtml + '>'+ verse[0]+'</span><span class="en second ltr" dir="ltr">'+verse[1]+'</span></span>';
								//verse_html += '<span class="word staticWord"><span class="ar quranText top first rtl" dir="rtl">'+verse[0]+'</span><span class="en second ltr" dir="ltr">'+verse[1]+'</span></span>'; 
						}
					}
				});
				
				return verse_html;
			},

			strings: [ "-1",

"bisomi⚓In (the) name⚓N|LEM:{som|ROOT:smw|M|GEN★{ll~ahi⚓(of) Allah,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★{lr~aHoma`ni⚓the Most Gracious,⚓ ADJ|LEM:r~aHoma`n|ROOT:rHm|MS|GEN★{lr~aHiymi⚓the Most Merciful.⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|GEN★",
"{loHamodu⚓All praises and thanks⚓N|LEM:Hamod|ROOT:Hmd|M|NOM★lil~ahi⚓(be) to Allah,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★rab~i⚓(the) Lord⚓ N|LEM:rab~|ROOT:rbb|M|GEN★{loEa`lamiyna⚓(of all) the worlds.⚓ N|LEM:Ea`lamiyn|ROOT:Elm|MP|GEN★",
"{lr~aHoma`ni⚓The Most Gracious,⚓ADJ|LEM:r~aHoma`n|ROOT:rHm|MS|GEN★{lr~aHiymi⚓the Most Merciful.⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|GEN★",
"ma`liki⚓Master⚓N|ACT|PCPL|LEM:ma`lik|ROOT:mlk|M|GEN★yawomi⚓(of the) Day⚓ N|LEM:yawom|ROOT:ywm|M|GEN★{ld~iyni⚓(of) [the] Judgment.⚓ N|LEM:diyn|ROOT:dyn|M|GEN★",
"<iy~aAka⚓You Alone⚓PRON|LEM:<iy~aA|2MS★naEobudu⚓we worship,⚓ V|IMPF|LEM:Eabada|ROOT:Ebd|1P★wa<iy~aAka⚓and You Alone⚓ PRON|LEM:<iy~aA|2MS★nasotaEiynu⚓we ask for help.⚓ V|IMPF|(X)|LEM:{sotaEiynu|ROOT:Ewn|1P★",
"{hodinaA⚓Guide us⚓V|IMPV|LEM:hadaY|ROOT:hdy|2MS★{lS~ira`Ta⚓(to) the path,⚓ N|LEM:Sira`T|ROOT:SrT|M|ACC★{lomusotaqiyma⚓the straight.⚓ ADJ|ACT|PCPL|(X)|LEM:m~usotaqiym|ROOT:qwm|M|ACC★",
"Sira`Ta⚓(The) path⚓N|LEM:Sira`T|ROOT:SrT|M|ACC★{l~a*iyna⚓(of) those⚓ REL|LEM:{l~a*iY|MP★>anoEamota⚓You have bestowed (Your) Favors⚓ V|PERF|(IV)|LEM:>anoEama|ROOT:nEm|2MS★Ealayohimo⚓on them,⚓ P|LEM:EalaY`★gayori⚓not (of)⚓ N|LEM:gayor|ROOT:gyr|M|GEN★{lomagoDuwbi⚓those who earned (Your) wrath⚓ N|PASS|PCPL|LEM:magoDuwb|ROOT:gDb|M|GEN★Ealayohimo⚓on themselves,⚓ P|LEM:EalaY`★walaA⚓and not⚓ NEG|LEM:laA★{lD~aA^l~iyna⚓(of) those who go astray.⚓ N|ACT|PCPL|LEM:DaA^l~|ROOT:Dll|MP|GEN★",
"",

"halo⚓Has⚓INTG|LEM:hal★>ataY`ka⚓(there) come to you⚓ V|PERF|LEM:>ataY|ROOT:Aty|3MS★Hadiyvu⚓(the) news⚓ N|LEM:Hadiyv|ROOT:Hdv|M|NOM★{loga`$iyapi⚓(of) the Overwhelming?⚓ N|ACT|PCPL|LEM:ga`$iyap|ROOT:g$w|FS|GEN★",
"wujuwhN⚓Faces⚓N|LEM:wajoh|ROOT:wjh|MP|INDEF|NOM★yawoma}i*K⚓that Day⚓ T|LEM:yawoma}i*★xa`$iEapN⚓(will be) humbled,⚓ N|ACT|PCPL|LEM:xaA$iE|ROOT:x$E|FS|INDEF|NOM★",
"EaAmilapN⚓Laboring,⚓ADJ|ACT|PCPL|LEM:EaAmilap|ROOT:Eml|F|INDEF|NOM★n~aASibapN⚓exhausted.⚓ ADJ|ACT|PCPL|LEM:n~aASibap|ROOT:nSb|F|INDEF|NOM★",
"taSolaY`⚓They will burn⚓V|IMPF|LEM:yaSolaY|ROOT:Sly|3FS★naArFA⚓(in) a Fire⚓ N|LEM:naAr|ROOT:nwr|F|INDEF|ACC★HaAmiyapF⚓intensely hot.⚓ ADJ|ACT|PCPL|LEM:HaAmiyap|ROOT:Hmy|F|INDEF|ACC★",
"tusoqaY`⚓They will be given to drink⚓V|IMPF|PASS|LEM:saqaY`|ROOT:sqy|3FS★mino⚓from⚓ P|LEM:min★EayonK⚓a spring,⚓ N|LEM:Eayon|ROOT:Eyn|F|INDEF|GEN★'aAniyapK⚓boiling.⚓ ADJ|ACT|PCPL|LEM:'aAniyap|ROOT:Any|F|INDEF|GEN★",
"l~ayosa⚓Is not⚓V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|3MS★lahumo⚓for them⚓ PRON|3MP★TaEaAmN⚓food⚓ N|LEM:TaEaAm|ROOT:TEm|M|INDEF|NOM★<il~aA⚓except⚓ EXP|LEM:<il~aA★min⚓from⚓ P|LEM:min★DariyEK⚓a bitter thorny plant,⚓ N|LEM:DariyE|ROOT:DrE|M|INDEF|GEN★",
"l~aA⚓Not⚓NEG|LEM:laA★yusominu⚓it nourishes⚓ V|IMPF|(IV)|LEM:yusominu|ROOT:smn|3MS★walaA⚓and not⚓ NEG|LEM:laA★yugoniY⚓it avails⚓ V|IMPF|(IV)|LEM:>agonato|ROOT:gny|3MS★min⚓against⚓ P|LEM:min★juwEK⚓hunger.⚓ N|LEM:juwE|ROOT:jwE|M|INDEF|GEN★",
"wujuwhN⚓Faces⚓N|LEM:wajoh|ROOT:wjh|MP|INDEF|NOM★yawoma}i*K⚓that Day⚓ T|LEM:yawoma}i*★n~aAEimapN⚓(will be) joyful.⚓ N|ACT|PCPL|LEM:n~aAEimap|ROOT:nEm|F|INDEF|NOM★",
"l~isaEoyihaA⚓With their effort⚓N|LEM:saEoy|ROOT:sEy|M|GEN★raADiyapN⚓satisfied,⚓ N|ACT|PCPL|LEM:raADiyap|ROOT:rDw|F|INDEF|NOM★",
"fiY⚓In⚓P|LEM:fiY★jan~apK⚓a garden⚓ N|LEM:jan~ap|ROOT:jnn|F|INDEF|GEN★EaAliyapK⚓elevated.⚓ ADJ|ACT|PCPL|LEM:EaAliyap|ROOT:Elw|F|INDEF|GEN★",
"l~aA⚓Not⚓NEG|LEM:laA★tasomaEu⚓they will hear⚓ V|IMPF|LEM:samiEa|ROOT:smE|2MS★fiyhaA⚓therein⚓ P|LEM:fiY★la`giyapF⚓vain talk.⚓ N|ACT|PCPL|LEM:la`giyap|ROOT:lgw|F|INDEF|ACC★",
"fiyhaA⚓Therein⚓P|LEM:fiY★EayonN⚓(will be) a spring⚓ N|LEM:Eayon|ROOT:Eyn|F|INDEF|NOM★jaAriyapN⚓flowing,⚓ ADJ|ACT|PCPL|LEM:jaAriyap|ROOT:jry|F|INDEF|NOM★",
"fiyhaA⚓Therein⚓P|LEM:fiY★sururN⚓(will be) thrones⚓ N|LEM:surur|ROOT:srr|MP|INDEF|NOM★m~arofuwEapN⚓raised high,⚓ ADJ|PASS|PCPL|LEM:m~arofuwEap|ROOT:rfE|F|INDEF|NOM★",
"wa>akowaAbN⚓And cups⚓N|LEM:>akowaAb|ROOT:kwb|MP|INDEF|NOM★m~awoDuwEapN⚓put in place,⚓ ADJ|PASS|PCPL|LEM:m~awoDuwEap|ROOT:wDE|F|INDEF|NOM★",
"wanamaAriqu⚓And cushions⚓N|LEM:namaAriq|MP|INDEF|NOM★maSofuwfapN⚓lined up,⚓ ADJ|PASS|PCPL|LEM:maSofuwfap|ROOT:Sff|F|INDEF|NOM★",
"wazaraAbiY~u⚓And carpets⚓N|LEM:zaraAbiY~|MP|INDEF|NOM★mabovuwvapN⚓spread out.⚓ ADJ|PASS|PCPL|LEM:mabovuwvap|ROOT:bvv|F|INDEF|NOM★",
">afalaA⚓Then do not⚓NEG|LEM:laA★yanZuruwna⚓they look⚓ V|IMPF|LEM:n~aZara|ROOT:nZr|3MP★<ilaY⚓at⚓ P|LEM:<ilaY`★{lo<ibili⚓the camels,⚓ N|LEM:<ibil|ROOT:Abl|M|GEN★kayofa⚓how⚓ INTG|LEM:kayof|ROOT:kyf★xuliqato⚓they are created?⚓ V|PERF|PASS|LEM:xalaqa|ROOT:xlq|3FS★",
"wa<ilaY⚓And at⚓P|LEM:<ilaY`★{ls~amaA^'i⚓the sky,⚓ N|LEM:samaA^'|ROOT:smw|F|GEN★kayofa⚓how⚓ INTG|LEM:kayof|ROOT:kyf★rufiEato⚓it is raised?⚓ V|PERF|PASS|LEM:rafaEa|ROOT:rfE|3FS★",
"wa<ilaY⚓And at⚓P|LEM:<ilaY`★{lojibaAli⚓the mountains,⚓ N|LEM:jabal|ROOT:jbl|MP|GEN★kayofa⚓how⚓ INTG|LEM:kayof|ROOT:kyf★nuSibato⚓they are fixed?⚓ V|PERF|PASS|LEM:nuSibato|ROOT:nSb|3FS★",
"wa<ilaY⚓And at⚓P|LEM:<ilaY`★{lo>aroDi⚓the earth,⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★kayofa⚓how⚓ INTG|LEM:kayof|ROOT:kyf★suTiHato⚓it is spread out?⚓ V|PERF|PASS|LEM:suTiHato|ROOT:sTH|3FS★",
"fa*ak~iro⚓So remind,⚓V|IMPV|(II)|LEM:*uk~ira|ROOT:*kr|2MS★<in~amaA^⚓only⚓ ACC|LEM:<in~|SP:<in~★>anta⚓you⚓ PREV|LEM:maA★mu*ak~irN⚓(are) a reminder.⚓ PRON|2MS★",
"l~asota⚓You are not⚓N|ACT|PCPL|(II)|LEM:mu*ak~ir|ROOT:*kr|M|INDEF|NOM★Ealayohim⚓over them⚓ V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|2MS★bimuSayoTirK⚓a controller,⚓ P|LEM:EalaY`★",
"<il~aA⚓But⚓N|ACT|PCPL|(II)|LEM:muSayoTir|ROOT:sTr|M|INDEF|GEN★man⚓whoever⚓ EXP|LEM:<il~aA★tawal~aY`⚓turns away⚓ REL|LEM:man★wakafara⚓and disbelieves,⚓ V|PERF|(V)|LEM:tawal~aY`|ROOT:wly|3MS★",
"fayuEa*~ibuhu⚓**Then Allah will punish him⚓V|PERF|LEM:kafara|ROOT:kfr|3MS★{ll~ahu⚓**Then Allah will punish him⚓ V|IMPF|(II)|LEM:Ea*~aba|ROOT:E*b|3MS★{loEa*aAba⚓(with) the punishment⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{lo>akobara⚓greatest.⚓ N|LEM:Ea*aAb|ROOT:E*b|M|ACC★",
"<in~a⚓Indeed,⚓ADJ|LEM:>akobar|ROOT:kbr|MS|ACC★<ilayonaA^⚓to Us⚓ ACC|LEM:<in~|SP:<in~★<iyaAbahumo⚓(will be) their return,⚓ P|LEM:<ilaY`★",
"vum~a⚓Then⚓N|LEM:<iyaAb|ROOT:Awb|M|ACC★<in~a⚓indeed,⚓ CONJ|LEM:vum~★EalayonaA⚓upon Us⚓ ACC|LEM:<in~|SP:<in~★HisaAbahum⚓(is) their account.⚓ P|LEM:EalaY`★",
"",


"wa{lofajori⚓By the dawn,⚓N|LEM:fajor|ROOT:fjr|M|GEN★",
"walayaAlK⚓And the nights⚓N|LEM:layol|ROOT:lyl|MP|INDEF|GEN★Ea$orK⚓ten.⚓ ADJ|LEM:Ea$or|ROOT:E$r|MP|INDEF|GEN★",
"wa{l$~afoEi⚓And the even⚓N|LEM:$~afoE|ROOT:$fE|M|GEN★wa{lowatori⚓and the odd,⚓ N|LEM:wator|ROOT:wtr|M|GEN★",
"wa{l~ayoli⚓And the night⚓N|LEM:layol|ROOT:lyl|M|GEN★<i*aA⚓when⚓ T|LEM:<i*aA★yasori⚓it passes.⚓ V|IMPF|LEM:yasori|ROOT:sry|3MS★",
"halo⚓Is⚓INTG|LEM:hal★fiY⚓in⚓ P|LEM:fiY★*a`lika⚓that⚓ DEM|LEM:*a`lik|MS★qasamN⚓an oath⚓ N|LEM:qasam|ROOT:qsm|M|INDEF|NOM★l~i*iY⚓**for those who understand?⚓ N|LEM:*uw|MS|GEN★HijorK⚓**for those who understand?⚓ N|LEM:Hijor|ROOT:Hjr|M|INDEF|GEN★",
">alamo⚓Do not⚓NEG|LEM:lam★tara⚓you see⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|2MS|MOOD:JUS★kayofa⚓how⚓ INTG|LEM:kayof|ROOT:kyf★faEala⚓dealt⚓ V|PERF|LEM:faEala|ROOT:fEl|3MS★rab~uka⚓your Lord⚓ N|LEM:rab~|ROOT:rbb|M|NOM★biEaAdK⚓with Aad,⚓ PN|LEM:EaAd2|ROOT:Ewd|GEN★",
"<irama⚓Iram⚓PN|LEM:<iram|F|GEN★*aAti⚓**possessors (of) lofty pillars,⚓ N|LEM:*uw|FS|GEN★{loEimaAdi⚓**possessors (of) lofty pillars,⚓ N|LEM:EimaAd|ROOT:Emd|M|GEN★",
"{l~atiY⚓Which⚓REL|LEM:{l~a*iY|FS★lamo⚓not⚓ NEG|LEM:lam★yuxolaqo⚓had been created⚓ V|IMPF|PASS|LEM:xalaqa|ROOT:xlq|3MS|MOOD:JUS★mivoluhaA⚓like them⚓ N|LEM:mivol|ROOT:mvl|M|NOM★fiY⚓in⚓ P|LEM:fiY★{lobila`di⚓the cities,⚓ N|LEM:balad|ROOT:bld|MP|GEN★",
"wavamuwda⚓And Thamud,⚓PN|LEM:vamuwd|GEN★{l~a*iyna⚓who⚓ REL|LEM:{l~a*iY|MP★jaAbuwA@⚓carved out⚓ V|PERF|LEM:jaAbu|ROOT:jwb|3MP★{lS~axora⚓the rocks⚓ N|LEM:S~axor|ROOT:Sxr|M|ACC★bi{lowaAdi⚓in the valley,⚓ N|LEM:waAd|ROOT:wdy|M|GEN★",
"wafiroEawona⚓And Firaun,⚓PN|LEM:firoEawon|M|GEN★*iY⚓**owner of stakes?⚓ N|LEM:*uw|MS|GEN★{lo>awotaAdi⚓**owner of stakes?⚓ N|LEM:>awotaAd|ROOT:wtd|MP|GEN★",
"{l~a*iyna⚓Who⚓REL|LEM:{l~a*iY|MP★TagawoA@⚓transgressed⚓ V|PERF|LEM:TagaY`|ROOT:Tgy|3MP★fiY⚓in⚓ P|LEM:fiY★{lobila`di⚓the lands,⚓ N|LEM:balad|ROOT:bld|MP|GEN★",
"fa>akovaruwA@⚓And made much⚓V|PERF|(IV)|LEM:>akovaru|ROOT:kvr|3MP★fiyhaA⚓therein⚓ P|LEM:fiY★{lofasaAda⚓corruption.⚓ N|LEM:fasaAd|ROOT:fsd|M|ACC★",
"faSab~a⚓So poured⚓V|PERF|LEM:Sab~a|ROOT:Sbb|3MS★Ealayohimo⚓on them⚓ P|LEM:EalaY`★rab~uka⚓your Lord⚓ N|LEM:rab~|ROOT:rbb|M|NOM★sawoTa⚓scourge⚓ N|LEM:sawoT|ROOT:swT|M|ACC★Ea*aAbK⚓(of) punishment.⚓ N|LEM:Ea*aAb|ROOT:E*b|M|INDEF|GEN★",
"<in~a⚓Indeed,⚓ACC|LEM:<in~|SP:<in~★rab~aka⚓your Lord⚓ N|LEM:rab~|ROOT:rbb|M|ACC★labi{lomiroSaAdi⚓(is) surely Ever Watchful.⚓ N|LEM:miroSaAd|ROOT:rSd|M|GEN★",
"fa>am~aA⚓And as for⚓EXL|LEM:>am~aA★{lo<insa`nu⚓man,⚓ N|LEM:<insa`n|ROOT:Ans|M|NOM★<i*aA⚓**when⚓ T|LEM:<i*aA★maA⚓**when⚓ SUP|LEM:maA★{botalaY`hu⚓tries him⚓ V|PERF|(VIII)|LEM:{botalaY`^|ROOT:blw|3MS★rab~uhu,⚓his Lord⚓ N|LEM:rab~|ROOT:rbb|M|NOM★fa>akoramahu,⚓and is generous to him⚓ V|PERF|(IV)|LEM:>akorama|ROOT:krm|3MS★wanaE~amahu,⚓and favors him,⚓ V|PERF|(II)|LEM:naE~ama|ROOT:nEm|3MS★fayaquwlu⚓he says,⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MS★rab~iY^⚓`My Lord⚓ N|LEM:rab~|ROOT:rbb|M|NOM★>akoramani⚓has honored me.`⚓ V|PERF|(IV)|LEM:>akorama|ROOT:krm|3MS★",
"wa>am~aA^⚓But⚓EXL|LEM:>am~aA★<i*aA⚓**when⚓ T|LEM:<i*aA★maA⚓**when⚓ SUP|LEM:maA★{botalaY`hu⚓He tries him⚓ V|PERF|(VIII)|LEM:{botalaY`^|ROOT:blw|3MS★faqadara⚓and restricts⚓ V|PERF|LEM:qadara|ROOT:qdr|3MS★Ealayohi⚓for him⚓ P|LEM:EalaY`★rizoqahu,⚓his provision,⚓ N|LEM:rizoq|ROOT:rzq|M|ACC★fayaquwlu⚓then he says⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MS★rab~iY^⚓`My Lord⚓ N|LEM:rab~|ROOT:rbb|M|NOM★>aha`nani⚓(has) humiliated me.`⚓ V|PERF|(IV)|LEM:>aha`na|ROOT:hwn|3MS★",
"kal~aA⚓Nay!⚓AVR|LEM:kal~aA★bal⚓But⚓ RET|LEM:bal★l~aA⚓not⚓ NEG|LEM:laA★tukorimuwna⚓you honor⚓ V|IMPF|(IV)|LEM:>akorama|ROOT:krm|2MP★{loyatiyma⚓the orphan,⚓ N|LEM:yatiym|ROOT:ytm|MS|ACC★",
"walaA⚓And not⚓NEG|LEM:laA★taHa`^D~uwna⚓you feel the urge⚓ V|IMPF|(VI)|LEM:taHa`^D~u|ROOT:HDD|2MP★EalaY`⚓to⚓ P|LEM:EalaY`★TaEaAmi⚓feed⚓ N|LEM:TaEaAm|ROOT:TEm|M|GEN★{lomisokiyni⚓the poor.⚓ N|LEM:misokiyn|ROOT:skn|MS|GEN★",
"wata>okuluwna⚓And you consume⚓V|IMPF|LEM:>akala|ROOT:Akl|2MP★{lt~uraAva⚓the inheritance⚓ N|LEM:t~uraAv|ROOT:wrv|M|ACC★>akolFA⚓**devouring altogether,⚓ N|VN|LEM:>akol|ROOT:Akl|M|INDEF|ACC★l~am~FA⚓**devouring altogether,⚓ ADJ|VN|LEM:l~am~|ROOT:lmm|M|INDEF|ACC★",
"watuHib~uwna⚓And you love⚓V|IMPF|(IV)|LEM:>aHobabo|ROOT:Hbb|2MP★{lomaAla⚓wealth⚓ N|LEM:maAl|ROOT:mwl|M|ACC★Hub~FA⚓(with) love⚓ N|LEM:Hub~|ROOT:Hbb|M|INDEF|ACC★jam~FA⚓exceeding.⚓ ADJ|LEM:jam~|ROOT:jmm|MS|INDEF|ACC★",
"kal~aA^⚓Nay!⚓AVR|LEM:kal~aA★<i*aA⚓When⚓ T|LEM:<i*aA★duk~ati⚓is leveled⚓ V|PERF|PASS|LEM:duk~ati|ROOT:dkk|3FS★{lo>aroDu⚓the earth,⚓ N|LEM:>aroD|ROOT:ArD|F|NOM★dak~FA⚓**pounded and crushed,⚓ N|VN|LEM:dak~|ROOT:dkk|M|INDEF|ACC★dak~FA⚓**pounded and crushed,⚓ N|VN|LEM:dak~|ROOT:dkk|M|INDEF|ACC★",
"wajaA^'a⚓And comes⚓V|PERF|LEM:jaA^'a|ROOT:jyA|3MS★rab~uka⚓your Lord⚓ N|LEM:rab~|ROOT:rbb|M|NOM★wa{lomalaku⚓and the Angels,⚓ N|LEM:malak|ROOT:mlk|M|NOM★Saf~FA⚓**rank upon rank,⚓ N|VN|LEM:Saf~|ROOT:Sff|M|INDEF|ACC★Saf~FA⚓**rank upon rank,⚓ N|VN|LEM:Saf~|ROOT:Sff|M|INDEF|ACC★",
"wajiA@Y^'a⚓And is brought,⚓V|PERF|PASS|LEM:jaA^'a|ROOT:jyA|3MS★yawoma}i*K]⚓that Day,⚓ T|LEM:yawoma}i*★bijahan~ama⚓Hell.⚓ PN|LEM:jahan~am|GEN★yawoma}i*K⚓That Day⚓ T|LEM:yawoma}i*★yata*ak~aru⚓will remember⚓ V|IMPF|(V)|LEM:ta*ak~ara|ROOT:*kr|3MS★{lo<insa`nu⚓man,⚓ N|LEM:<insa`n|ROOT:Ans|M|NOM★wa>an~aY`⚓but how⚓ INTG|LEM:>an~aY`|ROOT:Any★lahu⚓(will be) for him⚓ PRON|3MS★{l*~ikoraY`⚓the remembrance?⚓ N|LEM:*ikoraY`|ROOT:*kr|F|NOM★",
"yaquwlu⚓He will say,⚓V|IMPF|LEM:qaAla|ROOT:qwl|3MS★ya`layotaniY⚓`O! I wish⚓ ACC|LEM:layot|SP:<in~★qad~amotu⚓I had sent forth⚓ V|PERF|(II)|LEM:qad~ama|ROOT:qdm|1S★liHayaAtiY⚓for my life.`⚓ N|LEM:Hayaw`p|ROOT:Hyy|F|GEN★",
"fayawoma}i*K⚓So that Day⚓T|LEM:yawoma}i*★l~aA⚓not⚓ NEG|LEM:laA★yuEa*~ibu⚓will punish,⚓ V|IMPF|(II)|LEM:Ea*~aba|ROOT:E*b|3MS★Ea*aAbahu,^⚓(as) His punishment⚓ N|LEM:Ea*aAb|ROOT:E*b|M|ACC★>aHadN⚓anyone.⚓ N|LEM:>aHad|ROOT:AHd|M|INDEF|NOM★",
"walaA⚓And not⚓NEG|LEM:laA★yuwviqu⚓will bind⚓ V|IMPF|(IV)|LEM:yuwviqu|ROOT:wvq|3MS★wavaAqahu,^⚓(as) His binding⚓ N|LEM:wavaAq|ROOT:wvq|M|ACC★>aHadN⚓anyone.⚓ N|LEM:>aHad|ROOT:AHd|M|INDEF|NOM★",
"ya`^>ay~atuhaA⚓**`O soul!⚓N|LEM:>ay~atuhaA|NOM★{ln~afosu⚓**`O soul!⚓ N|LEM:nafos|ROOT:nfs|FS|NOM★{lomuToma}in~apu⚓who is satisfied,⚓ ADJ|ACT|PCPL|(XII)|LEM:m~uToma}in~ap|ROOT:Tmn|F|NOM★",
"{rojiEiY^⚓Return⚓V|IMPV|LEM:rajaEa|ROOT:rjE|2FS★<ilaY`⚓to⚓ P|LEM:<ilaY`★rab~iki⚓your Lord⚓ N|LEM:rab~|ROOT:rbb|M|GEN★raADiyapF⚓well pleased,⚓ N|ACT|PCPL|LEM:raADiyap|ROOT:rDw|F|INDEF|ACC★m~aroDiy~apF⚓and pleasing.⚓ N|PASS|PCPL|LEM:m~aroDiy~ap|ROOT:rDw|F|INDEF|ACC★",
"fa{doxuliY⚓So enter⚓V|IMPV|LEM:daxala|ROOT:dxl|2FS★fiY⚓among⚓ P|LEM:fiY★Eiba`diY⚓My slaves,⚓ N|LEM:Eabod|ROOT:Ebd|MP|GEN★",
"wa{doxuliY⚓And enter⚓V|IMPV|LEM:daxala|ROOT:dxl|2FS★jan~atiY⚓My Paradise.`⚓ N|LEM:jan~ap|ROOT:jnn|F|ACC★",
"",



"laA^⚓Nay!⚓NEG|LEM:laA★>uqosimu⚓I swear⚓ V|IMPF|(IV)|LEM:>aqosamu|ROOT:qsm|1S★biha`*aA⚓by this⚓ DEM|LEM:ha`*aA|MS★{lobaladi⚓city,⚓ N|LEM:balad|ROOT:bld|M|GEN★",
"wa>anta⚓And you⚓PRON|2MS★Hil~N[⚓(are) free (to dwell)⚓ N|LEM:Hil~|ROOT:Hll|M|INDEF|NOM★biha`*aA⚓in this⚓ DEM|LEM:ha`*aA|MS★{lobaladi⚓city.⚓ N|LEM:balad|ROOT:bld|M|GEN★",
"wawaAlidK⚓And the begetter⚓N|LEM:waAlid|ROOT:wld|INDEF|GEN★wamaA⚓and what⚓ REL|LEM:maA★walada⚓he begot.⚓ V|PERF|LEM:walada|ROOT:wld|3MS★",
"laqado⚓Certainly,⚓CERT|LEM:qad★xalaqonaA⚓We have created⚓ V|PERF|LEM:xalaqa|ROOT:xlq|1P★{lo<insa`na⚓man⚓ N|LEM:<insa`n|ROOT:Ans|M|ACC★fiY⚓(to be) in⚓ P|LEM:fiY★kabadK⚓hardship.⚓ N|LEM:kabad|ROOT:kbd|M|INDEF|GEN★",
">ayaHosabu⚓Does he think⚓V|IMPF|LEM:Hasiba|ROOT:Hsb|3MS★>an⚓that⚓ SUB|LEM:>an★l~an⚓not⚓ NEG|LEM:lan★yaqodira⚓has power⚓ V|IMPF|LEM:qadara|ROOT:qdr|3MS|MOOD:SUBJ★Ealayohi⚓over him⚓ P|LEM:EalaY`★>aHadN⚓anyone?⚓ N|LEM:>aHad|ROOT:AHd|M|INDEF|NOM★",
"yaquwlu⚓He will say,⚓V|IMPF|LEM:qaAla|ROOT:qwl|3MS★>aholakotu⚓`I have squandered⚓ V|PERF|(IV)|LEM:>aholaka|ROOT:hlk|1S★maAlFA⚓wealth⚓ N|LEM:maAl|ROOT:mwl|M|INDEF|ACC★l~ubadFA⚓abundant.`⚓ ADJ|LEM:l~ubad|ROOT:lbd|MS|INDEF|ACC★",
">ayaHosabu⚓Does he think⚓V|IMPF|LEM:Hasiba|ROOT:Hsb|3MS★>an⚓that⚓ SUB|LEM:>an★l~amo⚓not⚓ NEG|LEM:lam★yarahu,^⚓sees him⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|3MS|MOOD:JUS★>aHadN⚓anyone?⚓ N|LEM:>aHad|ROOT:AHd|M|INDEF|NOM★",
">alamo⚓Have not⚓NEG|LEM:lam★najoEal⚓We made⚓ V|IMPF|LEM:jaEala|ROOT:jEl|1P|MOOD:JUS★l~ahu,⚓for him⚓ PRON|3MS★Eayonayoni⚓two eyes?⚓ N|LEM:Eayon|ROOT:Eyn|FD|ACC★",
"walisaAnFA⚓And a tongue,⚓N|LEM:lisaAn|ROOT:lsn|M|INDEF|ACC★wa$afatayoni⚓and two lips?⚓ N|LEM:$afatayon|ROOT:$fh|FD|ACC★",
"wahadayona`hu⚓And shown him⚓V|PERF|LEM:hadaY|ROOT:hdy|1P★{ln~ajodayoni⚓the two ways?⚓ N|LEM:n~ajodayon|ROOT:njd|MD|ACC★",
"falaA⚓But not⚓NEG|LEM:laA★{qotaHama⚓he has attempted⚓ V|PERF|(VIII)|LEM:{qotaHama|ROOT:qHm|3MS★{loEaqabapa⚓the steep path.⚓ N|LEM:Eaqabap|ROOT:Eqb|F|ACC★",
"wamaA^⚓And what⚓INTG|LEM:maA★>adoraY`ka⚓can make you know⚓ V|PERF|(IV)|LEM:>adoraY`|ROOT:dry|3MS★maA⚓what⚓ INTG|LEM:maA★{loEaqabapu⚓the steep path is?⚓ N|LEM:Eaqabap|ROOT:Eqb|F|NOM★",
"fak~u⚓(It is) freeing⚓N|LEM:fak~|ROOT:fkk|M|NOM★raqabapK⚓a neck,⚓ N|LEM:raqabap|ROOT:rqb|F|INDEF|GEN★",
">awo⚓Or⚓CONJ|LEM:>aw★<iToEa`mN⚓feeding⚓ N|VN|(IV)|LEM:<iToEa`m|ROOT:TEm|M|INDEF|NOM★fiY⚓in⚓ P|LEM:fiY★yawomK⚓a day⚓ N|LEM:yawom|ROOT:ywm|M|INDEF|GEN★*iY⚓**of severe hunger.⚓ N|LEM:*uw|MS|GEN★masogabapK⚓**of severe hunger.⚓ N|LEM:masogabap|ROOT:sgb|F|INDEF|GEN★",
"yatiymFA⚓An orphan⚓N|LEM:yatiym|ROOT:ytm|MS|INDEF|ACC★*aA⚓**of near relationship,⚓ N|LEM:*aA|MS|ACC★maqorabapK⚓**of near relationship,⚓ N|LEM:maqorabap|ROOT:qrb|F|INDEF|GEN★",
">awo⚓Or⚓CONJ|LEM:>aw★misokiynFA⚓a needy person⚓ N|LEM:misokiyn|ROOT:skn|MS|INDEF|ACC★*aA⚓**in misery,⚓ N|LEM:*aA|MS|ACC★matorabapK⚓**in misery,⚓ N|LEM:matorabap|ROOT:trb|F|INDEF|GEN★",
"vum~a⚓Then⚓CONJ|LEM:vum~★kaAna⚓he is⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★mina⚓of⚓ P|LEM:min★{l~a*iyna⚓those who⚓ REL|LEM:{l~a*iY|MP★'aAmanuwA@⚓believe⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★watawaASawoA@⚓and enjoin each other⚓ V|PERF|(VI)|LEM:tawaASa|ROOT:wSy|3MP★bi{lS~abori⚓to patience,⚓ N|LEM:Sabor|ROOT:Sbr|M|GEN★watawaASawoA@⚓and enjoin each other⚓ V|PERF|(VI)|LEM:tawaASa|ROOT:wSy|3MP★bi{lomaroHamapi⚓to compassion.⚓ N|LEM:maroHamap|ROOT:rHm|F|GEN★",
">uw@la`^}ika⚓Those⚓DEM|LEM:>uwla`^}ik|P★>aSoHa`bu⚓(are the) companions⚓ N|LEM:>aSoHa`b|ROOT:SHb|MP|NOM★{lomayomanapi⚓(of) the right hand.⚓ N|LEM:mayomanap|ROOT:ymn|F|GEN★",
"wa{l~a*iyna⚓But those who⚓REL|LEM:{l~a*iY|MP★kafaruwA@⚓disbelieve⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★bi_#aAya`tinaA⚓in Our Verses,⚓ N|LEM:'aAyap|ROOT:Ayy|FP|GEN★humo⚓they⚓ PRON|3MP★>aSoHa`bu⚓(are the) companions⚓ N|LEM:>aSoHa`b|ROOT:SHb|MP|NOM★{loma$o_#amapi⚓(of) the left hand.⚓ N|LEM:ma$o_#amap|ROOT:$Am|F|GEN★",
"Ealayohimo⚓Over them,⚓P|LEM:EalaY`★naArN⚓(will be the) Fire⚓ N|LEM:naAr|ROOT:nwr|F|INDEF|NOM★m~u&oSadapN[⚓closed in.⚓ ADJ|LEM:m~u&oSadap|ROOT:wSd|F|INDEF|NOM★",
"",


"wa{l$~amosi⚓By the sun⚓N|LEM:$amos|ROOT:$ms|F|GEN★waDuHaY`haA⚓and its brightness,⚓ N|LEM:DuHFY|ROOT:DHw|M|GEN★",
"wa{loqamari⚓And the moon⚓N|LEM:qamar|ROOT:qmr|M|GEN★<i*aA⚓when⚓ T|LEM:<i*aA★talaY`haA⚓it follows it,⚓ V|PERF|LEM:talaY`|ROOT:tlw|3MS★",
"wa{ln~ahaAri⚓And the day⚓N|LEM:nahaAr|ROOT:nhr|M|GEN★<i*aA⚓when⚓ T|LEM:<i*aA★jal~aY`haA⚓it displays it,⚓ V|PERF|(II)|LEM:jal~aY`|ROOT:jlw|3MS★",
"wa{l~ayoli⚓And the night⚓N|LEM:layol|ROOT:lyl|M|GEN★<i*aA⚓when⚓ T|LEM:<i*aA★yago$aY`haA⚓it covers it,⚓ V|IMPF|LEM:ga$iya|ROOT:g$w|3MS★",
"wa{ls~amaA^'i⚓And the heaven⚓N|LEM:samaA^'|ROOT:smw|F|GEN★wamaA⚓and He Who⚓ REL|LEM:maA★banaY`haA⚓constructed it,⚓ V|PERF|LEM:banaY`|ROOT:bny|3MS★",
"wa{lo>aroDi⚓And the earth⚓N|LEM:>aroD|ROOT:ArD|F|GEN★wamaA⚓and He Who⚓ REL|LEM:maA★TaHaY`haA⚓spread it,⚓ V|PERF|LEM:TaHaY`|ROOT:THw|3MS★",
"wanafosK⚓And (the) soul⚓N|LEM:nafos|ROOT:nfs|FS|INDEF|GEN★wamaA⚓and He Who⚓ REL|LEM:maA★saw~aY`haA⚓proportioned it,⚓ V|PERF|(II)|LEM:saw~aY`|ROOT:swy|3MS★",
"fa>alohamahaA⚓And He inspired it⚓V|PERF|(IV)|LEM:>alohama|ROOT:lhm|3MS★fujuwrahaA⚓(to understand) what is wrong for it⚓ N|LEM:fujuwr|ROOT:fjr|M|ACC★wataqowaY`haA⚓and what is right for it,⚓ N|LEM:taqowaY|ROOT:wqy|M|ACC★",
"qado⚓Indeed,⚓CERT|LEM:qad★>afolaHa⚓he succeeds⚓ V|PERF|(IV)|LEM:>afolaHa|ROOT:flH|3MS★man⚓who⚓ REL|LEM:man★zak~aY`haA⚓purifies it,⚓ V|PERF|(II)|LEM:zak~aY`|ROOT:zkw|3MS★",
"waqado⚓And indeed,⚓CERT|LEM:qad★xaAba⚓he fails⚓ V|PERF|LEM:xaAba|ROOT:xyb|3MS★man⚓who⚓ REL|LEM:man★das~aY`haA⚓corrupts it.⚓ V|PERF|LEM:das~aY`|ROOT:dsw|3MS★",
"ka*~abato⚓Denied⚓V|PERF|(II)|LEM:ka*~aba|ROOT:k*b|3FS★vamuwdu⚓Thamud⚓ PN|LEM:vamuwd|NOM★biTagowaY`haA^⚓by their transgression,⚓ N|LEM:TagowaY`|ROOT:Tgy|M|GEN★",
"<i*i⚓When⚓T|LEM:<i*★{n[baEava⚓(was) sent forth⚓ V|PERF|(VII)|LEM:{n[baEava|ROOT:bEv|3MS★>a$oqaY`haA⚓(the) most wicked of them.⚓ N|LEM:>a$oqaY|ROOT:$qw|M|NOM★",
"faqaAla⚓But said⚓V|PERF|LEM:qaAla|ROOT:qwl|3MS★lahumo⚓to them⚓ PRON|3MP★rasuwlu⚓(the) Messenger⚓ N|LEM:rasuwl|ROOT:rsl|M|NOM★{ll~ahi⚓(of) Allah,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★naAqapa⚓`(It is the) she-camel⚓ N|LEM:naAqap|ROOT:nwq|F|ACC★{ll~ahi⚓(of) Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wasuqoya`haA⚓and her drink.`⚓ N|LEM:suqoya`|ROOT:sqy|M|ACC★",
"faka*~abuwhu⚓But they denied him,⚓V|PERF|(II)|LEM:ka*~aba|ROOT:k*b|3MP★faEaqaruwhaA⚓and they hamstrung her.⚓ V|PERF|LEM:Eaqara|ROOT:Eqr|3MP★fadamodama⚓So destroyed⚓ V|PERF|LEM:damodama|ROOT:dmdm|3MS★Ealayohimo⚓them⚓ P|LEM:EalaY`★rab~uhum⚓their Lord⚓ N|LEM:rab~|ROOT:rbb|M|NOM★bi*an[bihimo⚓for their sin⚓ N|LEM:*anb|ROOT:*nb|M|GEN★fasaw~aY`haA⚓and leveled them.⚓ V|PERF|(II)|LEM:saw~aY`|ROOT:swy|3MS★",
"walaA⚓And not⚓NEG|LEM:laA★yaxaAfu⚓He fears⚓ V|IMPF|LEM:xaAfa|ROOT:xwf|3MS★Euqoba`haA⚓its consequences.⚓ N|LEM:EuqobaY|ROOT:Eqb|F|ACC★",
"",


"wa{l~ayoli⚓By the night⚓N|LEM:layol|ROOT:lyl|M|GEN★<i*aA⚓when⚓ T|LEM:<i*aA★yago$aY`⚓it covers,⚓ V|IMPF|LEM:ga$iya|ROOT:g$w|3MS★",
"wa{ln~ahaAri⚓And the day⚓N|LEM:nahaAr|ROOT:nhr|M|GEN★<i*aA⚓when⚓ T|LEM:<i*aA★tajal~aY`⚓it shines in brightness,⚓ V|PERF|LEM:tajal~aY`|ROOT:jlw|3MS★",
"wamaA⚓**And He Who created⚓REL|LEM:maA★xalaqa⚓**And He Who created⚓ V|PERF|LEM:xalaqa|ROOT:xlq|3MS★{l*~akara⚓the male⚓ N|LEM:*akar|ROOT:*kr|M|ACC★wa{lo>unvaY`^⚓and the female,⚓ N|LEM:>unvaY`|ROOT:Anv|F|ACC★",
"<in~a⚓Indeed,⚓ACC|LEM:<in~|SP:<in~★saEoyakumo⚓your efforts⚓ N|LEM:saEoy|ROOT:sEy|M|ACC★la$at~aY`⚓(are) surely diverse.⚓ N|LEM:$at~aY`|ROOT:$tt|MS|NOM★",
"fa>am~aA⚓Then as for⚓EXL|LEM:>am~aA★mano⚓(him) who⚓ COND|LEM:man★>aEoTaY`⚓gives⚓ V|PERF|(IV)|LEM:>aEoTaY`|ROOT:ETw|3MS★wa{t~aqaY`⚓and fears,⚓ V|PERF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|3MS★",
"waSad~aqa⚓And believes⚓V|PERF|(II)|LEM:Sad~aqa|ROOT:Sdq|3MS★bi{loHusonaY`⚓in the best,⚓ N|LEM:HusonaY`|ROOT:Hsn|FS|GEN★",
"fasanuyas~iruhu,⚓Then We will ease him⚓V|IMPF|(II)|LEM:yas~ara|ROOT:ysr|1P★liloyusoraY`⚓towards [the] ease.⚓ N|LEM:yusoraY`|ROOT:ysr|FS|GEN★",
"wa>am~aA⚓But as for⚓EXL|LEM:>am~aA★man[⚓(him) who⚓ COND|LEM:man★baxila⚓withholds⚓ V|PERF|LEM:baxila|ROOT:bxl|3MS★wa{sotagonaY`⚓and considers himself free from need,⚓ V|PERF|(X)|LEM:{sotagonaY`|ROOT:gny|3MS★",
"waka*~aba⚓And denies⚓V|PERF|(II)|LEM:ka*~aba|ROOT:k*b|3MS★bi{loHusonaY`⚓the best,⚓ N|LEM:HusonaY`|ROOT:Hsn|FS|GEN★",
"fasanuyas~iruhu,⚓Then We will ease him⚓V|IMPF|(II)|LEM:yas~ara|ROOT:ysr|1P★liloEusoraY`⚓towards [the] difficulty.⚓ N|LEM:EusoraY`|ROOT:Esr|F|GEN★",
"wamaA⚓And not⚓NEG|LEM:maA★yugoniY⚓will avail⚓ V|IMPF|(IV)|LEM:>agonato|ROOT:gny|3MS★Eanohu⚓him⚓ P|LEM:Ean★maAluhu,^⚓his wealth⚓ N|LEM:maAl|ROOT:mwl|M|NOM★<i*aA⚓when⚓ T|LEM:<i*aA★tarad~aY`^⚓he falls.⚓ V|PERF|(V)|LEM:tarad~aY`^|ROOT:rdy|3MS★",
"<in~a⚓Indeed,⚓ACC|LEM:<in~|SP:<in~★EalayonaA⚓upon Us⚓ P|LEM:EalaY`★lalohudaY`⚓(is) the guidance.⚓ N|LEM:hudFY|ROOT:hdy|M|ACC★",
"wa<in~a⚓And indeed,⚓ACC|LEM:<in~|SP:<in~★lanaA⚓for Us⚓ PRON|1P★lalo'aAxirapa⚓(is) the Hereafter⚓ N|LEM:A^xir|ROOT:Axr|FS|ACC★wa{lo>uwlaY`⚓and the first (life).⚓ N|LEM:>aw~al|ROOT:Awl|F|ACC★",
"fa>an*arotukumo⚓So I warn you⚓V|PERF|(IV)|LEM:>an*ara|ROOT:n*r|1S★naArFA⚓(of) a Fire⚓ N|LEM:naAr|ROOT:nwr|F|INDEF|ACC★talaZ~aY`⚓blazing,⚓ V|IMPF|LEM:talaZ~aY`|ROOT:lZy|3FS★",
"laA⚓Not⚓NEG|LEM:laA★yaSolaY`haA^⚓will burn (in) it⚓ V|IMPF|LEM:yaSolaY|ROOT:Sly|3MS★<il~aA⚓except⚓ RES|LEM:<il~aA★{lo>a$oqaY⚓the most wretched,⚓ N|LEM:>a$oqaY|ROOT:$qw|MS|NOM★",
"{l~a*iY⚓The one who⚓REL|LEM:{l~a*iY|MS★ka*~aba⚓denied⚓ V|PERF|(II)|LEM:ka*~aba|ROOT:k*b|3MS★watawal~aY`⚓and turned away.⚓ V|PERF|(V)|LEM:tawal~aY`|ROOT:wly|3MS★",
"wasayujan~abuhaA⚓But will be removed from it⚓V|IMPF|PASS|(II)|LEM:yujan~abu|ROOT:jnb|3MS★{lo>atoqaY⚓the righteous,⚓ N|LEM:>atoqaY|ROOT:wqy|MS|NOM★",
"{l~a*iY⚓The one who⚓REL|LEM:{l~a*iY|MS★yu&otiY⚓gives⚓ V|IMPF|(IV)|LEM:A^taY|ROOT:Aty|3MS★maAlahu,⚓his wealth⚓ N|LEM:maAl|ROOT:mwl|M|ACC★yatazak~aY`⚓purifying himself,⚓ V|IMPF|(V)|LEM:tazak~aY`|ROOT:zkw|3MS★",
"wamaA⚓And not⚓NEG|LEM:maA★li>aHadK⚓for anyone⚓ N|LEM:>aHad|ROOT:AHd|M|INDEF|GEN★Eindahu,⚓with him⚓ LOC|LEM:Eind|ROOT:End|ACC★min⚓any⚓ P|LEM:min★n~iEomapK⚓favor⚓ N|LEM:niEomap|ROOT:nEm|F|INDEF|GEN★tujozaY`^⚓to be recompensed⚓ V|IMPF|PASS|LEM:jazaY`|ROOT:jzy|3FS★",
"<il~aA⚓Except⚓EXP|LEM:<il~aA★{botigaA^'a⚓seeking⚓ N|VN|(VIII)|LEM:{botigaA^'|ROOT:bgy|M|ACC★wajohi⚓(the) Countenance⚓ N|LEM:wajoh|ROOT:wjh|M|GEN★rab~ihi⚓(of) his Lord,⚓ N|LEM:rab~|ROOT:rbb|M|GEN★{lo>aEolaY`⚓the Most High.⚓ ADJ|LEM:>aEolaY`|ROOT:Elw|M|GEN★",
"walasawofa⚓And soon, surely⚓FUT|LEM:sawof★yaroDaY`⚓he will be pleased.⚓ V|IMPF|LEM:r~aDiYa|ROOT:rDw|3MS★",
"",


"wa{lD~uHaY`⚓By the morning brightness,⚓N|LEM:DuHFY|ROOT:DHw|M|GEN★",
"wa{l~ayoli⚓And the night⚓N|LEM:layol|ROOT:lyl|M|GEN★<i*aA⚓when⚓ T|LEM:<i*aA★sajaY`⚓it covers with darkness,⚓ V|PERF|LEM:sajaY`|ROOT:sjw|3MS★",
"maA⚓Not⚓NEG|LEM:maA★wad~aEaka⚓has forsaken you⚓ V|PERF|(II)|LEM:wad~aEa|ROOT:wdE|3MS★rab~uka⚓your Lord⚓ N|LEM:rab~|ROOT:rbb|M|NOM★wamaA⚓and not⚓ NEG|LEM:maA★qalaY`⚓He is displeased,⚓ V|PERF|LEM:qalaY`|ROOT:qly|3MS★",
"walalo'aAxirapu⚓And surely the Hereafter⚓N|LEM:A^xir|ROOT:Axr|FS|NOM★xayorN⚓(is) better⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★l~aka⚓for you⚓ PRON|2MS★mina⚓than⚓ P|LEM:min★{lo>uwlaY`⚓the first.⚓ N|LEM:>aw~al|ROOT:Awl|F|GEN★",
"walasawofa⚓And soon⚓FUT|LEM:sawof★yuEoTiyka⚓will give you⚓ V|IMPF|(IV)|LEM:>aEoTaY`|ROOT:ETw|3MS★rab~uka⚓your Lord⚓ N|LEM:rab~|ROOT:rbb|M|NOM★fataroDaY`^⚓then you will be satisfied.⚓ V|IMPF|LEM:r~aDiYa|ROOT:rDw|2MS★",
">alamo⚓Did not⚓NEG|LEM:lam★yajidoka⚓He find you⚓ V|IMPF|LEM:wajada|ROOT:wjd|3MS|MOOD:JUS★yatiymFA⚓an orphan⚓ N|LEM:yatiym|ROOT:ytm|MS|INDEF|ACC★fa_#aAwaY`⚓and gave shelter?⚓ V|PERF|(IV)|LEM:'aAwaY`^|ROOT:Awy|3MS★",
"wawajadaka⚓And He found you⚓V|PERF|LEM:wajada|ROOT:wjd|3MS★DaA^l~FA⚓lost,⚓ N|ACT|PCPL|LEM:DaA^l~|ROOT:Dll|M|INDEF|ACC★fahadaY`⚓so He guided,⚓ V|PERF|LEM:hadaY|ROOT:hdy|3MS★",
"wawajadaka⚓And He found you⚓V|PERF|LEM:wajada|ROOT:wjd|3MS★EaA^}ilFA⚓in need,⚓ N|ACT|PCPL|LEM:EaA^}il|ROOT:Eyl|M|INDEF|ACC★fa>agonaY`⚓so He made self-sufficient.⚓ V|PERF|LEM:>agonaY`|ROOT:gny|3MS★",
"fa>am~aA⚓So as for⚓EXL|LEM:>am~aA★{loyatiyma⚓the orphan,⚓ N|LEM:yatiym|ROOT:ytm|MS|ACC★falaA⚓then (do) not⚓ PRO|LEM:laA★taqoharo⚓oppress,⚓ V|IMPF|LEM:taqoharo|ROOT:qhr|2MS|MOOD:JUS★",
"wa>am~aA⚓And as for⚓EXL|LEM:>am~aA★{ls~aA^}ila⚓him who asks,⚓ N|ACT|PCPL|LEM:saA^}il|ROOT:sAl|M|ACC★falaA⚓then (do) not⚓ PRO|LEM:laA★tanoharo⚓repel,⚓ V|IMPF|LEM:tanoharo|ROOT:nhr|2MS|MOOD:JUS★",
"wa>am~aA⚓But as for⚓EXL|LEM:>am~aA★biniEomapi⚓(the) Favor⚓ N|LEM:niEomap|ROOT:nEm|F|GEN★rab~ika⚓(of) your Lord⚓ N|LEM:rab~|ROOT:rbb|M|GEN★faHad~ivo⚓narrate.⚓ V|IMPV|(II)|LEM:tuHad~ivu|ROOT:Hdv|2MS★",
"",



">alamo⚓Have not⚓NEG|LEM:lam★na$oraHo⚓We expanded⚓ V|IMPF|LEM:$araHa|ROOT:$rH|1P|MOOD:JUS★laka⚓for you⚓ PRON|2MS★Sadoraka⚓your breast?⚓ N|LEM:Sador|ROOT:Sdr|M|ACC★",
"wawaDaEonaA⚓And We removed⚓V|PERF|LEM:waDaEa|ROOT:wDE|1P★Eanka⚓from you⚓ P|LEM:Ean★wizoraka⚓your burden⚓ N|LEM:wizor|ROOT:wzr|F|ACC★",
"{l~a*iY^⚓Which⚓REL|LEM:{l~a*iY|MS★>anqaDa⚓weighed upon⚓ V|PERF|(IV)|LEM:>anqaDa|ROOT:nqD|3MS★Zahoraka⚓your back,⚓ N|LEM:Zahor|ROOT:Zhr|M|ACC★",
"warafaEonaA⚓And We raised high⚓V|PERF|LEM:rafaEa|ROOT:rfE|1P★laka⚓for you⚓ PRON|2MS★*ikoraka⚓your esteem.⚓ N|VN|LEM:*ikor|ROOT:*kr|M|ACC★",
"fa<in~a⚓So indeed,⚓ACC|LEM:<in~|SP:<in~★maEa⚓with⚓ P|LEM:maE2★{loEusori⚓the hardship⚓ N|LEM:Eusor|ROOT:Esr|M|GEN★yusorFA⚓(is) ease.⚓ N|LEM:yusor|ROOT:ysr|M|INDEF|ACC★",
"<in~a⚓Indeed,⚓ACC|LEM:<in~|SP:<in~★maEa⚓with⚓ P|LEM:maE2★{loEusori⚓the hardship⚓ N|LEM:Eusor|ROOT:Esr|M|GEN★yusorFA⚓(is) ease.⚓ N|LEM:yusor|ROOT:ysr|M|INDEF|ACC★",
"fa<i*aA⚓So when⚓T|LEM:<i*aA★faragota⚓you are free,⚓ V|PERF|LEM:farago|ROOT:frg|2MS★fa{nSabo⚓then stand up.⚓ V|IMPV|LEM:nuSibato|ROOT:nSb|2MS★",
"wa<ilaY`⚓And to⚓P|LEM:<ilaY`★rab~ika⚓your Lord⚓ N|LEM:rab~|ROOT:rbb|M|GEN★fa{rogab⚓turn your attention.⚓ V|IMPV|LEM:yarogabu|ROOT:rgb|2MS★",
"",


"wa{lt~iyni⚓By the fig,⚓N|LEM:t~iyn|ROOT:tyn|M|GEN★wa{lz~ayotuwni⚓and the olive,⚓ N|LEM:z~ayotuwn|ROOT:zyt|M|GEN★",
"waTuwri⚓And (the) Mount⚓N|LEM:Tuwr|ROOT:Twr|M|GEN★siyniyna⚓Sinai,⚓ PN|LEM:siyniyn|GEN★",
"waha`*aA⚓And this⚓DEM|LEM:ha`*aA|MS★{lobaladi⚓[the] city,⚓ N|LEM:balad|ROOT:bld|M|GEN★{lo>amiyni⚓[the] secure,⚓ ADJ|LEM:>amiyn|ROOT:Amn|MS|GEN★",
"laqado⚓Indeed,⚓CERT|LEM:qad★xalaqonaA⚓We created⚓ V|PERF|LEM:xalaqa|ROOT:xlq|1P★{lo<insa`na⚓man⚓ N|LEM:<insa`n|ROOT:Ans|M|ACC★fiY^⚓in⚓ P|LEM:fiY★>aHosani⚓(the) best⚓ N|LEM:>aHosan|ROOT:Hsn|MS|GEN★taqowiymK⚓mould.⚓ N|VN|(II)|LEM:taqowiym|ROOT:qwm|M|INDEF|GEN★",
"vum~a⚓Then⚓CONJ|LEM:vum~★radadona`hu⚓We return him⚓ V|PERF|LEM:rad~a|ROOT:rdd|1P★>asofala⚓(to the) lowest⚓ LOC|LEM:>asofal|ROOT:sfl|MS|ACC★sa`filiyna⚓(of the) low,⚓ N|ACT|PCPL|LEM:saAfil|ROOT:sfl|MP|GEN★",
"<il~aA⚓Except⚓EXP|LEM:<il~aA★{l~a*iyna⚓those who⚓ REL|LEM:{l~a*iY|MP★'aAmanuwA@⚓believe⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★waEamiluwA@⚓and do⚓ V|PERF|LEM:Eamila|ROOT:Eml|3MP★{lS~a`liHa`ti⚓righteous deeds,⚓ N|ACT|PCPL|LEM:S~a`liHa`t|ROOT:SlH|FP|ACC★falahumo⚓then for them⚓ PRON|3MP★>ajorN⚓(is a) reward⚓ N|LEM:>ajor|ROOT:Ajr|M|INDEF|NOM★gayoru⚓**never ending.⚓ N|LEM:gayor|ROOT:gyr|M|NOM★mamonuwnK⚓**never ending.⚓ N|PASS|PCPL|LEM:mamonuwn|ROOT:mnn|M|INDEF|GEN★",
"famaA⚓Then what⚓INTG|LEM:maA★yuka*~ibuka⚓causes you to deny⚓ V|IMPF|(II)|LEM:ka*~aba|ROOT:k*b|3MS★baEodu⚓after (this)⚓ T|LEM:baEod|ROOT:bEd★bi{ld~iyni⚓the judgment?⚓ N|LEM:diyn|ROOT:dyn|M|GEN★",
">alayosa⚓Is not⚓V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|3MS★{ll~ahu⚓Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★bi>aHokami⚓(the) Most Just⚓ N|LEM:>aHokam|ROOT:Hkm|MS|GEN★{loHa`kimiyna⚓(of) the Judges?⚓ N|ACT|PCPL|LEM:Ha`kimiyn|ROOT:Hkm|MP|GEN★",
"",



"{qora>o⚓Read⚓V|IMPV|LEM:qara>a|ROOT:qrA|2MS★bi{somi⚓in (the) name⚓ N|LEM:{som|ROOT:smw|M|GEN★rab~ika⚓(of) your Lord⚓ N|LEM:rab~|ROOT:rbb|M|GEN★{l~a*iY⚓the One Who⚓ REL|LEM:{l~a*iY|MS★xalaqa⚓created -⚓ V|PERF|LEM:xalaqa|ROOT:xlq|3MS★",
"xalaqa⚓He created⚓V|PERF|LEM:xalaqa|ROOT:xlq|3MS★{lo<insa`na⚓man⚓ N|LEM:<insa`n|ROOT:Ans|M|ACC★mino⚓from⚓ P|LEM:min★EalaqK⚓a clinging substance.⚓ N|LEM:Ealaq|ROOT:Elq|M|INDEF|GEN★",
"{qora>o⚓Read,⚓V|IMPV|LEM:qara>a|ROOT:qrA|2MS★warab~uka⚓and your Lord⚓ N|LEM:rab~|ROOT:rbb|M|NOM★{lo>akoramu⚓(is) the Most Generous,⚓ ADJ|LEM:>akoram|ROOT:krm|MS|NOM★",
"{l~a*iY⚓The One Who⚓REL|LEM:{l~a*iY|MS★Eal~ama⚓taught⚓ V|PERF|(II)|LEM:Eal~ama|ROOT:Elm|3MS★bi{loqalami⚓by the pen,⚓ N|LEM:qalam|ROOT:qlm|M|GEN★",
"Eal~ama⚓Taught⚓V|PERF|(II)|LEM:Eal~ama|ROOT:Elm|3MS★{lo<insa`na⚓man⚓ N|LEM:<insa`n|ROOT:Ans|M|ACC★maA⚓what⚓ REL|LEM:maA★lamo⚓not⚓ NEG|LEM:lam★yaEolamo⚓he knew.⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MS|MOOD:JUS★",
"kal~aA^⚓Nay!⚓AVR|LEM:kal~aA★<in~a⚓Indeed,⚓ ACC|LEM:<in~|SP:<in~★{lo<insa`na⚓man⚓ N|LEM:<insa`n|ROOT:Ans|M|ACC★layaTogaY`^⚓surely transgresses,⚓ V|IMPF|LEM:TagaY`|ROOT:Tgy|3MS★",
">an⚓Because⚓SUB|LEM:>an★r~a'aAhu⚓he sees himself⚓ V|PERF|LEM:ra'aA|ROOT:rAy|3MS★{sotagonaY`^⚓self-sufficient.⚓ V|PERF|(X)|LEM:{sotagonaY`|ROOT:gny|3MS★",
"<in~a⚓Indeed,⚓ACC|LEM:<in~|SP:<in~★<ilaY`⚓to⚓ P|LEM:<ilaY`★rab~ika⚓your Lord⚓ N|LEM:rab~|ROOT:rbb|M|GEN★{lr~ujoEaY`^⚓(is) the return.⚓ N|LEM:r~ujoEaY`^|ROOT:rjE|F|ACC★",
">ara'ayota⚓Have you seen⚓V|PERF|LEM:ra'aA|ROOT:rAy|2MS★{l~a*iY⚓the one who⚓ REL|LEM:{l~a*iY|MS★yanohaY`⚓forbids⚓ V|IMPF|LEM:nahaY`|ROOT:nhy|3MS★",
"EabodFA⚓A slave⚓N|LEM:Eabod|ROOT:Ebd|M|INDEF|ACC★<i*aA⚓when⚓ T|LEM:<i*aA★Sal~aY`^⚓he prays?⚓ V|PERF|(II)|LEM:Sal~aY`|ROOT:Slw|3MS★",
">ara'ayota⚓Have you seen⚓V|PERF|LEM:ra'aA|ROOT:rAy|2MS★<in⚓if⚓ COND|LEM:<in★kaAna⚓he is⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★EalaY⚓upon⚓ P|LEM:EalaY`★{lohudaY`^⚓[the] guidance,⚓ N|LEM:hudFY|ROOT:hdy|M|GEN★",
">awo⚓Or⚓CONJ|LEM:>aw★>amara⚓he enjoins⚓ V|PERF|LEM:>amara|ROOT:Amr|3MS★bi{lt~aqowaY`^⚓[of the] righteousness?⚓ N|LEM:taqowaY|ROOT:wqy|M|GEN★",
">ara'ayota⚓Have you seen⚓V|PERF|LEM:ra'aA|ROOT:rAy|2MS★<in⚓if⚓ COND|LEM:<in★ka*~aba⚓he denies⚓ V|PERF|(II)|LEM:ka*~aba|ROOT:k*b|3MS★watawal~aY`^⚓and turns away?⚓ V|PERF|(V)|LEM:tawal~aY`|ROOT:wly|3MS★",
">alamo⚓Does not⚓NEG|LEM:lam★yaEolam⚓he know⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MS|MOOD:JUS★bi>an~a⚓that⚓ ACC|LEM:>an~|SP:<in~★{ll~aha⚓Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★yaraY`⚓sees?⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|3MS★",
"kal~aA⚓Nay!⚓AVR|LEM:kal~aA★la}in⚓If⚓ COND|LEM:<in★l~amo⚓not⚓ NEG|LEM:lam★yantahi⚓he desists,⚓ V|IMPF|(VIII)|LEM:{ntahaY`|ROOT:nhy|3MS|MOOD:JUS★lanasofaEF[A⚓surely We will drag him⚓ V|IMPF|LEM:nasofaEF[|ROOT:sfE|1P★bi{ln~aASiyapi⚓by the forelock,⚓ N|LEM:naASiyap|ROOT:nSy|F|GEN★",
"naASiyapK⚓A forelock⚓N|LEM:naASiyap|ROOT:nSy|F|INDEF|GEN★ka`*ibapK⚓lying,⚓ ADJ|ACT|PCPL|LEM:ka`*ib|ROOT:k*b|F|INDEF|GEN★xaATi}apK⚓sinful.⚓ ADJ|ACT|PCPL|LEM:xaATi}ap|ROOT:xTA|F|INDEF|GEN★",
"faloyadoEu⚓Then let him call⚓V|IMPF|LEM:daEaA|ROOT:dEw|3MS|MOOD:JUS★naAdiyahu,⚓his associates,⚓ N|ACT|PCPL|LEM:naAdiy|ROOT:ndw|M|ACC★",
"sanadoEu⚓We will call⚓V|IMPF|LEM:daEaA|ROOT:dEw|1P★{lz~abaAniyapa⚓the Angels of Hell.⚓ N|LEM:z~abaAniyap|ROOT:zbn|MP|ACC★",
"kal~aA⚓Nay!⚓AVR|LEM:kal~aA★laA⚓(Do) not⚓ PRO|LEM:laA★tuTiEohu⚓obey him.⚓ V|IMPF|(IV)|LEM:>aTaAEa|ROOT:TwE|2MS|MOOD:JUS★wa{sojudo⚓But prostrate⚓ V|IMPV|LEM:sajada|ROOT:sjd|2MS★wa{qotarib⚓and draw near (to Allah).⚓ V|IMPV|(VIII)|LEM:{qotaraba|ROOT:qrb|2MS★",
"",


"<in~aA^⚓Indeed, We⚓ACC|LEM:<in~|SP:<in~★>anzalona`hu⚓revealed it⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|1P★fiY⚓in⚓ P|LEM:fiY★layolapi⚓(the) Night⚓ N|LEM:layolap|ROOT:lyl|F|GEN★{loqadori⚓(of) Power.⚓ N|LEM:qador|ROOT:qdr|M|GEN★",
"wamaA^⚓And what⚓INTG|LEM:maA★>adoraY`ka⚓can make you know⚓ V|PERF|(IV)|LEM:>adoraY`|ROOT:dry|3MS★maA⚓what⚓ INTG|LEM:maA★layolapu⚓(the) Night⚓ N|LEM:layolap|ROOT:lyl|F|NOM★{loqadori⚓(of) Power (is)?⚓ N|LEM:qador|ROOT:qdr|M|GEN★",
"layolapu⚓(The) Night⚓N|LEM:layolap|ROOT:lyl|F|NOM★{loqadori⚓(of) Power⚓ N|LEM:qador|ROOT:qdr|M|GEN★xayorN⚓(is) better⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★m~ino⚓than⚓ P|LEM:min★>alofi⚓a thousand⚓ N|LEM:>alof|ROOT:Alf|M|GEN★$ahorK⚓month(s).⚓ N|LEM:$ahor|ROOT:$hr|M|INDEF|GEN★",
"tanaz~alu⚓Descend⚓V|IMPF|(V)|LEM:tanaz~alato|ROOT:nzl|3FS★{lomala`^}ikapu⚓the Angels⚓ N|LEM:malak|ROOT:mlk|MP|NOM★wa{lr~uwHu⚓and the Spirit⚓ N|LEM:ruwH|ROOT:rwH|M|NOM★fiyhaA⚓therein,⚓ P|LEM:fiY★bi<i*oni⚓by (the) permission⚓ N|LEM:<i*on|ROOT:A*n|M|GEN★rab~ihim⚓(of) their Lord,⚓ N|LEM:rab~|ROOT:rbb|M|GEN★m~in⚓for⚓ P|LEM:min★kul~i⚓every⚓ N|LEM:kul~|ROOT:kll|M|GEN★>amorK⚓affair,⚓ N|LEM:>amor|ROOT:Amr|M|INDEF|GEN★",
"sala`mN⚓Peace⚓N|LEM:sala`m|ROOT:slm|M|INDEF|NOM★hiYa⚓it (is)⚓ PRON|3FS★Hat~aY`⚓until⚓ P|LEM:Hat~aY`★maTolaEi⚓(the) emergence⚓ N|LEM:maTolaE|ROOT:TlE|M|GEN★{lofajori⚓(of) the dawn.⚓ N|LEM:fajor|ROOT:fjr|M|GEN★",
"",



"lamo⚓Not⚓NEG|LEM:lam★yakuni⚓were⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS|MOOD:JUS★{l~a*iyna⚓those who⚓ REL|LEM:{l~a*iY|MP★kafaruwA@⚓disbelieved⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★mino⚓from⚓ P|LEM:min★>aholi⚓**(the) People of the Book⚓ N|LEM:>ahol|ROOT:Ahl|M|GEN★{lokita`bi⚓**(the) People of the Book⚓ N|LEM:kita`b|ROOT:ktb|M|GEN★wa{lomu$orikiyna⚓and the polytheists,⚓ N|ACT|PCPL|(IV)|LEM:mu$orik|ROOT:$rk|MP|GEN★munfak~iyna⚓to be abandoned⚓ N|ACT|PCPL|(VII)|LEM:munfak~iyn|ROOT:fkk|MP|ACC★Hat~aY`⚓until⚓ P|LEM:Hat~aY`★ta>otiyahumu⚓(there) comes to them⚓ V|IMPF|LEM:>ataY|ROOT:Aty|3FS|MOOD:SUBJ★{lobay~inapu⚓the clear evidence,⚓ N|LEM:bay~inap|ROOT:byn|FS|NOM★",
"rasuwlN⚓A Messenger⚓N|LEM:rasuwl|ROOT:rsl|M|INDEF|NOM★m~ina⚓from⚓ P|LEM:min★{ll~ahi⚓Allah,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★yatoluwA@⚓reciting⚓ V|IMPF|LEM:talaY`|ROOT:tlw|3MS★SuHufFA⚓pages⚓ N|LEM:SuHuf|ROOT:SHf|P|INDEF|ACC★m~uTah~arapF⚓purified,⚓ ADJ|PASS|PCPL|(II)|LEM:m~uTah~arap|ROOT:Thr|F|INDEF|ACC★",
"fiyhaA⚓Wherein⚓P|LEM:fiY★kutubN⚓(are) writings⚓ N|LEM:kita`b|ROOT:ktb|MP|INDEF|NOM★qay~imapN⚓correct.⚓ ADJ|LEM:qay~imap|ROOT:qwm|F|INDEF|NOM★",
"wamaA⚓And not⚓NEG|LEM:maA★tafar~aqa⚓became divided⚓ V|PERF|(V)|LEM:tafar~aqa|ROOT:frq|3MS★{l~a*iyna⚓those who⚓ REL|LEM:{l~a*iY|MP★>uwtuwA@⚓were given⚓ V|PERF|PASS|(IV)|LEM:A^taY|ROOT:Aty|3MP★{lokita`ba⚓the Book,⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★<il~aA⚓until⚓ CERT|LEM:<il~aA★min[⚓**after what⚓ P|LEM:min★baEodi⚓**after what⚓ N|LEM:baEod|ROOT:bEd|GEN★maA⚓**after what⚓ REL|LEM:maA★jaA^'atohumu⚓came (to) them⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3FS★{lobay~inapu⚓(of) the clear evidence.⚓ N|LEM:bay~inap|ROOT:byn|FS|NOM★",
"wamaA^⚓And not⚓NEG|LEM:maA★>umiruw^A@⚓they were commanded⚓ V|PERF|PASS|LEM:>amara|ROOT:Amr|3MP★<il~aA⚓except⚓ CERT|LEM:<il~aA★liyaEobuduwA@⚓to worship⚓ V|IMPF|LEM:Eabada|ROOT:Ebd|3MP|MOOD:SUBJ★{ll~aha⚓Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★muxoliSiyna⚓(being) sincere⚓ N|ACT|PCPL|(IV)|LEM:muxoliS|ROOT:xlS|MP|ACC★lahu⚓to Him⚓ PRON|3MS★{ld~iyna⚓(in) the religion,⚓ N|LEM:diyn|ROOT:dyn|M|ACC★HunafaA^'a⚓upright,⚓ N|LEM:Haniyf|ROOT:Hnf|MP|ACC★wayuqiymuwA@⚓and to establish⚓ V|IMPF|(IV)|LEM:>aqaAma|ROOT:qwm|3MP|MOOD:SUBJ★{lS~alaw`pa⚓the prayer,⚓ N|LEM:Salaw`p|ROOT:Slw|F|ACC★wayu&otuwA@⚓and to give⚓ V|IMPF|(IV)|LEM:A^taY|ROOT:Aty|3MP|MOOD:SUBJ★{lz~akaw`pa⚓the Zakah.⚓ N|LEM:zakaw`p|ROOT:zkw|F|ACC★wa*a`lika⚓And that⚓ DEM|LEM:*a`lik|MS★diynu⚓(is the) religion⚓ N|LEM:diyn|ROOT:dyn|M|NOM★{loqay~imapi⚓the correct.⚓ N|LEM:qay~imap|ROOT:qwm|F|GEN★",
"<in~a⚓Indeed,⚓ACC|LEM:<in~|SP:<in~★{l~a*iyna⚓those who⚓ REL|LEM:{l~a*iY|MP★kafaruwA@⚓disbelieve⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★mino⚓from⚓ P|LEM:min★>aholi⚓(the) People⚓ N|LEM:>ahol|ROOT:Ahl|M|GEN★{lokita`bi⚓(of) the Book⚓ N|LEM:kita`b|ROOT:ktb|M|GEN★wa{lomu$orikiyna⚓and the polytheists⚓ N|ACT|PCPL|(IV)|LEM:mu$orik|ROOT:$rk|MP|GEN★fiY⚓(will be) in⚓ P|LEM:fiY★naAri⚓(the) Fire⚓ N|LEM:naAr|ROOT:nwr|F|GEN★jahan~ama⚓(of) Hell⚓ PN|LEM:jahan~am|GEN★xa`lidiyna⚓abiding eternally⚓ N|ACT|PCPL|LEM:xa`lid|ROOT:xld|MP|ACC★fiyhaA^⚓therein.⚓ P|LEM:fiY★>uw@la`^}ika⚓Those -⚓ DEM|LEM:>uwla`^}ik|P★humo⚓they⚓ PRON|3MP★$ar~u⚓(are the) worst⚓ N|LEM:$ar~|ROOT:$rr|MS|NOM★{lobariy~api⚓(of) the creatures.⚓ N|LEM:bariy~ap|ROOT:brA|F|GEN★",
"<in~a⚓Indeed,⚓ACC|LEM:<in~|SP:<in~★{l~a*iyna⚓those who⚓ REL|LEM:{l~a*iY|MP★'aAmanuwA@⚓believe⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★waEamiluwA@⚓and do⚓ V|PERF|LEM:Eamila|ROOT:Eml|3MP★{lS~a`liHa`ti⚓righteous deeds,⚓ N|ACT|PCPL|LEM:S~a`liHa`t|ROOT:SlH|FP|ACC★>uw@la`^}ika⚓those -⚓ DEM|LEM:>uwla`^}ik|P★humo⚓they⚓ PRON|3MP★xayoru⚓(are the) best⚓ N|LEM:xayor|ROOT:xyr|MS|NOM★{lobariy~api⚓(of) the creatures.⚓ N|LEM:bariy~ap|ROOT:brA|F|GEN★",
"jazaA^&uhumo⚓Their reward⚓N|LEM:jazaA^'|ROOT:jzy|M|NOM★Einda⚓(is) with⚓ LOC|LEM:Eind|ROOT:End|ACC★rab~ihimo⚓their Lord -⚓ N|LEM:rab~|ROOT:rbb|M|GEN★jan~a`tu⚓Gardens⚓ N|LEM:jan~ap|ROOT:jnn|FP|NOM★EadonK⚓(of) Eternity,⚓ PN|LEM:Eadon|GEN★tajoriY⚓flow⚓ V|IMPF|LEM:jarayo|ROOT:jry|3FS★min⚓from⚓ P|LEM:min★taHotihaA⚓underneath them⚓ N|LEM:taHot|ROOT:tHt|GEN★{lo>anoha`ru⚓the rivers,⚓ N|LEM:nahar|ROOT:nhr|MP|NOM★xa`lidiyna⚓will abide⚓ N|ACT|PCPL|LEM:xa`lid|ROOT:xld|MP|ACC★fiyhaA^⚓therein⚓ P|LEM:fiY★>abadFA⚓forever.⚓ T|LEM:>abadFA|ROOT:Abd|M|INDEF|ACC★r~aDiYa⚓**Allah (will be) pleased⚓ V|PERF|LEM:r~aDiYa|ROOT:rDw|3MS★{ll~ahu⚓**Allah (will be) pleased⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★Eanohumo⚓with them⚓ P|LEM:Ean★waraDuwA@⚓and they (will be) pleased⚓ V|PERF|LEM:r~aDiYa|ROOT:rDw|3MP★Eanohu⚓with Him.⚓ P|LEM:Ean★*a`lika⚓That⚓ DEM|LEM:*a`lik|MS★limano⚓(is) for whoever⚓ REL|LEM:man★xa$iYa⚓feared⚓ V|PERF|LEM:xa$iYa|ROOT:x$y|3MS★rab~ahu,⚓his Lord.⚓ N|LEM:rab~|ROOT:rbb|M|ACC★",
"",


"<i*aA⚓When⚓T|LEM:<i*aA★zulozilati⚓is shaken⚓ V|PERF|PASS|LEM:zulozilu|ROOT:zlzl|3FS★{lo>aroDu⚓the earth⚓ N|LEM:>aroD|ROOT:ArD|F|NOM★zilozaAlahaA⚓with its earthquake,⚓ N|LEM:zilozaAl|ROOT:zlzl|M|ACC★",
"wa>axorajati⚓And brings forth⚓V|PERF|(IV)|LEM:>axoraja|ROOT:xrj|3FS★{lo>aroDu⚓the earth⚓ N|LEM:>aroD|ROOT:ArD|F|NOM★>avoqaAlahaA⚓its burdens,⚓ N|LEM:v~aqalaAn|ROOT:vql|MP|ACC★",
"waqaAla⚓And says⚓V|PERF|LEM:qaAla|ROOT:qwl|3MS★{lo<insa`nu⚓man,⚓ N|LEM:<insa`n|ROOT:Ans|M|NOM★maA⚓`What⚓ INTG|LEM:maA★lahaA⚓(is) with it?`⚓ PRON|3FS★",
"yawoma}i*K⚓That Day,⚓T|LEM:yawoma}i*★tuHad~ivu⚓it will report⚓ V|IMPF|(II)|LEM:tuHad~ivu|ROOT:Hdv|3FS★>axobaArahaA⚓its news,⚓ N|LEM:>axobaAr|ROOT:xbr|MP|ACC★",
"bi>an~a⚓Because⚓ACC|LEM:>an~|SP:<in~★rab~aka⚓your Lord⚓ N|LEM:rab~|ROOT:rbb|M|ACC★>awoHaY`⚓inspired⚓ V|PERF|(IV)|LEM:>awoHaY`^|ROOT:wHy|3MS★lahaA⚓[to] it.⚓ PRON|3FS★",
"yawoma}i*K⚓That Day⚓T|LEM:yawoma}i*★yaSoduru⚓will proceed⚓ V|IMPF|LEM:yaSoduru|ROOT:Sdr|3MS★{ln~aAsu⚓the mankind⚓ N|LEM:n~aAs|ROOT:nws|MP|NOM★>a$otaAtFA⚓(in) scattered groups⚓ N|LEM:>a$otaAt|ROOT:$tt|MP|INDEF|ACC★l~iyurawoA@⚓to be shown⚓ V|IMPF|PASS|(IV)|LEM:>arayo|ROOT:rAy|3MP|MOOD:SUBJ★>aEoma`lahumo⚓their deeds.⚓ N|LEM:Eamal|ROOT:Eml|MP|ACC★",
"faman⚓So whoever⚓COND|LEM:man★yaEomalo⚓does⚓ V|IMPF|LEM:Eamila|ROOT:Eml|3MS|MOOD:JUS★mivoqaAla⚓(equal to the) weight⚓ N|LEM:mivoqaAl|ROOT:vql|M|ACC★*ar~apK⚓(of) an atom⚓ N|LEM:*ar~ap|ROOT:*rr|F|INDEF|GEN★xayorFA⚓good,⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|ACC★yarahu,⚓will see it,⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|3MS|MOOD:JUS★",
"waman⚓And whoever⚓COND|LEM:man★yaEomalo⚓does⚓ V|IMPF|LEM:Eamila|ROOT:Eml|3MS|MOOD:JUS★mivoqaAla⚓(equal to the) weight⚓ N|LEM:mivoqaAl|ROOT:vql|M|ACC★*ar~apK⚓(of) an atom⚓ N|LEM:*ar~ap|ROOT:*rr|F|INDEF|GEN★$ar~FA⚓evil,⚓ N|LEM:$ar~|ROOT:$rr|MS|INDEF|ACC★yarahu,⚓will see it.⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|3MS|MOOD:JUS★",
"",


"wa{loEa`diya`ti⚓By the racers⚓N|ACT|PCPL|LEM:Ea`diya`t|ROOT:Edw|FP|GEN★DaboHFA⚓panting,⚓ N|LEM:DaboH|ROOT:DbH|M|INDEF|ACC★",
"fa{lomuwriya`ti⚓And the producers of sparks,⚓N|ACT|PCPL|(IV)|LEM:muwriya`t|ROOT:wry|FP|GEN★qadoHFA⚓striking⚓ N|LEM:qadoH|ROOT:qdH|M|INDEF|ACC★",
"fa{lomugiyra`ti⚓And the chargers⚓N|ACT|PCPL|(IV)|LEM:mugiyra`t|ROOT:gyr|FP|GEN★SuboHFA⚓(at) dawn,⚓ T|LEM:SuboH|ROOT:SbH|M|INDEF|ACC★",
"fa>avarona⚓Then raise⚓V|PERF|(IV)|LEM:>avaAru|ROOT:vwr|3FP★bihi.⚓thereby⚓ PRON|3MS★naqoEFA⚓dust,⚓ N|LEM:naqoE|ROOT:nqE|M|INDEF|ACC★",
"fawasaTona⚓**Then penetrate thereby (in the) center⚓V|PERF|LEM:wasaTo|ROOT:wsT|3FP★bihi.⚓**Then penetrate thereby (in the) center⚓ PRON|3MS★jamoEFA⚓(of) troops,⚓ N|LEM:jamoE|ROOT:jmE|M|INDEF|ACC★",
"<in~a⚓Indeed,⚓ACC|LEM:<in~|SP:<in~★{lo<insa`na⚓mankind,⚓ N|LEM:<insa`n|ROOT:Ans|M|ACC★lirab~ihi.⚓to his Lord,⚓ N|LEM:rab~|ROOT:rbb|M|GEN★lakanuwdN⚓(is) surely ungrateful.⚓ N|LEM:kanuwd|ROOT:knd|MS|INDEF|NOM★",
"wa<in~ahu,⚓And indeed, he⚓ACC|LEM:<in~|SP:<in~★EalaY`⚓to⚓ P|LEM:EalaY`★*a`lika⚓that⚓ DEM|LEM:*a`lik|MS★la$ahiydN⚓surely (is) a witness,⚓ N|LEM:$ahiyd|ROOT:$hd|MS|INDEF|NOM★",
"wa<in~ahu,⚓And indeed he (is),⚓ACC|LEM:<in~|SP:<in~★liHub~i⚓in (the) love⚓ N|LEM:Hub~|ROOT:Hbb|M|GEN★{loxayori⚓(of) wealth⚓ N|LEM:xayor|ROOT:xyr|MS|GEN★la$adiydN⚓(is) surely intense.⚓ N|LEM:$adiyd|ROOT:$dd|MS|INDEF|NOM★",
">afalaA⚓But does not⚓NEG|LEM:laA★yaEolamu⚓he know⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MS★<i*aA⚓when⚓ T|LEM:<i*aA★buEovira⚓will be scattered⚓ V|PERF|PASS|LEM:buEovira|ROOT:bEvr|3MS★maA⚓what⚓ REL|LEM:maA★fiY⚓(is) in⚓ P|LEM:fiY★{loqubuwri⚓the graves,⚓ N|LEM:qabor|ROOT:qbr|MP|GEN★",
"waHuS~ila⚓And is made apparent⚓V|PERF|PASS|(II)|LEM:HuS~ila|ROOT:HSl|3MS★maA⚓what⚓ REL|LEM:maA★fiY⚓(is) in⚓ P|LEM:fiY★{lS~uduwri⚓the breasts?⚓ N|LEM:Sador|ROOT:Sdr|MP|GEN★",
"<in~a⚓Indeed,⚓ACC|LEM:<in~|SP:<in~★rab~ahum⚓their Lord⚓ N|LEM:rab~|ROOT:rbb|M|ACC★bihimo⚓about them,⚓ PRON|3MP★yawoma}i*K⚓that Day,⚓ T|LEM:yawoma}i*★l~axabiyrN[⚓(is) surely All-Aware.⚓ N|LEM:xabiyr|ROOT:xbr|MS|INDEF|NOM★",
"",



"{loqaAriEapu⚓The Striking Calamity!⚓N|LEM:qaAriEap|ROOT:qrE|F|NOM★",
"maA⚓What⚓INTG|LEM:maA★{loqaAriEapu⚓(is) the Striking Calamity?⚓ N|LEM:qaAriEap|ROOT:qrE|F|NOM★",
"wamaA^⚓And what⚓INTG|LEM:maA★>adoraY`ka⚓will make you know⚓ V|PERF|(IV)|LEM:>adoraY`|ROOT:dry|3MS★maA⚓what⚓ INTG|LEM:maA★{loqaAriEapu⚓(is) the Striking Calamity?⚓ N|LEM:qaAriEap|ROOT:qrE|F|NOM★",
"yawoma⚓(The) Day⚓T|LEM:yawom|ROOT:ywm|M|ACC★yakuwnu⚓will be⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★{ln~aAsu⚓the mankind⚓ N|LEM:n~aAs|ROOT:nws|MP|NOM★ka{lofaraA$i⚓like moths,⚓ N|LEM:faraA$|ROOT:fr$|M|GEN★{lomabovuwvi⚓scattered,⚓ ADJ|PASS|PCPL|LEM:mabovuwv|ROOT:bvv|M|GEN★",
"watakuwnu⚓And will be⚓V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3FS★{lojibaAlu⚓the mountains⚓ N|LEM:jabal|ROOT:jbl|MP|NOM★ka{loEihoni⚓like wool,⚓ N|LEM:Eihon|ROOT:Ehn|M|GEN★{lomanfuw$i⚓fluffed up.⚓ ADJ|PASS|PCPL|LEM:manfuw$|ROOT:nf$|M|GEN★",
"fa>am~aA⚓Then as for⚓EXL|LEM:>am~aA★man⚓(him) whose⚓ COND|LEM:man★vaqulato⚓are heavy⚓ V|PERF|LEM:vaqulato|ROOT:vql|3FS★mawa`ziynuhu,⚓his scales,⚓ N|LEM:miyzaAn|ROOT:wzn|MP|NOM★",
"fahuwa⚓Then he⚓PRON|3MS★fiY⚓(will be) in⚓ P|LEM:fiY★Eiy$apK⚓a life,⚓ N|LEM:Eiy$ap|ROOT:Ey$|F|INDEF|GEN★r~aADiyapK⚓pleasant.⚓ ADJ|ACT|PCPL|LEM:raADiyap|ROOT:rDw|F|INDEF|GEN★",
"wa>am~aA⚓But as for⚓EXL|LEM:>am~aA★mano⚓(him) whose⚓ COND|LEM:man★xaf~ato⚓are light⚓ V|PERF|LEM:xaf~ato|ROOT:xff|3FS★mawa`ziynuhu,⚓his scales,⚓ N|LEM:miyzaAn|ROOT:wzn|MP|NOM★",
"fa>um~uhu,⚓His abode⚓N|LEM:>um~|ROOT:Amm|FS|NOM★haAwiyapN⚓(will be the) Pit.⚓ N|ACT|PCPL|LEM:haAwiyap|ROOT:hwy|F|INDEF|NOM★",
"wamaA^⚓And what⚓INTG|LEM:maA★>adoraY`ka⚓will make you know⚓ V|PERF|(IV)|LEM:>adoraY`|ROOT:dry|3MS★maA⚓what⚓ INTG|LEM:maA★hiyaho⚓it is?⚓ PRON|3FS★",
"naArN⚓A Fire,⚓N|LEM:naAr|ROOT:nwr|F|INDEF|NOM★HaAmiyapN[⚓intensely hot.⚓ ADJ|ACT|PCPL|LEM:HaAmiyap|ROOT:Hmy|F|INDEF|NOM★",
"",



">alohaY`kumu⚓Diverts you⚓V|PERF|(IV)|LEM:>alohaY`|ROOT:lhw|3MS★{lt~akaAvuru⚓the competition to increase⚓ N|VN|(III)|LEM:t~akaAvur|ROOT:kvr|M|NOM★",
"Hat~aY`⚓Until⚓INC|LEM:Hat~aY`★zurotumu⚓you visit⚓ V|PERF|LEM:zuro|ROOT:zwr|2MP★{lomaqaAbira⚓the graves.⚓ N|LEM:maqaAbir|ROOT:qbr|MP|ACC★",
"kal~aA⚓Nay!⚓AVR|LEM:kal~aA★sawofa⚓Soon⚓ FUT|LEM:sawof★taEolamuwna⚓you will know.⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★",
"vum~a⚓Then,⚓CONJ|LEM:vum~★kal~aA⚓nay!⚓ AVR|LEM:kal~aA★sawofa⚓Soon⚓ FUT|LEM:sawof★taEolamuwna⚓you will know.⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★",
"kal~aA⚓Nay!⚓AVR|LEM:kal~aA★lawo⚓If⚓ COND|LEM:law★taEolamuwna⚓you know⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★Eiloma⚓(with) a knowledge⚓ N|LEM:Eilom|ROOT:Elm|M|ACC★{loyaqiyni⚓(of) certainty.⚓ N|LEM:yaqiyn|ROOT:yqn|MS|GEN★",
"latarawun~a⚓Surely you will see⚓V|IMPF|LEM:ra'aA|ROOT:rAy|2MP★{lojaHiyma⚓the Hellfire.⚓ N|LEM:jaHiym|ROOT:jHm|F|ACC★",
"vum~a⚓Then⚓CONJ|LEM:vum~★latarawun~ahaA⚓surely you will see it⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|2MP★Eayona⚓(with the) eye⚓ N|LEM:Eayon|ROOT:Eyn|F|ACC★{loyaqiyni⚓(of) certainty.⚓ N|LEM:yaqiyn|ROOT:yqn|MS|GEN★",
"vum~a⚓Then,⚓CONJ|LEM:vum~★latuso_#alun~a⚓surely you will be asked⚓ V|IMPF|PASS|LEM:sa>ala|ROOT:sAl|2MP★yawoma}i*K⚓that Day⚓ T|LEM:yawoma}i*★Eani⚓about⚓ P|LEM:Ean★{ln~aEiymi⚓the pleasures.⚓ N|LEM:naEiym|ROOT:nEm|M|GEN★",
"",



"wa{loEaSori⚓By the time,⚓N|LEM:EaSor|ROOT:ESr|M|GEN★",
"<in~a⚓Indeed,⚓ACC|LEM:<in~|SP:<in~★{lo<insa`na⚓mankind⚓ N|LEM:<insa`n|ROOT:Ans|M|ACC★lafiY⚓(is) surely, in⚓ P|LEM:fiY★xusorK⚓loss,⚓ N|LEM:xusor|ROOT:xsr|M|INDEF|GEN★",
"<il~aA⚓Except⚓EXP|LEM:<il~aA★{l~a*iyna⚓those who⚓ REL|LEM:{l~a*iY|MP★'aAmanuwA@⚓believe⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★waEamiluwA@⚓and do⚓ V|PERF|LEM:Eamila|ROOT:Eml|3MP★{lS~a`liHa`ti⚓righteous deeds⚓ N|ACT|PCPL|LEM:S~a`liHa`t|ROOT:SlH|FP|ACC★watawaASawoA@⚓and enjoin each other⚓ V|PERF|(VI)|LEM:tawaASa|ROOT:wSy|3MP★bi{loHaq~i⚓to the truth⚓ N|LEM:Haq~|ROOT:Hqq|M|GEN★watawaASawoA@⚓and enjoin each other⚓ V|PERF|(VI)|LEM:tawaASa|ROOT:wSy|3MP★bi{lS~abori⚓to [the] patience.⚓ N|LEM:Sabor|ROOT:Sbr|M|GEN★",
"",


"wayolN⚓Woe⚓N|LEM:wayol|M|INDEF|NOM★l~ikul~i⚓to every⚓ N|LEM:kul~|ROOT:kll|M|GEN★humazapK⚓slanderer⚓ N|LEM:humazap|ROOT:hmz|M|INDEF|GEN★l~umazapK⚓backbiter!⚓ N|LEM:l~umazap|ROOT:lmz|F|INDEF|GEN★",
"{l~a*iY⚓The one who⚓REL|LEM:{l~a*iY|MS★jamaEa⚓collects⚓ V|PERF|LEM:jamaEa|ROOT:jmE|3MS★maAlFA⚓wealth⚓ N|LEM:maAl|ROOT:mwl|M|INDEF|ACC★waEad~adahu,⚓and counts it.⚓ V|PERF|(II)|LEM:Ead~ada|ROOT:Edd|3MS★",
"yaHosabu⚓Thinking⚓V|IMPF|LEM:Hasiba|ROOT:Hsb|3MS★>an~a⚓that⚓ ACC|LEM:>an~|SP:<in~★maAlahu,^⚓his wealth⚓ N|LEM:maAl|ROOT:mwl|M|ACC★>axoladahu,⚓will make him immortal⚓ V|PERF|(IV)|LEM:>axolada|ROOT:xld|3MS★",
"kal~aA⚓Nay!⚓AVR|LEM:kal~aA★layun[ba*an~a⚓Surely he will be thrown⚓ V|IMPF|PASS|LEM:naba*a|ROOT:nb*|3MS★fiY⚓in⚓ P|LEM:fiY★{loHuTamapi⚓the Crusher.⚓ N|LEM:HuTamap|ROOT:HTm|F|GEN★",
"wamaA^⚓And what⚓INTG|LEM:maA★>adoraY`ka⚓will make you know⚓ V|PERF|(IV)|LEM:>adoraY`|ROOT:dry|3MS★maA⚓what⚓ INTG|LEM:maA★{loHuTamapu⚓the Crusher (is)?⚓ N|LEM:HuTamap|ROOT:HTm|F|NOM★",
"naAru⚓A Fire⚓N|LEM:naAr|ROOT:nwr|F|NOM★{ll~ahi⚓**kindled by Allah,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★{lomuwqadapu⚓**kindled by Allah,⚓ ADJ|PASS|PCPL|(IV)|LEM:muwqadap|ROOT:wqd|F|NOM★",
"{l~atiY⚓Which⚓REL|LEM:{l~a*iY|FS★taT~aliEu⚓mounts up⚓ V|IMPF|(VIII)|LEM:T~alaEa|ROOT:TlE|3FS★EalaY⚓to⚓ P|LEM:EalaY`★{lo>afo_#idapi⚓the hearts.⚓ N|LEM:fu&aAd|ROOT:fAd|MP|GEN★",
"<in~ahaA⚓Indeed, it⚓ACC|LEM:<in~|SP:<in~★Ealayohim⚓(will be) upon them⚓ P|LEM:EalaY`★m~u&oSadapN⚓closed over,⚓ N|LEM:m~u&oSadap|ROOT:wSd|F|INDEF|NOM★",
"fiY⚓In⚓P|LEM:fiY★EamadK⚓columns⚓ N|LEM:Eamad|ROOT:Emd|MP|INDEF|GEN★m~umad~adapK]⚓extended.⚓ ADJ|PASS|PCPL|(II)|LEM:m~umad~adap|ROOT:mdd|F|INDEF|GEN★",
"",



">alamo⚓Have not⚓NEG|LEM:lam★tara⚓you seen⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|2MS|MOOD:JUS★kayofa⚓how⚓ INTG|LEM:kayof|ROOT:kyf★faEala⚓dealt⚓ V|PERF|LEM:faEala|ROOT:fEl|3MS★rab~uka⚓your Lord⚓ N|LEM:rab~|ROOT:rbb|M|NOM★bi>aSoHa`bi⚓with (the) Companions⚓ N|LEM:>aSoHa`b|ROOT:SHb|MP|GEN★{lofiyli⚓(of the) Elephant?⚓ N|LEM:fiyl|ROOT:fyl|M|GEN★",
">alamo⚓Did not⚓NEG|LEM:lam★yajoEalo⚓He make⚓ V|IMPF|LEM:jaEala|ROOT:jEl|3MS|MOOD:JUS★kayodahumo⚓their plan⚓ N|LEM:kayod|ROOT:kyd|M|ACC★fiY⚓**go astray?⚓ P|LEM:fiY★taDoliylK⚓**go astray?⚓ N|VN|(II)|LEM:taDoliyl|ROOT:Dll|M|INDEF|GEN★",
"wa>arosala⚓And He sent⚓V|PERF|(IV)|LEM:>arosala|ROOT:rsl|3MS★Ealayohimo⚓against them⚓ P|LEM:EalaY`★TayorFA⚓birds⚓ N|LEM:Tayor|ROOT:Tyr|MP|INDEF|ACC★>abaAbiyla⚓(in) flocks.⚓ ADJ|LEM:>abaAbiyl|ROOT:Abl|MP|INDEF|ACC★",
"taromiyhim⚓Striking them⚓V|IMPF|LEM:ramaY`|ROOT:rmy|3FS★biHijaArapK⚓with stones⚓ N|LEM:HijaArap|ROOT:Hjr|F|INDEF|GEN★m~in⚓of⚓ P|LEM:min★sij~iylK⚓baked clay.⚓ N|LEM:sij~iyl|ROOT:sjl|M|INDEF|GEN★",
"fajaEalahumo⚓Then He made them⚓V|PERF|LEM:jaEala|ROOT:jEl|3MS★kaEaSofK⚓like straw⚓ N|LEM:EaSof|ROOT:ESf|M|INDEF|GEN★m~a>okuwlK]⚓eaten up.⚓ ADJ|PASS|PCPL|LEM:m~a>okuwl|ROOT:Akl|M|INDEF|GEN★",
"",




"li<iyla`fi⚓For (the) familiarity⚓N|VN|(IV)|LEM:<ila`f|ROOT:Alf|M|GEN★qurayo$K⚓(of the) Quraish,⚓ PN|LEM:qurayo$|P|GEN★",
"<i.la`fihimo⚓Their familiarity⚓N|VN|(IV)|LEM:<ila`f|ROOT:Alf|M|GEN★riHolapa⚓(with the) journey⚓ N|LEM:riHolap|ROOT:rHl|F|ACC★{l$~itaA^'i⚓(of) winter⚓ N|LEM:$~itaA^'|ROOT:$tw|M|GEN★wa{lS~ayofi⚓and summer,⚓ N|LEM:S~ayof|ROOT:Syf|M|GEN★",
"faloyaEobuduwA@⚓So let them worship⚓V|IMPF|LEM:Eabada|ROOT:Ebd|3MP|MOOD:JUS★rab~a⚓(the) Lord⚓ N|LEM:rab~|ROOT:rbb|M|ACC★ha`*aA⚓(of) this⚓ DEM|LEM:ha`*aA|MS★{lobayoti⚓House,⚓ N|LEM:bayot|ROOT:byt|M|GEN★",
"{l~a*iY^⚓The One Who⚓REL|LEM:{l~a*iY|MS★>aToEamahum⚓feeds them⚓ V|PERF|(IV)|LEM:>aToEama|ROOT:TEm|3MS★m~in⚓against⚓ P|LEM:min★juwEK⚓hunger⚓ N|LEM:juwE|ROOT:jwE|M|INDEF|GEN★wa'aAmanahum⚓and gives them security⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MS★m~ino⚓against⚓ P|LEM:min★xawofK]⚓fear.⚓ N|LEM:xawof|ROOT:xwf|M|INDEF|GEN★",
"",



">ara'ayota⚓Have you seen⚓V|PERF|LEM:ra'aA|ROOT:rAy|2MS★{l~a*iY⚓the one who⚓ REL|LEM:{l~a*iY|MS★yuka*~ibu⚓denies⚓ V|IMPF|(II)|LEM:ka*~aba|ROOT:k*b|3MS★bi{ld~iyni⚓the Judgment?⚓ N|LEM:diyn|ROOT:dyn|M|GEN★",
"fa*a`lika⚓Then that⚓DEM|LEM:*a`lik|MS★{l~a*iY⚓(is) the one who⚓ REL|LEM:{l~a*iY|MS★yaduE~u⚓repulses⚓ V|IMPF|LEM:yaduE~u|ROOT:dEE|3MS★{loyatiyma⚓the orphan,⚓ N|LEM:yatiym|ROOT:ytm|MS|ACC★",
"walaA⚓And (does) not⚓NEG|LEM:laA★yaHuD~u⚓feel the urge⚓ V|IMPF|LEM:yaHuD~u|ROOT:HDD|3MS★EalaY`⚓to⚓ P|LEM:EalaY`★TaEaAmi⚓feed⚓ N|LEM:TaEaAm|ROOT:TEm|M|GEN★{lomisokiyni⚓the poor.⚓ N|LEM:misokiyn|ROOT:skn|MS|GEN★",
"fawayolN⚓So woe⚓N|LEM:wayol|M|INDEF|NOM★l~ilomuSal~iyna⚓to those who pray,⚓ N|ACT|PCPL|(II)|LEM:muSal~iyn|ROOT:Slw|MP|GEN★",
"{l~a*iyna⚓Those who⚓REL|LEM:{l~a*iY|MP★humo⚓[they]⚓ PRON|3MP★Ean⚓of⚓ P|LEM:Ean★SalaAtihimo⚓their prayers⚓ N|LEM:Salaw`p|ROOT:Slw|F|GEN★saAhuwna⚓(are) neglectful,⚓ N|ACT|PCPL|LEM:saAhuwn|ROOT:shw|MP|NOM★",
"{l~a*iyna⚓Those who⚓REL|LEM:{l~a*iY|MP★humo⚓[they]⚓ PRON|3MP★yuraA^'uwna⚓make show.⚓ V|IMPF|(III)|LEM:yuraA^'u|ROOT:rAy|3MP★",
"wayamonaEuwna⚓And they deny⚓V|IMPF|LEM:m~anaEa|ROOT:mnE|3MP★{lomaAEuwna⚓[the] small kindness.⚓ N|LEM:maAEuwn|ROOT:mEn|M|ACC★",
"",




"<in~aA^⚓Indeed, We⚓ACC|LEM:<in~|SP:<in~★>aEoTayona`ka⚓have given you⚓ V|PERF|(IV)|LEM:>aEoTaY`|ROOT:ETw|1P★{lokawovara⚓Al-Kauthar,⚓ N|LEM:kawovar|ROOT:kvr|M|ACC★",
"faSal~i⚓So pray⚓V|IMPV|(II)|LEM:Sal~aY`|ROOT:Slw|2MS★lirab~ika⚓to your Lord⚓ N|LEM:rab~|ROOT:rbb|M|GEN★wa{noHaro⚓and sacrifice.⚓ V|IMPV|LEM:{noHaro|ROOT:nHr|2MS★",
"<in~a⚓Indeed,⚓ACC|LEM:<in~|SP:<in~★$aAni}aka⚓your enemy -⚓ N|ACT|PCPL|LEM:$aAni}|ROOT:$nA|M|ACC★huwa⚓he (is)⚓ PRON|3MS★{lo>abotaru⚓the one cut off.⚓ N|LEM:>abotar|ROOT:btr|M|NOM★",
"",



"qulo⚓Say,⚓V|IMPV|LEM:qaAla|ROOT:qwl|2MS★ya`^>ay~uhaA⚓**`O disbelievers!⚓ N|LEM:>ay~uhaA|NOM★{loka`firuwna⚓**`O disbelievers!⚓ N|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|NOM★",
"laA^⚓Not⚓NEG|LEM:laA★>aEobudu⚓I worship⚓ V|IMPF|LEM:Eabada|ROOT:Ebd|1S★maA⚓what⚓ REL|LEM:maA★taEobuduwna⚓you worship.⚓ V|IMPF|LEM:Eabada|ROOT:Ebd|2MP★",
"walaA^⚓And not⚓NEG|LEM:laA★>antumo⚓you⚓ PRON|2MP★Ea`biduwna⚓(are) worshippers⚓ N|ACT|PCPL|LEM:EaAbid|ROOT:Ebd|MP|NOM★maA^⚓(of) what⚓ REL|LEM:maA★>aEobudu⚓I worship⚓ V|IMPF|LEM:Eabada|ROOT:Ebd|1S★",
'walaA^⚓And not⚓NEG|LEM:laA★>anaA"⚓I am⚓ PRON|1S★EaAbidN⚓a worshipper⚓ N|ACT|PCPL|LEM:EaAbid|ROOT:Ebd|M|INDEF|NOM★m~aA⚓(of) what⚓ REL|LEM:maA★Eabadt~umo⚓you worship.⚓ V|PERF|LEM:Eabada|ROOT:Ebd|2MP★',
"walaA^⚓And not⚓NEG|LEM:laA★>antumo⚓you are⚓ PRON|2MP★Ea`biduwna⚓worshippers⚓ N|ACT|PCPL|LEM:EaAbid|ROOT:Ebd|MP|NOM★maA^⚓(of) what⚓ REL|LEM:maA★>aEobudu⚓I worship.⚓ V|IMPF|LEM:Eabada|ROOT:Ebd|1S★",
"lakumo⚓For you⚓PRON|2MP★diynukumo⚓(is) your religion,⚓ N|LEM:diyn|ROOT:dyn|M|NOM★waliYa⚓and for me⚓ PRON|1S★diyni⚓(is) my religion.`⚓ N|LEM:diyn|ROOT:dyn|M|NOM★",
"",


"<i*aA⚓When⚓T|LEM:<i*aA★jaA^'a⚓comes⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3MS★naSoru⚓(the) Help⚓ N|LEM:naSor|ROOT:nSr|M|NOM★{ll~ahi⚓(of) Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wa{lofatoHu⚓and the Victory,⚓ N|LEM:fatoH|ROOT:ftH|M|NOM★",
"wara>ayota⚓And you see⚓V|PERF|LEM:ra'aA|ROOT:rAy|2MS★{ln~aAsa⚓the people⚓ N|LEM:n~aAs|ROOT:nws|MP|ACC★yadoxuluwna⚓entering⚓ V|IMPF|LEM:daxala|ROOT:dxl|3MP★fiY⚓into⚓ P|LEM:fiY★diyni⚓(the) religion⚓ N|LEM:diyn|ROOT:dyn|GEN★{ll~ahi⚓(of) Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★>afowaAjFA⚓(in) multitudes.⚓ N|LEM:fawoj|ROOT:fwj|P|INDEF|ACC★",
"fasab~iHo⚓Then glorify⚓V|IMPV|(II)|LEM:sab~aHa|ROOT:sbH|2MS★biHamodi⚓(the) praises⚓ N|LEM:Hamod|ROOT:Hmd|M|GEN★rab~ika⚓(of) your Lord⚓ N|LEM:rab~|ROOT:rbb|M|GEN★wa{sotagofirohu⚓and ask His forgiveness.⚓ V|IMPV|(X)|LEM:{sotagofara|ROOT:gfr|2MS★<in~ahu,⚓Indeed, He⚓ ACC|LEM:<in~|SP:<in~★kaAna⚓is⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★taw~aAbF[A⚓Oft-Returning.⚓ N|ACT|PCPL|LEM:taw~aAb|ROOT:twb|MS|INDEF|ACC★",
"",



"tab~ato⚓Perish⚓V|PERF|LEM:tab~a|ROOT:tbb|3FS★yadaA^⚓(the) hands⚓ N|LEM:yad|ROOT:ydy|FD|NOM★>abiY⚓**(of) Abu Lahab⚓ N|LEM:>abN|ROOT:Abw|MS|GEN★lahabK⚓**(of) Abu Lahab⚓ N|LEM:lahab|ROOT:lhb|M|INDEF|GEN★watab~a⚓and perish he.⚓ V|PERF|LEM:tab~a|ROOT:tbb|3MS★",
"maA^⚓Not⚓NEG|LEM:maA★>agonaY`⚓(will) avail⚓ V|PERF|LEM:>agonaY`|ROOT:gny|3MS★Eanohu⚓him⚓ P|LEM:Ean★maAluhu,⚓his wealth⚓ N|LEM:maAl|ROOT:mwl|M|NOM★wamaA⚓and what⚓ REL|LEM:maA★kasaba⚓he earned.⚓ V|PERF|LEM:kasaba|ROOT:ksb|3MS★",
"sayaSolaY`⚓He will be burnt⚓V|IMPF|LEM:yaSolaY|ROOT:Sly|3MS★naArFA⚓(in) a Fire⚓ N|LEM:naAr|ROOT:nwr|F|INDEF|ACC★*aAta⚓**of Blazing Flames,⚓ N|LEM:*uw|FS|ACC★lahabK⚓**of Blazing Flames,⚓ N|LEM:lahab|ROOT:lhb|M|INDEF|GEN★",
"wa{mora>atuhu,⚓And his wife,⚓N|LEM:{mora>at|ROOT:mrA|F|NOM★Ham~aAlapa⚓(the) carrier⚓ N|ACT|PCPL|LEM:Ham~aAlap|ROOT:Hml|FS|ACC★{loHaTabi⚓(of) firewood,⚓ N|LEM:HaTab|ROOT:HTb|M|GEN★",
"fiY⚓Around⚓P|LEM:fiY★jiydihaA⚓her neck⚓ N|LEM:jiyd|ROOT:jyd|M|GEN★HabolN⚓(will be) a rope⚓ N|LEM:Habol|ROOT:Hbl|M|INDEF|NOM★m~in⚓of⚓ P|LEM:min★m~asadK]⚓palm-fiber.⚓ N|LEM:m~asad|ROOT:msd|M|INDEF|GEN★",
"",


"qulo⚓Say,⚓V|IMPV|LEM:qaAla|ROOT:qwl|2MS★huwa⚓`He⚓ PRON|3MS★{ll~ahu⚓(is) Allah,⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★>aHadN⚓the One.⚓ N|LEM:>aHad|ROOT:AHd|M|INDEF|NOM★",
"{ll~ahu⚓Allah,⚓PN|LEM:{ll~ah|ROOT:Alh|NOM★{lS~amadu⚓the Eternal, the Absolute.⚓ N|LEM:S~amad|ROOT:Smd|MS|NOM★",
"lamo⚓Not⚓NEG|LEM:lam★yalido⚓He begets⚓ V|IMPF|LEM:walada|ROOT:wld|3MS|MOOD:JUS★walamo⚓and not⚓ NEG|LEM:lam★yuwlado⚓He is begotten.⚓ V|IMPF|PASS|LEM:walada|ROOT:wld|3MS|MOOD:JUS★",
"walamo⚓And not⚓NEG|LEM:lam★yakun⚓is⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS|MOOD:JUS★l~ahu,⚓for Him⚓ PRON|3MS★kufuwFA⚓**any [one] equivalent.`⚓ N|LEM:kufuw|ROOT:kfA|M|INDEF|ACC★>aHadN[⚓**any [one] equivalent.`⚓ N|LEM:>aHad|ROOT:AHd|M|INDEF|NOM★",
"",

"qulo⚓Say,⚓V|IMPV|LEM:qaAla|ROOT:qwl|2MS★>aEuw*u⚓`I seek refuge⚓ V|IMPF|LEM:Eu*o|ROOT:Ew*|1S★birab~i⚓in (the) Lord⚓ N|LEM:rab~|ROOT:rbb|M|GEN★{lofalaqi⚓(of) the dawn,⚓ N|LEM:falaq|ROOT:flq|M|GEN★",
"min⚓From⚓P|LEM:min★$ar~i⚓(the) evil⚓ N|LEM:$ar~|ROOT:$rr|MS|GEN★maA⚓(of) what⚓ REL|LEM:maA★xalaqa⚓He created,⚓ V|PERF|LEM:xalaqa|ROOT:xlq|3MS★",
"wamin⚓And from⚓P|LEM:min★$ar~i⚓(the) evil⚓ N|LEM:$ar~|ROOT:$rr|MS|GEN★gaAsiqK⚓(of) darkness⚓ N|ACT|PCPL|LEM:gaAsiq|ROOT:gsq|M|INDEF|GEN★<i*aA⚓when⚓ T|LEM:<i*aA★waqaba⚓it settles,⚓ V|PERF|LEM:waqaba|ROOT:wqb|3MS★",
"wamin⚓And from⚓P|LEM:min★$ar~i⚓(the) evil⚓ N|LEM:$ar~|ROOT:$rr|MS|GEN★{ln~af~a`va`ti⚓(of) the blowers⚓ N|LEM:n~af~a`va`t|ROOT:nfv|FP|GEN★fiY⚓in⚓ P|LEM:fiY★{loEuqadi⚓the knots,⚓ N|LEM:Euqodap|ROOT:Eqd|MP|GEN★",
"wamin⚓And from⚓P|LEM:min★$ar~i⚓(the) evil⚓ N|LEM:$ar~|ROOT:$rr|MS|GEN★HaAsidK⚓(of) an envier⚓ N|ACT|PCPL|LEM:HaAsid|ROOT:Hsd|M|INDEF|GEN★<i*aA⚓when⚓ T|LEM:<i*aA★Hasada⚓he envies.`⚓ V|PERF|LEM:Hasada|ROOT:Hsd|3MS★",
"",


"qulo⚓Say,⚓V|IMPV|LEM:qaAla|ROOT:qwl|2MS★>aEuw*u⚓`I seek refuge⚓ V|IMPF|LEM:Eu*o|ROOT:Ew*|1S★birab~i⚓in (the) Lord⚓ N|LEM:rab~|ROOT:rbb|M|GEN★{ln~aAsi⚓(of) mankind,⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★",
"maliki⚓(The) King⚓N|LEM:malik|ROOT:mlk|MS|GEN★{ln~aAsi⚓(of) mankind,⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★",
"<ila`hi⚓(The) God⚓N|LEM:<ila`h|ROOT:Alh|MS|GEN★{ln~aAsi⚓(of) mankind,⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★",
"min⚓From⚓P|LEM:min★$ar~i⚓(the) evil⚓ N|LEM:$ar~|ROOT:$rr|MS|GEN★{lowasowaAsi⚓(of) the whisperer,⚓ N|LEM:wasowaAs|ROOT:wsws|MS|GEN★{loxan~aAsi⚓the one who withdraws,⚓ ADJ|LEM:xan~aAs|ROOT:xns|MS|GEN★",
"{l~a*iY⚓The one who⚓REL|LEM:{l~a*iY|MS★yuwasowisu⚓whispers⚓ V|IMPF|LEM:wasowasa|ROOT:wsws|3MS★fiY⚓in⚓ P|LEM:fiY★Suduwri⚓(the) breasts⚓ N|LEM:Sador|ROOT:Sdr|MP|GEN★{ln~aAsi⚓(of) mankind,⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★",
"mina⚓From⚓P|LEM:min★{lojin~api⚓the jinn⚓ N|LEM:jin~ap|ROOT:jnn|F|GEN★wa{ln~aAsi⚓and men.⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★",



"Al^m^⚓Alif Laam Meem⚓INL★",
"*a`lika⚓That⚓DEM|LEM:*a`lik|MS★{lokita`bu⚓(is) the Book,⚓ N|LEM:kita`b|ROOT:ktb|M|NOM★laA⚓no⚓ NEG|LEM:laA|SP:<in~★rayoba⚓doubt⚓ N|LEM:rayob|ROOT:ryb|M|ACC★fiyhi⚓in it,⚓ P|LEM:fiY★hudFY⚓a Guidance⚓ N|LEM:hudFY|ROOT:hdy|M|INDEF|NOM★l~ilomut~aqiyna⚓for the God-conscious.⚓ N|ACT|PCPL|(VIII)|LEM:mut~aqiyn|ROOT:wqy|MP|GEN★",
"{l~a*iyna⚓Those who⚓REL|LEM:{l~a*iY|MP★yu&ominuwna⚓believe⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★bi{logayobi⚓in the unseen,⚓ N|LEM:gayob|ROOT:gyb|M|GEN★wayuqiymuwna⚓and establish⚓ V|IMPF|(IV)|LEM:>aqaAma|ROOT:qwm|3MP★{lS~alaw`pa⚓the prayer,⚓ N|LEM:Salaw`p|ROOT:Slw|F|ACC★wamim~aA⚓and out of what⚓ P|LEM:min★razaqona`humo⚓We have provided them⚓ REL|LEM:maA★yunfiquwna⚓they spend.⚓ V|PERF|LEM:razaqa|ROOT:rzq|1P★",
"wa{l~a*iyna⚓And those who⚓V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|3MP★yu&ominuwna⚓believe⚓ REL|LEM:{l~a*iY|MP★bimaA^⚓in what⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★>unzila⚓(is) sent down⚓ REL|LEM:maA★<ilayoka⚓to you⚓ V|PERF|PASS|(IV)|LEM:>anzala|ROOT:nzl|3MS★wamaA^⚓and what⚓ P|LEM:<ilaY`★>unzila⚓was sent down⚓ REL|LEM:maA★min⚓**before you,⚓ V|PERF|PASS|(IV)|LEM:>anzala|ROOT:nzl|3MS★qabolika⚓**before you,⚓ P|LEM:min★wabi{lo'aAxirapi⚓and in the Hereafter⚓ N|LEM:qabol|ROOT:qbl|GEN★humo⚓they⚓ N|LEM:A^xir|ROOT:Axr|FS|GEN★yuwqinuwna⚓firmly believe.⚓ PRON|3MP★",
">uw@la`^}ika⚓Those⚓V|IMPF|(IV)|LEM:yuwqinu|ROOT:yqn|3MP★EalaY`⚓(are) on⚓ DEM|LEM:>uwla`^}ik|P★hudFY⚓Guidance⚓ P|LEM:EalaY`★m~in⚓from⚓ N|LEM:hudFY|ROOT:hdy|M|INDEF|GEN★r~ab~ihimo⚓their Lord,⚓ P|LEM:min★wa>uw@la`^}ika⚓and those -⚓ N|LEM:rab~|ROOT:rbb|M|GEN★humu⚓they⚓ DEM|LEM:>uwla`^}ik|P★{lomufoliHuwna⚓(are) the successful ones.⚓ PRON|3MP★",
"<in~a⚓Indeed,⚓N|ACT|PCPL|(IV)|LEM:mufoliHuwn|ROOT:flH|MP|NOM★{l~a*iyna⚓those who⚓ ACC|LEM:<in~|SP:<in~★kafaruwA@⚓disbelieve[d],⚓ REL|LEM:{l~a*iY|MP★sawaA^'N⚓(it) is same⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★Ealayohimo⚓to them⚓ N|LEM:sawaA^'|ROOT:swy|M|INDEF|NOM★'a>an*arotahumo⚓whether you warn them⚓ P|LEM:EalaY`★>amo⚓or⚓ V|PERF|(IV)|LEM:>an*ara|ROOT:n*r|2MS★lamo⚓not⚓ CONJ|LEM:>am★tun*irohumo⚓you warn them,⚓ NEG|LEM:lam★laA⚓not⚓ V|IMPF|(IV)|LEM:>an*ara|ROOT:n*r|2MS|MOOD:JUS★yu&ominuwna⚓they believe.⚓ NEG|LEM:laA★",
"xatama⚓**Allah has set a seal⚓V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★{ll~ahu⚓**Allah has set a seal⚓ V|PERF|LEM:xatama|ROOT:xtm|3MS★EalaY`⚓on⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★quluwbihimo⚓their hearts⚓ P|LEM:EalaY`★waEalaY`⚓and on⚓ N|LEM:qalob|ROOT:qlb|FP|GEN★samoEihimo⚓their hearing,⚓ P|LEM:EalaY`★waEalaY`^⚓and on⚓ N|LEM:samoE|ROOT:smE|M|GEN★>aboSa`rihimo⚓their vision⚓ P|LEM:EalaY`★gi$a`wapN⚓(is) a veil.⚓ N|LEM:baSar|ROOT:bSr|MP|GEN★walahumo⚓And for them⚓ N|LEM:gi$a`wap|ROOT:g$w|F|INDEF|NOM★Ea*aAbN⚓(is) a punishment⚓ PRON|3MP★EaZiymN⚓great.⚓ N|LEM:Ea*aAb|ROOT:E*b|M|INDEF|NOM★",
"wamina⚓And of⚓ADJ|LEM:EaZiym|ROOT:EZm|MS|INDEF|NOM★{ln~aAsi⚓the people⚓ P|LEM:min★man⚓(are some) who⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★yaquwlu⚓say,⚓ REL|LEM:man★'aAman~aA⚓`We believed⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MS★bi{ll~ahi⚓in Allah⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|1P★wabi{loyawomi⚓and in the Day⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★{lo'aAxiri⚓[the] Last,`⚓ N|LEM:yawom|ROOT:ywm|M|GEN★wamaA⚓but not⚓ ADJ|LEM:A^xir|ROOT:Axr|MS|GEN★hum⚓they⚓ NEG|LEM:maA|SP:kaAn★bimu&ominiyna⚓(are) believers (at all).⚓ PRON|3MP★",
"yuxa`diEuwna⚓**They seek to deceive Allah⚓N|ACT|PCPL|(IV)|LEM:mu&omin|ROOT:Amn|MP|GEN★{ll~aha⚓**They seek to deceive Allah⚓ V|IMPF|(III)|LEM:yuxa`diEu|ROOT:xdE|3MP★wa{l~a*iyna⚓and those who⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★'aAmanuwA@⚓believe[d],⚓ REL|LEM:{l~a*iY|MP★wamaA⚓and not⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★yaxodaEuwna⚓they deceive⚓ NEG|LEM:maA★<il~aA^⚓except⚓ V|IMPF|LEM:yaxodaEu|ROOT:xdE|3MP★>anfusahumo⚓themselves,⚓ RES|LEM:<il~aA★wamaA⚓and not⚓ N|LEM:nafos|ROOT:nfs|FP|ACC★ya$oEuruwna⚓they realize (it).⚓ NEG|LEM:maA★",
"fiY⚓In⚓V|IMPF|LEM:ya$oEuru|ROOT:$Er|3MP★quluwbihim⚓their hearts⚓ P|LEM:fiY★m~araDN⚓(is) a disease,⚓ N|LEM:qalob|ROOT:qlb|FP|GEN★fazaAdahumu⚓**so Allah increased them⚓ N|LEM:m~araD|ROOT:mrD|M|INDEF|NOM★{ll~ahu⚓**so Allah increased them⚓ V|PERF|LEM:zaAda|ROOT:zyd|3MS★maraDFA⚓(in) disease;⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★walahumo⚓and for them⚓ N|LEM:m~araD|ROOT:mrD|M|INDEF|ACC★Ea*aAbN⚓(is) a punishment⚓ PRON|3MP★>aliymN[⚓painful⚓ N|LEM:Ea*aAb|ROOT:E*b|M|INDEF|NOM★bimaA⚓because⚓ ADJ|LEM:>aliym|ROOT:Alm|MS|INDEF|NOM★kaAnuwA@⚓they used (to)⚓ REL|LEM:maA★yako*ibuwna⚓[they] lie.⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★",
"wa<i*aA⚓And when⚓V|IMPF|LEM:ka*aba|ROOT:k*b|3MP★qiyla⚓it is said⚓ T|LEM:<i*aA★lahumo⚓to them,⚓ V|PERF|PASS|LEM:qaAla|ROOT:qwl|3MS★laA⚓`(Do) not⚓ PRON|3MP★tufosiduwA@⚓spread corruption⚓ PRO|LEM:laA★fiY⚓in⚓ V|IMPF|(IV)|LEM:>afosadu|ROOT:fsd|2MP|MOOD:JUS★{lo>aroDi⚓the earth,`⚓ P|LEM:fiY★qaAluw^A@⚓they say,⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★<in~amaA⚓`Only⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★naHonu⚓we⚓ ACC|LEM:<in~|SP:<in~★muSoliHuwna⚓(are) reformers.`⚓ PREV|LEM:maA★",
">alaA^⚓Beware,⚓PRON|1P★<in~ahumo⚓indeed they⚓ N|ACT|PCPL|(IV)|LEM:muSoliH|ROOT:SlH|MP|NOM★humu⚓themselves⚓ INC|LEM:>alaA^★{lomufosiduwna⚓(are) the ones who spread corruption,⚓ ACC|LEM:<in~|SP:<in~★wala`kin⚓[and] but⚓ PRON|3MP★l~aA⚓not⚓ N|ACT|PCPL|(IV)|LEM:mufosid|ROOT:fsd|MP|NOM★ya$oEuruwna⚓they realize (it).⚓ AMD|LEM:la`kin★",
"wa<i*aA⚓And when⚓NEG|LEM:laA★qiyla⚓it is said⚓ V|IMPF|LEM:ya$oEuru|ROOT:$Er|3MP★lahumo⚓to them,⚓ T|LEM:<i*aA★'aAminuwA@⚓`Believe⚓ V|PERF|PASS|LEM:qaAla|ROOT:qwl|3MS★kamaA^⚓as⚓ PRON|3MP★'aAmana⚓believed⚓ V|IMPV|(IV)|LEM:'aAmana|ROOT:Amn|2MP★{ln~aAsu⚓the people,`⚓ SUB|LEM:maA★qaAluw^A@⚓they say,⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MS★>anu&ominu⚓`Should we believe⚓ N|LEM:n~aAs|ROOT:nws|MP|NOM★kamaA^⚓as⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★'aAmana⚓believed⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|1P★{ls~ufahaA^'u⚓the fools?`⚓ SUB|LEM:maA★>alaA^⚓Beware,⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MS★<in~ahumo⚓certainly they⚓ N|LEM:safiyh|ROOT:sfh|MP|NOM★humu⚓themselves⚓ INC|LEM:>alaA^★{ls~ufahaA^'u⚓(are) the fools⚓ ACC|LEM:<in~|SP:<in~★wala`kin⚓[and] but⚓ PRON|3MP★l~aA⚓not⚓ N|LEM:safiyh|ROOT:sfh|MP|NOM★yaEolamuwna⚓they know.⚓ AMD|LEM:la`kin★",
"wa<i*aA⚓And when⚓NEG|LEM:laA★laquwA@⚓they meet⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MP★{l~a*iyna⚓those who⚓ T|LEM:<i*aA★'aAmanuwA@⚓believe[d],⚓ V|PERF|LEM:laqu|ROOT:lqy|3MP★qaAluw^A@⚓they say,⚓ REL|LEM:{l~a*iY|MP★'aAman~aA⚓`We believe[d].`⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★wa<i*aA⚓But when⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★xalawoA@⚓they are alone⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|1P★<ilaY`⚓with⚓ T|LEM:<i*aA★$aya`Tiynihimo⚓their evil ones,⚓ V|PERF|LEM:xalaA|ROOT:xlw|3MP★qaAluw^A@⚓they say,⚓ P|LEM:<ilaY`★<in~aA⚓`Indeed, we⚓ N|LEM:$ayoTa`n|ROOT:$Tn|MP|GEN★maEakumo⚓(are) with you,⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★<in~amaA⚓only⚓ ACC|LEM:<in~|SP:<in~★naHonu⚓we⚓ LOC|LEM:maE|ACC★musotahozi'uwna⚓(are) mockers.`⚓ ACC|LEM:<in~|SP:<in~★",
"{ll~ahu⚓Allah⚓PREV|LEM:maA★yasotahozi}u⚓mocks⚓ PRON|1P★bihimo⚓at them,⚓ N|ACT|PCPL|(X)|LEM:musotahozi'uwn|ROOT:hzA|MP|NOM★wayamud~uhumo⚓and prolongs them⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★fiY⚓in⚓ V|IMPF|(X)|LEM:{sotuhozi}a|ROOT:hzA|3MS★Tugoya`nihimo⚓their transgression,⚓ PRON|3MP★yaEomahuwna⚓they wander blindly.⚓ V|IMPF|LEM:mad~a|ROOT:mdd|3MS★",
">uw@la`^}ika⚓Those⚓P|LEM:fiY★{l~a*iyna⚓(are) the ones who⚓ N|VN|LEM:Tugoya`n|ROOT:Tgy|M|GEN★{$otarawuA@⚓bought⚓ V|IMPF|LEM:yaEomahu|ROOT:Emh|3MP★{lD~ala`lapa⚓[the] astraying⚓ DEM|LEM:>uwla`^}ik|P★bi{lohudaY`⚓for [the] guidance.⚓ REL|LEM:{l~a*iY|MP★famaA⚓So not⚓ V|PERF|(VIII)|LEM:{$otaraY`|ROOT:$ry|3MP★rabiHat⚓profited⚓ N|LEM:Dala`lap|ROOT:Dll|F|ACC★t~ija`ratuhumo⚓their commerce⚓ N|LEM:hudFY|ROOT:hdy|M|GEN★wamaA⚓and not⚓ NEG|LEM:maA★kaAnuwA@⚓were they⚓ V|PERF|LEM:rabiHat|ROOT:rbH|3FS★muhotadiyna⚓guided-ones.⚓ N|LEM:tija`rap|ROOT:tjr|F|NOM★",
"mavaluhumo⚓Their example⚓NEG|LEM:maA★kamavali⚓(is) like (the) example⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★{l~a*iY⚓(of) the one who⚓ N|ACT|PCPL|(VIII)|LEM:m~uhotaduwn|ROOT:hdy|MP|ACC★{sotawoqada⚓kindled⚓ N|LEM:maval|ROOT:mvl|M|NOM★naArFA⚓a fire,⚓ N|LEM:maval|ROOT:mvl|M|GEN★falam~aA^⚓then, when⚓ REL|LEM:{l~a*iY|MS★>aDaA^'ato⚓it lighted⚓ V|PERF|(X)|LEM:{sotawoqada|ROOT:wqd|3MS★maA⚓**his surroundings,⚓ N|LEM:naAr|ROOT:nwr|F|INDEF|ACC★Hawolahu,⚓**his surroundings,⚓ T|LEM:lam~aA★*ahaba⚓**Allah took away⚓ V|PERF|(IV)|LEM:>aDaA^'a|ROOT:DwA|3FS★{ll~ahu⚓**Allah took away⚓ REL|LEM:maA★binuwrihimo⚓their light⚓ LOC|LEM:Hawol|ROOT:Hwl|M|ACC★watarakahumo⚓and left them⚓ V|PERF|LEM:*ahaba|ROOT:*hb|3MS★fiY⚓in⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★Zuluma`tK⚓darkness[es],⚓ N|LEM:nuwr|ROOT:nwr|M|GEN★l~aA⚓**(so) they (do) not see.⚓ V|PERF|LEM:taraka|ROOT:trk|3MS★yuboSiruwna⚓**(so) they (do) not see.⚓ P|LEM:fiY★",
"Sum~N[⚓Deaf,⚓N|LEM:Zuluma`t|ROOT:Zlm|FP|INDEF|GEN★bukomN⚓dumb,⚓ NEG|LEM:laA★EumoYN⚓blind,⚓ V|IMPF|(IV)|LEM:>aboSara|ROOT:bSr|3MP★fahumo⚓so they⚓ N|LEM:>aSam~|ROOT:Smm|P|INDEF|NOM★laA⚓**[they] will not return.⚓ N|LEM:>abokam|ROOT:bkm|P|INDEF|NOM★yarojiEuwna⚓**[they] will not return.⚓ N|LEM:>aEomaY`|ROOT:Emy|MP|INDEF|NOM★",
">awo⚓Or⚓PRON|3MP★kaSay~ibK⚓like a rainstorm⚓ NEG|LEM:laA★m~ina⚓from⚓ V|IMPF|LEM:rajaEa|ROOT:rjE|3MP★{ls~amaA^'i⚓the sky⚓ CONJ|LEM:>aw★fiyhi⚓in it (are)⚓ N|LEM:Say~ib|ROOT:Swb|M|INDEF|GEN★Zuluma`tN⚓darkness[es],⚓ P|LEM:min★waraEodN⚓and thunder,⚓ N|LEM:samaA^'|ROOT:smw|F|GEN★wabaroqN⚓and lightning.⚓ P|LEM:fiY★yajoEaluwna⚓They put⚓ N|LEM:Zuluma`t|ROOT:Zlm|FP|INDEF|NOM★>aSa`biEahumo⚓their fingers⚓ N|LEM:raEod|ROOT:rEd|M|INDEF|NOM★fiY^⚓in⚓ N|LEM:baroq|ROOT:brq|M|INDEF|NOM★'aA*aAnihim⚓their ears⚓ V|IMPF|LEM:jaEala|ROOT:jEl|3MP★m~ina⚓from⚓ N|LEM:>aSa`biE|ROOT:SbE|MP|ACC★{lS~awa`Eiqi⚓the thunderclaps⚓ P|LEM:fiY★Ha*ara⚓(in) fear (of)⚓ N|LEM:>u*unN|ROOT:A*n|FP|GEN★{lomawoti⚓[the] death.⚓ P|LEM:min★wa{ll~ahu⚓And Allah⚓ N|LEM:SaAEiqap|ROOT:SEq|FP|GEN★muHiyTN[⚓(is) [the One Who] encompasses⚓ N|VN|LEM:Ha*ar|ROOT:H*r|M|ACC★bi{loka`firiyna⚓the disbelievers.⚓ N|LEM:mawot|ROOT:mwt|M|GEN★",
"yakaAdu⚓Almost⚓PN|LEM:{ll~ah|ROOT:Alh|NOM★{lobaroqu⚓the lightning⚓ N|ACT|PCPL|(IV)|LEM:muHiyT|ROOT:HwT|M|INDEF|NOM★yaxoTafu⚓snatches away⚓ N|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|GEN★>aboSa`rahumo⚓their sight.⚓ V|IMPF|LEM:kaAda|ROOT:kwd|SP:kaAd|3MS★kul~amaA^⚓Whenever⚓ N|LEM:baroq|ROOT:brq|M|NOM★>aDaA^'a⚓it flashes⚓ V|IMPF|LEM:xaTifa|ROOT:xTf|3MS★lahum⚓for them⚓ N|LEM:baSar|ROOT:bSr|MP|ACC★m~a$awoA@⚓they walk⚓ T|LEM:kul~amaA|ROOT:kll★fiyhi⚓in it,⚓ V|PERF|(IV)|LEM:>aDaA^'a|ROOT:DwA|3MS★wa<i*aA^⚓and when⚓ PRON|3MP★>aZolama⚓it darkens⚓ V|PERF|LEM:m~a$a|ROOT:m$y|3MP★Ealayohimo⚓on them⚓ P|LEM:fiY★qaAmuwA@⚓they stand (still).⚓ T|LEM:<i*aA★walawo⚓And if⚓ V|PERF|(IV)|LEM:>aZolama|ROOT:Zlm|3MS★$aA^'a⚓**Allah had willed,⚓ P|LEM:EalaY`★{ll~ahu⚓**Allah had willed,⚓ V|PERF|LEM:qaAma|ROOT:qwm|3MP★la*ahaba⚓He would certainly have taken away⚓ COND|LEM:law★bisamoEihimo⚓their hearing,⚓ V|PERF|LEM:$aA^'a|ROOT:$yA|3MS★wa>aboSa`rihimo⚓and their sight.⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★<in~a⚓Indeed,⚓ V|PERF|LEM:*ahaba|ROOT:*hb|3MS★{ll~aha⚓Allah⚓ N|LEM:samoE|ROOT:smE|M|GEN★EalaY`⚓(is) on⚓ N|LEM:baSar|ROOT:bSr|MP|GEN★kul~i⚓every⚓ ACC|LEM:<in~|SP:<in~★$aYo'K⚓thing⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★qadiyrN⚓All-Powerful.⚓ P|LEM:EalaY`★",
"ya`^>ay~uhaA⚓**O mankind!⚓N|LEM:kul~|ROOT:kll|M|GEN★{ln~aAsu⚓**O mankind!⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★{EobuduwA@⚓worship⚓ N|LEM:qadiyr|ROOT:qdr|M|INDEF|NOM★rab~akumu⚓your Lord,⚓ N|LEM:>ay~uhaA|NOM★{l~a*iY⚓the One Who⚓ N|LEM:n~aAs|ROOT:nws|MP|NOM★xalaqakumo⚓created you⚓ V|IMPV|LEM:Eabada|ROOT:Ebd|2MP★wa{l~a*iyna⚓and those [who]⚓ N|LEM:rab~|ROOT:rbb|M|ACC★min⚓**before you,⚓ REL|LEM:{l~a*iY|MS★qabolikumo⚓**before you,⚓ V|PERF|LEM:xalaqa|ROOT:xlq|3MS★laEal~akumo⚓so that you may⚓ REL|LEM:{l~a*iY|MP★tat~aquwna⚓become righteous.⚓ P|LEM:min★",
"{l~a*iY⚓The One Who⚓N|LEM:qabol|ROOT:qbl|GEN★jaEala⚓made⚓ ACC|LEM:laEal~|SP:<in~★lakumu⚓for you⚓ V|IMPF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★{lo>aroDa⚓the earth⚓ REL|LEM:{l~a*iY|MS★fira`$FA⚓a resting place⚓ V|PERF|LEM:jaEala|ROOT:jEl|3MS★wa{ls~amaA^'a⚓and the sky⚓ PRON|2MP★binaA^'F⚓a canopy,⚓ N|LEM:>aroD|ROOT:ArD|F|ACC★wa>anzala⚓and sent down⚓ N|LEM:fira`$|ROOT:fr$|M|INDEF|ACC★mina⚓from⚓ N|LEM:samaA^'|ROOT:smw|F|ACC★{ls~amaA^'i⚓the sky⚓ N|LEM:binaA^'|ROOT:bny|M|INDEF|ACC★maA^'F⚓water,⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|3MS★fa>axoraja⚓then brought forth⚓ P|LEM:min★bihi.⚓therewith⚓ N|LEM:samaA^'|ROOT:smw|F|GEN★mina⚓[of]⚓ N|LEM:maA^'|ROOT:mwh|M|INDEF|ACC★{lv~amara`ti⚓the fruits⚓ V|PERF|(IV)|LEM:>axoraja|ROOT:xrj|3MS★rizoqFA⚓(as) provision⚓ PRON|3MS★l~akumo⚓for you.⚓ P|LEM:min★falaA⚓So (do) not⚓ N|LEM:vamara`t|ROOT:vmr|FP|GEN★tajoEaluwA@⚓set up⚓ N|LEM:rizoq|ROOT:rzq|M|INDEF|ACC★lil~ahi⚓to Allah⚓ PRON|2MP★>andaAdFA⚓rivals⚓ PRO|LEM:laA★wa>antumo⚓while you⚓ V|IMPF|LEM:jaEala|ROOT:jEl|2MP|MOOD:JUS★taEolamuwna⚓[you] know.⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★",
"wa<in⚓And if⚓N|LEM:>andaAd|ROOT:ndd|MP|INDEF|ACC★kuntumo⚓you are⚓ PRON|2MP★fiY⚓in⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★rayobK⚓doubt⚓ COND|LEM:<in★m~im~aA⚓about what⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★naz~alonaA⚓We have revealed⚓ P|LEM:fiY★EalaY`⚓to⚓ N|LEM:rayob|ROOT:ryb|M|INDEF|GEN★EabodinaA⚓Our slave,⚓ P|LEM:min★fa>otuwA@⚓then produce⚓ REL|LEM:maA★bisuwrapK⚓a chapter⚓ V|PERF|(II)|LEM:naz~ala|ROOT:nzl|1P★m~in⚓[of]⚓ P|LEM:EalaY`★m~ivolihi.⚓like it⚓ N|LEM:Eabod|ROOT:Ebd|M|GEN★wa{doEuwA@⚓and call⚓ V|IMPV|LEM:>ataY|ROOT:Aty|2MP★$uhadaA^'akum⚓your witnesses⚓ N|LEM:suwrap|ROOT:swr|F|INDEF|GEN★m~in⚓**other than⚓ P|LEM:min★duwni⚓**other than⚓ N|LEM:mivol|ROOT:mvl|M|GEN★{ll~ahi⚓Allah⚓ V|IMPV|LEM:daEaA|ROOT:dEw|2MP★<in⚓if⚓ N|LEM:$ahiyd|ROOT:$hd|MP|ACC★kuntumo⚓you are⚓ P|LEM:min★Sa`diqiyna⚓truthful.⚓ N|LEM:duwn|ROOT:dwn|GEN★",
"fa<in⚓But if⚓PN|LEM:{ll~ah|ROOT:Alh|GEN★l~amo⚓not⚓ COND|LEM:<in★tafoEaluwA@⚓you do,⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★walan⚓and never⚓ N|ACT|PCPL|LEM:SaAdiq|ROOT:Sdq|MP|ACC★tafoEaluwA@⚓will you do,⚓ COND|LEM:<in★fa{t~aquwA@⚓then fear⚓ NEG|LEM:lam★{ln~aAra⚓the Fire⚓ V|IMPF|LEM:faEala|ROOT:fEl|2MP|MOOD:JUS★{l~atiY⚓whose⚓ NEG|LEM:lan★waquwduhaA⚓[its] fuel⚓ V|IMPF|LEM:faEala|ROOT:fEl|2MP|MOOD:SUBJ★{ln~aAsu⚓(is) [the] men⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★wa{loHijaArapu⚓and [the] stones,⚓ N|LEM:naAr|ROOT:nwr|F|ACC★>uEid~ato⚓prepared⚓ REL|LEM:{l~a*iY|FS★liloka`firiyna⚓for the disbelievers.⚓ N|LEM:waquwd|ROOT:wqd|M|NOM★",
"waba$~iri⚓And give good news⚓N|LEM:n~aAs|ROOT:nws|MP|NOM★{l~a*iyna⚓(to) those who⚓ N|LEM:HijaArap|ROOT:Hjr|F|NOM★'aAmanuwA@⚓believe,⚓ V|PERF|PASS|(IV)|LEM:>aEad~a|ROOT:Edd|3FS★waEamiluwA@⚓and do⚓ N|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|GEN★{lS~a`liHa`ti⚓[the] righteous deeds,⚓ V|IMPV|(II)|LEM:bu$~ira|ROOT:b$r|2MS★>an~a⚓that⚓ REL|LEM:{l~a*iY|MP★lahumo⚓for them⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★jan~a`tK⚓(will be) Gardens,⚓ V|PERF|LEM:Eamila|ROOT:Eml|3MP★tajoriY⚓flow⚓ N|ACT|PCPL|LEM:S~a`liHa`t|ROOT:SlH|FP|ACC★min⚓[from]⚓ ACC|LEM:>an~|SP:<in~★taHotihaA⚓under them⚓ PRON|3MP★{lo>anoha`ru⚓the rivers.⚓ N|LEM:jan~ap|ROOT:jnn|FP|INDEF|ACC★kul~amaA⚓Every time⚓ V|IMPF|LEM:jarayo|ROOT:jry|3FS★ruziquwA@⚓they are provided⚓ P|LEM:min★minohaA⚓therefrom⚓ N|LEM:taHot|ROOT:tHt|GEN★min⚓of⚓ N|LEM:nahar|ROOT:nhr|MP|NOM★vamarapK⚓fruit⚓ T|LEM:kul~amaA|ROOT:kll★r~izoqFA⚓(as) provision,⚓ V|PERF|PASS|LEM:razaqa|ROOT:rzq|3MP★qaAluwA@⚓they (will) say,⚓ P|LEM:min★ha`*aA⚓`This (is)⚓ P|LEM:min★{l~a*iY⚓the one which⚓ N|LEM:vamarap|ROOT:vmr|F|INDEF|GEN★ruziqonaA⚓we were provided⚓ N|LEM:rizoq|ROOT:rzq|M|INDEF|ACC★min⚓**before.`⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★qabolu⚓**before.`⚓ DEM|LEM:ha`*aA|MS★wa>utuwA@⚓**And they will be given⚓ REL|LEM:{l~a*iY|MS★bihi.⚓**And they will be given⚓ V|PERF|PASS|LEM:razaqa|ROOT:rzq|1P★muta$a`bihFA⚓(things) in resemblance;⚓ P|LEM:min★walahumo⚓And for them⚓ N|LEM:qabol|ROOT:qbl|GEN★fiyhaA^⚓therein⚓ V|PERF|PASS|LEM:>ataY|ROOT:Aty|3MP★>azowa`jN⚓spouses⚓ PRON|3MS★m~uTah~arapN⚓purified,⚓ N|ACT|PCPL|(VI)|LEM:muta$a`bih|ROOT:$bh|M|INDEF|ACC★wahumo⚓and they⚓ PRON|3MP★fiyhaA⚓therein⚓ P|LEM:fiY★xa`liduwna⚓(will) abide forever.⚓ N|LEM:zawoj|ROOT:zwj|MP|INDEF|NOM★",
"<in~a⚓**Indeed, Allah⚓ADJ|PASS|PCPL|(II)|LEM:m~uTah~arap|ROOT:Thr|FS|INDEF|NOM★{ll~aha⚓**Indeed, Allah⚓ PRON|3MP★laA⚓**(is) not ashamed⚓ P|LEM:fiY★yasotaHoYi.^⚓**(is) not ashamed⚓ N|ACT|PCPL|LEM:xa`lid|ROOT:xld|MP|NOM★>an⚓**to set forth⚓ ACC|LEM:<in~|SP:<in~★yaDoriba⚓**to set forth⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★mavalFA⚓an example⚓ NEG|LEM:laA★m~aA⚓(like) even⚓ V|IMPF|(X)|LEM:yasotaHoYi.^|ROOT:Hyy|3MS★baEuwDapF⚓(of) a mosquito⚓ SUB|LEM:>an★famaA⚓and (even) something⚓ V|IMPF|LEM:Daraba|ROOT:Drb|3MS|MOOD:SUBJ★fawoqahaA⚓above it.⚓ N|LEM:maval|ROOT:mvl|M|INDEF|ACC★fa>am~aA⚓Then as for⚓ SUP|LEM:maA★{l~a*iyna⚓those who⚓ N|LEM:baEuwDap|ROOT:bED|F|INDEF|ACC★'aAmanuwA@⚓believed,⚓ REL|LEM:maA★fayaEolamuwna⚓[thus] they will know⚓ LOC|LEM:fawoq|ROOT:fwq|M|ACC★>an~ahu⚓that it⚓ EXL|LEM:>am~aA★{loHaq~u⚓(is) the truth⚓ COND|LEM:{l~a*iY|MP★min⚓from⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★r~ab~ihimo⚓their Lord.⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MP★wa>am~aA⚓And as for⚓ ACC|LEM:>an~|SP:<in~★{l~a*iyna⚓those who⚓ N|LEM:Haq~|ROOT:Hqq|M|NOM★kafaruwA@⚓disbelieved⚓ P|LEM:min★fayaquwluwna⚓[thus] they will say⚓ N|LEM:rab~|ROOT:rbb|M|GEN★maA*aA^⚓what⚓ EXL|LEM:>am~aA★>araAda⚓**(did) Allah intend⚓ COND|LEM:{l~a*iY|MP★{ll~ahu⚓**(did) Allah intend⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★biha`*aA⚓by this⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MP★mavalFA⚓example?⚓ INTG|LEM:maA*aA★yuDil~u⚓He lets go astray⚓ V|PERF|(IV)|LEM:>araAda|ROOT:rwd|3MS★bihi.⚓by it⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★kaviyrFA⚓many⚓ DEM|LEM:ha`*aA|MS★wayahodiY⚓and He guides⚓ N|LEM:maval|ROOT:mvl|M|INDEF|ACC★bihi.⚓by it⚓ V|IMPF|(IV)|LEM:>aDal~a|ROOT:Dll|3MS★kaviyrFA⚓many.⚓ PRON|3MS★wamaA⚓And not⚓ N|LEM:kaviyr|ROOT:kvr|MS|INDEF|ACC★yuDil~u⚓He lets go astray⚓ V|IMPF|LEM:hadaY|ROOT:hdy|3MS★bihi.^⚓by it⚓ PRON|3MS★<il~aA⚓except⚓ N|LEM:kaviyr|ROOT:kvr|MS|INDEF|ACC★{lofa`siqiyna⚓the defiantly disobedient.⚓ NEG|LEM:maA★",
"{l~a*iyna⚓Those who⚓V|IMPF|(IV)|LEM:>aDal~a|ROOT:Dll|3MS★yanquDuwna⚓break⚓ PRON|3MS★Eahoda⚓**(the) Covenant of Allah⚓ RES|LEM:<il~aA★{ll~ahi⚓**(the) Covenant of Allah⚓ N|ACT|PCPL|LEM:faAsiq|ROOT:fsq|MP|ACC★min[⚓**after⚓ REL|LEM:{l~a*iY|MP★baEodi⚓**after⚓ V|IMPF|LEM:naqaDato|ROOT:nqD|3MP★miyva`qihi.⚓its ratification,⚓ N|LEM:Eahod|ROOT:Ehd|M|ACC★wayaqoTaEuwna⚓and [they] cut⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★maA^⚓what⚓ P|LEM:min★>amara⚓**Allah has ordered⚓ N|LEM:baEod|ROOT:bEd|GEN★{ll~ahu⚓**Allah has ordered⚓ N|LEM:m~iyva`q|ROOT:wvq|M|GEN★bihi.^⚓it⚓ V|IMPF|LEM:quTiEa|ROOT:qTE|3MP★>an⚓**to be joined⚓ REL|LEM:maA★yuwSala⚓**to be joined⚓ V|PERF|LEM:>amara|ROOT:Amr|3MS★wayufosiduwna⚓and [they] spread corruption⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★fiY⚓**in the earth.⚓ PRON|3MS★{lo>aroDi⚓**in the earth.⚓ SUB|LEM:>an★>uw@la`^}ika⚓Those,⚓ V|IMPF|PASS|LEM:yaSilu|ROOT:wSl|3MS|MOOD:SUBJ★humu⚓they⚓ V|IMPF|(IV)|LEM:>afosadu|ROOT:fsd|3MP★{loxa`siruwna⚓(are) the losers.⚓ P|LEM:fiY★",
"kayofa⚓How⚓N|LEM:>aroD|ROOT:ArD|F|GEN★takofuruwna⚓(can) you disbelieve⚓ DEM|LEM:>uwla`^}ik|P★bi{ll~ahi⚓in Allah?⚓ PRON|3MP★wakuntumo⚓While you were⚓ N|ACT|PCPL|LEM:xa`siriyn|ROOT:xsr|MP|NOM★>amowa`tFA⚓dead⚓ INTG|LEM:kayof|ROOT:kyf★fa>aHoya`kumo⚓then He gave you life;⚓ V|IMPF|LEM:kafara|ROOT:kfr|2MP★vum~a⚓then⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★yumiytukumo⚓He will cause you to die,⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★vum~a⚓then⚓ N|LEM:m~ay~it|ROOT:mwt|MP|INDEF|ACC★yuHoyiykumo⚓He will give you life,⚓ V|PERF|(IV)|LEM:>aHoyaA|ROOT:Hyy|3MS★vum~a⚓then⚓ CONJ|LEM:vum~★<ilayohi⚓to Him⚓ V|IMPF|(IV)|LEM:>amaAta|ROOT:mwt|3MS★turojaEuwna⚓you will be returned.⚓ CONJ|LEM:vum~★",
"huwa⚓He⚓V|IMPF|(IV)|LEM:>aHoyaA|ROOT:Hyy|3MS★{l~a*iY⚓(is) the One Who⚓ CONJ|LEM:vum~★xalaqa⚓created⚓ P|LEM:<ilaY`★lakum⚓for you⚓ V|IMPF|PASS|LEM:rajaEa|ROOT:rjE|2MP★m~aA⚓what⚓ PRON|3MS★fiY⚓**(is) in the earth,⚓ REL|LEM:{l~a*iY|MS★{lo>aroDi⚓**(is) in the earth,⚓ V|PERF|LEM:xalaqa|ROOT:xlq|3MS★jamiyEFA⚓all.⚓ PRON|2MP★vum~a⚓Moreover⚓ REL|LEM:maA★{sotawaY`^⚓He turned⚓ P|LEM:fiY★<ilaY⚓to⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★{ls~amaA^'i⚓the heaven⚓ N|LEM:jamiyE|ROOT:jmE|M|INDEF|ACC★fasaw~aY`hun~a⚓and fashioned them⚓ CONJ|LEM:vum~★saboEa⚓seven⚓ V|PERF|(VIII)|LEM:{sotawaY`^|ROOT:swy|3MS★sama`wa`tK⚓heavens.⚓ P|LEM:<ilaY`★wahuwa⚓And He⚓ N|LEM:samaA^'|ROOT:smw|F|GEN★bikul~i⚓of every⚓ V|PERF|(II)|LEM:saw~aY`|ROOT:swy|3MS★$aYo'K⚓thing⚓ N|LEM:saboE|ROOT:sbE|M|ACC★EaliymN⚓(is) All-Knowing.⚓ N|LEM:samaA^'|ROOT:smw|FP|INDEF|GEN★",
"wa<i*o⚓And when⚓PRON|3MS★qaAla⚓said⚓ N|LEM:kul~|ROOT:kll|M|GEN★rab~uka⚓your Lord⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★lilomala`^}ikapi⚓to the angels,⚓ N|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★<in~iY⚓`Indeed, I (am)⚓ T|LEM:<i*★jaAEilN⚓going to place⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★fiY⚓in⚓ N|LEM:rab~|ROOT:rbb|M|NOM★{lo>aroDi⚓the earth⚓ N|LEM:malak|ROOT:mlk|MP|GEN★xaliyfapF⚓a vicegerent,⚓ ACC|LEM:<in~|SP:<in~★qaAluw^A@⚓they said,⚓ N|ACT|PCPL|LEM:jaAEil|ROOT:jEl|M|INDEF|NOM★>atajoEalu⚓`Will You place⚓ P|LEM:fiY★fiyhaA⚓in it⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★man⚓(one) who⚓ N|LEM:xaliyfap|ROOT:xlf|M|INDEF|ACC★yufosidu⚓will spread corruption⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★fiyhaA⚓in it⚓ V|IMPF|LEM:jaEala|ROOT:jEl|2MS★wayasofiku⚓and will shed⚓ P|LEM:fiY★{ld~imaA^'a⚓[the] blood[s],⚓ REL|LEM:man★wanaHonu⚓while we,⚓ V|IMPF|(IV)|LEM:>afosadu|ROOT:fsd|3MS★nusab~iHu⚓[we] glorify (You)⚓ P|LEM:fiY★biHamodika⚓with Your praises⚓ V|IMPF|LEM:yasofiku|ROOT:sfk|3MS★wanuqad~isu⚓and we sanctify⚓ N|LEM:dam|ROOT:dmw|MP|ACC★laka⚓[to] You.`⚓ PRON|1P★qaAla⚓He said,⚓ V|IMPF|(II)|LEM:sab~aHa|ROOT:sbH|1P★<in~iY^⚓`Indeed, I⚓ N|LEM:Hamod|ROOT:Hmd|M|GEN★>aEolamu⚓[I] know⚓ V|IMPF|(II)|LEM:nuqad~isu|ROOT:qds|1P★maA⚓what⚓ PRON|2MS★laA⚓**you (do) not know.`⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★taEolamuwna⚓**you (do) not know.`⚓ ACC|LEM:<in~|SP:<in~★",
"waEal~ama⚓And He taught⚓V|IMPF|LEM:Ealima|ROOT:Elm|1S★'aAdama⚓Adam⚓ REL|LEM:maA★{lo>asomaA^'a⚓the names -⚓ NEG|LEM:laA★kul~ahaA⚓all of them.⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★vum~a⚓Then⚓ V|PERF|(II)|LEM:Eal~ama|ROOT:Elm|3MS★EaraDahumo⚓He displayed them⚓ PN|LEM:A^dam|M|ACC★EalaY⚓to⚓ N|LEM:{som|ROOT:smw|MP|ACC★{lomala`^}ikapi⚓the angels,⚓ N|LEM:kul~|ROOT:kll|M|ACC★faqaAla⚓then He said,⚓ CONJ|LEM:vum~★>an[bi_#uwniY⚓`Inform Me⚓ V|PERF|LEM:EaraDa|ROOT:ErD|3MS★bi>asomaA^'i⚓of (the) names⚓ P|LEM:EalaY`★ha`^&ulaA^'i⚓(of) these,⚓ N|LEM:malak|ROOT:mlk|MP|GEN★<in⚓if⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★kuntumo⚓you are⚓ V|IMPV|(IV)|LEM:>an[ba>a|ROOT:nbA|2MP★Sa`diqiyna⚓truthful.`⚓ N|LEM:{som|ROOT:smw|MP|GEN★",
"qaAluwA@⚓They said,⚓DEM|LEM:ha`*aA|P★suboHa`naka⚓`Glory be to You!⚓ COND|LEM:<in★laA⚓**No knowledge⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★Eiloma⚓**No knowledge⚓ N|ACT|PCPL|LEM:SaAdiq|ROOT:Sdq|MP|ACC★lanaA^⚓(is) for us⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★<il~aA⚓except⚓ N|LEM:suboHa`n|ROOT:sbH|M|ACC★maA⚓what⚓ NEG|LEM:laA|SP:<in~★Eal~amotanaA^⚓You have taught us.⚓ N|LEM:Eilom|ROOT:Elm|M|ACC★<in~aka⚓Indeed You!⚓ PRON|1P★>anta⚓You⚓ EXP|LEM:<il~aA★{loEaliymu⚓(are) the All-Knowing,⚓ REL|LEM:maA★{loHakiymu⚓the All-Wise.⚓ V|PERF|(II)|LEM:Eal~ama|ROOT:Elm|2MS★",
"qaAla⚓He said,⚓ACC|LEM:<in~|SP:<in~★ya`^_#aAdamu⚓`O Adam!⚓ PRON|2MS★>an[bi}ohum⚓Inform them⚓ N|LEM:Ealiym|ROOT:Elm|MS|NOM★bi>asomaA^}ihimo⚓of their names.`⚓ ADJ|LEM:Hakiym|ROOT:Hkm|MS|NOM★falam~aA^⚓And when⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★>an[ba>ahum⚓he had informed them⚓ PN|LEM:A^dam|M|NOM★bi>asomaA^}ihimo⚓of their names,⚓ V|IMPV|(IV)|LEM:>an[ba>a|ROOT:nbA|2MS★qaAla⚓He said,⚓ N|LEM:{som|ROOT:smw|MP|GEN★>alamo⚓`Did not⚓ T|LEM:lam~aA★>aqul⚓I say⚓ V|PERF|(IV)|LEM:>an[ba>a|ROOT:nbA|3MS★l~akumo⚓to you,⚓ N|LEM:{som|ROOT:smw|MP|GEN★<in~iY^⚓Indeed, I⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★>aEolamu⚓[I] know⚓ NEG|LEM:lam★gayoba⚓(the) unseen⚓ V|IMPF|LEM:qaAla|ROOT:qwl|1S|MOOD:JUS★{ls~ama`wa`ti⚓(of) the heavens⚓ PRON|2MP★wa{lo>aroDi⚓and the earth,⚓ ACC|LEM:<in~|SP:<in~★wa>aEolamu⚓and I know⚓ V|IMPF|LEM:Ealima|ROOT:Elm|1S★maA⚓what⚓ N|LEM:gayob|ROOT:gyb|M|ACC★tuboduwna⚓you reveal⚓ N|LEM:samaA^'|ROOT:smw|FP|GEN★wamaA⚓and what⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★kuntumo⚓you [were]⚓ V|IMPF|LEM:Ealima|ROOT:Elm|1S★takotumuwna⚓conceal.`⚓ REL|LEM:maA★",
"wa<i*o⚓And when⚓V|IMPF|(IV)|LEM:yubodiYa|ROOT:bdw|2MP★qulonaA⚓We said⚓ REL|LEM:maA★lilomala`^}ikapi⚓to the angels,⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★{sojuduwA@⚓`Prostrate⚓ V|IMPF|LEM:katama|ROOT:ktm|2MP★li'aAdama⚓to Adam,`⚓ T|LEM:<i*★fasajaduw^A@⚓[so] they prostrated⚓ V|PERF|LEM:qaAla|ROOT:qwl|1P★<il~aA^⚓except⚓ N|LEM:malak|ROOT:mlk|MP|GEN★<iboliysa⚓Iblees.⚓ V|IMPV|LEM:sajada|ROOT:sjd|2MP★>abaY`⚓He refused⚓ PN|LEM:A^dam|M|GEN★wa{sotakobara⚓and was arrogant⚓ V|PERF|LEM:sajada|ROOT:sjd|3MP★wakaAna⚓and became⚓ EXP|LEM:<il~aA★mina⚓of⚓ PN|LEM:<iboliys|M|ACC★{loka`firiyna⚓the disbelievers.⚓ V|PERF|LEM:>abaY|ROOT:Aby|3MS★",
"waqulonaA⚓And We said,⚓V|PERF|(X)|LEM:{sotakobara|ROOT:kbr|3MS★ya`^_#aAdamu⚓`O Adam!⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★{sokuno⚓Dwell⚓ P|LEM:min★>anta⚓you⚓ N|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|GEN★wazawojuka⚓and your spouse⚓ V|PERF|LEM:qaAla|ROOT:qwl|1P★{lojan~apa⚓(in) Paradise,⚓ PN|LEM:A^dam|M|NOM★wakulaA⚓and [you both] eat⚓ V|IMPV|LEM:sakana|ROOT:skn|2MS★minohaA⚓from it⚓ PRON|2MS★ragadFA⚓freely⚓ N|LEM:zawoj|ROOT:zwj|M|NOM★Hayovu⚓(from) wherever⚓ PN|LEM:jan~ap|ROOT:jnn|F|ACC★$i}otumaA⚓you [both] wish.⚓ V|IMPV|LEM:>akala|ROOT:Akl|2D★walaA⚓**But do not [you two] approach⚓ P|LEM:min★taqorabaA⚓**But do not [you two] approach⚓ ADJ|LEM:ragad|ROOT:rgd|M|INDEF|ACC★ha`*ihi⚓this⚓ LOC|LEM:Hayov|ROOT:Hyv★{l$~ajarapa⚓[the] tree,⚓ V|PERF|LEM:$aA^'a|ROOT:$yA|2D★fatakuwnaA⚓lest you [both] be⚓ PRO|LEM:laA★mina⚓of⚓ V|IMPF|LEM:yaqorabu|ROOT:qrb|2D|MOOD:JUS★{lZ~a`limiyna⚓the wrongdoers.`⚓ DEM|LEM:ha`*aA|FS★",
"fa>azal~ahumaA⚓Then made [both of] them slip⚓N|LEM:$ajarap|ROOT:$jr|F|ACC★{l$~ayoTa`nu⚓the Shaitaan⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|2D|MOOD:SUBJ★EanohaA⚓from it,⚓ P|LEM:min★fa>axorajahumaA⚓and he got [both of] them out⚓ N|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|GEN★mim~aA⚓from what⚓ V|PERF|(IV)|LEM:>azal~a|ROOT:zll|3MS★kaAnaA⚓they [both] were⚓ PN|LEM:$ayoTa`n|ROOT:$Tn|M|NOM★fiyhi⚓in [it].⚓ P|LEM:Ean★waqulonaA⚓And We said,⚓ V|PERF|(IV)|LEM:>axoraja|ROOT:xrj|3MS★{hobiTuwA@⚓`Go down (all of you),⚓ P|LEM:min★baEoDukumo⚓some of you⚓ REL|LEM:maA★libaEoDK⚓to others⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MD★Eaduw~N⚓(as) enemy;⚓ P|LEM:fiY★walakumo⚓and for you⚓ V|PERF|LEM:qaAla|ROOT:qwl|1P★fiY⚓in⚓ V|IMPV|LEM:yahobiTu|ROOT:hbT|2MP★{lo>aroDi⚓the earth⚓ N|LEM:baEoD|ROOT:bED|M|NOM★musotaqar~N⚓(is) a dwelling place⚓ N|LEM:baEoD|ROOT:bED|M|INDEF|GEN★wamata`EN⚓and a provision⚓ N|LEM:Eaduw~|ROOT:Edw|M|INDEF|NOM★<ilaY`⚓for⚓ PRON|2MP★HiynK⚓a period.`⚓ P|LEM:fiY★",
"fatalaq~aY`^⚓**Then Adam received⚓N|LEM:>aroD|ROOT:ArD|F|GEN★'aAdamu⚓**Then Adam received⚓ N|PASS|PCPL|(X)|LEM:musotaqar~|ROOT:qrr|M|INDEF|NOM★min⚓from⚓ N|LEM:mata`E|ROOT:mtE|M|INDEF|NOM★r~ab~ihi.⚓his Lord⚓ P|LEM:<ilaY`★kalima`tK⚓words,⚓ N|LEM:Hiyn|ROOT:Hyn|M|INDEF|GEN★fataAba⚓So (his Lord) turned⚓ V|PERF|(V)|LEM:talaq~aY`^|ROOT:lqy|3MS★Ealayohi⚓towards him.⚓ PN|LEM:A^dam|M|NOM★<in~ahu,⚓Indeed He!⚓ P|LEM:min★huwa⚓He⚓ N|LEM:rab~|ROOT:rbb|M|GEN★{lt~aw~aAbu⚓(is) the Oft-returning (to mercy),⚓ N|LEM:kalima`t|ROOT:klm|FP|INDEF|ACC★{lr~aHiymu⚓the Most Merciful.⚓ V|PERF|LEM:taAba|ROOT:twb|3MS★",
"qulonaA⚓We said,⚓P|LEM:EalaY`★{hobiTuwA@⚓`Go down⚓ ACC|LEM:<in~|SP:<in~★minohaA⚓from it⚓ PRON|3MS★jamiyEFA⚓all (of you),⚓ N|ACT|PCPL|LEM:taw~aAb|ROOT:twb|MS|NOM★fa<im~aA⚓and when,⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|NOM★ya>otiyan~akum⚓comes to you⚓ V|PERF|LEM:qaAla|ROOT:qwl|1P★m~in~iY⚓from Me⚓ V|IMPV|LEM:yahobiTu|ROOT:hbT|2MP★hudFY⚓Guidance,⚓ P|LEM:min★faman⚓then whoever⚓ N|LEM:jamiyE|ROOT:jmE|M|INDEF|ACC★tabiEa⚓follows⚓ COND|LEM:<im~aA★hudaAYa⚓My Guidance,⚓ V|IMPF|LEM:>ataY|ROOT:Aty|3MS★falaA⚓[then] no⚓ P|LEM:min★xawofN⚓fear⚓ N|LEM:hudFY|ROOT:hdy|M|INDEF|NOM★Ealayohimo⚓(will be) on them⚓ COND|LEM:man★walaA⚓and not⚓ V|PERF|LEM:tabiEa|ROOT:tbE|3MS★humo⚓they⚓ N|LEM:hudFY|ROOT:hdy|M|NOM★yaHozanuwna⚓will grieve.⚓ NEG|LEM:laA|SP:kaAn★",
"wa{l~a*iyna⚓And those⚓N|LEM:xawof|ROOT:xwf|M|INDEF|NOM★kafaruwA@⚓who disbelieve[d]⚓ P|LEM:EalaY`★waka*~abuwA@⚓and deny⚓ NEG|LEM:laA|SP:kaAn★bi_#aAya`tinaA^⚓Our Signs,⚓ PRON|3MP★>uw@la`^}ika⚓those⚓ V|IMPF|LEM:yaHozun|ROOT:Hzn|3MP★>aSoHa`bu⚓(are the) companions⚓ REL|LEM:{l~a*iY|MP★{ln~aAri⚓(of) the Fire;⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★humo⚓they⚓ V|PERF|(II)|LEM:ka*~aba|ROOT:k*b|3MP★fiyhaA⚓in it⚓ N|LEM:'aAyap|ROOT:Ayy|FP|GEN★xa`liduwna⚓(will) abide forever.`⚓ DEM|LEM:>uwla`^}ik|P★",
"ya`baniY^⚓O Children⚓N|LEM:>aSoHa`b|ROOT:SHb|MP|NOM★<isora`^'iyla⚓(of) Israel!⚓ N|LEM:naAr|ROOT:nwr|F|GEN★{*okuruwA@⚓Remember⚓ PRON|3MP★niEomatiYa⚓My Favor⚓ P|LEM:fiY★{l~atiY^⚓which⚓ N|ACT|PCPL|LEM:xa`lid|ROOT:xld|MP|NOM★>anoEamotu⚓I bestowed⚓ N|LEM:bunaY~|ROOT:bny|MP|ACC★Ealayokumo⚓upon you⚓ PN|LEM:<isoraA}iyl|GEN★wa>awofuwA@⚓and fulfill,⚓ V|IMPV|LEM:*akara|ROOT:*kr|2MP★biEahodiY^⚓My Covenant⚓ N|LEM:niEomap|ROOT:nEm|F|ACC★>uwfi⚓I will fulfill⚓ REL|LEM:{l~a*iY|FS★biEahodikumo⚓your covenant⚓ V|PERF|(IV)|LEM:>anoEama|ROOT:nEm|1S★wa<iy~a`Ya⚓and Me Alone⚓ P|LEM:EalaY`★fa{rohabuwni⚓fear [Me].⚓ V|IMPV|(IV)|LEM:>awofaY`|ROOT:wfy|2MP★",
"wa'aAminuwA@⚓And believe⚓N|LEM:Eahod|ROOT:Ehd|M|GEN★bimaA^⚓in what⚓ V|IMPF|(IV)|LEM:>awofaY`|ROOT:wfy|1S|MOOD:JUS★>anzalotu⚓I have sent down⚓ N|LEM:Eahod|ROOT:Ehd|M|GEN★muSad~iqFA⚓confirming⚓ PRON|LEM:<iy~aA|1S★l~imaA⚓that which⚓ V|IMPV|LEM:yarohabu|ROOT:rhb|2MP★maEakumo⚓(is) with you,⚓ V|IMPV|(IV)|LEM:'aAmana|ROOT:Amn|2MP★walaA⚓and (do) not⚓ REL|LEM:maA★takuwnuw^A@⚓be⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|1S★>aw~ala⚓(the) first⚓ N|ACT|PCPL|(II)|LEM:muSad~iq|ROOT:Sdq|M|INDEF|ACC★kaAfirK]⚓disbeliever⚓ REL|LEM:maA★bihi.⚓of it.⚓ P|LEM:maE2★walaA⚓And (do) not⚓ PRO|LEM:laA★ta$otaruwA@⚓exchange⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP|MOOD:JUS★bi_#aAya`tiY⚓My Signs (for)⚓ N|LEM:>aw~al|ROOT:Awl|MS|ACC★vamanFA⚓a price⚓ N|LEM:kaAfir|ROOT:kfr|M|INDEF|GEN★qaliylFA⚓small,⚓ PRON|3MS★wa<iy~a`Ya⚓and Me Alone⚓ PRO|LEM:laA★fa{t~aquwni⚓fear [Me].⚓ V|IMPF|(VIII)|LEM:{$otaraY`|ROOT:$ry|2MP|MOOD:JUS★",
"walaA⚓And (do) not⚓N|LEM:'aAyap|ROOT:Ayy|FP|GEN★talobisuwA@⚓mix⚓ N|LEM:vaman|ROOT:vmn|M|INDEF|ACC★{loHaq~a⚓the Truth⚓ ADJ|LEM:qaliyl|ROOT:qll|MS|INDEF|ACC★bi{loba`Tili⚓with [the] falsehood⚓ PRON|LEM:<iy~aA|1S★watakotumuwA@⚓and conceal⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★{loHaq~a⚓the Truth⚓ PRO|LEM:laA★wa>antumo⚓while you⚓ V|IMPF|LEM:labaso|ROOT:lbs|2MP|MOOD:JUS★taEolamuwna⚓[you] know.⚓ N|LEM:Haq~|ROOT:Hqq|M|ACC★",
"wa>aqiymuwA@⚓And establish⚓N|ACT|PCPL|LEM:ba`Til|ROOT:bTl|M|GEN★{lS~alaw`pa⚓the prayer⚓ V|IMPF|LEM:katama|ROOT:ktm|2MP|MOOD:JUS★wa'aAtuwA@⚓and give⚓ N|LEM:Haq~|ROOT:Hqq|M|ACC★{lz~akaw`pa⚓zakah⚓ PRON|2MP★wa{rokaEuwA@⚓and bow down⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★maEa⚓with⚓ V|IMPV|(IV)|LEM:>aqaAma|ROOT:qwm|2MP★{lr~a`kiEiyna⚓those who bow down.⚓ N|LEM:Salaw`p|ROOT:Slw|F|ACC★",
">ata>omuruwna⚓Do you order⚓V|IMPV|(IV)|LEM:A^taY|ROOT:Aty|2MP★{ln~aAsa⚓[the] people⚓ N|LEM:zakaw`p|ROOT:zkw|F|ACC★bi{lobir~i⚓[the] righteousness⚓ V|IMPV|LEM:yarokaEu|ROOT:rkE|2MP★watansawona⚓and you forget⚓ P|LEM:maE2★>anfusakumo⚓yourselves,⚓ N|ACT|PCPL|LEM:raAkiE|ROOT:rkE|MP|GEN★wa>antumo⚓while you⚓ V|IMPF|LEM:>amara|ROOT:Amr|2MP★tatoluwna⚓[you] recite⚓ N|LEM:n~aAs|ROOT:nws|MP|ACC★{lokita`ba⚓the Book?⚓ N|LEM:bir~|ROOT:brr|M|GEN★>afalaA⚓Then, will not⚓ V|IMPF|LEM:nasiYa|ROOT:nsy|2MP★taEoqiluwna⚓you use reason?⚓ N|LEM:nafos|ROOT:nfs|FP|ACC★",
"wa{sotaEiynuwA@⚓And seek help⚓PRON|2MP★bi{lS~abori⚓through patience⚓ V|IMPF|LEM:talaY`|ROOT:tlw|2MP★wa{lS~alaw`pi⚓and the prayer;⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★wa<in~ahaA⚓and indeed, it⚓ NEG|LEM:laA★lakabiyrapN⚓(is) surely difficult⚓ V|IMPF|LEM:Eaqalu|ROOT:Eql|2MP★<il~aA⚓except⚓ V|IMPV|(X)|LEM:{sotaEiynu|ROOT:Ewn|2MP★EalaY⚓on⚓ N|LEM:Sabor|ROOT:Sbr|M|GEN★{loxa`$iEiyna⚓the humble ones,⚓ N|LEM:Salaw`p|ROOT:Slw|F|GEN★",
"{l~a*iyna⚓Those who⚓ACC|LEM:<in~|SP:<in~★yaZun~uwna⚓believe⚓ N|LEM:kabiyrap|ROOT:kbr|FS|INDEF|NOM★>an~ahum⚓that they⚓ RES|LEM:<il~aA★m~ula`quwA@⚓will meet⚓ P|LEM:EalaY`★rab~ihimo⚓their Lord⚓ N|ACT|PCPL|LEM:xaA$iE|ROOT:x$E|MP|GEN★wa>an~ahumo⚓and that they⚓ REL|LEM:{l~a*iY|MP★<ilayohi⚓to Him⚓ V|IMPF|LEM:Zan~a|ROOT:Znn|3MP★ra`jiEuwna⚓will return.⚓ ACC|LEM:>an~|SP:<in~★",
"ya`baniY^⚓O Children⚓N|ACT|PCPL|(III)|LEM:m~ula`quwA|ROOT:lqy|MP|NOM★<isora`^'iyla⚓(of) Israel!⚓ N|LEM:rab~|ROOT:rbb|M|GEN★{*okuruwA@⚓Remember⚓ ACC|LEM:>an~|SP:<in~★niEomatiYa⚓My Favor⚓ P|LEM:<ilaY`★{l~atiY^⚓which⚓ N|ACT|PCPL|LEM:ra`jiEuwn|ROOT:rjE|MP|NOM★>anoEamotu⚓I bestowed⚓ N|LEM:bunaY~|ROOT:bny|MP|ACC★Ealayokumo⚓upon you⚓ PN|LEM:<isoraA}iyl|GEN★wa>an~iY⚓and that I⚓ V|IMPV|LEM:*akara|ROOT:*kr|2MP★faD~alotukumo⚓[I] preferred you⚓ N|LEM:niEomap|ROOT:nEm|F|ACC★EalaY⚓over⚓ REL|LEM:{l~a*iY|FS★{loEa`lamiyna⚓the worlds.⚓ V|PERF|(IV)|LEM:>anoEama|ROOT:nEm|1S★",
"wa{t~aquwA@⚓And fear⚓P|LEM:EalaY`★yawomFA⚓a day,⚓ ACC|LEM:>an~|SP:<in~★l~aA⚓(will) not⚓ V|PERF|(II)|LEM:faD~ala|ROOT:fDl|1S★tajoziY⚓avail⚓ P|LEM:EalaY`★nafosN⚓any soul⚓ N|LEM:Ea`lamiyn|ROOT:Elm|MP|GEN★Ean⚓**(another) soul⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★n~afosK⚓**(another) soul⚓ N|LEM:yawom|ROOT:ywm|M|INDEF|ACC★$ayo_#FA⚓anything,⚓ NEG|LEM:laA★walaA⚓and not⚓ V|IMPF|LEM:jazaY`|ROOT:jzy|3FS★yuqobalu⚓will be accepted⚓ N|LEM:nafos|ROOT:nfs|FS|INDEF|NOM★minohaA⚓from it⚓ P|LEM:Ean★$afa`EapN⚓any intercession,⚓ N|LEM:nafos|ROOT:nfs|FS|INDEF|GEN★walaA⚓and not⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|ACC★yu&oxa*u⚓will be taken⚓ NEG|LEM:laA★minohaA⚓from it⚓ V|IMPF|PASS|LEM:yaqobalu|ROOT:qbl|3MS★EadolN⚓a compensation,⚓ P|LEM:min★walaA⚓and not⚓ N|LEM:$afa`Eap|ROOT:$fE|F|INDEF|NOM★humo⚓they⚓ NEG|LEM:laA★yunSaruwna⚓will be helped.⚓ V|IMPF|PASS|LEM:>axa*a|ROOT:Ax*|3MS★",
"wa<i*o⚓And when⚓P|LEM:min★naj~ayona`kum⚓We saved you⚓ N|LEM:Eadol|ROOT:Edl|M|INDEF|NOM★m~ino⚓from⚓ NEG|LEM:laA★'aAli⚓**(the) people of Firaun⚓ PRON|3MP★firoEawona⚓**(the) people of Firaun⚓ V|IMPF|PASS|LEM:naSara|ROOT:nSr|3MP★yasuwmuwnakumo⚓(who were) afflicting you (with)⚓ T|LEM:<i*★suw^'a⚓horrible⚓ V|PERF|(II)|LEM:naj~aY`|ROOT:njw|1P★{loEa*aAbi⚓torment,⚓ P|LEM:min★yu*ab~iHuwna⚓slaughtering⚓ N|LEM:'aAl|ROOT:Awl|M|GEN★>abonaA^'akumo⚓your sons⚓ PN|LEM:firoEawon|M|GEN★wayasotaHoyuwna⚓and letting live⚓ V|IMPF|LEM:yasuwmu|ROOT:swm|3MP★nisaA^'akumo⚓your women.⚓ N|LEM:suw^'|ROOT:swA|M|ACC★wafiY⚓And in⚓ N|LEM:Ea*aAb|ROOT:E*b|M|GEN★*a`likum⚓that⚓ V|IMPF|(II)|LEM:yu*ab~iHu|ROOT:*bH|3MP★balaA^'N⚓(was) a trial⚓ N|LEM:{bon|ROOT:bny|MP|ACC★m~in⚓from⚓ V|IMPF|(X)|LEM:yasotaHoYi.^|ROOT:Hyy|3MP★r~ab~ikumo⚓your Lord⚓ N|LEM:nisaA^'|ROOT:nsw|FP|ACC★EaZiymN⚓great.⚓ P|LEM:fiY★",
"wa<i*o⚓And when⚓DEM|LEM:*a`lik|2MP★faraqonaA⚓We parted⚓ N|LEM:balaA^'|ROOT:blw|M|INDEF|NOM★bikumu⚓for you⚓ P|LEM:min★{lobaHora⚓the sea,⚓ N|LEM:rab~|ROOT:rbb|M|GEN★fa>anjayona`kumo⚓then We saved you,⚓ ADJ|LEM:EaZiym|ROOT:EZm|MS|INDEF|NOM★wa>agoraqonaA^⚓and We drowned⚓ T|LEM:<i*★'aAla⚓**(the) people of Firaun⚓ V|PERF|LEM:faraqo|ROOT:frq|1P★firoEawona⚓**(the) people of Firaun⚓ PRON|2MP★wa>antumo⚓while you⚓ N|LEM:baHor|ROOT:bHr|M|ACC★tanZuruwna⚓(were) looking.⚓ V|PERF|(IV)|LEM:>anjaY`|ROOT:njw|1P★",
"wa<i*o⚓And when⚓V|PERF|(IV)|LEM:>ugoriqu|ROOT:grq|1P★wa`EadonaA⚓We appointed⚓ N|LEM:'aAl|ROOT:Awl|M|ACC★muwsaY`^⚓(for) Musa⚓ PN|LEM:firoEawon|M|GEN★>arobaEiyna⚓forty⚓ PRON|2MP★layolapF⚓nights.⚓ V|IMPF|LEM:n~aZara|ROOT:nZr|2MP★vum~a⚓Then⚓ T|LEM:<i*★{t~axa*otumu⚓you took⚓ V|PERF|(III)|LEM:wa`Eado|ROOT:wEd|1P★{loEijola⚓the calf⚓ PN|LEM:muwsaY`|M|ACC★min[⚓**after him⚓ N|LEM:>arobaE|ROOT:rbE|MP|ACC★baEodihi.⚓**after him⚓ N|LEM:layolap|ROOT:lyl|F|INDEF|ACC★wa>antumo⚓and you⚓ CONJ|LEM:vum~★Za`limuwna⚓(were) wrongdoers.⚓ V|PERF|(VIII)|LEM:{t~axa*a|ROOT:Ax*|2MP★",
"vum~a⚓Then⚓N|LEM:Eijol|ROOT:Ejl|M|ACC★EafawonaA⚓We forgave⚓ P|LEM:min★Eankum⚓you⚓ N|LEM:baEod|ROOT:bEd|GEN★m~in[⚓**after⚓ PRON|2MP★baEodi⚓**after⚓ N|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|NOM★*a`lika⚓that,⚓ CONJ|LEM:vum~★laEal~akumo⚓so that you may⚓ V|PERF|LEM:EafaA|ROOT:Efw|1P★ta$okuruwna⚓(be) grateful.⚓ P|LEM:Ean★",
"wa<i*o⚓And when⚓P|LEM:min★'aAtayonaA⚓We gave⚓ N|LEM:baEod|ROOT:bEd|GEN★muwsaY⚓Musa⚓ DEM|LEM:*a`lik|MS★{lokita`ba⚓the Book⚓ ACC|LEM:laEal~|SP:<in~★wa{lofuroqaAna⚓and the Criterion,⚓ V|IMPF|LEM:$akara|ROOT:$kr|2MP★laEal~akumo⚓perhaps you⚓ T|LEM:<i*★tahotaduwna⚓(would be) guided.⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|1P★",
"wa<i*o⚓And when⚓PN|LEM:muwsaY`|M|ACC★qaAla⚓said⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★muwsaY`⚓Musa⚓ N|LEM:furoqaAn|ROOT:frq|M|ACC★liqawomihi.⚓to his people,⚓ ACC|LEM:laEal~|SP:<in~★ya`qawomi⚓`O my people!⚓ V|IMPF|(VIII)|LEM:{hotadaY`|ROOT:hdy|2MP★<in~akumo⚓Indeed, you⚓ T|LEM:<i*★Zalamotumo⚓[you] have wronged⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★>anfusakum⚓yourselves⚓ PN|LEM:muwsaY`|M|NOM★bi{t~ixaA*ikumu⚓by your taking⚓ N|LEM:qawom|ROOT:qwm|M|GEN★{loEijola⚓the calf.⚓ N|LEM:qawom|ROOT:qwm|M|ACC★fatuwbuw^A@⚓So turn in repentance⚓ ACC|LEM:<in~|SP:<in~★<ilaY`⚓to⚓ V|PERF|LEM:Zalama|ROOT:Zlm|2MP★baAri}ikumo⚓your Creator,⚓ N|LEM:nafos|ROOT:nfs|FP|ACC★fa{qotuluw^A@⚓and kill⚓ N|VN|(VIII)|LEM:{t~ixaA*|ROOT:Ax*|M|GEN★>anfusakumo⚓yourselves.⚓ N|LEM:Eijol|ROOT:Ejl|M|ACC★*a`likumo⚓That⚓ V|IMPV|LEM:taAba|ROOT:twb|2MP★xayorN⚓(is) better⚓ P|LEM:<ilaY`★l~akumo⚓for you⚓ N|ACT|PCPL|LEM:baAri}|ROOT:brA|M|GEN★Einda⚓with⚓ V|IMPV|LEM:qatala|ROOT:qtl|2MP★baAri}ikumo⚓your Creator.`⚓ N|LEM:nafos|ROOT:nfs|FP|ACC★fataAba⚓Then He turned⚓ DEM|LEM:*a`lik|2MP★Ealayokumo⚓towards you.⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★<in~ahu,⚓Indeed He!⚓ PRON|2MP★huwa⚓He⚓ LOC|LEM:Eind|ROOT:End|ACC★{lt~aw~aAbu⚓(is) the Oft-returning,⚓ N|ACT|PCPL|LEM:baAri}|ROOT:brA|M|GEN★{lr~aHiymu⚓the Most Merciful.⚓ V|PERF|LEM:taAba|ROOT:twb|3MS★",
"wa<i*o⚓And when⚓P|LEM:EalaY`★qulotumo⚓you said,⚓ ACC|LEM:<in~|SP:<in~★ya`muwsaY`⚓`O Musa!⚓ PRON|3MS★lan⚓Never⚓ N|ACT|PCPL|LEM:taw~aAb|ROOT:twb|MS|NOM★n~u&omina⚓**(will) we believe you⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|NOM★laka⚓**(will) we believe you⚓ T|LEM:<i*★Hat~aY`⚓until⚓ V|PERF|LEM:qaAla|ROOT:qwl|2MP★naraY⚓we see⚓ PN|LEM:muwsaY`|M|NOM★{ll~aha⚓Allah⚓ NEG|LEM:lan★jahorapF⚓manifestly.`⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|1P|MOOD:SUBJ★fa>axa*atokumu⚓So seized you⚓ PRON|2MS★{lS~a`Eiqapu⚓the thunderbolt⚓ P|LEM:Hat~aY`★wa>antumo⚓while you⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|1P|MOOD:SUBJ★tanZuruwna⚓(were) looking.⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★",
"vum~a⚓Then⚓N|LEM:jahorap|ROOT:jhr|F|INDEF|ACC★baEavona`kum⚓We revived you⚓ V|PERF|LEM:>axa*a|ROOT:Ax*|3FS★m~in[⚓**after⚓ N|LEM:SaAEiqap|ROOT:SEq|FS|NOM★baEodi⚓**after⚓ PRON|2MP★mawotikumo⚓your death,⚓ V|IMPF|LEM:n~aZara|ROOT:nZr|2MP★laEal~akumo⚓so that you may⚓ CONJ|LEM:vum~★ta$okuruwna⚓(be) grateful.⚓ V|PERF|LEM:baEava|ROOT:bEv|1P★",
"waZal~alonaA⚓And We shaded⚓P|LEM:min★Ealayokumu⚓[over] you⚓ N|LEM:baEod|ROOT:bEd|GEN★{logamaAma⚓(with) [the] clouds⚓ N|LEM:mawot|ROOT:mwt|M|GEN★wa>anzalonaA⚓and We sent down⚓ ACC|LEM:laEal~|SP:<in~★Ealayokumu⚓to you⚓ V|IMPF|LEM:$akara|ROOT:$kr|2MP★{loman~a⚓[the] manna⚓ V|PERF|(II)|LEM:Zal~alo|ROOT:Zll|1P★wa{ls~alowaY`⚓and [the] quails,⚓ P|LEM:EalaY`★kuluwA@⚓`Eat⚓ N|LEM:gama`m|ROOT:gmm|M|ACC★min⚓from⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|1P★Tay~iba`ti⚓(the) good things⚓ P|LEM:EalaY`★maA⚓that⚓ N|LEM:man~|ROOT:mnn|M|ACC★razaqona`kumo⚓We have provided you.`⚓ N|LEM:s~alowaY`|ROOT:slw|M|ACC★wamaA⚓And not⚓ V|IMPV|LEM:>akala|ROOT:Akl|2MP★ZalamuwnaA⚓they wronged Us,⚓ P|LEM:min★wala`kin⚓but⚓ N|LEM:Tay~iba`t|ROOT:Tyb|FP|GEN★kaAnuw^A@⚓they were⚓ REL|LEM:maA★>anfusahumo⚓(to) themselves⚓ V|PERF|LEM:razaqa|ROOT:rzq|1P★yaZolimuwna⚓doing wrong.⚓ NEG|LEM:maA★",
"wa<i*o⚓And when⚓V|PERF|LEM:Zalama|ROOT:Zlm|3MP★qulonaA⚓We said,⚓ AMD|LEM:la`kin★{doxuluwA@⚓`Enter⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★ha`*ihi⚓this⚓ N|LEM:nafos|ROOT:nfs|FP|ACC★{loqaroyapa⚓town,⚓ V|IMPF|LEM:Zalama|ROOT:Zlm|3MP★fakuluwA@⚓then eat⚓ T|LEM:<i*★minohaA⚓from [it]⚓ V|PERF|LEM:qaAla|ROOT:qwl|1P★Hayovu⚓wherever⚓ V|IMPV|LEM:daxala|ROOT:dxl|2MP★$i}otumo⚓you wish[ed]⚓ DEM|LEM:ha`*aA|FS★ragadFA⚓abundantly,⚓ N|LEM:qaroyap|ROOT:qry|F|ACC★wa{doxuluwA@⚓and enter⚓ V|IMPV|LEM:>akala|ROOT:Akl|2MP★{lobaAba⚓the gate⚓ P|LEM:min★suj~adFA⚓prostrating.⚓ LOC|LEM:Hayov|ROOT:Hyv★waquwluwA@⚓And say,⚓ V|PERF|LEM:$aA^'a|ROOT:$yA|2MP★HiT~apN⚓`Repentance,`⚓ ADJ|LEM:ragad|ROOT:rgd|M|INDEF|ACC★n~agofiro⚓We will forgive⚓ V|IMPV|LEM:daxala|ROOT:dxl|2MP★lakumo⚓for you⚓ N|LEM:baAb|ROOT:bwb|M|ACC★xaTa`ya`kumo⚓your sins.⚓ N|ACT|PCPL|LEM:saAjid|ROOT:sjd|MP|INDEF|ACC★wasanaziydu⚓And We will increase⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MP★{lomuHosiniyna⚓the good-doers (in reward).`⚓ N|LEM:HiT~ap|ROOT:HTT|F|INDEF|NOM★",
"fabad~ala⚓But changed⚓V|IMPF|LEM:gafara|ROOT:gfr|1P|MOOD:JUS★{l~a*iyna⚓those who⚓ PRON|2MP★ZalamuwA@⚓wronged⚓ N|LEM:xaTiy^_#ap|ROOT:xTA|P|ACC★qawolFA⚓(the) word⚓ V|IMPF|LEM:zaAda|ROOT:zyd|1P★gayora⚓other (than)⚓ N|ACT|PCPL|(IV)|LEM:muHosin|ROOT:Hsn|MP|ACC★{l~a*iY⚓that which⚓ V|PERF|(II)|LEM:bad~ala|ROOT:bdl|3MS★qiyla⚓was said⚓ REL|LEM:{l~a*iY|MP★lahumo⚓to them;⚓ V|PERF|LEM:Zalama|ROOT:Zlm|3MP★fa>anzalonaA⚓so We sent down⚓ N|VN|LEM:qawol|ROOT:qwl|M|INDEF|ACC★EalaY⚓upon⚓ N|LEM:gayor|ROOT:gyr|M|ACC★{l~a*iyna⚓those who⚓ REL|LEM:{l~a*iY|MS★ZalamuwA@⚓wronged,⚓ V|PERF|PASS|LEM:qaAla|ROOT:qwl|3MS★rijozFA⚓a punishment⚓ PRON|3MP★m~ina⚓from⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|1P★{ls~amaA^'i⚓the sky⚓ P|LEM:EalaY`★bimaA⚓because⚓ REL|LEM:{l~a*iY|MP★kaAnuwA@⚓they were⚓ V|PERF|LEM:Zalama|ROOT:Zlm|3MP★yafosuquwna⚓defiantly disobeying.⚓ N|LEM:rijoz|ROOT:rjz|M|INDEF|ACC★",
"wa<i*i⚓**And when⚓P|LEM:min★{sotasoqaY`⚓**Musa asked for water⚓ N|LEM:samaA^'|ROOT:smw|F|GEN★muwsaY`⚓**Musa asked for water⚓ REL|LEM:maA★liqawomihi.⚓for his people,⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★faqulonaA⚓[so] We said,⚓ V|IMPF|LEM:fasaqa|ROOT:fsq|3MP★{Dorib⚓`Strike⚓ T|LEM:<i*★b~iEaSaAka⚓with your staff⚓ V|PERF|(X)|LEM:{sotasoqaY`|ROOT:sqy|3MS★{loHajara⚓the stone.`⚓ PN|LEM:muwsaY`|M|NOM★fa{nfajarato⚓Then gushed forth⚓ N|LEM:qawom|ROOT:qwm|M|GEN★minohu⚓from it⚓ V|PERF|LEM:qaAla|ROOT:qwl|1P★{vonataA⚓**twelve⚓ V|IMPV|LEM:Daraba|ROOT:Drb|2MS★Ea$orapa⚓**twelve⚓ N|LEM:EaSaA2|ROOT:ESw|M|GEN★EayonFA⚓springs.⚓ N|LEM:Hajar|ROOT:Hjr|M|ACC★qado⚓**Knew⚓ V|PERF|(VII)|LEM:{nfajarato|ROOT:fjr|3FS★Ealima⚓**Knew⚓ P|LEM:min★kul~u⚓all⚓ N|LEM:{vonatayon|ROOT:vny|FD|NOM★>unaAsK⚓(the) people⚓ N|LEM:Ea$orap|ROOT:E$r|F|GEN★m~a$orabahumo⚓their drinking place.⚓ N|LEM:Eayon|ROOT:Eyn|F|INDEF|ACC★kuluwA@⚓`Eat⚓ CERT|LEM:qad★wa{$orabuwA@⚓and drink⚓ V|PERF|LEM:Ealima|ROOT:Elm|3MS★min⚓from⚓ N|LEM:kul~|ROOT:kll|M|NOM★r~izoqi⚓(the) provision (of)⚓ N|LEM:<insa`n|ROOT:Ans|MP|INDEF|GEN★{ll~ahi⚓Allah,⚓ N|LEM:m~a$orab|ROOT:$rb|M|ACC★walaA⚓and (do) not⚓ V|IMPV|LEM:>akala|ROOT:Akl|2MP★taEovawoA@⚓act wickedly⚓ V|IMPV|LEM:$ariba|ROOT:$rb|2MP★fiY⚓in⚓ P|LEM:min★{lo>aroDi⚓the earth⚓ N|LEM:rizoq|ROOT:rzq|M|GEN★mufosidiyna⚓spreading corruption.`⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★",
"wa<i*o⚓And when⚓PRO|LEM:laA★qulotumo⚓you said,⚓ V|IMPF|LEM:taEova|ROOT:Evw|2MP|MOOD:JUS★ya`muwsaY`⚓`O Musa!⚓ P|LEM:fiY★lan⚓Never (will)⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★n~aSobira⚓we endure⚓ N|ACT|PCPL|(IV)|LEM:mufosid|ROOT:fsd|MP|ACC★EalaY`⚓[on]⚓ T|LEM:<i*★TaEaAmK⚓food⚓ V|PERF|LEM:qaAla|ROOT:qwl|2MP★wa`HidK⚓(of) one (kind),⚓ PN|LEM:muwsaY`|M|NOM★fa{doEu⚓so pray⚓ NEG|LEM:lan★lanaA⚓for us⚓ V|IMPF|LEM:Sabara|ROOT:Sbr|1P|MOOD:SUBJ★rab~aka⚓(to) your Lord⚓ P|LEM:EalaY`★yuxorijo⚓to bring forth⚓ N|LEM:TaEaAm|ROOT:TEm|M|INDEF|GEN★lanaA⚓for us⚓ ADJ|LEM:wa`Hid|ROOT:wHd|MS|INDEF|GEN★mim~aA⚓out of what⚓ V|IMPV|LEM:daEaA|ROOT:dEw|2MS★tun[bitu⚓grows⚓ PRON|1P★{lo>aroDu⚓the earth,⚓ N|LEM:rab~|ROOT:rbb|M|ACC★min[⚓of⚓ V|IMPF|(IV)|LEM:>axoraja|ROOT:xrj|3MS|MOOD:JUS★baqolihaA⚓its herbs,⚓ PRON|1P★waqiv~aA^}ihaA⚓[and] its cucumbers,⚓ P|LEM:min★wafuwmihaA⚓[and] its garlic,⚓ REL|LEM:maA★waEadasihaA⚓[and] its lentils,⚓ V|IMPF|(IV)|LEM:>an[bata|ROOT:nbt|3FS★wabaSalihaA⚓and its onions.`⚓ N|LEM:>aroD|ROOT:ArD|F|NOM★qaAla⚓He said,⚓ P|LEM:min★>atasotabodiluwna⚓`Would you exchange⚓ N|LEM:baqol|ROOT:bql|M|GEN★{l~a*iY⚓that which⚓ N|LEM:qiv~aA^}|ROOT:qvA|M|GEN★huwa⚓[it]⚓ N|LEM:fuwm|ROOT:fwm|M|GEN★>adonaY`⚓(is) inferior⚓ N|LEM:Eadas|ROOT:Eds|M|GEN★bi{l~a*iY⚓for that which⚓ N|LEM:baSal|ROOT:bSl|M|GEN★huwa⚓[it]⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★xayorN⚓(is) better?⚓ V|IMPF|(X)|LEM:yasotabodilo|ROOT:bdl|2MP★{hobiTuwA@⚓Go down⚓ REL|LEM:{l~a*iY|MS★miSorFA⚓(to) a city,⚓ PRON|3MS★fa<in~a⚓so indeed⚓ N|LEM:>adonaY`|ROOT:dnw|MS|NOM★lakum⚓for you⚓ REL|LEM:{l~a*iY|MS★m~aA⚓(is) what⚓ PRON|3MS★sa>alotumo⚓you have asked (for).`⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★waDuribato⚓And were struck⚓ V|IMPV|LEM:yahobiTu|ROOT:hbT|2MP★Ealayohimu⚓on them⚓ N|LEM:miSor|ROOT:mSr|M|INDEF|ACC★{l*~il~apu⚓the humiliation⚓ ACC|LEM:<in~|SP:<in~★wa{lomasokanapu⚓and the misery⚓ PRON|2MP★wabaA^'uw⚓**and they drew on themselves wrath⚓ REL|LEM:maA★bigaDabK⚓**and they drew on themselves wrath⚓ V|PERF|LEM:sa>ala|ROOT:sAl|2MP★m~ina⚓of⚓ V|PERF|PASS|LEM:Daraba|ROOT:Drb|3FS★{ll~ahi⚓Allah⚓ P|LEM:EalaY`★*a`lika⚓That (was)⚓ N|LEM:*il~ap|ROOT:*ll|F|NOM★bi>an~ahumo⚓because they⚓ N|LEM:masokanap|ROOT:skn|F|NOM★kaAnuwA@⚓used to⚓ V|PERF|LEM:baA^'a|ROOT:bwA|3MP★yakofuruwna⚓disbelieve⚓ N|LEM:gaDab|ROOT:gDb|M|INDEF|GEN★bi_#aAya`ti⚓in (the) Signs⚓ P|LEM:min★{ll~ahi⚓(of) Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wayaqotuluwna⚓and kill⚓ DEM|LEM:*a`lik|MS★{ln~abiy~i.na⚓the Prophets⚓ ACC|LEM:>an~|SP:<in~★bigayori⚓without (any)⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★{loHaq~i⚓[the] right.⚓ V|IMPF|LEM:kafara|ROOT:kfr|3MP★*a`lika⚓That⚓ N|LEM:'aAyap|ROOT:Ayy|FP|GEN★bimaA⚓(was) because⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★EaSawA@⚓they disobeyed⚓ V|IMPF|LEM:qatala|ROOT:qtl|3MP★w~akaAnuwA@⚓and they were⚓ N|LEM:n~abiY~|ROOT:nbA|MP|ACC★yaEotaduwna⚓transgressing.⚓ N|LEM:gayor|ROOT:gyr|M|GEN★",
"<in~a⚓Indeed,⚓N|LEM:Haq~|ROOT:Hqq|M|GEN★{l~a*iyna⚓those who⚓ DEM|LEM:*a`lik|MS★'aAmanuwA@⚓believed⚓ REL|LEM:maA★wa{l~a*iyna⚓and those who⚓ V|PERF|LEM:EaSaA|ROOT:ESy|3MP★haAduwA@⚓became Jews⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★wa{ln~aSa`raY`⚓and the Christians⚓ V|IMPF|(VIII)|LEM:{EotadaY`|ROOT:Edw|3MP★wa{lS~a`bi_#iyna⚓and the Sabians -⚓ ACC|LEM:<in~|SP:<in~★mano⚓who⚓ REL|LEM:{l~a*iY|MP★'aAmana⚓believed⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★bi{ll~ahi⚓in Allah⚓ REL|LEM:{l~a*iY|MP★wa{loyawomi⚓and the Day⚓ V|PERF|LEM:haAdu|ROOT:hwd|3MP★{lo'aAxiri⚓[the] Last⚓ PN|LEM:naSoraAniy~|ROOT:nSr|P|ACC★waEamila⚓and did⚓ PN|ACT|PCPL|LEM:S~a`bi_#iyn|ROOT:SbA|MP|ACC★Sa`liHFA⚓righteous deeds,⚓ COND|LEM:man★falahumo⚓so for them⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MS★>ajoruhumo⚓(is) their reward⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★Einda⚓with⚓ N|LEM:yawom|ROOT:ywm|M|GEN★rab~ihimo⚓their Lord⚓ ADJ|LEM:A^xir|ROOT:Axr|MS|GEN★walaA⚓and no⚓ V|PERF|LEM:Eamila|ROOT:Eml|3MS★xawofN⚓fear⚓ N|ACT|PCPL|LEM:Sa`liH|ROOT:SlH|M|INDEF|ACC★Ealayohimo⚓on them⚓ PRON|3MP★walaA⚓and not⚓ N|LEM:>ajor|ROOT:Ajr|M|NOM★humo⚓they⚓ LOC|LEM:Eind|ROOT:End|ACC★yaHozanuwna⚓will grieve.⚓ N|LEM:rab~|ROOT:rbb|M|GEN★",
"wa<i*o⚓And when⚓NEG|LEM:laA★>axa*onaA⚓We took⚓ N|LEM:xawof|ROOT:xwf|M|INDEF|NOM★miyva`qakumo⚓your covenant⚓ P|LEM:EalaY`★warafaEonaA⚓and We raised⚓ NEG|LEM:laA★fawoqakumu⚓over you⚓ PRON|3MP★{lT~uwra⚓the mount,⚓ V|IMPF|LEM:yaHozun|ROOT:Hzn|3MP★xu*uwA@⚓`Hold⚓ T|LEM:<i*★maA^⚓what⚓ V|PERF|LEM:>axa*a|ROOT:Ax*|1P★'aAtayona`kum⚓We have given you⚓ N|LEM:m~iyva`q|ROOT:wvq|M|ACC★biquw~apK⚓with strength,⚓ V|PERF|LEM:rafaEa|ROOT:rfE|1P★wa{*okuruwA@⚓and remember⚓ LOC|LEM:fawoq|ROOT:fwq|M|ACC★maA⚓what⚓ N|LEM:Tuwr|ROOT:Twr|M|ACC★fiyhi⚓(is) in it,⚓ V|IMPV|LEM:>axa*a|ROOT:Ax*|2MP★laEal~akumo⚓perhaps you⚓ REL|LEM:maA★tat~aquwna⚓(would become) righteous.`⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|1P★",
"vum~a⚓Then⚓N|LEM:quw~ap|ROOT:qwy|F|INDEF|GEN★tawal~ayotum⚓you turned away⚓ V|IMPV|LEM:*akara|ROOT:*kr|2MP★m~in[⚓**after⚓ REL|LEM:maA★baEodi⚓**after⚓ P|LEM:fiY★*a`lika⚓that.⚓ ACC|LEM:laEal~|SP:<in~★falawolaA⚓So if not⚓ V|IMPF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★faDolu⚓**(for the) Grace of Allah⚓ CONJ|LEM:vum~★{ll~ahi⚓**(for the) Grace of Allah⚓ V|PERF|(V)|LEM:tawal~aY`|ROOT:wly|2MP★Ealayokumo⚓upon you⚓ P|LEM:min★waraHomatuhu,⚓and His Mercy,⚓ N|LEM:baEod|ROOT:bEd|GEN★lakuntum⚓surely you would have been⚓ DEM|LEM:*a`lik|MS★m~ina⚓of⚓ COND|LEM:lawolaA^★{loxa`siriyna⚓the losers.⚓ N|LEM:faDol|ROOT:fDl|M|NOM★",
"walaqado⚓And indeed,⚓PN|LEM:{ll~ah|ROOT:Alh|GEN★Ealimotumu⚓you knew⚓ P|LEM:EalaY`★{l~a*iyna⚓those who⚓ N|LEM:raHomap|ROOT:rHm|F|NOM★{EotadawoA@⚓transgressed⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★minkumo⚓among you⚓ P|LEM:min★fiY⚓**in the (matter of) Sabbath.⚓ N|ACT|PCPL|LEM:xa`siriyn|ROOT:xsr|MP|GEN★{ls~aboti⚓**in the (matter of) Sabbath.⚓ CERT|LEM:qad★faqulonaA⚓So We said⚓ V|PERF|LEM:Ealima|ROOT:Elm|2MP★lahumo⚓to them,⚓ REL|LEM:{l~a*iY|MP★kuwnuwA@⚓`Be⚓ V|PERF|(VIII)|LEM:{EotadaY`|ROOT:Edw|3MP★qiradapF⚓apes,⚓ P|LEM:min★xa`si_#iyna⚓despised.`⚓ P|LEM:fiY★",
"fajaEalona`haA⚓So We made it⚓N|LEM:s~abot|ROOT:sbt|M|GEN★naka`lFA⚓a deterrent punishment⚓ V|PERF|LEM:qaAla|ROOT:qwl|1P★l~imaA⚓for those⚓ PRON|3MP★bayona⚓**(in) front of them⚓ V|IMPV|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★yadayohaA⚓**(in) front of them⚓ N|LEM:qiradap|ROOT:qrd|MP|INDEF|ACC★wamaA⚓**and those after them⚓ ADJ|ACT|PCPL|LEM:xaAsi}|ROOT:xsA|MP|ACC★xalofahaA⚓**and those after them⚓ V|PERF|LEM:jaEala|ROOT:jEl|1P★wamawoEiZapF⚓and an admonition⚓ N|LEM:naka`l|ROOT:nkl|M|INDEF|ACC★l~ilomut~aqiyna⚓for those who fear (Allah).⚓ REL|LEM:maA★",
"wa<i*o⚓And when⚓LOC|LEM:bayon|ROOT:byn|ACC★qaAla⚓**Musa said⚓ N|LEM:yad|ROOT:ydy|FD|GEN★muwsaY`⚓**Musa said⚓ REL|LEM:maA★liqawomihi.^⚓to his people,⚓ LOC|LEM:xalof|ROOT:xlf|M|ACC★<in~a⚓**`Indeed, Allah⚓ N|LEM:m~awoEiZap|ROOT:wEZ|F|INDEF|ACC★{ll~aha⚓**`Indeed, Allah⚓ N|ACT|PCPL|(VIII)|LEM:mut~aqiyn|ROOT:wqy|MP|GEN★ya>omurukumo⚓commands you⚓ T|LEM:<i*★>an⚓that⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★ta*obaHuwA@⚓you slaughter⚓ PN|LEM:muwsaY`|M|NOM★baqarapF⚓a cow.`⚓ N|LEM:qawom|ROOT:qwm|M|GEN★qaAluw^A@⚓They said,⚓ ACC|LEM:<in~|SP:<in~★>atat~axi*unaA⚓`Do you take us⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★huzuwFA⚓(in) ridicule.`⚓ V|IMPF|LEM:>amara|ROOT:Amr|3MS★qaAla⚓He said,⚓ SUB|LEM:>an★>aEuw*u⚓`I seek refuge⚓ V|IMPF|LEM:*ubiHa|ROOT:*bH|2MP|MOOD:SUBJ★bi{ll~ahi⚓in Allah⚓ N|LEM:baqarap|ROOT:bqr|F|INDEF|ACC★>ano⚓that⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★>akuwna⚓I be⚓ V|IMPF|(VIII)|LEM:{t~axa*a|ROOT:Ax*|2MS★mina⚓among⚓ N|LEM:huzuw|ROOT:hzA|M|INDEF|ACC★{loja`hiliyna⚓the ignorant.`⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★",
"qaAluwA@⚓They said,⚓V|IMPF|LEM:Eu*o|ROOT:Ew*|1S★{doEu⚓`Pray⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★lanaA⚓for us⚓ SUB|LEM:>an★rab~aka⚓(to) your Lord⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|1S|MOOD:SUBJ★yubay~in⚓to make clear⚓ P|LEM:min★l~anaA⚓to us⚓ N|ACT|PCPL|LEM:jaAhil|ROOT:jhl|MP|GEN★maA⚓what⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★hiYa⚓it (is).`⚓ V|IMPV|LEM:daEaA|ROOT:dEw|2MS★qaAla⚓He said,⚓ PRON|1P★<in~ahu,⚓`Indeed, He⚓ N|LEM:rab~|ROOT:rbb|M|ACC★yaquwlu⚓says,⚓ V|IMPF|(II)|LEM:bay~anu|ROOT:byn|3MS|MOOD:JUS★<in~ahaA⚓`[Indeed] it⚓ PRON|1P★baqarapN⚓(is) a cow⚓ INTG|LEM:maA★l~aA⚓not⚓ PRON|3FS★faAriDN⚓old⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★walaA⚓and not⚓ ACC|LEM:<in~|SP:<in~★bikorN⚓young,⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MS★EawaAnN[⚓middle aged⚓ ACC|LEM:<in~|SP:<in~★bayona⚓between⚓ N|LEM:baqarap|ROOT:bqr|F|INDEF|NOM★*a`lika⚓that,`⚓ NEG|LEM:laA★fa{foEaluwA@⚓so do⚓ ADJ|ACT|PCPL|LEM:faAriD|ROOT:frD|M|INDEF|NOM★maA⚓what⚓ NEG|LEM:laA★tu&omaruwna⚓you are commanded.`⚓ ADJ|LEM:bikor|ROOT:bkr|M|INDEF|NOM★",
"qaAluwA@⚓They said,⚓N|LEM:EawaAn|ROOT:Ewn|MS|INDEF|NOM★{doEu⚓`Pray⚓ LOC|LEM:bayon|ROOT:byn|ACC★lanaA⚓for us⚓ DEM|LEM:*a`lik|MS★rab~aka⚓(to) your Lord⚓ V|IMPV|LEM:faEala|ROOT:fEl|2MP★yubay~in⚓to make clear⚓ REL|LEM:maA★l~anaA⚓to us⚓ V|IMPF|PASS|LEM:>amara|ROOT:Amr|2MP★maA⚓what⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★lawonuhaA⚓(is) its color.`⚓ V|IMPV|LEM:daEaA|ROOT:dEw|2MS★qaAla⚓He said,⚓ PRON|1P★<in~ahu,⚓`Indeed, He⚓ N|LEM:rab~|ROOT:rbb|M|ACC★yaquwlu⚓says,⚓ V|IMPF|(II)|LEM:bay~anu|ROOT:byn|3MS|MOOD:JUS★<in~ahaA⚓`[Indeed] it is⚓ PRON|1P★baqarapN⚓a cow⚓ INTG|LEM:maA★SaforaA^'u⚓yellow,⚓ N|LEM:lawon|ROOT:lwn|M|NOM★faAqiEN⚓bright⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★l~awonuhaA⚓(in) its color,⚓ ACC|LEM:<in~|SP:<in~★tasur~u⚓pleasing⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MS★{ln~a`Ziriyna⚓(to) those who see (it).``⚓ ACC|LEM:<in~|SP:<in~★",
"qaAluwA@⚓They said,⚓N|LEM:baqarap|ROOT:bqr|F|INDEF|NOM★{doEu⚓`Pray⚓ ADJ|LEM:SaforaA^'|ROOT:Sfr|NOM★lanaA⚓for us⚓ ADJ|ACT|PCPL|LEM:faAqiE|ROOT:fqE|INDEF|NOM★rab~aka⚓(to) your Lord⚓ N|LEM:lawon|ROOT:lwn|M|NOM★yubay~in⚓to make clear⚓ V|IMPF|LEM:tasur~u|ROOT:srr|3FS★l~anaA⚓to us⚓ N|ACT|PCPL|LEM:na`Ziriyn|ROOT:nZr|MP|ACC★maA⚓what⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★hiYa⚓it (is).⚓ V|IMPV|LEM:daEaA|ROOT:dEw|2MS★<in~a⚓Indeed,⚓ PRON|1P★{lobaqara⚓[the] cows⚓ N|LEM:rab~|ROOT:rbb|M|ACC★ta$a`baha⚓look alike⚓ V|IMPF|(II)|LEM:bay~anu|ROOT:byn|3MS|MOOD:JUS★EalayonaA⚓to us.⚓ PRON|1P★wa<in~aA^⚓And indeed we,⚓ INTG|LEM:maA★<in⚓if⚓ PRON|3FS★$aA^'a⚓**wills Allah,⚓ ACC|LEM:<in~|SP:<in~★{ll~ahu⚓**wills Allah,⚓ N|LEM:baqar|ROOT:bqr|M|ACC★lamuhotaduwna⚓(will) surely be those who are guided.`⚓ V|PERF|(VI)|LEM:ta$a`baha|ROOT:$bh|3MS★",
"qaAla⚓He said,⚓P|LEM:EalaY`★<in~ahu,⚓`Indeed, He⚓ ACC|LEM:<in~|SP:<in~★yaquwlu⚓says,⚓ COND|LEM:<in★<in~ahaA⚓`[Indeed] it⚓ V|PERF|LEM:$aA^'a|ROOT:$yA|3MS★baqarapN⚓(is) a cow⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★l~aA⚓not⚓ N|ACT|PCPL|(VIII)|LEM:m~uhotaduwn|ROOT:hdy|MP|NOM★*aluwlN⚓trained⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★tuviyru⚓to plough⚓ ACC|LEM:<in~|SP:<in~★{lo>aroDa⚓the earth,⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MS★walaA⚓and not⚓ ACC|LEM:<in~|SP:<in~★tasoqiY⚓water⚓ N|LEM:baqarap|ROOT:bqr|F|INDEF|NOM★{loHarova⚓the field;⚓ NEG|LEM:laA★musal~amapN⚓sound,⚓ ADJ|LEM:*aluwl|ROOT:*ll|MS|INDEF|NOM★l~aA⚓no⚓ V|IMPF|(IV)|LEM:>avaAru|ROOT:vwr|3FS★$iyapa⚓blemish⚓ N|LEM:>aroD|ROOT:ArD|F|ACC★fiyhaA⚓in it.``⚓ NEG|LEM:laA★qaAluwA@⚓They said,⚓ V|IMPF|LEM:saqaY`|ROOT:sqy|3FS★{lo_#a`na⚓`Now⚓ N|LEM:Harov|ROOT:Hrv|M|ACC★ji}ota⚓you have come⚓ ADJ|PASS|PCPL|(II)|LEM:m~usal~amap|ROOT:slm|F|INDEF|NOM★bi{loHaq~i⚓with the truth.`⚓ NEG|LEM:laA|SP:<in~★fa*abaHuwhaA⚓So they slaughtered it,⚓ N|LEM:$iyap|ROOT:w$y|F|ACC★wamaA⚓and not⚓ P|LEM:fiY★kaAduwA@⚓they were near⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★yafoEaluwna⚓(to) doing (it).⚓ T|LEM:_#a`n|ACC★",
"wa<i*o⚓And when⚓V|PERF|LEM:jaA^'a|ROOT:jyA|2MS★qatalotumo⚓you killed⚓ N|LEM:Haq~|ROOT:Hqq|M|GEN★nafosFA⚓a man,⚓ V|PERF|LEM:*ubiHa|ROOT:*bH|3MP★fa{d~a`ra`#otumo⚓then you disputed⚓ NEG|LEM:maA★fiyhaA⚓concerning it,⚓ V|PERF|LEM:kaAda|ROOT:kwd|SP:kaAd|3MP★wa{ll~ahu⚓but Allah⚓ V|IMPF|LEM:faEala|ROOT:fEl|3MP★muxorijN⚓(is) the One Who brought forth⚓ T|LEM:<i*★m~aA⚓what⚓ V|PERF|LEM:qatala|ROOT:qtl|2MP★kuntumo⚓you were⚓ N|LEM:nafos|ROOT:nfs|FS|INDEF|ACC★takotumuwna⚓concealing.⚓ V|PERF|(VI)|LEM:{d~a`ra`#o|ROOT:drA|2MP★",
"faqulonaA⚓So We said,⚓P|LEM:fiY★{Doribuwhu⚓`Strike him⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★bibaEoDihaA⚓with a part of it.`⚓ N|ACT|PCPL|(IV)|LEM:muxorij|ROOT:xrj|M|INDEF|NOM★ka*a`lika⚓Like this⚓ REL|LEM:maA★yuHoYi⚓**Allah revives⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★{ll~ahu⚓**Allah revives⚓ V|IMPF|LEM:katama|ROOT:ktm|2MP★{lomawotaY`⚓the dead,⚓ V|PERF|LEM:qaAla|ROOT:qwl|1P★wayuriykumo⚓and shows you⚓ V|IMPV|LEM:Daraba|ROOT:Drb|2MP★'aAya`tihi.⚓His Signs,⚓ N|LEM:baEoD|ROOT:bED|M|GEN★laEal~akumo⚓perhaps you may⚓ DEM|LEM:*a`lik|MS★taEoqiluwna⚓use your intellect.⚓ V|IMPF|(IV)|LEM:>aHoyaA|ROOT:Hyy|3MS★",
"vum~a⚓**Then hardened⚓PN|LEM:{ll~ah|ROOT:Alh|NOM★qasato⚓**Then hardened⚓ N|LEM:m~ay~it|ROOT:mwt|P|ACC★quluwbukum⚓your hearts⚓ V|IMPF|(IV)|LEM:>arayo|ROOT:rAy|3MS★m~in[⚓**after⚓ N|LEM:'aAyap|ROOT:Ayy|FP|ACC★baEodi⚓**after⚓ ACC|LEM:laEal~|SP:<in~★*a`lika⚓that⚓ V|IMPF|LEM:Eaqalu|ROOT:Eql|2MP★fahiYa⚓so they⚓ CONJ|LEM:vum~★ka{loHijaArapi⚓(became) like [the] stones⚓ V|PERF|LEM:qasato|ROOT:qsw|3FS★>awo⚓or⚓ N|LEM:qalob|ROOT:qlb|FP|NOM★>a$ad~u⚓stronger⚓ P|LEM:min★qasowapF⚓(in) hardness.⚓ N|LEM:baEod|ROOT:bEd|GEN★wa<in~a⚓And indeed,⚓ DEM|LEM:*a`lik|MS★mina⚓from⚓ PRON|3FS★{loHijaArapi⚓the stones⚓ N|LEM:HijaArap|ROOT:Hjr|F|GEN★lamaA⚓certainly (there are some) which⚓ CONJ|LEM:>aw★yatafaj~aru⚓gush forth⚓ N|LEM:>a$ad~|ROOT:$dd|MS|NOM★minohu⚓from it⚓ N|LEM:qasowap|ROOT:qsw|F|INDEF|ACC★{lo>anoha`ru⚓[the] rivers,⚓ ACC|LEM:<in~|SP:<in~★wa<in~a⚓and indeed,⚓ P|LEM:min★minohaA⚓from them⚓ N|LEM:HijaArap|ROOT:Hjr|F|GEN★lamaA⚓certainly (there are some) which⚓ REL|LEM:maA★ya$~aq~aqu⚓split,⚓ V|IMPF|(V)|LEM:yatafaj~aru|ROOT:fjr|3MS★fayaxoruju⚓so comes out⚓ P|LEM:min★minohu⚓from it⚓ N|LEM:nahar|ROOT:nhr|MP|NOM★{lomaA^'u⚓[the] water,⚓ ACC|LEM:<in~|SP:<in~★wa<in~a⚓and indeed,⚓ P|LEM:min★minohaA⚓from them⚓ REL|LEM:maA★lamaA⚓certainly (there are some) which⚓ V|IMPF|(V)|LEM:ya$~aq~aqu|ROOT:$qq|3MS★yahobiTu⚓fall down⚓ V|IMPF|LEM:xaraja|ROOT:xrj|3MS★mino⚓from⚓ P|LEM:min★xa$oyapi⚓fear⚓ N|LEM:maA^'|ROOT:mwh|M|NOM★{ll~ahi⚓(of) Allah.⚓ ACC|LEM:<in~|SP:<in~★wamaA⚓**And Allah (is) not⚓ P|LEM:min★{ll~ahu⚓**And Allah (is) not⚓ REL|LEM:maA★biga`filK⚓unaware⚓ V|IMPF|LEM:yahobiTu|ROOT:hbT|3MS★Eam~aA⚓of what⚓ P|LEM:min★taEomaluwna⚓you do.⚓ N|LEM:xa$oyap|ROOT:x$y|F|GEN★",
">afataTomaEuwna⚓**Do you hope⚓PN|LEM:{ll~ah|ROOT:Alh|GEN★>an⚓that⚓ NEG|LEM:maA|SP:kaAn★yu&ominuwA@⚓they will believe⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★lakumo⚓[for] you⚓ N|ACT|PCPL|LEM:ga`fil|ROOT:gfl|M|INDEF|GEN★waqado⚓**while indeed (there) has been⚓ P|LEM:Ean★kaAna⚓**while indeed (there) has been⚓ REL|LEM:maA★fariyqN⚓a party⚓ V|IMPF|LEM:Eamila|ROOT:Eml|2MP★m~inohumo⚓of them,⚓ V|IMPF|LEM:yaTomaEu|ROOT:TmE|2MP★yasomaEuwna⚓(who used to) hear⚓ SUB|LEM:>an★kala`ma⚓**(the) words of Allah,⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MP|MOOD:SUBJ★{ll~ahi⚓**(the) words of Allah,⚓ PRON|2MP★vum~a⚓then⚓ CERT|LEM:qad★yuHar~ifuwnahu,⚓they distort it⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★min[⚓**after⚓ N|LEM:fariyq|ROOT:frq|M|INDEF|NOM★baEodi⚓**after⚓ P|LEM:min★maA⚓[what]⚓ V|IMPF|LEM:samiEa|ROOT:smE|3MP★Eaqaluwhu⚓they understood it,⚓ N|LEM:kala`m|ROOT:klm|M|ACC★wahumo⚓while they⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★yaEolamuwna⚓know?⚓ CONJ|LEM:vum~★",
"wa<i*aA⚓And when⚓V|IMPF|(II)|LEM:yuHar~ifu|ROOT:Hrf|3MP★laquwA@⚓they meet⚓ P|LEM:min★{l~a*iyna⚓those who⚓ N|LEM:baEod|ROOT:bEd|GEN★'aAmanuwA@⚓believe[d],⚓ REL|LEM:maA★qaAluw^A@⚓they say,⚓ V|PERF|LEM:Eaqalu|ROOT:Eql|3MP★'aAman~aA⚓`We have believed.`⚓ PRON|3MP★wa<i*aA⚓But when⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MP★xalaA⚓meet in private⚓ T|LEM:<i*aA★baEoDuhumo⚓some of them⚓ V|PERF|LEM:laqu|ROOT:lqy|3MP★<ilaY`⚓**with some (others),⚓ REL|LEM:{l~a*iY|MP★baEoDK⚓**with some (others),⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★qaAluw^A@⚓they say,⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★>atuHad~ivuwnahum⚓`Do you tell them⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|1P★bimaA⚓what⚓ T|LEM:<i*aA★fataHa⚓**Allah has revealed⚓ V|PERF|LEM:xalaA|ROOT:xlw|3MS★{ll~ahu⚓**Allah has revealed⚓ N|LEM:baEoD|ROOT:bED|M|NOM★Ealayokumo⚓to you⚓ P|LEM:<ilaY`★liyuHaA^j~uwkum⚓so that they argue with you⚓ N|LEM:baEoD|ROOT:bED|M|INDEF|GEN★bihi.⚓therewith⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★Einda⚓before⚓ V|IMPF|(II)|LEM:tuHad~ivu|ROOT:Hdv|2MP★rab~ikumo⚓your Lord?⚓ SUB|LEM:maA★>afalaA⚓Then do (you) not⚓ V|PERF|LEM:fataHa|ROOT:ftH|3MS★taEoqiluwna⚓understand?`⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★",
">awalaA⚓Do not⚓P|LEM:EalaY`★yaEolamuwna⚓they know⚓ V|IMPF|(III)|LEM:HaA^j~a|ROOT:Hjj|3MP|MOOD:SUBJ★>an~a⚓that⚓ PRON|3MS★{ll~aha⚓Allah⚓ LOC|LEM:Eind|ROOT:End|ACC★yaEolamu⚓knows⚓ N|LEM:rab~|ROOT:rbb|M|GEN★maA⚓what⚓ NEG|LEM:laA★yusir~uwna⚓they conceal⚓ V|IMPF|LEM:Eaqalu|ROOT:Eql|2MP★wamaA⚓and what⚓ NEG|LEM:laA★yuEolinuwna⚓they declare?⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MP★",
"waminohumo⚓And among them⚓ACC|LEM:>an~|SP:<in~★>um~iy~uwna⚓(are) unlettered ones,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★laA⚓**(who) do not know⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MS★yaEolamuwna⚓**(who) do not know⚓ REL|LEM:maA★{lokita`ba⚓the book⚓ V|IMPF|(IV)|LEM:>asar~a|ROOT:srr|3MP★<il~aA^⚓except⚓ REL|LEM:maA★>amaAniY~a⚓wishful thinking⚓ V|IMPF|(IV)|LEM:>aEolan|ROOT:Eln|3MP★wa<ino⚓and not⚓ P|LEM:min★humo⚓they⚓ N|LEM:>um~iY~|ROOT:Amm|MP|NOM★<il~aA⚓(do anything) except⚓ NEG|LEM:laA★yaZun~uwna⚓guess.⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MP★",
"fawayolN⚓So woe⚓N|LEM:kita`b|ROOT:ktb|M|ACC★l~il~a*iyna⚓to those who⚓ EXP|LEM:<il~aA★yakotubuwna⚓write⚓ N|LEM:>umoniy~at|ROOT:mny|MP|ACC★{lokita`ba⚓the book⚓ NEG|LEM:<in★bi>ayodiyhimo⚓with their (own) hands⚓ PRON|3MP★vum~a⚓then,⚓ EXP|LEM:<il~aA★yaquwluwna⚓they say,⚓ V|IMPF|LEM:Zan~a|ROOT:Znn|3MP★ha`*aA⚓`This⚓ N|LEM:wayol|M|INDEF|NOM★mino⚓**(is) from Allah,`⚓ REL|LEM:{l~a*iY|MP★Eindi⚓**(is) from Allah,`⚓ V|IMPF|LEM:kataba|ROOT:ktb|3MP★{ll~ahi⚓**(is) from Allah,`⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★liya$otaruwA@⚓to barter⚓ N|LEM:yad|ROOT:ydy|FP|GEN★bihi.⚓with it⚓ CONJ|LEM:vum~★vamanFA⚓(for) a price⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MP★qaliylFA⚓little.⚓ DEM|LEM:ha`*aA|MS★fawayolN⚓So woe⚓ P|LEM:min★l~ahum⚓to them⚓ N|LEM:Eind|ROOT:End|GEN★m~im~aA⚓for what⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★katabato⚓have written⚓ V|IMPF|(VIII)|LEM:{$otaraY`|ROOT:$ry|3MP|MOOD:SUBJ★>ayodiyhimo⚓their hands⚓ PRON|3MS★wawayolN⚓and woe⚓ N|LEM:vaman|ROOT:vmn|M|INDEF|ACC★l~ahum⚓to them⚓ ADJ|LEM:qaliyl|ROOT:qll|MS|INDEF|ACC★m~im~aA⚓for what⚓ N|LEM:wayol|M|INDEF|NOM★yakosibuwna⚓they earn.⚓ PRON|3MP★",
"waqaAluwA@⚓And they say,⚓P|LEM:min★lan⚓`Never⚓ REL|LEM:maA★tamas~anaA⚓will touch us⚓ V|PERF|LEM:kataba|ROOT:ktb|3FS★{ln~aAru⚓the Fire⚓ N|LEM:yad|ROOT:ydy|FP|NOM★<il~aA^⚓except⚓ N|LEM:wayol|M|INDEF|NOM★>ay~aAmFA⚓(for) days⚓ PRON|3MP★m~aEoduwdapF⚓numbered.`⚓ P|LEM:min★qulo⚓Say,⚓ REL|LEM:maA★>at~axa*otumo⚓`Have you taken⚓ V|IMPF|LEM:kasaba|ROOT:ksb|3MP★Einda⚓from⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★{ll~ahi⚓Allah⚓ NEG|LEM:lan★EahodFA⚓a covenant,⚓ V|IMPF|LEM:mas~a|ROOT:mss|3FS|MOOD:SUBJ★falan⚓so never⚓ N|LEM:naAr|ROOT:nwr|F|NOM★yuxolifa⚓**will Allah break⚓ EXP|LEM:<il~aA★{ll~ahu⚓**will Allah break⚓ N|LEM:yawom|ROOT:ywm|MP|INDEF|ACC★Eahodahu,^⚓His Covenant?⚓ ADJ|PASS|PCPL|LEM:m~aEoduwdap|ROOT:Edd|FS|INDEF|ACC★>amo⚓Or⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★taquwluwna⚓(do) you say⚓ V|PERF|(VIII)|LEM:{t~axa*a|ROOT:Ax*|2MP★EalaY⚓against⚓ LOC|LEM:Eind|ROOT:End|ACC★{ll~ahi⚓Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★maA⚓what⚓ N|LEM:Eahod|ROOT:Ehd|M|INDEF|ACC★laA⚓**you (do) not know?`⚓ NEG|LEM:lan★taEolamuwna⚓**you (do) not know?`⚓ V|IMPF|(IV)|LEM:>axolafu|ROOT:xlf|3MS|MOOD:SUBJ★",
"balaY`⚓Yes,⚓PN|LEM:{ll~ah|ROOT:Alh|NOM★man⚓whoever⚓ N|LEM:Eahod|ROOT:Ehd|M|ACC★kasaba⚓earned⚓ CONJ|LEM:>am★say~i}apF⚓evil⚓ V|IMPF|LEM:qaAla|ROOT:qwl|2MP★wa>aHa`Tato⚓**and surrounded him⚓ P|LEM:EalaY`★bihi.⚓**and surrounded him⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★xaTiy^_#atuhu,⚓his sins -⚓ REL|LEM:maA★fa>uw@la`^}ika⚓[so] those⚓ NEG|LEM:laA★>aSoHa`bu⚓(are the) companions⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★{ln~aAri⚓(of) the Fire;⚓ ANS|LEM:balaY`★humo⚓they⚓ COND|LEM:man★fiyhaA⚓in it⚓ V|PERF|LEM:kasaba|ROOT:ksb|3MS★xa`liduwna⚓(will) abide forever.⚓ N|LEM:say~i}ap|ROOT:swA|F|INDEF|ACC★",
"wa{l~a*iyna⚓And those who⚓V|PERF|(IV)|LEM:>aHaATa|ROOT:HwT|3FS★'aAmanuwA@⚓believed⚓ PRON|3MS★waEamiluwA@⚓and did⚓ N|LEM:xaTiy^_#ap|ROOT:xTA|F|NOM★{lS~a`liHa`ti⚓righteous deeds,⚓ DEM|LEM:>uwla`^}ik|P★>uw@la`^}ika⚓those⚓ N|LEM:>aSoHa`b|ROOT:SHb|MP|NOM★>aSoHa`bu⚓(are the) companions⚓ N|LEM:naAr|ROOT:nwr|F|GEN★{lojan~api⚓(of) Paradise;⚓ PRON|3MP★humo⚓they⚓ P|LEM:fiY★fiyhaA⚓in it⚓ N|ACT|PCPL|LEM:xa`lid|ROOT:xld|MP|NOM★xa`liduwna⚓(will) abide forever.⚓ REL|LEM:{l~a*iY|MP★",
"wa<i*o⚓And when⚓V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★>axa*onaA⚓We took⚓ V|PERF|LEM:Eamila|ROOT:Eml|3MP★miyva`qa⚓(the) covenant⚓ N|ACT|PCPL|LEM:S~a`liHa`t|ROOT:SlH|FP|ACC★baniY^⚓(from the) Children⚓ DEM|LEM:>uwla`^}ik|P★<isora`^'iyla⚓(of) Israel,⚓ N|LEM:>aSoHa`b|ROOT:SHb|MP|NOM★laA⚓**`You will not worship⚓ PN|LEM:jan~ap|ROOT:jnn|F|GEN★taEobuduwna⚓**`You will not worship⚓ PRON|3MP★<il~aA⚓except⚓ P|LEM:fiY★{ll~aha⚓Allah,⚓ N|ACT|PCPL|LEM:xa`lid|ROOT:xld|MP|NOM★wabi{lowa`lidayoni⚓and with [the] parents⚓ T|LEM:<i*★<iHosaAnFA⚓(be) good⚓ V|PERF|LEM:>axa*a|ROOT:Ax*|1P★wa*iY⚓**and (with) relatives⚓ N|LEM:m~iyva`q|ROOT:wvq|M|ACC★{loqurobaY`⚓**and (with) relatives⚓ N|LEM:bunaY~|ROOT:bny|MP|GEN★wa{loyata`maY`⚓and [the] orphans⚓ PN|LEM:<isoraA}iyl|GEN★wa{lomasa`kiyni⚓and the needy,⚓ NEG|LEM:laA★waquwluwA@⚓and speak⚓ V|IMPF|LEM:Eabada|ROOT:Ebd|2MP★liln~aAsi⚓to [the] people⚓ RES|LEM:<il~aA★HusonFA⚓good,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★wa>aqiymuwA@⚓and establish⚓ N|LEM:waAlid|ROOT:wld|MD|GEN★{lS~alaw`pa⚓the prayer⚓ N|VN|(IV)|LEM:<iHosa`n|ROOT:Hsn|M|INDEF|ACC★wa'aAtuwA@⚓and give⚓ N|LEM:*uw|MS|GEN★{lz~akaw`pa⚓the zakah.`⚓ N|LEM:qurobaY`|ROOT:qrb|F|GEN★vum~a⚓Then⚓ N|LEM:yatiym|ROOT:ytm|P|GEN★tawal~ayotumo⚓you turned away,⚓ N|LEM:misokiyn|ROOT:skn|MP|GEN★<il~aA⚓except⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MP★qaliylFA⚓a few⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★m~inkumo⚓of you,⚓ N|LEM:Huson|ROOT:Hsn|M|INDEF|ACC★wa>antum⚓and you (were)⚓ V|IMPV|(IV)|LEM:>aqaAma|ROOT:qwm|2MP★m~uEoriDuwna⚓refusing.⚓ N|LEM:Salaw`p|ROOT:Slw|F|ACC★",
"wa<i*o⚓And when⚓V|IMPV|(IV)|LEM:A^taY|ROOT:Aty|2MP★>axa*onaA⚓We took⚓ N|LEM:zakaw`p|ROOT:zkw|F|ACC★miyva`qakumo⚓your covenant,⚓ CONJ|LEM:vum~★laA⚓**`You will not shed⚓ V|PERF|(V)|LEM:tawal~aY`|ROOT:wly|2MP★tasofikuwna⚓**`You will not shed⚓ EXP|LEM:<il~aA★dimaA^'akumo⚓your blood⚓ N|LEM:qaliyl|ROOT:qll|MS|INDEF|ACC★walaA⚓**and (will) not evict⚓ P|LEM:min★tuxorijuwna⚓**and (will) not evict⚓ PRON|2MP★>anfusakum⚓yourselves⚓ N|ACT|PCPL|(IV)|LEM:m~uEoriDuwn|ROOT:ErD|MP|NOM★m~in⚓from⚓ T|LEM:<i*★diya`rikumo⚓your homes,`⚓ V|PERF|LEM:>axa*a|ROOT:Ax*|1P★vum~a⚓then⚓ N|LEM:m~iyva`q|ROOT:wvq|M|ACC★>aqorarotumo⚓you ratified⚓ NEG|LEM:laA★wa>antumo⚓while you⚓ V|IMPF|LEM:yasofiku|ROOT:sfk|2MP★ta$ohaduwna⚓(were) witnessing.⚓ N|LEM:dam|ROOT:dmw|MP|ACC★",
"vum~a⚓Then⚓NEG|LEM:laA★>antumo⚓you⚓ V|IMPF|(IV)|LEM:>axoraja|ROOT:xrj|2MP★ha`^&ulaA^'i⚓(are) those⚓ N|LEM:nafos|ROOT:nfs|FP|ACC★taqotuluwna⚓(who) kill⚓ P|LEM:min★>anfusakumo⚓yourselves⚓ N|LEM:daAr|ROOT:dwr|FP|GEN★watuxorijuwna⚓and evict⚓ CONJ|LEM:vum~★fariyqFA⚓a party⚓ V|PERF|(IV)|LEM:>aqoraro|ROOT:qrr|2MP★m~inkum⚓of you⚓ PRON|2MP★m~in⚓from⚓ V|IMPF|LEM:$ahida|ROOT:$hd|2MP★diya`rihimo⚓their homes,⚓ CONJ|LEM:vum~★taZa`haruwna⚓you support one another⚓ PRON|2MP★Ealayohim⚓against them⚓ DEM|LEM:ha`*aA|P★bi{lo<ivomi⚓in sin⚓ V|IMPF|LEM:qatala|ROOT:qtl|2MP★wa{loEudowa`ni⚓and [the] transgression.⚓ N|LEM:nafos|ROOT:nfs|FP|ACC★wa<in⚓And if⚓ V|IMPF|(IV)|LEM:>axoraja|ROOT:xrj|2MP★ya>otuwkumo⚓they come to you⚓ N|LEM:fariyq|ROOT:frq|M|INDEF|ACC★>usa`raY`⚓(as) captives,⚓ P|LEM:min★tufa`duwhumo⚓you ransom them;⚓ P|LEM:min★wahuwa⚓while it⚓ N|LEM:daAr|ROOT:dwr|FP|GEN★muHar~amN⚓(was) forbidden⚓ V|IMPF|(VI)|LEM:taZa`haru|ROOT:Zhr|2MP★Ealayokumo⚓to you⚓ P|LEM:EalaY`★<ixoraAjuhumo⚓their eviction.⚓ N|LEM:<ivom|ROOT:Avm|M|GEN★>afatu&ominuwna⚓So do you believe⚓ N|LEM:Eudowa`n|ROOT:Edw|M|GEN★bibaEoDi⚓in part (of)⚓ COND|LEM:<in★{lokita`bi⚓the Book⚓ V|IMPF|LEM:>ataY|ROOT:Aty|3MP★watakofuruwna⚓and disbelieve⚓ N|LEM:>asiyr|ROOT:Asr|MP|ACC★bibaEoDK⚓in part?⚓ V|IMPF|(III)|LEM:tufa`du|ROOT:fdy|2MP★famaA⚓Then what⚓ PRON|3MS★jazaA^'u⚓(should be the) recompense⚓ N|PASS|PCPL|(II)|LEM:muHar~am|ROOT:Hrm|M|INDEF|NOM★man⚓(for the one) who⚓ P|LEM:EalaY`★yafoEalu⚓does⚓ N|VN|(IV)|LEM:<ixoraAj|ROOT:xrj|M|NOM★*a`lika⚓that⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|2MP★minkumo⚓among you,⚓ N|LEM:baEoD|ROOT:bED|M|GEN★<il~aA⚓except⚓ N|LEM:kita`b|ROOT:ktb|M|GEN★xizoYN⚓disgrace⚓ V|IMPF|LEM:kafara|ROOT:kfr|2MP★fiY⚓in⚓ N|LEM:baEoD|ROOT:bED|M|INDEF|GEN★{loHayaw`pi⚓the life⚓ NEG|LEM:maA★{ld~unoyaA⚓(of) the world;⚓ N|LEM:jazaA^'|ROOT:jzy|M|NOM★wayawoma⚓and (on the) Day⚓ REL|LEM:man★{loqiya`mapi⚓of [the] Resurrection⚓ V|IMPF|LEM:faEala|ROOT:fEl|3MS★yurad~uwna⚓they will be sent back⚓ DEM|LEM:*a`lik|MS★<ilaY`^⚓to⚓ P|LEM:min★>a$ad~i⚓(the) most severe⚓ RES|LEM:<il~aA★{loEa*aAbi⚓punishment?⚓ N|LEM:xizoY|ROOT:xzy|M|INDEF|NOM★wamaA⚓**And Allah (is) not⚓ P|LEM:fiY★{ll~ahu⚓**And Allah (is) not⚓ N|LEM:Hayaw`p|ROOT:Hyy|F|GEN★biga`filK⚓unaware⚓ ADJ|LEM:d~unoyaA|ROOT:dnw|FS|GEN★Eam~aA⚓of what⚓ T|LEM:yawom|ROOT:ywm|M|ACC★taEomaluwna⚓you do.⚓ N|LEM:qiya`map|ROOT:qwm|F|GEN★",
">uw@la`^}ika⚓Those⚓V|IMPF|PASS|LEM:rad~a|ROOT:rdd|3MP★{l~a*iyna⚓(are) the ones who⚓ P|LEM:<ilaY`★{$otarawuA@⚓bought⚓ N|LEM:>a$ad~|ROOT:$dd|MS|GEN★{loHayaw`pa⚓the life⚓ N|LEM:Ea*aAb|ROOT:E*b|M|GEN★{ld~unoyaA⚓(of) the world⚓ NEG|LEM:maA|SP:kaAn★bi{lo'aAxirapi⚓for the Hereafter;⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★falaA⚓so not⚓ N|ACT|PCPL|LEM:ga`fil|ROOT:gfl|M|INDEF|GEN★yuxaf~afu⚓will be lightened⚓ P|LEM:Ean★Eanohumu⚓for them⚓ REL|LEM:maA★{loEa*aAbu⚓the punishment⚓ V|IMPF|LEM:Eamila|ROOT:Eml|2MP★walaA⚓and not⚓ DEM|LEM:>uwla`^}ik|P★humo⚓they⚓ REL|LEM:{l~a*iY|MP★yunSaruwna⚓will be helped.⚓ V|PERF|(VIII)|LEM:{$otaraY`|ROOT:$ry|3MP★",
"walaqado⚓And indeed⚓N|LEM:Hayaw`p|ROOT:Hyy|F|ACC★'aAtayonaA⚓We gave⚓ ADJ|LEM:d~unoyaA|ROOT:dnw|FS|ACC★muwsaY⚓Musa⚓ N|LEM:A^xir|ROOT:Axr|FS|GEN★{lokita`ba⚓the Book⚓ NEG|LEM:laA★waqaf~ayonaA⚓and We followed up⚓ V|IMPF|PASS|(II)|LEM:xaf~afa|ROOT:xff|3MS★min[⚓**after him⚓ P|LEM:Ean★baEodihi.⚓**after him⚓ N|LEM:Ea*aAb|ROOT:E*b|M|NOM★bi{lr~usuli⚓with [the] Messengers.⚓ NEG|LEM:laA★wa'aAtayonaA⚓And We gave⚓ PRON|3MP★EiysaY⚓Isa,⚓ V|IMPF|PASS|LEM:naSara|ROOT:nSr|3MP★{bona⚓(the) son⚓ CERT|LEM:qad★maroyama⚓(of) Maryam,⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|1P★{lobay~ina`ti⚓[the] clear signs⚓ PN|LEM:muwsaY`|M|ACC★wa>ay~adona`hu⚓and We supported him⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★biruwHi⚓**with the Holy Spirit.⚓ V|PERF|(II)|LEM:qaf~ayo|ROOT:qfw|1P★{loqudusi⚓**with the Holy Spirit.⚓ P|LEM:min★>afakul~amaA⚓Is it (not) so (that) whenever⚓ N|LEM:baEod|ROOT:bEd|GEN★jaA^'akumo⚓came to you⚓ N|LEM:rasuwl|ROOT:rsl|MP|GEN★rasuwlN[⚓a Messenger⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|1P★bimaA⚓with what⚓ PN|LEM:EiysaY|ACC★laA⚓**(do) not desire⚓ N|LEM:{bon|ROOT:bny|M|ACC★tahowaY`^⚓**(do) not desire⚓ PN|LEM:maroyam|F|GEN★>anfusukumu⚓yourselves,⚓ N|LEM:bay~inap|ROOT:byn|FP|ACC★{sotakobarotumo⚓you acted arrogantly?⚓ V|PERF|(II)|LEM:>ay~ada|ROOT:Ayd|1P★fafariyqFA⚓So a party⚓ N|LEM:ruwH|ROOT:rwH|M|GEN★ka*~abotumo⚓you denied,⚓ N|LEM:qudus|ROOT:qds|M|GEN★wafariyqFA⚓and a party⚓ T|LEM:kul~amaA|ROOT:kll★taqotuluwna⚓you kill(ed).⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3MS★",
"waqaAluwA@⚓And they said,⚓N|LEM:rasuwl|ROOT:rsl|M|INDEF|NOM★quluwbunaA⚓`Our hearts⚓ REL|LEM:maA★gulofN[⚓(are) wrapped.`⚓ NEG|LEM:laA★bal⚓Nay,⚓ V|IMPF|LEM:hawaY`|ROOT:hwy|3FS|MOOD:JUS★l~aEanahumu⚓**Allah has cursed them⚓ N|LEM:nafos|ROOT:nfs|FP|NOM★{ll~ahu⚓**Allah has cursed them⚓ V|PERF|(X)|LEM:{sotakobara|ROOT:kbr|2MP★bikuforihimo⚓for their disbelief;⚓ N|LEM:fariyq|ROOT:frq|M|INDEF|ACC★faqaliylFA⚓so little⚓ V|PERF|(II)|LEM:ka*~aba|ROOT:k*b|2MP★m~aA⚓(is) what⚓ N|LEM:fariyq|ROOT:frq|M|INDEF|ACC★yu&ominuwna⚓they believe.⚓ V|IMPF|LEM:qatala|ROOT:qtl|2MP★",
"walam~aA⚓And when⚓V|PERF|LEM:qaAla|ROOT:qwl|3MP★jaA^'ahumo⚓came to them⚓ N|LEM:qalob|ROOT:qlb|FP|NOM★kita`bN⚓a Book⚓ N|LEM:gulof|ROOT:glf|MP|INDEF|NOM★m~ino⚓**from Allah⚓ RET|LEM:bal★Eindi⚓**from Allah⚓ V|PERF|LEM:laEana|ROOT:lEn|3MS★{ll~ahi⚓**from Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★muSad~iqN⚓confirming⚓ N|LEM:kufor|ROOT:kfr|M|GEN★l~imaA⚓**what (was) with them,⚓ N|LEM:qaliyl|ROOT:qll|MS|INDEF|ACC★maEahumo⚓**what (was) with them,⚓ REL|LEM:maA★wakaAnuwA@⚓though they used to⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★min⚓**before⚓ T|LEM:lam~aA★qabolu⚓**before⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3MS★yasotafotiHuwna⚓(that), pray for victory⚓ N|LEM:kita`b|ROOT:ktb|M|INDEF|NOM★EalaY⚓over⚓ P|LEM:min★{l~a*iyna⚓those who⚓ N|LEM:Eind|ROOT:End|GEN★kafaruwA@⚓disbelieved -⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★falam~aA⚓then when⚓ ADJ|ACT|PCPL|(II)|LEM:muSad~iq|ROOT:Sdq|M|INDEF|NOM★jaA^'ahum⚓came to them⚓ REL|LEM:maA★m~aA⚓what⚓ LOC|LEM:maE|ACC★EarafuwA@⚓they recognized,⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★kafaruwA@⚓they disbelieved⚓ P|LEM:min★bihi.⚓in it.⚓ N|LEM:qabol|ROOT:qbl|GEN★falaEonapu⚓So (the) curse⚓ V|IMPF|(X)|LEM:{sotafotaHu|ROOT:ftH|3MP★{ll~ahi⚓(of) Allah⚓ P|LEM:EalaY`★EalaY⚓(is) on⚓ REL|LEM:{l~a*iY|MP★{loka`firiyna⚓the disbelievers.⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★",
"bi}osamaA⚓Evil (is) that⚓T|LEM:lam~aA★{$otarawoA@⚓**(for) which they have sold⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3MS★bihi.^⚓**(for) which they have sold⚓ REL|LEM:maA★>anfusahumo⚓themselves,⚓ V|PERF|LEM:Earafa|ROOT:Erf|3MP★>an⚓that⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★yakofuruwA@⚓they disbelieve⚓ PRON|3MS★bimaA^⚓in what⚓ N|LEM:laEonap|ROOT:lEn|F|NOM★>anzala⚓**Allah has revealed,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★{ll~ahu⚓**Allah has revealed,⚓ P|LEM:EalaY`★bagoyFA⚓grudging⚓ N|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|GEN★>an⚓that⚓ V|PERF|LEM:bi}osa|ROOT:bAs|3MS★yunaz~ila⚓**Allah sends down⚓ REL|LEM:maA★{ll~ahu⚓**Allah sends down⚓ V|PERF|(VIII)|LEM:{$otaraY`|ROOT:$ry|3MP★min⚓of⚓ PRON|3MS★faDolihi.⚓His Grace⚓ N|LEM:nafos|ROOT:nfs|FP|ACC★EalaY`⚓on⚓ SUB|LEM:>an★man⚓whom⚓ V|IMPF|LEM:kafara|ROOT:kfr|3MP|MOOD:SUBJ★ya$aA^'u⚓He wills⚓ REL|LEM:maA★mino⚓from⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|3MS★EibaAdihi.⚓His servants.⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★fabaA^'uw⚓**So they have drawn (on themselves) wrath⚓ N|LEM:bagoy|ROOT:bgy|M|INDEF|ACC★bigaDabK⚓**So they have drawn (on themselves) wrath⚓ SUB|LEM:>an★EalaY`⚓upon⚓ V|IMPF|(II)|LEM:naz~ala|ROOT:nzl|3MS|MOOD:SUBJ★gaDabK⚓wrath.⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★waliloka`firiyna⚓And for the disbelievers⚓ P|LEM:min★Ea*aAbN⚓(is) a punishment⚓ N|LEM:faDol|ROOT:fDl|M|GEN★m~uhiynN⚓humiliating.⚓ P|LEM:EalaY`★",
"wa<i*aA⚓And when⚓REL|LEM:man★qiyla⚓it is said⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★lahumo⚓to them,⚓ P|LEM:min★'aAminuwA@⚓`Believe⚓ N|LEM:Eabod|ROOT:Ebd|MP|GEN★bimaA^⚓in what⚓ V|PERF|LEM:baA^'a|ROOT:bwA|3MP★>anzala⚓**Allah has revealed,`⚓ N|LEM:gaDab|ROOT:gDb|M|INDEF|GEN★{ll~ahu⚓**Allah has revealed,`⚓ P|LEM:EalaY`★qaAluwA@⚓they say,⚓ N|LEM:gaDab|ROOT:gDb|M|INDEF|GEN★nu&ominu⚓`We believe⚓ N|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|GEN★bimaA^⚓in what⚓ N|LEM:Ea*aAb|ROOT:E*b|M|INDEF|NOM★>unzila⚓was revealed⚓ ADJ|ACT|PCPL|(IV)|LEM:m~uhiyn|ROOT:hwn|M|INDEF|NOM★EalayonaA⚓to us.`⚓ T|LEM:<i*aA★wayakofuruwna⚓And they disbelieve⚓ V|PERF|PASS|LEM:qaAla|ROOT:qwl|3MS★bimaA⚓in what⚓ PRON|3MP★waraA^'ahu,⚓(is) besides it,⚓ V|IMPV|(IV)|LEM:'aAmana|ROOT:Amn|2MP★wahuwa⚓while it⚓ REL|LEM:maA★{loHaq~u⚓(is) the truth⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|3MS★muSad~iqFA⚓confirming⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★l~imaA⚓what⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★maEahumo⚓(is) with them.⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|1P★qulo⚓Say,⚓ REL|LEM:maA★falima⚓`Then why⚓ V|PERF|PASS|(IV)|LEM:>anzala|ROOT:nzl|3MS★taqotuluwna⚓(did) you kill⚓ P|LEM:EalaY`★>an[biyaA^'a⚓**(the) Prophets of Allah⚓ V|IMPF|LEM:kafara|ROOT:kfr|3MP★{ll~ahi⚓**(the) Prophets of Allah⚓ REL|LEM:maA★min⚓**before,⚓ LOC|LEM:waraA^'|ROOT:wry|ACC★qabolu⚓**before,⚓ PRON|3MS★<in⚓if⚓ N|LEM:Haq~|ROOT:Hqq|M|NOM★kuntum⚓you were⚓ N|ACT|PCPL|(II)|LEM:muSad~iq|ROOT:Sdq|M|INDEF|ACC★m~u&ominiyna⚓believers?`⚓ REL|LEM:maA★",
"walaqado⚓**And indeed⚓P|LEM:maE2★jaA^'akum⚓came to you⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★m~uwsaY`⚓Musa⚓ INTG|LEM:maA★bi{lobay~ina`ti⚓with [the] clear signs,⚓ V|IMPF|LEM:qatala|ROOT:qtl|2MP★vum~a⚓then⚓ N|LEM:n~abiY~|ROOT:nbA|MP|ACC★{t~axa*otumu⚓you took⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★{loEijola⚓the calf⚓ P|LEM:min★min[⚓**after him⚓ N|LEM:qabol|ROOT:qbl|GEN★baEodihi.⚓**after him⚓ COND|LEM:<in★wa>antumo⚓and you⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★Za`limuwna⚓(were) wrongdoers.⚓ N|ACT|PCPL|(IV)|LEM:mu&omin|ROOT:Amn|MP|ACC★",
"wa<i*o⚓And when⚓CERT|LEM:qad★>axa*onaA⚓We took⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3MS★miyva`qakumo⚓your covenant⚓ PN|LEM:muwsaY`|M|NOM★warafaEonaA⚓and We raised⚓ N|LEM:bay~inap|ROOT:byn|FP|GEN★fawoqakumu⚓over you⚓ CONJ|LEM:vum~★{lT~uwra⚓the mount,⚓ V|PERF|(VIII)|LEM:{t~axa*a|ROOT:Ax*|2MP★xu*uwA@⚓`Hold⚓ N|LEM:Eijol|ROOT:Ejl|M|ACC★maA^⚓what⚓ P|LEM:min★'aAtayona`kum⚓We gave you,⚓ N|LEM:baEod|ROOT:bEd|GEN★biquw~apK⚓with firmness⚓ PRON|2MP★wa{somaEuwA@⚓and listen.`⚓ N|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|NOM★qaAluwA@⚓They said,⚓ T|LEM:<i*★samiEonaA⚓`We heard⚓ V|PERF|LEM:>axa*a|ROOT:Ax*|1P★waEaSayonaA⚓and we disobeyed.`⚓ N|LEM:m~iyva`q|ROOT:wvq|M|ACC★wa>u$oribuwA@⚓And they were made to drink⚓ V|PERF|LEM:rafaEa|ROOT:rfE|1P★fiY⚓in⚓ LOC|LEM:fawoq|ROOT:fwq|M|ACC★quluwbihimu⚓their hearts⚓ N|LEM:Tuwr|ROOT:Twr|M|ACC★{loEijola⚓(love of) the calf⚓ V|IMPV|LEM:>axa*a|ROOT:Ax*|2MP★bikuforihimo⚓because of their disbelief.⚓ REL|LEM:maA★qulo⚓Say,⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|1P★bi}osamaA⚓`Evil (is) that⚓ N|LEM:quw~ap|ROOT:qwy|F|INDEF|GEN★ya>omurukum⚓**orders you (to do) it⚓ V|IMPV|LEM:samiEa|ROOT:smE|2MP★bihi.^⚓**orders you (to do) it⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★<iyma`nukumo⚓your faith,⚓ V|PERF|LEM:samiEa|ROOT:smE|1P★<in⚓if⚓ V|PERF|LEM:EaSaA|ROOT:ESy|1P★kuntum⚓you are⚓ V|PERF|PASS|(IV)|LEM:>u$oribu|ROOT:$rb|3MP★m~u&ominiyna⚓believers.`⚓ P|LEM:fiY★",
"qulo⚓Say,⚓N|LEM:qalob|ROOT:qlb|FP|GEN★<in⚓`If -⚓ N|LEM:Eijol|ROOT:Ejl|M|ACC★kaAnato⚓is⚓ N|LEM:kufor|ROOT:kfr|M|GEN★lakumu⚓for you⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★{ld~aAru⚓the home⚓ V|PERF|LEM:bi}osa|ROOT:bAs|3MS★{lo'aAxirapu⚓(of) the Hereafter⚓ REL|LEM:maA★Einda⚓**with Allah⚓ V|IMPF|LEM:>amara|ROOT:Amr|3MS★{ll~ahi⚓**with Allah⚓ PRON|3MS★xaAliSapF⚓exclusively,⚓ N|VN|(IV)|LEM:<iyma`n|ROOT:Amn|M|NOM★m~in⚓**excluding⚓ COND|LEM:<in★duwni⚓**excluding⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★{ln~aAsi⚓the mankind,⚓ N|ACT|PCPL|(IV)|LEM:mu&omin|ROOT:Amn|MP|ACC★fataman~awuA@⚓then wish⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★{lomawota⚓(for) [the] death,⚓ COND|LEM:<in★<in⚓if⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3FS★kuntumo⚓you are⚓ PRON|2MP★Sa`diqiyna⚓truthful.`⚓ N|LEM:daAr|ROOT:dwr|FS|NOM★",
"walan⚓And never (will)⚓ADJ|LEM:A^xir|ROOT:Axr|FS|NOM★yataman~awohu⚓they wish for it,⚓ LOC|LEM:Eind|ROOT:End|ACC★>abadF[A⚓ever,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★bimaA⚓because⚓ N|ACT|PCPL|LEM:xaAliSap|ROOT:xlS|F|INDEF|ACC★qad~amato⚓(of what) sent ahead⚓ P|LEM:min★>ayodiyhimo⚓their hands.⚓ N|LEM:duwn|ROOT:dwn|GEN★wa{ll~ahu⚓And Allah⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★EaliymN[⚓(is) All-Knower⚓ V|IMPV|(V)|LEM:yataman~a|ROOT:mny|2MP★bi{lZ~a`limiyna⚓of the wrongdoers.⚓ N|LEM:mawot|ROOT:mwt|M|ACC★",
"walatajidan~ahumo⚓And surely you will find them⚓COND|LEM:<in★>aHoraSa⚓(the) most greedy⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★{ln~aAsi⚓(of) [the] mankind⚓ N|ACT|PCPL|LEM:SaAdiq|ROOT:Sdq|MP|ACC★EalaY`⚓for⚓ NEG|LEM:lan★Hayaw`pK⚓life,⚓ V|IMPF|(V)|LEM:yataman~a|ROOT:mny|3MP|MOOD:SUBJ★wamina⚓and (greedier) than⚓ T|LEM:>abadFA|ROOT:Abd|M|INDEF|ACC★{l~a*iyna⚓those who⚓ REL|LEM:maA★>a$orakuwA@⚓associate[d] partners (with Allah).⚓ V|PERF|(II)|LEM:qad~ama|ROOT:qdm|3FS★yawad~u⚓Loves⚓ N|LEM:yad|ROOT:ydy|FP|NOM★>aHaduhumo⚓(each) one of them⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★lawo⚓if⚓ N|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★yuEam~aru⚓he could be granted a life⚓ N|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|GEN★>alofa⚓(of) a thousand⚓ V|IMPF|LEM:wajada|ROOT:wjd|2MS★sanapK⚓year(s).⚓ N|LEM:>aHoraS|ROOT:HrS|M|ACC★wamaA⚓But not⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★huwa⚓it⚓ P|LEM:EalaY`★bimuzaHoziHihi.⚓(will) remove him⚓ N|LEM:Hayaw`p|ROOT:Hyy|F|INDEF|GEN★mina⚓from⚓ P|LEM:min★{loEa*aAbi⚓the punishment⚓ REL|LEM:{l~a*iY|MP★>an⚓that⚓ V|PERF|(IV)|LEM:>a$oraka|ROOT:$rk|3MP★yuEam~ara⚓he should be granted life.⚓ V|IMPF|LEM:wad~a|ROOT:wdd|3MS★wa{ll~ahu⚓And Allah⚓ N|LEM:>aHad|ROOT:AHd|M|NOM★baSiyrN[⚓(is) All-Seer⚓ SUB|LEM:law★bimaA⚓of what⚓ V|IMPF|PASS|(II)|LEM:yuEam~aru|ROOT:Emr|3MS★yaEomaluwna⚓they do.⚓ N|LEM:>alof|ROOT:Alf|M|ACC★",
"qulo⚓Say,⚓N|LEM:sanap|ROOT:snw|F|INDEF|GEN★man⚓`Whoever⚓ NEG|LEM:maA|SP:kaAn★kaAna⚓is⚓ PRON|3MS★Eaduw~FA⚓an enemy⚓ N|ACT|PCPL|(II)|LEM:muzaHoziH|ROOT:zHzH|M|GEN★l~ijiboriyla⚓to Jibreel -⚓ P|LEM:min★fa<in~ahu,⚓then indeed he⚓ N|LEM:Ea*aAb|ROOT:E*b|M|GEN★naz~alahu,⚓brought it down⚓ SUB|LEM:>an★EalaY`⚓on⚓ V|IMPF|PASS|(II)|LEM:yuEam~aru|ROOT:Emr|3MS|MOOD:SUBJ★qalobika⚓your heart⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★bi<i*oni⚓by (the) permission⚓ N|LEM:baSiyr|ROOT:bSr|MS|INDEF|NOM★{ll~ahi⚓(of) Allah⚓ REL|LEM:maA★muSad~iqFA⚓confirming⚓ V|IMPF|LEM:Eamila|ROOT:Eml|3MP★l~imaA⚓what⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★bayona⚓**(was) before it⚓ COND|LEM:man★yadayohi⚓**(was) before it⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★wahudFY⚓and a guidance⚓ N|LEM:Eaduw~|ROOT:Edw|M|INDEF|ACC★wabu$oraY`⚓and glad tiding(s)⚓ PN|LEM:jiboriyl|M|GEN★lilomu&ominiyna⚓for the believers.`⚓ ACC|LEM:<in~|SP:<in~★",
"man⚓Whoever⚓V|PERF|(II)|LEM:naz~ala|ROOT:nzl|3MS★kaAna⚓is⚓ P|LEM:EalaY`★Eaduw~FA⚓an enemy⚓ N|LEM:qalob|ROOT:qlb|FS|GEN★l~il~ahi⚓(to) Allah⚓ N|LEM:<i*on|ROOT:A*n|M|GEN★wamala`^}ikatihi.⚓and His Angels,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★warusulihi.⚓and His Messengers,⚓ N|ACT|PCPL|(II)|LEM:muSad~iq|ROOT:Sdq|M|INDEF|ACC★wajiboriyla⚓and Jibreel,⚓ REL|LEM:maA★wamiykaY`la⚓and Meekael,⚓ LOC|LEM:bayon|ROOT:byn|ACC★fa<in~a⚓then indeed⚓ N|LEM:yad|ROOT:ydy|FD|GEN★{ll~aha⚓Allah⚓ N|LEM:hudFY|ROOT:hdy|M|INDEF|ACC★Eaduw~N⚓(is) an enemy⚓ N|LEM:bu$oraY`|ROOT:b$r|F|ACC★l~iloka`firiyna⚓to the disbelievers.⚓ N|ACT|PCPL|(IV)|LEM:mu&omin|ROOT:Amn|MP|GEN★",
"walaqado⚓And indeed⚓COND|LEM:man★>anzalonaA^⚓We revealed⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★<ilayoka⚓to you⚓ N|LEM:Eaduw~|ROOT:Edw|M|INDEF|ACC★'aAya`tK]⚓Verses⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★bay~ina`tK⚓clear,⚓ N|LEM:malak|ROOT:mlk|MP|GEN★wamaA⚓and not⚓ N|LEM:rasuwl|ROOT:rsl|MP|GEN★yakofuru⚓**disbelieves in them⚓ PN|LEM:jiboriyl|M|GEN★bihaA^⚓**disbelieves in them⚓ PN|LEM:miykaY`l|M|GEN★<il~aA⚓except⚓ ACC|LEM:<in~|SP:<in~★{lofa`siquwna⚓the defiantly disobedient.⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★",
">awakul~amaA⚓And is (it not that) whenever⚓N|LEM:Eaduw~|ROOT:Edw|M|INDEF|NOM★Ea`haduwA@⚓they took⚓ N|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|GEN★EahodFA⚓a covenant,⚓ CERT|LEM:qad★n~aba*ahu,⚓threw it away⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|1P★fariyqN⚓a party⚓ P|LEM:<ilaY`★m~inohum⚓of them?⚓ N|LEM:'aAyap|ROOT:Ayy|FP|INDEF|ACC★balo⚓Nay,⚓ ADJ|LEM:bay~inap|ROOT:byn|FP|INDEF|ACC★>akovaruhumo⚓most of them⚓ NEG|LEM:maA★laA⚓(do) not⚓ V|IMPF|LEM:kafara|ROOT:kfr|3MS★yu&ominuwna⚓believe.⚓ PRON|3FS★",
"walam~aA⚓And when⚓RES|LEM:<il~aA★jaA^'ahumo⚓came to them⚓ N|ACT|PCPL|LEM:faAsiq|ROOT:fsq|MP|NOM★rasuwlN⚓a Messenger⚓ T|LEM:kul~amaA|ROOT:kll★m~ino⚓**from Allah⚓ V|PERF|(III)|LEM:Ea`hada|ROOT:Ehd|3MP★Eindi⚓**from Allah⚓ N|LEM:Eahod|ROOT:Ehd|M|INDEF|ACC★{ll~ahi⚓**from Allah⚓ V|PERF|LEM:naba*a|ROOT:nb*|3MS★muSad~iqN⚓**confirming what⚓ N|LEM:fariyq|ROOT:frq|M|INDEF|NOM★l~imaA⚓**confirming what⚓ P|LEM:min★maEahumo⚓(was) with them,⚓ RET|LEM:bal★naba*a⚓threw away⚓ N|LEM:>akovar|ROOT:kvr|MS|NOM★fariyqN⚓a party⚓ NEG|LEM:laA★m~ina⚓of⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★{l~a*iyna⚓those who⚓ T|LEM:lam~aA★>uwtuwA@⚓were given⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3MS★{lokita`ba⚓the Book⚓ N|LEM:rasuwl|ROOT:rsl|M|INDEF|NOM★kita`ba⚓**Allah`s Book⚓ P|LEM:min★{ll~ahi⚓**Allah`s Book⚓ N|LEM:Eind|ROOT:End|GEN★waraA^'a⚓behind⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★Zuhuwrihimo⚓their backs⚓ ADJ|ACT|PCPL|(II)|LEM:muSad~iq|ROOT:Sdq|M|INDEF|NOM★ka>an~ahumo⚓as if they⚓ REL|LEM:maA★laA⚓(do) not.⚓ LOC|LEM:maE|ACC★yaEolamuwna⚓know⚓ V|PERF|LEM:naba*a|ROOT:nb*|3MS★",
"wa{t~abaEuwA@⚓And they followed⚓N|LEM:fariyq|ROOT:frq|M|INDEF|NOM★maA⚓what⚓ P|LEM:min★tatoluwA@⚓recite(d)⚓ REL|LEM:{l~a*iY|MP★{l$~aya`Tiynu⚓the devils⚓ V|PERF|PASS|(IV)|LEM:A^taY|ROOT:Aty|3MP★EalaY`⚓over⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★muloki⚓(the) kingdom⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★sulayoma`na⚓(of) Sulaiman.⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wamaA⚓And not⚓ LOC|LEM:waraA^'|ROOT:wry|ACC★kafara⚓disbelieved⚓ N|LEM:Zahor|ROOT:Zhr|MP|GEN★sulayoma`nu⚓Sulaiman⚓ ACC|LEM:ka>an~|SP:<in~★wala`kin~a⚓[and] but⚓ NEG|LEM:laA★{l$~aya`Tiyna⚓the devils⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MP★kafaruwA@⚓disbelieved,⚓ V|PERF|(VIII)|LEM:{t~abaEa|ROOT:tbE|3MP★yuEal~imuwna⚓they teach⚓ REL|LEM:maA★{ln~aAsa⚓the people⚓ V|IMPF|LEM:talaY`|ROOT:tlw|3FS★{ls~iHora⚓[the] magic⚓ PN|LEM:$ayoTa`n|ROOT:$Tn|MP|NOM★wamaA^⚓and what⚓ P|LEM:EalaY`★>unzila⚓was sent down⚓ N|LEM:mulok|ROOT:mlk|M|GEN★EalaY⚓to⚓ PN|LEM:sulayoma`n|GEN★{lomalakayoni⚓the two angels⚓ NEG|LEM:maA★bibaAbila⚓in Babylon,⚓ V|PERF|LEM:kafara|ROOT:kfr|3MS★ha`ruwta⚓Harut⚓ PN|LEM:sulayoma`n|NOM★wama`ruwta⚓and Marut.⚓ ACC|LEM:la`kin~|SP:<in~★wamaA⚓And not⚓ PN|LEM:$ayoTa`n|ROOT:$Tn|MP|ACC★yuEal~imaAni⚓they both teach⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★mino⚓any⚓ V|IMPF|(II)|LEM:Eal~ama|ROOT:Elm|3MP★>aHadK⚓one⚓ N|LEM:n~aAs|ROOT:nws|MP|ACC★Hat~aY`⚓unless⚓ N|LEM:siHor|ROOT:sHr|M|ACC★yaquwlaA^⚓they [both] say,⚓ REL|LEM:maA★<in~amaA⚓`Only⚓ V|PERF|PASS|(IV)|LEM:>anzala|ROOT:nzl|3MS★naHonu⚓we⚓ P|LEM:EalaY`★fitonapN⚓(are) a trial,⚓ N|LEM:malak|ROOT:mlk|MD|GEN★falaA⚓so (do) not⚓ PN|LEM:baAbil|GEN★takofuro⚓disbelieve.`⚓ PN|LEM:ha`ruwt|M|GEN★fayataEal~amuwna⚓But they learn⚓ PN|LEM:ma`ruwt|M|GEN★minohumaA⚓from those two⚓ NEG|LEM:maA★maA⚓what⚓ V|IMPF|(II)|LEM:Eal~ama|ROOT:Elm|3MD★yufar~iquwna⚓[they] causes separation⚓ P|LEM:min★bihi.⚓with it⚓ N|LEM:>aHad|ROOT:AHd|M|INDEF|GEN★bayona⚓between⚓ P|LEM:Hat~aY`★{lomaro'i⚓the man⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MD|MOOD:SUBJ★wazawojihi.⚓and his spouse.⚓ ACC|LEM:<in~|SP:<in~★wamaA⚓And not⚓ PREV|LEM:maA★hum⚓they (could)⚓ PRON|1P★biDaA^r~iyna⚓at all [be those who] harm⚓ N|LEM:fitonap|ROOT:ftn|F|INDEF|NOM★bihi.⚓with it⚓ NEG|LEM:laA★mino⚓any⚓ V|IMPF|LEM:kafara|ROOT:kfr|2MS|MOOD:JUS★>aHadK⚓one⚓ V|IMPF|(V)|LEM:yataEal~amu|ROOT:Elm|3MP★<il~aA⚓except⚓ P|LEM:min★bi<i*oni⚓by permission⚓ REL|LEM:maA★{ll~ahi⚓(of) Allah.⚓ V|IMPF|(II)|LEM:far~aqu|ROOT:frq|3MP★wayataEal~amuwna⚓And they learn⚓ PRON|3MS★maA⚓what⚓ LOC|LEM:bayon|ROOT:byn|ACC★yaDur~uhumo⚓harms them⚓ N|LEM:maro'|ROOT:mrA|M|GEN★walaA⚓and not⚓ N|LEM:zawoj|ROOT:zwj|M|GEN★yanfaEuhumo⚓profits them.⚓ NEG|LEM:maA|SP:kaAn★walaqado⚓And indeed⚓ PRON|3MP★EalimuwA@⚓they knew⚓ N|ACT|PCPL|LEM:DaA^r~|ROOT:Drr|MP|GEN★lamani⚓that whoever⚓ PRON|3MS★{$otaraY`hu⚓buys it,⚓ P|LEM:min★maA⚓not⚓ N|LEM:>aHad|ROOT:AHd|M|INDEF|GEN★lahu,⚓for him⚓ EXP|LEM:<il~aA★fiY⚓in⚓ N|LEM:<i*on|ROOT:A*n|M|GEN★{lo'aAxirapi⚓the Hereafter⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★mino⚓any⚓ V|IMPF|(V)|LEM:yataEal~amu|ROOT:Elm|3MP★xala`qK⚓share.⚓ REL|LEM:maA★walabi}osa⚓And surely evil⚓ V|IMPF|LEM:yaDur~a|ROOT:Drr|3MS★maA⚓(is) what⚓ NEG|LEM:laA★$arawoA@⚓they sold⚓ V|IMPF|LEM:nafaEa|ROOT:nfE|3MS★bihi.^⚓with it⚓ CERT|LEM:qad★>anfusahumo⚓themselves,⚓ V|PERF|LEM:Ealima|ROOT:Elm|3MP★lawo⚓if⚓ COND|LEM:man★kaAnuwA@⚓they were⚓ V|PERF|(VIII)|LEM:{$otaraY`|ROOT:$ry|3MS★yaEolamuwna⚓(to) know.⚓ NEG|LEM:maA★",
"walawo⚓And if⚓PRON|3MS★>an~ahumo⚓[that] they⚓ P|LEM:fiY★'aAmanuwA@⚓(had) believed⚓ N|LEM:A^xir|ROOT:Axr|FS|GEN★wa{t~aqawoA@⚓and feared (Allah),⚓ P|LEM:min★lamavuwbapN⚓surely (the) reward⚓ N|LEM:xala`q|ROOT:xlq|M|INDEF|GEN★m~ino⚓**from⚓ V|PERF|LEM:bi}osa|ROOT:bAs|3MS★Eindi⚓**from⚓ REL|LEM:maA★{ll~ahi⚓Allah⚓ V|PERF|LEM:$ara|ROOT:$ry|3MP★xayorN⚓(would have been) better,⚓ PRON|3MS★l~awo⚓if⚓ N|LEM:nafos|ROOT:nfs|FP|ACC★kaAnuwA@⚓they were⚓ COND|LEM:law★yaEolamuwna⚓(to) know.⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★",
"ya`^>ay~uhaA⚓O you⚓V|IMPF|LEM:Ealima|ROOT:Elm|3MP★{l~a*iyna⚓who⚓ COND|LEM:law★'aAmanuwA@⚓believe[d]!⚓ ACC|LEM:>an~|SP:<in~★laA⚓`(Do) not⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★taquwluwA@⚓say⚓ V|PERF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|3MP★ra`EinaA⚓`Raina`⚓ N|VN|LEM:mavuwbap|ROOT:vwb|F|INDEF|NOM★waquwluwA@⚓and say⚓ P|LEM:min★{nZuronaA⚓`Unzurna`⚓ N|LEM:Eind|ROOT:End|GEN★wa{somaEuwA@⚓and listen.⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★waliloka`firiyna⚓And for the disbelievers⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★Ea*aAbN⚓(is) a punishment⚓ COND|LEM:law★>aliymN⚓painful.⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★",
"m~aA⚓(Do) not⚓V|IMPF|LEM:Ealima|ROOT:Elm|3MP★yawad~u⚓like⚓ N|LEM:>ay~uhaA|NOM★{l~a*iyna⚓those who⚓ REL|LEM:{l~a*iY|MP★kafaruwA@⚓disbelieve⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★mino⚓from⚓ PRO|LEM:laA★>aholi⚓**(the) People of the Book⚓ V|IMPF|LEM:qaAla|ROOT:qwl|2MP|MOOD:JUS★{lokita`bi⚓**(the) People of the Book⚓ V|IMPV|(III)|LEM:ra`Ei|ROOT:rEy|2MS★walaA⚓and not⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MP★{lomu$orikiyna⚓those who associate partners (with Allah),⚓ V|IMPV|LEM:n~aZara|ROOT:nZr|2MS★>an⚓that⚓ V|IMPV|LEM:samiEa|ROOT:smE|2MP★yunaz~ala⚓(there should) be sent down⚓ N|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|GEN★Ealayokum⚓to you⚓ N|LEM:Ea*aAb|ROOT:E*b|M|INDEF|NOM★m~ino⚓any⚓ ADJ|LEM:>aliym|ROOT:Alm|MS|INDEF|NOM★xayorK⚓good⚓ NEG|LEM:maA★m~in⚓from⚓ V|IMPF|LEM:wad~a|ROOT:wdd|3MS★r~ab~ikumo⚓your Lord.⚓ REL|LEM:{l~a*iY|MP★wa{ll~ahu⚓And Allah⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★yaxotaS~u⚓chooses⚓ P|LEM:min★biraHomatihi.⚓for His Mercy⚓ N|LEM:>ahol|ROOT:Ahl|M|GEN★man⚓whom⚓ N|LEM:kita`b|ROOT:ktb|M|GEN★ya$aA^'u⚓He wills.⚓ NEG|LEM:laA★wa{ll~ahu⚓And Allah⚓ N|ACT|PCPL|(IV)|LEM:mu$orik|ROOT:$rk|MP|GEN★*uw⚓**(is the) Possessor of [the] Bounty⚓ SUB|LEM:>an★{lofaDoli⚓**(is the) Possessor of [the] Bounty⚓ V|IMPF|PASS|(II)|LEM:naz~ala|ROOT:nzl|3MS|MOOD:SUBJ★{loEaZiymi⚓[the] Great.⚓ P|LEM:EalaY`★",
"maA⚓**What We abrogate⚓P|LEM:min★nansaxo⚓**What We abrogate⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|GEN★mino⚓(of)⚓ P|LEM:min★'aAyapK⚓a sign⚓ N|LEM:rab~|ROOT:rbb|M|GEN★>awo⚓or⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★nunsihaA⚓[We] cause it to be forgotten,⚓ V|IMPF|(VIII)|LEM:yaxotaS~u|ROOT:xSS|3MS★na>oti⚓We bring⚓ N|LEM:raHomap|ROOT:rHm|F|GEN★bixayorK⚓better⚓ REL|LEM:man★m~inohaA^⚓than it⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★>awo⚓or⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★mivolihaA^⚓similar (to) it.⚓ N|LEM:*uw|MS|NOM★>alamo⚓Do not⚓ N|LEM:faDol|ROOT:fDl|M|GEN★taEolamo⚓you know⚓ ADJ|LEM:EaZiym|ROOT:EZm|MS|GEN★>an~a⚓that⚓ COND|LEM:maA★{ll~aha⚓Allah⚓ V|IMPF|LEM:yansaxu|ROOT:nsx|1P|MOOD:JUS★EalaY`⚓over⚓ P|LEM:min★kul~i⚓**everything⚓ N|LEM:'aAyap|ROOT:Ayy|FS|INDEF|GEN★$aYo'K⚓**everything⚓ CONJ|LEM:>aw★qadiyrN⚓(is) All-Powerful?⚓ V|IMPF|(IV)|LEM:>ansaY`|ROOT:nsy|1P|MOOD:JUS★",
">alamo⚓Do not⚓V|IMPF|LEM:>ataY|ROOT:Aty|1P|MOOD:JUS★taEolamo⚓you know⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|GEN★>an~a⚓that,⚓ P|LEM:min★{ll~aha⚓Allah⚓ CONJ|LEM:>aw★lahu,⚓for Him⚓ N|LEM:mivol|ROOT:mvl|M|GEN★muloku⚓(is the) Kingdom⚓ NEG|LEM:lam★{ls~ama`wa`ti⚓(of) the heavens⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MS|MOOD:JUS★wa{lo>aroDi⚓and the earth?⚓ ACC|LEM:>an~|SP:<in~★wamaA⚓And not⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★lakum⚓(is) for you⚓ P|LEM:EalaY`★m~in⚓**besides⚓ N|LEM:kul~|ROOT:kll|M|GEN★duwni⚓**besides⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★{ll~ahi⚓Allah⚓ N|LEM:qadiyr|ROOT:qdr|M|INDEF|NOM★min⚓any⚓ NEG|LEM:lam★waliY~K⚓protector⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MS|MOOD:JUS★walaA⚓and not⚓ ACC|LEM:>an~|SP:<in~★naSiyrK⚓any helper.⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★",
">amo⚓Or⚓PRON|3MS★turiyduwna⚓(do) you wish⚓ N|LEM:mulok|ROOT:mlk|M|NOM★>an⚓that⚓ N|LEM:samaA^'|ROOT:smw|FP|GEN★taso_#aluwA@⚓you ask⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★rasuwlakumo⚓your Messenger⚓ NEG|LEM:maA★kamaA⚓as⚓ PRON|2MP★su}ila⚓was asked⚓ P|LEM:min★muwsaY`⚓Musa⚓ N|LEM:duwn|ROOT:dwn|GEN★min⚓**before?⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★qabolu⚓**before?⚓ P|LEM:min★waman⚓And whoever⚓ N|LEM:waliY~|ROOT:wly|M|INDEF|GEN★yatabad~ali⚓exchanges⚓ NEG|LEM:laA★{lokufora⚓[the] disbelief⚓ N|LEM:naSiyr|ROOT:nSr|MS|INDEF|GEN★bi{lo<iyma`ni⚓with [the] faith,⚓ CONJ|LEM:>am★faqado⚓so certainly⚓ V|IMPF|(IV)|LEM:>araAda|ROOT:rwd|2MP★Dal~a⚓he went astray (from)⚓ SUB|LEM:>an★sawaA^'a⚓(the) evenness⚓ V|IMPF|LEM:sa>ala|ROOT:sAl|2MP|MOOD:SUBJ★{ls~abiyli⚓(of) the way.⚓ N|LEM:rasuwl|ROOT:rsl|M|ACC★",
"wad~a⚓**Wish[ed] many⚓SUB|LEM:maA★kaviyrN⚓**Wish[ed] many⚓ V|PERF|PASS|LEM:sa>ala|ROOT:sAl|3MS★m~ino⚓from⚓ PN|LEM:muwsaY`|M|NOM★>aholi⚓**(the) People of the Book⚓ P|LEM:min★{lokita`bi⚓**(the) People of the Book⚓ N|LEM:qabol|ROOT:qbl|GEN★lawo⚓if⚓ COND|LEM:man★yarud~uwnakum⚓they could turn you back⚓ V|IMPF|(V)|LEM:yatabad~ali|ROOT:bdl|3MS|MOOD:JUS★m~in[⚓**after⚓ N|LEM:kufor|ROOT:kfr|M|ACC★baEodi⚓**after⚓ N|VN|(IV)|LEM:<iyma`n|ROOT:Amn|M|GEN★<iyma`nikumo⚓your (having) faith⚓ CERT|LEM:qad★kuf~aArFA⚓(to) disbelievers,⚓ V|PERF|LEM:Dal~a|ROOT:Dll|3MS★HasadFA⚓(out of) jealousy⚓ N|LEM:sawaA^'|ROOT:swy|M|ACC★m~ino⚓**from⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★Eindi⚓**from⚓ V|PERF|LEM:wad~a|ROOT:wdd|3MS★>anfusihim⚓themselves,⚓ N|LEM:kaviyr|ROOT:kvr|MS|INDEF|NOM★m~in[⚓**(even) after⚓ P|LEM:min★baEodi⚓**(even) after⚓ N|LEM:>ahol|ROOT:Ahl|M|GEN★maA⚓[what]⚓ N|LEM:kita`b|ROOT:ktb|M|GEN★tabay~ana⚓became clear⚓ SUB|LEM:law★lahumu⚓to them,⚓ V|IMPF|LEM:rad~a|ROOT:rdd|3MP★{loHaq~u⚓the truth.⚓ P|LEM:min★fa{EofuwA@⚓So forgive⚓ N|LEM:baEod|ROOT:bEd|GEN★wa{SofaHuwA@⚓and overlook⚓ N|VN|(IV)|LEM:<iyma`n|ROOT:Amn|M|GEN★Hat~aY`⚓until⚓ N|LEM:kaAfir|ROOT:kfr|MP|INDEF|ACC★ya>otiYa⚓**Allah brings⚓ N|LEM:Hasad|ROOT:Hsd|M|INDEF|ACC★{ll~ahu⚓**Allah brings⚓ P|LEM:min★bi>amorihi.^⚓His Command.⚓ N|LEM:Eind|ROOT:End|GEN★<in~a⚓Indeed,⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★{ll~aha⚓Allah⚓ P|LEM:min★EalaY`⚓on⚓ N|LEM:baEod|ROOT:bEd|GEN★kul~i⚓every⚓ REL|LEM:maA★$aYo'K⚓thing⚓ V|PERF|(V)|LEM:tabay~ana|ROOT:byn|3MS★qadiyrN⚓(is) All-Powerful.⚓ PRON|3MP★",
"wa>aqiymuwA@⚓And establish⚓N|LEM:Haq~|ROOT:Hqq|M|NOM★{lS~alaw`pa⚓the prayer⚓ V|IMPV|LEM:EafaA|ROOT:Efw|2MP★wa'aAtuwA@⚓and give⚓ V|IMPV|LEM:yaSofaHu|ROOT:SfH|2MP★{lz~akaw`pa⚓[the] zakah.⚓ P|LEM:Hat~aY`★wamaA⚓And whatever⚓ V|IMPF|LEM:>ataY|ROOT:Aty|3MS|MOOD:SUBJ★tuqad~imuwA@⚓you send forth⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★li>anfusikum⚓for yourselves⚓ N|LEM:>amor|ROOT:Amr|M|GEN★m~ino⚓of⚓ ACC|LEM:<in~|SP:<in~★xayorK⚓good (deeds),⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★tajiduwhu⚓you will find it⚓ P|LEM:EalaY`★Einda⚓**with Allah.⚓ N|LEM:kul~|ROOT:kll|M|GEN★{ll~ahi⚓**with Allah.⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★<in~a⚓**Indeed, Allah⚓ N|LEM:qadiyr|ROOT:qdr|M|INDEF|NOM★{ll~aha⚓**Indeed, Allah⚓ V|IMPV|(IV)|LEM:>aqaAma|ROOT:qwm|2MP★bimaA⚓of what⚓ N|LEM:Salaw`p|ROOT:Slw|F|ACC★taEomaluwna⚓you do⚓ V|IMPV|(IV)|LEM:A^taY|ROOT:Aty|2MP★baSiyrN⚓(is) All-Seer.⚓ N|LEM:zakaw`p|ROOT:zkw|F|ACC★",
"waqaAluwA@⚓And they said,⚓COND|LEM:maA★lan⚓`Never⚓ V|IMPF|(II)|LEM:qad~ama|ROOT:qdm|2MP|MOOD:JUS★yadoxula⚓will enter⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★{lojan~apa⚓the Paradise⚓ P|LEM:min★<il~aA⚓except⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|GEN★man⚓who⚓ V|IMPF|LEM:wajada|ROOT:wjd|2MP|MOOD:JUS★kaAna⚓is⚓ LOC|LEM:Eind|ROOT:End|ACC★huwdFA⚓(a) Jew[s]⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★>awo⚓or⚓ ACC|LEM:<in~|SP:<in~★naSa`raY`⚓(a) Christian[s].`⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★tiloka⚓That⚓ REL|LEM:maA★>amaAniy~uhumo⚓(is) their wishful thinking.⚓ V|IMPF|LEM:Eamila|ROOT:Eml|2MP★qulo⚓Say,⚓ N|LEM:baSiyr|ROOT:bSr|MS|INDEF|NOM★haAtuwA@⚓`Bring⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★buroha`nakumo⚓your proof⚓ NEG|LEM:lan★<in⚓if⚓ V|IMPF|LEM:daxala|ROOT:dxl|3MS|MOOD:SUBJ★kuntumo⚓you are⚓ PN|LEM:jan~ap|ROOT:jnn|F|ACC★Sa`diqiyna⚓[those who are] truthful.`⚓ RES|LEM:<il~aA★",
"balaY`⚓Yes,⚓REL|LEM:man★mano⚓whoever⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★>asolama⚓submits⚓ PN|LEM:huwd2|ROOT:hwd|M|INDEF|ACC★wajohahu,⚓his face⚓ CONJ|LEM:>aw★lil~ahi⚓to Allah⚓ PN|LEM:naSoraAniy~|ROOT:nSr|P|ACC★wahuwa⚓and he⚓ DEM|LEM:*a`lik|FS★muHosinN⚓(is) a good-doer,⚓ N|LEM:>umoniy~at|ROOT:mny|MP|NOM★falahu,^⚓so for him⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★>ajoruhu,⚓(is) his reward⚓ V|IMPV|LEM:haAtu|ROOT:hAt|2MP★Einda⚓with⚓ N|LEM:buroha`n|ROOT:brhn|M|ACC★rab~ihi.⚓his Lord.⚓ COND|LEM:<in★walaA⚓And no⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★xawofN⚓fear⚓ N|ACT|PCPL|LEM:SaAdiq|ROOT:Sdq|MP|ACC★Ealayohimo⚓(will be) on them⚓ ANS|LEM:balaY`★walaA⚓and not⚓ COND|LEM:man★humo⚓they⚓ V|PERF|(IV)|LEM:>asolama|ROOT:slm|3MS★yaHozanuwna⚓(will) grieve.⚓ N|LEM:wajoh|ROOT:wjh|M|ACC★",
"waqaAlati⚓And said⚓PN|LEM:{ll~ah|ROOT:Alh|GEN★{loyahuwdu⚓the Jews,⚓ PRON|3MS★layosati⚓`Not⚓ N|ACT|PCPL|(IV)|LEM:muHosin|ROOT:Hsn|M|INDEF|NOM★{ln~aSa`raY`⚓the Christians⚓ PRON|3MS★EalaY`⚓(are) on⚓ N|LEM:>ajor|ROOT:Ajr|M|NOM★$aYo'K⚓anything,`⚓ LOC|LEM:Eind|ROOT:End|ACC★waqaAlati⚓and said⚓ N|LEM:rab~|ROOT:rbb|M|GEN★{ln~aSa`raY`⚓the Christians,⚓ NEG|LEM:laA★layosati⚓`Not⚓ N|LEM:xawof|ROOT:xwf|M|INDEF|NOM★{loyahuwdu⚓the Jews⚓ P|LEM:EalaY`★EalaY`⚓(are) on⚓ NEG|LEM:laA★$aYo'K⚓anything,`⚓ PRON|3MP★wahumo⚓although they⚓ V|IMPF|LEM:yaHozun|ROOT:Hzn|3MP★yatoluwna⚓recite⚓ V|PERF|LEM:qaAla|ROOT:qwl|3FS★{lokita`ba⚓the Book.⚓ PN|LEM:yahuwdiy~|MP|NOM★ka*a`lika⚓Like that⚓ V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|3FS★qaAla⚓said⚓ PN|LEM:naSoraAniy~|ROOT:nSr|P|NOM★{l~a*iyna⚓those who⚓ P|LEM:EalaY`★laA⚓(do) not⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★yaEolamuwna⚓know,⚓ V|PERF|LEM:qaAla|ROOT:qwl|3FS★mivola⚓similar⚓ PN|LEM:naSoraAniy~|ROOT:nSr|P|NOM★qawolihimo⚓their saying.⚓ V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|3FS★fa{ll~ahu⚓[So] Allah⚓ PN|LEM:yahuwdiy~|MP|NOM★yaHokumu⚓will judge⚓ P|LEM:EalaY`★bayonahumo⚓between them⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★yawoma⚓(on the) Day⚓ PRON|3MP★{loqiya`mapi⚓(of) Resurrection⚓ V|IMPF|LEM:talaY`|ROOT:tlw|3MP★fiymaA⚓in what⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★kaAnuwA@⚓they were⚓ DEM|LEM:*a`lik|MS★fiyhi⚓[in it]⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★yaxotalifuwna⚓differing.⚓ REL|LEM:{l~a*iY|MP★",
"wamano⚓And who⚓NEG|LEM:laA★>aZolamu⚓(is) more unjust⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MP★mim~an⚓than (one) who⚓ N|LEM:mivol|ROOT:mvl|M|ACC★m~anaEa⚓prevents⚓ N|VN|LEM:qawol|ROOT:qwl|M|GEN★masa`jida⚓(the) masajid⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{ll~ahi⚓(of) Allah⚓ V|IMPF|LEM:Hakama|ROOT:Hkm|3MS★>an⚓to⚓ LOC|LEM:bayon|ROOT:byn|ACC★yu*okara⚓be mentioned⚓ T|LEM:yawom|ROOT:ywm|M|ACC★fiyhaA⚓in them⚓ N|LEM:qiya`map|ROOT:qwm|F|GEN★{somuhu,⚓His name,⚓ P|LEM:fiY★wasaEaY`⚓and strives⚓ REL|LEM:maA★fiY⚓for⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★xaraAbihaA^⚓their destruction?⚓ P|LEM:fiY★>uw@la`^}ika⚓Those!⚓ V|IMPF|(VIII)|LEM:{xotalafa|ROOT:xlf|3MP★maA⚓Not⚓ INTG|LEM:man★kaAna⚓it is⚓ N|LEM:>aZolam|ROOT:Zlm|MS|NOM★lahumo⚓for them⚓ P|LEM:min★>an⚓that⚓ REL|LEM:man★yadoxuluwhaA^⚓they enter them⚓ V|PERF|LEM:m~anaEa|ROOT:mnE|3MS★<il~aA⚓except⚓ N|LEM:masojid|ROOT:sjd|MP|ACC★xaA^}ifiyna⚓(like) those in fear.⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★lahumo⚓For them⚓ SUB|LEM:>an★fiY⚓in⚓ V|IMPF|PASS|LEM:*akara|ROOT:*kr|3MS|MOOD:SUBJ★{ld~unoyaA⚓the world⚓ P|LEM:fiY★xizoYN⚓(is) disgrace⚓ N|LEM:{som|ROOT:smw|M|NOM★walahumo⚓and for them⚓ V|PERF|LEM:saEaY`|ROOT:sEy|3MS★fiY⚓in⚓ P|LEM:fiY★{lo'aAxirapi⚓the Hereafter⚓ N|LEM:xaraAb|ROOT:xrb|M|GEN★Ea*aAbN⚓(is) a punishment⚓ DEM|LEM:>uwla`^}ik|P★EaZiymN⚓great.⚓ NEG|LEM:maA★",
"walil~ahi⚓And for Allah⚓V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★{loma$oriqu⚓(is) the east⚓ PRON|3MP★wa{lomagoribu⚓and the west,⚓ SUB|LEM:>an★fa>ayonamaA⚓so wherever⚓ V|IMPF|LEM:daxala|ROOT:dxl|3MP|MOOD:SUBJ★tuwal~uwA@⚓you turn⚓ RES|LEM:<il~aA★favam~a⚓[so] there⚓ N|ACT|PCPL|LEM:xaA^}if|ROOT:xwf|MP|ACC★wajohu⚓(is the) face⚓ PRON|3MP★{ll~ahi⚓(of) Allah.⚓ P|LEM:fiY★<in~a⚓Indeed,⚓ N|LEM:d~unoyaA|ROOT:dnw|FS|GEN★{ll~aha⚓Allah⚓ N|LEM:xizoY|ROOT:xzy|M|INDEF|NOM★wa`siEN⚓(is) All-Encompassing,⚓ PRON|3MP★EaliymN⚓All-Knowing.⚓ P|LEM:fiY★",
"waqaAluwA@⚓And they said,⚓N|LEM:A^xir|ROOT:Axr|FS|GEN★{t~axa*a⚓**`Allah has taken⚓ N|LEM:Ea*aAb|ROOT:E*b|M|INDEF|NOM★{ll~ahu⚓**`Allah has taken⚓ ADJ|LEM:EaZiym|ROOT:EZm|MS|INDEF|NOM★waladFA⚓a son.`⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★suboHa`nahu,⚓Glory be to Him!⚓ N|LEM:ma$oriq|ROOT:$rq|M|NOM★bal⚓Nay,⚓ N|LEM:magorib|ROOT:grb|M|NOM★l~ahu,⚓for Him⚓ COND|LEM:>ayon★maA⚓(is) what⚓ V|IMPF|(II)|LEM:wal~aY`|ROOT:wly|2MP|MOOD:JUS★fiY⚓(is) in⚓ LOC|LEM:vam~★{ls~ama`wa`ti⚓the heavens⚓ N|LEM:wajoh|ROOT:wjh|M|NOM★wa{lo>aroDi⚓and the earth.⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★kul~N⚓All⚓ ACC|LEM:<in~|SP:<in~★l~ahu,⚓to Him⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★qa`nituwna⚓(are) humbly obedient.⚓ N|ACT|PCPL|LEM:wa`siE|ROOT:wsE|M|INDEF|NOM★",
"badiyEu⚓(The) Originator⚓ADJ|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★{ls~ama`wa`ti⚓(of) the heavens⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★wa{lo>aroDi⚓and the earth!⚓ V|PERF|(VIII)|LEM:{t~axa*a|ROOT:Ax*|3MS★wa<i*aA⚓And when⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★qaDaY`^⚓He decrees⚓ N|LEM:walad|ROOT:wld|M|INDEF|ACC★>amorFA⚓a matter,⚓ N|LEM:suboHa`n|ROOT:sbH|M|ACC★fa<in~amaA⚓[so] only⚓ RET|LEM:bal★yaquwlu⚓He says⚓ PRON|3MS★lahu,⚓to it⚓ REL|LEM:maA★kun⚓`Be,`⚓ P|LEM:fiY★fayakuwnu⚓and it becomes.⚓ N|LEM:samaA^'|ROOT:smw|FP|GEN★",
"waqaAla⚓And said⚓N|LEM:>aroD|ROOT:ArD|F|GEN★{l~a*iyna⚓those who⚓ N|LEM:kul~|ROOT:kll|M|INDEF|NOM★laA⚓(do) not⚓ PRON|3MS★yaEolamuwna⚓know,⚓ N|ACT|PCPL|LEM:qaAnit|ROOT:qnt|MP|NOM★lawolaA⚓`Why not⚓ N|LEM:badiyE|ROOT:bdE|MS|NOM★yukal~imunaA⚓**Allah speaks to us⚓ N|LEM:samaA^'|ROOT:smw|FP|GEN★{ll~ahu⚓**Allah speaks to us⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★>awo⚓or⚓ T|LEM:<i*aA★ta>otiynaA^⚓comes to us⚓ V|PERF|LEM:qaDaY`^|ROOT:qDy|3MS★'aAyapN⚓a sign?`⚓ N|LEM:>amor|ROOT:Amr|M|INDEF|ACC★ka*a`lika⚓Like that⚓ ACC|LEM:<in~|SP:<in~★qaAla⚓said⚓ PREV|LEM:maA★{l~a*iyna⚓those⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MS★min⚓**before them⚓ PRON|3MS★qabolihim⚓**before them⚓ V|IMPV|LEM:kaAna|ROOT:kwn|2MS★m~ivola⚓similar⚓ V|IMPF|LEM:kaAna|ROOT:kwn|3MS★qawolihimo⚓their saying.⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★ta$a`bahato⚓Became alike⚓ REL|LEM:{l~a*iY|MP★quluwbuhumo⚓their hearts.⚓ NEG|LEM:laA★qado⚓Indeed,⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MP★bay~an~aA⚓We have made clear⚓ EXH|LEM:lawolaA^★{lo'aAya`ti⚓the signs⚓ V|IMPF|(II)|LEM:kal~ama|ROOT:klm|3MS★liqawomK⚓for people⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★yuwqinuwna⚓(who) firmly believe.⚓ CONJ|LEM:>aw★",
"<in~aA^⚓Indeed We!⚓V|IMPF|LEM:>ataY|ROOT:Aty|3FS★>arosalona`ka⚓[We] have sent you⚓ N|LEM:'aAyap|ROOT:Ayy|FS|INDEF|NOM★bi{loHaq~i⚓with the truth,⚓ DEM|LEM:*a`lik|MS★ba$iyrFA⚓(as) a bearer of good news⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★wana*iyrFA⚓and (as) a warner.⚓ REL|LEM:{l~a*iY|MP★walaA⚓And not⚓ P|LEM:min★tuso_#alu⚓you will be asked⚓ N|LEM:qabol|ROOT:qbl|GEN★Eano⚓about⚓ N|LEM:mivol|ROOT:mvl|M|ACC★>aSoHa`bi⚓(the) companions⚓ N|VN|LEM:qawol|ROOT:qwl|M|GEN★{lojaHiymi⚓(of) the blazing Fire.⚓ V|PERF|(VI)|LEM:ta$a`baha|ROOT:$bh|3FS★",
"walan⚓And never⚓N|LEM:qalob|ROOT:qlb|FP|NOM★taroDaY`⚓will be pleased⚓ CERT|LEM:qad★Eanka⚓with you⚓ V|PERF|(II)|LEM:bay~anu|ROOT:byn|1P★{loyahuwdu⚓the Jews⚓ N|LEM:'aAyap|ROOT:Ayy|FP|ACC★walaA⚓and [not]⚓ N|LEM:qawom|ROOT:qwm|M|INDEF|GEN★{ln~aSa`raY`⚓the Christians⚓ V|IMPF|(IV)|LEM:yuwqinu|ROOT:yqn|3MP★Hat~aY`⚓until⚓ ACC|LEM:<in~|SP:<in~★tat~abiEa⚓you follow⚓ V|PERF|(IV)|LEM:>arosala|ROOT:rsl|1P★mil~atahumo⚓their religion.⚓ N|LEM:Haq~|ROOT:Hqq|M|GEN★qulo⚓Say,⚓ N|LEM:ba$iyr|ROOT:b$r|MS|INDEF|ACC★<in~a⚓`Indeed,⚓ N|LEM:na*iyr|ROOT:n*r|M|INDEF|ACC★hudaY⚓**(the) Guidance of Allah,⚓ NEG|LEM:laA★{ll~ahi⚓**(the) Guidance of Allah,⚓ V|IMPF|PASS|LEM:sa>ala|ROOT:sAl|2MS★huwa⚓it⚓ P|LEM:Ean★{lohudaY`⚓(is) the Guidance.`⚓ N|LEM:>aSoHa`b|ROOT:SHb|MP|GEN★wala}ini⚓And if⚓ N|LEM:jaHiym|ROOT:jHm|F|GEN★{t~abaEota⚓you follow⚓ NEG|LEM:lan★>ahowaA^'ahum⚓their desires⚓ V|IMPF|LEM:r~aDiYa|ROOT:rDw|3FS|MOOD:SUBJ★baEoda⚓after⚓ P|LEM:Ean★{l~a*iY⚓what⚓ PN|LEM:yahuwdiy~|MP|NOM★jaA^'aka⚓has come to you⚓ NEG|LEM:laA★mina⚓of⚓ PN|LEM:naSoraAniy~|ROOT:nSr|P|NOM★{loEilomi⚓the knowledge,⚓ P|LEM:Hat~aY`★maA⚓not⚓ V|IMPF|(VIII)|LEM:{t~abaEa|ROOT:tbE|2MS|MOOD:SUBJ★laka⚓for you⚓ N|LEM:mil~ap|ROOT:mll|F|ACC★mina⚓from⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★{ll~ahi⚓Allah⚓ ACC|LEM:<in~|SP:<in~★min⚓any⚓ N|LEM:hudFY|ROOT:hdy|M|ACC★waliY~K⚓protector⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★walaA⚓and not⚓ PRON|3MS★naSiyrK⚓any helper.⚓ N|LEM:hudFY|ROOT:hdy|M|NOM★",
"{l~a*iyna⚓Those,⚓COND|LEM:<in★'aAtayona`humu⚓We have given them⚓ V|PERF|(VIII)|LEM:{t~abaEa|ROOT:tbE|2MS★{lokita`ba⚓the Book⚓ N|LEM:>ahowaA^'|ROOT:hwy|MP|ACC★yatoluwnahu,⚓recite it⚓ T|LEM:baEod|ROOT:bEd|ACC★Haq~a⚓(as it has the) right⚓ REL|LEM:{l~a*iY|MS★tilaAwatihi.^⚓(of) its recitation.⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3MS★>uw@la`^}ika⚓Those (people)⚓ P|LEM:min★yu&ominuwna⚓believe⚓ N|LEM:Eilom|ROOT:Elm|M|GEN★bihi.⚓in it.⚓ NEG|LEM:maA★waman⚓And whoever⚓ PRON|2MS★yakofuro⚓disbelieves⚓ P|LEM:min★bihi.⚓in it,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★fa>uw@la`^}ika⚓then those,⚓ P|LEM:min★humu⚓they⚓ N|LEM:waliY~|ROOT:wly|M|INDEF|GEN★{loxa`siruwna⚓(are) the losers.⚓ NEG|LEM:laA★",
"ya`baniY^⚓O Children⚓N|LEM:naSiyr|ROOT:nSr|MS|INDEF|GEN★<isora`^'iyla⚓(of) Israel!⚓ REL|LEM:{l~a*iY|MP★{*okuruwA@⚓Remember⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|1P★niEomatiYa⚓My Favor⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★{l~atiY^⚓which⚓ V|IMPF|LEM:talaY`|ROOT:tlw|3MP★>anoEamotu⚓I bestowed⚓ N|LEM:Haq~|ROOT:Hqq|M|ACC★Ealayokumo⚓upon you⚓ N|LEM:tilaAwat|ROOT:tlw|F|GEN★wa>an~iY⚓and that I⚓ DEM|LEM:>uwla`^}ik|P★faD~alotukumo⚓[I] preferred you⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★EalaY⚓over⚓ PRON|3MS★{loEa`lamiyna⚓the worlds.⚓ COND|LEM:man★",
"wa{t~aquwA@⚓And fear⚓V|IMPF|LEM:kafara|ROOT:kfr|3MS|MOOD:JUS★yawomFA⚓a day⚓ PRON|3MS★l~aA⚓not⚓ DEM|LEM:>uwla`^}ik|P★tajoziY⚓will avail⚓ PRON|3MP★nafosN⚓a soul⚓ N|ACT|PCPL|LEM:xa`siriyn|ROOT:xsr|MP|NOM★Ean⚓**(another) soul⚓ N|LEM:bunaY~|ROOT:bny|MP|ACC★n~afosK⚓**(another) soul⚓ PN|LEM:<isoraA}iyl|GEN★$ayo_#FA⚓anything⚓ V|IMPV|LEM:*akara|ROOT:*kr|2MP★walaA⚓and not⚓ N|LEM:niEomap|ROOT:nEm|F|ACC★yuqobalu⚓will be accepted⚓ REL|LEM:{l~a*iY|FS★minohaA⚓from it⚓ V|PERF|(IV)|LEM:>anoEama|ROOT:nEm|1S★EadolN⚓any compensation,⚓ P|LEM:EalaY`★walaA⚓and not⚓ ACC|LEM:>an~|SP:<in~★tanfaEuhaA⚓will benefit it⚓ V|PERF|(II)|LEM:faD~ala|ROOT:fDl|1S★$afa`EapN⚓any intercession,⚓ P|LEM:EalaY`★walaA⚓and not⚓ N|LEM:Ea`lamiyn|ROOT:Elm|MP|GEN★humo⚓they⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★yunSaruwna⚓will be helped.⚓ N|LEM:yawom|ROOT:ywm|M|INDEF|ACC★",
"wa<i*i⚓And when⚓NEG|LEM:laA★{botalaY`^⚓tried⚓ V|IMPF|LEM:jazaY`|ROOT:jzy|3FS★<ibora`hi.ma⚓Ibrahim⚓ N|LEM:nafos|ROOT:nfs|FS|INDEF|NOM★rab~uhu,⚓his Lord⚓ P|LEM:Ean★bikalima`tK⚓with words⚓ N|LEM:nafos|ROOT:nfs|FS|INDEF|GEN★fa>atam~ahun~a⚓and he fulfilled them,⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|ACC★qaAla⚓He said,⚓ NEG|LEM:laA★<in~iY⚓`Indeed I⚓ V|IMPF|PASS|LEM:yaqobalu|ROOT:qbl|3MS★jaAEiluka⚓(am) the One to make you⚓ P|LEM:min★liln~aAsi⚓for the mankind⚓ N|LEM:Eadol|ROOT:Edl|M|INDEF|NOM★<imaAmFA⚓a leader.`⚓ NEG|LEM:laA★qaAla⚓He said,⚓ V|IMPF|LEM:nafaEa|ROOT:nfE|3FS★wamin⚓`And from⚓ N|LEM:$afa`Eap|ROOT:$fE|F|INDEF|NOM★*ur~iy~atiY⚓my offspring?`⚓ NEG|LEM:laA★qaAla⚓He said,⚓ PRON|3MP★laA⚓`(Does) not⚓ V|IMPF|PASS|LEM:naSara|ROOT:nSr|3MP★yanaAlu⚓reach⚓ T|LEM:<i*★EahodiY⚓My Covenant⚓ V|PERF|(VIII)|LEM:{botalaY`^|ROOT:blw|3MS★{lZ~a`limiyna⚓(to) the wrongdoers.`⚓ PN|LEM:<iboraAhiym|M|ACC★",
"wa<i*o⚓And when⚓N|LEM:rab~|ROOT:rbb|M|NOM★jaEalonaA⚓We made⚓ N|LEM:kalima`t|ROOT:klm|FP|INDEF|GEN★{lobayota⚓the House⚓ V|PERF|(IV)|LEM:>atam~a|ROOT:tmm|3MS★mavaAbapF⚓a place of return⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★l~iln~aAsi⚓for mankind⚓ ACC|LEM:<in~|SP:<in~★wa>amonFA⚓and (a place of) security⚓ N|ACT|PCPL|LEM:jaAEil|ROOT:jEl|M|NOM★wa{t~axi*uwA@⚓and (said), `Take⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★min⚓[from]⚓ N|LEM:<imaAm|ROOT:Amm|MS|INDEF|ACC★m~aqaAmi⚓(the) standing place⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★<ibora`hi.ma⚓(of) Ibrahim,⚓ P|LEM:min★muSal~FY⚓(as) a place of prayer.`⚓ N|LEM:*ur~iy~ap|ROOT:*rr|F|GEN★waEahidonaA^⚓And We made a covenant⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★<ilaY`^⚓with⚓ NEG|LEM:laA★<ibora`hi.ma⚓Ibrahim⚓ V|IMPF|LEM:yanaAlu|ROOT:nyl|3MS★wa<isoma`Eiyla⚓and Ismail⚓ N|LEM:Eahod|ROOT:Ehd|M|NOM★>an⚓[that],⚓ N|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|ACC★Tah~iraA⚓`[You both] purify⚓ T|LEM:<i*★bayotiYa⚓My House⚓ V|PERF|LEM:jaEala|ROOT:jEl|1P★lilT~aA^}ifiyna⚓for those who circumambulate⚓ N|LEM:bayot|ROOT:byt|M|ACC★wa{loEa`kifiyna⚓and those who seclude themselves for devotion and prayer⚓ N|LEM:mavaAbap|ROOT:vwb|F|INDEF|ACC★wa{lr~uk~aEi⚓and those who bow down⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★{ls~ujuwdi⚓and those who prostrate.`⚓ N|LEM:>amon|ROOT:Amn|M|INDEF|ACC★",
"wa<i*o⚓And when⚓V|IMPV|(VIII)|LEM:{t~axa*a|ROOT:Ax*|2MP★qaAla⚓said⚓ P|LEM:min★<ibora`hi.mu⚓Ibrahim,⚓ N|LEM:maqaAm|ROOT:qwm|M|GEN★rab~i⚓`My Lord⚓ PN|LEM:<iboraAhiym|M|GEN★{joEalo⚓make⚓ N|LEM:muSal~FY|ROOT:Slw|ACC★ha`*aA⚓this⚓ V|PERF|LEM:Eahida|ROOT:Ehd|1P★baladFA⚓a city⚓ P|LEM:<ilaY`★'aAminFA⚓secure⚓ PN|LEM:<iboraAhiym|M|GEN★wa{rozuqo⚓and provide⚓ PN|LEM:<isomaAEiyl|M|GEN★>aholahu,⚓its people⚓ INT|LEM:>an★mina⚓with⚓ V|IMPV|(II)|LEM:Tah~ara|ROOT:Thr|2MD★{lv~amara`ti⚓fruits,⚓ N|LEM:bayot|ROOT:byt|M|ACC★mano⚓(to) whoever⚓ N|ACT|PCPL|LEM:TaA^}if|ROOT:Twf|MP|GEN★'aAmana⚓believed⚓ N|ACT|PCPL|LEM:EaAkif|ROOT:Ekf|MP|GEN★minohum⚓from them⚓ N|ACT|PCPL|LEM:raAkiE|ROOT:rkE|MP|GEN★bi{ll~ahi⚓in Allah⚓ ADJ|LEM:s~ujuwd|ROOT:sjd|MP|GEN★wa{loyawomi⚓and the Day⚓ T|LEM:<i*★{lo'aAxiri⚓the Last,`⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★qaAla⚓He said,⚓ PN|LEM:<iboraAhiym|M|NOM★waman⚓`And whoever⚓ N|LEM:rab~|ROOT:rbb|M|ACC★kafara⚓disbelieved,⚓ V|IMPV|LEM:jaEala|ROOT:jEl|2MS★fa>umat~iEuhu,⚓[then] I will grant him enjoyment⚓ DEM|LEM:ha`*aA|MS★qaliylFA⚓a little;⚓ N|LEM:balad|ROOT:bld|M|INDEF|ACC★vum~a⚓then⚓ ADJ|ACT|PCPL|LEM:'aAmin|ROOT:Amn|M|INDEF|ACC★>aDoTar~uhu,^⚓I will force him⚓ V|IMPV|LEM:razaqa|ROOT:rzq|2MS★<ilaY`⚓to⚓ N|LEM:>ahol|ROOT:Ahl|M|ACC★Ea*aAbi⚓(the) punishment⚓ P|LEM:min★{ln~aAri⚓(of) the Fire,⚓ N|LEM:vamara`t|ROOT:vmr|FP|GEN★wabi}osa⚓and evil⚓ REL|LEM:man★{lomaSiyru⚓(is) the destination.⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MS★",
"wa<i*o⚓And when⚓P|LEM:min★yarofaEu⚓**Ibrahim (was) raising⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★<ibora`hi.mu⚓**Ibrahim (was) raising⚓ N|LEM:yawom|ROOT:ywm|M|GEN★{loqawaAEida⚓the foundations⚓ ADJ|LEM:A^xir|ROOT:Axr|MS|GEN★mina⚓**of the House⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★{lobayoti⚓**of the House⚓ COND|LEM:man★wa<isoma`Eiylu⚓and Ismail,⚓ V|PERF|LEM:kafara|ROOT:kfr|3MS★rab~anaA⚓(saying), `Our Lord!⚓ V|IMPF|(II)|LEM:m~at~aEo|ROOT:mtE|1S★taqab~alo⚓Accept⚓ N|LEM:qaliyl|ROOT:qll|MS|INDEF|ACC★min~aA^⚓from us.⚓ CONJ|LEM:vum~★<in~aka⚓Indeed You!⚓ V|IMPF|(VIII)|LEM:{DoTur~a|ROOT:Drr|1S★>anta⚓[You] (are)⚓ P|LEM:<ilaY`★{ls~amiyEu⚓the All-Hearing,⚓ N|LEM:Ea*aAb|ROOT:E*b|M|GEN★{loEaliymu⚓the All-Knowing.⚓ N|LEM:naAr|ROOT:nwr|F|GEN★",
"rab~anaA⚓Our Lord!⚓V|PERF|LEM:bi}osa|ROOT:bAs|3MS★wa{joEalonaA⚓[and] Make us⚓ N|LEM:maSiyr|ROOT:Syr|NOM★musolimayoni⚓both submissive⚓ T|LEM:<i*★laka⚓to You.⚓ V|IMPF|LEM:rafaEa|ROOT:rfE|3MS★wamin⚓And from⚓ PN|LEM:<iboraAhiym|M|NOM★*ur~iy~atinaA^⚓our offspring⚓ N|LEM:qawaAEid|ROOT:qEd|MP|ACC★>um~apF⚓a community⚓ P|LEM:min★m~usolimapF⚓submissive⚓ N|LEM:bayot|ROOT:byt|M|GEN★l~aka⚓to You.⚓ PN|LEM:<isomaAEiyl|M|NOM★wa>arinaA⚓And show us⚓ N|LEM:rab~|ROOT:rbb|M|ACC★manaAsikanaA⚓our ways of worship⚓ V|IMPV|(V)|LEM:taqab~ala|ROOT:qbl|2MS★watubo⚓and turn⚓ P|LEM:min★EalayonaA^⚓to us.⚓ ACC|LEM:<in~|SP:<in~★<in~aka⚓Indeed You!⚓ PRON|2MS★>anta⚓[You] (are)⚓ N|LEM:samiyE|ROOT:smE|MS|NOM★{lt~aw~aAbu⚓the Oft-returning,⚓ ADJ|LEM:Ealiym|ROOT:Elm|MS|NOM★{lr~aHiymu⚓the Most Merciful⚓ N|LEM:rab~|ROOT:rbb|M|ACC★",
"rab~anaA⚓Our Lord!⚓V|IMPV|LEM:jaEala|ROOT:jEl|2MS★wa{boEavo⚓[And] raise up⚓ N|ACT|PCPL|(IV)|LEM:musolim|ROOT:slm|MD|ACC★fiyhimo⚓in them⚓ PRON|2MS★rasuwlFA⚓a Messenger⚓ P|LEM:min★m~inohumo⚓from them⚓ N|LEM:*ur~iy~ap|ROOT:*rr|F|GEN★yatoluwA@⚓(who) will recite⚓ N|LEM:>um~ap|ROOT:Amm|FS|INDEF|ACC★Ealayohimo⚓to them⚓ ADJ|ACT|PCPL|(IV)|LEM:m~usolimap|ROOT:slm|F|INDEF|ACC★'aAya`tika⚓Your Verses⚓ PRON|2MS★wayuEal~imuhumu⚓and will teach them⚓ V|IMPV|(IV)|LEM:>arayo|ROOT:rAy|2MS★{lokita`ba⚓the Book⚓ N|LEM:mansak|ROOT:nsk|MP|ACC★wa{loHikomapa⚓and the wisdom⚓ V|IMPV|LEM:taAba|ROOT:twb|2MS★wayuzak~iyhimo⚓and purify them.⚓ P|LEM:EalaY`★<in~aka⚓Indeed You!⚓ ACC|LEM:<in~|SP:<in~★>anta⚓You (are)⚓ PRON|2MS★{loEaziyzu⚓the All-Mighty⚓ N|ACT|PCPL|LEM:taw~aAb|ROOT:twb|MS|NOM★{loHakiymu⚓the All-Wise.`⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|NOM★",
"waman⚓And who⚓N|LEM:rab~|ROOT:rbb|M|ACC★yarogabu⚓**will turn away from⚓ V|IMPV|LEM:baEava|ROOT:bEv|2MS★Ean⚓**will turn away from⚓ P|LEM:fiY★m~il~api⚓**Ibrahim`s religion⚓ N|LEM:rasuwl|ROOT:rsl|M|INDEF|ACC★<ibora`hi.ma⚓**Ibrahim`s religion⚓ P|LEM:min★<il~aA⚓except⚓ V|IMPF|LEM:talaY`|ROOT:tlw|3MS★man⚓who⚓ P|LEM:EalaY`★safiha⚓fooled⚓ N|LEM:'aAyap|ROOT:Ayy|FP|ACC★nafosahu,⚓himself?⚓ V|IMPF|(II)|LEM:Eal~ama|ROOT:Elm|3MS★walaqadi⚓And indeed⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★{SoTafayona`hu⚓We chose him⚓ N|LEM:Hikomap|ROOT:Hkm|F|ACC★fiY⚓**in the world,⚓ V|IMPF|(II)|LEM:zak~aY`|ROOT:zkw|3MS★{ld~unoyaA⚓**in the world,⚓ ACC|LEM:<in~|SP:<in~★wa<in~ahu,⚓and indeed he,⚓ PRON|2MS★fiY⚓in,⚓ N|LEM:Eaziyz|ROOT:Ezz|MS|NOM★{lo'aAxirapi⚓the Hereafter⚓ ADJ|LEM:Hakiym|ROOT:Hkm|MS|NOM★lamina⚓surely (will be) among⚓ INTG|LEM:man★{lS~a`liHiyna⚓the righteous.⚓ V|IMPF|LEM:yarogabu|ROOT:rgb|3MS★",
"<i*o⚓When⚓P|LEM:Ean★qaAla⚓said⚓ N|LEM:mil~ap|ROOT:mll|F|GEN★lahu,⚓to him⚓ PN|LEM:<iboraAhiym|M|GEN★rab~uhu,^⚓his Lord⚓ RES|LEM:<il~aA★>asolimo⚓`Submit (yourself),`⚓ REL|LEM:man★qaAla⚓he said,⚓ V|PERF|LEM:safiha|ROOT:sfh|3MS★>asolamotu⚓`I (have) submitted (myself)⚓ N|LEM:nafos|ROOT:nfs|FS|ACC★lirab~i⚓to (the) Lord⚓ CERT|LEM:qad★{loEa`lamiyna⚓(of) the worlds.`⚓ V|PERF|(VIII)|LEM:{SoTafaY`|ROOT:Sfw|1P★",
"wawaS~aY`⚓And enjoined⚓P|LEM:fiY★bihaA^⚓[it]⚓ N|LEM:d~unoyaA|ROOT:dnw|FS|GEN★<ibora`hi.mu⚓Ibrahim⚓ ACC|LEM:<in~|SP:<in~★baniyhi⚓(upon) his sons⚓ P|LEM:fiY★wayaEoquwbu⚓and Yaqub,⚓ N|LEM:A^xir|ROOT:Axr|FS|GEN★ya`baniY~a⚓`O my sons!⚓ P|LEM:min★<in~a⚓**Indeed, Allah⚓ N|ACT|PCPL|LEM:Sa`liH|ROOT:SlH|MP|GEN★{ll~aha⚓**Indeed, Allah⚓ T|LEM:<i*★{SoTafaY`⚓has chosen⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★lakumu⚓for you⚓ PRON|3MS★{ld~iyna⚓the religion,⚓ N|LEM:rab~|ROOT:rbb|M|NOM★falaA⚓**so you should not die⚓ V|IMPV|(IV)|LEM:>asolama|ROOT:slm|2MS★tamuwtun~a⚓**so you should not die⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★<il~aA⚓except⚓ V|PERF|(IV)|LEM:>asolama|ROOT:slm|1S★wa>antum⚓while you⚓ N|LEM:rab~|ROOT:rbb|M|GEN★m~usolimuwna⚓(are) submissive.`⚓ N|LEM:Ea`lamiyn|ROOT:Elm|MP|GEN★",
">amo⚓Or⚓V|PERF|(II)|LEM:waS~aY`|ROOT:wSy|3MS★kuntumo⚓were you⚓ PRON|3FS★$uhadaA^'a⚓witnesses⚓ PN|LEM:<iboraAhiym|M|NOM★<i*o⚓when⚓ N|LEM:bunaY~|ROOT:bny|MP|ACC★HaDara⚓came to⚓ PN|LEM:yaEoquwb|NOM★yaEoquwba⚓Yaqub⚓ N|LEM:bunaY~|ROOT:bny|MP|ACC★{lomawotu⚓[the] death,⚓ ACC|LEM:<in~|SP:<in~★<i*o⚓when⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★qaAla⚓he said⚓ V|PERF|(VIII)|LEM:{SoTafaY`|ROOT:Sfw|3MS★libaniyhi⚓to his sons,⚓ PRON|2MP★maA⚓`What⚓ N|LEM:diyn|ROOT:dyn|M|ACC★taEobuduwna⚓will you worship⚓ NEG|LEM:laA★min[⚓**after me?`⚓ V|IMPF|LEM:m~aAta|ROOT:mwt|2MP|MOOD:JUS★baEodiY⚓**after me?`⚓ RES|LEM:<il~aA★qaAluwA@⚓They said,⚓ PRON|2MP★naEobudu⚓`We will worship⚓ N|ACT|PCPL|(IV)|LEM:musolim|ROOT:slm|MP|NOM★<ila`haka⚓your God⚓ CONJ|LEM:>am★wa<ila`ha⚓and (the) God⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★'aAbaA^}ika⚓(of) your forefathers,⚓ N|LEM:$ahiyd|ROOT:$hd|MP|ACC★<ibora`hi.ma⚓Ibrahim⚓ T|LEM:<i*★wa<isoma`Eiyla⚓and Ismail⚓ V|PERF|LEM:HaDara|ROOT:HDr|3MS★wa<isoHa`qa⚓and Ishaq -⚓ PN|LEM:yaEoquwb|ACC★<ila`hFA⚓God⚓ N|LEM:mawot|ROOT:mwt|M|NOM★wa`HidFA⚓One.⚓ T|LEM:<i*★wanaHonu⚓And we⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★lahu,⚓to Him⚓ N|LEM:bunaY~|ROOT:bny|MP|GEN★musolimuwna⚓(are) submissive.`⚓ INTG|LEM:maA★",
"tiloka⚓This⚓V|IMPF|LEM:Eabada|ROOT:Ebd|2MP★>um~apN⚓(was) a community⚓ P|LEM:min★qado⚓**(which) has passed away,⚓ N|LEM:baEod|ROOT:bEd|M|GEN★xalato⚓**(which) has passed away,⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★lahaA⚓for it⚓ V|IMPF|LEM:Eabada|ROOT:Ebd|1P★maA⚓**what it earned⚓ N|LEM:<ila`h|ROOT:Alh|MS|ACC★kasabato⚓**what it earned⚓ N|LEM:<ila`h|ROOT:Alh|MS|ACC★walakum⚓and for you⚓ N|LEM:A^baA'|ROOT:Abw|MP|GEN★m~aA⚓what⚓ PN|LEM:<iboraAhiym|M|GEN★kasabotumo⚓you earned.⚓ PN|LEM:<isomaAEiyl|M|GEN★walaA⚓And not⚓ PN|LEM:<isoHaAq|GEN★tuso_#aluwna⚓you will be asked⚓ N|LEM:<ila`h|ROOT:Alh|MS|INDEF|ACC★Eam~aA⚓about what⚓ ADJ|LEM:wa`Hid|ROOT:wHd|MS|INDEF|ACC★kaAnuwA@⚓they used to⚓ PRON|1P★yaEomaluwna⚓do.⚓ PRON|3MS★",
"waqaAluwA@⚓And they said,⚓N|ACT|PCPL|(IV)|LEM:musolim|ROOT:slm|MP|NOM★kuwnuwA@⚓`Be⚓ DEM|LEM:*a`lik|FS★huwdFA⚓Jews⚓ N|LEM:>um~ap|ROOT:Amm|FS|INDEF|NOM★>awo⚓or⚓ CERT|LEM:qad★naSa`raY`⚓Christians,⚓ V|PERF|LEM:xalaA|ROOT:xlw|3FS★tahotaduwA@⚓(then) you will be guided.`⚓ PRON|3FS★qulo⚓Say,⚓ REL|LEM:maA★balo⚓`Nay,⚓ V|PERF|LEM:kasaba|ROOT:ksb|3FS★mil~apa⚓(the) religion⚓ PRON|2MP★<ibora`hi.ma⚓(of) Ibrahim,⚓ REL|LEM:maA★HaniyfFA⚓(the) upright;⚓ V|PERF|LEM:kasaba|ROOT:ksb|2MP★wamaA⚓and not⚓ NEG|LEM:laA★kaAna⚓he was⚓ V|IMPF|PASS|LEM:sa>ala|ROOT:sAl|2MP★mina⚓of⚓ P|LEM:Ean★{lomu$orikiyna⚓those who associated partners (with Allah).`⚓ REL|LEM:maA★",
"quwluw^A@⚓Say,⚓V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★'aAman~aA⚓`We have believed⚓ V|IMPF|LEM:Eamila|ROOT:Eml|3MP★bi{ll~ahi⚓in Allah⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★wamaA^⚓and what⚓ V|IMPV|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★>unzila⚓(is) revealed⚓ PN|LEM:huwd2|ROOT:hwd|M|INDEF|ACC★<ilayonaA⚓to us⚓ CONJ|LEM:>aw★wamaA^⚓and what⚓ PN|LEM:naSoraAniy~|ROOT:nSr|P|ACC★>unzila⚓was revealed⚓ V|IMPF|(VIII)|LEM:{hotadaY`|ROOT:hdy|2MP|MOOD:JUS★<ilaY`^⚓to⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★<ibora`hi.ma⚓Ibrahim⚓ RET|LEM:bal★wa<isoma`Eiyla⚓and Ismail⚓ N|LEM:mil~ap|ROOT:mll|F|ACC★wa<isoHa`qa⚓and Ishaq⚓ PN|LEM:<iboraAhiym|M|GEN★wayaEoquwba⚓and Yaqub⚓ N|LEM:Haniyf|ROOT:Hnf|M|INDEF|ACC★wa{lo>asobaATi⚓and the descendants,⚓ NEG|LEM:maA★wamaA^⚓and what⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★>uwtiYa⚓was given⚓ P|LEM:min★muwsaY`⚓(to) Musa⚓ N|ACT|PCPL|(IV)|LEM:mu$orik|ROOT:$rk|MP|GEN★waEiysaY`⚓and Isa⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MP★wamaA^⚓and what⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|1P★>uwtiYa⚓was given⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★{ln~abiy~uwna⚓(to) the Prophets⚓ REL|LEM:maA★min⚓from⚓ V|PERF|PASS|(IV)|LEM:>anzala|ROOT:nzl|3MS★r~ab~ihimo⚓their Lord.⚓ P|LEM:<ilaY`★laA⚓Not⚓ REL|LEM:maA★nufar~iqu⚓we make distinction⚓ V|PERF|PASS|(IV)|LEM:>anzala|ROOT:nzl|3MS★bayona⚓between⚓ P|LEM:<ilaY`★>aHadK⚓any⚓ PN|LEM:<iboraAhiym|M|GEN★m~inohumo⚓of them.⚓ PN|LEM:<isomaAEiyl|M|GEN★wanaHonu⚓And we⚓ PN|LEM:<isoHaAq|GEN★lahu,⚓to Him⚓ PN|LEM:yaEoquwb|GEN★musolimuwna⚓(are) submissive. `⚓ N|LEM:>asobaAT|ROOT:sbT|MP|GEN★",
"fa<ino⚓So if⚓REL|LEM:maA★'aAmanuwA@⚓they believe[d]⚓ V|PERF|PASS|(IV)|LEM:A^taY|ROOT:Aty|3MS★bimivoli⚓in (the) like⚓ PN|LEM:muwsaY`|M|NOM★maA^⚓(of) what⚓ PN|LEM:EiysaY|NOM★'aAmantum⚓you have believed⚓ REL|LEM:maA★bihi.⚓in [it],⚓ V|PERF|PASS|(IV)|LEM:A^taY|ROOT:Aty|3MS★faqadi⚓then indeed,⚓ N|LEM:n~abiY~|ROOT:nbA|MP|NOM★{hotadawA@⚓they are (rightly) guided.⚓ P|LEM:min★w~a<in⚓But if⚓ N|LEM:rab~|ROOT:rbb|M|GEN★tawal~awoA@⚓they turn away,⚓ NEG|LEM:laA★fa<in~amaA⚓then only⚓ V|IMPF|(II)|LEM:far~aqu|ROOT:frq|1P★humo⚓they⚓ LOC|LEM:bayon|ROOT:byn|ACC★fiY⚓(are) in⚓ N|LEM:>aHad|ROOT:AHd|M|INDEF|GEN★$iqaAqK⚓dissension.⚓ P|LEM:min★fasayakofiykahumu⚓**So Allah will suffice you against them,⚓ PRON|1P★{ll~ahu⚓**So Allah will suffice you against them,⚓ PRON|3MS★wahuwa⚓and He⚓ N|ACT|PCPL|(IV)|LEM:musolim|ROOT:slm|MP|NOM★{ls~amiyEu⚓(is) the All-Hearing,⚓ COND|LEM:<in★{loEaliymu⚓the All-Knowing.⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★",
"Sibogapa⚓(The) color (religion)⚓N|LEM:mivol|ROOT:mvl|M|GEN★{ll~ahi⚓(of) Allah!⚓ REL|LEM:maA★wamano⚓And who⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|2MP★>aHosanu⚓(is) better⚓ PRON|3MS★mina⚓than⚓ CERT|LEM:qad★{ll~ahi⚓**Allah at coloring?⚓ V|PERF|(VIII)|LEM:{hotadaY`|ROOT:hdy|3MP★SibogapF⚓**Allah at coloring?⚓ COND|LEM:<in★wanaHonu⚓And we⚓ V|PERF|(V)|LEM:tawal~aY`|ROOT:wly|3MP★lahu,⚓to Him⚓ ACC|LEM:<in~|SP:<in~★Ea`biduwna⚓(are) worshippers.⚓ PREV|LEM:maA★",
"qulo⚓Say,⚓PRON|3MP★>atuHaA^j~uwnanaA⚓`Do you argue with us⚓ P|LEM:fiY★fiY⚓about⚓ N|VN|(III)|LEM:$iqaAq|ROOT:$qq|M|INDEF|GEN★{ll~ahi⚓Allah⚓ V|IMPF|LEM:kafaY`|ROOT:kfy|3MS★wahuwa⚓while He⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★rab~unaA⚓(is) our Lord⚓ PRON|3MS★warab~ukumo⚓and your Lord?⚓ N|LEM:samiyE|ROOT:smE|MS|NOM★walanaA^⚓And for us⚓ ADJ|LEM:Ealiym|ROOT:Elm|MS|NOM★>aEoma`lunaA⚓(are) our deeds⚓ N|LEM:Sibogap|ROOT:Sbg|F|ACC★walakumo⚓and for you⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★>aEoma`lukumo⚓(are) your deeds⚓ INTG|LEM:man★wanaHonu⚓and we⚓ N|LEM:>aHosan|ROOT:Hsn|MS|NOM★lahu,⚓to Him⚓ P|LEM:min★muxoliSuwna⚓(are) sincere.⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★",
">amo⚓Or⚓N|LEM:Sibogap|ROOT:Sbg|F|INDEF|ACC★taquwluwna⚓(do) you say⚓ PRON|1P★<in~a⚓that⚓ PRON|3MS★<ibora`hi.ma⚓Ibrahim⚓ N|ACT|PCPL|LEM:EaAbid|ROOT:Ebd|MP|NOM★wa<isoma`Eiyla⚓and Ismail⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★wa<isoHa`qa⚓and Ishaq⚓ V|IMPF|(III)|LEM:HaA^j~a|ROOT:Hjj|2MP★wayaEoquwba⚓and Yaqub⚓ P|LEM:fiY★wa{lo>asobaATa⚓and the descendants⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★kaAnuwA@⚓were⚓ PRON|3MS★huwdFA⚓Jews⚓ N|LEM:rab~|ROOT:rbb|M|NOM★>awo⚓or⚓ N|LEM:rab~|ROOT:rbb|M|NOM★naSa`raY`⚓Christians?`⚓ PRON|1P★qulo⚓Say,⚓ N|LEM:Eamal|ROOT:Eml|MP|NOM★'a>antumo⚓`Are you⚓ PRON|2MP★>aEolamu⚓better knowing⚓ N|LEM:Eamal|ROOT:Eml|MP|NOM★>ami⚓**or (is) Allah?`⚓ PRON|1P★{ll~ahu⚓**or (is) Allah?`⚓ PRON|3MS★wamano⚓And who⚓ N|ACT|PCPL|(IV)|LEM:muxoliS|ROOT:xlS|MP|NOM★>aZolamu⚓(is) more unjust⚓ CONJ|LEM:>am★mim~an⚓than (the one) who⚓ V|IMPF|LEM:qaAla|ROOT:qwl|2MP★katama⚓concealed⚓ ACC|LEM:<in~|SP:<in~★$aha`dapF⚓a testimony⚓ PN|LEM:<iboraAhiym|M|ACC★Eindahu,⚓(that) he has⚓ PN|LEM:<isomaAEiyl|M|ACC★mina⚓from⚓ PN|LEM:<isoHaAq|ACC★{ll~ahi⚓Allah?⚓ PN|LEM:yaEoquwb|ACC★wamaA⚓And not⚓ N|LEM:>asobaAT|ROOT:sbT|MP|ACC★{ll~ahu⚓(is) Allah⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★biga`filK⚓unaware⚓ PN|LEM:huwd2|ROOT:hwd|M|INDEF|ACC★Eam~aA⚓of what⚓ CONJ|LEM:>aw★taEomaluwna⚓you do.⚓ PN|LEM:naSoraAniy~|ROOT:nSr|P|ACC★",
"tiloka⚓This⚓V|IMPV|LEM:qaAla|ROOT:qwl|2MS★>um~apN⚓(was) a community⚓ PRON|2MP★qado⚓**(which) has passed away.⚓ N|LEM:>aEolam|ROOT:Elm|MS|NOM★xalato⚓**(which) has passed away.⚓ CONJ|LEM:>am★lahaA⚓For it⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★maA⚓what⚓ INTG|LEM:man★kasabato⚓it earned⚓ N|LEM:>aZolam|ROOT:Zlm|MS|NOM★walakum⚓and for you⚓ P|LEM:min★m~aA⚓what⚓ REL|LEM:man★kasabotumo⚓you have earned.⚓ V|PERF|LEM:katama|ROOT:ktm|3MS★walaA⚓And not⚓ N|LEM:$aha`dap|ROOT:$hd|F|INDEF|ACC★tuso_#aluwna⚓you will be asked⚓ LOC|LEM:Eind|ROOT:End|ACC★Eam~aA⚓about what⚓ P|LEM:min★kaAnuwA@⚓they used to⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★yaEomaluwna⚓do.⚓ NEG|LEM:maA|SP:kaAn★",
"sayaquwlu⚓Will say⚓PN|LEM:{ll~ah|ROOT:Alh|NOM★{ls~ufahaA^'u⚓the foolish ones⚓ N|ACT|PCPL|LEM:ga`fil|ROOT:gfl|M|INDEF|GEN★mina⚓from⚓ P|LEM:Ean★{ln~aAsi⚓the people,⚓ REL|LEM:maA★maA⚓`What⚓ V|IMPF|LEM:Eamila|ROOT:Eml|2MP★wal~aY`humo⚓(has) turned them⚓ DEM|LEM:*a`lik|FS★Ean⚓from⚓ N|LEM:>um~ap|ROOT:Amm|FS|INDEF|NOM★qibolatihimu⚓their direction of prayer⚓ CERT|LEM:qad★{l~atiY⚓which⚓ V|PERF|LEM:xalaA|ROOT:xlw|3FS★kaAnuwA@⚓they were used to⚓ PRON|3FS★EalayohaA⚓[on it].`⚓ REL|LEM:maA★qul⚓Say,⚓ V|PERF|LEM:kasaba|ROOT:ksb|3FS★l~il~ahi⚓`For Allah⚓ PRON|2MP★{loma$oriqu⚓(is) the east⚓ REL|LEM:maA★wa{lomagoribu⚓and the west.⚓ V|PERF|LEM:kasaba|ROOT:ksb|2MP★yahodiY⚓He guides⚓ NEG|LEM:laA★man⚓whom⚓ V|IMPF|PASS|LEM:sa>ala|ROOT:sAl|2MP★ya$aA^'u⚓He wills⚓ P|LEM:Ean★<ilaY`⚓to⚓ REL|LEM:maA★Sira`TK⚓a path⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★m~usotaqiymK⚓straight.`⚓ V|IMPF|LEM:Eamila|ROOT:Eml|3MP★",
"waka*a`lika⚓And thus⚓V|IMPF|LEM:qaAla|ROOT:qwl|3MS★jaEalona`kumo⚓We made you⚓ N|LEM:safiyh|ROOT:sfh|MP|NOM★>um~apF⚓a community⚓ P|LEM:min★wasaTFA⚓(of the) middle way⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★l~itakuwnuwA@⚓so that you will be⚓ INTG|LEM:maA★$uhadaA^'a⚓witnesses⚓ V|PERF|(II)|LEM:wal~aY`|ROOT:wly|3MS★EalaY⚓over⚓ P|LEM:Ean★{ln~aAsi⚓the mankind,⚓ N|LEM:qibolap|ROOT:qbl|F|GEN★wayakuwna⚓and will be⚓ REL|LEM:{l~a*iY|FS★{lr~asuwlu⚓the Messenger⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MP★Ealayokumo⚓on you⚓ P|LEM:EalaY`★$ahiydFA⚓a witness.⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★wamaA⚓And not⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★jaEalonaA⚓We made⚓ N|LEM:ma$oriq|ROOT:$rq|M|NOM★{loqibolapa⚓the direction of prayer⚓ N|LEM:magorib|ROOT:grb|M|NOM★{l~atiY⚓which⚓ V|IMPF|LEM:hadaY|ROOT:hdy|3MS★kunta⚓you were used to⚓ REL|LEM:man★EalayohaA^⚓[on it]⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★<il~aA⚓except⚓ P|LEM:<ilaY`★linaEolama⚓that We make evident⚓ N|LEM:Sira`T|ROOT:SrT|M|INDEF|GEN★man⚓(he) who⚓ ADJ|ACT|PCPL|(X)|LEM:m~usotaqiym|ROOT:qwm|M|INDEF|GEN★yat~abiEu⚓follows⚓ DEM|LEM:*a`lik|MS★{lr~asuwla⚓the Messenger⚓ V|PERF|LEM:jaEala|ROOT:jEl|1P★mim~an⚓from (he) who⚓ N|LEM:>um~ap|ROOT:Amm|FS|INDEF|ACC★yanqalibu⚓turns back⚓ ADJ|LEM:wasaT|ROOT:wsT|INDEF|ACC★EalaY`⚓on⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP|MOOD:SUBJ★Eaqibayohi⚓his heels.⚓ N|LEM:$ahiyd|ROOT:$hd|MP|ACC★wa<in⚓And indeed,⚓ P|LEM:EalaY`★kaAnato⚓it was⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★lakabiyrapF⚓certainly a great (test)⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS|MOOD:SUBJ★<il~aA⚓except⚓ N|LEM:rasuwl|ROOT:rsl|M|NOM★EalaY⚓for⚓ P|LEM:EalaY`★{l~a*iyna⚓those whom⚓ N|LEM:$ahiyd|ROOT:$hd|MS|INDEF|ACC★hadaY⚓**Allah guided.⚓ NEG|LEM:maA★{ll~ahu⚓**Allah guided.⚓ V|PERF|LEM:jaEala|ROOT:jEl|1P★wamaA⚓And not⚓ N|LEM:qibolap|ROOT:qbl|F|ACC★kaAna⚓**will Allah⚓ REL|LEM:{l~a*iY|FS★{ll~ahu⚓**will Allah⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MS★liyuDiyEa⚓let go waste⚓ P|LEM:EalaY`★<iyma`nakumo⚓your faith.⚓ RES|LEM:<il~aA★<in~a⚓**Indeed, Allah⚓ V|IMPF|LEM:Ealima|ROOT:Elm|1P|MOOD:SUBJ★{ll~aha⚓**Indeed, Allah⚓ REL|LEM:man★bi{ln~aAsi⚓(is) to [the] mankind⚓ V|IMPF|(VIII)|LEM:{t~abaEa|ROOT:tbE|3MS★lara'uwfN⚓Full of Kindness,⚓ N|LEM:rasuwl|ROOT:rsl|M|ACC★r~aHiymN⚓Most Merciful.⚓ P|LEM:min★",
"qado⚓Indeed,⚓REL|LEM:man★naraY`⚓We see⚓ V|IMPF|(VII)|LEM:{nqalaba|ROOT:qlb|3MS★taqal~uba⚓(the) turning⚓ P|LEM:EalaY`★wajohika⚓(of) your face⚓ N|LEM:Eaqib|ROOT:Eqb|MD|GEN★fiY⚓towards⚓ CERT|LEM:<in★{ls~amaA^'i⚓the heaven.⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3FS★falanuwal~iyan~aka⚓So We will surely turn you⚓ N|LEM:kabiyrap|ROOT:kbr|FS|INDEF|ACC★qibolapF⚓(to the) direction of prayer⚓ RES|LEM:<il~aA★taroDaY`haA⚓you will be pleased with.⚓ P|LEM:EalaY`★fawal~i⚓So turn⚓ REL|LEM:{l~a*iY|MP★wajohaka⚓your face⚓ V|PERF|LEM:hadaY|ROOT:hdy|3MS★$aTora⚓towards the direction⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{lomasojidi⚓**(of) the Al-Masjid Al-Haraam⚓ NEG|LEM:maA★{loHaraAmi⚓**(of) the Al-Masjid Al-Haraam⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★waHayovu⚓**and wherever⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★maA⚓**and wherever⚓ V|IMPF|(IV)|LEM:>aDaAEu|ROOT:DyE|3MS|MOOD:SUBJ★kuntumo⚓you are⚓ N|VN|(IV)|LEM:<iyma`n|ROOT:Amn|M|ACC★fawal~uwA@⚓[so] turn⚓ ACC|LEM:<in~|SP:<in~★wujuwhakumo⚓your faces⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★$aTorahu,⚓(in) its direction.⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★wa<in~a⚓And indeed,⚓ N|LEM:ra'uwf|ROOT:rAf|MS|INDEF|NOM★{l~a*iyna⚓those who⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|INDEF|NOM★>uwtuwA@⚓were given⚓ CERT|LEM:qad★{lokita`ba⚓the Book⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|1P★layaEolamuwna⚓surely know⚓ N|VN|(V)|LEM:taqal~ub|ROOT:qlb|M|ACC★>an~ahu⚓that it⚓ N|LEM:wajoh|ROOT:wjh|M|GEN★{loHaq~u⚓(is) the truth⚓ P|LEM:fiY★min⚓from⚓ N|LEM:samaA^'|ROOT:smw|F|GEN★r~ab~ihimo⚓their Lord.⚓ V|IMPF|(II)|LEM:wal~aY`|ROOT:wly|1P★wamaA⚓And not⚓ N|LEM:qibolap|ROOT:qbl|F|INDEF|ACC★{ll~ahu⚓(is) Allah⚓ V|IMPF|LEM:r~aDiYa|ROOT:rDw|2MS★biga`filK⚓unaware⚓ V|IMPV|(II)|LEM:wal~aY`|ROOT:wly|2MS★Eam~aA⚓of what⚓ N|LEM:wajoh|ROOT:wjh|M|ACC★yaEomaluwna⚓they do.⚓ LOC|LEM:$aTor|ROOT:$Tr|M|ACC★",
"wala}ino⚓And even if⚓N|LEM:masojid|ROOT:sjd|M|GEN★>atayota⚓you come⚓ ADJ|LEM:HaraAm|ROOT:Hrm|M|GEN★{l~a*iyna⚓(to) those who⚓ COND|LEM:Hayov2|ROOT:Hyv★>uwtuwA@⚓were given⚓ SUP|LEM:maA★{lokita`ba⚓the Book⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★bikul~i⚓with all⚓ V|IMPV|(II)|LEM:wal~aY`|ROOT:wly|2MP★'aAyapK⚓(the) signs,⚓ N|LEM:wajoh|ROOT:wjh|MP|ACC★m~aA⚓not⚓ LOC|LEM:$aTor|ROOT:$Tr|M|ACC★tabiEuwA@⚓they would follow⚓ ACC|LEM:<in~|SP:<in~★qibolataka⚓your direction of prayer,⚓ REL|LEM:{l~a*iY|MP★wamaA^⚓and not⚓ V|PERF|PASS|(IV)|LEM:A^taY|ROOT:Aty|3MP★>anta⚓(will) you (be)⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★bitaAbiEK⚓a follower⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MP★qibolatahumo⚓(of) their direction of prayer.⚓ ACC|LEM:>an~|SP:<in~★wamaA⚓And not⚓ N|LEM:Haq~|ROOT:Hqq|M|NOM★baEoDuhum⚓some of them⚓ P|LEM:min★bitaAbiEK⚓(are) followers⚓ N|LEM:rab~|ROOT:rbb|M|GEN★qibolapa⚓(of the) direction of prayer⚓ NEG|LEM:maA|SP:kaAn★baEoDK⚓(of each) other.⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★wala}ini⚓And if⚓ N|ACT|PCPL|LEM:ga`fil|ROOT:gfl|M|INDEF|GEN★{t~abaEota⚓you followed⚓ P|LEM:Ean★>ahowaA^'ahum⚓their desires⚓ REL|LEM:maA★m~in[⚓**after⚓ V|IMPF|LEM:Eamila|ROOT:Eml|3MP★baEodi⚓**after⚓ COND|LEM:<in★maA⚓[what]⚓ V|PERF|LEM:>ataY|ROOT:Aty|2MS★jaA^'aka⚓came to you⚓ REL|LEM:{l~a*iY|MP★mina⚓of⚓ V|PERF|PASS|(IV)|LEM:A^taY|ROOT:Aty|3MP★{loEilomi⚓the knowledge,⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★<in~aka⚓indeed, you⚓ N|LEM:kul~|ROOT:kll|M|GEN★<i*FA⚓(would) then⚓ N|LEM:'aAyap|ROOT:Ayy|FS|INDEF|GEN★l~amina⚓(be) surely among⚓ NEG|LEM:maA★{lZ~a`limiyna⚓the wrongdoers.⚓ V|PERF|LEM:tabiEa|ROOT:tbE|3MP★",
"{l~a*iyna⚓(To) those whom⚓N|LEM:qibolap|ROOT:qbl|F|ACC★'aAtayona`humu⚓We gave [them]⚓ NEG|LEM:maA★{lokita`ba⚓the Book,⚓ PRON|2MS★yaEorifuwnahu,⚓they recognize it⚓ N|ACT|PCPL|LEM:taAbiE|ROOT:tbE|M|INDEF|GEN★kamaA⚓like⚓ N|LEM:qibolap|ROOT:qbl|F|ACC★yaEorifuwna⚓they recognize⚓ NEG|LEM:maA★>abonaA^'ahumo⚓their sons.⚓ N|LEM:baEoD|ROOT:bED|M|NOM★wa<in~a⚓And indeed,⚓ N|ACT|PCPL|LEM:taAbiE|ROOT:tbE|M|INDEF|GEN★fariyqFA⚓a group⚓ N|LEM:qibolap|ROOT:qbl|F|ACC★m~inohumo⚓of them⚓ N|LEM:baEoD|ROOT:bED|M|INDEF|GEN★layakotumuwna⚓surely they conceal⚓ COND|LEM:<in★{loHaq~a⚓the Truth⚓ V|PERF|(VIII)|LEM:{t~abaEa|ROOT:tbE|2MS★wahumo⚓while they⚓ N|LEM:>ahowaA^'|ROOT:hwy|MP|ACC★yaEolamuwna⚓know.⚓ P|LEM:min★",
"{loHaq~u⚓The Truth⚓N|LEM:baEod|ROOT:bEd|GEN★min⚓(is) from⚓ REL|LEM:maA★r~ab~ika⚓your Lord,⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3MS★falaA⚓so (do) not⚓ P|LEM:min★takuwnan~a⚓be⚓ N|LEM:Eilom|ROOT:Elm|M|GEN★mina⚓among⚓ ACC|LEM:<in~|SP:<in~★{lomumotariyna⚓the doubters.⚓ ANS|LEM:<i*FA★",
"walikul~K⚓And for everyone⚓P|LEM:min★wijohapN⚓(is) a direction -⚓ N|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|GEN★huwa⚓he⚓ REL|LEM:{l~a*iY|MP★muwal~iyhaA⚓turns towards it,⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|1P★fa{sotabiquwA@⚓so race⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★{loxayora`ti⚓(to) the good.⚓ V|IMPF|LEM:Earafa|ROOT:Erf|3MP★>ayona⚓**Wherever⚓ SUB|LEM:maA★maA⚓**Wherever⚓ V|IMPF|LEM:Earafa|ROOT:Erf|3MP★takuwnuwA@⚓you will be⚓ N|LEM:{bon|ROOT:bny|MP|ACC★ya>oti⚓**Allah will bring you⚓ ACC|LEM:<in~|SP:<in~★bikumu⚓**Allah will bring you⚓ N|LEM:fariyq|ROOT:frq|M|INDEF|ACC★{ll~ahu⚓**Allah will bring you⚓ P|LEM:min★jamiyEFA⚓together.⚓ V|IMPF|LEM:katama|ROOT:ktm|3MP★<in~a⚓**Indeed, Allah⚓ N|LEM:Haq~|ROOT:Hqq|M|ACC★{ll~aha⚓**Indeed, Allah⚓ PRON|3MP★EalaY`⚓(is) on⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MP★kul~i⚓every⚓ N|LEM:Haq~|ROOT:Hqq|M|NOM★$aYo'K⚓thing⚓ P|LEM:min★qadiyrN⚓All-Powerful.⚓ N|LEM:rab~|ROOT:rbb|M|GEN★",
"wamino⚓And from⚓NEG|LEM:laA★Hayovu⚓wherever⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MS★xarajota⚓you start forth,⚓ P|LEM:min★fawal~i⚓[so] turn⚓ N|ACT|PCPL|(VIII)|LEM:mumotariyn|ROOT:mry|MP|GEN★wajohaka⚓your face⚓ N|LEM:kul~|ROOT:kll|M|INDEF|GEN★$aTora⚓(in the) direction⚓ N|LEM:wijohap|ROOT:wjh|F|INDEF|NOM★{lomasojidi⚓**(of) Al-Masjid Al-Haraam.⚓ PRON|3MS★{loHaraAmi⚓**(of) Al-Masjid Al-Haraam.⚓ N|ACT|PCPL|(II)|LEM:muwal~iy|ROOT:wly|M|NOM★wa<in~ahu,⚓And indeed, it⚓ V|IMPV|(VIII)|LEM:{sotabaqa|ROOT:sbq|2MP★laloHaq~u⚓(is) surely the truth⚓ N|LEM:xayora`t|ROOT:xyr|FP|ACC★min⚓from⚓ COND|LEM:>ayon★r~ab~ika⚓your Lord.⚓ SUP|LEM:maA★wamaA⚓And not⚓ V|IMPF|LEM:kaAna|ROOT:kwn|2MP|MOOD:JUS★{ll~ahu⚓(is) Allah⚓ V|IMPF|LEM:>ataY|ROOT:Aty|3MS|MOOD:JUS★biga`filK⚓unaware⚓ PRON|2MP★Eam~aA⚓of what⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★taEomaluwna⚓you do.⚓ N|LEM:jamiyE|ROOT:jmE|M|INDEF|ACC★",
"wamino⚓And from⚓ACC|LEM:<in~|SP:<in~★Hayovu⚓wherever⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★xarajota⚓you start forth⚓ P|LEM:EalaY`★fawal~i⚓[so] turn⚓ N|LEM:kul~|ROOT:kll|M|GEN★wajohaka⚓your face⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★$aTora⚓(in the) direction⚓ N|LEM:qadiyr|ROOT:qdr|M|INDEF|NOM★{lomasojidi⚓**(of) Al-Masjid Al-Haraam.⚓ P|LEM:min★{loHaraAmi⚓**(of) Al-Masjid Al-Haraam.⚓ N|LEM:Hayov|ROOT:Hyv|GEN★waHayovu⚓**And wherever⚓ V|PERF|LEM:xaraja|ROOT:xrj|2MS★maA⚓**And wherever⚓ V|IMPV|(II)|LEM:wal~aY`|ROOT:wly|2MS★kuntumo⚓you (all) are⚓ N|LEM:wajoh|ROOT:wjh|M|ACC★fawal~uwA@⚓[so] turn⚓ LOC|LEM:$aTor|ROOT:$Tr|M|ACC★wujuwhakumo⚓your faces⚓ N|LEM:masojid|ROOT:sjd|M|GEN★$aTorahu,⚓(in) its direction,⚓ ADJ|LEM:HaraAm|ROOT:Hrm|M|GEN★li}al~aA⚓so that not⚓ ACC|LEM:<in~|SP:<in~★yakuwna⚓will be⚓ N|LEM:Haq~|ROOT:Hqq|M|NOM★liln~aAsi⚓for the people⚓ P|LEM:min★Ealayokumo⚓against you⚓ N|LEM:rab~|ROOT:rbb|M|GEN★Huj~apN⚓any argument⚓ NEG|LEM:maA|SP:kaAn★<il~aA⚓except⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{l~a*iyna⚓those who⚓ N|ACT|PCPL|LEM:ga`fil|ROOT:gfl|M|INDEF|GEN★ZalamuwA@⚓wronged⚓ P|LEM:Ean★minohumo⚓among them;⚓ REL|LEM:maA★falaA⚓so (do) not⚓ V|IMPF|LEM:Eamila|ROOT:Eml|2MP★taxo$awohumo⚓fear them,⚓ P|LEM:min★wa{xo$awoniY⚓but fear Me.⚓ N|LEM:Hayov|ROOT:Hyv|GEN★wali>utim~a⚓And that I complete⚓ V|PERF|LEM:xaraja|ROOT:xrj|2MS★niEomatiY⚓My favor⚓ V|IMPV|(II)|LEM:wal~aY`|ROOT:wly|2MS★Ealayokumo⚓upon you⚓ N|LEM:wajoh|ROOT:wjh|M|ACC★walaEal~akumo⚓[and] so that you may⚓ LOC|LEM:$aTor|ROOT:$Tr|M|ACC★tahotaduwna⚓(be) guided.⚓ N|LEM:masojid|ROOT:sjd|M|GEN★",
"kamaA^⚓As⚓ADJ|LEM:HaraAm|ROOT:Hrm|M|GEN★>arosalonaA⚓We sent⚓ COND|LEM:Hayov2|ROOT:Hyv★fiykumo⚓among you⚓ SUP|LEM:maA★rasuwlFA⚓a Messenger⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★m~inkumo⚓from you⚓ V|IMPV|(II)|LEM:wal~aY`|ROOT:wly|2MP★yatoluwA@⚓(who) recites⚓ N|LEM:wajoh|ROOT:wjh|MP|ACC★Ealayokumo⚓to you⚓ LOC|LEM:$aTor|ROOT:$Tr|M|ACC★'aAya`tinaA⚓Our verses⚓ SUB|LEM:>an★wayuzak~iykumo⚓and purifies you⚓ NEG|LEM:laA★wayuEal~imukumu⚓and teaches you⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS|MOOD:SUBJ★{lokita`ba⚓the Book⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★wa{loHikomapa⚓and the wisdom⚓ P|LEM:EalaY`★wayuEal~imukum⚓and teaches you⚓ N|LEM:Huj~ap|ROOT:Hjj|F|INDEF|NOM★m~aA⚓what⚓ EXP|LEM:<il~aA★lamo⚓not⚓ REL|LEM:{l~a*iY|MP★takuwnuwA@⚓you were⚓ V|PERF|LEM:Zalama|ROOT:Zlm|3MP★taEolamuwna⚓knowing.⚓ P|LEM:min★",
"fa{*okuruwniY^⚓So remember Me,⚓PRO|LEM:laA★>a*okurokumo⚓I will remember you⚓ V|IMPF|LEM:xa$iYa|ROOT:x$y|2MP|MOOD:JUS★wa{$okuruwA@⚓and be grateful⚓ V|IMPV|LEM:xa$iYa|ROOT:x$y|2MP★liY⚓to Me⚓ V|IMPF|(IV)|LEM:>atam~a|ROOT:tmm|1S|MOOD:SUBJ★walaA⚓**and (do) not be ungrateful to Me.⚓ N|LEM:niEomap|ROOT:nEm|F|ACC★takofuruwni⚓**and (do) not be ungrateful to Me.⚓ P|LEM:EalaY`★",
"ya`^>ay~uhaA⚓O you⚓ACC|LEM:laEal~|SP:<in~★{l~a*iyna⚓who⚓ V|IMPF|(VIII)|LEM:{hotadaY`|ROOT:hdy|2MP★'aAmanuwA@⚓believe[d]!⚓ SUB|LEM:maA★{sotaEiynuwA@⚓Seek help⚓ V|PERF|(IV)|LEM:>arosala|ROOT:rsl|1P★bi{lS~abori⚓through patience⚓ P|LEM:fiY★wa{lS~alaw`pi⚓and the prayer.⚓ N|LEM:rasuwl|ROOT:rsl|M|INDEF|ACC★<in~a⚓Indeed,⚓ P|LEM:min★{ll~aha⚓Allah⚓ V|IMPF|LEM:talaY`|ROOT:tlw|3MS★maEa⚓(is) with⚓ P|LEM:EalaY`★{lS~a`biriyna⚓the patient ones.⚓ N|LEM:'aAyap|ROOT:Ayy|FP|ACC★",
"walaA⚓**And (do) not say⚓V|IMPF|(II)|LEM:zak~aY`|ROOT:zkw|3MS★taquwluwA@⚓**And (do) not say⚓ V|IMPF|(II)|LEM:Eal~ama|ROOT:Elm|3MS★liman⚓for (the ones) who⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★yuqotalu⚓are slain⚓ N|LEM:Hikomap|ROOT:Hkm|F|ACC★fiY⚓in⚓ V|IMPF|(II)|LEM:Eal~ama|ROOT:Elm|3MS★sabiyli⚓(the) way⚓ REL|LEM:maA★{ll~ahi⚓(of) Allah⚓ NEG|LEM:lam★>amowa`tN[⚓`(They are) dead.`⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP|MOOD:JUS★balo⚓Nay,⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★>aHoyaA^'N⚓(they are) alive⚓ V|IMPV|LEM:*akara|ROOT:*kr|2MP★wala`kin⚓[and] but⚓ V|IMPF|LEM:*akara|ROOT:*kr|1S|MOOD:JUS★l~aA⚓**you (do) not perceive.⚓ V|IMPV|LEM:$akara|ROOT:$kr|2MP★ta$oEuruwna⚓**you (do) not perceive.⚓ PRON|1S★",
"walanaboluwan~akum⚓And surely We will test you⚓PRO|LEM:laA★bi$aYo'K⚓with something⚓ V|IMPF|LEM:kafara|ROOT:kfr|2MP|MOOD:JUS★m~ina⚓of⚓ N|LEM:>ay~uhaA|NOM★{loxawofi⚓[the] fear⚓ REL|LEM:{l~a*iY|MP★wa{lojuwEi⚓and [the] hunger⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★wanaqoSK⚓and loss⚓ V|IMPV|(X)|LEM:{sotaEiynu|ROOT:Ewn|2MP★m~ina⚓of⚓ N|LEM:Sabor|ROOT:Sbr|M|GEN★{lo>amowa`li⚓[the] wealth⚓ N|LEM:Salaw`p|ROOT:Slw|F|GEN★wa{lo>anfusi⚓and [the] lives⚓ ACC|LEM:<in~|SP:<in~★wa{lv~amara`ti⚓and [the] fruits,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★waba$~iri⚓but give good news⚓ LOC|LEM:maE|ACC★{lS~a`biriyna⚓(to) the patient ones.⚓ N|ACT|PCPL|LEM:SaAbir|ROOT:Sbr|MP|GEN★",
"{l~a*iyna⚓Those who,⚓PRO|LEM:laA★<i*aA^⚓when⚓ V|IMPF|LEM:qaAla|ROOT:qwl|2MP|MOOD:JUS★>aSa`batohum⚓strikes them⚓ REL|LEM:man★m~uSiybapN⚓a misfortune,⚓ V|IMPF|PASS|LEM:qatala|ROOT:qtl|3MS★qaAluw^A@⚓they say,⚓ P|LEM:fiY★<in~aA⚓**`Indeed, we belong to Allah⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★lil~ahi⚓**`Indeed, we belong to Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wa<in~aA^⚓and indeed we⚓ N|LEM:m~ay~it|ROOT:mwt|MP|INDEF|NOM★<ilayohi⚓towards Him⚓ RET|LEM:bal★ra`jiEuwna⚓will return.`⚓ N|LEM:Hay~|ROOT:Hyy|MP|INDEF|NOM★",
">uw@la`^}ika⚓Those⚓AMD|LEM:la`kin★Ealayohimo⚓on them⚓ NEG|LEM:laA★Salawa`tN⚓(are) blessings⚓ V|IMPF|LEM:ya$oEuru|ROOT:$Er|2MP★m~in⚓**from their Lord⚓ V|IMPF|LEM:balawo|ROOT:blw|1P★r~ab~ihimo⚓**from their Lord⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★waraHomapN⚓and Mercy.⚓ P|LEM:min★wa>uw@la`^}ika⚓And those⚓ N|LEM:xawof|ROOT:xwf|M|GEN★humu⚓[they]⚓ N|LEM:juwE|ROOT:jwE|M|GEN★{lomuhotaduwna⚓(are) the guided ones.⚓ N|LEM:naqoS|ROOT:nqS|M|INDEF|GEN★",
"<in~a⚓**Indeed,⚓P|LEM:min★{lS~afaA⚓the Safa⚓ N|LEM:maAl|ROOT:mwl|MP|GEN★wa{lomarowapa⚓and the Marwah⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★min⚓**(are) from (the) symbols⚓ N|LEM:vamara`t|ROOT:vmr|FP|GEN★$aEaA^}iri⚓**(are) from (the) symbols⚓ V|IMPV|(II)|LEM:bu$~ira|ROOT:b$r|2MS★{ll~ahi⚓(of) Allah.⚓ N|ACT|PCPL|LEM:SaAbir|ROOT:Sbr|MP|ACC★famano⚓So whoever⚓ REL|LEM:{l~a*iY|MP★Haj~a⚓performs Hajj⚓ T|LEM:<i*aA★{lobayota⚓(of) the House⚓ V|PERF|(IV)|LEM:>aSaAba|ROOT:Swb|3FS★>awi⚓or⚓ N|ACT|PCPL|(IV)|LEM:m~uSiybap|ROOT:Swb|F|INDEF|NOM★{Eotamara⚓performs Umrah,⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★falaA⚓so no⚓ ACC|LEM:<in~|SP:<in~★junaAHa⚓blame⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★Ealayohi⚓on him⚓ ACC|LEM:<in~|SP:<in~★>an⚓that⚓ P|LEM:<ilaY`★yaT~aw~afa⚓he walks⚓ N|ACT|PCPL|LEM:ra`jiEuwn|ROOT:rjE|MP|NOM★bihimaA⚓between [both of] them.⚓ DEM|LEM:>uwla`^}ik|P★waman⚓And whoever⚓ P|LEM:EalaY`★taTaw~aEa⚓voluntarily does⚓ N|LEM:Salaw`p|ROOT:Slw|FP|INDEF|NOM★xayorFA⚓good,⚓ P|LEM:min★fa<in~a⚓**then indeed, Allah⚓ N|LEM:rab~|ROOT:rbb|M|GEN★{ll~aha⚓**then indeed, Allah⚓ N|LEM:raHomap|ROOT:rHm|F|INDEF|NOM★$aAkirN⚓(is) All-Appreciative,⚓ DEM|LEM:>uwla`^}ik|P★EaliymN⚓All-Knowing.⚓ PRON|3MP★",
"<in~a⚓Indeed,⚓N|ACT|PCPL|(VIII)|LEM:m~uhotaduwn|ROOT:hdy|MP|NOM★{l~a*iyna⚓those who⚓ ACC|LEM:<in~|SP:<in~★yakotumuwna⚓conceal⚓ PN|LEM:S~afaA|ACC★maA^⚓what⚓ PN|LEM:marowap|ACC★>anzalonaA⚓We revealed⚓ P|LEM:min★mina⚓of⚓ N|LEM:$aEa`^}ir|ROOT:$Er|MP|GEN★{lobay~ina`ti⚓the clear proofs,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wa{lohudaY`⚓and the Guidance,⚓ COND|LEM:man★min[⚓**after⚓ V|PERF|LEM:Haj~a|ROOT:Hjj|3MS★baEodi⚓**after⚓ N|LEM:bayot|ROOT:byt|M|ACC★maA⚓**[what] We made clear⚓ CONJ|LEM:>aw★bay~an~a`hu⚓**[what] We made clear⚓ V|PERF|(VIII)|LEM:{Eotamara|ROOT:Emr|3MS★liln~aAsi⚓to the people⚓ NEG|LEM:laA|SP:<in~★fiY⚓in⚓ N|LEM:junaAH|ROOT:jnH|M|ACC★{lokita`bi⚓the Book -⚓ P|LEM:EalaY`★>uw@la`^}ika⚓those,⚓ SUB|LEM:>an★yaloEanuhumu⚓**Allah curses them⚓ V|IMPF|(V)|LEM:yaT~aw~afa|ROOT:Twf|3MS|MOOD:SUBJ★{ll~ahu⚓**Allah curses them⚓ PRON|3D★wayaloEanuhumu⚓and curse them⚓ COND|LEM:man★{ll~a`Einuwna⚓the ones who curse.⚓ V|PERF|(V)|LEM:taTaw~aEa|ROOT:TwE|3MS★",
"<il~aA⚓Except⚓N|LEM:xayor|ROOT:xyr|MS|INDEF|ACC★{l~a*iyna⚓those⚓ ACC|LEM:<in~|SP:<in~★taAbuwA@⚓who repent[ed]⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★wa>aSolaHuwA@⚓and reform[ed]⚓ N|ACT|PCPL|LEM:$aAkir|ROOT:$kr|M|INDEF|NOM★wabay~anuwA@⚓and openly declar[ed].⚓ ADJ|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★fa>uw@la`^}ika⚓Then those,⚓ ACC|LEM:<in~|SP:<in~★>atuwbu⚓I will accept repentance⚓ REL|LEM:{l~a*iY|MP★Ealayohimo⚓from them,⚓ V|IMPF|LEM:katama|ROOT:ktm|3MP★wa>anaA⚓and I (am)⚓ REL|LEM:maA★{lt~aw~aAbu⚓the Acceptor of Repentance,⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|1P★{lr~aHiymu⚓the Most Merciful.⚓ P|LEM:min★",
"<in~a⚓**Indeed, those who⚓N|LEM:bay~inap|ROOT:byn|FP|GEN★{l~a*iyna⚓**Indeed, those who⚓ N|LEM:hudFY|ROOT:hdy|M|GEN★kafaruwA@⚓disbelieve[d]⚓ P|LEM:min★wamaAtuwA@⚓and die[d]⚓ N|LEM:baEod|ROOT:bEd|GEN★wahumo⚓while they⚓ REL|LEM:maA★kuf~aArN⚓(were) disbelievers,⚓ V|PERF|(II)|LEM:bay~anu|ROOT:byn|1P★>uw@la`^}ika⚓those,⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★Ealayohimo⚓on them⚓ P|LEM:fiY★laEonapu⚓(is the) curse⚓ N|LEM:kita`b|ROOT:ktb|M|GEN★{ll~ahi⚓(of) Allah,⚓ DEM|LEM:>uwla`^}ik|P★wa{lomala`^}ikapi⚓and the Angels,⚓ V|IMPF|LEM:laEana|ROOT:lEn|3MS★wa{ln~aAsi⚓and the mankind,⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★>ajomaEiyna⚓all together.⚓ V|IMPF|LEM:laEana|ROOT:lEn|3MS★",
"xa`lidiyna⚓(Will) abide forever⚓N|ACT|PCPL|LEM:l~a`Einuwn|ROOT:lEn|MP|NOM★fiyhaA⚓in it.⚓ EXP|LEM:<il~aA★laA⚓**Will not be lightened⚓ REL|LEM:{l~a*iY|MP★yuxaf~afu⚓**Will not be lightened⚓ V|PERF|LEM:taAba|ROOT:twb|3MP★Eanohumu⚓for them⚓ V|PERF|(IV)|LEM:>aSolaHa|ROOT:SlH|3MP★{loEa*aAbu⚓the punishment⚓ V|PERF|(II)|LEM:bay~anu|ROOT:byn|3MP★walaA⚓and not⚓ DEM|LEM:>uwla`^}ik|P★humo⚓they⚓ V|IMPF|LEM:taAba|ROOT:twb|1S★yunZaruwna⚓will be reprieved.⚓ P|LEM:EalaY`★",
"wa<ila`hukumo⚓And your God⚓PRON|1S★<ila`hN⚓**(is) one God;⚓ N|ACT|PCPL|LEM:taw~aAb|ROOT:twb|MS|NOM★wa`HidN⚓**(is) one God;⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|NOM★l~aA^⚓**(there is) no god⚓ ACC|LEM:<in~|SP:<in~★<ila`ha⚓**(there is) no god⚓ REL|LEM:{l~a*iY|MP★<il~aA⚓except⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★huwa⚓Him,⚓ V|PERF|LEM:m~aAta|ROOT:mwt|3MP★{lr~aHoma`nu⚓the Most Gracious,⚓ PRON|3MP★{lr~aHiymu⚓the Most Merciful.⚓ N|LEM:kaAfir|ROOT:kfr|MP|INDEF|NOM★",
"<in~a⚓Indeed,⚓DEM|LEM:>uwla`^}ik|P★fiY⚓in⚓ P|LEM:EalaY`★xaloqi⚓(the) creation⚓ N|LEM:laEonap|ROOT:lEn|F|NOM★{ls~ama`wa`ti⚓(of) the heavens⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wa{lo>aroDi⚓and the earth,⚓ N|LEM:malak|ROOT:mlk|MP|GEN★wa{xotila`fi⚓and alternation⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★{l~ayoli⚓of the night⚓ N|LEM:>ajomaEiyn|ROOT:jmE|MP|GEN★wa{ln~ahaAri⚓and the day,⚓ N|ACT|PCPL|LEM:xa`lid|ROOT:xld|MP|ACC★wa{lofuloki⚓and the ships⚓ P|LEM:fiY★{l~atiY⚓which⚓ NEG|LEM:laA★tajoriY⚓sail⚓ V|IMPF|PASS|(II)|LEM:xaf~afa|ROOT:xff|3MS★fiY⚓in⚓ P|LEM:Ean★{lobaHori⚓the sea⚓ N|LEM:Ea*aAb|ROOT:E*b|M|NOM★bimaA⚓with what⚓ NEG|LEM:laA★yanfaEu⚓benefits⚓ PRON|3MP★{ln~aAsa⚓[the] people,⚓ V|IMPF|PASS|(IV)|LEM:yunZaru|ROOT:nZr|3MP★wamaA^⚓and what⚓ N|LEM:<ila`h|ROOT:Alh|MS|NOM★>anzala⚓**Allah (has) sent down⚓ N|LEM:<ila`h|ROOT:Alh|MS|INDEF|NOM★{ll~ahu⚓**Allah (has) sent down⚓ ADJ|LEM:wa`Hid|ROOT:wHd|MS|INDEF|NOM★mina⚓**from the sky⚓ NEG|LEM:laA|SP:<in~★{ls~amaA^'i⚓**from the sky⚓ N|LEM:<ila`h|ROOT:Alh|MS|ACC★min⚓**[of] water,⚓ EXP|LEM:<il~aA★m~aA^'K⚓**[of] water,⚓ PRON|3MS★fa>aHoyaA⚓**giving life thereby⚓ N|LEM:r~aHoma`n|ROOT:rHm|MS|NOM★bihi⚓**giving life thereby⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|NOM★{lo>aroDa⚓(to) the earth⚓ ACC|LEM:<in~|SP:<in~★baEoda⚓after⚓ P|LEM:fiY★mawotihaA⚓its death,⚓ N|LEM:xaloq|ROOT:xlq|M|GEN★wabav~a⚓and dispersing⚓ N|LEM:samaA^'|ROOT:smw|FP|GEN★fiyhaA⚓therein⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★min⚓**[of] every⚓ N|VN|(VIII)|LEM:{xotila`f|ROOT:xlf|M|GEN★kul~i⚓**[of] every⚓ N|LEM:layol|ROOT:lyl|M|GEN★daA^b~apK⚓moving creature,⚓ N|LEM:nahaAr|ROOT:nhr|M|GEN★wataSoriyfi⚓and directing⚓ N|LEM:fulok|ROOT:flk|M|GEN★{lr~iya`Hi⚓(of) the winds⚓ REL|LEM:{l~a*iY|FS★wa{ls~aHaAbi⚓and the clouds⚓ V|IMPF|LEM:jarayo|ROOT:jry|3FS★{lomusax~ari⚓[the] controlled⚓ P|LEM:fiY★bayona⚓between⚓ N|LEM:baHor|ROOT:bHr|M|GEN★{ls~amaA^'i⚓the sky⚓ REL|LEM:maA★wa{lo>aroDi⚓and the earth,⚓ V|IMPF|LEM:nafaEa|ROOT:nfE|3MS★la'aAya`tK⚓surely (are) Signs⚓ N|LEM:n~aAs|ROOT:nws|MP|ACC★l~iqawomK⚓for a people⚓ REL|LEM:maA★yaEoqiluwna⚓who use their intellect.⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|3MS★",
"wamina⚓And among⚓PN|LEM:{ll~ah|ROOT:Alh|NOM★{ln~aAsi⚓the mankind⚓ P|LEM:min★man⚓who⚓ N|LEM:samaA^'|ROOT:smw|F|GEN★yat~axi*u⚓takes⚓ P|LEM:min★min⚓**besides⚓ N|LEM:maA^'|ROOT:mwh|M|INDEF|GEN★duwni⚓**besides⚓ V|PERF|(IV)|LEM:>aHoyaA|ROOT:Hyy|3MS★{ll~ahi⚓Allah⚓ PRON|3MS★>andaAdFA⚓equals.⚓ N|LEM:>aroD|ROOT:ArD|F|ACC★yuHib~uwnahumo⚓They love them⚓ T|LEM:baEod|ROOT:bEd|ACC★kaHub~i⚓**as (they should) love Allah.⚓ N|LEM:mawot|ROOT:mwt|M|GEN★{ll~ahi⚓**as (they should) love Allah.⚓ V|PERF|LEM:bav~a|ROOT:bvv|3MS★wa{l~a*iyna⚓And those who⚓ P|LEM:fiY★'aAmanuw^A@⚓believe[d]⚓ P|LEM:min★>a$ad~u⚓(are) stronger⚓ N|LEM:kul~|ROOT:kll|M|GEN★Hub~FA⚓(in) love⚓ N|LEM:daA^b~ap|ROOT:dbb|F|INDEF|GEN★l~il~ahi⚓for Allah.⚓ N|VN|(II)|LEM:taSoriyf|ROOT:Srf|M|GEN★walawo⚓And if⚓ N|LEM:riyH|ROOT:rwH|FP|GEN★yaraY⚓would see⚓ N|LEM:saHaAb|ROOT:sHb|M|GEN★{l~a*iyna⚓those who⚓ ADJ|PASS|PCPL|(II)|LEM:musax~ar|ROOT:sxr|M|GEN★Zalamuw^A@⚓wronged,⚓ LOC|LEM:bayon|ROOT:byn|ACC★<i*o⚓when⚓ N|LEM:samaA^'|ROOT:smw|F|GEN★yarawona⚓they will see⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★{loEa*aAba⚓the punishment⚓ N|LEM:'aAyap|ROOT:Ayy|FP|INDEF|ACC★>an~a⚓that⚓ N|LEM:qawom|ROOT:qwm|M|INDEF|GEN★{loquw~apa⚓**all the power belongs to Allah⚓ V|IMPF|LEM:Eaqalu|ROOT:Eql|3MP★lil~ahi⚓**all the power belongs to Allah⚓ P|LEM:min★jamiyEFA⚓**all the power belongs to Allah⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★wa>an~a⚓**and [that] Allah⚓ REL|LEM:man★{ll~aha⚓**and [that] Allah⚓ V|IMPF|(VIII)|LEM:{t~axa*a|ROOT:Ax*|3MS★$adiydu⚓(is) severe⚓ P|LEM:min★{loEa*aAbi⚓(in) [the] punishment.⚓ N|LEM:duwn|ROOT:dwn|GEN★",
"<i*o⚓When⚓PN|LEM:{ll~ah|ROOT:Alh|GEN★tabar~a>a⚓will disown⚓ N|LEM:>andaAd|ROOT:ndd|MP|INDEF|ACC★{l~a*iyna⚓those who⚓ V|IMPF|(IV)|LEM:>aHobabo|ROOT:Hbb|3MP★{t~ubiEuwA@⚓were followed⚓ N|LEM:Hub~|ROOT:Hbb|M|GEN★mina⚓**[from] those⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★{l~a*iyna⚓**[from] those⚓ REL|LEM:{l~a*iY|MP★{t~abaEuwA@⚓who followed⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★wara>awuA@⚓and they will see⚓ N|LEM:>a$ad~|ROOT:$dd|MS|NOM★{loEa*aAba⚓the punishment,⚓ N|LEM:Hub~|ROOT:Hbb|M|INDEF|ACC★wataqaT~aEato⚓[and] will be cut off⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★bihimu⚓for them⚓ COND|LEM:law★{lo>asobaAbu⚓the relations.⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|3MS★",
"waqaAla⚓And said⚓REL|LEM:{l~a*iY|MP★{l~a*iyna⚓those who⚓ V|PERF|LEM:Zalama|ROOT:Zlm|3MP★{t~abaEuwA@⚓followed,⚓ T|LEM:<i*★lawo⚓**`(Only) if [that]⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|3MP★>an~a⚓**`(Only) if [that]⚓ N|LEM:Ea*aAb|ROOT:E*b|M|ACC★lanaA⚓for us⚓ ACC|LEM:>an~|SP:<in~★kar~apF⚓a return,⚓ N|LEM:quw~ap|ROOT:qwy|F|ACC★fanatabar~a>a⚓then we will disown⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★minohumo⚓[from] them⚓ N|LEM:jamiyE|ROOT:jmE|M|INDEF|ACC★kamaA⚓as⚓ ACC|LEM:>an~|SP:<in~★tabar~a'uwA@⚓they disown⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★min~aA⚓[from] us.`⚓ N|LEM:$adiyd|ROOT:$dd|MS|NOM★ka*a`lika⚓Thus⚓ N|LEM:Ea*aAb|ROOT:E*b|M|GEN★yuriyhimu⚓**Allah will show them⚓ T|LEM:<i*★{ll~ahu⚓**Allah will show them⚓ V|PERF|(V)|LEM:tabar~a>a|ROOT:brA|3MS★>aEoma`lahumo⚓their deeds⚓ REL|LEM:{l~a*iY|MP★Hasara`tK⚓(as) regrets⚓ V|PERF|PASS|(VIII)|LEM:{t~abaEa|ROOT:tbE|3MP★Ealayohimo⚓for them.⚓ P|LEM:min★wamaA⚓And not⚓ REL|LEM:{l~a*iY|MP★hum⚓they⚓ V|PERF|(VIII)|LEM:{t~abaEa|ROOT:tbE|3MP★bixa`rijiyna⚓will come out⚓ V|PERF|LEM:ra'aA|ROOT:rAy|3MP★mina⚓from⚓ N|LEM:Ea*aAb|ROOT:E*b|M|ACC★{ln~aAri⚓the Fire.⚓ V|PERF|(V)|LEM:t~aqaT~aEa|ROOT:qTE|3FS★",
"ya`^>ay~uhaA⚓**O mankind!⚓PRON|3MP★{ln~aAsu⚓**O mankind!⚓ N|LEM:sabab|ROOT:sbb|MP|NOM★kuluwA@⚓Eat⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★mim~aA⚓of what⚓ REL|LEM:{l~a*iY|MP★fiY⚓**(is) in the earth -⚓ V|PERF|(VIII)|LEM:{t~abaEa|ROOT:tbE|3MP★{lo>aroDi⚓**(is) in the earth -⚓ COND|LEM:law★Hala`lFA⚓lawful⚓ ACC|LEM:>an~|SP:<in~★Tay~ibFA⚓(and) good.⚓ PRON|1P★walaA⚓And (do) not⚓ N|LEM:kar~ap|ROOT:krr|F|INDEF|ACC★tat~abiEuwA@⚓follow⚓ V|IMPF|(V)|LEM:tabar~a>a|ROOT:brA|1P|MOOD:SUBJ★xuTuwa`ti⚓(the) footsteps (of)⚓ P|LEM:min★{l$~ayoTa`ni⚓the Shaitaan.⚓ SUB|LEM:maA★<in~ahu,⚓Indeed, he⚓ V|IMPV|(V)|LEM:tabar~a>a|ROOT:brA|2MP★lakumo⚓(is) to you⚓ P|LEM:min★Eaduw~N⚓an enemy⚓ DEM|LEM:*a`lik|MS★m~ubiynN⚓clear.⚓ V|IMPF|(IV)|LEM:>arayo|ROOT:rAy|3MS★",
"<in~amaA⚓Only⚓PN|LEM:{ll~ah|ROOT:Alh|NOM★ya>omurukum⚓he commands you⚓ N|LEM:Eamal|ROOT:Eml|MP|ACC★bi{ls~uw^'i⚓to (do) the evil⚓ N|LEM:Hasorap|ROOT:Hsr|FP|INDEF|ACC★wa{lofaHo$aA^'i⚓and the shameful⚓ P|LEM:EalaY`★wa>an⚓and that⚓ NEG|LEM:maA|SP:kaAn★taquwluwA@⚓you say⚓ PRON|3MP★EalaY⚓about⚓ N|ACT|PCPL|LEM:xaArij|ROOT:xrj|MP|GEN★{ll~ahi⚓Allah⚓ P|LEM:min★maA⚓what⚓ N|LEM:naAr|ROOT:nwr|F|GEN★laA⚓not⚓ N|LEM:>ay~uhaA|NOM★taEolamuwna⚓you know.⚓ N|LEM:n~aAs|ROOT:nws|MP|NOM★",
"wa<i*aA⚓And when⚓V|IMPV|LEM:>akala|ROOT:Akl|2MP★qiyla⚓it is said⚓ P|LEM:min★lahumu⚓to them,⚓ REL|LEM:maA★{t~abiEuwA@⚓`Follow⚓ P|LEM:fiY★maA^⚓what⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★>anzala⚓**Allah has revealed,`⚓ N|LEM:Hala`l|ROOT:Hll|M|INDEF|ACC★{ll~ahu⚓**Allah has revealed,`⚓ ADJ|LEM:Tay~ib|ROOT:Tyb|MS|INDEF|ACC★qaAluwA@⚓they said,⚓ PRO|LEM:laA★balo⚓`Nay⚓ V|IMPF|(VIII)|LEM:{t~abaEa|ROOT:tbE|2MP|MOOD:JUS★nat~abiEu⚓we follow⚓ N|LEM:xuTuwa`t|ROOT:xTw|FP|ACC★maA^⚓what⚓ PN|LEM:$ayoTa`n|ROOT:$Tn|M|GEN★>alofayonaA⚓we found⚓ ACC|LEM:<in~|SP:<in~★Ealayohi⚓[on it]⚓ PRON|2MP★'aAbaA^'anaA^⚓our forefathers (following)`.⚓ N|LEM:Eaduw~|ROOT:Edw|M|INDEF|NOM★>awalawo⚓Even though⚓ ADJ|ACT|PCPL|(IV)|LEM:m~ubiyn|ROOT:byn|M|INDEF|NOM★kaAna⚓[were]⚓ ACC|LEM:<in~|SP:<in~★'aAbaA^&uhumo⚓their forefathers⚓ PREV|LEM:maA★laA⚓**(did) not understand⚓ V|IMPF|LEM:>amara|ROOT:Amr|3MS★yaEoqiluwna⚓**(did) not understand⚓ N|LEM:suw^'|ROOT:swA|M|GEN★$ayo_#FA⚓anything⚓ N|LEM:faHo$aA^'|ROOT:fH$|FS|GEN★walaA⚓**and they were not guided?⚓ SUB|LEM:>an★yahotaduwna⚓**and they were not guided?⚓ V|IMPF|LEM:qaAla|ROOT:qwl|2MP|MOOD:SUBJ★",
"wamavalu⚓And (the) example⚓P|LEM:EalaY`★{l~a*iyna⚓(of) those who⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★kafaruwA@⚓disbelieve[d]⚓ REL|LEM:maA★kamavali⚓(is) like (the) example⚓ NEG|LEM:laA★{l~a*iY⚓(of) the one who⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★yanoEiqu⚓shouts⚓ T|LEM:<i*aA★bimaA⚓at what⚓ V|PERF|PASS|LEM:qaAla|ROOT:qwl|3MS★laA⚓**(does) not hear⚓ PRON|3MP★yasomaEu⚓**(does) not hear⚓ V|IMPV|(VIII)|LEM:{t~abaEa|ROOT:tbE|2MP★<il~aA⚓except⚓ REL|LEM:maA★duEaA^'F⚓calls⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|3MS★wanidaA^'F⚓and cries -⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★Sum~N[⚓deaf⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★bukomN⚓dumb,⚓ RET|LEM:bal★EumoYN⚓(and) blind,⚓ V|IMPF|(VIII)|LEM:{t~abaEa|ROOT:tbE|1P★fahumo⚓[so] they⚓ REL|LEM:maA★laA⚓**(do) not understand.⚓ V|PERF|(IV)|LEM:>alofa|ROOT:lfw|1P★yaEoqiluwna⚓**(do) not understand.⚓ P|LEM:EalaY`★",
"ya`^>ay~uhaA⚓**O you who⚓N|LEM:A^baA'|ROOT:Abw|MP|ACC★{l~a*iyna⚓**O you who⚓ SUB|LEM:law★'aAmanuwA@⚓believe[d]!⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★kuluwA@⚓Eat⚓ N|LEM:A^baA'|ROOT:Abw|MP|NOM★min⚓**from (the) good⚓ NEG|LEM:laA★Tay~iba`ti⚓**from (the) good⚓ V|IMPF|LEM:Eaqalu|ROOT:Eql|3MP★maA⚓what⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|ACC★razaqona`kumo⚓We have provided you⚓ NEG|LEM:laA★wa{$okuruwA@⚓and be grateful⚓ V|IMPF|(VIII)|LEM:{hotadaY`|ROOT:hdy|3MP★lil~ahi⚓to Allah⚓ N|LEM:maval|ROOT:mvl|M|NOM★<in⚓if⚓ REL|LEM:{l~a*iY|MP★kuntumo⚓you⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★<iy~aAhu⚓**worship Him alone.⚓ N|LEM:maval|ROOT:mvl|M|GEN★taEobuduwna⚓**worship Him alone.⚓ REL|LEM:{l~a*iY|MS★",
"<in~amaA⚓Only⚓V|IMPF|LEM:yanoEiqu|ROOT:nEq|3MS★Har~ama⚓He has forbidden⚓ REL|LEM:maA★Ealayokumu⚓to you⚓ NEG|LEM:laA★{lomayotapa⚓the dead animals,⚓ V|IMPF|LEM:samiEa|ROOT:smE|3MS★wa{ld~ama⚓and [the] blood,⚓ RES|LEM:<il~aA★walaHoma⚓and flesh,⚓ N|LEM:duEaA^'|ROOT:dEw|M|INDEF|ACC★{loxinziyri⚓(of) swine,⚓ N|VN|(III)|LEM:nidaA^'|ROOT:ndw|M|INDEF|ACC★wamaA^⚓**and what has been dedicated⚓ N|LEM:>aSam~|ROOT:Smm|P|INDEF|NOM★>uhil~a⚓**and what has been dedicated⚓ N|LEM:>abokam|ROOT:bkm|P|INDEF|NOM★bihi.⚓[with it]⚓ N|LEM:>aEomaY`|ROOT:Emy|MP|INDEF|NOM★ligayori⚓to other than⚓ PRON|3MP★{ll~ahi⚓Allah.⚓ NEG|LEM:laA★famani⚓So whoever⚓ V|IMPF|LEM:Eaqalu|ROOT:Eql|3MP★{DoTur~a⚓(is) forced by necessity⚓ N|LEM:>ay~uhaA|NOM★gayora⚓without⚓ REL|LEM:{l~a*iY|MP★baAgK⚓(being) disobedient⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★walaA⚓and not⚓ V|IMPV|LEM:>akala|ROOT:Akl|2MP★EaAdK⚓transgressor,⚓ P|LEM:min★falaA^⚓then no⚓ N|LEM:Tay~iba`t|ROOT:Tyb|FP|GEN★<ivoma⚓sin⚓ REL|LEM:maA★Ealayohi⚓on him.⚓ V|PERF|LEM:razaqa|ROOT:rzq|1P★<in~a⚓**Indeed, Allah⚓ V|IMPV|LEM:$akara|ROOT:$kr|2MP★{ll~aha⚓**Indeed, Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★gafuwrN⚓(is) Oft-Forgiving,⚓ COND|LEM:<in★r~aHiymN⚓Most Merciful.⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★",
"<in~a⚓**Indeed, those who⚓PRON|LEM:<iy~aA|3MS★{l~a*iyna⚓**Indeed, those who⚓ V|IMPF|LEM:Eabada|ROOT:Ebd|2MP★yakotumuwna⚓conceal⚓ ACC|LEM:<in~|SP:<in~★maA^⚓**what Allah (has) revealed⚓ PREV|LEM:maA★>anzala⚓**what Allah (has) revealed⚓ V|PERF|(II)|LEM:Har~ama|ROOT:Hrm|3MS★{ll~ahu⚓**what Allah (has) revealed⚓ P|LEM:EalaY`★mina⚓**of the Book,⚓ N|LEM:mayotap|ROOT:mwt|FS|ACC★{lokita`bi⚓**of the Book,⚓ N|LEM:dam|ROOT:dmw|M|ACC★waya$otaruwna⚓and they purchase⚓ N|LEM:laHom|ROOT:lHm|M|ACC★bihi.⚓there with⚓ N|LEM:xinziyr|ROOT:xnzr|M|GEN★vamanFA⚓a gain⚓ REL|LEM:maA★qaliylFA⚓little.⚓ V|PERF|PASS|(IV)|LEM:>uhil~a|ROOT:hll|3MS★>uw@la`^}ika⚓Those,⚓ PRON|3MS★maA⚓**not they eat⚓ N|LEM:gayor|ROOT:gyr|M|GEN★ya>okuluwna⚓**not they eat⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★fiY⚓**in their bellies⚓ COND|LEM:man★buTuwnihimo⚓**in their bellies⚓ V|PERF|PASS|(VIII)|LEM:{DoTur~a|ROOT:Drr|3MS★<il~aA⚓except⚓ N|LEM:gayor|ROOT:gyr|M|ACC★{ln~aAra⚓the Fire.⚓ N|ACT|PCPL|LEM:baAg|ROOT:bgy|M|INDEF|GEN★walaA⚓**And Allah will not speak to them⚓ NEG|LEM:laA★yukal~imuhumu⚓**And Allah will not speak to them⚓ N|ACT|PCPL|LEM:EaAd|ROOT:Edw|M|INDEF|GEN★{ll~ahu⚓**And Allah will not speak to them⚓ NEG|LEM:laA|SP:<in~★yawoma⚓(on the) Day⚓ N|LEM:<ivom|ROOT:Avm|M|ACC★{loqiya`mapi⚓(of) [the] Judgment⚓ P|LEM:EalaY`★walaA⚓**and He will not purify them,⚓ ACC|LEM:<in~|SP:<in~★yuzak~iyhimo⚓**and He will not purify them,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★walahumo⚓and for them⚓ N|LEM:gafuwr|ROOT:gfr|MS|INDEF|NOM★Ea*aAbN⚓(is) a punishment⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|INDEF|NOM★>aliymN⚓painful.⚓ ACC|LEM:<in~|SP:<in~★",
">uw@la`^}ika⚓Those⚓REL|LEM:{l~a*iY|MP★{l~a*iyna⚓(are) they who⚓ V|IMPF|LEM:katama|ROOT:ktm|3MP★{$otarawuA@⚓purchase[d]⚓ REL|LEM:maA★{lD~ala`lapa⚓[the] astraying⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|3MS★bi{lohudaY`⚓for [the] Guidance,⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★wa{loEa*aAba⚓and [the] punishment⚓ P|LEM:min★bi{lomagofirapi⚓for [the] forgiveness.⚓ N|LEM:kita`b|ROOT:ktb|M|GEN★famaA^⚓So what (is)⚓ V|IMPF|(VIII)|LEM:{$otaraY`|ROOT:$ry|3MP★>aSobarahumo⚓their endurance⚓ PRON|3MS★EalaY⚓on⚓ N|LEM:vaman|ROOT:vmn|M|INDEF|ACC★{ln~aAri⚓the Fire!⚓ ADJ|LEM:qaliyl|ROOT:qll|MS|INDEF|ACC★",
"*a`lika⚓That⚓DEM|LEM:>uwla`^}ik|P★bi>an~a⚓(is) because⚓ NEG|LEM:maA★{ll~aha⚓Allah⚓ V|IMPF|LEM:>akala|ROOT:Akl|3MP★naz~ala⚓revealed⚓ P|LEM:fiY★{lokita`ba⚓the Book⚓ N|LEM:baTon|ROOT:bTn|MP|GEN★bi{loHaq~i⚓with [the] Truth.⚓ EXP|LEM:<il~aA★wa<in~a⚓And indeed,⚓ N|LEM:naAr|ROOT:nwr|F|ACC★{l~a*iyna⚓those⚓ NEG|LEM:laA★{xotalafuwA@⚓who differed⚓ V|IMPF|(II)|LEM:kal~ama|ROOT:klm|3MS★fiY⚓in⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{lokita`bi⚓the Book⚓ T|LEM:yawom|ROOT:ywm|M|ACC★lafiY⚓(are) surely in⚓ N|LEM:qiya`map|ROOT:qwm|F|GEN★$iqaAqK]⚓schism⚓ NEG|LEM:laA★baEiydK⚓far.⚓ V|IMPF|(II)|LEM:zak~aY`|ROOT:zkw|3MS★",
"l~ayosa⚓**It is not⚓PRON|3MP★{lobir~a⚓[the] righteousness⚓ N|LEM:Ea*aAb|ROOT:E*b|M|INDEF|NOM★>an⚓that⚓ ADJ|LEM:>aliym|ROOT:Alm|MS|INDEF|NOM★tuwal~uwA@⚓you turn⚓ DEM|LEM:>uwla`^}ik|P★wujuwhakumo⚓your faces⚓ REL|LEM:{l~a*iY|MP★qibala⚓towards⚓ V|PERF|(VIII)|LEM:{$otaraY`|ROOT:$ry|3MP★{loma$oriqi⚓the east⚓ N|LEM:Dala`lap|ROOT:Dll|F|ACC★wa{lomagoribi⚓and the west,⚓ N|LEM:hudFY|ROOT:hdy|M|GEN★wala`kin~a⚓[and] but⚓ N|LEM:Ea*aAb|ROOT:E*b|M|ACC★{lobir~a⚓the righteous[ness]⚓ N|LEM:m~agofirap|ROOT:gfr|F|GEN★mano⚓(is he) who⚓ REL|LEM:maA★'aAmana⚓believes⚓ V|PERF|LEM:Sabara|ROOT:Sbr|3MS★bi{ll~ahi⚓in Allah⚓ P|LEM:EalaY`★wa{loyawomi⚓and the Day⚓ N|LEM:naAr|ROOT:nwr|F|GEN★{lo'aAxiri⚓[the] Last,⚓ DEM|LEM:*a`lik|MS★wa{lomala`^}ikapi⚓and the Angels,⚓ ACC|LEM:>an~|SP:<in~★wa{lokita`bi⚓and the Book,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★wa{ln~abiy~i.na⚓and the Prophets,⚓ V|PERF|(II)|LEM:naz~ala|ROOT:nzl|3MS★wa'aAtaY⚓and gives⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★{lomaAla⚓the wealth⚓ N|LEM:Haq~|ROOT:Hqq|M|GEN★EalaY`⚓**in spite of his love (for it)⚓ ACC|LEM:<in~|SP:<in~★Hub~ihi.⚓**in spite of his love (for it)⚓ REL|LEM:{l~a*iY|MP★*awiY⚓**(to) the near relatives,⚓ V|PERF|(VIII)|LEM:{xotalafa|ROOT:xlf|3MP★{loqurobaY`⚓**(to) the near relatives,⚓ P|LEM:fiY★wa{loyata`maY`⚓and the orphans,⚓ N|LEM:kita`b|ROOT:ktb|M|GEN★wa{lomasa`kiyna⚓and the needy,⚓ P|LEM:fiY★wa{bona⚓**and the wayfarer,⚓ N|VN|(III)|LEM:$iqaAq|ROOT:$qq|M|INDEF|GEN★{ls~abiyli⚓**and the wayfarer,⚓ ADJ|LEM:baEiyd|ROOT:bEd|MS|INDEF|GEN★wa{ls~aA^}iliyna⚓and those who ask,⚓ V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|3MS★wafiY⚓and in⚓ N|LEM:bir~|ROOT:brr|M|ACC★{lr~iqaAbi⚓freeing the necks (slaves)⚓ SUB|LEM:>an★wa>aqaAma⚓and (who) establish⚓ V|IMPF|(II)|LEM:wal~aY`|ROOT:wly|2MP|MOOD:SUBJ★{lS~alaw`pa⚓the prayer,⚓ N|LEM:wajoh|ROOT:wjh|MP|ACC★wa'aAtaY⚓and give⚓ LOC|LEM:qibal|ROOT:qbl|M|ACC★{lz~akaw`pa⚓the zakah,⚓ N|LEM:ma$oriq|ROOT:$rq|M|GEN★wa{lomuwfuwna⚓and those who fulfill⚓ N|LEM:magorib|ROOT:grb|M|GEN★biEahodihimo⚓their covenant⚓ ACC|LEM:la`kin~|SP:<in~★<i*aA⚓when⚓ N|LEM:bir~|ROOT:brr|M|ACC★Ea`haduwA@⚓they make it;⚓ REL|LEM:man★wa{lS~a`biriyna⚓and those who are patient⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MS★fiY⚓**in [the] suffering⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★{loba>osaA^'i⚓**in [the] suffering⚓ N|LEM:yawom|ROOT:ywm|M|GEN★wa{lD~ar~aA^'i⚓and [the] hardship,⚓ ADJ|LEM:A^xir|ROOT:Axr|MS|GEN★waHiyna⚓at (the) time⚓ N|LEM:malak|ROOT:mlk|MP|GEN★{loba>osi⚓(of) [the] stress.⚓ N|LEM:kita`b|ROOT:ktb|M|GEN★>uw@la`^}ika⚓Those⚓ N|LEM:n~abiY~|ROOT:nbA|MP|GEN★{l~a*iyna⚓(are) the ones who⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|3MS★SadaquwA@⚓are true⚓ N|LEM:maAl|ROOT:mwl|M|ACC★wa>uw@la`^}ika⚓and those,⚓ P|LEM:EalaY`★humu⚓[they]⚓ N|LEM:Hub~|ROOT:Hbb|M|GEN★{lomut~aquwna⚓(are) the righteous .⚓ N|LEM:*uw|MD|ACC★",
"ya`^>ay~uhaA⚓O you⚓N|LEM:qurobaY`|ROOT:qrb|F|GEN★{l~a*iyna⚓who⚓ N|LEM:yatiym|ROOT:ytm|P|ACC★'aAmanuwA@⚓believe[d]!⚓ N|LEM:misokiyn|ROOT:skn|MP|ACC★kutiba⚓Prescribed⚓ N|LEM:{bon|ROOT:bny|M|ACC★Ealayokumu⚓for you⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★{loqiSaASu⚓(is) the legal retribution⚓ N|ACT|PCPL|LEM:saA^}il|ROOT:sAl|MP|ACC★fiY⚓**in (the matter of) the murdered,⚓ P|LEM:fiY★{loqatolaY⚓**in (the matter of) the murdered,⚓ N|LEM:raqabap|ROOT:rqb|MP|GEN★{loHur~u⚓the freeman⚓ V|PERF|(IV)|LEM:>aqaAma|ROOT:qwm|3MS★bi{loHur~i⚓for the freeman,⚓ N|LEM:Salaw`p|ROOT:Slw|F|ACC★wa{loEabodu⚓and the slave⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|3MS★bi{loEabodi⚓for the slave,⚓ N|LEM:zakaw`p|ROOT:zkw|F|ACC★wa{lo>unvaY`⚓and the female⚓ N|ACT|PCPL|(IV)|LEM:muwfuwn|ROOT:wfy|MP|NOM★bi{lo>unvaY`⚓for the female.⚓ N|LEM:Eahod|ROOT:Ehd|M|GEN★famano⚓But whoever⚓ T|LEM:<i*aA★EufiYa⚓is pardoned⚓ V|PERF|(III)|LEM:Ea`hada|ROOT:Ehd|3MP★lahu,⚓[for it]⚓ N|ACT|PCPL|LEM:SaAbir|ROOT:Sbr|MP|ACC★mino⚓**from his brother⚓ P|LEM:fiY★>axiyhi⚓**from his brother⚓ N|LEM:ba>osaA^'|ROOT:bAs|F|GEN★$aYo'N⚓anything,⚓ N|LEM:Dar~aA^'|ROOT:Drr|F|GEN★fa{t~ibaAEN[⚓then follows up⚓ T|LEM:Hiyn|ROOT:Hyn|M|ACC★bi{lomaEoruwfi⚓with suitable⚓ N|LEM:ba>os|ROOT:bAs|M|GEN★wa>adaA^'N⚓[and] payment⚓ DEM|LEM:>uwla`^}ik|P★<ilayohi⚓to him⚓ REL|LEM:{l~a*iY|MP★bi<iHosa`nK⚓with kindness.⚓ V|PERF|LEM:Sadaqa|ROOT:Sdq|3MP★*a`lika⚓That (is)⚓ DEM|LEM:>uwla`^}ik|P★taxofiyfN⚓a concession⚓ PRON|3MP★m~in⚓from⚓ N|ACT|PCPL|(VIII)|LEM:mut~aqiyn|ROOT:wqy|MP|NOM★r~ab~ikumo⚓your Lord⚓ N|LEM:>ay~uhaA|NOM★waraHomapN⚓and mercy.⚓ REL|LEM:{l~a*iY|MP★famani⚓Then whoever⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★{EotadaY`⚓transgresses⚓ V|PERF|PASS|LEM:kataba|ROOT:ktb|3MS★baEoda⚓after⚓ P|LEM:EalaY`★*a`lika⚓that,⚓ N|LEM:qiSaAS|ROOT:qSS|M|NOM★falahu,⚓then for him⚓ P|LEM:fiY★Ea*aAbN⚓(is) a punishment⚓ N|LEM:qatolaY|ROOT:qtl|P|GEN★>aliymN⚓painful.⚓ N|LEM:Hur~|ROOT:Hrr|M|NOM★",
"walakumo⚓And for you⚓N|LEM:Hur~|ROOT:Hrr|M|GEN★fiY⚓**in the legal retribution⚓ N|LEM:Eabod|ROOT:Ebd|M|NOM★{loqiSaASi⚓**in the legal retribution⚓ N|LEM:Eabod|ROOT:Ebd|M|GEN★Hayaw`pN⚓(is) life,⚓ N|LEM:>unvaY`|ROOT:Anv|F|NOM★ya`^>uw@liY⚓**O men of understanding!⚓ N|LEM:>unvaY`|ROOT:Anv|F|GEN★{lo>aloba`bi⚓**O men of understanding!⚓ COND|LEM:man★laEal~akumo⚓So that you may⚓ V|PERF|PASS|LEM:EafaA|ROOT:Efw|3MS★tat~aquwna⚓(become) righteous.⚓ PRON|3MS★",
"kutiba⚓Prescribed⚓P|LEM:min★Ealayokumo⚓for you⚓ N|LEM:>ax|ROOT:Axw|MS|GEN★<i*aA⚓when⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|NOM★HaDara⚓approaches⚓ N|VN|(VIII)|LEM:{t~ibaAE|ROOT:tbE|M|INDEF|NOM★>aHadakumu⚓any of you⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|GEN★{lomawotu⚓[the] death,⚓ N|VN|LEM:>adaA^'|ROOT:Ady|M|INDEF|NOM★<in⚓if⚓ P|LEM:<ilaY`★taraka⚓he leaves⚓ N|VN|(IV)|LEM:<iHosa`n|ROOT:Hsn|M|INDEF|GEN★xayorFA⚓good⚓ DEM|LEM:*a`lik|MS★{lowaSiy~apu⚓(making) the will⚓ N|VN|(II)|LEM:taxofiyf|ROOT:xff|M|INDEF|NOM★lilowa`lidayoni⚓for the parents⚓ P|LEM:min★wa{lo>aqorabiyna⚓and the near relatives⚓ N|LEM:rab~|ROOT:rbb|M|GEN★bi{lomaEoruwfi⚓with due fairness⚓ N|LEM:raHomap|ROOT:rHm|F|INDEF|NOM★Haq~FA⚓a duty⚓ COND|LEM:man★EalaY⚓on⚓ V|PERF|(VIII)|LEM:{EotadaY`|ROOT:Edw|3MS★{lomut~aqiyna⚓the righteous ones.⚓ T|LEM:baEod|ROOT:bEd|ACC★",
"faman[⚓Then whoever⚓DEM|LEM:*a`lik|MS★bad~alahu,⚓changes it⚓ PRON|3MS★baEodamaA⚓after what⚓ N|LEM:Ea*aAb|ROOT:E*b|M|INDEF|NOM★samiEahu,⚓he (has) heard [it],⚓ ADJ|LEM:>aliym|ROOT:Alm|MS|INDEF|NOM★fa<in~amaA^⚓so only⚓ PRON|2MP★<ivomuhu,⚓its sin⚓ P|LEM:fiY★EalaY⚓(would be) on⚓ N|LEM:qiSaAS|ROOT:qSS|M|GEN★{l~a*iyna⚓those who⚓ N|LEM:Hayaw`p|ROOT:Hyy|F|INDEF|NOM★yubad~iluwnahu,^⚓alter it.⚓ N|LEM:>uwliY|ROOT:Awl|MP|ACC★<in~a⚓Indeed,⚓ N|LEM:>aloba`b|ROOT:lbb|MP|GEN★{ll~aha⚓Allah⚓ ACC|LEM:laEal~|SP:<in~★samiyEN⚓(is) All-Hearing,⚓ V|IMPF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★EaliymN⚓All-Knowing.⚓ V|PERF|PASS|LEM:kataba|ROOT:ktb|3MS★",
"famano⚓But whoever⚓P|LEM:EalaY`★xaAfa⚓fears⚓ T|LEM:<i*aA★min⚓from⚓ V|PERF|LEM:HaDara|ROOT:HDr|3MS★m~uwSK⚓(the) testator⚓ N|LEM:>aHad|ROOT:AHd|M|ACC★janafFA⚓(any) error⚓ N|LEM:mawot|ROOT:mwt|M|NOM★>awo⚓or⚓ COND|LEM:<in★<ivomFA⚓sin,⚓ V|PERF|LEM:taraka|ROOT:trk|3MS★fa>aSolaHa⚓then reconciles⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|ACC★bayonahumo⚓between them,⚓ N|LEM:waSiy~ap|ROOT:wSy|F|NOM★falaA^⚓then (there is) no⚓ N|LEM:waAlid|ROOT:wld|MD|GEN★<ivoma⚓sin⚓ N|LEM:>aqorab|ROOT:qrb|MP|GEN★Ealayohi⚓on him.⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|GEN★<in~a⚓Indeed,⚓ N|LEM:Haq~|ROOT:Hqq|M|INDEF|ACC★{ll~aha⚓Allah⚓ P|LEM:EalaY`★gafuwrN⚓(is) Oft-Forgiving,⚓ N|ACT|PCPL|(VIII)|LEM:mut~aqiyn|ROOT:wqy|MP|GEN★r~aHiymN⚓All-Merciful.⚓ COND|LEM:man★",
"ya`^>ay~uhaA⚓O you⚓V|PERF|(II)|LEM:bad~ala|ROOT:bdl|3MS★{l~a*iyna⚓who⚓ T|LEM:baEod|ROOT:bEd★'aAmanuwA@⚓believe[d]!⚓ SUB|LEM:maA★kutiba⚓Is prescribed⚓ V|PERF|LEM:samiEa|ROOT:smE|3MS★Ealayokumu⚓for you⚓ ACC|LEM:<in~|SP:<in~★{lS~iyaAmu⚓[the] fasting⚓ PREV|LEM:maA★kamaA⚓as⚓ N|LEM:<ivom|ROOT:Avm|M|NOM★kutiba⚓was prescribed⚓ P|LEM:EalaY`★EalaY⚓to⚓ REL|LEM:{l~a*iY|MP★{l~a*iyna⚓those⚓ V|IMPF|(II)|LEM:bad~ala|ROOT:bdl|3MP★min⚓**before you,⚓ ACC|LEM:<in~|SP:<in~★qabolikumo⚓**before you,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★laEal~akumo⚓so that you may⚓ N|LEM:samiyE|ROOT:smE|MS|INDEF|NOM★tat~aquwna⚓(become) righteous.⚓ ADJ|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★",
">ay~aAmFA⚓(Fasting for) days⚓COND|LEM:man★m~aEoduwda`tK⚓numbered.⚓ V|PERF|LEM:xaAfa|ROOT:xwf|3MS★faman⚓So whoever⚓ P|LEM:min★kaAna⚓**among you is⚓ N|ACT|PCPL|(IV)|LEM:m~uwS|ROOT:wSy|M|INDEF|GEN★minkum⚓**among you is⚓ N|LEM:janaf|ROOT:jnf|M|INDEF|ACC★m~ariyDFA⚓sick⚓ CONJ|LEM:>aw★>awo⚓or⚓ N|LEM:<ivom|ROOT:Avm|M|INDEF|ACC★EalaY`⚓on⚓ V|PERF|(IV)|LEM:>aSolaHa|ROOT:SlH|3MS★safarK⚓a journey,⚓ LOC|LEM:bayon|ROOT:byn|ACC★faEid~apN⚓then a prescribed number⚓ NEG|LEM:laA|SP:<in~★m~ino⚓of⚓ N|LEM:<ivom|ROOT:Avm|M|ACC★>ay~aAmK⚓days⚓ P|LEM:EalaY`★>uxara⚓other.⚓ ACC|LEM:<in~|SP:<in~★waEalaY⚓And on⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★{l~a*iyna⚓those who⚓ N|LEM:gafuwr|ROOT:gfr|MS|INDEF|NOM★yuTiyquwnahu,⚓can afford it,⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|INDEF|NOM★fidoyapN⚓a ransom⚓ N|LEM:>ay~uhaA|NOM★TaEaAmu⚓(of) feeding⚓ REL|LEM:{l~a*iY|MP★misokiynK⚓a poor.⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★faman⚓And whoever⚓ V|PERF|PASS|LEM:kataba|ROOT:ktb|3MS★taTaw~aEa⚓volunteers⚓ P|LEM:EalaY`★xayorFA⚓good⚓ N|LEM:SiyaAm|ROOT:Swm|M|NOM★fahuwa⚓then it⚓ SUB|LEM:maA★xayorN⚓(is) better⚓ V|PERF|PASS|LEM:kataba|ROOT:ktb|3MS★l~ahu,⚓for him.⚓ P|LEM:EalaY`★wa>an⚓And to⚓ REL|LEM:{l~a*iY|MP★taSuwmuwA@⚓fast⚓ P|LEM:min★xayorN⚓(is) better⚓ N|LEM:qabol|ROOT:qbl|GEN★l~akumo⚓for you,⚓ ACC|LEM:laEal~|SP:<in~★<in⚓if⚓ V|IMPF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★kuntumo⚓you⚓ T|LEM:yawom|ROOT:ywm|MP|INDEF|ACC★taEolamuwna⚓know.⚓ ADJ|PASS|PCPL|LEM:m~aEoduwdap|ROOT:Edd|FP|INDEF|ACC★",
"$ahoru⚓Month⚓COND|LEM:man★ramaDaAna⚓(of) Ramadhaan⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★{l~a*iY^⚓(is) that⚓ P|LEM:min★>unzila⚓was revealed⚓ N|LEM:m~ariyD|ROOT:mrD|MS|INDEF|ACC★fiyhi⚓therein⚓ CONJ|LEM:>aw★{loquro'aAnu⚓the Quran,⚓ P|LEM:EalaY`★hudFY⚓a Guidance⚓ N|LEM:safar|ROOT:sfr|M|INDEF|GEN★l~iln~aAsi⚓for mankind⚓ N|LEM:Eid~ap|ROOT:Edd|F|INDEF|NOM★wabay~ina`tK⚓and clear proofs⚓ P|LEM:min★m~ina⚓of⚓ N|LEM:yawom|ROOT:ywm|MP|INDEF|GEN★{lohudaY`⚓[the] Guidance⚓ ADJ|LEM:A^xar|ROOT:Axr|FP|GEN★wa{lofuroqaAni⚓and the Criterion.⚓ P|LEM:EalaY`★faman⚓So whoever⚓ REL|LEM:{l~a*iY|MP★$ahida⚓witnesses⚓ V|IMPF|(IV)|LEM:yuTiyqu|ROOT:Twq|3MP★minkumu⚓among you⚓ N|LEM:fidoyap|ROOT:fdy|F|INDEF|NOM★{l$~ahora⚓the month,⚓ N|LEM:TaEaAm|ROOT:TEm|M|NOM★faloyaSumohu⚓then he should fast in it,⚓ N|LEM:misokiyn|ROOT:skn|MS|INDEF|GEN★waman⚓and whoever⚓ COND|LEM:man★kaAna⚓is⚓ V|PERF|(V)|LEM:taTaw~aEa|ROOT:TwE|3MS★mariyDFA⚓sick⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|ACC★>awo⚓or⚓ PRON|3MS★EalaY`⚓on⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★safarK⚓a journey⚓ PRON|3MS★faEid~apN⚓then prescribed number (should be made up)⚓ SUB|LEM:>an★m~ino⚓from⚓ V|IMPF|LEM:yaSumo|ROOT:Swm|2MP|MOOD:SUBJ★>ay~aAmK⚓days⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★>uxara⚓other.⚓ PRON|2MP★yuriydu⚓**Allah intends⚓ COND|LEM:<in★{ll~ahu⚓**Allah intends⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★bikumu⚓for you⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★{loyusora⚓[the] ease⚓ N|LEM:$ahor|ROOT:$hr|M|NOM★walaA⚓and not⚓ PN|LEM:ramaDaAn|GEN★yuriydu⚓intends⚓ REL|LEM:{l~a*iY|MS★bikumu⚓for you⚓ V|PERF|PASS|(IV)|LEM:>anzala|ROOT:nzl|3MS★{loEusora⚓[the] hardship,⚓ P|LEM:fiY★walitukomiluwA@⚓so that you complete⚓ PN|LEM:quro'aAn|ROOT:qrA|M|NOM★{loEid~apa⚓the prescribed period⚓ N|LEM:hudFY|ROOT:hdy|M|INDEF|ACC★walitukab~iruwA@⚓and that you magnify⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★{ll~aha⚓Allah⚓ N|LEM:bay~inap|ROOT:byn|FP|INDEF|ACC★EalaY`⚓for⚓ P|LEM:min★maA⚓[what]⚓ N|LEM:hudFY|ROOT:hdy|M|GEN★hadaY`kumo⚓He guided you⚓ N|LEM:furoqaAn|ROOT:frq|M|GEN★walaEal~akumo⚓so that you may⚓ COND|LEM:man★ta$okuruwna⚓(be) grateful.⚓ V|PERF|LEM:$ahida|ROOT:$hd|3MS★",
"wa<i*aA⚓And when⚓P|LEM:min★sa>alaka⚓ask you⚓ N|LEM:$ahor|ROOT:$hr|M|ACC★EibaAdiY⚓My servants⚓ V|IMPF|LEM:yaSumo|ROOT:Swm|3MS|MOOD:JUS★Ean~iY⚓about Me,⚓ COND|LEM:man★fa<in~iY⚓then indeed I am⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★qariybN⚓near.⚓ N|LEM:m~ariyD|ROOT:mrD|MS|INDEF|ACC★>ujiybu⚓I respond⚓ CONJ|LEM:>aw★daEowapa⚓(to the) invocation⚓ P|LEM:EalaY`★{ld~aAEi⚓(of) the supplicant⚓ N|LEM:safar|ROOT:sfr|M|INDEF|GEN★<i*aA⚓when⚓ N|LEM:Eid~ap|ROOT:Edd|F|INDEF|NOM★daEaAni⚓he calls Me.⚓ P|LEM:min★faloyasotajiybuwA@⚓**So let them respond to Me⚓ N|LEM:yawom|ROOT:ywm|MP|INDEF|GEN★liY⚓**So let them respond to Me⚓ ADJ|LEM:A^xar|ROOT:Axr|FP|GEN★waloyu&ominuwA@⚓**and let them believe in Me,⚓ V|IMPF|(IV)|LEM:>araAda|ROOT:rwd|3MS★biY⚓**and let them believe in Me,⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★laEal~ahumo⚓so that they may⚓ PRON|2MP★yaro$uduwna⚓(be) led aright.⚓ N|LEM:yusor|ROOT:ysr|M|ACC★",
">uHil~a⚓Permitted⚓NEG|LEM:laA★lakumo⚓for you⚓ V|IMPF|(IV)|LEM:>araAda|ROOT:rwd|3MS★layolapa⚓(in the) nights⚓ PRON|2MP★{lS~iyaAmi⚓(of) fasting⚓ N|LEM:Eusor|ROOT:Esr|M|ACC★{lr~afavu⚓(is) the approach⚓ V|IMPF|(IV)|LEM:>akomalo|ROOT:kml|2MP|MOOD:SUBJ★<ilaY`⚓to⚓ N|LEM:Eid~ap|ROOT:Edd|F|ACC★nisaA^}ikumo⚓your wives.⚓ V|IMPF|(II)|LEM:kab~iro|ROOT:kbr|2MP|MOOD:SUBJ★hun~a⚓They⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★libaAsN⚓(are) garments⚓ P|LEM:EalaY`★l~akumo⚓for you⚓ REL|LEM:maA★wa>antumo⚓and you⚓ V|PERF|LEM:hadaY|ROOT:hdy|3MS★libaAsN⚓(are) garments⚓ ACC|LEM:laEal~|SP:<in~★l~ahun~a⚓for them.⚓ V|IMPF|LEM:$akara|ROOT:$kr|2MP★Ealima⚓**Allah knows⚓ T|LEM:<i*aA★{ll~ahu⚓**Allah knows⚓ V|PERF|LEM:sa>ala|ROOT:sAl|3MS★>an~akumo⚓that you⚓ N|LEM:Eabod|ROOT:Ebd|MP|NOM★kuntumo⚓used to⚓ P|LEM:Ean★taxotaAnuwna⚓deceive⚓ ACC|LEM:<in~|SP:<in~★>anfusakumo⚓yourselves,⚓ N|LEM:qariyb|ROOT:qrb|MS|INDEF|NOM★fataAba⚓so He turned⚓ V|IMPF|(IV)|LEM:>ujiybat|ROOT:jwb|1S★Ealayokumo⚓towards you⚓ N|LEM:daEowap|ROOT:dEw|F|ACC★waEafaA⚓and He forgave⚓ N|ACT|PCPL|LEM:d~aAE|ROOT:dEw|M|GEN★Eankumo⚓[on] you.⚓ T|LEM:<i*aA★fa{lo_#a`na⚓So now⚓ V|IMPV|LEM:daEaA|ROOT:dEw|2MD★ba`$iruwhun~a⚓have relations with them⚓ V|IMPF|(X)|LEM:{sotajaAba|ROOT:jwb|3MP|MOOD:JUS★wa{botaguwA@⚓and seek⚓ PRON|1S★maA⚓what⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MP|MOOD:JUS★kataba⚓**Allah has ordained⚓ PRON|1S★{ll~ahu⚓**Allah has ordained⚓ ACC|LEM:laEal~|SP:<in~★lakumo⚓for you.⚓ V|IMPF|LEM:yaro$udu|ROOT:r$d|3MP★wakuluwA@⚓And eat⚓ V|PERF|PASS|(IV)|LEM:>aHal~a|ROOT:Hll|3MS★wa{$orabuwA@⚓and drink⚓ PRON|2MP★Hat~aY`⚓until⚓ T|LEM:layolap|ROOT:lyl|F|ACC★yatabay~ana⚓becomes distinct⚓ N|LEM:SiyaAm|ROOT:Swm|M|GEN★lakumu⚓to you⚓ N|LEM:rafav|ROOT:rfv|M|NOM★{loxayoTu⚓the thread⚓ P|LEM:<ilaY`★{lo>aboyaDu⚓[the] white⚓ N|LEM:nisaA^'|ROOT:nsw|FP|GEN★mina⚓from⚓ PRON|3FP★{loxayoTi⚓the thread⚓ N|LEM:libaAs|ROOT:lbs|M|INDEF|NOM★{lo>asowadi⚓[the] black⚓ PRON|2MP★mina⚓of⚓ PRON|2MP★{lofajori⚓[the] dawn.⚓ N|LEM:libaAs|ROOT:lbs|M|INDEF|NOM★vum~a⚓Then⚓ PRON|3FP★>atim~uwA@⚓complete⚓ V|PERF|LEM:Ealima|ROOT:Elm|3MS★{lS~iyaAma⚓the fast⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★<ilaY⚓till⚓ ACC|LEM:>an~|SP:<in~★{l~ayoli⚓the night.⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★walaA⚓**And (do) not have relations with them⚓ V|IMPF|(VIII)|LEM:yaxotaAnu|ROOT:xwn|2MP★tuba`$iruwhun~a⚓**And (do) not have relations with them⚓ N|LEM:nafos|ROOT:nfs|FP|ACC★wa>antumo⚓while you⚓ V|PERF|LEM:taAba|ROOT:twb|3MS★Ea`kifuwna⚓(are) secluded⚓ P|LEM:EalaY`★fiY⚓in⚓ V|PERF|LEM:EafaA|ROOT:Efw|3MS★{lomasa`jidi⚓the masajid.⚓ P|LEM:Ean★tiloka⚓These⚓ T|LEM:_#a`n|ACC★Huduwdu⚓**(are the) limits (set by) Allah,⚓ V|IMPV|(III)|LEM:ba`$iru|ROOT:b$r|2MP★{ll~ahi⚓**(are the) limits (set by) Allah,⚓ V|IMPV|(VIII)|LEM:{botagaY`|ROOT:bgy|2MP★falaA⚓so (do) not⚓ REL|LEM:maA★taqorabuwhaA⚓approach them.⚓ V|PERF|LEM:kataba|ROOT:ktb|3MS★ka*a`lika⚓Thus⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★yubay~inu⚓**Allah makes clear⚓ PRON|2MP★{ll~ahu⚓**Allah makes clear⚓ V|IMPV|LEM:>akala|ROOT:Akl|2MP★'aAya`tihi.⚓His verses⚓ V|IMPV|LEM:$ariba|ROOT:$rb|2MP★liln~aAsi⚓for [the] people⚓ P|LEM:Hat~aY`★laEal~ahumo⚓so that they may⚓ V|IMPF|(V)|LEM:tabay~ana|ROOT:byn|3MS|MOOD:SUBJ★yat~aquwna⚓(become) righteous.⚓ PRON|2MP★",
"walaA⚓**And (do) not eat⚓N|LEM:xayoT|ROOT:xyT|M|NOM★ta>okuluw^A@⚓**And (do) not eat⚓ ADJ|LEM:>aboyaD|ROOT:byD|MS|NOM★>amowa`lakum⚓your properties⚓ P|LEM:min★bayonakum⚓among yourselves⚓ N|LEM:xayoT|ROOT:xyT|M|GEN★bi{loba`Tili⚓wrongfully⚓ ADJ|LEM:>asowad|ROOT:swd|MS|GEN★watudoluwA@⚓and present⚓ P|LEM:min★bihaA^⚓[with] it⚓ N|LEM:fajor|ROOT:fjr|M|GEN★<ilaY⚓to⚓ CONJ|LEM:vum~★{loHuk~aAmi⚓the authorities⚓ V|IMPV|(IV)|LEM:>atam~a|ROOT:tmm|2MP★lita>okuluwA@⚓so that you may eat⚓ N|LEM:SiyaAm|ROOT:Swm|M|ACC★fariyqFA⚓a portion⚓ P|LEM:<ilaY`★m~ino⚓from⚓ N|LEM:layol|ROOT:lyl|M|GEN★>amowa`li⚓(the) wealth⚓ PRO|LEM:laA★{ln~aAsi⚓(of) the people⚓ V|IMPF|(III)|LEM:ba`$iru|ROOT:b$r|2MP|MOOD:JUS★bi{lo<ivomi⚓sinfully⚓ PRON|2MP★wa>antumo⚓while you⚓ N|ACT|PCPL|LEM:EaAkif|ROOT:Ekf|MP|NOM★taEolamuwna⚓know.⚓ P|LEM:fiY★",
"yaso_#aluwnaka⚓They ask you⚓N|LEM:masojid|ROOT:sjd|MP|GEN★Eani⚓about⚓ DEM|LEM:*a`lik|FS★{lo>ahil~api⚓the new moons.⚓ N|LEM:Huduwd|ROOT:Hdd|MP|NOM★qulo⚓Say,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★hiYa⚓`They⚓ PRO|LEM:laA★mawa`qiytu⚓(are) indicators of periods⚓ V|IMPF|LEM:yaqorabu|ROOT:qrb|2MP|MOOD:JUS★liln~aAsi⚓for the people,⚓ DEM|LEM:*a`lik|MS★wa{loHaj~i⚓and (for) the Hajj.`⚓ V|IMPF|(II)|LEM:bay~anu|ROOT:byn|3MS★walayosa⚓And it is not⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{lobir~u⚓[the] righteousness⚓ N|LEM:'aAyap|ROOT:Ayy|FP|ACC★bi>an⚓that⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★ta>otuwA@⚓you come⚓ ACC|LEM:laEal~|SP:<in~★{lobuyuwta⚓(to) the houses⚓ V|IMPF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|3MP★min⚓from⚓ PRO|LEM:laA★ZuhuwrihaA⚓their backs,⚓ V|IMPF|LEM:>akala|ROOT:Akl|2MP|MOOD:JUS★wala`kin~a⚓[and] but⚓ N|LEM:maAl|ROOT:mwl|MP|ACC★{lobir~a⚓[the] righteous⚓ LOC|LEM:bayon|ROOT:byn|ACC★mani⚓(is one) who⚓ N|ACT|PCPL|LEM:ba`Til|ROOT:bTl|M|GEN★{t~aqaY`⚓fears (Allah).⚓ V|IMPF|(IV)|LEM:>adolaY`|ROOT:dlw|2MP|MOOD:JUS★wa>otuwA@⚓And come⚓ PRON|3FS★{lobuyuwta⚓(to) the houses⚓ P|LEM:<ilaY`★mino⚓from⚓ N|ACT|PCPL|LEM:Huk~aAm|ROOT:Hkm|MP|GEN★>abowa`bihaA⚓their doors.⚓ V|IMPF|LEM:>akala|ROOT:Akl|2MP|MOOD:SUBJ★wa{t~aquwA@⚓And fear⚓ N|LEM:fariyq|ROOT:frq|M|INDEF|ACC★{ll~aha⚓Allah⚓ P|LEM:min★laEal~akumo⚓so that you may⚓ N|LEM:maAl|ROOT:mwl|MP|GEN★tufoliHuwna⚓(be) successful.⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★",
"waqa`tiluwA@⚓And fight⚓N|LEM:<ivom|ROOT:Avm|M|GEN★fiY⚓in⚓ PRON|2MP★sabiyli⚓(the) way⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★{ll~ahi⚓(of) Allah⚓ V|IMPF|LEM:sa>ala|ROOT:sAl|3MP★{l~a*iyna⚓those who⚓ P|LEM:Ean★yuqa`tiluwnakumo⚓fight you⚓ N|LEM:>ahil~ap|ROOT:hll|MP|GEN★walaA⚓**and (do) not transgress.⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★taEotaduw^A@⚓**and (do) not transgress.⚓ PRON|3FS★<in~a⚓Indeed,⚓ N|LEM:miyqa`t|ROOT:wqt|MP|NOM★{ll~aha⚓Allah⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★laA⚓**(does) not like⚓ N|LEM:Haj~|ROOT:Hjj|M|GEN★yuHib~u⚓**(does) not like⚓ V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|3MS★{lomuEotadiyna⚓the transgressors.⚓ N|LEM:bir~|ROOT:brr|M|NOM★",
"wa{qotuluwhumo⚓And kill them⚓SUB|LEM:>an★Hayovu⚓wherever⚓ V|IMPF|LEM:>ataY|ROOT:Aty|2MP|MOOD:SUBJ★vaqifotumuwhumo⚓you find them,⚓ N|LEM:bayot|ROOT:byt|MP|ACC★wa>axorijuwhum⚓and drive them out⚓ P|LEM:min★m~ino⚓from⚓ N|LEM:Zahor|ROOT:Zhr|MP|GEN★Hayovu⚓wherever⚓ ACC|LEM:la`kin~|SP:<in~★>axorajuwkumo⚓they drove you out,⚓ N|LEM:bir~|ROOT:brr|M|ACC★wa{lofitonapu⚓and [the] oppression⚓ REL|LEM:man★>a$ad~u⚓(is) worse⚓ V|PERF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|3MS★mina⚓than⚓ V|IMPV|LEM:>ataY|ROOT:Aty|2MP★{loqatoli⚓[the] killing.⚓ N|LEM:bayot|ROOT:byt|MP|ACC★walaA⚓And (do) not⚓ P|LEM:min★tuqa`tiluwhumo⚓fight them⚓ N|LEM:baAb|ROOT:bwb|MP|GEN★Einda⚓near⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★{lomasojidi⚓**Al-Masjid Al-Haraam⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★{loHaraAmi⚓**Al-Masjid Al-Haraam⚓ ACC|LEM:laEal~|SP:<in~★Hat~aY`⚓until⚓ V|IMPF|(IV)|LEM:>afolaHa|ROOT:flH|2MP★yuqa`tiluwkumo⚓they fight you⚓ V|IMPV|(III)|LEM:qa`tala|ROOT:qtl|2MP★fiyhi⚓in it.⚓ P|LEM:fiY★fa<in⚓Then if⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★qa`taluwkumo⚓they fight you,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★fa{qotuluwhumo⚓then kill them.⚓ REL|LEM:{l~a*iY|MP★ka*a`lika⚓Such⚓ V|IMPF|(III)|LEM:qa`tala|ROOT:qtl|3MP★jazaA^'u⚓(is the) reward⚓ PRO|LEM:laA★{loka`firiyna⚓(of) the disbelievers.⚓ V|IMPF|(VIII)|LEM:{EotadaY`|ROOT:Edw|2MP|MOOD:JUS★",
"fa<ini⚓Then if⚓ACC|LEM:<in~|SP:<in~★{ntahawoA@⚓they cease,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★fa<in~a⚓then indeed,⚓ NEG|LEM:laA★{ll~aha⚓Allah⚓ V|IMPF|(IV)|LEM:>aHobabo|ROOT:Hbb|3MS★gafuwrN⚓(is) Oft-Forgiving,⚓ N|LEM:muEotadiyn|ROOT:Edw|MP|ACC★r~aHiymN⚓Most Merciful.⚓ V|IMPV|LEM:qatala|ROOT:qtl|2MP★",
"waqa`tiluwhumo⚓And fight (against) them⚓LOC|LEM:Hayov|ROOT:Hyv★Hat~aY`⚓until⚓ V|PERF|LEM:vuqifu|ROOT:vqf|2MP★laA⚓**(there) is no⚓ V|IMPV|(IV)|LEM:>axoraja|ROOT:xrj|2MP★takuwna⚓**(there) is no⚓ P|LEM:min★fitonapN⚓oppression,⚓ N|LEM:Hayov|ROOT:Hyv|GEN★wayakuwna⚓and becomes⚓ V|PERF|(IV)|LEM:>axoraja|ROOT:xrj|3MP★{ld~iynu⚓the religion⚓ N|LEM:fitonap|ROOT:ftn|F|NOM★lil~ahi⚓for Allah⚓ N|LEM:>a$ad~|ROOT:$dd|MS|NOM★fa<ini⚓Then if⚓ P|LEM:min★{ntahawoA@⚓they cease⚓ N|VN|LEM:qatol|ROOT:qtl|M|GEN★falaA⚓then (let there be) no⚓ PRO|LEM:laA★Eudowa`na⚓hostility⚓ V|IMPF|(III)|LEM:qa`tala|ROOT:qtl|2MP|MOOD:JUS★<il~aA⚓except⚓ LOC|LEM:Eind|ROOT:End|ACC★EalaY⚓against⚓ N|LEM:masojid|ROOT:sjd|M|GEN★{lZ~a`limiyna⚓the oppressors.⚓ ADJ|LEM:HaraAm|ROOT:Hrm|M|GEN★",
"{l$~ahoru⚓The month⚓P|LEM:Hat~aY`★{loHaraAmu⚓[the] sacred⚓ V|IMPF|(III)|LEM:qa`tala|ROOT:qtl|3MP|MOOD:SUBJ★bi{l$~ahori⚓(is) for the month⚓ P|LEM:fiY★{loHaraAmi⚓[the] sacred,⚓ COND|LEM:<in★wa{loHuruma`tu⚓and for all the violations⚓ V|PERF|(III)|LEM:qa`tala|ROOT:qtl|3MP★qiSaASN⚓(is) legal retribution.⚓ V|IMPV|LEM:qatala|ROOT:qtl|2MP★famani⚓Then whoever⚓ DEM|LEM:*a`lik|MS★{EotadaY`⚓transgressed⚓ N|LEM:jazaA^'|ROOT:jzy|M|NOM★Ealayokumo⚓upon you⚓ N|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|GEN★fa{EotaduwA@⚓then you transgress⚓ COND|LEM:<in★Ealayohi⚓on him⚓ V|PERF|(VIII)|LEM:{ntahaY`|ROOT:nhy|3MP★bimivoli⚓in (the) same manner⚓ ACC|LEM:<in~|SP:<in~★maA⚓(as)⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★{EotadaY`⚓he transgressed⚓ N|LEM:gafuwr|ROOT:gfr|MS|INDEF|NOM★Ealayokumo⚓upon you.⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|INDEF|NOM★wa{t~aquwA@⚓And fear⚓ V|IMPV|(III)|LEM:qa`tala|ROOT:qtl|2MP★{ll~aha⚓Allah⚓ P|LEM:Hat~aY`★wa{Eolamuw^A@⚓and know⚓ NEG|LEM:laA★>an~a⚓that⚓ V|IMPF|LEM:kaAna|ROOT:kwn|3FS|MOOD:SUBJ★{ll~aha⚓Allah⚓ N|LEM:fitonap|ROOT:ftn|F|INDEF|NOM★maEa⚓(is) with⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS|MOOD:SUBJ★{lomut~aqiyna⚓those who fear (Him).⚓ N|LEM:diyn|ROOT:dyn|M|NOM★",
"wa>anfiquwA@⚓And spend⚓PN|LEM:{ll~ah|ROOT:Alh|GEN★fiY⚓in⚓ COND|LEM:<in★sabiyli⚓(the) way⚓ V|PERF|(VIII)|LEM:{ntahaY`|ROOT:nhy|3MP★{ll~ahi⚓(of) Allah⚓ NEG|LEM:laA|SP:<in~★walaA⚓and (do) not⚓ N|LEM:Eudowa`n|ROOT:Edw|M|ACC★tuloquwA@⚓throw (yourselves)⚓ RES|LEM:<il~aA★bi>ayodiykumo⚓[with your hands]⚓ P|LEM:EalaY`★<ilaY⚓into⚓ N|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|GEN★{lt~aholukapi⚓[the] destruction.⚓ N|LEM:$ahor|ROOT:$hr|M|NOM★wa>aHosinuw^A@⚓And do good;⚓ ADJ|LEM:HaraAm|ROOT:Hrm|M|NOM★<in~a⚓indeed,⚓ N|LEM:$ahor|ROOT:$hr|M|GEN★{ll~aha⚓Allah⚓ ADJ|LEM:HaraAm|ROOT:Hrm|M|GEN★yuHib~u⚓loves⚓ N|LEM:Huruma`t|ROOT:Hrm|FP|NOM★{lomuHosiniyna⚓the good-doers.⚓ N|LEM:qiSaAS|ROOT:qSS|M|INDEF|NOM★",
"wa>atim~uwA@⚓And complete⚓COND|LEM:man★{loHaj~a⚓the Hajj⚓ V|PERF|(VIII)|LEM:{EotadaY`|ROOT:Edw|3MS★wa{loEumorapa⚓and the Umrah⚓ P|LEM:EalaY`★lil~ahi⚓for Allah.⚓ V|IMPV|(VIII)|LEM:{EotadaY`|ROOT:Edw|2MP★fa<ino⚓And if⚓ P|LEM:EalaY`★>uHoSirotumo⚓you are held back⚓ N|LEM:mivol|ROOT:mvl|M|GEN★famaA⚓then (offer) whatever⚓ REL|LEM:maA★{sotayosara⚓(can be) obtained with ease⚓ V|PERF|(VIII)|LEM:{EotadaY`|ROOT:Edw|3MS★mina⚓of⚓ P|LEM:EalaY`★{lohadoYi⚓the sacrificial animal.⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★walaA⚓And (do) not⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★taHoliquwA@⚓shave⚓ V|IMPV|LEM:Ealima|ROOT:Elm|2MP★ru'uwsakumo⚓your heads⚓ ACC|LEM:>an~|SP:<in~★Hat~aY`⚓until⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★yaboluga⚓reaches⚓ LOC|LEM:maE|ACC★{lohadoYu⚓the sacrificial animal⚓ N|ACT|PCPL|(VIII)|LEM:mut~aqiyn|ROOT:wqy|MP|GEN★maHil~ahu,⚓(to) its destination.⚓ V|IMPV|(IV)|LEM:>anfaqa|ROOT:nfq|2MP★faman⚓Then whoever⚓ P|LEM:fiY★kaAna⚓is⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★minkum⚓among you⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★m~ariyDFA⚓ill⚓ PRO|LEM:laA★>awo⚓or⚓ V|IMPF|(IV)|LEM:>aloqaY`^|ROOT:lqy|2MP|MOOD:JUS★bihi.^⚓he (has)⚓ N|LEM:yad|ROOT:ydy|FP|GEN★>a*FY⚓an ailment⚓ P|LEM:<ilaY`★m~in⚓of⚓ N|LEM:t~aholukap|ROOT:hlk|F|GEN★r~a>osihi.⚓his head⚓ V|IMPV|(IV)|LEM:>aHosana|ROOT:Hsn|2MP★fafidoyapN⚓then a ransom⚓ ACC|LEM:<in~|SP:<in~★m~in⚓of⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★SiyaAmK⚓fasting⚓ V|IMPF|(IV)|LEM:>aHobabo|ROOT:Hbb|3MS★>awo⚓or⚓ N|ACT|PCPL|(IV)|LEM:muHosin|ROOT:Hsn|MP|ACC★SadaqapK⚓charity⚓ V|IMPV|(IV)|LEM:>atam~a|ROOT:tmm|2MP★>awo⚓or⚓ N|LEM:Haj~|ROOT:Hjj|M|ACC★nusukK⚓sacrifice.⚓ N|LEM:Eumorap|ROOT:Emr|F|ACC★fa<i*aA^⚓Then when⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★>amintumo⚓you are secure⚓ COND|LEM:<in★faman⚓then whoever⚓ V|PERF|PASS|(IV)|LEM:>uHoSiru|ROOT:HSr|2MP★tamat~aEa⚓took advantage⚓ REL|LEM:maA★bi{loEumorapi⚓of the Umrah⚓ V|PERF|(X)|LEM:{sotayosara|ROOT:ysr|3MS★<ilaY⚓followed⚓ P|LEM:min★{loHaj~i⚓(by) the Hajj,⚓ N|LEM:hadoy|ROOT:hdy|M|GEN★famaA⚓then (offer) whatever⚓ PRO|LEM:laA★{sotayosara⚓(can be) obtained with ease⚓ V|IMPF|LEM:taHoliqu|ROOT:Hlq|2MP|MOOD:JUS★mina⚓of⚓ N|LEM:ra>os|ROOT:rAs|MP|ACC★{lohadoYi⚓the sacrificial animal.⚓ P|LEM:Hat~aY`★faman⚓But whoever⚓ V|IMPF|LEM:balaga|ROOT:blg|3MS|MOOD:SUBJ★l~amo⚓(can)not⚓ N|LEM:hadoy|ROOT:hdy|M|NOM★yajido⚓find -⚓ N|LEM:maHil~|ROOT:Hll|M|ACC★faSiyaAmu⚓then a fast⚓ COND|LEM:man★vala`vapi⚓(of) three⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★>ay~aAmK⚓days⚓ P|LEM:min★fiY⚓during⚓ N|LEM:m~ariyD|ROOT:mrD|MS|INDEF|ACC★{loHaj~i⚓the Hajj⚓ CONJ|LEM:>aw★wasaboEapK⚓and seven (days)⚓ PRON|3MS★<i*aA⚓when⚓ N|LEM:>a*FY|ROOT:A*y|M|INDEF|NOM★rajaEotumo⚓you return.⚓ P|LEM:min★tiloka⚓This⚓ N|LEM:ra>os|ROOT:rAs|M|GEN★Ea$arapN⚓(is) ten (days)⚓ N|LEM:fidoyap|ROOT:fdy|F|INDEF|NOM★kaAmilapN⚓in all.⚓ P|LEM:min★*a`lika⚓That⚓ N|LEM:SiyaAm|ROOT:Swm|M|INDEF|GEN★liman⚓(is) for (the one) whose,⚓ CONJ|LEM:>aw★l~amo⚓not⚓ N|LEM:Sadaqap|ROOT:Sdq|F|INDEF|GEN★yakuno⚓is⚓ CONJ|LEM:>aw★>aholuhu,⚓his family⚓ N|LEM:nusuk|ROOT:nsk|M|INDEF|GEN★HaADiriY⚓present⚓ T|LEM:<i*aA★{lomasojidi⚓**(near) Al-Masjid Al-Haraam.⚓ V|PERF|LEM:>amina|ROOT:Amn|2MP★{loHaraAmi⚓**(near) Al-Masjid Al-Haraam.⚓ COND|LEM:man★wa{t~aquwA@⚓**And fear Allah⚓ V|PERF|(V)|LEM:tamat~aEa|ROOT:mtE|3MS★{ll~aha⚓**And fear Allah⚓ N|LEM:Eumorap|ROOT:Emr|F|GEN★wa{Eolamuw^A@⚓and know⚓ P|LEM:<ilaY`★>an~a⚓that⚓ N|LEM:Haj~|ROOT:Hjj|M|GEN★{ll~aha⚓Allah⚓ REL|LEM:maA★$adiydu⚓(is) severe⚓ V|PERF|(X)|LEM:{sotayosara|ROOT:ysr|3MS★{loEiqaAbi⚓(in) retribution.⚓ P|LEM:min★",
"{loHaj~u⚓(For) the Hajj⚓N|LEM:hadoy|ROOT:hdy|M|GEN★>a$ohurN⚓(are) months⚓ COND|LEM:man★m~aEoluwma`tN⚓well known,⚓ NEG|LEM:lam★faman⚓then whoever⚓ V|IMPF|LEM:wajada|ROOT:wjd|3MS|MOOD:JUS★faraDa⚓undertakes⚓ N|LEM:SiyaAm|ROOT:Swm|M|NOM★fiyhin~a⚓therein⚓ N|LEM:vala`vap|ROOT:vlv|F|GEN★{loHaj~a⚓the Hajj⚓ N|LEM:yawom|ROOT:ywm|MP|INDEF|GEN★falaA⚓then no⚓ P|LEM:fiY★rafava⚓sexual relations⚓ N|LEM:Haj~|ROOT:Hjj|M|GEN★walaA⚓and no⚓ N|LEM:saboEap|ROOT:sbE|F|INDEF|GEN★fusuwqa⚓wickedness⚓ T|LEM:<i*aA★walaA⚓and no⚓ V|PERF|LEM:rajaEa|ROOT:rjE|2MP★jidaAla⚓quarrelling⚓ DEM|LEM:*a`lik|FS★fiY⚓during⚓ N|LEM:Ea$arap|ROOT:E$r|F|INDEF|NOM★{loHaj~i⚓the Hajj.⚓ ADJ|ACT|PCPL|LEM:kaAmilap|ROOT:kml|F|INDEF|NOM★wamaA⚓And whatever⚓ DEM|LEM:*a`lik|MS★tafoEaluwA@⚓you do⚓ REL|LEM:man★mino⚓of⚓ NEG|LEM:lam★xayorK⚓good⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS|MOOD:JUS★yaEolamohu⚓**Allah knows it.⚓ N|LEM:>ahol|ROOT:Ahl|M|NOM★{ll~ahu⚓**Allah knows it.⚓ N|LEM:HaADiriY|ROOT:HDr|MP|ACC★watazaw~aduwA@⚓And take provision,⚓ N|LEM:masojid|ROOT:sjd|M|GEN★fa<in~a⚓(but) indeed,⚓ ADJ|LEM:HaraAm|ROOT:Hrm|M|GEN★xayora⚓(the) best⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★{lz~aAdi⚓provision⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★{lt~aqowaY`⚓(is) righteousness.⚓ V|IMPV|LEM:Ealima|ROOT:Elm|2MP★wa{t~aquwni⚓And fear Me,⚓ ACC|LEM:>an~|SP:<in~★ya`^>uw@liY⚓O men⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★{lo>aloba`bi⚓(of) understanding!⚓ N|LEM:$adiyd|ROOT:$dd|MS|NOM★",
"layosa⚓Not is⚓N|LEM:EiqaAb|ROOT:Eqb|M|GEN★Ealayokumo⚓on you⚓ N|LEM:Haj~|ROOT:Hjj|M|NOM★junaAHN⚓any sin⚓ N|LEM:$ahor|ROOT:$hr|MP|INDEF|NOM★>an⚓that⚓ ADJ|LEM:m~aEoluwma`t|ROOT:Elm|MP|INDEF|NOM★tabotaguwA@⚓you seek⚓ COND|LEM:man★faDolFA⚓bounty⚓ V|PERF|LEM:faraDa|ROOT:frD|3MS★m~in⚓from⚓ P|LEM:fiY★r~ab~ikumo⚓your Lord.⚓ N|LEM:Haj~|ROOT:Hjj|M|ACC★fa<i*aA^⚓And when⚓ NEG|LEM:laA|SP:<in~★>afaDotum⚓you depart⚓ N|LEM:rafav|ROOT:rfv|M|ACC★m~ino⚓from⚓ NEG|LEM:laA|SP:<in~★Earafa`tK⚓(Mount) Arafat⚓ N|LEM:fusuwq|ROOT:fsq|M|ACC★fa{*okuruwA@⚓then remember⚓ NEG|LEM:laA|SP:<in~★{ll~aha⚓Allah⚓ N|LEM:jidaAl|ROOT:jdl|M|ACC★Einda⚓near⚓ P|LEM:fiY★{loma$oEari⚓the Monument⚓ N|LEM:Haj~|ROOT:Hjj|M|GEN★{loHaraAmi⚓[the] Sacred.⚓ COND|LEM:maA★wa{*okuruwhu⚓And remember Him⚓ V|IMPF|LEM:faEala|ROOT:fEl|2MP|MOOD:JUS★kamaA⚓as⚓ P|LEM:min★hadaY`kumo⚓He (has) guided you,⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|GEN★wa<in⚓[and] though⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MS|MOOD:JUS★kuntum⚓you were⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★m~in⚓[from]⚓ V|IMPV|(V)|LEM:tazaw~adu|ROOT:zwd|2MP★qabolihi.⚓before [it],⚓ ACC|LEM:<in~|SP:<in~★lamina⚓surely among⚓ N|LEM:xayor|ROOT:xyr|MS|ACC★{lD~aA^l~iyna⚓those who went astray.⚓ N|LEM:z~aAd|ROOT:zwd|M|GEN★",
"vum~a⚓Then⚓N|LEM:taqowaY|ROOT:wqy|M|NOM★>afiyDuwA@⚓depart⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★mino⚓from⚓ N|LEM:>uwliY|ROOT:Awl|MP|ACC★Hayovu⚓wherever⚓ N|LEM:>aloba`b|ROOT:lbb|MP|GEN★>afaADa⚓depart⚓ V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|3MS★{ln~aAsu⚓the people⚓ P|LEM:EalaY`★wa{sotagofiruwA@⚓and ask forgiveness⚓ N|LEM:junaAH|ROOT:jnH|M|INDEF|NOM★{ll~aha⚓(of) Allah.⚓ SUB|LEM:>an★<in~a⚓Indeed,⚓ V|IMPF|(VIII)|LEM:{botagaY`|ROOT:bgy|2MP|MOOD:SUBJ★{ll~aha⚓Allah⚓ N|LEM:faDol|ROOT:fDl|M|INDEF|ACC★gafuwrN⚓(is) Oft-Forgiving,⚓ P|LEM:min★r~aHiymN⚓All-Merciful.⚓ N|LEM:rab~|ROOT:rbb|M|GEN★",
"fa<i*aA⚓Then when⚓T|LEM:<i*aA★qaDayotum⚓you complete[d]⚓ V|PERF|(IV)|LEM:>afaADa|ROOT:fyD|2MP★m~ana`sikakumo⚓your acts of worship⚓ P|LEM:min★fa{*okuruwA@⚓then remember⚓ PN|LEM:Earafa`t|GEN★{ll~aha⚓Allah⚓ V|IMPV|LEM:*akara|ROOT:*kr|2MP★ka*ikorikumo⚓as you remember⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★'aAbaA^'akumo⚓your forefathers⚓ LOC|LEM:Eind|ROOT:End|ACC★>awo⚓or⚓ N|LEM:ma$oEar|ROOT:$Er|M|GEN★>a$ad~a⚓(with) greater⚓ ADJ|LEM:HaraAm|ROOT:Hrm|M|GEN★*ikorFA⚓remembrance.⚓ V|IMPV|LEM:*akara|ROOT:*kr|2MP★famina⚓And from⚓ SUB|LEM:maA★{ln~aAsi⚓the people⚓ V|PERF|LEM:hadaY|ROOT:hdy|3MS★man⚓who⚓ COND|LEM:<in★yaquwlu⚓say,⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★rab~anaA^⚓`Our Lord!⚓ P|LEM:min★'aAtinaA⚓Grant us⚓ N|LEM:qabol|ROOT:qbl|GEN★fiY⚓in⚓ P|LEM:min★{ld~unoyaA⚓the world.`⚓ N|ACT|PCPL|LEM:DaA^l~|ROOT:Dll|MP|GEN★wamaA⚓And not⚓ CONJ|LEM:vum~★lahu,⚓for him⚓ V|IMPV|(IV)|LEM:>afaADa|ROOT:fyD|2MP★fiY⚓in⚓ P|LEM:min★{lo'aAxirapi⚓the Hereafter⚓ N|LEM:Hayov|ROOT:Hyv|GEN★mino⚓[of]⚓ V|PERF|(IV)|LEM:>afaADa|ROOT:fyD|3MS★xala`qK⚓any share.⚓ N|LEM:n~aAs|ROOT:nws|MP|NOM★",
"waminohum⚓And from those⚓V|IMPV|(X)|LEM:{sotagofara|ROOT:gfr|2MP★m~an⚓who⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★yaquwlu⚓say,⚓ ACC|LEM:<in~|SP:<in~★rab~anaA^⚓`Our Lord!⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★'aAtinaA⚓Grant us⚓ N|LEM:gafuwr|ROOT:gfr|MS|INDEF|NOM★fiY⚓in⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|INDEF|NOM★{ld~unoyaA⚓the world⚓ T|LEM:<i*aA★HasanapF⚓good⚓ V|PERF|LEM:qaDaY`^|ROOT:qDy|2MP★wafiY⚓and in⚓ N|LEM:mansak|ROOT:nsk|MP|ACC★{lo'aAxirapi⚓the Hereafter⚓ V|IMPV|LEM:*akara|ROOT:*kr|2MP★HasanapF⚓good,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★waqinaA⚓and save us⚓ N|VN|LEM:*ikor|ROOT:*kr|M|GEN★Ea*aAba⚓(from the) punishment⚓ N|LEM:A^baA'|ROOT:Abw|MP|ACC★{ln~aAri⚓(of) the Fire.`⚓ CONJ|LEM:>aw★",
">uw@la`^}ika⚓Those -⚓N|LEM:>a$ad~|ROOT:$dd|MS|GEN★lahumo⚓for them⚓ N|VN|LEM:*ikor|ROOT:*kr|M|INDEF|ACC★naSiybN⚓(is) a share⚓ P|LEM:min★m~im~aA⚓of what⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★kasabuwA@⚓they earned,⚓ REL|LEM:man★wa{ll~ahu⚓and Allah⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MS★sariyEu⚓(is) swift⚓ N|LEM:rab~|ROOT:rbb|M|ACC★{loHisaAbi⚓(in taking) account.⚓ V|IMPV|(IV)|LEM:A^taY|ROOT:Aty|2MS★",
"wa{*okuruwA@⚓And remember⚓P|LEM:fiY★{ll~aha⚓Allah⚓ N|LEM:d~unoyaA|ROOT:dnw|FS|GEN★fiY^⚓during⚓ NEG|LEM:maA★>ay~aAmK⚓days⚓ PRON|3MS★m~aEoduwda`tK⚓numbered.⚓ P|LEM:fiY★faman⚓Then (he) who⚓ N|LEM:A^xir|ROOT:Axr|FS|GEN★taEaj~ala⚓hurries⚓ P|LEM:min★fiY⚓in⚓ N|LEM:xala`q|ROOT:xlq|M|INDEF|GEN★yawomayoni⚓two days⚓ P|LEM:min★falaA^⚓then no⚓ REL|LEM:man★<ivoma⚓sin⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MS★Ealayohi⚓upon him,⚓ N|LEM:rab~|ROOT:rbb|M|ACC★waman⚓and whoever⚓ V|IMPV|(IV)|LEM:A^taY|ROOT:Aty|2MS★ta>ax~ara⚓delays⚓ P|LEM:fiY★falaA^⚓then no⚓ N|LEM:d~unoyaA|ROOT:dnw|FS|GEN★<ivoma⚓sin⚓ N|LEM:Hasanap|ROOT:Hsn|F|INDEF|ACC★Ealayohi⚓upon him⚓ P|LEM:fiY★limani⚓for (the one) who⚓ N|LEM:A^xir|ROOT:Axr|FS|GEN★{t~aqaY`⚓fears.⚓ N|LEM:Hasanap|ROOT:Hsn|F|INDEF|ACC★wa{t~aquwA@⚓And fear⚓ V|IMPV|LEM:waqaY`|ROOT:wqy|2MS★{ll~aha⚓Allah⚓ N|LEM:Ea*aAb|ROOT:E*b|M|ACC★wa{Eolamuw^A@⚓and know⚓ N|LEM:naAr|ROOT:nwr|F|GEN★>an~akumo⚓that you⚓ DEM|LEM:>uwla`^}ik|P★<ilayohi⚓unto Him⚓ PRON|3MP★tuHo$aruwna⚓will be gathered.⚓ N|LEM:naSiyb|ROOT:nSb|M|INDEF|NOM★",
"wamina⚓And of⚓P|LEM:min★{ln~aAsi⚓the people⚓ REL|LEM:maA★man⚓(is the one) who⚓ V|PERF|LEM:kasaba|ROOT:ksb|3MP★yuEojibuka⚓pleases you⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★qawoluhu,⚓(with) his speech⚓ N|LEM:sariyE|ROOT:srE|MS|NOM★fiY⚓in⚓ N|VN|(III)|LEM:HisaAb|ROOT:Hsb|M|GEN★{loHayaw`pi⚓the life⚓ V|IMPV|LEM:*akara|ROOT:*kr|2MP★{ld~unoyaA⚓(of) the world,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★wayu$ohidu⚓and he calls to witness⚓ P|LEM:fiY★{ll~aha⚓Allah⚓ N|LEM:yawom|ROOT:ywm|MP|INDEF|GEN★EalaY`⚓on⚓ ADJ|PASS|PCPL|LEM:m~aEoduwdap|ROOT:Edd|FP|INDEF|GEN★maA⚓what⚓ COND|LEM:man★fiY⚓(is) in⚓ V|PERF|(V)|LEM:taEaj~ala|ROOT:Ejl|3MS★qalobihi.⚓his heart,⚓ P|LEM:fiY★wahuwa⚓and he⚓ N|LEM:yawom|ROOT:ywm|MD|GEN★>alad~u⚓**(is) the most quarrelsome of opponents.⚓ NEG|LEM:laA|SP:<in~★{loxiSaAmi⚓**(is) the most quarrelsome of opponents.⚓ N|LEM:<ivom|ROOT:Avm|M|ACC★",
"wa<i*aA⚓And when⚓P|LEM:EalaY`★tawal~aY`⚓he turns away⚓ COND|LEM:man★saEaY`⚓he strives⚓ V|PERF|(V)|LEM:ta>ax~ara|ROOT:Axr|3MS★fiY⚓in⚓ NEG|LEM:laA|SP:<in~★{lo>aroDi⚓the earth⚓ N|LEM:<ivom|ROOT:Avm|M|ACC★liyufosida⚓to spread corruption⚓ P|LEM:EalaY`★fiyhaA⚓[in it],⚓ REL|LEM:man★wayuholika⚓and destroys⚓ V|PERF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|3MS★{loHarova⚓the crops⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★wa{ln~asola⚓and progeny.⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★wa{ll~ahu⚓And Allah⚓ V|IMPV|LEM:Ealima|ROOT:Elm|2MP★laA⚓(does) not⚓ ACC|LEM:>an~|SP:<in~★yuHib~u⚓love⚓ P|LEM:<ilaY`★{lofasaAda⚓[the] corruption.⚓ V|IMPF|PASS|LEM:Ha$ara|ROOT:H$r|2MP★",
"wa<i*aA⚓And when⚓P|LEM:min★qiyla⚓it is said⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★lahu⚓to him⚓ REL|LEM:man★{t~aqi⚓`Fear⚓ V|IMPF|(IV)|LEM:>aEojaba|ROOT:Ejb|3MS★{ll~aha⚓Allah,`⚓ N|VN|LEM:qawol|ROOT:qwl|M|NOM★>axa*atohu⚓takes him⚓ P|LEM:fiY★{loEiz~apu⚓(his) pride⚓ N|LEM:Hayaw`p|ROOT:Hyy|F|GEN★bi{lo<ivomi⚓to [the] sins.⚓ ADJ|LEM:d~unoyaA|ROOT:dnw|FS|GEN★faHasobuhu,⚓Then enough for him⚓ V|IMPF|(IV)|LEM:>a$ohada|ROOT:$hd|3MS★jahan~amu⚓(is) Hell -⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★walabi}osa⚓[and] surely an evil⚓ P|LEM:EalaY`★{lomihaAdu⚓[the] resting-place.⚓ REL|LEM:maA★",
"wamina⚓And of⚓P|LEM:fiY★{ln~aAsi⚓the people⚓ N|LEM:qalob|ROOT:qlb|FS|GEN★man⚓(is the one) who⚓ PRON|3MS★ya$oriY⚓sells⚓ N|LEM:>alad~|ROOT:ldd|MS|NOM★nafosahu⚓his own self⚓ N|LEM:xaSiym|ROOT:xSm|MP|GEN★{botigaA^'a⚓seeking⚓ T|LEM:<i*aA★maroDaAti⚓pleasure⚓ V|PERF|(V)|LEM:tawal~aY`|ROOT:wly|3MS★{ll~ahi⚓(of) Allah.⚓ V|PERF|LEM:saEaY`|ROOT:sEy|3MS★wa{ll~ahu⚓And Allah⚓ P|LEM:fiY★ra'uwfN[⚓(is) full of Kindness⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★bi{loEibaAdi⚓to His servants.⚓ V|IMPF|(IV)|LEM:>afosadu|ROOT:fsd|3MS|MOOD:SUBJ★",
"ya`^>ay~uhaA⚓O you⚓P|LEM:fiY★{l~a*iyna⚓who⚓ V|IMPF|(IV)|LEM:>aholaka|ROOT:hlk|3MS|MOOD:SUBJ★'aAmanuwA@⚓believe[d]!⚓ N|LEM:Harov|ROOT:Hrv|M|ACC★{doxuluwA@⚓Enter⚓ N|LEM:nasol|ROOT:nsl|M|ACC★fiY⚓in⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{ls~ilomi⚓Islam⚓ NEG|LEM:laA★kaA^f~apF⚓completely,⚓ V|IMPF|(IV)|LEM:>aHobabo|ROOT:Hbb|3MS★walaA⚓and (do) not⚓ N|LEM:fasaAd|ROOT:fsd|M|ACC★tat~abiEuwA@⚓follow⚓ T|LEM:<i*aA★xuTuwa`ti⚓footsteps⚓ V|PERF|PASS|LEM:qaAla|ROOT:qwl|3MS★{l$~ayoTa`ni⚓(of) the Shaitaan.⚓ PRON|3MS★<in~ahu,⚓Indeed, he⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MS★lakumo⚓(is) for you⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★Eaduw~N⚓an enemy⚓ V|PERF|LEM:>axa*a|ROOT:Ax*|3FS★m~ubiynN⚓open.⚓ N|LEM:Eiz~ap|ROOT:Ezz|F|NOM★",
"fa<in⚓Then if⚓N|LEM:<ivom|ROOT:Avm|M|GEN★zalalotum⚓you slip⚓ N|LEM:Hasob|ROOT:Hsb|M|NOM★m~in[⚓**after⚓ PN|LEM:jahan~am|NOM★baEodi⚓**after⚓ V|PERF|LEM:bi}osa|ROOT:bAs|3MS★maA⚓[what]⚓ N|LEM:miha`d|ROOT:mhd|M|NOM★jaA^'atokumu⚓came to you⚓ P|LEM:min★{lobay~ina`tu⚓(from) the clear proofs,⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★fa{Eolamuw^A@⚓then know⚓ REL|LEM:man★>an~a⚓that⚓ V|IMPF|LEM:$ara|ROOT:$ry|3MS★{ll~aha⚓Allah⚓ N|LEM:nafos|ROOT:nfs|FS|ACC★EaziyzN⚓(is) All-Mighty,⚓ N|VN|(VIII)|LEM:{botigaA^'|ROOT:bgy|M|ACC★HakiymN⚓All-Wise.⚓ N|VN|LEM:maroDaAt|ROOT:rDw|FS|GEN★",
"halo⚓Are⚓PN|LEM:{ll~ah|ROOT:Alh|GEN★yanZuruwna⚓they waiting⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★<il~aA^⚓[except]⚓ N|LEM:ra'uwf|ROOT:rAf|MS|INDEF|NOM★>an⚓that⚓ N|LEM:Eabod|ROOT:Ebd|MP|GEN★ya>otiyahumu⚓**Allah comes to them⚓ N|LEM:>ay~uhaA|NOM★{ll~ahu⚓**Allah comes to them⚓ REL|LEM:{l~a*iY|MP★fiY⚓**in (the) shadows⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★ZulalK⚓**in (the) shadows⚓ V|IMPV|LEM:daxala|ROOT:dxl|2MP★m~ina⚓of⚓ P|LEM:fiY★{logamaAmi⚓[the] clouds,⚓ PN|LEM:s~ilom|ROOT:slm|M|GEN★wa{lomala`^}ikapu⚓and the Angels,⚓ N|LEM:kaA^f~ap|ROOT:kff|F|INDEF|ACC★waquDiYa⚓**and the matter is decreed?⚓ PRO|LEM:laA★{lo>amoru⚓**and the matter is decreed?⚓ V|IMPF|(VIII)|LEM:{t~abaEa|ROOT:tbE|2MP|MOOD:JUS★wa<ilaY⚓And to⚓ N|LEM:xuTuwa`t|ROOT:xTw|FP|ACC★{ll~ahi⚓Allah⚓ PN|LEM:$ayoTa`n|ROOT:$Tn|M|GEN★turojaEu⚓return⚓ ACC|LEM:<in~|SP:<in~★{lo>umuwru⚓(all) the matters.⚓ PRON|2MP★",
"salo⚓Ask⚓N|LEM:Eaduw~|ROOT:Edw|M|INDEF|NOM★baniY^⚓(the) Children⚓ ADJ|ACT|PCPL|(IV)|LEM:m~ubiyn|ROOT:byn|M|INDEF|NOM★<isora`^'iyla⚓(of) Israel,⚓ COND|LEM:<in★kamo⚓how many⚓ V|PERF|LEM:zalalo|ROOT:zll|2MP★'aAtayona`hum⚓We gave them⚓ P|LEM:min★m~ino⚓of⚓ N|LEM:baEod|ROOT:bEd|GEN★'aAyapK]⚓**(the) clear Sign(s).⚓ REL|LEM:maA★bay~inapK⚓**(the) clear Sign(s).⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3FS★waman⚓And whoever⚓ N|LEM:bay~inap|ROOT:byn|FP|NOM★yubad~ilo⚓changes⚓ V|IMPV|LEM:Ealima|ROOT:Elm|2MP★niEomapa⚓Favor⚓ ACC|LEM:>an~|SP:<in~★{ll~ahi⚓(of) Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★min[⚓**after⚓ N|LEM:Eaziyz|ROOT:Ezz|MS|INDEF|NOM★baEodi⚓**after⚓ ADJ|LEM:Hakiym|ROOT:Hkm|MS|INDEF|NOM★maA⚓[what]⚓ INTG|LEM:hal★jaA^'atohu⚓it (has) come to him -⚓ V|IMPF|LEM:n~aZara|ROOT:nZr|3MP★fa<in~a⚓then indeed,⚓ RES|LEM:<il~aA★{ll~aha⚓Allah⚓ SUB|LEM:>an★$adiydu⚓(is) severe⚓ V|IMPF|LEM:>ataY|ROOT:Aty|3MS|MOOD:SUBJ★{loEiqaAbi⚓in [the] chastising.⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★",
"zuy~ina⚓Beautified⚓P|LEM:fiY★lil~a*iyna⚓for those who⚓ N|LEM:Zul~ap|ROOT:Zll|MP|INDEF|GEN★kafaruwA@⚓disbelieve[d]⚓ P|LEM:min★{loHayaw`pu⚓(is) the life⚓ N|LEM:gama`m|ROOT:gmm|M|GEN★{ld~unoyaA⚓(of) the world,⚓ N|LEM:malak|ROOT:mlk|MP|NOM★wayasoxaruwna⚓and they ridicule⚓ V|PERF|PASS|LEM:qaDaY`^|ROOT:qDy|3MS★mina⚓[of]⚓ N|LEM:>amor|ROOT:Amr|M|NOM★{l~a*iyna⚓those who⚓ P|LEM:<ilaY`★'aAmanuwA@⚓believe[d].⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wa{l~a*iyna⚓And those who⚓ V|IMPF|PASS|LEM:rajaEa|ROOT:rjE|3FS★{t~aqawoA@⚓fear (Allah),⚓ N|LEM:>amor|ROOT:Amr|MP|NOM★fawoqahumo⚓(they will be) above them⚓ V|IMPV|LEM:sa>ala|ROOT:sAl|2MS★yawoma⚓(on the) Day⚓ N|LEM:bunaY~|ROOT:bny|MP|ACC★{loqiya`mapi⚓(of) Resurrection.⚓ PN|LEM:<isoraA}iyl|GEN★wa{ll~ahu⚓And Allah⚓ INTG|LEM:kam★yarozuqu⚓provides⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|1P★man⚓whom⚓ P|LEM:min★ya$aA^'u⚓He wills⚓ N|LEM:'aAyap|ROOT:Ayy|FS|INDEF|GEN★bigayori⚓without⚓ ADJ|LEM:bay~inap|ROOT:byn|FS|INDEF|GEN★HisaAbK⚓measure.⚓ COND|LEM:man★",
"kaAna⚓Was⚓V|IMPF|(II)|LEM:bad~ala|ROOT:bdl|3MS|MOOD:JUS★{ln~aAsu⚓mankind⚓ N|LEM:niEomap|ROOT:nEm|F|ACC★>um~apF⚓a community⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wa`HidapF⚓single,⚓ P|LEM:min★fabaEava⚓**then Allah raised up⚓ N|LEM:baEod|ROOT:bEd|GEN★{ll~ahu⚓**then Allah raised up⚓ REL|LEM:maA★{ln~abiy~i.na⚓[the] Prophets⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3FS★muba$~iriyna⚓(as) bearers of glad tidings⚓ ACC|LEM:<in~|SP:<in~★wamun*iriyna⚓and (as) warners,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★wa>anzala⚓and sent down⚓ N|LEM:$adiyd|ROOT:$dd|MS|NOM★maEahumu⚓with them⚓ N|LEM:EiqaAb|ROOT:Eqb|M|GEN★{lokita`ba⚓the Book⚓ V|PERF|PASS|(II)|LEM:zay~ana|ROOT:zyn|3MS★bi{loHaq~i⚓in [the] truth⚓ REL|LEM:{l~a*iY|MP★liyaHokuma⚓to judge⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★bayona⚓between⚓ N|LEM:Hayaw`p|ROOT:Hyy|F|NOM★{ln~aAsi⚓[the] people⚓ ADJ|LEM:d~unoyaA|ROOT:dnw|FS|NOM★fiymaA⚓in what⚓ V|IMPF|LEM:saxira|ROOT:sxr|3MP★{xotalafuwA@⚓they differed⚓ P|LEM:min★fiyhi⚓[in it].⚓ REL|LEM:{l~a*iY|MP★wamaA⚓And (did) not⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★{xotalafa⚓differ[ed]⚓ REL|LEM:{l~a*iY|MP★fiyhi⚓in it⚓ V|PERF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|3MP★<il~aA⚓except⚓ LOC|LEM:fawoq|ROOT:fwq|M|ACC★{l~a*iyna⚓those who⚓ T|LEM:yawom|ROOT:ywm|M|ACC★>uwtuwhu⚓were given it⚓ N|LEM:qiya`map|ROOT:qwm|F|GEN★min[⚓**after⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★baEodi⚓**after⚓ V|IMPF|LEM:razaqa|ROOT:rzq|3MS★maA⚓[what]⚓ REL|LEM:man★jaA^'atohumu⚓came to them⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★{lobay~ina`tu⚓the clear proofs,⚓ N|LEM:gayor|ROOT:gyr|M|GEN★bagoyF[A⚓(out of) jealousy⚓ N|VN|(III)|LEM:HisaAb|ROOT:Hsb|M|INDEF|GEN★bayonahumo⚓among themselves.⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★fahadaY⚓**And Allah guided⚓ N|LEM:n~aAs|ROOT:nws|MP|NOM★{ll~ahu⚓**And Allah guided⚓ N|LEM:>um~ap|ROOT:Amm|FS|INDEF|ACC★{l~a*iyna⚓those who⚓ ADJ|LEM:wa`Hidap|ROOT:wHd|F|INDEF|ACC★'aAmanuwA@⚓believe[d]⚓ V|PERF|LEM:baEava|ROOT:bEv|3MS★limaA⚓regarding what⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{xotalafuwA@⚓they differed⚓ N|LEM:n~abiY~|ROOT:nbA|MP|ACC★fiyhi⚓[in it]⚓ N|ACT|PCPL|(II)|LEM:muba$~ir|ROOT:b$r|MP|ACC★mina⚓of⚓ N|ACT|PCPL|(IV)|LEM:mun*ir|ROOT:n*r|MP|ACC★{loHaq~i⚓the Truth⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|3MS★bi<i*onihi.⚓with His permission.⚓ LOC|LEM:maE|ACC★wa{ll~ahu⚓And Allah⚓ N|LEM:kita`b|ROOT:ktb|M|ACC★yahodiY⚓guides⚓ N|LEM:Haq~|ROOT:Hqq|M|GEN★man⚓whom⚓ V|IMPF|LEM:Hakama|ROOT:Hkm|3MS|MOOD:SUBJ★ya$aA^'u⚓He wills⚓ LOC|LEM:bayon|ROOT:byn|ACC★<ilaY`⚓to⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★Sira`TK⚓**a straight path.⚓ P|LEM:fiY★m~usotaqiymK⚓**a straight path.⚓ REL|LEM:maA★",
">amo⚓Or⚓V|PERF|(VIII)|LEM:{xotalafa|ROOT:xlf|3MP★Hasibotumo⚓(do) you think⚓ P|LEM:fiY★>an⚓that⚓ NEG|LEM:maA★tadoxuluwA@⚓you will enter⚓ V|PERF|(VIII)|LEM:{xotalafa|ROOT:xlf|3MS★{lojan~apa⚓Paradise⚓ P|LEM:fiY★walam~aA⚓while not⚓ RES|LEM:<il~aA★ya>otikum⚓(has) come to you⚓ REL|LEM:{l~a*iY|MP★m~avalu⚓like (came to)⚓ V|PERF|PASS|(IV)|LEM:A^taY|ROOT:Aty|3MP★{l~a*iyna⚓those who⚓ P|LEM:min★xalawoA@⚓passed away⚓ N|LEM:baEod|ROOT:bEd|GEN★min⚓**before you?⚓ REL|LEM:maA★qabolikum⚓**before you?⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3FS★m~as~atohumu⚓Touched them⚓ N|LEM:bay~inap|ROOT:byn|FP|NOM★{loba>osaA^'u⚓[the] adversity⚓ N|LEM:bagoy|ROOT:bgy|M|INDEF|ACC★wa{lD~ar~aA^'u⚓and [the] hardship,⚓ LOC|LEM:bayon|ROOT:byn|ACC★wazuloziluwA@⚓and they were shaken⚓ V|PERF|LEM:hadaY|ROOT:hdy|3MS★Hat~aY`⚓until⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★yaquwla⚓said⚓ REL|LEM:{l~a*iY|MP★{lr~asuwlu⚓the Messenger⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★wa{l~a*iyna⚓and those who⚓ REL|LEM:maA★'aAmanuwA@⚓believed⚓ V|PERF|(VIII)|LEM:{xotalafa|ROOT:xlf|3MP★maEahu,⚓with him,⚓ P|LEM:fiY★mataY`⚓`When⚓ P|LEM:min★naSoru⚓**(will) Allah`s help (come)?`⚓ N|LEM:Haq~|ROOT:Hqq|M|GEN★{ll~ahi⚓**(will) Allah`s help (come)?`⚓ N|LEM:<i*on|ROOT:A*n|M|GEN★>alaA^⚓Unquestionably,⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★<in~a⚓[Indeed]⚓ V|IMPF|LEM:hadaY|ROOT:hdy|3MS★naSora⚓help⚓ REL|LEM:man★{ll~ahi⚓(of) Allah⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★qariybN⚓(is) near.⚓ P|LEM:<ilaY`★",
"yaso_#aluwnaka⚓They ask you⚓N|LEM:Sira`T|ROOT:SrT|M|INDEF|GEN★maA*aA⚓what⚓ ADJ|ACT|PCPL|(X)|LEM:m~usotaqiym|ROOT:qwm|M|INDEF|GEN★yunfiquwna⚓they (should) spend.⚓ CONJ|LEM:>am★qulo⚓Say,⚓ V|PERF|LEM:Hasiba|ROOT:Hsb|2MP★maA^⚓`Whatever⚓ SUB|LEM:>an★>anfaqotum⚓you spend⚓ V|IMPF|LEM:daxala|ROOT:dxl|2MP|MOOD:SUBJ★m~ino⚓of⚓ PN|LEM:jan~ap|ROOT:jnn|F|ACC★xayorK⚓good,⚓ NEG|LEM:l~am~aA★falilowa`lidayoni⚓(is) for parents,⚓ V|IMPF|LEM:>ataY|ROOT:Aty|3MS|MOOD:JUS★wa{lo>aqorabiyna⚓and the relatives,⚓ N|LEM:maval|ROOT:mvl|M|NOM★wa{loyata`maY`⚓and the orphans,⚓ REL|LEM:{l~a*iY|MP★wa{lomasa`kiyni⚓and the needy,⚓ V|PERF|LEM:xalaA|ROOT:xlw|3MP★wa{boni⚓**and the wayfarer.⚓ P|LEM:min★{ls~abiyli⚓**and the wayfarer.⚓ N|LEM:qabol|ROOT:qbl|GEN★wamaA⚓And whatever⚓ V|PERF|LEM:mas~a|ROOT:mss|3FS★tafoEaluwA@⚓you do⚓ N|LEM:ba>osaA^'|ROOT:bAs|F|NOM★mino⚓of⚓ N|LEM:Dar~aA^'|ROOT:Drr|F|NOM★xayorK⚓good.⚓ V|PERF|PASS|LEM:zulozilu|ROOT:zlzl|3MP★fa<in~a⚓So indeed,⚓ P|LEM:Hat~aY`★{ll~aha⚓Allah⚓ V|IMPF|LEM:qaAla|ROOT:qwl|3MS|MOOD:SUBJ★bihi.⚓of it⚓ N|LEM:rasuwl|ROOT:rsl|M|NOM★EaliymN⚓(is) All-Aware.⚓ REL|LEM:{l~a*iY|MP★",
"kutiba⚓Is prescribed⚓V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★Ealayokumu⚓upon you⚓ LOC|LEM:maE|ACC★{loqitaAlu⚓[the] fighting⚓ INTG|LEM:mataY`★wahuwa⚓while it⚓ N|LEM:naSor|ROOT:nSr|M|NOM★kurohN⚓(is) hateful⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★l~akumo⚓to you.⚓ INC|LEM:>alaA^★waEasaY`^⚓But perhaps⚓ ACC|LEM:<in~|SP:<in~★>an⚓[that]⚓ N|LEM:naSor|ROOT:nSr|M|ACC★takorahuwA@⚓you dislike⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★$ayo_#FA⚓a thing⚓ N|LEM:qariyb|ROOT:qrb|MS|INDEF|NOM★wahuwa⚓and it⚓ V|IMPF|LEM:sa>ala|ROOT:sAl|3MP★xayorN⚓(is) good⚓ INTG|LEM:maA*aA★l~akumo⚓for you;⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|3MP★waEasaY`^⚓and perhaps⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★>an⚓[that]⚓ COND|LEM:maA★tuHib~uwA@⚓you love⚓ V|PERF|(IV)|LEM:>anfaqa|ROOT:nfq|2MP★$ayo_#FA⚓a thing⚓ P|LEM:min★wahuwa⚓and it⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|GEN★$ar~N⚓(is) bad⚓ N|LEM:waAlid|ROOT:wld|MD|GEN★l~akumo⚓for you.⚓ N|LEM:>aqorab|ROOT:qrb|MP|GEN★wa{ll~ahu⚓And Allah⚓ N|LEM:yatiym|ROOT:ytm|P|GEN★yaEolamu⚓knows⚓ N|LEM:misokiyn|ROOT:skn|MP|GEN★wa>antumo⚓while you⚓ N|LEM:{bon|ROOT:bny|M|GEN★laA⚓**(do) not know.⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★taEolamuwna⚓**(do) not know.⚓ COND|LEM:maA★",
"yaso_#aluwnaka⚓They ask you⚓V|IMPF|LEM:faEala|ROOT:fEl|2MP|MOOD:JUS★Eani⚓about⚓ P|LEM:min★{l$~ahori⚓the month⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|GEN★{loHaraAmi⚓[the] sacred -⚓ ACC|LEM:<in~|SP:<in~★qitaAlK⚓(concerning) fighting⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★fiyhi⚓in it.⚓ PRON|3MS★qulo⚓Say,⚓ N|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★qitaAlN⚓`Fighting⚓ V|PERF|PASS|LEM:kataba|ROOT:ktb|3MS★fiyhi⚓therein⚓ P|LEM:EalaY`★kabiyrN⚓(is) a great (sin);⚓ N|LEM:qitaAl|ROOT:qtl|M|NOM★waSad~N⚓but hindering (people)⚓ PRON|3MS★Ean⚓from⚓ N|LEM:kuroh|ROOT:krh|M|INDEF|NOM★sabiyli⚓(the) way⚓ PRON|2MP★{ll~ahi⚓(of) Allah,⚓ V|PERF|LEM:EasaY|ROOT:Esy|3MS★wakuforN[⚓and disbelief⚓ SUB|LEM:>an★bihi.⚓in Him⚓ V|IMPF|LEM:kariha|ROOT:krh|2MP|MOOD:SUBJ★wa{lomasojidi⚓**and (preventing access to) Al-Masjid Al-Haraam,⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|ACC★{loHaraAmi⚓**and (preventing access to) Al-Masjid Al-Haraam,⚓ PRON|3MS★wa<ixoraAju⚓and driving out⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★>aholihi.⚓its people⚓ PRON|2MP★minohu⚓from it,⚓ V|PERF|LEM:EasaY|ROOT:Esy|3MS★>akobaru⚓(is) greater (sin)⚓ SUB|LEM:>an★Einda⚓near⚓ V|IMPF|(IV)|LEM:>aHobabo|ROOT:Hbb|2MP|MOOD:SUBJ★{ll~ahi⚓Allah.⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|ACC★wa{lofitonapu⚓And [the] oppression⚓ PRON|3MS★>akobaru⚓(is) greater⚓ N|LEM:$ar~|ROOT:$rr|MS|INDEF|NOM★mina⚓than⚓ PRON|2MP★{loqatoli⚓[the] killing.`⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★walaA⚓And not⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MS★yazaAluwna⚓they will cease⚓ PRON|2MP★yuqa`tiluwnakumo⚓(to) fight with you⚓ NEG|LEM:laA★Hat~aY`⚓until⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★yarud~uwkumo⚓they turn you away⚓ V|IMPF|LEM:sa>ala|ROOT:sAl|3MP★Ean⚓from⚓ P|LEM:Ean★diynikumo⚓your religion,⚓ N|LEM:$ahor|ROOT:$hr|M|GEN★<ini⚓if⚓ ADJ|LEM:HaraAm|ROOT:Hrm|M|GEN★{sotaTa`EuwA@⚓they are able.⚓ N|LEM:qitaAl|ROOT:qtl|M|INDEF|GEN★waman⚓And whoever⚓ P|LEM:fiY★yarotadido⚓turns away⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★minkumo⚓among you⚓ N|LEM:qitaAl|ROOT:qtl|M|INDEF|NOM★Ean⚓from⚓ P|LEM:fiY★diynihi.⚓his religion,⚓ ADJ|LEM:kabiyr|ROOT:kbr|MS|INDEF|NOM★fayamuto⚓then dies⚓ N|VN|LEM:Sad~|ROOT:Sdd|M|INDEF|NOM★wahuwa⚓while he⚓ P|LEM:Ean★kaAfirN⚓(is) a disbeliever⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★fa>uw@la`^}ika⚓for those⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★HabiTato⚓became worthless⚓ N|LEM:kufor|ROOT:kfr|M|INDEF|NOM★>aEoma`luhumo⚓their deeds⚓ PRON|3MS★fiY⚓in⚓ N|LEM:masojid|ROOT:sjd|M|GEN★{ld~unoyaA⚓the world⚓ ADJ|LEM:HaraAm|ROOT:Hrm|M|GEN★wa{lo'aAxirapi⚓and the Hereafter.⚓ N|VN|(IV)|LEM:<ixoraAj|ROOT:xrj|M|NOM★wa>uw@la`^}ika⚓And those⚓ N|LEM:>ahol|ROOT:Ahl|M|GEN★>aSoHa`bu⚓(are) companions⚓ P|LEM:min★{ln~aAri⚓(of) the Fire,⚓ N|LEM:>akobar|ROOT:kbr|MS|NOM★humo⚓they⚓ LOC|LEM:Eind|ROOT:End|ACC★fiyhaA⚓in it⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★xa`liduwna⚓(will) abide forever.⚓ N|LEM:fitonap|ROOT:ftn|F|NOM★",
"<in~a⚓Indeed,⚓N|LEM:>akobar|ROOT:kbr|MS|NOM★{l~a*iyna⚓those who⚓ P|LEM:min★'aAmanuwA@⚓believed⚓ N|VN|LEM:qatol|ROOT:qtl|M|GEN★wa{l~a*iyna⚓and those who⚓ NEG|LEM:laA★haAjaruwA@⚓emigrated⚓ V|IMPF|LEM:zaAlat|ROOT:zyl|3MP★waja`haduwA@⚓and strove⚓ V|IMPF|(III)|LEM:qa`tala|ROOT:qtl|3MP★fiY⚓in⚓ P|LEM:Hat~aY`★sabiyli⚓(the) way⚓ V|IMPF|LEM:rad~a|ROOT:rdd|3MP|MOOD:SUBJ★{ll~ahi⚓(of) Allah -⚓ P|LEM:Ean★>uw@la`^}ika⚓those,⚓ N|LEM:diyn|ROOT:dyn|M|GEN★yarojuwna⚓they hope⚓ COND|LEM:<in★raHomata⚓(for) Mercy⚓ V|PERF|(X)|LEM:{sotaTaAEa|ROOT:TwE|3MP★{ll~ahi⚓(of) Allah.⚓ COND|LEM:man★wa{ll~ahu⚓And Allah⚓ V|IMPF|(VIII)|LEM:{rotad~a|ROOT:rdd|3MS|MOOD:JUS★gafuwrN⚓(is) Oft-Forgiving,⚓ P|LEM:min★r~aHiymN⚓All-Merciful.⚓ P|LEM:Ean★",
"yaso_#aluwnaka⚓**They ask you⚓N|LEM:diyn|ROOT:dyn|M|GEN★Eani⚓about⚓ V|IMPF|LEM:m~aAta|ROOT:mwt|3MS|MOOD:JUS★{loxamori⚓[the] intoxicants⚓ PRON|3MS★wa{lomayosiri⚓and [the] games of chance⚓ N|LEM:kaAfir|ROOT:kfr|M|INDEF|NOM★qulo⚓Say,⚓ DEM|LEM:>uwla`^}ik|P★fiyhimaA^⚓`In both of them⚓ V|PERF|LEM:HabiTa|ROOT:HbT|3FS★<ivomN⚓(is) a sin⚓ N|LEM:Eamal|ROOT:Eml|MP|NOM★kabiyrN⚓great,⚓ P|LEM:fiY★wamana`fiEu⚓and (some) benefits⚓ N|LEM:d~unoyaA|ROOT:dnw|FS|GEN★liln~aAsi⚓for [the] people.⚓ N|LEM:A^xir|ROOT:Axr|FS|GEN★wa<ivomuhumaA^⚓But sin of both of them⚓ DEM|LEM:>uwla`^}ik|P★>akobaru⚓(is) greater⚓ N|LEM:>aSoHa`b|ROOT:SHb|MP|NOM★min⚓than⚓ N|LEM:naAr|ROOT:nwr|F|GEN★n~afoEihimaA⚓(the) benefit of (the) two.`⚓ PRON|3MP★wayaso_#aluwnaka⚓And they ask you⚓ P|LEM:fiY★maA*aA⚓what⚓ N|ACT|PCPL|LEM:xa`lid|ROOT:xld|MP|NOM★yunfiquwna⚓they (should) spend.⚓ ACC|LEM:<in~|SP:<in~★quli⚓Say,⚓ REL|LEM:{l~a*iY|MP★{loEafowa⚓`The surplus.`⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★ka*a`lika⚓Thus⚓ REL|LEM:{l~a*iY|MP★yubay~inu⚓**Allah makes clear⚓ V|PERF|(III)|LEM:haAjara|ROOT:hjr|3MP★{ll~ahu⚓**Allah makes clear⚓ V|PERF|(III)|LEM:ja`hada|ROOT:jhd|3MP★lakumu⚓to you⚓ P|LEM:fiY★{lo'aAya`ti⚓[the] Verses⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★laEal~akumo⚓so that you may⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★tatafak~aruwna⚓ponder,⚓ DEM|LEM:>uwla`^}ik|P★",
"fiY⚓Concerning⚓V|IMPF|LEM:yarojuwA@|ROOT:rjw|3MP★{ld~unoyaA⚓the world⚓ N|LEM:raHomap|ROOT:rHm|F|ACC★wa{lo'aAxirapi⚓and the Hereafter.⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wayaso_#aluwnaka⚓They ask you⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★Eani⚓about⚓ N|LEM:gafuwr|ROOT:gfr|MS|INDEF|NOM★{loyata`maY`⚓the orphans.⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|INDEF|NOM★qulo⚓Say,⚓ V|IMPF|LEM:sa>ala|ROOT:sAl|3MP★<iSolaAHN⚓`Setting right (their affairs)⚓ P|LEM:Ean★l~ahumo⚓for them⚓ N|LEM:xamor|ROOT:xmr|M|GEN★xayorN⚓(is) best.⚓ N|LEM:mayosir|ROOT:ysr|M|GEN★wa<in⚓And if⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★tuxaAliTuwhumo⚓you associate with them⚓ P|LEM:fiY★fa<ixowa`nukumo⚓then they (are) your brothers.⚓ N|LEM:<ivom|ROOT:Avm|M|INDEF|NOM★wa{ll~ahu⚓And Allah⚓ ADJ|LEM:kabiyr|ROOT:kbr|MS|INDEF|NOM★yaEolamu⚓knows⚓ N|LEM:mana`fiE|ROOT:nfE|FP|NOM★{lomufosida⚓the corrupter⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★mina⚓from⚓ N|LEM:<ivom|ROOT:Avm|M|NOM★{lomuSoliHi⚓the amender.⚓ N|LEM:>akobar|ROOT:kbr|MS|NOM★walawo⚓And if⚓ P|LEM:min★$aA^'a⚓**Allah (had) willed⚓ N|LEM:nafoE|ROOT:nfE|M|GEN★{ll~ahu⚓**Allah (had) willed⚓ V|IMPF|LEM:sa>ala|ROOT:sAl|3MP★la>aEonatakumo⚓surely He (could have) put you in difficulties.⚓ INTG|LEM:maA*aA★<in~a⚓Indeed,⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|3MP★{ll~aha⚓Allah⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★EaziyzN⚓(is) All-Mighty,⚓ N|LEM:Eafow|ROOT:Efw|M|ACC★HakiymN⚓All-Wise.`⚓ DEM|LEM:*a`lik|MS★",
"walaA⚓And (do) not⚓V|IMPF|(II)|LEM:bay~anu|ROOT:byn|3MS★tankiHuwA@⚓[you] marry⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{lomu$orika`ti⚓[the] polytheistic women⚓ PRON|2MP★Hat~aY`⚓until⚓ N|LEM:'aAyap|ROOT:Ayy|FP|ACC★yu&omin~a⚓they believe.⚓ ACC|LEM:laEal~|SP:<in~★wala>amapN⚓**And a believing bondwoman⚓ V|IMPF|(V)|LEM:yatafak~aru|ROOT:fkr|2MP★m~u&ominapN⚓**And a believing bondwoman⚓ P|LEM:fiY★xayorN⚓(is) better⚓ N|LEM:d~unoyaA|ROOT:dnw|FS|GEN★m~in⚓than⚓ N|LEM:A^xir|ROOT:Axr|FS|GEN★m~u$orikapK⚓a polytheistic woman⚓ V|IMPF|LEM:sa>ala|ROOT:sAl|3MP★walawo⚓[and] even if⚓ P|LEM:Ean★>aEojabatokumo⚓she pleases you.⚓ N|LEM:yatiym|ROOT:ytm|P|GEN★walaA⚓And (do) not⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★tunkiHuwA@⚓give in marriage (your women)⚓ N|VN|(IV)|LEM:<iSola`H|ROOT:SlH|M|INDEF|NOM★{lomu$orikiyna⚓(to) [the] polytheistic men⚓ PRON|3MP★Hat~aY`⚓until⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★yu&ominuwA@⚓they believe,⚓ COND|LEM:<in★walaEabodN⚓**and a believing bondman⚓ V|IMPF|(III)|LEM:tuxaAliTu|ROOT:xlT|2MP|MOOD:JUS★m~u&ominN⚓**and a believing bondman⚓ N|LEM:>ax|ROOT:Axw|MP|NOM★xayorN⚓(is) better⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★m~in⚓than⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MS★m~u$orikK⚓a polytheistic man⚓ N|ACT|PCPL|(IV)|LEM:mufosid|ROOT:fsd|M|ACC★walawo⚓[and] even if⚓ P|LEM:min★>aEojabakumo⚓he pleases you.⚓ N|ACT|PCPL|(IV)|LEM:muSoliH|ROOT:SlH|M|GEN★>uw@la`^}ika⚓[Those]⚓ COND|LEM:law★yadoEuwna⚓they invite⚓ V|PERF|LEM:$aA^'a|ROOT:$yA|3MS★<ilaY⚓to⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{ln~aAri⚓the Fire,⚓ V|PERF|(IV)|LEM:>aEonata|ROOT:Ent|3MS★wa{ll~ahu⚓and Allah⚓ ACC|LEM:<in~|SP:<in~★yadoEuw^A@⚓invites⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★<ilaY⚓to⚓ N|LEM:Eaziyz|ROOT:Ezz|MS|INDEF|NOM★{lojan~api⚓Paradise⚓ ADJ|LEM:Hakiym|ROOT:Hkm|MS|INDEF|NOM★wa{lomagofirapi⚓and [the] forgiveness⚓ PRO|LEM:laA★bi<i*onihi.⚓by His permission.⚓ V|IMPF|LEM:nakaHa|ROOT:nkH|2MP|MOOD:JUS★wayubay~inu⚓And He makes clear⚓ N|ACT|PCPL|(IV)|LEM:mu$orika`t|ROOT:$rk|FP|ACC★'aAya`tihi.⚓His Verses⚓ P|LEM:Hat~aY`★liln~aAsi⚓for the people⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3FP★laEal~ahumo⚓so that they may⚓ N|LEM:>amap|ROOT:Amw|FS|INDEF|NOM★yata*ak~aruwna⚓take heed.⚓ ADJ|ACT|PCPL|(IV)|LEM:m~u&ominap|ROOT:Amn|F|INDEF|NOM★",
"wayaso_#aluwnaka⚓And they ask you⚓N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★Eani⚓about⚓ P|LEM:min★{lomaHiyDi⚓[the] menstruation.⚓ N|ACT|PCPL|(IV)|LEM:mu$orikap|ROOT:$rk|F|INDEF|GEN★qulo⚓Say,⚓ SUB|LEM:law★huwa⚓`It⚓ V|PERF|(IV)|LEM:>aEojaba|ROOT:Ejb|3FS★>a*FY⚓(is) a hurt,⚓ PRO|LEM:laA★fa{EotaziluwA@⚓so keep away (from)⚓ V|IMPF|(IV)|LEM:tunkiHu|ROOT:nkH|2MP|MOOD:JUS★{ln~isaA^'a⚓[the] women⚓ N|ACT|PCPL|(IV)|LEM:mu$orik|ROOT:$rk|MP|ACC★fiY⚓during⚓ P|LEM:Hat~aY`★{lomaHiyDi⚓(their) [the] menstruation.⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MP|MOOD:SUBJ★walaA⚓And (do) not⚓ N|LEM:Eabod|ROOT:Ebd|M|INDEF|NOM★taqorabuwhun~a⚓approach them⚓ ADJ|ACT|PCPL|(IV)|LEM:mu&omin|ROOT:Amn|M|INDEF|NOM★Hat~aY`⚓until⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★yaTohurona⚓they are cleansed.⚓ P|LEM:min★fa<i*aA⚓Then when⚓ N|ACT|PCPL|(IV)|LEM:mu$orik|ROOT:$rk|M|INDEF|GEN★taTah~arona⚓they are purified,⚓ SUB|LEM:law★fa>otuwhun~a⚓then come to them⚓ V|PERF|(IV)|LEM:>aEojaba|ROOT:Ejb|3MS★mino⚓from⚓ DEM|LEM:>uwla`^}ik|P★Hayovu⚓where⚓ V|IMPF|LEM:daEaA|ROOT:dEw|3MP★>amarakumu⚓**Allah has ordered you.`⚓ P|LEM:<ilaY`★{ll~ahu⚓**Allah has ordered you.`⚓ N|LEM:naAr|ROOT:nwr|F|GEN★<in~a⚓Indeed,⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{ll~aha⚓Allah⚓ V|IMPF|LEM:daEaA|ROOT:dEw|3MS★yuHib~u⚓loves⚓ P|LEM:<ilaY`★{lt~aw~a`biyna⚓those who turn in repentance⚓ PN|LEM:jan~ap|ROOT:jnn|F|GEN★wayuHib~u⚓and loves⚓ N|LEM:m~agofirap|ROOT:gfr|F|GEN★{lomutaTah~iriyna⚓those who purify themselves.⚓ N|LEM:<i*on|ROOT:A*n|M|GEN★",
"nisaA^&ukumo⚓Your wives⚓V|IMPF|(II)|LEM:bay~anu|ROOT:byn|3MS★HarovN⚓(are) a tilth⚓ N|LEM:'aAyap|ROOT:Ayy|FP|ACC★l~akumo⚓for you,⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★fa>otuwA@⚓so come⚓ ACC|LEM:laEal~|SP:<in~★Harovakumo⚓(to) your tilth⚓ V|IMPF|(V)|LEM:ta*ak~ara|ROOT:*kr|3MP★>an~aY`⚓when⚓ V|IMPF|LEM:sa>ala|ROOT:sAl|3MP★$i}otumo⚓you wish,⚓ P|LEM:Ean★waqad~imuwA@⚓and send forth (good deeds)⚓ N|PASS|PCPL|LEM:maHiyD|ROOT:HyD|M|GEN★li>anfusikumo⚓for yourselves.⚓ V|IMPV|LEM:qaAla|ROOT:qwl|2MS★wa{t~aquwA@⚓**And be conscious (of) Allah⚓ PRON|3MS★{ll~aha⚓**And be conscious (of) Allah⚓ N|LEM:>a*FY|ROOT:A*y|M|INDEF|NOM★wa{Eolamuw^A@⚓and know⚓ V|IMPV|(VIII)|LEM:{Eotazala|ROOT:Ezl|2MP★>an~akum⚓that you⚓ N|LEM:nisaA^'|ROOT:nsw|FP|ACC★m~ula`quwhu⚓(will) meet Him.⚓ P|LEM:fiY★waba$~iri⚓And give glad tidings⚓ N|PASS|PCPL|LEM:maHiyD|ROOT:HyD|M|GEN★{lomu&ominiyna⚓(to) the believers.⚓ PRO|LEM:laA★",
"walaA⚓And (do) not⚓V|IMPF|LEM:yaqorabu|ROOT:qrb|2MP|MOOD:JUS★tajoEaluwA@⚓make⚓ P|LEM:Hat~aY`★{ll~aha⚓Allah`s (name)⚓ V|IMPF|LEM:yaTohuro|ROOT:Thr|3FP★EuroDapF⚓an excuse⚓ T|LEM:<i*aA★l~i>ayoma`nikumo⚓in your oaths⚓ V|PERF|(V)|LEM:taTah~aro|ROOT:Thr|3FP★>an⚓that⚓ V|IMPV|LEM:>ataY|ROOT:Aty|2MP★tabar~uwA@⚓you do good,⚓ P|LEM:min★watat~aquwA@⚓and be righteous⚓ N|LEM:Hayov|ROOT:Hyv|GEN★watuSoliHuwA@⚓and make peace⚓ V|PERF|LEM:>amara|ROOT:Amr|3MS★bayona⚓between⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{ln~aAsi⚓[the] people.⚓ ACC|LEM:<in~|SP:<in~★wa{ll~ahu⚓And Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★samiyEN⚓(is) All-Hearing,⚓ V|IMPF|(IV)|LEM:>aHobabo|ROOT:Hbb|3MS★EaliymN⚓All-Knowing.⚓ N|ACT|PCPL|LEM:taw~aAb|ROOT:twb|MP|ACC★",
"l~aA⚓Not⚓V|IMPF|(IV)|LEM:>aHobabo|ROOT:Hbb|3MS★yu&aAxi*ukumu⚓**will Allah take you to task⚓ N|ACT|PCPL|(V)|LEM:mutaTah~iriyn|ROOT:Thr|MP|ACC★{ll~ahu⚓**will Allah take you to task⚓ N|LEM:nisaA^'|ROOT:nsw|FP|NOM★bi{ll~agowi⚓for (what is) unintentional⚓ N|LEM:Harov|ROOT:Hrv|M|INDEF|NOM★fiY^⚓in⚓ PRON|2MP★>ayoma`nikumo⚓your oaths,⚓ V|IMPV|LEM:>ataY|ROOT:Aty|2MP★wala`kin⚓[and] but⚓ N|LEM:Harov|ROOT:Hrv|M|ACC★yu&aAxi*ukum⚓He takes you to task⚓ INTG|LEM:>an~aY`|ROOT:Any★bimaA⚓for what⚓ V|PERF|LEM:$aA^'a|ROOT:$yA|2MP★kasabato⚓(have) earned⚓ V|IMPV|(II)|LEM:qad~ama|ROOT:qdm|2MP★quluwbukumo⚓your hearts.⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★wa{ll~ahu⚓And Allah⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★gafuwrN⚓(is) Oft-Forgiving,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★HaliymN⚓Most Forbearing.⚓ V|IMPV|LEM:Ealima|ROOT:Elm|2MP★",
"l~il~a*iyna⚓For those who⚓ACC|LEM:>an~|SP:<in~★yu&oluwna⚓swear (off)⚓ N|ACT|PCPL|(III)|LEM:m~ula`quwA|ROOT:lqy|MP|NOM★min⚓from⚓ V|IMPV|(II)|LEM:bu$~ira|ROOT:b$r|2MS★n~isaA^}ihimo⚓their wives⚓ N|ACT|PCPL|(IV)|LEM:mu&omin|ROOT:Amn|MP|ACC★tarab~uSu⚓(is a) waiting (of)⚓ PRO|LEM:laA★>arobaEapi⚓four⚓ V|IMPF|LEM:jaEala|ROOT:jEl|2MP|MOOD:JUS★>a$ohurK⚓months,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★fa<in⚓then if⚓ N|LEM:EuroDap|ROOT:ErD|F|INDEF|ACC★faA^'uw⚓they return -⚓ N|LEM:yamiyn|ROOT:ymn|MP|GEN★fa<in~a⚓then indeed,⚓ SUB|LEM:>an★{ll~aha⚓Allah⚓ V|IMPF|LEM:tabar~u|ROOT:brr|2MP|MOOD:SUBJ★gafuwrN⚓(is) Oft- Forgiving,⚓ V|IMPF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP|MOOD:SUBJ★r~aHiymN⚓Most Merciful.⚓ V|IMPF|(IV)|LEM:>aSolaHa|ROOT:SlH|2MP|MOOD:SUBJ★",
"wa<ino⚓And if⚓LOC|LEM:bayon|ROOT:byn|ACC★EazamuwA@⚓they resolve⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★{lT~ala`qa⚓(on) [the] divorce -⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★fa<in~a⚓then indeed,⚓ N|LEM:samiyE|ROOT:smE|MS|INDEF|NOM★{ll~aha⚓Allah⚓ ADJ|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★samiyEN⚓(is) All-Hearing,⚓ NEG|LEM:laA★EaliymN⚓All-Knowing.⚓ V|IMPF|(III)|LEM:yu&aAxi*u|ROOT:Ax*|3MS★",
"wa{lomuTal~aqa`tu⚓And the women who are divorced⚓PN|LEM:{ll~ah|ROOT:Alh|NOM★yatarab~aSona⚓shall wait⚓ N|LEM:lagow|ROOT:lgw|M|GEN★bi>anfusihin~a⚓concerning themselves⚓ P|LEM:fiY★vala`vapa⚓(for) three⚓ N|LEM:yamiyn|ROOT:ymn|MP|GEN★quruw^'K⚓monthly periods.⚓ AMD|LEM:la`kin★walaA⚓And (it is) not⚓ V|IMPF|(III)|LEM:yu&aAxi*u|ROOT:Ax*|3MS★yaHil~u⚓lawful⚓ REL|LEM:maA★lahun~a⚓for them⚓ V|PERF|LEM:kasaba|ROOT:ksb|3FS★>an⚓that⚓ N|LEM:qalob|ROOT:qlb|FP|NOM★yakotumona⚓they conceal⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★maA⚓what⚓ N|LEM:gafuwr|ROOT:gfr|MS|INDEF|NOM★xalaqa⚓**Allah (has) created⚓ ADJ|LEM:Haliym|ROOT:Hlm|MS|INDEF|NOM★{ll~ahu⚓**Allah (has) created⚓ REL|LEM:{l~a*iY|MP★fiY^⚓in⚓ V|IMPF|(IV)|LEM:yu&olu|ROOT:Alw|3MP★>aroHaAmihin~a⚓their wombs,⚓ P|LEM:min★<in⚓if⚓ N|LEM:nisaA^'|ROOT:nsw|FP|GEN★kun~a⚓they⚓ N|VN|(V)|LEM:tarab~uS|ROOT:rbS|M|NOM★yu&omin~a⚓believe⚓ N|LEM:>arobaEap|ROOT:rbE|F|GEN★bi{ll~ahi⚓in Allah⚓ N|LEM:$ahor|ROOT:$hr|MP|INDEF|GEN★wa{loyawomi⚓and the Day⚓ COND|LEM:<in★{lo'aAxiri⚓[the] Last.⚓ V|PERF|LEM:faA^'u|ROOT:fyA|3MP★wabuEuwlatuhun~a⚓And their husbands⚓ ACC|LEM:<in~|SP:<in~★>aHaq~u⚓(have) better right⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★birad~ihin~a⚓to take them back⚓ N|LEM:gafuwr|ROOT:gfr|MS|INDEF|NOM★fiY⚓in⚓ ADJ|LEM:r~aHiym|ROOT:rHm|MS|INDEF|NOM★*a`lika⚓that (period)⚓ COND|LEM:<in★<ino⚓if⚓ V|PERF|LEM:Eazama|ROOT:Ezm|3MP★>araAduw^A@⚓they wish⚓ N|LEM:T~ala`q|ROOT:Tlq|M|ACC★<iSola`HFA⚓(for) reconciliation.⚓ ACC|LEM:<in~|SP:<in~★walahun~a⚓And for them (wives)⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★mivolu⚓(is the) like⚓ N|LEM:samiyE|ROOT:smE|MS|INDEF|NOM★{l~a*iY⚓(of) that which⚓ ADJ|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★Ealayohin~a⚓(is) on them⚓ N|PASS|PCPL|(II)|LEM:muTal~aqa`t|ROOT:Tlq|FP|NOM★bi{lomaEoruwfi⚓in a reasonable manner,⚓ V|IMPF|(V)|LEM:tarab~aSo|ROOT:rbS|3FP★walilr~ijaAli⚓and for the men⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★Ealayohin~a⚓over them (wives)⚓ N|LEM:vala`vap|ROOT:vlv|F|ACC★darajapN⚓(is) a degree.⚓ N|LEM:quruw^'|ROOT:qrA|MP|INDEF|GEN★wa{ll~ahu⚓And Allah⚓ NEG|LEM:laA★EaziyzN⚓(is) All-Mighty,⚓ V|IMPF|LEM:Halalo|ROOT:Hll|3MS★HakiymN⚓All-Wise.⚓ PRON|3FP★",
"{lT~ala`qu⚓The divorce⚓SUB|LEM:>an★mar~ataAni⚓(is) twice.⚓ V|IMPF|LEM:katama|ROOT:ktm|3FP★fa<imosaAkN[⚓Then to retain⚓ REL|LEM:maA★bimaEoruwfK⚓in a reasonable manner⚓ V|PERF|LEM:xalaqa|ROOT:xlq|3MS★>awo⚓or⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★tasoriyHN[⚓to release (her)⚓ P|LEM:fiY★bi<iHosa`nK⚓with kindness.⚓ N|LEM:>aroHaAm|ROOT:rHm|MP|GEN★walaA⚓And (it is) not⚓ COND|LEM:<in★yaHil~u⚓lawful⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3FP★lakumo⚓for you⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3FP★>an⚓that⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★ta>oxu*uwA@⚓you take (back)⚓ N|LEM:yawom|ROOT:ywm|M|GEN★mim~aA^⚓whatever⚓ ADJ|LEM:A^xir|ROOT:Axr|MS|GEN★'aAtayotumuwhun~a⚓you have given them (wives)⚓ N|LEM:baEol|ROOT:bEl|MP|NOM★$ayo_#FA⚓anything,⚓ N|LEM:>aHaq~|ROOT:Hqq|MS|NOM★<il~aA^⚓except⚓ N|LEM:rad~|ROOT:rdd|M|GEN★>an⚓if⚓ P|LEM:fiY★yaxaAfaA^⚓both fear⚓ DEM|LEM:*a`lik|MS★>al~aA⚓that not⚓ COND|LEM:<in★yuqiymaA⚓they both (can) keep⚓ V|PERF|(IV)|LEM:>araAda|ROOT:rwd|3MP★Huduwda⚓**(the) limits of Allah.⚓ N|VN|(IV)|LEM:<iSola`H|ROOT:SlH|M|INDEF|ACC★{ll~ahi⚓**(the) limits of Allah.⚓ PRON|3FP★fa<ino⚓But if⚓ N|LEM:mivol|ROOT:mvl|M|NOM★xifotumo⚓you fear⚓ REL|LEM:{l~a*iY|MS★>al~aA⚓that not⚓ P|LEM:EalaY`★yuqiymaA⚓they both (can) keep⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|GEN★Huduwda⚓**(the) limits of Allah⚓ N|LEM:rijaAl|ROOT:rjl|MP|GEN★{ll~ahi⚓**(the) limits of Allah⚓ P|LEM:EalaY`★falaA⚓then (there is) no⚓ N|LEM:darajap|ROOT:drj|F|INDEF|NOM★junaAHa⚓sin⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★EalayohimaA⚓on both of them⚓ N|LEM:Eaziyz|ROOT:Ezz|MS|INDEF|NOM★fiymaA⚓in what⚓ ADJ|LEM:Hakiym|ROOT:Hkm|MS|INDEF|NOM★{fotadato⚓she ransoms⚓ N|LEM:T~ala`q|ROOT:Tlq|M|NOM★bihi.⚓concerning it.⚓ N|LEM:mar~ap|ROOT:mrr|MD|NOM★tiloka⚓These⚓ N|VN|(IV)|LEM:<imosaAk|ROOT:msk|M|INDEF|NOM★Huduwdu⚓**(are the) limits of Allah,⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|INDEF|GEN★{ll~ahi⚓**(are the) limits of Allah,⚓ CONJ|LEM:>aw★falaA⚓so (do) not⚓ N|VN|(II)|LEM:tasoriyH|ROOT:srH|M|INDEF|NOM★taEotaduwhaA⚓transgress them.⚓ N|VN|(IV)|LEM:<iHosa`n|ROOT:Hsn|M|INDEF|GEN★waman⚓And whoever⚓ NEG|LEM:laA★yataEad~a⚓transgresses⚓ V|IMPF|LEM:Halalo|ROOT:Hll|3MS★Huduwda⚓**(the) limits of Allah⚓ PRON|2MP★{ll~ahi⚓**(the) limits of Allah⚓ SUB|LEM:>an★fa>uw@la`^}ika⚓then those -⚓ V|IMPF|LEM:>axa*a|ROOT:Ax*|2MP|MOOD:SUBJ★humu⚓they⚓ P|LEM:min★{lZ~a`limuwna⚓the wrongdoers.⚓ REL|LEM:maA★",
"fa<in⚓Then if⚓V|PERF|(IV)|LEM:A^taY|ROOT:Aty|2MP★Tal~aqahaA⚓he divorces her (finally),⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|ACC★falaA⚓then (she is) not⚓ EXP|LEM:<il~aA★taHil~u⚓lawful⚓ SUB|LEM:>an★lahu,⚓for him⚓ V|IMPF|LEM:xaAfa|ROOT:xwf|3MD|MOOD:SUBJ★min[⚓**after (that)⚓ SUB|LEM:>an★baEodu⚓**after (that)⚓ NEG|LEM:laA★Hat~aY`⚓until⚓ V|IMPF|(IV)|LEM:>aqaAma|ROOT:qwm|3MD|MOOD:SUBJ★tankiHa⚓she marries⚓ N|LEM:Huduwd|ROOT:Hdd|MP|ACC★zawojFA⚓a spouse⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★gayorahu,⚓other than him.⚓ COND|LEM:<in★fa<in⚓Then if⚓ V|PERF|LEM:xaAfa|ROOT:xwf|2MP★Tal~aqahaA⚓he divorces her⚓ SUB|LEM:>an★falaA⚓then no⚓ NEG|LEM:laA★junaAHa⚓sin⚓ V|IMPF|(IV)|LEM:>aqaAma|ROOT:qwm|3MD|MOOD:SUBJ★EalayohimaA^⚓on them⚓ N|LEM:Huduwd|ROOT:Hdd|MP|ACC★>an⚓if⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★yataraAjaEaA^⚓they return to each other⚓ NEG|LEM:laA|SP:<in~★<in⚓if⚓ N|LEM:junaAH|ROOT:jnH|M|ACC★Zan~aA^⚓they believe⚓ P|LEM:EalaY`★>an⚓that⚓ P|LEM:fiY★yuqiymaA⚓they (will be able to) keep⚓ REL|LEM:maA★Huduwda⚓**(the) limits of Allah.⚓ V|PERF|(VIII)|LEM:{fotadaY`|ROOT:fdy|3FS★{ll~ahi⚓**(the) limits of Allah.⚓ PRON|3MS★watiloka⚓And these⚓ DEM|LEM:*a`lik|FS★Huduwdu⚓**(are the) limits of Allah.⚓ N|LEM:Huduwd|ROOT:Hdd|MP|NOM★{ll~ahi⚓**(are the) limits of Allah.⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★yubay~inuhaA⚓He makes them clear⚓ PRO|LEM:laA★liqawomK⚓to a people⚓ V|IMPF|(VIII)|LEM:{EotadaY`|ROOT:Edw|2MP|MOOD:JUS★yaEolamuwna⚓who know.⚓ COND|LEM:man★",
"wa<i*aA⚓And when⚓V|IMPF|(V)|LEM:yataEad~a|ROOT:Edw|3MS|MOOD:JUS★Tal~aqotumu⚓you divorce⚓ N|LEM:Huduwd|ROOT:Hdd|MP|ACC★{ln~isaA^'a⚓the women⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★fabalagona⚓and they reach⚓ DEM|LEM:>uwla`^}ik|P★>ajalahun~a⚓their (waiting) term,⚓ PRON|3MP★fa>amosikuwhun~a⚓then retain them⚓ N|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|NOM★bimaEoruwfK⚓in a fair manner⚓ COND|LEM:<in★>awo⚓or⚓ V|PERF|(II)|LEM:Tal~aqa|ROOT:Tlq|3MS★sar~iHuwhun~a⚓release them⚓ NEG|LEM:laA★bimaEoruwfK⚓in a fair manner.⚓ V|IMPF|LEM:Halalo|ROOT:Hll|3FS★walaA⚓And (do) not⚓ PRON|3MS★tumosikuwhun~a⚓retain them⚓ P|LEM:min★DiraArFA⚓to hurt⚓ N|LEM:baEod|ROOT:bEd|GEN★l~itaEotaduwA@⚓so that you transgress.⚓ P|LEM:Hat~aY`★waman⚓And whoever⚓ V|IMPF|LEM:nakaHa|ROOT:nkH|3FS|MOOD:SUBJ★yafoEalo⚓does⚓ N|LEM:zawoj|ROOT:zwj|M|INDEF|ACC★*a`lika⚓that,⚓ N|LEM:gayor|ROOT:gyr|M|ACC★faqado⚓then indeed,⚓ COND|LEM:<in★Zalama⚓he wronged⚓ V|PERF|(II)|LEM:Tal~aqa|ROOT:Tlq|3MS★nafosahu,⚓himself.⚓ NEG|LEM:laA|SP:<in~★walaA⚓And (do) not⚓ N|LEM:junaAH|ROOT:jnH|M|ACC★tat~axi*uw^A@⚓take⚓ P|LEM:EalaY`★'aAya`ti⚓(the) Verses⚓ SUB|LEM:>an★{ll~ahi⚓(of) Allah⚓ V|IMPF|(VI)|LEM:yataraAjaEa|ROOT:rjE|3MD|MOOD:SUBJ★huzuwFA⚓(in) jest,⚓ COND|LEM:<in★wa{*okuruwA@⚓and remember⚓ V|PERF|LEM:Zan~a|ROOT:Znn|3MD★niEomata⚓**(the) Favors of Allah⚓ SUB|LEM:>an★{ll~ahi⚓**(the) Favors of Allah⚓ V|IMPF|(IV)|LEM:>aqaAma|ROOT:qwm|3MD|MOOD:SUBJ★Ealayokumo⚓upon you⚓ N|LEM:Huduwd|ROOT:Hdd|MP|ACC★wamaA^⚓and what⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★>anzala⚓(is) revealed⚓ DEM|LEM:*a`lik|FS★Ealayokum⚓to you⚓ N|LEM:Huduwd|ROOT:Hdd|MP|NOM★m~ina⚓of⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★{lokita`bi⚓the Book⚓ V|IMPF|(II)|LEM:bay~anu|ROOT:byn|3MS★wa{loHikomapi⚓and the wisdom;⚓ N|LEM:qawom|ROOT:qwm|M|INDEF|GEN★yaEiZukum⚓He instructs you⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MP★bihi.⚓with it.⚓ T|LEM:<i*aA★wa{t~aquwA@⚓**And fear Allah⚓ V|PERF|(II)|LEM:Tal~aqa|ROOT:Tlq|2MP★{ll~aha⚓**And fear Allah⚓ N|LEM:nisaA^'|ROOT:nsw|FP|ACC★wa{Eolamuw^A@⚓and know⚓ V|PERF|LEM:balaga|ROOT:blg|3FP★>an~a⚓that⚓ N|LEM:>ajal|ROOT:Ajl|M|ACC★{ll~aha⚓Allah (is)⚓ V|IMPV|(IV)|LEM:>amosaka|ROOT:msk|2MP★bikul~i⚓of every⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|INDEF|GEN★$aYo'K⚓thing⚓ CONJ|LEM:>aw★EaliymN⚓All-Knower.⚓ V|IMPV|(II)|LEM:sar~iHu|ROOT:srH|2MP★",
"wa<i*aA⚓And when⚓N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|INDEF|GEN★Tal~aqotumu⚓you divorce⚓ PRO|LEM:laA★{ln~isaA^'a⚓[the] women⚓ V|IMPF|(IV)|LEM:>amosaka|ROOT:msk|2MP|MOOD:JUS★fabalagona⚓and they reached⚓ N|VN|(III)|LEM:DiraAr|ROOT:Drr|M|INDEF|ACC★>ajalahun~a⚓their (waiting) term,⚓ V|IMPF|(VIII)|LEM:{EotadaY`|ROOT:Edw|2MP|MOOD:SUBJ★falaA⚓then (do) not⚓ COND|LEM:man★taEoDuluwhun~a⚓hinder them⚓ V|IMPF|LEM:faEala|ROOT:fEl|3MS|MOOD:JUS★>an⚓from [that]⚓ DEM|LEM:*a`lik|MS★yankiHona⚓marrying⚓ CERT|LEM:qad★>azowa`jahun~a⚓their husbands⚓ V|PERF|LEM:Zalama|ROOT:Zlm|3MS★<i*aA⚓when⚓ N|LEM:nafos|ROOT:nfs|FS|ACC★tara`DawoA@⚓they agree⚓ PRO|LEM:laA★bayonahum⚓between themselves⚓ V|IMPF|(VIII)|LEM:{t~axa*a|ROOT:Ax*|2MP|MOOD:JUS★bi{lomaEoruwfi⚓in a fair manner.⚓ N|LEM:'aAyap|ROOT:Ayy|FP|ACC★*a`lika⚓That⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★yuwEaZu⚓is admonished⚓ N|LEM:huzuw|ROOT:hzA|M|INDEF|ACC★bihi.⚓with it⚓ V|IMPV|LEM:*akara|ROOT:*kr|2MP★man⚓whoever⚓ N|LEM:niEomap|ROOT:nEm|F|ACC★kaAna⚓[is]⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★minkumo⚓among you⚓ P|LEM:EalaY`★yu&ominu⚓believes⚓ REL|LEM:maA★bi{ll~ahi⚓in Allah⚓ V|PERF|(IV)|LEM:>anzala|ROOT:nzl|3MS★wa{loyawomi⚓and the Day⚓ P|LEM:EalaY`★{lo'aAxiri⚓[the] Last;⚓ P|LEM:min★*a`likumo⚓that⚓ N|LEM:kita`b|ROOT:ktb|M|GEN★>azokaY`⚓(is) more virtuous⚓ N|LEM:Hikomap|ROOT:Hkm|F|GEN★lakumo⚓for you⚓ V|IMPF|LEM:waEaZo|ROOT:wEZ|3MS★wa>aToharu⚓and more purer.⚓ PRON|3MS★wa{ll~ahu⚓And Allah⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★yaEolamu⚓knows⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★wa>antumo⚓and you⚓ V|IMPV|LEM:Ealima|ROOT:Elm|2MP★laA⚓**(do) not know.⚓ ACC|LEM:>an~|SP:<in~★taEolamuwna⚓**(do) not know.⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★",
"wa{lowa`lida`tu⚓**And the mothers⚓N|LEM:kul~|ROOT:kll|M|GEN★yuroDiEona⚓shall suckle⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★>awola`dahun~a⚓their children⚓ N|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★Hawolayoni⚓(for) two years⚓ T|LEM:<i*aA★kaAmilayoni⚓complete,⚓ V|PERF|(II)|LEM:Tal~aqa|ROOT:Tlq|2MP★limano⚓for whoever⚓ N|LEM:nisaA^'|ROOT:nsw|FP|ACC★>araAda⚓wishes⚓ V|PERF|LEM:balaga|ROOT:blg|3FP★>an⚓to⚓ N|LEM:>ajal|ROOT:Ajl|M|ACC★yutim~a⚓complete⚓ PRO|LEM:laA★{lr~aDaAEapa⚓the suckling.⚓ V|IMPF|LEM:taEoDulu|ROOT:EDl|2MP|MOOD:JUS★waEalaY⚓And upon⚓ SUB|LEM:>an★{lomawoluwdi⚓**the father⚓ V|IMPF|LEM:nakaHa|ROOT:nkH|3FP★lahu,⚓**the father⚓ N|LEM:zawoj|ROOT:zwj|MP|ACC★rizoquhun~a⚓(is) their provision⚓ T|LEM:<i*aA★wakisowatuhun~a⚓and their clothing⚓ V|PERF|(VI)|LEM:tara`Da|ROOT:rDw|3MP★bi{lomaEoruwfi⚓in a fair manner.⚓ LOC|LEM:bayon|ROOT:byn|ACC★laA⚓Not⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|GEN★tukal~afu⚓is burdened⚓ DEM|LEM:*a`lik|MS★nafosN⚓any soul⚓ V|IMPF|PASS|LEM:waEaZo|ROOT:wEZ|3MS★<il~aA⚓except⚓ PRON|3MS★wusoEahaA⚓its capacity.⚓ REL|LEM:man★laA⚓Not⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★tuDaA^r~a⚓made to suffer⚓ P|LEM:min★wa`lidapN[⚓(the) mother⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MS★biwaladihaA⚓because of her child⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★walaA⚓and not⚓ N|LEM:yawom|ROOT:ywm|M|GEN★mawoluwdN⚓**(the) father⚓ ADJ|LEM:A^xir|ROOT:Axr|MS|GEN★l~ahu,⚓**(the) father⚓ DEM|LEM:*a`lik|2MP★biwaladihi.⚓because of his child.⚓ N|LEM:>azokaY`|ROOT:zkw|NOM★waEalaY⚓And on⚓ PRON|2MP★{lowaArivi⚓the heirs⚓ N|LEM:>aTohar|ROOT:Thr|MS|NOM★mivolu⚓(is a duty) like⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★*a`lika⚓that.⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MS★fa<ino⚓Then if⚓ PRON|2MP★>araAdaA⚓they both desire⚓ NEG|LEM:laA★fiSaAlFA⚓weaning⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★Ean⚓through⚓ N|ACT|PCPL|LEM:wa`lida`t|ROOT:wld|FP|NOM★taraADK⚓mutual consent⚓ V|IMPF|LEM:yuroDiEo|ROOT:rDE|3FP★m~inohumaA⚓of both of them⚓ N|LEM:walad|ROOT:wld|MP|ACC★wata$aAwurK⚓and consultation,⚓ T|LEM:Hawol|ROOT:Hwl|MD|ACC★falaA⚓then no⚓ ADJ|ACT|PCPL|LEM:kaAmilayon|ROOT:kml|MD|ACC★junaAHa⚓blame⚓ REL|LEM:man★EalayohimaA⚓on both of them.⚓ V|PERF|(IV)|LEM:>araAda|ROOT:rwd|3MS★wa<ino⚓And if⚓ SUB|LEM:>an★>aradt~umo⚓you want⚓ V|IMPF|(IV)|LEM:>atam~a|ROOT:tmm|3MS|MOOD:SUBJ★>an⚓**to ask another women to suckle⚓ N|LEM:r~aDaAEap|ROOT:rDE|F|ACC★tasotaroDiEuw^A@⚓**to ask another women to suckle⚓ P|LEM:EalaY`★>awola`dakumo⚓your child⚓ N|PASS|PCPL|LEM:mawoluwd|ROOT:wld|M|GEN★falaA⚓then (there is) no⚓ PRON|3MS★junaAHa⚓blame⚓ N|LEM:rizoq|ROOT:rzq|M|NOM★Ealayokumo⚓on you,⚓ N|LEM:kisowat|ROOT:ksw|F|NOM★<i*aA⚓when⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|GEN★sal~amotum⚓you pay⚓ NEG|LEM:laA★m~aA^⚓what⚓ V|IMPF|PASS|(II)|LEM:yukal~ifu|ROOT:klf|3FS★'aAtayotum⚓(is) due (from) you⚓ N|LEM:nafos|ROOT:nfs|FS|INDEF|NOM★bi{lomaEoruwfi⚓in a fair manner.⚓ RES|LEM:<il~aA★wa{t~aquwA@⚓**And fear Allah⚓ N|LEM:wusoE|ROOT:wsE|M|ACC★{ll~aha⚓**And fear Allah⚓ NEG|LEM:laA★wa{Eolamuw^A@⚓and know⚓ V|IMPF|PASS|(III)|LEM:yuDaA^r~a|ROOT:Drr|3FS|MOOD:SUBJ★>an~a⚓that⚓ N|ACT|PCPL|LEM:wa`lidap|ROOT:wld|F|INDEF|NOM★{ll~aha⚓Allah⚓ N|LEM:walad|ROOT:wld|M|GEN★bimaA⚓of what⚓ NEG|LEM:laA★taEomaluwna⚓you do⚓ N|PASS|PCPL|LEM:mawoluwd|ROOT:wld|M|INDEF|NOM★baSiyrN⚓(is) All-Seer.⚓ PRON|3MS★",
"wa{l~a*iyna⚓And those who⚓N|LEM:walad|ROOT:wld|M|GEN★yutawaf~awona⚓pass away⚓ P|LEM:EalaY`★minkumo⚓among you⚓ N|ACT|PCPL|LEM:waAriv|ROOT:wrv|MS|GEN★waya*aruwna⚓and leave behind⚓ N|LEM:mivol|ROOT:mvl|M|NOM★>azowa`jFA⚓wives,⚓ DEM|LEM:*a`lik|MS★yatarab~aSona⚓**(the widows) should wait for themselves⚓ COND|LEM:<in★bi>anfusihin~a⚓**(the widows) should wait for themselves⚓ V|PERF|(IV)|LEM:>araAda|ROOT:rwd|3MD★>arobaEapa⚓(for) four⚓ N|LEM:fiSaAl|ROOT:fSl|M|INDEF|ACC★>a$ohurK⚓months⚓ P|LEM:Ean★waEa$orFA⚓and ten (days).⚓ N|VN|(VI)|LEM:taraAD|ROOT:rDw|M|INDEF|GEN★fa<i*aA⚓Then when⚓ P|LEM:min★balagona⚓they reach⚓ N|VN|(VI)|LEM:ta$aAwur|ROOT:$wr|M|INDEF|GEN★>ajalahun~a⚓their (specified) term,⚓ NEG|LEM:laA|SP:<in~★falaA⚓then (there is) no⚓ N|LEM:junaAH|ROOT:jnH|M|ACC★junaAHa⚓blame⚓ P|LEM:EalaY`★Ealayokumo⚓upon you⚓ COND|LEM:<in★fiymaA⚓for what⚓ V|PERF|(IV)|LEM:>araAda|ROOT:rwd|2MP★faEalona⚓they do⚓ SUB|LEM:>an★fiY^⚓**concerning themselves⚓ V|IMPF|(X)|LEM:tasotaroDiEu|ROOT:rDE|2MP|MOOD:SUBJ★>anfusihin~a⚓**concerning themselves⚓ N|LEM:walad|ROOT:wld|MP|ACC★bi{lomaEoruwfi⚓in a fair manner.⚓ NEG|LEM:laA|SP:<in~★wa{ll~ahu⚓And Allah⚓ N|LEM:junaAH|ROOT:jnH|M|ACC★bimaA⚓of what⚓ P|LEM:EalaY`★taEomaluwna⚓you do⚓ T|LEM:<i*aA★xabiyrN⚓(is) All-Aware.⚓ V|PERF|(II)|LEM:sal~ama|ROOT:slm|2MP★",
"walaA⚓And (there is) no⚓REL|LEM:maA★junaAHa⚓blame⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|2MP★Ealayokumo⚓upon you⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|GEN★fiymaA⚓in what⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★Ear~aDotum⚓you hint⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★bihi.⚓**[with it] of⚓ V|IMPV|LEM:Ealima|ROOT:Elm|2MP★mino⚓**[with it] of⚓ ACC|LEM:>an~|SP:<in~★xiTobapi⚓marriage proposal⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★{ln~isaA^'i⚓[to] the women⚓ REL|LEM:maA★>awo⚓or⚓ V|IMPF|LEM:Eamila|ROOT:Eml|2MP★>akonantumo⚓you concealed it⚓ N|LEM:baSiyr|ROOT:bSr|MS|INDEF|NOM★fiY^⚓in⚓ REL|LEM:{l~a*iY|MP★>anfusikumo⚓yourselves.⚓ V|IMPF|PASS|(V)|LEM:tawaf~aY`|ROOT:wfy|3MP★Ealima⚓**Allah knows⚓ P|LEM:min★{ll~ahu⚓**Allah knows⚓ V|IMPF|LEM:ya*ara|ROOT:w*r|3MP★>an~akumo⚓that you⚓ N|LEM:zawoj|ROOT:zwj|MP|INDEF|ACC★sata*okuruwnahun~a⚓will mention them,⚓ V|IMPF|(V)|LEM:tarab~aSo|ROOT:rbS|3FP★wala`kin⚓[and] but⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★l~aA⚓(do) not⚓ N|LEM:>arobaEap|ROOT:rbE|F|ACC★tuwaAEiduwhun~a⚓promise them (widows)⚓ N|LEM:$ahor|ROOT:$hr|MP|INDEF|GEN★sir~FA⚓secretly⚓ N|LEM:Ea$or|ROOT:E$r|M|INDEF|ACC★<il~aA^⚓except⚓ T|LEM:<i*aA★>an⚓that⚓ V|PERF|LEM:balaga|ROOT:blg|3FP★taquwluwA@⚓you say⚓ N|LEM:>ajal|ROOT:Ajl|M|ACC★qawolFA⚓a saying⚓ NEG|LEM:laA|SP:<in~★m~aEoruwfFA⚓honorable.⚓ N|LEM:junaAH|ROOT:jnH|M|ACC★walaA⚓And (do) not⚓ P|LEM:EalaY`★taEozimuwA@⚓resolve (on)⚓ P|LEM:fiY★Euqodapa⚓**the marriage knot⚓ REL|LEM:maA★{ln~ikaAHi⚓**the marriage knot⚓ V|PERF|LEM:faEala|ROOT:fEl|3FP★Hat~aY`⚓until⚓ P|LEM:fiY★yaboluga⚓reaches⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★{lokita`bu⚓the prescribed term⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|GEN★>ajalahu,⚓its end.⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★wa{Eolamuw^A@⚓And know⚓ REL|LEM:maA★>an~a⚓that⚓ V|IMPF|LEM:Eamila|ROOT:Eml|2MP★{ll~aha⚓Allah⚓ N|LEM:xabiyr|ROOT:xbr|MS|INDEF|NOM★yaEolamu⚓knows⚓ NEG|LEM:laA|SP:<in~★maA⚓what⚓ N|LEM:junaAH|ROOT:jnH|M|ACC★fiY^⚓(is) within⚓ P|LEM:EalaY`★>anfusikumo⚓yourselves⚓ P|LEM:fiY★fa{Ho*aruwhu⚓so beware of Him.⚓ REL|LEM:maA★wa{Eolamuw^A@⚓And know⚓ V|PERF|(II)|LEM:Ear~aDo|ROOT:ErD|2MP★>an~a⚓that⚓ PRON|3MS★{ll~aha⚓Allah⚓ P|LEM:min★gafuwrN⚓(is) Oft-Forgiving,⚓ N|LEM:xiTobap|ROOT:xTb|F|GEN★HaliymN⚓Most Forbearing.⚓ N|LEM:nisaA^'|ROOT:nsw|FP|GEN★",
"l~aA⚓(There is) no⚓CONJ|LEM:>aw★junaAHa⚓blame⚓ V|PERF|(IV)|LEM:>akonan|ROOT:knn|2MP★Ealayokumo⚓upon you⚓ P|LEM:fiY★<in⚓if⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★Tal~aqotumu⚓you divorce⚓ V|PERF|LEM:Ealima|ROOT:Elm|3MS★{ln~isaA^'a⚓[the] women⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★maA⚓whom⚓ ACC|LEM:>an~|SP:<in~★lamo⚓**you have not touched⚓ V|IMPF|LEM:*akara|ROOT:*kr|2MP★tamas~uwhun~a⚓**you have not touched⚓ AMD|LEM:la`kin★>awo⚓nor⚓ PRO|LEM:laA★taforiDuwA@⚓you specified⚓ V|IMPF|(III)|LEM:wa`Eado|ROOT:wEd|2MP|MOOD:JUS★lahun~a⚓for them⚓ N|LEM:sir~|ROOT:srr|M|INDEF|ACC★fariyDapF⚓an obligation (dower).⚓ EXP|LEM:<il~aA★wamat~iEuwhun~a⚓And make provision for them -⚓ SUB|LEM:>an★EalaY⚓upon⚓ V|IMPF|LEM:qaAla|ROOT:qwl|2MP|MOOD:SUBJ★{lomuwsiEi⚓the wealthy⚓ N|VN|LEM:qawol|ROOT:qwl|M|INDEF|ACC★qadaruhu,⚓according to his means⚓ ADJ|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|INDEF|ACC★waEalaY⚓and upon⚓ PRO|LEM:laA★{lomuqotiri⚓the poor⚓ V|IMPF|LEM:Eazama|ROOT:Ezm|2MP|MOOD:JUS★qadaruhu,⚓according to his means -⚓ N|LEM:Euqodap|ROOT:Eqd|F|ACC★mata`EF[A⚓a provision⚓ N|LEM:nikaAH|ROOT:nkH|M|GEN★bi{lomaEoruwfi⚓in a fair manner,⚓ P|LEM:Hat~aY`★Haq~FA⚓a duty⚓ V|IMPF|LEM:balaga|ROOT:blg|3MS|MOOD:SUBJ★EalaY⚓upon⚓ N|LEM:kita`b|ROOT:ktb|M|NOM★{lomuHosiniyna⚓the good-doers.⚓ N|LEM:>ajal|ROOT:Ajl|M|ACC★",
"wa<in⚓And if⚓V|IMPV|LEM:Ealima|ROOT:Elm|2MP★Tal~aqotumuwhun~a⚓you divorce them⚓ ACC|LEM:>an~|SP:<in~★min⚓**before⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★qaboli⚓**before⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MS★>an⚓[that]⚓ REL|LEM:maA★tamas~uwhun~a⚓you (have) touched them⚓ P|LEM:fiY★waqado⚓while already⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★faraDotumo⚓you have specified⚓ V|IMPV|LEM:yaHo*aru|ROOT:H*r|2MP★lahun~a⚓for them⚓ V|IMPV|LEM:Ealima|ROOT:Elm|2MP★fariyDapF⚓an obligation (dower),⚓ ACC|LEM:>an~|SP:<in~★faniSofu⚓then (give) half⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★maA⚓(of) what⚓ N|LEM:gafuwr|ROOT:gfr|MS|INDEF|NOM★faraDotumo⚓you have specified,⚓ ADJ|LEM:Haliym|ROOT:Hlm|MS|INDEF|NOM★<il~aA^⚓unless⚓ NEG|LEM:laA|SP:<in~★>an⚓[that]⚓ N|LEM:junaAH|ROOT:jnH|M|ACC★yaEofuwna⚓they (women) forgo (it)⚓ P|LEM:EalaY`★>awo⚓or⚓ COND|LEM:<in★yaEofuwaA@⚓forgoes⚓ V|PERF|(II)|LEM:Tal~aqa|ROOT:Tlq|2MP★{l~a*iY⚓the one⚓ N|LEM:nisaA^'|ROOT:nsw|FP|ACC★biyadihi.⚓in whose hands⚓ SUB|LEM:maA★Euqodapu⚓(is the) knot⚓ NEG|LEM:lam★{ln~ikaAHi⚓(of) the marriage.⚓ V|IMPF|LEM:mas~a|ROOT:mss|2MP|MOOD:JUS★wa>an⚓And that⚓ CONJ|LEM:>aw★taEofuw^A@⚓you forgo,⚓ V|IMPF|LEM:faraDa|ROOT:frD|2MP|MOOD:SUBJ★>aqorabu⚓(is) nearer⚓ PRON|3FP★lilt~aqowaY`⚓to [the] righteousness.⚓ N|LEM:fariyDap|ROOT:frD|F|INDEF|ACC★walaA⚓And (do) not⚓ V|IMPV|(II)|LEM:m~at~aEo|ROOT:mtE|2MP★tansawuA@⚓forget⚓ P|LEM:EalaY`★{lofaDola⚓the graciousness⚓ N|ACT|PCPL|(IV)|LEM:muwsiE|ROOT:wsE|M|GEN★bayonakumo⚓among you.⚓ N|LEM:qadar|ROOT:qdr|M|NOM★<in~a⚓Indeed,⚓ P|LEM:EalaY`★{ll~aha⚓Allah⚓ N|ACT|PCPL|(IV)|LEM:muqotir|ROOT:qtr|M|GEN★bimaA⚓of what⚓ N|LEM:qadar|ROOT:qdr|M|NOM★taEomaluwna⚓you do⚓ N|LEM:mata`E|ROOT:mtE|M|INDEF|ACC★baSiyrN⚓(is) All-Seer.⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|GEN★",
"Ha`fiZuwA@⚓Guard strictly⚓N|LEM:Haq~|ROOT:Hqq|M|INDEF|ACC★EalaY⚓[on]⚓ P|LEM:EalaY`★{lS~alawa`ti⚓the prayers,⚓ N|ACT|PCPL|(IV)|LEM:muHosin|ROOT:Hsn|MP|GEN★wa{lS~alaw`pi⚓and the prayer -⚓ COND|LEM:<in★{lowusoTaY`⚓[the] middle,⚓ V|PERF|(II)|LEM:Tal~aqa|ROOT:Tlq|2MP★waquwmuwA@⚓and stand up⚓ P|LEM:min★lil~ahi⚓for Allah⚓ N|LEM:qabol|ROOT:qbl|GEN★qa`nitiyna⚓devoutly obedient.⚓ SUB|LEM:>an★",
"fa<ino⚓And if⚓V|IMPF|LEM:mas~a|ROOT:mss|2MP|MOOD:SUBJ★xifotumo⚓you fear⚓ CERT|LEM:qad★farijaAlFA⚓then (pray) on foot⚓ V|PERF|LEM:faraDa|ROOT:frD|2MP★>awo⚓or⚓ PRON|3FP★rukobaAnFA⚓riding.⚓ N|LEM:fariyDap|ROOT:frD|F|INDEF|ACC★fa<i*aA^⚓Then when⚓ N|LEM:niSof|ROOT:nSf|M|NOM★>amintumo⚓you are secure⚓ REL|LEM:maA★fa{*okuruwA@⚓then remember⚓ V|PERF|LEM:faraDa|ROOT:frD|2MP★{ll~aha⚓Allah⚓ EXP|LEM:<il~aA★kamaA⚓as⚓ SUB|LEM:>an★Eal~amakum⚓He (has) taught you⚓ V|IMPF|LEM:EafaA|ROOT:Efw|3MP★m~aA⚓what⚓ CONJ|LEM:>aw★lamo⚓**you were not⚓ V|IMPF|LEM:EafaA|ROOT:Efw|3MS|MOOD:SUBJ★takuwnuwA@⚓**you were not⚓ REL|LEM:{l~a*iY|MS★taEolamuwna⚓knowing.⚓ N|LEM:yad|ROOT:ydy|FS|GEN★",
"wa{l~a*iyna⚓And those who⚓N|LEM:Euqodap|ROOT:Eqd|F|NOM★yutawaf~awona⚓they die⚓ N|LEM:nikaAH|ROOT:nkH|M|GEN★minkumo⚓among you⚓ SUB|LEM:>an★waya*aruwna⚓and leave behind⚓ V|IMPF|LEM:EafaA|ROOT:Efw|2MP|MOOD:SUBJ★>azowa`jFA⚓(their) wives⚓ N|LEM:>aqorab|ROOT:qrb|MS|NOM★waSiy~apF⚓(should make) a will⚓ N|LEM:taqowaY|ROOT:wqy|M|GEN★l~i>azowa`jihim⚓for their wives,⚓ PRO|LEM:laA★m~ata`EFA⚓provision⚓ V|IMPF|LEM:nasiYa|ROOT:nsy|2MP|MOOD:JUS★<ilaY⚓for⚓ N|LEM:faDol|ROOT:fDl|M|ACC★{loHawoli⚓the year⚓ LOC|LEM:bayon|ROOT:byn|ACC★gayora⚓without⚓ ACC|LEM:<in~|SP:<in~★<ixoraAjK⚓driving (them) out.⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★fa<ino⚓But if⚓ REL|LEM:maA★xarajona⚓they leave⚓ V|IMPF|LEM:Eamila|ROOT:Eml|2MP★falaA⚓then no⚓ N|LEM:baSiyr|ROOT:bSr|MS|INDEF|NOM★junaAHa⚓blame⚓ V|IMPV|(III)|LEM:yuHaAfiZu|ROOT:HfZ|2MP★Ealayokumo⚓upon you⚓ P|LEM:EalaY`★fiY⚓in⚓ N|LEM:Salaw`p|ROOT:Slw|FP|GEN★maA⚓what⚓ N|LEM:Salaw`p|ROOT:Slw|F|GEN★faEalona⚓they do⚓ ADJ|LEM:wusoTaY`|ROOT:wsT|F|GEN★fiY^⚓concerning⚓ V|IMPV|LEM:qaAma|ROOT:qwm|2MP★>anfusihin~a⚓themselves⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★min⚓[of]⚓ N|ACT|PCPL|LEM:qaAnit|ROOT:qnt|MP|ACC★m~aEoruwfK⚓honorably.⚓ COND|LEM:<in★wa{ll~ahu⚓And Allah⚓ V|PERF|LEM:xaAfa|ROOT:xwf|2MP★EaziyzN⚓(is) All-Mighty,⚓ N|LEM:rijaAl|ROOT:rjl|MP|INDEF|ACC★HakiymN⚓All-Wise.⚓ CONJ|LEM:>aw★",
"walilomuTal~aqa`ti⚓And for the divorced women,⚓N|LEM:rukobaAn|ROOT:rkb|MP|INDEF|ACC★mata`EN[⚓(is) a provision⚓ T|LEM:<i*aA★bi{lomaEoruwfi⚓in a fair manner -⚓ V|PERF|LEM:>amina|ROOT:Amn|2MP★Haq~FA⚓a duty⚓ V|IMPV|LEM:*akara|ROOT:*kr|2MP★EalaY⚓upon⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★{lomut~aqiyna⚓the righteous.⚓ SUB|LEM:maA★",
"ka*a`lika⚓Thus⚓V|PERF|(II)|LEM:Eal~ama|ROOT:Elm|3MS★yubay~inu⚓**Allah makes clear⚓ REL|LEM:maA★{ll~ahu⚓**Allah makes clear⚓ NEG|LEM:lam★lakumo⚓for you⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP|MOOD:JUS★'aAya`tihi.⚓His Verses⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★laEal~akumo⚓so that you may⚓ REL|LEM:{l~a*iY|MP★taEoqiluwna⚓use your intellect.⚓ V|IMPF|PASS|(V)|LEM:tawaf~aY`|ROOT:wfy|3MP★",
">alamo⚓**Did you not see⚓P|LEM:min★tara⚓**Did you not see⚓ V|IMPF|LEM:ya*ara|ROOT:w*r|3MP★<ilaY⚓[to]⚓ N|LEM:zawoj|ROOT:zwj|MP|INDEF|ACC★{l~a*iyna⚓those who⚓ N|LEM:waSiy~ap|ROOT:wSy|F|INDEF|ACC★xarajuwA@⚓went out⚓ N|LEM:zawoj|ROOT:zwj|MP|GEN★min⚓from⚓ N|LEM:mata`E|ROOT:mtE|M|INDEF|ACC★diya`rihimo⚓their homes⚓ P|LEM:<ilaY`★wahumo⚓and they⚓ N|LEM:Hawol|ROOT:Hwl|M|GEN★>uluwfN⚓(were in) thousands⚓ N|LEM:gayor|ROOT:gyr|M|ACC★Ha*ara⚓(in) fear⚓ N|VN|(IV)|LEM:<ixoraAj|ROOT:xrj|M|INDEF|GEN★{lomawoti⚓(of) [the] death?⚓ COND|LEM:<in★faqaAla⚓Then said⚓ V|PERF|LEM:xaraja|ROOT:xrj|3FP★lahumu⚓to them⚓ NEG|LEM:laA|SP:<in~★{ll~ahu⚓Allah,⚓ N|LEM:junaAH|ROOT:jnH|M|ACC★muwtuwA@⚓`Die;`⚓ P|LEM:EalaY`★vum~a⚓then⚓ P|LEM:fiY★>aHoya`humo⚓He restored them to life.⚓ REL|LEM:maA★<in~a⚓Indeed,⚓ V|PERF|LEM:faEala|ROOT:fEl|3FP★{ll~aha⚓Allah⚓ P|LEM:fiY★la*uw⚓**(is) surely Possessor of bounty⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★faDolK⚓**(is) surely Possessor of bounty⚓ P|LEM:min★EalaY⚓for⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|INDEF|GEN★{ln~aAsi⚓[the] mankind⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★wala`kin~a⚓[and] but⚓ N|LEM:Eaziyz|ROOT:Ezz|MS|INDEF|NOM★>akovara⚓most⚓ ADJ|LEM:Hakiym|ROOT:Hkm|MS|INDEF|NOM★{ln~aAsi⚓(of) the people⚓ N|PASS|PCPL|(II)|LEM:muTal~aqa`t|ROOT:Tlq|FP|GEN★laA⚓**are not grateful.⚓ N|LEM:mata`E|ROOT:mtE|M|INDEF|NOM★ya$okuruwna⚓**are not grateful.⚓ N|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|GEN★",
"waqa`tiluwA@⚓And fight⚓N|LEM:Haq~|ROOT:Hqq|M|INDEF|ACC★fiY⚓in⚓ P|LEM:EalaY`★sabiyli⚓(the) way⚓ N|ACT|PCPL|(VIII)|LEM:mut~aqiyn|ROOT:wqy|MP|GEN★{ll~ahi⚓(of) Allah,⚓ DEM|LEM:*a`lik|MS★wa{Eolamuw^A@⚓and know⚓ V|IMPF|(II)|LEM:bay~anu|ROOT:byn|3MS★>an~a⚓that⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{ll~aha⚓Allah⚓ PRON|2MP★samiyEN⚓(is) All-Hearing,⚓ N|LEM:'aAyap|ROOT:Ayy|FP|ACC★EaliymN⚓All-Knowing.⚓ ACC|LEM:laEal~|SP:<in~★",
"m~an⚓Who⚓V|IMPF|LEM:Eaqalu|ROOT:Eql|2MP★*aA⚓**(is) the one who⚓ NEG|LEM:lam★{l~a*iY⚓**(is) the one who⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|2MS|MOOD:JUS★yuqoriDu⚓will lend⚓ P|LEM:<ilaY`★{ll~aha⚓(to) Allah -⚓ REL|LEM:{l~a*iY|MP★qaroDFA⚓a loan⚓ V|PERF|LEM:xaraja|ROOT:xrj|3MP★HasanFA⚓good,⚓ P|LEM:min★fayuDa`Eifahu,⚓so (that) He multiplies it⚓ N|LEM:daAr|ROOT:dwr|FP|GEN★lahu,^⚓for him -⚓ PRON|3MP★>aDoEaAfFA⚓**manifolds⚓ N|LEM:>alof|ROOT:Alf|P|INDEF|NOM★kaviyrapF⚓**manifolds⚓ N|VN|LEM:Ha*ar|ROOT:H*r|M|ACC★wa{ll~ahu⚓And Allah⚓ N|LEM:mawot|ROOT:mwt|M|GEN★yaqobiDu⚓withholds⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★wayaboS:uTu⚓and grants abundance,⚓ PRON|3MP★wa<ilayohi⚓and to Him⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★turojaEuwna⚓you will be returned.⚓ V|IMPV|LEM:m~aAta|ROOT:mwt|2MP★",
">alamo⚓**Did you not see⚓CONJ|LEM:vum~★tara⚓**Did you not see⚓ V|PERF|(IV)|LEM:>aHoyaA|ROOT:Hyy|3MS★<ilaY⚓[towards]⚓ ACC|LEM:<in~|SP:<in~★{lomala<i⚓the chiefs⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★min[⚓of⚓ N|LEM:*uw|MS|NOM★baniY^⚓(the) Children⚓ N|LEM:faDol|ROOT:fDl|M|INDEF|GEN★<isora`^'iyla⚓(of) Israel⚓ P|LEM:EalaY`★min[⚓**after⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★baEodi⚓**after⚓ ACC|LEM:la`kin~|SP:<in~★muwsaY`^⚓Musa,⚓ N|LEM:>akovar|ROOT:kvr|MS|ACC★<i*o⚓when⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★qaAluwA@⚓they said⚓ NEG|LEM:laA★linabiY~K⚓to a Prophet⚓ V|IMPF|LEM:$akara|ROOT:$kr|3MP★l~ahumu⚓of theirs,⚓ V|IMPV|(III)|LEM:qa`tala|ROOT:qtl|2MP★{boEavo⚓`Appoint⚓ P|LEM:fiY★lanaA⚓for us⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★malikFA⚓a king,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★n~uqa`tilo⚓we may fight⚓ V|IMPV|LEM:Ealima|ROOT:Elm|2MP★fiY⚓in⚓ ACC|LEM:>an~|SP:<in~★sabiyli⚓(the) way⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★{ll~ahi⚓(of) Allah?`⚓ N|LEM:samiyE|ROOT:smE|MS|INDEF|NOM★qaAla⚓He said,⚓ ADJ|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★halo⚓`Would⚓ INTG|LEM:man★Easayotumo⚓you perhaps -⚓ DEM|LEM:*aA|MS★<in⚓if⚓ REL|LEM:{l~a*iY|MS★kutiba⚓prescribed⚓ V|IMPF|(IV)|LEM:>aqoraDu|ROOT:qrD|3MS★Ealayokumu⚓upon you⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★{loqitaAlu⚓[the] fighting,⚓ N|LEM:qaroD|ROOT:qrD|M|INDEF|ACC★>al~aA⚓that not⚓ ADJ|LEM:Hasan|ROOT:Hsn|MS|INDEF|ACC★tuqa`tiluwA@⚓you fight?`⚓ V|IMPF|(III)|LEM:yuDa`Eifu|ROOT:DEf|3MS|MOOD:SUBJ★qaAluwA@⚓They said,⚓ PRON|3MS★wamaA⚓`And what⚓ N|LEM:DiEof|ROOT:DEf|MP|INDEF|ACC★lanaA^⚓for us⚓ ADJ|LEM:kaviyrap|ROOT:kvr|FS|INDEF|ACC★>al~aA⚓that not⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★nuqa`tila⚓we fight⚓ V|IMPF|LEM:qabaDo|ROOT:qbD|3MS★fiY⚓in⚓ V|IMPF|LEM:basaTa|ROOT:bsT|3MS★sabiyli⚓(the) way⚓ P|LEM:<ilaY`★{ll~ahi⚓(of) Allah⚓ V|IMPF|PASS|LEM:rajaEa|ROOT:rjE|2MP★waqado⚓while surely⚓ NEG|LEM:lam★>uxorijonaA⚓we have been driven out⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|2MS|MOOD:JUS★min⚓from⚓ P|LEM:<ilaY`★diya`rinaA⚓our homes⚓ N|LEM:mala>|ROOT:mlA|M|GEN★wa>abonaA^}inaA⚓and our children?`⚓ P|LEM:min★falam~aA⚓Yet, when⚓ N|LEM:bunaY~|ROOT:bny|MP|GEN★kutiba⚓was prescribed⚓ PN|LEM:<isoraA}iyl|GEN★Ealayohimu⚓upon them⚓ P|LEM:min★{loqitaAlu⚓the fighting⚓ N|LEM:baEod|ROOT:bEd|GEN★tawal~awoA@⚓they turned away,⚓ PN|LEM:muwsaY`|M|GEN★<il~aA⚓except⚓ T|LEM:<i*★qaliylFA⚓a few⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★m~inohumo⚓among them.⚓ N|LEM:n~abiY~|ROOT:nbA|M|INDEF|GEN★wa{ll~ahu⚓And Allah⚓ PRON|3MP★EaliymN[⚓(is) All-Knowing⚓ V|IMPV|LEM:baEava|ROOT:bEv|2MS★bi{lZ~a`limiyna⚓of the wrongdoers.⚓ PRON|1P★",
"waqaAla⚓And said⚓N|LEM:malik|ROOT:mlk|MS|INDEF|ACC★lahumo⚓to them⚓ V|IMPF|(III)|LEM:qa`tala|ROOT:qtl|1P|MOOD:JUS★nabiy~uhumo⚓their Prophet,⚓ P|LEM:fiY★<in~a⚓`Indeed,⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★{ll~aha⚓Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★qado⚓(has) surely⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★baEava⚓raised⚓ INTG|LEM:hal★lakumo⚓for you⚓ V|PERF|LEM:EasaY|ROOT:Esy|SP:kaAd|2MP★TaAluwta⚓Talut⚓ COND|LEM:<in★malikFA⚓(as) a king.`⚓ V|PERF|PASS|LEM:kataba|ROOT:ktb|3MS★qaAluw^A@⚓They said,⚓ P|LEM:EalaY`★>an~aY`⚓**How can be⚓ N|LEM:qitaAl|ROOT:qtl|M|NOM★yakuwnu⚓**How can be⚓ SUB|LEM:>an★lahu⚓for him⚓ NEG|LEM:laA★{lomuloku⚓the kingship⚓ V|IMPF|(III)|LEM:qa`tala|ROOT:qtl|2MP|MOOD:SUBJ★EalayonaA⚓over us,⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★wanaHonu⚓while we⚓ INTG|LEM:maA★>aHaq~u⚓(are) more entitled⚓ PRON|1P★bi{lomuloki⚓to kingship⚓ SUB|LEM:>an★minohu⚓than him,⚓ NEG|LEM:laA★walamo⚓**and he has not been given⚓ V|IMPF|(III)|LEM:qa`tala|ROOT:qtl|1P|MOOD:SUBJ★yu&ota⚓**and he has not been given⚓ P|LEM:fiY★saEapF⚓abundance⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★m~ina⚓of⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★{lomaAli⚓[the] wealth?`⚓ CERT|LEM:qad★qaAla⚓He said,⚓ V|PERF|PASS|(IV)|LEM:>axoraja|ROOT:xrj|1P★<in~a⚓`Indeed,⚓ P|LEM:min★{ll~aha⚓Allah⚓ N|LEM:daAr|ROOT:dwr|FP|GEN★{SoTafaY`hu⚓has chosen him⚓ N|LEM:{bon|ROOT:bny|MP|GEN★Ealayokumo⚓over you⚓ T|LEM:lam~aA★wazaAdahu,⚓and increased him⚓ V|PERF|PASS|LEM:kataba|ROOT:ktb|3MS★basoTapF⚓abundantly⚓ P|LEM:EalaY`★fiY⚓in⚓ N|LEM:qitaAl|ROOT:qtl|M|NOM★{loEilomi⚓[the] knowledge⚓ V|PERF|(V)|LEM:tawal~aY`|ROOT:wly|3MP★wa{lojisomi⚓and [the] physique.⚓ EXP|LEM:<il~aA★wa{ll~ahu⚓And Allah⚓ N|LEM:qaliyl|ROOT:qll|MS|INDEF|ACC★yu&otiY⚓gives⚓ P|LEM:min★mulokahu,⚓His kingdom⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★man⚓(to) whom⚓ N|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★ya$aA^'u⚓He wills.⚓ N|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|GEN★wa{ll~ahu⚓And Allah⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★wa`siEN⚓(is) All-Encompassing,⚓ PRON|3MP★EaliymN⚓All-Knowing.`⚓ N|LEM:n~abiY~|ROOT:nbA|M|NOM★",
"waqaAla⚓And said⚓ACC|LEM:<in~|SP:<in~★lahumo⚓to them⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★nabiy~uhumo⚓their Prophet,⚓ CERT|LEM:qad★<in~a⚓`Indeed,⚓ V|PERF|LEM:baEava|ROOT:bEv|3MS★'aAyapa⚓a sign⚓ PRON|2MP★mulokihi.^⚓(of) his kingship⚓ PN|LEM:TaAluwt|ACC★>an⚓(is) that⚓ N|LEM:malik|ROOT:mlk|MS|INDEF|ACC★ya>otiyakumu⚓will come to you⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★{lt~aAbuwtu⚓the ark,⚓ INTG|LEM:>an~aY`|ROOT:Any★fiyhi⚓in it⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★sakiynapN⚓(is) a tranquility⚓ PRON|3MS★m~in⚓from⚓ N|LEM:mulok|ROOT:mlk|M|NOM★r~ab~ikumo⚓your Lord,⚓ P|LEM:EalaY`★wabaqiy~apN⚓and a remnant⚓ PRON|1P★m~im~aA⚓of what⚓ N|LEM:>aHaq~|ROOT:Hqq|MS|NOM★taraka⚓(was) left⚓ N|LEM:mulok|ROOT:mlk|M|GEN★'aAlu⚓(by the) family⚓ P|LEM:min★muwsaY`⚓(of) Musa⚓ NEG|LEM:lam★wa'aAlu⚓and family⚓ V|IMPF|PASS|(IV)|LEM:A^taY|ROOT:Aty|3MS|MOOD:JUS★ha`ruwna⚓(of) Harun⚓ N|LEM:saEap|ROOT:wsE|F|INDEF|ACC★taHomiluhu⚓will carry it⚓ P|LEM:min★{lomala`^}ikapu⚓the Angels.⚓ N|LEM:maAl|ROOT:mwl|M|GEN★<in~a⚓Indeed,⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★fiY⚓in⚓ ACC|LEM:<in~|SP:<in~★*a`lika⚓that⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★la'aAyapF⚓(is) surely a sign⚓ V|PERF|(VIII)|LEM:{SoTafaY`|ROOT:Sfw|3MS★l~akumo⚓for you⚓ P|LEM:EalaY`★<in⚓if⚓ V|PERF|LEM:zaAda|ROOT:zyd|3MS★kuntum⚓you are⚓ N|LEM:baSTap|ROOT:bsT|M|INDEF|ACC★m~u&ominiyna⚓believers.`⚓ P|LEM:fiY★",
"falam~aA⚓Then when⚓N|LEM:Eilom|ROOT:Elm|M|GEN★faSala⚓set out⚓ N|LEM:jisom|ROOT:jsm|M|GEN★TaAluwtu⚓Talut⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★bi{lojunuwdi⚓with the forces⚓ V|IMPF|(IV)|LEM:A^taY|ROOT:Aty|3MS★qaAla⚓he said,⚓ N|LEM:mulok|ROOT:mlk|M|ACC★<in~a⚓`Indeed,⚓ REL|LEM:man★{ll~aha⚓Allah⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★mubotaliykum⚓will test you⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★binaharK⚓with a river.⚓ N|ACT|PCPL|LEM:wa`siE|ROOT:wsE|M|INDEF|NOM★faman⚓So whoever⚓ ADJ|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★$ariba⚓drinks⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★minohu⚓from it⚓ PRON|3MP★falayosa⚓then he is not⚓ N|LEM:n~abiY~|ROOT:nbA|M|NOM★min~iY⚓from me,⚓ ACC|LEM:<in~|SP:<in~★waman⚓and whoever⚓ N|LEM:'aAyap|ROOT:Ayy|FS|ACC★l~amo⚓(does) not⚓ N|LEM:mulok|ROOT:mlk|M|GEN★yaToEamohu⚓taste it⚓ SUB|LEM:>an★fa<in~ahu,⚓then indeed, he⚓ V|IMPF|LEM:>ataY|ROOT:Aty|3MS|MOOD:SUBJ★min~iY^⚓(is) from me⚓ N|LEM:t~aAbuwt|M|NOM★<il~aA⚓except⚓ P|LEM:fiY★mani⚓whoever⚓ N|LEM:sakiynap|ROOT:skn|F|INDEF|NOM★{gotarafa⚓takes⚓ P|LEM:min★gurofapF[⚓(in the) hollow⚓ N|LEM:rab~|ROOT:rbb|M|GEN★biyadihi.⚓(of) his hand.`⚓ N|LEM:baqiy~at|ROOT:bqy|F|INDEF|NOM★fa$aribuwA@⚓Then they drank⚓ P|LEM:min★minohu⚓from it⚓ REL|LEM:maA★<il~aA⚓except⚓ V|PERF|LEM:taraka|ROOT:trk|3MS★qaliylFA⚓a few⚓ N|LEM:'aAl|ROOT:Awl|M|NOM★m~inohumo⚓of them.⚓ PN|LEM:muwsaY`|M|GEN★falam~aA⚓Then when⚓ N|LEM:'aAl|ROOT:Awl|M|NOM★jaAwazahu,⚓**he crossed it⚓ PN|LEM:ha`ruwn|M|GEN★huwa⚓**he crossed it⚓ V|IMPF|LEM:Hamala|ROOT:Hml|3FS★wa{l~a*iyna⚓and those who⚓ N|LEM:malak|ROOT:mlk|MP|NOM★'aAmanuwA@⚓believed⚓ ACC|LEM:<in~|SP:<in~★maEahu,⚓with him,⚓ P|LEM:fiY★qaAluwA@⚓they said,⚓ DEM|LEM:*a`lik|MS★laA⚓`No⚓ N|LEM:'aAyap|ROOT:Ayy|FS|INDEF|ACC★TaAqapa⚓strength⚓ PRON|2MP★lanaA⚓for us⚓ COND|LEM:<in★{loyawoma⚓today⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★bijaAluwta⚓against Jalut⚓ N|ACT|PCPL|(IV)|LEM:mu&omin|ROOT:Amn|MP|ACC★wajunuwdihi.⚓and his troops.`⚓ T|LEM:lam~aA★qaAla⚓Said⚓ V|PERF|LEM:faSala|ROOT:fSl|3MS★{l~a*iyna⚓those who⚓ PN|LEM:TaAluwt|NOM★yaZun~uwna⚓were certain⚓ N|LEM:jund|ROOT:jnd|MP|GEN★>an~ahum⚓that they⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★m~ula`quwA@⚓(would) meet⚓ ACC|LEM:<in~|SP:<in~★{ll~ahi⚓Allah,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★kam⚓`How many⚓ N|ACT|PCPL|(VIII)|LEM:mubotaliy|ROOT:blw|MS|NOM★m~in⚓of⚓ N|LEM:nahar|ROOT:nhr|M|INDEF|GEN★fi}apK⚓**a small company⚓ COND|LEM:man★qaliylapK⚓**a small company⚓ V|PERF|LEM:$ariba|ROOT:$rb|3MS★galabato⚓overcame⚓ P|LEM:min★fi}apF⚓**a large company⚓ V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|3MS★kaviyrapF[⚓**a large company⚓ P|LEM:min★bi<i*oni⚓by (the) permission⚓ COND|LEM:man★{ll~ahi⚓(of) Allah.⚓ NEG|LEM:lam★wa{ll~ahu⚓And Allah⚓ V|IMPF|LEM:TaEimu|ROOT:TEm|3MS|MOOD:JUS★maEa⚓(is) with⚓ ACC|LEM:<in~|SP:<in~★{lS~a`biriyna⚓the patient ones.`⚓ P|LEM:min★",
"walam~aA⚓And when⚓EXP|LEM:<il~aA★barazuwA@⚓they went forth⚓ REL|LEM:man★lijaAluwta⚓to (face) Jalut⚓ V|PERF|(VIII)|LEM:{gotarafa|ROOT:grf|3MS★wajunuwdihi.⚓and his troops⚓ N|LEM:gurofap|ROOT:grf|F|INDEF|ACC★qaAluwA@⚓they said,⚓ N|LEM:yad|ROOT:ydy|FS|GEN★rab~anaA^⚓`Our Lord!⚓ V|PERF|LEM:$ariba|ROOT:$rb|3MP★>aforigo⚓Pour⚓ P|LEM:min★EalayonaA⚓on us⚓ EXP|LEM:<il~aA★SaborFA⚓patience⚓ N|LEM:qaliyl|ROOT:qll|MS|INDEF|ACC★wavab~ito⚓and make firm⚓ P|LEM:min★>aqodaAmanaA⚓our feet,⚓ T|LEM:lam~aA★wa{nSuronaA⚓and help us⚓ V|PERF|(III)|LEM:jaAwaza|ROOT:jwz|3MS★EalaY⚓against⚓ PRON|3MS★{loqawomi⚓**the disbelieving people.`⚓ REL|LEM:{l~a*iY|MP★{loka`firiyna⚓**the disbelieving people.`⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★",
"fahazamuwhum⚓So they defeated them⚓LOC|LEM:maE|ACC★bi<i*oni⚓by (the) permission⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★{ll~ahi⚓of Allah,⚓ NEG|LEM:laA|SP:<in~★waqatala⚓and killed⚓ N|LEM:TaAqap|ROOT:Twq|F|ACC★daAwu,du⚓Dawood⚓ PRON|1P★jaAluwta⚓Jalut,⚓ T|LEM:yawom|ROOT:ywm|M|ACC★wa'aAtaY`hu⚓**and Allah gave him⚓ PN|LEM:jaAluwt|GEN★{ll~ahu⚓**and Allah gave him⚓ N|LEM:jund|ROOT:jnd|MP|GEN★{lomuloka⚓the kingdom⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★wa{loHikomapa⚓and the wisdom⚓ REL|LEM:{l~a*iY|MP★waEal~amahu,⚓and taught him⚓ V|IMPF|LEM:Zan~a|ROOT:Znn|3MP★mim~aA⚓that which⚓ ACC|LEM:>an~|SP:<in~★ya$aA^'u⚓He willed.⚓ N|ACT|PCPL|(III)|LEM:m~ula`quwA|ROOT:lqy|MP|NOM★walawolaA⚓And if not⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★dafoEu⚓**(for) Allah`s repelling⚓ INTG|LEM:kam★{ll~ahi⚓**(for) Allah`s repelling⚓ P|LEM:min★{ln~aAsa⚓[the] people -⚓ N|LEM:fi}ap|ROOT:fAy|F|INDEF|GEN★baEoDahum⚓some of them⚓ ADJ|LEM:qaliylap|ROOT:qll|F|INDEF|GEN★bibaEoDK⚓with others,⚓ V|PERF|LEM:galabu|ROOT:glb|3FS★l~afasadati⚓**certainly the earth (would have been) corrupted,⚓ N|LEM:fi}ap|ROOT:fAy|F|INDEF|ACC★{lo>aroDu⚓**certainly the earth (would have been) corrupted,⚓ ADJ|LEM:kaviyrap|ROOT:kvr|FS|INDEF|ACC★wala`kin~a⚓[and] but⚓ N|LEM:<i*on|ROOT:A*n|M|GEN★{ll~aha⚓Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★*uw⚓**(is) Possessor of bounty⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★faDolK⚓**(is) Possessor of bounty⚓ LOC|LEM:maE|ACC★EalaY⚓to⚓ N|ACT|PCPL|LEM:SaAbir|ROOT:Sbr|MP|GEN★{loEa`lamiyna⚓the worlds.⚓ T|LEM:lam~aA★",
"tiloka⚓These⚓V|PERF|LEM:baraza|ROOT:brz|3MP★'aAya`tu⚓(are the) Verses⚓ PN|LEM:jaAluwt|GEN★{ll~ahi⚓(of) Allah,⚓ N|LEM:jund|ROOT:jnd|MP|GEN★natoluwhaA⚓We recite them⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★Ealayoka⚓to you⚓ N|LEM:rab~|ROOT:rbb|M|ACC★bi{loHaq~i⚓in [the] truth.⚓ V|IMPV|(IV)|LEM:>aforigo|ROOT:frg|2MS★wa<in~aka⚓And indeed, you⚓ P|LEM:EalaY`★lamina⚓(are) surely of⚓ N|LEM:Sabor|ROOT:Sbr|M|INDEF|ACC★{lomurosaliyna⚓the Messengers.⚓ V|IMPV|(II)|LEM:vab~ato|ROOT:vbt|2MS★",
"tiloka⚓**These (are) the Messengers⚓N|LEM:qadam|ROOT:qdm|MP|ACC★{lr~usulu⚓**These (are) the Messengers⚓ V|IMPV|LEM:naSara|ROOT:nSr|2MS★faD~alonaA⚓We (have) preferred⚓ P|LEM:EalaY`★baEoDahumo⚓some of them⚓ N|LEM:qawom|ROOT:qwm|M|GEN★EalaY`⚓over⚓ ADJ|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|GEN★baEoDK⚓others.⚓ V|PERF|LEM:hazamu|ROOT:hzm|3MP★m~inohum⚓Among them⚓ N|LEM:<i*on|ROOT:A*n|M|GEN★m~an⚓(were those with) whom⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★kal~ama⚓**Allah spoke,⚓ V|PERF|LEM:qatala|ROOT:qtl|3MS★{ll~ahu⚓**Allah spoke,⚓ PN|LEM:daAwud|NOM★warafaEa⚓and He raised⚓ PN|LEM:jaAluwt|ACC★baEoDahumo⚓some of them⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|3MS★daraja`tK⚓(in) degrees.⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★wa'aAtayonaA⚓And We gave⚓ N|LEM:mulok|ROOT:mlk|M|ACC★EiysaY⚓Isa,⚓ N|LEM:Hikomap|ROOT:Hkm|F|ACC★{bona⚓son⚓ V|PERF|(II)|LEM:Eal~ama|ROOT:Elm|3MS★maroyama⚓(of) Maryam,⚓ P|LEM:min★{lobay~ina`ti⚓the clear proofs⚓ REL|LEM:maA★wa>ay~adona`hu⚓and We supported him⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★biruwHi⚓with Spirit⚓ COND|LEM:lawolaA^★{loqudusi⚓[the] Holy.⚓ N|VN|LEM:dafoE|ROOT:dfE|M|NOM★walawo⚓And if⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★$aA^'a⚓**Allah (had) willed⚓ N|LEM:n~aAs|ROOT:nws|MP|ACC★{ll~ahu⚓**Allah (had) willed⚓ N|LEM:baEoD|ROOT:bED|M|ACC★maA⚓**(would have) not fought each other⚓ N|LEM:baEoD|ROOT:bED|M|INDEF|GEN★{qotatala⚓**(would have) not fought each other⚓ V|PERF|LEM:fasadati|ROOT:fsd|3FS★{l~a*iyna⚓those who⚓ N|LEM:>aroD|ROOT:ArD|F|NOM★min[⚓**(came) after them,⚓ ACC|LEM:la`kin~|SP:<in~★baEodihim⚓**(came) after them,⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★m~in[⚓**after⚓ N|LEM:*uw|MS|NOM★baEodi⚓**after⚓ N|LEM:faDol|ROOT:fDl|M|INDEF|GEN★maA⚓[what]⚓ P|LEM:EalaY`★jaA^'atohumu⚓came to them⚓ N|LEM:Ea`lamiyn|ROOT:Elm|MP|GEN★{lobay~ina`tu⚓the clear proofs.⚓ DEM|LEM:*a`lik|FS★wala`kini⚓[And] but⚓ N|LEM:'aAyap|ROOT:Ayy|FP|NOM★{xotalafuwA@⚓they differed,⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★faminohum⚓[so] of them⚓ V|IMPF|LEM:talaY`|ROOT:tlw|1P★m~ano⚓(are some) who⚓ P|LEM:EalaY`★'aAmana⚓believed⚓ N|LEM:Haq~|ROOT:Hqq|M|GEN★waminohum⚓and of them⚓ ACC|LEM:<in~|SP:<in~★m~an⚓(are some) who⚓ P|LEM:min★kafara⚓denied.⚓ N|PASS|PCPL|(IV)|LEM:m~urosal|ROOT:rsl|MP|GEN★walawo⚓And if⚓ DEM|LEM:*a`lik|FS★$aA^'a⚓**Allah (had) willed⚓ N|LEM:rasuwl|ROOT:rsl|MP|NOM★{ll~ahu⚓**Allah (had) willed⚓ V|PERF|(II)|LEM:faD~ala|ROOT:fDl|1P★maA⚓**they (would have) not fought each other,⚓ N|LEM:baEoD|ROOT:bED|M|ACC★{qotataluwA@⚓**they (would have) not fought each other,⚓ P|LEM:EalaY`★wala`kin~a⚓[and] but⚓ N|LEM:baEoD|ROOT:bED|M|INDEF|GEN★{ll~aha⚓Allah⚓ P|LEM:min★yafoEalu⚓does⚓ REL|LEM:man★maA⚓what⚓ V|PERF|(II)|LEM:kal~ama|ROOT:klm|3MS★yuriydu⚓He intends.⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★",
"ya`^>ay~uhaA⚓O you⚓V|PERF|LEM:rafaEa|ROOT:rfE|3MS★{l~a*iyna⚓who⚓ N|LEM:baEoD|ROOT:bED|M|ACC★'aAmanuw^A@⚓believe[d]!⚓ N|LEM:darajap|ROOT:drj|FP|INDEF|ACC★>anfiquwA@⚓Spend⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|1P★mim~aA⚓of what⚓ PN|LEM:EiysaY|ACC★razaqona`kum⚓We (have) provided you,⚓ N|LEM:{bon|ROOT:bny|M|ACC★m~in⚓**before⚓ PN|LEM:maroyam|F|GEN★qaboli⚓**before⚓ N|LEM:bay~inap|ROOT:byn|FP|ACC★>an⚓that⚓ V|PERF|(II)|LEM:>ay~ada|ROOT:Ayd|1P★ya>otiYa⚓comes⚓ N|LEM:ruwH|ROOT:rwH|M|GEN★yawomN⚓a Day⚓ N|LEM:qudus|ROOT:qds|M|GEN★l~aA⚓no⚓ COND|LEM:law★bayoEN⚓bargaining⚓ V|PERF|LEM:$aA^'a|ROOT:$yA|3MS★fiyhi⚓in it⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★walaA⚓and no⚓ NEG|LEM:maA★xul~apN⚓friendship⚓ V|PERF|(VIII)|LEM:{qotatala|ROOT:qtl|3MS★walaA⚓and no⚓ REL|LEM:{l~a*iY|MP★$afa`EapN⚓intercession.⚓ P|LEM:min★wa{loka`firuwna⚓And the deniers -⚓ N|LEM:baEod|ROOT:bEd|GEN★humu⚓they⚓ P|LEM:min★{lZ~a`limuwna⚓(are) the wrongdoers.⚓ N|LEM:baEod|ROOT:bEd|GEN★",
"{ll~ahu⚓Allah -⚓REL|LEM:maA★laA^⚓(there is) no⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3FS★<ila`ha⚓God⚓ N|LEM:bay~inap|ROOT:byn|FP|NOM★<il~aA⚓except⚓ AMD|LEM:la`kin★huwa⚓Him,⚓ V|PERF|(VIII)|LEM:{xotalafa|ROOT:xlf|3MP★{loHaY~u⚓the Ever-Living,⚓ P|LEM:min★{loqay~uwmu⚓the Sustainer of all that exists.⚓ REL|LEM:man★laA⚓Not⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MS★ta>oxu*uhu,⚓overtakes Him⚓ P|LEM:min★sinapN⚓slumber⚓ REL|LEM:man★walaA⚓[and] not⚓ V|PERF|LEM:kafara|ROOT:kfr|3MS★nawomN⚓sleep.⚓ COND|LEM:law★l~ahu,⚓To Him (belongs)⚓ V|PERF|LEM:$aA^'a|ROOT:$yA|3MS★maA⚓what(ever)⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★fiY⚓(is) in⚓ NEG|LEM:maA★{ls~ama`wa`ti⚓the heavens⚓ V|PERF|(VIII)|LEM:{qotatala|ROOT:qtl|3MP★wamaA⚓and what(ever)⚓ ACC|LEM:la`kin~|SP:<in~★fiY⚓(is) in⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★{lo>aroDi⚓the earth.⚓ V|IMPF|LEM:faEala|ROOT:fEl|3MS★man⚓Who⚓ REL|LEM:maA★*aA⚓**(is) the one who⚓ V|IMPF|(IV)|LEM:>araAda|ROOT:rwd|3MS★{l~a*iY⚓**(is) the one who⚓ N|LEM:>ay~uhaA|NOM★ya$ofaEu⚓(can) intercede⚓ REL|LEM:{l~a*iY|MP★Eindahu,^⚓with Him⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★<il~aA⚓except⚓ V|IMPV|(IV)|LEM:>anfaqa|ROOT:nfq|2MP★bi<i*onihi.⚓by His permission.⚓ P|LEM:min★yaEolamu⚓He knows⚓ REL|LEM:maA★maA⚓what⚓ V|PERF|LEM:razaqa|ROOT:rzq|1P★bayona⚓**(is) before them⚓ P|LEM:min★>ayodiyhimo⚓**(is) before them⚓ N|LEM:qabol|ROOT:qbl|GEN★wamaA⚓and what⚓ SUB|LEM:>an★xalofahumo⚓(is) behind them.⚓ V|IMPF|LEM:>ataY|ROOT:Aty|3MS|MOOD:SUBJ★walaA⚓And not⚓ N|LEM:yawom|ROOT:ywm|M|INDEF|NOM★yuHiyTuwna⚓they encompass⚓ NEG|LEM:laA|SP:kaAn★bi$aYo'K⚓anything⚓ N|LEM:bayoE|ROOT:byE|M|INDEF|NOM★m~ino⚓of⚓ P|LEM:fiY★Eilomihi.^⚓His Knowledge⚓ NEG|LEM:laA|SP:kaAn★<il~aA⚓except⚓ N|LEM:xul~ap|ROOT:xll|F|INDEF|NOM★bimaA⚓[of] what⚓ NEG|LEM:laA|SP:kaAn★$aA^'a⚓He willed.⚓ N|LEM:$afa`Eap|ROOT:$fE|F|INDEF|NOM★wasiEa⚓Extends⚓ N|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|NOM★kurosiy~uhu⚓His Throne⚓ PRON|3MP★{ls~ama`wa`ti⚓(to) the heavens⚓ N|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|NOM★wa{lo>aroDa⚓and the earth.⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★walaA⚓And not⚓ NEG|LEM:laA|SP:<in~★ya_#uwduhu,⚓tires Him⚓ N|LEM:<ila`h|ROOT:Alh|MS|ACC★HifoZuhumaA⚓(the) guarding of both of them.⚓ EXP|LEM:<il~aA★wahuwa⚓And He⚓ PRON|3MS★{loEaliY~u⚓(is) the Most High,⚓ N|LEM:Hay~|ROOT:Hyy|MS|NOM★{loEaZiymu⚓the Most Great.⚓ ADJ|LEM:qay~uwm|ROOT:qwm|MS|NOM★",
"laA^⚓(There is) no⚓NEG|LEM:laA★<ikoraAha⚓compulsion⚓ V|IMPF|LEM:>axa*a|ROOT:Ax*|3FS★fiY⚓in⚓ N|LEM:sinap|ROOT:wsn|F|INDEF|NOM★{ld~iyni⚓the religion.⚓ NEG|LEM:laA★qad⚓Surely⚓ N|LEM:nawom|ROOT:nwm|M|INDEF|NOM★t~abay~ana⚓has become distinct⚓ PRON|3MS★{lr~u$odu⚓the right (path)⚓ REL|LEM:maA★mina⚓from⚓ P|LEM:fiY★{logaY~i⚓the wrong.⚓ N|LEM:samaA^'|ROOT:smw|FP|GEN★faman⚓Then whoever⚓ REL|LEM:maA★yakofuro⚓disbelieves⚓ P|LEM:fiY★bi{lT~a`guwti⚓in false deities⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★wayu&omin[⚓and believes⚓ INTG|LEM:man★bi{ll~ahi⚓in Allah,⚓ DEM|LEM:*aA|MS★faqadi⚓then surely⚓ REL|LEM:{l~a*iY|MS★{sotamosaka⚓he grasped⚓ V|IMPF|LEM:ya$ofaEu|ROOT:$fE|3MS★bi{loEurowapi⚓the handhold -⚓ LOC|LEM:Eind|ROOT:End|ACC★{lowuvoqaY`⚓[the] firm,⚓ EXP|LEM:<il~aA★laA⚓**(which will) not break⚓ N|LEM:<i*on|ROOT:A*n|M|GEN★{nfiSaAma⚓**(which will) not break⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MS★lahaA⚓[for it].⚓ REL|LEM:maA★wa{ll~ahu⚓And Allah⚓ LOC|LEM:bayon|ROOT:byn|ACC★samiyEN⚓(is) All-Hearing,⚓ N|LEM:yad|ROOT:ydy|FP|GEN★EaliymN⚓All-Knowing.⚓ REL|LEM:maA★",
"{ll~ahu⚓Allah⚓LOC|LEM:xalof|ROOT:xlf|M|ACC★waliY~u⚓(is the) Protecting Guardian⚓ NEG|LEM:laA★{l~a*iyna⚓(of) those who⚓ V|IMPF|(IV)|LEM:>aHaATa|ROOT:HwT|3MP★'aAmanuwA@⚓believe[d].⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★yuxorijuhum⚓He brings them out⚓ P|LEM:min★m~ina⚓from⚓ N|LEM:Eilom|ROOT:Elm|M|GEN★{lZ~uluma`ti⚓[the] darkness⚓ RES|LEM:<il~aA★<ilaY⚓towards⚓ REL|LEM:maA★{ln~uwri⚓[the] light.⚓ V|PERF|LEM:$aA^'a|ROOT:$yA|3MS★wa{l~a*iyna⚓And those who⚓ V|PERF|LEM:wasiEa|ROOT:wsE|3MS★kafaruw^A@⚓disbelieve(d)⚓ N|LEM:kurosiy~|ROOT:krs|M|NOM★>awoliyaA^&uhumu⚓their guardians⚓ N|LEM:samaA^'|ROOT:smw|FP|ACC★{lT~a`guwtu⚓(are) the evil ones,⚓ N|LEM:>aroD|ROOT:ArD|F|ACC★yuxorijuwnahum⚓they bring them out⚓ NEG|LEM:laA★m~ina⚓from⚓ V|IMPF|LEM:ya_#uwdu|ROOT:Awd|3MS★{ln~uwri⚓the light⚓ N|LEM:HifoZ|ROOT:HfZ|M|NOM★<ilaY⚓towards⚓ PRON|3MS★{lZ~uluma`ti⚓the darkness.⚓ N|LEM:Ealiy~|ROOT:Elw|MS|NOM★>uw@la`^}ika⚓Those⚓ ADJ|LEM:EaZiym|ROOT:EZm|MS|NOM★>aSoHa`bu⚓(are the) companions⚓ NEG|LEM:laA|SP:<in~★{ln~aAri⚓(of) the Fire,⚓ N|VN|(IV)|LEM:<ikoraAh|ROOT:krh|M|ACC★humo⚓they⚓ P|LEM:fiY★fiyhaA⚓in it⚓ N|LEM:diyn|ROOT:dyn|M|GEN★xa`liduwna⚓will abide forever.⚓ CERT|LEM:qad★",
">alamo⚓Did not⚓V|PERF|(V)|LEM:tabay~ana|ROOT:byn|3MS★tara⚓you see⚓ N|LEM:ru$od|ROOT:r$d|M|NOM★<ilaY⚓[towards]⚓ P|LEM:min★{l~a*iY⚓the one who⚓ N|LEM:gay~|ROOT:gwy|M|GEN★HaA^j~a⚓argued⚓ COND|LEM:man★<ibora`hi.ma⚓(with) Ibrahim⚓ V|IMPF|LEM:kafara|ROOT:kfr|3MS|MOOD:JUS★fiY⚓concerning⚓ N|LEM:T~a`guwt|ROOT:Tgy|GEN★rab~ihi.^⚓his Lord,⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MS|MOOD:JUS★>ano⚓because⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★'aAtaY`hu⚓**Allah gave him⚓ CERT|LEM:qad★{ll~ahu⚓**Allah gave him⚓ V|PERF|(X)|LEM:{sotamosaka|ROOT:msk|3MS★{lomuloka⚓the kingdom?⚓ N|LEM:Eurowap|ROOT:Erw|F|GEN★<i*o⚓When⚓ ADJ|LEM:wuvoqaY`|ROOT:wvq|FS|GEN★qaAla⚓**Ibrahim said,⚓ NEG|LEM:laA|SP:<in~★<ibora`hi.mu⚓**Ibrahim said,⚓ N|VN|(VII)|LEM:{nfiSaAm|ROOT:fSm|M|ACC★rab~iYa⚓`My Lord⚓ PRON|3FS★{l~a*iY⚓(is) the One Who⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★yuHoYi.⚓grants life⚓ N|LEM:samiyE|ROOT:smE|MS|INDEF|NOM★wayumiytu⚓and causes death.`⚓ ADJ|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★qaAla⚓He said,⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★>anaA\"⚓`I⚓ N|LEM:waliY~|ROOT:wly|M|NOM★>uHoYi.⚓give life⚓ REL|LEM:{l~a*iY|MP★wa>umiytu⚓and cause death.`⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★qaAla⚓Said⚓ V|IMPF|(IV)|LEM:>axoraja|ROOT:xrj|3MS★<ibora`hi.mu⚓Ibrahim,⚓ P|LEM:min★fa<in~a⚓`[Then] indeed⚓ N|LEM:Zuluma`t|ROOT:Zlm|FP|GEN★{ll~aha⚓Allah⚓ P|LEM:<ilaY`★ya>otiY⚓brings up⚓ N|LEM:nuwr|ROOT:nwr|M|GEN★bi{l$~amosi⚓the sun⚓ REL|LEM:{l~a*iY|MP★mina⚓from⚓ V|PERF|LEM:kafara|ROOT:kfr|3MP★{loma$oriqi⚓the east,⚓ N|LEM:waliY~|ROOT:wly|MP|NOM★fa>oti⚓so you bring⚓ N|LEM:T~a`guwt|ROOT:Tgy|NOM★bihaA⚓it⚓ V|IMPF|(IV)|LEM:>axoraja|ROOT:xrj|3MP★mina⚓from⚓ P|LEM:min★{lomagoribi⚓the west`.⚓ N|LEM:nuwr|ROOT:nwr|M|GEN★fabuhita⚓So became dumbfounded⚓ P|LEM:<ilaY`★{l~a*iY⚓the one who⚓ N|LEM:Zuluma`t|ROOT:Zlm|FP|GEN★kafara⚓disbelieved,⚓ DEM|LEM:>uwla`^}ik|P★wa{ll~ahu⚓and Allah⚓ N|LEM:>aSoHa`b|ROOT:SHb|MP|NOM★laA⚓(does) not⚓ N|LEM:naAr|ROOT:nwr|F|GEN★yahodiY⚓guide⚓ PRON|3MP★{loqawoma⚓the people⚓ P|LEM:fiY★{lZ~a`limiyna⚓(who are) [the] wrongdoers.⚓ N|ACT|PCPL|LEM:xa`lid|ROOT:xld|MP|NOM★",
">awo⚓Or⚓NEG|LEM:lam★ka{l~a*iY⚓like the one who⚓ V|IMPF|LEM:ra'aA|ROOT:rAy|2MS|MOOD:JUS★mar~a⚓passed⚓ P|LEM:<ilaY`★EalaY`⚓by⚓ REL|LEM:{l~a*iY|MS★qaroyapK⚓a township,⚓ V|PERF|(III)|LEM:HaA^j~a|ROOT:Hjj|3MS★wahiYa⚓and it⚓ PN|LEM:<iboraAhiym|M|ACC★xaAwiyapN⚓(had) overturned⚓ P|LEM:fiY★EalaY`⚓on⚓ N|LEM:rab~|ROOT:rbb|M|GEN★Euruw$ihaA⚓its roofs.⚓ SUB|LEM:>an★qaAla⚓He said,⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|3MS★>an~aY`⚓`How⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★yuHoYi.⚓will bring to life⚓ N|LEM:mulok|ROOT:mlk|M|ACC★ha`*ihi⚓this (town)⚓ T|LEM:<i*★{ll~ahu⚓Allah⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★baEoda⚓after⚓ PN|LEM:<iboraAhiym|M|NOM★mawotihaA⚓its death?`⚓ N|LEM:rab~|ROOT:rbb|M|NOM★fa>amaAtahu⚓**Then Allah caused him to die⚓ REL|LEM:{l~a*iY|MS★{ll~ahu⚓**Then Allah caused him to die⚓ V|IMPF|(IV)|LEM:>aHoyaA|ROOT:Hyy|3MS★miA@}apa⚓(for) a hundred⚓ V|IMPF|(IV)|LEM:>amaAta|ROOT:mwt|3MS★EaAmK⚓year(s),⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★vum~a⚓then⚓ PRON|1S★baEavahu,⚓He raised him.⚓ V|IMPF|(IV)|LEM:>aHoyaA|ROOT:Hyy|1S★qaAla⚓He said,⚓ V|IMPF|(IV)|LEM:>amaAta|ROOT:mwt|1S★kamo⚓`How long⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★labivota⚓(have) you remained?`⚓ PN|LEM:<iboraAhiym|M|NOM★qaAla⚓He said,⚓ ACC|LEM:<in~|SP:<in~★labivotu⚓`I remained⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★yawomFA⚓(for) a day⚓ V|IMPF|LEM:>ataY|ROOT:Aty|3MS★>awo⚓or⚓ N|LEM:$amos|ROOT:$ms|F|GEN★baEoDa⚓a part⚓ P|LEM:min★yawomK⚓(of) a day.`⚓ N|LEM:ma$oriq|ROOT:$rq|M|GEN★qaAla⚓He said,⚓ V|IMPV|LEM:>ataY|ROOT:Aty|2MS★bal⚓`Nay,⚓ PRON|3FS★l~abivota⚓you (have) remained⚓ P|LEM:min★miA@}apa⚓one hundred⚓ N|LEM:magorib|ROOT:grb|M|GEN★EaAmK⚓year(s).⚓ V|PERF|PASS|LEM:buhita|ROOT:bht|3MS★fa{nZuro⚓Then look⚓ REL|LEM:{l~a*iY|MS★<ilaY`⚓at⚓ V|PERF|LEM:kafara|ROOT:kfr|3MS★TaEaAmika⚓your food⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★wa$araAbika⚓and your drink,⚓ NEG|LEM:laA★lamo⚓(they did) not⚓ V|IMPF|LEM:hadaY|ROOT:hdy|3MS★yatasan~aho⚓change with time,⚓ N|LEM:qawom|ROOT:qwm|M|ACC★wa{nZuro⚓and look⚓ ADJ|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|ACC★<ilaY`⚓at⚓ CONJ|LEM:>aw★HimaArika⚓your donkey,⚓ REL|LEM:{l~a*iY|MS★walinajoEalaka⚓and We will make you⚓ V|PERF|LEM:mar~a|ROOT:mrr|3MS★'aAyapF⚓a sign⚓ P|LEM:EalaY`★l~iln~aAsi⚓for the people.⚓ N|LEM:qaroyap|ROOT:qry|F|INDEF|GEN★wa{nZuro⚓And look⚓ PRON|3FS★<ilaY⚓at⚓ N|ACT|PCPL|LEM:xaAwiyap|ROOT:xwy|F|INDEF|NOM★{loEiZaAmi⚓the bones⚓ P|LEM:EalaY`★kayofa⚓how⚓ N|LEM:Earo$|ROOT:Er$|MP|GEN★nun$izuhaA⚓We raise them,⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★vum~a⚓then⚓ INTG|LEM:>an~aY`|ROOT:Any★nakosuwhaA⚓We cover them⚓ V|IMPF|(IV)|LEM:>aHoyaA|ROOT:Hyy|3MS★laHomFA⚓(with) flesh.`⚓ DEM|LEM:ha`*aA|FS★falam~aA⚓Then when⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★tabay~ana⚓became clear⚓ T|LEM:baEod|ROOT:bEd|ACC★lahu,⚓to him,⚓ N|LEM:mawot|ROOT:mwt|M|GEN★qaAla⚓he said,⚓ V|PERF|(IV)|LEM:>amaAta|ROOT:mwt|3MS★>aEolamu⚓`I know⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★>an~a⚓that⚓ N|LEM:miA}ap|ROOT:mAy|F|ACC★{ll~aha⚓Allah⚓ N|LEM:EaAm|ROOT:Ewm|M|INDEF|GEN★EalaY`⚓(is) on⚓ CONJ|LEM:vum~★kul~i⚓every⚓ V|PERF|LEM:baEava|ROOT:bEv|3MS★$aYo'K⚓thing⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★qadiyrN⚓All-Powerful.`⚓ INTG|LEM:kam★",
"wa<i*o⚓And when⚓V|PERF|LEM:labiva|ROOT:lbv|2MS★qaAla⚓said⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★<ibora`hi.mu⚓Ibrahim,⚓ V|PERF|LEM:labiva|ROOT:lbv|1S★rab~i⚓`My Lord⚓ N|LEM:yawom|ROOT:ywm|M|INDEF|ACC★>ariniY⚓show me⚓ CONJ|LEM:>aw★kayofa⚓how⚓ N|LEM:baEoD|ROOT:bED|M|ACC★tuHoYi⚓You give life⚓ N|LEM:yawom|ROOT:ywm|M|INDEF|GEN★{lomawotaY`⚓(to) the dead.`⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★qaAla⚓He said,⚓ RET|LEM:bal★>awalamo⚓`Have not⚓ V|PERF|LEM:labiva|ROOT:lbv|2MS★tu&omin⚓you believed?`⚓ N|LEM:miA}ap|ROOT:mAy|F|ACC★qaAla⚓He said,⚓ N|LEM:EaAm|ROOT:Ewm|M|INDEF|GEN★balaY`⚓`Yes⚓ V|IMPV|LEM:n~aZara|ROOT:nZr|2MS★wala`kin⚓[and] but⚓ P|LEM:<ilaY`★l~iyaToma}in~a⚓to satisfy⚓ N|LEM:TaEaAm|ROOT:TEm|M|GEN★qalobiY⚓my heart.`⚓ N|LEM:$araAb|ROOT:$rb|M|GEN★qaAla⚓He said⚓ NEG|LEM:lam★faxu*o⚓`Then take⚓ V|IMPF|(V)|LEM:yatasan~aho|ROOT:snh|3MS|MOOD:JUS★>arobaEapF⚓four⚓ V|IMPV|LEM:n~aZara|ROOT:nZr|2MS★m~ina⚓of⚓ P|LEM:<ilaY`★{lT~ayori⚓the birds⚓ N|LEM:HimaAr|ROOT:Hmr|M|GEN★faSurohun~a⚓and incline them⚓ V|IMPF|LEM:jaEala|ROOT:jEl|1P|MOOD:SUBJ★<ilayoka⚓towards you,⚓ N|LEM:'aAyap|ROOT:Ayy|FS|INDEF|ACC★vum~a⚓then⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★{joEalo⚓put⚓ V|IMPV|LEM:n~aZara|ROOT:nZr|2MS★EalaY`⚓on⚓ P|LEM:<ilaY`★kul~i⚓each⚓ N|LEM:EaZiym|ROOT:EZm|MP|GEN★jabalK⚓hill⚓ INTG|LEM:kayof|ROOT:kyf★m~inohun~a⚓**a portion of them;⚓ V|IMPF|(IV)|LEM:nun$izu|ROOT:n$z|1P★juzo'FA⚓**a portion of them;⚓ CONJ|LEM:vum~★vum~a⚓then⚓ V|IMPF|LEM:kasawo|ROOT:ksw|1P★{doEuhun~a⚓call them,⚓ N|LEM:laHom|ROOT:lHm|M|INDEF|ACC★ya>otiynaka⚓they will come to you⚓ T|LEM:lam~aA★saEoyFA⚓(in) haste.⚓ V|PERF|(V)|LEM:tabay~ana|ROOT:byn|3MS★wa{Eolamo⚓And know⚓ PRON|3MS★>an~a⚓that⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★{ll~aha⚓Allah⚓ V|IMPF|LEM:Ealima|ROOT:Elm|1S★EaziyzN⚓(is) All-Mighty,⚓ ACC|LEM:>an~|SP:<in~★HakiymN⚓All-Wise.⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★",
"m~avalu⚓Example⚓P|LEM:EalaY`★{l~a*iyna⚓(of) those who⚓ N|LEM:kul~|ROOT:kll|M|GEN★yunfiquwna⚓spend⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★>amowa`lahumo⚓their wealth⚓ N|LEM:qadiyr|ROOT:qdr|M|INDEF|NOM★fiY⚓in⚓ T|LEM:<i*★sabiyli⚓(the) way⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★{ll~ahi⚓(of) Allah,⚓ PN|LEM:<iboraAhiym|M|NOM★kamavali⚓(is) like⚓ N|LEM:rab~|ROOT:rbb|M|ACC★Hab~apK⚓a grain⚓ V|IMPV|(IV)|LEM:>arayo|ROOT:rAy|2MS★>an[batato⚓which grows⚓ INTG|LEM:kayof|ROOT:kyf★saboEa⚓seven⚓ V|IMPF|(IV)|LEM:>aHoyaA|ROOT:Hyy|2MS★sanaAbila⚓ears,⚓ N|LEM:m~ay~it|ROOT:mwt|P|NOM★fiY⚓in⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★kul~i⚓each⚓ NEG|LEM:lam★sun[bulapK⚓ear⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|2MS|MOOD:JUS★m~iA@}apu⚓hundred⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★Hab~apK⚓grain(s).⚓ ANS|LEM:balaY`★wa{ll~ahu⚓And Allah⚓ AMD|LEM:la`kin★yuDa`Eifu⚓gives manifold⚓ V|IMPF|(XII)|LEM:{Toma>an~a|ROOT:Tmn|3MS|MOOD:SUBJ★liman⚓to whom⚓ N|LEM:qalob|ROOT:qlb|FS|NOM★ya$aA^'u⚓He wills.⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MS★wa{ll~ahu⚓And Allah⚓ V|IMPV|LEM:>axa*a|ROOT:Ax*|2MS★wa`siEN⚓(is) All-Encompassing,⚓ N|LEM:>arobaEap|ROOT:rbE|F|INDEF|ACC★EaliymN⚓All-Knowing.⚓ P|LEM:min★",
"{l~a*iyna⚓Those who⚓N|LEM:Tayor|ROOT:Tyr|M|GEN★yunfiquwna⚓spend⚓ V|IMPV|LEM:Suro|ROOT:Swr|2MS★>amowa`lahumo⚓their wealth⚓ P|LEM:<ilaY`★fiY⚓in⚓ CONJ|LEM:vum~★sabiyli⚓(the) way⚓ V|IMPV|LEM:jaEala|ROOT:jEl|2MS★{ll~ahi⚓(of) Allah⚓ P|LEM:EalaY`★vum~a⚓then⚓ N|LEM:kul~|ROOT:kll|M|GEN★laA⚓not⚓ N|LEM:jabal|ROOT:jbl|M|INDEF|GEN★yutobiEuwna⚓they follow⚓ P|LEM:min★maA^⚓what⚓ N|LEM:juzo'|ROOT:jzA|M|INDEF|ACC★>anfaquwA@⚓they spend⚓ CONJ|LEM:vum~★man~FA⚓(with) reminders of generosity⚓ V|IMPV|LEM:daEaA|ROOT:dEw|2MS★walaA^⚓and not⚓ V|IMPF|LEM:>ataY|ROOT:Aty|3FP★>a*FY⚓hurt -⚓ N|LEM:saEoy|ROOT:sEy|M|INDEF|ACC★l~ahumo⚓for them⚓ V|IMPV|LEM:Ealima|ROOT:Elm|2MS★>ajoruhumo⚓their reward⚓ ACC|LEM:>an~|SP:<in~★Einda⚓(is) with⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★rab~ihimo⚓their Lord,⚓ N|LEM:Eaziyz|ROOT:Ezz|MS|INDEF|NOM★walaA⚓and (there will be) no⚓ ADJ|LEM:Hakiym|ROOT:Hkm|MS|INDEF|NOM★xawofN⚓fear⚓ N|LEM:maval|ROOT:mvl|M|NOM★Ealayohimo⚓on them⚓ REL|LEM:{l~a*iY|MP★walaA⚓and not⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|3MP★humo⚓they⚓ N|LEM:maAl|ROOT:mwl|MP|ACC★yaHozanuwna⚓will grieve.⚓ P|LEM:fiY★",
"qawolN⚓A word⚓N|LEM:sabiyl|ROOT:sbl|M|GEN★m~aEoruwfN⚓kind⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wamagofirapN⚓and (seeking) forgiveness⚓ N|LEM:maval|ROOT:mvl|M|GEN★xayorN⚓(are) better⚓ N|LEM:Hab~ap|ROOT:Hbb|F|INDEF|GEN★m~in⚓than⚓ V|PERF|(IV)|LEM:>an[bata|ROOT:nbt|3FS★SadaqapK⚓a charity⚓ N|LEM:saboE|ROOT:sbE|M|ACC★yatobaEuhaA^⚓followed [it]⚓ N|LEM:sunbulap|ROOT:snbl|MP|GEN★>a*FY⚓(by) hurt.⚓ P|LEM:fiY★wa{ll~ahu⚓And Allah⚓ N|LEM:kul~|ROOT:kll|M|GEN★ganiY~N⚓(is) All-Sufficient,⚓ N|LEM:sunbulap|ROOT:snbl|F|INDEF|GEN★HaliymN⚓All-Forbearing.⚓ N|LEM:miA}ap|ROOT:mAy|F|NOM★",
"ya`^>ay~uhaA⚓O you⚓N|LEM:Hab~ap|ROOT:Hbb|F|INDEF|GEN★{l~a*iyna⚓who⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★'aAmanuwA@⚓believe[d]!⚓ V|IMPF|(III)|LEM:yuDa`Eifu|ROOT:DEf|3MS★laA⚓(Do) not⚓ REL|LEM:man★tuboTiluwA@⚓render in vain⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★Sadaqa`tikum⚓your charities⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★bi{loman~i⚓with reminders (of it)⚓ N|ACT|PCPL|LEM:wa`siE|ROOT:wsE|M|INDEF|NOM★wa{lo>a*aY`⚓or [the] hurt,⚓ ADJ|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★ka{l~a*iY⚓like the one who⚓ REL|LEM:{l~a*iY|MP★yunfiqu⚓spends⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|3MP★maAlahu,⚓his wealth⚓ N|LEM:maAl|ROOT:mwl|MP|ACC★ri}aA^'a⚓(to) be seen⚓ P|LEM:fiY★{ln~aAsi⚓(by) the people,⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★walaA⚓and (does) not⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★yu&ominu⚓believe⚓ CONJ|LEM:vum~★bi{ll~ahi⚓in Allah⚓ NEG|LEM:laA★wa{loyawomi⚓and the Day⚓ V|IMPF|(IV)|LEM:>atobaEa|ROOT:tbE|3MP★{lo'aAxiri⚓[the] Last.⚓ REL|LEM:maA★famavaluhu,⚓Then his example⚓ V|PERF|(IV)|LEM:>anfaqa|ROOT:nfq|3MP★kamavali⚓(is) like⚓ N|LEM:man~|ROOT:mnn|M|INDEF|ACC★SafowaAnK⚓(that of a) smooth rock⚓ NEG|LEM:laA★Ealayohi⚓upon it⚓ N|LEM:>a*FY|ROOT:A*y|M|INDEF|ACC★turaAbN⚓(is) dust,⚓ PRON|3MP★fa>aSaAbahu,⚓then fell on it⚓ N|LEM:>ajor|ROOT:Ajr|M|NOM★waAbilN⚓heavy rain,⚓ LOC|LEM:Eind|ROOT:End|ACC★fatarakahu,⚓then left it⚓ N|LEM:rab~|ROOT:rbb|M|GEN★SalodFA⚓bare.⚓ NEG|LEM:laA★l~aA⚓Not⚓ N|LEM:xawof|ROOT:xwf|M|INDEF|NOM★yaqodiruwna⚓they have control⚓ P|LEM:EalaY`★EalaY`⚓on⚓ NEG|LEM:laA★$aYo'K⚓anything⚓ PRON|3MP★m~im~aA⚓of what⚓ V|IMPF|LEM:yaHozun|ROOT:Hzn|3MP★kasabuwA@⚓they (have) earned.⚓ N|VN|LEM:qawol|ROOT:qwl|M|INDEF|NOM★wa{ll~ahu⚓And Allah⚓ ADJ|PASS|PCPL|LEM:m~aEoruwf|ROOT:Erf|M|INDEF|NOM★laA⚓(does) not⚓ N|LEM:m~agofirap|ROOT:gfr|F|INDEF|NOM★yahodiY⚓guide⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★{loqawoma⚓the people⚓ P|LEM:min★{loka`firiyna⚓[the] disbelieving.⚓ N|LEM:Sadaqap|ROOT:Sdq|F|INDEF|GEN★",
"wamavalu⚓And (the) example⚓V|IMPF|LEM:tabiEa|ROOT:tbE|3MS★{l~a*iyna⚓(of) those who⚓ N|LEM:>a*FY|ROOT:A*y|M|INDEF|NOM★yunfiquwna⚓spend⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★>amowa`lahumu⚓their wealth⚓ N|LEM:ganiY~|ROOT:gny|MS|INDEF|NOM★{botigaA^'a⚓seeking⚓ ADJ|LEM:Haliym|ROOT:Hlm|MS|INDEF|NOM★maroDaAti⚓(the) pleasure⚓ N|LEM:>ay~uhaA|NOM★{ll~ahi⚓(of) Allah,⚓ REL|LEM:{l~a*iY|MP★watavobiytFA⚓and certainty⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★m~ino⚓from⚓ PRO|LEM:laA★>anfusihimo⚓their (inner) souls,⚓ V|IMPF|(IV)|LEM:yuboTila|ROOT:bTl|2MP|MOOD:JUS★kamavali⚓(is) like⚓ N|LEM:Sadaqa`t|ROOT:Sdq|FP|ACC★jan~apK]⚓a garden⚓ N|LEM:man~|ROOT:mnn|M|GEN★birabowapK⚓on a height,⚓ N|LEM:>a*FY|ROOT:A*y|M|GEN★>aSaAbahaA⚓fell on it⚓ REL|LEM:{l~a*iY|MS★waAbilN⚓heavy rain⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|3MS★fa_#aAtato⚓so it yielded⚓ N|LEM:maAl|ROOT:mwl|M|ACC★>ukulahaA⚓its harvest⚓ N|VN|(III)|LEM:ri}aA^'|ROOT:rAy|M|ACC★DiEofayoni⚓double.⚓ N|LEM:n~aAs|ROOT:nws|MP|GEN★fa<in⚓Then if⚓ NEG|LEM:laA★l~amo⚓(does) not⚓ V|IMPF|(IV)|LEM:'aAmana|ROOT:Amn|3MS★yuSibohaA⚓fall (on) it⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★waAbilN⚓heavy rain,⚓ N|LEM:yawom|ROOT:ywm|M|GEN★faTal~N⚓then a drizzle.⚓ ADJ|LEM:A^xir|ROOT:Axr|MS|GEN★wa{ll~ahu⚓And Allah⚓ N|LEM:maval|ROOT:mvl|M|NOM★bimaA⚓of what⚓ N|LEM:maval|ROOT:mvl|M|GEN★taEomaluwna⚓you do⚓ N|LEM:SafowaAn|ROOT:Sfw|M|INDEF|GEN★baSiyrN⚓(is) All-Seer.⚓ P|LEM:EalaY`★",
">ayawad~u⚓Would like⚓N|LEM:turaAb|ROOT:trb|M|INDEF|NOM★>aHadukumo⚓any of you⚓ V|PERF|(IV)|LEM:>aSaAba|ROOT:Swb|3MS★>an⚓that⚓ N|LEM:waAbil|ROOT:wbl|M|INDEF|NOM★takuwna⚓it be⚓ V|PERF|LEM:taraka|ROOT:trk|3MS★lahu,⚓for him⚓ N|LEM:Salod|ROOT:Sld|M|INDEF|ACC★jan~apN⚓a garden,⚓ NEG|LEM:laA★m~in⚓of⚓ V|IMPF|LEM:qadara|ROOT:qdr|3MP★n~axiylK⚓date-palms⚓ P|LEM:EalaY`★wa>aEonaAbK⚓and grapevines⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★tajoriY⚓flowing⚓ P|LEM:min★min⚓[from]⚓ REL|LEM:maA★taHotihaA⚓underneath it⚓ V|PERF|LEM:kasaba|ROOT:ksb|3MP★{lo>anoha`ru⚓the rivers,⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★lahu,⚓for him⚓ NEG|LEM:laA★fiyhaA⚓in it⚓ V|IMPF|LEM:hadaY|ROOT:hdy|3MS★min⚓of⚓ N|LEM:qawom|ROOT:qwm|M|ACC★kul~i⚓all (kinds)⚓ ADJ|ACT|PCPL|LEM:ka`firuwn|ROOT:kfr|MP|ACC★{lv~amara`ti⚓(of) [the] fruits,⚓ N|LEM:maval|ROOT:mvl|M|NOM★wa>aSaAbahu⚓and strikes him⚓ REL|LEM:{l~a*iY|MP★{lokibaru⚓[the] old age⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|3MP★walahu,⚓and [for] his⚓ N|LEM:maAl|ROOT:mwl|MP|ACC★*ur~iy~apN⚓children⚓ N|VN|(VIII)|LEM:{botigaA^'|ROOT:bgy|M|ACC★DuEafaA^'u⚓(are) weak⚓ N|VN|LEM:maroDaAt|ROOT:rDw|FS|GEN★fa>aSaAbahaA^⚓then falls on it⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★<iEoSaArN⚓whirlwind,⚓ N|VN|(II)|LEM:tavobiyt|ROOT:vbt|M|INDEF|ACC★fiyhi⚓in it⚓ P|LEM:min★naArN⚓(is) fire⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★fa{Hotaraqato⚓then it is burnt.⚓ N|LEM:maval|ROOT:mvl|M|GEN★ka*a`lika⚓Thus⚓ N|LEM:jan~ap|ROOT:jnn|F|INDEF|GEN★yubay~inu⚓**Allah makes clear⚓ N|LEM:rabowap|ROOT:rbw|F|INDEF|GEN★{ll~ahu⚓**Allah makes clear⚓ V|PERF|(IV)|LEM:>aSaAba|ROOT:Swb|3MS★lakumu⚓for you⚓ N|LEM:waAbil|ROOT:wbl|M|INDEF|NOM★{lo'aAya`ti⚓(His) Signs⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|3FS★laEal~akumo⚓so that you may⚓ N|LEM:>ukul|ROOT:Akl|M|ACC★tatafak~aruwna⚓ponder.⚓ N|LEM:DiEof|ROOT:DEf|MD|ACC★",
"ya`^>ay~uhaA⚓O you⚓COND|LEM:<in★{l~a*iyna⚓who⚓ NEG|LEM:lam★'aAmanuw^A@⚓believe[d]!⚓ V|IMPF|(IV)|LEM:>aSaAba|ROOT:Swb|3MS|MOOD:JUS★>anfiquwA@⚓Spend⚓ N|LEM:waAbil|ROOT:wbl|M|INDEF|NOM★min⚓from⚓ N|LEM:Tal~|ROOT:Tll|M|INDEF|NOM★Tay~iba`ti⚓(the) good things⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★maA⚓that⚓ REL|LEM:maA★kasabotumo⚓you have earned⚓ V|IMPF|LEM:Eamila|ROOT:Eml|2MP★wamim~aA^⚓and whatever⚓ N|LEM:baSiyr|ROOT:bSr|MS|INDEF|NOM★>axorajonaA⚓We brought forth⚓ V|IMPF|LEM:wad~a|ROOT:wdd|3MS★lakum⚓for you⚓ N|LEM:>aHad|ROOT:AHd|M|NOM★m~ina⚓from⚓ SUB|LEM:>an★{lo>aroDi⚓the earth.⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3FS|MOOD:SUBJ★walaA⚓And (do) not⚓ PRON|3MS★tayam~amuwA@⚓aim at⚓ N|LEM:jan~ap|ROOT:jnn|F|INDEF|NOM★{loxabiyva⚓the bad⚓ P|LEM:min★minohu⚓of it,⚓ N|LEM:n~axiyl|ROOT:nxl|MP|INDEF|GEN★tunfiquwna⚓you spend,⚓ N|LEM:Einab|ROOT:Enb|MP|INDEF|GEN★walasotum⚓while you (would) not⚓ V|IMPF|LEM:jarayo|ROOT:jry|3FS★bi_#aAxi*iyhi⚓take it⚓ P|LEM:min★<il~aA^⚓except⚓ N|LEM:taHot|ROOT:tHt|GEN★>an⚓[that]⚓ N|LEM:nahar|ROOT:nhr|MP|NOM★tugomiDuwA@⚓(with) close(d) eyes⚓ PRON|3MS★fiyhi⚓[in it],⚓ P|LEM:fiY★wa{Eolamuw^A@⚓and know⚓ P|LEM:min★>an~a⚓that⚓ N|LEM:kul~|ROOT:kll|M|GEN★{ll~aha⚓Allah⚓ N|LEM:vamara`t|ROOT:vmr|FP|GEN★ganiY~N⚓(is) Self-Sufficient,⚓ V|PERF|(IV)|LEM:>aSaAba|ROOT:Swb|3MS★HamiydN⚓Praiseworthy.⚓ N|LEM:kibar|ROOT:kbr|M|NOM★",
"{l$~ayoTa`nu⚓The Shaitaan⚓PRON|3MS★yaEidukumu⚓promises you⚓ N|LEM:*ur~iy~ap|ROOT:*rr|M|INDEF|NOM★{lofaqora⚓[the] poverty⚓ ADJ|LEM:DaEiyf|ROOT:DEf|MP|NOM★waya>omurukum⚓and orders you⚓ V|PERF|(IV)|LEM:>aSaAba|ROOT:Swb|3MS★bi{lofaHo$aA^'i⚓to immorality,⚓ N|VN|(IV)|LEM:<iEoSaAr|ROOT:ESr|M|INDEF|NOM★wa{ll~ahu⚓while Allah⚓ P|LEM:fiY★yaEidukum⚓promises you⚓ N|LEM:naAr|ROOT:nwr|F|INDEF|NOM★m~agofirapF⚓forgiveness⚓ V|PERF|(VIII)|LEM:{Hotaraqato|ROOT:Hrq|3FS★m~inohu⚓from Him⚓ DEM|LEM:*a`lik|MS★wafaDolFA⚓and bounty.⚓ V|IMPF|(II)|LEM:bay~anu|ROOT:byn|3MS★wa{ll~ahu⚓And Allah⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★wa`siEN⚓(is) All-Encompassing,⚓ PRON|2MP★EaliymN⚓All-Knowing.⚓ N|LEM:'aAyap|ROOT:Ayy|FP|ACC★",
"yu&otiY⚓He grants⚓ACC|LEM:laEal~|SP:<in~★{loHikomapa⚓[the] wisdom⚓ V|IMPF|(V)|LEM:yatafak~aru|ROOT:fkr|2MP★man⚓(to) whom⚓ N|LEM:>ay~uhaA|NOM★ya$aA^'u⚓He wills,⚓ REL|LEM:{l~a*iY|MP★waman⚓and whoever⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★yu&ota⚓is granted⚓ V|IMPV|(IV)|LEM:>anfaqa|ROOT:nfq|2MP★{loHikomapa⚓[the] wisdom,⚓ P|LEM:min★faqado⚓then certainly⚓ N|LEM:Tay~iba`t|ROOT:Tyb|FP|GEN★>uwtiYa⚓he is granted⚓ REL|LEM:maA★xayorFA⚓good⚓ V|PERF|LEM:kasaba|ROOT:ksb|2MP★kaviyrFA⚓abundant.⚓ P|LEM:min★wamaA⚓And none⚓ REL|LEM:maA★ya*~ak~aru⚓remembers⚓ V|PERF|(IV)|LEM:>axoraja|ROOT:xrj|1P★<il~aA^⚓except⚓ PRON|2MP★>uw@luwA@⚓**those of understanding.⚓ P|LEM:min★{lo>aloba`bi⚓**those of understanding.⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★",
"wamaA^⚓And whatever⚓PRO|LEM:laA★>anfaqotum⚓you spend⚓ V|IMPF|(V)|LEM:tayam~amu|ROOT:ymm|2MP|MOOD:JUS★m~in⚓(out) of⚓ N|LEM:xabiyv|ROOT:xbv|MS|ACC★n~afaqapK⚓(your) expenditures⚓ P|LEM:min★>awo⚓or⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|2MP★na*arotum⚓you vow⚓ V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|2MP★m~in⚓of⚓ N|ACT|PCPL|LEM:A^xi*|ROOT:Ax*|MP|GEN★n~a*orK⚓vow(s),⚓ CERT|LEM:<il~aA★fa<in~a⚓then indeed,⚓ SUB|LEM:>an★{ll~aha⚓Allah⚓ V|IMPF|(IV)|LEM:tugomiDu|ROOT:gmD|2MP|MOOD:SUBJ★yaEolamuhu,⚓knows it,⚓ P|LEM:fiY★wamaA⚓and not⚓ V|IMPV|LEM:Ealima|ROOT:Elm|2MP★lilZ~a`limiyna⚓for the wrongdoers⚓ ACC|LEM:>an~|SP:<in~★mino⚓any⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★>anSaArK⚓helpers.⚓ N|LEM:ganiY~|ROOT:gny|MS|INDEF|NOM★",
"<in⚓If⚓ADJ|LEM:Hamiyd|ROOT:Hmd|MS|INDEF|NOM★tuboduwA@⚓you disclose⚓ PN|LEM:$ayoTa`n|ROOT:$Tn|M|NOM★{lS~adaqa`ti⚓the charities⚓ V|IMPF|LEM:waEada|ROOT:wEd|3MS★faniEim~aA⚓then well⚓ N|LEM:faqor|ROOT:fqr|M|ACC★hiYa⚓it (is).⚓ V|IMPF|LEM:>amara|ROOT:Amr|3MS★wa<in⚓But if⚓ N|LEM:faHo$aA^'|ROOT:fH$|FS|GEN★tuxofuwhaA⚓you keep it secret⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★watu&otuwhaA⚓and give it⚓ V|IMPF|LEM:waEada|ROOT:wEd|3MS★{lofuqaraA^'a⚓(to) the poor,⚓ N|LEM:m~agofirap|ROOT:gfr|F|INDEF|ACC★fahuwa⚓then it⚓ P|LEM:min★xayorN⚓(is) better⚓ N|LEM:faDol|ROOT:fDl|M|INDEF|ACC★l~akumo⚓for you.⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★wayukaf~iru⚓And He will remove⚓ N|ACT|PCPL|LEM:wa`siE|ROOT:wsE|M|INDEF|NOM★Eankum⚓from you⚓ ADJ|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★m~in⚓[of]⚓ V|IMPF|(IV)|LEM:A^taY|ROOT:Aty|3MS★say~i_#aAtikumo⚓your evil deeds.⚓ N|LEM:Hikomap|ROOT:Hkm|F|ACC★wa{ll~ahu⚓And Allah⚓ REL|LEM:man★bimaA⚓with what⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★taEomaluwna⚓you do⚓ COND|LEM:man★xabiyrN⚓(is) All-Aware.⚓ V|IMPF|PASS|(IV)|LEM:A^taY|ROOT:Aty|3MS|MOOD:JUS★",
"l~ayosa⚓**Not⚓N|LEM:Hikomap|ROOT:Hkm|F|ACC★Ealayoka⚓on you⚓ CERT|LEM:qad★hudaY`humo⚓(is) their guidance⚓ V|PERF|PASS|(IV)|LEM:A^taY|ROOT:Aty|3MS★wala`kin~a⚓[and] but⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|ACC★{ll~aha⚓Allah⚓ ADJ|LEM:kaviyr|ROOT:kvr|MS|INDEF|ACC★yahodiY⚓guides⚓ NEG|LEM:maA★man⚓whom⚓ V|IMPF|(V)|LEM:ta*ak~ara|ROOT:*kr|3MS★ya$aA^'u⚓He wills.⚓ RES|LEM:<il~aA★wamaA⚓And whatever⚓ N|LEM:>uwliY|ROOT:Awl|MP|NOM★tunfiquwA@⚓you spend⚓ N|LEM:>aloba`b|ROOT:lbb|MP|GEN★mino⚓of⚓ COND|LEM:maA★xayorK⚓good⚓ V|PERF|(IV)|LEM:>anfaqa|ROOT:nfq|2MP★fali>anfusikumo⚓then it is for yourself,⚓ P|LEM:min★wamaA⚓and not⚓ N|LEM:nafaqap|ROOT:nfq|F|INDEF|GEN★tunfiquwna⚓you spend⚓ CONJ|LEM:>aw★<il~aA⚓except⚓ V|PERF|LEM:na*aro|ROOT:n*r|2MP★{botigaA^'a⚓seeking⚓ P|LEM:min★wajohi⚓**(the) face of Allah.⚓ N|LEM:n~a*or|ROOT:n*r|M|INDEF|GEN★{ll~ahi⚓**(the) face of Allah.⚓ ACC|LEM:<in~|SP:<in~★wamaA⚓And whatever⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★tunfiquwA@⚓you spend⚓ V|IMPF|LEM:Ealima|ROOT:Elm|3MS★mino⚓of⚓ NEG|LEM:maA★xayorK⚓good,⚓ N|ACT|PCPL|LEM:ZaAlim|ROOT:Zlm|MP|GEN★yuwaf~a⚓will be repaid in full⚓ P|LEM:min★<ilayokumo⚓to you⚓ N|LEM:naSiyr|ROOT:nSr|MP|INDEF|GEN★wa>antumo⚓and you⚓ COND|LEM:<in★laA⚓(will) not⚓ V|IMPF|(IV)|LEM:yubodiYa|ROOT:bdw|2MP|MOOD:JUS★tuZolamuwna⚓be wronged.⚓ N|LEM:Sadaqa`t|ROOT:Sdq|FP|ACC★",
"lilofuqaraA^'i⚓For the poor,⚓V|PERF|LEM:niEoma|ROOT:nEm|3MS★{l~a*iyna⚓those who⚓ PRON|3FS★>uHoSiruwA@⚓are wrapped up⚓ COND|LEM:<in★fiY⚓in⚓ V|IMPF|(IV)|LEM:>uxofiYa|ROOT:xfy|2MP|MOOD:JUS★sabiyli⚓(the) way⚓ V|IMPF|(IV)|LEM:A^taY|ROOT:Aty|2MP|MOOD:JUS★{ll~ahi⚓(of) Allah,⚓ N|LEM:faqiyr|ROOT:fqr|MP|ACC★laA⚓not⚓ PRON|3MS★yasotaTiyEuwna⚓they are able⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★DarobFA⚓(to) move about⚓ PRON|2MP★fiY⚓in⚓ V|IMPF|(II)|LEM:kaf~ara|ROOT:kfr|3MS★{lo>aroDi⚓the earth.⚓ P|LEM:Ean★yaHosabuhumu⚓Think (about) them,⚓ P|LEM:min★{lojaAhilu⚓the ignorant one,⚓ N|LEM:say~i_#aAt|ROOT:swA|FP|GEN★>agoniyaA^'a⚓(that they are) self-sufficient⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★mina⚓(because) of⚓ REL|LEM:maA★{lt~aEaf~ufi⚓(their) restraint,⚓ V|IMPF|LEM:Eamila|ROOT:Eml|2MP★taEorifuhum⚓you recognize them⚓ N|LEM:xabiyr|ROOT:xbr|MS|INDEF|NOM★bisiyma`humo⚓by their mark.⚓ V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|3MS★laA⚓**They (do) not ask⚓ P|LEM:EalaY`★yaso_#aluwna⚓**They (do) not ask⚓ N|LEM:hudFY|ROOT:hdy|M|NOM★{ln~aAsa⚓the people⚓ ACC|LEM:la`kin~|SP:<in~★<iloHaAfFA⚓with importunity.⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★wamaA⚓And whatever⚓ V|IMPF|LEM:hadaY|ROOT:hdy|3MS★tunfiquwA@⚓you spend⚓ REL|LEM:man★mino⚓of⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★xayorK⚓good,⚓ COND|LEM:maA★fa<in~a⚓then indeed,⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|2MP|MOOD:JUS★{ll~aha⚓Allah⚓ P|LEM:min★bihi.⚓of it⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|GEN★EaliymN⚓(is) All-Knower.⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★",
"{l~a*iyna⚓Those who⚓NEG|LEM:maA★yunfiquwna⚓spend⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|2MP★>amowa`lahum⚓their wealth⚓ RES|LEM:<il~aA★bi{l~ayoli⚓by night⚓ N|VN|(VIII)|LEM:{botigaA^'|ROOT:bgy|M|ACC★wa{ln~ahaAri⚓and day⚓ N|LEM:wajoh|ROOT:wjh|M|GEN★sir~FA⚓secretly⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★waEalaAniyapF⚓and openly,⚓ COND|LEM:maA★falahumo⚓then for them⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|2MP|MOOD:JUS★>ajoruhumo⚓(is) their reward⚓ P|LEM:min★Einda⚓with⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|GEN★rab~ihimo⚓their Lord,⚓ V|IMPF|PASS|(II)|LEM:waf~aY`^|ROOT:wfy|3MS|MOOD:JUS★walaA⚓and no⚓ P|LEM:<ilaY`★xawofN⚓fear⚓ PRON|2MP★Ealayohimo⚓on them⚓ PRO|LEM:laA★walaA⚓and not⚓ V|IMPF|PASS|LEM:Zalama|ROOT:Zlm|2MP|MOOD:JUS★humo⚓they⚓ N|LEM:faqiyr|ROOT:fqr|MP|GEN★yaHozanuwna⚓will grieve.⚓ REL|LEM:{l~a*iY|MP★",
"{l~a*iyna⚓Those who⚓V|PERF|PASS|(IV)|LEM:>uHoSiru|ROOT:HSr|3MP★ya>okuluwna⚓consume⚓ P|LEM:fiY★{lr~ibaw`A@⚓[the] usury⚓ N|LEM:sabiyl|ROOT:sbl|M|GEN★laA⚓not⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★yaquwmuwna⚓they can stand⚓ NEG|LEM:laA★<il~aA⚓except⚓ V|IMPF|(X)|LEM:{sotaTaAEa|ROOT:TwE|3MP★kamaA⚓like⚓ N|LEM:Darob|ROOT:Drb|M|INDEF|ACC★yaquwmu⚓stands⚓ P|LEM:fiY★{l~a*iY⚓the one who,⚓ N|LEM:>aroD|ROOT:ArD|F|GEN★yataxab~aTuhu⚓confounds him⚓ V|IMPF|LEM:Hasiba|ROOT:Hsb|3MS★{l$~ayoTa`nu⚓the Shaitaan⚓ N|ACT|PCPL|LEM:jaAhil|ROOT:jhl|M|NOM★mina⚓with⚓ N|LEM:ganiY~|ROOT:gny|MP|ACC★{lomas~i⚓his touch.⚓ P|LEM:min★*a`lika⚓That⚓ N|VN|(V)|LEM:t~aEaf~uf|ROOT:Eff|M|GEN★bi>an~ahumo⚓(is) because they⚓ V|IMPF|LEM:Earafa|ROOT:Erf|2MS★qaAluw^A@⚓say,⚓ N|LEM:siyma`|ROOT:swm|M|GEN★<in~amaA⚓`Only⚓ NEG|LEM:laA★{lobayoEu⚓the trade⚓ V|IMPF|LEM:sa>ala|ROOT:sAl|3MP★mivolu⚓(is) like⚓ N|LEM:n~aAs|ROOT:nws|MP|ACC★{lr~ibaw`A@⚓[the] usury.`⚓ N|VN|(IV)|LEM:<iloHaAf|ROOT:lHf|M|INDEF|ACC★wa>aHal~a⚓**While Allah has permitted⚓ COND|LEM:maA★{ll~ahu⚓**While Allah has permitted⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|2MP|MOOD:JUS★{lobayoEa⚓[the] trade⚓ P|LEM:min★waHar~ama⚓but (has) forbidden⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|GEN★{lr~ibaw`A@⚓[the] usury.⚓ ACC|LEM:<in~|SP:<in~★faman⚓Then whoever -⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★jaA^'ahu,⚓comes to him⚓ PRON|3MS★mawoEiZapN⚓(the) admonition⚓ N|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★m~in⚓from⚓ REL|LEM:{l~a*iY|MP★r~ab~ihi.⚓His Lord⚓ V|IMPF|(IV)|LEM:>anfaqa|ROOT:nfq|3MP★fa{ntahaY`⚓and he refrained,⚓ N|LEM:maAl|ROOT:mwl|MP|ACC★falahu,⚓then for him⚓ N|LEM:layol|ROOT:lyl|M|GEN★maA⚓what⚓ N|LEM:nahaAr|ROOT:nhr|M|GEN★salafa⚓(has) passed,⚓ N|LEM:sir~|ROOT:srr|M|INDEF|ACC★wa>amoruhu,^⚓and his case⚓ N|LEM:EalaAniyap|ROOT:Eln|F|INDEF|ACC★<ilaY⚓(is) with⚓ PRON|3MP★{ll~ahi⚓Allah,⚓ N|LEM:>ajor|ROOT:Ajr|M|NOM★wamano⚓and whoever⚓ LOC|LEM:Eind|ROOT:End|ACC★EaAda⚓repeated⚓ N|LEM:rab~|ROOT:rbb|M|GEN★fa>uw@la`^}ika⚓then those⚓ NEG|LEM:laA★>aSoHa`bu⚓(are the) companions⚓ N|LEM:xawof|ROOT:xwf|M|INDEF|NOM★{ln~aAri⚓(of) the Fire,⚓ P|LEM:EalaY`★humo⚓they⚓ NEG|LEM:laA★fiyhaA⚓in it⚓ PRON|3MP★xa`liduwna⚓will abide forever.⚓ V|IMPF|LEM:yaHozun|ROOT:Hzn|3MP★",
"yamoHaqu⚓**Allah destroys⚓REL|LEM:{l~a*iY|MP★{ll~ahu⚓**Allah destroys⚓ V|IMPF|LEM:>akala|ROOT:Akl|3MP★{lr~ibaw`A@⚓the usury⚓ N|LEM:r~ibaw`A|ROOT:rbw|M|ACC★wayurobiY⚓and (gives) increase⚓ NEG|LEM:laA★{lS~adaqa`ti⚓(for) the charities.⚓ V|IMPF|LEM:qaAma|ROOT:qwm|3MP★wa{ll~ahu⚓And Allah⚓ RES|LEM:<il~aA★laA⚓(does) not⚓ SUB|LEM:maA★yuHib~u⚓love⚓ V|IMPF|LEM:qaAma|ROOT:qwm|3MS★kul~a⚓every⚓ REL|LEM:{l~a*iY|MS★kaf~aArK⚓ungrateful⚓ V|IMPF|(V)|LEM:yataxab~aTu|ROOT:xbT|3MS★>aviymK⚓sinner.⚓ PN|LEM:$ayoTa`n|ROOT:$Tn|M|NOM★",
"<in~a⚓Indeed,⚓P|LEM:min★{l~a*iyna⚓those who⚓ N|LEM:mas~|ROOT:mss|M|GEN★'aAmanuwA@⚓believe[d]⚓ DEM|LEM:*a`lik|MS★waEamiluwA@⚓and did⚓ ACC|LEM:>an~|SP:<in~★{lS~a`liHa`ti⚓good deeds⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★wa>aqaAmuwA@⚓and established⚓ ACC|LEM:<in~|SP:<in~★{lS~alaw`pa⚓the prayer⚓ PREV|LEM:maA★wa'aAtawuA@⚓and gave⚓ N|LEM:bayoE|ROOT:byE|M|NOM★{lz~akaw`pa⚓the zakah⚓ N|LEM:mivol|ROOT:mvl|M|NOM★lahumo⚓for them -⚓ N|LEM:r~ibaw`A|ROOT:rbw|M|GEN★>ajoruhumo⚓their reward⚓ V|PERF|(IV)|LEM:>aHal~a|ROOT:Hll|3MS★Einda⚓(is) with⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★rab~ihimo⚓their Lord,⚓ N|LEM:bayoE|ROOT:byE|M|ACC★walaA⚓and no⚓ V|PERF|(II)|LEM:Har~ama|ROOT:Hrm|3MS★xawofN⚓fear⚓ N|LEM:r~ibaw`A|ROOT:rbw|M|ACC★Ealayohimo⚓on them⚓ COND|LEM:man★walaA⚓and not⚓ V|PERF|LEM:jaA^'a|ROOT:jyA|3MS★humo⚓they⚓ N|LEM:m~awoEiZap|ROOT:wEZ|F|INDEF|NOM★yaHozanuwna⚓will grieve.⚓ P|LEM:min★",
"ya`^>ay~uhaA⚓O you⚓N|LEM:rab~|ROOT:rbb|M|GEN★{l~a*iyna⚓who⚓ V|PERF|(VIII)|LEM:{ntahaY`|ROOT:nhy|3MS★'aAmanuwA@⚓believe[d]!⚓ PRON|3MS★{t~aquwA@⚓Fear⚓ REL|LEM:maA★{ll~aha⚓Allah⚓ V|PERF|LEM:salafa|ROOT:slf|3MS★wa*aruwA@⚓and give up⚓ N|LEM:>amor|ROOT:Amr|M|NOM★maA⚓what⚓ P|LEM:<ilaY`★baqiYa⚓remained⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★mina⚓of⚓ COND|LEM:man★{lr~ibaw`^A@⚓[the] usury,⚓ V|PERF|LEM:EaAda|ROOT:Ewd|3MS★<in⚓if⚓ DEM|LEM:>uwla`^}ik|P★kuntum⚓you are⚓ N|LEM:>aSoHa`b|ROOT:SHb|MP|NOM★m~u&ominiyna⚓believers.⚓ N|LEM:naAr|ROOT:nwr|F|GEN★",
"fa<in⚓And if⚓PRON|3MP★l~amo⚓not⚓ P|LEM:fiY★tafoEaluwA@⚓you do,⚓ N|ACT|PCPL|LEM:xa`lid|ROOT:xld|MP|NOM★fa>o*anuwA@⚓then be informed⚓ V|IMPF|LEM:yamoHaqu|ROOT:mHq|3MS★biHarobK⚓of a war⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★m~ina⚓from⚓ N|LEM:r~ibaw`A|ROOT:rbw|M|ACC★{ll~ahi⚓Allah⚓ V|IMPF|(IV)|LEM:>arobaY`|ROOT:rbw|3MS★warasuwlihi.⚓and His Messenger.⚓ N|LEM:Sadaqa`t|ROOT:Sdq|FP|ACC★wa<in⚓And if⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★tubotumo⚓you repent⚓ NEG|LEM:laA★falakumo⚓then for you⚓ V|IMPF|(IV)|LEM:>aHobabo|ROOT:Hbb|3MS★ru'uwsu⚓**(are) you capital -⚓ N|LEM:kul~|ROOT:kll|M|ACC★>amowa`likumo⚓**(are) you capital -⚓ N|LEM:kaf~aAr|ROOT:kfr|MS|INDEF|GEN★laA⚓(do) not⚓ ADJ|LEM:>aviym|ROOT:Avm|MS|INDEF|GEN★taZolimuwna⚓wrong⚓ ACC|LEM:<in~|SP:<in~★walaA⚓and not⚓ REL|LEM:{l~a*iY|MP★tuZolamuwna⚓you will be wronged.⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★",
"wa<in⚓And if⚓V|PERF|LEM:Eamila|ROOT:Eml|3MP★kaAna⚓is⚓ N|ACT|PCPL|LEM:S~a`liHa`t|ROOT:SlH|FP|ACC★*uw⚓**the (debtor) in difficulty,⚓ V|PERF|(IV)|LEM:>aqaAma|ROOT:qwm|3MP★EusorapK⚓**the (debtor) in difficulty,⚓ N|LEM:Salaw`p|ROOT:Slw|F|ACC★fanaZirapN⚓then postponement⚓ V|PERF|(IV)|LEM:A^taY|ROOT:Aty|3MP★<ilaY`⚓until⚓ N|LEM:zakaw`p|ROOT:zkw|F|ACC★mayosarapK⚓ease.⚓ PRON|3MP★wa>an⚓And if⚓ N|LEM:>ajor|ROOT:Ajr|M|NOM★taSad~aquwA@⚓you remit as charity⚓ LOC|LEM:Eind|ROOT:End|ACC★xayorN⚓(it is) better⚓ N|LEM:rab~|ROOT:rbb|M|GEN★l~akumo⚓for you.⚓ NEG|LEM:laA★<in⚓If⚓ N|LEM:xawof|ROOT:xwf|M|INDEF|NOM★kuntumo⚓you⚓ P|LEM:EalaY`★taEolamuwna⚓know.⚓ NEG|LEM:laA★",
"wa{t~aquwA@⚓And fear⚓PRON|3MP★yawomFA⚓a Day⚓ V|IMPF|LEM:yaHozun|ROOT:Hzn|3MP★turojaEuwna⚓you will be brought back⚓ N|LEM:>ay~uhaA|NOM★fiyhi⚓[in it]⚓ REL|LEM:{l~a*iY|MP★<ilaY⚓to⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★{ll~ahi⚓Allah.⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★vum~a⚓Then⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★tuwaf~aY`⚓(will be) repaid in full⚓ V|IMPV|LEM:ya*ara|ROOT:w*r|2MP★kul~u⚓every⚓ REL|LEM:maA★nafosK⚓soul⚓ V|PERF|LEM:baqiYa|ROOT:bqy|3MS★m~aA⚓what⚓ P|LEM:min★kasabato⚓it earned⚓ N|LEM:r~ibaw`A|ROOT:rbw|M|GEN★wahumo⚓and they⚓ COND|LEM:<in★laA⚓**will not be wronged.⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★yuZolamuwna⚓**will not be wronged.⚓ N|ACT|PCPL|(IV)|LEM:mu&omin|ROOT:Amn|MP|ACC★",
"ya`^>ay~uhaA⚓O you⚓COND|LEM:<in★{l~a*iyna⚓who⚓ NEG|LEM:lam★'aAmanuw^A@⚓believe[d]!⚓ V|IMPF|LEM:faEala|ROOT:fEl|2MP|MOOD:JUS★<i*aA⚓When⚓ V|IMPV|LEM:>a*ina|ROOT:A*n|2MP★tadaAyantum⚓you contract with one another⚓ N|LEM:Harob|ROOT:Hrb|M|INDEF|GEN★bidayonK⚓any debt⚓ P|LEM:min★<ilaY`^⚓for⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★>ajalK⚓**a fixed term⚓ N|LEM:rasuwl|ROOT:rsl|M|GEN★m~usam~FY⚓**a fixed term⚓ COND|LEM:<in★fa{kotubuwhu⚓then write it.⚓ V|PERF|LEM:taAba|ROOT:twb|2MP★waloyakotub⚓And let write⚓ PRON|2MP★b~ayonakumo⚓between you⚓ N|LEM:ra>os|ROOT:rAs|MP|NOM★kaAtibN[⚓a scribe⚓ N|LEM:maAl|ROOT:mwl|MP|GEN★bi{loEadoli⚓in justice.⚓ NEG|LEM:laA★walaA⚓And not⚓ V|IMPF|LEM:Zalama|ROOT:Zlm|2MP★ya>oba⚓(should) refuse⚓ PRO|LEM:laA★kaAtibN⚓a scribe⚓ V|IMPF|PASS|LEM:Zalama|ROOT:Zlm|2MP|MOOD:JUS★>an⚓that⚓ COND|LEM:<in★yakotuba⚓he writes⚓ V|PERF|LEM:kaAna|ROOT:kwn|3MS★kamaA⚓as⚓ N|LEM:*uw|MS|NOM★Eal~amahu⚓**Allah (has) taught him.⚓ N|LEM:Eusorap|ROOT:Esr|F|INDEF|GEN★{ll~ahu⚓**Allah (has) taught him.⚓ N|LEM:naZirap|ROOT:nZr|F|INDEF|NOM★faloyakotubo⚓So let him write⚓ P|LEM:<ilaY`★waloyumolili⚓and let dictate⚓ N|LEM:mayosarap|ROOT:ysr|F|INDEF|GEN★{l~a*iY⚓the one⚓ SUB|LEM:>an★Ealayohi⚓on whom⚓ V|IMPF|(V)|LEM:taSad~aqa|ROOT:Sdq|2MP|MOOD:SUBJ★{loHaq~u⚓(is) the right⚓ N|LEM:xayor|ROOT:xyr|MS|INDEF|NOM★waloyat~aqi⚓and let him fear⚓ PRON|2MP★{ll~aha⚓Allah,⚓ COND|LEM:<in★rab~ahu,⚓his Lord,⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★walaA⚓and (let him) not⚓ V|IMPF|LEM:Ealima|ROOT:Elm|2MP★yaboxaso⚓diminish⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★minohu⚓from it⚓ N|LEM:yawom|ROOT:ywm|M|INDEF|ACC★$ayo_#FA⚓anything.⚓ V|IMPF|PASS|LEM:rajaEa|ROOT:rjE|2MP★fa<in⚓Then if⚓ P|LEM:fiY★kaAna⚓is⚓ P|LEM:<ilaY`★{l~a*iY⚓the one⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★Ealayohi⚓on him⚓ CONJ|LEM:vum~★{loHaq~u⚓(is) the right,⚓ V|IMPF|PASS|(II)|LEM:waf~aY`^|ROOT:wfy|3FS★safiyhFA⚓(of) limited understanding,⚓ N|LEM:kul~|ROOT:kll|M|NOM★>awo⚓or⚓ N|LEM:nafos|ROOT:nfs|FS|INDEF|GEN★DaEiyfFA⚓weak,⚓ REL|LEM:maA★>awo⚓or⚓ V|PERF|LEM:kasaba|ROOT:ksb|3FS★laA⚓not⚓ PRON|3MP★yasotaTiyEu⚓capable⚓ NEG|LEM:laA★>an⚓that⚓ V|IMPF|PASS|LEM:Zalama|ROOT:Zlm|3MP|MOOD:JUS★yumil~a⚓**he (can) dictate,⚓ N|LEM:>ay~uhaA|NOM★huwa⚓**he (can) dictate,⚓ REL|LEM:{l~a*iY|MP★faloyumolilo⚓then let dictate⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MP★waliy~uhu,⚓his guardian⚓ T|LEM:<i*aA★bi{loEadoli⚓with justice.⚓ V|PERF|(VI)|LEM:tadaAyan|ROOT:dyn|2MP★wa{sota$ohiduwA@⚓And call for evidence⚓ N|LEM:dayon|ROOT:dyn|M|INDEF|GEN★$ahiydayoni⚓two witnesses⚓ P|LEM:<ilaY`★min⚓among⚓ N|LEM:>ajal|ROOT:Ajl|M|INDEF|GEN★r~ijaAlikumo⚓your men.⚓ ADJ|PASS|PCPL|(II)|LEM:m~usam~FY|ROOT:smw|M|INDEF|GEN★fa<in⚓And if⚓ V|IMPV|LEM:kataba|ROOT:ktb|2MP★l~amo⚓not⚓ V|IMPF|LEM:kataba|ROOT:ktb|3MS|MOOD:JUS★yakuwnaA⚓there are⚓ LOC|LEM:bayon|ROOT:byn|ACC★rajulayoni⚓two men⚓ N|ACT|PCPL|LEM:kaAtib|ROOT:ktb|M|INDEF|NOM★farajulN⚓then one man⚓ N|LEM:Eadol|ROOT:Edl|M|GEN★wa{mora>ataAni⚓and two women⚓ NEG|LEM:laA★mim~an⚓of whom⚓ V|IMPF|LEM:>abaY|ROOT:Aby|3MS|MOOD:JUS★taroDawona⚓you agree⚓ N|ACT|PCPL|LEM:kaAtib|ROOT:ktb|M|INDEF|NOM★mina⚓of⚓ SUB|LEM:>an★{l$~uhadaA^'i⚓[the] witnesses,⚓ V|IMPF|LEM:kataba|ROOT:ktb|3MS|MOOD:SUBJ★>an⚓(so) that (if)⚓ SUB|LEM:maA★taDil~a⚓[she] errs,⚓ V|PERF|(II)|LEM:Eal~ama|ROOT:Elm|3MS★<iHodaY`humaA⚓one of the two,⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★fatu*ak~ira⚓then will remind⚓ V|IMPF|LEM:kataba|ROOT:ktb|3MS|MOOD:JUS★<iHodaY`humaA⚓one of the two⚓ V|IMPF|(IV)|LEM:yumil~a|ROOT:mll|3MS|MOOD:JUS★{lo>uxoraY`⚓the other.⚓ REL|LEM:{l~a*iY|MS★walaA⚓And not⚓ P|LEM:EalaY`★ya>oba⚓(should) refuse⚓ N|LEM:Haq~|ROOT:Hqq|M|NOM★{l$~uhadaA^'u⚓the witnesses⚓ V|IMPF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|3MS|MOOD:JUS★<i*aA⚓when⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★maA⚓**they are called.⚓ N|LEM:rab~|ROOT:rbb|M|ACC★duEuwA@⚓**they are called.⚓ PRO|LEM:laA★walaA⚓And not⚓ V|IMPF|LEM:yaboxaso|ROOT:bxs|3MS|MOOD:JUS★taso_#amuw^A@⚓(be) weary⚓ P|LEM:min★>an⚓that⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|ACC★takotubuwhu⚓you write it -⚓ COND|LEM:<in★SagiyrFA⚓small⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MS★>awo⚓or⚓ REL|LEM:{l~a*iY|MS★kabiyrFA⚓large⚓ P|LEM:EalaY`★<ilaY`^⚓for⚓ N|LEM:Haq~|ROOT:Hqq|M|NOM★>ajalihi.⚓its term.⚓ N|LEM:safiyh|ROOT:sfh|M|INDEF|ACC★*a`likumo⚓That⚓ CONJ|LEM:>aw★>aqosaTu⚓(is) more just⚓ N|LEM:DaEiyf|ROOT:DEf|MS|INDEF|ACC★Einda⚓near⚓ CONJ|LEM:>aw★{ll~ahi⚓Allah,⚓ NEG|LEM:laA★wa>aqowamu⚓and more upright⚓ V|IMPF|(X)|LEM:{sotaTaAEa|ROOT:TwE|3MS★lil$~aha`dapi⚓for evidence⚓ SUB|LEM:>an★wa>adonaY`^⚓and nearer⚓ V|IMPF|(IV)|LEM:yumil~a|ROOT:mll|3MS|MOOD:SUBJ★>al~aA⚓that not⚓ PRON|3MS★tarotaAbuw^A@⚓you (have) doubt,⚓ V|IMPF|(IV)|LEM:yumil~a|ROOT:mll|3MS|MOOD:JUS★<il~aA^⚓except⚓ N|LEM:waliY~|ROOT:wly|M|NOM★>an⚓that⚓ N|LEM:Eadol|ROOT:Edl|M|GEN★takuwna⚓be⚓ V|IMPV|(X)|LEM:{sota$ohidu|ROOT:$hd|2MP★tija`rapF⚓a transaction⚓ N|LEM:$ahiyd|ROOT:$hd|MD|ACC★HaADirapF⚓present,⚓ P|LEM:min★tudiyruwnahaA⚓you carry out⚓ N|LEM:rijaAl|ROOT:rjl|MP|GEN★bayonakumo⚓among you,⚓ COND|LEM:<in★falayosa⚓then not⚓ NEG|LEM:lam★Ealayokumo⚓on you⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3MD|MOOD:JUS★junaAHN⚓any sin⚓ N|LEM:rajul|ROOT:rjl|MD|ACC★>al~aA⚓that not⚓ N|LEM:rajul|ROOT:rjl|M|INDEF|NOM★takotubuwhaA⚓you write it.⚓ N|LEM:{mora>at|ROOT:mrA|FD|NOM★wa>a$ohiduw^A@⚓And take witness⚓ P|LEM:min★<i*aA⚓when⚓ REL|LEM:man★tabaAyaEotumo⚓you make commercial transaction.⚓ V|IMPF|LEM:r~aDiYa|ROOT:rDw|2MP★walaA⚓And not⚓ P|LEM:min★yuDaA^r~a⚓(should) be harmed⚓ N|LEM:$ahiyd|ROOT:$hd|MP|GEN★kaAtibN⚓(the) scribe⚓ SUB|LEM:>an★walaA⚓and not⚓ V|IMPF|LEM:Dal~a|ROOT:Dll|3FS|MOOD:SUBJ★$ahiydN⚓(the) witness,⚓ N|LEM:<iHodaY|ROOT:AHd|F|NOM★wa<in⚓and if⚓ V|IMPF|(II)|LEM:*uk~ira|ROOT:*kr|3FS|MOOD:SUBJ★tafoEaluwA@⚓you do,⚓ N|LEM:<iHodaY|ROOT:AHd|F|NOM★fa<in~ahu,⚓then indeed it⚓ N|LEM:A^xar|ROOT:Axr|FS|ACC★fusuwqN[⚓(is) sinful conduct⚓ NEG|LEM:laA★bikumo⚓for you,⚓ V|IMPF|LEM:>abaY|ROOT:Aby|3MS|MOOD:JUS★wa{t~aquwA@⚓and fear⚓ N|LEM:$ahiyd|ROOT:$hd|MP|NOM★{ll~aha⚓Allah.⚓ T|LEM:<i*aA★wayuEal~imukumu⚓**And Allah teaches you.⚓ SUB|LEM:maA★{ll~ahu⚓**And Allah teaches you.⚓ V|PERF|PASS|LEM:daEaA|ROOT:dEw|3MP★wa{ll~ahu⚓And Allah⚓ PRO|LEM:laA★bikul~i⚓of every⚓ V|IMPF|LEM:yaso_#amu|ROOT:sAm|2MP|MOOD:JUS★$aYo'K⚓thing⚓ SUB|LEM:>an★EaliymN⚓(is) All-Knower.⚓ V|IMPF|LEM:kataba|ROOT:ktb|2MP|MOOD:SUBJ★",
"wa<in⚓And if⚓N|LEM:Sagiyr|ROOT:Sgr|MS|INDEF|ACC★kuntumo⚓you are⚓ CONJ|LEM:>aw★EalaY`⚓on⚓ N|LEM:kabiyr|ROOT:kbr|MS|INDEF|ACC★safarK⚓a journey⚓ P|LEM:<ilaY`★walamo⚓and not⚓ N|LEM:>ajal|ROOT:Ajl|M|GEN★tajiduwA@⚓you find⚓ DEM|LEM:*a`lik|2MP★kaAtibFA⚓a scribe,⚓ N|LEM:>aqosaT|ROOT:qsT|MS|NOM★fariha`nN⚓then pledge⚓ LOC|LEM:Eind|ROOT:End|ACC★m~aqobuwDapN⚓in hand.⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★fa<ino⚓Then if⚓ N|LEM:>aqowam|ROOT:qwm|MS|NOM★>amina⚓entrusts⚓ N|LEM:$aha`dap|ROOT:$hd|F|GEN★baEoDukum⚓one of you⚓ N|LEM:>adonaY`|ROOT:dnw|MS|NOM★baEoDFA⚓(to) another⚓ SUB|LEM:>an★faloyu&ad~i⚓then let discharge⚓ NEG|LEM:laA★{l~a*iY⚓the one who⚓ V|IMPF|(VIII)|LEM:{rotaAba|ROOT:ryb|2MP|MOOD:SUBJ★{&otumina⚓is entrusted⚓ EXP|LEM:<il~aA★>ama`natahu,⚓his trust.⚓ SUB|LEM:>an★waloyat~aqi⚓And let him fear⚓ V|IMPF|LEM:kaAna|ROOT:kwn|SP:kaAn|3FS|MOOD:SUBJ★{ll~aha⚓Allah,⚓ N|LEM:tija`rap|ROOT:tjr|F|INDEF|ACC★rab~ahu,⚓his Lord.⚓ ADJ|ACT|PCPL|LEM:HaADirap|ROOT:HDr|F|INDEF|ACC★walaA⚓And (do) not⚓ V|IMPF|(IV)|LEM:tudiyru|ROOT:dwr|2MP★takotumuwA@⚓conceal⚓ LOC|LEM:bayon|ROOT:byn|ACC★{l$~aha`dapa⚓the evidence.⚓ V|PERF|LEM:l~ayosa|ROOT:lys|SP:kaAn|3MS★waman⚓And whoever⚓ P|LEM:EalaY`★yakotumohaA⚓conceals it,⚓ N|LEM:junaAH|ROOT:jnH|M|INDEF|NOM★fa<in~ahu,^⚓then indeed he⚓ SUB|LEM:>an★'aAvimN⚓(is) sinful -⚓ NEG|LEM:laA★qalobuhu,⚓his heart.⚓ V|IMPF|LEM:kataba|ROOT:ktb|2MP|MOOD:SUBJ★wa{ll~ahu⚓And Allah⚓ V|IMPV|(IV)|LEM:>a$ohada|ROOT:$hd|2MP★bimaA⚓of what⚓ T|LEM:<i*aA★taEomaluwna⚓you do⚓ V|PERF|(VI)|LEM:tabaAyaEo|ROOT:byE|2MP★EaliymN⚓(is) All-Knower.⚓ NEG|LEM:laA★",
"l~il~ahi⚓To Allah (belongs)⚓V|IMPF|PASS|(III)|LEM:yuDaA^r~a|ROOT:Drr|3MS|MOOD:SUBJ★maA⚓whatever⚓ N|ACT|PCPL|LEM:kaAtib|ROOT:ktb|M|INDEF|NOM★fiY⚓(is) in⚓ NEG|LEM:laA★{ls~ama`wa`ti⚓the heavens⚓ N|LEM:$ahiyd|ROOT:$hd|MS|INDEF|NOM★wamaA⚓and whatever⚓ COND|LEM:<in★fiY⚓(is) in⚓ V|IMPF|LEM:faEala|ROOT:fEl|2MP|MOOD:JUS★{lo>aroDi⚓the earth.⚓ ACC|LEM:<in~|SP:<in~★wa<in⚓And if⚓ N|LEM:fusuwq|ROOT:fsq|M|INDEF|NOM★tuboduwA@⚓you disclose⚓ PRON|2MP★maA⚓what⚓ V|IMPV|(VIII)|LEM:{t~aqaY`|ROOT:wqy|2MP★fiY^⚓(is) in⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★>anfusikumo⚓yourselves⚓ V|IMPF|(II)|LEM:Eal~ama|ROOT:Elm|3MS★>awo⚓or⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★tuxofuwhu⚓you conceal it,⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★yuHaAsibokum⚓will call you to account⚓ N|LEM:kul~|ROOT:kll|M|GEN★bihi⚓for it⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★{ll~ahu⚓Allah.⚓ N|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★fayagofiru⚓Then, He will forgive⚓ COND|LEM:<in★liman⚓[to] whom⚓ V|PERF|LEM:kaAna|ROOT:kwn|SP:kaAn|2MP★ya$aA^'u⚓He wills,⚓ P|LEM:EalaY`★wayuEa*~ibu⚓and He will punish⚓ N|LEM:safar|ROOT:sfr|M|INDEF|GEN★man⚓whom⚓ NEG|LEM:lam★ya$aA^'u⚓He wills.⚓ V|IMPF|LEM:wajada|ROOT:wjd|2MP|MOOD:JUS★wa{ll~ahu⚓And Allah⚓ N|ACT|PCPL|LEM:kaAtib|ROOT:ktb|M|INDEF|ACC★EalaY`⚓on⚓ N|LEM:riha`n|ROOT:rhn|MP|INDEF|NOM★kul~i⚓every⚓ ADJ|PASS|PCPL|LEM:m~aqobuwDap|ROOT:qbD|F|INDEF|NOM★$aYo'K⚓thing⚓ COND|LEM:<in★qadiyrN⚓(is) All-Powerful.⚓ V|PERF|LEM:>amina|ROOT:Amn|3MS★",
"'aAmana⚓Believed⚓N|LEM:baEoD|ROOT:bED|M|NOM★{lr~asuwlu⚓the Messenger⚓ N|LEM:baEoD|ROOT:bED|M|INDEF|ACC★bimaA^⚓in what⚓ V|IMPF|(II)|LEM:yu&ad~i|ROOT:Ady|3MS|MOOD:JUS★>unzila⚓was revealed⚓ REL|LEM:{l~a*iY|MS★<ilayohi⚓to him⚓ V|PERF|PASS|(VIII)|LEM:{&otumina|ROOT:Amn|3MS★min⚓from⚓ N|LEM:>ama`nat|ROOT:Amn|F|ACC★r~ab~ihi.⚓his Lord⚓ V|IMPF|(VIII)|LEM:{t~aqaY`|ROOT:wqy|3MS|MOOD:JUS★wa{lomu&ominuwna⚓and the believers.⚓ PN|LEM:{ll~ah|ROOT:Alh|ACC★kul~N⚓All⚓ N|LEM:rab~|ROOT:rbb|M|ACC★'aAmana⚓believed⚓ PRO|LEM:laA★bi{ll~ahi⚓in Allah,⚓ V|IMPF|LEM:katama|ROOT:ktm|2MP|MOOD:JUS★wamala`^}ikatihi.⚓and His Angels,⚓ N|LEM:$aha`dap|ROOT:$hd|F|ACC★wakutubihi.⚓and His Books,⚓ COND|LEM:man★warusulihi.⚓and His Messengers.⚓ V|IMPF|LEM:katama|ROOT:ktm|3MS|MOOD:JUS★laA⚓`Not⚓ ACC|LEM:<in~|SP:<in~★nufar~iqu⚓we make distinction⚓ N|ACT|PCPL|LEM:A^vim|ROOT:Avm|MS|INDEF|NOM★bayona⚓between⚓ N|LEM:qalob|ROOT:qlb|FS|NOM★>aHadK⚓any⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★m~in⚓of⚓ REL|LEM:maA★r~usulihi.⚓His Messengers.`⚓ V|IMPF|LEM:Eamila|ROOT:Eml|2MP★waqaAluwA@⚓And they said,⚓ N|LEM:Ealiym|ROOT:Elm|MS|INDEF|NOM★samiEonaA⚓`We heard⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★wa>aTaEonaA⚓and we obeyed.⚓ REL|LEM:maA★guforaAnaka⚓(Grant) us Your forgiveness⚓ P|LEM:fiY★rab~anaA⚓our Lord,⚓ N|LEM:samaA^'|ROOT:smw|FP|GEN★wa<ilayoka⚓and to You⚓ REL|LEM:maA★{lomaSiyru⚓(is) the return.`⚓ P|LEM:fiY★",
"laA⚓(Does) not⚓N|LEM:>aroD|ROOT:ArD|F|GEN★yukal~ifu⚓**burden Allah⚓ COND|LEM:<in★{ll~ahu⚓**burden Allah⚓ V|IMPF|(IV)|LEM:yubodiYa|ROOT:bdw|2MP|MOOD:JUS★nafosFA⚓any soul⚓ REL|LEM:maA★<il~aA⚓except⚓ P|LEM:fiY★wusoEahaA⚓its capacity,⚓ N|LEM:nafos|ROOT:nfs|FP|GEN★lahaA⚓for it⚓ CONJ|LEM:>aw★maA⚓what⚓ V|IMPF|(IV)|LEM:>uxofiYa|ROOT:xfy|2MP|MOOD:JUS★kasabato⚓it earned,⚓ V|IMPF|(III)|LEM:HaAsabo|ROOT:Hsb|3MS|MOOD:JUS★waEalayohaA⚓and against it⚓ PRON|3MS★maA⚓what⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★{kotasabato⚓it earned.⚓ V|IMPF|LEM:gafara|ROOT:gfr|3MS★rab~anaA⚓`Our Lord!⚓ REL|LEM:man★laA⚓(Do) not⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★tu&aAxi*onaA^⚓take us to task⚓ V|IMPF|(II)|LEM:Ea*~aba|ROOT:E*b|3MS★<in⚓if⚓ REL|LEM:man★n~asiynaA^⚓we forget⚓ V|IMPF|LEM:$aA^'a|ROOT:$yA|3MS★>awo⚓or⚓ PN|LEM:{ll~ah|ROOT:Alh|NOM★>axoTa>onaA⚓we err.⚓ P|LEM:EalaY`★rab~anaA⚓Our Lord!⚓ N|LEM:kul~|ROOT:kll|M|GEN★walaA⚓And (do) not⚓ N|LEM:$aYo'|ROOT:$yA|M|INDEF|GEN★taHomilo⚓lay⚓ N|LEM:qadiyr|ROOT:qdr|M|INDEF|NOM★EalayonaA^⚓upon us⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MS★<iSorFA⚓a burden⚓ N|LEM:rasuwl|ROOT:rsl|M|NOM★kamaA⚓like that⚓ REL|LEM:maA★Hamalotahu,⚓(which) You laid [it]⚓ V|PERF|PASS|(IV)|LEM:>anzala|ROOT:nzl|3MS★EalaY⚓on⚓ P|LEM:<ilaY`★{l~a*iyna⚓those who⚓ P|LEM:min★min⚓**(were) before us.⚓ N|LEM:rab~|ROOT:rbb|M|GEN★qabolinaA⚓**(were) before us.⚓ N|ACT|PCPL|(IV)|LEM:mu&omin|ROOT:Amn|MP|NOM★rab~anaA⚓Our Lord!⚓ N|LEM:kul~|ROOT:kll|M|INDEF|NOM★walaA⚓[And] (do) not⚓ V|PERF|(IV)|LEM:'aAmana|ROOT:Amn|3MS★tuHam~ilonaA⚓lay on us⚓ PN|LEM:{ll~ah|ROOT:Alh|GEN★maA⚓what⚓ N|LEM:malak|ROOT:mlk|MP|GEN★laA⚓not⚓ N|LEM:kita`b|ROOT:ktb|MP|GEN★TaAqapa⚓(the) strength⚓ N|LEM:rasuwl|ROOT:rsl|MP|GEN★lanaA⚓we have⚓ NEG|LEM:laA★bihi.⚓[of it] (to bear).⚓ V|IMPF|(II)|LEM:far~aqu|ROOT:frq|1P★wa{Eofu⚓And pardon⚓ LOC|LEM:bayon|ROOT:byn|ACC★Ean~aA⚓[from] us,⚓ N|LEM:>aHad|ROOT:AHd|M|INDEF|GEN★wa{gofiro⚓and forgive⚓ P|LEM:min★lanaA⚓[for] us⚓ N|LEM:rasuwl|ROOT:rsl|MP|GEN★wa{roHamonaA^⚓and have mercy on us.⚓ V|PERF|LEM:qaAla|ROOT:qwl|3MP★>anta⚓You (are)⚓ V|PERF|LEM:samiEa|ROOT:smE|1P★mawolaY`naA⚓our Protector,⚓ V|PERF|(IV)|LEM:>aTaAEa|ROOT:TwE|1P★fa{nSuronaA⚓so help us⚓ N|LEM:guforaAn|ROOT:gfr|M|ACC★EalaY⚓against⚓ N|LEM:rab~|ROOT:rbb|M|ACC★{loqawomi⚓the people -⚓ P|LEM:<ilaY`★{loka`firiyna⚓[the] disbelievers.⚓ N|LEM:maSiyr|ROOT:Syr|NOM★",
"",



],

			cookdata: function(){
				for(var i=1; i <= gq.quran.parse.strings.length; ++i){
					gq.data.quran['quran-corpus'][i].verse = gq.quran.parse.strings[i];
				}
				console.log('data cooked');
			},

			escapeMisc: function(input){ var output='';
				if(!input) return; output = input.replace(/\</g, '&#171;').replace(/\>/g, '&gt;').replace(/\"/g, '&#9674;');  //&#60; for <. 9668 for left diamond like.
				if(input.indexOf('<') != -1 || input.indexOf('>') != -1){ console.log(input +'\t\t'+ output ); if(typeof(DEBUG) != 'undefined')debugger; }
				return output;
			},

			parseCorpus: function (quranBy, text, value)
			{
				var SEP = '|,', SEP2 = '|;', SEP0 = ' ';
				SEP = '⚓'; SEP2 = '★'; gq.quran.parse.cookdata(); if(!text) debugger;
				var words = text.split( SEP2 );
				var verse_html = '';
				var color = this._color;
				$.each(words, function(i, verse) {
					if (verse)
					{
						var verse = verse.split( SEP );
					    var ref = (value?value.surah:'?') +':'+ (value?value.ayah:'?') + ':'+ (1+i);
						var refHtml=ref, refPOS='', corpus, token1, token2, token3;
						token1 = EnToAr( verse[0] );
						token2 = verse[1];
						token3 = ( verse[2] ).replace(/\</g, '&#171;').replace(/\>/g, '&gt;').replace(/\"/g, '&#9674;');;
						if(verse[2])
							refPOS = $.trim( verse[2].split('|')[0] );
						refHtml += '<BR/><span style=font-size:0.5em;>' + ( token3 ) + '</span>';
						/*if(typeof(CORPUS) == 'object' && CORPUS){//Play safe, incase grammar plugin disabled or grammar data not yet loaded..
							corpus = CORPUS.UIgetWordGrammarDisplay(ref)
							if(corpus && typeof(corpus) == 'object'){refHtml = corpus.html; refPOS = corpus.pos;}
						}//else just show the plain words... on mouseover shows arabic word.						*/
						if (gq.settings.wbwDirection == 'english2arabic')
						{
							if (gq.settings.wbwMouseOver)
								verse_html += '<span class="word wordColor'+color+'"><span class="en tipsWord" title="'+verse[0]+'">'+verse[1]+'</span></span>';
							else
								verse_html += '<span class="word wordColor'+color+' staticWord"><span class="en first ltr" dir="ltr">'+verse[1]+'</span><span class="ar quranText second rtl" dir="rtl">'+verse[0]+'</span></span>';
						}
						else
						{
							if (gq.settings.wbwMouseOver)
								verse_html += '<span class="word wordColor'+color+'"><span class="ar quranText tipsWord" title="'+verse[1]+'">'+verse[0]+'</span></span>';
							else
								verse_html += '<span class="word wordColorXXX'+color+ ' POS-'+ refPOS + 
									' staticWord"><span class="ar quranText top first rtl tipsWord" dir="rtl" title="' + refHtml + /*'<br/>' + verse[1]+verse[0]+*/'">'+
									token1+'</span><span class="en second ltr" dir="ltr">'+token2+'</span></span>';
								//'<span class="currentAyah tips" title="Surah Al Nas" data-tips-position="bottom center" data-tips-dynamic="true">00:00</span>'; 
						}
					}
					
					if (color == 10)
						color = 1;
					++color;
				});
				
				this._color = color;
				
				return verse_html;
			},
			
			

			
			parseKidsWordByWord: function (quranBy, text, value)
			{
				var words = text.split('$');
				var verse_html = '';
				var color = this._color;
				$.each(words, function(i, verse) {
					if (verse)
					{
						var verse = verse.split('|');
					    
						if (gq.settings.wbwDirection == 'english2arabic')
						{
							if (gq.settings.wbwMouseOver)
								verse_html += '<span class="word wordColor'+color+'"><span class="en tipsWord" title="'+verse[0]+'">'+verse[1]+'</span></span>';
							else
								verse_html += '<span class="word wordColor'+color+' staticWord"><span class="en first ltr" dir="ltr">'+verse[1]+'</span><span class="ar quranText second rtl" dir="rtl">'+verse[0]+'</span></span>';
						}
						else
						{
							if (gq.settings.wbwMouseOver)
								verse_html += '<span class="word wordColor'+color+'"><span class="ar quranText tipsWord" title="'+verse[1]+'">'+verse[0]+'</span></span>';
							else
								verse_html += '<span class="word wordColor'+color+' staticWord"><span class="ar quranText top first rtl" dir="rtl">'+verse[0]+'</span><span class="en second ltr" dir="ltr">'+verse[1]+'</span></span>'; 
						}
					}
					
					if (color == 10)
						color = 1;
					++color;
				});
				
				this._color = color;
				
				return verse_html;
			},
			_color: 1,
			
			parseTajweed: function (quranBy, text)
			{
				return text.replace(/\[h/g, '<span class="ham_wasl" title="Hamzat Wasl" alt="').replace(/\[s/g, '<span class="slnt" title="Silent" alt="').replace(/\[l/g, '<span class="slnt" title="Lam Shamsiyyah" alt="').replace(/\[n/g, '<span class="madda_normal" title="Normal Prolongation: 2 Vowels" alt="').replace(/\[p/g, '<span class="madda_permissible" title="Permissible Prolongation: 2, 4, 6 Vowels" alt="').replace(/\[m/g, '<span class="madda_necessary" title="Necessary Prolongation: 6 Vowels" alt="').replace(/\[q/g, '<span class="qlq" title="Qalqalah" alt="').replace(/\[o/g, '<span class="madda_obligatory" title="Obligatory Prolongation: 4-5 Vowels" alt="').replace(/\[c/g, '<span class="ikhf_shfw" title="Ikhfa\' Shafawi - With Meem" alt="').replace(/\[f/g, '<span class="ikhf" title="Ikhfa\'" alt="').replace(/\[w/g, '<span class="idghm_shfw" title="Idgham Shafawi - With Meem" alt="').replace(/\[i/g, '<span class="iqlb" title="Iqlab" alt="').replace(/\[a/g, '<span class="idgh_ghn" title="Idgham - With Ghunnah" alt="').replace(/\[u/g, '<span class="idgh_w_ghn" title="Idgham - Without Ghunnah" alt="').replace(/\[d/g, '<span class="idgh_mus" title="Idgham - Mutajanisayn" alt="').replace(/\[b/g, '<span class="idgh_mus" title="Idgham - Mutaqaribayn" alt="').replace(/\[g/g, '<span class="ghn" title="Ghunnah: 2 Vowels" alt="').replace(/\[/g, '" >').replace(/\]/g, '</span>');
			},
			
			parseTranslation: function (quranBy, text)
			{
				text = text.replace(/\]\]/g, '$').replace(/ *\[\[[^$]*\$/g, '');
				return text;
			},
		
			addSpaceTatweel: function (text)
			{
			    text = this.pregReplace('($SHADDA|$FATHA)($SUPERSCRIPT_ALEF)', '$1$TATWEEL$2', text);
			    text = this.pregReplace('([$HAMZA$DAL-$ZAIN$WAW][$SHADDA$FATHA]*)$TATWEEL($SUPERSCRIPT_ALEF)', '$1$ZWNJ$2', text);
			    return text;
			},
			
			addTatweel: function (text)
			{
			    text = this.pregReplace('($SHADDA|$FATHA)($SUPERSCRIPT_ALEF)', '$1$TATWEEL$2', text);
			    text = this.pregReplace('([$HAMZA$DAL-$ZAIN$WAW][$SHADDA$FATHA]*)$TATWEEL($SUPERSCRIPT_ALEF)', '$1$2', text);
			    return text;
			},
			
			removeExtraMeems: function (text)
			{
			    text = this.pregReplace('([$FATHATAN$DAMMATAN])$LOW_MEEM', '$1', text);
			    text = this.pregReplace('($KASRATAN)$HIGH_MEEM', '$1', text);
			    return text;
			},
			
			highlight: function (pattern, str)
			{
			    pattern = new RegExp('(' + pattern + ')', 'g');
			    str = str.replace(pattern, '◄$1►');
			    str = str.replace(/◄\s/g, ' ◄').replace(/\s►/g, '► ');
			    str = str.replace(/([^\s]*)◄/g, '◄$1').replace(/►([^\s]*)/g, '$1►');
			    
			    while (/◄[^\s]*◄/.test(str))
			    	str = str.replace(/(◄[^\s]*)◄/g, '$1').replace(/►([^\s]*►)/g, '$1');
			    
			    str = str.replace(/◄/g, '<span class="highlight">').replace(/►/g, '</span>');
			    return str;
			},
			
			pregReplace: function (fromExp, toExp, str)
			{
			    fromExp = new RegExp(this.regTrans(fromExp), 'g');
			    toExp = this.regTrans(toExp);
			    return str.replace(fromExp, toExp);
			},
			
			regTrans: function (str) {
			    return str.replace(/\$([A-Z_]+)/g, function (s, i, ofs, all) {
			        return Quran._data.UGroups[i] || Quran._data.UChars[i] || '';
			    });
			}
		}
	},
	
	search: {
		
		_keyword: '',
		_position: 0,
		_positionStartVerse: 0,
		_loading: false,
		
		init: function ()
		{
			if (gq.settings.selectedSearchBy && typeof(gq.settings.selectedSearchBy) == 'object' && Object.keys(gq.settings.selectedSearchBy).length > 0)
				return false;
			
			gq.settings.selectedSearchBy = {};
			
			by = gq.quran.list('text');
			$.each(by, function(quranBy, detail)
			{
				if (detail.type == 'quran')
					gq.search.addQuranBy(quranBy);
				else if (gq.data.languageCountryList[quranBy.language_code])
					gq.search.addQuranBy(quranBy);
			});
		},
		
		isActive: function ()
		{
			return (this._keyword != '');
		},
		
		load: function (keyword, more)
		{
			if (more && !this.isNext())
				return false;
			
			if (/^[0-9]+:?[0-9]*$/.test(keyword))
			{
				verse = keyword.split(':');
				
				if (verse.length > 1)
				{
					gq.settings.surah = Quran._fixSurahNum(parseInt(verse['0']));
					gq.settings.ayah = Quran._fixAyahNum(gq.settings.surah, parseInt(verse['1']));
				}
				else
				{
					verse = Quran.ayah.fromPage(keyword);
					gq.settings.surah = verse.surah;
					gq.settings.ayah = verse.ayah;
				}
				
				gq.player.reset();
				gq.load(gq.settings.surah, gq.settings.ayah);
				
				return true;
			}				
						
			this._keyword = keyword;
			this._position = more ? this.next() : 0;
			this._loading = true;
			gq.load();
		},
		
		loading: function (set)
		{
			if (typeof set != 'undefined')
				this._loading = set;
			
			return this._loading;
		},
			
		stop: function ()
		{
			this._keyword = '';
			this._position = 0;
			gq.load(gq.surah(), gq.ayah());
		},
		
		text: function ()
		{
			return gq.data.search.quran;
		},
		
		keyword: function ()
		{
			return this._keyword;
		},
		
		position: function ()
		{
			return this._position;
		},
		
		isNext: function ()
		{
			return gq.data.search.paging.next ? true : false;
		},
		
		next: function ()
		{
			return gq.data.search.paging.next;
		},
		
		timeTook: function ()
		{
			return gq.data.search.timeTook;
		},
		
		totalRows: function ()
		{
			return gq.data.search.paging.total_rows;
		},
		
		totalShowing: function ()
		{
			return this.isNext() ? this.next() : this.totalRows; 
		},
		
		selected: function ()
		{
			return gq.settings.selectedSearchBy;
		},
				
		isSelected: function (quranBy)
		{
			return gq.settings.selectedSearchBy[quranBy] ? true : false;
		},
		
		addQuranBy: function (quranBy)
		{
			gq.settings.selectedSearchBy[quranBy] = quranBy;
			gq.save();
		},
		
		removeQuranBy: function (quranBy)
		{
			delete gq.settings.selectedSearchBy[quranBy];
			gq.save();
		},
		
		beginVerse: function ()
		{
			return this._positionStartVerse;
		}
	},
	
	recitor: {
		
		init: function()
		{
			if (gq.settings.selectedRecitor && typeof(gq.settings.selectedRecitor) == 'object' && this.length() > 0)
			{
				gq.recitor.remove('auto'); // incase it was added
				return false;
			}
			
			//backward compatibility
			if (gq.settings.selectedRecitor && typeof(gq.settings.selectedRecitor) != 'object')
			{
				by = gq.settings.selectedRecitor;
				this.reset();
				var selectedArray = by.split('|');
				$.each(selectedArray, function(a, quranBy) {
					if (quranBy != 'auto')
						gq.recitor.add(quranBy);					
				});
			}
			else
				this.reset();
		},
		
		load: function ()
		{
			gq.player.load('new');
		},
		
		list: function()
		{
			return gq.quran.list('audio');
		},
		
		bitrateList: function (by)
		{			
			row = gq.quran.detail(by);
			
			if (!row)
				return {'auto': 'mp3,ogg'};
					
			media = row.media;
			media = media ? $.parseJSON(media) : {};
			
			bitrate = {'auto': 'mp3,ogg'};
			$.each(media, function (id, mediaRow) {
				if (bitrate[mediaRow.kbs])
					bitrate[mediaRow.kbs] += ','+mediaRow.type;
				else
					bitrate[mediaRow.kbs] = mediaRow.type;
			});
			
			return bitrate;
		},
		
		selected: function ()
		{
			return gq.settings.selectedRecitor;
		},
		
		selectedKbs: function (quranBy)
		{
			return gq.settings.selectedRecitor[quranBy];
		},
		
		reset: function ()
		{
			gq.settings.selectedRecitor = {};
			gq.save();
		},
		
		length: function ()
		{
			if (!gq.settings.selectedRecitor || typeof(gq.settings.selectedRecitor) != 'object')
				return 0;
			
			return Object.keys(gq.settings.selectedRecitor).length;
		},
		
		isSelected: function (quranBy)
		{			
			return gq.settings.selectedRecitor[quranBy] ? true : false;
		},
		
		add: function (quranBy, kbs)
		{	
			if (kbs)
				gq.settings.selectedLastRecitorBytes = kbs;
			
			gq.settings.selectedRecitor[quranBy] = kbs || 'auto';
			gq.save();
		},
		
		remove: function (quranBy)
		{
			delete gq.settings.selectedRecitor[quranBy];
			gq.save();
		}		
	},
	
	player: {
		off: false,
		id: '#audioPlayer',
		id2: '#audioPlayer2',
		swfPath: 'http://globalquran.com/images',
		audioPath: 'http://audio.globalquran.com/',
		preload: true, // true (two players playing continuesly), false (play with one and load with one) or -1 (just play only, no preload)
		autoBitrate: 'high', // high, low
		_recitor: {},
		_currentPlayer: 0,
		_i: 0, // repeat counter
		_iBug: 0, // for OS bug, triggers pause two times, need second trigger and ignore first
		_delayID: '',
		
		/**
		 * jplayer settings object, you can replace the methods in it, for customization calls
		 */
		setting: {
			supplied: 'mp3,oga,m4v', // m4v is required here, but not required on files
			wmode: "window",
			preload: 'auto',
			cssSelectorAncestor: '',
			cssSelector: {
		        play: "",
		        pause: "",
		        stop: "",
		        seekBar: "",
		        playBar: "",
		        mute: "",
		        unmute: "",
		        volumeBar: "",
		        volumeBarValue: "",
		        currentTime: "",
		        duration: ""
		      },
			size: {
			  width:"0px",
			  height: "0px",
			  cssClass: ""
			},
			ready: function (event)
			{
				gq.player.load('new'); // already getting load from recitation change
			},				
			ended: function (event)
			{		
				if (!gq.player.isOS())
				{
					if (gq.settings.audioDelay && (gq.settings.audioDelay > 0 || gq.settings.audioDelay != false))
					{
						var delay = (gq.settings.audioDelay == 'ayah') ? event.jPlayer.status.duration : gq.settings.audioDelay;
						delay = delay * 1000;
						clearTimeout(gq.player._delayID);
						gq.player._delayID = setTimeout('gq.player.next()', delay);
					}
					else
					{					        
						gq.player.next();
					}
				}
				
				$('.buffer').css('width', '0%');
			},
			loadstart: function (event)
			{
				if (gq.player.status().seekPercent != 100)
				{
					$(".progressBar").addClass("audioLoading");
				}
			},
			loadeddata: function (event)
			{
				$(".progressBar").removeClass("audioLoading");
				gq._gaqPush(['_trackEvent', 'Audio', 'load', event.jPlayer.status.src]);
			},
			seeking: function()
			{
				$(".progressBar").addClass("audioLoading");
			},
			seeked: function()
			{
				$(".progressBar").removeClass("audioLoading");
			},
			progress: function (event)
			{
				var percent = 0;
				var audio = gq.player.data().htmlElement.audio;
				
				if((typeof audio.buffered === "object") && (audio.buffered.length > 0))
				{
					if(audio.duration > 0)
					{
						var bufferTime = 0;
						for(var i = 0; i < audio.buffered.length; i++)
						{
							bufferTime += audio.buffered.end(i) - audio.buffered.start(i);
							 //console.log(i + " | start = " + audio.buffered.start(i) + " | end = " + audio.buffered.end(i) + " | bufferTime = " + bufferTime + " | duration = " + audio.duration);
						}
						percent = 100 * bufferTime / audio.duration;
					} // else the Metadata has not been read yet.
					//console.log("percent = " + percent);
				} else { // Fallback if buffered not supported
					// percent = event.jPlayer.status.seekPercent;
					percent = 100; // Cleans up the inital conditions on all browsers, since seekPercent defaults to 100 when object is undefined.
				}
				
				$('.buffer').css('width', percent+'%');
			},
			play: function (event)
			{
				$(this).jPlayer("pauseOthers"); // pause all players except this one.
				$(".playingTime").text($.jPlayer.convertTime(event.jPlayer.status.currentTime));
				$(".totalTime").text($.jPlayer.convertTime(event.jPlayer.status.duration));
				$(".progressBar").slider("value", event.jPlayer.status.currentPercentRelative);
			},
			pause: function (event)
			{
				var status = gq.player.status();

				if (gq.player.isOS() && ((gq.player._iBug == 1) || (status.duration > 0 && $.jPlayer.convertTime(status.duration) != 'NaN' && $.jPlayer.convertTime(status.duration) != '00:00' && (status.currentTime == 0 || status.currentTime == status.duration))))
				{						
					if (gq.player._iBug == 1)
						gq.player.load('play');
					else
						gq.player.next();
								
					gq.player._iBug++;
				}
			},
			timeupdate: function (event)
			{
				$(".playingTime").text($.jPlayer.convertTime(event.jPlayer.status.currentTime));
				$(".totalTime").text($.jPlayer.convertTime(event.jPlayer.status.duration));
				$(".progressBar").slider("value", event.jPlayer.status.currentPercentRelative);
			},
			error: function(event)
			{
				gq._gaqPush(['_trackEvent', 'Audio', 'Error::'+event.jPlayer.error.type, event.jPlayer.error]);
				switch(event.jPlayer.error.type)
				{
					case $.jPlayer.error.URL:
						gq._gaqPush(['_trackEvent', 'Audio', 'Error::MISSING'+$.jPlayer.error.URL]);
						gq.player.next(); // A function you might create to move on to the next media item when an error occurs.
					break;
					case $.jPlayer.error.NO_SOLUTION:
						gq._gaqPush(['_trackEvent', 'Audio', 'Error::NO_SOLUTION']);
				    break;
				}
			}
		},
				
		init: function () 
		{
			if (this.off)
				return; // player is off
			
			if (this.isOS()) // pre-settings for iphone/ipod/ipad/mac
			{
				gq.settings.playing = false; // cant auto play in iphone
				gq.player.preload = -1;  // cant load two instance in iphone
			}
			
			this.setup();
		},
		
		setup: function ()
		{	
			gq.player.setting.swfPath = gq.player.swfPath;
			gq.player.setting.volume = gq.settings.volume;
			gq.player.setting.muted = gq.settings.muted;
			
			if (!$(this.id).length)
			{
				var id = this.id; id = id.replace(/#/, '');
				$('body').append('<div id="'+id+'"></div>');
			}
			
			$(this.id).jPlayer(gq.player.setting);
			
			if (this.preload != -1)
			{
				if (!$(this.id2).length)
				{
					var id = this.id2; id = id.replace(/#/, '');
					$('body').append('<div id="'+id+'"></div>');
				}
				
				$(this.id2).jPlayer(gq.player.setting);
			}
			
			$( ".progressBar" ).slider({
				range: "min",
				min: 0,
				max: 100,
				animate: true,
				slide: function( event, ui ) {
					gq.player.seek(ui.value);
				}
			})
			.bind('mousemove', function(e) {
				var offset = $(this).offset();
				var x = e.pageX - offset.left;
				var w =  $(this).width();
				var percent = 100*x/w;
				var duration = gq.player.duration();
				var time = percent * duration / 100;
				$('.progressBar').attr('title', $.jPlayer.convertTime(time));
			})
			.find('.ui-slider-handle').addClass('icon');
			
			$( ".volumeBar" ).slider({
				orientation: "vertical",
				range: "min",
				min: 0,
				max: 100,
				value: gq.settings.volume,
				animate: true,
				slide: function( event, ui ) {
					gq.player.volume(ui.value);
					gq.layout.volume(ui.value);
				}
			})
			.find('.ui-slider-handle').addClass('icon');
			
			$.jPlayer.timeFormat.padMin = false;
		},
		
		isOS: function ()
		{
			if (/iPad/i.test(navigator.userAgent) || /iPhone/i.test(navigator.userAgent) || /iPod/i.test(navigator.userAgent))
				return true;
			else
				return false;
		},
		
		load: function (action)
		{
			if (this.off)
				return; // player is off
			
			if (action == 'new') // check if its new recitor or new bitrate, before reseting the settings.
			{
				this.reset();
			}

			if (!this.preload || this.preload == -1)
			{
				current = this._getFiles('current');
				$(this.id).jPlayer("setMedia", current);
				
				if (this.preload != -1)
				{
					next = this._getFiles('next');
					if (!next) // if reached to 6237 
						this.reset();
					else
						$(this.id2).jPlayer("setMedia", next); // just load only
				}
				
				this._currentPlayer = 1;
			}
			else if (action == 'new' || this._currentPlayer == 0) // this._currentPlayer == 0  needed for prev, but action is needed for new, because there is bug in FF
			{
				current = this._getFiles('current');
				next = this._getFiles('next');
				
				$(this.id).jPlayer("setMedia", current);
				if (!next) // if reached to 6237 
					this.reset();
				else
					$(this.id2).jPlayer("setMedia", next);
				
				this._currentPlayer = 1;
			}
			else if (this._currentPlayer == 1) // player 1
			{
				next = this._getFiles('next');
				if (next) // dont need NOT here, like others. also plays player 1 again, if set this.reset();
					$(this.id).jPlayer("setMedia", next);
				
				this._currentPlayer = 2; // play player 2, while 1 gets load
			}
			else // player 2
			{
				next = this._getFiles('next');
				if (!next) // if reached to 6237 
					this.reset();
				else
					$(this.id2).jPlayer("setMedia", next);
				
				this._currentPlayer = 1; // play player 1, while 2 gets load
			}
		
			if (gq.settings.playing && !gq.search.isActive()) // if playing, auto play
				gq.layout.play();
		},
		
		_getPlayerID: function ()
		{
			if (this._currentPlayer == 0 || this._currentPlayer == 1)
				return this.id;
			else
				return this.id2;
		},
		
		_getFiles: function (get)
		{
			get = get || 'current';
			var files = {};
			var rPos = this._recitor.position;
			var rLen = this._recitor.length;
			
			var surah = gq.surah();
			var ayah = gq.ayah();
			var verse = gq.verse();

			if (get == 'next' && rLen > 1 && rPos <= rLen)
			{
				if (rPos == rLen) // reached the last position
					rPos = 1;
				else
					rPos++;
			}
			
			//single recitor
			var recitor = this._recitor['row'+rPos];
			
			if (rPos == 1 && recitor.lastLoad == verse && ((this.preload == true && this._currentPlayer != 0) || get == 'next')) // increment, sence its same ayah
			{
				verse++;
				next = Quran.ayah.fromVerse(verse);
				surah = next.surah;
				ayah = next.ayah;
			}
			else if (this._currentPlayer == 0 && recitor.lastLoad >= 0) // this is for prev ayahs
				verse = this._recitor['row'+rPos].lastLoad;

			if (surah != 115 && surah != 9 && ayah == 1 && this._recitor.auz && recitor.lastLoad != verse && recitor.lastLoad != 0 && recitor.lastLoad != 1) // play auz
				verse = 0;
			else if (surah != 115 && surah != 9 && surah != 1 && ayah == 1 && recitor.lastLoad != verse && recitor.lastLoad != 1) // play bis
				verse = 1;

			
			if (this.preload == true || ((!this.preload || this.preload == -1) && get != 'next'))
				this._recitor['row'+rPos].lastLoad = verse;
		
			if (verse == 6237)
				return false; // there is no verse 6237
			
			if (recitor.mp3)
				files.mp3 = this.audioPath+recitor.name+'/mp3/'+recitor.kbs+'kbs/'+verse+'.mp3';
			if (recitor.ogg)
				files.oga = this.audioPath+recitor.name+'/ogg/'+recitor.kbs+'kbs/'+verse+'.ogg';
						
			return files;
		},
		
		_recitorReset: function ()
		{
			if (!gq.data.loaded)
				return false; // need to load data first
			
			var recitorArray = gq.recitor.selected();
			
			if (gq.recitor.length() == 0)
			{
				gq.recitor.add('ar.alafasy');
								
				list = gq.recitor.list();
				$.each(list, function(by, row)
				{
					if (gq.language.selected() != 'ar' && gq.language.selected() == row.language_code)
					{
						gq.recitor.add(by);
						return true;
					}
				});
				
				gq.layout.recitorList();
			}			
			
			// setting the recitor array
			var recitor = {auz: true, position: 1, length: gq.recitor.length()};
			
			recitorArray = gq.recitor.selected();

			i = 0;
			$.each(recitorArray, function(recitorName, kbs) {
				++i; // increment on start, because i starts with 0
				recitorInfo = gq.player._recitorInfo(recitorName);
				recitor['row'+i] = recitorInfo;
				recitor['row'+i].name = recitorName;
				recitor['row'+i].lastLoad = -1;
				
				if (!recitorInfo.auz) // if one of the recitor dont have auz, then turn off completely.
					recitor.auz = false;
			});

			this._recitor = recitor;
			this._currentPlayer = 0;
		},
		
		_recitorInfo: function (recitorName)
		{
			if (!recitorName)
				return {
					kbs: '0',
					mp3: false,
					ogg: false,
					auz: false
				};

			row = gq.data.quranList[recitorName];
			kbs = gq.recitor.selectedKbs(recitorName);
			
			media = row.media;
			media = media ? $.parseJSON(media) : {};
						
			if (kbs == 'auto' || (!media['mp3-'+kbs] && !media['ogg-'+kbs]))
			{
				$.each(media, function(key, mediaRow) {
					kbs = mediaRow.kbs;
					if (gq.player.autoBitrate == 'low')
						return; // exit loop
				});
			}
			
			if (media['mp3-'+kbs] && media['mp3-'+kbs]['auz'])
				auz = true;
			else if (media['ogg-'+kbs] && media['ogg-'+kbs]['auz'])
				auz = true;
			else
				auz = false;
			
			return {
				kbs: kbs,
				mp3: media['mp3-'+kbs] ? true : false,
				ogg: media['ogg-'+kbs] ? true : false,
				auz: auz
			};
		},
		
		recitorBy: function ()
		{
			return (this._recitor.length > 0) ? this._recitor['row'+this._recitor.position].name : 'undefined';
		},
		
		recitorKbs: function ()
		{
			return (this._recitor.length > 0) ? this._recitor['row'+this._recitor.position].kbs  : 'undefined';
		},
		
		isPlaying: function ()
		{
			return !this.status().paused;
		},
		
		reset: function (from)
		{
			this._recitorReset();
			this._recitor.position = 1;
			this._i = 0;
			this._currentPlayer = 0;
		},
		
		play: function ()
		{	
			$(this._getPlayerID()).jPlayer('play');
			gq.settings.playing = true;
			gq.save();
			gq._gaqPush(['_trackEvent', 'Audio', 'Play', this.recitorBy()]);
		},
		
		pause: function ()
		{	
			$(this._getPlayerID()).jPlayer('pause');
			gq.settings.playing = false;
			gq.save();
			gq._gaqPush(['_trackEvent', 'Audio', 'Pause', this.recitorBy()]);
		},
		
		stop: function ()
		{	
			$(this._getPlayerID()).jPlayer('stop');
			this.reset();
			gq._gaqPush(['_trackEvent', 'Audio', 'Stop', this.recitorBy()]);
		},
		
		next: function ()
		{
			var rPos = this._recitor.position;
			var rLen = this._recitor.length;
			var lastLoad = this._recitor['row'+rPos].lastLoad;
			
			var next = Quran.ayah.next(gq.surah(), gq.ayah());
			var page = Quran.ayah.page(next.surah, next.ayah);
			var juz  = Quran.ayah.juz(next.surah, next.ayah);
			var surah = next.surah;
			var ayah  =  next.ayah;
			var verse = Quran.verseNo.ayah(next.surah, next.ayah);
			var conf = gq.settings;
	
			if (rLen > 1 && rPos != rLen)
			{
				this._recitor.position++;
				this.load('play');
				return;
			}
			else if (gq.surah() != 9 && gq.ayah() == 1 && (lastLoad == 0 || (gq.surah() != 1 && lastLoad == 1))) // for auz,bis and ayah
			{
				if (rLen > 1 && rPos == rLen) // reset to first recitor
					this._recitor.position = 1; 
				
				this.load('play');
				return;
			}
			else if (rLen > 1 && rPos == rLen) // reset to first recitor
				this._recitor.position = 1;
						
			
			if (this.preload == true && rLen == 1 && lastLoad != verse && lastLoad != 0 && lastLoad != 1) // for single recitor
			{
				this.load('play');
				return;
			}
			
			
			if (conf.repeat && conf.repeatEach == 'ayah' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{			
				// loop through recitors, if more then one recitor is selected.
				if (rLen > 1)
				{
					this.load('play'); // recitor position has been reset above.
					return;
				}
				
				if (this.isOS())
					this.load('play'); // for OS we have to load again
				else
					this.play(); // just play, no load
				this._i++;
				return;
			}
			else if (surah != gq.surah() && conf.repeat && conf.repeatEach == 'surah' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (this.preload != true)
					this._recitor['row1'].lastLoad = -1;
				gq.load(gq.surah(), 1);
				this._i++;
				return;
			}
			else if (page != gq.page() && conf.repeat && conf.repeatEach == 'page' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (this.preload != true)
					this._recitor['row1'].lastLoad = -1;
				load = Quran.ayah.fromPage(gq.page());
				gq.load(load.surah, load.ayah);
				this._i++;
				return;
			}
			else if (juz != gq.juz() && conf.repeat && conf.repeatEach == 'juz' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (this.preload != true)
					this._recitor['row1'].lastLoad = -1;
				load = Quran.ayah.fromJuz(gq.juz());
				gq.load(load.surah, load.ayah);
				this._i++;
				return;
			}
			else
			{	
				if (verse == Quran.verseNo.ayah(gq.surah(), gq.ayah()) && verse >= 6236)
				{
					if (gq.settings.playing && verse >= 6236)
						gq.layout.stop();
					return;
				}
				
				gq.nextAyah();
				gq.layout.ayahChanged();
				//gq.load(surah, ayah);
				this._i = 0;
				return;
			}
		},
		
		prev: function ()
		{
			var rPos = this._recitor.position;
			var rLen = this._recitor.length;
			var lastLoad = this._recitor['row'+rPos].lastLoad;
			
			var prev = Quran.ayah.prev(gq.surah(), gq.ayah());
			var page = Quran.ayah.page(prev.surah, prev.ayah);
			var juz  = Quran.ayah.juz(prev.surah, prev.ayah);
			var surah = prev.surah;
			var ayah  =  prev.ayah;
			var verse = Quran.verseNo.ayah(prev.surah, prev.ayah);
			var conf = gq.settings;
			
			this._currentPlayer = 0;
			this._i = 0;
			
			//FIXME doesnt work properly on preload enabled, so for now we not repeating auz,bis for ayahs on prev
			if (!this.preload && this.preload == -1 && gq.surah() != 9 && gq.ayah() == 1 && ((lastLoad != 0 && this._recitor.auz) || (lastLoad != 1 && !this._recitor.auz) || ((lastLoad == 1 && rPos > 1) || (this._recitor.auz && lastLoad == 0 && rPos > 1)))) //&& (lastLoad == gq.verse() || (gq.surah() != 1 && lastLoad == 1))) // for auz,bis and ayah
			{
				if (!conf.repeat || (conf.repeat && conf.repeatEach != 'ayah')) // ayah repeat on bis gives problem
				{					
					if (rLen > 1 && rPos == 1) // reset to first recitor
						this._recitor.position = this._recitor.length;
					else if (rLen > 1 && rPos > 1)
						this._recitor.position--;
					
					lastLoad = this._recitor['row'+this._recitor.position].lastLoad; 
					
					if (lastLoad == 1 && this._recitor.auz)
					{
						if (this.preload == true)
							this._prevRestRecitor(this._recitor.position, verse);						
						this._recitor['row'+this._recitor.position].lastLoad = 0;
					}
					else if (lastLoad == gq.verse())
					{
						if (this.preload == true)
							this._prevRestRecitor(this._recitor.position, this._recitor.auz ? 0 : 1);
						this._recitor['row'+this._recitor.position].lastLoad = 1;
					} 
					else if (lastLoad > gq.verse())
					{
						if (this.preload == true)
							this._prevRestRecitor(this._recitor.position, 1);
						this._recitor['row'+this._recitor.position].lastLoad = gq.verse();
					}
					
					this.load('play');
					return;
				}
			}
			
			if (rLen > 1 && rPos > 1)
			{
				this._recitor.position--;
				this._recitor['row'+this._recitor.position].lastLoad = gq.verse();
				this.load('play');
				return;
			}
			else if (rLen > 1 && rPos == 1) // reset to first recitor
			{
				this._recitor.position = this._recitor.length;
				this._recitor['row'+this._recitor.position].lastLoad = verse;
			}
						
			if (conf.repeat && conf.repeatEach == 'ayah' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				this._recitor['row'+this._recitor.position].lastLoad = gq.verse();
				// loop through recitors, if more then one recitor is selected.
				if (rLen > 1)
				{
					this.load('play'); // recitor position has been reset above.
					return;
				}
				this.play(); // just play, no load
				this._i = (this._i > 1) ? this._i-1 : 1;
				return;
			}
			else if (surah != gq.surah() && conf.repeat && conf.repeatEach == 'surah' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (gq.surah() == 114)
					verse = 6236;
				else
					verse = Quran.verseNo.surah(gq.surah()+1)-1;
				
				this._recitor.position = this._recitor.length;
				this._recitor['row'+this._recitor.position].lastLoad = verse;
				
				load = Quran.ayah.fromVerse(verse);
				gq.load(load.surah, load.ayah);
				this._i = (this._i > 1) ? this._i-1 : 1;
				return;
			}
			else if (page != gq.page() && conf.repeat && conf.repeatEach == 'page' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (gq.page() == 604)
					verse = 6236;
				else
					verse = Quran.verseNo.page(gq.page()+1)-1;
				
				this._recitor.position = this._recitor.length;
				this._recitor['row'+this._recitor.position].lastLoad = verse;
				
				load = Quran.ayah.fromVerse(verse);		
				gq.load(load.surah, load.ayah);
				this._i = (this._i > 1) ? this._i-1 : 1;
				return;
			}
			else if (juz != gq.juz() && conf.repeat && conf.repeatEach == 'juz' && (!conf.repeatTimes || conf.repeatTimes >= this._i))
			{
				if (gq.juz() == 30)
					verse = 6236;
				else
					verse = Quran.verseNo.juz(gq.juz()+1)-1;
				
				this._recitor.position = this._recitor.length;
				this._recitor['row'+this._recitor.position].lastLoad = verse;
				
				load = Quran.ayah.fromVerse(verse);	
				gq.load(load.surah, load.ayah);
				this._i = (this._i > 1) ? this._i-1 : 1;
				return;
			}
			else
			{
				this._recitor['row'+this._recitor.position].lastLoad = verse;
				
				if (verse == Quran.verseNo.ayah(gq.surah(), gq.ayah()) && verse == 1)
					return;

				gq.load(surah, ayah);
				this._i = 0;
				return;
			}
		},
		
		_prevRestRecitor: function (pos, verse)
		{
			for ( var i = 1; i < pos; i++)
            {
				this._recitor['row'+i].lastLoad = verse;
            }
		},
		
		/**
		 * seek to new position in audio
		 * @param number
		 * @param usingSeconds if set to true, then number should be seconds / else percentage
		 */
		seek: function (number, usingSeconds)
		{
			number = number || 0;
			usingSeconds = usingSeconds || false;
			
			if (usingSeconds == false)
			{
				$(this._getPlayerID()).jPlayer('playHead', number);
			}
			else
			{
				if (this.isPlaying())
					$(this._getPlayerID()).jPlayer('play', number);
				else
					$(this._getPlayerID()).jPlayer('pause', number);				
			}			
		},
		
		volume: function (volume)
		{
			$(this.id).jPlayer('volume', volume);
			$(this.id2).jPlayer('volume', volume);
			gq.settings.volume = volume;
			gq.save();
		},
		
		mute: function ()
		{			
			$(this.id).jPlayer('mute');
			$(this.id2).jPlayer('mute');
			gq.settings.muted = true;
			gq.save();
		},
		
		unmute: function ()
		{
			$(this.id).jPlayer('unmute');
			$(this.id2).jPlayer('unmute');
			gq.settings.muted = false;
			gq.save();
		},
		
		repeat: function (bool)
		{
			gq.settings.repeat = bool;
			gq.save();
		},
		
		repeatEach: function (repeat)
		{
			gq.settings.repeatEach = repeat;
			gq.save();
		},
		
		repeatTimes: function (times)
		{
			gq.settings.repeatTimes = times;
			gq.save();
		},
		
		audioDelay: function (delay)
		{
			gq.settings.audioDelay = delay;
			gq.save();
		},
		
		duration: function ()
		{
			return this.status().duration;
		},
		
		playingTime: function ()
		{
			return this.status().currentTime;
		},
		
		status: function (playerID)
		{
			var playerID = playerID || this._getPlayerID();
			return $(playerID).data("jPlayer").status;
		},
		
		data: function (playerID)
		{
			var playerID = playerID || this._getPlayerID();
			return $(playerID).data("jPlayer");
		},
		
		destroy: function (playerID)
		{
			if (playerID)			
				$(playerID).jPlayer("destroy").remove();
			else
			{
				if ($(this.id).length)
					$(this.id).jPlayer("destroy").remove();
				if ($(this.id2).length)
					$(this.id2).jPlayer("destroy").remove();
			}
		}
	},
	
	layout: {
		displayStartup: function (success) {}, // replace this function with yours
		display: function (success) {}, // replace this function with yours
		ayahChanged: function () {},
		volume: function (val) {},
		play: function () {},
		stop: function () {},
		recitorList: function () {}
	},
	
	font: {
		setFamily: function (fontFamily)
		{
			gq.settings.font = fontFamily;
			gq.save();
		},
		
		setSize: function (size)
		{
			gq.settings.fontSize = size;
			gq.save();
		},
		
		getFamily: function (by)
		{			
			if (gq.settings.font == 'auto' && gq.quran.isSelected(by) && gq.quran.detail(by).type == 'quran')
			{
				if (/mac/i.test(navigator.platform)) // isMac
						return 'Scheherazade';
				if (/uthmani/.test(by)) // isUthamani
					return 'me_quran';
				else if (/tajweed/.test(by)) // isTajweed
					return '_PDMS_Saleem_QuranFont';
				else
					return 'KFGQPC Uthman Taha Naskh';
			}
			
			return (gq.settings.font != 'auto') ? gq.settings.font : '';			
		},
		
		getSize: function ()
		{
			return gq.settings.fontSize;
		}
	},
	
	
	
	
	setFullScreen: function (enable)
	{
		this.settings.fullScreen = enable;
		this.save();
	},
	
	juz: function (juz)
	{		
		if (juz)
		{
			juz = Quran._fixJuzNum(juz);
			var verse = Quran.ayah.fromJuz(juz);
			
			if (this.page() != Quran.ayah.page(verse.surah, verse.ayah))
			{
				this.load(verse.surah, verse.ayah);
				return false;
			}
		}
		
		return this.settings.juz;
	},
	
	page: function (page)
	{		
		if (page)
		{
			page = Quran._fixPageNum(page);
			var verse = Quran.ayah.fromPage(page);
			
			if (this.page() != Quran.ayah.page(verse.surah, verse.ayah))
			{
				this.load(verse.surah, verse.ayah);
				return false;
			}
		}
		
		return this.settings.page;
	},
	
	surah: function (surah)
	{		
		if (surah)
		{
			surah = Quran._fixSurahNum(surah);
			var ayah = 1;
			
			if (this.page() != Quran.ayah.page(surah, ayah))
			{
				this.load(surah, ayah);
				return false;
			}
			else
			{
				this.settings.surah = surah;
				this.settings.ayah = 1;
			}
		}
		
		return this.settings.surah;
	},
	
	ayah: function (surah, ayah)
	{		
		if (surah)
		{
			surah = Quran._fixSurahNum(surah);
			ayah  = Quran._fixAyahNum(surah, ayah);
			
			if (this.page() != Quran.ayah.page(surah, ayah))
			{
				this.load(surah, ayah);
				return false;
			}
			else
			{
				this.settings.surah = surah;
				this.settings.ayah = ayah;
				this.player.load('new');
				this.save();
			}
		}
		
		return this.settings.ayah;
	},
	
	verse: function (surah, ayah)
	{
		surah = surah ? Quran._fixSurahNum(surah) : this.settings.surah;
		ayah  = ayah ? Quran._fixAyahNum(surah, ayah) : this.settings.ayah;
	
		return Quran.verseNo.ayah(surah, ayah);
	},
	

	nextAyah: function ()
	{
		var verse = Quran.ayah.next(this.surah(), this.ayah());
		
		if (verse.surah == this.surah() && verse.ayah == this.ayah())
			return verse; // ayah already exist on the page
	
		this.settings.surah = verse.surah;
		this.settings.ayah = verse.ayah;
				
		if (this.ayah(verse.surah, verse.ayah))
			return verse; // ayah already exist on the page
		else
			return false;	
	},
	
	prevAyah: function ()
	{
		var verse = Quran.ayah.prev(this.surah(), this.ayah());
		
		if (verse.surah == this.surah() && verse.ayah == this.ayah())
			return verse; // ayah already exist on the page

		this.settings.surah = verse.surah;
		this.settings.ayah = verse.ayah;
				
		if (this.ayah(verse.surah, verse.ayah))
			return verse; // ayah already exist on the page
		else
			return false;
	},
	
	nextPage: function ()
	{
		return this.page(this.page()+1);
	},
	
	prevPage: function ()
	{
		return this.page(this.page()-1);
	},
	
	nextSurah: function () {
		return this.surah(this.surah()+1);
	},
	
	prevSurah: function () {
		return this.surah(this.surah()-1);
	},
	
	ayahs: function () {	
		return this.data.ayahList;
	},
	
	save: function () {
		this._cookieSave(); // save settings
	},
	
	load: function (surah, ayah)
	{
		firstLoad = false;
		notCachedQuranID = true;

		if (surah && ayah)
			this.search._keyword = false;
		
		if (!surah && !ayah && !this.search.isActive())
		{
			firstLoad = true;
			this._cookieRead();
			this.url.load();
		}
		
		if (this.search.isActive())
		{
			this.search.loading(true);
			var requestUrl = this.apiURL;
			
			if (firstLoad)
				requestUrl += 'all/';
			
			requestUrl += 'search/'+this.search.keyword()+'/'+this.search.position();
			
			if (this.search.position() == 0)
				this.url.save();
		}
		else if (!surah && !ayah)
		{	
			this.settings.page = 0; // url wont load, if its same as url page 1=1
			this.url.load();
			
			this.settings.surah = this.settings.surah || 1;
			this.settings.ayah = this.settings.ayah || 1;
			this.settings.juz =  Quran.ayah.juz(this.settings.surah, this.settings.ayah);	
			this.settings.page = Quran.ayah.page(this.settings.surah, this.settings.ayah);		
			this.data.ayahList = Quran.ayah.listFromPage(this.settings.page);
	
			requestUrl = this.apiURL+'all/page/'+this.settings.page;

			if (this.quran.length() > 0)// TODO add this.noData for getting no quran text from server.
				requestUrl += '/'+this.quran.selectedString();
			/*if (this.settings.selectedLanguage) // TODO language selection here
				requestUrl += '/'+this.settings.selectedLanguage;*/
		}//TODO add other methods too ex: search and language pack
		else
		{
			this.settings.surah = surah;
			this.settings.ayah = ayah;
			this.settings.juz = Quran.ayah.juz(surah, ayah);
			this.settings.page = Quran.ayah.page(surah, ayah);		
			this.data.ayahList = Quran.ayah.listFromPage(this.settings.page);
						
			notCachedQuranID = this.quran.textNotCached();			
			
			requestUrl = this.apiURL+'page/'+this.settings.page+'/'+notCachedQuranID;
			this.url.save();
		}
		
		this.save();
		this._gaqPush(['_trackPageview', '/#!'+this.url.page()]);
		
		if (this.noData && !firstLoad) // if no data need to be output, then run request only once
			notCachedQuranID = false;

		if (notCachedQuranID)
		{
			$jsonp = $.support.cors ? '' : '.jsonp?callback=?';
			$.ajaxSetup({ cache: true, jsonpCallback: 'quranData' });

			$.getJSON(requestUrl+$jsonp, function(response) {			
				gq._loadResponse(response, firstLoad);
			});
		}
		else
		{
			gq.layout.display(true);	
			gq.player.load('play');
		}
		
		return false;
	},
	
	_loadResponse: function (response, firstLoad)
	{
		if (typeof(response) == 'object')			
		{
			gq.data = $.extend(true, gq.data, response);
			gq.data.loaded = true;
		}
		
		if (gq.search.isActive())
		{
			gq.search.init();
			gq.search.loading(false);
			if (gq.search.totalRows() > 0)
			{
				for (var verseNo in response.search.quran)
				{
					gq.search._positionStartVerse = verseNo;
					break;
				}
			}			
		}
		
		if (response.languageSelected)
			gq.settings.selectedLanguage = response.languageSelected;
				
		if (firstLoad) // first time loading the page
		{
			gq.player.init(); // player
			
			if (!gq.quran.length() && typeof(response) == 'object' && response.quran)
			{
				$.each(response.quran, function(defaultQuranBy, ignore) {
					gq.quran.add(defaultQuranBy);
				});
				
				this.url.save(); // cause defaultQuranBy set here
		corpusInit();
			}

			gq.layout.displayStartup((typeof(response) == 'object'));
		}
		else
		{
			gq.layout.display((typeof(response) == 'object'));
			gq.player.load('play');
		}
	},
	
	url: {
		
		load: function ()
		{
			var hash = window.location.hash;
			hash = hash.split('/');
			var count = hash.length;

			if (count > 2 && hash['1'] == 'search')
			{
				if (gq.search.keyword() == hash['2'] && gq.search.position() == 0)
					return false;
				
				gq.search._keyword = hash['2'];
				gq.search._position = 0;
				
				return true;
			}
			else if (count > 2 && gq.settings.page != hash['2'])
			{
				gq.quran.reset();
				selectedBy = hash['1'].split('|');
		
				$.each (selectedBy, function(i, quranBy)
				{
					gq.quran.add(quranBy);
				});
				
				verse = hash['2'].split(':');
				
				if (verse.length > 1)
				{
					gq.settings.surah = Quran._fixSurahNum(parseInt(verse['0']));
					gq.settings.ayah = Quran._fixAyahNum(gq.settings.surah, parseInt(verse['1']));
				}
				else
				{
					verse = Quran.ayah.fromPage(hash['2']);
					gq.settings.surah = verse.surah;
					gq.settings.ayah = verse.ayah;
				}		
				
				gq.player.reset();
			
				return true;
			}
			else if (/^[0-9]+:?[0-9]*$/.test(hash['1']))
			{
				verse = hash['1'].split(':');
				
				if (verse.length > 1)
				{
					gq.settings.surah = Quran._fixSurahNum(parseInt(verse['0']));
					gq.settings.ayah = Quran._fixAyahNum(gq.settings.surah, parseInt(verse['1']));
				}
				else
				{
					verse = Quran.ayah.fromPage(hash['1']);
					gq.settings.surah = verse.surah;
					gq.settings.ayah = verse.ayah;
				}		
				
				gq.player.reset();
			
				return true;
			}
			
			return false;
		},
		
		save: function ()
		{
			window.location.hash = '#!'+this.page();
		},
		
		hashless: function ()
		{
		    var url = window.location.href;
		    var hash = window.location.hash;
		    var index_of_hash = url.indexOf(hash) || url.length;
		    var hashless_url = url.substr(0, index_of_hash);
		    return hashless_url;
		},
		
		page: function (page)
		{
			if (gq.search.isActive())
				return '/search/'+gq.search.keyword();
			else
			{
				url = '/';
				by = gq.quran.selectedString();
				if (by)
					url += by+'/';
				url += page || gq.settings.page;
				return url;
			}
		},
		
		ayah: function (surah, ayah)
		{
			if (gq.search.isActive())
				return '/'+gq.settings.surah+':'+gq.settings.ayah;
			else
			{
				url = '/';
				by = gq.quran.selectedString();
				if (by)
					url += by+'/';
				if (surah)
					url += gq.settings.surah+':'+gq.settings.ayah;
				else
					url += surah+':'+ayah;
				return url;
			}
		}
	},
	
	_cookieRead: function ()
	{
		var settings = '';
		var nameEQ = "settings=";
	    var ca = document.cookie.split(';');
	    for(var i=0;i < ca.length;i++)
	    {
	        var c = ca[i];
	        while (c.charAt(0)==' ')
	        	c = c.substring(1,c.length);
	        
	        if (c.indexOf(nameEQ) == 0) 
	        	settings = c.substring(nameEQ.length,c.length);
	    }
	    
	    settings = $.parseJSON(settings);
	    $.extend(true, this.settings, settings);
	    this.quran.init();
	    this.recitor.init();
	},
	
	_cookieSave: function (data)
	{
		var firstRun = (typeof(data) == 'undefined'); 
		var settings = '';
		data =  firstRun ? this.settings : data;
		
		if (!firstRun && data == null)
			return '{}';
		
		$.each(data, function(key, val) {
			if (typeof(val) == 'object' || typeof(val) == 'array')
				settings += '"'+key+'":'+gq._cookieSave(val)+',';
			else if (typeof(val) != 'string')
				settings += '"'+key+'":'+val+','; // no quote's
			else
				settings += '"'+key+'":"'+val+'",';
		});
		settings = settings.slice(0, -1); // this is here, just to remove comma
		settings = '{'+settings+'}';
			
		// first time load  save only
		if (firstRun)
		{
			var date = new Date();
	        date.setTime(date.getTime()+(365*24*60*60*1000)); // expire in 1 year
	        var expires = "; expires="+date.toGMTString();
	        document.cookie = "settings="+settings+expires+"; path=/";
		}
		
		return settings;
	},
	
	googleAnalytics: function ()
	{
		var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	    
	    if (typeof(_gaq) == 'undefined')
	    	_gaq = [];	    
	    window._gaq = _gaq || [];
	    
	    if (this.googleAnalyticsID)
	    {
	    	_gaq.push(['b._setAccount', this.googleAnalyticsID]);
	    }
	    
	    _gaq.push(['_setAccount', this._gaID]);
	    this._gaqPush(['_setSessionCookieTimeout', 360000000]);
	    this._gaqPush(['_trackPageview']);   
	},
	
	_gaqPush: function(arrayValue)
	{		
		_gaq.push(arrayValue);
		if (this.googleAnalyticsID)
		{
			arrayValue[0] = 'b.'+arrayValue[0];
			_gaq.push(arrayValue);
		}
	}
};

if (!Object.keys)
{
    Object.keys = function (obj)
    {
        var keys = [],
            k;
        for (k in obj)
        {
            if (Object.prototype.hasOwnProperty.call(obj, k))
            {
                keys.push(k);
            }
        }
        return keys;
    };
}


	var corpusInit = function(){ return;
	debugger;
		//HARDCODE the metadata for now
		gq.data.quranList['quran-corpus'] = {
			"language_code": "ar",
			"english_name": "Corpus",
			"native_name": "",
			"format": "text",
			"type": "quran",
			"source": "Hafidh.com",
			"default": null,
			"last_update": "1969-12-31"
		};

		gq.data['quran-corpus'] = {'verseNo1': {surah: 1, ayah:1, verse: 'text'}, 2: {surah: 1, ayah:1, verse: 'text'}, 3: {surah: 1, ayah:1, verse: 'text'}, 4: {surah: 1, ayah:1, verse: 'text'}, 5: {surah: 1, ayah:1, verse: 'text'}, 6: {surah: 1, ayah:1, verse: 'text'}, 7: {surah: 1, ayah:1, verse: 'text'}, 8: {surah: 1, ayah:1, verse: 'text'}, 9: {surah: 1, ayah:1, verse: 'text'}} // add all 6236 verses here. 
			
		// now we will select quran data
		gq.quran.add('quran-corpus'); // selecting corpus data
	}