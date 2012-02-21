/**
 * 
 */

gq.player.off = true;

gq.load = function (surah, ayah)
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
		//$jsonp = $.support.cors ? '' : '.jsonp?callback=?';
		//$.ajaxSetup({ cache: true, jsonpCallback: 'quranData' });

		$.getJSON('quran-all.json', function(response) {			
			gq._loadResponse(response, firstLoad);
		});
		$.getJSON('quran-corpus.json', function(response) {			
			gq._loadResponse(response, firstLoad);
		});
	}
	else
	{
		gq.layout.display(true);	
		gq.player.load('play');
	}
	
	return false;
};

gq.quran.parse.cookdata();