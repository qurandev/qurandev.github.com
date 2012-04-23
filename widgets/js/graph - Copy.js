var labelType, useGradients, nativeTextSupport, animate;

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport 
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
  elem: false,
  write: function(text){
    if (!this.elem) 
      this.elem = document.getElementById('log');
    this.elem.innerHTML = text;
    this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
  }
};


function init(){
	var json = {"id":"rootrHm","name":"rHm","data":{},"children":[{"id":"57rootr~aHoma`n","name":"r~aHoma`n","data":{},"children":[]},{"id":"116rootr~aHiym","name":"r~aHiym","data":{},"children":[]},{"id":"114rootraHomap","name":"raHomap","data":{},"children":[]},{"id":"12root>aroHaAm","name":">aroHaAm","data":{},"children":[]},{"id":"28rootr~aHima","name":"r~aHima","data":{},"children":[]},{"id":"4root>aroHam","name":">aroHam","data":{},"children":[]},{"id":"6rootr~a`Himiyn","name":"r~a`Himiyn","data":{},"children":[]},{"id":"1rootruHom","name":"ruHom","data":{},"children":[]},{"id":"1rootmaroHamap","name":"maroHamap","data":{},"children":[]}]};
	
	json = {"id":"rootsmw","name":"smw","data":{},"children":[{"id":"39root{som","name":"{som","data":{},"children":[]},{"id":"310rootsamaA^'","name":"samaA^'","data":{},"children":[]},{"id":"21rootm~usam~FY","name":"m~usam~FY","data":{},"children":[]},{"id":"8rootsam~aY`","name":"sam~aY`","data":{},"children":[]},{"id":"2rootsamiy~","name":"samiy~","data":{},"children":[]},{"id":"1roottasomiyap","name":"tasomiyap","data":{},"children":[]}]};
	
	
	var graph = { "id": "root", "name": "root", data: {}, children: [] }
	
	var json = {"gDb":{"n":24,"f":5,"d":{"magoDuwb":1,"gaDab":14,"gaDiba":6,"gaDoba`n":2,"muga`Dib":1}},"mrD":{"n":24,"f":3,"d":{"m~araD":13,"m~ariyD":10,"mariDo":1}},"Smm":{"n":15,"f":3,"d":{">aSam~":12,"Sam~u":2,">aSam~a":1}},"H*r":{"n":21,"f":6,"d":{"Ha*ar":2,"yaHo*aru":12,"yuHa*~iru":2,"Hi*or":3,"maHo*uwr":1,"Ha`*iruwn":1}},"kwd":{"n":24,"f":1,"d":{"kaAda":24}},"m$y":{"n":23,"f":3,"d":{"m~a$a":21,"ma$oy":1,"m~a$~aA^'":1}},"vmr":{"n":24,"f":4,"d":{"vamara`t":16,"vamarap":1,"vamar":5,">avomara":2}},"swr":{"n":17,"f":4,"d":{"suwrap":10,">asaAwir":5,"tasaw~aru":1,"suwr":1}},"Hjr":{"n":21,"f":6,"d":{"HijaArap":10,"Hajar":2,"Hujuwr":1,"Hijor":5,"m~aHojuwr":2,"Hujura`t":1}},"ktm":{"n":21,"f":1,"d":{"katama":21}},"vmn":{"n":19,"f":6,"d":{"vaman":11,"v~umun":1,"vama`niyap":4,"vaAmin":1,"vama`niyn":1,"vama`niY":1}},"lbs":{"n":23,"f":4,"d":{"labaso":11,"libaAs":10,"labuws":1,"labos":1}},"x$E":{"n":17,"f":3,"d":{"xaA$iE":14,"xu$uwE":1,"xa$aEati":2}},"swm":{"n":15,"f":5,"d":{"yasuwmu":4,"siyma`":6,"m~usaw~amap":3,"musaw~imiyn":1,"tusiymu":1}},"grq":{"n":23,"f":4,"d":{">ugoriqu":17,"garaq":1,"m~ugoraquwn":4,"garoq":1}},"rbE":{"n":22,"f":5,"d":{">arobaE":7,">arobaEap":9,"ruba`E":2,"r~ubuE":2,"raAbiE":2}},"jhr":{"n":16,"f":4,"d":{"jahorap":3,"jahor":7,"jahara":5,"jihaAr":1}},"xTA":{"n":22,"f":7,"d":{"xaTiy^_#ap":8,">axoTa>o":2,"xaTa_#":2,"xaTiy^_#a`t":2,"xa`Ti_#iyn":5,"xiTo_#":1,"xaATi}ap":2}},"fjr":{"n":24,"f":9,"d":{"{nfajarato":1,"yatafaj~aru":1,"fajor":6,"yafojura":2,"fuj~irato":6,"tafojiyr":2,"fuj~aAr":4,"faAjir":1,"fujuwr":1}},"*ll":{"n":24,"f":10,"d":{"*il~ap":7,"*aluwl":2,"tu*il~u":1,">a*il~ap":4,"*ulul":1,"*~ul~":3,"n~a*il~a":1,"*ul~ilato":2,">a*al~":2,"ta*oliyl":1}},"bwA":{"n":17,"f":4,"d":{"baA^'a":6,"baw~a>a":6,"yatabaw~a>u":4,"mubaw~a>":1}},"hwd":{"n":21,"f":3,"d":{"haAdu":11,"huwd2":3,"huwd":7}},"Ew*":{"n":17,"f":4,"d":{"Eu*o":10,">uEiy*u":1,"{sotaEi*o":4,"maEaA*":2}},"jhl":{"n":24,"f":6,"d":{"jaAhil":10,"ja`hiliy~ap":1,"jaha`lap":4,"ja`hiliy~ap2":3,"yajohalu":5,"jahuwl":1}},"frD":{"n":18,"f":4,"d":{"faAriD":1,"faraDa":9,"fariyDap":6,"m~aforuwD":2}},"Eln":{"n":16,"f":2,"d":{">aEolan":12,"EalaAniyap":4}},"mny":{"n":21,"f":6,"d":{">umoniy~at":6,"yataman~a":6,"yuman~iy":2,"taman~aY`^":3,"yumonaY`":3,"m~aniY~":1}},"ytm":{"n":23,"f":1,"d":{"yatiym":23}},"xff":{"n":17,"f":5,"d":{"xaf~afa":8,"taxofiyf":1,"xaf~ato":3,"xafiyf":2,"{sotaxaf~a":3}},"Emr":{"n":24,"f":10,"d":{"yuEam~aru":5,"{Eotamara":1,"Eumorap":2,"Eamaru":4,"EimaArap":1,"Eumur":7,"{sotaEomara":1,"Eamor":1,"m~uEam~ar":1,"maEomuwr":1}},"Alf":{"n":22,"f":4,"d":{">alof":14,">al~afa":5,"mu&al~afap":1,"<ila`f":2}},"snw":{"n":20,"f":3,"d":{"sanap":7,"siniyn":12,"sanaA":1}},"mnE":{"n":17,"f":5,"d":{"m~anaEa":12,"m~an~aAE":2,"mamonuwEap":1,"m~aAniEat":1,"manuwE":1}},"$rq":{"n":17,"f":6,"d":{"ma$oriq":11,"m~u$oriqiyn":2,"$aroqiy~":1,"$aroqiy~ap":1,"<i$oraAq":1,">a$oraqati":1}},"grb":{"n":19,"f":7,"d":{"magorib":10,"guraAb":2,"garabat":2,"guruwb":2,"garobiy~ap":1,"garobiY~":1,"garaAbiyb":1}},"mll":{"n":18,"f":2,"d":{"mil~ap":15,"yumil~a":3}},"tmm":{"n":22,"f":4,"d":{">atam~a":16,"tam~a":4,"tamaAm":1,"mutim~":1}},"bld":{"n":19,"f":2,"d":{"balad":14,"balodap":5}},"Sfw":{"n":17,"f":5,"d":{"{SoTafaY`":12,"SafowaAn":1,">aSofaY`":2,"muSoTafayon":1,"m~uSaf~FY":1}},"mry":{"n":20,"f":6,"d":{"mumotariyn":4,"yamotaru":5,"miroyap":5,"tumaAri":1,"miraA^'":1,"tamaAra":4}},"dbb":{"n":18,"f":1,"d":{"daA^b~ap":18}},"fH$":{"n":24,"f":2,"d":{"faHo$aA^'":7,"fa`Hi$ap":17}},"rqb":{"n":24,"f":6,"d":{"raqabap":9,"raqiyb":5,"yaroqubu":3,"{rotaqibo":4,"yataraq~abu":2,"m~urotaqibuwn":1}},"Hrr":{"n":15,"f":6,"d":{"Hur~":2,"muHar~ar":1,"taHoriyr":5,"Har~":3,"Hariyr":3,"Haruwr":1}},"lbb":{"n":16,"f":1,"d":{">aloba`b":16}},"$hr":{"n":21,"f":1,"d":{"$ahor":21}},"r$d":{"n":19,"f":7,"d":{"yaro$udu":1,"ru$od":6,"r~a$iyd":3,"ra$ad":5,"m~uro$id":1,"r~a$aAd":2,"r~a`$iduwn":1}},"xwn":{"n":16,"f":6,"d":{"yaxotaAnu":2,"xaA^}iniyn":3,"xaw~aAn":2,"xaA^}inap":2,"xaAnu":5,"xiyaAnap":2}},"rAs":{"n":18,"f":1,"d":{"ra>os":18}},"A*y":{"n":24,"f":2,"d":{">a*FY":9,">uw*iYa":15}},"srE":{"n":23,"f":4,"d":{"sariyE":10,"yusa`riEu":9,">asoraE":2,"siraAE":2}},"xSm":{"n":18,"f":5,"d":{"xaSiym":5,"{xotaSamu":8,"xaSom":3,"taxaASum":1,"xaSimuwn":1}},"mhd":{"n":16,"f":6,"d":{"miha`d":7,"mahod":5,"yamohadu":1,"ma`hiduwn":1,"mah~ad":1,"tamohiyd":1}},"kff":{"n":15,"f":3,"d":{"kaA^f~ap":5,"kaf~a":8,"kaf~ay":2}},"HbT":{"n":16,"f":2,"d":{"HabiTa":12,">aHobaTa":4}},"fkr":{"n":18,"f":2,"d":{"yatafak~aru":17,"fak~ara":1}},"nkH":{"n":23,"f":4,"d":{"nakaHa":14,"tunkiHu":3,"nikaAH":5,"yasotankiHa":1}},"Hlm":{"n":21,"f":2,"d":{"Haliym":15,"Hulum":6}},"rbS":{"n":17,"f":3,"d":{"tarab~uS":1,"tarab~aSo":13,"m~utarab~iS":3}},"Tlq":{"n":23,"f":4,"d":{"T~ala`q":2,"muTal~aqa`t":2,"Tal~aqa":10,"{nTalaqa":9}},"drj":{"n":20,"f":2,"d":{"darajap":18,"nasotadoriju":2}},"rkb":{"n":15,"f":7,"d":{"rukobaAn":1,"m~utaraAkib":1,"r~akob":1,"rakiba":9,"rakuwb":1,"rikaAb":1,"rak~aba":1}},"bqy":{"n":21,"f":8,"d":{"baqiy~at":3,"baqiYa":3,"baAq":1,"ba`qiya`t":2,">aboqaY`^":7,"baAqiyn":2,"baAqiyap":2,"tuboqiY":1}},"vbt":{"n":18,"f":6,"d":{"vab~ato":10,"tavobiyt":2,"yuvobitu":2,"{vobutu":1,"vaAbit":2,"vubuwt":1}},"byE":{"n":15,"f":4,"d":{"bayoE":7,"tabaAyaEo":1,"baAyaEo":6,"biyaE":1}},"gwy":{"n":22,"f":5,"d":{"gay~":4,">agowayo":8,"ga`wiyn":6,"gawaY`":3,"gawiY~":1}},"Swr":{"n":19,"f":5,"d":{"Suro":1,"Saw~ara":4,"S~uwr":10,"Suwrap":3,"muSaw~ir":1}},"trb":{"n":22,"f":4,"d":{"turaAb":17,">atoraAb":3,"t~araA^}ib":1,"matorabap":1}},"rbw":{"n":20,"f":8,"d":{"rabowap":2,"r~ibaw`A":7,">arobaY`":2,"r~aAbiy":1,"rab~aya":2,"rabato":4,"r~ib":1,"r~aAbiyap":1}},"nxl":{"n":20,"f":3,"d":{"n~axiyl":7,"naxol":11,"n~axolap":2}},"xbv":{"n":16,"f":4,"d":{"xabiyv":9,"xabuva":1,"xabiyvap":4,"xabiyva`t":2}},"nqm":{"n":17,"f":4,"d":{"{ntiqaAm":4,"naqamu":4,"{ntaqamo":6,"muntaqimuwn":3}},"ldn":{"n":18,"f":1,"d":{"l~adun":18}},"Awb":{"n":17,"f":4,"d":{"ma_#aAb":9,">aw~aAb":6,">aw~ibi":1,"<iyaAb":1}},"nzE":{"n":20,"f":5,"d":{"nazaEa":10,"tana`zaEu":7,"yuna`ziEu":1,"naz~aAEap":1,"n~a`ziEa`t":1}},"nfx":{"n":20,"f":2,"d":{"nafaxa":19,"nafoxap":1}},"frH":{"n":22,"f":2,"d":{"fariHa":16,"fariH":6}},"gdw":{"n":16,"f":5,"d":{"gada":3,"gadaw`p":2,"guduw~":5,"gad":5,"gadaA^'":1}},"snn":{"n":21,"f":3,"d":{"sun~ap":16,"s~in~":2,"m~asonuwn":3}},"srf":{"n":23,"f":3,"d":{"<isoraAf":2,"musorif":15,">asorafa":6}},"gll":{"n":16,"f":3,"d":{"gal~a":5,"magoluwlap":2,"gil~":9}},"TlE":{"n":19,"f":8,"d":{"yuToliEa":1,"T~alaEa":7,"TaloE":4,"TalaEat":2,"maToliE":1,"TuluwE":2,"m~uT~aliEuwn":1,"maTolaE":1}},"sEr":{"n":19,"f":3,"d":{"saEiyr":16,"suEur":2,"suE~irato":1}},"Etd":{"n":16,"f":2,"d":{">aEotadato":14,"Eatiyd":2}},"HSn":{"n":18,"f":6,"d":{"muHoSana`t":8,"m~uHoSiniyn":2,">aHoSanato":5,"taHaS~un":1,"HuSuwn":1,"m~uHaS~anap":1}},"fty":{"n":21,"f":7,"d":{"fataya`t":2,"yasotafotu":6,"yufotiy":5,"fataY`":3,"fatayaAn":1,"fitoyap":3,"fatFY":1}},"zEm":{"n":17,"f":3,"d":{"zaEama":13,"zaEom":2,"zaEiym":2}},"Hrj":{"n":15,"f":1,"d":{"Haraj":15}},"nfr":{"n":18,"f":5,"d":{"nafara":8,"nafiyr":1,"nufuwr":5,"nafar":3,"m~usotanfirap":1}},"fqh":{"n":20,"f":2,"d":{"yafoqahu":19,"yatafaq~ahu":1}},"wqE":{"n":24,"f":7,"d":{"waqaEa":12,"yuwqiEa":1,"waAqiE":6,"m~uwaAqiEuw":1,"waAqiEap":2,"waqoEat":1,"mawa`qiE":1}},"mTr":{"n":15,"f":3,"d":{"m~aTar":7,">umoTirato":7,"m~umoTir":1}},"$kk":{"n":15,"f":1,"d":{"$ak~":15}},"SnE":{"n":20,"f":5,"d":{"SanaEu":15,"SunoE":2,"{SoTanaEo":1,"SanoEap":1,"maSaAniE":1}},"Avr":{"n":21,"f":4,"d":{">avar":14,"A^vara":5,">ava`rap":1,"yu&ovaru":1}},"Hzb":{"n":20,"f":1,"d":{"Hizob":20}},"lEb":{"n":20,"f":3,"d":{"laEib":8,"yaloEabo":9,"la`Eibiyn":3}},"mkn":{"n":18,"f":3,"d":{"mak~a":13,">amokana":1,"m~akiyn":4}},"fTr":{"n":20,"f":6,"d":{"faATir":6,"faTara":10,"fiTorat":1,"fuTuwr":1,"munfaTir":1,"{nfaTarato":1}},"k$f":{"n":20,"f":5,"d":{"kaA$if":3,"ka$afa":14,"ka$of":1,"ka`$ifa`t":1,"kaA$ifap":1}},"sTr":{"n":16,"f":5,"d":{">asa`Tiyr":9,"masoTuwr":3,"muSayoTir":2,"m~usotaTar":1,"yasoTuru":1}},"lhw":{"n":16,"f":4,"d":{"lahow":10,">alohaY`":4,"laAhiyap":1,"talah~aY`":1}},"Hmm":{"n":21,"f":2,"d":{"Hamiym":20,"yaHomuwm":1}},"fAd":{"n":16,"f":1,"d":{"fu&aAd":16}},"kyl":{"n":16,"f":4,"d":{"kayol":10,"mikoyaAl":2,"{kotaAlu":2,"kaAlu":2}},"wzn":{"n":23,"f":4,"d":{"miyzaAn":16,"wazon":3,"m~awozuwn":1,"w~azanu":3}},"bdA":{"n":15,"f":2,"d":{"bada>a":12,"yubodi}u":3}},"swq":{"n":17,"f":5,"d":{"siyqa":7,"s~uwq":4,"saAq":4,"saA^}iq":1,"masaAq":1}},"mdn":{"n":17,"f":2,"d":{"madaA^}in":3,"madiynap":14}},"Erb":{"n":22,"f":3,"d":{">aEoraAb":10,"Earabiy~":11,"Eurub":1}},"nwb":{"n":18,"f":2,"d":{"m~uniyb":7,">anaAba":11}},"n$r":{"n":21,"f":10,"d":{"man$uwr":2,"nu$irato":3,">an$ara":3,"nu$uwr":5,"tanta$iru":3,"mun$ariyn":1,"m~unta$ir":1,"m~una$~arap":1,"n~a`$ira`t":1,"na$or":1}},"fkh":{"n":19,"f":5,"d":{"fawa`kih":3,"fa`kihiyn":3,"fa`kihap":11,"tafak~ahu":1,"fakihiyn":1}}};

	
	var MAP_RAW_JSON_TO_GRAPH = function(_ROOTS_){
		var graph = { "id": "root", "name": "root", data: {}, children: [] };
		var _MAP_ = graph, firstLetter, lettersMap = {}, lettersArray, lettersString, letterIndex;
		$.each(Object.keys(_ROOTS_), function(index, root){
			firstLetter = root.split('')[0];
			lettersMap[ firstLetter ] ? ++lettersMap[ firstLetter ] : (lettersMap[ firstLetter ] = 1);
		});
		lettersArray = Object.keys( lettersMap ); 
		lettersString = lettersArray.join('');
		$.each(lettersArray, function(indx, ltr){ if(!ltr || ltr.length != 1) debugger;
			if(!_MAP_.children[indx] ) //have to insert a child first
				_MAP_.children[indx] = { "id": indx, "name": ltr, data: {}, children: [] };
		});
		
		$.each(Object.keys(_ROOTS_), function(index, root){
			if(!root || root == 'name') debugger;
			//1) Lets first branch out by first letter...
			firstLetter = root.split('')[0];
			letterIndex = lettersString.indexOf(firstLetter);
			if(letterIndex <0) debugger; //shuldnt happen
			if(!_MAP_.children[letterIndex] ) debugger; //have to insert a child first. shouldnt happen
			
			//2) Now add branch for the root
			var rootIndex = -1;
			rootIndex = -1 + _MAP_.children[letterIndex].children.push( { "id": root, "name": root, data: {"n": _ROOTS_[root].n, "f": _ROOTS_[root].f}, children: [] } );
			
			//3) Now add children of the root
			var rootChildren = _ROOTS_[ root ].d;
			if(rootChildren)
				$.each( Object.keys(rootChildren), function(childno, child){
					_MAP_.children[letterIndex].children[ rootIndex ].children.push( { "id": child, "name": child, data: {"n": rootChildren[child]}, children: [] } );
				});
		});
		return _MAP_;
	}

    //init Spacetree
    //Create a new ST instance
    var st = new $jit.ST({
        //id of viz container element
        injectInto: 'infovis',
        //set duration for the animation
        duration: 300, //800
        //set animation transition type
        transition: $jit.Trans.Quart.easeInOut,
        //set distance between node and its children
        levelDistance: 50,
        //enable panning
        Navigation: { //r-right direction
          enable:true,
          panning:true
        },
        //set node and edge styles
        //set overridable=true for styling individual
        //nodes or edges
        Node: {
            height: 50, //20,
            width: 80, //60,
            type: 'rectangle',
            color: '#aaa',
            overridable: true
        },
        
        Edge: {
            type: 'bezier',
            overridable: true
        },
        
        onBeforeCompute: function(node){
            Log.write("loading " + node.name);
        },
        
        onAfterCompute: function(){
            Log.write("done");
        },
        
        //This method is called on DOM label creation.
        //Use this method to add event handlers and styles to
        //your node.
        onCreateLabel: function(label, node){
            label.id = node.id;            
            label.innerHTML = '<span dir=rtl>' + EnToAr( node.name ) + '</span>';//node.name; يُخَالِفُ
			var url, ROOTURL = 'http://corpus.quran.com/qurandictionary.jsp?q=', 
					 LEMURL = 'http://corpus.quran.com/search.jsp?q=lem:';
			var data = node.data, datastr = JSON.stringify( data ), linklabel;
			linklabel = (data && data.n) ? (data.n + 'x') : 'link';
			if(node.name && node.name.length == 3){
				url = ROOTURL + (node.name);
				//label.innerHTML = '<span dir=rtl>' + EnToAr( node.name ).split('').join(' ') + '</span>';
				//window.open (url,"mywindow","menubar=1,resizable=1,width=750,height=450");
			}
			else if(node.name && node.name.length > 3){
				url = LEMURL + (node.name);
				//window.open (url,"mywindow","menubar=1,resizable=1,width=750,height=450");
			}
			if(url){
				label.innerHTML = "&nbsp;" + label.innerHTML + "&nbsp;<span dir=ltr style=font-size:0.5em;><A HREF='" + url + "' TARGET=_>(" + linklabel + ")" + "</A></span><!-" + datastr + "-->";
			}
            label.onclick = function(){
            	if(normal.checked) {
            	  st.onClick(node.id);
				  console.log(node.name); console.log(node);
            	} else {
                st.setRoot(node.id, 'animate');
            	}
            };
            //set label styles
            var style = label.style;
            style.width = 60 + 'px';
            style.height = 48 + 'px'; //17 + 'px';            
            style.cursor = 'pointer';
            style.color = '#333';
            style.fontSize = '2em'; //'0.8em';
            style.textAlign= 'center';
            style.paddingTop = '3px';
        },
        
        //This method is called right before plotting
        //a node. It's useful for changing an individual node
        //style properties before plotting it.
        //The data properties prefixed with a dollar
        //sign will override the global node style properties.
        onBeforePlotNode: function(node){
            //add some color to the nodes in the path between the
            //root node and the selected node.
            if (node.selected) {
                node.data.$color = "#ff7";
            }
            else {
                delete node.data.$color;
                //if the node belongs to the last plotted level
                if(!node.anySubnode("exist")) {
                    //count children number
                    var count = 0;
                    node.eachSubnode(function(n) { count++; });
                    //assign a node color based on
                    //how many children it has
                    node.data.$color = ['#aaa', '#baa', '#caa', '#daa', '#eaa', '#faa'][count];                    
                }
            }
        },
        
        //This method is called right before plotting
        //an edge. It's useful for changing an individual edge
        //style properties before plotting it.
        //Edge data proprties prefixed with a dollar sign will
        //override the Edge global style properties.
        onBeforePlotLine: function(adj){
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = "#eed";
                adj.data.$lineWidth = 3;
            }
            else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });
	//Translate the json to a format graph understands
	json = MAP_RAW_JSON_TO_GRAPH( json );
	
    //load json data
	json.name = "AlfAZ"; //Alfaaz letters
    st.loadJSON(json);
    //compute node positions and layout
    st.compute();
    //optional: make a translation of the tree
    st.geom.translate(new $jit.Complex(-200, 0), "current");
    //emulate a click on the root node.
    st.onClick(st.root);
    //end
    //Add event handlers to switch spacetree orientation.
    var top = $jit.id('r-top'), 
        left = $jit.id('r-left'), 
        bottom = $jit.id('r-bottom'), 
        right = $jit.id('r-right'),
        normal = $jit.id('s-normal');
        
    
    function changeHandler() {
        if(this.checked) {
            top.disabled = bottom.disabled = right.disabled = left.disabled = true;
            st.switchPosition(this.value, "animate", {
                onComplete: function(){
                    top.disabled = bottom.disabled = right.disabled = left.disabled = false;
                }
            });
        }
    };
    
    top.onchange = left.onchange = bottom.onchange = right.onchange = changeHandler;
    //end
}